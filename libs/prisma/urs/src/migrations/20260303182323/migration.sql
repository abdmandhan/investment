/*
  Warnings:

  - You are about to drop the column `city_id` on the `investor_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `district_id` on the `investor_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `subdistrict_id` on the `investor_addresses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "investor_addresses" DROP COLUMN "city_id",
DROP COLUMN "district_id",
DROP COLUMN "subdistrict_id",
ADD COLUMN     "city_text" TEXT,
ADD COLUMN     "district_text" TEXT,
ADD COLUMN     "province_text" TEXT,
ADD COLUMN     "subdistrict_text" TEXT,
ALTER COLUMN "postal_code" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "investor_addresses" ADD CONSTRAINT "investor_addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
