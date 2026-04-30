export type Deployment = {
  id: string;
  projectId: string;
  createdAt: string;
  url?: string;
};

export type View =
  | "projects"
  | "detail"
  | "create"
  | "update"
  | "deploy";
