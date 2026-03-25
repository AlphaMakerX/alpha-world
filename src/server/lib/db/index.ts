import { AsyncLocalStorage } from "node:async_hooks";
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

const pool = globalThis.__alphaWorldPgPool ?? new Pool({ 
  connectionString: getDatabaseUrl(),
});

if (process.env.NODE_ENV !== "production") {
  globalThis.__alphaWorldPgPool = pool;
}

export const db = drizzle(pool, { schema });

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

const txStorage = new AsyncLocalStorage<TransactionClient>();

export function getDbClient(): typeof db | TransactionClient {
  return txStorage.getStore() ?? db;
}

export async function transact<T>(fn: () => Promise<T>): Promise<T> {
  return db.transaction((tx) => txStorage.run(tx, fn));
}

export { schema };



