import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Result<T = Record<string, unknown>> = { results: T[]; meta: { changes: number } };
export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch<T = Record<string, unknown>>(statements: Statement[]): Promise<D1Result<T>[]>;
}

export function cloudflareDatabase(): Database {
  const env = getCloudflareContext().env as unknown as {
    ASAL_DB?: Database & { withSession(constraint: string): Database };
  };
  if (!env.ASAL_DB) throw new Error("ASAL_DB is not configured");
  // Start reads on the primary; subsequent queries are sequentially consistent.
  return env.ASAL_DB.withSession("first-primary");
}
export function usesD1() { return process.env.ORDER_STORAGE === "d1"; }
