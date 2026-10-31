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

  const EXPRESSION_ARGUMENT =
    "An expression appears as argument number 1 (counting from 1) to operator 'Apply', in a position an operator is required.";
  it.each([
    ["UNCHANGED x", "line 6, col 12 to line 6, col 22", EXPRESSION_ARGUMENT],
    ["(F)", "line 6, col 12 to line 6, col 14", EXPRESSION_ARGUMENT],
    [
      "-.",
      "line 6, col 12 to line 6, col 13",
      "Could not find declaration or definition of symbol '-.'.",
    ],
    [
      "LAMBDA y, z : y",
      "line 6, col 6 to line 6, col 10",
      "Lambda expression with arity 2 used as argument 1 of operator `Apply', \nbut an operator of arity 1 is required.",
    ],
    [
      "+",
      "line 6, col 6 to line 6, col 10",
      "Operator with incorrect arity passed as argument. \nOperator '+' of arity 2 is argument number 1 (counting from 1) to operator `line 5, col 1 to line 5, col 22 of module M', \nbut an operator of arity 1 was expected.",
    ],
  ])(
    "reports the operator argument %j that doesn't fit as SANY does",
    (argument, range, message) => {
      const report = getReport({
        M: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nF(y) == y\nApply(G(_), v) == G(v)\nA == Apply(${argument}, x)\n====\n`,
      });
      expect(report.text).toContain(`*** Errors: 2\n\n${range} of module M\n\n${message}\n`);
    },
  );

  it.each([
    ["VARIABLES x,\n  y", "line 4, col 1 to line 5, col 3", "A VARIABLE declaration"],
    ["CONSTANT C", "line 4, col 1 to line 4, col 10", "A declaration"],
    ["AXIOM A == TRUE", "line 4, col 1 to line 4, col 15", "An ASSUME"],
    ["THEOREM T == TRUE", "line 4, col 1 to line 4, col 17", "A THEOREM"],
    ["USE DEF F", "line 4, col 1 to line 4, col 9", "A USE or HIDE"],
  ])("rejects %j between a RECURSIVE declaration and its definition", (unit, range, type) => {
    const report = getReport({
      M: `---- MODULE M ----\nEXTENDS Naturals\nRECURSIVE F(_)\n${unit}\nF(n) == IF n = 0 THEN 0 ELSE F(n-1)\n====\n`,
    });
    expect(report.text).toContain(
      `*** Errors: 1\n\n${range} of module M\n\n${type} may not appear within a recursive definition section.\n`,
    );
  });

  it.each([
    ["RECURSIVE F(_)", "F", "line 3, col 11 to line 3, col 14", 1],
    ["RECURSIVE F(_)\nF(x) == 1\nRECURSIVE F(_)", "F", "line 5, col 11 to line 5, col 14", 1],
    ["RECURSIVE F(_)\nF[x \\in Nat] == 1", "F", "line 3, col 11 to line 3, col 14", 2],
    ["A == LET RECURSIVE G(_) IN 1", "G", "line 3, col 20 to line 3, col 23", 1],
  ])("reports what %j declares RECURSIVE but leaves undefined", (body, name, range, count) => {
    const report = getReport({ M: `---- MODULE M ----\nEXTENDS Naturals\n${body}\n====\n` });
    expect(report.text).toContain(`*** Errors: ${count}\n`);
    expect(report.text).toContain(
      `${range} of module M\n\nSymbol ${name} declared in RECURSIVE statement but not defined.\n`,
    );
  });

  // OpDefNode.setParams keeps the arity of the RECURSIVE declaration, so only OpDefNode.match
  // finds the number of arguments wrong.
  it.each([
    ["RECURSIVE F(_)\nF == 1\nA == F(1)", "line 5, col 6 to line 5, col 9", 1, 0],
    ["RECURSIVE F\nF(x) == 1\nA == F", "line 5, col 6 to line 5, col 6", 0, 1],
    ["RECURSIVE F(_, _)\nF(x) == x\nA == F(1, 2)", "line 5, col 6 to line 5, col 12", 2, 1],
  ])("reports %j as given the wrong number of arguments", (body, range, given, required) => {
    const report = getReport({ M: `---- MODULE M ----\nEXTENDS Naturals\n${body}\n====\n` });
    expect(report.text).toContain("*** Errors: 2\n");
    expect(report.text).toContain(
      `${range} of module M\n\nWrong number of arguments (${given}) given to operator 'F', \nwhich requires ${required} arguments.\n`,
    );
  });

  it("takes an instance between a RECURSIVE declaration and its definition", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nRECURSIVE F(_)\nI == INSTANCE Naturals\nF(n) == IF n = 0 THEN 0 ELSE F(n-1)\n====\n",
    });
    expect(report.isFailed).toBe(false);
  });

  it("takes the parentheses of an operator's only argument for the operator's own", () => {
    const report = getReport({
      M: "---- MODULE M ----\nF(y) == y\nOp(G(_)) == G(1)\nA == Op(F)\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
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

  it.each([
    [
      "the module itself",
      "---- MODULE Self ----\nVARIABLE y\nI == INSTANCE Self\n====\n",
      "  Self.tla --> Self.tla",
    ],
    [
      "an inner module",
      "---- MODULE Self ----\n  ---- MODULE A ----\n  VARIABLE y\n  I == INSTANCE A\n  ====\n====\n",
      "Cannot find source file for module A imported in module A.",
    ],
  ])("looks for a file for an instance of %s that it is in, as SANY does", (_, source, error) => {
    const report = getReport({ Self: source });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(error);
  });

  it("reports a []ASSUME matched by PROVE in an ASSUME's scope with both errors as SANY does", () => {
    const report = getReport({
      Box: "---- MODULE Box ----\nTHEOREM T == ASSUME NEW J PROVE TRUE\n<1>1 []ASSUME TRUE PROVE TRUE\n<1> QED\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(
      toText([
        "*** Errors: 2",
        "",
        "line 3, col 6 to line 3, col 13 of module Box",
        "",
        "[]ASSUME matched by PROVE instead of []PROVE",
        "",
        "",
        "line 3, col 6 to line 3, col 13 of module Box",
        "",
        "[]ASSUME used within the scope of an ordinary ASSUME's assumptions",
      ]),
    );
  });

  it.each([
    ["E == \\A y \\in S : L:: y = 1", "Label L must contain formal parameter `y'."],
    ["E == \\A y \\in S : L(y, y):: y = 1", "Repeated formal parameter y \nin label `L'."],
    ["E == L(z):: 1 = 1", "Illegal parameter z of label `L'."],
    ["E == L(z):: 1 = 1", "Label L declares extra parameter(s)  z  "],
    ["E == [y \\in S |-> L:: y]", "Label L must contain formal parameter `y'."],
    ["f[y \\in S] == L:: y", "Label L must contain formal parameter `y'."],
    ["E == (L:: 1 = 1) /\\ (L:: 2 = 2)", "Duplicate label `L'."],
    ["ASSUME L:: TRUE", "Label not in definition or proof step."],
    [
      "VARIABLE x\nE == [x EXCEPT ![1] = L:: 2]",
      "Labels inside EXCEPT clauses are not yet implemented.",
    ],
  ])("checks the label in %j as SANY does", (unit, error) => {
    const report = getReport({ M: `---- MODULE M ----\nCONSTANT S\n${unit}\n====\n` });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(`\n\n${error}\n`);
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

  it("locates a substitution target named in an earlier substitution at the target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nVARIABLE z\nI == INSTANCE Inner WITH x <- z, z <- x\n====\n",
      Inner: "---- MODULE Inner ----\nVARIABLE x\n====\n",
    });
    expect(report.text).toContain(
      "line 3, col 34 to line 3, col 34 of module Outer\n\nIdentifier 'z' is not a legal target",
    );
  });

  it("binds no bound identifier in the body of a function named by a parameter", () => {
    const report = getReport({
      Fold: "---- MODULE Fold ----\nF(it, S) == LET it[s \\in S] == s IN it\n====\n",
    });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 2, col 17 to line 2, col 32 of module Fold",
        "",
        "Function name `it' already defined or declared.",
        "",
        "",
        "line 2, col 32 to line 2, col 32 of module Fold",
        "",
        "Unknown operator: `s'.",
        "",
        "",
      ]),
    );
  });

  it("binds the bound identifiers in the body of a function whose name is already defined", () => {
    const report = getReport({
      Twice: "---- MODULE Twice ----\nf[x \\in {1}] == x\nf[x \\in {1}] == x\n====\n",
    });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 17 of module Twice",
        "",
        "Function name `f' already defined or declared.",
        "",
        "",
      ]),
    );
  });

  it("reads MODULE as the start of a fact", () => {
    const report = getReport({
      Facts:
        "---- MODULE Facts ----\nTHEOREM T == TRUE\nUSE MODULE Facts, T\nTHEOREM TRUE BY MODULE Facts\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("reports a module in a fact that isn't extended or instantiated, and leaves it out", () => {
    const report = getReport({ Facts: "---- MODULE Facts ----\nUSE DEF MODULE Nope\n====\n" });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 2, col 16 to line 2, col 19 of module Facts",
        "",
        "Module `Nope' used without being extended or instantiated.",
        "",
        "",
        "line 2, col 1 to line 2, col 19 of module Facts",
        "",
        "Empty USE or HIDE statement.",
        "",
        "",
      ]),
    );
  });

  it("reads a DEF clause entry that isn't a name as SANY reads its syntax node", () => {
    const report = getReport({
      Defs: "---- MODULE Defs ----\nA == 1\nTHEOREM TRUE BY A DEF UNION A, A + 1, (A), A(1), A\n====\n",
    });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 14",
        "",
        "line 3, col 23 to line 3, col 29 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 29 to line 3, col 29 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 29 to line 3, col 29 of module Defs",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 3, col 23 to line 3, col 29 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 32 to line 3, col 36 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 34 to line 3, col 34 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 34 to line 3, col 34 of module Defs",
        "",
        "Need name or step number here, not `N_GenInfixOp'.",
        "",
        "",
        "line 3, col 32 to line 3, col 36 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 40 to line 3, col 40 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 40 to line 3, col 40 of module Defs",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 3, col 39 to line 3, col 41 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 44 to line 3, col 47 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 45 to line 3, col 47 of module Defs",
        "",
        "Selector `!(...)' should not have argument(s).",
        "",
        "",
        "line 3, col 44 to line 3, col 47 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
      ]),
    );
  });

  it("takes only an identifier or an operator for a substitution target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nINSTANCE Inner WITH VARIABLES <- 1\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      'Encountered "VARIABLES" at line 2, column 21 and token "WITH" \n\nResidual stack trace follows:\nSubstitution starting at line 2, column 21.',
    );
  });

  it("spells an operator that is no legal substitution target as the source does", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nINSTANCE Inner WITH \\lnot <- 1\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      "line 2, col 21 to line 2, col 25 of module Outer\n\nIdentifier '\\lnot' is not a legal target",
    );
  });

  it("reads @ as an identifier", () => {
    const report = getReport({
      At: "---- MODULE At ----\nVARIABLE @\nA == @ + 1\nB == \\A @ \\in {} : @\n====\n",
    });
    expect(report.text).toBe(
      toText([
        "Semantic errors:",
        "",
        "*** Errors: 5",
        "",
        "line 2, col 10 to line 2, col 10 of module At",
        "",
        "Attempted to declare '@' as a variable.",
        "",
        "",
        "line 3, col 8 to line 3, col 8 of module At",
        "",
        "Could not find declaration or definition of symbol '+'.",
        "",
        "",
        "line 3, col 6 to line 3, col 10 of module At",
        "",
        "Couldn't resolve infix operator symbol `+'.",
        "",
        "",
        "line 4, col 9 to line 4, col 9 of module At",
        "",
        "Multiply-defined symbol '@': this definition or declaration conflicts ",
        "with the one at line 2, col 10 to line 2, col 10 of module At.",
        "",
        "",
        "line 4, col 20 to line 4, col 20 of module At",
        "",
        "@ used where its meaning is not defined.",
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
