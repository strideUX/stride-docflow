export function allocIds(counts: { F: number; C: number; S: number }): {
  nextF: () => string;
  nextC: () => string;
  nextS: () => string;
} {
  return {
    nextF: () => `F${String(++counts.F).padStart(3, "0")}`,
    nextC: () => `C${String(++counts.C).padStart(3, "0")}`,
    nextS: () => `S${String(++counts.S).padStart(3, "0")}`,
  };
}
