import { describe, expect, it } from "vite-plus/test";
import { defineCommand } from "../../src/cli-options";

const command = defineCommand("tool {options} <file>...", [
  { flag: "-N", isRequired: true },
  { flag: "-seed <num>" },
  { flag: "--toolbox <start> <end>" },
  { flag: "-I <directory>", isRepeatable: true },
]);

describe("defineCommand", () => {
  it("formats the usage from the options", () => {
    expect(command.usage).toBe(
      "tool -N [-seed <num>] [--toolbox <start> <end>] [-I <directory>]... <file>...",
    );
  });

  it("takes one value for each name in a flag", () => {
    const parsed = command.parse(["--toolbox", "3", "7", "-N", "A.tla", "B.tla"]);
    expect(parsed.get("--toolbox")).toEqual(["3", "7"]);
    expect(parsed.has("-N")).toBe(true);
    expect(parsed.positionals).toEqual(["A.tla", "B.tla"]);
  });

  it("keeps every occurrence in order, and gets the last", () => {
    const parsed = command.parse(["-I", "a", "-seed", "1", "-I", "b", "-seed", "2"]);
    expect(parsed.options.filter((option) => option.name === "-I")).toEqual([
      { name: "-I", values: ["a"] },
      { name: "-I", values: ["b"] },
    ]);
    expect(parsed.get("-seed")).toEqual(["2"]);
  });

  it("reads a value that starts with a dash", () => {
    expect(command.parse(["-seed", "-5"]).get("-seed")).toEqual(["-5"]);
  });

  it("separates unknown flags from the positionals", () => {
    const parsed = command.parse(["-C", "A.tla"]);
    expect(parsed.unknown).toEqual(["-C"]);
    expect(parsed.positionals).toEqual(["A.tla"]);
  });

  it("reports an option that runs out of values", () => {
    const parsed = command.parse(["A.tla", "--toolbox", "3"]);
    expect(parsed.incomplete).toEqual({ name: "--toolbox", values: ["3"] });
    expect(parsed.get("--toolbox")).toEqual(["3"]);
    expect(parsed.has("-seed")).toBe(false);
    expect(parsed.get("-seed")).toBeUndefined();
  });
});
