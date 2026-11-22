import { describe, expect, it } from "vite-plus/test";
import { parseTlcArguments } from "../../src/cli/tlc-arguments";

const NUM_REQUIRED = `Error: You need to specify a 'num' argument when using the 'file' argument, for example: '"num=5,file=test.txt"'.`;

describe("TLC's -simulate arguments", () => {
  it("takes the largest long for a missing num, as TLC's default trace count is that value", () => {
    expect(
      parseTlcArguments(["-simulate", "num=9223372036854775807,file=traces", "Spec"]),
    ).toMatchObject({ kind: "command-line", error: NUM_REQUIRED });
  });

  it("accepts a file with any smaller num", () => {
    expect(
      parseTlcArguments(["-simulate", "num=9223372036854775806,file=traces", "Spec"]),
    ).toMatchObject({ traceCount: 9223372036854775806n });
  });

  it("rejects a file without a num", () => {
    expect(parseTlcArguments(["-simulate", "file=traces", "Spec"])).toMatchObject({
      kind: "command-line",
      error: NUM_REQUIRED,
    });
  });

  it("takes the last of stats=basic and stats=full, as TLC does", () => {
    expect(parseTlcArguments(["-simulate", "stats=full,stats=basic,num=5", "Spec"])).toMatchObject({
      actionStatistics: "basic",
    });
  });

  it("strips every file= from a path, as Java's String#replace does", () => {
    expect(parseTlcArguments(["-simulate", "num=4,file=trfile=", "Spec"])).toMatchObject({
      behaviorFile: "tr",
    });
  });

  it("strips every num= from a count, as Java's String#replace does", () => {
    expect(parseTlcArguments(["-simulate", "num=3num=", "Spec"])).toMatchObject({
      traceCount: 3n,
    });
  });

  it.each([
    [["sched=rl", "num=2"], "rl"],
    [["sched=rlaction", "num=2"], "rlaction"],
    [["sched=rl", "sched=rlaction,num=2"], "rl"],
  ])(
    "keeps the scheduler of an earlier -simulate and prefers rl, as TLC does (%j)",
    (options, scheduler) => {
      expect(
        parseTlcArguments([...options.flatMap((option) => ["-simulate", option]), "Spec"]),
      ).toMatchObject({ scheduler });
    },
  );

  it("keeps the stats of an earlier -simulate, which TLC never resets", () => {
    expect(
      parseTlcArguments(["-simulate", "num=5,stats=full", "-simulate", "num=5", "Spec"]),
    ).toMatchObject({ actionStatistics: "full" });
  });
});

describe("TLC's integer arguments", () => {
  it.each([
    ["Arabic-Indic", "٣", 3],
    ["Arabic-Indic", "+٣", 3],
    ["Extended Arabic-Indic", "۱۲", 12],
    ["fullwidth", "１２", 12],
    ["NKo", "߁", 1],
    ["Devanagari", "३", 3],
    ["Tamil", "௧", 1],
  ])("reads %s digits %j as Integer.parseInt and Long.parseLong do", (_script, text, value) => {
    expect(parseTlcArguments(["-fp", text, "-seed", text, "Spec"])).toMatchObject({
      fingerprintIndex: value,
      seed: BigInt(value),
    });
  });

  it("reads a minus sign before Arabic-Indic digits", () => {
    expect(parseTlcArguments(["-fp", "-٣", "Spec"])).toMatchObject({
      kind: "command-line",
      error: "Error: The number for -fp must be between 0 and 130 (inclusive).",
    });
  });

  it.each([
    ["a supplementary digit", "𝟑"],
    ["a digit before a letter", "٣x"],
    ["a superscript", "²"],
    ["a Roman numeral", "Ⅳ"],
    ["an ideographic zero", "〇"],
  ])("rejects %s, %j, as Character.digit does", (_name, text) => {
    expect(parseTlcArguments(["-fp", text, "Spec"])).toMatchObject({
      kind: "command-line",
      error: `Error: A number for -fp is required. But encountered ${text}`,
    });
  });
});

describe("TLC's -fpmem argument", () => {
  it.each(["0x1p-1", "0x.8p0", "\t0.5", "-0.0", "1e-400"])(
    "reads %j as Double.parseDouble does",
    (text) => {
      expect(parseTlcArguments(["-fpmem", text, "Spec"])).toMatchObject({ specs: ["Spec"] });
    },
  );

  it.each(["NaN", "-NaN", "0.5 ", "-Infinity"])(
    "rejects %j, which Double.parseDouble or FPSetConfiguration#setRatio rejects",
    (text) => {
      expect(parseTlcArguments(["-fpmem", text, "Spec"])).toMatchObject({
        kind: "command-line",
        error: `Error: An positive integer or a fraction for fpset memory size/percentage required. But encountered ${text}`,
      });
    },
  );
});
