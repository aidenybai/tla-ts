import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, TlaConfigError, TlaSyntaxError } from "../../src";
import { createSanyError } from "../../src/errors";

const DIRECTORY = join(import.meta.dirname, "../fixtures/modules");

const checkNested = (configName: string, moduleName = "Nested") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
  });

const checkFixture = (name: string, configName = `${name}.cfg`) =>
  check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: (module) => readFileSync(join(DIRECTORY, `${module}.tla`), "utf8"),
  });

const checkSource = (body: string, modules: Record<string, string> = {}) =>
  check({
    source: `---- MODULE M ----\n${body}\nVARIABLE v\nInit == v = 0\nNext == UNCHANGED v\n====`,
    config: "INIT Init\nNEXT Next",
    loadModule: (name) => modules[name],
  });

describe("nested and trailing modules match TLC", () => {
  it("instantiates a nested module that uses the enclosing module's definitions", async () => {
    const result = await checkNested("Nested.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations through a nested module's actions", async () => {
    const result = await checkNested("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("TooSmall");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("overrides definitions of other modules but not of the root module for scoped overrides", async () => {
    const results = await Promise.all(
      ["Scoped.cfg", "ScopedRoot.cfg"].map((configName) => checkNested(configName, "Scoped")),
    );
    results.forEach((result) => {
      expect(result.status).toBe("invariant-violation");
      expect(result.violation?.trace).toHaveLength(5);
      expect([result.generatedStates, result.distinctStates]).toEqual([5, 5]);
    });
  });

  it("does not assign constants through scoped values", async () => {
    await expect(
      check({
        source: readFileSync(join(DIRECTORY, "Nested.tla"), "utf8"),
        config: "CONSTANT Limit = [Nested]3\nSPECIFICATION Spec\n",
      }),
    ).rejects.toThrow(TlaConfigError);
  });
});

describe("nested modules match TLC's test models", () => {
  it.each([
    ["O", [4, 4, 4]],
    ["Github725b", [5, 4, 4]],
    ["Github725e", [2, 1, 1]],
    ["Github725f", [3, 2, 2]],
  ])("checks %s", async (name, counts) => {
    const result = await checkFixture(name);
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual(counts);
  });

  it("instantiates a nested module with parameters named after its variables", async () => {
    const result = await checkFixture("Github687spec", "Github687specInitNext.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([21, 7, 1]);
    const violation = await checkFixture("Github687spec", "Github687specPrime.cfg");
    expect(violation.status).toBe("liveness-violation");
    expect(violation.violation?.name).toBe("FalseAECheck");
  });
});

describe("nested module scoping matches SANY", () => {
  it("lets nested modules use earlier declarations and shadow modules from loadModule", async () => {
    const result = await checkFixture("NestedModules");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([25, 8, 5]);
  });

  it("substitutes into the nested modules of an instantiated module", async () => {
    const result = await checkFixture("Counters");
    expect(result.status).toBe("invariant-violation");
    const trace = result.violation?.trace ?? [];
    expect(trace.map((step) => [formatValue(step.state.a), formatValue(step.state.b)])).toEqual([
      ["0", "0"],
      ["1", "0"],
      ["3", "0"],
      ["3", "2"],
      ["3", "4"],
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([45, 20, 5]);
  });

  it("ignores the assumptions and unassigned constants of nested modules", async () => {
    const result = await checkSource(
      "---- MODULE Inner ----\nCONSTANT Unassigned\nASSUME FALSE\nA == Unassigned\n====\nINSTANCE Inner WITH Unassigned <- 1",
    );
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it("sees the nested modules of an extended module", async () => {
    const result = await checkSource("EXTENDS Holder\nJ == INSTANCE Held\nASSUME J!Value = 2", {
      Holder: "---- MODULE Holder ----\n---- MODULE Held ----\nValue == 2\n====\n====",
    });
    expect(result.status).toBe("success");
  });

  it("prefers a nested module over a standard module of the same name", async () => {
    const result = await checkSource(
      "---- MODULE Sequences ----\nMine == 1\n====\n---- MODULE User ----\nEXTENDS Sequences\nGot == Mine\n====\nU == INSTANCE User\nASSUME U!Got = 2",
    );
    expect(result.status).toBe("assumption-violation");
  });

  it.each([
    ["an outer definition after the nested module", "---- MODULE Inner ----\nA == B\n====\nB == 1"],
    [
      "an outer variable after the nested module",
      "---- MODULE Inner ----\nA == w\n====\nVARIABLE w",
    ],
    ["a nested definition without an instance", "---- MODULE Inner ----\nA == 1\n====\nB == A"],
    [
      "a LOCAL definition of an instantiated nested module",
      "---- MODULE Inner ----\nLOCAL Hidden == 1\nShown == Hidden\n====\nI == INSTANCE Inner\nA == I!Hidden",
    ],
    [
      "two nested modules with the same name",
      "---- MODULE Inner ----\nA == 1\n====\n---- MODULE Inner ----\nA == 2\n====",
    ],
    [
      "a substitution for an outer constant",
      "CONSTANT N\n---- MODULE Inner ----\nA == N\n====\nI == INSTANCE Inner WITH N <- 3",
    ],
    [
      "an instance without a substitution for a variable",
      "---- MODULE Inner ----\nVARIABLE y\nA == y\n====\nI == INSTANCE Inner",
    ],
    [
      "an implicit substitution with the wrong arity",
      "---- MODULE Inner ----\nCONSTANT C(_)\nD(a) == C(a)\n====\nC(a, b) == a\nINSTANCE Inner",
    ],
    [
      "an instance of a nested module before its definition",
      "I == INSTANCE Inner\n  ---- MODULE Inner ----\n  A == 1\n  ====",
    ],
    [
      "an instance of a module nested in a nested module",
      "---- MODULE Middle ----\n---- MODULE Innermost ----\nA == 1\n====\n====\nI == INSTANCE Innermost",
    ],
    [
      "a nested module named after a module loaded from the same file",
      "I == INSTANCE Inner\n---- MODULE Inner ----\nA == 1\n====",
    ],
    [
      "a nested module instantiated only inside LET",
      "---- MODULE LetInner ----\nfoo == 42\n====\nop == LET Inst == INSTANCE LetInner IN Inst!foo",
    ],
  ])("rejects %s", async (_, body) => {
    await expect(checkSource(body)).rejects.toThrow(TlaSyntaxError);
  });

  it("rejects a nested module named after a module loaded before it", async () => {
    await expect(
      checkSource("E == INSTANCE Shared\n---- MODULE Shared ----\nA == 2\n====", {
        Shared: "---- MODULE Shared ----\nA == 1\n====",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 1 to line 5, col 4 of module M",
          message:
            "Multiply-defined module 'Shared': this definition or declaration conflicts \nwith the one at line 1, col 1 to line 3, col 4 of module Shared.",
        },
      ]),
    );
  });

  it("rejects modules that extend each other like SANY", async () => {
    await expect(
      checkSource("EXTENDS CycleA", {
        CycleA: "---- MODULE CycleA ----\nEXTENDS CycleB\n====",
        CycleB: "---- MODULE CycleB ----\nEXTENDS CycleA\n====",
      }),
    ).rejects.toThrow(
      new TlaSyntaxError(
        "Circular dependency among .tla files; dependency cycle is: CycleA.tla --> CycleB.tla --> CycleA.tla",
      ),
    );
  });

  it("rejects an extended file that holds a module of another name", async () => {
    await expect(
      checkSource("EXTENDS test", { test: "---- MODULE Foo ----\nA == 1\n====" }),
    ).rejects.toThrow(
      createSanyError(
        [
          {
            location: "Unknown location",
            message:
              "File name 'test' does not match the name 'Foo' of the top level module it contains.",
          },
        ],
        true,
      ),
    );
  });

  it("rejects a nested module that an unnamed theorem instantiates inside LET", async () => {
    await expect(
      checkSource(
        "---- MODULE Inner ----\nA == TRUE\n====\nTHEOREM LET M == INSTANCE Inner IN M!A",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 2, col 1 to line 4, col 4 of module M",
          message:
            "Multiply-defined module 'Inner': this definition or declaration conflicts \nwith the one at line 1, col 1 to line 3, col 4 of module Inner.",
        },
      ]),
    );
  });

  it("instantiates a nested module inside LET once a top-level instance follows it", async () => {
    const result = await checkSource(
      "---- MODULE LetInner ----\nfoo == 42\n====\nTop == INSTANCE LetInner\nASSUME LET Inst == INSTANCE LetInner IN Inst!foo = 42",
    );
    expect(result.status).toBe("success");
  });
});
