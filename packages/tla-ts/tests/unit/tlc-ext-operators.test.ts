import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaUnsupportedError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-ext");

const checkFixture = async (name: string, configName = name) => {
  const printed: string[] = [];
  const result = await check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"),
    onPrint: (text) => printed.push(text),
  });
  return { ...result, printed };
};

const checkModule = (body: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLCExt\nVARIABLE x\n${body}\n====`,
    config,
  });

describe("TLCExt operators match TLC", () => {
  it("prints the string and both values when AssertEq fails", async () => {
    const result = await checkFixture("AssertEq");
    expect(result.status).toBe("success");
    expect(result.printed).toEqual([
      '"Assertion failed"',
      "1",
      "0",
      '"Assertion failed"',
      "2",
      "0",
    ]);
  });

  it("reports the unassigned variables when Trace has no state", async () => {
    const result = await checkFixture("TraceAssume");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.TupleValue tlc2.module.TLCExt.getTrace(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel) throws java.io.IOException,\nbut it produced the following error:\nIn evaluating TLCExt!Trace, the state is not completely specified yet (variables x, y undefined).",
    );
  });

  it("picks every seen successor without asking", async () => {
    const result = await checkFixture("Pick", "PickSeen");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 3, 3]);
  });

  it("fails PickSuccessor without a complete successor state", async () => {
    expect((await checkFixture("Pick", "PickIncomplete")).failure?.message).toContain(
      'Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null',
    );
  });

  it("does not ask interactively for an unseen successor", async () => {
    await expect(
      checkModule(
        "Init == x = 0\nNext == x' = (x + 1) % 3\nAsk == PickSuccessor(x' # 1)",
        "INIT Init\nNEXT Next\nACTION_CONSTRAINT Ask",
      ),
    ).rejects.toThrow(TlaUnsupportedError);
  });

  it("requires a string literal as the message of AssertError", async () => {
    const result = await checkModule(
      'Message == "x"\nASSUME AssertError(Message, 1 \\div 0)\nInit == x = 0\nNext == x\' = x',
      "INIT Init\nNEXT Next",
    );
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toContain(
      "In computing AssertError, a non-string expression (line 5, col 20) was used as the err of an AssertError(err, exp).",
    );
  });

  it("compares AssertError's message with the error's, which holds its code under -tool", async () => {
    const results = await Promise.all(
      [false, true].map((isTool) =>
        check({
          source:
            '---- MODULE M ----\nEXTENDS Naturals, TLCExt\nASSUME AssertError("The second argument of \\\\div is 0.", 1 \\div 0)\n====',
          config: "",
          isTool,
        }),
      ),
    );
    expect(results.map((result) => result.status)).toEqual(["success", "assumption-violation"]);
  });

  it("stops checking when TLCGetAndSet sets the exit key", async () => {
    const result = await checkModule(
      'Init == x = 0\nNext == x < 5 /\\ x\' = x + 1 /\\ (x = 2 => TLCGetAndSet("exit", LAMBDA old, new : new, TRUE, FALSE) = FALSE)',
      "INIT Init\nNEXT Next",
    );
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.queuedStates]).toEqual([4, 4, 1]);
  });
});
