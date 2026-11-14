import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { CLI } from "./cli-harness";

const directories: string[] = [];

afterAll(() =>
  directories.forEach((directory) => rmSync(directory, { recursive: true, force: true })),
);

const writeModule = (name: string, source: string) => {
  const directory = mkdtempSync(join(tmpdir(), "tla-ts-tlapm-messages-"));
  directories.push(directory);
  writeFileSync(join(directory, `${name}.tla`), source);
  return directory;
};

const runTlapm = (directory: string, args: string[], env: Record<string, string> = {}) =>
  spawnSync("bun", [CLI, "tlapm", ...args], {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

const TLAPM_USAGE = [
  "Usage: tla-ts tlapm <options> FILE ...",
  "options are:",
  "                          ",
  "  (basic options)         ",
  "                          ",
  "  --help                  show this help message and exit",
  "  -help                   (same as --help)",
  "  --version               show version number and exit",
  "  --verbose               produce verbose messages",
  "  -v                      (same as --verbose)",
  "                          ",
  "  --where                 show location of standard library and exit",
  "  --config                show configuration and exit",
  "  --summary               show summary of theorems (implies -N and not -C)",
  "  --strict                report incomplete proofs, empty proof targets and failed obligations as errors and exit with a non-zero status",
  "  --timing                show runtime statistics",
  "                          ",
  "  -I <dir>                add <dir> to search path",
  "                          ",
  "  -k                      keep going on backend failures",
  "  -N                      do not run any backend verifiers",
  "  -C                      check proofs in Isabelle/TLA+",
  "                          ",
  "  --threads <int>         set number of worker threads to <int>",
  "  --method <meth>         set default method to <meth> (try --method help)",
  "  --solver <solver>       set SMT solver to <solver>",
  "  --smt-logic <logic>     set SMT logic to <logic>",
  "  --stretch <f>           multiply all timeouts by <f>",
  "                          ",
  "  (advanced options)      ",
  "                          ",
  "  --noflatten             do not flatten obligations",
  "  --nonormal              do not normalize obligations before printing",
  "  --debug {[-]<flag>}     enable/disable debugging flags",
  "                          ",
  "  --toolbox <int><int>    toolbox mode",
  "  --toolbox-vsn <int>     Toolbox protocol version, 1|2, 1 by default.",
  "  --line <int>            line to prove",
  "  --wait <time>           wait for <time> before printing obligations in progress",
  "  --stdin                 read the tla file from stdin instead of file system. Only applies if single tla file is provided as input.",
  "  --prefer-stdlib         prefer built-in standard modules if the module search path contains files with the same names as modules in stdlib.",
  "  --parser                Set parser backend to use: TLAPM (default) or SANY.",
  "  --module-jar            Add a path to a .jar file containing additional TLA+ modules, such",
  "        as the community modules. Multiple .jar files can be added by using",
  "        this option multiple times.",
  "  --noproving             do not prove, report fingerprinted results only",
  "                          ",
  "  --printallobs           print obligations in all toolbox messages",
  "                          ",
  "  --safefp                check tlapm, zenon, Isabelle versions for fingerprints",
  "  --nofp                  do not use existing fingerprints, but overwrite any preexisting fingerprints associated with the current proof obligations, using the newly computed fingerprints and results",
  "  --nofpl <int><int>      disable fingerprint use between given lines",
  "  --cleanfp               erase fingerprint file before starting",
  "                          ",
  "  --erasefp <f><back>     erase from file <f> all results of backend <back>",
  "  --printfp <f>           print the fingerprints stored in file <f> and quit",
  "  --usefp <f>             load fingerprints from file <f> (save as usual)",
  "  --fpp                   print the fingerprints of obligations in toolbox messages",
  '  --cache-dir <directory> save auxiliary and temporary files under <directory>. Alternatively, this directory can be defined via the variable `TLAPM_CACHE_DIR` of the runtime environment. The command-line parameter takes precedence over the environment variable. If neither is specified, the default value is ".tlacache".',
  "",
  "",
].join("\n");

describe("tlapm rejects an argument as OCaml's Arg does", () => {
  const directory = writeModule("Empty", "---- MODULE Empty ----\n====\n");

  it.each([
    [["--threads"], "option '--threads' needs an argument"],
    [["--nofpl", "1"], "option '--nofpl' needs an argument"],
    [["-I"], "option '-I' needs an argument"],
    [["Empty.tla", "--debug"], "option '--debug' needs an argument"],
    [["--threads", "x", "Empty.tla"], "wrong argument 'x'; option '--threads' expects an integer"],
    [
      ["--threads", " 1", "Empty.tla"],
      "wrong argument ' 1'; option '--threads' expects an integer",
    ],
    [
      ["--toolbox", "1", "Empty.tla"],
      "wrong argument 'Empty.tla'; option '--toolbox' expects an integer",
    ],
    [
      ["--line", "4611686018427387904", "Empty.tla"],
      "wrong argument '4611686018427387904'; option '--line' expects an integer",
    ],
    [["--stretch", "x", "Empty.tla"], "wrong argument 'x'; option '--stretch' expects a float"],
    [["--bogus", "--version"], "unknown option '--bogus'"],
    [["-", "Empty.tla"], "unknown option '-'"],
    [["--threads", "-1", "Empty.tla"], "--threads requires a positive argument"],
    [["--method", "zenon,foo", "Empty.tla"], '--method: unknown method "foo"'],
    [["--method", "zenon:x", "Empty.tla"], "--method: bad timeout specification: not a number"],
    [["--debug", "a,oldsmt", "Empty.tla"], "--debug oldsmt: the old SMT encoding has been removed"],
    [
      ["-N", "Empty.tla", "--threads", "x", "--bogus"],
      "wrong argument 'x'; option '--threads' expects an integer",
    ],
  ])("%j", (args, message) => {
    const result = runTlapm(directory, args);
    expect(result.stderr).toBe(`tla-ts tlapm: ${message}.\n${TLAPM_USAGE}`);
    expect(result.stdout).toBe("");
    expect(result.status).toBe(2);
  });

  it.each([
    ["--threads", "0x10"],
    ["--threads", "1_0"],
    ["--threads", "+1"],
    ["--line", "0u3"],
    ["--line", "-4611686018427387904"],
    ["--line", "0x7fffffffffffffff"],
  ])("accepts %s %s", (option, value) => {
    expect(runTlapm(directory, [option, value, "-N", "Empty.tla"]).status).toBe(0);
  });

  it("stops reading the arguments at --version", () => {
    const result = runTlapm(directory, ["--version", "--bogus"]);
    expect(result.stdout).toBe("b91fb6c\n");
    expect(result.status).toBe(0);
  });
});
