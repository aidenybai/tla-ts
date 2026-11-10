import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TYPESCRIPT_DIRECTORY, TYPESCRIPT_REVISION } from "./typescript";

const getRevision = () =>
  spawnSync("git", ["-C", TYPESCRIPT_DIRECTORY, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout?.trim();

if (existsSync(TYPESCRIPT_DIRECTORY) && getRevision() === TYPESCRIPT_REVISION) process.exit(0);

const runStep = (command: string, args: string[]) => {
  const result = spawnSync(command, args, {
    cwd: TYPESCRIPT_DIRECTORY,
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status === 0) return;
  console.error(`\`${command} ${args.join(" ")}\` failed in ${TYPESCRIPT_DIRECTORY}`);
  process.exit(1);
};

rmSync(TYPESCRIPT_DIRECTORY, { recursive: true, force: true });
mkdirSync(TYPESCRIPT_DIRECTORY, { recursive: true });
runStep("git", ["init", "--quiet"]);
runStep("git", ["sparse-checkout", "set", "src", "tests/cases", "scripts"]);
runStep("git", [
  "fetch",
  "--quiet",
  "--depth",
  "1",
  "--filter=blob:none",
  "https://github.com/microsoft/TypeScript.git",
  TYPESCRIPT_REVISION,
]);
runStep("git", ["checkout", "--quiet", "FETCH_HEAD"]);
// The compiler imports the diagnostics that TypeScript's build generates.
runStep("node", ["scripts/processDiagnosticMessages.mjs", "src/compiler/diagnosticMessages.json"]);
// The projects type check against the declarations of TypeScript's development dependencies, at the
// versions its lockfile pins. npm installs them beside the checkout, as in the checkout it would
// install every dependency.
const manifest = JSON.parse(readFileSync(join(TYPESCRIPT_DIRECTORY, "package.json"), "utf8"));
const lockfile = JSON.parse(readFileSync(join(TYPESCRIPT_DIRECTORY, "package-lock.json"), "utf8"));
const types = Object.keys(manifest.devDependencies)
  .filter((name) => name.startsWith("@types/"))
  .map((name) => `${name}@${lockfile.packages[`node_modules/${name}`].version}`);
const typesDirectory = `${TYPESCRIPT_DIRECTORY}-types`;
rmSync(typesDirectory, { recursive: true, force: true });
mkdirSync(typesDirectory);
// Without a package.json of its own, npm installs into the nearest package above.
writeFileSync(join(typesDirectory, "package.json"), "{}\n");
const install = spawnSync("npm", ["install", "--no-save", "--ignore-scripts", ...types], {
  cwd: typesDirectory,
  stdio: ["ignore", "ignore", "inherit"],
});
if (install.status !== 0) {
  console.error(`\`npm install ${types.join(" ")}\` failed`);
  process.exit(1);
}
renameSync(join(typesDirectory, "node_modules"), join(TYPESCRIPT_DIRECTORY, "node_modules"));
rmSync(typesDirectory, { recursive: true, force: true });
// Projects type check against the declarations of the projects they reference. The test projects
// fail to build without mocha's types, and nothing references them.
spawnSync(join(import.meta.dirname, "../node_modules/.bin/tsc"), ["-b", "src/tsconfig.json"], {
  cwd: TYPESCRIPT_DIRECTORY,
  stdio: "ignore",
});
console.log(`Wrote ${TYPESCRIPT_DIRECTORY} at TypeScript ${TYPESCRIPT_REVISION.slice(0, 7)}`);
