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
  const directory = mkdtempSync(join(tmpdir(), "tla-ts-tlapm-parser-"));
  directories.push(directory);
  writeFileSync(join(directory, `${name}.tla`), source);
  return directory;
};

const runTlapm = (directory: string, args: string[]) =>
  spawnSync("bun", [CLI, "tlapm", ...args], { cwd: directory, encoding: "utf8" });

const PRINT_OBLIGATIONS = ["-N", "--toolbox", "0", "0", "--printallobs"];
describe("tlapm reads a postfix operator applied as a nonfix one", () => {
  it("applies ', ^+, ^* and ^# to the argument in parentheses", () => {
    const directory = writeModule(
      "Nonfix",
      `---- MODULE Nonfix ----
EXTENDS Naturals
VARIABLE x
a ^+ == a
a ^* == a
a ^# == a
A == ^+(x)
B == x + '(x)
C == '(x + 1)' + ^+(x)[2] + ^#(^*(x))
D == ENABLED '(x)
E == /\\ '(x)
     /\\ ^+ (x)^+
THEOREM A /\\ B /\\ C /\\ D /\\ E BY DEF A, B, C, D, E
====
`,
    );
    const result = runTlapm(directory, [...PRINT_OBLIGATIONS, "Nonfix.tla"]);
    expect(result.stderr).toBe(`@!!BEGIN
@!!type:obligation
@!!id:1
@!!loc:13:31:13:33
@!!status:to be proved
@!!obl:ASSUME NEW VARIABLE x,
       A == x^+,
       B == x + x',
       C == (x + 1)'' + (x^+)[2] + x^*^#,
       D == ENABLED (x'),
       E == /\\ x'
            /\\ x^+^+
PROVE  A /\\ B /\\ C /\\ D /\\ E

@!!END

@!!BEGIN
@!!type:obligationsnumber
@!!count:1
@!!END

`);
    expect(result.status).toBe(0);
  });

  it("ends the expression before a postfix operator whose argument follows an operand", () => {
    const directory = writeModule(
      "Juxtaposed",
      `---- MODULE Juxtaposed ----
VARIABLE x
A == x '(x)
====
`,
    );
    const result = runTlapm(directory, [...PRINT_OBLIGATIONS, "Juxtaposed.tla"]);
    expect(result.stderr).toBe(`File "./Juxtaposed.tla", line 3, character 7
Unexpected operator '
@!!BEGIN
@!!type:warning
@!!msg:File "./Juxtaposed.tla", line 3, character 7
Unexpected operator '

@!!END

File "<unknown>":
Error: Could not parse "./Juxtaposed.tla" successfully.
 tlapm ending abnormally with Failure("Module.Parser.parse_file")

@!!BEGIN
@!!type:warning
@!!msg:File "./Juxtaposed.tla", line 3, character 7

Unexpected operator '



@!!END

`);
    expect(result.status).toBe(3);
  });
});
