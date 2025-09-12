import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

function which(cmd: string): boolean {
  const isWin = process.platform === "win32";
  if (isWin) {
    const res = spawnSync("where", [cmd], { stdio: "ignore" });
    return res.status === 0;
  }
  const res = spawnSync("sh", ["-lc", `command -v ${cmd} >/dev/null 2>&1`], { stdio: "ignore" });
  return res.status === 0;
}

/**
 * Best-effort editor detection.
 * Order: cursor -w > code -w > $VISUAL > $EDITOR > null
 */
export function detectEditor(): string | null {
  // Prefer Cursor
  if (which("cursor")) return "cursor -w";
  // Then VS Code
  if (which("code")) return "code -w";
  // Then VISUAL/EDITOR
  if (process.env.VISUAL && process.env.VISUAL.trim()) return process.env.VISUAL.trim();
  if (process.env.EDITOR && process.env.EDITOR.trim()) return process.env.EDITOR.trim();
  return null;
}

function splitCmd(cmd: string): { bin: string; args: string[] } {
  // Simple whitespace split; callers should provide quoted values if needed.
  const parts = cmd.split(/\s+/).filter(Boolean);
  const [bin, ...args] = parts.length > 0 ? parts : [cmd];
  return { bin, args };
}

/**
 * Opens the given path in the detected editor and waits for exit.
 */
export async function openInEditor(tmpPath: string): Promise<number> {
  const detected = detectEditor();
  if (!detected) throw new Error("No editor detected. Set $VISUAL or $EDITOR.");

  const { bin, args } = splitCmd(detected);
  return await new Promise<number>((resolve, reject) => {
    const child = spawn(bin, [...args, tmpPath], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}
