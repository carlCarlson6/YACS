-- Add deployment_status enum and upload-related columns for deployments
CREATE TYPE deployment_status AS ENUM (
  'pending_upload',
  'uploading',
  'processing',
  'active',
  'failed'
);

ALTER TABLE deployments
  ADD COLUMN status deployment_status NOT NULL DEFAULT 'pending_upload',
  ADD COLUMN blob_prefix TEXT NOT NULL,
  ADD COLUMN manifest_path TEXT NOT NULL,
  ADD COLUMN total_size INTEGER NOT NULL,
  ADD COLUMN file_count INTEGER NOT NULL,
  ADD COLUMN upload_expires_at TIMESTAMPTZ,
  ADD COLUMN completed_at TIMESTAMPTZ;
