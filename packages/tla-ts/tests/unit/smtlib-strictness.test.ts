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

  it("reports the bit-vector argument whose size differs from the first one's", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 6))",
        "(simplify (bvshl x y))",
        "(simplify (bvadd x y x))",
        "(simplify (bvneg x y))",
        "(simplify (bvadd x (bvmul y y)))",
        "(simplify (bvule (bvadd y y) x))",
        "(assert (forall ((z (_ BitVec 4))) (= (bvadd x z) x)))",
      ]),
    ).toEqual([
      '(error "line 3 column 20: Argument y at position 1 has sort (_ BitVec 6) it does not match declaration (declare-fun bvshl ((_ BitVec 8) (_ BitVec 8)) (_ BitVec 8))")',
      '(error "line 4 column 22: declared sorts do not match supplied sorts")',
      '(error "line 5 column 20: declared arity mismatches supplied arity")',
      '(error "line 6 column 30: Argument (bvmul y y) at position 1 has sort (_ BitVec 6) it does not match declaration (declare-fun bvadd ((_ BitVec 8) (_ BitVec 8)) (_ BitVec 8))")',
      '(error "line 7 column 30: Argument x at position 1 has sort (_ BitVec 8) it does not match declaration (declare-fun bvule ((_ BitVec 6) (_ BitVec 6)) Bool)")',
      '(error "line 8 column 48: Argument (:var 0) at position 1 has sort (_ BitVec 4) it does not match declaration (declare-fun bvadd ((_ BitVec 8) (_ BitVec 8)) (_ BitVec 8))")',
    ]);
  });

  it("reports a bit-vector operator whose first argument is no bit-vector as applied to the wrong sort", () => {
    expect(
      run([
        "(declare-const v (_ BitVec 4))",
        "(declare-const b Bool)",
        "(declare-const x Int)",
        "(simplify (bvuge true v))",
        "(simplify (concat b #b1))",
        "(simplify ((_ extract 1 0) b))",
        "(simplify ((_ zero_extend 1) x))",
        "(simplify (bvnot 1))",
        "(simplify (bv2nat b))",
        "(simplify ((_ int2bv 3) b))",
      ]),
    ).toEqual([
      '(error "line 4 column 23: operator is applied to arguments of the wrong sort")',
      '(error "line 5 column 23: operator is applied to arguments of the wrong sort")',
      '(error "line 6 column 28: operator is applied to arguments of the wrong sort")',
      '(error "line 7 column 30: operator is applied to arguments of the wrong sort")',
      '(error "line 8 column 18: operator is applied to arguments of the wrong sort")',
      '(error "line 9 column 19: operator is applied to arguments of the wrong sort")',
      "((_ int_to_bv 3) b)",
    ]);
  });

  it("reports the arguments of true and false as too many", () => {
    expect(
      run(["(declare-const b Bool)", "(simplify (true #b101))", "(simplify (false b b))"]),
    ).toEqual([
      '(error "line 2 column 21: Wrong number of arguments (1) passed to function (declare-fun true () Bool) \narg: #b101")',
      '(error "line 3 column 20: Wrong number of arguments (2) passed to function (declare-fun false () Bool) \narg: b\n\narg: b")',
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

  it("reports a sort list without a symbol at its head, with the context of the sort", () => {
    expect(
      run([
        "(declare-datatypes ((D 0)) (((mk (f ())))))",
        "(declare-datatypes ((E 0)) (((mk2 (g (5 Int))))))",
        "(declare-fun h (()) Int)",
        "(declare-fun k (Int) ())",
        "(define-fun m ((x ())) Int 1)",
        "(simplify (as foo ()))",
        "(define-sort S () ())",
        "(declare-const a (Array () Int))",
        "(declare-const b (Array Int (1)))",
      ]),
    ).toEqual([
      "(error \"line 1 column 38: invalid sort, symbol or '_' expected\")",
      "(error \"line 2 column 38: invalid sort, symbol or '_' expected\")",
      "(error \"line 3 column 17: Parsing function declaration. Expecting sort list '(' invalid sort, symbol or '_' expected\")",
      "(error \"line 4 column 22: Invalid function declaration invalid sort, symbol or '_' expected\")",
      "(error \"line 5 column 19: invalid sorted variables invalid sort, symbol or '_' expected\")",
      "(error \"line 6 column 19: Invalid qualified identifier invalid sort, symbol or '_' expected\")",
      "(error \"line 7 column 19: invalid sort, symbol or '_' expected\")",
      "(error \"line 8 column 25: Invalid constant declaration invalid sort, symbol or '_' expected\")",
      "(error \"line 9 column 29: Invalid constant declaration invalid sort, symbol or '_' expected\")",
    ]);
  });

  it("reports an unknown sort of a command argument with the context of the argument", () => {
    expect(
      run([
        "(declare-rel p ((_ BitVec 4)))",
        "(declare-rel q (Foo))",
        "(declare-var y Foo)",
        "(declare-var x (_ BitVec 4))",
        "(query (and (p x) true))",
        "(query (p ((_ BitVec 4)) Foo))",
        "(dbg-some-value Foo)",
      ]),
    ).toEqual([
      "(error \"line 2 column 16: expecting sort list starting with '(': unknown sort 'Foo'\")",
      "(error \"line 3 column 15: invalid command argument, sort expected: unknown sort 'Foo'\")",
      "(error \"line 5 column 13: Invalid function name. Expecting sort list starting with '(' to disambiguate function name: unknown sort 'p'\")",
      "(error \"line 6 column 25: Invalid function name: unknown sort 'Foo'\")",
      "(error \"line 7 column 16: invalid command argument, sort expected: unknown sort 'Foo'\")",
    ]);
  });

  it("makes a declaration with a token before its closing parenthesis, and reports the token", () => {
    expect(
      run([
        "(declare-const a Int 1)",
        "(declare-fun f (Int) Int 2)",
        "(define-fun g ((x Int)) Int (+ x 1) 3)",
        "(define-const c Int 4 5)",
        "(define-fun-rec r ((x Int)) Int x 6)",
        "(define-sort S () Int 7)",
        "(declare-sort T 0 8)",
        "(declare-datatype D ((d1) (d2)) 9)",
        "(define-funs-rec ((h ((x Int)) Int)) (x) 10)",
        "(define-fun e () Int true   11)",
        "(declare-const a Int   12)",
        "(declare-const s S)",
        "(declare-const t T)",
        "(declare-const d D)",
        "(simplify (+ a (f (g c)) (r 1) (h 2)))",
      ]),
    ).toEqual([
      "(error \"line 1 column 22: invalid constant declaration, ')' expected\")",
      "(error \"line 2 column 25: invalid function declaration, ')' expected\")",
      "(error \"line 3 column 36: invalid function/constant definition, ')' expected\")",
      "(error \"line 4 column 22: invalid constant definition, ')' expected\")",
      "(error \"line 5 column 34: invalid function/constant definition, ')' expected\")",
      "(error \"line 6 column 22: invalid sort definition, ')' expected\")",
      "(error \"line 7 column 18: invalid sort declaration, ')' expected\")",
      "(error \"line 8 column 32: invalid end of datatype declaration, ')' expected\")",
      "(error \"line 9 column 41: invalid function/constant definition, ')' expected\")",
      '(error "line 10 column 28: invalid function/constant definition, sort mismatch")',
      "(error \"line 11 column 23: invalid declaration, constant 'a' (with the given signature) already declared\")",
      "(+ 3 a (f 5))",
    ]);
  });

  it("reports a malformed tactic or probe at the s-expression, a list at its closing parenthesis", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(apply solve-eqs2)",
        "(apply (then simplify  foo   ) )",
        "(apply (then simplify (foo x)  ) )",
        "(apply (then)  )",
        "(apply ( )  )",
        "(apply ((then) simplify) )",
        "(apply 5  )",
        "(apply (or-else) )",
        "(apply (try-for simplify)  )",
        "(apply (try-for simplify x)  )",
        "(apply (repeat)  )",
        "(apply (repeat simplify x) )",
        "(apply (using-params simplify :foo 1) )",
        "(apply (using-params simplify foo 1) )",
        "(apply (using-params simplify :som) )",
        "(apply (using-params simplify :som 3) )",
        "(apply (if) )",
        "(apply (if foo simplify skip) )",
        "(apply (if (> foo 1) simplify skip) )",
        "(apply (fail-if) )",
        "(apply (when) )",
        "(apply (echo) )",
        "(apply (fail-if-branching) )",
        "(check-sat-using (par-or (if has-quantifiers qe aig) (par-or solve-eqs2 qfnia)) :print_unsat_core true)",
        "(check-sat-using   foo  :print_model true)",
      ]),
    ).toEqual([
      '(error "line 3 column 7: invalid tactic, unknown tactic solve-eqs2")',
      '(error "line 4 column 23: invalid tactic, unknown tactic foo")',
      '(error "line 5 column 28: invalid tactic, unknown tactic combinator foo")',
      '(error "line 6 column 12: invalid and-then combinator, at least one argument expected")',
      '(error "line 7 column 9: invalid tactic, arguments expected")',
      '(error "line 8 column 23: invalid tactic, symbol expected")',
      '(error "line 9 column 7: invalid tactic, unexpected input")',
      '(error "line 10 column 15: invalid or-else combinator, at least one argument expected")',
      '(error "line 11 column 24: invalid try-for combinator, two arguments expected")',
      '(error "line 12 column 26: invalid try-for combinator, second argument must be an unsigned integer")',
      '(error "line 13 column 14: invalid repeat combinator, one or two arguments expected")',
      '(error "line 14 column 25: invalid repeat combinator, second argument must be an unsigned integer")',
      '(error "line 15 column 35: invalid using-params combinator, unknown parameter foo")',
      '(error "line 16 column 30: invalid using-params combinator, keyword expected")',
      '(error "line 17 column 30: invalid using-params combinator, parameter value expected")',
      '(error "line 18 column 35: invalid parameter value, true or false expected")',
      '(error "line 19 column 10: invalid if/conditional combinator, three arguments expected")',
      '(error "line 20 column 11: invalid probe, unknown builtin probe foo")',
      '(error "line 21 column 14: invalid probe, unknown builtin probe foo")',
      '(error "line 22 column 15: invalid fail-if tactic, one argument expected")',
      '(error "line 23 column 12: invalid when combinator, two arguments expected")',
      '(error "line 24 column 12: invalid echo tactic, must have at least one argument")',
      '(error "line 25 column 25: invalid fail-if-branching combinator, one or two arguments expected")',
      '(error "line 26 column 61: invalid tactic, unknown tactic solve-eqs2")',
      '(error "line 27 column 19: invalid tactic, unknown tactic foo")',
    ]);
  });

  it("finds a parameter of a combinator in its first child that has it", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(assert (> a 5))",
        "(check-sat-using (using-params (then simplify ctx-simplify) :rewriter.max_steps 4294967295))",
        "(check-sat-using (using-params (then ctx-simplify simplify) :rewriter.max_steps 4294967295))",
      ]),
    ).toEqual([
      "unknown",
      '(error "line 4 column 80: invalid using-params combinator, unknown parameter rewriter.max_steps")',
    ]);
  });

  it("takes a whole decimal as a probe constant and rejects any other decimal", () => {
    expect(
      run([
        "(apply (fail-if (> 3.0 2)))",
        "(apply (fail-if (> 2.5 2)))",
        "(apply (fail-if (> #x3 2)))",
        "(apply (fail-if (> 2147483648.0 2)))",
      ]),
    ).toEqual([
      '(error "tactic failed: fail-if tactic")',
      '(error "line 2 column 19: invalid probe, constant is too big to fit in a fixed size integer")',
      '(error "line 3 column 19: invalid probe, unexpected input")',
      '(error "line 4 column 19: invalid probe, constant is too big to fit in a fixed size integer")',
    ]);
  });

  // Z3 5.3.2 fails both: its n-ary probes read (+ 2 3) as 7 and (* 2 3) as 12.
  it("applies an n-ary probe to each argument once", () => {
    expect(run(["(apply (fail-if (> (+ 2 3) 6)))", "(apply (fail-if (> (* 2 3) 11)))"])).toEqual([
      "(goals\n(goal\n  :precision precise :depth 0)\n)",
      "(goals\n(goal\n  :precision precise :depth 0)\n)",
    ]);
  });

  it("takes no negative numeral for an unsigned value of a tactic or a command", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(apply (! simplify :max_steps -1) )",
        "(apply (repeat simplify -1) )",
        "(apply (try-for simplify -1) )",
        "(apply (fail-if-branching simplify -1) )",
        "(check-sat-using smt :timeout -1)",
        "(apply simplify :timeout -1)",
        "(apply (if (> 5 -1) skip fail) )",
        "(apply (! simplify :max_steps 4294967296) )",
        "(apply (! propagate-values :max_rounds -2) )",
      ]),
    ).toEqual([
      '(error "line 3 column 30: invalid parameter value, unsigned integer expected")',
      '(error "line 4 column 26: invalid repeat combinator, second argument must be an unsigned integer")',
      '(error "line 5 column 27: invalid try-for combinator, second argument must be an unsigned integer")',
      '(error "line 6 column 37: invalid fail-if-branching combinator, second argument must be an unsigned integer")',
      '(error "line 7 column 30: invalid indexed identifier, index is too big to fit in an unsigned machine integer")',
      '(error "line 8 column 25: invalid indexed identifier, index is too big to fit in an unsigned machine integer")',
      "(goals\n(goal\n  (> x 0)\n  :precision precise :depth 0)\n)",
      '(error "line 10 column 30: invalid parameter value, unsigned integer expected")',
      '(error "line 11 column 39: invalid parameter value, unsigned integer expected")',
    ]);
  });

  it("names the identifier read last where a parenthesis is missing", () => {
    expect(
      run([
        "(declare-const x 5)",
        '(declare-fun f (Int "s") Bool)',
        "(declare-const y :k)",
        "(declare-datatypes ((T1 0)) (((mk (a Int 5)))))",
        "(declare-datatypes ((T3 0)) ((5)))",
        "(declare-datatypes ((T5 0)) 5)",
        "(declare-datatypes ((T7 0)) ((par (A) 5)))",
        "(declare-datatypes x ())",
        "(declare-datatypes ((T10 0) 5) ((mk)))",
        "(define-sort S x Int)",
        "(declare-const z Real)",
        "(assert (= (* z z) 2.0))",
        "(check-sat)",
        "(get-value z)",
        "(get-value ((root-obj (+ (^ x 2) (- 2)) 1 4)))",
        "(check-sat-assuming 5)",
      ]),
    ).toEqual([
      "(error \"line 1 column 18: invalid sort, symbol, '_' or '(' expected got x\")",
      "(error \"line 2 column 20: invalid sort, symbol, '_' or '(' expected got Int\")",
      "(error \"line 3 column 17: invalid sort, symbol, '_' or '(' expected got :k\")",
      "(error \"line 4 column 41: invalid accessor declaration, ')' expected got Int\")",
      "(error \"line 5 column 30: invalid datatype declaration, '(' or ')' expected got T3\")",
      "(error \"line 6 column 28: invalid datatype declaration, '(' expected got T5\")",
      "(error \"line 7 column 38: invalid constructor declaration after par, '(' expected got A\")",
      '(error "line 8 column 19: invalid sort declaration, parameters missing got x")',
      "(error \"line 9 column 28: invalid sort declaration, '(' expected got T10\")",
      '(error "line 10 column 15: invalid sort declaration, parameters missing got x")',
      "sat",
      "(error \"line 14 column 11: invalid get-value command, '(' expected got z\")",
      "(error \"line 15 column 42: invalid root-obj, ')' expected got -\")",
      "(error \"line 16 column 20: invalid check-sat-assuming command, '(', expected got check-sat-assuming\")",
    ]);
  });

  it("takes unsigned integers for get-model and prints the model for the index 0", () => {
    const model = "(\n  (define-fun x () Int\n    3)\n)";
    expect(
      run([
        "(declare-const x Int)",
        "(get-model x)",
        "(get-model 0)",
        "(assert (> x 2))",
        "(check-sat)",
        "(get-model 0)",
        "(get-model 0 0)",
        "(get-model 4294967296)",
        '(get-model "a")',
        "(get-model 1.5)",
        "(get-model 3 0)",
        "(get-model",
      ]),
    ).toEqual([
      '(error "line 2 column 11: invalid command argument, unsigned integer expected")',
      '(error "line 3 column 12: model is not available")',
      "sat",
      model,
      model,
      '(error "line 8 column 11: invalid indexed identifier, index is too big to fit in an unsigned machine integer")',
      '(error "line 9 column 11: invalid command argument, unsigned integer expected")',
      '(error "line 10 column 11: invalid command argument, unsigned integer expected")',
      model,
      '(error "line 12 column 10: invalid command argument, unsigned integer expected")',
    ]);
  });

  it("reports a datatype sort that is already defined at the token where Z3 declares it", () => {
    expect(
      run([
        "(declare-sort T 0)",
        "(declare-datatypes ((T 0)) (((mk))))",
        "(declare-datatypes ((T 0 5)) (((mk))))",
        "(declare-datatypes (()) (((mk))))",
        "(declare-datatype T ((mk)))",
        "(declare-datatype T (par (A) ((mk (a A)))))",
        "(declare-datatype)",
        "(declare-datatypes ((U 0) (U 0)) (((mk)) ((mk2))))",
      ]),
    ).toEqual([
      '(error "line 2 column 24: sort already defined T")',
      '(error "line 3 column 25: sort already defined T")',
      '(error "line 4 column 21: invalid sort name, identified expected")',
      '(error "line 5 column 21: sort already defined T")',
      '(error "line 6 column 30: sort already defined T")',
      '(error "line 7 column 17: unexpected token used as datatype name")',
      '(error "line 8 column 30: sort already defined U")',
    ]);
  });

  it("rejects a second constructor or accessor of a datatype that Z3 makes as the same declaration", () => {
    expect(
      run([
        "(declare-datatypes ((C 0) (D 0)) (((red) (red)) ((green))))",
        "(declare-datatypes ((E 0)) (((a (f Int) (f Int)) (b))))",
        "(declare-datatype F ((blue) (blue)))",
        "(declare-const d D)",
        "(declare-const e E)",
        "(declare-const c F)",
        "(assert (= d green))",
        "(assert (= e b))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "(error \"line 1 column 59: invalid declaration, constant 'red' (with the given signature) already declared\")",
      "(error \"line 2 column 54: invalid declaration, function 'f' (with the given signature) already declared\")",
      "(error \"line 3 column 35: invalid declaration, constant 'blue' (with the given signature) already declared\")",
      "sat",
      [
        "(",
        "  (define-fun e () E",
        "    b)",
        "  (define-fun d () D",
        "    green)",
        "  (define-fun c () F",
        "    blue)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the declaration that declare-fun rejects, so the next one takes its id", () => {
    const getModel = (declarations: string[]) =>
      run([
        "(set-logic QF_DT)",
        ...declarations,
        "(declare-datatypes ((C 0)) (((k0) (k1) (k2) (k3) (k4) (k5) (k6))))",
        "(declare-const e0 C)",
        "(check-sat)",
        "(get-model)",
      ]);
    expect(getModel(["(declare-sort V 0)", "(declare-fun f (V) Bool)"])).toEqual([
      '(error "line 3 column 23: logic does not support uninterpreted functions")',
      "sat",
      ["(", "  (define-fun e0 () C", "    k4)", ")"].join("\n"),
    ]);
    expect(getModel(["(declare-const p Bool)", "(declare-const p Bool)"])).toEqual([
      "(error \"line 3 column 21: invalid declaration, constant 'p' (with the given signature) already declared\")",
      "sat",
      ["(", "  (define-fun p () Bool", "    false)", "  (define-fun e0 () C", "    k4)", ")"].join(
        "\n",
      ),
    ]);
  });

  it("rejects a repeated accessor before declare-datatype makes its datatype", () => {
    expect(
      run([
        "(declare-datatype H ((h1 (s1 Int) (s1 Int)) (h2)))",
        "(declare-datatype F2 ((c1 (acc Int)) (c2 (acc Bool))))",
        "(declare-const u H)",
        "(declare-const v F2)",
        "(assert (= v (c2 true)))",
        "(assert ((_ is h1) u))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "(error \"line 1 column 19: invalid datatype declaration, repeated accessor identifier 's1'\")",
      "(error \"line 2 column 18: invalid datatype declaration, repeated accessor identifier 'acc'\")",
      '(error "line 5 column 21: unknown constant c2 (Bool) ")',
      '(error "line 6 column 20: datatype constructors have not been created")',
      "sat",
      '(error "line 8 column 10: datatype constructors have not been created")',
    ]);
  });

  it("names the declaration that lacks a symbol, and takes _ and as only for define-const", () => {
    expect(
      run([
        "(declare-const 5 Int)",
        "(declare-fun 5 () Int)",
        "(declare-sort 5)",
        "(define-sort 5 () Int)",
        "(define-fun 5 () Int 1)",
        "(define-const 5 Int 1)",
        "(declare-const _ Int)",
        "(declare-sort as)",
        "(define-fun as () Int 1)",
        "(define-const _ Int 1)",
        "(declare-const)",
        "(define-const)",
      ]),
    ).toEqual([
      '(error "line 1 column 16: invalid constant declaration, symbol expected")',
      '(error "line 2 column 13: invalid function declaration, symbol expected")',
      '(error "line 3 column 14: invalid sort declaration, symbol expected")',
      '(error "line 4 column 13: invalid sort definition, symbol expected")',
      '(error "line 5 column 12: invalid function/constant definition, symbol expected")',
      '(error "line 6 column 14: invalid constant definition, symbol expected")',
      '(error "line 7 column 15: invalid constant declaration, symbol expected")',
      '(error "line 8 column 14: invalid sort declaration, symbol expected")',
      '(error "line 9 column 12: invalid function/constant definition, symbol expected")',
      '(error "line 11 column 14: invalid constant declaration, symbol expected")',
      '(error "line 12 column 13: invalid constant definition, symbol expected")',
    ]);
  });

  it("reports what a command expects where the file ends", () => {
    expect(
      [
        "(assert true",
        "(assert (and true",
        "(check-sat",
        "(declare-const x Int",
        "(exit",
        "(push",
        "(foo a b",
        "(check-sat-using (then",
        "(assert (_ bv1",
        '(echo "a"',
        '(echo "a" ',
        "(assert #b1",
      ].map((script) => run([script])),
    ).toEqual([
      ["(error \"line 1 column 13: invalid assert command, ')' expected\")"],
      ['(error "line 1 column 18: invalid expression, unexpected input")'],
      ['(error "line 1 column 11: invalid expression, unexpected input")'],
      ["(error \"line 1 column 21: invalid constant declaration, ')' expected\")"],
      ['(error "line 1 column 6: invalid command, too many arguments")'],
      ['(error "line 1 column 6: invalid push command, integer expected")'],
      ['(error "line 1 column 9: invalid s-expression, unexpected end of file")'],
      ['(error "line 1 column 23: invalid s-expression, unexpected end of file")'],
      [
        "(error \"line 1 column 15: invalid indexed identifier, integer, identifier or '(' expected\")",
      ],
      ['(error "line 1 column 7: unexpected end of file")'],
      ["a", '(error "line 1 column 11: invalid command, too many arguments")'],
      ['(error "line 1 column 9: unexpected end of file")'],
    ]);
  });

  it("checks the value of a parameter against its kind, as gparams does, and goes on", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(set-option :sat.restart.max foo)",
        "(set-option :smt.mbqi maybe)",
        "(set-option :sat.restart.factor x1)",
        "(set-option :sat.restart.max 99999999999)",
        "(set-option :smt.relevancy 1.5)",
        "(set-option :model.completion #b1)",
        "(set-option :timeout none)",
        '(set-option :smt.random_seed "12")',
        "(set-option :smt.mbqi |false|)",
        "(set-option :sat.restart.factor 1.5)",
        "(assert (> x 0))",
        "(check-sat)",
      ]),
    ).toEqual([
      `(error "line 2 column 29: Expected values for parameter restart.max is an unsigned integer. It was given argument 'foo'")`,
      `(error "line 3 column 22: Expected values for parameter mbqi are 'true' or 'false'. It was given argument 'maybe'")`,
      `(error "line 4 column 32: Expected values for parameter restart.factor is a double. It was given argument 'x1'")`,
      `(error "line 5 column 29: invalid value '99999999999' for unsigned int parameter 'restart.max'")`,
      `(error "line 6 column 27: Expected values for parameter relevancy is an unsigned integer. It was given argument '3/2'")`,
      `(error "line 7 column 30: Expected values for parameter completion are 'true' or 'false'. It was given argument '1'")`,
      `(error "line 8 column 21: Expected values for parameter timeout is an unsigned integer. It was given argument 'none'")`,
      "sat",
    ]);
  });

  it("sets a whole decimal as an integer", () => {
    expect(
      run([
        "(set-option :rlimit 30.0)",
        "(get-option :rlimit)",
        "(set-option :smt.mbqi.max_iterations 3.0)",
        "(get-option :smt.mbqi.max_iterations)",
        "(set-option :sat.restart.factor 1.5)",
        "(get-option :sat.restart.factor)",
        "(set-option :sat.restart.factor 2.0)",
        "(get-option :sat.restart.factor)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> (+ x y) 2))",
        "(assert (< (- x y) 7))",
        "(assert (or (> x 10) (< y -3)))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "30",
      "3",
      "1.5",
      "2",
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
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

  it("asserts the term of an assert with a token before its closing parenthesis, then reports the token", () => {
    expect(
      run([
        "(set-option :print-success true)",
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(declare-const b Bool)",
        "(assert (> (* x x) 1) 2)",
        "(assert b 1)",
        "(assert (not b) (> x 2))",
        "(check-sat)",
      ]),
    ).toEqual([
      "success",
      "success",
      "success",
      "success",
      '(error "line 5 column 22: logic does not support nonlinear arithmetic")',
      `(error "line 6 column 10: invalid assert command, ')' expected")`,
      `(error "line 7 column 16: invalid assert command, ')' expected")`,
      "unsat",
    ]);
  });

  it("reports a term of assert or check-sat that is not Boolean at the token after it", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert x)",
        "(assert x true)",
        "(check-sat 1)",
        "(check-sat-assuming (x true))",
        "(check-sat-assuming (true x))",
        "(assert (+ x 1))",
      ]),
    ).toEqual([
      '(error "line 2 column 9: invalid assert command, term is not Boolean")',
      '(error "line 3 column 10: invalid assert command, term is not Boolean")',
      '(error "line 4 column 12: invalid check-sat command, argument must be a Boolean literal")',
      '(error "line 5 column 23: invalid check-sat command, argument must be a Boolean literal")',
      '(error "line 6 column 27: invalid check-sat command, argument must be a Boolean literal")',
      '(error "line 7 column 15: invalid assert command, term is not Boolean")',
    ]);
  });

  it("runs a command on its arguments, then reports a token past them", () => {
    expect(
      run([
        "(set-option :print-success true)",
        "(declare-const x Int)",
        '(echo "a" "b")',
        "(echo 1)",
        "(display x x)",
        "(minimize)",
        "(minimize x 1)",
        "(maximize true x)",
        "(set-logic 1)",
        "(set-logic QF_LIA x)",
        "(get-unsat-core x)",
        "(reset-assertions x)",
        "(exit 1)",
        "(check-sat)",
      ]),
    ).toEqual([
      "success",
      "success",
      "a",
      '(error "line 3 column 10: invalid command, too many arguments")',
      '(error "line 4 column 6: invalid command argument, string expected")',
      "x",
      '(error "line 5 column 11: invalid command, too many arguments")',
      '(error "line 6 column 9: invalid command, argument(s) missing")',
      "success",
      '(error "line 7 column 12: invalid command, too many arguments")',
      '(error "line 8 column 15: Objective must be bit-vector, integer or real")',
      '(error "line 9 column 11: invalid command argument, symbol expected")',
      "success",
      '(error "line 10 column 18: invalid command, too many arguments")',
      '(error "line 11 column 16: invalid command, too many arguments")',
      '(error "line 12 column 18: invalid command, too many arguments")',
      '(error "line 13 column 6: invalid command, too many arguments")',
      "sat",
    ]);
  });

  it("reports a token before the closing parenthesis of push, pop, reset and get-value", () => {
    expect(
      run([
        "(set-option :print-success true)",
        "(declare-const x Int)",
        "(push 1 2)",
        "(push x)",
        "(pop 1 x)",
        "(pop 0 1)",
        "(pop 5 1)",
        "(pop 1 2)",
        "(check-sat)",
        "(get-value (x) 1)",
        "(get-value (x) :foo)",
        "(reset 1)",
        "(check-sat)",
        "(reset)",
      ]),
    ).toEqual([
      "success",
      "success",
      `(error "line 3 column 8: invalid push command, ')' expected")`,
      '(error "line 4 column 6: invalid push command, integer expected")',
      `(error "line 5 column 7: invalid pop command, ')' expected")`,
      `(error "line 6 column 7: invalid pop command, ')' expected")`,
      '(error "line 7 column 7: invalid pop command, argument is greater than the current stack depth")',
      '(error "line 8 column 7: invalid pop command, argument is greater than the current stack depth")',
      "sat",
      `(error "line 10 column 15: invalid get-value command, ')' expected")`,
      `(error "line 11 column 15: invalid get-value command, ')' expected")`,
      `(error "line 12 column 7: invalid reset command, ')' expected")`,
      "sat",
      "success",
    ]);
  });

  it("reports a parameter of simplify, assert-soft or eval that is not a keyword", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(simplify (+ x 1) false)",
        "(simplify (+ x 1) :som true 1)",
        "(assert-soft p 1)",
        "(assert-soft p :weight 2 x)",
        "(check-sat)",
        "(eval x 2)",
        "(eval x (+ x 1))",
      ]),
    ).toEqual([
      '(error "line 3 column 18: invalid command argument, keyword expected")',
      '(error "line 4 column 28: invalid command argument, keyword expected")',
      '(error "line 5 column 15: invalid command argument, keyword expected")',
      '(error "line 6 column 25: invalid command argument, keyword expected")',
      "sat",
      '(error "line 8 column 8: invalid command argument, keyword expected")',
      '(error "line 9 column 8: invalid command argument, keyword expected")',
    ]);
  });

  it("reports a term of assert-soft that is not Boolean at the token after it", () => {
    expect(
      run([
        "(declare-const x0 Int)",
        "(assert-soft x0 :weight 3)",
        "(assert-soft x0)",
        "(assert-soft   x0   :id g)",
        "(assert-soft (+ x0 1) :weight 2 :id h)",
        "(assert-soft x0",
        ")",
        "(assert-soft (> x0 1) :weight x0)",
        "(assert-soft x0 :dweight 3)",
        "(check-sat)",
      ]),
    ).toEqual([
      '(error "line 2 column 16: Invalid type for expression. Expected Boolean type.")',
      '(error "line 3 column 15: Invalid type for expression. Expected Boolean type.")',
      '(error "line 4 column 20: Invalid type for expression. Expected Boolean type.")',
      '(error "line 5 column 22: Invalid type for expression. Expected Boolean type.")',
      '(error "line 7 column 0: Invalid type for expression. Expected Boolean type.")',
      '(error "line 8 column 30: invalid command argument, numeral expected")',
      '(error "line 9 column 16: Invalid type for expression. Expected Boolean type.")',
      "sat",
    ]);
  });

  it("checks the parameters of assert-soft by their kinds, and takes one without a value", () => {
    const runSoft = (command: string) =>
      run([
        "(declare-const p Bool)",
        command,
        "(assert (not p))",
        "(check-sat)",
        "(get-objectives)",
      ]);
    expect(run(["(declare-const p Bool)", "(assert-soft p :weight x)", "(check-sat)"])).toEqual([
      '(error "line 2 column 23: invalid command argument, numeral expected")',
      "sat",
    ]);
    expect(run(["(declare-const p Bool)", "(assert-soft p :weight #x3)", "(check-sat)"])).toEqual([
      '(error "line 2 column 23: invalid command argument, numeral expected")',
      "sat",
    ]);
    expect(run(["(declare-const p Bool)", "(assert-soft p :id 3)", "(check-sat)"])).toEqual([
      '(error "line 2 column 19: invalid command argument, symbol expected")',
      "sat",
    ]);
    expect(run(["(declare-const p Bool)", "(assert-soft p :dweight 3)", "(check-sat)"])).toEqual([
      '(error "line 2 column 15: invalid keyword argument")',
      "sat",
    ]);
    expect(runSoft("(assert-soft p :weight)")).toEqual(["sat", "(objectives\n ( 1)\n)"]);
    expect(runSoft("(assert-soft p :weight 2 :weight)")).toEqual(["sat", "(objectives\n ( 2)\n)"]);
    expect(runSoft("(assert-soft p :WEIGHT 4 :Id |a b|)")).toEqual([
      "sat",
      "(objectives\n (a b 4)\n)",
    ]);
  });

  it("gives an assert-soft none of the parameters of one that failed, where Z3 keeps them", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert-soft p :weight 3 :dweight 1)",
        "(assert-soft q)",
        "(assert (not p))",
        "(assert (not q))",
        "(check-sat)",
        "(get-objectives)",
      ]),
    ).toEqual([
      '(error "line 3 column 25: invalid keyword argument")',
      "sat",
      "(objectives\n ( 1)\n)",
    ]);
  });

  it("reads the keywords of an assert-soft after one that left a keyword without a value, where Z3 reads a value", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert-soft p :weight 3 :id)",
        "(assert-soft q :weight 2)",
        "(assert-soft p)",
        "(assert (not p))",
        "(assert (not q))",
        "(check-sat)",
        "(get-objectives)",
      ]),
    ).toEqual(["sat", "(objectives\n ( 6)\n)"]);
  });
});
