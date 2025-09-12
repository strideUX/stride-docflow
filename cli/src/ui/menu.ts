import { select, isCancel, cancel, intro, outro } from "clack";

export type MainMenuAction = "new" | "status" | "help" | "exit";

/**
 * Shows the Docflow main menu and returns the chosen action.
 */
export async function showMainMenu(): Promise<MainMenuAction> {
  // Provide a lightweight intro only once per menu loop iteration
  intro("Docflow");

  const action = await select({
    message: "What would you like to do?",
    options: [
      { value: "new", label: "New" },
      { value: "status", label: "Status" },
      { value: "help", label: "Help" },
      { value: "exit", label: "Exit" },
    ],
  });

  if (isCancel(action)) {
    cancel("Exiting");
    // Indicate an exit request
    return "exit";
  }

  // Close section footer for tidier UX between loops
  outro("");

  return action as MainMenuAction;
}

