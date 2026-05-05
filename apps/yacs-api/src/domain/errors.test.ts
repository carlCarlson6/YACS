import { describe, expect, it } from "vitest";
import { AppError, NotFoundError, RevertError } from "./errors.js";

describe("AppError hierarchy", () => {
  it("sets status and code", () => {
    const error = new AppError(403, "FORBIDDEN", "nope");

    expect(error.status).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("nope");
  });

  it("creates a not found error with the entity name", () => {
    const error = new NotFoundError("Project");

    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Project not found");
  });

  it("creates a revert error with a custom message", () => {
    const error = new RevertError("Invalid state");

    expect(error.status).toBe(400);
    expect(error.code).toBe("REVERT_ERROR");
    expect(error.message).toBe("Invalid state");
  });
});
