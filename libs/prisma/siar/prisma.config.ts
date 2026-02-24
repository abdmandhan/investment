import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/schema.prisma",
  migrations: {
    path: "src/migrations",
    seed: "tsx src/seed.ts",
  },
  datasource: {
    url: env("SIAR_DATABASE_URL"),
  },
});
