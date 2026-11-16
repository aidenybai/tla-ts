import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { createSanyError, createSemanticError } from "../../src/errors";

describe("level checking matches SANY", () => {
  const checkDefinition = (definition: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLE x\nF == ${definition}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it.each([
    ["x' ~> []x", "Action used where only temporal formula or state predicate allowed"],
    ["[]x -+-> x'", "Action used where only temporal formula or state predicate allowed"],
    ["<>(x')", "<> followed by action not of form <<A>>_v"],
    ["[](x')", "[] followed by action not of form [A]_v"],
    ["\\A i \\in {}, j \\in x' : []x", "Action-level bound of quantified temporal formula"],
    ["x' /\\ []x", "Formula has both temporal formula and action as arguments"],
    ["(x')'", "Level error in applying operator '"],
    ["ENABLED []x", "Level error in applying operator ENABLED"],
  ])("rejects %s", async (definition, message) => {
    await expect(checkDefinition(definition)).rejects.toThrow(message);
  });

  it.each(["x ~> []x", "<><<x'>>_x", "[][x']_x", "\\A i \\in x' : x'", "[](LET A == x' IN A)"])(
    "accepts %s",
    async (definition) => {
      expect((await checkDefinition(definition)).status).toBe("success");
    },
  );

  it.each([
    "SelectSeq(s, LAMBDA a : a' = 1)",
    "SortSeq(s, LAMBDA a, b : a' = b)",
    "SortSeq(s, LAMBDA a, b : a = b')",
  ])("rejects a primed sequence where %s primes its elements", async (application) => {
    await expect(
      check({
        source: `---- MODULE M ----\nEXTENDS Sequences, TLC\nVARIABLE x\nF(s) == ${application}\nG == F(x')\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSemanticError(
        "Level error in applying operator F:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        {
          module: "M",
          start: { line: 5, column: 6 },
          end: { line: 5, column: 10 },
        },
      ),
    );
  });

  it("rejects an argument above the level an instantiated operator allows, naming it like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE y\nFoo == y' = 0\n====\nI(z) == INSTANCE Inner WITH y <- z\nFooBar == I(x')!Foo\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow("Level error in applying operator I!Foo:");
  });

  it.each([
    [
      "b == x' ~> []x\nh == <>(x')\nbar == [](x')\nn == \\A i \\in {}, j \\in x' : []x",
      [
        [
          "line 3, col 6 to line 3, col 14",
          "Action used where only temporal formula or state predicate allowed.",
        ],
        ["line 4, col 6 to line 4, col 11", "<> followed by action not of form <<A>>_v."],
        ["line 5, col 8 to line 5, col 13", "[] followed by action not of form [A]_v."],
        ["line 6, col 25 to line 6, col 26", "Action-level bound of quantified temporal formula."],
      ],
    ],
    [
      "Foo == [ab |-> 1, c |-> 2, ab |-> 3, c |-> 4]\nBar == [a : {1}, a : {2}]",
      [
        ["line 3, col 28 to line 3, col 29", "Non-unique fields in constructor."],
        ["line 3, col 38 to line 3, col 38", "Non-unique fields in constructor."],
        ["line 4, col 18 to line 4, col 18", "Non-unique fields in constructor."],
      ],
    ],
    [
      "THEOREM ASSUME NEW y, []y PROVE <>y\n<1>1. TAKE z \\in {x}\n<1>2. CASE []y\n  <2>1. HAVE x = 4\n  <2>2. QED\n<1>3. PICK c \\in {x} : <>(x = c)\n<1>4. QED",
      [
        [
          "line 6, col 9 to line 6, col 18",
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        ],
        ["line 8, col 18 to line 8, col 20", "Non-constant bound of temporal PICK."],
        [
          "line 4, col 7 to line 4, col 20",
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        ],
        ["line 5, col 7 to line 5, col 14", "Non-constant CASE for temporal goal."],
      ],
    ],
    [
      "THEOREM [](x = 0)\n<1>1. HAVE x = 1\n<1>2. QED\n---- MODULE Inner ----\nCONSTANT c\nASSUME c = {}\n====\nI == INSTANCE Inner WITH c <- [](x = 0)",
      [
        [
          "line 4, col 7 to line 4, col 16",
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        ],
        [
          "line 10, col 1 to line 10, col 39",
          "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'c' \nmust be at most 2.",
        ],
      ],
    ],
  ])("reports every error SANY reports in %j", async (definitions, errors) => {
    await expect(
      check({
        source: `---- MODULE M ----\nVARIABLE x\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        errors.map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("reports an error in instantiating a module before a constant the configuration leaves out, like TLC", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nCONSTANT K\n---- MODULE Inner ----\nCONSTANT c\nASSUME c = {}\n====\nI == INSTANCE Inner WITH c <- [](x = 0)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow("Level error in instantiating module 'Inner':");
  });

  const getParameterizedInstance = (definition: string) =>
    `---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE y\nOp(a) == <<a, y>>\n====\nI(a) == INSTANCE Inner WITH y <- a\nF(G(_, _)) == G(1, 2)\n${definition}\nInit == x = 0\nNext == x' = x\n====`;

  it("passes an operator of a parameterized instance as an operator argument, like SANY", async () => {
    const result = await check({
      source: getParameterizedInstance("X == F(I!Op)"),
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
  });

  it.each([
    ["X == I!Op", 9],
    ["X == I!Op(1)", 12],
  ])("rejects %s without the arguments of the instance, like SANY", async (definition, end) => {
    await expect(
      check({ source: getParameterizedInstance(definition), config: "INIT Init\nNEXT Next" }),
    ).rejects.toThrow(
      createSemanticError("The operator I requires 1 arguments.", {
        module: "M",
        start: { line: 9, column: 6 },
        end: { line: 9, column: end },
      }),
    );
  });
});
