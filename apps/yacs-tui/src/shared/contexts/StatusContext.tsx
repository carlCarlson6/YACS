import { createContext, useContext, useState, type ReactNode } from "react";

type StatusContextValue = {
  status: string;
  busy: boolean;
  setStatus: (s: string, busy?: boolean) => void;
  setBusy: (busy: boolean) => void;
};

const StatusContext = createContext<StatusContextValue | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <StatusContext.Provider
      value={{
        status,
        busy,
        setStatus: (s: string, nextBusy = false) => {
          setStatus(s);
          setBusy(nextBusy);
        },
        setBusy,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus(): StatusContextValue {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus must be used inside <StatusProvider>");
  return ctx;
}
