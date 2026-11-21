import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
// `--build <directory>` builds the script into that directory, with the graphs it reads written in,
// and runs nothing, for runs that start the bundle themselves, with the node on the PATH.
const buildIndex = process.argv.indexOf("--build");
const buildDirectory = buildIndex === -1 ? undefined : process.argv[buildIndex + 1];
const OUT_DIRECTORY = join(PACKAGE_DIRECTORY, buildDirectory ?? ".scripts");

const WORKER_ENTRIES = [
  "src/parallel-worker.ts",
  "src/prover/prove-worker.ts",
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
    "scripts/escore-graph.ts",
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
// ESCore's runtime is prepared on the host that runs the bundles, as its realm is the host's.
const runtimeGraph = spawnSync(
  "node",
  ["--stack-size=4000", join(OUT_DIRECTORY, "escore-graph.js"), OUT_DIRECTORY],
  { stdio: ["ignore", "ignore", "inherit"] },
);
if (runtimeGraph.status !== 0) process.exit(runtimeGraph.status ?? 1);

if (buildDirectory !== undefined) process.exit(0);
const run = spawnSync("node", [join(OUT_DIRECTORY, `${name}.js`), ...process.argv.slice(3)], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
