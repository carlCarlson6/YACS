import { useCallback, useState } from "react";
import { deploymentSchema } from "@yacs/schemas";
import type { Deployment } from "../../shared/types";

const deploymentListSchema = deploymentSchema.array();
import { useApiUrl } from "../../shared/contexts/ApiContext";
import { useStatus } from "../../shared/contexts/StatusContext";

export function useDeployments() {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  const fetchDeployments = useCallback(
    async (projectId: string) => {
      try {
        const res = await fetch(`${apiUrl}/projects/${projectId}/deployments`);
        const data = deploymentListSchema.parse(await res.json());
        setDeployments(data);
        setStatus("> deployments loaded");
      } catch {
        setStatus("! error fetching deployments");
      }
    },
    [apiUrl, setStatus]
  );

  return { deployments, fetchDeployments, setDeployments };
}
