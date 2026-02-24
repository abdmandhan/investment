
import siar from "@investment/siar"
import { TransactionType, prisma } from "../index.js"

export const importTransaction = async () => {
  // import transactions
  // 279267 transaction count
  // Process investors by transaction count (highest first)
  console.log('\n=== Starting transaction import by investor transaction count ===\n')

  // Get investors ordered by transaction count from SIAR
  const investorsWithCount = await siar.$queryRaw<Array<{
    c: bigint
    IDCustomer: bigint
    FirstName: string | null
  }>>`
    select count(t.IDTransaction) as c, t.IDCustomer, cus.FirstName
    from TTransaction t
    inner join TCustomer cus on cus.IDCustomer = t.IDCustomer
    where t.IDStatus = 'APPROVED' and t.IDCategory != 'CASHD'
    group by t.IDCustomer, cus.FirstName
    order by c desc;
  `

  console.log(`Found ${investorsWithCount.length} investors with transactions to import\n`)

  const pageSize = 1000
  const parallelLimit = 10
  let totalProcessed = 0
  let investorsProcessed = 0

  // Process investors in parallel batches of 10
  for (let i = 0; i < investorsWithCount.length; i += parallelLimit) {
    const batch = investorsWithCount.slice(i, i + parallelLimit)

    // Process this batch of investors in parallel
    const results = await Promise.all(
      batch.map(investorData => processInvestorTransactions(investorData, pageSize))
    )

    // Aggregate results
    for (const result of results) {
      if (result.success) {
        investorsProcessed++
        totalProcessed += result.transactionCount
        console.log(`  ✅ Imported ${result.transactionCount} transactions for investor ${result.idCustomer}`)
      } else {
        console.log(`  ⚠️  Failed to process investor ${result.idCustomer}: ${result.error}`)
      }
    }

    console.log(`\n📊 Progress: ${Math.min(i + parallelLimit, investorsWithCount.length)}/${investorsWithCount.length} investors, ${totalProcessed} total transactions`)
  }

  console.log(`\n✅ Completed importing transactions for ${investorsProcessed} investors`)
  console.log(`📊 Total transactions imported: ${totalProcessed}\n`)

  // Second pass: Update source_transaction_id for SWITCHING_IN transactions
  console.log('=== Second pass: Updating source_transaction_id for SWITCHING_IN transactions ===\n')
  await updateSourceTransactionIds()

  // Verify transaction counts
  console.log('=== Verifying transaction counts ===\n')
  await verifyTransactionCounts()
}


