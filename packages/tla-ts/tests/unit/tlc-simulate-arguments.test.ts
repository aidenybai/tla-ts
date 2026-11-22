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
