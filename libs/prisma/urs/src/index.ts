import { PrismaClient, TransactionType, Prisma } from './../generated/prisma/index.js';

import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.URS_DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

export { TransactionType, prisma, Prisma };

export default prisma;
