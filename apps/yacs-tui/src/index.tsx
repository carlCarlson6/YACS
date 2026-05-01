import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "").replace(/\/api$/, "") + "/api"
}

export const API_URL = normalizeApiUrl(process.env.YACS_API_URL || "http://localhost:3000")

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
});

createRoot(renderer).render(<App API_URL={API_URL} />);
