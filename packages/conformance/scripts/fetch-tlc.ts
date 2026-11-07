import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { TLC_JAR } from "./hosts";

// The suite's oracle: every recording in test/ comes from this build.
const RELEASE_URL = "https://github.com/tlaplus/tlaplus/releases/download/v1.8.0/tla2tools.jar";
const RELEASE_SHA256 = "e20447644bfabd29d6bd0fc2c0eb1473fb301c1a0e4dfe1961938ce5a191edbf";

const getDigest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

if (existsSync(TLC_JAR) && getDigest(readFileSync(TLC_JAR)) === RELEASE_SHA256) process.exit(0);

const response = await fetch(RELEASE_URL);
const bytes = new Uint8Array(await response.arrayBuffer());
if (getDigest(bytes) !== RELEASE_SHA256) {
  console.error(`The download from ${RELEASE_URL} does not match the pinned digest`);
  process.exit(1);
}
mkdirSync(dirname(TLC_JAR), { recursive: true });
writeFileSync(TLC_JAR, bytes);
console.log(`Wrote ${TLC_JAR}`);
