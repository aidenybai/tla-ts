import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { createSanyError } from "../../src/errors";

const DIRECTORY = join(import.meta.dirname, "../fixtures/subexpressions");

const SOURCE = readFileSync(join(DIRECTORY, "Subexpressions.tla"), "utf8");

const checkSubexpressions = (source: string, configName: string) =>
  check({
    source,
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: (name) => readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
  });

describe("subexpression references match TLC", () => {
  it("selects operands, bound bodies, labels, LET definitions, and instance operators", async () => {
    const result = await checkSubexpressions(SOURCE, "Subexpressions.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations of labeled subexpressions", async () => {
    const result = await checkSubexpressions(SOURCE, "Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Broken");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("rejects an assumption whose selected operand differs", async () => {
    const source = SOURCE.replace("ASSUME A!Double(4)!1!<< = 4", "ASSUME A!Double(4)!1!<< = 8");
    expect((await checkSubexpressions(source, "Subexpressions.cfg")).status).toBe(
      "assumption-violation",
    );
  });
});

// TLC's test210 and variants of it, with the errors SANY reports for them.
describe("subexpression references into theorems match SANY", () => {
  const SCOPE = "within the scope of a declaration\n from outside that declaration's scope.";

  const getSanyError = (errors: string[][], module: string) =>
    createSanyError(
      errors.map(([location, message]) => ({
        location: `${location} of module ${module}`,
        message,
      })),
    );

  const checkModule = (definitions: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLE x\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("reports every error SANY reports for test210", async () => {
    await expect(
      checkSubexpressions(readFileSync(join(DIRECTORY, "test210.tla"), "utf8"), "test210.cfg"),
    ).rejects.toThrow(
      getSanyError(
        [
          [
            "line 33, col 16 to line 33, col 19",
            `Accessing subexpression labeled \`laby' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          ["line 35, col 16 to line 35, col 16", `Accessing ASSUME/PROVE clause ${SCOPE}`],
          [
            "line 42, col 41 to line 42, col 55",
            "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
          ],
          [
            "line 43, col 30 to line 43, col 44",
            "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
          ],
          [
            "line 55, col 16 to line 55, col 16",
            "Accessing non-existent subexpression of a SUFFICES",
          ],
          [
            "line 62, col 15 to line 62, col 18",
            `Accessing subexpression labeled \`laby' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          [
            "line 63, col 15 to line 63, col 18",
            `Accessing subexpression labeled \`labi' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          [
            "line 64, col 15 to line 64, col 18",
            `Accessing subexpression labeled \`labu' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          ["line 65, col 15 to line 65, col 15", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ],
        "test210",
      ),
    );
  });

  it.each([
    [
      "a label or clause in the scope of a NEW, from outside the proof",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v \\in labx :: LEGAL, labz :: LEGAL PROVE labu :: LEGAL\nBar == foo!labx /\\ foo!labz\nBaz == foo!1 /\\ foo!2",
      [
        [
          "line 5, col 24 to line 5, col 27",
          "Accessing subexpression labeled `labz' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 6, col 8 to line 6, col 12",
          "Selected a NEW declaration as an expression or operator.",
        ],
        [
          "line 6, col 21 to line 6, col 21",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
      ],
    ],
    [
      "a SUFFICES step, from within its proof and with a missing clause",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v, lab :: LEGAL PROVE LEGAL\n<1>1. SUFFICES ASSUME NEW y, laba :: LEGAL PROVE LEGAL\n  <2>1. <1>1!laba /\\ <1>1!1!2\n  <2>2. QED\n<1>2. <1>1!laba /\\ <1>1!1!2 /\\ <1>1!1!3\n<1>3. SUFFICES LEGAL\n<1>4. <1>3!1\n<1>5. <1>3!2\n<1>6. <1>1!3\n<1>7. QED",
      [
        [
          "line 6, col 14 to line 6, col 17",
          "Accessing subexpression labeled `laba' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 6, col 29 to line 6, col 29",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 11, col 12 to line 11, col 12",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
        [
          "line 12, col 12 to line 12, col 12",
          "Accessing non-existent subexpression of a SUFFICES",
        ],
      ],
    ],
    [
      "facts that select clauses and labels in the scope of a NEW",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v, lab :: LEGAL, ASSUME NEW y PROVE LEGAL PROVE LEGAL\nTHEOREM TRUE\nBY foo!2, foo!1, foo!3, foo!lab, foo!4\nTHEOREM TRUE\nBY foo!3!1, foo!3!2\nUSE foo!lab",
      [
        [
          "line 6, col 8 to line 6, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 6, col 22 to line 6, col 22",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 6, col 29 to line 6, col 31",
          "Accessing subexpression labeled `lab' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 6, col 38 to line 6, col 38",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 8, col 8 to line 8, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 8, col 17 to line 8, col 17",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 9, col 9 to line 9, col 11",
          "Accessing subexpression labeled `lab' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
      ],
    ],
    [
      "a NEW declaration, an ASSUME/PROVE, and a missing operand or label",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, ASSUME NEW y, LEGAL PROVE LEGAL PROVE LEGAL\nA == foo!2!2\nB == foo!2\nC == foo!2!3!1\nD == foo!4\nTHEOREM bar == ASSUME NEW v, LEGAL PROVE LEGAL\nE == bar!1!1\nF == bar!3\nG == bar!nolab",
      [
        [
          "line 5, col 12 to line 5, col 12",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        ["line 6, col 6 to line 6, col 10", "Selected ASSUME/PROVE instead of expression."],
        [
          "line 7, col 12 to line 7, col 12",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 8, col 10 to line 8, col 10",
          "Nonexistent operand specified by `argument selector 4'.",
        ],
        [
          "line 10, col 10 to line 10, col 10",
          "Selected a subexpression of a NEW clause of an ASSUME.",
        ],
        [
          "line 11, col 10 to line 11, col 10",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        ["line 12, col 10 to line 12, col 14", "Cannot find label `nolab'."],
      ],
    ],
    [
      "labels outside a definition, a named theorem, or a numbered step",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, ASSUME NEW v, l1 :: v PROVE l2 :: v PROVE LEGAL\nTHEOREM ASSUME NEW y, ASSUME LEGAL, ASSUME NEW v PROVE l3 :: v PROVE l4 :: LEGAL PROVE LEGAL\nBaz == foo!l1\nTHEOREM le :: TRUE\nTHEOREM LET G == lf :: TRUE IN lg :: G\nUSE li :: TRUE\nTHEOREM TRUE\n<1>1. TRUE\n  <2>1. TRUE BY lj :: TRUE\n  <2>2. QED\n<1>2. HAVE lk :: TRUE\n<1> HAVE ll :: TRUE\n<1> DEFINE H == ln :: TRUE\n<1>3. QED",
      [
        [
          "line 4, col 44 to line 4, col 50",
          "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
        ],
        [
          "line 4, col 58 to line 4, col 64",
          "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
        ],
        ["line 5, col 56 to line 5, col 62", "Label not in definition or proof step."],
        ["line 5, col 70 to line 5, col 80", "Label not in definition or proof step."],
        ["line 6, col 12 to line 6, col 13", "Cannot find label `l1'."],
        ["line 7, col 9 to line 7, col 18", "Label not in definition or proof step."],
        ["line 8, col 32 to line 8, col 38", "Label not in definition or proof step."],
        ["line 9, col 5 to line 9, col 14", "Label not in definition or proof step."],
        ["line 12, col 17 to line 12, col 26", "Label not in definition or proof step."],
        ["line 15, col 10 to line 15, col 19", "Label not in definition or proof step."],
      ],
    ],
  ])("reports every error SANY reports for %s", async (_name, definitions, errors) => {
    await expect(checkModule(definitions)).rejects.toThrow(getSanyError(errors, "M"));
  });

  it("accepts the references SANY accepts", async () => {
    const result = await checkModule(
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, lab :: LEGAL, ASSUME LEGAL PROVE labi :: LEGAL PROVE lab2 :: LEGAL\nBar == foo!lab /\\ foo!1 /\\ foo!2 /\\ foo!4 /\\ foo!lab2 /\\ foo!labi /\\ foo!3!1 /\\ foo!3!2 /\\ foo!<<\nTHEOREM bar == ASSUME NEW v, lv :: v = v, ASSUME NEW w PROVE w = w PROVE LEGAL\n<1>1. bar!lv /\\ bar!2 /\\ bar!4\n<1>2. ASSUME NEW z, lz :: z = 1 PROVE TRUE\n  <2>1. ASSUME NEW w PROVE <1>2!lz /\\ <1>2!2\n    <3>1. <2>1!2 /\\ <1>2!lz\n    <3>2. QED\n  <2>2. QED BY <1>2!1, <1>2!2, <2>1!1\n<1>3. SUFFICES ASSUME NEW q, lq :: q = q PROVE LEGAL\n<1>4. <1>3!lq /\\ <1>3!1!2 /\\ <1>3!<<!2\n<1>5. QED BY bar!1, bar!3",
    );
    expect(result.status).toBe("success");
  });
});
