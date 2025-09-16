import process from "node:process";
import { ensureEnv } from "./core/env.ts";
import { showMainMenu } from "./ui/menu.ts";
import { newProjectFlow } from "./program/newProject.ts";
import { runStatus } from "./commands/status/index.ts";
import { runHelp } from "./commands/help/index.ts";

export async function main(_args: string[] = []): Promise<void> {
  // Ensure environment before starting interactive loop
  try {
    ensureEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(message);
    return;
  }

  // Graceful Ctrl+C handling
  const onSigInt = () => {
    // eslint-disable-next-line no-console
    console.log("\nExiting Docflow. Bye!");
    process.exit(0);
  };
  process.once("SIGINT", onSigInt);

  // Main interactive loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choice = await showMainMenu();
    if (choice === "exit") break;

    try {
      if (choice === "new") {
        await newProjectFlow();
      } else if (choice === "status") {
        await runStatus();
      } else if (choice === "help") {
        await runHelp();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(msg);
    }
  }
}
