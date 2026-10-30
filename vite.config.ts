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
    ignorePatterns: ["node_modules", "dist", "coverage", "pnpm-lock.yaml"],
  },
});
