-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- CreateEnum
CREATE TYPE "MinRestType" AS ENUM ('UNIT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SUBSCRIPTION', 'REDEMPTION', 'SWITCHING_IN', 'SWITCHING_OUT');

-- CreateTable
CREATE TABLE "risk_levels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_levels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tree_level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logo" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "bi_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_branchs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_branchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "no" INTEGER,
    "name" TEXT NOT NULL,
    "postal_code" TEXT,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "references" (
    "id" SERIAL NOT NULL,
    "reference_group_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funds" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ksei_code" TEXT,
    "external_code" TEXT,
    "color" TEXT,
    "fund_category_id" TEXT NOT NULL,
    "max_red_percentage" DOUBLE PRECISION NOT NULL,
    "max_switch_percentage" DOUBLE PRECISION NOT NULL,
    "max_unit_issued" DOUBLE PRECISION NOT NULL,
    "min_red" DOUBLE PRECISION NOT NULL,
    "min_sub" DOUBLE PRECISION NOT NULL,
    "min_swin" DOUBLE PRECISION NOT NULL,
    "min_swout" DOUBLE PRECISION NOT NULL,
    "recommend_sub" JSONB,
    "recommend_red" JSONB,
    "recommend_switch" JSONB,
    "sub_settlement_days" INTEGER NOT NULL DEFAULT 0,
    "red_settlement_days" INTEGER NOT NULL DEFAULT 0,
    "switching_settlement_days" INTEGER NOT NULL DEFAULT 0,
    "min_rest_red" "MinRestType" NOT NULL DEFAULT 'AMOUNT',
    "min_rest_red_amount" DOUBLE PRECISION NOT NULL,
    "min_rest_switch" "MinRestType" NOT NULL DEFAULT 'AMOUNT',
    "min_rest_switch_amount" DOUBLE PRECISION NOT NULL,
    "initial_nav" DECIMAL(30,4) NOT NULL,
    "initial_unit" DECIMAL(30,4) NOT NULL,
    "initial_nav_per_unit" DECIMAL(30,4) NOT NULL,
    "max_investors" INTEGER NOT NULL DEFAULT 0,
    "max_hold" INTEGER NOT NULL DEFAULT 0,
    "max_hold_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_precision" INTEGER NOT NULL DEFAULT 4,
    "management_fee_rate" DECIMAL(10,4) NOT NULL,
    "valuation_basis" INTEGER NOT NULL DEFAULT 365,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "can_switch_to" TEXT NOT NULL DEFAULT 'all',
    "can_switch_to_list" JSONB,
    "fee_sub" DOUBLE PRECISION NOT NULL,
    "fee_red" DOUBLE PRECISION NOT NULL,
    "fee_swin" DOUBLE PRECISION NOT NULL,
    "fee_swout" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_public" BOOLEAN NOT NULL,
    "is_syaria" BOOLEAN NOT NULL,
    "desc" TEXT,
    "policy" TEXT,
    "strategy" TEXT,
    "goals" TEXT,
    "can_redeem" BOOLEAN NOT NULL,
    "can_subscript" BOOLEAN NOT NULL,
    "can_switch" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_navs" (
    "id" BIGSERIAL NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "nav" DECIMAL(30,4) NOT NULL,
    "nav_per_unit" DECIMAL(30,4) NOT NULL,
    "outstanding_unit" DECIMAL(30,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_navs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_allocations" (
    "id" SERIAL NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "fund_asset_type_id" INTEGER NOT NULL,
    "allocation" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_documents" (
    "id" SERIAL NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "fund_document_type_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_banks" (
    "id" SERIAL NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "bank_branch_id" INTEGER,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "agent_level_id" INTEGER NOT NULL,
    "agent_type_id" TEXT NOT NULL,
    "agent_parent_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_investors" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "investor_id" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "external_code" TEXT,
    "first_name" VARCHAR(128) NOT NULL,
    "middle_name" VARCHAR(128),
    "last_name" VARCHAR(128),
    "email" TEXT,
    "phone_number" VARCHAR(32),
    "risk_level_id" INTEGER,
    "risk_point" INTEGER,
    "sid" TEXT,
    "investor_type_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_accounts" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_individuals" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "birth_place" TEXT NOT NULL,
    "mother_name" TEXT NOT NULL,
    "is_employee" BOOLEAN NOT NULL,
    "tax_number" TEXT NOT NULL,
    "tax_effective_date" TIMESTAMP(3) NOT NULL,
    "gender_id" TEXT NOT NULL,
    "education_id" TEXT NOT NULL,
    "card_type_id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "income_id" TEXT NOT NULL,
    "income_source_id" TEXT NOT NULL,
    "marital_id" TEXT NOT NULL,
    "nationality_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "job_category_id" TEXT NOT NULL,
    "job_role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_corporates" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "tax_number" TEXT NOT NULL,
    "reg_date" TIMESTAMP(3) NOT NULL,
    "siup" TEXT NOT NULL,
    "tdp_number" TEXT NOT NULL,
    "tdp_reg_date" TIMESTAMP(3) NOT NULL,
    "skd_reg_date" TIMESTAMP(3) NOT NULL,
    "establish_date" TIMESTAMP(3) NOT NULL,
    "phone_number" TEXT NOT NULL,
    "fax_number" TEXT NOT NULL,
    "corporate_legal_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_corporates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_heirs" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_heirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_addresses" (
    "id" SERIAL NOT NULL,
    "address_type_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "subdistrict_id" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "address_line_2" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_banks" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "bank_branch_id" INTEGER,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_auth_contacts" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "auth_contact_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "birth_date" DATE,
    "address" TEXT,

    CONSTRAINT "investor_auth_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_holdings" (
    "id" SERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "investor_account_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "units_before" DECIMAL(30,4) NOT NULL,
    "units_after" DECIMAL(30,4) NOT NULL,
    "delta_units" DECIMAL(30,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "external_code" TEXT,
    "transaction_type" "TransactionType" NOT NULL,
    "investor_id" TEXT NOT NULL,
    "investor_account_id" INTEGER NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "reference_no" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "nav_date" DATE NOT NULL,
    "nav_per_unit" DECIMAL(30,4) NOT NULL,
    "units" DECIMAL(30,4) NOT NULL,
    "settlement_date" DATE NOT NULL,
    "amount" DECIMAL(30,4) NOT NULL,
    "net_amount" DECIMAL(30,4) NOT NULL,
    "fee" DECIMAL(30,4) NOT NULL,
    "is_redeem_all" BOOLEAN NOT NULL DEFAULT false,
    "source_transaction_id" INTEGER,
    "payment_method_id" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "transaction_typesId" INTEGER,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_banks" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "bank_branch_id" INTEGER,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aum_investor_daily" (
    "id" BIGSERIAL NOT NULL,
    "investor_id" TEXT NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "units" DECIMAL(30,8) NOT NULL,
    "nav_per_unit" DECIMAL(30,8) NOT NULL,
    "aum_value" DECIMAL(30,2) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 1,
    "management_fee" DECIMAL(30,2) NOT NULL,

    CONSTRAINT "aum_investor_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "username" TEXT NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" "ActionType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "requested_by" INTEGER NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "applied_at" TIMESTAMP(3),
    "entity_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_details" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "risk_levels_name_key" ON "risk_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_types_name_key" ON "transaction_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agent_levels_name_key" ON "agent_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bank_branchs_code_key" ON "bank_branchs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "references_reference_group_id_code_key" ON "references"("reference_group_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "reference_groups_name_key" ON "reference_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "funds_code_key" ON "funds"("code");

-- CreateIndex
CREATE UNIQUE INDEX "funds_external_code_key" ON "funds"("external_code");

-- CreateIndex
CREATE INDEX "fund_navs_fund_id_date_idx" ON "fund_navs"("fund_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fund_navs_fund_id_date_key" ON "fund_navs"("fund_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "agents_code_key" ON "agents"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agent_investors_agent_id_investor_id_key" ON "agent_investors"("agent_id", "investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "investors_external_code_key" ON "investors"("external_code");

-- CreateIndex
CREATE UNIQUE INDEX "investors_sid_key" ON "investors"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "investor_accounts_investor_id_fund_id_key" ON "investor_accounts"("investor_id", "fund_id");

-- CreateIndex
CREATE UNIQUE INDEX "investor_individuals_investor_id_key" ON "investor_individuals"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "investor_corporates_investor_id_key" ON "investor_corporates"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "investor_holdings_transaction_id_key" ON "investor_holdings"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_external_code_key" ON "transactions"("external_code");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_banks_transaction_id_bank_id_key" ON "transaction_banks"("transaction_id", "bank_id");

-- CreateIndex
CREATE INDEX "aum_investor_daily_agent_id_date_idx" ON "aum_investor_daily"("agent_id", "date");

-- CreateIndex
CREATE INDEX "aum_investor_daily_fund_id_date_idx" ON "aum_investor_daily"("fund_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "aum_investor_daily_investor_id_fund_id_date_key" ON "aum_investor_daily"("investor_id", "fund_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_permission_id_role_id_key" ON "role_permissions"("permission_id", "role_id");

-- CreateIndex
CREATE INDEX "journals_entity_entity_id_action_idx" ON "journals"("entity", "entity_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "journal_details_journal_id_key" ON "journal_details"("journal_id");

-- AddForeignKey
ALTER TABLE "bank_branchs" ADD CONSTRAINT "bank_branchs_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_navs" ADD CONSTRAINT "fund_navs_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_documents" ADD CONSTRAINT "fund_documents_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_banks" ADD CONSTRAINT "fund_banks_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_banks" ADD CONSTRAINT "fund_banks_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_banks" ADD CONSTRAINT "fund_banks_bank_branch_id_fkey" FOREIGN KEY ("bank_branch_id") REFERENCES "bank_branchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_agent_level_id_fkey" FOREIGN KEY ("agent_level_id") REFERENCES "agent_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_agent_parent_id_fkey" FOREIGN KEY ("agent_parent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_investors" ADD CONSTRAINT "agent_investors_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_investors" ADD CONSTRAINT "agent_investors_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investors" ADD CONSTRAINT "investors_risk_level_id_fkey" FOREIGN KEY ("risk_level_id") REFERENCES "risk_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_accounts" ADD CONSTRAINT "investor_accounts_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_accounts" ADD CONSTRAINT "investor_accounts_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_individuals" ADD CONSTRAINT "investor_individuals_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_corporates" ADD CONSTRAINT "investor_corporates_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_heirs" ADD CONSTRAINT "investor_heirs_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_addresses" ADD CONSTRAINT "investor_addresses_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_banks" ADD CONSTRAINT "investor_banks_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_banks" ADD CONSTRAINT "investor_banks_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_banks" ADD CONSTRAINT "investor_banks_bank_branch_id_fkey" FOREIGN KEY ("bank_branch_id") REFERENCES "bank_branchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_holdings" ADD CONSTRAINT "investor_holdings_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_holdings" ADD CONSTRAINT "investor_holdings_investor_account_id_fkey" FOREIGN KEY ("investor_account_id") REFERENCES "investor_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_holdings" ADD CONSTRAINT "investor_holdings_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_holdings" ADD CONSTRAINT "investor_holdings_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_typesId_fkey" FOREIGN KEY ("transaction_typesId") REFERENCES "transaction_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_banks" ADD CONSTRAINT "transaction_banks_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_banks" ADD CONSTRAINT "transaction_banks_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aum_investor_daily" ADD CONSTRAINT "aum_investor_daily_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aum_investor_daily" ADD CONSTRAINT "aum_investor_daily_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aum_investor_daily" ADD CONSTRAINT "aum_investor_daily_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_details" ADD CONSTRAINT "journal_details_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
