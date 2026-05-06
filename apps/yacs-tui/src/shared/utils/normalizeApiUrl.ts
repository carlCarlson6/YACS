export function normalizeApiUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("API URL is required");
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  const withoutApiSuffix = withoutTrailingSlash.replace(/\/api$/, "");
  return `${withoutApiSuffix}/api`;
}
