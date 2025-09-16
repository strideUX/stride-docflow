import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bin/docflow": "src/bin/docflow.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  target: "es2020",
  shims: true,
  splitting: false,
  outDir: "dist",
  banner: { js: "#!/usr/bin/env node" }, // add shebang so binary is executable
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
});
