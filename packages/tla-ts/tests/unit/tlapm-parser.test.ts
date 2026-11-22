import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { parseOcamlFloat } from "../../src/prover/prep/methods";
import { runTlapmIn } from "./cli-harness";

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

const PRINT_OBLIGATIONS = ["-N", "--toolbox", "0", "0", "--printallobs"];
const PROVE = ["--toolbox", "0", "0", "--threads", "1"];

const getResultLines = (stderr: string) =>
  stderr
    .replace(/; time-used: .*/g, "")
    .split("\n")
    .filter((line) =>
      /^(@!!(status|prover|meth|already):|PROVE|Invalid|\[(INFO|ERROR)\])/.test(line),
    );

const getMethodModule = (name: string, pragma: string) => `---- MODULE ${name} ----
EXTENDS Naturals, TLAPS
M == TRUE (*{ by (${pragma}) }*)
THEOREM \\A x \\in Nat : x + 0 = x
  BY M
====
`;

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
    const result = runTlapmIn(directory, [...PRINT_OBLIGATIONS, "Nonfix.tla"]);
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
    const result = runTlapmIn(directory, [...PRINT_OBLIGATIONS, "Juxtaposed.tla"]);
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

describe("tlapm reads a float as OCaml's float_of_string does", () => {
  it("accepts the forms tlapm accepts", () => {
    expect(
      ["1_0", " 5", "2.", ".5e1", "+3", "0x10", "0X.8", "-0x1.8p1", "0x1p 1", "1_", "INF"].map(
        parseOcamlFloat,
      ),
    ).toEqual([10, 5, 2, 5, 3, 16, 0.5, -3, 2, 1, Infinity]);
    expect(parseOcamlFloat("nan(a-b)")).toBeNaN();
  });

  it("rejects the forms tlapm rejects", () => {
    expect(
      [
        "",
        "_",
        "5 ",
        "0b11",
        "0o17",
        "1e",
        ".",
        "0x",
        "0x.p1",
        "0x1p",
        "0x1p+ 1",
        "infinit",
      ].filter((text) => parseOcamlFloat(text) !== undefined),
    ).toEqual([]);
  });

  it("rejects an empty --stretch and one Arg.Float rejects", () => {
    const directory = writeModule("Empty", "---- MODULE Empty ----\n====\n");
    ["", "0b11"].forEach((stretch) => {
      const result = runTlapmIn(directory, ["--stretch", stretch, "-N", "Empty.tla"]);
      expect(result.stderr).toMatch(
        new RegExp(
          `^tla-ts tlapm: wrong argument '${stretch}'; option '--stretch' expects a float\\.\nUsage: `,
        ),
      );
      expect(result.status).toBe(2);
    });
  });

  it("accepts a --stretch with underscores", () => {
    const directory = writeModule("Empty", "---- MODULE Empty ----\n====\n");
    expect(runTlapmIn(directory, ["--stretch", "1_0", "-N", "Empty.tla"]).status).toBe(0);
  });
});

