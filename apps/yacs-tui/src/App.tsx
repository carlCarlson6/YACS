import { ApiProvider } from "./shared/contexts/ApiContext";
import { StatusProvider } from "./shared/contexts/StatusContext";
import { ViewProvider, useView } from "./shared/contexts/ViewContext";
import { ConfirmProvider } from "./shared/contexts/ConfirmContext";
import { FatalErrorProvider } from "./shared/contexts/FatalErrorContext";
import { ProjectsProvider } from "./shared/contexts/ProjectsContext";
import { AppShell } from "./shared/ui/AppShell";
import { ConfirmOverlay } from "./shared/overlays/ConfirmOverlay";
import { FatalErrorOverlay } from "./shared/overlays/FatalErrorOverlay";

import { ListProjectsScreen } from "./features/list-projects/ListProjectsScreen";
import { ProjectDetailScreen } from "./features/project-detail/ProjectDetailScreen";
import { CreateProjectScreen } from "./features/create-project/CreateProjectScreen";
import { UpdateProjectScreen } from "./features/update-project/UpdateProjectScreen";
import { DeployProjectScreen } from "./features/deploy-project/DeployProjectScreen";

function Router() {
  const { view } = useView();
  switch (view) {
    case "projects":
      return <ListProjectsScreen />;
    case "detail":
      return <ProjectDetailScreen />;
    case "create":
      return <CreateProjectScreen />;
    case "update":
      return <UpdateProjectScreen />;
    case "deploy":
      return <DeployProjectScreen />;
  }
}

export function App({ API_URL }: { API_URL: string }) {
  return (
    <ApiProvider url={API_URL}>
      <FatalErrorProvider>
        <StatusProvider>
          <ConfirmProvider>
            <ViewProvider>
              <ProjectsProvider>
                <AppShell>
                  <Router />
                  <ConfirmOverlay />
                  <FatalErrorOverlay />
                </AppShell>
              </ProjectsProvider>
            </ViewProvider>
          </ConfirmProvider>
        </StatusProvider>
      </FatalErrorProvider>
    </ApiProvider>
  );
}
