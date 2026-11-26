import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const ECMASCRIPT_DIRECTORY = join(import.meta.dirname, "../../ecmascript");

const loadModule = (name: string) => {
  const path = join(ECMASCRIPT_DIRECTORY, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

// Names whose order by code units differs from their order in the set and from their order by
// characters: a prefix, a capital, a non-ASCII letter, and a pair of surrogates.
const NAMES = ["b", "ab", "a", "", "\u{1F600}", "é", "B", "ba", "\uffff"];

const getUnits = (name: string) =>
  `<<${Array.from({ length: name.length }, (_, index) => name.charCodeAt(index)).join(", ")}>>`;

// Whether JS.tla's expression is the names in the given order, as a check of a spec that extends
// JS.tla asserts.
const getStatus = async (expression: string, names: string[]) =>
  (
    await check({
      source: `---- MODULE SortCheck ----\nEXTENDS JS\nVARIABLE x\nInit == x = 0 /\\ Assert(${expression} = <<${names.map(getUnits).join(", ")}>>, "sorted otherwise")\nNext == UNCHANGED x\n====`,
      config: "INIT Init\nNEXT Next\nCONSTANTS None = None\nEmpty = Empty\nAbsent = Absent\n",
      loadModule,
    })
  ).status;

// JavaScript sorts strings by their UTF-16 code units, as CodeUnitLess orders names.
const SORTED = NAMES.toSorted();

describe("sorts names by their code units in JS.tla", () => {
  it("sorts a set of names as JavaScript sorts them", async () => {
    expect(await getStatus(`SortCodeUnits({${NAMES.map(getUnits).join(", ")}})`, SORTED)).toBe(
      "success",
    );
  });

  it("sorts a sequence of names, without repeats, as JavaScript sorts them", async () => {
    const repeated = [...NAMES, "a", "\u{1F600}"];
    expect(
      await getStatus(`SortDistinctUnits(<<${repeated.map(getUnits).join(", ")}>>)`, SORTED),
    ).toBe("success");
  });

  it("rejects another order", async () => {
    expect(
      await getStatus(`SortCodeUnits({${NAMES.map(getUnits).join(", ")}})`, SORTED.toReversed()),
    ).toBe("error");
  });
});
