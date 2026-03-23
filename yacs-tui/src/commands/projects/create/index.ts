import fs from "fs";
import path from "path";
import { fileExists, getAllFiles } from "../../../utils/file";
import { completeProjectInit, initProject, uploadProjectFiles } from "./api";

/**
 * Generate a random project name
 */
function generateRandomProjectName(): string {
  const adjectives = [
    "quick",
    "lazy",
    "happy",
    "swift",
    "bright",
    "bold",
    "calm",
    "cool",
  ];
  const nouns = [
    "falcon",
    "tiger",
    "eagle",
    "phoenix",
    "dragon",
    "wolf",
    "bear",
    "lion",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective}-${noun}-${number}`;
}

export async function handleProjectCreate(args: string[]): Promise<void> {
  const projectNameArg = args[0];
  const buildPathArg = args[1];

  // Generate random name if not provided or empty
  const projectName =
    projectNameArg && projectNameArg.trim()
      ? projectNameArg.trim()
      : generateRandomProjectName();

  // Use ./dist relative to cwd if not provided or empty
  const buildPath = buildPathArg && buildPathArg.trim() ? buildPathArg.trim() : "./dist";
  const resolvedBuildPath = path.resolve(process.cwd(), buildPath);

  try {
    const displayName = projectNameArg && projectNameArg.trim() ? projectName : "(random)";
    console.log(`📝 Creating project '${displayName}'...`);

    // Step 1: Validate that index.html exists in the buildPath
    const indexHtmlPath = path.join(resolvedBuildPath, "index.html");
    if (!fileExists(indexHtmlPath)) {
      console.error(
        `❌ Error: index.html not found in '${resolvedBuildPath}'`
      );
      console.error(`   Please ensure your project has a built index.html file.`);
      process.exit(1);
    }

    // Step 2: Initialize project (POST /api/projects/init)
    console.log(`📦 Initializing project...`);
    const initResponse = await initProject(projectName);
    const { projectId, uploadUrl } = initResponse;

    // Step 3: Upload project files
    console.log(`📤 Uploading project files...`);
    const files = getAllFiles(resolvedBuildPath);
    const fileData = files.map((filePath) => ({
      path: filePath,
      content: fs.readFileSync(filePath),
    }));

    await uploadProjectFiles(uploadUrl, fileData);

    // Step 4: Complete project initialization (POST /api/projects/init/complete/<projectId>)
    console.log(`✅ Finalizing project...`);
    const project = await completeProjectInit(projectId);

    // Update project with name and buildPath for display
    project.name = projectName;
    project.buildPath = resolvedBuildPath;

    console.log(`✅ Project created successfully!`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Status: ${project.status}`);
    console.log(`   URL: ${project.url}`);
  } catch (error) {
    console.error("❌ Failed to create project:", error);
    process.exit(1);
  }
}
