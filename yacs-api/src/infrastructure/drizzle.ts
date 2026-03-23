// Make sure to install the 'pg' package 
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTableCreator } from "drizzle-orm/pg-core";

export const connectToDrizzle = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return drizzle(process.env.DATABASE_URL);
}
 
export type Db = ReturnType<typeof connectToDrizzle>;

export const createTable = pgTableCreator((name) => `yacs_${name}`);