describe("tlapm computes a method from a pragma", () => {
  it("gives Cooper's method no time limit, whatever timeout the pragma sets", () => {
    const directory = writeModule(
      "Cooper",
      getMethodModule("Cooper", 'prover:"cooper"; timeout:5'),
    );
    expect(getResultLines(runTlapmIn(directory, [...PROVE, "Cooper.tla"]).stderr)).toEqual([
      "@!!status:to be proved",
      "@!!status:to be proved",
      "@!!status:failed",
      "@!!prover:cooper",
      "@!!meth:time-limit: inf",
      "@!!already:false",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "[ERROR]: Could not prove or check:",
      "[ERROR]: 1/2 obligations failed.",
    ]);
  });

  it("reads underscores in an rlimit budget", () => {
    const directory = writeModule(
      "Budget",
      getMethodModule("Budget", 'prover:"smt"; timeout:"r1_0"'),
    );
    expect(getResultLines(runTlapmIn(directory, [...PROVE, "Budget.tla"]).stderr)).toEqual([
      "@!!status:to be proved",
      "@!!status:to be proved",
      "@!!status:proved",
      "@!!prover:smt",
      "@!!meth:time-limit: inf",
      "@!!already:false",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "[INFO]: All 2 obligations proved.",
    ]);
  });

  it("rejects a binary rlimit budget", () => {
    const directory = writeModule(
      "BinaryBudget",
      getMethodModule("BinaryBudget", 'prover:"smt"; timeout:"r0b11"'),
    );
    expect(getResultLines(runTlapmIn(directory, [...PROVE, "BinaryBudget.tla"]).stderr)).toEqual([
      "@!!status:to be proved",
      "@!!status:to be proved",
      'Invalid SMT budget "r0b11": expected a number of seconds (wall-clock timeout), or a deterministic Z3 rlimit budget of the form "rN" (e.g. "r5").',
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "@!!status:failed",
      "@!!prover:fail",
      "@!!meth:time-limit: inf",
      "@!!already:false",
      "PROVE  \\A x \\in Nat : x + 0 = x",
      "[ERROR]: Could not prove or check:",
      "[ERROR]: 1/2 obligations failed.",
    ]);
  });
});

describe("tlapm ships an obligation whose frontend fails", () => {
  it("still answers each method from the fingerprints file", () => {
    const source = `---- MODULE Stored ----
EXTENDS Naturals, TLAPS
VARIABLE x
A == x = 1
THEOREM ENABLED A => 1 + 1 = 2
  BY ExpandENABLED, Zenon, SMT
====
`;
    const directory = writeModule("Stored", source);
    runTlapmIn(directory, [...PROVE, "Stored.tla"]);
    writeFileSync(join(directory, "Stored.tla"), source.replace("A == x = 1", "A == x' = 1"));
    const result = runTlapmIn(directory, [...PROVE, "Stored.tla"]);
    expect(getResultLines(result.stderr)).toEqual([
      "@!!status:to be proved",
      "@!!status:to be proved",
      "@!!status:to be proved",
      "@!!status:to be proved",
      "@!!status:failed",
      "@!!prover:expandenabled",
      "@!!meth:time-limit: inf",
      "@!!already:false",
      "PROVE  ENABLED A => 1 + 1 = 2",
      "@!!status:failed",
      "@!!prover:zenon",
      "@!!meth:time-limit: 10",
      "@!!already:true",
      "PROVE  FALSE",
      "@!!status:proved",
      "@!!prover:smt",
      "@!!meth:time-limit: 5",
      "@!!already:true",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "[INFO]: All 4 obligations proved.",
    ]);
    expect(result.status).toBe(0);
  });

  it("writes the unflattened obligation to the theory under --noflatten", () => {
    const directory = writeModule(
      "Unflattened",
      `---- MODULE Unflattened ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, NEW R, (P /\\ Q) /\\ R PROVE (R /\\ Q) /\\ P
  BY Zenon
====
`,
    );
    runTlapmIn(directory, [...PROVE, "--noflatten", "Unflattened.tla"]);
    expect(
      readFileSync(join(directory, ".tlacache/Unflattened.tlaps/Unflattened.thy"), "utf8")
        .split("\n")
        .filter((line) => /^(fixes|assumes|shows) /.test(line)),
    ).toEqual([
      "fixes a_CONSTANTunde_Punde_a",
      "fixes a_CONSTANTunde_Qunde_a",
      "fixes a_CONSTANTunde_Runde_a",
      'assumes v\'7: "(((((a_CONSTANTunde_Punde_a) \\<and> (a_CONSTANTunde_Qunde_a))) \\<and> (a_CONSTANTunde_Runde_a)))"',
      'assumes v\'8: "(TRUE)"',
      'shows "(((((a_CONSTANTunde_Runde_a) \\<and> (a_CONSTANTunde_Qunde_a))) \\<and> (a_CONSTANTunde_Punde_a)))"(is "PROP ?ob\'1")',
    ]);
  });
});
