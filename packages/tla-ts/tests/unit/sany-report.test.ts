import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { getSanyReport, type SanyReportOptions } from "../../src/sany-report";

const directories: string[] = [];

afterAll(() => directories.forEach((directory) => rmSync(directory, { recursive: true })));

// Writes each module to its own file, then reports on the first one.
const getReport = (modules: Record<string, string>, options?: SanyReportOptions) => {
  const directory = mkdtempSync(join(tmpdir(), "sany-report-"));
  directories.push(directory);
  Object.entries(modules).forEach(([name, source]) =>
    writeFileSync(join(directory, `${name}.tla`), source),
  );
  const [root] = Object.keys(modules);
  const { text, isFailed } = getSanyReport(
    join(directory, `${root}.tla`),
    (name) => (name in modules ? readFileSync(join(directory, `${name}.tla`), "utf8") : undefined),
    options,
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

  it("parses a module once the module that names it reaches it, though another loaded it", () => {
    const report = getReport(
      {
        Root: "---- MODULE Root ----\nEXTENDS A, B\nI == INSTANCE C\n====\n",
        A: "---- MODULE A ----\nLOCAL INSTANCE D\n====\n",
        B: "---- MODULE B ----\nLOCAL INSTANCE A\nLOCAL INSTANCE E\n====\n",
        C: "---- MODULE C ----\nEXTENDS F, E, G\n====\n",
        E: "---- MODULE E ----\nEXTENDS D\n====\n",
        D: "---- MODULE D ----\n====\n",
        F: "---- MODULE F ----\n====\n",
        G: "---- MODULE G ----\n====\n",
      },
      { describeFile: (name) => `${name}.tla` },
    );
    const order = ["D", "A", "E", "B", "F", "G", "C", "Root"];
    expect(report).toEqual({
      text: toText([
        ...["Root", "A", "B", "C", "F", "E", "G", "D"].map((name) => `Parsing file ${name}.tla`),
        ...order.map((name) => `Semantic processing of module ${name}`),
        ...order.map((name) => `Linting of module ${name}`),
      ]),
      isFailed: false,
    });
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

  it.each(["\\geq", "=<", "(+)", "\\circ"])(
    "names the unresolved operator %s as it is spelled",
    (operator) => {
      const report = getReport({ Infix: `---- MODULE Infix ----\nOp == 1 ${operator} 2\n====\n` });
      expect(report.text).toContain(
        `Could not find declaration or definition of symbol '${operator}'.`,
      );
      expect(report.text).toContain(`Couldn't resolve infix operator symbol \`${operator}'.`);
    },
  );

  it("reports an action without a subscript as an unsupported expression", () => {
    const report = getReport({
      Box: "---- MODULE Box ----\nVARIABLE x\nSpec == x = 0 /\\ [][x' = x] /\\ [x, x] = 1\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 20 to line 3, col 20 of module Box",
        "",
        "Unsupported expression type `['.",
        "",
        "",
        "line 3, col 32 to line 3, col 32 of module Box",
        "",
        "Unsupported expression type `['.",
        "",
        "",
      ]),
    );
  });

  // The messages come from SANY.
  it.each([
    ["x == {|}", "line 2, col 7 to line 2, col 7", "Unknown operator: `|'."],
    ["x == @@(1, 2)", "line 2, col 6 to line 2, col 7", "Unknown operator: `@@'."],
    [
      "x == {\\cup}",
      "line 2, col 7 to line 2, col 10",
      "The operator \\union requires 2 arguments.",
    ],
    [
      "F(a) == a\nx == F(\\in)",
      "line 3, col 8 to line 3, col 10",
      "Unsupported expression type `N_GenInfixOp'.",
    ],
    [
      "F(a) == a\nx == F(SUBSET)",
      "line 3, col 8 to line 3, col 13",
      "Unsupported expression type `N_GenNonExpPrefixOp'.",
    ],
    [
      "F(a) == a\nx == F(^#)",
      "line 3, col 8 to line 3, col 9",
      "Unsupported expression type `N_GenPostfixOp'.",
    ],
    [
      "F(a) == a\nx == F(LAMBDA y : y)",
      "line 3, col 8 to line 3, col 19",
      "LAMBDA expression used where an expression is required.",
    ],
  ])("reports an operator where %j needs an expression", (body, range, message) => {
    const report = getReport({ M: `---- MODULE M ----\n${body}\n====\n` });
    expect(report.text).toContain(`*** Errors: 1\n\n${range} of module M\n\n${message}\n`);
  });

  it.each([
    ["Z(c) == INSTANCE R\nx == Z(7)!Nope", "line 3, col 6 to line 3, col 14"],
    ["Z == INSTANCE R WITH c <- 1\nx == Z!Nope", "line 3, col 6 to line 3, col 11"],
  ])("locates the unknown operator of %j from the instance's name", (body, range) => {
    const report = getReport({
      M: `---- MODULE M ----\n${body}\n====\n`,
      R: "---- MODULE R ----\nCONSTANT c\n====\n",
    });
    expect(report.text).toContain(`${range} of module M\n\nUnknown operator: \`Z!Nope'.\n`);
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

  it.each([
    ["<>", "<>"],
    ["~", "\\lnot"],
    ["SUBSET", "SUBSET"],
  ])("reads a definition of the built-in prefix operator %s and rejects it", (operator, name) => {
    const definition = `${operator} a == a`;
    const report = getReport({ Prefix: `---- MODULE Prefix ----\n${definition}\n====\n` });
    const location = `line 2, col 1 to line 2, col ${definition.length} of module Prefix`;
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        location,
        "",
        `Operator ${name} already defined or declared.`,
        "",
        "",
        location,
        "",
        `Symbol ${name} is a built-in operator, and cannot be redefined.`,
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

  it("locates a substitution for a parameter of the definition at its target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nM(a) == INSTANCE Inner WITH a <- 1, C <- a\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      "line 2, col 29 to line 2, col 29 of module Outer\n\nIdentifier 'a' is not a legal target",
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

  it("validates the root module once it parses it", () => {
    const report = getReport({ Counter: COUNTER }, { describeFile: (name) => `${name}.tla` });
    expect(report.text.split("\n").slice(0, 3)).toEqual([
      "Parsing file Counter.tla",
      "Labels added.",
      "Parsing file Naturals.tla",
    ]);
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

// A --fair algorithm with a disjunction, with the checksum of TLC 1.7.4's SANY, which leaves out
// the columns of its junctions and that it is fair.
const FAIR = `---- MODULE Fair ----
EXTENDS Naturals
(* --fair algorithm Fair
variables x = 0;
begin
  Step: while x < 3 \\/ x = 4 do
    x := x + 1;
  end while;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "2c64e8f2" /\\ chksum(tla) = "e3ed5ed0")
VARIABLES pc, x

vars == << pc, x >>

Init == (* Global variables *)
        /\\ x = 0
        /\\ pc = "Step"

Step == /\\ pc = "Step"
        /\\ IF x < 3 \\/ x = 4
              THEN /\\ x' = x + 1
                   /\\ pc' = "Step"
              ELSE /\\ pc' = "Done"
                   /\\ x' = x

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\\ UNCHANGED vars

Next == Step
           \\/ Terminating

Spec == /\\ Init /\\ [][Next]_vars
        /\\ WF_vars(Next)

Termination == <>(pc = "Done")

\\* END TRANSLATION
====
`;

// The expected reports are what the SANY of TLC 1.7.4's tla2tools.jar prints.
describe("getSanyReport for TLC 1.7.4", () => {
  const options: SanyReportOptions = { version: "1.7.4" };

  it("prints the errors and warnings of a module together", () => {
    const report = getReport(
      {
        Twice: `---- MODULE Twice ----
Op == 1
Op == 2
Unknown == Missing
====
`,
      },
      options,
    );
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Operator Op already defined or declared.",
        "",
        "",
        "line 4, col 12 to line 4, col 18 of module Twice",
        "",
        "Unknown operator: `Missing'.",
        "",
        "",
        "*** Warnings: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Multiple declarations or definitions for symbol Op.  ",
        "This duplicates the one at line 2, col 1 to line 2, col 7 of module Twice.",
        "",
        "",
        "",
      ]),
    );
  });

  it("names only the last item of a selector it can't resolve", () => {
    const getError = (expression: string) =>
      getReport({ U: `---- MODULE U ----\nOp == ${expression}\n====\n` }, options)
        .text.split("\n")
        .slice(4, 7)
        .join("\n");
    expect(getError("M!Init")).toBe(
      "line 2, col 9 to line 2, col 12 of module U\n\nUnknown operator: `Init'.",
    );
    expect(getError("M!Init!1")).toBe(
      "line 2, col 14 to line 2, col 14 of module U\n\nUnknown operator: `argument selector 1'.",
    );
    expect(getError("M!Init!(1)")).toBe(
      "line 2, col 14 to line 2, col 16 of module U\n\nUnknown operator: `!(...)'.",
    );
  });

  it("reads a character past U+00FF in a string by its low byte", () => {
    const report = getReport({ Shapes: '---- MODULE Shapes ----\nX == "ǩ ●"\n====\n' }, options);
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("aborts on a character past U+00FF whose low byte is below 0x80, which its lexer cannot read", () => {
    const report = getReport(
      {
        Checked: `---- MODULE Checked ----
X == "✓"
====
`,
      },
      options,
    );
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      toText([
        'Lexical error at line 2, column 7.  Encountered: "\\u2713" (10003), after : "\\""',
        "",
        "Fatal errors while parsing TLA+ spec in file Checked",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "In module Checked",
        "",
        "Could not parse module Checked from file Checked.tla",
        "",
        "",
      ]),
    );
  });

  it("warns after the file it parses that the algorithm changed", () => {
    const report = getReport(
      { Counter: COUNTER.replace("x := x + 1", "x := x + 2") },
      { ...options, describeFile: (name) => `${name}.tla` },
    );
    expect(report).toEqual({
      text: toText([
        "Parsing file Counter.tla",
        "Labels added.",
        "!! WARNING: The PlusCal algorithm in module Counter has changed since its last translation.",
        "Parsing file Naturals.tla",
        "Semantic processing of module Naturals",
        "Semantic processing of module Counter",
      ]),
      isFailed: false,
    });
  });

  it("warns in its own words that both the algorithm and its translation changed", () => {
    const report = getReport({ Counter: COUNTER.replaceAll("x < 3", "x < 4") }, options);
    expect(report.text).toBe(
      toText([
        "Labels added.",
        "!! WARNING: The PlusCal algorithm and its TLA+ translation in module Counter filename since the last translation.",
      ]),
    );
  });

  it("checksums a fair algorithm by its text, without the columns of its junctions", () => {
    expect(getReport({ Fair: FAIR }, options)).toEqual({ text: "", isFailed: false });
    expect(getReport({ Fair: FAIR }).text).toContain(
      "The PlusCal algorithm in module Fair has changed since its last translation.",
    );
  });

  it("aborts without a location on a module it cannot find", () => {
    const report = getReport(
      {
        Lonely: `---- MODULE Lonely ----
EXTENDS Absent
====
`,
      },
      options,
    );
    expect(report.text).toBe(
      toText([
        "",
        "Fatal errors while parsing TLA+ spec in file Lonely",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "Unknown location",
        "",
        "Cannot find source file for module Absent imported in module Lonely.",
        "",
        "",
      ]),
    );
  });
});
