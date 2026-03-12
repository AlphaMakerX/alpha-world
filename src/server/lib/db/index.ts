import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __alphaWorldPgPool: Pool | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Please configure it in your environment.");
  }
  return url;
}

const pool = globalThis.__alphaWorldPgPool ?? new Pool({ connectionString: getDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  globalThis.__alphaWorldPgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
