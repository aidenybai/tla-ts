import { execFileSync } from "node:child_process";
import { join } from "node:path";

export default () => {
  const cwd = join(import.meta.dirname, "../..");
  execFileSync("pnpm", ["exec", "vp", "pack"], { cwd, stdio: "ignore" });
  execFileSync("bun", ["scripts/prelude-graph.ts", "dist"], { cwd, stdio: "ignore" });
};
