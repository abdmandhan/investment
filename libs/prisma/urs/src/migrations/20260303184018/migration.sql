-- AddForeignKey
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
