import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";
import { decideSmt } from "../../src/prover/smt/solver/solver";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

describe("set-logic after the first declaration, as Z3 5.3.2 prints it", () => {
  it("keeps the declared functions and the operators of every theory", () => {
    expect(
      run([
        "(declare-fun f () Int)",
        "(set-logic QF_LIA)",
        "(assert (= f 0))",
        "(check-sat)",
        "(get-model)",
        "(declare-const b (_ BitVec 3))",
        "(simplify (bvadd b #b001))",
        "(simplify (implies true false))",
      ]),
    ).toEqual(["sat", "(\n  (define-fun f () Int\n    0)\n)", "(bvadd #b001 b)", "false"]);
  });

  it("takes Int from a logic of reals only, and reads its numerals as reals", () => {
    expect(
      run([
        "(declare-fun f () Int)",
        "(set-logic QF_NRA)",
        "(declare-const x Int)",
        "(simplify (+ f 1))",
        "(simplify 2)",
      ]),
    ).toEqual([
      "(error \"line 3 column 17: Invalid constant declaration: unknown sort 'Int'\")",
      "(+ 1.0 (to_real f))",
      "2.0",
    ]);
  });

  it("keeps the sorts of the other theories once a command has used the manager", () => {
    expect(
      run(["(simplify 1)", "(set-logic QF_BV)", "(declare-const x Int)", "(simplify (+ x 1))"]),
    ).toEqual(["1", "(+ 1 x)"]);
  });

  it("reports a second logic, and one after an assertion, at the name of the logic", () => {
    expect(run(["(set-logic QF_LIA)", "(set-logic QF_LRA  )"])).toEqual([
      '(error "line 2 column 11: the logic has already been set")',
    ]);
    expect(run(["(declare-const p Bool)", "(assert p)", "(set-logic QF_LRA  )"])).toEqual([
      '(error "line 3 column 11: logic must be set before initialization")',
    ]);
  });

  it("keeps the declared functions in decideSmt", () => {
    expect(
      decideSmt(
        [
          "(declare-fun f () Int)",
          "(set-logic QF_LIA)",
          "(assert (distinct f f))",
          "(check-sat)",
        ].join("\n"),
        { timeLimitMs: 5000 },
      ),
    ).toBe("unsat");
  });
});

describe("the operators of a theory the logic lacks, as Z3 5.3.2 reports them", () => {
  it("reads numerals but not the operators of arithmetic, whose names a declaration may take", () => {
    expect(
      run([
        "(set-logic QF_UF)",
        "(simplify (- 2))",
        "(simplify (+ 1 2))",
        "(simplify (< 1 2))",
        "(simplify (to_real 2))",
        "(simplify 2.5)",
        "(simplify (= 1 2))",
        "(declare-sort U 0)",
        "(declare-fun + (U U) U)",
        "(declare-const u U)",
        "(simplify (+ u u))",
      ]),
    ).toEqual([
      '(error "line 2 column 14: unknown constant - (Int) ")',
      '(error "line 3 column 16: unknown constant + (Int Int) ")',
      '(error "line 4 column 16: unknown constant < (Int Int) ")',
      '(error "line 5 column 20: unknown constant to_real (Int) ")',
      "(/ 5.0 2.0)",
      "false",
      "(+ u u)",
    ]);
  });
});

