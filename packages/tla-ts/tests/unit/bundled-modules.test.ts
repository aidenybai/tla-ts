import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const checkInit = (init: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS RealTime, Toolbox\nVARIABLE x\nInit == x = 0 /\\ now = 0 /\\ ${init}\nNext == UNCHANGED <<x, now>>\n====`,
    config: "INIT Init\nNEXT Next",
  });

describe("bundled modules match TLC's sources", () => {
  it("reports errors at the lines of TLC's Reals and RealTime modules", async () => {
    expect((await checkInit("Infinity = 0")).failure?.message).toContain(
      "line 17, col 13 to line 17, col 65 of module Reals",
    );
    expect((await checkInit("RTBound(x' = x, x, 0, 1)")).failure?.message).toContain(
      "line 20, col 6 to line 20, col 49 of module RealTime",
    );
  });

  it("evaluates the definitions of TLC's Reals and Toolbox modules", async () => {
    expect((await checkInit('Real = "Reals"')).status).toBe("success");
    expect((await checkInit("_TETrace = 0")).failure?.message).toContain(
      "Attempted to enumerate S \\ T when S:\nNat\nis not enumerable.",
    );
  });
});
