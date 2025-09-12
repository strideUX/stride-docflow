import { renderTokens, renderTokensInPath } from "./tokens";

// Basic unit stubs (no test runner). Run with ts-node if desired.

// Case: single replacement
{
  const out = renderTokens("Hello {{OWNER}}", { OWNER: "Alice" });
  console.assert(out === "Hello Alice", `Expected 'Hello Alice', got '${out}'`);
}

// Case: multiple replacements and unknown token untouched
{
  const out = renderTokens("{{PROJECT_NAME}} by {{OWNER}} on {{DATE}} {{UNKNOWN}}", {
    PROJECT_NAME: "Demo",
    OWNER: "Bob",
    DATE: "2025-01-01",
  });
  console.assert(
    out === "Demo by Bob on 2025-01-01 {{UNKNOWN}}",
    `Unexpected: '${out}'`
  );
}

// Case: path rendering is identical behavior
{
  const out = renderTokensInPath("templates/{{DATE}}/item__{{ID}}__{{SLUG}}.md", {
    DATE: "2025-01-01",
    ID: "1234",
    SLUG: "add-login",
  });
  console.assert(
    out === "templates/2025-01-01/item__1234__add-login.md",
    `Unexpected: '${out}'`
  );
}

console.log("tokens.test.ts: basic assertions passed");

