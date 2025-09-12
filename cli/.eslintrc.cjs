module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["dist/"],
  rules: {
    // keep minimal; ready to expand for TS config later
  },
};

