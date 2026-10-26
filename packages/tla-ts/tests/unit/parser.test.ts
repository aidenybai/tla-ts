import { describe, expect, it } from "vite-plus/test";
import { parseModule, type Module } from "../../src";

const SOURCE = `---- MODULE Ranges ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
IfError == IF x THEN 1 ELSE 2
DomainError == DOMAIN x
FieldError == [a |-> 1, b |-> 2].c
AndError == /\\ x = 0
            /\\ x
ChooseError == CHOOSE n \\in {} : TRUE
InfixError == (x + 1) \\cup {(2)}
Paren == (x = 0)
====`;

const describeRange = (location: Module["definitions"][number]["location"]) => {
  const range = location.range;
  return (
    range &&
    `line ${range.start.line}, col ${range.start.column} to line ${range.end.line}, col ${range.end.column} of module ${range.module}`
  );
};

describe("parseModule records ranges like SANY", () => {
  const definitions = new Map(
    parseModule(SOURCE).definitions.map((definition) => [definition.name, definition]),
  );

  it.each([
    ["Init", "line 4, col 9 to line 4, col 13 of module Ranges"],
    ["IfError", "line 6, col 12 to line 6, col 29 of module Ranges"],
    ["DomainError", "line 7, col 16 to line 7, col 23 of module Ranges"],
    ["FieldError", "line 8, col 15 to line 8, col 34 of module Ranges"],
    ["AndError", "line 9, col 13 to line 10, col 16 of module Ranges"],
    ["ChooseError", "line 11, col 16 to line 11, col 37 of module Ranges"],
    ["InfixError", "line 12, col 15 to line 12, col 32 of module Ranges"],
    ["Paren", "line 13, col 11 to line 13, col 15 of module Ranges"],
  ])("ends the body of %s where TLC does", (name, range) => {
    expect(describeRange(definitions.get(name)?.body.location ?? { line: 0, column: 0 })).toBe(
      range,
    );
  });

  it("covers a definition from its name to the end of its body", () => {
    expect(describeRange(definitions.get("AndError")?.location ?? { line: 0, column: 0 })).toBe(
      "line 9, col 1 to line 10, col 16 of module Ranges",
    );
  });

  it("ends each conjunct of a bulleted list at its last token", () => {
    const body = definitions.get("AndError")?.body;
    expect(
      body?.kind === "And" && body.operands.map((operand) => describeRange(operand.location)),
    ).toEqual([
      "line 9, col 16 to line 9, col 20 of module Ranges",
      "line 10, col 16 to line 10, col 16 of module Ranges",
    ]);
  });
});
