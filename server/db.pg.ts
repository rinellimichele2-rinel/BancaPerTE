import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema.pg";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

export function getDb() {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Configure a PostgreSQL database and set the env variable.",
    );
  }
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  _db = drizzle(_pool, { schema });
  return _db;
}

export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getDb() as any;
      const value = real[prop];
      if (typeof value === "function") return value.bind(real);
      return value;
    },
  },
) as ReturnType<typeof drizzle>;
