import { createContext, useContext, type ReactNode } from "react";

const ApiContext = createContext<string | null>(null);

export function ApiProvider({ url, children }: { url: string; children: ReactNode }) {
  return <ApiContext.Provider value={url}>{children}</ApiContext.Provider>;
}

export function useApiUrl(): string {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApiUrl must be used inside <ApiProvider>");
  return ctx;
}
