import { describe, expect, it } from "vite-plus/test";
import { checkFixture } from "./check-harness";

describe("TLCDefer matches TLC", () => {
  it("never evaluates its argument in breadth-first search", async () => {
    const printed: string[] = [];
    const result = await checkFixture("tlc-ext", "Defer", "Defer", {
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
    expect(printed).toEqual([]);
  });
});
