import type { DeploymentStatus } from "@yacs/schemas";

export interface Deployment {
  id: string;
  projectId: string;
  buildOutput: string;
  url: string;
  status?: DeploymentStatus;
  blobPrefix?: string;
  manifestPath?: string;
  totalSize?: number;
  fileCount?: number;
  uploadExpiresAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export function createDeployment(input: {
  id: string;
  projectId: string;
  buildOutput: string;
  url: string;
  createdAt: string;
  status?: DeploymentStatus;
  blobPrefix?: string;
  manifestPath?: string;
  totalSize?: number;
  fileCount?: number;
  uploadExpiresAt?: string | null;
  completedAt?: string | null;
}): Deployment {
  return { ...input };
}

export function buildDeploymentUrl(projectName: string, deploymentId: string): string {
  return `https://${projectName}-${deploymentId}.yacs.local`;
}
