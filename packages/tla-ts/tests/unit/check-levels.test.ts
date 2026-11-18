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
    ["x' /\\ []x", "\\land has both temporal formula and action as arguments"],
    ["(x')'", "Level error in applying operator '"],
    ["ENABLED []x", "Level error in applying operator ENABLED"],
    ["{x'} \\cup [](x = 1)", "Level error in applying operator \\union:"],
    ["x' # []x", "Level error in applying operator /=:"],
  ])("rejects %s", async (definition, message) => {
    await expect(checkDefinition(definition)).rejects.toThrow(message);
  });

  it("names the builtin operator a level error applies like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nA == x' /\\ []x\nB == x' \\equiv []x\nC ==\n  /\\ x'\n  /\\ []x\nD == {x', []x}\nE == \\E v \\in {[]x} : TRUE\nG == [x EXCEPT ![1] = []x]\nH == x[[]x, 1]\nI == {v \\in [](x = 1) : TRUE}\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 3, col 6 to line 3, col 14",
            "\\land has both temporal formula and action as arguments.",
          ],
          [
            "line 4, col 6 to line 4, col 18",
            "\\equiv has both temporal formula and action as arguments.",
          ],
          [
            "line 6, col 3 to line 7, col 8",
            "Conjunction list has both temporal formula and action as arguments.",
          ],
          [
            "line 8, col 6 to line 8, col 14",
            "Level error in applying operator $SetEnumerate:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 9, col 15 to line 9, col 19",
            "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 10, col 6 to line 10, col 26",
            "Level error in applying operator $Except:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 11, col 6 to line 11, col 14",
            "Level error in applying operator $Tuple:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 12, col 6 to line 12, col 29",
            "Level error in applying operator $SubsetOf:\nThe level of the range for the bounded variable line 12, col 7 to line 12, col 7 of module M \nexceeds the maximum level allowed by the operator.",
          ],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("reports every level error in a definition, assumption, or theorem but none for an argument with its own, like SANY", async () => {
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nA == {[]x} \\cup {<>x}\nB == {A}\nL == LET P == {[]x} IN {<>x} \\cup P\nE == \\E v \\in {[]x} : {<>x} = v\nASSUME {[]x} = {<>x}\nTHEOREM ASSUME NEW e \\in {[]x}, NEW f \\in {<>x} PROVE TRUE\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 3, col 6 to line 3, col 10", setError],
          ["line 3, col 17 to line 3, col 21", setError],
          ["line 4, col 6 to line 4, col 8", setError],
          ["line 5, col 15 to line 5, col 19", setError],
          ["line 5, col 24 to line 5, col 28", setError],
          [
            "line 5, col 24 to line 5, col 35",
            "Level error in applying operator \\union:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          ],
          ["line 6, col 23 to line 6, col 27", setError],
          ["line 6, col 15 to line 6, col 19", setError],
          ["line 7, col 8 to line 7, col 12", setError],
          ["line 7, col 16 to line 7, col 20", setError],
          [
            "line 7, col 1 to line 7, col 20",
            "Level error: assumptions must be level 0 (Constant), \nbut this one has level 3.",
          ],
          ["line 8, col 26 to line 8, col 30", setError],
          ["line 8, col 16 to line 8, col 30", "Level error:\nTemporal formula used as set."],
          ["line 8, col 43 to line 8, col 47", setError],
          ["line 8, col 33 to line 8, col 47", "Level error:\nTemporal formula used as set."],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("checks the levels of proof steps, their facts, and the definitions they make like SANY", async () => {
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nTHEOREM TRUE\n<1>1. {[]x} = 1\n  <2>1. CASE {<>x} = 1\n  <2> QED BY {[]x} = 1\n<1> DEFINE D == {<>x}\n<1>2. {D} = 1\n<1> USE {[]x} = 1\n<1> QED\nUSE {<>x} = 1\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 4, col 7 to line 4, col 11", setError],
          ["line 5, col 14 to line 5, col 18", setError],
          ["line 6, col 14 to line 6, col 18", setError],
          ["line 5, col 9 to line 5, col 22", "Non-constant CASE for temporal goal."],
          ["line 7, col 17 to line 7, col 21", setError],
          ["line 8, col 7 to line 8, col 9", setError],
          ["line 9, col 9 to line 9, col 13", setError],
          ["line 11, col 5 to line 11, col 9", setError],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("checks definitions, then named facts, then the rest of a module like SANY", async () => {
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    const assumeError =
      "Level error: assumptions must be level 0 (Constant), \nbut this one has level 3.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nASSUME {<>x} = 1\nTHEOREM T == {<>x} = 1\n  BY {[]x} = 1\nASSUME N == {[]x} = 1\nTHEOREM {[]x} = 1\nA == {[]x}\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 8, col 6 to line 8, col 10", setError],
          ["line 4, col 14 to line 4, col 18", setError],
          ["line 6, col 13 to line 6, col 17", setError],
          ["line 3, col 8 to line 3, col 12", setError],
          ["line 3, col 1 to line 3, col 16", assumeError],
          ["line 5, col 6 to line 5, col 10", setError],
          ["line 6, col 1 to line 6, col 21", assumeError],
          ["line 7, col 9 to line 7, col 13", setError],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("checks each prefix of a chain of infix /\\ or \\/ like SANY", async () => {
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nA == (x' = x) /\\ [](x = 1) /\\ TRUE\nB == ((x' = x)) \\/ [](x = 1) \\/ (x' = x)\nC == ({[]x} = 1) /\\ (x' = x) /\\ []({<>x} = 1)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 3, col 6 to line 3, col 26",
            "\\land has both temporal formula and action as arguments.",
          ],
          [
            "line 4, col 6 to line 4, col 28",
            "\\lor has both temporal formula and action as arguments.",
          ],
          [
            "line 4, col 6 to line 4, col 40",
            "\\lor has both temporal formula and action as arguments.",
          ],
          ["line 5, col 7 to line 5, col 11", setError],
          [
            "line 5, col 6 to line 5, col 28",
            "\\land has both temporal formula and action as arguments.",
          ],
          ["line 5, col 36 to line 5, col 40", setError],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("rejects an ASSUME above constant level like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nASSUME x' = x\nASSUME x = 1\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 1 to line 3, col 13 of module M",
          message:
            "Level error: assumptions must be level 0 (Constant), \nbut this one has level 2.",
        },
        {
          location: "line 4, col 1 to line 4, col 12 of module M",
          message:
            "Level error: assumptions must be level 0 (Constant), \nbut this one has level 1.",
        },
      ]),
    );
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

  it("checks the levels of _Possible's operators like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS _Possible\nVARIABLE x\nF == _CheckName([](x = 1))\nG == _Track(TRUE, []x)\nH == [](_Track(x' = 1, \"n\"))\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 6 to line 4, col 26 of module M",
          message:
            "Level error in applying operator _CheckName:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        },
        {
          location: "line 5, col 6 to line 5, col 22 of module M",
          message:
            "Level error in applying operator _Track:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
        },
      ]),
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
    [
      "CONSTANT d\nTHEOREM ASSUME NEW m \\in []d, NEW n \\in <>d PROVE TRUE\nTHEOREM TRUE\n<1>1. SUFFICES ASSUME NEW k \\in []d PROVE TRUE\n  OBVIOUS\n<1>2. QED",
      [
        ["line 4, col 16 to line 4, col 28", "Level error:\nTemporal formula used as set."],
        ["line 4, col 31 to line 4, col 43", "Level error:\nTemporal formula used as set."],
        ["line 6, col 23 to line 6, col 35", "Level error:\nTemporal formula used as set."],
      ],
    ],
    [
      "THEOREM ASSUME NEW TEMPORAL F, NEW k \\in F PROVE TRUE\nTHEOREM ASSUME NEW ACTION A, NEW j \\in A PROVE TRUE",
      [["line 3, col 32 to line 3, col 42", "Level error:\nTemporal formula used as set."]],
    ],
    [
      "Spec == x = 0 /\\ [][x' = x]_x\nL == []Spec!2!1\nE == <>Spec!2!1",
      [
        ["line 4, col 6 to line 4, col 15", "[] followed by action not of form [A]_v."],
        ["line 5, col 6 to line 5, col 15", "<> followed by action not of form <<A>>_v."],
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
