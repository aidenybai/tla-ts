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

  it("checks the range shared by bounded variables once, for the first", async () => {
    await expect(checkDefinition("\\E v, w \\in [](x = 1) : TRUE")).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 6 to line 3, col 33 of module M",
          message:
            "Level error in applying operator $BoundedExists:\nThe level of the range for the bounded variable line 3, col 9 to line 3, col 9 of module M \nexceeds the maximum level allowed by the operator.",
        },
      ]),
    );
  });

  it("checks a shared range once after resolving a selection in it", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nT == [](x = 1) /\\ TRUE\nF == \\E v, w \\in T!1 : TRUE\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 6 to line 4, col 27 of module M",
          message:
            "Level error in applying operator $BoundedExists:\nThe level of the range for the bounded variable line 4, col 9 to line 4, col 9 of module M \nexceeds the maximum level allowed by the operator.",
        },
      ]),
    );
  });

  it.each([
    [
      "another definition",
      "G == (x' = 2) /\\ []x /\\ TRUE\nH == LET J == INSTANCE Naturals IN J!+(1, 2)",
    ],
    [
      "the same definition",
      "G == (x' = 2) /\\ []x /\\ LET J == INSTANCE Naturals IN J!+(1, 2) = 3",
    ],
  ])(
    "locates a parenthesized operand at its parenthesis when %s has a LET INSTANCE",
    async (_, definitions) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definitions}\n====`,
          config: "",
        }),
      ).rejects.toThrow(
        createSanyError([
          {
            location: "line 4, col 6 to line 4, col 20 of module M",
            message: "\\land has both temporal formula and action as arguments.",
          },
        ]),
      );
    },
  );

  it("checks the level of an operator argument against its parameter", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nHiC(G(_)) == G(1) = 1\nF == {HiC(LAMBDA p : [](x = p)) : v \\in {1}}\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 7 to line 4, col 31 of module M",
          message:
            "Level error in applying operator HiC:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        },
      ]),
    );
  });

  it("checks an operator argument against the levels the operator applies it to", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nPr(p) == p'\nAp(F(_), a) == F(a)\nAp2(F(_, _), a, b) == F(a, b)\nOnPrime(F(_)) == F(x')\nOnBox2(F(_, _)) == F([](x = 1), 1)\nTwice(F(_), a) == F(F(a))\nA == Ap(Pr, x')\nB == OnPrime(Pr)\nC == Twice(LAMBDA q : q' = q, x)\nD == Ap(Pr, x)\nE == OnBox2(\\cup)\nG == Ap2(\\cup, [](x = 1), 1)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 9, col 6 to line 9, col 15",
            "Level error in applying operator Ap:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 10, col 6 to line 10, col 16",
            "Level error in applying operator OnPrime:\nThe permitted level of argument 1 of the operator argument 1 \nmust be at least 2.",
          ],
          [
            "line 11, col 6 to line 11, col 32",
            "Level error in applying operator Twice:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
          ],
          [
            "line 13, col 6 to line 13, col 17",
            "Level error in applying operator OnBox2:\nThe permitted level of argument 1 of the operator argument 1 \nmust be at least 3.",
          ],
          [
            "line 14, col 6 to line 14, col 28",
            "Level error in applying operator Ap2:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          ],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it.each([
    [
      "a constant module",
      "CONSTANT Op(_), k\nK == Op(k)",
      "I == INSTANCE Inner WITH Op <- LAMBDA p : 1, k <- x'\nU == [](I!K)\nW == LET L == INSTANCE Inner WITH Op <- LAMBDA p : 1, k <- x' IN [](L!K)\nJ == INSTANCE Inner WITH Op <- LAMBDA p : 1, k <- (x')'",
      [
        ["line 8, col 6 to line 8, col 12", "[] followed by action not of form [A]_v."],
        ["line 9, col 66 to line 9, col 72", "[] followed by action not of form [A]_v."],
        [
          "line 10, col 51 to line 10, col 55",
          "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        ],
      ],
    ],
    [
      "a module with variables",
      "CONSTANT Op(_), k\nVARIABLE z\nK == Op(k)",
      "Eq(p) == p = 1\nI == INSTANCE Inner WITH Op <- Eq, k <- [](x = 1), z <- x\nU == I!K\nJ == INSTANCE Inner WITH Op <- Eq, k <- (x')', z <- x",
      [
        [
          "line 11, col 41 to line 11, col 45",
          "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        ],
        [
          "line 9, col 1 to line 9, col 57",
          "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'k' \nmust be at most 0.",
        ],
        [
          "line 9, col 1 to line 9, col 57",
          "Level error when instantiating module 'Inner':\nThe level of the argument 0 of the operator Op' \nmust be at most 2.",
        ],
      ],
    ],
  ])(
    "levels the definitions of an instance of %s through its substitutes like SANY",
    async (_, inner, definitions, errors) => {
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\n${inner}\n====\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it("checks a LET instance with the LET, after its body, like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT k\nVARIABLE z\nK == k\n====\nI == INSTANCE Inner WITH k <- x, z <- x\nD == LET L == INSTANCE Inner WITH k <- x, z <- x IN [](x')\nE == [](x')\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 9, col 53 to line 9, col 58", "[] followed by action not of form [A]_v."],
          [
            "line 9, col 10 to line 9, col 48",
            "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'k' \nmust be at most 0.",
          ],
          ["line 10, col 6 to line 10, col 11", "[] followed by action not of form [A]_v."],
          [
            "line 8, col 1 to line 8, col 39",
            "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'k' \nmust be at most 0.",
          ],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it.each([
    "INSTANCE Q WITH c <- k, w <- k",
    "N == INSTANCE Q WITH c <- k, w <- k",
    "LOCAL INSTANCE Q WITH c <- k, w <- k",
    "N(p) == INSTANCE Q WITH c <- {k}, w <- p",
  ])("constrains a module by its instance %s, as SANY does", async (instance) => {
    await expect(
      check({
        source: `---- MODULE M ----\nVARIABLE x\n---- MODULE Q ----\nCONSTANT c\nVARIABLE w\nA == c\n====\n---- MODULE L ----\nCONSTANT k\n${instance}\n====\nI == INSTANCE L WITH k <- x\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 12, col 1 to line 12, col 27 of module M",
          message:
            "Level error in instantiating module 'L':\nThe level of the expression or operator substituted for 'k' \nmust be at most 0.",
        },
      ]),
    );
  });

  it.each([
    "INSTANCE Q WITH c <- D(k)!1, w <- 1",
    "N == INSTANCE Q WITH c <- D(k)!1, w <- 1",
    "LOCAL INSTANCE Q WITH c <- D(k)!1, w <- 1",
    "N(p) == INSTANCE Q WITH c <- D(k)!1, w <- p",
  ])(
    "constrains a module by its instance %s through the selected subexpression, as SANY does",
    async (instance) => {
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\n---- MODULE Q ----\nCONSTANT c\nVARIABLE w\nA == c\n====\n---- MODULE L ----\nCONSTANT k\nD(a) == {a}\n${instance}\n====\nI == INSTANCE L WITH k <- x\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ).rejects.toThrow(
        createSanyError([
          {
            location: "line 13, col 1 to line 13, col 27 of module M",
            message:
              "Level error in instantiating module 'L':\nThe level of the expression or operator substituted for 'k' \nmust be at most 0.",
          },
        ]),
      );
    },
  );

  const getInstanceError =(line: number, end: number, maximum: number) => ({
    location: `line ${line}, col 1 to line ${line}, col ${end} of module M`,
    message: `Level error in instantiating module 'L':\nThe level of the expression or operator substituted for 'k' \nmust be at most ${maximum}.`,
  });

  it.each([
    [
      "a theorem",
      "",
      "THEOREM k' = k",
      [
        [12, 28, 0],
        [13, 29, 0],
        [14, 36, 0],
      ],
    ],
    [
      "a proof step",
      "",
      "THEOREM TRUE\n<1>1. k' = k\n  OBVIOUS\n<1> QED",
      [
        [15, 28, 0],
        [16, 29, 0],
        [17, 36, 0],
      ],
    ],
    [
      "a BY proof",
      "",
      "THEOREM TRUE\nBY k' = k",
      [
        [13, 28, 0],
        [14, 29, 0],
        [15, 36, 0],
      ],
    ],
    [
      "a proof's DEFINE",
      "",
      "THEOREM TRUE\n<1> DEFINE G == k'\n<1> QED",
      [
        [14, 28, 0],
        [15, 29, 0],
        [16, 36, 0],
      ],
    ],
    [
      "a proof's INSTANCE",
      "",
      "THEOREM TRUE\n<1> INSTANCE Q WITH c <- k, w <- k\n<1> QED",
      [
        [14, 28, 0],
        [15, 29, 0],
        [16, 36, 0],
      ],
    ],
    [
      "a proof's named INSTANCE",
      "",
      "THEOREM TRUE\n<1> N == INSTANCE Q WITH c <- k, w <- k\n<1> QED",
      [
        [14, 28, 0],
        [15, 29, 0],
        [16, 36, 0],
      ],
    ],
    ["a WITNESS", "", "THEOREM TRUE\n<1>1. WITNESS k \\in {1}\n<1> QED", [[16, 36, 2]]],
    [
      "an ASSUME/PROVE step",
      "",
      "THEOREM TRUE\n<1>1. ASSUME NEW z PROVE z = k\n  OBVIOUS\n<1> QED",
      [[17, 36, 2]],
    ],
    [
      "a USE",
      "",
      "USE k' = k",
      [
        [13, 29, 1],
        [14, 36, 1],
      ],
    ],
    [
      "an extended theorem",
      "THEOREM k' = k",
      "",
      [
        [15, 28, 0],
        [16, 29, 0],
        [17, 36, 0],
      ],
    ],
    [
      "an extended USE",
      "USE k' = k",
      "",
      [
        [16, 29, 1],
        [17, 36, 1],
      ],
    ],
    [
      "an extended INSTANCE",
      "INSTANCE Q WITH c <- k, w <- k",
      "",
      [
        [15, 28, 0],
        [16, 29, 0],
        [17, 36, 0],
      ],
    ],
    [
      "an extended proof",
      "THEOREM TRUE\n<1>1. k' = k\n  OBVIOUS\n<1> QED",
      "",
      [
        [18, 28, 0],
        [19, 29, 0],
        [20, 36, 0],
      ],
    ],
  ])("constrains a module by %s, as SANY does", async (_, extended, body, errors) => {
    const modules = extended
      ? `---- MODULE L0 ----\nCONSTANT k\n${extended}\n====\n---- MODULE L ----\nEXTENDS L0\n====`
      : `---- MODULE L ----\nCONSTANT k\n${body}\n====`;
    await expect(
      check({
        source: `---- MODULE M ----\nVARIABLE x\n---- MODULE Q ----\nCONSTANT c\nVARIABLE w\nA == c\n====\n${modules}\nI1 == INSTANCE L WITH k <- x\nI2 == INSTANCE L WITH k <- x'\nI3 == INSTANCE L WITH k <- [](x = 1)\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(errors.map((error) => getInstanceError(error[0], error[1], error[2]))),
    );
  });

  it.each([
    ["a LOCAL INSTANCE", "LOCAL INSTANCE L0", 11],
    ["a parameterized INSTANCE", "N(p) == INSTANCE L0", 11],
    ["a proof's INSTANCE", "THEOREM TRUE\n<1> INSTANCE L0\n<1> QED", 13],
    ["a proof's DEFINE", "THEOREM TRUE\n<1> DEFINE N == INSTANCE L0\n<1> QED", 13],
  ])(
    "constrains a module through the implicit substitutes of %s, as SANY does",
    async (_, body, line) => {
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\n---- MODULE L0 ----\nCONSTANT k\nTHEOREM k' = k\n====\n---- MODULE L ----\nCONSTANT k\n${body}\n====\nI1 == INSTANCE L WITH k <- x\nI2 == INSTANCE L WITH k <- x'\nI3 == INSTANCE L WITH k <- [](x = 1)\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ).rejects.toThrow(
        createSanyError([
          getInstanceError(line, 28, 0),
          getInstanceError(line + 1, 29, 0),
          getInstanceError(line + 2, 36, 0),
        ]),
      );
    },
  );

  it("constrains a module by a named assumption but keeps it constant, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE L ----\nCONSTANT k\nAXIOM X == k' = k\n====\nI1 == INSTANCE L WITH k <- x\nI2 == INSTANCE L WITH k <- x'\nI3 == INSTANCE L WITH k <- [](x = 1)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 5, col 1 to line 5, col 17 of module M",
          message:
            "Level error: assumptions must be level 0 (Constant), \nbut this one has level 2.",
        },
        getInstanceError(8, 29, 1),
        getInstanceError(9, 36, 1),
      ]),
    );
  });

  it("keeps an instance from substituting a temporal formula for a constant an assumption mentions, which SANY allows", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE L ----\nCONSTANT k\nASSUME k /\\ TRUE\n====\nI == INSTANCE L WITH k <- [](x = 1)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(createSanyError([getInstanceError(7, 35, 2)]));
  });

  it("constrains a module by the theorems of a LET instance in an ASSUME/PROVE, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE In ----\nCONSTANT c\nVARIABLE v\nTHEOREM T == v \\in {c}\n====\n---- MODULE L ----\nCONSTANT k\nVARIABLE w\nTHEOREM ASSUME LET K == INSTANCE In WITH c <- w, v <- k IN TRUE PROVE TRUE\n====\nI == INSTANCE L WITH k <- x, w <- x\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 11, col 20 to line 11, col 55", "In", "c"],
          ["line 13, col 1 to line 13, col 35", "L", "k"],
          ["line 13, col 1 to line 13, col 35", "L", "w"],
        ].map((error) => ({
          location: `${error[0]} of module M`,
          message: `Level error in instantiating module '${error[1]}':\nThe level of the expression or operator substituted for '${error[2]}' \nmust be at most 0.`,
        })),
      ),
    );
  });

  it.each([
    [
      "with a definition",
      "B == c\n",
      ["line 10, col 17 to line 10, col 21", "line 11, col 45 to line 11, col 49", "line 12, col 17 to line 12, col 21"],
      "line 11, col 11 to line 11, col 49",
    ],
    [
      "without definitions",
      "",
      ["line 9, col 17 to line 9, col 21", "line 11, col 17 to line 11, col 21", "line 10, col 45 to line 10, col 49"],
      "line 10, col 11 to line 10, col 49",
    ],
  ])(
    "reports the substitute errors of a proof's LET instance of a module %s where SANY does",
    async (_, definitions, primes, instance) => {
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\n---- MODULE P ----\nCONSTANT c\nVARIABLE v\n${definitions}====\nN == INSTANCE P WITH c <- 1, v <- x\nTHEOREM TRUE\n<1>1. LET D1 == (x')'\n          K == INSTANCE P WITH c <- x, v <- (x')'\n          D2 == (x')'\n      IN TRUE\n  OBVIOUS\n<1> QED\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ).rejects.toThrow(
        createSanyError([
          ...primes.map((location) => ({
            location: `${location} of module M`,
            message:
              "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
          })),
          {
            location: `${instance} of module M`,
            message:
              "Level error in instantiating module 'P':\nThe level of the expression or operator substituted for 'c' \nmust be at most 0.",
          },
        ]),
      );
    },
  );

  it("levels a LET instance's definitions through an operator parameter it substitutes like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT Op(_), k\nK == Op(k)\n====\nPr(p) == p'\nI == INSTANCE Inner WITH Op <- LAMBDA p : p, k <- 1\nU == LET L(G(_)) == INSTANCE Inner WITH Op <- G, k <- x' IN L(Pr)!K\nW(G(_)) == LET L == INSTANCE Inner WITH Op <- G, k <- x' IN L!K\nV == W(Pr)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 9, col 61 to line 9, col 67", "L!K"],
          ["line 11, col 6 to line 11, col 10", "W"],
        ].map((error) => ({
          location: `${error[0]} of module M`,
          message: `Level error in applying operator ${error[1]}:\nThe permitted level of argument 1 of the operator argument 1 \nmust be at least 2.`,
        })),
      ),
    );
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

  it("reports an EXCEPT path's level error at its update, before its value's, like SANY", async () => {
    const seqError =
      "Level error in applying operator $Seq:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nf == [v \\in {1} |-> v]\nA == [f EXCEPT ![[]x] = {<>x}]\nB == [f EXCEPT !.a = 1, ![<>x][1] = {[]x}]\nE == [f EXCEPT ![1] = [f EXCEPT ![[]x] = 2]]\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 4, col 16 to line 4, col 29", seqError],
          ["line 4, col 25 to line 4, col 29", setError],
          ["line 5, col 25 to line 5, col 41", seqError],
          ["line 5, col 37 to line 5, col 41", setError],
          ["line 6, col 33 to line 6, col 42", seqError],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("locates the tuple of an EXCEPT path at the part of its update SANY picks", async () => {
    const tupleError =
      "Level error in applying operator $Tuple:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          '---- MODULE M ----\nVARIABLE x\nf == [v \\in {1} |-> v]\nA == [f EXCEPT ![[]x, 1] = 1]\nB == [f EXCEPT ![1][[]x, 2] = 1]\nC == [f EXCEPT ![1][2][[]x, 3] = ((1))]\nD == [f EXCEPT !.a[[]x, 2] = 1]\nE == [f EXCEPT ![1][[]x, 2][3] = 1]\nG == [f EXCEPT ![[]x, 1][2] = 1, !["a"][<>x, 2] = 1 = 2]\nH == [f EXCEPT ![1][2][[]x, 3] = [f EXCEPT ![1][<>x, 2] = 3]]\nInit == x = 0\nNext == x\' = x\n====',
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          "line 4, col 17 to line 4, col 24",
          "line 5, col 29 to line 5, col 29",
          "line 6, col 34 to line 6, col 38",
          "line 7, col 28 to line 7, col 28",
          "line 8, col 28 to line 8, col 30",
          "line 9, col 17 to line 9, col 24",
          "line 9, col 49 to line 9, col 49",
          "line 10, col 34 to line 10, col 60",
          "line 10, col 57 to line 10, col 57",
        ].map((location) => ({ location: `${location} of module M`, message: tupleError })),
      ),
    );
  });

  it("locates the tuple of a late EXCEPT path component at the component, where SANY's Generator throws", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nf == [v \\in {1} |-> v]\nA == [f EXCEPT ![1][2][3][[]x, 4] = 1]\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 26 to line 4, col 33 of module M",
          message:
            "Level error in applying operator $Tuple:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        },
      ]),
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

  it("checks the levels of every module in a file, inner ones first, like SANY", async () => {
    const setError =
      "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE v\n---- MODULE Inner ----\nVARIABLE w\nA == {[]w}\n---- MODULE Deep ----\nVARIABLE u\nD == {[]u}\n====\nE == {<>w}\n====\n---- MODULE Other ----\nVARIABLE w\nO == {[]w}\n====\nI == INSTANCE Inner WITH w <- v\nC == {I!A}\nG == {[]v}\nInit == v = 0\nNext == v' = v\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          "line 8, col 6 to line 8, col 10",
          "line 5, col 6 to line 5, col 10",
          "line 10, col 6 to line 10, col 10",
          "line 14, col 6 to line 14, col 10",
          "line 17, col 6 to line 17, col 10",
          "line 18, col 6 to line 18, col 10",
        ].map((location) => ({ location: `${location} of module M`, message: setError })),
      ),
    );
  });

  it.each([
    [
      "---- MODULE M ----\nVARIABLE v\n---- MODULE Inner ----\nVARIABLE w\nA == {[]w}\n====\nRECURSIVE R(_)\nR(p) == {[]v} \\cup R(p)\nC == {<>v}\n====",
      [
        ["line 8, col 9 to line 8, col 13", "set"],
        ["line 8, col 9 to line 8, col 23", "union"],
        ["line 5, col 6 to line 5, col 10", "set"],
        ["line 9, col 6 to line 9, col 10", "set"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nRECURSIVE R(_)\nR(p) == IF p' = 1 THEN TRUE ELSE R(p)\n====",
      [["line 4, col 1 to line 4, col 37", "Argument 1 of recursive operator R is primed"]],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nRECURSIVE R(_), S(_)\nS(p) == {[]x}\nR(p) == p' = 1 \\/ R(p)\n====",
      [
        ["line 5, col 1 to line 5, col 22", "Argument 1 of recursive operator R is primed"],
        ["line 4, col 9 to line 4, col 13", "set"],
        [
          "line 5, col 9 to line 5, col 22",
          "\\lor has both temporal formula and action as arguments.",
        ],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nRECURSIVE R(_), S(_)\nS(n) == R(n) \\/ x' = 1\nR(n) == S(n)\nASSUME R(1)\n====",
      [["line 6, col 1 to line 6, col 11", "assume 2"]],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nRECURSIVE R(_)\nX(p) == R(p)\nR(p) == {[]x} \\cup X(p)\nASSUME X(1)\n====",
      [
        ["line 5, col 9 to line 5, col 13", "set"],
        ["line 5, col 9 to line 5, col 23", "union"],
        ["line 6, col 1 to line 6, col 11", "assume 3"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nB == {[]x}\nA == LET RECURSIVE F(_)\n         F(n) == {<>x} \\cup F(n)\n     IN F(1)\n====",
      [
        ["line 5, col 18 to line 5, col 22", "set"],
        ["line 5, col 18 to line 5, col 32", "union"],
        ["line 3, col 6 to line 3, col 10", "set"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nRECURSIVE R(_)\nR(p) == LET RECURSIVE F(_)\n            F(n) == {[]x} \\cup F(n) \\cup R(n)\n        IN F(p)\nC == {<>x}\n====",
      [
        ["line 5, col 21 to line 5, col 25", "set"],
        ["line 5, col 21 to line 5, col 35", "union"],
        ["line 5, col 21 to line 5, col 45", "union"],
        ["line 7, col 6 to line 7, col 10", "set"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE w\nRECURSIVE R(_), S(_)\nR(p) == S(p)\nS(p) == p' = 1 \\/ S(p)\n====\nC == {[]x}\n====",
      [
        ["line 7, col 1 to line 7, col 22", "Argument 1 of recursive operator S is primed"],
        ["line 6, col 1 to line 6, col 12", "Argument 1 of recursive operator R is primed"],
        ["line 9, col 6 to line 9, col 10", "set"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nCONSTANT k\nRECURSIVE R(_), S(_)\nR(p) == k \\cup (LET L == {x'} IN L)\nS(p) == []x\n====",
      [["line 5, col 9 to line 5, col 35", "union"]],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nAp(F(_), a) == F(a)\nRECURSIVE R(_)\nR(n) == IF n THEN TRUE ELSE Ap(LAMBDA v : R(v), n')\nX == Ap(LAMBDA v : R(v), x')\n====",
      [
        ["line 5, col 1 to line 5, col 51", "Argument 1 of recursive operator R is primed"],
        ["line 6, col 6 to line 6, col 28", "argument 2"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nAp(F(_), a) == F(a)\nRECURSIVE R(_), S(_)\nR(n) == IF n THEN TRUE ELSE S(n)\nS(n) == Ap(LAMBDA v : R(v), n')\n====",
      [["line 6, col 1 to line 6, col 31", "Argument 1 of recursive operator S is primed"]],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nA == []x\nRECURSIVE R(_)\nR(n) == IF n THEN {A!:} ELSE R(n)'\n====",
      [
        ["line 5, col 19 to line 5, col 23", "set"],
        ["line 5, col 1 to line 5, col 34", "Argument 1 of recursive operator R is primed"],
        ["line 5, col 30 to line 5, col 34", "prime"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nB == TRUE\n====\nI == INSTANCE Inner\nRECURSIVE R(_)\nR(n) == IF n THEN {[]x} ELSE I!B /\\ R(n)'\n====",
      [
        ["line 8, col 19 to line 8, col 23", "set"],
        ["line 8, col 1 to line 8, col 41", "Argument 1 of recursive operator R is primed"],
        ["line 8, col 37 to line 8, col 41", "prime"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nA == []x\nASSUME LET RECURSIVE F(_)\n           F(n) == IF n THEN {A!:} ELSE F(n)'\n       IN F(TRUE)\n====",
      [
        ["line 5, col 30 to line 5, col 34", "set"],
        ["line 5, col 12 to line 5, col 45", "Argument 1 of recursive operator F is primed"],
        ["line 5, col 41 to line 5, col 45", "prime"],
        ["line 4, col 1 to line 6, col 17", "assume 3"],
      ],
    ],
    [
      "---- MODULE M ----\nVARIABLE x\nA == []x\nTHEOREM LET RECURSIVE F(_)\n            F(n) == IF n THEN {A!:} ELSE F(n)'\n        IN F(TRUE)\n====",
      [
        ["line 5, col 31 to line 5, col 35", "set"],
        ["line 5, col 13 to line 5, col 46", "Argument 1 of recursive operator F is primed"],
        ["line 5, col 42 to line 5, col 46", "prime"],
      ],
    ],
  ])("checks recursive sections first and twice like SANY: %j", async (source, errors) => {
    const messages: Record<string, string> = {
      set: "Level error in applying operator $SetEnumerate:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
      union:
        "Level error in applying operator \\union:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
      "assume 2":
        "Level error: assumptions must be level 0 (Constant), \nbut this one has level 2.",
      "assume 3":
        "Level error: assumptions must be level 0 (Constant), \nbut this one has level 3.",
      "argument 2":
        "Level error in applying operator Ap:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
      prime:
        "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
    };
    await expect(check({ source, config: "" })).rejects.toThrow(
      createSanyError(
        errors.map((error) => ({
          location: `${error[0]} of module M`,
          message: messages[error[1]] ?? error[1],
        })),
      ),
    );
  });

  it.each([
    ["EXTENDS Base\nVARIABLE x\nE == V([]x, 0)", "line 4, col 6 to line 4, col 14", "V"],
    [
      "EXTENDS Naturals\nVARIABLE x\nI == INSTANCE Base\nE == I!V([]x, 0)",
      "line 5, col 6 to line 5, col 16",
      "I!V",
    ],
    [
      "EXTENDS Naturals\nVARIABLE x\nE == LET J == INSTANCE Base IN J!V([]x, 0)",
      "line 4, col 32 to line 4, col 42",
      "J!V",
    ],
    [
      "EXTENDS Naturals\nVARIABLE x\nI == INSTANCE Mid\nE == I!U([]x)",
      "line 5, col 6 to line 5, col 13",
      "I!U",
    ],
    ["EXTENDS Mid\nVARIABLE x\nE == U([]x)", "line 4, col 6 to line 4, col 11", "U"],
    [
      "EXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nEXTENDS Naturals\nRECURSIVE V(_, _)\nV(a, n) == IF n = 0 THEN a ELSE V(a, n - 1)\n====\nI == INSTANCE Inner\nE == I!V([]x, 0)",
      "line 10, col 6 to line 10, col 16",
      "I!V",
    ],
  ])(
    "levels a recursive operator of another module with its section in %j like SANY",
    async (source, location, operator) => {
      const modules: Record<string, string> = {
        Base: "EXTENDS Naturals\nRECURSIVE V(_, _)\nV(a, n) == IF n = 0 THEN a ELSE V(a, n - 1)",
        Mid: "EXTENDS Base\nU(a) == V(a, 1)",
      };
      await expect(
        check({
          source: `---- MODULE M ----\n${source}\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
          loadModule: (name) =>
            name in modules ? `---- MODULE ${name} ----\n${modules[name]}\n====` : undefined,
        }),
      ).rejects.toThrow(
        createSanyError([
          {
            location: `${location} of module M`,
            message: `Level error in applying operator ${operator}:\nThe level of argument 1 exceeds the maximum level allowed by the operator.`,
          },
        ]),
      );
    },
  );

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
      "THEOREM ASSUME NEW TEMPORAL f PROVE TRUE\n<1>1. CASE x = 1\n  <2>1. TAKE y \\in {x}\n  <2> QED\n<1>2. ASSUME NEW ACTION g PROVE TRUE\n  <2>1. HAVE x = 1\n  <2> QED\n<1>3. ASSUME NEW TEMPORAL h PROVE TRUE\n  <2>1. HAVE x = 1\n  <2> QED\n<1> QED",
      [
        [
          "line 11, col 9 to line 11, col 18",
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        ],
        ["line 4, col 7 to line 4, col 16", "Non-constant CASE for temporal goal."],
        [
          "line 5, col 9 to line 5, col 22",
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        ],
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
    [
      "Pr(p) == p'\nPrime(F(_), a) == F(a)'\nD == Prime(Pr, []x)",
      [
        [
          "line 5, col 6 to line 5, col 19",
          "Level error in applying operator Prime:\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        ],
        [
          "line 5, col 6 to line 5, col 19",
          "Level error in applying operator Prime:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
        ],
        [
          "line 5, col 6 to line 5, col 19",
          "Level error in applying operator Prime:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
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

  it("checks the proof of a labeled temporal theorem or step, which SANY skips", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nTHEOREM T == t :: [](x = 0)\n<1>1. HAVE x = 1\n<1>2. CASE x = 1\n  <2>1. TAKE y \\in {x}\n  <2> QED\n<1>3. s :: [](x = 0)\n  <2>1. WITNESS x \\in {1}\n  <2> QED\n<1> QED\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 9, col 9 to line 9, col 25",
            "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
          ],
          [
            "line 4, col 7 to line 4, col 16",
            "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
          ],
          ["line 5, col 7 to line 5, col 16", "Non-constant CASE for temporal goal."],
          [
            "line 6, col 9 to line 6, col 22",
            "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
          ],
        ].map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("checks a proof with the NEW symbols and definitions in scope, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nTHEOREM ASSUME NEW ACTION a PROVE TRUE\n<1>1. a' = 1\n  OBVIOUS\n<1>2. ASSUME NEW ACTION b PROVE TRUE\n  <2>1. b' = 1\n    OBVIOUS\n  <2> QED\n<1>3. SUFFICES ASSUME NEW ACTION c PROVE TRUE\n  OBVIOUS\n<1>4. c' = 1\n  OBVIOUS\n<1> QED\nTHEOREM ASSUME NEW VARIABLE v PROVE [](x = 0)\n<1> DEFINE D == x\n<1>1. HAVE v = 1\n<1>2. CASE D = 1\n<1> QED\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ...[
            "line 4, col 7 to line 4, col 8",
            "line 7, col 9 to line 7, col 10",
            "line 12, col 7 to line 12, col 8",
          ].map((location) => [
            location,
            "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
          ]),
          [
            "line 17, col 7 to line 17, col 16",
            "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
          ],
          ["line 18, col 7 to line 18, col 16", "Non-constant CASE for temporal goal."],
        ].map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("checks an INSTANCE step in place and a proof's instance definitions after its steps, as SANY does", async () => {
    const prime =
      "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    const constant =
      "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'c' \nmust be at most 0.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE z\nIZ == z\n====\nI0 == INSTANCE Inner WITH c <- 1, z <- x\nTHEOREM ASSUME NEW VARIABLE y PROVE TRUE\n<1> N == INSTANCE Inner WITH c <- y, z <- (x')'\n<1>1. (x')' = 1\n  OBVIOUS\n<1> INSTANCE Inner WITH c <- x, z <- (x')'\n<1>2. (x')' = 1\n  OBVIOUS\n<1> QED\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 11, col 7 to line 11, col 11", prime],
          ["line 13, col 38 to line 13, col 42", prime],
          ["line 13, col 5 to line 13, col 42", constant],
          ["line 14, col 7 to line 14, col 11", prime],
          ["line 10, col 43 to line 10, col 47", prime],
          ["line 10, col 5 to line 10, col 47", constant],
        ].map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("checks a LET instance in an ASSUME/PROVE or a proof step with the NEW symbols in scope, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE z\nIZ == z\n====\nI0 == INSTANCE Inner WITH c <- 1, z <- x\nTHEOREM ASSUME NEW VARIABLE y PROVE LET N == INSTANCE Inner WITH c <- y, z <- x IN TRUE\nTHEOREM TRUE\n<1>1. LET N == INSTANCE Inner WITH c <- x, z <- x IN TRUE\n  OBVIOUS\n<1> QED\nTHEOREM ASSUME NEW VARIABLE w PROVE TRUE\n<1>1. LET N == INSTANCE Inner WITH c <- w, z <- x IN TRUE\n  OBVIOUS\n<1> QED\nTHEOREM U == LET N == INSTANCE Inner WITH c <- x, z <- x IN TRUE\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          "line 18, col 18 to line 18, col 56",
          "line 9, col 41 to line 9, col 79",
          "line 11, col 11 to line 11, col 49",
          "line 15, col 11 to line 15, col 49",
        ].map((location) => ({
          location: `${location} of module M`,
          message:
            "Level error in instantiating module 'Inner':\nThe level of the expression or operator substituted for 'c' \nmust be at most 0.",
        })),
      ),
    );
  });

  it("gives the definitions that a proof or a LET in a proof instantiates their levels, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE z\nIZ == z'\nIC(a) == <<c, a>>\n====\nI0 == INSTANCE Inner WITH c <- 1, z <- x\nTHEOREM ASSUME NEW CONSTANT y PROVE TRUE\n<1> N == INSTANCE Inner WITH c <- y, z <- x\n<1>1. (N!IZ)' = 1\n  OBVIOUS\n<1>2. N!IC(x')' = 1\n  OBVIOUS\n<1> INSTANCE Inner WITH c <- 1, z <- x\n<1>3. (IZ)' = 1\n  OBVIOUS\n<1>4. LET K == INSTANCE Inner WITH c <- y, z <- x IN (K!IZ)' = 1\n  OBVIOUS\n<1> QED\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          "line 12, col 7 to line 12, col 13",
          "line 14, col 7 to line 14, col 15",
          "line 17, col 7 to line 17, col 11",
          "line 19, col 54 to line 19, col 60",
        ].map((location) => ({
          location: `${location} of module M`,
          message:
            "Level error in applying operator ':\nThe level of argument 1 exceeds the maximum level allowed by the operator.",
        })),
      ),
    );
  });

  it("reports a level error inside a theorem where a definition before it selects it, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nB == \\E b \\in {x'} : b\nTHEOREM T == t :: (B /\\ [](x = 1))\nD == T!t /\\ (x' = 1 /\\ [](x = 1))\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        ["line 4, col 20 to line 4, col 33", "line 5, col 14 to line 5, col 32"].map(
          (location) => ({
            location: `${location} of module M`,
            message: "\\land has both temporal formula and action as arguments.",
          }),
        ),
      ),
    );
  });

  it("checks a label it checked before as level-correct, as SANY does", async () => {
    const sfError =
      "Level error in applying operator $SF:\nThe level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nB == \\E b \\in {x'} : b\nTHEOREM T == t :: (B /\\ [](x = 1))\n<1>1. SF_T!t(x' = 1)\n  OBVIOUS\n<1> QED\nD == SF_T!t(x' = 1)\nD2 == SF_T!t(x' = 1)\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 20 to line 4, col 33 of module M",
          message: "\\land has both temporal formula and action as arguments.",
        },
        { location: "line 9, col 7 to line 9, col 20 of module M", message: sfError },
        { location: "line 5, col 7 to line 5, col 20 of module M", message: sfError },
      ]),
    );
  });

  it("checks a label selected through an instance as level-correct, as SANY does", async () => {
    const exceeds = "The level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE In ----\nVARIABLE v\nB == \\E b \\in {v'} : b\nTHEOREM T == t :: (B /\\ [](v = 1))\nC == c :: ([](v = 1))\n====\nI == INSTANCE In WITH v <- x'\nD == SF_I!T!t(x' = 1)\nE == (I!C!c)'\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 6, col 20 to line 6, col 33 of module M",
          message: "\\land has both temporal formula and action as arguments.",
        },
        {
          location: "line 10, col 6 to line 10, col 21 of module M",
          message: `Level error in applying operator $SF:\n${exceeds}`,
        },
        {
          location: "line 11, col 6 to line 11, col 13 of module M",
          message: `Level error in applying operator ':\n${exceeds}`,
        },
        {
          location: "line 9, col 1 to line 9, col 29 of module M",
          message:
            "Level error in instantiating module 'In':\nThe level of the expression or operator substituted for 'v' \nmust be at most 1.",
        },
      ]),
    );
  });

  it.each([
    [
      "I == INSTANCE In\nJ(p) == INSTANCE In\nD == SF_I!T!t(x' = 1)\nE == (J(1)!C!c)'",
      ["line 10, col 6 to line 10, col 21", "line 11, col 6 to line 11, col 16"],
    ],
    [
      "INSTANCE In\nD == SF_T!t(x' = 1)\nE == (C!c)'",
      ["line 9, col 6 to line 9, col 19", "line 10, col 6 to line 10, col 11"],
    ],
  ])(
    "checks a label selected through an instance that substitutes nothing as level-correct, as SANY does: %s",
    async (instances, ranges) => {
      const exceeds = "The level of argument 1 exceeds the maximum level allowed by the operator.";
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\n---- MODULE In ----\nB == \\E b \\in {x'} : b\nTHEOREM T == t :: (B /\\ [](x = 1))\nC == c :: ([](x = 1))\n====\n${instances}\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ).rejects.toThrow(
        createSanyError([
          {
            location: "line 5, col 20 to line 5, col 33 of module M",
            message: "\\land has both temporal formula and action as arguments.",
          },
          {
            location: `${ranges[0]} of module M`,
            message: `Level error in applying operator $SF:\n${exceeds}`,
          },
          {
            location: `${ranges[1]} of module M`,
            message: `Level error in applying operator ':\n${exceeds}`,
          },
        ]),
      );
    },
  );

  it("checks a label selected from a step's statement, as SANY does", async () => {
    const exceeds = "The level of argument 1 exceeds the maximum level allowed by the operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nB == \\E b \\in {x'} : b\nTHEOREM TRUE\n<1>1. s :: (B /\\ [](x = 1))\n  <2>1. (<1>1!s)'\n    OBVIOUS\n  <2> QED\n<1>2. (<1>1!s)'\n  OBVIOUS\n<1> D == ENABLED (<1>1!s)\n<1>3. t :: ([](x = 1))\n  OBVIOUS\n<1> QED BY (<1>3!t)'\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 5, col 13 to line 5, col 26 of module M",
          message: "\\land has both temporal formula and action as arguments.",
        },
        {
          location: "line 6, col 9 to line 6, col 17 of module M",
          message: `Level error in applying operator ':\n${exceeds}`,
        },
        {
          location: "line 9, col 7 to line 9, col 15 of module M",
          message: `Level error in applying operator ':\n${exceeds}`,
        },
        {
          location: "line 11, col 10 to line 11, col 25 of module M",
          message: `Level error in applying operator ENABLED:\n${exceeds}`,
        },
        {
          location: "line 14, col 12 to line 14, col 20 of module M",
          message: `Level error in applying operator ':\n${exceeds}`,
        },
      ]),
    );
  });

  it("reports no level error inside an expression selected through an instance, as SANY does", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE In ----\nVARIABLE v\nT == t :: (v' = 1)\nTHEOREM U == u :: (v' = 1)\n====\nI == INSTANCE In WITH v <- x'\nE == I!T!t\nF == I!U!u\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 8, col 1 to line 8, col 29 of module M",
          message:
            "Level error in instantiating module 'In':\nThe level of the expression or operator substituted for 'v' \nmust be at most 1.",
        },
      ]),
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

  const checkLetInstance = (inner: string, definitions: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLE x\nF(b) == b'\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner" ? `---- MODULE Inner ----\n${inner}\n====` : undefined,
    });

  it.each([
    [
      "CONSTANT C(_), k\nASSUME C(k)",
      "D(Op(_), a) == LET I == INSTANCE Inner WITH C <- Op, k <- a IN TRUE\nE == D(F, x')",
      13,
    ],
    [
      "CONSTANT C(_), k\nX == C(k)",
      "D(C(_), k) == LET I == INSTANCE Inner IN TRUE\nE == D(F, x')",
      13,
    ],
    [
      "CONSTANT C(_, _), k, j\nASSUME C(k, j)",
      "G(p, q) == p' /\\ q\nD(Op(_, _), a, b) == LET I == INSTANCE Inner WITH C <- Op, k <- a, j <- b IN TRUE\nE == D(G, x', x)",
      16,
    ],
  ])(
    "rejects an argument above the level a LET instance of %j allows in %j, like SANY",
    async (inner, definitions, end) => {
      const line = definitions.split("\n").length + 3;
      await expect(checkLetInstance(inner, definitions)).rejects.toThrow(
        createSanyError([
          {
            location: `line ${line}, col 6 to line ${line}, col ${end} of module M`,
            message:
              "Level error in applying operator D:\nThe level of argument 2 exceeds the maximum level allowed by the operator.",
          },
        ]),
      );
    },
  );

  it.each([
    "D(Op(_), a) == LET I == INSTANCE Inner WITH C <- Op, k <- a IN TRUE\nE == D(F, x)",
    "D(Op(_), a) == LET I(p) == INSTANCE Inner WITH C <- Op, k <- p IN TRUE\nE == D(F, x')",
  ])("accepts %j, like SANY", async (definitions) => {
    const result = await checkLetInstance("CONSTANT C(_), k\nX == C(k)", definitions);
    expect(result.status).toBe("success");
  });
});
