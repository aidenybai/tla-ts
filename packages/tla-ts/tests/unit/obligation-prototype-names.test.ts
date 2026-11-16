import { describe, expect, it } from "vite-plus/test";
import { getObligations } from "../../src/obligations";

const getTexts = (names: string[]) =>
  getObligations(
    [
      {
        file: "M.tla",
        source: [
          "---- MODULE M ----",
          `CONSTANTS ${names[0]}, ${names[1]}, ${names[2]}(_, _), ${names[3]}(_)`,
          `THEOREM ${names[3]}(${names[0]}) => ${names[2]}(${names[0]}, ${names[1]}) = ${names[1]}`,
          "  OBVIOUS",
          "====",
          "",
        ].join("\n"),
      },
    ],
    () => undefined,
  )[0].obligations.map((obligation) => obligation.text);

describe("constants named like Object.prototype members", () => {
  it.each([
    [["constructor", "toString", "valueOf", "hasOwnProperty"]],
    [["valueOf", "hasOwnProperty", "constructor", "toString"]],
    [["isPrototypeOf", "toLocaleString", "propertyIsEnumerable", "constructor"]],
  ])("print in obligations like any other constant: %j", (names) => {
    const plainNames = names.map((name, index) => "kmnp"[index].repeat(name.length));
    const plain = getTexts(plainNames).map((text) =>
      text.replace(
        new RegExp(plainNames.join("|"), "g"),
        (name) => names[plainNames.indexOf(name)],
      ),
    );
    expect(getTexts(names)).toEqual(plain);
    expect(plain.join("")).toContain(`${names[3]}(${names[0]})`);
  });
});