// Process transactions for a single investor (called in parallel)
async function processInvestorTransactions(
  investorData: { IDCustomer: bigint, FirstName: string | null, c: bigint },
  pageSize: number
): Promise<{ success: boolean, idCustomer: string, transactionCount: number, error?: string }> {
  const idCustomer = investorData.IDCustomer
  const externalCode = `SIAR-${idCustomer}`
  const transactionCount = Number(investorData.c)

  try {
    // Get investor in our database
    const investor = await prisma.investors.findFirst({
      where: { external_code: externalCode }
    })

    if (!investor) {
      return {
        success: false,
        idCustomer: String(idCustomer),
        transactionCount: 0,
        error: `Investor not found in database (${investorData.FirstName || 'N/A'})`
      }
    }

    console.log(`  Processing investor: ${idCustomer} (${investorData.FirstName || 'N/A'}) - ${transactionCount} transactions`)

    // Fetch all transactions for this investor in batches
    let lastTransactionId: bigint | undefined = undefined
    let investorTransactionCount = 0

    while (true) {
      // Get transactions for this investor
      const transactions: any[] = await siar.tTransaction.findMany({
        where: {
          IDStatus: 'APPROVED',
          IDCategory: { not: 'CASHD' },
          IDCustomer: idCustomer,
          ...(lastTransactionId !== undefined ? { IDTransaction: { gt: lastTransactionId } } : {})
        },
        include: { TSubAccount: true },
        orderBy: { IDTransaction: 'asc' },
        take: pageSize
      })

      if (transactions.length === 0) break

      // Collect unique IDs for batch lookups
      const productIds = new Set<string>()
      const sourceTransactionIds = new Set<string>()

      for (const transaction of transactions) {
        if (transaction.IDProduct) {
          productIds.add(`SIAR-${transaction.IDProduct}`)
        }
        if (transaction.SourceIDTransaction) {
          sourceTransactionIds.add(`SIAR-${transaction.SourceIDTransaction}`)
        }
      }

      // Batch lookup funds and source transactions
      const [funds, sourceTransactions] = await Promise.all([
        prisma.funds.findMany({
          where: { external_code: { in: Array.from(productIds) } }
        }),
        sourceTransactionIds.size > 0
          ? prisma.transactions.findMany({
            where: { external_code: { in: Array.from(sourceTransactionIds) } }
          })
          : Promise.resolve([])
      ])

      // Create lookup maps
      const fundMap = new Map(funds.map(f => [f.external_code, f]))
      const sourceTxMap = new Map(sourceTransactions.map(t => [t.external_code, t]))

      // Process transactions and build data array
      const transactionData: any[] = []
      const accountsToCreate: any[] = []
      const accountKeySet = new Set<string>()

      for (const transaction of transactions) {
        if (!transaction.TSubAccount) continue

        const fundExternalCode = `SIAR-${transaction.IDProduct}`
        const fund = fundMap.get(fundExternalCode)

        if (!fund) {
          console.log(`    ⚠️  Skipping transaction ${transaction.IDTransaction}: fund not found (${fundExternalCode})`)
          continue
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
            continue
        }

        // Validate required fields
        if (
          transaction.TransactionDate == null ||
          transaction.NAVDate == null ||
          transaction.NAVValue == null ||
          transaction.Units == null ||
          transaction.SettDate == null
        ) {
          console.log(`    ⚠️  Skipping transaction ${transaction.IDTransaction}: missing required fields`)
          continue
        }

        // Handle source transaction
        // Note: We'll set source_transaction_id to null if not found in first pass
        // Then update it in a second pass after all transactions are imported
        let source_transaction_id: number | undefined = undefined
        if (transaction.SourceIDTransaction) {
          const sourceTxExternalCode = `SIAR-${transaction.SourceIDTransaction}`
          const source_tx = sourceTxMap.get(sourceTxExternalCode)
          if (source_tx) {
            source_transaction_id = source_tx.id
          }
          // If not found, leave it as null - will be updated in second pass
        }

        // Collect account information for batch creation/lookup
        const accountKey = `${investor.id}-${fund.id}`
        if (!accountKeySet.has(accountKey)) {
          accountsToCreate.push({
            investor_id: investor.id,
            fund_id: fund.id,
            account_number: transaction.TSubAccount.NoAccount
          })
          accountKeySet.add(accountKey)
        }

        // Build transaction data
        transactionData.push({
          external_code: `SIAR-${transaction.IDTransaction}`,
          transaction_type,
          investor_id: investor.id,
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
        })
      }

      // Handle investor accounts - check existing first, then create missing ones
      if (accountsToCreate.length > 0) {
        // Batch lookup existing accounts
        const existingAccounts = await prisma.investor_accounts.findMany({
          where: {
            OR: accountsToCreate.map(acc => ({
              investor_id: acc.investor_id,
              fund_id: acc.fund_id
            }))
          }
        })

        const existingAccountKeys = new Set(
          existingAccounts.map(acc => `${acc.investor_id}-${acc.fund_id}`)
        )

        // Filter out accounts that already exist
        const newAccounts = accountsToCreate.filter(
          acc => !existingAccountKeys.has(`${acc.investor_id}-${acc.fund_id}`)
        )

        // Create only new accounts
        if (newAccounts.length > 0) {
          await prisma.investor_accounts.createMany({
            data: newAccounts,
            skipDuplicates: true
          })
        }

        // Fetch all accounts (existing + newly created) to get IDs
        const allAccounts = await prisma.investor_accounts.findMany({
          where: {
            OR: accountsToCreate.map(acc => ({
              investor_id: acc.investor_id,
              fund_id: acc.fund_id
            }))
          }
        })

        const accountMap = new Map(
          allAccounts.map(acc => [`${acc.investor_id}-${acc.fund_id}`, acc.id])
        )

        // Update transaction data with investor_account_id
        for (const txData of transactionData) {
          const accountKey = `${txData.investor_id}-${txData.fund_id}`
          const accountId = accountMap.get(accountKey)
          if (accountId) {
            txData.investor_account_id = accountId
          }
        }
      }

      // Create transactions in batch
      if (transactionData.length > 0) {
        await prisma.transactions.createMany({
          data: transactionData,
          skipDuplicates: true
        })
        investorTransactionCount += transactionData.length
      }

      // Update cursor for next batch
      lastTransactionId = transactions[transactions.length - 1].IDTransaction
    }

    return {
      success: true,
      idCustomer: String(idCustomer),
      transactionCount: investorTransactionCount
    }
  } catch (error) {
    return {
      success: false,
      idCustomer: String(idCustomer),
      transactionCount: 0,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Second pass: Update source_transaction_id for SWITCHING_IN transactions
async function updateSourceTransactionIds() {
  const pageSize = 1000
  let totalUpdated = 0
  let offset = 0

  // Get all SWITCHING_IN transactions that need source_transaction_id updated
  // Process in batches to avoid memory issues
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

    // Get external codes for transactions that need updating
    const transactionExternalCodes = switchingInTransactions.map(tx => `SIAR-${tx.IDTransaction}`)
    const sourceExternalCodes = switchingInTransactions
      .map(tx => tx.SourceIDTransaction ? `SIAR-${tx.SourceIDTransaction}` : null)
      .filter((code): code is string => code !== null)

    // Fetch transactions from our database
    const [ourTransactions, sourceTransactions] = await Promise.all([
      prisma.transactions.findMany({
        where: {
          external_code: { in: transactionExternalCodes },
          source_transaction_id: null // Only update those without source_transaction_id
        }
      }),
      sourceExternalCodes.length > 0
        ? prisma.transactions.findMany({
          where: { external_code: { in: sourceExternalCodes } }
        })
        : Promise.resolve([])
    ])

    // Create lookup maps
    const ourTxMap = new Map(ourTransactions.map(tx => [tx.external_code, tx]))
    const sourceTxMap = new Map(sourceTransactions.map(tx => [tx.external_code, tx.id]))

    // Build update operations
    const updates: Array<{ id: number, source_transaction_id: number }> = []

    for (const siarTx of switchingInTransactions) {
      const externalCode = `SIAR-${siarTx.IDTransaction}`
      const ourTx = ourTxMap.get(externalCode)

      if (!ourTx || ourTx.source_transaction_id !== null) {
        continue // Already has source_transaction_id or not found
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

    // Batch update transactions
    for (const update of updates) {
      await prisma.transactions.update({
        where: { id: update.id },
        data: { source_transaction_id: update.source_transaction_id }
      })
    }

    totalUpdated += updates.length
    if (updates.length > 0) {
      console.log(`Updated ${updates.length} transactions with source_transaction_id (total: ${totalUpdated})`)
    }

    offset += pageSize
  }

  console.log(`\n✅ Completed updating source_transaction_id for ${totalUpdated} SWITCHING_IN transactions\n`)
}

// Verification function to compare transaction counts
async function verifyTransactionCounts() {
  // Use existing imports from the file scope

  const siarTransactions = await siar.$queryRaw<Array<{
    c: bigint
    IDCustomer: bigint
    FirstName: string | null
  }>>`
    select count(t.IDTransaction) as c, t.IDCustomer, cus.FirstName
    from TTransaction t
    inner join TCustomer cus on cus.IDCustomer = t.IDCustomer
    where t.IDStatus = 'APPROVED' and t.IDCategory != 'CASHD'
    group by t.IDCustomer, cus.FirstName
    order by c desc;
  `

  const ursTransactions = await prisma.$queryRaw<Array<{
    c: bigint
    investor_id: string
    first_name: string | null
    external_code: string | null
  }>>`
    select count(t.id) as c, investor_id, i.first_name, i.external_code
    from transactions t
    inner join investors i on i.id = t.investor_id
    group by investor_id, i.first_name, i.external_code
    order by c desc;
  `

  // Create maps for comparison
  const siarMap = new Map<string, { count: number, firstName: string | null }>()
  for (const row of siarTransactions) {
    const key = String(row.IDCustomer)
    siarMap.set(key, {
      count: Number(row.c),
      firstName: row.FirstName
    })
  }

  const ursMap = new Map<string, { count: number, firstName: string | null, investorId: string, externalCode: string | null }>()
  for (const row of ursTransactions) {
    if (row.external_code && row.external_code.startsWith('SIAR-')) {
      const siarId = row.external_code.replace('SIAR-', '')
      ursMap.set(siarId, {
        count: Number(row.c),
        firstName: row.first_name,
        investorId: row.investor_id,
        externalCode: row.external_code
      })
    }
  }

  // Find differences
  const onlyInSIAR: Array<{ idCustomer: string, firstName: string | null, count: number }> = []
  const onlyInURS: Array<{ investorId: string, firstName: string | null, externalCode: string | null, count: number }> = []
  const countMismatches: Array<{
    idCustomer: string
    firstName: string | null
    siarCount: number
    ursCount: number
    difference: number
  }> = []
  const matched: Array<{ idCustomer: string, firstName: string | null, count: number }> = []

  // Check SIAR -> URS
  for (const [idCustomer, siarData] of siarMap.entries()) {
    const ursData = ursMap.get(idCustomer)
    if (!ursData) {
      onlyInSIAR.push({
        idCustomer,
        firstName: siarData.firstName,
        count: siarData.count
      })
    } else if (siarData.count !== ursData.count) {
      countMismatches.push({
        idCustomer,
        firstName: siarData.firstName,
        siarCount: siarData.count,
        ursCount: ursData.count,
        difference: siarData.count - ursData.count
      })
    } else {
      matched.push({
        idCustomer,
        firstName: siarData.firstName,
        count: siarData.count
      })
    }
  }

  // Check URS -> SIAR
  for (const [idCustomer, ursData] of ursMap.entries()) {
    if (!siarMap.has(idCustomer)) {
      onlyInURS.push({
        investorId: ursData.investorId,
        firstName: ursData.firstName,
        externalCode: ursData.externalCode,
        count: ursData.count
      })
    }
  }

  // Print results
  console.log('📊 Verification Results:\n')

  if (matched.length > 0) {
    console.log(`✅ Matched with same count: ${matched.length}`)
  }

  if (onlyInSIAR.length > 0) {
    console.log(`\n❌ Customers only in SIAR (${onlyInSIAR.length}):`)
    console.log('   Top 10 by transaction count:')
    onlyInSIAR
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`   ${idx + 1}. IDCustomer: ${item.idCustomer}, Name: ${item.firstName || 'N/A'}, Count: ${item.count}`)
      })
    if (onlyInSIAR.length > 10) {
      console.log(`   ... and ${onlyInSIAR.length - 10} more`)
    }
  }

  if (onlyInURS.length > 0) {
    console.log(`\n⚠️  Investors only in URS (${onlyInURS.length}):`)
    console.log('   Top 10 by transaction count:')
    onlyInURS
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`   ${idx + 1}. External Code: ${item.externalCode}, Name: ${item.firstName || 'N/A'}, Count: ${item.count}`)
      })
    if (onlyInURS.length > 10) {
      console.log(`   ... and ${onlyInURS.length - 10} more`)
    }
  }

  if (countMismatches.length > 0) {
    console.log(`\n⚠️  Count mismatches (${countMismatches.length}):`)
    console.log('   Top 20 by difference:')
    countMismatches
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
      .slice(0, 20)
      .forEach((item, idx) => {
        const sign = item.difference > 0 ? '+' : ''
        console.log(`   ${idx + 1}. IDCustomer: ${item.idCustomer}, Name: ${item.firstName || 'N/A'}`)
        console.log(`      SIAR: ${item.siarCount}, URS: ${item.ursCount}, Difference: ${sign}${item.difference}`)
      })
    if (countMismatches.length > 20) {
      console.log(`   ... and ${countMismatches.length - 20} more`)
    }
  }

  // Summary
  const totalSIARTransactions = siarTransactions.reduce((sum, row) => sum + Number(row.c), 0)
  const totalURSTransactions = ursTransactions.reduce((sum, row) => sum + Number(row.c), 0)
  const totalDifference = totalSIARTransactions - totalURSTransactions

  console.log('\n📈 Summary:')
  console.log(`   ✅ Matched with same count: ${matched.length}`)
  console.log(`   ❌ Only in SIAR: ${onlyInSIAR.length}`)
  console.log(`   ⚠️  Only in URS: ${onlyInURS.length}`)
  console.log(`   ⚠️  Count mismatches: ${countMismatches.length}`)
  console.log(`   📊 Total SIAR customers: ${siarTransactions.length}`)
  console.log(`   📊 Total URS investors: ${ursTransactions.length}`)
  console.log(`   📊 Total SIAR transactions: ${totalSIARTransactions}`)
  console.log(`   📊 Total URS transactions: ${totalURSTransactions}`)
  console.log(`   📊 Transaction difference: ${totalDifference > 0 ? '+' : ''}${totalDifference}`)

  if (onlyInSIAR.length === 0 && onlyInURS.length === 0 && countMismatches.length === 0) {
    console.log('\n✅ SUCCESS: All transactions imported correctly!')
  } else {
    console.log('\n⚠️  WARNING: Some transactions are missing or mismatched. Please review the details above.')
  }
  console.log('')
}
