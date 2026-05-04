import type { RequestUploadUrlsInput, UploadUrlResponse } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";
import { generateUploadSasUrl } from "../../infrastructure/storage";

/**
 * Generate SAS URLs for client to upload deployment files and manifest.
 */
export async function requestUploadUrlsFeature(
  deps: {
    unitOfWork: UnitOfWork;
    generateId: () => string;
    now: () => string;
    log: (message: string) => void;
  },
  projectId: string,
  input: RequestUploadUrlsInput
): Promise<UploadUrlResponse> {
  const { unitOfWork, generateId, now, log } = deps;
  const { files } = input;

  const project = await unitOfWork.projects.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  const deploymentId = generateId();
  const blobPrefix = `${projectId}/${deploymentId}`;
  const manifestPath = `${blobPrefix}/manifest.json`;

  await unitOfWork.transaction(async ({ deployments }) => {
    await deployments.create({
      id: deploymentId,
      projectId,
      buildOutput: project.name,
      url: "",
      status: "pending_upload",
      blobPrefix,
      manifestPath,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      fileCount: files.length,
      uploadExpiresAt: now(),
      createdAt: now(),
      completedAt: null,
    } as any);
  });

  const uploadUrls = files.map((file) => {
    const blobName = `${blobPrefix}/files/${file.path}`;
    return { path: file.path, sasUrl: generateUploadSasUrl(blobName) };
  });
  const expiresAt = new Date(
    Date.now() + Number(process.env.AZURE_SAS_EXPIRY_MINUTES ?? "60") * 60 * 1000
  ).toISOString();
  const manifestUrl = generateUploadSasUrl(manifestPath);

  log(`Generated upload URLs for deployment ${deploymentId}`);
  return { deploymentId, uploadUrls, manifestUrl, expiresAt };
}
