import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig, TlaConfigError, type TraceStep } from "../../src";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

const checkAlias = (configName: string) => checkFixture("alias", "Alias", configName);

const checkModule = (body: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}`,
  });

const formatTrace = (trace: TraceStep[] | undefined) =>
  (trace ?? []).map((step) =>
    Object.entries(step.state).map(([name, value]) => `${name} = ${formatValue(value)}`),
  );

describe("ALIAS matches TLC", () => {
  it("prints the alias of each state in a safety trace", async () => {
    const result = await checkAlias("Alias");
    expect(result.status).toBe("invariant-violation");
    expect(formatTrace(result.violation?.trace)).toEqual(
      [1, 2, 3, 4].map((stateNumber) => [
        `yy = ${stateNumber % 2 === 0 ? "TRUE" : "FALSE"}`,
        `x = ${stateNumber}`,
        `a = ${stateNumber === 4 ? 0 : 1}`,
        `b = ${stateNumber === 4 ? "TRUE" : "FALSE"}`,
        `anim = "e1: ${stateNumber} e2: ${stateNumber % 2 === 0 ? "TRUE" : "FALSE"}"`,
        "te = TRUE",
        `lvl = <<${stateNumber}, ${stateNumber}>>`,
        `trc = <<${[1, 2, 3, 4]
          .slice(0, stateNumber)
          .map((step) => `[x |-> ${step}, y |-> ${step % 2 === 0 ? "TRUE" : "FALSE"}]`)
          .join(", ")}>>`,
      ]),
    );
  });

  it("evaluates the last state of a lasso against the state it loops back to", async () => {
    const result = await checkAlias("AliasLasso");
    expect([result.status, result.violation?.loopStart]).toEqual(["liveness-violation", 0]);
    expect(formatTrace(result.violation?.trace).map((step) => step.slice(2, 4))).toEqual([
      ["a = 1", "b = FALSE"],
      ["a = 1", "b = FALSE"],
      ["a = 1", "b = FALSE"],
      ["a = -3", "b = FALSE"],
    ]);
  });

  it("evaluates a stuttering state against itself", async () => {
    const result = await checkAlias("AliasStuttering");
    expect([result.status, result.violation?.loopStart]).toEqual(["liveness-violation", 0]);
    expect(formatTrace(result.violation?.trace).map((step) => step.slice(2, 4))).toEqual([
      ["a = 0", "b = TRUE"],
    ]);
  });

  it("adds _ALIASEvalError to the state when the alias fails", async () => {
    const next = "Next == x < 1 /\\ x' = x + 1\nArgument(n) == [n |-> n]\nConstant == [c |-> 1]";
    expect(
      await Promise.all(
        ["Undefined", "Argument", "Constant"].map(
          async (name) =>
            (await checkModule(next, `ALIAS ${name}`)).violation?.trace[0].state._ALIASEvalError,
        ),
      ),
    ).toEqual([
      "The alias Undefined specified in the configuration file\nis not defined in the specification.",
      "TLC requires alias not to take any argument, but one was given: Argument",
      "The alias Constant cannot be a constant.",
    ]);
    const result = await checkModule(
      "Next == x < 1 /\\ x' = x + 1\nAlias == [y |-> 1 \\div x]",
      "ALIAS Alias",
    );
    expect(Object.keys(result.violation?.trace[0].state ?? {})).toEqual(["x", "_ALIASEvalError"]);
    expect(result.violation?.trace[1].state).toEqual({ y: 1 });
  });

  it("marks the message of _ALIASEvalError as TLC does in -tool output", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 1 /\\ x' = x + 1\nArgument(n) == [n |-> n]\n====`,
      config: "INIT Init\nNEXT Next\nALIAS Argument",
      isTool: true,
    });
    expect(result.violation?.trace[0].state._ALIASEvalError).toBe(
      "@!@!@STARTMSG 2228:0 @!@!@\nTLC requires alias not to take any argument, but one was given: Argument\n@!@!@ENDMSG 2228 @!@!@",
    );
  });

  it("keeps the state when the alias is not a record", async () => {
    const result = await checkModule(
      "Next == x < 1 /\\ x' = x + 1\nAlias == x + 100",
      "ALIAS Alias",
    );
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 1 }]);
  });

  it("prints a deadlocked initial state without the alias, as TLC does", async () => {
    const result = await checkModule("Next == x > 0 /\\ x' = x\nAlias == [y |-> x]", "ALIAS Alias");
    expect([result.status, result.violation?.trace[0].state]).toEqual(["deadlock", { x: 0 }]);
  });

  it("prints an initial state whose successors fail without the alias, as TLC does", async () => {
    const result = await checkModule("Next == x' = 1 \\div x\nAlias == [y |-> x]", "ALIAS Alias");
    expect([result.status, result.failure?.trace.map((step) => step.state)]).toEqual([
      "error",
      [{ x: 0 }],
    ]);
  });

  it.each(["model checking", "simulation"])(
    "adds _ALIASEvalError to an incomplete successor and the state before it in %s, as TLC does",
    async (mode) => {
      const source = `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == IF x < 2 THEN x' = x + 1 /\\ y' = y ELSE x' = x + 1\nAlias == [x |-> x, lvl |-> TLCGet("level"), nx |-> x', ny |-> y']\n====`;
      const config = "INIT Init\nNEXT Next\nALIAS Alias";
      const traces: TraceStep[][] = [];
      if (mode === "simulation") {
        simulate({
          source,
          config,
          seed: 0n,
          traceDepth: 6,
          traceCount: 1n,
          aril: 0n,
          isGenerating: false,
          scheduler: "random",
          onSimulation: (output) => {
            if (output.kind === "behavior") traces.push(output.trace);
          },
        });
      } else {
        traces.push((await check({ source, config })).failure?.trace ?? []);
      }
      const message =
        '_ALIASEvalError = "In evaluation, the identifier y is either undefined or not an operator.\\nline 6, col 63 to line 6, col 63 of module M"';
      expect(traces.map(formatTrace)).toEqual([
        [
          ["x = 0", "lvl = 1", "nx = 1", "ny = 0"],
          ["x = 1", "lvl = 2", "nx = 2", "ny = 0"],
          ["x = 2", "y = 0", message],
          ["x = 3", "y = null", message],
        ],
      ]);
    },
  );

  it("rejects a second ALIAS", async () => {
    expect(() => parseConfig("ALIAS A\nALIAS B")).toThrow(TlaConfigError);
  });
});
