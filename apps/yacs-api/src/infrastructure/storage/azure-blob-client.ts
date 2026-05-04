import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const {
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY,
  AZURE_STORAGE_CONTAINER_NAME,
} = process.env;

if (!AZURE_STORAGE_CONNECTION_STRING && (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY)) {
  throw new Error(
    "Azure Storage credentials are not configured. Provide AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY."
  );
}

if (!AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error("Azure Storage container name is not configured. Set AZURE_STORAGE_CONTAINER_NAME.");
}

export const blobServiceClient = AZURE_STORAGE_CONNECTION_STRING
  ? BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  : new BlobServiceClient(
      `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT_NAME!,
        AZURE_STORAGE_ACCOUNT_KEY!
      )
    );

export const containerClient = blobServiceClient.getContainerClient(
  AZURE_STORAGE_CONTAINER_NAME
);
