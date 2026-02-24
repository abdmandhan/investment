import siar from "@investment/siar"
import { TransactionType, prisma } from "../index.js"

export const migrateMissingTransactions = async () => {
  console.log('\n=== Finding Missing Transactions ===\n')

  // Get all transaction IDs from SIAR
  console.log('Fetching all transaction IDs from SIAR...')
  const siarTransactionIds = await siar.$queryRaw<Array<{ IDTransaction: bigint }>>`
    select distinct t.IDTransaction
    from TTransaction t
    where t.IDStatus = 'APPROVED' and t.IDCategory != 'CASHD'
    order by t.IDTransaction asc;
  `

  console.log(`Found ${siarTransactionIds.length} transactions in SIAR`)

  // Get all transaction external codes from URS
  console.log('Fetching all transaction external codes from URS...')
  const ursTransactions = await prisma.transactions.findMany({
    where: {
      external_code: { startsWith: 'SIAR-' }
    },
    select: {
      external_code: true
    }
  })

  const ursExternalCodes = new Set(ursTransactions.map(tx => tx.external_code))
  console.log(`Found ${ursExternalCodes.size} transactions in URS`)

  // Find missing transaction IDs
  console.log('\nComparing transactions to find missing ones...')
  const missingTransactionIds: bigint[] = []

  for (const siarTx of siarTransactionIds) {
    const externalCode = `SIAR-${siarTx.IDTransaction}`
    if (!ursExternalCodes.has(externalCode)) {
      missingTransactionIds.push(siarTx.IDTransaction)
    }
  }

  console.log(`\n✅ Found ${missingTransactionIds.length} missing transactions\n`)

  if (missingTransactionIds.length === 0) {
    console.log('No missing transactions found! All transactions are already imported.')
    return
  }

  // Import missing transactions
  console.log('=== Starting Import of Missing Transactions ===\n')

  const pageSize = 1000
  const parallelLimit = 10
  let totalProcessed = 0

  // Process missing transactions in batches
  for (let i = 0; i < missingTransactionIds.length; i += pageSize) {
    const batch = missingTransactionIds.slice(i, i + pageSize)
    const batchNumber = Math.floor(i / pageSize) + 1
    const totalBatches = Math.ceil(missingTransactionIds.length / pageSize)

    console.log(`\nProcessing batch ${batchNumber}/${totalBatches} (${batch.length} transactions)...`)

    // Fetch missing transactions from SIAR
    const transactions = await siar.tTransaction.findMany({
      where: {
        IDTransaction: { in: batch },
        IDStatus: 'APPROVED',
        IDCategory: { not: 'CASHD' }
      },
      include: { TSubAccount: true },
      orderBy: { IDTransaction: 'asc' }
    })

    console.log(`  Found ${transactions.length} transactions to process`)

    // Process transactions in parallel batches of 10
    for (let j = 0; j < transactions.length; j += parallelLimit) {
      const transactionBatch = transactions.slice(j, j + parallelLimit)

      const results = await Promise.all(
        transactionBatch.map(tx => processMissingTransaction(tx))
      )

      // Count successful imports
      const successful = results.filter(r => r.success).length
      totalProcessed += successful

      if (successful > 0) {
        console.log(`  ✅ Imported ${successful}/${transactionBatch.length} transactions in this batch`)
      }
    }

    console.log(`  📊 Progress: ${Math.min(i + batch.length, missingTransactionIds.length)}/${missingTransactionIds.length} transactions processed`)
  }

  console.log(`\n✅ Completed importing ${totalProcessed} missing transactions\n`)

  // Update source_transaction_id for any newly imported SWITCHING_IN transactions
  console.log('=== Updating source_transaction_id for newly imported transactions ===\n')
  await updateSourceTransactionIdsForMissing()

  // Verify again
  console.log('=== Final Verification ===\n')
  await verifyMissingTransactions()
}

