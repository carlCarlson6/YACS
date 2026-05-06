import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { Project } from "@yacs/schemas";
import { ApiProvider } from "../shared/contexts/ApiContext";
import { FatalErrorProvider } from "../shared/contexts/FatalErrorContext";
import { StatusProvider } from "../shared/contexts/StatusContext";
import { ConfirmProvider } from "../shared/contexts/ConfirmContext";
import { ViewProvider } from "../shared/contexts/ViewContext";
import { ProjectsProvider } from "../shared/contexts/ProjectsContext";

type ProviderOptions = {
  apiUrl?: string;
  initialProjects?: Project[];
  projectsFetcher?: typeof fetch;
  autoLoadProjects?: boolean;
};

export function renderWithProviders(
  ui: ReactElement,
  { apiUrl = "http://localhost:3000/api", initialProjects = [], projectsFetcher, autoLoadProjects = false }: ProviderOptions = {},
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiProvider url={apiUrl}>
        <FatalErrorProvider>
          <StatusProvider>
            <ConfirmProvider>
              <ViewProvider>
                <ProjectsProvider
                  initialProjects={initialProjects}
                  autoLoad={autoLoadProjects}
                  fetcher={projectsFetcher}
                >
                  {children}
                </ProjectsProvider>
              </ViewProvider>
            </ConfirmProvider>
          </StatusProvider>
        </FatalErrorProvider>
      </ApiProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
