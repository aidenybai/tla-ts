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

  it("fails to parse an EXTENDS of a name that is not an identifier", async () => {
    await expect(checkNames("EXTENDS)Sequences")).rejects.toThrow("line 2, column 8");
    await expect(checkNames("EXTENDS +, Sequences")).rejects.toThrow("line 2, column 9");
  });

  it("reports a parse error in an extended module before a module after it that is missing", async () => {
    const result = check({
      source: "---- MODULE M ----\nEXTENDS Broken, Missing\n====",
      config: "",
      loadModule: (name) =>
        name === "Broken" ? "---- MODULE Broken ----\nBad == [a/b |-> 1]\n====" : undefined,
    });
    await expect(result).rejects.toThrow(
      createSanyError(
        [
          {
            location: "In module Broken",
            message: "Could not parse module Broken from file Broken.tla",
          },
        ],
        true,
        [
          "***Parse Error***",
          'Encountered "|->" at line 2, column 13 and token "b" ',
          "",
          "Residual stack trace follows:",
          "Some [] Form starting at line 2, column 8.",
          "ExtendableExpr starting at line 2, column 8.",
          "Expression starting at line 2, column 8.",
          "Definition starting at line 2, column 1.",
          "Module body starting at line 2, column 1.",
          "",
        ].join("\n"),
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
    [
      "an operator substituted before a LEMMA, which SANY rejects",
      "EXTENDS Integers\n---- MODULE Inner ----\nCONSTANT G(_, _)\n====\nI == INSTANCE Inner WITH G <- -\nLEMMA TRUE",
    ],
    [
      "a selection into an ASSUME/PROVE theorem through a named instance",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nI == INSTANCE Base\nX == I!Foo!1",
    ],
    [
      "a definition named like a theorem that an instance with substitutions reuses from a module without parameters, which SANY never imports",
      "---- MODULE P ----\nTHEOREM Foo == TRUE\n====\n---- MODULE Base ----\nEXTENDS P\nCONSTANT c\n====\nFoo == 1\nINSTANCE Base WITH c <- 1",
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

  const exceptSelection = "Selecting subexpression of an EXCEPT not yet implemented.";
  const letSelector = "A name selector here must be from a LET clause.";
  const noOperands = "Choosing operand `argument selector 1' of subexpression with no operands.";
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
      "CONSTANT C(_)\nVARIABLE v\n---- MODULE In ----\nCONSTANT k, F(_)\n====\nOp(P(_)) == P(1)\nA == WF_v(LAMBDA p : lab:: p)\nD == Op(LAMBDA r : r) /\\ Op(LAMBDA r, s : r)\nI == INSTANCE In WITH k <- LAMBDA a : a, F <- LAMBDA a : a\nG(a) == a\nH == G(LAMBDA z : z) /\\ C(LAMBDA z : z)",
      [
        [
          "line 8, col 11 to line 8, col 28",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 9, col 26 to line 9, col 27",
          "Lambda expression with arity 2 used as argument 1 of operator `Op', \nbut an operator of arity 1 is required.",
        ],
        [
          "line 9, col 26 to line 9, col 44",
          "Argument number 1 to operator 'Op' \nshould be a 1-parameter operator.",
        ],
        [
          "line 10, col 28 to line 10, col 39",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 12, col 8 to line 12, col 19",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 12, col 27 to line 12, col 38",
          "LAMBDA expression used where an expression is required.",
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
      "EXTENDS Integers, Sequences\n---- MODULE Inner ----\nH(Q(_)) == Q(1)\n====\nOp(Q(_, _)) == Q(1, 2)\nI == INSTANCE Inner\nA == Op(SUBSET) /\\ Op(-. ) /\\ I!H(+ ) /\\ SelectSeq(<<>>, + )\nB == LET L(Q(_)) == Q(1) IN L(\\cup)",
      [
        [
          "line 8, col 6 to line 8, col 7",
          "Operator with incorrect arity passed as argument. \nOperator 'SUBSET' of arity 1 is argument number 1 (counting from 1) to operator `line 6, col 1 to line 6, col 22 of module M', \nbut an operator of arity 2 was expected.",
        ],
        [
          "line 8, col 6 to line 8, col 15",
          "Argument number 1 to operator 'Op' \nshould be a 2-parameter operator.",
        ],
        [
          "line 8, col 20 to line 8, col 21",
          "Operator with incorrect arity passed as argument. \nOperator '-.' of arity 1 is argument number 1 (counting from 1) to operator `line 6, col 1 to line 6, col 22 of module M', \nbut an operator of arity 2 was expected.",
        ],
        [
          "line 8, col 20 to line 8, col 26",
          "Argument number 1 to operator 'Op' \nshould be a 2-parameter operator.",
        ],
        [
          "line 8, col 33 to line 8, col 33",
          "Operator with incorrect arity passed as argument. \nOperator '+' of arity 2 is argument number 1 (counting from 1) to operator `line 7, col 1 to line 7, col 19 of module M', \nbut an operator of arity 1 was expected.",
        ],
        [
          "line 8, col 31 to line 8, col 37",
          "Argument number 1 to operator 'I!H' \nshould be a 1-parameter operator.",
        ],
        [
          "line 8, col 42 to line 8, col 50",
          "Operator with incorrect arity passed as argument. \nOperator '+' of arity 2 is argument number 2 (counting from 1) to operator `line 53, col 1 to line 65, col 14 of module Sequences', \nbut an operator of arity 1 was expected.",
        ],
        [
          "line 8, col 42 to line 8, col 60",
          "Argument number 2 to operator 'SelectSeq' \nshould be a 1-parameter operator.",
        ],
        [
          "line 9, col 29 to line 9, col 29",
          "Operator with incorrect arity passed as argument. \nOperator '\\union' of arity 2 is argument number 1 (counting from 1) to operator `line 9, col 10 to line 9, col 24 of module M', \nbut an operator of arity 1 was expected.",
        ],
        [
          "line 9, col 29 to line 9, col 35",
          "Argument number 1 to operator 'L' \nshould be a 1-parameter operator.",
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
      "EXTENDS Integers\n---- MODULE Inner ----\nCONSTANT e, f, g, h\n====\nI == INSTANCE Inner WITH e <- +, f <- SUBSET, g <- ', h <- -.",
      [
        ["line 6, col 31 to line 6, col 31", "The operator + requires 2 arguments."],
        ["line 6, col 39 to line 6, col 44", "The operator SUBSET requires 1 arguments."],
        ["line 6, col 52 to line 6, col 52", "The operator ' requires 1 arguments."],
        ["line 6, col 60 to line 6, col 61", "The operator -. requires 1 arguments."],
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
      "CONSTANT c, Cop(_)\nI == INSTANCE Naturals\nOp(P1(_, _)) == Cop(LAMBDA p : p)!1 /\\ P1(G0, 0)!1!: /\\ zz(G1)!1 /\\ c(G2)!1 /\\ I!Nope(G3)!1",
      [
        ["line 4, col 17 to line 4, col 19", "Cannot take subexpression of `Cop'."],
        ["line 4, col 40 to line 4, col 41", "Cannot take subexpression of `P1'."],
        ["line 4, col 57 to line 4, col 58", "Unknown operator: `zz'."],
        ["line 4, col 69 to line 4, col 69", "Cannot take subexpression of `c'."],
        ["line 4, col 80 to line 4, col 85", "Unknown operator: `I!Nope'."],
      ],
    ],
    [
      "THEOREM T == TRUE\n<1>1. HIDE T\n<1>2. <1>1!G = <1>1!G(1)\n  OBVIOUS\n<1> QED",
      [
        ["line 4, col 7 to line 4, col 10", "Cannot take subexpression of `<1>1'."],
        ["line 4, col 16 to line 4, col 19", "Cannot take subexpression of `<1>1'."],
      ],
    ],
    [
      "Op == {LET L(a) == a IN L(1)}\nB == Op!1!M!N\nC == Op!1!M!1\nD == Op!1!M(1)",
      [
        ["line 3, col 11 to line 3, col 13", "Unknown operator: `M!N'."],
        ["line 4, col 11 to line 4, col 11", "Unknown operator: `M'."],
        ["line 5, col 11 to line 5, col 11", "Unknown operator: `M'."],
      ],
    ],
    [
      "CONSTANT c, f\nOp == [f EXCEPT ![1] = 2, ![2] = 3]\nOp2 == [f EXCEPT ![1] = 2]\nA == Op!1 /\\ Op!2 /\\ Op!3 /\\ Op!4 /\\ Op!>> /\\ Op2!>> /\\ Op!<< /\\ Op!@\nTHEOREM T == [f EXCEPT ![1] = 2] = f\nB == T!1!1 /\\ T!1!2 /\\ T!1!3 /\\ T!1!>> /\\ T!1!@\nTHEOREM U == ASSUME c PROVE [f EXCEPT ![1] = 2, ![2] = 3] = f\nC == U!2!1!1 /\\ U!2!1!2 /\\ U!2!1!4 /\\ U!2!1!>> /\\ U!2!1!@\nUSE U!2!1!2",
      [
        ["line 5, col 17 to line 5, col 17", exceptSelection],
        ["line 5, col 25 to line 5, col 25", exceptSelection],
        [
          "line 5, col 33 to line 5, col 33",
          "Nonexistent operand specified by `argument selector 4'.",
        ],
        ["line 5, col 41 to line 5, col 42", "Nonexistent operand specified by `>>'."],
        ["line 5, col 51 to line 5, col 52", exceptSelection],
        ["line 5, col 69 to line 5, col 69", "Nonexistent operand specified by `@'."],
        ["line 7, col 19 to line 7, col 19", exceptSelection],
        [
          "line 7, col 28 to line 7, col 28",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        ["line 7, col 37 to line 7, col 38", exceptSelection],
        ["line 7, col 47 to line 7, col 47", "Nonexistent operand specified by `@'."],
        ["line 9, col 23 to line 9, col 23", exceptSelection],
        [
          "line 9, col 34 to line 9, col 34",
          "Nonexistent operand specified by `argument selector 4'.",
        ],
        ["line 9, col 45 to line 9, col 46", "Nonexistent operand specified by `>>'."],
        ["line 9, col 57 to line 9, col 57", "Nonexistent operand specified by `@'."],
        ["line 10, col 11 to line 10, col 11", exceptSelection],
      ],
    ],
    [
      "CONSTANT c\nRECURSIVE S, U(_)\nA == S!lab /\\ U(1)!lab /\\ U!lab /\\ U(1, 2)!lab /\\ U(LAMBDA p : p)!lab /\\ U(S)!lab(c)\nB == U!1 /\\ U(1, 2)!1 /\\ U(LAMBDA p : p)!1 /\\ (LET RECURSIVE T IN T!lab) /\\ (LET RECURSIVE V(_) IN V!lab!1)",
      [
        [
          "line 4, col 6 to line 4, col 6",
          "Subexpression of  `S' used inside the operator's definition.",
        ],
        [
          "line 4, col 15 to line 4, col 15",
          "Subexpression of  `U' used inside the operator's definition.",
        ],
        ["line 4, col 27 to line 4, col 31", "The operator U requires 1 arguments."],
        ["line 4, col 37 to line 4, col 42", "The operator U requires 1 arguments."],
        [
          "line 4, col 53 to line 4, col 64",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 4, col 51 to line 4, col 51",
          "Subexpression of  `U' used inside the operator's definition.",
        ],
        [
          "line 4, col 74 to line 4, col 74",
          "Subexpression of  `U' used inside the operator's definition.",
        ],
        ["line 5, col 6 to line 5, col 8", "The operator U requires 1 arguments."],
        ["line 5, col 14 to line 5, col 19", "The operator U requires 1 arguments."],
        [
          "line 5, col 28 to line 5, col 39",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 5, col 26 to line 5, col 26",
          "Subexpression of  `U' used inside the operator's definition.",
        ],
        [
          "line 5, col 62 to line 5, col 62",
          "Symbol T declared in RECURSIVE statement but not defined.",
        ],
        [
          "line 5, col 67 to line 5, col 67",
          "Subexpression of  `T' used inside the operator's definition.",
        ],
        [
          "line 5, col 92 to line 5, col 95",
          "Symbol V declared in RECURSIVE statement but not defined.",
        ],
        ["line 5, col 100 to line 5, col 106", "The operator V requires 1 arguments."],
        [
          "line 6, col 1 to line 6, col 10",
          "A VARIABLE declaration may not appear within a recursive definition section.",
        ],
        [
          "line 3, col 11 to line 3, col 11",
          "Symbol S declared in RECURSIVE statement but not defined.",
        ],
        [
          "line 3, col 14 to line 3, col 17",
          "Symbol U declared in RECURSIVE statement but not defined.",
        ],
      ],
    ],
    [
      "CONSTANT c\nOp1 == {c, lab:: c} \\cap {LET L == c IN L}\nOp2(a) == {a, LET K(b) == b IN K(1)}\nA == Op1!1!lab /\\ Op1!<<!lab /\\ Op1!2!L /\\ Op1!2!1!L /\\ Op2(1)!2!1!K /\\ Op1!1!2!lab",
      [
        ["line 5, col 10 to line 5, col 10", letSelector],
        ["line 5, col 23 to line 5, col 24", letSelector],
        ["line 5, col 37 to line 5, col 37", letSelector],
        ["line 5, col 66 to line 5, col 66", letSelector],
        ["line 5, col 79 to line 5, col 79", letSelector],
      ],
    ],
    [
      "CONSTANT c\nOp0(a0, P1(_, _)) == l1:: a0\nOp3(P(_, _)) == {LET L(G(_)) == lab:: G(1) IN L(P)}\nA == Op0(c, 1)!l1 /\\ Op3(LAMBDA p : p)!1!1 /\\ Op3(Op0)!<<!L(c)!lab",
      [
        ["line 4, col 49 to line 4, col 49", "Expected arity 1 but found operator of arity 2."],
        [
          "line 4, col 47 to line 4, col 50",
          "Argument number 1 to operator 'L' \nshould be a 1-parameter operator.",
        ],
        [
          "line 5, col 13 to line 5, col 13",
          "An expression appears as argument number 2 (counting from 1) to operator 'Op0', in a position an operator is required.",
        ],
        [
          "line 5, col 6 to line 5, col 17",
          "Argument number 2 to operator 'LAMBDA' \nshould be a 2-parameter operator.",
        ],
        [
          "line 5, col 22 to line 5, col 24",
          "Lambda expression with arity 1 used as argument 1 of operator `Op3', \nbut an operator of arity 2 is required.",
        ],
        [
          "line 5, col 22 to line 5, col 42",
          "Argument number 1 to operator 'LAMBDA' \nshould be a 2-parameter operator.",
        ],
        ["line 5, col 61 to line 5, col 61", "Expected arity 1 but found operator of arity 0."],
        [
          "line 5, col 47 to line 5, col 66",
          "Argument number 1 to operator 'LAMBDA' \nshould be a 2-parameter operator.",
        ],
        [
          "line 5, col 47 to line 5, col 66",
          "Argument number 2 to operator 'LAMBDA' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "CONSTANT c\nOp1(a0) == {a0}\nOp == {c, Op1(LAMBDA p : p)}\nA == Op!2!1!1 /\\ Op!2!1 /\\ Op!2",
      [
        [
          "line 4, col 15 to line 4, col 26",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 5, col 11 to line 5, col 11",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
        [
          "line 5, col 23 to line 5, col 23",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
      ],
    ],
    [
      "Op1 == {1}\nA == -Op1!1!: /\\ Op1!1^+",
      [
        [
          "line 3, col 6 to line 3, col 6",
          "Could not find declaration or definition of symbol '-.'.",
        ],
        ["line 3, col 6 to line 3, col 13", "Couldn't resolve prefix operator symbol `-.'."],
        [
          "line 3, col 23 to line 3, col 24",
          "Could not find declaration or definition of symbol '^+'.",
        ],
        ["line 3, col 18 to line 3, col 24", "Couldn't resolve postfix operator symbol `^+'."],
      ],
    ],
    [
      "---- MODULE Inner ----\nJ(a, Q(_)) == Q(a)\n====\nI0 == INSTANCE Inner\nRECURSIVE Rec1\nRec1(a0) == I0!J(Rec1, LAMBDA y : y)!<<\nVARIABLE z\nOp(a, Q(_)) == lab :: Q(a)\nA == Op(1, LAMBDA z : z)!lab",
      [
        [
          "line 7, col 1 to line 7, col 39",
          "Definition of Rec1 has different arity than its RECURSIVE declaration.",
        ],
        [
          "line 7, col 18 to line 7, col 21",
          "Wrong number of arguments (0) given to operator 'Rec1', \nwhich requires 1 arguments.",
        ],
        [
          "line 10, col 19 to line 10, col 19",
          "Multiply-defined symbol 'z': this definition or declaration conflicts \nwith the one at line 8, col 10 to line 8, col 10 of module M.",
        ],
      ],
    ],
    [
      "THEOREM T == \\A a \\in {1} : \\E b \\in {2} : a = b\nUSE T!@\nA == T!(1)!(2) /\\ T!@!@ /\\ T!(1)!@ /\\ T!(1)!(2, 3)\nOp == \\A a \\in {1}, b \\in {2} : a = b\nB == Op!(1) /\\ Op!(1, 2)!1",
      [
        ["line 3, col 5 to line 3, col 7", "Expected 1 arguments but found 0."],
        ["line 4, col 19 to line 4, col 23", "Expected 2 arguments but found 0."],
        ["line 4, col 28 to line 4, col 34", "Expected 2 arguments but found 1."],
        [
          "line 4, col 45 to line 4, col 50",
          "Selector with 2 argument(s) used for quantifier with 1 bound identifier(s).",
        ],
        [
          "line 6, col 9 to line 6, col 11",
          "Selector with 1 argument(s) used for quantifier with 2 bound identifier(s).",
        ],
      ],
    ],
    [
      "VARIABLE y\nASSUME AS == TRUE\nOp == {y, y', AS}\nA == Op!1!1 /\\ Op!2!1!1 /\\ Op!3!1\nTHEOREM T == TRUE\n<1>1. TRUE OBVIOUS\n<1>2. {<1>1, 1} OBVIOUS\n<1>3. <1>2!1!1 OBVIOUS\n<1>4. QED",
      [
        ["line 5, col 11 to line 5, col 11", noOperands],
        ["line 5, col 23 to line 5, col 23", noOperands],
        ["line 5, col 33 to line 5, col 33", noOperands],
        ["line 9, col 14 to line 9, col 14", noOperands],
      ],
    ],
    [
      "CONSTANT c, F(_, _)\nOp1(a0) == {a0}\nOp == {Undef, F(1), Op1(LAMBDA p : p), c!1, @}\nA == Op!1!1 /\\ Op!2!1 /\\ Op!3!1!1 /\\ Op!4!1 /\\ Op!5!1\nB == Op!1 /\\ Op!2 /\\ Op!3!1 /\\ Op!4 /\\ Op!5\nTHEOREM U == ASSUME c PROVE {Undef, F(2)}\nC == U!2!1!1 /\\ U!2!2!1",
      [
        ["line 4, col 8 to line 4, col 12", "Unknown operator: `Undef'."],
        ["line 4, col 16 to line 4, col 18", "The operator F requires 2 arguments."],
        [
          "line 4, col 25 to line 4, col 36",
          "LAMBDA expression used where an expression is required.",
        ],
        ["line 4, col 40 to line 4, col 40", "Cannot take subexpression of `c'."],
        ["line 4, col 45 to line 4, col 45", "@ used where its meaning is not defined."],
        ["line 5, col 11 to line 5, col 11", noOperands],
        ["line 5, col 21 to line 5, col 21", noOperands],
        [
          "line 5, col 31 to line 5, col 31",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
        ["line 5, col 43 to line 5, col 43", noOperands],
        ["line 5, col 53 to line 5, col 53", noOperands],
        [
          "line 6, col 27 to line 6, col 27",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
        ["line 7, col 30 to line 7, col 34", "Unknown operator: `Undef'."],
        ["line 7, col 38 to line 7, col 40", "The operator F requires 2 arguments."],
        ["line 8, col 12 to line 8, col 12", noOperands],
        ["line 8, col 23 to line 8, col 23", noOperands],
      ],
    ],
    [
      "CONSTANT c\nRECURSIVE R(_, _), Q(_), P(_, _)\nA == R(c, R)!1!@ /\\ Q(Q)!1 /\\ P(P, LAMBDA p : p)!1\nR(a, b) == a\nQ(a) == Q(a) /\\ Q(Q)!1\nP == c",
      [
        ["line 4, col 11 to line 4, col 11", "The operator R requires 2 arguments."],
        [
          "line 4, col 6 to line 4, col 6",
          "Subexpression of  `R' used inside the operator's definition.",
        ],
        ["line 4, col 23 to line 4, col 23", "The operator Q requires 1 arguments."],
        [
          "line 4, col 21 to line 4, col 21",
          "Subexpression of  `Q' used inside the operator's definition.",
        ],
        ["line 4, col 33 to line 4, col 33", "The operator P requires 2 arguments."],
        [
          "line 4, col 36 to line 4, col 47",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 4, col 31 to line 4, col 31",
          "Subexpression of  `P' used inside the operator's definition.",
        ],
        ["line 6, col 19 to line 6, col 19", "The operator Q requires 1 arguments."],
        [
          "line 6, col 17 to line 6, col 17",
          "Subexpression of  `Q' used inside the operator's definition.",
        ],
        [
          "line 7, col 1 to line 7, col 6",
          "Definition of P has different arity than its RECURSIVE declaration.",
        ],
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
      "---- MODULE Full ----\nG == 1\nH(h) == h\n====\n---- MODULE Inner ----\nL(a) == INSTANCE Full\n====\nJ(b) == INSTANCE Inner\nF == J(1)!L(2)!G = U1 /\\ J!L(2)!G = U2 /\\ J(1)!L(2, 3)!G = U3 /\\ J(1)!L!G = U4 /\\ J(1)!L(2)!H(3, 4) = U5",
      [
        ["line 10, col 20 to line 10, col 21", "Unknown operator: `U1'."],
        ["line 10, col 26 to line 10, col 33", "The operator J requires 1 arguments."],
        ["line 10, col 37 to line 10, col 38", "Unknown operator: `U2'."],
        ["line 10, col 49 to line 10, col 54", "The operator J!L requires 1 arguments."],
        ["line 10, col 60 to line 10, col 61", "Unknown operator: `U3'."],
        ["line 10, col 66 to line 10, col 73", "The operator J!L requires 1 arguments."],
        ["line 10, col 77 to line 10, col 78", "Unknown operator: `U4'."],
        ["line 10, col 94 to line 10, col 99", "The operator J!L!H requires 1 arguments."],
        ["line 10, col 103 to line 10, col 104", "Unknown operator: `U5'."],
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
    [
      "Id(a) == a\na^+ == a\nB == [1]\nF == (zz + 1)[2 ++ 3]\nP == Id(^+)\nD == [1].a\nf == B!1 /\\ F!1 /\\ P!1 /\\ D!1",
      [
        ["line 4, col 6 to line 4, col 6", "Unsupported expression type `['."],
        [
          "line 5, col 10 to line 5, col 10",
          "Could not find declaration or definition of symbol '+'.",
        ],
        ["line 5, col 7 to line 5, col 12", "Couldn't resolve infix operator symbol `+'."],
        ["line 6, col 9 to line 6, col 10", "The operator ^+ requires 1 arguments."],
        ["line 7, col 6 to line 7, col 6", "Unsupported expression type `['."],
        [
          "line 8, col 8 to line 8, col 8",
          "Subexpression selection failed, probably due to an error in the selected expression.",
        ],
        [
          "line 8, col 15 to line 8, col 15",
          "Subexpression selection failed, probably due to an error in the selected expression.",
        ],
        [
          "line 8, col 22 to line 8, col 22",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
        [
          "line 8, col 29 to line 8, col 29",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
        ],
      ],
    ],
    [
      "Id(a) == a\nP == Id(SUBSET)\nf == P!1",
      [
        ["line 3, col 9 to line 3, col 14", "The operator SUBSET requires 1 arguments."],
        [
          "line 4, col 8 to line 4, col 8",
          "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
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

  it.each<[string, [string, string][]]>([
    [
      "G(a, b) == a\nOp0(P0(_, _), a1) == P0(a1, a1)\nf == Op0((G), 1)",
      [
        [
          "line 4, col 10 to line 4, col 12",
          "An expression appears as argument number 1 (counting from 1) to operator 'Op0', in a position an operator is required.",
        ],
        [
          "line 4, col 6 to line 4, col 16",
          "Argument number 1 to operator 'Op0' \nshould be a 2-parameter operator.",
        ],
      ],
    ],
    [
      "G(a, b) == a\nOp0(P0(_, _), a1) == P0(a1, a1)\nf == Op0(((G)), 1)",
      [
        [
          "line 4, col 10 to line 4, col 14",
          "An expression appears as argument number 1 (counting from 1) to operator 'Op0', in a position an operator is required.",
        ],
        [
          "line 4, col 6 to line 4, col 18",
          "Argument number 1 to operator 'Op0' \nshould be a 2-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nH(a, b) == a + b\nD == H(1, 2)\nOp0(P0(_), a1) == P0(a1)\nf == Op0((D!1), 1)",
      [
        [
          "line 6, col 10 to line 6, col 14",
          "An expression appears as argument number 1 (counting from 1) to operator 'Op0', in a position an operator is required.",
        ],
        [
          "line 6, col 6 to line 6, col 18",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "---- MODULE Inner ----\nCONSTANT F(_)\n====\nG(a) == a\nI == INSTANCE Inner WITH F <- (G)",
      [
        [
          "line 6, col 31 to line 6, col 33",
          "Arity 1 operator (not an expression) is expected \nto substitute for CONSTANT 'F'.",
        ],
        [
          "In module --TLA+ BUILTINS--",
          "An operator must be substituted for symbol 'F', and it must have arity 1.",
        ],
      ],
    ],
  ])(
    "reports an operator in parentheses, which SANY reads as an expression, in %j",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({
            location: error[0].startsWith("In module") ? error[0] : `${error[0]} of module M`,
            message: error[1],
          })),
        ),
      );
    },
  );

  it.each<[string, [string, string][]]>([
    [
      "EXTENDS Naturals\nH(a, b) == a + b\nD == H(1, 2)\nOp0(P0(_), a1) == P0(a1)\nf == Op0(D!1, 1)",
      [
        ["line 6, col 10 to line 6, col 12", "Expected arity 1 but found operator of arity 0."],
        [
          "line 6, col 6 to line 6, col 16",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nD == 3 + 1\nOp0(P0(_), a1) == P0(a1)\nf == Op0(D!:, 1)",
      [
        ["line 5, col 10 to line 5, col 12", "Expected arity 1 but found operator of arity 0."],
        [
          "line 5, col 6 to line 5, col 16",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nH(a, b) == a + b\nD(p) == H(p, 2)\nOp0(P0(_), a1) == P0(a1)\nf == Op0(D(1)!1, 1)",
      [
        ["line 6, col 10 to line 6, col 10", "Selector `D' should not have argument(s)."],
        [
          "line 6, col 6 to line 6, col 19",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nD == \\A z \\in {1} : z > 0\nOp0(P0(_), a1) == P0(a1)\nf == Op0(D!(1), 1)",
      [
        ["line 5, col 12 to line 5, col 14", "Selector `!(...)' should not have argument(s)."],
        [
          "line 5, col 6 to line 5, col 18",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nD == {3 + 1}\nE == {D!1, 0}\nOp0(P0(_), a1) == P0(a1)\nf == Op0(E!1, 1)",
      [
        ["line 6, col 10 to line 6, col 12", "Expected arity 1 but found operator of arity 0."],
        [
          "line 6, col 6 to line 6, col 16",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nD == {3 + 1}\nOp0(P0(_), a1) == P0(a1)\nf == LET E == {D!1, 0} IN Op0(E!1, 1)",
      [
        ["line 5, col 31 to line 5, col 33", "Expected arity 1 but found operator of arity 0."],
        [
          "line 5, col 27 to line 5, col 37",
          "Argument number 1 to operator 'Op0' \nshould be a 1-parameter operator.",
        ],
      ],
    ],
  ])(
    "checks a selection without parameters as an operator argument in %j like SANY",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it.each([
    [
      "a constant",
      "I0 == INSTANCE Inner WITH F <- LAMBDA c : 1",
      "line 3, col 39 to line 3, col 39",
      "c",
      "line 2, col 10 to line 2, col 10",
    ],
    [
      "a parameter of the instance",
      "I0(p) == INSTANCE Inner WITH F <- LAMBDA p : 1",
      "line 3, col 42 to line 3, col 42",
      "p",
      "line 3, col 4 to line 3, col 4",
    ],
    [
      "an earlier definition",
      "G == 1\nI0 == INSTANCE Inner WITH F <- LAMBDA G : 1",
      "line 4, col 39 to line 4, col 39",
      "G",
      "line 3, col 1 to line 3, col 6",
    ],
    [
      "an earlier instance",
      "J == INSTANCE Inner WITH F <- LAMBDA q : 1\nI0 == INSTANCE Inner WITH F <- LAMBDA J : 1",
      "line 4, col 39 to line 4, col 39",
      "J",
      "line 3, col 1 to line 3, col 42",
    ],
  ])(
    "rejects a LAMBDA parameter of a substitution named after %s",
    async (_, body, location, name, existing) => {
      await expect(
        check({
          source: `---- MODULE M ----\nCONSTANT c\n${body}\n====\n`,
          config: "",
          loadModule: (module) =>
            module === "Inner" ? "---- MODULE Inner ----\nCONSTANT F(_)\n====\n" : undefined,
        }),
      ).rejects.toThrow(
        createSanyError([
          {
            location: `${location} of module M`,
            message: `Multiply-defined symbol '${name}': this definition or declaration conflicts \nwith the one at ${existing} of module M.`,
          },
        ]),
      );
    },
  );

  it.each([
    ["Op0 == lab:: 1 |- 2\nU == Op0!2!1", "line 3, col 6 to line 3, col 8", "Op0", 14],
    [
      "Op0 == {lab:: 1 |- 2}\nU == Op0!1!1",
      "line 3, col 10 to line 3, col 10",
      "argument selector 1",
      15,
    ],
  ])(
    "reports a selection through a failed label in %j at the selector before it",
    async (source, location, name, column) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError([
          {
            location: `line 2, col ${column + 2} to line 2, col ${column + 3} of module M`,
            message: "Could not find declaration or definition of symbol '|-'.",
          },
          {
            location: `line 2, col ${column} to line 2, col ${column + 5} of module M`,
            message: "Couldn't resolve infix operator symbol `|-'.",
          },
          {
            location: `${location} of module M`,
            message: `An unexpected null node specified by '${name}'.\nThis is probably due to a previous error.`,
          },
        ]),
      );
    },
  );

  it.each([
    ["F == LET G == 1 IN [TRUE]", "line 2, col 20 to line 2, col 20"],
    ["F(a) == a\nG == F([TRUE])", "line 3, col 8 to line 3, col 8"],
  ])("rejects a bracket without a subscript in %j", async (source, location) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError([
        { location: `${location} of module M`, message: "Unsupported expression type `['." },
      ]),
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

  it("checks the arguments of a function from EXTENDS or an instance without substitutions like SANY", async () => {
    const modules = new Map([
      ["Base", "---- MODULE Base ----\nf[n \\in {1}] == n\n===="],
      ["Param", "---- MODULE Param ----\nEXTENDS Base\nCONSTANT c\ng[n \\in {c}] == n\n===="],
    ]);
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Base\nI == INSTANCE Base\nJ(p) == INSTANCE Base\nK == INSTANCE Param WITH c <- 1\nA == f[1, 2] /\\ I!f[1, 2] /\\ J(0)!f[1, 2]\nB == K!f[1, 2] /\\ K!g[1, 2]\nC == LET L == INSTANCE Base IN L!f[1, 2]\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
        loadModule: (name) => modules.get(name),
      }),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          ["line 6, col 6 to line 6, col 12", "f"],
          ["line 6, col 17 to line 6, col 25", "I!f"],
          ["line 6, col 30 to line 6, col 41", "J!f"],
          ["line 8, col 32 to line 8, col 40", "L!f"],
        ].map((error) => ({
          location: `${error[0]} of module M`,
          message: `Function '${error[1]}' is defined with 1 parameters, but is applied to 2 arguments.`,
        })),
        warnings: [],
      },
    });
  });

  it("locates the identifier of an unbounded CHOOSE at the CHOOSE", async () => {
    await expect(checkNames("F == CHOOSE v : CHOOSE v : TRUE")).rejects.toThrow(
      createSanyError([
        {
          location: "line 2, col 17 to line 2, col 22 of module M",
          message:
            "Multiply-defined symbol 'v': this definition or declaration conflicts \nwith the one at line 2, col 6 to line 2, col 11 of module M.",
        },
      ]),
    );
  });

  it("reads EXTENDS as the first field of a record, not as a module's EXTENDS", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nASSUME [EXTENDS |-> 3, a |-> 1].a = 1\nVARIABLE v\nInit == v = 0\nNext == UNCHANGED v\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
  });

  it("imports the name of an instance a module defines like SANY", async () => {
    const modules = new Map([
      ["Empty", "---- MODULE Empty ----\n===="],
      ["Inner", "---- MODULE Inner ----\nL == INSTANCE Empty\nP(a) == INSTANCE Empty\n===="],
    ]);
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Inner\nJ == INSTANCE Inner\nK(b) == INSTANCE Empty\nA == L\nB == J!L /\\ J!P /\\ J!P(1)\nC == J!L!1 /\\ K /\\ K(1, 2)\nD == LET N == INSTANCE Inner IN N!L\nP == 1\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
        loadModule: (name) => modules.get(name),
      }),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          ["line 5, col 6 to line 5, col 6", "Operator name L is incomplete."],
          ["line 6, col 8 to line 6, col 8", "Operator name J!L is incomplete."],
          ["line 6, col 13 to line 6, col 15", "The operator J!P requires 1 arguments."],
          ["line 6, col 22 to line 6, col 22", "Operator name J!P is incomplete."],
          ["line 7, col 6 to line 7, col 8", "Unknown operator: `J!L'."],
          ["line 7, col 15 to line 7, col 15", "The operator K requires 1 arguments."],
          ["line 7, col 21 to line 7, col 26", "The operator K requires 1 arguments."],
          ["line 8, col 35 to line 8, col 35", "Operator name N!L is incomplete."],
          ["line 9, col 1 to line 9, col 6", "Operator P already defined or declared."],
          [
            "line 9, col 1 to line 9, col 6",
            "Multiply-defined symbol 'P': this definition or declaration conflicts \nwith the one at line 3, col 1 to line 3, col 22 of module Inner.",
          ],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      },
    });
  });

  it.each([
    [
      "X == Foo!3",
      "ASSUME TRUE PROVE TRUE",
      "line 3, col 10 to line 3, col 10",
      "Nonexistent operand specified by `argument selector 3'.",
    ],
    [
      "X == Foo",
      "ASSUME TRUE PROVE TRUE",
      "line 3, col 6 to line 3, col 8",
      "ASSUME/PROVE used where an expression is required.",
    ],
    [
      "X == Foo!1",
      "ASSUME NEW y PROVE y = y",
      "line 3, col 6 to line 3, col 10",
      "Selected a NEW declaration as an expression or operator.",
    ],
  ])(
    "rejects %j of an extended %j theorem like SANY",
    async (use, statement, location, message) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS Base\n${use}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
          config: "INIT Init\nNEXT Next",
          loadModule: (name) =>
            name === "Base"
              ? `---- MODULE Base ----\nTHEOREM Foo == ${statement}\n====`
              : undefined,
        }),
      ).rejects.toMatchObject({
        sany: { errors: [{ location: `${location} of module M`, message }] },
      });
    },
  );

  it("names an operator of an extended module as it is spelled", async () => {
    const modules = new Map([
      ["Inner", "---- MODULE Inner ----\nCONSTANT Op(_)\n===="],
      [
        "Mid",
        "---- MODULE Mid ----\na ++ b == a\nG(a, b) == a\nH(x) == x\nK == INSTANCE Inner WITH Op <- G\nL == H(++)\n====",
      ],
    ]);
    await expect(
      check({
        source: "---- MODULE M ----\nEXTENDS Mid\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
        loadModule: (name) => modules.get(name),
      }),
    ).rejects.toMatchObject({
      sany: {
        errors: [
          {
            location: "line 5, col 32 to line 5, col 32 of module Mid",
            message: "Expected arity 1 but found operator of arity 2.",
          },
          {
            location: "In module --TLA+ BUILTINS--",
            message: "An operator must be substituted for symbol 'Op', and it must have arity 1.",
          },
          {
            location: "line 6, col 8 to line 6, col 9 of module Mid",
            message: "The operator ++ requires 2 arguments.",
          },
        ],
      },
    });
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
      "a definition of a declared constant or an imported operator, and refers to the first",
      "EXTENDS Naturals\nCONSTANT c\nc(a) == 1\nNat(a) == 2\nA == c\nB == Nat\nC == LET D == c IN D",
      [
        {
          location: "line 4, col 1 to line 4, col 9 of module M",
          message: "Operator c already defined or declared.",
        },
        {
          location: "line 4, col 1 to line 4, col 9 of module M",
          message:
            "Multiply-defined symbol 'c': this definition or declaration conflicts \nwith the one at line 3, col 10 to line 3, col 10 of module M.",
        },
        {
          location: "line 5, col 1 to line 5, col 11 of module M",
          message: "Operator Nat already defined or declared.",
        },
        {
          location: "line 5, col 1 to line 5, col 11 of module M",
          message:
            "Multiply-defined symbol 'Nat': this definition or declaration conflicts \nwith the one at line 14, col 1 to line 14, col 16 of module Naturals.",
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
      "selections substituted for a CONSTANT operator",
      "---- MODULE Inner ----\nCONSTANT F(_)\n====\nCONSTANT c\nW == {c, 2}\nU(a, b) == {a, b}\nL == lab :: {1}\nI == INSTANCE Inner WITH F <- W!1\nJ == INSTANCE Inner WITH F <- U!1\nK == INSTANCE Inner WITH F <- W!3\nN == INSTANCE Inner WITH F <- L!lab",
      [
        ["line 9, col 31 to line 9, col 33", "Expected arity 1 but found operator of arity 0."],
        [
          "In module --TLA+ BUILTINS--",
          "An operator must be substituted for symbol 'F', and it must have arity 1.",
        ],
        ["line 10, col 31 to line 10, col 33", "Expected arity 1 but found operator of arity 2."],
        [
          "line 11, col 33 to line 11, col 33",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        ["line 12, col 31 to line 12, col 35", "Expected arity 1 but found operator of arity 0."],
      ].map((error) => ({
        location: error[0].startsWith("In") ? error[0] : `${error[0]} of module M`,
        message: error[1],
      })),
      [],
    ],
    [
      "labels inside the arguments of a rejected application",
      "H(a) == a\nOp(P(_)) == P(1, lab:: 2)\nG == H(1, lab:: 2) /\\ Undef(other:: 3) /\\ H(kept:: 1)!Nope\nA == G!lab\nB == G!other\nC == Op(Op(Op))!lab\nD == G!kept\nTHEOREM TRUE\n<1>1. H(1, lab:: 2) /\\ H(kept:: 1)!Nope /\\ H(lost:: 1, 2)!1\n  <2> QED BY <1>1!lab, <1>1!kept, <1>1!lost\n<1> QED",
      [
        ["line 3, col 14 to line 3, col 25", "The operator P requires 1 arguments."],
        ["line 4, col 7 to line 4, col 18", "The operator H requires 1 arguments."],
        ["line 4, col 23 to line 4, col 27", "Unknown operator: `Undef'."],
        ["line 4, col 55 to line 4, col 58", "Cannot find label `Nope'."],
        ["line 5, col 8 to line 5, col 10", "Cannot find label `lab'."],
        ["line 6, col 8 to line 6, col 12", "Cannot find label `other'."],
        [
          "line 7, col 9 to line 7, col 14",
          "An expression appears as argument number 1 (counting from 1) to operator 'Op', in a position an operator is required.",
        ],
        ["line 7, col 17 to line 7, col 19", "Cannot find label `lab'."],
        ["line 10, col 8 to line 10, col 19", "The operator H requires 1 arguments."],
        ["line 10, col 36 to line 10, col 39", "Cannot find label `Nope'."],
        ["line 10, col 45 to line 10, col 57", "The operator H requires 1 arguments."],
        ["line 11, col 19 to line 11, col 21", "Cannot find label `lab'."],
        ["line 11, col 40 to line 11, col 43", "Cannot find label `lost'."],
      ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      [],
    ],
    [
      "a function applied to the wrong number of arguments",
      "f[n \\in {1}] == n\ng[a, b \\in {1}, <<c, d>> \\in {<<1, 2>>}] == a\nh[n \\in {1}] == IF n = 0 THEN 0 ELSE h[1, 2]\nA == f[1, 2] /\\ (f)[1, Undef]\nB == g[1, 2] /\\ g[<<1, 2, 3>>] /\\ g[1, 2, 3]\nC == LET k[n \\in {1}] == n IN k[1, 2]\nD == (lab:: f)[1, 2] /\\ f[1, lab2:: 2]\nE == D!lab /\\ D!lab2",
      [
        ["line 5, col 6 to line 5, col 12", "f", 1],
        ["line 5, col 17 to line 5, col 29", "f", 1],
        ["line 6, col 6 to line 6, col 12", "g", 3],
        ["line 7, col 31 to line 7, col 37", "k", 1],
        ["line 8, col 25 to line 8, col 38", "f", 1],
      ]
        .map((error) => ({
          location: `${error[0]} of module M`,
          message: `Function '${error[1]}' is defined with ${error[2]} parameters, but is applied to 2 arguments.`,
        }))
        .concat({
          location: "line 9, col 17 to line 9, col 20 of module M",
          message: "Cannot find label `lab2'.",
        }),
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
    [
      "a selection into a name defined twice",
      "Foo == 1 = 1\nFoo == TRUE\nX == Foo!1",
      [
        {
          location: "line 3, col 1 to line 3, col 11 of module M",
          message: "Operator Foo already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 11 of module M",
          message:
            "Multiple declarations or definitions for symbol Foo.  \nThis duplicates the one at line 2, col 1 to line 2, col 12 of module M.",
        },
      ],
    ],
    [
      "a selection from an inner module into a name defined twice",
      "Foo == 1 = 1\nFoo == TRUE\n---- MODULE Inner ----\nX == Foo!1\n====",
      [
        {
          location: "line 3, col 1 to line 3, col 11 of module M",
          message: "Operator Foo already defined or declared.",
        },
      ],
      [
        {
          location: "line 3, col 1 to line 3, col 11 of module M",
          message:
            "Multiple declarations or definitions for symbol Foo.  \nThis duplicates the one at line 2, col 1 to line 2, col 12 of module M.",
        },
      ],
    ],
    [
      "a selection through an instance into a name its module defines twice",
      "---- MODULE Inner ----\nFoo == 1 = 1\nLOCAL Foo == TRUE\n====\nI == INSTANCE Inner\nX == I!Foo!1",
      [
        {
          location: "line 4, col 1 to line 4, col 17 of module M",
          message: "Operator Foo already defined or declared.",
        },
      ],
      [
        {
          location: "line 4, col 1 to line 4, col 17 of module M",
          message:
            "Multiple declarations or definitions for symbol Foo.  \nThis duplicates the one at line 3, col 1 to line 3, col 12 of module M.",
        },
      ],
    ],
    [
      "a selection into a theorem name an instance imported first",
      "---- MODULE Base ----\nFoo == 1 = 1\n====\nINSTANCE Base\nTHEOREM Foo == TRUE\nX == Foo!1",
      [
        {
          location: "line 6, col 1 to line 6, col 19 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 3, col 1 to line 3, col 12 of module M.",
        },
      ],
      [],
    ],
    [
      "a selection into a definition named like a later ASSUME/PROVE theorem",
      "Foo == {1, 2, 3}\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\nX == Foo!3",
      [
        {
          location: "line 3, col 1 to line 3, col 37 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 16 of module M.",
        },
      ],
      [],
    ],
    [
      "a selection from an inner module into an ASSUME/PROVE theorem named like a later definition",
      "THEOREM Foo == ASSUME TRUE PROVE TRUE\nFoo == {1, 2, 3}\n---- MODULE Inner ----\nX == Foo!3\n====",
      [
        {
          location: "line 3, col 1 to line 3, col 16 of module M",
          message: "Operator Foo already defined or declared.",
        },
        {
          location: "line 3, col 1 to line 3, col 16 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 2, col 1 to line 2, col 37 of module M.",
        },
        {
          location: "line 5, col 10 to line 5, col 10 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
      ],
      [],
    ],
    [
      "a selection from an inner module into an ASSUME/PROVE theorem",
      "THEOREM Foo == ASSUME TRUE PROVE TRUE\n---- MODULE Inner ----\nX == Foo!3\n====",
      [
        {
          location: "line 4, col 10 to line 4, col 10 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
      ],
      [],
    ],
    [
      "a definition named like an ASSUME/PROVE theorem a later INSTANCE imports",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nFoo == {1, 2, 3}\nINSTANCE Base\nX == Foo!3",
      [
        {
          location: "line 3, col 1 to line 3, col 37 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 5, col 1 to line 5, col 16 of module M.",
        },
      ],
      [],
    ],
    [
      "a definition named like an ASSUME/PROVE theorem an INSTANCE with substitutions imports",
      "---- MODULE Base ----\nCONSTANT c\nTHEOREM Foo == ASSUME c PROVE TRUE\n====\nFoo == 1\nINSTANCE Base WITH c <- TRUE",
      [
        {
          location: "line 7, col 1 to line 7, col 28 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 6, col 1 to line 6, col 8 of module M.",
        },
      ],
      [],
    ],
    [
      "a definition named like an ASSUME/PROVE theorem an instanced module extends",
      "---- MODULE P ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\n---- MODULE Base ----\nEXTENDS P\n====\nFoo == 1\nINSTANCE Base",
      [
        {
          location: "line 3, col 1 to line 3, col 37 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 8, col 1 to line 8, col 8 of module M.",
        },
      ],
      [],
    ],
    [
      "a selection into a theorem an instance with substitutions reuses from a module without parameters, which SANY never imports",
      "---- MODULE P ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\n---- MODULE Base ----\nEXTENDS P\nCONSTANT c\n====\nINSTANCE Base WITH c <- 1\nX == Foo!3",
      [
        {
          location: "line 10, col 6 to line 10, col 8 of module M",
          message: "Unknown operator: `Foo'.",
        },
      ],
      [],
    ],
    [
      "a definition named like one a LOCAL INSTANCE imports, at the instance",
      "---- MODULE Base ----\nFoo == 1\n====\nLOCAL INSTANCE Base\nFoo == 2",
      [
        {
          location: "line 6, col 1 to line 6, col 8 of module M",
          message: "Operator Foo already defined or declared.",
        },
      ],
      [
        {
          location: "line 6, col 1 to line 6, col 8 of module M",
          message:
            "Multiple declarations or definitions for symbol Foo.  \nThis duplicates the one at line 5, col 1 to line 5, col 19 of module M.",
        },
      ],
    ],
    [
      "a definition named like an ASSUME/PROVE theorem a LOCAL INSTANCE imports, at the instance",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nLOCAL INSTANCE Base\nFoo == 1",
      [
        {
          location: "line 6, col 1 to line 6, col 8 of module M",
          message: "Operator Foo already defined or declared.",
        },
        {
          location: "line 6, col 1 to line 6, col 8 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 5, col 1 to line 5, col 19 of module M.",
        },
      ],
      [],
    ],
    [
      "an ASSUME/PROVE theorem a LOCAL INSTANCE imports after a definition of its name, at the instance",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nFoo == 1\nLOCAL INSTANCE Base",
      [
        {
          location: "line 6, col 1 to line 6, col 19 of module M",
          message:
            "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 5, col 1 to line 5, col 8 of module M.",
        },
      ],
      [],
    ],
    [
      "a selection into an ASSUME/PROVE theorem an INSTANCE imports",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nINSTANCE Base\nX == Foo!3",
      [
        {
          location: "line 6, col 10 to line 6, col 10 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
      ],
      [],
    ],
    [
      "a selection through a named instance into an ASSUME/PROVE theorem",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nI == INSTANCE Base\nX == I!Foo!3",
      [
        {
          location: "line 6, col 12 to line 6, col 12 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
      ],
      [],
    ],
    [
      "a selection through a named instance into the NEW clause of a theorem",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME NEW y PROVE y = y\n====\nI == INSTANCE Base\nX == I!Foo!1",
      [
        {
          location: "line 6, col 6 to line 6, col 12 of module M",
          message: "Selected a NEW declaration as an expression or operator.",
        },
      ],
      [],
    ],
    [
      "an ASSUME/PROVE theorem a named instance imports, used as an expression",
      "---- MODULE Base ----\nTHEOREM Foo == ASSUME TRUE PROVE TRUE\n====\nI == INSTANCE Base\nX == I!Foo",
      [
        {
          location: "line 6, col 6 to line 6, col 10 of module M",
          message: "ASSUME/PROVE used where an expression is required.",
        },
      ],
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
    [
      "a definition a later LOCAL INSTANCE imports, at the instance",
      "---- MODULE Base ----\nFoo == 1\n====\nFoo == 2\nLOCAL INSTANCE Base",
      "*** Warnings: 1\n\nline 6, col 1 to line 6, col 19 of module M\n\nMultiple declarations or definitions for symbol Foo.  \nThis duplicates the one at line 5, col 1 to line 5, col 8 of module M.\n\n\n",
    ],
    [
      "a definition imported by two LOCAL INSTANCEs as one definition",
      "---- MODULE Base ----\nFoo == 1\n====\nLOCAL INSTANCE Base\nLOCAL INSTANCE Base\nINSTANCE Base",
      undefined,
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

  it("reports DEF clause entries that aren't names like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nA == 1\nB == 2\nTHEOREM TRUE BY DEF A + 1, {}, -A, A(1)\nTHEOREM TRUE BY DEF (A), A', <<A>>, A[1]\nUSE DEF A.b, B\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 5, col 21 to line 5, col 25", "Was expecting a GeneralId."],
          ["line 5, col 23 to line 5, col 23", "Unexpected token found."],
          [
            "line 5, col 23 to line 5, col 23",
            "Need name or step number here, not `N_GenInfixOp'.",
          ],
          [
            "line 5, col 21 to line 5, col 25",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 29 to line 5, col 29", "Unexpected token found."],
          ["line 5, col 29 to line 5, col 29", "Need name or step number here, not `}'."],
          [
            "line 5, col 28 to line 5, col 29",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 32 to line 5, col 33", "Was expecting a GeneralId."],
          ["line 5, col 33 to line 5, col 33", "Unexpected token found."],
          ["line 5, col 33 to line 5, col 33", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 5, col 32 to line 5, col 33",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 36 to line 5, col 39", "Was expecting a GeneralId."],
          ["line 5, col 37 to line 5, col 39", "Selector `!(...)' should not have argument(s)."],
          [
            "line 5, col 36 to line 5, col 39",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 14 to line 5, col 39", "Empty BY"],
          ["line 6, col 22 to line 6, col 22", "Unexpected token found."],
          ["line 6, col 22 to line 6, col 22", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 6, col 21 to line 6, col 23",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 26 to line 6, col 27", "Was expecting a GeneralId."],
          ["line 6, col 27 to line 6, col 27", "Unexpected token found."],
          [
            "line 6, col 27 to line 6, col 27",
            "Need name or step number here, not `N_GenPostfixOp'.",
          ],
          [
            "line 6, col 26 to line 6, col 27",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 32 to line 6, col 32", "Unexpected token found."],
          ["line 6, col 32 to line 6, col 32", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 6, col 30 to line 6, col 34",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 37 to line 6, col 40", "Was expecting a GeneralId."],
          ["line 6, col 38 to line 6, col 38", "Unexpected token found."],
          ["line 6, col 38 to line 6, col 38", "Need name or step number here, not `['."],
          [
            "line 6, col 37 to line 6, col 40",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 14 to line 6, col 40", "Empty BY"],
          ["line 7, col 9 to line 7, col 11", "Was expecting a GeneralId."],
          ["line 7, col 10 to line 7, col 10", "Unexpected token found."],
          ["line 7, col 10 to line 7, col 10", "Need name or step number here, not `.'."],
          [
            "line 7, col 9 to line 7, col 11",
            "DEF clause entry should describe a defined operator.",
          ],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it("rejects the arguments of a name after a prefix in a DEF clause entry, where SANY crashes", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\n---- MODULE Inner ----\nB(x) == 2\n====\nI == INSTANCE Inner\nA == lab :: 1\nB == 2\nTHEOREM TRUE BY DEF A!B(1)\nTHEOREM TRUE BY DEF I!B(1), A!lab(1), B\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 8, col 23 to line 8, col 23", "Selector `B' should not have argument(s)."],
          [
            "line 8, col 21 to line 8, col 26",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 8, col 14 to line 8, col 26", "Empty BY"],
          ["line 9, col 23 to line 9, col 23", "Selector `B' should not have argument(s)."],
          [
            "line 9, col 21 to line 9, col 26",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 9, col 31 to line 9, col 33", "Selector `lab' should not have argument(s)."],
          [
            "line 9, col 29 to line 9, col 36",
            "DEF clause entry should describe a defined operator.",
          ],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it("reports DEF clause entries of bracketed, quantified and infix shapes like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nA == 1\nB == 2\nTHEOREM TRUE BY DEF CASE A -> 1 [] OTHER -> 2, [a |-> 1], [a : {}], A\nTHEOREM TRUE BY DEF [v \\in {} |-> 1], \\A v, w \\in {} : TRUE, A\nTHEOREM TRUE BY DEF LET Q == 1 IN Q, A \\X B, A /\\ B, {A \\/ B}, A\nTHEOREM TRUE BY DEF [A EXCEPT ![1] = 2], [A -> B], {A : v \\in {}}, WF_A(B), A\nTHEOREM TRUE BY DEF /\\ A\n                    /\\ B\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 4, col 26 to line 4, col 31", "Unexpected token found."],
          ["line 4, col 26 to line 4, col 31", "Need name or step number here, not `N_CaseArm'."],
          [
            "line 4, col 21 to line 4, col 45",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 4, col 49 to line 4, col 55", "Unexpected token found."],
          ["line 4, col 49 to line 4, col 55", "Need name or step number here, not `N_FieldVal'."],
          [
            "line 4, col 48 to line 4, col 56",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 4, col 60 to line 4, col 65", "Unexpected token found."],
          ["line 4, col 60 to line 4, col 65", "Need name or step number here, not `N_FieldSet'."],
          [
            "line 4, col 59 to line 4, col 66",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 22 to line 5, col 29", "Unexpected token found."],
          [
            "line 5, col 22 to line 5, col 29",
            "Need name or step number here, not `N_QuantBound'.",
          ],
          [
            "line 5, col 21 to line 5, col 36",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 5, col 42 to line 5, col 52", "Unexpected token found."],
          [
            "line 5, col 42 to line 5, col 52",
            "Need name or step number here, not `N_QuantBound'.",
          ],
          [
            "line 5, col 39 to line 5, col 59",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 25 to line 6, col 30", "Unexpected token found."],
          [
            "line 6, col 25 to line 6, col 30",
            "Need name or step number here, not `N_LetDefinitions'.",
          ],
          [
            "line 6, col 21 to line 6, col 35",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 38 to line 6, col 43", "Was expecting a GeneralId."],
          ["line 6, col 40 to line 6, col 41", "Unexpected token found."],
          [
            "line 6, col 40 to line 6, col 41",
            "Need name or step number here, not `N_GenInfixOp'.",
          ],
          [
            "line 6, col 38 to line 6, col 43",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 46 to line 6, col 51", "Was expecting a GeneralId."],
          ["line 6, col 48 to line 6, col 49", "Unexpected token found."],
          [
            "line 6, col 48 to line 6, col 49",
            "Need name or step number here, not `N_GenInfixOp'.",
          ],
          [
            "line 6, col 46 to line 6, col 51",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 6, col 55 to line 6, col 60", "Unexpected token found."],
          ["line 6, col 55 to line 6, col 60", "Need name or step number here, not `N_InfixExpr'."],
          [
            "line 6, col 54 to line 6, col 61",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 7, col 22 to line 7, col 22", "Unexpected token found."],
          ["line 7, col 22 to line 7, col 22", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 7, col 21 to line 7, col 39",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 7, col 43 to line 7, col 43", "Unexpected token found."],
          ["line 7, col 43 to line 7, col 43", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 7, col 42 to line 7, col 49",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 7, col 53 to line 7, col 53", "Unexpected token found."],
          ["line 7, col 53 to line 7, col 53", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 7, col 52 to line 7, col 65",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 7, col 71 to line 7, col 71", "Unexpected token found."],
          ["line 7, col 71 to line 7, col 71", "Need name or step number here, not `N_GeneralId'."],
          [
            "line 7, col 68 to line 7, col 74",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 8, col 21 to line 9, col 24", "Was expecting a GeneralId."],
          ["line 9, col 21 to line 9, col 24", "Unexpected token found."],
          ["line 9, col 21 to line 9, col 24", "Need name or step number here, not `N_ConjItem'."],
          [
            "line 8, col 21 to line 9, col 24",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 8, col 14 to line 9, col 24", "Empty BY"],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it("looks up the name a binder declares in a DEF clause entry, and rejects decimals, like SANY", async () => {
    const DEF_ERROR = "DEF clause entry should describe a defined operator.";
    await expect(
      check({
        source:
          "---- MODULE M ----\nCONSTANT K\nA == 1\nB == 2\nTHEOREM TRUE BY DEF CHOOSE v : TRUE, \\E v, w : TRUE, {v \\in {} : TRUE}, A\nTHEOREM TRUE BY DEF CHOOSE <<a, b>> \\in {} : TRUE, {<<a, b>> \\in {} : TRUE}, 12.50, A\nTHEOREM TRUE BY DEF CHOOSE A : TRUE, CHOOSE K : TRUE, \\AA v : TRUE\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 5, col 28 to line 5, col 28", "Unknown operator: `v'."],
          ["line 5, col 21 to line 5, col 35", DEF_ERROR],
          ["line 5, col 41 to line 5, col 41", "Unknown operator: `v'."],
          ["line 5, col 38 to line 5, col 51", DEF_ERROR],
          ["line 5, col 55 to line 5, col 55", "Unknown operator: `v'."],
          ["line 5, col 54 to line 5, col 70", DEF_ERROR],
          ["line 6, col 28 to line 6, col 35", "Unexpected token found."],
          [
            "line 6, col 28 to line 6, col 35",
            "Need name or step number here, not `N_IdentifierTuple'.",
          ],
          ["line 6, col 21 to line 6, col 49", DEF_ERROR],
          ["line 6, col 53 to line 6, col 60", "Unexpected token found."],
          [
            "line 6, col 53 to line 6, col 60",
            "Need name or step number here, not `N_IdentifierTuple'.",
          ],
          ["line 6, col 52 to line 6, col 75", DEF_ERROR],
          ["line 6, col 80 to line 6, col 80", "Unexpected token found."],
          ["line 6, col 80 to line 6, col 80", "Need name or step number here, not `.'."],
          ["line 6, col 78 to line 6, col 82", DEF_ERROR],
          ["line 7, col 38 to line 7, col 52", DEF_ERROR],
          ["line 7, col 59 to line 7, col 59", "Unknown operator: `v'."],
          ["line 7, col 55 to line 7, col 66", DEF_ERROR],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("rejects a number or a string as a DEF clause entry, where SANY crashes", async () => {
    await expect(
      check({
        source: '---- MODULE M ----\nA == 1\nTHEOREM TRUE BY DEF 1, "s", A\n====',
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        ["line 3, col 21 to line 3, col 21", "line 3, col 24 to line 3, col 26"].map(
          (location) => ({
            location: `${location} of module M`,
            message: "DEF clause entry should describe a defined operator.",
          }),
        ),
      ),
    );
  });

  it("rejects a DEF clause entry whose first child nests, where SANY reports line 2147483647", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nA == 1\nB == 2\nf == [x \\in {1} |-> x]\nF(x) == x\nTHEOREM TRUE BY DEF A + B + A, A /\\ B /\\ A, f[1] + B, A'', F(A)[1], A\n====",
        config: "",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          "line 6, col 21 to line 6, col 29",
          "line 6, col 32 to line 6, col 42",
          "line 6, col 45 to line 6, col 52",
          "line 6, col 55 to line 6, col 57",
          "line 6, col 60 to line 6, col 66",
        ].map((location) => ({
          location: `${location} of module M`,
          message: "DEF clause entry should describe a defined operator.",
        })),
      ),
    );
  });

  it("rejects a one-item junction list as a DEF clause entry, where SANY crashes", async () => {
    await expect(
      check({ source: "---- MODULE M ----\nA == 1\nTHEOREM TRUE BY DEF /\\ A\n====", config: "" }),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 21 to line 3, col 24 of module M",
          message: "DEF clause entry should describe a defined operator.",
        },
        { location: "line 3, col 14 to line 3, col 24 of module M", message: "Empty BY" },
      ]),
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

  it.each<[string, [string, string][]]>([
    [
      "THEOREM Thm3 == G0(1)!1!2\nHIDE Thm3!:",
      [
        ["line 2, col 17 to line 2, col 18 of module M", "Unknown operator: `G0'."],
        [
          "line 3, col 6 to line 3, col 11 of module M",
          "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        ],
      ],
    ],
    [
      "Op == Unk + 1\nHIDE Op!:",
      [
        [
          "line 2, col 11 to line 2, col 11 of module M",
          "Could not find declaration or definition of symbol '+'.",
        ],
        [
          "line 2, col 7 to line 2, col 13 of module M",
          "Couldn't resolve infix operator symbol `+'.",
        ],
        [
          "line 3, col 9 to line 3, col 9 of module M",
          "An unexpected null node specified by ':'.\nThis is probably due to a previous error.",
        ],
        [
          "In module --TLA+ BUILTINS--",
          "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        ],
      ],
    ],
  ])("locates a selection hidden in %j like SANY", async (source, errors) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError(errors.map((entry) => ({ location: entry[0], message: entry[1] }))),
    );
  });

  it("reports a HIDE fact whose operator SANY can't resolve, where SANY crashes", async () => {
    await expect(checkNames("CONSTANT c\nHIDE -c")).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 6 to line 3, col 6 of module M",
          message: "Could not find declaration or definition of symbol '-.'.",
        },
        {
          location: "line 3, col 6 to line 3, col 7 of module M",
          message: "Couldn't resolve prefix operator symbol `-.'.",
        },
        {
          location: "In module --TLA+ BUILTINS--",
          message:
            "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        },
      ]),
    );
  });

  it("accepts a selection as a DEF entry only when it ends on a LET definition, like SANY", async () => {
    const message = "DEF clause entry should describe a defined operator.";
    await expect(
      checkNames(
        "CONSTANT c\nOp == lab:: {LET L == 1 IN L, 2}\nTHEOREM TRUE\n<1>1. USE TRUE\n<1> USE DEF c!G, Op!G, Op!lab!3, Op!lab, Unk!1, <1>1!G, Op!lab!1!L\n<1> QED",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 6, col 13 to line 6, col 13", "Cannot take subexpression of `c'."],
          ["line 6, col 13 to line 6, col 15", message],
          ["line 6, col 21 to line 6, col 21", "Cannot find label `G'."],
          ["line 6, col 18 to line 6, col 21", message],
          [
            "line 6, col 31 to line 6, col 31",
            "Nonexistent operand specified by `argument selector 3'.",
          ],
          ["line 6, col 24 to line 6, col 31", message],
          ["line 6, col 34 to line 6, col 39", message],
          ["line 6, col 42 to line 6, col 44", "Unknown operator: `Unk'."],
          ["line 6, col 42 to line 6, col 46", message],
          ["line 6, col 49 to line 6, col 52", "Cannot take subexpression of `<1>1'."],
          ["line 6, col 49 to line 6, col 54", message],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it("accepts only a definition step as a DEF entry like SANY", async () => {
    const message = "DEF clause entry should describe a defined operator.";
    await expect(
      checkNames(
        "THEOREM TRUE\n<1>1. DEFINE G == 1\n<1>2. USE TRUE\n<1>3. TRUE\n  OBVIOUS\n<1> USE DEF <1>1, <1>2, <1>3, <1>4\n<1> QED",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 7, col 19 to line 7, col 22", "DEF clause entry refers to a non-definition step."],
          ["line 7, col 19 to line 7, col 22", message],
          ["line 7, col 25 to line 7, col 28", message],
          ["line 7, col 31 to line 7, col 34", "Unknown operator: `<1>4'."],
          ["line 7, col 31 to line 7, col 34", message],
        ].map((entry) => ({ location: `${entry[0]} of module M`, message: entry[1] })),
      ),
    );
  });

  it.each<[string, [string, string][]]>([
    [
      "CONSTANT c\nHIDE MODULE Naturals DEF Thm9, c",
      [
        [
          "line 3, col 13 to line 3, col 20",
          "Module `Naturals' used without being extended or instantiated.",
        ],
        ["line 3, col 26 to line 3, col 29", "Unknown operator: `Thm9'."],
        [
          "line 3, col 26 to line 3, col 29",
          "DEF clause entry should describe a defined operator.",
        ],
        [
          "line 3, col 32 to line 3, col 32",
          "DEF clause entry should describe a defined operator.",
        ],
        ["line 3, col 1 to line 3, col 32", "Empty USE or HIDE statement."],
      ],
    ],
    [
      "USE MODULE Inner\n---- MODULE Inner ----\n====",
      [
        [
          "line 2, col 12 to line 2, col 16",
          "Module `Inner' used without being extended or instantiated.",
        ],
        ["line 2, col 1 to line 2, col 16", "Empty USE or HIDE statement."],
      ],
    ],
    [
      "THEOREM TRUE\nBY MODULE Foo",
      [
        [
          "line 3, col 11 to line 3, col 13",
          "Module `Foo' used without being extended or instantiated.",
        ],
        ["line 3, col 1 to line 3, col 13", "Empty BY"],
      ],
    ],
    [
      "Op == 1\nUSE MODULE Naturals, Op DEF MODULE TLC, Op",
      [
        [
          "line 3, col 12 to line 3, col 19",
          "Module `Naturals' used without being extended or instantiated.",
        ],
        [
          "line 3, col 36 to line 3, col 38",
          "Module `TLC' used without being extended or instantiated.",
        ],
      ],
    ],
  ])("reports a module fact in %j that SANY has not processed", async (source, errors) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError(
        errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("accepts module facts for the modules SANY has processed and the inner modules before them", async () => {
    await expect(
      checkNames(
        "EXTENDS Sequences\n---- MODULE Inner ----\nEXTENDS FiniteSets\nUSE MODULE FiniteSets, MODULE Naturals, MODULE Inner\n====\n---- MODULE Other ----\nLOCAL INSTANCE TLC\n====\nI == INSTANCE Other\nUSE MODULE Naturals, MODULE Inner, MODULE M, MODULE TLC, MODULE FiniteSets DEF MODULE Other",
      ),
    ).resolves.toMatchObject({ status: "success" });
  });

  it("accepts a module fact for a module that only a later proof step instantiates, like SANY", async () => {
    await expect(
      checkNames(
        "USE MODULE FiniteSets, MODULE Bags\nTHEOREM TRUE\n<1>1. INSTANCE FiniteSets\n<1>2. DEFINE B == INSTANCE Bags\n<1> QED",
      ),
    ).resolves.toMatchObject({ status: "success" });
  });

  const hidden =
    "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.";
  it.each<[string, string, [string, string][]]>([
    [
      "a definition or a theorem",
      "EXTENDS Naturals\nCONSTANT c\nOp == 1 + 2\nPar(p) == p + 1\nLab == lab :: 1 + 2\nTHEOREM T == 1 = 1\nHIDE Op!1\nHIDE Par!1\nHIDE Par(2)!1\nHIDE Lab!lab\nHIDE Lab!lab!1\nHIDE T!1, T!<<\nHIDE T!1, T!1\nHIDE T!:\nHIDE Op!3",
      [
        ["line 8, col 6 to line 8, col 9", hidden],
        ["line 9, col 6 to line 9, col 10", "The operator Par requires 1 arguments."],
        ["In module --TLA+ BUILTINS--", hidden],
        ["line 10, col 6 to line 10, col 13", hidden],
        ["line 11, col 6 to line 11, col 12", hidden],
        ["line 12, col 6 to line 12, col 14", hidden],
        ["line 13, col 6 to line 13, col 8", hidden],
        ["line 13, col 11 to line 13, col 14", hidden],
        ["line 14, col 6 to line 14, col 8", hidden],
        ["line 14, col 11 to line 14, col 13", hidden],
        ["line 15, col 6 to line 15, col 8", hidden],
        [
          "line 16, col 9 to line 16, col 9",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
      ],
    ],
    [
      "an ASSUME/PROVE theorem",
      "EXTENDS Naturals\nTHEOREM U == ASSUME NEW c, c = 1, ASSUME TRUE PROVE TRUE PROVE c = 1\nHIDE U!1\nHIDE U!2\nHIDE U!3\nHIDE U!4\nHIDE U!2!1\nHIDE U!:\nHIDE U!5",
      [
        [
          "line 5, col 8 to line 5, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        ["In module --TLA+ BUILTINS--", hidden],
        [
          "line 6, col 8 to line 6, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 7, col 8 to line 7, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 8, col 8 to line 8, col 8",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        [
          "line 10, col 8 to line 10, col 8",
          "Nonexistent operand specified by `argument selector 5'.",
        ],
      ],
    ],
    [
      "a proof step",
      "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. 2 = 2\n  OBVIOUS\n<1>2. ASSUME NEW d PROVE d = d\n  OBVIOUS\n<1>3. 3 = 3\n  <2>1. HIDE <1>1!1\n  <2>2. HIDE <1>2!1\n  <2>3. HIDE <1>2!2\n  <2>4. HIDE <1>1\n  <2>5. HIDE <1>1!:\n  <2>6. HIDE <1>1!9\n  <2>7. QED\n<1>4. QED",
      [
        ["line 9, col 14 to line 9, col 19", hidden],
        [
          "line 11, col 19 to line 11, col 19",
          "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
        ],
        ["In module --TLA+ BUILTINS--", hidden],
        ["line 13, col 14 to line 13, col 19", hidden],
        [
          "line 14, col 19 to line 14, col 19",
          "Nonexistent operand specified by `argument selector 9'.",
        ],
      ],
    ],
    [
      "a LET or a quantifier",
      "EXTENDS Naturals\nOp == LET L == 1 + 2 IN L\nF == \\A x \\in {1} : x = 1\nHIDE Op!L\nHIDE Op!1\nHIDE F!1\nHIDE F!@\nHIDE F!(1)",
      [
        ["line 5, col 9 to line 5, col 9", "Cannot find label `L'."],
        ["In module --TLA+ BUILTINS--", hidden],
        ["line 6, col 6 to line 6, col 9", hidden],
        ["line 7, col 6 to line 7, col 8", hidden],
        ["line 8, col 6 to line 8, col 8", "Expected 1 arguments but found 0."],
        ["line 9, col 6 to line 9, col 10", hidden],
      ],
    ],
  ])(
    "reports HIDE facts that select a subexpression of %s like SANY",
    async (_name, source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({
            location: error[0].startsWith("In module") ? error[0] : `${error[0]} of module M`,
            message: error[1],
          })),
        ),
      );
    },
  );

  it.each<[string, string, string]>([
    [
      "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. T!1 = 1\n  OBVIOUS\n<1>2. T!3 = 1\n  OBVIOUS\n<1>3. QED",
      "line 6, col 9 to line 6, col 9 of module M",
      "Nonexistent operand specified by `argument selector 3'.",
    ],
    [
      "EXTENDS Naturals\nOp == 2\nTHEOREM T == Op = 2\nPROOF BY T!1, T!<<, T!9 DEF Op",
      "line 5, col 23 to line 5, col 23 of module M",
      "Nonexistent operand specified by `argument selector 9'.",
    ],
    [
      "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. 2 = 2\n  BY T\n<1>2. QED\n  <2>1. HIDE T!1\n  <2>2. QED",
      "line 7, col 14 to line 7, col 16 of module M",
      hidden,
    ],
  ])(
    "selects from a theorem inside its own proof in %j like SANY",
    async (source, location, message) => {
      await expect(checkNames(source)).rejects.toThrow(createSanyError([{ location, message }]));
    },
  );

  it("resolves a selection through an instance in a proof like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\n---- MODULE Inner ----\nOp == 1 + 2\n====\nI == INSTANCE Inner\nHIDE I!Op!1\nTHEOREM T == 1 = 1\n<1>1. I!Op!1 = 1\n  OBVIOUS\n<1>2. I!Op!3 = 1\n  OBVIOUS\n<1>3. QED\n  BY I!Op!4",
      ),
    ).rejects.toThrow(
      createSanyError([
        { location: "line 7, col 6 to line 7, col 11 of module M", message: hidden },
        {
          location: "line 11, col 12 to line 11, col 12 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
        {
          location: "line 14, col 11 to line 14, col 11 of module M",
          message: "Nonexistent operand specified by `argument selector 4'.",
        },
      ]),
    );
  });

  it.each<[string, [string, string][]]>([
    [
      "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z == 1\n<1>2. HIDE <1>1\n<1>3. USE <1>1\n<1>4. HIDE <1>2, <1>1!1\n<1>5. QED",
      [
        ["line 5, col 12 to line 5, col 15", "Step number of non-fact used as a fact"],
        ["In module --TLA+ BUILTINS--", hidden],
        ["line 6, col 11 to line 6, col 14", "Step number of non-fact used as a fact"],
        ["line 7, col 12 to line 7, col 15", "Step number of non-fact used as a fact"],
        ["line 7, col 18 to line 7, col 21", "Cannot take subexpression of `<1>1'."],
      ],
    ],
    [
      "EXTENDS Naturals\nCONSTANT c\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z == 1 + 2\n<1>2. <1>1!1 = 1\n  OBVIOUS\n<1>3. c!1 = 1\n  OBVIOUS\n<1>4. QED",
      [
        ["line 6, col 7 to line 6, col 10", "Cannot take subexpression of `<1>1'."],
        ["line 8, col 7 to line 8, col 7", "Cannot take subexpression of `c'."],
      ],
    ],
    [
      "EXTENDS Naturals\nCONSTANT c\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z == 1 + 2\n<1>2. HIDE <1>1!1\n<1>3. QED",
      [
        ["line 6, col 12 to line 6, col 15", "Cannot take subexpression of `<1>1'."],
        ["In module --TLA+ BUILTINS--", hidden],
      ],
    ],
    [
      "EXTENDS Naturals\nCONSTANT c\nHIDE c!1",
      [
        ["line 4, col 6 to line 4, col 6", "Cannot take subexpression of `c'."],
        ["In module --TLA+ BUILTINS--", hidden],
      ],
    ],
  ])("reports selecting from a step that is no fact in %j like SANY", async (source, errors) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError(
        errors.map((error) => ({
          location: error[0].startsWith("In module") ? error[0] : `${error[0]} of module M`,
          message: error[1],
        })),
      ),
    );
  });

  it("selects from operators that a DEFINE step defines for later steps like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z(a) == a + 1\n<1>2. Z(2)!1 = 2\n  <2>1. DEFINE Y == Z(3)!2 + 1\n  <2>2. Y!1 = Z(1)!3\n    OBVIOUS\n  <2>3. QED\n<1>3. HIDE Y!1, Z(1)!1\n<1>4. QED",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 7, col 20 to line 7, col 20 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
        {
          location: "line 10, col 12 to line 10, col 12 of module M",
          message: "Unknown operator: `Y'.",
        },
        { location: "In module --TLA+ BUILTINS--", message: hidden },
        { location: "line 10, col 17 to line 10, col 22 of module M", message: hidden },
      ]),
    );
  });

  it("selects from LET operators inside theorems and proofs like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\nCONSTANT c\nLEMMA LET L(a, P(_, _)) == a[c] IN L(LAMBDA p : 1, c)!@\n<1>1. LET K(a) == lab:: a + 1 IN K(2)!lab!3 = K(1)!1\n<1> DEFINE D == LET J(b) == {b} IN J(c)!2\n<1>2. QED",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 38 to line 4, col 49 of module M",
          message: "LAMBDA expression used where an expression is required.",
        },
        {
          location: "line 4, col 52 to line 4, col 52 of module M",
          message: "Expected arity 2 but found operator of arity 0.",
        },
        {
          location: "line 4, col 55 to line 4, col 55 of module M",
          message: "Nonexistent operand specified by `@'.",
        },
        {
          location: "line 5, col 43 to line 5, col 43 of module M",
          message: "Nonexistent operand specified by `argument selector 3'.",
        },
        {
          location: "line 6, col 41 to line 6, col 41 of module M",
          message: "Nonexistent operand specified by `argument selector 2'.",
        },
      ]),
    );
  });

  it("reports selecting through an expression that failed to resolve before later selectors like SANY", async () => {
    const failed =
      "Subexpression selection failed, probably due to an error in the selected expression.";
    const unexpected =
      "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.";
    const getPrefixErrors = (line: number, column: number, end: number) => [
      {
        location: `line ${line}, col ${column} to line ${line}, col ${column} of module M`,
        message: "Could not find declaration or definition of symbol '-.'.",
      },
      {
        location: `line ${line}, col ${column} to line ${line}, col ${end} of module M`,
        message: "Couldn't resolve prefix operator symbol `-.'.",
      },
    ];
    await expect(
      checkNames(
        "CONSTANT c\nOp1(a0) == -{c}\nOp2 == {-c, 1}\nA == Op1(1)!1!@ /\\ Op1(2)!1!9 /\\ Op2!1!1!@\nTHEOREM T == -c\nTHEOREM U == ASSUME -c PROVE c\nTHEOREM V == {-c, 1}\nB == T!1!@ /\\ U!1 /\\ V!1!1",
      ),
    ).rejects.toThrow(
      createSanyError([
        ...getPrefixErrors(3, 12, 15),
        ...getPrefixErrors(4, 9, 10),
        { location: "line 5, col 13 to line 5, col 13 of module M", message: failed },
        { location: "line 5, col 27 to line 5, col 27 of module M", message: failed },
        { location: "line 5, col 38 to line 5, col 38 of module M", message: unexpected },
        ...getPrefixErrors(6, 14, 15),
        ...getPrefixErrors(7, 21, 22),
        ...getPrefixErrors(8, 15, 16),
        { location: "line 9, col 8 to line 9, col 8 of module M", message: failed },
        { location: "line 9, col 17 to line 9, col 17 of module M", message: unexpected },
        { location: "line 9, col 24 to line 9, col 24 of module M", message: unexpected },
      ]),
    );
  });

  it("reports each selection of an expression that failed to resolve, and selecting through it, like SANY", async () => {
    const unexpected =
      "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.";
    await expect(
      checkNames(
        "CONSTANT c\nOp == {-c, 1}\nB == Op!1\nC == Op!1\nD == {Op!1, 1}\nE == D!1!1\nTHEOREM T == {Op!1, 2}\nUSE T!1!1",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 8 to line 3, col 8 of module M",
          message: "Could not find declaration or definition of symbol '-.'.",
        },
        {
          location: "line 3, col 8 to line 3, col 9 of module M",
          message: "Couldn't resolve prefix operator symbol `-.'.",
        },
        { location: "line 4, col 9 to line 4, col 9 of module M", message: unexpected },
        { location: "line 5, col 9 to line 5, col 9 of module M", message: unexpected },
        { location: "line 6, col 10 to line 6, col 10 of module M", message: unexpected },
        { location: "line 7, col 10 to line 7, col 10 of module M", message: noOperands },
        { location: "line 8, col 18 to line 8, col 18 of module M", message: unexpected },
        { location: "line 9, col 9 to line 9, col 9 of module M", message: noOperands },
      ]),
    );
  });

  it.each<[string, [string, string][]]>([
    [
      "CONSTANT Cop(_)\nOp0(a0) == Cop(inner:: a0)!1\nf == Op0(1)!inner",
      [
        ["line 3, col 12 to line 3, col 14", "Cannot take subexpression of `Cop'."],
        ["line 4, col 13 to line 4, col 17", "Cannot find label `inner'."],
      ],
    ],
    [
      "Op0(a0) == Nope(inner:: a0)!1\nf == Op0(1)!inner",
      [
        ["line 2, col 12 to line 2, col 15", "Unknown operator: `Nope'."],
        ["line 3, col 13 to line 3, col 17", "Cannot find label `inner'."],
      ],
    ],
    [
      "G(y) == {y}\nOp0(a0) == G(inner:: a0, 2)!1\nf == Op0(1)!inner",
      [
        ["line 3, col 13 to line 3, col 27", "The operator G requires 1 arguments."],
        ["line 4, col 13 to line 4, col 17", "Cannot find label `inner'."],
      ],
    ],
    [
      "G(y) == {y}\nOp0(a0) == G(inner:: a0)!3\nf == Op0(1)!inner",
      [
        [
          "line 3, col 26 to line 3, col 26",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
      ],
    ],
    [
      "---- MODULE Sub ----\nCONSTANT e\nS1(z) == e\n====\nSubI(q) == INSTANCE Sub WITH e <- 1\nOp0(a0) == SubI(1)!S1(inner:: a0, 2)!1\nf == Op0(1)!inner",
      [
        ["line 7, col 22 to line 7, col 36", "The operator SubI!S1 requires 1 arguments."],
        ["line 8, col 13 to line 8, col 17", "Cannot find label `inner'."],
      ],
    ],
    [
      "---- MODULE Sub ----\nCONSTANT e\nS1(z) == e\n====\nSubI(q) == INSTANCE Sub WITH e <- 1\nOp0(a0) == SubI(inner:: a0)!S1(1, 2)!1\nf == Op0(1)!inner",
      [["line 7, col 31 to line 7, col 36", "The operator SubI!S1 requires 1 arguments."]],
    ],
  ])(
    "finds a label in a failed selection's arguments only if SANY generated them, in %j",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it.each<[string, [string, string][]]>([
    [
      "EXTENDS Naturals\nJ(a, Q(_)) == Q(a)\nK == lab:: 1 + 1\nOp0 == J(K!1)\nf == Op0!@\ng == Op0!1",
      [
        ["line 5, col 9 to line 5, col 13", "The operator J requires 2 arguments."],
        [
          "line 6, col 10 to line 6, col 10",
          "Choosing operand `@' of subexpression with no operands.",
        ],
        ["line 7, col 10 to line 7, col 10", noOperands],
      ],
    ],
    [
      "EXTENDS Naturals\nK == lab:: 1 + 1\nOp0 == {Nope(K!1), 2}\nf == Op0!1!1\ng == Op0!1",
      [
        ["line 4, col 9 to line 4, col 12", "Unknown operator: `Nope'."],
        ["line 5, col 12 to line 5, col 12", noOperands],
      ],
    ],
  ])(
    "reports choosing an operand of a failed expression that contains a selection, in %j, like SANY",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it("selects through each reference that a selected operand names like SANY", async () => {
    await expect(
      checkNames("R == {{5}}\nQ == {R!1}\nOp == {Q!1, 2}\nB == Op!1!1!1!1!1"),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 5, col 17 to line 5, col 17 of module M",
          message: "Selecting subexpression of expression that has none.",
        },
      ]),
    );
  });

  it.each([
    ["---- MODULE I ----\nQ == {5}\nOp == {Q!1, 2}\n====\nJ == INSTANCE I\nB == J!Op!1!1!1", 7, 15],
    [
      "---- MODULE I ----\nQ == {{5}}\nC == Q!1\n====\nJ == INSTANCE I\nB == J!C!1!1\nB2 == J!C!1!1!1",
      8,
      15,
    ],
  ])(
    "selects through a reference in an instantiated definition in %j like SANY",
    async (source, line, column) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError([
          {
            location: `line ${line}, col ${column} to line ${line}, col ${column} of module M`,
            message: "Selecting subexpression of expression that has none.",
          },
        ]),
      );
    },
  );

  it.each<[string, [string, string][]]>([
    [
      "EXTENDS Naturals\nRECURSIVE Rec0(_, _)\nRec0 == DOMAIN Rec0!2!2",
      [
        [
          "line 4, col 1 to line 4, col 23",
          "Definition of Rec0 has different arity than its RECURSIVE declaration.",
        ],
        ["line 4, col 16 to line 4, col 23", "The operator Rec0 requires 2 arguments."],
      ],
    ],
    [
      "Op(x) == {x}\nB == DOMAIN Op!1!2",
      [["line 3, col 13 to line 3, col 18", "The operator Op requires 1 arguments."]],
    ],
    [
      "CONSTANT C(_)\nOp(x) == {x}\nB == C(Op!1!3)",
      [["line 4, col 8 to line 4, col 13", "The operator Op requires 1 arguments."]],
    ],
    [
      "Op(x) == {x}\nH(F(_)) == F(Op!1!3)",
      [["line 3, col 14 to line 3, col 19", "The operator Op requires 1 arguments."]],
    ],
  ])(
    "checks a selection's arity right away as an argument of an operator that is not user-defined in %j like SANY",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it.each<[string, [string, string][]]>([
    [
      "G(F(_)) == F(1)\nOp(x) == {x}\nB == G(Op!1!3)",
      [
        [
          "line 4, col 13 to line 4, col 13",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
      ],
    ],
    [
      "G(F(_)) == F(1)\nB == G(Nope!1)",
      [["line 3, col 8 to line 3, col 11", "Unknown operator: `Nope'."]],
    ],
    [
      "G(F(_)) == F(1)\nOp(x) == {Nope(x)}\nB == G(Op!1!1)",
      [
        ["line 3, col 11 to line 3, col 14", "Unknown operator: `Nope'."],
        ["line 4, col 13 to line 4, col 13", noOperands],
      ],
    ],
  ])(
    "reports a failed selection in %j as an argument that is not an operator like SANY",
    async (source, errors) => {
      const line = source.split("\n").length + 1;
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          [
            ...errors,
            [
              `line ${line}, col 6 to line ${line}, col 14`,
              "Argument number 1 to operator 'G' \nshould be a 1-parameter operator.",
            ],
          ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it.each([
    [
      "Op == {1}\nB == Op!1!:",
      "line 3, col 9 to line 3, col 9",
      "!: should not follow an operand selector.",
    ],
    [
      "Op == \\A y \\in {1} : y = 1\nB == Op!<<!:",
      "line 3, col 9 to line 3, col 10",
      "!: should not follow an operand selector.",
    ],
    [
      "Op == CASE TRUE -> 1 [] FALSE -> 2\nB == Op!1!2!:",
      "line 3, col 11 to line 3, col 11",
      "!: should not follow an operand selector.",
    ],
    [
      "Op == lab:: {1}\nB == Op!lab!:",
      "line 3, col 13 to line 3, col 13",
      "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
    ],
    [
      "Op == {1}\nB == Op!:!1",
      "line 3, col 9 to line 3, col 9",
      "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
    ],
    [
      "THEOREM T == ASSUME NEW q PROVE TRUE\nB == T!:",
      "line 3, col 6 to line 3, col 8",
      "Selected ASSUME/PROVE instead of expression.",
    ],
    [
      "THEOREM TRUE\n<1>1. ASSUME NEW q PROVE TRUE\n<1>2. <1>1!: = 1\n<1>3. QED",
      "line 4, col 7 to line 4, col 12",
      "Selected ASSUME/PROVE instead of expression.",
    ],
    [
      "THEOREM TRUE\n<1>1. SUFFICES ASSUME NEW q PROVE TRUE\n<1>2. <1>1!1!: = 1\n<1>3. QED",
      "line 4, col 12 to line 4, col 12",
      "!: should not follow an operand selector.",
    ],
    [
      "THEOREM TRUE\n<1>1. ASSUME TRUE PROVE lab:: TRUE\n<1>2. <1>1!lab!: = 1\n<1>3. QED",
      "line 4, col 16 to line 4, col 16",
      "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
    ],
    [
      "THEOREM TRUE\n<1>1. ASSUME TRUE PROVE TRUE\n<1>2. <1>1!:!: = 1\n<1>3. QED",
      "line 4, col 12 to line 4, col 12",
      "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
    ],
    [
      "THEOREM TRUE\n<1>1. ASSUME TRUE PROVE TRUE\n<1>2. <1>1!:!X = 1\n<1>3. QED",
      "line 4, col 12 to line 4, col 12",
      "A name selector here must be from a LET clause.",
    ],
  ])(
    "reports the selector before or after `!:' in %j like SANY",
    async (source, location, message) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError([{ location: `${location} of module M`, message }]),
      );
    },
  );

  it.each([
    [
      "---- MODULE I ----\nK == 1\n====\nJ == INSTANCE I\nB == J",
      "line 6, col 6 to line 6, col 6",
      "J",
    ],
    [
      "---- MODULE I2 ----\nK == 1\n====\n---- MODULE I ----\nL == INSTANCE I2\n====\nJ == INSTANCE I\nB == J!L",
      "line 9, col 8 to line 9, col 8",
      "J!L",
    ],
    [
      "---- MODULE I ----\nCONSTANT c\nK == c\n====\nJ(x) == INSTANCE I WITH c <- x\nB == J(1)",
      "line 7, col 6 to line 7, col 6",
      "J",
    ],
    [
      "---- MODULE I ----\nCONSTANT c\nK == c\n====\nJ(x) == INSTANCE I WITH c <- x\nTHEOREM TRUE BY J(1)",
      "line 7, col 17 to line 7, col 17",
      "J",
    ],
    [
      "---- MODULE I ----\nK == 1\n====\nB == LET J == INSTANCE I IN J",
      "line 5, col 29 to line 5, col 29",
      "J",
    ],
  ])(
    "reports an instance name used as an operator in %j like SANY",
    async (source, location, name) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError([
          { location: `${location} of module M`, message: `Operator name ${name} is incomplete.` },
        ]),
      );
    },
  );

  it("reports a parameterized instance name passed as an operator argument as incomplete, like SANY", async () => {
    await expect(
      checkNames(
        "---- MODULE I ----\nCONSTANT c\nK == c\n====\nJ(x) == INSTANCE I WITH c <- x\nAp(P(_)) == P(1)\nB == Ap(J)",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 8, col 9 to line 8, col 9 of module M",
          message: "Operator name J is incomplete.",
        },
        {
          location: "line 8, col 6 to line 8, col 10 of module M",
          message: "Argument number 1 to operator 'Ap' \nshould be a 1-parameter operator.",
        },
      ]),
    );
  });

  it("accepts an instance name as a fact like SANY", async () => {
    await expect(
      checkNames(
        "---- MODULE I ----\nK == 1\n====\nJ == INSTANCE I\nUSE J\nHIDE J\nTHEOREM TRUE BY J",
      ),
    ).resolves.toMatchObject({ status: "success" });
  });

  it("reports a selection that leaves parameters unfilled under a built-in operator like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals, Sequences, TLC\nPar(a) == {a}\nL == \\A b \\in {} : lab(b) :: b\nF == \\A y \\in {1} : y = 1\nA1 == Par!1 = 1\nA2 == SUBSET Par!1\nA3 == Len(Par!1)\nA4 == Par!1 :> 1\nA5 == Print(Par!1, 1)\nA6 == IF Par!1 THEN 1 ELSE 2\nA7 == L!lab = 1\nA8 == F!@ = 1\nA9 == SelectSeq(<<>>, Par!1)\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z(c) == c + 1\n<1>2. Z!1 = 1\n  OBVIOUS\n<1>3. QED",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 6, col 7 to line 6, col 11", "The operator Par requires 1 arguments."],
          ["line 7, col 14 to line 7, col 18", "The operator Par requires 1 arguments."],
          ["line 8, col 11 to line 8, col 15", "The operator Par requires 1 arguments."],
          ["line 9, col 7 to line 9, col 11", "The operator Par requires 1 arguments."],
          ["line 10, col 13 to line 10, col 17", "The operator Par requires 1 arguments."],
          ["line 11, col 10 to line 11, col 14", "The operator Par requires 1 arguments."],
          ["line 12, col 9 to line 12, col 11", "Label `lab' used with wrong number of arguments."],
          ["line 13, col 7 to line 13, col 9", "Expected 1 arguments but found 0."],
          ["line 17, col 7 to line 17, col 9", "The operator Z requires 1 arguments."],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("checks the arguments of a RECURSIVE operator that is never defined like SANY", async () => {
    await expect(
      checkNames(
        "CONSTANT c\nRECURSIVE R(_, _), S\nA == R(1, R) /\\ R(S, LAMBDA p : p) /\\ R(c, c)\nTHEOREM R(c, R) = 1",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 4, col 11 to line 4, col 11 of module M",
          message: "The operator R requires 2 arguments.",
        },
        {
          location: "line 4, col 22 to line 4, col 33 of module M",
          message: "LAMBDA expression used where an expression is required.",
        },
        {
          location: "line 5, col 1 to line 5, col 19 of module M",
          message: "A THEOREM may not appear within a recursive definition section.",
        },
        {
          location: "line 5, col 14 to line 5, col 14 of module M",
          message: "The operator R requires 2 arguments.",
        },
        {
          location: "line 6, col 1 to line 6, col 10 of module M",
          message: "A VARIABLE declaration may not appear within a recursive definition section.",
        },
        {
          location: "line 3, col 11 to line 3, col 17 of module M",
          message: "Symbol R declared in RECURSIVE statement but not defined.",
        },
        {
          location: "line 3, col 20 to line 3, col 20 of module M",
          message: "Symbol S declared in RECURSIVE statement but not defined.",
        },
      ]),
    );
  });

  it("selects from a RECURSIVE operator by its declared arity like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\nRECURSIVE R(_)\nR == lab :: 1 + 2\nA == R!lab\nB == R(1)!lab\nC == {R!1}\nD == LET RECURSIVE Q(_, _)\n         Q(x) == x + 1\n     IN Q!1 + Q(1)!1 + Q(1, 2)!1",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          [
            "line 4, col 1 to line 4, col 17",
            "Definition of R has different arity than its RECURSIVE declaration.",
          ],
          ["line 5, col 6 to line 5, col 10", "The operator R requires 1 arguments."],
          ["line 6, col 6 to line 6, col 13", "Expected 0 arguments but found 1."],
          ["line 7, col 7 to line 7, col 9", "The operator R requires 1 arguments."],
          [
            "line 9, col 10 to line 9, col 22",
            "Definition of Q has different arity than its RECURSIVE declaration.",
          ],
          ["line 10, col 9 to line 10, col 11", "The operator Q requires 2 arguments."],
          ["line 10, col 16 to line 10, col 18", "The operator Q requires 2 arguments."],
          ["line 10, col 24 to line 10, col 32", "Expected 1 arguments but found 2."],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("checks an application of a RECURSIVE operator once, where it is written, like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\nRECURSIVE R(_, _)\nOp1 == lab :: R(0, 1)\nR(a) == a\nA == Op1!lab\nB == R(0, 1)",
      ),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 5, col 1 to line 5, col 9 of module M",
          message: "Definition of R has different arity than its RECURSIVE declaration.",
        },
        {
          location: "line 7, col 6 to line 7, col 12 of module M",
          message:
            "Wrong number of arguments (2) given to operator 'R', \nwhich requires 1 arguments.",
        },
      ]),
    );
  });

  it("checks the arguments of a parameterized instance in a selection like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\n---- MODULE Inner ----\nH == lab :: 1 + 2\nG(q) == q + 1\n====\nI0(p) == INSTANCE Inner\nA == I0(1, 2)!H!1\nB == I0(1)!H!1\nC == I0!H!1\nD == I0(1)!G(2)!1\nE == I0(1)!G!1\nF == I0(1, 2)!H!lab",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 8, col 8 to line 8, col 13", "The operator I0 requires 1 arguments."],
          ["line 10, col 6 to line 10, col 11", "The operator I0 requires 1 arguments."],
          ["line 12, col 6 to line 12, col 14", "The operator I0!G requires 1 arguments."],
          ["line 13, col 8 to line 13, col 13", "The operator I0 requires 1 arguments."],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it.each<[string, [string, string][]]>([
    [
      "EXTENDS Naturals\nTHEOREM T == \\A n \\in {1} : n = 1\n<1>1. TAKE n \\in {1}\n<1>2. PICK k \\in {1}, j \\in {2} : k = j\n  OBVIOUS\n<1>3. <1>2!(1, 2) = 1\n  OBVIOUS\n<1>5. <1>2!2!1 = 2\n  OBVIOUS\n<1>6. <1>2!3 = 2\n  OBVIOUS\n<1>7. <1>1!1 = 1\n  OBVIOUS\n<1>8. <1>2 = 1\n  OBVIOUS\n<1>9. <1>1!2 = 1\n  OBVIOUS\n<1>10. QED",
      [
        [
          "line 11, col 12 to line 11, col 12",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        ["line 15, col 7 to line 15, col 10", "PICK proof step selected instead of expression."],
        [
          "line 17, col 12 to line 17, col 12",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
      ],
    ],
    [
      "EXTENDS Naturals\nTHEOREM T == 1 = 1 => 2 = 2\n<1>1. HAVE 1 = 1\n<1>2. CASE 2 = 2\n  <2>1. <1>2!1!1 = 2\n    OBVIOUS\n  <2>2. <1>2!2 = 2\n    OBVIOUS\n  <2>3. QED\n<1>3. WITNESS 1, 2\n<1>4. <1>1!1 = TRUE\n  OBVIOUS\n<1>5. <1>3!2 = 2\n  OBVIOUS\n<1>6. <1>3!3 = 2\n  OBVIOUS\n<1>7. <1>1 = 1\n  OBVIOUS\n<1>8. QED",
      [
        [
          "line 8, col 14 to line 8, col 14",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
        [
          "line 16, col 12 to line 16, col 12",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        ["line 18, col 7 to line 18, col 10", "HAVE proof step selected instead of expression."],
      ],
    ],
    [
      "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. SUFFICES 2 = 2\n  OBVIOUS\n<1>2. <1>1 = 1\n  OBVIOUS\n<1>3. <1>1!1 = 1\n  OBVIOUS\n<1>4. QED\n  <2>1. <1>4!1 = 1\n    OBVIOUS\n  <2>2. <1>4 = 1\n    OBVIOUS\n  <2>3. QED\n    BY <1>1, <1>4",
      [
        ["line 6, col 7 to line 6, col 10", "SUFFICES proof step selected instead of expression."],
        [
          "line 11, col 14 to line 11, col 14",
          "Nonexistent operand specified by `argument selector 1'.",
        ],
        [
          "line 13, col 9 to line 13, col 12",
          "QED step proof step selected instead of expression.",
        ],
      ],
    ],
  ])(
    "checks selections of PICK, TAKE, HAVE, CASE, WITNESS, SUFFICES and QED steps in %j like SANY",
    async (source, errors) => {
      await expect(checkNames(source)).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it("rejects an ASSUME/PROVE theorem or step used as an expression or operator like SANY", async () => {
    await expect(
      checkNames(
        "THEOREM T == ASSUME NEW q PROVE TRUE\nA == T = 1\nB == T(1) = 1\nOp(G(_)) == 1\nC == Op(T)\nTHEOREM TRUE\n<1>1. ASSUME NEW r PROVE TRUE\n<1>2. <1>1 = 1\n<1>3. QED BY <1>1",
      ),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 3, col 6 to line 3, col 6", "ASSUME/PROVE used where an expression is required."],
          ["line 4, col 7 to line 4, col 9", "The operator T requires 0 arguments."],
          ["line 6, col 9 to line 6, col 9", "Expected arity 1 but found operator of arity 0."],
          [
            "line 6, col 6 to line 6, col 10",
            "Argument number 1 to operator 'Op' \nshould be a 1-parameter operator.",
          ],
          ["line 9, col 7 to line 9, col 10", "ASSUME/PROVE used where an expression is required."],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("selects from a definition that an earlier definition of the same DEFINE step makes, like SANY", async () => {
    await expect(
      checkNames(
        "EXTENDS Naturals\nTHEOREM T == 1 = 1\n<1>1. DEFINE Z == 1 + 2\n             W == Z!1 + 1\n             V == Z!3\n<1>2. W!1!3 = 2\n<1>3. QED",
      ),
    ).rejects.toThrow(
      createSanyError(
        ["line 6, col 21 to line 6, col 21", "line 7, col 11 to line 7, col 11"].map(
          (location) => ({
            location: `${location} of module M`,
            message: "Nonexistent operand specified by `argument selector 3'.",
          }),
        ),
      ),
    );
  });

  it("selects a label itself, not its unresolved body, like SANY", async () => {
    await expect(
      checkNames("CONSTANT c\nB == lab :: -c\nD == {B!lab, 1}\nE == D!1\nG == D!1!1 \\/ E!1"),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 13 to line 3, col 13 of module M",
          message: "Could not find declaration or definition of symbol '-.'.",
        },
        {
          location: "line 3, col 13 to line 3, col 14 of module M",
          message: "Couldn't resolve prefix operator symbol `-.'.",
        },
      ]),
    );
  });

  it("passes an operator whose definition has fewer parameters than its RECURSIVE declaration, where SANY crashes", async () => {
    await expect(
      checkNames("RECURSIVE R(_, _)\nR == 1\nL(P(_, _)) == 1\nA == L(R)"),
    ).rejects.toThrow(
      createSanyError([
        {
          location: "line 3, col 1 to line 3, col 6 of module M",
          message: "Definition of R has different arity than its RECURSIVE declaration.",
        },
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

  it.each([
    [
      "an operator defined twice",
      "Foo == 1\nFoo(a) == 2",
      "I == INSTANCE Inner WITH c <- 1\nU == I!Foo(1)",
      [
        ["line 5, col 1 to line 5, col 11", "Operator Foo already defined or declared."],
        [
          "line 5, col 1 to line 5, col 11",
          "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 4, col 1 to line 4, col 8 of module M.",
        ],
        ["line 8, col 11 to line 8, col 13", "The operator I!Foo requires 0 arguments."],
      ],
    ],
    [
      "an operator named like a theorem",
      "THEOREM Foo == TRUE\nFoo(a) == 2",
      "I == INSTANCE Inner WITH c <- 1\nU == I!Foo(1)",
      [
        ["line 5, col 1 to line 5, col 11", "Operator Foo already defined or declared."],
        [
          "line 5, col 1 to line 5, col 11",
          "Multiply-defined symbol 'Foo': this definition or declaration conflicts \nwith the one at line 4, col 1 to line 4, col 19 of module M.",
        ],
        ["line 8, col 11 to line 8, col 13", "The operator I!Foo requires 0 arguments."],
      ],
    ],
    [
      "a built-in operator",
      "a -+-> b == 1",
      "I == INSTANCE Inner WITH c <- 1\nU == I!-+->",
      [
        ["line 4, col 1 to line 4, col 13", "Operator -+-> already defined or declared."],
        [
          "line 4, col 1 to line 4, col 13",
          "Symbol -+-> is a built-in operator, and cannot be redefined.",
        ],
        ["line 7, col 6 to line 7, col 11", "Unknown operator: `I!-+->'."],
      ],
    ],
    [
      "a built-in operator through an unnamed instance",
      "a -+-> b == 1",
      "INSTANCE Inner WITH c <- 1",
      [
        ["line 4, col 1 to line 4, col 13", "Operator -+-> already defined or declared."],
        [
          "line 4, col 1 to line 4, col 13",
          "Symbol -+-> is a built-in operator, and cannot be redefined.",
        ],
      ],
    ],
  ])(
    "leaves out of an instance %s that SANY doesn't bind",
    async (_description, definitions, instance, errors) => {
      await expect(
        checkNames(`---- MODULE Inner ----\nCONSTANT c\n${definitions}\n====\n${instance}`),
      ).rejects.toThrow(
        createSanyError(
          errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
        ),
      );
    },
  );

  it.each([
    [
      "a named instance of a definition and a theorem",
      "---- MODULE Inner ----\nCONSTANT c\nL == 1 ++ 2\nTHEOREM T == 1 ++ 2\n====\nI == INSTANCE Inner WITH c <- 1",
      [
        [
          "line 4, col 8 to line 4, col 9",
          "Could not find declaration or definition of symbol '++'.",
        ],
        ["line 4, col 6 to line 4, col 11", "Couldn't resolve infix operator symbol `++'."],
        [
          "line 5, col 16 to line 5, col 17",
          "Could not find declaration or definition of symbol '++'.",
        ],
        ["line 5, col 14 to line 5, col 19", "Couldn't resolve infix operator symbol `++'."],
        [
          "line 7, col 1 to line 7, col 31",
          "Substitution error, probably due to error \nin module being instantiated.",
        ],
        [
          "line 7, col 1 to line 7, col 31",
          "Substitution error, probably due to error in module being instantiated.",
        ],
      ],
    ],
    [
      "an unnamed instance",
      "---- MODULE Inner ----\nCONSTANT c\nL == [1]\n====\nINSTANCE Inner WITH c <- 1",
      [
        ["line 4, col 6 to line 4, col 6", "Unsupported expression type `['."],
        [
          "line 6, col 1 to line 6, col 26",
          "Substitution error, probably due to error \nin module being instantiated.",
        ],
      ],
    ],
    [
      "a named instance, but not an unnamed one, of a definition from a module without parameters",
      "---- MODULE E ----\nL == (1 ++ 2)[3]\n====\n---- MODULE Inner ----\nEXTENDS E\nCONSTANT c\n====\nI == INSTANCE Inner WITH c <- 1\nINSTANCE Inner WITH c <- 2",
      [
        [
          "line 3, col 9 to line 3, col 10",
          "Could not find declaration or definition of symbol '++'.",
        ],
        ["line 3, col 7 to line 3, col 12", "Couldn't resolve infix operator symbol `++'."],
        [
          "line 9, col 1 to line 9, col 31",
          "Substitution error, probably due to error \nin module being instantiated.",
        ],
      ],
    ],
    [
      "an instance of a definition that another instance copies unchanged",
      "---- MODULE E ----\nL == 1 ++ 2\n====\n---- MODULE Inner ----\nCONSTANT c\nJ == INSTANCE E\n====\nI == INSTANCE Inner WITH c <- 1",
      [
        [
          "line 3, col 8 to line 3, col 9",
          "Could not find declaration or definition of symbol '++'.",
        ],
        ["line 3, col 6 to line 3, col 11", "Couldn't resolve infix operator symbol `++'."],
        [
          "line 9, col 1 to line 9, col 31",
          "Substitution error, probably due to error \nin module being instantiated.",
        ],
      ],
    ],
    [
      "the instance that substitutes in it first",
      "---- MODULE E ----\nCONSTANT d\nL == 1 ++ 2\n====\n---- MODULE Inner ----\nCONSTANT c\nJ == INSTANCE E WITH d <- c\n====\nI == INSTANCE Inner WITH c <- 1",
      [
        [
          "line 4, col 8 to line 4, col 9",
          "Could not find declaration or definition of symbol '++'.",
        ],
        ["line 4, col 6 to line 4, col 11", "Couldn't resolve infix operator symbol `++'."],
        [
          "line 8, col 1 to line 8, col 27",
          "Substitution error, probably due to error \nin module being instantiated.",
        ],
      ],
    ],
  ])("reports a body SANY fails to generate in %s", async (_description, source, errors) => {
    await expect(checkNames(source)).rejects.toThrow(
      createSanyError(
        errors.map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });
});
