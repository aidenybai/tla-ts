import { execFileSync } from "node:child_process";
import { join } from "node:path";

export default () => {
  execFileSync("pnpm", ["exec", "vp", "pack"], {
    cwd: join(import.meta.dirname, "../.."),
    stdio: "ignore",
  });
};
