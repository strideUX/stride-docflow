import pc from "picocolors";
import type { ProjectSpec, SeedItem } from "../core/types.js";

function fmtList(items?: string[]): string {
  if (!items || items.length === 0) return pc.dim("-");
  return items.join(", ");
}

function pad(str: string, len: number): string {
  return (str || "").padEnd(len, " ");
}

/**
 * Prints a concise Project Charter and a seed items table.
 */
export function printPlanSummary(spec: ProjectSpec): void {
  const lines: string[] = [];

  // Header
  lines.push(pc.bold("Project Charter"));
  lines.push("");

  // Meta + framing
  lines.push(`${pc.bold("Name:")} ${spec.meta.projectName}`);
  lines.push(`${pc.bold("Owner:")} ${spec.meta.owner}`);
  lines.push(`${pc.bold("Platform:")} ${spec.meta.platform}`);
  lines.push(`${pc.bold("Pack:")} ${spec.meta.packName}@${spec.meta.packVersion}`);
  lines.push("");
  lines.push(pc.bold("Goal:"));
  lines.push(`  ${spec.framing.goal}`);
  lines.push("");
  if (spec.framing.outcomes?.length) {
    lines.push(pc.bold("Outcomes:"));
    spec.framing.outcomes.forEach((o, i) => lines.push(`  ${i + 1}. ${o}`));
    lines.push("");
  }
  if (spec.framing.constraints?.length) {
    lines.push(`${pc.bold("Constraints:")} ${fmtList(spec.framing.constraints)}`);
  }
  if (spec.framing.nonGoals?.length) {
    lines.push(`${pc.bold("Non-goals:")} ${fmtList(spec.framing.nonGoals)}`);
  }

  // Table header
  lines.push("");
  lines.push(pc.bold("Seed Items"));

  const items: SeedItem[] = spec.iteration.seedItems || [];

  // Calculate simple column widths
  const colId = Math.max(2, ...items.map((it) => String(it.id ?? "").length));
  const colType = Math.max(4, ...items.map((it) => (it.type || "").length));
  const colTitle = Math.max(5, ...items.map((it) => (it.title || "").length));
  const colPrio = 8;
  const colCx = 10;
  const colDep = 10;

  const header = [
    pad("id", colId),
    pad("type", colType),
    pad("title", colTitle),
    pad("priority", colPrio),
    pad("complexity", colCx),
    pad("dependsOn", colDep),
  ].join("  ");
  lines.push(pc.dim(header));

  for (const it of items) {
    const deps = (it.dependencies ?? []).join(", ");
    const row = [
      pad(String(it.id ?? ""), colId),
      pad(it.type, colType),
      pad(it.title, colTitle),
      pad(it.priority ?? "", colPrio),
      pad(it.complexity ?? "", colCx),
      pad(deps, colDep),
    ].join("  ");
    lines.push(row);
  }

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"));
}

