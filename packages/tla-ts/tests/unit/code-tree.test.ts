import { describe, expect, it } from "vite-plus/test";
import type { Definition } from "../../src/ast";
import { parseModule } from "../../src/parser";
import {
  afterBlankLine,
  apply,
  boundIn,
  defineOperator,
  functionOf,
  ifThen,
  letIn,
  num,
  onLine,
  parenthesized,
  printCodeDefinition,
  printCodeExpression,
  string,
  subscript,
  tuple,
  withInnerLines,
} from "../../src/typescript/spec/code-tree";
import { getPatchedUnits, getPatches } from "../../src/typescript/spec/units";

const POSITIONS = new Set([
  "location",
  "head",
  "bodyRange",
  "argumentsRange",
  "argumentRanges",
  "prefixEnds",
  "ranges",
  "tupleRange",
  "range",
]);

// A definition's syntax without the positions of its nodes.
const getSyntax = (definition: Definition) =>
  JSON.parse(JSON.stringify(definition, (key, value) => (POSITIONS.has(key) ? undefined : value)));

const parseDefinition = (text: string) =>
  parseModule(`---- MODULE M ----\n${text}\n====`).definitions[0];

// The units of the source text that t gives, as a program's code reads them.
const getSourceUnits = () => {
  // TLA+ reads t[2] + i - 1 as t[2] + (i - 1), as - binds tighter than +.
  const getPosition = () => apply("+", [subscript("t", [num(2)]), apply("-", ["i", num(1)])]);
  return defineOperator(
    "SourceUnits",
    ["t"],
    onLine(
      withInnerLines(
        letIn(
          [
            defineOperator("u", [], apply("StringUnits", [subscript("Texts", ["t"])])),
            onLine(defineOperator("p", [], subscript("Patches", [subscript("t", [num(1)])])), 6),
          ],
          functionOf(
            [boundIn("i", apply("DOMAIN", ["u"]))],
            ifThen(
              apply("\\in", [getPosition(), apply("DOMAIN", ["p"])]),
              subscript("p", [getPosition()]),
              subscript("u", ["i"]),
            ),
          ),
        ),
        2,
      ),
      2,
    ),
  );
};

describe("the syntax trees of a program's code", () => {
  it("prints a text's units as a string with its patches", () => {
    expect(printCodeExpression(getPatchedUnits('aĀb"\n'))).toBe(
      'LET u == StringUnits("a?b\\"\\n") p == (2 :> 256) IN [i \\in DOMAIN u |-> IF i \\in DOMAIN p THEN p[i] ELSE u[i]]',
    );
    expect(printCodeExpression(getPatchedUnits("plain"))).toBe('StringUnits("plain")');
  });

  it("prints patches joined in halves", () => {
    expect(
      printCodeExpression(
        getPatches([
          [1, 10],
          [2, 20],
          [3, 30],
        ]),
      ),
    ).toBe("((1 :> 10) @@ ((2 :> 20) @@ (3 :> 30)))");
    expect(printCodeExpression(getPatches([]))).toBe("<<>>");
  });

  it("prints a line of nothing but spaces before a node", () => {
    expect(
      printCodeDefinition(defineOperator("Declarations", ["s"], onLine(afterBlankLine("s", 2), 2))),
    ).toBe("Declarations(s) ==\n  \n  s");
  });

  it("prints the lines that a definition's nodes start", () => {
    expect(printCodeDefinition(getSourceUnits())).toBe(
      [
        "SourceUnits(t) ==",
        "  LET u == StringUnits(Texts[t])",
        "      p == Patches[t[1]]",
        "  IN [i \\in DOMAIN u |-> IF t[2] + i - 1 \\in DOMAIN p THEN p[t[2] + i - 1] ELSE u[i]]",
      ].join("\n"),
    );
  });

  it.each([
    ["a units definition", defineOperator("Units1", [], getPatchedUnits("aĀāb"))],
    ["a definition on lines", getSourceUnits()],
    [
      "a negative number",
      defineOperator("Limit", ["file"], tuple([num(-1), string("x"), apply("Val", ["r.s"])])),
    ],
    [
      "a parenthesized difference",
      defineOperator("D", [], apply("-", [num(1), parenthesized(apply("-", [num(2), num(3)]))])),
    ],
  ])("parses what it prints of %s as the same tree", (_, definition) => {
    expect(getSyntax(parseDefinition(printCodeDefinition(definition)))).toEqual(
      getSyntax(definition),
    );
  });

  it("parses a difference that it prints without its parentheses as another tree", () => {
    const definition = defineOperator("D", [], apply("-", [num(1), apply("-", [num(2), num(3)])]));
    expect(printCodeDefinition(definition)).toBe("D == 1 - 2 - 3");
    expect(getSyntax(parseDefinition(printCodeDefinition(definition)))).not.toEqual(
      getSyntax(definition),
    );
  });
});
