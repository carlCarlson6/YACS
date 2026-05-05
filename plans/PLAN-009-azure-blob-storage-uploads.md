# PLAN-009: Azure Blob Storage for Deployment Uploads

## Goal
Implement file upload functionality for deployments using Azure Blob Storage. The backend will generate pre-signed SAS URLs for direct client uploads from `/dist` or `/build` directories, and handle upload completion notifications.

## Context
Currently, deployments store only `buildOutput` metadata. This plan enables actual file uploads of built artifacts to Azure Blob Storage, providing:
- Secure, time-limited upload URLs (SAS tokens)
- Direct client-to-storage uploads (no backend proxy)
- Upload completion tracking
- Organized blob structure per project/deployment

## Architecture Overview

```
┌─────────────┐    1. Request Upload URL     ┌─────────────┐
│   TUI CLI   │ ───────────────────────────► │   YACS API  │
│             │ ◄─────────────────────────── │             │
│             │    2. Return SAS URL         │             │
│             │                              │             │
│             │    3. Upload files directly  │             │
│             │ ───────────────────────────► │ Azure Blob  │
│             │                              │   Storage   │
│             │    4. Notify upload complete │             │
│             │ ───────────────────────────► │   YACS API  │
└─────────────┘                              └─────────────┘
```

## Azure Blob Storage Structure

```
yacs-deployments/                    # Container
├── {project-id}/                    # Virtual folder per project
│   ├── {deployment-id}/             # Virtual folder per deployment
│   │   ├── manifest.json            # Upload manifest (file list, checksums)
│   │   └── files/                   # Actual built files
│   │       ├── index.html
│   │       ├── assets/
│   │       │   ├── main.js
│   │       │   └── style.css
│   │       └── ...
```

## New API Endpoints

### `POST /api/projects/:projectId/deployments/upload-url`
Request a pre-signed SAS URL for uploading deployment files.

**Request Body:**
```json
{
  "files": [
    { "path": "index.html", "size": 1024, "contentType": "text/html" },
    { "path": "assets/main.js", "size": 50000, "contentType": "application/javascript" }
  ]
}
```

**Response:**
```json
{
  "deploymentId": "uuid",
  "uploadUrls": [
    { "path": "index.html", "sasUrl": "https://account.blob.core.windows.net/..." },
    { "path": "assets/main.js", "sasUrl": "https://account.blob.core.windows.net/..." }
  ],
  "manifestUrl": "https://account.blob.core.windows.net/...",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### `POST /api/deployments/:id/upload-complete`
Notify the backend that all files have been uploaded.

**Request Body:**
```json
{
  "manifest": {
    "files": [
      { "path": "index.html", "size": 1024, "checksum": "sha256:..." }
    ],
    "totalSize": 51024,
    "uploadedAt": "2024-01-01T11:55:00Z"
  }
}
```

**Response:**
```json
{
  "deployment": { /* full deployment object */ },
  "status": "active"
}
```

## Schema Changes

### `@yacs/schemas` Updates

```typescript
// New schemas for upload flow
export const uploadFileInfoSchema = z.object({
  path: z.string(),
  size: z.number().int().positive(),
  contentType: z.string().optional(),
});
export type UploadFileInfo = z.infer<typeof uploadFileInfoSchema>;

export const requestUploadUrlsInputSchema = z.object({
  files: z.array(uploadFileInfoSchema).min(1),
});
export type RequestUploadUrlsInput = z.infer<typeof requestUploadUrlsInputSchema>;

export const uploadUrlResponseSchema = z.object({
  deploymentId: z.string(),
  uploadUrls: z.array(z.object({
    path: z.string(),
    sasUrl: z.string().url(),
  })),
  manifestUrl: z.string().url(),
  expiresAt: z.string(),
});
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;

export const uploadManifestSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    size: z.number().int().positive(),
    checksum: z.string(),
  })),
  totalSize: z.number().int().positive(),
  uploadedAt: z.string(),
});
export type UploadManifest = z.infer<typeof uploadManifestSchema>;

export const uploadCompleteInputSchema = z.object({
  manifest: uploadManifestSchema,
});
export type UploadCompleteInput = z.infer<typeof uploadCompleteInputSchema>;

// Update deployment status enum
export const deploymentStatusSchema = z.enum([
  "pending_upload",  // Upload URLs generated, awaiting files
  "uploading",       // Files being uploaded
  "processing",      // Upload complete, validating
  "active",          // Deployment live
  "failed",          // Upload or validation failed
]);
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;
```

### Database Schema Updates

```typescript
// Add to deployments table
export const deploymentStatusEnum = pgEnum("deployment_status", [
  "pending_upload",
  "uploading",
  "processing",
  "active",
  "failed",
]);

