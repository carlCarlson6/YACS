import { handleProjectCreate } from "./create";
import { handleProjectList } from "./list";

export async function handleProjectCommand(args: string[]): Promise<void> {
  const [action, ...actionArgs] = args;

  if (!action) {
    console.error("❌ No action specified. Usage: project <create|list> [options]");
    process.exit(1);
  }

  switch (action) {
    case "create":
      await handleProjectCreate(actionArgs);
      break;
    case "list":
      await handleProjectList();
      break;
    default:
      console.error(
        `❌ Unknown action '${action}'. Available actions: create, list`
      );
      process.exit(1);
  }
}

