import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig, TlaConfigError, TlaUnsupportedError } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const checkFixture = (
  directory: string,
  name: string,
  configName = name,
  onPrint?: (text: string) => void,
) => {
  const config = parseConfig(readFileSync(join(FIXTURES, directory, `${configName}.cfg`), "utf8"));
  config.checkDeadlock = false;
  return check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config,
    onPrint,
  });
};

const checkModule = (body: string, config = "INIT Init\nNEXT Next") =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 5\n${body}\n====`,
    config,
  });

describe("TLCGet and TLCSet match TLC", () => {
  it("reports the level of the state that is evaluated", () => {
    const result = checkFixture("tlc-get-level", "TLCGetLevel");
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.name).toBe("Prop");
    expect(
      result.violation?.trace.map((step) =>
        ["x", "y", "yb", "z"].map((name) => formatValue(step.state[name])),
      ),
    ).toEqual([
      ["0", "0", "0", "1"],
      ["1", "1", "1", "2"],
      ["2", "2", "2", "3"],
      ["3", "3", "3", "4"],
    ]);
    expect(result.violation?.loopStart).toBe(3);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("reads statistics, the configuration, and named registers, and exits early", () => {
    const result = checkFixture("tlc-set", "TLCSet");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([
      4225, 4225, 4225,
    ]);
  });

  it("keeps a register set by the initial predicate", () => {
    const printed: string[] = [];
    const result = checkFixture("tlc-set-init", "TLCSetInit", "TLCSetInit", (text) =>
      printed.push(text),
    );
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([10, 10, 10]);
    expect(printed).toEqual(Array.from({ length: 9 }, () => '"TLCSet works."'));
  });

  it("names the actions of a liveness trace whose registers changed", () => {
    const result = checkFixture("tlc-get-non-determinism", "TLCGetNonDeterminism");
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.trace.map((step) => formatValue(step.state.y))).toEqual([
      "0",
      "1",
      "2",
      "3",
    ]);
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Next",
      "Next",
      "Next",
    ]);
  });

  it("rejects substituting a constant with a statistic", () => {
    expect(() => checkFixture("tlc-get-named-undefined", "TLCGetNamedUndefined")).toThrow(
      TlaConfigError,
    );
  });

  it("counts the state that an invariant checks as distinct", () => {
    const result = checkModule(
      'Inv == TLCGet("distinct") <= 3',
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("returns records, registers, and properties", () => {
    const result = checkModule(
      [
        'ASSUME DOMAIN TLCGet("stats") = {"queue", "distinct", "initial", "generated", "diameter", "duration", "worker"}',
        'ASSUME DOMAIN TLCGet("config") = {"mode", "deadlock", "worker", "seed", "fingerprint", "install"}',
        'ASSUME TLCGet("action") = [name |-> "UnnamedAction", location |-> [beginLine |-> 0, beginColumn |-> 0, endLine |-> 0, endColumn |-> 0, module |-> "--TLA+ BUILTINS--"]]',
        'ASSUME TLCGet("all") = <<>>',
        'ASSUME TLCSet(3, 2) /\\ TLCSet("s:x", 1)',
        'ASSUME TLCGet("all") = (3 :> <<2>>) /\\ TLCGet("all:named") = ("s:x" :> <<1>>)',
        'ASSUME TLCGet("-Dfoo") = "-Dfoo" /\\ TLCSet("-Dfoo", <<1, "a">>) /\\ TLCGet("-Dfoo") = "<<1, \\"a\\">>"',
        'ASSUME TLCSet("exit", FALSE) /\\ TLCSet("pause", FALSE)',
        'ASSUME TLCGet("level") = 0 /\\ TLCGet("distinct") = 0 /\\ TLCGet("diameter") = 1',
      ].join("\n"),
    );
    expect(result.status).toBe("success");
  });

  it.each([
    ["TLCGet(5)", "TLCGet(5) was undefined."],
    ['TLCGet("s:missing")', "TLCGet(s:missing) was undefined."],
    ['TLCGet("initial")', "TLCGet(initial) was undefined."],
    [
      "TLCGet(-1)",
      "The argument of TLCGet should be a nonnegative integer, but instead it is:\n-1",
    ],
    [
      'TLCSet("foo", 1)',
      'The first argument of TLCSet should be a nonnegative integer, but instead it is:\n"foo"',
    ],
  ])("reports %s", (expression, message) => {
    const result = checkModule(`ASSUME ${expression}`);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });

  it.each(['TLCGet("spec")', 'TLCGet("revision")', 'TLCSet("pause", TRUE)'])(
    "reports %s as unsupported",
    (expression) => {
      expect(() => checkModule(`ASSUME ${expression}`)).toThrow(TlaUnsupportedError);
    },
  );
});

describe("POSTCONDITION matches TLC", () => {
  it.each([
    ["tlc-set", "TLCSet", "TLCSetPost", [4225, 4225, 4225]],
    ["post-conditions", "PostConditionsTest", "PostConditionsTest", [4, 4, 4]],
    ["tlc-get-all", "TLCGetAll", "TLCGetAll", [10101, 101, 2]],
  ])("holds after checking %s/%s.cfg", (directory, name, configName, counts) => {
    const result = checkFixture(directory, name, configName);
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual(counts);
  });

  it.each([
    ["post-conditions", "PostConditionsTest", "PostConditionsFailTest", "PostFail", [4, 4, 4]],
    ["test2", "Test2", "Test2PostCondition", "PostConditionViolated", [6, 5, 5]],
  ])("fails after checking %s/%s.cfg", (directory, name, configName, postcondition, counts) => {
    const result = checkFixture(directory, name, configName);
    expect(result.status).toBe("postcondition-violation");
    expect(result.violation?.name).toBe(postcondition);
    expect(result.violation?.message).toBeUndefined();
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual(counts);
  });

  it("reads registers that an earlier postcondition sets", () => {
    const result = checkModule(
      'Post == TLCSet(100, TLCGet("generated"))\nCheck == TLCGet(100) = 6 /\\ TLCGet("distinct") = 5 /\\ TLCGet("queue") = 0 /\\ TLCGet("level") = 0',
      "INIT Init\nNEXT Next\nPOSTCONDITIONS Post Check",
    );
    expect(result.status).toBe("success");
  });

  it("reports a postcondition that fails to evaluate", () => {
    const result = checkModule("Post == x = 0", "INIT Init\nNEXT Next\nPOSTCONDITION Post");
    expect(result.status).toBe("postcondition-violation");
    expect(result.violation?.message).toMatch(/^The variable x is not assigned/);
  });

  it("skips postconditions after a violation", () => {
    const result = checkModule(
      'Inv == x < 1\nPost == TLCGet("distinct") = 0',
      "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post",
    );
    expect(result.status).toBe("invariant-violation");
  });

  it("rejects a constant postcondition", () => {
    expect(() => checkModule("Post == FALSE", "INIT Init\nNEXT Next\nPOSTCONDITION Post")).toThrow(
      TlaConfigError,
    );
  });
});
