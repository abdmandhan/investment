-- AlterTable
ALTER TABLE "investor_individuals" ALTER COLUMN "tax_effective_date" DROP NOT NULL,
ALTER COLUMN "job_id" DROP NOT NULL,
ALTER COLUMN "job_category_id" DROP NOT NULL,
ALTER COLUMN "job_role_id" DROP NOT NULL;
