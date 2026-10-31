import { describe, expect, it } from "vite-plus/test";
import { parseModule, TlaSyntaxError, type Module } from "../../src";

const SOURCE = `---- MODULE Ranges ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
IfError == IF x THEN 1 ELSE 2
DomainError == DOMAIN x
FieldError == [a |-> 1, b |-> 2].c
AndError == /\\ x = 0
            /\\ x
ChooseError == CHOOSE n \\in {} : TRUE
InfixError == (x + 1) \\cup {(2)}
Paren == (x = 0)
====`;

const describeRange = (location: Module["definitions"][number]["location"]) => {
  const range = location.range;
  return (
    range &&
    `line ${range.start.line}, col ${range.start.column} to line ${range.end.line}, col ${range.end.column} of module ${range.module}`
  );
};

describe("parseModule records ranges like SANY", () => {
  const definitions = new Map(
    parseModule(SOURCE).definitions.map((definition) => [definition.name, definition]),
  );

  it.each([
    ["Init", "line 4, col 9 to line 4, col 13 of module Ranges"],
    ["IfError", "line 6, col 12 to line 6, col 29 of module Ranges"],
    ["DomainError", "line 7, col 16 to line 7, col 23 of module Ranges"],
    ["FieldError", "line 8, col 15 to line 8, col 34 of module Ranges"],
    ["AndError", "line 9, col 13 to line 10, col 16 of module Ranges"],
    ["ChooseError", "line 11, col 16 to line 11, col 37 of module Ranges"],
    ["InfixError", "line 12, col 15 to line 12, col 32 of module Ranges"],
    ["Paren", "line 13, col 11 to line 13, col 15 of module Ranges"],
  ])("ends the body of %s where TLC does", (name, range) => {
    expect(describeRange(definitions.get(name)?.body.location ?? { line: 0, column: 0 })).toBe(
      range,
    );
  });

  it("covers a definition from its name to the end of its body", () => {
    expect(describeRange(definitions.get("AndError")?.location ?? { line: 0, column: 0 })).toBe(
      "line 9, col 1 to line 10, col 16 of module Ranges",
    );
  });

  it("ends each conjunct of a bulleted list at its last token", () => {
    const body = definitions.get("AndError")?.body;
    expect(
      body?.kind === "And" && body.operands.map((operand) => describeRange(operand.location)),
    ).toEqual([
      "line 9, col 16 to line 9, col 20 of module Ranges",
      "line 10, col 16 to line 10, col 16 of module Ranges",
    ]);
  });
});

