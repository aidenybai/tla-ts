import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx}": "vp check --fix",
  },
  fmt: {
    semi: true,
    singleQuote: false,
    // One line per module keeps the recordings of SANY and tlapm small enough to commit.
    ignorePatterns: [
      "packages/tla-ts/tests/conformance/sany.json",
      "packages/tla-ts/tests/conformance/tlapm.json",
      "packages/tla-ts/tests/conformance/proofs.json",
      "packages/conformance/test",
      "packages/conformance/baselines",
    ],
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
        // TypeScript that tla-ts checks declares a variable without a value to start it at every
        // value of its type, and compares sets and records by value.
        files: ["packages/tla-ts/tests/fixtures/typescript/**/*.ts"],
        rules: { "no-unassigned-vars": "off", "no-constant-binary-expression": "off" },
      },
    ],
    // The conformance suite's TypeScript tests are other projects' code, kept as they wrote it.
    ignorePatterns: [
      "node_modules",
      "dist",
      "coverage",
      "pnpm-lock.yaml",
      "packages/conformance/test",
    ],
  },
});
