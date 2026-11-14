import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

describe("applications of the builtin operators, as Z3 5.3.2 makes them", () => {
  it("joins Bool with Int and Real, and coerces a Boolean argument to ite", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Real)",
        "(declare-const p Bool)",
        "(simplify (= 1 true))",
        "(simplify (distinct 1 true))",
        "(simplify (ite true 1 false))",
        "(simplify (+ true 1))",
        "(simplify (< 1 true))",
        "(simplify (abs true))",
        "(simplify (to_real true))",
        "(display (= x p y))",
        "(display (distinct p 1 p))",
        "(display (ite p x p))",
        "(display (+ p 1.5 x))",
        "(display (- p))",
        "(display (/ p x))",
        "(display (mod x p))",
        "(display (>= y p))",
        "(display (is_int p))",
        "(display (< x))",
      ]),
    ).toEqual([
      "true",
      "false",
      "1",
      "2",
      "false",
      "1",
      "1.0",
      "(and (= (to_real x) (ite p 1.0 0.0)) (= (ite p 1.0 0.0) y))",
      "(distinct (ite p 1 0) 1 (ite p 1 0))",
      "(ite p x (ite p 1 0))",
      "(+ (ite p 1.0 0.0) (/ 3.0 2.0) (to_real x))",
      "(- (ite p 1 0))",
      "(/ (ite p 1.0 0.0) (to_real x))",
      "(mod x (ite p 1 0))",
      "(>= y (ite p 1.0 0.0))",
      "(is_int (ite p 1.0 0.0))",
      "true",
    ]);
  });

  it("reports the argument, the sorts or the arity that no coercion mends", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-sort U 0)",
        "(declare-const u U)",
        "(declare-const b3 (_ BitVec 3))",
        "(declare-const b2 (_ BitVec 2))",
        "(simplify (and p x))",
        "(simplify (ite x 1 2))",
        "(simplify (=> p p u))",
        "(simplify (+ x u))",
        "(simplify (/ x))",
        "(simplify (< x 1.5 u))",
        "(simplify (= b3 b2))",
        "(simplify (distinct u x p))",
        "(simplify (ite p b3 b2))",
        "(simplify (= p u))",
        "(simplify (not p p))",
        "(simplify (=> p))",
        "(simplify (mod x 1 2))",
        "(simplify (ite p x))",
        "(simplify not)",
      ]),
    ).toEqual([
      '(error "line 7 column 18: Sort mismatch at argument #2 for function (declare-fun and (Bool Bool) Bool) supplied sort is Int")',
      '(error "line 8 column 20: Sort mismatch at argument #1 for function (declare-fun ite (Bool Int Int) Int) supplied sort is Int")',
      '(error "line 9 column 19: Sort mismatch at argument #2 for function (declare-fun => (Bool Bool) Bool) supplied sort is U")',
      '(error "line 10 column 16: Sort mismatch at argument #2 for function (declare-fun + (Int Int) Int) supplied sort is U")',
      '(error "line 11 column 14: Sort mismatch at argument #1 for function (declare-fun / (Real Real) Real) supplied sort is Int")',
      '(error "line 12 column 20: Sort mismatch at argument #2 for function (declare-fun < (Real Real) Bool) supplied sort is U")',
      '(error "line 13 column 18: Sorts (_ BitVec 3) and (_ BitVec 2) are incompatible")',
      '(error "line 14 column 25: Sorts U and Int are incompatible")',
      '(error "line 15 column 22: Sorts (_ BitVec 3) and (_ BitVec 2) are incompatible")',
      '(error "line 16 column 16: Sorts Bool and U are incompatible")',
      '(error "line 17 column 18: Wrong number of arguments (2) passed to function (declare-fun not (Bool) Bool) \narg: p\n\narg: p")',
      '(error "line 18 column 15: Wrong number of arguments (1) passed to function (declare-fun => (Bool Bool) Bool) \narg: p")',
      '(error "line 19 column 20: Wrong number of arguments (3) passed to function (declare-fun mod (Int Int) Int) \narg: x\n\narg: 1\n\narg: 2")',
      '(error "line 20 column 18: unknown constant ite (Bool Int) ")',
      '(error "line 21 column 10: Wrong number of arguments (0) passed to function (declare-fun not (Bool) Bool) ")',
    ]);
  });

  it("takes no Boolean for a macro, no coercion of a definition, and checks is and update-field", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-datatypes ((P 0)) (((mk (fst Int) (snd Real)))))",
        "(declare-const d P)",
        "(define-fun m ((z Int)) Int (+ z 1))",
        "(define-fun r () Real 1)",
        "(define-const c Int 1.0)",
        "(simplify (m 1.5))",
        "(simplify (m p))",
        "(simplify ((_ update-field fst) d 1.0))",
        "(simplify ((_ update-field fst) d))",
        "(simplify ((_ update-field mk) d 1))",
        "(simplify ((_ is mk) 1))",
        "(simplify ((_ is mk) d d))",
        "(simplify ((_ is zz) 1))",
      ]),
    ).toEqual([
      '(error "line 5 column 23: invalid function/constant definition, sort mismatch")',
      '(error "line 6 column 23: invalid constant definition, sort mismatch")',
      "2",
      '(error "line 8 column 14: unknown constant m (Bool) \ndeclared: (declare-fun m (Int) Int) ")',
      '(error "line 9 column 37: second argument to field update should be Int instead of Real")',
      '(error "line 10 column 33: invalid number of arguments for datatype field update")',
      '(error "line 11 column 34: datatype field update requires a datatype accessor as the second argument")',
      '(error "line 12 column 22: invalid parameter to datatype function u().is_datatype(domain[0])")',
      '(error "line 13 column 24: invalid parameter to datatype function arity == 1 && num_parameters == 1 && parameters[0].is_ast() && is_func_decl(parameters[0].get_ast())")',
      '(error "line 14 column 22: invalid parameter to datatype function arity == 1 && num_parameters == 1 && parameters[0].is_ast() && is_func_decl(parameters[0].get_ast())")',
    ]);
  });
});

