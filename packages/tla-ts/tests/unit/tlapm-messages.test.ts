import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { decideIsabelle } from "../../src/prover/isabelle/decide";
import { parseTheory } from "../../src/prover/isabelle/isar/theory";
import { runTheory } from "../../src/prover/isabelle/isar/toplevel";
import { loadLogic } from "../../src/prover/isabelle/tla/logic";
import { DIST_CLI } from "./cli-harness";

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
  spawnSync(process.execPath, [DIST_CLI, "tlapm", ...args], {
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

describe("tlapm reads TLAPM_FLATTEN as params.ml does", () => {
  const getAssumptions = (env: Record<string, string>) => {
    const directory = writeModule(
      "Flatten",
      `---- MODULE Flatten ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, NEW R, (P /\\ Q) /\\ R PROVE (R /\\ Q) /\\ P
  BY Zenon
====
`,
    );
    runTlapm(directory, ["--toolbox", "0", "0", "--threads", "1", "Flatten.tla"], env);
    return readFileSync(join(directory, ".tlacache/Flatten.tlaps/Flatten.thy"), "utf8")
      .split("\n")
      .filter((line) => line.startsWith("assumes ")).length;
  };

  it.each(["yes", "true"])("flattens obligations when it is %s", (value) => {
    expect(getAssumptions({ TLAPM_FLATTEN: value })).toBe(1);
  });

  it.each(["no", "", "TRUE", "1"])("doesn't flatten obligations when it is %j", (value) => {
    expect(getAssumptions({ TLAPM_FLATTEN: value })).toBe(2);
  });
});

const PARSE_FAILURE = [
  'File "<unknown>":',
  'Error: Could not parse "./Bad.tla" successfully.',
  ' tlapm ending abnormally with Failure("Module.Parser.parse_file")',
  "",
  "",
].join("\n");

const getParseError = (body: string) => {
  const directory = writeModule(
    "Bad",
    `---- MODULE Bad ----\nEXTENDS Naturals\nVARIABLE x\n${body}\n====\n`,
  );
  const result = runTlapm(directory, ["-N", "Bad.tla"]);
  expect(result.status).toBe(3);
  expect(result.stderr.endsWith(PARSE_FAILURE)).toBe(true);
  return result.stderr.slice(0, -PARSE_FAILURE.length);
};

describe("tlapm ends an expression before an infix operator applied as a nonfix one", () => {
  it.each([
    ["A == x +(x, x)", "line 4, character 7\nUnexpected operator +\n"],
    ["A == x + x +(x, x)", "line 4, character 11\nUnexpected operator +\n"],
    ["A == x \\in (x, x)", "line 4, character 7\nUnexpected operator \\in\n"],
    ["A == IF x +(x, x) THEN 1 ELSE 2", "line 4, character 5\nUnexpected operator +\n"],
    ["A == (x +(x, x))", "line 4, character 5\nrequired expressions(s) missing before '('\n"],
    ["A == {x +(x, x)}", "line 4, character 5\nrequired expressions(s) missing before '{'\n"],
    ["A == x +(x, )", "line 4, character 5\nincomplete expression\n"],
  ])("%s", (body, message) => {
    expect(getParseError(body)).toBe(`File "./Bad.tla", ${message}`);
  });

  it("reads the operator as infix when its parentheses hold one expression", () => {
    const directory = writeModule(
      "Infix",
      `---- MODULE Infix ----
EXTENDS Naturals
VARIABLE x
A == x = (\\E a, b \\in {x} : a) \\/ x \\in (x \\cup ({x, x} \\cup (<<x, x>>[1] \\cup +(x, x))))
B == x + (x + (x + [a, b \\in {x} |-> a][x, x])) + x
THEOREM A /\\ B = B BY DEF A, B
====
`,
    );
    const result = runTlapm(directory, ["-N", "--toolbox", "0", "0", "--printallobs", "Infix.tla"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain(
      [
        "@!!obl:ASSUME NEW VARIABLE x,",
        "       A ==",
        "         x = (\\E a, b \\in {x} : a)",
        "         \\/ x \\in x \\cup ({x, x} \\cup (<<x, x>>[1] \\cup x + x)),",
        "       B == x + (x + (x + [a, b \\in {x} |-> a][x, x])) + x",
        "PROVE  A /\\ B = B",
        "",
      ].join("\n"),
    );
  });
});

describe("tlapm reports a failure in a hypothesis where Pco.star leaves the input", () => {
  it.each([
    [
      "THEOREM ASSUME NEW P, ASSUME NEW Q, Q /\\ PROVE Q PROVE P",
      "line 4, character 21\nincomplete expression\n",
    ],
    ["THEOREM ASSUME NEW Q, Q /\\ PROVE Q", "line 4, character 21\nincomplete expression\n"],
    [
      "THEOREM ASSUME ASSUME NEW Q, Q /\\ PROVE Q PROVE x",
      "line 4, character 28\nincomplete expression\n",
    ],
    [
      "THEOREM ASSUME NEW P, ASSUME NEW Q PROVE Q /\\ PROVE P",
      "line 4, character 21\nincomplete expression\n",
    ],
    ["THEOREM ASSUME NEW P, P, {P PROVE P", "line 4, character 24\nUnexpected ,\n"],
    ["THEOREM ASSUME NEW P, PROVE P", "line 4, character 21\nUnexpected ,\n"],
    ["THEOREM ASSUME (x PROVE x", "line 4, character 15\nUnexpected (\n"],
    [
      "THEOREM ASSUME NEW P, P, ASSUME PROVE P PROVE P",
      "line 4, character 21\nUnexpected keyword PROVE\n",
    ],
    ["THEOREM ASSUME NEW P, P, NEW PROVE P", "line 4, character 21\nUnexpected keyword PROVE\n"],
  ])("%s", (body, message) => {
    expect(getParseError(body)).toBe(`File "./Bad.tla", ${message}`);
  });
});

describe("tlapm names the bullet whose first item fails", () => {
  it.each([
    ["A == /\\", "line 4, character 5\nrequired expressions(s) missing before 'operator /\\'\n"],
    [
      "A == /\\(x, x)",
      "line 4, character 5\nrequired expressions(s) missing before 'operator /\\'\n",
    ],
    ["A == \\/ +", "line 4, character 5\nrequired expressions(s) missing before 'operator \\/'\n"],
    ["A == x + /\\", "line 4, character 5\nincomplete expression\n"],
    ["A == /\\ x +", "line 4, character 5\nincomplete expression\n"],
  ])("%s", (body, message) => {
    expect(getParseError(body)).toBe(`File "./Bad.tla", ${message}`);
  });
});

describe("tlapm ends the messages p_parser.ml ends with a newline", () => {
  const getProofError = (proof: string) => {
    const directory = writeModule(
      "Steps",
      `---- MODULE Steps ----\nTHEOREM TRUE\n${proof}\n====\n`,
    );
    const result = runTlapm(directory, ["-N", "--toolbox", "0", "0", "Steps.tla"]);
    expect(result.status).toBe(3);
    return result.stderr;
  };

  it.each([
    [
      "<1>1. TRUE OBVIOUS\n<1>2. TRUE OBVIOUS",
      "line 4, character 19",
      "Unexpected end of (sub)proof at level 1 before QED step\n",
      "\n",
    ],
    [
      "<1>1. TRUE OBVIOUS\nOBVIOUS",
      "line 4, characters 1-7",
      "Expecting a proof step but found an OBVIOUS leaf proof\n",
      "\n",
    ],
    [
      "<1>1. TRUE OBVIOUS\nPROOF <1>2. QED OBVIOUS",
      "line 4, characters 7-15",
      "PROOF keyword found in step that does not begin subproof\n",
      "",
    ],
    [
      "<1>1. TRUE OBVIOUS\n<+> QED OBVIOUS",
      "line 4, characters 1-7",
      "<+> used but no subproof expected\n",
      "",
    ],
    [
      "<1>1. QED OBVIOUS\n<1>2. QED OBVIOUS",
      "line 4, characters 1-9",
      "extra step(s) after finished proof",
      "",
    ],
  ])("%j", (proof, location, printed, set) => {
    const message = printed.trimEnd();
    const exception = `Proof.Parser${message.startsWith("extra") ? ".toplevel" : ""}`;
    expect(getProofError(proof)).toBe(
      [
        `File "./Steps.tla", ${location}:`,
        `Error: ${printed}`,
        ` tlapm ending abnormally with Failure("${exception}")`,
        "",
        "@!!BEGIN",
        "@!!type:warning",
        `@!!msg:File "./Steps.tla", ${location}`,
        "",
        `${message}${set}`,
        "",
        "",
        "@!!END",
        "",
        "",
      ].join("\n"),
    );
  });
});

// tlapm fails this obligation with reason:int_of_string, an overflow of OCaml's 63-bit integers.
describe("a literal above OCaml's largest integer", () => {
  const directory = writeModule(
    "Literal",
    `---- MODULE Literal ----
EXTENDS Integers, TLAPS
THEOREM 4611686018427387904 # 4611686018427387905
  BY SMT
====
`,
  );

  it.each([
    ["with arithmetic", []],
    ["without arithmetic", ["--debug", "disable_arithmetic"]],
  ])("is proved %s", (_name, args) => {
    const result = runTlapm(directory, ["--threads", "1", "--nofp", ...args, "Literal.tla"]);
    expect(result.stderr).toBe(
      'File "./Literal.tla", line 1, character 1 to line 5, character 4:\n[INFO]: All 2 obligations proved.\n',
    );
    expect(result.status).toBe(0);
  });
});

describe("tlapm checks the obligation a failed frontend leaves for triviality", () => {
  it("answers trivial for a supporting fact under an assumption that is FALSE", () => {
    const directory = writeModule(
      "Trivial",
      `---- MODULE Trivial ----
EXTENDS Naturals, TLAPS
VARIABLE x
A == x' = 1
THEOREM ASSUME FALSE PROVE 1 + 1 = 2
<1> USE ExpandENABLED
<1>1. QED BY ENABLED A
====
`,
    );
    const result = runTlapm(directory, ["--toolbox", "0", "0", "--threads", "1", "Trivial.tla"]);
    const results = result.stderr.slice(result.stderr.indexOf("@!!type:obligationsnumber"));
    expect(
      results.split("\n").filter((line) => /^(@!!(id|status|prover|already):|\[)/.test(line)),
    ).toEqual([
      "@!!id:1",
      "@!!status:failed",
      "@!!prover:expandenabled",
      "@!!already:false",
      "@!!id:2",
      "@!!status:failed",
      "@!!prover:expandenabled",
      "@!!already:false",
      "@!!id:2",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "@!!id:3",
      "@!!status:trivial",
      "@!!prover:tlapm",
      "@!!already:false",
      "[ERROR]: Could not prove or check:",
      "[ERROR]: 1/3 obligations failed.",
    ]);
    expect(result.status).toBe(0);
  });
});

const wrapTheory = (body: string) => `theory T imports Constant begin\n${body}\nend\n`;

const decideTheory = (body: string) => decideIsabelle(wrapTheory(body), { timeLimitMs: 30_000 });

const FOO = 'definition foo where "foo \\<equiv> {}"';
const FOO_EMPTY = '"foo = {}" by (simp add: foo_def)';
const NOT_IN_FOO = '"(y \\<in> foo) = FALSE"';
const EMPTY = 'definition P where "P(x) \\<equiv> x = {}"';
const BY_DEFINITION = "by (simp add: P_def)";

describe("Isabelle's declaration attributes add a theorem to the set its methods read", () => {
  it.each([
    ["a lemma", `${FOO}\nlemma a [simp]: ${FOO_EMPTY}\nlemma b: ${NOT_IN_FOO} by simp`],
    [
      "a lemma's statement",
      `${FOO}\nlemma shows a [simp]: ${FOO_EMPTY}\nlemma ${NOT_IN_FOO} by simp`,
    ],
    [
      "a lemma's assumption",
      `consts foo :: "c"\nlemma fixes y assumes a [simp]: "foo = {}" shows ${NOT_IN_FOO} by simp`,
    ],
    [
      "have",
      `${FOO}\nlemma fixes y shows ${NOT_IN_FOO}\nproof -\nhave a [simp]: ${FOO_EMPTY}\nshow ${NOT_IN_FOO} by simp\nqed`,
    ],
  ])("simp of %s", (_name, body) => {
    expect(decideTheory(body)).toBe("unsat");
    expect(decideTheory(body.replace(" [simp]", ""))).toBe("unknown");
  });

  it("simp of a definition, of a declare and of each assumption joined by and", () => {
    expect(
      decideTheory(`definition foo [simp]: "foo \\<equiv> {}"\nlemma ${NOT_IN_FOO} by simp`),
    ).toBe("unsat");
    expect(
      decideTheory(`${FOO}\nlemma a: ${FOO_EMPTY}\ndeclare a [simp]\nlemma ${NOT_IN_FOO} by simp`),
    ).toBe("unsat");
    expect(
      decideTheory(
        'consts foo :: "c"\nconsts bar :: "c"\nlemma fixes y shows "foo = {} \\<Longrightarrow> bar = {} \\<Longrightarrow> (y \\<in> foo) = (y \\<in> bar)"\nproof -\nassume a [simp]: "foo = {}" and b [simp]: "bar = {}"\nshow "(y \\<in> foo) = (y \\<in> bar)" by simp\nqed',
      ),
    ).toBe("unsat");
  });

  it.each([
    ["intro", `"x = {} \\<Longrightarrow> P(x)" ${BY_DEFINITION}\nlemma "P({})" by blast`],
    [
      "elim",
      `"P(x) \\<Longrightarrow> (x = {} \\<Longrightarrow> Q) \\<Longrightarrow> Q" ${BY_DEFINITION}\nlemma "P(x) \\<Longrightarrow> x = {}" by blast`,
    ],
    [
      "dest",
      `"P(x) \\<Longrightarrow> x = {}" ${BY_DEFINITION}\nlemma "P(x) \\<Longrightarrow> x = {}" by blast`,
    ],
  ])("%s", (attribute, rest) => {
    expect(decideTheory(`${EMPTY}\nlemma p [${attribute}]: ${rest}`)).toBe("unsat");
    expect(decideTheory(`${EMPTY}\nlemma p: ${rest}`)).toBe("unknown");
  });

  it("gives an attribute of a later part the fact an earlier part names", () => {
    expect(
      decideTheory(
        'consts foo :: "c"\nlemma fixes y assumes a: "foo = {}" and b [OF a]: "foo = {} \\<Longrightarrow> y = {}" shows "y = {}" by (rule b)',
      ),
    ).toBe("unsat");
  });
});

describe("the where attribute quotes the variable a theorem lacks, as Isabelle does", () => {
  it.each([
    ["?zz", '"?zz"'],
    ["zz1", '"?zz1"'],
  ])("%s", (variable, printed) => {
    expect(() =>
      runTheory(
        loadLogic(),
        parseTheory(
          wrapTheory(`lemma fixes x shows "x = x" by (rule refl[where ${variable} = "x"])`),
        ),
        { deadline: Date.now() + 30_000, signal: undefined },
      ),
    ).toThrow(new RegExp(`^No such variable in theorem: ${printed.replace("?", "\\?")}$`));
  });
});
