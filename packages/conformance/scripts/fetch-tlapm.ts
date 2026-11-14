import { spawnSync } from "node:child_process";
import { lstatSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { TLAPM_BACKENDS, TLAPM_BINARY, TLAPM_DIRECTORY } from "./tlapm";

const REVISION = "b91fb6c46c39895841cc29eafedc3661ef09628b";
// The release bundles an x86_64 Z3 4.8.9, but the recordings come from Z3 5.3.2.
const Z3_VERSION = "Z3 version 5.3.2";

const getVersion = (command: string, args: string[]) =>
  spawnSync(command, args, { encoding: "utf8" }).stdout?.trim() ?? "";

const z3 = spawnSync("sh", ["-c", "command -v z3"], { encoding: "utf8" }).stdout.trim();
if (!z3 || !getVersion(z3, ["--version"]).startsWith(Z3_VERSION)) {
  console.error(`Put ${Z3_VERSION} on PATH as z3 first`);
  process.exit(1);
}

const runStep = (script: string, directory: string) => {
  const result = spawnSync("sh", ["-c", `eval "$(opam env)" && ${script}`], {
    cwd: directory,
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status === 0) return;
  console.error(`\`${script}\` failed in ${directory}`);
  process.exit(1);
};

if (getVersion(TLAPM_BINARY, ["--version"]) !== REVISION.slice(0, 7)) {
  const checkout = mkdtempSync(join(tmpdir(), "tlapm-"));
  runStep("git init --quiet", checkout);
  runStep(`git fetch --quiet --depth 1 https://github.com/tlaplus/tlapm.git ${REVISION}`, checkout);
  runStep("git checkout --quiet FETCH_HEAD", checkout);
  runStep("make opam-deps && make opam-deps-opt", checkout);
  // HACK: tlapm's own release workflow retries the build, which fails at random (tlapm#88).
  runStep("for attempt in 1 2 3 4 5; do make clean && make && exit 0; done; exit 1", checkout);
  rmSync(TLAPM_DIRECTORY, { recursive: true, force: true });
  mkdirSync(dirname(TLAPM_DIRECTORY), { recursive: true });
  runStep(
    `dune install --relocatable --prefix _build/tlapm && mv _build/tlapm ${TLAPM_DIRECTORY}`,
    checkout,
  );
  rmSync(checkout, { recursive: true, force: true });
}
const z3Link = join(TLAPM_BACKENDS, "z3");
const isLinked = lstatSync(z3Link).isSymbolicLink() && readlinkSync(z3Link) === z3;
if (!isLinked) {
  rmSync(z3Link);
  symlinkSync(z3, z3Link);
}
console.log(
  `tlapm ${getVersion(TLAPM_BINARY, ["--version"])} is in ${TLAPM_DIRECTORY}, with ${z3}`,
);
