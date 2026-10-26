import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig, TlaConfigError, type TraceStep } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/alias");

const checkAlias = (configName: string) =>
  check({
    source: readFileSync(join(DIRECTORY, "Alias.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"),
  });

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
      [1, 2, 3, 4].map((x) => [
        `yy = ${x % 2 === 0 ? "TRUE" : "FALSE"}`,
        `x = ${x}`,
        `a = ${x === 4 ? 0 : 1}`,
        `b = ${x === 4 ? "TRUE" : "FALSE"}`,
        `anim = "e1: ${x} e2: ${x % 2 === 0 ? "TRUE" : "FALSE"}"`,
        "te = TRUE",
        `lvl = <<${x}, ${x}>>`,
        `trc = <<${[1, 2, 3, 4]
          .slice(0, x)
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

  it("keeps the state when the alias is not a record", async () => {
    const result = await checkModule(
      "Next == x < 1 /\\ x' = x + 1\nAlias == x + 100",
      "ALIAS Alias",
    );
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 1 }]);
  });

  it("prints a deadlocked initial state without the alias", async () => {
    const result = await checkModule("Next == x > 0 /\\ x' = x\nAlias == [y |-> x]", "ALIAS Alias");
    expect([result.status, result.violation?.trace[0].state]).toEqual(["deadlock", { x: 0 }]);
  });

  it("rejects a second ALIAS", async () => {
    expect(() => parseConfig("ALIAS A\nALIAS B")).toThrow(TlaConfigError);
  });
});
