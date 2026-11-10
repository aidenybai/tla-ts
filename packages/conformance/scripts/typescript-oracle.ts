import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { listFiles } from "./test-file";
import { findCodebase, findProject } from "./typescript";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const TSC = join(PACKAGE_DIRECTORY, "node_modules/.bin/tsc");
const CHECKS_DIRECTORY = join(PACKAGE_DIRECTORY, ".oracles/typescript-checks");

// The exit for a program that Node can't parse, which the suite doesn't hold.
const UNSUPPORTED_EXIT = 3;

const file = process.argv[2];
const codebase = findCodebase(file);

// A codebase's file passes when TypeScript type checks its project without an error in the file.
// Each project's check is cached by its sources' sizes and times, as every file of it asks.
const checkCodebaseFile = (root: string) => {
  const project = findProject(file, root);
  if (project === undefined) {
    console.log(`no tsconfig.json holds ${relative(root, file)}`);
    process.exit(1);
  }
  const key = createHash("sha1")
    .update(project)
    .update(
      listFiles(join(root, "src"))
        .map((path) => `${path} ${statSync(path).size} ${statSync(path).mtimeMs}`)
        .join("\n"),
    )
    .digest("hex");
  const cached = join(CHECKS_DIRECTORY, `${key}.txt`);
  if (!existsSync(cached)) {
    const result = spawnSync(TSC, ["-p", project, "--noEmit", "--pretty", "false"], {
      cwd: root,
      encoding: "utf8",
    });
    mkdirSync(CHECKS_DIRECTORY, { recursive: true });
    const pending = `${cached}.${process.pid}`;
    writeFileSync(pending, result.stdout);
    renameSync(pending, cached);
  }
  const errors = readFileSync(cached, "utf8")
    .split("\n")
    .filter((line) => line.startsWith(`${relative(root, file)}(`));
  if (errors.length > 0) {
    console.log(errors[0]);
    process.exit(1);
  }
  console.log("success");
};

const stopUnsupported = (reason: string) => {
  console.log(`Node can't run it: ${reason}`);
  process.exit(UNSUPPORTED_EXIT);
};

// Node strips a case's types and runs it as an ES module, which is strict like the modules that
// tla-ts compiles.
const runCase = () => {
  const code = (() => {
    try {
      return stripTypeScriptTypes(readFileSync(file, "utf8"), { mode: "transform" });
    } catch (error) {
      return stopUnsupported(String(error).split("\n")[0]);
    }
  })();
  const directory = mkdtempSync(join(tmpdir(), "typescript-oracle-"));
  const program = join(directory, "program.mjs");
  writeFileSync(program, code);
  const parsed = spawnSync("node", ["--check", program], { encoding: "utf8" });
  const run =
    parsed.status === 0
      ? spawnSync("node", [program], { cwd: directory, encoding: "utf8" })
      : undefined;
  rmSync(directory, { recursive: true, force: true });
  if (run === undefined) {
    return stopUnsupported(parsed.stderr.split("\n").find((line) => /Error\b/.test(line)) ?? "");
  }
  console.log(run.status === 0 ? "success" : "throws");
  process.exit(run.status === 0 ? 0 : 1);
};

if (codebase === undefined) runCase();
else checkCodebaseFile(codebase.root);