export const deployments = pgTable("deployments", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  buildOutput: text("build_output").notNull(),
  url: text("url").notNull().unique(),
  status: deploymentStatusEnum("status").notNull().default("pending_upload"),
  blobPrefix: text("blob_prefix"),           // e.g., "{projectId}/{deploymentId}"
  manifestPath: text("manifest_path"),       // Path to manifest.json in blob storage
  totalSize: integer("total_size"),          // Total bytes uploaded
  fileCount: integer("file_count"),          // Number of files
  uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
});
```

## File Changes

### 1. `apps/yacs-api/package.json` (Updated)
Add Azure Storage SDK dependency.
```json
{
  "dependencies": {
    "@azure/storage-blob": "^12.x"
  }
}
```

### 2. `apps/yacs-api/src/infrastructure/storage/` (New Directory)

#### `azure-blob-client.ts`
Initialize Azure Blob Storage client with connection string or account credentials.

#### `sas-generator.ts`
Generate SAS tokens for blob uploads with:
- Time-limited expiration (default: 1 hour)
- Write-only permissions for uploads
- Scoped to specific blob paths

#### `index.ts`
Central exports for storage infrastructure.

### 3. `apps/yacs-api/src/infrastructure/db/schema.ts` (Updated)
Add deployment status enum and new columns.

### 4. `shared/schemas/src/index.ts` (Updated)
Add new schemas for upload flow.

### 5. `apps/yacs-api/src/features/deployments/` (New/Updated)

#### `request-upload-urls.ts` (New)
Feature handler for generating upload URLs:
1. Validate project exists
2. Create deployment record with `pending_upload` status
3. Generate SAS URLs for each file
4. Return upload URLs with expiration

#### `complete-upload.ts` (New)
Feature handler for upload completion:
1. Validate deployment exists and is in correct state
2. Verify uploaded files match manifest (optional: validate checksums)
3. Update deployment status to `active`
4. Update project's `currentDeploymentId`

#### `routes.ts` (Updated)
Add new route handlers.

### 6. `apps/yacs-api/src/domain/` (Updated)

#### `deployment.ts` (Updated)
Add domain logic for deployment status transitions.

#### `storage.ts` (New)
Domain interfaces for storage operations.

### 7. `apps/yacs-api/.env.example` (Updated)
Add Azure Storage configuration variables.
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
# OR use account name + key
AZURE_STORAGE_ACCOUNT_NAME=yacsdeployments
AZURE_STORAGE_ACCOUNT_KEY=...
AZURE_STORAGE_CONTAINER_NAME=yacs-deployments
```

### 8. `apps/yacs-tui/src/features/` (Updated)
Update deploy flow to:
1. Scan `/dist` or `/build` directory
2. Request upload URLs from API
3. Upload files directly to Azure Blob Storage
4. Notify API of completion

### 9. Drizzle Migration (New)
Create migration for deployment status and storage columns.

## Implementation Steps

### Phase 1: Infrastructure
1. Add `@azure/storage-blob` dependency to `@yacs/api`
2. Create Azure Blob Storage client infrastructure
3. Implement SAS URL generation service
4. Add environment configuration for Azure credentials

### Phase 2: Schema & Database
5. Update `@yacs/schemas` with new types
6. Update database schema with deployment status and storage columns
7. Generate and run Drizzle migration

### Phase 3: API Endpoints
8. Implement `request-upload-urls` feature
9. Implement `complete-upload` feature
10. Add new routes to deployment router
11. Update existing deployment creation flow

### Phase 4: TUI Integration
12. Update TUI deploy command to use new upload flow
13. Implement parallel file uploads with progress display
14. Add upload error handling and retry logic

### Phase 5: Testing & Validation
15. Test with Azure Storage emulator (Azurite) for local development
16. Add to docker-compose for local Azure emulation
17. Verify end-to-end upload flow

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string (alternative to account/key) | No* |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | No* |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage account access key | No* |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | Yes |
| `AZURE_SAS_EXPIRY_MINUTES` | SAS URL expiration in minutes (default: 60) | No |

*Either connection string OR account name + key required.

## Security Considerations

1. **SAS Token Scope**: Generate SAS tokens scoped to specific blob paths only
2. **Expiration**: Short-lived tokens (1 hour default) to limit exposure
3. **Write-Only**: Upload SAS tokens should only allow write, not read/delete
4. **Validation**: Verify file checksums on upload completion
5. **Size Limits**: Enforce maximum deployment size limits

## Local Development

For local development, use Azurite (Azure Storage Emulator):

```yaml
# docker-compose.yml addition
services:
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"  # Blob service
      - "10001:10001"  # Queue service
      - "10002:10002"  # Table service
    volumes:
      - azurite-data:/data
    command: azurite --blobHost 0.0.0.0 --queueHost 0.0.0.0 --tableHost 0.0.0.0

volumes:
  azurite-data:
```

Local connection string:
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

## Status
Completed

## Dependencies
- PLAN-007 (PostgreSQL + Drizzle) - Completed
