// The built package, which the prove scripts run so that tlapm's time limits see the speed users
// get. Their package scripts build it first.

import { existsSync } from "node:fs";
import { join } from "node:path";

export const DIST_DIRECTORY = join(import.meta.dirname, "../dist");

const INDEX_PATH = join(DIST_DIRECTORY, "index.js");

if (!existsSync(INDEX_PATH)) {
  console.error("Build the package first with pnpm build");
  process.exit(1);
}

export const tlaTs: typeof import("../src") = await import(INDEX_PATH);
