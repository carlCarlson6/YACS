#!/usr/bin/env node
import { config } from "dotenv";
config(); // Load .env file
import { helpDisplay } from "./commands/help";
import { handleProjectCommand } from "./commands/projects";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    displayHelp();
    process.exit(0);
  }

  const [command, ...commandArgs] = args;

  try {
    switch (command) {
      case "project":
        await handleProjectCommand(commandArgs);
        break;
      case "--help":
      case "-h":
        displayHelp();
        break;
      default:
        console.error(`❌ Unknown command '${command}'`);
        displayHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

function displayHelp(): void {
  console.log(helpDisplay);
}

main();
