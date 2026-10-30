import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { getSanyReport } from "../../src/sany-report";

const directories: string[] = [];

afterAll(() => directories.forEach((directory) => rmSync(directory, { recursive: true })));

// Writes each module to its own file, then reports on the first one.
const getReport = (modules: Record<string, string>) => {
  const directory = mkdtempSync(join(tmpdir(), "sany-report-"));
  directories.push(directory);
  Object.entries(modules).forEach(([name, source]) =>
    writeFileSync(join(directory, `${name}.tla`), source),
  );
  const [root] = Object.keys(modules);
  const { text, isFailed } = getSanyReport(join(directory, `${root}.tla`), (name) =>
    name in modules ? readFileSync(join(directory, `${name}.tla`), "utf8") : undefined,
  );
  return { text, isFailed };
};

const toText = (lines: string[]) => lines.map((line) => `${line}\n`).join("");

// The expected reports are what SANY prints for the same modules.
describe("getSanyReport", () => {
  it("reports nothing for a specification SANY accepts", () => {
    const report = getReport({
      Fine: `---- MODULE Fine ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Spec == Init /\\ [][Next]_x
====
`,
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("reports an unresolved infix operator twice", () => {
    const report = getReport({ Infix: "---- MODULE Infix ----\nVARIABLE x\nOp == x @@ x\n====\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 9 to line 3, col 10 of module Infix",
        "",
        "Could not find declaration or definition of symbol '@@'.",
        "",
        "",
        "line 3, col 7 to line 3, col 12 of module Infix",
        "",
        "Couldn't resolve infix operator symbol `@@'.",
        "",
        "",
      ]),
    );
  });

  it("reports a multiply defined operator with a warning and an error", () => {
    const report = getReport({ Twice: "---- MODULE Twice ----\nOp == 1\nOp == 2\n====\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "*** Warnings: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Multiple declarations or definitions for symbol Op.  ",
        "This duplicates the one at line 2, col 1 to line 2, col 7 of module Twice.",
        "",
        "",
        "",
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Operator Op already defined or declared.",
        "",
        "",
      ]),
    );
  });

  it("warns about a record field named like a definition", () => {
    const report = getReport({
      Fields: "---- MODULE Fields ----\nfoo == 1\nr == [foo |-> 2]\n====\n",
    });
    expect(report.isFailed).toBe(false);
    expect(report.text).toBe(
      toText([
        "line 3, col 7 to line 3, col 9 of module Fields",
        "",
        'The field name "foo" in the record constructor is identical to the existing definition or declaration',
        "named foo, located at line 2, col 1 to line 2, col 8 of module Fields.",
        "The field in the record will not take the value of the foo definition or declaration.",
        "In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.",
        'Therefore, DOMAIN [foo |-> ...] = {"foo"} holds true.',
        "",
        "",
        "",
      ]),
    );
  });

  it("reports a circular dependency as a fatal error", () => {
    const report = getReport({
      Cycle: "---- MODULE Cycle ----\nEXTENDS Other\n====\n",
      Other: "---- MODULE Other ----\nEXTENDS Cycle\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "",
        "Fatal errors while parsing TLA+ spec in file Cycle",
        "",
        "Unknown location",
        "",
        "Circular dependency among .tla files; dependency cycle is:",
        "",
        "  Cycle.tla --> Other.tla --> Cycle.tla",
        "*** Errors: 1",
        "",
        "Unknown location",
        "",
        "Circular dependency among .tla files; dependency cycle is:",
        "",
        "  Cycle.tla --> Other.tla --> Cycle.tla",
        "",
        "",
        "",
      ]),
    );
  });

  it("reports a file without a module as a parse error", () => {
    const report = getReport({ Headless: "Nothing here\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "***Parse Error***",
        'Was expecting "---- MODULE (beginning of module)"',
        'Encountered "<EOF>" at line 1, column 13 and token "" ',
        "",
        "Residual stack trace follows:",
        "Begin module starting at line 1, column 13.",
        "Module definition starting at line 1, column 13.",
        "",
        "",
        "Fatal errors while parsing TLA+ spec in file Headless",
        "",
        "In module Headless",
        "",
        "Could not parse module Headless from file Headless.tla",
        "*** Errors: 1",
        "",
        "In module Headless",
        "",
        "Could not parse module Headless from file Headless.tla",
        "",
        "",
        "",
      ]),
    );
  });

  it("reports actions used as temporal formulas", () => {
    const report = getReport({
      Leads: "---- MODULE Leads ----\nVARIABLE x\nA == x' ~> []x\nB == [](x')\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 6 to line 3, col 14 of module Leads",
        "",
        "Action used where only temporal formula or state predicate allowed.",
        "",
        "",
        "line 4, col 6 to line 4, col 11 of module Leads",
        "",
        "[] followed by action not of form [A]_v.",
        "",
        "",
      ]),
    );
  });

  it("reports a substitution above the level the instantiated module allows", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nVARIABLE x\nI == INSTANCE Inner WITH C <- [](x = 0)\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\nASSUME C = {}\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 39 of module Outer",
        "",
        "Level error in instantiating module 'Inner':",
        "The level of the expression or operator substituted for 'C' ",
        "must be at most 2.",
        "",
        "",
      ]),
    );
  });

  it.each([
    [
      "a HIDE of an expression",
      "THEOREM T == TRUE\nHIDE TRUE",
      [
        "line 3, col 6 to line 3, col 9 of module M",
        "",
        "The only expression allowed as a fact in a HIDE is ",
        "the name of a theorem, assumption, or step.",
      ],
    ],
    [
      "a reference to an ASSUME/PROVE clause in the scope of its NEW",
      "THEOREM T == ASSUME NEW y, y = 1 PROVE y = 1\nU == T!2",
      [
        "line 3, col 8 to line 3, col 8 of module M",
        "",
        "Accessing ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
      ],
    ],
    [
      "a reference to a label in the scope of a NEW",
      "THEOREM T == ASSUME NEW y PROVE lab:: y = y\nU == T!lab",
      [
        "line 3, col 8 to line 3, col 10 of module M",
        "",
        "Accessing subexpression labeled `lab' of ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
      ],
    ],
  ])("reports %s", (_, body, error) => {
    const report = getReport({ M: `---- MODULE M ----\n${body}\n====\n` });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText(["Semantic errors:", "", "*** Errors: 1", "", ...error, "", ""]),
    );
  });

  it("reports a variable in a DEF clause and the BY it leaves empty", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nTHEOREM TRUE BY DEF x\n====\n",
    });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 21 to line 3, col 21 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 14 to line 3, col 21 of module M",
        "",
        "Empty BY",
        "",
        "",
      ]),
    );
  });
});

