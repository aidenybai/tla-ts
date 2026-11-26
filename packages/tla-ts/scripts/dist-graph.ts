// Writes the graph of JS.tla's prepared runtime into the package's bundles, so that a process reads
// the runtime rather than prepares it, which takes a deeper stack than Node's default. The realm is
// the host's, so Node, with a deeper stack, prepares it, from a bundle of js-tla-graph.ts.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const OUT_DIRECTORY = join(PACKAGE_DIRECTORY, ".scripts");

const steps = [
  [
    process.execPath,
    "build",
    "scripts/js-tla-graph.ts",
    "--target=node",
    "--packages=external",
    "--outdir",
    OUT_DIRECTORY,
  ],
  [
    "node",
    "--stack-size=4000",
    join(OUT_DIRECTORY, "js-tla-graph.js"),
    join(PACKAGE_DIRECTORY, "dist"),
  ],
];
for (const step of steps) {
  const run = spawnSync(step[0], step.slice(1), {
    cwd: PACKAGE_DIRECTORY,
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (run.status !== 0) process.exit(run.status ?? 1);
}
