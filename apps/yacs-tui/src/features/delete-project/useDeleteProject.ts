import { useCallback } from "react";
import type { Project } from "@yacs/schemas";
import { useApiUrl } from "../../shared/contexts/ApiContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useView } from "../../shared/contexts/ViewContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";

/**
 * Encapsulates the "delete project" use case: confirm dialog, deletion,
 * and post-delete navigation/state reset.
 */
export function useDeleteProject() {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const { openConfirm } = useConfirm();
  const { fetchProjects } = useProjects();
  const { setView, setSelectedProject, setSelectedDeployment } = useView();

  const performDelete = useCallback(
    async (project: Project) => {
      try {
        const res = await fetch(`${apiUrl}/projects/${project.id}`, { method: "DELETE" });
        if (res.ok) {
          setStatus(`> project "${project.name}" deleted`);
          setSelectedProject(0);
          setSelectedDeployment(0);
          await fetchProjects();
          setView("projects");
        } else {
          setStatus("! delete failed");
        }
      } catch {
        setStatus("! delete error");
      }
    },
    [apiUrl, setStatus, fetchProjects, setView, setSelectedProject, setSelectedDeployment]
  );

  const requestDelete = useCallback(
    async (project: Project) => {
      let depCount = 0;
      try {
        const res = await fetch(`${apiUrl}/projects/${project.id}/deployments`);
        if (res.ok) {
          const list = await res.json();
          depCount = Array.isArray(list) ? list.length : 0;
        }
      } catch {
        depCount = 0;
      }
      openConfirm({
        title: "// delete project //",
        message: `Permanently delete project "${project.name}"?`,
        detail: `This will remove the project and ${depCount} deployment(s). This cannot be undone.`,
        danger: true,
        run: () => performDelete(project),
      });
    },
    [apiUrl, openConfirm, performDelete]
  );

  return { requestDelete };
}
