import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { logRequest } from "../logger.js";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logRequest(req.method, req.url, res.statusCode, duration);
    });
    next();
  });

  return app;
}
