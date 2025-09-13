// @ts-check
import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "tsup.config.ts"],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        // Enable type-aware linting for rules like no-floating-promises
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
    },
  },
];
