import pc from "picocolors";

/**
 * Formats a message as a red, readable block.
 */
export function formatError(message: string): string {
  // Simple, readable block without heavy box-drawing for broad terminal support
  const lines = message.split("\n");
  return lines.map((l) => pc.red(l)).join("\n");
}

/**
 * Prints an error and exits non-zero.
 */
export function printErrorAndExit(message: string, code = 1): never {
  // eslint-disable-next-line no-console
  console.error(formatError(message));
  // Using process.exit here is acceptable since this is a CLI bin helper
  // and the caller expects termination on fatal configuration errors.
  // istanbul ignore next
  process.exit(code);
}

