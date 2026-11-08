import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TLAPM_BACKENDS, TLAPM_BINARY, TLAPM_DIRECTORY } from "./tlapm";

const RELEASES: Record<string, { name: string; sha256: string }> = {
  "darwin-arm64": {
    name: "tlapm-1.6.0-pre-arm64-darwin.tar.gz",
    sha256: "1e7a66a6b69a3c830d5d19543fd64dc3ef5c6393fd7a11820c7fb61e6d772c24",
  },
  "linux-x64": {
    name: "tlapm-1.6.0-pre-x86_64-linux-gnu.tar.gz",
    sha256: "9ce497d92f96907ea205badb44dee0436260b898a4c415de22eabd52cfc0ec07",
  },
};
const REVISION = "b91fb6c";
// The release bundles an x86_64 Z3 4.8.9, but the recordings come from Z3 5.3.2.
const Z3_VERSION = "Z3 version 5.3.2";

const getVersion = (command: string, args: string[]) =>
  spawnSync(command, args, { encoding: "utf8" }).stdout?.trim() ?? "";

const z3 = spawnSync("sh", ["-c", "command -v z3"], { encoding: "utf8" }).stdout.trim();
if (!z3 || !getVersion(z3, ["--version"]).startsWith(Z3_VERSION)) {
  console.error(`Put ${Z3_VERSION} on PATH as z3 first`);
  process.exit(1);
}

const isFetched = existsSync(TLAPM_BINARY) && getVersion(TLAPM_BINARY, ["--version"]) === REVISION;
if (!isFetched) {
  const release = RELEASES[`${process.platform}-${process.arch}`];
  if (!release) {
    console.error(`tlapm publishes no build for ${process.platform}-${process.arch}`);
    process.exit(1);
  }
  const url = `https://github.com/tlaplus/tlapm/releases/download/1.6.0-pre/${release.name}`;
  const response = await fetch(url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== release.sha256) {
    console.error(
      `The download from ${url} does not match the pinned digest. The rolling release has moved past ${REVISION}, so build tlapm ${REVISION} from source into ${TLAPM_DIRECTORY}.`,
    );
    process.exit(1);
  }
  const archive = join(tmpdir(), "tlapm.tar.gz");
  writeFileSync(archive, bytes);
  rmSync(TLAPM_DIRECTORY, { recursive: true, force: true });
  mkdirSync(TLAPM_DIRECTORY, { recursive: true });
  spawnSync("tar", ["-xzf", archive, "-C", TLAPM_DIRECTORY, "--strip-components", "1"], {
    stdio: "inherit",
  });
  rmSync(archive);
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
