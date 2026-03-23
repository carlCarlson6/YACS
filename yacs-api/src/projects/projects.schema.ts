import { createTable } from "../infrastructure/drizzle";

export const projectsTable = createTable(
  'projects', 
  (t) => ({
    id: t.text('id').primaryKey(),
    name: t.text('name').notNull(),
    buildPath: t.text('build_path').notNull(),
    url: t.text('url').notNull(),
    status: t.text('status').notNull(),
    createdAt: t.timestamp('created_at').notNull().defaultNow()
  })
);