describe("parseModule reads operators like SANY", () => {
  it("reads a backslash word as the longest operator it starts with", () => {
    const module = parseModule(
      "---- MODULE M ----\nF(S, used) == S\\used\nG(S) == 1 \\inS\nH(S, T) == S \\capT\n====",
    );
    expect(
      module.definitions.map((definition) =>
        definition.body.kind === "Apply" ? definition.body.operator : definition.body.kind,
      ),
    ).toEqual(["\\", "\\in", "\\cap"]);
  });

  const INNER = "---- MODULE Inner ----\nVARIABLE x\nFoo == x\n====\nM(x) == INSTANCE Inner";

  it.each(["7 * -2", "7 \\div -2", "2 ^ -1", "<<1>> \\o -1"])(
    "rejects a negation after an operator that binds tighter in %s",
    (expression) => {
      expect(() => parseModule(`---- MODULE M ----\nA == ${expression}\n====`)).toThrow(
        TlaSyntaxError,
      );
    },
  );

  it.each(["7 + -2", "7 - -2", "7 % -2", "1 .. -2", "-7 \\div 2"])(
    "reads a negation after an operator that binds looser in %s",
    (expression) => {
      expect(() => parseModule(`---- MODULE M ----\nA == ${expression}\n====`)).not.toThrow();
    },
  );

  it.each(["SUBSET a + b", "DOMAIN a \\o b", "- a \\X b", "[]a = b", "<>a \\cdot b", "[]a'"])(
    "rejects an operator after the operand of a prefix operator it overlaps in %s",
    (expression) => {
      expect(() =>
        parseModule(`---- MODULE M ----\nCONSTANTS a, b\nA == ${expression}\n====`),
      ).toThrow(TlaSyntaxError);
    },
  );

  it.each([
    ["SUBSET 0..2", ".."],
    ["UNION a \\cup b", "\\cup"],
    ["SUBSET a ^ b", "SUBSET"],
    ["~a = b", "~"],
  ])("groups %s under %s as SANY does", (expression, operator) => {
    const definition = parseModule(
      `---- MODULE M ----\nCONSTANTS a, b\nA == ${expression}\n====`,
    ).definitions.find((item) => item.name === "A");
    expect(definition?.body).toMatchObject({ kind: "Apply", operator });
  });

  it.each(['"a\\qb"', '"a\\ b"', '"a\rb"'])(
    "rejects the string %j that SANY's lexer stops in",
    (string) => {
      expect(() => parseModule(`---- MODULE M ----\nA == ${string}\n====`)).toThrow(TlaSyntaxError);
    },
  );

  it.each([
    ["the root module", "---- MODULE M ----\nA == 1\n"],
    ["a nested module", `---- MODULE M ----\n---- MODULE Inner ----\nA == 1\n`],
  ])("rejects %s without ====", (_, source) => {
    expect(() => parseModule(source)).toThrow(TlaSyntaxError);
  });

  it.each([
    ["EXTENDS BY", ["BY"]],
    ["EXTENDS Naturals, IN", ["Naturals", "IN"]],
    ["EXTENDS SUBSET\nVARIABLE x", ["SUBSET"]],
  ])("names a module with a keyword in %j as SANY does", (header, extendees) => {
    expect(parseModule(`---- MODULE M ----\n${header}\nA == 1\n====`).extends).toEqual(extendees);
  });

  // SANY's lexer marks the definition A as beginning at SUBSET, and doesn't mark one after THEOREM.
  it.each(["EXTENDS SUBSET", "EXTENDS THEOREM", "EXTENDS AXIOM"])(
    "rejects %j before a definition as SANY does",
    (header) => {
      expect(() => parseModule(`---- MODULE M ----\n${header}\nA == 1\n====`)).toThrow(
        TlaSyntaxError,
      );
    },
  );

  it.each(["ASSUME", "WF_", "DEF"])(
    "takes %s for the first field of a record as SANY does",
    (name) => {
      const module = parseModule(`---- MODULE M ----\nA == [${name} |-> 1, b |-> 2]\n====`);
      expect(module.definitions[0].body).toMatchObject({
        kind: "Record",
        fields: [{ name }, { name: "b" }],
      });
    },
  );

  it("rejects a keyword for a later field of a record as SANY does", () => {
    expect(() => parseModule("---- MODULE M ----\nA == [a |-> 1, IN |-> 2]\n====")).toThrow(
      TlaSyntaxError,
    );
  });

  it.each(["_ == 1", "VARIABLE _", "A == \\A _ \\in {} : TRUE", "A == __", "A == 1_2"])(
    "rejects a name without a letter in %j as SANY does",
    (unit) => {
      expect(() => parseModule(`---- MODULE M ----\n${unit}\n====`)).toThrow(TlaSyntaxError);
    },
  );

  it("reads underscores as the placeholders of operator parameters", () => {
    const module = parseModule("---- MODULE M ----\nCONSTANT F(_, _), _ + _\nG(H(_)) == 1\n====");
    expect(module.constants.map((constant) => [constant.name, constant.arity])).toEqual([
      ["F", 2],
      ["+", 2],
    ]);
  });

  it("rejects an operator of a parameterized instance without the instance's arguments", () => {
    expect(() =>
      parseModule(`---- MODULE M ----\n${INNER}\nTHEOREM M!Foo(TRUE) => M!Foo(TRUE)\n====`),
    ).toThrow("The operator M requires 1 arguments at line 7, column 9");
  });

  it("substitutes an operator of a parameterized instance without the instance's arguments", () => {
    expect(() =>
      parseModule(
        `---- MODULE M ----\n${INNER}\n---- MODULE N ----\nCONSTANT Op(_)\n====\nN1 == INSTANCE N WITH Op <- M!Foo\n====`,
      ),
    ).not.toThrow();
  });

  it("cites an operator of a parameterized instance in a DEF clause without arguments", () => {
    const module = parseModule(
      `---- MODULE M ----\n${INNER}\nTHEOREM M(1)!Foo = M(1)!Foo\nBY DEF M!Foo\n====`,
    );
    const proof = module.theorems[0].proof;
    expect(proof?.kind === "By" && proof.defs).toMatchObject([{ name: "M!Foo" }]);
  });
});

