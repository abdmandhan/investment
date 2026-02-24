import siar from "@investment/siar"
import { prisma } from "../index.js"

export const importFromSiar = async () => {
  // Import all references from the mapping
  // const refGroupCount = await siar.tReferenceGroup.count();
  // const ursRefGroupCount = await prisma.reference_groups.count();
  // if (refGroupCount > ursRefGroupCount) {
  //   const refGroups = await siar.tReferenceGroup.findMany();
  //   for (let i = 0; i < refGroups.length; i++) {
  //     const refGroup = refGroups[i];
  //     console.log(`importing reference group: ${refGroup.GroupName.trim()}`)
  //     await prisma.reference_groups.upsert({
  //       where: { name: refGroup.GroupName },
  //       create: { name: refGroup.GroupName.trim() },
  //       update: { name: refGroup.GroupName.trim() },
  //     })
  //   }
  // }

  // import references
  const refCount = await siar.tReferenceDetail.count();
  const ursRefCount = await prisma.references.count();
  console.log('ref count', refCount, ursRefCount)
  if (refCount > ursRefCount) {
    const references = await siar.tReferenceDetail.findMany({ include: { TReferenceGroup: true } });
    for (let i = 0; i < references.length; i++) {
      const reference = references[i];
      console.log(`importing reference: ${reference.Display}`)
      // const refGroup = await prisma.reference_groups.findFirst({ where: { name: reference.TReferenceGroup.GroupName.trim() } })
      // if (!refGroup) {
      //   console.log('ref group not found', reference.TReferenceGroup.GroupName.trim())
      //   continue
      // }
      const refGroupName = reference.TReferenceGroup.GroupName.trim()
      await prisma.references.upsert({
        // where: { reference_group_id_code: { reference_group_id: refGroup.id, code: String(reference.MainValue).trim() } },
        where: { reference_name_code: { reference_name: refGroupName, code: String(reference.MainValue).trim() } },
        create: { reference_name: refGroupName, code: String(reference.MainValue).trim(), name: reference.Display },
        update: {
          code: String(reference.MainValue).trim(),
          name: reference.Display,
        },
      })
    }
  }

  // seed ref banks

  const bankCount = await siar.tRefBank.count();
  const ursBankCount = await prisma.banks.count();
  if (bankCount > ursBankCount) {
    const bankRef = await siar.tRefBank.findMany({ include: { TRefBankBranch: true } });
    for (let i = 0; i < bankRef.length; i++) {
      const bank = bankRef[i];
      const code = `SIAR-${bank.IDBank}`
      console.log(`importing bank: ${bank.BankName}`)
      const b = await prisma.banks.upsert({
        where: {
          code
        },
        create: {
          code,
          name: bank.BankName,
          bi_code: bank.BIMemberCode,
          is_active: true,
        },
        update: {
          bi_code: bank.BIMemberCode || null
        }
      })

      for (let j = 0; j < bank.TRefBankBranch.length; j++) {
        const bb = bank.TRefBankBranch[j];
        const bbCode = `SIAR-${bb.IDBankBranch}`
        console.log(`importing bank branch: ${bb.BranchName}`)
        await prisma.bank_branchs.upsert({
          where: { code: bbCode },
          create: {
            code: bbCode,
            name: bb.BranchName,
            bank_id: b.id,
          },
          update: {
            name: bb.BranchName
          }
        })
      }
    }
  }


  // agent levels
  const agentLevelCount = await siar.tAgentLevel.count();
  const ursAgentLevelCount = await prisma.agent_levels.count();
  if (agentLevelCount > ursAgentLevelCount) {
    const agentLevels = await siar.tAgentLevel.findMany();
    for (let i = 0; i < agentLevels.length; i++) {
      const agentLevel = agentLevels[i];
      const name = agentLevel.AgentLevelName.toUpperCase()
      console.log(`importing agent level: ${name}`)
      await prisma.agent_levels.upsert({
        where: { name },
        create: {
          name,
          tree_level: agentLevel.CodeLength + 1
        },
        update: {}
      })
    }
  }

  //
  const agentCount = await siar.tAgent.count();
  const ursAgentCount = await prisma.agents.count();
  if (agentCount > ursAgentCount) {
    const agents = await siar.tAgent.findMany()

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const agentCode = `SIAR-${agent.AgentID}`

      console.log(`importing agent: ${agent.NameAgent}`)
      await prisma.agents.upsert({
        where: {
          code: agentCode,
        },
        create: {
          code: agentCode,
          agent_level_id: agent.AgentLevelID ? agent.AgentLevelID + 1 : 1,
          agent_type_id: "1",
          name: agent.NameAgent || '',
          is_active: agent.IDStatus == 'ACTIVE',
        },
        update: {
          name: agent.NameAgent || '',
          is_active: agent.IDStatus == 'ACTIVE',
        }
      })
    }
  }


  // get funds
  const fundCount = await siar.tProduct.count();
  const ursFundCount = await prisma.funds.count();
  if (fundCount > ursFundCount) {
    const funds = await siar.tProduct.findMany();

    for (let i = 0; i < funds.length; i++) {
      const fund = funds[i];
      const code = `SIAR-${fund.IDProduct}`

      console.log(`importing fund: ${fund.ProductName}`)
      await prisma.funds.upsert({
        where: {
          external_code: code,
        },
        create: {
          name: fund.ProductName,
          code: fund.ProductCode,
          fund_category_id: fund.IDCategory,
          external_code: code,

          max_red_percentage: 100,
          max_switch_percentage: 100,
          max_unit_issued: 0,

          min_red: fund.RedMinAmount || 0,
          min_sub: fund.SubsMin || 0,
          min_swin: fund.MinUnitSwitching || 0,
          min_swout: fund.MinUnitSwitching || 0,

          sub_settlement_days: fund.SubSettle,
          red_settlement_days: fund.RedSettle,
          switching_settlement_days: fund.SwtSettle,

          min_rest_red: 'AMOUNT',
          min_rest_red_amount: fund.MinBalanceAfterRedemption || 0,
          min_rest_switch: 'AMOUNT',
          min_rest_switch_amount: fund.MinBalanceAfterSwitching || 0,

          initial_nav: fund.InitialUnit || 0,
          initial_unit: fund.InitialUnit || 0,
          initial_nav_per_unit: fund.InitialUnit || 0,

          management_fee_rate: fund.ManagementFee || 0,
          start_date: fund.StartDate,
          end_date: fund.EndDate,

          fee_sub: 0,
          fee_red: 0,
          fee_swin: 0,
          fee_swout: 0,

          is_active: fund.IDStatus,
          is_public: true,
          is_syaria: fund.IsSharia || false,

          can_redeem: fund.AllowRedemption,
          can_subscript: fund.AllowSubscription,
          can_switch: fund.AllowSwitching,
          version: 1,
        },
        update: {}
      })
    }
  }

  // import investors
  const investorCount = await siar.tCustomer.count();
  const ursInvestorCount = await prisma.investors.count();
  if (investorCount > ursInvestorCount) {
    const investors = await siar.tCustomer.findMany({ include: { TAgentCustomer: true } });

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      const external_code = `SIAR-${investor.IDCustomer}`

      console.log(`importing investor: ${investor.FirstName} ${investor.LastName}`)
      const inv = await prisma.investors.upsert({
        where: { external_code },
        create: {
          first_name: investor.FirstName || '',
          middle_name: investor.MiddleName,
          last_name: investor.LastName,
          email: investor.Email?.trim() == '' ? null : investor.Email?.trim(),
          phone_number: investor.MobilePhone?.trim() == '' ? null : investor.MobilePhone?.trim(),
          sid: investor.UnitHolderIDNo,
          investor_type_id: investor.InvestorType,
          external_code,
        },
        update: {
          first_name: investor.FirstName || '',
          middle_name: investor.MiddleName,
          last_name: investor.LastName,
          email: investor.Email?.trim() == '' ? null : investor.Email?.trim(),
          phone_number: investor.MobilePhone?.trim() == '' ? null : investor.MobilePhone?.trim(),
          sid: investor.UnitHolderIDNo,
          investor_type_id: investor.InvestorType,
        }
      })

      if (investor.TAgentCustomer.length > 0) {
        const firstAgent = investor.TAgentCustomer[0];
        const agent = await prisma.agents.findFirst({ where: { code: `SIAR-${firstAgent.AgentId}` } })
        if (agent) {
          await prisma.agent_investors.upsert({
            where: { agent_id_investor_id: { agent_id: agent.id, investor_id: inv.id } },
            create: { agent_id: agent.id, investor_id: inv.id, effective_date: firstAgent.EffDate },
            update: {}
          })
        } else {
          console.log('agent not found', firstAgent)
        }
      }
    }
  }
}

