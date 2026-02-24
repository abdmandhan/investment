import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaMssql } from "@prisma/adapter-mssql"

const config = {
  server: process.env.SIAR_DATABASE_SERVER,
  port: parseInt(process.env.SIAR_DATABASE_PORT || '1433'),
  database: process.env.SIAR_DATABASE_NAME,
  user: process.env.SIAR_DATABASE_USER,
  password: process.env.SIAR_DATABASE_PASSWORD,
  options: {
    encrypt: false, // Use this if you're on Windows Azure
    trustServerCertificate: true, // Use this if you're using self-signed certificates
  },
}

// Pass the config object directly to PrismaMssql (it expects sql.config | string)
const adapter = new PrismaMssql(config);

const prisma = new PrismaClient({
  adapter
});

export default prisma;