describe("parseModule reads proofs like SANY", () => {
  const parseProof = (proof: string) =>
    parseModule(`---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${proof}\n====`);

  const getStepNames = (module: Module) => {
    const proof = module.theorems[0].proof;
    return proof?.kind === "Steps" ? proof.steps.map((step) => step.name) : [];
  };

  it("ends a proof where the next definition starts", () => {
    const module = parseProof(
      "THEOREM T == x = 0\n<1>a. x = 0\n  BY DEF T\n<1> QED BY <1>a DEF T\n\na|b == a + b",
    );
    expect(module.definitions.map((definition) => definition.name)).toEqual(["T", "|"]);
  });

  it("reads a fact that starts with a parenthesis at the start of a line", () => {
    const module = parseProof("THEOREM T == x # 0\nBY (x # 0) <=> ~(x = 0), x > 0 DEF T");
    const proof = module.theorems[0].proof;
    expect(proof?.kind === "By" && [proof.facts.length, proof.defs.length]).toEqual([2, 1]);
  });

  it("names steps by their level, filling in <*> and dropping leading zeros", () => {
    const module = parseProof("THEOREM x = 0\n<01>a. x = 0\n<1>b. x = 0\n  BY <*>a\n<*> QED");
    const proof = module.theorems[0].proof;
    const fact = proof?.kind === "Steps" ? proof.steps[1].proof : undefined;
    expect(getStepNames(module)).toEqual(["<1>a", "<1>b", undefined]);
    expect(fact?.kind === "By" && fact.facts).toMatchObject([{ name: "<1>a" }]);
  });

  it("reads parts of a step as facts", () => {
    const module = parseProof(
      "THEOREM x = 0\n<1>1. x = 0 /\\ x = 0\n<1>2. x = 0\n  BY <1>1!1, <1>1!2\n<1> QED",
    );
    expect(getStepNames(module)).toEqual(["<1>1", "<1>2", undefined]);
  });

  it("reads ASSUME PROVE statements and every kind of step", () => {
    const module = parseProof(
      [
        "THEOREM ASSUME NEW S, NEW P(_), CONSTANT c \\in S, STATE f PROVE \\A s \\in S : P(s)",
        "<1> SUFFICES ASSUME NEW s \\in S PROVE P(s) OBVIOUS",
        "<1> DEFINE Q(y) == P(y)",
        "<1>1. CASE s = c",
        "  <2> PICK t \\in S : t = s OBVIOUS",
        "  <2> QED OBVIOUS",
        "<1> USE ONLY <1>1 DEF Q",
        "<1> HIDE <1>1",
        "<1> TAKE y \\in S",
        "<1> WITNESS c",
        "<1> HAVE TRUE",
        "<1> QED OMITTED",
      ].join("\n"),
    );
    const proof = module.theorems[0].proof;
    expect(proof?.kind === "Steps" && proof.steps.map((step) => step.body.kind)).toEqual([
      "Assert",
      "Define",
      "Case",
      "Use",
      "Hide",
      "Take",
      "Witness",
      "Have",
      "Qed",
    ]);
  });

  it("cites a definition in a DEF clause once the NEW symbol of that name is out of scope", () => {
    const module = parseProof(
      [
        "THEOREM ASSUME ASSUME NEW h PROVE TRUE PROVE TRUE",
        "<1>1. ASSUME NEW g PROVE TRUE OBVIOUS",
        "<1> DEFINE h == 1",
        "<1> DEFINE g == 2",
        "<1> QED BY DEF h, g",
      ].join("\n"),
    );
    const proof = module.theorems[0].proof;
    const qed = proof?.kind === "Steps" ? proof.steps[3].proof : undefined;
    expect(qed?.kind === "By" && qed.defs).toMatchObject([{ name: "h" }, { name: "g" }]);
  });

  it.each([
    ["a QED step at another level", "THEOREM TRUE\n<2>1. TRUE\n<1> QED"],
    ["a named <+> step", "THEOREM TRUE\n<1>1. TRUE\n<+>a. TRUE\n<2> QED\n<1> QED"],
    ["a proof of a step that takes none", "THEOREM TRUE\n<1> HAVE TRUE OBVIOUS\n<1> QED"],
    ["a step number outside a proof", "THEOREM <1>1"],
    ["a proof without a QED step", "THEOREM TRUE\n<1>1. TRUE"],
    ["a bounded NEW operator", "THEOREM ASSUME NEW P(_) \\in {} PROVE TRUE"],
    ["a variable in a DEF clause", "THEOREM TRUE BY DEF x"],
    ["a NEW symbol in a DEF clause", "THEOREM ASSUME NEW xx PROVE TRUE\n  BY DEF xx"],
    [
      "a PICK name in a later DEF clause",
      "THEOREM TRUE\n<1> PICK p : p = 1 OBVIOUS\n<1> QED BY DEF p",
    ],
  ])("rejects %s", (_, proof) => {
    expect(() => parseProof(proof)).toThrow(TlaSyntaxError);
  });
});
