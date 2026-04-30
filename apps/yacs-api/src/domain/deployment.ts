export interface Deployment {
  id: string;
  projectId: string;
  buildOutput: string;
  url: string;
  createdAt: string;
}

export function createDeployment(input: {
  id: string;
  projectId: string;
  buildOutput: string;
  url: string;
  createdAt: string;
}): Deployment {
  return { ...input };
}

export function buildDeploymentUrl(projectName: string, deploymentId: string): string {
  return `https://${projectName}-${deploymentId}.yacs.local`;
}
