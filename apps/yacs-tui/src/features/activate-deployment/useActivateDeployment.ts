import { useCallback } from "react";
import type { Project } from "@yacs/schemas";
import type { Deployment } from "../../shared/types";
import { useApiUrl } from "../../shared/contexts/ApiContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";

/**
 * Encapsulates the "promote a deployment to LIVE" use case.
 * The caller is responsible for refetching the deployments list afterwards.
 */
export function useActivateDeployment(onActivated: (projectId: string) => Promise<void> | void) {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const { openConfirm } = useConfirm();
  const { fetchProjects } = useProjects();

  const performActivate = useCallback(
    async (project: Project, deployment: Deployment) => {
      try {
        const res = await fetch(`${apiUrl}/deployments/${deployment.id}/activate`, {
          method: "POST",
        });
        if (res.ok) {
          setStatus(`> deployment ${deployment.id.slice(0, 8)} promoted to LIVE`);
          await fetchProjects();
          await onActivated(project.id);
        } else {
          setStatus("! activate failed");
        }
      } catch {
        setStatus("! activate error");
      }
    },
    [apiUrl, setStatus, fetchProjects, onActivated]
  );

  const requestActivate = useCallback(
    (project: Project, deployment: Deployment, allDeployments: Deployment[]) => {
      if (project.currentDeploymentId === deployment.id) {
        setStatus("> deployment already LIVE");
        return;
      }
      const currentLive = allDeployments.find((d) => d.id === project.currentDeploymentId);
      openConfirm({
        title: "// promote deployment //",
        message: `Set deployment ${deployment.id.slice(0, 8)} as LIVE for "${project.name}"?`,
        detail: currentLive
          ? `Will replace current LIVE: ${currentLive.id.slice(0, 8)}`
          : "No previous LIVE deployment.",
        run: () => performActivate(project, deployment),
      });
    },
    [setStatus, openConfirm, performActivate]
  );

  return { requestActivate };
}
