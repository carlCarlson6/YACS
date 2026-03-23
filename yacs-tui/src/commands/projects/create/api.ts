// Mocked API calls for project management
// TODO: Replace with actual API calls later

import path from "path";
import { config } from "../../../config";
import { Project } from "../project";

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