// The checksums are the ones pcal.trans wrote when it translated the algorithm.
const COUNTER = `---- MODULE Counter ----
EXTENDS Naturals
(* --algorithm Counter
variables x = 0;
begin
  while x < 3 do
    x := x + 1;
  end while;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "f3520a51" /\\ chksum(tla) = "5821f1e4")
VARIABLES pc, x

vars == << pc, x >>

Init == (* Global variables *)
        /\\ x = 0
        /\\ pc = "Lbl_1"

Lbl_1 == /\\ pc = "Lbl_1"
         /\\ IF x < 3
               THEN /\\ x' = x + 1
                    /\\ pc' = "Lbl_1"
               ELSE /\\ pc' = "Done"
                    /\\ x' = x

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\\ UNCHANGED vars

Next == Lbl_1
           \\/ Terminating

Spec == Init /\\ [][Next]_vars

Termination == <>(pc = "Done")

\\* END TRANSLATION
====
`;

// What SANY prints for a module whose PlusCal or translation changed after the translation.
const getDivergenceText = (root: string, module: string, message: string) =>
  toText([
    "Labels added.",
    `Warnings (1) during syntax parsing of ${root}:`,
    "",
    "",
    `In module ${module}`,
    "",
    message,
    "",
    "",
    "",
  ]);

// The expected reports are what SANY prints for the same modules.
describe("getSanyReport on PlusCal", () => {
  it("reports the labels the translator adds to an algorithm that matches its checksums", () => {
    expect(getReport({ Counter: COUNTER })).toEqual({ text: "Labels added.\n", isFailed: false });
  });

  it("warns that the algorithm changed since its translation", () => {
    const report = getReport({ Counter: COUNTER.replace("x := x + 1", "x := x + 2") });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "The PlusCal algorithm in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("warns that the translation changed since it was written", () => {
    const report = getReport({
      Counter: COUNTER.replace('<>(pc = "Done")', '<>(pc = "Done" /\\ TRUE)'),
    });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "The TLA+ translation in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("warns that both changed", () => {
    const report = getReport({ Counter: COUNTER.replaceAll("x < 3", "x < 4") });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "Both the PlusCal algorithm and its TLA+ translation in module Counter have changed since the last translation.",
      ),
      isFailed: false,
    });
  });

  it("validates a module that the root extends", () => {
    const report = getReport({
      Root: "---- MODULE Root ----\nEXTENDS Counter\n====\n",
      Counter: COUNTER.replace("x := x + 1", "x := x + 2"),
    });
    expect(report).toEqual({
      text: getDivergenceText(
        "Root",
        "Counter",
        "The PlusCal algorithm in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("reports the variables the translator renames", () => {
    const report = getReport({
      Renamed: `---- MODULE Renamed ----
EXTENDS Naturals
(* --algorithm Renamed
variables total = 0;
process A = 1
variables t = 1;
begin
  a: total := total + t;
end process;
process B = 2
variables t = 2;
begin
  b: total := total + t;
end process;
end algorithm; *)
\\* BEGIN TRANSLATION
\\* END TRANSLATION
====
`,
    });
    expect(report).toEqual({ text: "Warning: symbols were renamed.\n", isFailed: false });
  });

  it("reports an algorithm the translator rejects, whose checksum then differs", () => {
    const report = getReport({
      Undeclared: `---- MODULE Undeclared ----
(* --algorithm Undeclared
variables x = 0;
begin
  a: y := 1;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "ffffffff" /\\ chksum(tla) = "ffffffff")
VARIABLE x
\\* END TRANSLATION
====
`,
    });
    expect(report.isFailed).toBe(false);
    expect(report.text).toBe(
      toText([
        "",
        "Unrecoverable error:",
        " -- Assignment to undeclared variable y",
        "    at line 5, column 6.",
        "",
        "Warnings (1) during syntax parsing of Undeclared:",
        "",
        "",
        "In module Undeclared",
        "",
        "Both the PlusCal algorithm and its TLA+ translation in module Undeclared have changed since the last translation.",
        "",
        "",
        "",
      ]),
    );
  });

  it("rejects a specification whose algorithm it cannot uncomment", () => {
    const report = getReport({
      Quote: `---- MODULE Quote ----
(* --algorithm Quote
begin
  a: print "abc;
end algorithm; *)
\\* BEGIN TRANSLATION
\\* END TRANSLATION
====
`,
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "",
        "Unrecoverable error:",
        " -- Unterminated string in line 4.",
        "",
        "*** Errors: 1",
        "",
        "In module Quote",
        "",
        "An unexpected problem was encountered attempting to validate the specification for Quote",
        "",
        "",
        "",
      ]),
    );
  });
});
