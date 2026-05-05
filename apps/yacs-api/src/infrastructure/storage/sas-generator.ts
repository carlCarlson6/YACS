import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from "@azure/storage-blob";
import { containerClient } from "./azure-blob-client.js";

const { AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_SAS_EXPIRY_MINUTES = "60" } = process.env;

if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
  throw new Error(
    "Missing Azure Storage account credentials. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY."
  );
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY
);

const expiryMinutes = Number(AZURE_SAS_EXPIRY_MINUTES);

/**
 * Generate a write-only SAS URL for uploading a blob at the given path.
 * @param blobName Path within container (e.g. "{projectId}/{deploymentId}/files/index.html").
 * @returns Full URL including SAS token.
 */
export function generateUploadSasUrl(blobName: string): string {
  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerClient.containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn: new Date(),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential
  ).toString();

  return `${containerClient.url}/${blobName}?${sasToken}`;
}
