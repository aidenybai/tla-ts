import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, parseModule, TlaSyntaxError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/instances");

const checkInstances = (configName: string, moduleName = "Instances") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: (name) => readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
  });

describe("INSTANCE matches TLC", () => {
  it("substitutes constants and variables in named, parameterized, and unnamed instances", async () => {
    const result = await checkInstances("Instances.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([244, 27, 4]);
  });

  it("substitutes TLC's infix operators for constant operators of the same name", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nINSTANCE Inner\nInit == x = Merged[2]\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: () =>
        "---- MODULE Inner ----\nCONSTANTS _ @@ _, _ :> _\nMerged == (1 :> 1) @@ (2 :> 2)\n====",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("reports violations through instantiated operators", async () => {
    const result = await checkInstances("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Different");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("scopes LOCAL instances per module and overrides definitions shared by instances", async () => {
    const result = await checkInstances("Scoping.cfg", "Scoping");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("substitutes operator parameters with LAMBDA expressions without capturing bound names", async () => {
    const result = await checkInstances("Operators.cfg", "Operators");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([113, 28, 7]);
  });

  it("reports violations through LAMBDA substitutions", async () => {
    const result = await checkInstances("OperatorsViolation.cfg", "Operators");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([37, 16]);
  });

  it("instantiates modules inside LET with substitutions that use local names", async () => {
    const result = await checkInstances("LetInstances.cfg", "LetInstances");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([193, 96, 19]);
  });

  it("reports violations through instances defined inside LET", async () => {
    const result = await checkInstances("LetInstancesViolation.cfg", "LetInstances");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(5);
    expect(result.distinctStates).toBe(11);
  });

  it("checks a specification taken from a parameterized instance", async () => {
    const result = await checkInstances("ParameterizedSpec.cfg", "ParameterizedSpec");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("reports violations of a specification taken from a parameterized instance", async () => {
    const result = await checkInstances("ParameterizedSpecViolation.cfg", "ParameterizedSpec");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([4, 4]);
  });

  it("keeps instance parameters apart from names bound inside the instance", async () => {
    const result = await checkInstances("Capture.cfg", "Capture");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      3,
      2,
      2,
    ]);
  });

  it("renames names bound inside an instance that would capture substituted names", async () => {
    const result = await checkInstances("Binders.cfg", "Binders");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      4,
      3,
      3,
    ]);
  });

  it("reports violations through substitutions that bound names would capture", async () => {
    const result = await checkInstances("BindersViolation.cfg", "Binders");
    expect([result.status, result.violation?.trace.length, result.distinctStates]).toEqual([
      "invariant-violation",
      2,
      2,
    ]);
  });

  it.each(["Selection", "SelectionOuter"])(
    "selects renamed LET definitions by their names in %s",
    async (moduleName) => {
      const result = await checkInstances("Selection.cfg", moduleName);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        4,
        3,
      ]);
    },
  );

  it("instantiates parameterized modules inside LET", async () => {
    const result = await checkInstances("LetParameters.cfg", "LetParameters");
    expect([result.status, result.violation?.trace.length, result.distinctStates]).toEqual([
      "invariant-violation",
      4,
      4,
    ]);
  });

  it("substitutes operator symbols at the end of a WITH clause", async () => {
    expect((await checkInstances("Symbols.cfg", "Symbols")).status).toBe("success");
  });

  it("parses a prefix operator followed by an operand as an expression", () => {
    const module = parseModule(
      "---- MODULE M ----\nI == INSTANCE N WITH a <- - b, c <- SUBSET d, e <- -\n====",
    );
    expect(module.instances[0].substitutions.map((item) => item.expression.kind)).toEqual([
      "Apply",
      "Apply",
      "OperatorReference",
    ]);
    expect(() =>
      parseModule(
        "---- MODULE M ----\nFoo == LET I == INSTANCE N WITH c <- ~\n           J == 1\n       IN J\n====",
      ),
    ).not.toThrow();
  });
});

const INNER_MODULES: Record<string, string> = {
  Stateful: "EXTENDS Naturals\nCONSTANT c, Op(_)\nVARIABLE v\nUse == Op(v) + c",
  Pure: "EXTENDS Naturals\nCONSTANT c, Op(_)\nUse == Op(c) + c",
  Primed: "EXTENDS Naturals\nCONSTANT c, Op(_)\nUse == Op(c)' + c",
  Vars: "EXTENDS Naturals\nVARIABLE v, w\nUse == v + w",
  Applied: "CONSTANT c, Op(_)\nUse == Op(c)",
  Assumed: "CONSTANT C, D\nASSUME C = {}",
  Nested: "EXTENDS Naturals\nCONSTANT c, Op(_)\nVARIABLE v\nUse == Op(v') /\\ c = 1",
  Twice: "CONSTANT c, Op(_, _)\nUse == Op(c, c)\nOther(d) == Op(d, c)",
  Outer:
    "EXTENDS Naturals\nCONSTANT c\nN == INSTANCE Twice WITH c <- c, Op <- LAMBDA a, b : a + b\nUse == N!Use",
  Functions:
    "EXTENDS Naturals\nCONSTANT c\nf[i \\in {1}] == c + i\nRECURSIVE g(_)\ng(n) == IF n = 0 THEN c ELSE g(n - 1)",
};

const checkSubstitution = (body: string) =>
  check({
    source: `---- MODULE Main ----\nEXTENDS Naturals\nVARIABLE x\n${body}\nInit == x = 0\nNext == x' = x\n====`,
    config: "INIT Init\nNEXT Next",
    loadModule: (name) => `---- MODULE ${name} ----\n${INNER_MODULES[name]}\n====`,
  });

const getLevelError = (module: string, name: string, level: number) =>
  `Level error in instantiating module '${module}': the level of the expression or operator substituted for '${name}' must be at most ${level}`;

const getLeibnizError = (module: string) =>
  `Error in instantiating module '${module}': a non-Leibniz operator substituted for 'Op'`;

const getArgumentError = (module: string, index: number, maximum: number) =>
  `Level error when instantiating module '${module}': the level of the argument ${index} of the operator Op' must be at most ${maximum}`;

const getMessagePattern = (messages: string[]) =>
  new RegExp(
    `^${messages
      .map(
        (message) => `${message.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")} at line \\d+, column \\d+`,
      )
      .join("\\n")}$`,
  );

describe("substitution levels match SANY", () => {
  it.each([
    [
      "I == INSTANCE Stateful WITH c <- 1, Op <- LAMBDA a : a + x, v <- x",
      [getLevelError("Stateful", "Op", 0)],
    ],
    [
      "I == INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "I == INSTANCE Stateful WITH c <- x', Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "F(a) == a + x\nI == INSTANCE Stateful WITH c <- 1, Op <- F, v <- x",
      [getLevelError("Stateful", "Op", 0)],
    ],
    ["I == INSTANCE Vars WITH v <- x', w <- x", [getLevelError("Vars", "v", 1)]],
    [
      "I == INSTANCE Vars WITH v <- [](x = 1), w <- x",
      [getLevelError("Vars", "v", 1), getLevelError("Vars", "v", 2)],
    ],
    [
      "I == INSTANCE Primed WITH c <- 1, Op <- LAMBDA a : a + x",
      [getLevelError("Primed", "Op", 0)],
    ],
    ["I == INSTANCE Pure WITH c <- [](x = 1), Op <- LAMBDA a : a", [getLevelError("Pure", "c", 2)]],
    ["I == INSTANCE Assumed WITH C <- [](x = 0), D <- TRUE", [getLevelError("Assumed", "C", 2)]],
    ["I == INSTANCE Outer WITH c <- [](x = 1)", [getLevelError("Outer", "c", 2)]],
    ["I == INSTANCE Functions WITH c <- [](x = 1)", [getLevelError("Functions", "c", 2)]],
    [
      "I == INSTANCE Applied WITH c <- [](x = 1), Op <- LAMBDA a : a + 1",
      [getArgumentError("Applied", 0, 2)],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Applied WITH c <- [](x = 1), Op <- F",
      [getArgumentError("Applied", 0, 1)],
    ],
    [
      "I == INSTANCE Twice WITH c <- [](x = 1), Op <- LAMBDA a, b : a + b",
      [getArgumentError("Twice", 0, 2), getArgumentError("Twice", 1, 2)],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Nested WITH c <- 1, Op <- F, v <- x",
      [
        getLevelError("Nested", "Op", 0),
        "Level error in instantiating module 'Nested': the level of the argument 1 of the operator F must be at least 2",
      ],
    ],
    [
      "Foo == LET I == INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET k == x\n           I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET k == x\n           j == k + 1\n           I == INSTANCE Stateful WITH c <- j, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET F(a) == a + x\n           I == INSTANCE Stateful WITH c <- 1, Op <- F, v <- x IN I!Use",
      [getLevelError("Stateful", "Op", 0)],
    ],
    [
      "Foo == LET F(a) == a'\n           I == INSTANCE Pure WITH c <- 1, Op <- F IN I!Use",
      [getLeibnizError("Pure")],
    ],
    ["F(a) == a'\nI == INSTANCE Pure WITH c <- 1, Op <- F", [getLeibnizError("Pure")]],
    ["I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : ENABLED a", [getLeibnizError("Pure")]],
    ["I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : UNCHANGED a", [getLeibnizError("Pure")]],
    [
      "I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : [](a = 1)",
      [getLeibnizError("Pure"), getLevelError("Pure", "Op", 2)],
    ],
    [
      "G(b) == b'\nF(a) == G(a) + 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    [
      "a ++ b == a' + b\nF(a) == a ++ 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    [
      "F(a) == \\E k \\in {1} : a' = k\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    ["F(a) == [a = 1]_a\nI == INSTANCE Pure WITH c <- 1, Op <- F", [getLeibnizError("Pure")]],
  ])("rejects %s", async (body, messages) => {
    await expect(checkSubstitution(body)).rejects.toThrow(TlaSyntaxError);
    await expect(checkSubstitution(body)).rejects.toThrow(getMessagePattern(messages));
  });

  it.each([
    "I == INSTANCE Stateful WITH c <- 1, Op <- LAMBDA a : a + 1, v <- x",
    "I == INSTANCE Pure WITH c <- x, Op <- LAMBDA a : a + x",
    "I == INSTANCE Pure WITH c <- x', Op <- LAMBDA a : a",
    "I == INSTANCE Vars WITH v <- ENABLED (x' = 1), w <- x",
    "I == INSTANCE Applied WITH c <- x', Op <- LAMBDA a : a + 1",
    "I == INSTANCE Applied WITH c <- [](x = 1), Op <- LAMBDA a : a",
    "I == INSTANCE Assumed WITH C <- x', D <- x'",
    "I == INSTANCE Outer WITH c <- x'",
    "I == INSTANCE Nested WITH c <- 1, Op <- LAMBDA a : a = 1, v <- x",
    "I == INSTANCE Twice WITH c <- [](x = 1), Op <- LAMBDA a, b : a",
    "P(k) == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a + k, v <- x",
    "Foo == LET k == 1\n           I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
    "Foo == \\E k \\in {1} : LET I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
    "F(a) == x' + a\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G == a' IN G\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G == 1 IN a' + G\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G(b) == b' IN G(a)\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "H(K(_)) == K(1)\nF(a) == H(LAMBDA b : a') + 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "P(G(_)) == INSTANCE Pure WITH c <- 1, Op <- G\nF(a) == a'\nUse == P(F)!Use",
  ])("accepts %s", async (body) => {
    expect((await checkSubstitution(body)).status).toBe("success");
  });
});
