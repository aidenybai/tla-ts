// Runs a script under Node, so the backends it times get V8's speed, about 85 times Bun's on the SMT
// solver. Bun bundles the script and the worker entries scripts start into .scripts, which sits
// beside scripts, so paths built from import.meta.dirname resolve as they do from the source.
// Usage: bun scripts/run.ts <script name> [arguments]

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const OUT_DIRECTORY = join(PACKAGE_DIRECTORY, ".scripts");

const WORKER_ENTRIES = [
  "src/parallel-worker.ts",
  "src/prove/prove-worker.ts",
  "scripts/check-model.ts",
  "scripts/isabelle-conformance-worker.ts",
];

const name = process.argv[2];
const build = spawnSync(
  process.execPath,
  [
    "build",
    `scripts/${name}.ts`,
    ...WORKER_ENTRIES,
    "--target=node",
    "--packages=external",
    "--outdir",
    OUT_DIRECTORY,
    "--entry-naming",
    "[name].[ext]",
  ],
  { cwd: PACKAGE_DIRECTORY, stdio: ["ignore", "ignore", "inherit"] },
);
if (build.status !== 0) process.exit(build.status ?? 1);

const run = spawnSync("node", [join(OUT_DIRECTORY, `${name}.js`), ...process.argv.slice(3)], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
