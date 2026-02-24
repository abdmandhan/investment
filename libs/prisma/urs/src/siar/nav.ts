import siar from "@investment/siar"
import { prisma } from "../index.js"

export const migrateNav = async () => {
  console.log('\n=== Finding Missing NAV Records ===\n')

  // Get all NAV records from SIAR
  console.log('Fetching all NAV records from SIAR...')
  const siarNavs = await siar.$queryRaw<Array<{
    IDNav: bigint
    IDProduct: bigint
    NAVDate: Date
    Value: number | null
    TotalNetAsset: number | null
    OutstandingUnit: number | null
  }>>`
    select
      n.IDNav,
      n.IDProduct,
      n.NAVDate,
      n.Value,
      n.TotalNetAsset,
      n.OutstandingUnit
    from TNAV n
    where n.sysRecStatus = 1
      and n.NAVDate is not null
      and n.IDProduct is not null
    order by n.IDProduct, n.NAVDate asc;
  `

  console.log(`Found ${siarNavs.length} NAV records in SIAR`)

  // Get all NAV records from URS
  console.log('Fetching all NAV records from URS...')
  const ursNavs = await prisma.fund_navs.findMany({
    select: {
      fund_id: true,
      date: true
    }
  })

  // Create a map of URS NAVs by fund_id and date
  const ursNavMap = new Set(
    ursNavs.map(nav => `${nav.fund_id}-${nav.date.toISOString().split('T')[0]}`)
  )
  console.log(`Found ${ursNavs.length} NAV records in URS`)

  // Get all funds to map IDProduct to fund_id
  console.log('\nFetching funds for mapping...')
  const funds = await prisma.funds.findMany({
    where: {
      external_code: { startsWith: 'SIAR-' }
    },
    select: {
      id: true,
      external_code: true
    }
  })

  const fundMap = new Map(
    funds
      .filter(f => f.external_code && f.external_code.startsWith('SIAR-'))
      .map(f => {
        const siarId = f.external_code!.replace('SIAR-', '')
        return [siarId, f.id]
      })
  )

  console.log(`Found ${funds.length} funds for mapping`)

  // Find missing NAV records
  console.log('\nComparing NAV records to find missing ones...')
  const missingNavs: Array<{
    IDNav: bigint
    IDProduct: bigint
    NAVDate: Date
    Value: number | null
    TotalNetAsset: number | null
    OutstandingUnit: number | null
    fund_id: number
  }> = []

  for (const siarNav of siarNavs) {
    const fundId = fundMap.get(String(siarNav.IDProduct))
    if (!fundId) {
      console.log(`  ⚠️  Skipping NAV ${siarNav.IDNav}: Fund not found for IDProduct ${siarNav.IDProduct}`)
      continue
    }

    const navDate = siarNav.NAVDate instanceof Date
      ? siarNav.NAVDate
      : new Date(siarNav.NAVDate)
    const dateKey = `${fundId}-${navDate.toISOString().split('T')[0]}`

    if (!ursNavMap.has(dateKey)) {
      missingNavs.push({
        ...siarNav,
        fund_id: fundId
      })
    }
  }

  console.log(`\n✅ Found ${missingNavs.length} missing NAV records\n`)

  if (missingNavs.length === 0) {
    console.log('No missing NAV records found! All NAV records are already imported.')
    return
  }

  // Import missing NAV records
  console.log('=== Starting Import of Missing NAV Records ===\n')

  const pageSize = 1000
  let totalProcessed = 0

  // Process missing NAVs in batches
  for (let i = 0; i < missingNavs.length; i += pageSize) {
    const batch = missingNavs.slice(i, i + pageSize)
    const batchNumber = Math.floor(i / pageSize) + 1
    const totalBatches = Math.ceil(missingNavs.length / pageSize)

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} NAV records)...`)

    // Prepare NAV data for batch insert
    const navData = batch.map(nav => {
      const navDate = nav.NAVDate instanceof Date
        ? nav.NAVDate
        : new Date(nav.NAVDate)

      return {
        fund_id: nav.fund_id,
        date: navDate,
        nav: nav.TotalNetAsset ?? 0,
        nav_per_unit: nav.Value ?? 0,
        outstanding_unit: nav.OutstandingUnit ?? 0,
      }
    })

    // Insert NAV records in batch
    try {
      await prisma.fund_navs.createMany({
        data: navData,
        skipDuplicates: true
      })

      totalProcessed += navData.length
      console.log(`  ✅ Imported ${navData.length} NAV records in this batch`)
    } catch (error) {
      console.error(`  ❌ Error importing batch ${batchNumber}:`, error)
      // Try inserting one by one to identify problematic records
      for (const nav of batch) {
        try {
          const navDate = nav.NAVDate instanceof Date
            ? nav.NAVDate
            : new Date(nav.NAVDate)

          await prisma.fund_navs.create({
            data: {
              fund_id: nav.fund_id,
              date: navDate,
              nav: nav.TotalNetAsset ?? 0,
              nav_per_unit: nav.Value ?? 0,
              outstanding_unit: nav.OutstandingUnit ?? 0,
            }
          })
          totalProcessed++
        } catch (err) {
          console.error(`    ⚠️  Failed to import NAV ${nav.IDNav}:`, err instanceof Error ? err.message : String(err))
        }
      }
    }

    console.log(`  📊 Progress: ${Math.min(i + batch.length, missingNavs.length)}/${missingNavs.length} NAV records processed`)
  }

  console.log(`\n✅ Completed importing ${totalProcessed} missing NAV records\n`)

  // Final verification
  console.log('=== Final Verification ===\n')
  await verifyNavRecords()
}

// Verify NAV records
async function verifyNavRecords() {
  // Get all NAV records from SIAR
  const siarNavs = await siar.$queryRaw<Array<{
    IDProduct: bigint
    NAVDate: Date
  }>>`
    select distinct
      n.IDProduct,
      n.NAVDate
    from TNAV n
    where n.sysRecStatus = 1
      and n.NAVDate is not null
      and n.IDProduct is not null
    order by n.IDProduct, n.NAVDate asc;
  `

  // Get all NAV records from URS
  const ursNavs = await prisma.fund_navs.findMany({
    select: {
      fund_id: true,
      date: true
    }
  })

  // Get funds mapping
  const funds = await prisma.funds.findMany({
    where: {
      external_code: { startsWith: 'SIAR-' }
    },
    select: {
      id: true,
      external_code: true
    }
  })

  const fundMap = new Map(
    funds
      .filter(f => f.external_code && f.external_code.startsWith('SIAR-'))
      .map(f => {
        const siarId = f.external_code!.replace('SIAR-', '')
        return [siarId, f.id]
      })
  )

  // Create URS NAV map
  const ursNavMap = new Set(
    ursNavs.map(nav => `${nav.fund_id}-${nav.date.toISOString().split('T')[0]}`)
  )

  // Find missing NAVs
  const missingNavs: Array<{ IDProduct: bigint, NAVDate: Date }> = []

  for (const siarNav of siarNavs) {
    const fundId = fundMap.get(String(siarNav.IDProduct))
    if (!fundId) continue // Skip if fund not found

    const navDate = siarNav.NAVDate instanceof Date
      ? siarNav.NAVDate
      : new Date(siarNav.NAVDate)
    const dateKey = `${fundId}-${navDate.toISOString().split('T')[0]}`

    if (!ursNavMap.has(dateKey)) {
      missingNavs.push(siarNav)
    }
  }

  if (missingNavs.length === 0) {
    console.log('✅ SUCCESS: All NAV records are now imported!')
    console.log(`   Total SIAR NAV records: ${siarNavs.length}`)
    console.log(`   Total URS NAV records: ${ursNavs.length}`)
  } else {
    console.log(`⚠️  WARNING: Still ${missingNavs.length} NAV records missing`)
    console.log(`   Total SIAR NAV records: ${siarNavs.length}`)
    console.log(`   Total URS NAV records: ${ursNavs.length}`)
    console.log(`   Missing NAVs (first 10):`)
    missingNavs.slice(0, 10).forEach((nav, idx) => {
      const navDate = nav.NAVDate instanceof Date
        ? nav.NAVDate
        : new Date(nav.NAVDate)
      console.log(`     ${idx + 1}. IDProduct: ${nav.IDProduct}, Date: ${navDate.toISOString().split('T')[0]}`)
    })
    if (missingNavs.length > 10) {
      console.log(`     ... and ${missingNavs.length - 10} more`)
    }
  }
  console.log('')
}
