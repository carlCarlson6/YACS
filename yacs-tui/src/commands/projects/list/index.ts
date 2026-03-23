import { config } from "../../../config";
import { Project } from "../project";


async function listProjects(): Promise<Project[]> {
  try {
    console.log(`🌐 Connecting to API at ${config.api.baseUrl}...`);
    const response = await fetch(`${config.api.baseUrl}/api/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(
      `API error: ${response.status} ${response.statusText}`
    );

    console.log(`✅ Successfully fetched projects from API.`);

    const data = await response.json() as Project[];
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch projects: ${error}`);
  }
}

export async function handleProjectList(): Promise<void> {
  try {
    console.log(`📚 Fetching projects...`);
    const projects = await listProjects();

    if (projects.length === 0) {
      console.log("ℹ️  No projects found.");
      return;
    }

    console.log(`✅ Found ${projects.length} project(s):\n`);
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Created: ${project.createdAt}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to fetch projects:", error);
    process.exit(1);
  }
}