import * as path from "node:path";

export function resolveProjectDir(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("project path is required");
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
}
