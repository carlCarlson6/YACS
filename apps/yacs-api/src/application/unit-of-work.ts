import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Repositories } from "../domain/repositories.js";
import { createRepositories } from "../infrastructure/db/repositories.js";
import * as schema from "../infrastructure/db/schema.js";

type DatabaseClient = NodePgDatabase<typeof schema>;

export interface UnitOfWork {
  transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T>;
}

export function createUnitOfWork(database: DatabaseClient): UnitOfWork {
  return {
    async transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
      return database.transaction((tx) => work(createRepositories(tx)));
    },
  };
}