describe("terms that Z3 5.3.2 rejects", () => {
  it("rejects an empty list of variables, attributes outside a quantifier and bad attributes", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const p Bool)",
        "(simplify (forall () p))",
        "(simplify (! p :weight 2))",
        "(simplify (! p :pattern ((f 1))))",
        "(simplify (! p :qid foo))",
        "(simplify (! p foo bar))",
        "(simplify (! p :foo))",
        "(simplify (forall ((x Int)) (or (! (> (f x) 0) :pattern ((f x))) p)))",
        "(simplify (forall ((x Int)) (! (> (f x) 0) :no-pattern)))",
        "(simplify (forall ((x Int)) (! (> (f x) 0) :pattern ((f x) x))))",
        "(simplify (forall ((x Int)) x))",
        "(simplify (forall ((x Int)) zz p))",
        "(simplify (forall (x Int) p))",
        "(simplify (forall ((x Int) 5) p))",
        "(simplify (forall ((x Int Int)) p))",
      ]),
    ).toEqual([
      '(error "line 3 column 21: invalid quantifier, list of sorted variables is empty")',
      '(error "line 4 column 15: invalid attribute, not in the scope of a quantifier")',
      '(error "line 5 column 15: invalid attribute, not in the scope of a quantifier")',
      '(error "line 6 column 15: invalid attribute, not in the scope of a quantifier")',
      '(error "line 7 column 15: invalid attributed expression, keyword expected")',
      "(error \"line 8 column 19: invalid s-expression, unexpected ')'\")",
      '(error "line 9 column 47: invalid attribute, not in the scope of a quantifier")',
      '(error "line 10 column 54: invalid expression, unexpected input")',
      '(error "line 11 column 60: patterns cannot be variables or quantifiers")',
      '(error "line 12 column 29: quantifier body must be a Boolean expression")',
      '(error "line 13 column 28: unknown constant zz")',
      "(error \"line 14 column 19: invalid sorted variable, '(' expected got x\")",
      "(error \"line 15 column 27: invalid sorted variable, '(' expected got Int\")",
      "(error \"line 16 column 26: invalid sorted variable, ')' expected got Int\")",
    ]);
  });

  it("rejects a malformed let, at the token where Z3 stops", () => {
    expect(
      run([
        "(declare-const c Int)",
        "(simplify (let ((x 1 2)) x))",
        "(simplify (let ((x)) 1))",
        "(simplify (let (x 1) x))",
        "(simplify (let ((x (+ c 1)) 5) x))",
        "(simplify (let))",
        "(simplify (let ((x 1) (x 2)) x))",
        "(simplify (let ((x 1))))",
      ]),
    ).toEqual([
      '(error "line 2 column 23: malformed let expression")',
      '(error "line 3 column 19: malformed let expression")',
      "(error \"line 4 column 16: invalid let declaration, '(' expected got x\")",
      "(error \"line 5 column 28: invalid let declaration, '(' expected got c\")",
      "(error \"line 6 column 14: invalid let declaration, '(' expected got let\")",
      "2",
      "1",
    ]);
  });

  it("rejects a second name, a name of a declaration and a name over free variables", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (! p :named a))",
        "(assert (! q :named a))",
        "(simplify (! p :named p))",
        "(simplify (forall ((x Int)) (! (> x 0) :named d)))",
        "(simplify (forall ((x Int)) (or (! (> 1 0) :named g) p)))",
        "(simplify (! (! p :named h) :named h))",
        "(simplify (! p :lblpos))",
        "(simplify (! 1 :lblneg l))",
      ]),
    ).toEqual([
      '(error "line 4 column 21: named expression already defined")',
      '(error "line 5 column 23: invalid named expression, declaration already defined with this name p")',
      '(error "line 6 column 47: invalid named expression, expression contains free variables")',
      "true",
      '(error "line 8 column 36: named expression already defined")',
      '(error "line 9 column 22: invalid attribute value, symbol expected")',
      '(error "line 10 column 23: invalid labeled expression, expression must have Bool sort")',
    ]);
  });
});

