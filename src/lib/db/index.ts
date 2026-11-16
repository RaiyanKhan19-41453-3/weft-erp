import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: ReturnType<typeof createClient> | undefined;

function createClient() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  instance ??= createClient();
  return instance;
}
