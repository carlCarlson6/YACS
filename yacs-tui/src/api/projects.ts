// Mocked API calls for project management
// TODO: Replace with actual API calls later

import path from "path";
import { config } from "../config";

export interface Project {
  id: string;
  name: string;
  buildPath: string;
  url: string;
  createdAt: string;
  status: string;
}

export interface InitProjectResponse {
  projectId: string;
  uploadUrl: string;
}

/**
 * Mock API call to initialize a project
 * POST /api/projects/init
 */
export async function initProject(projectName: string): Promise<InitProjectResponse> {
  try {
    const response = await fetch(`${config.api.baseUrl}/api/projects/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as InitProjectResponse;
    return data;
  } catch (error) {
    throw new Error(`Failed to initialize project: ${error}`);
  }
}

/**
 * Mock API call to upload project files
 * Simulates uploading to the uploadUrl
 */
export async function uploadProjectFiles(
  uploadUrl: string,
  files: Array<{ path: string; content: Buffer }>
): Promise<void> {
  try {
    if (!uploadUrl) {
      throw new Error("Invalid upload URL");
    }

    // Create FormData and append all files
    const formData = new FormData();
    
    for (const file of files) {
      const blob = new Blob([file.content]);
      formData.append("files", blob, file.path);
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    throw new Error(`Failed to upload project files: ${error}`);
  }
}

/**
 * Mock API call to complete project initialization
 * POST /api/projects/init/complete/<projectId>
 */
export async function completeProjectInit(projectId: string): Promise<Project> {
  try {
    const response = await fetch(
      `${config.api.baseUrl}/api/projects/init/complete/${projectId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as Project;
    return data;
  } catch (error) {
    throw new Error(`Failed to complete project initialization: ${error}`);
  }
}

/**
 * Mock API call to create a new project (deprecated - use init/upload/complete flow instead)
 */
export async function createProject(
  projectName: string,
  buildPath?: string
): Promise<Project> {
  // Use ./dist relative to cwd if not provided or empty
  const finalBuildPath = buildPath && buildPath.trim() ? buildPath.trim() : "./dist";
  const resolvedBuildPath = path.resolve(process.cwd(), finalBuildPath);

  // Generate fake URL
  const fakeUrl = `${config.api.baseUrl}/api/projects/${projectName.toLowerCase().replace(/\s+/g, "-")}`;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response
  return {
    id: `proj_${Date.now()}`,
    name: projectName,
    buildPath: resolvedBuildPath,
    url: fakeUrl,
    createdAt: new Date().toISOString(),
    status: "active",
  };
}

/**
 * Mock API call to get list of user projects
 */
export async function listProjects(): Promise<Project[]> {
  try {
    const response = await fetch(`${config.api.baseUrl}/api/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as Project[];
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch projects: ${error}`);
  }
}
