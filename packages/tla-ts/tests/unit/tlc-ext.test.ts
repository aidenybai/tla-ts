import { describe, expect, it } from "vite-plus/test";
import { checkFixture } from "./check-harness";

describe("TLCExt matches TLC", () => {
  it("checks TLC's TLCExtTrace model with Trace in an invariant and a constraint", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace");
    expect(result.status).toBe("deadlock");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([10, 10, 10]);
  });

  it("checks TLC's TLCExtTrace model with an alias", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace", "TLCExtTraceAlias");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(7);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([7, 7, 7]);
  });

  it("ends Trace in the state that the next-state relation extends", async () => {
    const result = await checkFixture("tlc-ext", "TraceNext");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 5, 5]);
  });
});
