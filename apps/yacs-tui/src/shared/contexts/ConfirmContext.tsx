import { createContext, useContext, useState, type ReactNode } from "react";

export type ConfirmRequest = {
  title: string;
  message: string;
  detail?: string;
  danger?: boolean;
  run: () => Promise<void> | void;
};

type ConfirmContextValue = {
  confirm: ConfirmRequest | null;
  openConfirm: (r: ConfirmRequest) => void;
  closeConfirm: () => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  return (
    <ConfirmContext.Provider
      value={{
        confirm,
        openConfirm: setConfirm,
        closeConfirm: () => setConfirm(null),
      }}
    >
      {children}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
