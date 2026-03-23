import { connectToDrizzle } from "./infrastructure/drizzle";
import { HonoBuilder } from "./infrastructure/hono"

const db = connectToDrizzle();

const builder = new HonoBuilder(db)
  .useLogger()
  .mapAlive()
  .mapHelloWorld()
  .mapListProjects();

export default builder.build();
