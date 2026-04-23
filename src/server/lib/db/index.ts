/**
 * 数据库连接与事务管理
 *
 * - 初始化 PostgreSQL 连接池，开发环境下复用全局实例避免热重载时创建多余连接
 * - 使用 Drizzle ORM 作为查询构建器
 * - 通过 AsyncLocalStorage 实现"隐式事务上下文"，让仓储代码无需显式传递事务客户端
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// 全局变量声明，用于开发环境下跨热重载复用连接池
declare global {
  // eslint-disable-next-line no-var
  var __alphaWorldPgPool: Pool | undefined;
}

/** 从环境变量读取数据库连接字符串，未配置时抛出明确错误 */
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Please configure it in your environment.");
  }
  return url;
}

// 开发环境下复用全局连接池，避免 HMR 导致连接泄漏
const pool = globalThis.__alphaWorldPgPool ?? new Pool({
  connectionString: getDatabaseUrl(),
});

if (process.env.NODE_ENV !== "production") {
  globalThis.__alphaWorldPgPool = pool;
}

/** Drizzle ORM 实例，绑定了连接池和数据库 schema */
export const db = drizzle(pool, { schema });

/** 事务客户端类型，从 Drizzle 的 transaction 回调参数中推导 */
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** 基于 AsyncLocalStorage 的事务上下文存储 */
const txStorage = new AsyncLocalStorage<TransactionClient>();

/**
 * 获取当前数据库客户端
 * 如果当前处于事务上下文中则返回事务客户端，否则返回普通 db 实例
 */
export function getDbClient(): typeof db | TransactionClient {
  return txStorage.getStore() ?? db;
}

/**
 * 在数据库事务中执行给定的异步函数
 * 事务客户端通过 AsyncLocalStorage 隐式传递，仓储层通过 getDbClient() 自动获取
 */
export async function transact<T>(fn: () => Promise<T>): Promise<T> {
  return db.transaction((tx) => txStorage.run(tx, fn));
}

export { schema };