describe("terms nested 20,000 deep, which Z3 5.3.2 reads on its own stack", () => {
  const DEPTH = 20000;

  it("reads nested lets", () => {
    expect(
      run([
        "(declare-const x Int)",
        `(assert (= x (let ((y x)) ${"(let ((y y)) ".repeat(DEPTH - 1)}y${")".repeat(DEPTH)}))`,
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("reads nested quantifiers", () => {
    expect(
      run([
        "(declare-fun p (Int) Bool)",
        `(assert ${"(forall ((y Int)) ".repeat(DEPTH)}(p y)${")".repeat(DEPTH)})`,
        '(echo "done")',
      ]),
    ).toEqual(["done"]);
  });

  it("reads nested attributed terms", () => {
    const labels = Array.from({ length: DEPTH }, (_unused, index) => ` :lblpos l${index})`);
    expect(
      run([
        "(declare-const p Bool)",
        `(assert ${"(! ".repeat(DEPTH)}p${labels.join("")})`,
        '(echo "done")',
      ]),
    ).toEqual(["done"]);
  });
});

describe("a term that fails to parse, as Z3 5.3.2 reports it", () => {
  it("drops the bindings of the let and the quantifier it was read in", () => {
    expect(
      run([
        "(simplify (let ((y 1)) (foo y)))",
        "(simplify y)",
        "(declare-fun p (Int) Bool)",
        "(assert (forall ((x Int)) (and (p x) (foo x))))",
        "(simplify x)",
        "(assert (forall ((z Int)) (p z)))",
        "(check-sat)",
      ]),
    ).toEqual([
      '(error "line 1 column 30: unknown constant foo (Int) ")',
      '(error "line 2 column 10: unknown constant y")',
      '(error "line 4 column 43: unknown constant foo (Int) ")',
      '(error "line 5 column 10: unknown constant x")',
      "sat",
    ]);
  });

  it("rejects an attributed quantifier body without a term", () => {
    expect(run(["(assert (forall ((x Int)) (!)))"])).toEqual([
      '(error "line 1 column 29: invalid expression")',
    ]);
  });
});

describe("the attributes of a quantifier, as Z3 5.3.2 checks them", () => {
  it.each([
    [":weight foo", "line 2 column 49: invalid weight attribute, integer expected"],
    [":weight 1.5", "line 2 column 49: invalid weight attribute, integer expected"],
    [":weight (1)", "line 2 column 49: invalid weight attribute, integer expected"],
    [":weight", "line 2 column 48: invalid weight attribute, integer expected"],
    [
      ":weight -3",
      "line 2 column 49: invalid indexed identifier, index is too big to fit in an unsigned machine integer",
    ],
    [
      ":weight 4294967296",
      "line 2 column 49: invalid indexed identifier, index is too big to fit in an unsigned machine integer",
    ],
    [":qid 5", "line 2 column 46: invalid attribute value, symbol expected"],
    [":skolemid (a)", "line 2 column 51: invalid attribute value, symbol expected"],
    [":pattern ((g x)) :weight foo", "line 2 column 55: unknown constant g (Int) "],
  ])("rejects %s", (attributes, error) => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        `(assert (forall ((x Int)) (! (> (f x) 0) ${attributes})))`,
      ]),
    ).toEqual([`(error "${error}")`]);
  });

  it("takes a weight of 32 bits and quoted names", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (! (> (f x) 0) :weight 4294967295 :qid |a b| :skolemid s)))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });
});

describe("a backslash in a quoted symbol, as Z3 5.3.2 reports it", () => {
  it("rejects the symbol and goes on at the backslash", () => {
    expect(
      run([
        "(declare-fun |a b| () Int)",
        "(declare-fun |x\\|y| () Int)",
        '(simplify (str.len "a\\b"))',
        "(simplify (+ |a b| 1 2))",
      ]),
    ).toEqual([
      "(error \"line 2 column 15: invalid character '\\' in quoted symbol\")",
      '(error "line 2 column 15: unexpected character")',
      "3",
      "(+ 3 |a b|)",
    ]);
  });
});

describe("a command without a symbol at its head, as Z3 5.3.2 reports it", () => {
  it("reports the head before the rest of the command, which may never close", () => {
    expect(run(['(echo "a")', "( (assert true)", '(echo "b")'])).toEqual([
      "a",
      '(error "line 2 column 2: invalid command, symbol expected")',
    ]);
    expect(run(['(echo "a")', "(1 2", '(echo "b")'])).toEqual([
      "a",
      '(error "line 2 column 1: invalid command, symbol expected")',
    ]);
    expect(run(['(echo "a")', "("])).toEqual([
      "a",
      '(error "line 2 column 1: invalid command, symbol expected")',
    ]);
    expect(run(["() )", '(echo "b")'])).toEqual([
      '(error "line 1 column 2: invalid command, symbol expected")',
      "b",
    ]);
  });
});

