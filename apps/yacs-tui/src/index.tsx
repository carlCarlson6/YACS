import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";
import { normalizeApiUrl } from "./shared/utils/normalizeApiUrl";

export const API_URL = normalizeApiUrl(process.env.YACS_API_URL ?? "http://localhost:3000");

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
});

createRoot(renderer).render(<App API_URL={API_URL} />);
