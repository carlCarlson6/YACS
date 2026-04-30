import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FatalError = { message: string; stack?: string };

type FatalErrorContextValue = {
  fatalError: FatalError | null;
  reportError: (err: unknown) => void;
  dismissError: () => void;
};

const FatalErrorContext = createContext<FatalErrorContextValue | null>(null);

export function FatalErrorProvider({ children }: { children: ReactNode }) {
  const [fatalError, setFatalError] = useState<FatalError | null>(null);

  const reportError = (err: unknown) => {
    const e = err instanceof Error ? err : new Error(String(err));
    setFatalError({ message: e.message || "Unknown error", stack: e.stack });
  };

  useEffect(() => {
    const onUncaught = (err: unknown) => reportError(err);
    const onRejection = (reason: unknown) => reportError(reason);
    process.on("uncaughtException", onUncaught);
    process.on("unhandledRejection", onRejection);
    return () => {
      process.off("uncaughtException", onUncaught);
      process.off("unhandledRejection", onRejection);
    };
  }, []);

  return (
    <FatalErrorContext.Provider
      value={{ fatalError, reportError, dismissError: () => setFatalError(null) }}
    >
      {children}
    </FatalErrorContext.Provider>
  );
}

export function useFatalError(): FatalErrorContextValue {
  const ctx = useContext(FatalErrorContext);
  if (!ctx) throw new Error("useFatalError must be used inside <FatalErrorProvider>");
  return ctx;
}
