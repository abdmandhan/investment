/*
  Warnings:

  - You are about to drop the column `reference_group_id` on the `references` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_typesId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `reference_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_types` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[reference_name,code]` on the table `references` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference_name` to the `references` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'ADJUSTMENT_UP';
ALTER TYPE "TransactionType" ADD VALUE 'ADJUSTMENT_DOWN';

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_transaction_typesId_fkey";

-- DropIndex
DROP INDEX "references_reference_group_id_code_key";

-- AlterTable
ALTER TABLE "references" DROP COLUMN "reference_group_id",
ADD COLUMN     "reference_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "transaction_typesId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone_number" VARCHAR(32);

-- DropTable
DROP TABLE "reference_groups";

-- DropTable
DROP TABLE "transaction_types";

-- CreateTable
CREATE TABLE "aum_daily" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "aum_value" DECIMAL(30,2) NOT NULL,
    "management_fee" DECIMAL(30,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aum_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "http_logs" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "error" TEXT,
    "request" JSONB NOT NULL,
    "response" JSONB,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "http_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aum_daily_date_idx" ON "aum_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "aum_daily_date_key" ON "aum_daily"("date");

-- CreateIndex
CREATE INDEX "references_reference_name_code_idx" ON "references"("reference_name", "code");

-- CreateIndex
CREATE UNIQUE INDEX "references_reference_name_code_key" ON "references"("reference_name", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
