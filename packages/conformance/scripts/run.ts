// Runs a script under Node, as packages/tla-ts/scripts/run.ts does. Bun bundles the script into
// .scripts, beside scripts, so paths built from import.meta.dirname resolve as they do from the
// source.
// Usage: bun scripts/run.ts <script name> [arguments]

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const OUT_DIRECTORY = join(PACKAGE_DIRECTORY, ".scripts");

const name = process.argv[2];
const build = spawnSync(
  process.execPath,
  [
    "build",
    `scripts/${name}.ts`,
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
