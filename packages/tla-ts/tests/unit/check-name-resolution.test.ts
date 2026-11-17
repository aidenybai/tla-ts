import { describe, expect, it } from "vite-plus/test";
import { check, TlaSyntaxError } from "../../src";
import { createSanyError } from "../../src/errors";

describe("name resolution matches SANY", () => {
  const checkNames = (source: string) =>
    check({
      source: `---- MODULE M ----\n${source}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("fails to parse a spec that imports a module it cannot find, such as Strings", async () => {
    await expect(checkNames("EXTENDS Strings")).rejects.toThrow(
      createSanyError(
        [
          {
            location: "In module M",
            message: "Cannot find source file for module Strings imported in module M.",
          },
        ],
        true,
      ),
    );
    await expect(checkNames("N == INSTANCE Nowhere")).rejects.toThrow(
      createSanyError(
        [
          {
            location: "In module M",
            message: "Cannot find source file for module Nowhere imported in module M.",
          },
        ],
        true,
      ),
    );
  });

  it.each([
    ["an operator from a module that is not extended", "EXTENDS Naturals\nf == 1 :> 2"],
    ["an operator that a standard module only instantiates locally", "EXTENDS TLC\nf == 1 + 1"],
    ["a definition before it is defined", "EXTENDS Naturals\nf == g + 1\ng == 1"],
    ["an operator with the wrong number of arguments", "g(a) == a\nf == g(1, 2)"],
    ["a record with duplicate fields", "f == [a |-> 1, b |-> 2, a |-> 1]"],
    ["an expression as a fact in a HIDE", "THEOREM bar == <<1, 2>>\nUSE bar\nHIDE bar, TRUE"],
    [
      "a definition as a fact in a HIDE step",
      "foo == 1\nTHEOREM T == TRUE\n<1>1. HIDE foo\n<1> QED",
    ],
    [
      "a LET definition named after the recursive one it is in",
      "RECURSIVE F\nF == LET F == 2 IN F",
    ],
    ["an unknown operator in a theorem", "THEOREM Undefined"],
    ["an unknown operator in a proof step", "THEOREM TRUE\n<1>1. Undefined\n  OBVIOUS\n<1> QED"],
    ["a higher-order operator as an operator argument", "D(Op(_)) == Op(42)\nFoo == D(D)"],
    ["an expression as an operator argument", "D(Op(_)) == Op(42)\nFoo == D(1)"],
    ["an operator as an expression argument", "F(a) == a\nG(a) == a\nFoo == F(G)"],
    ["an operator argument with the wrong arity", "D(Op(_)) == Op(42)\nG(a, b) == a\nFoo == D(G)"],
    [
      "a NEW symbol after the proof of its step",
      "THEOREM TRUE\n<1>1. ASSUME NEW c PROVE c = c\n  OBVIOUS\n<1>2. c = c\n<1> QED",
    ],
  ])("rejects %s", async (_title, source) => {
    await expect(checkNames(source)).rejects.toThrow(TlaSyntaxError);
  });

  it("accepts USE and HIDE of theorems, assumptions, steps, and definitions", async () => {
    const result = await checkNames(
      "EXTENDS Naturals\nfoo == 1\nUSE foo, foo > 0 DEF foo\nASSUME A == foo \\in Nat\nHIDE A\nTHEOREM T == foo = 1\nHIDE T DEF foo\nTHEOREM U == ASSUME NEW n \\in Nat PROVE n >= 0\n<1>1. n >= 0\n  OBVIOUS\n<1>2. HIDE <1>1, T\n<1> QED\n  BY <1>1",
    );
    expect(result.status).toBe("success");
  });

  it("resolves NEW, SUFFICES, PICK, DEFINE, and theorem labels in the steps they scope", async () => {
    const result = await checkNames(
      [
        "EXTENDS Naturals",
        "THEOREM Thm == ASSUME NEW S PROVE lab :: S = S",
        "<1> SUFFICES ASSUME NEW n \\in Nat PROVE n + 0 = n OBVIOUS",
        "<1>1. PICK m \\in Nat : m = n OBVIOUS",
        "<1> DEFINE k == m + n",
        "<1>2. ASSUME NEW c PROVE Thm!lab /\\ k = c",
        "  <2>1. c = c OBVIOUS",
        "  <2> QED",
        "<1> QED BY <1>2",
      ].join("\n"),
    );
    expect(result.status).toBe("success");
  });

  it("reads instance-qualified subscripts", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE x\nvars == <<x>>\nNext == x' = (x + 1) % 3\n====\nI == INSTANCE Inner\nSpec == x = 0 /\\ [][I!Next]_I!vars /\\ WF_I!vars(I!Next)\nProp == <>(x = 2)\nTHEOREM Spec => WF_I!vars(I!Next)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      4,
      3,
    ]);
  });

  it.each([
    ["a bound variable before a definition of that name", "F == \\E B \\in {1} : TRUE\nB == 1"],
    [
      "sibling quantifiers with one name",
      "F == (\\E y \\in {1} : TRUE) /\\ (\\E y \\in {2} : TRUE)",
    ],
    [
      "a LET definition whose body binds its own name",
      "F == LET e == CHOOSE e \\in {1} : TRUE IN e",
    ],
    ["a LET definition named after the definition it is in", "F == LET F == 2 IN F"],
    [
      "a definition named after a recursive LET definition before it",
      "G == LET RECURSIVE F(_)\n         F(n) == n\n     IN F(1)\nF == LET F == 2 IN F",
    ],
    [
      "a LET parameter named after a later LET definition",
      "F == LET A(B) == B\n         B == 1\n     IN A(B)",
    ],
    [
      "a recursive LET definition",
      "F == LET RECURSIVE G(_)\n         G(n) == IF n = 0 THEN 0 ELSE G(0)\n     IN G(1)",
    ],
    [
      "operator arguments of the arity a parameter takes",
      "D(Op(_)) == Op(42)\nG(a) == a\nF == D(G) = D(LAMBDA a : a)",
    ],
    [
      "an operator argument to an operator of a standard module a LET instantiates",
      "ASSUME LET S == INSTANCE Sequences IN S!SelectSeq(<<1, 2>>, LAMBDA a : a = 2) = <<2>>",
    ],
    [
      "an inner module that only a LET instantiates, which SANY rejects",
      "---- MODULE Inner ----\nK == 1\n====\nF == LET N == INSTANCE Inner IN N!K",
    ],
    [
      "a definition after a field named THEOREM, AXIOM or DOMAIN, which SANY rejects",
      "r == [a |-> 1]\nF == r.THEOREM\nG == [r EXCEPT !.AXIOM = 1]\nH == r.DOMAIN\nI == 1",
    ],
  ])("accepts %s", async (_title, source) => {
    expect((await checkNames(source)).status).toBe("success");
  });

  it("defines prefix, postfix, and <: operators", async () => {
    const result = await checkNames(
      "EXTENDS Naturals\nn ^+ == n + 1\n-. n == 10 - n\na <: b == a - b\nASSUME (2^+) = 3 /\\ -4 = 6 /\\ (5 <: 2) = 3",
    );
    expect(result.status).toBe("success");
  });

  it("applies operators in prefix form and reads keywords as field names", async () => {
    const result = await checkNames(
      'EXTENDS Naturals\nn ^+ == n + 1\nASSUME +(4, 6) = 10 /\\ ^+(2) = 3\nASSUME [[x \\in {"THEN"} |-> 1] EXCEPT !.THEN = 2].THEN = 2',
    );
    expect(result.status).toBe("success");
  });

  it("takes infix operators as parameters", async () => {
    const result = await checkNames(
      "EXTENDS Naturals\nFoo(a, _--_) == a -- 1\nASSUME Foo(7, +) = 8 /\\ Foo(7, *) = 7",
    );
    expect(result.status).toBe("success");
  });

  it("accepts recursive functions, named assumptions, and operator aliases", async () => {
    const result = await checkNames(
      "EXTENDS Naturals\nRECURSIVE fact\ntwice[n \\in Nat] == fact[n] * 2\nfact[n \\in Nat] == IF n = 0 THEN 1 ELSE n * fact[n - 1]\nASSUME Positive == twice[3] = 12\nASSUME Positive\na \\oplus b == a + b\nASSUME 1 (+) 2 = 3",
    );
    expect(result.status).toBe("success");
  });

  it("keeps a recursive function lazy, so it computes only the arguments a spec applies it to", async () => {
    const result = await checkNames(
      "EXTENDS Naturals\nsteps[n \\in 0..20] == IF n = 1 THEN 0 ELSE IF n % 2 = 0 THEN 1 + steps[n \\div 2] ELSE 1 + steps[3 * n + 1]\nASSUME steps[5] = 5",
    );
    expect(result.status).toBe("success");
  });

  it("rejects RandomSubsetSet, which TLC's Randomization module does not define", async () => {
    await expect(
      checkNames('EXTENDS Randomization\nASSUME RandomSubsetSet(2, "0.5", {1, 2}) = {}'),
    ).rejects.toThrow(TlaSyntaxError);
  });

  it.each([
    ["f == g", [["line 2, col 6 to line 2, col 6", "Unknown operator: `g'."]]],
    [
      "f == [i \\in {1} |-> i]\ng == <<@>> /\\ [f EXCEPT ![@] = LET h == @ IN [@ EXCEPT ![1] = @]]",
      [
        ["line 3, col 8 to line 3, col 8", "@ used where its meaning is not defined."],
        ["line 3, col 27 to line 3, col 27", "@ used where its meaning is not defined."],
      ],
    ],
    [
      "f[a \\in f] == 1\nG == LET h[b \\in h] == 1 IN h\nRECURSIVE k\nk[c \\in k] == 1",
      [
        ["line 2, col 9 to line 2, col 9", "Unknown operator: `f'."],
        ["line 3, col 18 to line 3, col 18", "Unknown operator: `h'."],
      ],
    ],
    [
      "RECURSIVE Map(_), f(_, _)\nMap(a, b) == 1\nf(a) == a",
      [
        [
          "line 3, col 1 to line 3, col 14",
          "Definition of Map has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 4, col 1 to line 4, col 9",
          "Definition of f has different arity than its RECURSIVE declaration.",
        ],
      ],
    ],
    [
      "G == LET RECURSIVE F(_), h(_), K\n         F == 1\n         h[a \\in {1}] == 1\n     IN <<F, h>>",
      [
        [
          "line 3, col 10 to line 3, col 15",
          "Definition of F has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 4, col 10 to line 4, col 26",
          "Function h has operator arguments in its RECURSIVE declaration.",
        ],
        [
          "line 2, col 26 to line 2, col 29",
          "Symbol h declared in RECURSIVE statement but not defined.",
        ],
        [
          "line 2, col 32 to line 2, col 32",
          "Symbol K declared in RECURSIVE statement but not defined.",
        ],
        ["line 5, col 11 to line 5, col 11", "The operator F requires 1 arguments."],
        ["line 5, col 14 to line 5, col 14", "The operator h requires 1 arguments."],
      ],
    ],
    [
      "EXTENDS Naturals\nRECURSIVE A, B(_), F\nG == F\nA(p) == A\nB == B(1)\nC == A + B(2)\nD == LET RECURSIVE E\n         E(q) == E\n     IN E + E(1)\nF(r) == 1",
      [
        [
          "line 5, col 1 to line 5, col 9",
          "Definition of A has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 5, col 9 to line 5, col 9",
          "Wrong number of arguments (0) given to operator 'A', \nwhich requires 1 arguments.",
        ],
        [
          "line 6, col 1 to line 6, col 9",
          "Definition of B has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 6, col 6 to line 6, col 9",
          "Wrong number of arguments (1) given to operator 'B', \nwhich requires 0 arguments.",
        ],
        [
          "line 7, col 6 to line 7, col 6",
          "Wrong number of arguments (0) given to operator 'A', \nwhich requires 1 arguments.",
        ],
        [
          "line 7, col 10 to line 7, col 13",
          "Wrong number of arguments (1) given to operator 'B', \nwhich requires 0 arguments.",
        ],
        [
          "line 9, col 10 to line 9, col 18",
          "Definition of E has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 9, col 18 to line 9, col 18",
          "Wrong number of arguments (0) given to operator 'E', \nwhich requires 1 arguments.",
        ],
        [
          "line 10, col 9 to line 10, col 9",
          "Wrong number of arguments (0) given to operator 'E', \nwhich requires 1 arguments.",
        ],
        ["line 10, col 14 to line 10, col 16", "The operator E requires 0 arguments."],
        [
          "line 11, col 1 to line 11, col 9",
          "Definition of F has different arity than its RECURSIVE declaration.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nRECURSIVE F(_), G\nA == F(1)!1 + G!1\nF(n) == IF n = 0 THEN 0 ELSE F(n - 1)!1\nG == LET RECURSIVE H(_)\n         H(k) == H(k)!1\n     IN G!1\nB == F(2)!1 + G!1",
      [
        [
          "line 4, col 6 to line 4, col 6",
          "Subexpression of  `F' used inside the operator's definition.",
        ],
        [
          "line 4, col 15 to line 4, col 15",
          "Subexpression of  `G' used inside the operator's definition.",
        ],
        [
          "line 5, col 30 to line 5, col 30",
          "Subexpression of  `F' used inside the operator's definition.",
        ],
        [
          "line 7, col 18 to line 7, col 18",
          "Subexpression of  `H' used inside the operator's definition.",
        ],
        [
          "line 8, col 9 to line 8, col 9",
          "Subexpression of  `G' used inside the operator's definition.",
        ],
      ],
    ],
    [
      "f == 1 + 1",
      [
        [
          "line 2, col 8 to line 2, col 8",
          "Could not find declaration or definition of symbol '+'.",
        ],
        ["line 2, col 6 to line 2, col 10", "Couldn't resolve infix operator symbol `+'."],
      ],
    ],
    [
      "f == -1",
      [
        [
          "line 2, col 6 to line 2, col 6",
          "Could not find declaration or definition of symbol '-.'.",
        ],
        ["line 2, col 6 to line 2, col 7", "Couldn't resolve prefix operator symbol `-.'."],
      ],
    ],
    [
      "f == 1 (+) 2 /\\ 1 \\circ 2 /\\ 1 (\\X) 2",
      [
        [
          "line 2, col 8 to line 2, col 10",
          "Could not find declaration or definition of symbol '(+)'.",
        ],
        ["line 2, col 6 to line 2, col 12", "Couldn't resolve infix operator symbol `(+)'."],
        [
          "line 2, col 19 to line 2, col 23",
          "Could not find declaration or definition of symbol '\\circ'.",
        ],
        ["line 2, col 17 to line 2, col 25", "Couldn't resolve infix operator symbol `\\circ'."],
        [
          "line 2, col 32 to line 2, col 35",
          "Could not find declaration or definition of symbol '(\\X)'.",
        ],
        ["line 2, col 30 to line 2, col 37", "Couldn't resolve infix operator symbol `(\\X)'."],
      ],
    ],
    [
      "g == 1^+",
      [
        [
          "line 2, col 7 to line 2, col 8",
          "Could not find declaration or definition of symbol '^+'.",
        ],
        ["line 2, col 6 to line 2, col 8", "Couldn't resolve postfix operator symbol `^+'."],
      ],
    ],
    ["Ab == 1\nf == Abc", [["line 3, col 6 to line 3, col 8", "Unknown operator: `Abc'."]]],
    [
      "f == y!1 /\\ c!1 /\\ T!1 /\\ A!1 /\\ g(1) /\\ U!1 /\\ h!1\nVARIABLE y\nCONSTANT c\nTHEOREM T == 1 = 1\nASSUME A == 1 = 1\nRECURSIVE g(_)\ng(n) == n\nTHEOREM U == ASSUME 1 = 1 PROVE 2 = 2\nh == {1}",
      [
        ["line 2, col 6 to line 2, col 6", "Unknown operator: `y'."],
        ["line 2, col 13 to line 2, col 13", "Unknown operator: `c'."],
        ["line 2, col 20 to line 2, col 20", "Unknown operator: `T'."],
        ["line 2, col 27 to line 2, col 27", "Unknown operator: `A'."],
        ["line 2, col 34 to line 2, col 34", "Unknown operator: `g'."],
        ["line 2, col 42 to line 2, col 42", "Unknown operator: `U'."],
        ["line 2, col 49 to line 2, col 49", "Unknown operator: `h'."],
      ],
    ],
    [
      "RECURSIVE g(_)\nf == g!1\ng(n) == {n}\n---- MODULE Inner ----\nCONSTANT k\n====\nI == INSTANCE Inner WITH k <- d\nCONSTANT d\nTHEOREM T == ASSUME 1 = 1 PROVE 2 = 2\nPROOF BY T!1",
      [
        ["line 3, col 6 to line 3, col 8", "The operator g requires 1 arguments."],
        ["line 8, col 31 to line 8, col 31", "Unknown operator: `d'."],
      ],
    ],
    [
      "EXTENDS Naturals\nf == -1",
      [
        [
          "line 3, col 6 to line 3, col 6",
          "Could not find declaration or definition of symbol '-.'.",
        ],
        ["line 3, col 6 to line 3, col 7", "Couldn't resolve prefix operator symbol `-.'."],
      ],
    ],
    [
      "EXTENDS Naturals\ng == 1^+",
      [
        [
          "line 3, col 7 to line 3, col 8",
          "Could not find declaration or definition of symbol '^+'.",
        ],
        ["line 3, col 6 to line 3, col 8", "Couldn't resolve postfix operator symbol `^+'."],
      ],
    ],
    [
      "Foo(a) == a\ng == Foo(1,  2)",
      [["line 3, col 9 to line 3, col 15", "The operator Foo requires 1 arguments."]],
    ],
    [
      "THEOREM T == TRUE\nHIDE T, TRUE, {}",
      ["line 3, col 9 to line 3, col 12", "line 3, col 15 to line 3, col 16"].map((location) => [
        location,
        "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
      ]),
    ],
    [
      "Foo(a) == a\ng == Foo",
      [["line 3, col 6 to line 3, col 8", "The operator Foo requires 1 arguments."]],
    ],
    [
      "f == A /\\ B /\\ C(1)\ng == D",
      [
        ["line 2, col 6 to line 2, col 6", "Unknown operator: `A'."],
        ["line 2, col 11 to line 2, col 11", "Unknown operator: `B'."],
        ["line 2, col 16 to line 2, col 16", "Unknown operator: `C'."],
        ["line 3, col 6 to line 3, col 6", "Unknown operator: `D'."],
      ],
    ],
    [
      "Op(a, b) == a\nf == Op(F) /\\ Op(G, H, I) /\\ Op /\\ J",
      [
        ["line 3, col 8 to line 3, col 10", "The operator Op requires 2 arguments."],
        ["line 3, col 17 to line 3, col 25", "The operator Op requires 2 arguments."],
        ["line 3, col 30 to line 3, col 31", "The operator Op requires 2 arguments."],
        ["line 3, col 36 to line 3, col 36", "Unknown operator: `J'."],
      ],
    ],
    [
      "f == (A + B) /\\ C\ng == -D /\\ E",
      [
        [
          "line 2, col 9 to line 2, col 9",
          "Could not find declaration or definition of symbol '+'.",
        ],
        ["line 2, col 7 to line 2, col 11", "Couldn't resolve infix operator symbol `+'."],
        ["line 2, col 17 to line 2, col 17", "Unknown operator: `C'."],
        [
          "line 3, col 6 to line 3, col 6",
          "Could not find declaration or definition of symbol '-.'.",
        ],
        ["line 3, col 6 to line 3, col 7", "Couldn't resolve prefix operator symbol `-.'."],
        ["line 3, col 12 to line 3, col 12", "Unknown operator: `E'."],
      ],
    ],
    [
      "f == [a |-> Q, a |-> R, b |-> S, b |-> T] /\\ [c : U, c : V]",
      [
        ["line 2, col 13 to line 2, col 13", "Unknown operator: `Q'."],
        ["line 2, col 16 to line 2, col 16", "Non-unique fields in constructor."],
        ["line 2, col 22 to line 2, col 22", "Unknown operator: `R'."],
        ["line 2, col 31 to line 2, col 31", "Unknown operator: `S'."],
        ["line 2, col 34 to line 2, col 34", "Non-unique fields in constructor."],
        ["line 2, col 40 to line 2, col 40", "Unknown operator: `T'."],
        ["line 2, col 51 to line 2, col 51", "Unknown operator: `U'."],
        ["line 2, col 54 to line 2, col 54", "Non-unique fields in constructor."],
        ["line 2, col 58 to line 2, col 58", "Unknown operator: `V'."],
      ],
    ],
    [
      "F(a) == a\nG(a) == a\nf == F(G) /\\ LET L(y) == y IN F(L) /\\ A",
      [
        ["line 4, col 8 to line 4, col 8", "The operator G requires 1 arguments."],
        ["line 4, col 33 to line 4, col 33", "The operator L requires 1 arguments."],
        ["line 4, col 39 to line 4, col 39", "Unknown operator: `A'."],
      ],
    ],
    [
      "f == LET L == K IN L /\\ M\ng == \\A y \\in N : \\E z \\in O : P(y, z)",
      [
        ["line 2, col 15 to line 2, col 15", "Unknown operator: `K'."],
        ["line 2, col 25 to line 2, col 25", "Unknown operator: `M'."],
        ["line 3, col 15 to line 3, col 15", "Unknown operator: `N'."],
        ["line 3, col 28 to line 3, col 28", "Unknown operator: `O'."],
        ["line 3, col 32 to line 3, col 32", "Unknown operator: `P'."],
      ],
    ],
    [
      "THEOREM ASSUME NEW a \\in A, B PROVE C(a)\n<1>1. D\n<1> DEFINE G == H\n<1>2. QED\nASSUME S",
      [
        ["line 2, col 26 to line 2, col 26", "Unknown operator: `A'."],
        ["line 2, col 29 to line 2, col 29", "Unknown operator: `B'."],
        ["line 2, col 37 to line 2, col 37", "Unknown operator: `C'."],
        ["line 3, col 7 to line 3, col 7", "Unknown operator: `D'."],
        ["line 4, col 17 to line 4, col 17", "Unknown operator: `H'."],
        ["line 6, col 8 to line 6, col 8", "Unknown operator: `S'."],
      ],
    ],
    [
      "---- MODULE Inner ----\nCONSTANT a, b\n====\nI == INSTANCE Inner WITH b <- B, a <- [f |-> A, f |-> 1]",
      [
        ["line 5, col 31 to line 5, col 31", "Unknown operator: `B'."],
        ["line 5, col 46 to line 5, col 46", "Unknown operator: `A'."],
        ["line 5, col 49 to line 5, col 49", "Non-unique fields in constructor."],
      ],
    ],
    [
      "High(Op(_)) == Op(1)\nF(a) == a\nG(a, b) == a\nf == High(A) /\\ High(G) /\\ F(LAMBDA y : y) /\\ High(1) /\\ High(High)",
      [
        ["line 5, col 11 to line 5, col 11", "Unknown operator: `A'."],
        [
          "line 5, col 6 to line 5, col 12",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
        ["line 5, col 22 to line 5, col 22", "Expected arity 1 but found operator of arity 2."],
        [
          "line 5, col 17 to line 5, col 23",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
        [
          "line 5, col 30 to line 5, col 41",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 5, col 52 to line 5, col 52",
          "An expression appears as argument number 1 (counting from 1) to operator 'High', in a position an operator is required.",
        ],
        [
          "line 5, col 47 to line 5, col 53",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
        [
          "line 5, col 58 to line 5, col 67",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals, Sequences\nTwo(a, b) == a\nf == LET G(y) == y IN G(1) + G\nP(Op(_)) == Op(Op) /\\ Op + 1\ng == SelectSeq(<<>>, Two) /\\ SelectSeq(<<>>, LAMBDA a, b : a)",
      [
        ["line 4, col 30 to line 4, col 30", "The operator G requires 1 arguments."],
        ["line 5, col 16 to line 5, col 17", "The operator Op requires 1 arguments."],
        ["line 5, col 23 to line 5, col 24", "The operator Op requires 1 arguments."],
        ["line 6, col 22 to line 6, col 24", "Expected arity 1 but found operator of arity 2."],
        [
          "line 6, col 6 to line 6, col 25",
          "Argument number 2 to operator 'SelectSeq' \nshould be a 1-parameter operator.",
        ],
        [
          "line 6, col 30 to line 6, col 38",
          "Lambda expression with arity 2 used as argument 2 of operator `SelectSeq', \nbut an operator of arity 1 is required.",
        ],
        [
          "line 6, col 30 to line 6, col 61",
          "Argument number 2 to operator 'SelectSeq' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "---- MODULE Inner ----\nH(Op(_)) == Op(1)\nOne(a) == a\n====\nI == INSTANCE Inner\nINSTANCE Inner\nf == I!H(I!One) /\\ I!One(I!One) /\\ I!H(LAMBDA a, b : a) /\\ H(I!H) /\\ One(One)",
      [
        ["line 8, col 26 to line 8, col 30", "The operator I!One requires 1 arguments."],
        [
          "line 8, col 38 to line 8, col 38",
          "Lambda expression with arity 2 used as argument 1 of operator `I!H', \nbut an operator of arity 1 is required.",
        ],
        [
          "line 8, col 36 to line 8, col 55",
          "Argument number 1 to operator 'I!H' \nshould be a 1-parameter operator.",
        ],
        [
          "line 8, col 60 to line 8, col 65",
          "Argument number 1 to operator 'H' \nshould be a 1-parameter operator.",
        ],
        ["line 8, col 74 to line 8, col 76", "The operator One requires 1 arguments."],
      ],
    ],
    [
      "EXTENDS Naturals\nOne(a) == a\nf == One(\\cup) /\\ One(-.) /\\ One(SUBSET) /\\ One(1) + One",
      [
        ["line 4, col 10 to line 4, col 13", "The operator \\union requires 2 arguments."],
        [
          "line 4, col 23 to line 4, col 24",
          "Could not find declaration or definition of symbol '-.'.",
        ],
        ["line 4, col 34 to line 4, col 39", "The operator SUBSET requires 1 arguments."],
        ["line 4, col 54 to line 4, col 56", "The operator One requires 1 arguments."],
      ],
    ],
    [
      "One(a) == a\nf == One(UNCHANGED) /\\ One(') /\\ One(^+)",
      [
        ["line 3, col 10 to line 3, col 18", "The operator UNCHANGED requires 1 arguments."],
        ["line 3, col 28 to line 3, col 28", "The operator ' requires 1 arguments."],
        [
          "line 3, col 38 to line 3, col 39",
          "Could not find declaration or definition of symbol '^+'.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nf == {'} /\\ <<', 1>> /\\ 1 + ' = 2 /\\ '(1, 2) /\\ ''",
      [
        ["line 3, col 7 to line 3, col 7", "The operator ' requires 1 arguments."],
        ["line 3, col 15 to line 3, col 15", "The operator ' requires 1 arguments."],
        ["line 3, col 29 to line 3, col 29", "The operator ' requires 1 arguments."],
        ["line 3, col 39 to line 3, col 44", "The operator ' requires 1 arguments."],
        ["line 3, col 49 to line 3, col 49", "The operator ' requires 1 arguments."],
      ],
    ],
    [
      "a ' == a",
      [
        ["line 2, col 1 to line 2, col 8", "Operator ' already defined or declared."],
        [
          "line 2, col 1 to line 2, col 8",
          "Symbol ' is a built-in operator, and cannot be redefined.",
        ],
      ],
    ],
    [
      "f == =(1, 2, 3)",
      [["line 2, col 7 to line 2, col 15", "The operator = requires 2 arguments."]],
    ],
    [
      "f == {^+} /\\ {-.} /\\ ^#(1) /\\ \\oplus(1, 2) /\\ {(+)} /\\ {=<} /\\ {\\circ} /\\ -.(1)",
      [
        ["line 2, col 7 to line 2, col 8", "Unknown operator: `^+'."],
        ["line 2, col 15 to line 2, col 16", "Unknown operator: `-.'."],
        ["line 2, col 22 to line 2, col 23", "Unknown operator: `^#'."],
        ["line 2, col 31 to line 2, col 36", "Unknown operator: `\\oplus'."],
        ["line 2, col 48 to line 2, col 50", "Unknown operator: `\\oplus'."],
        ["line 2, col 57 to line 2, col 58", "Unknown operator: `\\leq'."],
        ["line 2, col 65 to line 2, col 69", "Unknown operator: `\\o'."],
        ["line 2, col 75 to line 2, col 76", "Unknown operator: `-.'."],
      ],
    ],
    [
      "f == {\\cup} /\\ {\\cap} /\\ {#} /\\ {<=>} /\\ {\\land} /\\ {\\X} /\\ \\X(1) /\\ \\intersect(1)",
      [
        ["line 2, col 7 to line 2, col 10", "The operator \\union requires 2 arguments."],
        ["line 2, col 17 to line 2, col 20", "The operator \\intersect requires 2 arguments."],
        ["line 2, col 27 to line 2, col 27", "The operator /= requires 2 arguments."],
        ["line 2, col 34 to line 2, col 36", "The operator \\equiv requires 2 arguments."],
        ["line 2, col 43 to line 2, col 47", "The operator \\land requires 2 arguments."],
        ["line 2, col 54 to line 2, col 55", "The operator \\times requires 2 arguments."],
        ["line 2, col 63 to line 2, col 65", "The operator \\times requires 2 arguments."],
        ["line 2, col 80 to line 2, col 82", "The operator \\intersect requires 2 arguments."],
      ],
    ],
    [
      "a \\X b == 1\nf == LET a \\cap b == 1 IN 2",
      [
        ["line 2, col 1 to line 2, col 11", "Operator \\times already defined or declared."],
        [
          "line 2, col 1 to line 2, col 11",
          "Symbol \\times is a built-in operator, and cannot be redefined.",
        ],
        ["line 3, col 10 to line 3, col 22", "Operator \\intersect already defined or declared."],
        [
          "line 3, col 10 to line 3, col 22",
          "Symbol \\intersect is a built-in operator, and cannot be redefined.",
        ],
      ],
    ],
    [
      "f == '!x /\\ ^#!x /\\ \\cup!x /\\ -.!x /\\ ^+!x /\\ ^#(1)!x /\\ \\union!1 /\\ '(1)!1 /\\ \\X!1",
      [
        ["line 2, col 6 to line 2, col 6", "Cannot take subexpression of `''."],
        ["line 2, col 13 to line 2, col 16", "Unknown operator: `^#!x'."],
        ["line 2, col 21 to line 2, col 24", "Cannot take subexpression of `\\union'."],
        ["line 2, col 31 to line 2, col 34", "Unknown operator: `-.!x'."],
        ["line 2, col 39 to line 2, col 42", "Unknown operator: `^+!x'."],
        ["line 2, col 47 to line 2, col 53", "Unknown operator: `^#!x'."],
        ["line 2, col 58 to line 2, col 63", "Cannot take subexpression of `\\union'."],
        ["line 2, col 70 to line 2, col 70", "Cannot take subexpression of `''."],
        ["line 2, col 80 to line 2, col 81", "Cannot take subexpression of `\\times'."],
      ],
    ],
    [
      "a ^# == a = 1\nf == ^#!x /\\ ^#(2)!1 /\\ ^#!1",
      [
        ["line 3, col 6 to line 3, col 9", "The operator ^# requires 1 arguments."],
        ["line 3, col 25 to line 3, col 28", "The operator ^# requires 1 arguments."],
      ],
    ],
    [
      "CONSTANT c\nOp(p) == p!1 /\\ c!x /\\ TRUE!1 /\\ zz!1 /\\ (\\A z \\in {1} : z!x)",
      [
        ["line 3, col 10 to line 3, col 10", "Cannot take subexpression of `p'."],
        ["line 3, col 17 to line 3, col 17", "Cannot take subexpression of `c'."],
        ["line 3, col 24 to line 3, col 27", "Cannot take subexpression of `TRUE'."],
        ["line 3, col 34 to line 3, col 35", "Unknown operator: `zz'."],
        ["line 3, col 58 to line 3, col 58", "Cannot take subexpression of `z'."],
      ],
    ],
    [
      "CONSTANT _ <= _\na =< b == 1",
      [
        ["line 3, col 1 to line 3, col 11", "Operator \\leq already defined or declared."],
        [
          "line 3, col 1 to line 3, col 11",
          "Multiply-defined symbol '\\leq': this definition or declaration conflicts \nwith the one at line 2, col 10 to line 2, col 15 of module M.",
        ],
      ],
    ],
    [
      "---- MODULE Inner ----\nCONSTANT a\nB == a\nC(p) == a\nTHEOREM T == TRUE\n====\nK(q) == INSTANCE Inner WITH a <- q\nF == K!B = U1 /\\ K(1)!C = U2 /\\ K(1, 2)!B = U3 /\\ K!C(1, 2) = U4\nG == LET L(q) == INSTANCE Inner WITH a <- q IN L!B = U5 /\\ L(1)!C(2, 3) = U6\nUSE K!T, K(1)!T, U7",
      [
        ["line 9, col 6 to line 9, col 8", "The operator K requires 1 arguments."],
        ["line 9, col 12 to line 9, col 13", "Unknown operator: `U1'."],
        ["line 9, col 18 to line 9, col 23", "The operator K!C requires 1 arguments."],
        ["line 9, col 27 to line 9, col 28", "Unknown operator: `U2'."],
        ["line 9, col 34 to line 9, col 39", "The operator K requires 1 arguments."],
        ["line 9, col 45 to line 9, col 46", "Unknown operator: `U3'."],
        ["line 9, col 51 to line 9, col 59", "The operator K requires 1 arguments."],
        ["line 9, col 63 to line 9, col 64", "Unknown operator: `U4'."],
        ["line 10, col 48 to line 10, col 50", "The operator L requires 1 arguments."],
        ["line 10, col 54 to line 10, col 55", "Unknown operator: `U5'."],
        ["line 10, col 66 to line 10, col 71", "The operator L!C requires 1 arguments."],
        ["line 10, col 75 to line 10, col 76", "Unknown operator: `U6'."],
        ["line 11, col 5 to line 11, col 7", "The operator K requires 1 arguments."],
        ["line 11, col 18 to line 11, col 19", "Unknown operator: `U7'."],
      ],
    ],
    [
      "THEOREM TRUE\n<1>1. CASE TRUE\n  <2>1. TRUE BY <1>1, <1>2\n  <2>2. QED BY <2>1\n<1>2. TRUE BY <2>1, <1>3\n<1>3. QED BY <1>1, <1>2, <1>3, <1>9",
      [
        ["line 4, col 23 to line 4, col 26", "Unknown operator: `<1>2'."],
        ["line 6, col 15 to line 6, col 18", "Unknown operator: `<2>1'."],
        ["line 6, col 21 to line 6, col 24", "Unknown operator: `<1>3'."],
        ["line 7, col 32 to line 7, col 35", "Unknown operator: `<1>9'."],
      ],
    ],
    [
      "EXTENDS Naturals\na ⊕ b == a + b\nA == ⟨1, 2⟩ ∘ U1\nB == ∀ y ∈ ℕ : y ≥ 0 ⇒ y ⁺\nC == ⊕ ∪ {1 ‥ 2, 1 ⊕ 2}\nM == INSTANCE Naturals\nD == M ! ⊕(1, 2)",
      [
        [
          "line 4, col 13 to line 4, col 13",
          "Could not find declaration or definition of symbol '∘'.",
        ],
        ["line 4, col 6 to line 4, col 16", "Couldn't resolve infix operator symbol `∘'."],
        ["line 5, col 12 to line 5, col 12", "Unknown operator: `ℕ'."],
        [
          "line 5, col 26 to line 5, col 26",
          "Could not find declaration or definition of symbol '⁺'.",
        ],
        ["line 5, col 24 to line 5, col 26", "Couldn't resolve postfix operator symbol `⁺'."],
        ["line 6, col 6 to line 6, col 6", "The operator \\oplus requires 2 arguments."],
        ["line 8, col 6 to line 8, col 10", "Unknown operator: `M!\\oplus'."],
      ],
    ],
    [
      "K(a) == LET C(b) == a IN C(1)\nHigh(Op(_)) == Op(1)\nM(a) == INSTANCE Naturals\nA == High(K(1)!C) /\\ U1\nB == High(M(1)!+)",
      [
        ["line 5, col 11 to line 5, col 11", "Selector `K' should not have argument(s)."],
        [
          "line 5, col 6 to line 5, col 17",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
        ["line 5, col 22 to line 5, col 23", "Unknown operator: `U1'."],
        ["line 6, col 11 to line 6, col 11", "Selector `M' should not have argument(s)."],
        [
          "line 6, col 6 to line 6, col 17",
          "Argument number 1 to operator 'High' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "THEOREM TRUE\n<1>1. USE TRUE\n<1>2. DEFINE G == 1\n<1>3. TRUE BY <1>1, <1>2, U1\n<1>4. <1>1\n  OBVIOUS\n<1>5. HIDE <1>4\n<1> QED BY <1>5",
      [
        ["line 5, col 15 to line 5, col 18", "Step number of non-fact used as a fact"],
        ["line 5, col 21 to line 5, col 24", "Step number of non-fact used as a fact"],
        ["line 5, col 27 to line 5, col 28", "Unknown operator: `U1'."],
        [
          "line 6, col 7 to line 6, col 10",
          "Step number of non-expression step used as an expression.",
        ],
        ["line 9, col 12 to line 9, col 15", "Step number of non-fact used as a fact"],
      ],
    ],
    [
      'EXTENDS _Possible\nOp(a) == a\nf == _CheckName(Op) /\\ _Track(LAMBDA a : a, "n") /\\ _Track(1)',
      [
        ["line 4, col 17 to line 4, col 18", "The operator Op requires 1 arguments."],
        [
          "line 4, col 31 to line 4, col 42",
          "LAMBDA expression used where an expression is required.",
        ],
        ["line 4, col 59 to line 4, col 61", "The operator _Track requires 2 arguments."],
      ],
    ],
    [
      "M == INSTANCE Naturals\nf == M!+!1 /\\ M!+(1)!1 /\\ M!zz!1",
      [
        ["line 3, col 6 to line 3, col 10", "The operator M!+ requires 2 arguments."],
        ["line 3, col 18 to line 3, col 20", "The operator M!+ requires 2 arguments."],
        ["line 3, col 27 to line 3, col 30", "Unknown operator: `M!zz'."],
      ],
    ],
    [
      "Op(a) == a + zz\nS(a) == {zz + 1}\nL == 1\nT == <<1, 2>>\nf == Op(2)!1 /\\ S(2)!1 /\\ Op(2)!: /\\ Op(2)!<< /\\ L!1 /\\ T!3",
      [
        [
          "line 2, col 12 to line 2, col 12",
          "Could not find declaration or definition of symbol '+'.",
        ],
        ["line 2, col 10 to line 2, col 15", "Couldn't resolve infix operator symbol `+'."],
        [
          "line 3, col 13 to line 3, col 13",
          "Could not find declaration or definition of symbol '+'.",
        ],
        ["line 3, col 10 to line 3, col 15", "Couldn't resolve infix operator symbol `+'."],
        [
          "line 6, col 12 to line 6, col 12",
          "Subexpression selection failed, probably due to an error in the selected expression.",
        ],
        [
          "line 6, col 22 to line 6, col 22",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
        [
          "line 6, col 33 to line 6, col 33",
          "An unexpected null node specified by ':'.\nThis is probably due to a previous error.",
        ],
        [
          "line 6, col 44 to line 6, col 45",
          "Subexpression selection failed, probably due to an error in the selected expression.",
        ],
        [
          "line 6, col 52 to line 6, col 52",
          "Selecting subexpression of expression that has none.",
        ],
        [
          "line 6, col 59 to line 6, col 59",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
      ],
    ],
  ])("reports %j at the range SANY reports", async (source, errors) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError(
        errors.map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("checks the arguments of an operator a LET instantiates against its parameters like SANY", async () => {
    await expect(
      check({
        source: [
          "---- MODULE M ----",
          "Inc(a) == a",
          "f == LET I == INSTANCE Inner IN I!Op(3) /\\ I!Two(LAMBDA a : a, Inc)",
          "g == LET S == INSTANCE Sequences IN S!SelectSeq(<<>>, 3)",
          "h == LET I == INSTANCE Inner S == INSTANCE Sequences IN I!Op(LAMBDA a : a) = S!SelectSeq(<<1>>, LAMBDA a : a = 1)",
          "VARIABLE x",
          "Init == x = 0",
          "Next == x' = x",
          "====",
        ].join("\n"),
        config: "INIT Init\nNEXT Next",
        loadModule: (name) =>
          name === "Inner"
            ? "---- MODULE Inner ----\nOp(F(_)) == F(1)\nTwo(a, b) == a\n===="
            : undefined,
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 3, col 38 to line 3, col 38",
            "An expression appears as argument number 1 (counting from 1) to operator 'I!Op', in a position an operator is required.",
          ],
          [
            "line 3, col 33 to line 3, col 39",
            "Argument number 1 to operator 'I!Op' \nshould be a 1-parameter operator.",
          ],
          [
            "line 3, col 50 to line 3, col 61",
            "LAMBDA expression used where an expression is required.",
          ],
          ["line 3, col 64 to line 3, col 66", "The operator Inc requires 1 arguments."],
          [
            "line 4, col 55 to line 4, col 55",
            "An expression appears as argument number 2 (counting from 1) to operator 'S!SelectSeq', in a position an operator is required.",
          ],
          [
            "line 4, col 37 to line 4, col 56",
            "Argument number 2 to operator 'S!SelectSeq' \nshould be a 1-parameter operator.",
          ],
        ].map(([location, message]) => ({ location: `${location} of module M`, message })),
      ),
    );
  });

  it("passes an operator argument through an operator a LET instantiates", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nASSUME LET I == INSTANCE Inner IN I!Op(LAMBDA a : a + 1) = 2\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner" ? "---- MODULE Inner ----\nOp(F(_)) == F(1)\n====" : undefined,
    });
    expect(result.status).toBe("success");
  });

  it.each([
    [
      "a definition defined twice",
      "B == 1\nB == 2",
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message: "Operator B already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message:
            "Multiple declarations or definitions for symbol B.  \nThis duplicates the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
    ],
    [
      "a definition of a declared constant",
      "CONSTANT B\nB == 1",
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message: "Operator B already defined or declared.",
        },
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 10 to line 2, col 10 of module M.",
        },
      ],
      [],
    ],
    [
      "a constant declared after a definition",
      "B == 1\nCONSTANT B",
      [
        {
          location: "line 3, col 10 to line 3, col 10 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a constant and a variable with one name",
      "CONSTANT y\nVARIABLE y",
      [
        {
          location: "line 3, col 10 to line 3, col 10 of module M",
          message:
            "Multiply-defined symbol 'y': this definition or declaration conflicts \nwith the one at line 2, col 10 to line 2, col 10 of module M.",
        },
      ],
      [],
    ],
    [
      "an operator parameter named after a definition",
      "B == 1\nF(B) == B",
      [
        {
          location: "line 3, col 3 to line 3, col 3 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a LET definition named after a definition",
      "B == 1\nF == LET B == 2 IN B",
      [
        {
          location: "line 3, col 10 to line 3, col 15 of module M",
          message: "Operator B already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 10 to line 3, col 15 of module M",
          message:
            "Multiple declarations or definitions for symbol B.  \nThis duplicates the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
    ],
    [
      "a bound variable named after a variable",
      "VARIABLE y\nF == \\E y \\in {1} : TRUE",
      [
        {
          location: "line 3, col 9 to line 3, col 9 of module M",
          message:
            "Multiply-defined symbol 'y': this definition or declaration conflicts \nwith the one at line 2, col 10 to line 2, col 10 of module M.",
        },
      ],
      [],
    ],
    [
      "nested bound variables with one name",
      "F == \\E y \\in {1} : \\E y \\in {2} : TRUE",
      [
        {
          location: "line 2, col 24 to line 2, col 24 of module M",
          message:
            "Multiply-defined symbol 'y': this definition or declaration conflicts \nwith the one at line 2, col 9 to line 2, col 9 of module M.",
        },
      ],
      [],
    ],
    [
      "an operator of an extended module",
      "EXTENDS Naturals\na + b == a",
      [
        {
          location: "line 3, col 1 to line 3, col 10 of module M",
          message: "Operator + already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 10 of module M",
          message:
            "Multiple declarations or definitions for symbol +.  \nThis duplicates the one at line 15, col 1 to line 15, col 19 of module Naturals.",
        },
      ],
    ],
    [
      "a built-in operator",
      "BOOLEAN == 1",
      [
        {
          location: "line 2, col 1 to line 2, col 12 of module M",
          message: "Operator BOOLEAN already defined or declared.",
        },
        {
          location: "line 2, col 1 to line 2, col 12 of module M",
          message: "Symbol BOOLEAN is a built-in operator, and cannot be redefined.",
        },
      ],
      [],
    ],
    [
      "a constant named after a built-in operator",
      "CONSTANT BOOLEAN",
      [
        {
          location: "line 2, col 10 to line 2, col 16 of module M",
          message: "Symbol BOOLEAN is a built-in operator, and cannot be redefined.",
        },
      ],
      [],
    ],
    [
      "a variable named after a built-in operator",
      "VARIABLE TRUE",
      [
        {
          location: "line 2, col 10 to line 2, col 13 of module M",
          message: "Symbol TRUE is a built-in operator, and cannot be redefined.",
        },
      ],
      [],
    ],
    [
      "a constant named after an operator of an extended module",
      "EXTENDS Naturals\nCONSTANT Nat",
      [
        {
          location: "line 3, col 10 to line 3, col 12 of module M",
          message:
            "Multiply-defined symbol 'Nat': this definition or declaration conflicts \nwith the one at line 14, col 1 to line 14, col 16 of module Naturals.",
        },
      ],
      [],
    ],
    [
      "a nested module constant named after an enclosing variable",
      "VARIABLE y\n---- MODULE Inner ----\nCONSTANT y\n====",
      [
        {
          location: "line 4, col 10 to line 4, col 10 of module M",
          message:
            "Multiply-defined symbol 'y': this definition or declaration conflicts \nwith the one at line 2, col 10 to line 2, col 10 of module M.",
        },
      ],
      [],
    ],
    [
      "a definition after an instance that imports it",
      "INSTANCE Naturals\nNat == 1",
      [
        {
          location: "line 3, col 1 to line 3, col 8 of module M",
          message: "Operator Nat already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 8 of module M",
          message:
            "Multiple declarations or definitions for symbol Nat.  \nThis duplicates the one at line 14, col 1 to line 14, col 16 of module Naturals.",
        },
      ],
    ],
    [
      "a named instance and a definition with one name",
      "I == 1\nI == INSTANCE Naturals",
      [
        {
          location: "line 3, col 1 to line 3, col 22 of module M",
          message:
            "Multiply-defined symbol 'I': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "duplicate operator parameters",
      "F(a, a) == a",
      [
        {
          location: "line 2, col 6 to line 2, col 6 of module M",
          message:
            "Multiply-defined symbol 'a': this definition or declaration conflicts \nwith the one at line 2, col 3 to line 2, col 3 of module M.",
        },
      ],
      [],
    ],
    [
      "a LAMBDA parameter named after a definition",
      "B == 1\nG(Op(_)) == Op(1)\nF == G(LAMBDA B : B)",
      [
        {
          location: "line 4, col 15 to line 4, col 15 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a function bound named after a definition",
      "y == 1\nf[y \\in {1}] == y",
      [
        {
          location: "line 3, col 3 to line 3, col 3 of module M",
          message:
            "Multiply-defined symbol 'y': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "duplicate names in a tuple pattern",
      "F == \\E <<a, a>> \\in {<<1, 2>>} : TRUE",
      [
        {
          location: "line 2, col 14 to line 2, col 14 of module M",
          message:
            "Multiply-defined symbol 'a': this definition or declaration conflicts \nwith the one at line 2, col 11 to line 2, col 11 of module M.",
        },
      ],
      [],
    ],
    [
      "a LET definition named after an enclosing one",
      "F == LET A == 1 IN LET A == 2 IN A",
      [
        {
          location: "line 2, col 24 to line 2, col 29 of module M",
          message: "Operator A already defined or declared.",
        },
      ],
      [
        {
          location: "line 2, col 24 to line 2, col 29 of module M",
          message:
            "Multiple declarations or definitions for symbol A.  \nThis duplicates the one at line 2, col 10 to line 2, col 15 of module M.",
        },
      ],
    ],
    [
      "a LOCAL definition of an extended operator",
      "EXTENDS FiniteSets\nLOCAL Cardinality(S) == 0",
      [
        {
          location: "line 3, col 1 to line 3, col 25 of module M",
          message: "Operator Cardinality already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 25 of module M",
          message:
            "Multiple declarations or definitions for symbol Cardinality.  \nThis duplicates the one at line 21, col 1 to line 27, col 11 of module FiniteSets.",
        },
      ],
    ],
    [
      "a nested module definition named after an outer one",
      "B == 1\n---- MODULE Inner ----\nB == 2\n====\nI == INSTANCE Inner",
      [
        {
          location: "line 4, col 1 to line 4, col 6 of module M",
          message: "Operator B already defined or declared.",
        },
      ],
      [
        {
          location: "line 4, col 1 to line 4, col 6 of module M",
          message:
            "Multiple declarations or definitions for symbol B.  \nThis duplicates the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
    ],
    [
      "a definition of another arity",
      "B == 1\nB(a) == a",
      [
        {
          location: "line 3, col 1 to line 3, col 9 of module M",
          message: "Operator B already defined or declared.",
        },
        {
          location: "line 3, col 1 to line 3, col 9 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a function defined twice",
      "f[n \\in {1}] == n\nf[n \\in {1}] == n",
      [
        {
          location: "line 3, col 1 to line 3, col 17 of module M",
          message: "Function name `f' already defined or declared.",
        },
      ],
      [],
    ],
    [
      "an operator named after a function",
      "f[n \\in {1}] == n\nf == 1",
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message: "Operator f already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message:
            "Multiple declarations or definitions for symbol f.  \nThis duplicates the one at line 2, col 1 to line 2, col 17 of module M.",
        },
      ],
    ],
    [
      "a parameter named after a built-in operator",
      "F(TRUE) == 1",
      [
        {
          location: "line 2, col 3 to line 2, col 6 of module M",
          message: "Symbol TRUE is a built-in operator, and cannot be redefined.",
        },
      ],
      [],
    ],
    [
      "a recursive operator defined twice",
      "RECURSIVE F(_)\nF(n) == n\nF(n) == n\nG == 1",
      [
        {
          location: "line 4, col 1 to line 4, col 9 of module M",
          message: "Operator F already defined or declared.",
        },
      ],
      [
        {
          location: "line 4, col 1 to line 4, col 9 of module M",
          message:
            "Multiple declarations or definitions for symbol F.  \nThis duplicates the one at line 3, col 1 to line 3, col 9 of module M.",
        },
      ],
    ],
    [
      "a theorem named after a definition",
      "B == 1\nTHEOREM B == TRUE",
      [
        {
          location: "line 3, col 1 to line 3, col 17 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a definition named after a theorem",
      "THEOREM B == TRUE\nB == 1",
      [
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message: "Operator B already defined or declared.",
        },
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 17 of module M.",
        },
      ],
      [],
    ],
    [
      "a NEW symbol named after a definition",
      "B == 1\nTHEOREM ASSUME NEW B PROVE TRUE",
      [
        {
          location: "line 3, col 20 to line 3, col 20 of module M",
          message:
            "Multiply-defined symbol 'B': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 6 of module M.",
        },
      ],
      [],
    ],
    [
      "a module defined twice",
      "---- MODULE Inner ----\n====\n---- MODULE Inner ----\n====",
      [
        {
          location: "line 4, col 1 to line 5, col 4 of module M",
          message:
            "Multiply-defined module 'Inner': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 3, col 4 of module M.",
        },
      ],
      [],
    ],
    [
      "duplicate instance parameters",
      "---- MODULE Inner ----\nCONSTANT c\n====\nI(c, c) == INSTANCE Inner",
      [
        {
          location: "line 5, col 6 to line 5, col 6 of module M",
          message:
            "Multiply-defined symbol 'c': this definition or declaration conflicts \nwith the one at line 5, col 3 to line 5, col 3 of module M.",
        },
      ],
      [],
    ],
    [
      "a definition and a declaration of two extended modules",
      "---- MODULE A ----\nFoo == 1\nBaz == 1\n====\n---- MODULE B ----\nFoo(a) == 2\nCONSTANT Baz\n====\n---- MODULE C ----\nEXTENDS A, B\n====",
      [
        {
          location: "line 8, col 10 to line 8, col 12 of module M",
          message:
            "The declaration of 'Baz' conflicts with \nits definition at line 4, col 1 to line 4, col 8 of module M.",
        },
      ],
      [
        {
          location: "line 7, col 1 to line 7, col 11 of module M",
          message:
            "Warning: the definition of 'Foo' conflicts with \nits definition at line 3, col 1 to line 3, col 8 of module M.",
        },
      ],
    ],
    [
      "errors in instance substitutions between definitions",
      "---- MODULE Inner ----\nCONSTANT a, b\n====\nFoo == U\nI == INSTANCE Inner WITH a <- A, b <- B\nBar == V",
      [
        {
          location: "line 5, col 8 to line 5, col 8 of module M",
          message: "Unknown operator: `U'.",
        },
        {
          location: "line 6, col 31 to line 6, col 31 of module M",
          message: "Unknown operator: `A'.",
        },
        {
          location: "line 6, col 39 to line 6, col 39 of module M",
          message: "Unknown operator: `B'.",
        },
        {
          location: "line 7, col 8 to line 7, col 8 of module M",
          message: "Unknown operator: `V'.",
        },
      ],
      [],
    ],
    [
      "illegal, repeated, and missing substitutions",
      "---- MODULE Inner ----\nCONSTANT a, b, c\n====\nFoo == U\nI == INSTANCE Inner WITH a <- A, d <- 1, c <- 2, c <- C\nLOCAL INSTANCE Inner WITH a <- 1, c <- 2\nBar == V",
      [
        {
          location: "line 5, col 8 to line 5, col 8 of module M",
          message: "Unknown operator: `U'.",
        },
        {
          location: "line 6, col 31 to line 6, col 31 of module M",
          message: "Unknown operator: `A'.",
        },
        {
          location: "line 6, col 34 to line 6, col 34 of module M",
          message:
            "Identifier 'd' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)",
        },
        {
          location: "line 6, col 55 to line 6, col 55 of module M",
          message: "Unknown operator: `C'.",
        },
        {
          location: "line 6, col 55 to line 6, col 55 of module M",
          message: "Multiple substitutions for symbol 'c' in substitution.",
        },
        {
          location: "line 6, col 1 to line 6, col 55 of module M",
          message:
            "Substitution missing for symbol b declared at line 3, col 13 to line 3, col 13 of module M \nand instantiated in module M.",
        },
        {
          location: "line 7, col 1 to line 7, col 40 of module M",
          message:
            "Substitution missing for symbol b declared at line 3, col 13 to line 3, col 13 of module M \nand instantiated in module M.",
        },
        {
          location: "line 8, col 8 to line 8, col 8 of module M",
          message: "Unknown operator: `V'.",
        },
      ],
      [],
    ],
    [
      "substitutions of an INSTANCE in a LET or a proof",
      "---- MODULE Inner ----\nCONSTANT a, b\nB == a\n====\nI == INSTANCE Inner WITH a <- 1, b <- 2\nF == LET J == INSTANCE Inner WITH a <- A, c <- 1, a <- 2 IN J!B /\\ U\nTHEOREM TRUE\n<1> DEFINE K == INSTANCE Inner WITH b <- lab :: 1\n<1> INSTANCE Inner WITH a <- 1, d <- 2\n<1>1. B = V /\\ K!B = 1\n<1> INSTANCE Inner WITH a <- 1, b <- 2\n<1> QED",
      [
        {
          location: "line 7, col 40 to line 7, col 40 of module M",
          message: "Unknown operator: `A'.",
        },
        {
          location: "line 7, col 43 to line 7, col 43 of module M",
          message:
            "Identifier 'c' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)",
        },
        {
          location: "line 7, col 56 to line 7, col 56 of module M",
          message: "Multiple substitutions for symbol 'a' in substitution.",
        },
        {
          location: "line 7, col 10 to line 7, col 56 of module M",
          message:
            "Substitution missing for symbol b declared at line 3, col 13 to line 3, col 13 of module M \nand instantiated in module M.",
        },
        {
          location: "line 7, col 68 to line 7, col 68 of module M",
          message: "Unknown operator: `U'.",
        },
        {
          location: "line 9, col 42 to line 9, col 49 of module M",
          message: "Label not in definition or proof step.",
        },
        {
          location: "line 9, col 12 to line 9, col 49 of module M",
          message:
            "Substitution missing for symbol a declared at line 3, col 10 to line 3, col 10 of module M \nand instantiated in module M.",
        },
        {
          location: "line 10, col 33 to line 10, col 33 of module M",
          message:
            "Identifier 'd' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)",
        },
        {
          location: "line 10, col 5 to line 10, col 38 of module M",
          message:
            "Substitution missing for symbol b declared at line 3, col 13 to line 3, col 13 of module M \nand instantiated in module M.",
        },
        {
          location: "line 11, col 11 to line 11, col 11 of module M",
          message: "Unknown operator: `V'.",
        },
      ],
      [
        {
          location: "line 12, col 5 to line 12, col 38 of module M",
          message:
            "Multiple declarations or definitions for symbol B.  \nThis duplicates the one at line 10, col 5 to line 10, col 38 of module M.",
        },
      ],
    ],
    [
      "errors in modules nested in nested modules",
      "Foo == U\n---- MODULE Middle ----\nA == V\n---- MODULE Inner ----\nRECURSIVE R(_)\nB == W\n====\nC == X\n====\nBar == Y",
      [
        {
          location: "line 2, col 8 to line 2, col 8 of module M",
          message: "Unknown operator: `U'.",
        },
        {
          location: "line 4, col 6 to line 4, col 6 of module M",
          message: "Unknown operator: `V'.",
        },
        {
          location: "line 7, col 6 to line 7, col 6 of module M",
          message: "Unknown operator: `W'.",
        },
        {
          location: "line 6, col 11 to line 6, col 14 of module M",
          message: "Symbol R declared in RECURSIVE statement but not defined.",
        },
        {
          location: "line 9, col 6 to line 9, col 6 of module M",
          message: "Unknown operator: `X'.",
        },
        {
          location: "line 11, col 8 to line 11, col 8 of module M",
          message: "Unknown operator: `Y'.",
        },
      ],
      [],
    ],
    [
      "an error in a nested module before a module defined twice",
      "Foo == 1\n---- MODULE Inner ----\nCONSTANT Foo\nB == 1\n====\n---- MODULE Inner ----\n====\nB == 2\nH == U",
      [
        {
          location: "line 4, col 10 to line 4, col 12 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 8 of module M.",
        },
        {
          location: "line 7, col 1 to line 8, col 4 of module M",
          message:
            "Multiply-defined module 'Inner': this definition or declaration conflicts \nwith the one at line 3, col 1 to line 6, col 4 of module M.",
        },
        {
          location: "line 10, col 6 to line 10, col 6 of module M",
          message: "Unknown operator: `U'.",
        },
      ],
      [],
    ],
    [
      "warnings in nested modules between the enclosing module's",
      "EXTENDS Naturals\nCONSTANT c\nCONSTANT c\n---- MODULE Inner ----\nEXTENDS Naturals\nPlus(a, b) == a + b\nPlus(a, b) == a - b\n====\n---- MODULE A1 ----\nFoo == 1\n====\n---- MODULE A2 ----\nFoo == 2\n====\n---- MODULE Both ----\nEXTENDS A1, A2\n====\nCONSTANT d\nCONSTANT d\nBar == U",
      [
        {
          location: "line 8, col 1 to line 8, col 19 of module M",
          message: "Operator Plus already defined or declared.",
        },
        {
          location: "line 21, col 8 to line 21, col 8 of module M",
          message: "Unknown operator: `U'.",
        },
      ],
      [
        {
          location: "line 4, col 10 to line 4, col 10 of module M",
          message:
            "Multiple declarations or definitions for symbol c.  \nThis duplicates the one at line 3, col 10 to line 3, col 10 of module M.",
        },
        {
          location: "line 8, col 1 to line 8, col 19 of module M",
          message:
            "Multiple declarations or definitions for symbol Plus.  \nThis duplicates the one at line 7, col 1 to line 7, col 19 of module M.",
        },
        {
          location: "line 14, col 1 to line 14, col 8 of module M",
          message:
            "Warning: the definition of 'Foo' conflicts with \nits definition at line 11, col 1 to line 11, col 8 of module M.",
        },
        {
          location: "line 20, col 10 to line 20, col 10 of module M",
          message:
            "Multiple declarations or definitions for symbol d.  \nThis duplicates the one at line 19, col 10 to line 19, col 10 of module M.",
        },
      ],
    ],
    [
      "a nested module's declaration of a name the enclosing module declares twice",
      "CONSTANT c\nCONSTANT c\n---- MODULE Inner ----\nCONSTANT c\n====\nBar == U",
      [
        {
          location: "line 7, col 8 to line 7, col 8 of module M",
          message: "Unknown operator: `U'.",
        },
      ],
      [3, 5].map((line) => ({
        location: `line ${line}, col 10 to line ${line}, col 10 of module M`,
        message:
          "Multiple declarations or definitions for symbol c.  \nThis duplicates the one at line 2, col 10 to line 2, col 10 of module M.",
      })),
    ],
    [
      "a semantic error after a nested module with a level error",
      "---- MODULE Inner ----\nVARIABLE y\nB == ENABLED (y' = y)\nC == []B\nD == C'\n====\nE == U",
      [
        {
          location: "line 8, col 6 to line 8, col 6 of module M",
          message: "Unknown operator: `U'.",
        },
      ],
      [],
    ],
    [
      "substitutions that are no operator of the arity a CONSTANT takes",
      "---- MODULE Inner ----\nCONSTANT Op(_)\n====\n---- MODULE Pair ----\nCONSTANT c, Op(_)\n====\nc(a) == 1\nG(a, b) == a\nOp(a, b) == a\nI == INSTANCE Pair WITH c <- 1, Op <- zz\nJ == INSTANCE Inner WITH Op <- LAMBDA a, b : a\nK == INSTANCE Inner WITH Op <- G\nL == INSTANCE Inner WITH Op <- +\nN == INSTANCE Inner WITH Op <- G(1)\nP == INSTANCE Inner",
      [
        {
          location: "line 11, col 1 to line 11, col 40 of module M",
          message:
            "Wrong number of arguments (0) given to operator 'c', \nwhich requires 1 arguments.",
        },
        {
          location: "line 11, col 39 to line 11, col 40 of module M",
          message: "Unknown operator: `zz'.",
        },
        {
          location: "In module --TLA+ BUILTINS--",
          message: "An operator must be substituted for symbol 'Op', and it must have arity 1.",
        },
        {
          location: "line 12, col 32 to line 12, col 46 of module M",
          message: "An operator must be substituted for symbol 'Op', and it must have arity 1.",
        },
        {
          location: "line 13, col 32 to line 13, col 32 of module M",
          message: "Expected arity 1 but found operator of arity 2.",
        },
        {
          location: "line 14, col 32 to line 14, col 32 of module M",
          message: "Could not find declaration or definition of symbol '+'.",
        },
        {
          location: "line 15, col 32 to line 15, col 35 of module M",
          message:
            "Arity 1 operator (not an expression) is expected \nto substitute for CONSTANT 'Op'.",
        },
        {
          location: "line 16, col 1 to line 16, col 19 of module M",
          message: "An operator must be substituted for symbol 'Op', and it must have arity 1.",
        },
      ],
      [],
    ],
    [
      "declarations, assumptions, theorems, and USE between a RECURSIVE declaration and its definition",
      "RECURSIVE f(_)\nVARIABLES y,\n  z\nCONSTANT C\nASSUME TRUE\nTHEOREM T == TRUE\nUSE T\nf(n) == n\nVARIABLE w",
      [
        ["line 3, col 1 to line 4, col 3", "A VARIABLE declaration"],
        ["line 5, col 1 to line 5, col 10", "A declaration"],
        ["line 6, col 1 to line 6, col 11", "An ASSUME"],
        ["line 7, col 1 to line 7, col 17", "A THEOREM"],
        ["line 8, col 1 to line 8, col 5", "A USE or HIDE"],
      ].map((error) => ({
        location: `${error[0]} of module M`,
        message: `${error[1]} may not appear within a recursive definition section.`,
      })),
      [],
    ],
  ])("rejects %s like SANY", async (_title, source, errors, warnings) => {
    await expect(checkNames(source)).rejects.toMatchObject({ sany: { errors, warnings } });
  });

  it.each([
    [
      "a definition before an instance that imports it",
      "Nat == 1\nINSTANCE Naturals",
      "*** Warnings: 1\n\nline 14, col 1 to line 14, col 16 of module Naturals\n\nMultiple declarations or definitions for symbol Nat.  \nThis duplicates the one at line 2, col 1 to line 2, col 8 of module M.\n\n\n",
    ],
    [
      "a named instance defined twice",
      "J == INSTANCE Naturals\nJ == INSTANCE Naturals",
      "*** Warnings: 1\n\nline 3, col 1 to line 3, col 22 of module M\n\nMultiple declarations or definitions for symbol J.  \nThis duplicates the one at line 2, col 1 to line 2, col 22 of module M.\n\n\n",
    ],
    [
      "an assumption named twice",
      "ASSUME A == TRUE\nASSUME A == TRUE",
      "*** Warnings: 1\n\nline 3, col 1 to line 3, col 16 of module M\n\nMultiple declarations or definitions for symbol A.  \nThis duplicates the one at line 2, col 1 to line 2, col 16 of module M.\n\n\n",
    ],
    [
      "a definition of two extended modules",
      "---- MODULE A ----\nFoo == 1\n====\n---- MODULE B ----\nFoo(a) == 2\n====\n---- MODULE C ----\nEXTENDS A, B\nF == Foo\n====\nI == INSTANCE C",
      "*** Warnings: 1\n\nline 6, col 1 to line 6, col 11 of module M\n\nWarning: the definition of 'Foo' conflicts with \nits definition at line 3, col 1 to line 3, col 8 of module M.\n\n\n",
    ],
    [
      "a definition an instance copies from an extended module with parameters",
      "---- MODULE P ----\nVARIABLE sv\nShared == 0\n====\n---- MODULE In1 ----\nEXTENDS P\n====\n---- MODULE Q ----\nEXTENDS P\nINSTANCE In1\n====",
      "*** Warnings: 1\n\nline 11, col 1 to line 11, col 12 of module M\n\nMultiple declarations or definitions for symbol Shared.  \nThis duplicates the one at line 4, col 1 to line 4, col 11 of module M.\n\n\n",
    ],
    [
      "two NEW symbols with one name",
      "THEOREM ASSUME NEW a, NEW a PROVE TRUE",
      "*** Warnings: 1\n\nline 2, col 27 to line 2, col 27 of module M\n\nMultiple declarations or definitions for symbol a.  \nThis duplicates the one at line 2, col 20 to line 2, col 20 of module M.\n\n\n",
    ],
    [
      "a variable and a constant of two extended modules",
      "---- MODULE A ----\nVARIABLE Baz\n====\n---- MODULE B ----\nCONSTANT Baz\n====\n---- MODULE C ----\nEXTENDS A, B\nF == Baz\n====",
      "*** Warnings: 1\n\nline 6, col 10 to line 6, col 12 of module M\n\nWarning: the declaration of 'Baz' conflicts with \nits declaration at line 3, col 10 to line 3, col 12 of module M.\n\n\n",
    ],
  ])("warns of %s like SANY", async (_title, source, warnings) => {
    const printed: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\n${source}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect([result.status, printed[0]]).toEqual(["success", warnings]);
  });

  it("reports RECURSIVE declarations it never defines like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nRECURSIVE F(_), F(_)\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          {
            location: "line 5, col 11 to line 5, col 14 of module M",
            message: "Symbol F declared in RECURSIVE statement but not defined.",
          },
          {
            location: "line 5, col 17 to line 5, col 20 of module M",
            message: "Symbol F declared in RECURSIVE statement but not defined.",
          },
        ],
        warnings: [
          {
            location: "line 5, col 17 to line 5, col 20 of module M",
            message:
              "Multiple declarations or definitions for symbol F.  \nThis duplicates the one at line 5, col 11 to line 5, col 14 of module M.",
          },
        ],
      },
    });
  });

  it("reports a LET RECURSIVE declaration after the definition like SANY", async () => {
    await expect(
      checkNames("G == LET H == 1\n         RECURSIVE H, K\n     IN H"),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          {
            location: "line 3, col 20 to line 3, col 20 of module M",
            message: "Symbol H declared in RECURSIVE statement but not defined.",
          },
          {
            location: "line 3, col 23 to line 3, col 23 of module M",
            message: "Symbol K declared in RECURSIVE statement but not defined.",
          },
        ],
        warnings: [
          {
            location: "line 3, col 20 to line 3, col 20 of module M",
            message:
              "Multiple declarations or definitions for symbol H.  \nThis duplicates the one at line 2, col 10 to line 2, col 15 of module M.",
          },
        ],
      },
    });
  });

  it("resolves a name that RECURSIVE declares but nothing defines like SANY", async () => {
    await expect(
      checkNames("RECURSIVE F(_)\nG == F\nH == LET F(a) == 1 IN F(1)"),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          {
            location: "line 3, col 6 to line 3, col 6 of module M",
            message: "The operator F requires 1 arguments.",
          },
          {
            location: "line 4, col 10 to line 4, col 18 of module M",
            message: "Recursive operator F defined at wrong LET/IN level.",
          },
          {
            location: "line 5, col 1 to line 5, col 10 of module M",
            message: "A VARIABLE declaration may not appear within a recursive definition section.",
          },
          {
            location: "line 2, col 11 to line 2, col 14 of module M",
            message: "Symbol F declared in RECURSIVE statement but not defined.",
          },
        ],
        warnings: [
          {
            location: "line 4, col 10 to line 4, col 18 of module M",
            message:
              "Multiple declarations or definitions for symbol F.  \nThis duplicates the one at line 2, col 11 to line 2, col 14 of module M.",
          },
        ],
      },
    });
  });

  it("reports DEF clause entries that name no definition like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nCONSTANT c\nF == 1\nUSE DEF Later\nLater == 1\n---- MODULE Inner ----\nG == 1\n====\nI == INSTANCE Inner\nTHEOREM TRUE BY DEF x, c, F, Nope, I, I!G, I!H\nTHEOREM ASSUME NEW xx PROVE TRUE\n  BY DEF xx\nTHEOREM TRUE\n<1> PICK p : p = 1 OBVIOUS\n<1> QED BY DEF p\nHIDE DEF -., \\cup, +, Nat\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 6, col 9 to line 6, col 13", "Unknown operator: `Later'."],
          [
            "line 6, col 9 to line 6, col 13",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 1 to line 6, col 13", "Empty USE or HIDE statement."],
          [
            "line 12, col 21 to line 12, col 21",
            "DEF clause entry should describe a defined operator.",
          ],
          [
            "line 12, col 24 to line 12, col 24",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 12, col 30 to line 12, col 33", "Unknown operator: `Nope'."],
          [
            "line 12, col 30 to line 12, col 33",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 12, col 44 to line 12, col 46", "Unknown operator: `I!H'."],
          [
            "line 12, col 44 to line 12, col 46",
            "DEF clause entry should describe a defined operator.",
          ],
          [
            "line 14, col 10 to line 14, col 11",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 14, col 3 to line 14, col 11", "Empty BY"],
          [
            "line 17, col 16 to line 17, col 16",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 17, col 9 to line 17, col 16", "Empty BY"],
          ["line 18, col 10 to line 18, col 11", "Unknown operator: `-.'."],
          [
            "line 18, col 10 to line 18, col 11",
            "DEF clause entry should describe a defined operator.",
          ],
          [
            "line 18, col 14 to line 18, col 17",
            "DEF clause entry should describe a defined operator.",
          ],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it("reports an @ fact as an unknown operator like SANY", async () => {
    await expect(checkNames("USE @\nTHEOREM TRUE\nBY @\nHIDE @")).rejects.toThrow(
      createSanyError([
        {
          location: "line 2, col 5 to line 2, col 5 of module M",
          message: "Unknown operator: `@'.",
        },
        {
          location: "line 4, col 4 to line 4, col 4 of module M",
          message: "Unknown operator: `@'.",
        },
        {
          location: "line 5, col 6 to line 5, col 6 of module M",
          message: "Unknown operator: `@'.",
        },
        {
          location: "In module --TLA+ BUILTINS--",
          message:
            "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        },
      ]),
    );
  });

  it("reports HIDE facts that name no theorem, assumption or step like SANY", async () => {
    const message =
      "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.";
    await expect(
      checkNames(
        'EXTENDS Naturals\nCONSTANT c\nVARIABLE y\nD == 1\nE(a) == a\nTHEOREM T == TRUE\nAXIOM A == TRUE\nHIDE 1, "s", TRUE, y, c, D, Unk, 1 + 1, E(1), T, A, LET q == 1 IN q, MODULE Naturals, {1}, l :: 1, 1.5\nHIDE T DEF D\nTHEOREM ASSUME NEW n PROVE TRUE\n<1>1. TRUE\n<1>2. ASSUME NEW m PROVE TRUE\n  <2> HIDE <1>1, <1>2, n, m, T, Q, c\n  <2>1. QED\n<1> HIDE <1>1, 1\n<1>3. QED',
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 9, col 29 to line 9, col 31 of module M",
          message: "Unknown operator: `Unk'.",
        },
        {
          location: "line 9, col 92 to line 9, col 97 of module M",
          message: "Label not in definition or proof step.",
        },
        ...[
          "line 9, col 14 to line 9, col 17 of module M",
          "line 9, col 20 to line 9, col 20 of module M",
          "line 9, col 23 to line 9, col 23 of module M",
          "line 9, col 26 to line 9, col 26 of module M",
          "In module --TLA+ BUILTINS--",
          "line 9, col 34 to line 9, col 38 of module M",
          "line 9, col 41 to line 9, col 44 of module M",
          "line 9, col 87 to line 9, col 89 of module M",
        ].map((location) => ({ location, message })),
        {
          location: "line 14, col 33 to line 14, col 33 of module M",
          message: "Unknown operator: `Q'.",
        },
        ...[
          "line 14, col 24 to line 14, col 24 of module M",
          "line 14, col 27 to line 14, col 27 of module M",
          "line 14, col 36 to line 14, col 36 of module M",
        ].map((location) => ({ location, message })),
      ]),
    );
  });

  it("reports an operator parameter where a RECURSIVE declaration has _, which SANY accepts", async () => {
    await expect(checkNames("RECURSIVE Map(_, _)\nMap(f(_), s) == 1")).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 1 to line 3, col 17 of module M",
          message: "Definition of Map has different arity than its RECURSIVE declaration.",
        },
      ]),
    );
  });
});
