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
