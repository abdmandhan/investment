import { PrismaClient, TransactionType } from './../generated/prisma/index.js';

import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.URS_DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

export { TransactionType, prisma };

export default prisma;