describe("messages of the reader, as Z3 5.3.2 prints them", () => {
  it("reports an unknown indexed or qualified identifier and goes on", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const c Int)",
        "(simplify ((f) 1))",
        "(simplify ((f 1) 2))",
        "(simplify ((_ foo 1) c))",
        "(simplify (_ foo 1))",
        "(simplify (_ bv5 #x3))",
        "(simplify (_ bv5 3.0))",
        "(simplify (_ f 3))",
        "(simplify (as c Bool))",
        "(simplify (as c Int Int))",
        "(simplify (as (_ bv5 3) Int))",
        "(simplify (and (as c Bool) true))",
        "(simplify ((as f Bool) 1))",
        "(simplify :k)",
        "(simplify (_ 5))",
        "(simplify ((_ extract 1 zz) #b1010))",
      ]),
    ).toEqual([
      '(error "line 3 column 13: invalid function application, arguments missing")',
      '(error "line 4 column 18: select expects the first argument sort to be an array, but was provided a value of sort Int")',
      '(error "line 5 column 22: unknown constant foo (Int) ")',
      '(error "line 6 column 19: unknown constant foo")',
      "#b101",
      '(error "line 8 column 21: invalid bit-vector constant, index expected")',
      "(_ as-array f)",
      '(error "line 10 column 21: unknown constant cBool \ndeclared: (declare-fun c () Int) ")',
      "(error \"line 11 column 20: invalid qualified identifier, ')' expected got Int\")",
      '(error "line 12 column 28: sort mismatch in qualified identifier, expected: Int, got: (_ BitVec 3)")',
      '(error "line 13 column 27: unknown constant cBool \ndeclared: (declare-fun c () Int) ")',
      '(error "line 14 column 24: unknown constant f (Int) Bool \ndeclared: (declare-fun f (Int) Int) ")',
      '(error "line 15 column 10: invalid expression, unexpected keyword")',
      '(error "line 16 column 13: invalid indexed identifier, symbol expected")',
      '(error "line 17 column 24: invalid function declaration reference, unknown function zz")',
    ]);
  });

  it("does not know Set after a late set-logic, and reports the indices of a sort", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(set-logic QF_LIA)",
        "(declare-const s (Set Int))",
        "(declare-const t (Array Int Int))",
        "(declare-const b (_ BitVec 3))",
        "(declare-const fb (_ Foo 5))",
        "(declare-const c (_ BitVec))",
        "(declare-const e (_ BitVec p))",
      ]),
    ).toEqual([
      "(error \"line 3 column 18: unknown sort 'Set'\")",
      "(error \"line 6 column 25: unknown sort 'Foo'\")",
      '(error "line 7 column 26: expecting one integer parameter to bit-vector sort")',
      "(error \"line 8 column 27: invalid indexed sort, integer or ')' expected\")",
    ]);
  });

  it("does not know Int in a logic of reals only", () => {
    expect(
      run([
        "(set-logic QF_NRA)",
        "(declare-const x Int)",
        "(declare-const y Real)",
        "(declare-fun f (Int) Real)",
        "(simplify (+ y 1))",
        "(declare-const s (Set Real))",
        "(declare-const b (_ BitVec 3))",
        "(declare-const st String)",
      ]),
    ).toEqual([
      "(error \"line 2 column 17: Invalid constant declaration: unknown sort 'Int'\")",
      "(error \"line 4 column 16: Parsing function declaration. Expecting sort list '(': unknown sort 'Int'\")",
      "(+ 1.0 y)",
      "(error \"line 6 column 18: unknown sort 'Set'\")",
      "(error \"line 7 column 27: unknown sort 'BitVec'\")",
      "(error \"line 8 column 18: Invalid constant declaration: unknown sort 'String'\")",
    ]);
  });
});

