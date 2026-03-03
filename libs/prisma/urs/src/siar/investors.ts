import siar from '@investment/siar';
import { prisma } from '../index.js';

export const importInvestorsFromSiar = async () => {
  const investorCount = await siar.tCustomer.count();
  const ursInvestorCount = await prisma.investors.count();

  // if (investorCount <= ursInvestorCount) {
  //   return;
  // }

  const customers = await siar.tCustomer.findMany({
    include: {
      TAgentCustomer: true,
      TCustomerAddress: true,
      TCustBankAccount: {
        include: {
          TRefBankBranch: true,
        },
      },
      TCustomerHeir: true,
      TCustomerIndividual: true,
      TCustomerInstitusi: true,
      TCustomerAuthContact: true,
    },
  });

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const external_code = `SIAR-${customer.IDCustomer}`;

    console.log(`importing investor: ${customer.UnitHolderIDNo} (${customer.IDCustomer})`);

    const inv = await prisma.investors.upsert({
      where: { external_code },
      create: {
        first_name: customer.FirstName || '',
        middle_name: customer.MiddleName || null,
        last_name: customer.LastName || null,
        email: customer.Email?.trim() === '' ? null : customer.Email?.trim() ?? null,
        phone_number: customer.MobilePhone?.trim() === '' ? null : customer.MobilePhone?.trim() ?? null,
        sid: customer.UnitHolderIDNo,
        investor_type_id: customer.InvestorType,
        external_code,
      },
      update: {
        first_name: customer.FirstName || '',
        middle_name: customer.MiddleName || null,
        last_name: customer.LastName || null,
        email: customer.Email?.trim() === '' ? null : customer.Email?.trim() ?? null,
        phone_number: customer.MobilePhone?.trim() === '' ? null : customer.MobilePhone?.trim() ?? null,
        sid: customer.UnitHolderIDNo,
        investor_type_id: customer.InvestorType,
      },
    });

    // reset related data so the import is idempotent
    await prisma.investor_addresses.deleteMany({ where: { investor_id: inv.id } });
    await prisma.investor_banks.deleteMany({ where: { investor_id: inv.id } });
    await prisma.investor_heirs.deleteMany({ where: { investor_id: inv.id } });
    await prisma.investor_auth_contacts.deleteMany({ where: { investor_id: inv.id } });
    await prisma.investor_individuals.deleteMany({ where: { investor_id: inv.id } });
    await prisma.investor_corporates.deleteMany({ where: { investor_id: inv.id } });

    if (customer.TAgentCustomer.length > 0) {
      const firstAgent = customer.TAgentCustomer[0];
      const agent = await prisma.agents.findFirst({ where: { code: `SIAR-${firstAgent.AgentId}` } });

      if (agent) {
        await prisma.agent_investors.upsert({
          where: { agent_id_investor_id: { agent_id: agent.id, investor_id: inv.id } },
          create: { agent_id: agent.id, investor_id: inv.id, effective_date: firstAgent.EffDate },
          update: {},
        });
      } else {
        console.log('agent not found for investor', customer.IDCustomer, firstAgent.AgentId);
      }
    }

    for (const addr of customer.TCustomerAddress) {
      const addressLines = [addr.Address1, addr.Address2, addr.Address3, addr.Address4, addr.Address5]
        .filter((value) => value && value.trim() !== '')
        .join(' ');

      await prisma.investor_addresses.create({
        data: {
          investor_id: inv.id,
          address_type_id: addr.AddressTypeCode || 'UNKNOWN',
          province_id: addr.IDProvince || 'UNKNOWN',
          city_id: addr.City || 'UNKNOWN',
          district_id: addr.District || 'UNKNOWN',
          subdistrict_id: addr.SubDistrict || 'UNKNOWN',
          postal_code: addr.PostalCode || '',
          address: addressLines || '',
          address_line_2: addr.Address2 || null,
        },
      });
    }

    for (const heir of customer.TCustomerHeir) {
      if (!heir.Name || heir.Name.trim() === '') {
        continue;
      }

      await prisma.investor_heirs.create({
        data: {
          investor_id: inv.id,
          name: heir.Name,
          relation_id: heir.Relationship || 'UNKNOWN',
        },
      });
    }

    if (customer.TCustomerIndividual && customer.InvestorType === 'I') {
      const ind = customer.TCustomerIndividual;

      await prisma.investor_individuals.create({
        data: {
          investor_id: inv.id,
          birth_date: ind.TanggalLahir ?? customer.BirthDate ?? undefined,
          birth_place: ind.TempatLahir ?? undefined,
          mother_name: ind.NamaIbuKandungSebelumMenikah ?? customer.MotherName ?? '',
          is_employee: false,
          tax_number: ind.NPWP ?? customer.NPWP ?? '',
          tax_effective_date: ind.TanggalRegistrasi ?? customer.NPWPIssuedDate ?? undefined,
          gender_id: ind.JenisKelaminID != null ? String(ind.JenisKelaminID) : null,
          education_id: ind.PendidikanID != null ? String(ind.PendidikanID) : null,
          card_type_id: null,
          card_number: ind.NoID ?? null,
          income_id: null,
          income_source_id: null,
          marital_id: ind.StatusPernikahanID != null ? String(ind.StatusPernikahanID) : null,
          nationality_id: ind.KewarganegaraanID != null ? String(ind.KewarganegaraanID) : customer.IDNationality ?? null,
          job_id: null,
          job_category_id: null,
          job_role_id: null,
        },
      });
    }

    if (customer.TCustomerInstitusi && customer.InvestorType !== 'I') {
      const corp = customer.TCustomerInstitusi;

      await prisma.investor_corporates.create({
        data: {
          investor_id: inv.id,
          tax_number: corp.NPWP ?? '',
          reg_date: corp.TglRegistrasi ?? undefined,
          siup: corp.SIUP ?? '',
          tdp_number: corp.NoTDP ?? '',
          tdp_reg_date: corp.TglRegTDP ?? undefined,
          skd_reg_date: corp.TglRegSKD ?? undefined,
          establish_date: corp.TglBerdiri ?? undefined,
          phone_number: corp.NoTelp ?? '',
          fax_number: corp.NoFax ?? '',
          corporate_legal_id: corp.BadanHukum ?? null,
        },
      });
    }

    for (const bank of customer.TCustBankAccount) {
      const branchCode = `SIAR-${bank.IDBankBranch}`;
      const branch = await prisma.bank_branchs.findUnique({ where: { code: branchCode } });

      if (!branch) {
        console.log('bank branch not found for investor', customer.IDCustomer, bank.IDBankBranch);
        continue;
      }

      await prisma.investor_banks.create({
        data: {
          investor_id: inv.id,
          bank_id: branch.bank_id,
          bank_branch_id: branch.id,
          account_number: bank.AccountNo,
          account_name: bank.AccountName,
          is_active: bank.sysRecStatus ?? true,
          is_primary: bank.IsPriority ?? false,
        },
      });
    }

    for (const contact of customer.TCustomerAuthContact) {
      await prisma.investor_auth_contacts.create({
        data: {
          investor_id: inv.id,
          auth_contact_id: Number(contact.IDCustomerAuthContact),
          full_name: contact.FullName,
          phone_number: contact.Phone ?? null,
          email: contact.Email ?? null,
          birth_date: contact.BirthDate ?? undefined,
          address: contact.Address ?? null,
        },
      });
    }
  }
};

