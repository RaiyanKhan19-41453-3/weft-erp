import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema: { ...schema, ...authSchema } });

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  return db;
}