describe("the terms the reader makes and frees, in Z3's order", () => {
  it("makes a label and a pattern in the order of their attributes", () => {
    expect(
      run([
        "(declare-fun q (Int) Bool)",
        "(declare-fun r (Int) Bool)",
        "(declare-const p Bool)",
        "(assert (forall ((x Int)) (! (q x) :pattern ((r x)) :lblpos l1)))",
        "(simplify (forall ((x Int)) (or (or (! (q x) :lblpos l1) (r x)) p)))",
        "(simplify (forall ((x Int)) (or (or (r x) (! (q x) :lblpos l1)) p)))",
      ]),
    ).toEqual([
      "(forall ((x Int)) (or (r x) (! (q x) :lblpos l1) p))",
      "(forall ((x Int)) (or (r x) (! (q x) :lblpos l1) p))",
    ]);
  });

  it("frees the terms of a command that failed", () => {
    expect(
      run([
        "(declare-fun f (Int) Bool)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(simplify (and p q r s zzz))",
        "(simplify (or (or s r) q p))",
      ]),
    ).toEqual(['(error "line 6 column 23: unknown constant zzz")', "(or q r s p)"]);
    expect(
      run([
        "(declare-fun f (Int) Bool)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(simplify (or (forall ((x Int)) (! (or (f x) (f 1) (f 2)) :pattern ((f x)) :pattern ((f 2) (f x)))) (f 3) zzz))",
        "(simplify (or (or s r) q p))",
      ]),
    ).toEqual(['(error "line 6 column 106: unknown constant zzz")', "(or r q p s)"]);
  });

  it("frees a binding of a let that its body drops", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(simplify (let ((x (and p q r s))) 2))",
        "(simplify (or (or s r) q p))",
        "(simplify (let ((x (and p q))) x))",
        "(simplify (or (or s r) q p))",
      ]),
    ).toEqual(["2", "(or s r q p)", "(and p q)", "(or s r q p)"]);
  });
});