describe("a malformed application or indexed constant, as Z3 5.3.2 reports it", () => {
  it("reports a head that is no symbol where it stands, and goes on", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(simplify (-5))",
        "(simplify (1 2))",
        '(simplify ("a" 2))',
        "(simplify ())",
        "(simplify (()))",
        "(simplify (+ x 1))",
      ]),
    ).toEqual([
      "(error \"line 2 column 11: invalid expression, '(' or symbol expected\")",
      "(error \"line 3 column 11: invalid expression, '(' or symbol expected\")",
      "(error \"line 4 column 11: invalid expression, '(' or symbol expected\")",
      "(error \"line 5 column 11: invalid expression, '(' or symbol expected\")",
      "(error \"line 6 column 12: invalid expression, '(' or symbol expected\")",
      "(+ 1 x)",
    ]);
  });

  it("reports an indexed constant at the token after it", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(simplify (_ bv5 0)   )",
        "(simplify (_ bv5)",
        ")",
        "(simplify (_ bv5 -3) )",
        "(simplify (_ +oo 0 5)  )",
      ]),
    ).toEqual([
      '(error "line 2 column 22: bit-vector size must be greater than zero")',
      '(error "line 4 column 0: invalid bit-vector constant, index expected")',
      '(error "line 5 column 21: invalid bit-vector constant, index expected")',
      '(error "line 6 column 23: minimum number of exponent bits is 2")',
    ]);
  });
});

describe("a qualified constant, as Z3 5.3.2 reports it", () => {
  it("reports one that is unknown at the token after it", () => {
    expect(
      run(["(declare-const x Int)", "(simplify (as foo Int)  )", "(simplify (as x Bool)  )"]),
    ).toEqual([
      '(error "line 2 column 24: unknown constant fooInt ")',
      '(error "line 3 column 23: unknown constant xBool \ndeclared: (declare-fun x () Int) ")',
    ]);
  });

  it("reports a macro of another sort, but not an application of one", () => {
    expect(
      run([
        "(define-const c Bool true)",
        "(define-fun f ((y Int)) Int (+ y 1))",
        "(simplify (as c Int))",
        "(simplify (as c Bool))",
        "(simplify ((as f Bool) 1))",
        "(declare-const x Int)",
        "(simplify (! (> x 2) :named n))",
        "(simplify (as n Int))",
      ]),
    ).toEqual([
      '(error "line 3 column 20: sort mismatch in qualified identifier, expected: Int, got: Bool")',
      "true",
      "2",
      "(not (<= x 2))",
      '(error "line 8 column 20: sort mismatch in qualified identifier, expected: Int, got: Bool")',
    ]);
  });
});

describe("a finite-field literal, as Z3 5.3.2 reports it", () => {
  it("rejects one without a value and a modulus, and any in a logic without finite fields", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const a (_ BitVec 12))",
        "(assert (= a #f12))",
        "(simplify #f1m)",
        "(simplify #f-1m7m)",
        "(simplify #f12m13)",
        "(assert (= a #xF0a))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      '(error "line 3 column 13: invalid finite-field literal, expected #f<integer>m<prime>")',
      '(error "line 4 column 10: invalid finite-field literal, expected #f<integer>m<prime>")',
      '(error "line 5 column 10: invalid finite-field literal, expected #f<integer>m<prime>")',
      '(error "line 6 column 10: logic does not support finite fields")',
      "sat",
      "(\n  (define-fun a () (_ BitVec 12)\n    #xf0a)\n)",
    ]);
  });
});
