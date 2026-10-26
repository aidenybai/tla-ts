import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const checkInit = (init: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS RealTime, Toolbox\nVARIABLE x\nInit == x = 0 /\\ now = 0 /\\ ${init}\nNext == UNCHANGED <<x, now>>\n====`,
    config: "INIT Init\nNEXT Next",
  });

describe("bundled modules match TLC's sources", () => {
  it("reports errors at the lines of TLC's Reals and RealTime modules", async () => {
    await expect(checkInit("Infinity = 0")).rejects.toThrow("at line 17, column 13");
    await expect(checkInit("RTBound(x' = x, x, 0, 1)")).rejects.toThrow("at line 20, column 6");
  });

  it("evaluates the definitions of TLC's Reals and Toolbox modules", async () => {
    expect((await checkInit('Real = "Reals"')).status).toBe("success");
    await expect(checkInit("_TETrace = 0")).rejects.toThrow("at line 14, column 18");
  });
});
