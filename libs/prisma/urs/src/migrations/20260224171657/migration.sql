-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
