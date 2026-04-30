import type { Response } from "express";
import { ApiError } from "@yacs/schemas";
import { logError } from "../logger.js";
import { AppError } from "../../domain/errors.js";

export function sendError(res: Response<ApiError>, error: unknown): void {
  if (error instanceof AppError) {
    logError(`${error.code}: ${error.message}`);
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }

  logError("Unexpected API error", error);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Internal server error" });
}
