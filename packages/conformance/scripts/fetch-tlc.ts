import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { TLC_JAR } from "./hosts";

const REVISION = "309e489a512e8017f1cdc8388fa6a5e8a01cf597";

const getJarRevision = () =>
  spawnSync("unzip", ["-p", TLC_JAR, "META-INF/MANIFEST.MF"], {
    encoding: "utf8",
  }).stdout?.match(/^X-Git-Revision: (\w+)/m)?.[1];

if (existsSync(TLC_JAR) && getJarRevision() === REVISION) process.exit(0);

const runStep = (command: string, args: string[], directory: string) => {
  const result = spawnSync(command, args, {
    cwd: directory,
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status === 0) return;
  console.error(`\`${command} ${args.join(" ")}\` failed in ${directory}`);
  process.exit(1);
};

const checkout = mkdtempSync(join(tmpdir(), "tlaplus-"));
const project = join(checkout, "tlatools/org.lamport.tlatools");
runStep("git", ["init", "--quiet"], checkout);
runStep(
  "git",
  ["fetch", "--quiet", "--depth", "1", "https://github.com/tlaplus/tlaplus.git", REVISION],
  checkout,
);
runStep("git", ["checkout", "--quiet", "FETCH_HEAD"], checkout);
runStep(
  "ant",
  [
    "-quiet",
    "-f",
    "customBuild.xml",
    "compile",
    "compile-test",
    "dist",
    `-Dgit.revision=${REVISION}`,
    `-Dgit.shortRevision=${REVISION.slice(0, 7)}`,
  ],
  project,
);
mkdirSync(dirname(TLC_JAR), { recursive: true });
copyFileSync(join(project, "dist/tla2tools.jar"), TLC_JAR);
rmSync(checkout, { recursive: true, force: true });
console.log(`Wrote ${TLC_JAR}, built from tlaplus ${REVISION.slice(0, 7)}`);