// Process a single missing transaction
async function processMissingTransaction(transaction: any): Promise<{ success: boolean, idTransaction: string, error?: string }> {
  const idTransaction = transaction.IDTransaction
  const externalCode = `SIAR-${idTransaction}`

  try {
    if (!transaction.TSubAccount) {
      return {
        success: false,
        idTransaction: String(idTransaction),
        error: 'Missing TSubAccount'
      }
    }

    const customerExternalCode = `SIAR-${transaction.TSubAccount.IDCustomer}`
    const fundExternalCode = `SIAR-${transaction.IDProduct}`

    // Get investor and fund
    const [investor, fund] = await Promise.all([
      prisma.investors.findFirst({
        where: { external_code: customerExternalCode }
      }),
      prisma.funds.findFirst({
        where: { external_code: fundExternalCode }
      })
    ])

    if (!investor) {
      return {
        success: false,
        idTransaction: String(idTransaction),
        error: `Investor not found: ${customerExternalCode}`
      }
    }

    if (!fund) {
      return {
        success: false,
        idTransaction: String(idTransaction),
        error: `Fund not found: ${fundExternalCode}`
      }
    }

    // Determine transaction type
    let transaction_type: TransactionType
    switch (transaction.IDCategory) {
      case 'SUB':
      case 'ADJUP':
        transaction_type = 'SUBSCRIPTION'
        break
      case 'RED':
      case 'ADJDN':
        transaction_type = 'REDEMPTION'
        break
      case 'SWTIN':
        transaction_type = 'SWITCHING_IN'
        break
      case 'SWTOT':
        transaction_type = 'SWITCHING_OUT'
        break
      default:
        return {
          success: false,
          idTransaction: String(idTransaction),
          error: `Unknown transaction type: ${transaction.IDCategory}`
        }
    }

    // Validate required fields
    if (
      transaction.TransactionDate == null ||
      transaction.NAVDate == null ||
      transaction.NAVValue == null ||
      transaction.Units == null ||
      transaction.SettDate == null
    ) {
      return {
        success: false,
        idTransaction: String(idTransaction),
        error: 'Missing required fields'
      }
    }

    // Handle source transaction
    let source_transaction_id: number | undefined = undefined
    if (transaction.SourceIDTransaction) {
      const sourceTxExternalCode = `SIAR-${transaction.SourceIDTransaction}`
      const source_tx = await prisma.transactions.findFirst({
        where: { external_code: sourceTxExternalCode }
      })
      if (source_tx) {
        source_transaction_id = source_tx.id
      }
    }

    // Get or create investor account
    let investor_account = await prisma.investor_accounts.findFirst({
      where: {
        investor_id: investor.id,
        fund_id: fund.id
      }
    })

    if (!investor_account) {
      investor_account = await prisma.investor_accounts.create({
        data: {
          investor_id: investor.id,
          fund_id: fund.id,
          account_number: transaction.TSubAccount.NoAccount
        }
      })
    }

    // Create transaction
    await prisma.transactions.create({
      data: {
        external_code: externalCode,
        transaction_type,
        investor_id: investor.id,
        investor_account_id: investor_account.id,
        fund_id: fund.id,
        agent_id: 1, //TODO: fix this
        reference_no: transaction.ReferenceNo?.trim() == '' ? null : transaction.ReferenceNo?.trim(),
        transaction_date: transaction.TransactionDate,
        nav_date: transaction.NAVDate,
        nav_per_unit: transaction.NAVValue,
        units: transaction.Units,
        settlement_date: transaction.SettDate,
        amount: transaction.Amount || 0,
        net_amount: transaction.NetAmount || 0,
        fee: transaction.Fee || 0,
        is_redeem_all: transaction.IsRedemAll,
        source_transaction_id,
        payment_method_id: transaction.PaymentMethod || 'TRS',
      }
    })

    return {
      success: true,
      idTransaction: String(idTransaction)
    }
  } catch (error) {
    return {
      success: false,
      idTransaction: String(idTransaction),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Update source_transaction_id for newly imported SWITCHING_IN transactions
async function updateSourceTransactionIdsForMissing() {
  const pageSize = 1000
  let totalUpdated = 0
  let offset = 0

  while (true) {
    const switchingInTransactions = await siar.tTransaction.findMany({
      where: {
        IDStatus: 'APPROVED',
        IDCategory: 'SWTIN',
        SourceIDTransaction: { not: null }
      },
      select: {
        IDTransaction: true,
        SourceIDTransaction: true
      },
      orderBy: { IDTransaction: 'asc' },
      skip: offset,
      take: pageSize
    })

    if (switchingInTransactions.length === 0) break

    const transactionExternalCodes = switchingInTransactions.map(tx => `SIAR-${tx.IDTransaction}`)
    const sourceExternalCodes = switchingInTransactions
      .map(tx => tx.SourceIDTransaction ? `SIAR-${tx.SourceIDTransaction}` : null)
      .filter((code): code is string => code !== null)

    const [ourTransactions, sourceTransactions] = await Promise.all([
      prisma.transactions.findMany({
        where: {
          external_code: { in: transactionExternalCodes },
          source_transaction_id: null
        }
      }),
      sourceExternalCodes.length > 0
        ? prisma.transactions.findMany({
          where: { external_code: { in: sourceExternalCodes } }
        })
        : Promise.resolve([])
    ])

    const ourTxMap = new Map(ourTransactions.map(tx => [tx.external_code, tx]))
    const sourceTxMap = new Map(sourceTransactions.map(tx => [tx.external_code, tx.id]))

    const updates: Array<{ id: number, source_transaction_id: number }> = []

    for (const siarTx of switchingInTransactions) {
      const externalCode = `SIAR-${siarTx.IDTransaction}`
      const ourTx = ourTxMap.get(externalCode)

      if (!ourTx || ourTx.source_transaction_id !== null) {
        continue
      }

      if (siarTx.SourceIDTransaction) {
        const sourceExternalCode = `SIAR-${siarTx.SourceIDTransaction}`
        const sourceTxId = sourceTxMap.get(sourceExternalCode)

        if (sourceTxId) {
          updates.push({
            id: ourTx.id,
            source_transaction_id: sourceTxId
          })
        }
      }
    }

    for (const update of updates) {
      await prisma.transactions.update({
        where: { id: update.id },
        data: { source_transaction_id: update.source_transaction_id }
      })
    }

    totalUpdated += updates.length
    offset += pageSize
  }

  if (totalUpdated > 0) {
    console.log(`✅ Updated source_transaction_id for ${totalUpdated} SWITCHING_IN transactions\n`)
  } else {
    console.log('No source_transaction_id updates needed\n')
  }
}

// Verify missing transactions
async function verifyMissingTransactions() {
  const siarTransactionIds = await siar.$queryRaw<Array<{ IDTransaction: bigint }>>`
    select distinct t.IDTransaction
    from TTransaction t
    where t.IDStatus = 'APPROVED' and t.IDCategory != 'CASHD'
    order by t.IDTransaction asc;
  `

  const ursTransactions = await prisma.transactions.findMany({
    where: {
      external_code: { startsWith: 'SIAR-' }
    },
    select: {
      external_code: true
    }
  })

  const ursExternalCodes = new Set(ursTransactions.map(tx => tx.external_code))
  const missingTransactionIds: bigint[] = []

  for (const siarTx of siarTransactionIds) {
    const externalCode = `SIAR-${siarTx.IDTransaction}`
    if (!ursExternalCodes.has(externalCode)) {
      missingTransactionIds.push(siarTx.IDTransaction)
    }
  }

  if (missingTransactionIds.length === 0) {
    console.log('✅ SUCCESS: All transactions are now imported!')
    console.log(`   Total SIAR transactions: ${siarTransactionIds.length}`)
    console.log(`   Total URS transactions: ${ursTransactions.length}`)
  } else {
    console.log(`⚠️  WARNING: Still ${missingTransactionIds.length} transactions missing`)
    console.log(`   Total SIAR transactions: ${siarTransactionIds.length}`)
    console.log(`   Total URS transactions: ${ursTransactions.length}`)
    console.log(`   Missing transaction IDs: ${missingTransactionIds.slice(0, 20).map(String).join(', ')}${missingTransactionIds.length > 20 ? '...' : ''}`)
  }
  console.log('')
}

