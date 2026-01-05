import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for migrations. Set it to your online PostgreSQL connection string.",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.pg.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
