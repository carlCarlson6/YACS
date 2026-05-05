import type { UnitOfWork } from "../src/application/unit-of-work.js";
import type { Repositories } from "../src/domain/repositories.js";

export function createUnitOfWorkStub(repositories: Repositories): UnitOfWork {
  return {
    async transaction(work) {
      return work(repositories);
    },
  };
}
