import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx}": "vp check --fix",
  },
  fmt: {
    semi: true,
    singleQuote: false,
    // One line per module keeps SANY's recorded proof trees small enough to commit.
    ignorePatterns: ["packages/tla-ts/tests/conformance/sany.json"],
  },
  lint: {
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      eqeqeq: "warn",
      "no-console": "off",
    },
    overrides: [
      {
        // A tsprover model declares a variable without a value to start it at every value of its
        // type, and compares sets and records by value.
        files: ["**/*.proof.ts"],
        rules: { "no-unassigned-vars": "off", "no-constant-binary-expression": "off" },
      },
    ],
    ignorePatterns: ["node_modules", "dist", "coverage", "pnpm-lock.yaml"],
  },
});
