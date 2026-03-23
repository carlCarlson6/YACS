import { Hono } from "hono";
import { logger } from "hono/logger";
import { mapListProjectsEndpoint } from "../projects/list";
import { Db } from "./drizzle";

export class HonoBuilder {
  
  constructor(
    private db: Db,
    private app: Hono = new Hono(),
  ) {}

  useLogger() { 
    this.app.use(logger());
    return this;
  }

  mapAlive() {
    this.app.get('/alive', (c) => c.text('OK'));
    return this;
  }

  mapHelloWorld() {
    this.app.get('/', (c) => c.text('Hello Hono!'));
    return this;
  }

  mapListProjects() {
    mapListProjectsEndpoint(this.app, this.db);
    return this;
  }

  build() {
    return this.app;
  }
}
