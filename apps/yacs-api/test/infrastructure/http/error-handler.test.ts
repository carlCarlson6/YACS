import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { AppError } from "../../../src/domain/errors.js";

vi.mock("../../../src/infrastructure/logger.js", () => ({
  logError: vi.fn(),
}));

import { sendError } from "../../../src/infrastructure/http/error-handler.js";
import { logError } from "../../../src/infrastructure/logger.js";

function createResponseMock(): Response {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  } as unknown as Response;
  return res;
}

describe("sendError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes known AppError instances", () => {
    const res = createResponseMock();
    const error = new AppError(418, "TEAPOT", "short and stout");

    sendError(res as Response, error);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ error: "TEAPOT", message: "short and stout" });
    expect(logError).toHaveBeenCalledWith("TEAPOT: short and stout");
  });

  it("falls back to a generic error response", () => {
    const res = createResponseMock();
    const unknownError = new Error("boom");

    sendError(res as Response, unknownError);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "INTERNAL_ERROR", message: "Internal server error" });
    expect(logError).toHaveBeenCalledWith("Unexpected API error", unknownError);
  });
});
