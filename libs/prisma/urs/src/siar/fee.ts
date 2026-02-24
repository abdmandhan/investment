
// import management fee rate from siar

import siar from "@investment/siar"
import { prisma } from "../index.js"

export const importManagementFee = async () => {
  console.log('\n=== Importing Management Fee Rates ===\n')

  // Get management fee data from SIAR
  console.log('Fetching management fee data from SIAR...')
  const result = await siar.$queryRaw<Array<{
    ProductCode: string
    ProductName: string | null
    FeeTypeCode: string
    FeeEffectiveDate: Date
    FeeName: string | null
    FeeDays: number | null
    SharingFeeType: string | null
    FeePos: number | null
    FeeRangeBottom: number | null
    FeeRange: number | null
    FeeAmount: number | null
    FeeAmountCode: string | null
    FeeSign: string | null
  }>>`
    DECLARE @today date = CAST(GETDATE() AS date);
    DECLARE @feeType varchar(10) = 'MGT';

    WITH fee_link AS (
      SELECT
          fbd.IDProduct,
          fbd.Type,
          fbd.FeeID,
          fbd.EffectiveDate,
          ROW_NUMBER() OVER (
              PARTITION BY fbd.IDProduct, fbd.Type
              ORDER BY fbd.EffectiveDate DESC
          ) AS rn
      FROM TProductFeeByDate fbd
      WHERE fbd.IsActive = 1
        AND fbd.sysRecStatus = 1
        AND fbd.EffectiveDate <= @today
        AND (@feeType IS NULL OR fbd.Type = @feeType)
    )
    SELECT
        p.ProductCode,
        p.ProductName,
        fl.Type           AS FeeTypeCode,
        fl.EffectiveDate  AS FeeEffectiveDate,
        sf.FeeName,
        sf.FeeDays,
        sf.FeeType        AS SharingFeeType,
        sfr.FeePos,
        sfr.FeeRangeBottom,
        sfr.FeeRange,
        sfr.FeeAmount,
        sfr.FeeAmountCode,
        sfr.FeeSign
    FROM fee_link fl
    JOIN TProduct p       ON p.IDProduct = fl.IDProduct
    JOIN TSharingFee sf   ON sf.FeeID = fl.FeeID
    LEFT JOIN TSharingFeeRule sfr
          ON sfr.FeeID = sf.FeeID
    WHERE fl.rn = 1
    ORDER BY p.ProductCode, fl.Type, sfr.FeePos;
  `

  console.log(`Found ${result.length} management fee records from SIAR`)

  // Get all funds to map ProductCode to fund_id
  console.log('Fetching funds for mapping...')
  const funds = await prisma.funds.findMany({
    where: {
      external_code: { startsWith: 'SIAR-' }
    },
    select: {
      id: true,
      code: true,
      external_code: true,
      management_fee_rate: true,
      valuation_basis: true
    }
  })

  // Create maps for lookup
  const fundByCodeMap = new Map(funds.map(f => [f.code, f]))
  const fundByExternalCodeMap = new Map(
    funds
      .filter(f => f.external_code && f.external_code.startsWith('SIAR-'))
      .map(f => {
        const siarId = f.external_code!.replace('SIAR-', '')
        return [siarId, f]
      })
  )

  console.log(`Found ${funds.length} funds for mapping`)

  // Group by ProductCode to get the primary fee (usually FeePos = 1 or first one)
  const feeByProduct = new Map<string, typeof result[0]>()

  for (const fee of result) {
    const key = fee.ProductCode
    if (!feeByProduct.has(key)) {
      feeByProduct.set(key, fee)
    } else {
      // If multiple fees, prefer the one with FeePos = 1 or lowest FeePos
      const existing = feeByProduct.get(key)!
      if (fee.FeePos !== null && (existing.FeePos === null || fee.FeePos < existing.FeePos)) {
        feeByProduct.set(key, fee)
      }
    }
  }

  console.log(`\nProcessing ${feeByProduct.size} unique products...`)

  // Batch lookup products that don't have direct code match
  const productCodesToLookup = Array.from(feeByProduct.keys()).filter(
    code => !fundByCodeMap.has(code)
  )

  const products = productCodesToLookup.length > 0
    ? await siar.tProduct.findMany({
      where: { ProductCode: { in: productCodesToLookup } },
      select: { IDProduct: true, ProductCode: true }
    })
    : []

  const productCodeToIdMap = new Map(
    products.map(p => [p.ProductCode, String(p.IDProduct)])
  )

  // Update funds with management fee data
  let totalUpdated = 0
  let totalSkipped = 0

  for (const [productCode, fee] of feeByProduct.entries()) {
    // Try to find fund by code first, then by external_code
    let fund = fundByCodeMap.get(productCode)

    if (!fund) {
      // Try to find by external_code (SIAR-IDProduct)
      const idProduct = productCodeToIdMap.get(productCode)
      if (idProduct) {
        fund = fundByExternalCodeMap.get(idProduct)
      }
    }

    if (!fund) {
      console.log(`  ⚠️  Skipping ${productCode} (${fee.ProductName || 'N/A'}): Fund not found`)
      totalSkipped++
      continue
    }

    // Calculate management_fee_rate from FeeAmount
    // FeeAmount is typically a percentage, we need to convert it properly
    let management_fee_rate = fee.FeeAmount ?? 0

    // If FeeAmountCode indicates it's not a percentage, we might need to adjust
    // For now, assuming FeeAmount is already a percentage
    if (fee.FeeAmountCode && fee.FeeAmountCode !== 'PC') {
      // Handle different fee amount codes if needed
      console.log(`  ⚠️  FeeAmountCode for ${productCode}: ${fee.FeeAmountCode}`)
    }

    // Get valuation_basis from FeeDays (typically 360, 365, or 366)
    const valuation_basis = fee.FeeDays ?? 365

    // Update fund
    try {
      await prisma.funds.update({
        where: { id: fund.id },
        data: {
          management_fee_rate: management_fee_rate,
          valuation_basis: valuation_basis
        }
      })

      console.log(`  ✅ Updated fund ${fund.code} (${fee.ProductName || 'N/A'}): fee_rate=${management_fee_rate}%, valuation_basis=${valuation_basis}`)
      totalUpdated++
    } catch (error) {
      console.error(`  ❌ Failed to update fund ${fund.code}:`, error instanceof Error ? error.message : String(error))
      totalSkipped++
    }
  }

  console.log(`\n✅ Completed importing management fee rates`)
  console.log(`   Updated: ${totalUpdated} funds`)
  console.log(`   Skipped: ${totalSkipped} funds`)
  console.log('')
}
