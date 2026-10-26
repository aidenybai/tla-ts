import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CORPORA_DIRECTORY, getCorpora } from "./corpora";

const git = (directory: string, args: string[]) =>
  execFileSync("git", args, { cwd: directory, stdio: "inherit" });

mkdirSync(CORPORA_DIRECTORY, { recursive: true });

getCorpora().forEach((corpus) => {
  const directory = join(CORPORA_DIRECTORY, corpus.name);
  if (!existsSync(directory)) {
    mkdirSync(directory);
    git(directory, ["init", "--quiet"]);
    git(directory, ["remote", "add", "origin", corpus.repository]);
    git(directory, [
      "sparse-checkout",
      "set",
      "--no-cone",
      ...corpus.paths.map((path) => `/${path}/`),
    ]);
  }
  git(directory, [
    "fetch",
    "--quiet",
    "--depth",
    "1",
    "--filter=blob:none",
    "origin",
    corpus.commit,
  ]);
  git(directory, ["checkout", "--quiet", "--force", corpus.commit]);
  console.log(`${corpus.name} at ${corpus.commit.slice(0, 12)}`);
});
