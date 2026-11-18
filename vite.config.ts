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
      "packages/website/.next",
      "packages/website/.scripts",
      "packages/website/src/generated",
      "packages/website/next-env.d.ts",
    ],
  },
  lint: {
    jsPlugins: ["@shadcn/lint"],
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
        files: ["packages/website/src/**/*.tsx"],
        rules: {
          "shadcn/no-raw-colors": "error",
          "shadcn/no-unknown-classes": "error",
        },
      },
      {
        files: ["packages/tla-ts/tests/fixtures/typescript/**/*.ts"],
        rules: { "no-unassigned-vars": "off", "no-constant-binary-expression": "off" },
      },
    ],
    ignorePatterns: [
      "node_modules",
      "dist",
      "coverage",
      "pnpm-lock.yaml",
      "packages/website/.next",
      "packages/website/.scripts",
      "packages/website/src/generated",
    ],
  },
});
