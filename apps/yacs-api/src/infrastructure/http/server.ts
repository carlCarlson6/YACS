import type { Express } from "express";
import { log } from "../logger.js";

export function startHttpServer(app: Express, port: number): void {
  app.listen(port, () => {
    log(`YACS API running on http://localhost:${port}`);
  });
}
