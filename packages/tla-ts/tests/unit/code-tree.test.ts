import { describe, expect, it } from "vite-plus/test";
import type { Definition } from "../../src/ast";
import { tokenize } from "../../src/lexer";
import { parenthesizedRanges, parseModule } from "../../src/parser";
import { getParsedTexts } from "../../src/tlc/order";
import {
  afterBlankLine,
  apply,
  boundIn,
  caseOf,
  defineOperator,
  except,
  exceptAt,
  functionOf,
  ifThen,
  layOutModule,
  letIn,
  num,
  onLine,
  parenthesized,
  pathTo,
  printCodeDefinition,
  printCodeExpression,
  recordOf,
  setOf,
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

// A module's syntax with each node's position, its keys in order, as the parser and the layout
// give it.
const getPlacedSyntax = (value: unknown) =>
  JSON.stringify(value, (_key, item: unknown) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return item;
    const plain: object =
      "toJSON" in item && typeof item.toJSON === "function" ? item.toJSON() : item;
    return Object.fromEntries(
      Object.entries(plain).sort((left, right) => (left[0] < right[0] ? -1 : 1)),
    );
  });

// A module's text and its parts: a definition of each kind of node, on lines of their own, and text.
const getModuleParts = () => [
  "---- MODULE Code ----",
  "EXTENDS Naturals",
  "RECURSIVE Units1(_)",
  getSourceUnits(),
  defineOperator(
    "Units1",
    ["x"],
    letIn(
      [defineOperator("r", [], apply("F", ["x.s", num(-1)]))],
      ifThen(
        apply("IsAbrupt", ["r"]),
        "r",
        onLine(
          except("x", [
            [[pathTo("a"), pathTo([num(1)])], apply("\\cup", [exceptAt(), setOf([])])],
            [[pathTo("b")], recordOf([["c", string('d"e')]])],
          ]),
          2,
        ),
      ),
    ),
  ),
  "Text == <<1, 2>>",
  defineOperator("Declarations", ["s"], onLine(afterBlankLine("s", 2), 2)),
  defineOperator(
    "Dispatch",
    ["id"],
    parenthesized(
      withInnerLines(caseOf([[apply("=", ["id", num(1)]), string("one")]], "Empty"), 4),
    ),
  ),
  "====",
  "",
];

describe("the layout of a program's code", () => {
  it("places each node where the parser reads it in the text it prints as", () => {
    const parts = getModuleParts();
    const laidOut = layOutModule("Code", parts);
    const text = parts
      .map((part) =>
        typeof part === "string" ? part : printCodeDefinition(part, laidOut.placements),
      )
      .join("\n");
    const tokens = tokenize(text);
    const parsed = parseModule(text);
    expect(getPlacedSyntax(laidOut.module)).toBe(getPlacedSyntax(parsed));
    expect(laidOut.texts).toEqual({
      parsed: [...new Set(getParsedTexts(tokens))],
      strings: [
        ...new Set(tokens.flatMap((token) => (token.kind === "String" ? [token.text] : []))),
      ],
    });
    const getParenthesized = (definitions: Definition[]) => {
      const body = definitions.find((definition) => definition.name === "Dispatch")?.body;
      return getPlacedSyntax(body === undefined ? undefined : parenthesizedRanges.get(body));
    };
    expect(getParenthesized(laidOut.module.definitions)).toContain("start");
    expect(getParenthesized(laidOut.module.definitions)).toBe(getParenthesized(parsed.definitions));
  });

  it("gives each node the properties that the parser gives it, in its order", () => {
    const parts = getModuleParts();
    const laidOut = layOutModule("Code", parts);
    const text = parts
      .map((part) =>
        typeof part === "string" ? part : printCodeDefinition(part, laidOut.placements),
      )
      .join("\n");
    // Each object's keys in order, with the shape of each value, as V8 gives objects their maps.
    const getShape = (value: unknown): unknown =>
      value === null || typeof value !== "object"
        ? typeof value
        : Array.isArray(value)
          ? value.map(getShape)
          : Object.entries(value).map((entry) => [entry[0], getShape(entry[1])]);
    expect(getShape(laidOut.module.units)).toEqual(getShape(parseModule(text).units));
  });

  it("places a node of a tree at another line than its text puts it", () => {
    const parts = getModuleParts();
    const laidOut = layOutModule("Code", parts);
    const text = parts
      .map((part) => (typeof part === "string" ? part : printCodeDefinition(part)))
      .join("\n");
    expect(getPlacedSyntax(laidOut.module)).not.toBe(getPlacedSyntax(parseModule(text)));
  });
});
