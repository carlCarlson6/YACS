import { createContext, useContext, useState, type ReactNode } from "react";
import type { View } from "../types";

type ViewContextValue = {
  view: View;
  setView: (v: View) => void;
  selectedProject: number;
  setSelectedProject: (n: number | ((prev: number) => number)) => void;
  selectedDeployment: number;
  setSelectedDeployment: (n: number | ((prev: number) => number)) => void;
};

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("projects");
  const [selectedProject, setSelectedProject] = useState(0);
  const [selectedDeployment, setSelectedDeployment] = useState(0);
  return (
    <ViewContext.Provider
      value={{
        view,
        setView,
        selectedProject,
        setSelectedProject,
        selectedDeployment,
        setSelectedDeployment,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used inside <ViewProvider>");
  return ctx;
}
