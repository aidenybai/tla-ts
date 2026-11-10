import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const OUT_DIRECTORY = join(PACKAGE_DIRECTORY, ".scripts");

const name = process.argv[2];
// The bundles carry their dependencies, as the TypeScript hosts import tla-ts's, which this package
// doesn't install.
const build = spawnSync(
  process.execPath,
  [
    "build",
    `scripts/${name}.ts`,
    "scripts/typescript-oracle.ts",
    "scripts/tla-ts-typescript.ts",
    "--target=node",
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
