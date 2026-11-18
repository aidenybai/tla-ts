import { join } from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // The site compiles the library's source, which lives beside it in the workspace.
  turbopack: {
    root: join(import.meta.dirname, "../.."),
    // The library names its Node workers by the files it is published with.
    resolveAlias: {
      "./parallel-worker.js": "../tla-ts/src/parallel-worker.ts",
      "./prove-worker.js": "../tla-ts/src/prover/prove-worker.ts",
    },
  },
  // `pnpm typecheck` checks the types, with the workspace's own compiler.
  typescript: { ignoreBuildErrors: true },
  // The workspace has its own AGENTS.md at its root.
  agentRules: false,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(","),
};

export default config;
