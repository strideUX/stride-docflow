export async function runHelp(): Promise<void> {
  // Keep help concise per acceptance criteria
  // eslint-disable-next-line no-console
  console.log(`Docflow CLI

Usage:
- Use the menu to choose: New, Status, Help, Exit
- Press Esc or Ctrl+C to exit
`);
}

