import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

// A random 3-SAT instance over x0 to x53: 1 is x0 and -1 is (not x0).
const RESTART_CLAUSES = [
  [-23, -26, 29],
  [12, -21, 25],
  [8, -40, -46],
  [14, -15, -49],
  [7, -41, 42],
  [-51, 24, 9],
  [-10, -15, -26],
  [48, 9, -8],
  [-51, 35, -52],
  [-38, 53, -47],
  [-24, 43, 27],
  [-12, 39, 5],
  [50, -12, -27],
  [24, -29, 38],
  [-24, 16, -8],
  [17, 11, 22],
  [-7, -46, -39],
  [-14, -36, 43],
  [3, -13, 4],
  [-29, 30, 48],
  [44, 35, 9],
  [1, -13, 45],
  [53, -31, -8],
  [-35, -34, -14],
  [48, -23, 52],
  [23, 29, -26],
  [22, -11, 35],
  [44, -13, 7],
  [-2, 38, 36],
  [13, 45, -15],
  [25, 26, 24],
  [49, -38, 37],
  [38, -30, 48],
  [34, -17, -20],
  [47, 45, 38],
  [46, -4, 38],
  [-17, 19, -51],
  [-36, 28, 46],
  [-49, 40, -51],
  [-51, -15, -17],
  [26, 20, -7],
  [-54, -22, 36],
  [5, -52, -50],
  [50, -28, 44],
  [50, 44, -36],
  [4, -35, -30],
  [11, -26, -37],
  [22, 46, 20],
  [30, -32, 13],
  [-11, -34, 36],
  [-34, -6, -1],
  [15, 8, 14],
  [44, -21, -30],
  [10, 27, 24],
  [-9, 37, 22],
  [7, -49, -30],
  [47, -38, 19],
  [28, 37, 30],
  [-35, 14, -12],
  [39, -13, -1],
  [6, 19, -21],
  [38, 18, 1],
  [-7, -49, -25],
  [-15, 46, 4],
  [38, -45, -7],
  [-26, -28, -14],
  [-54, 14, -26],
  [-51, -18, 36],
  [24, -2, 13],
  [-20, -36, -11],
  [-2, 42, -7],
  [26, 25, 52],
  [43, -35, -26],
  [54, -1, -52],
  [-23, 37, 40],
  [-22, 54, 48],
  [-20, 3, -25],
  [16, 51, -8],
  [-17, 3, 35],
  [31, 38, -28],
  [-41, -52, 34],
  [46, -25, -23],
  [-13, -4, -18],
  [-23, -27, -8],
  [24, 51, -47],
  [44, 8, -34],
  [-20, 1, -25],
  [-54, -10, 18],
  [-38, -22, 16],
  [26, -1, 36],
  [12, -35, -49],
  [-16, -35, -28],
  [14, 15, -53],
  [50, -29, 8],
  [-4, -44, 41],
  [-43, 53, -44],
  [9, -24, 49],
  [14, 32, -50],
  [54, 18, -6],
  [-54, -2, 37],
  [-43, 3, -27],
  [24, -50, -47],
  [-10, 42, -2],
  [30, -19, 7],
  [15, -10, 39],
  [-18, 37, 30],
  [32, 15, -53],
  [43, -1, 41],
  [-37, -15, 40],
  [34, -42, -37],
  [-29, -27, -8],
  [26, 4, 38],
  [-41, -45, -35],
  [-6, 34, 2],
  [-46, 42, -34],
  [41, 2, 6],
  [24, 5, 54],
  [32, 12, -30],
  [-53, -7, 40],
  [50, -54, -3],
  [-19, -41, 44],
  [-29, -24, -36],
  [-37, -19, -31],
  [-45, 1, 46],
  [16, -20, -14],
  [-43, 42, -36],
  [-26, -46, 5],
  [-8, 14, -30],
  [36, 22, 3],
  [43, 54, 29],
  [-32, -11, -20],
  [-18, 22, -34],
  [-24, -11, -40],
  [-46, -25, -51],
  [-50, -42, 11],
  [-36, 29, -24],
  [-17, 1, -54],
  [-48, 25, -4],
  [21, 20, 14],
  [22, -31, 48],
  [-9, 38, 19],
  [-34, 32, -25],
  [-7, 37, -26],
  [-41, 47, 15],
  [-46, 48, -29],
  [-18, -51, 31],
  [-23, -13, -46],
  [49, -27, 14],
  [5, -4, -51],
  [-9, -24, -48],
  [-38, -35, 25],
  [47, -53, -52],
  [44, -27, 25],
  [23, -30, 28],
  [10, 23, -8],
  [5, 50, -16],
  [-15, 24, 26],
  [-27, -52, -29],
  [-40, 19, 36],
  [-53, -34, -23],
  [10, -27, 25],
  [-11, -47, -29],
  [-39, 27, 42],
  [53, 36, 39],
  [18, -8, -21],
  [-24, 3, -36],
  [-12, 43, -32],
  [-20, -49, -50],
  [10, -18, 6],
  [-3, 50, 26],
  [18, 11, -51],
  [27, 24, 42],
  [35, -6, -21],
  [30, 28, -53],
  [12, 50, 7],
  [-22, 18, 7],
  [31, -51, -34],
  [-23, 14, -25],
  [-1, -3, -50],
  [-53, 9, 21],
  [-47, -12, 15],
  [32, 8, -29],
  [-20, -5, -51],
  [-2, 3, -47],
  [36, 17, -47],
  [16, -28, 29],
  [35, 50, 43],
  [-1, -16, -3],
  [-11, 28, -19],
  [28, 48, -54],
  [35, 39, 5],
  [-19, -23, -12],
  [-48, 32, 23],
  [46, 19, -1],
  [-14, 18, 35],
  [32, 18, 10],
  [-20, -21, -36],
  [48, -20, 7],
  [27, 3, -10],
  [-16, 11, 54],
  [9, 37, 41],
  [-17, -39, -6],
  [-54, -52, 30],
  [17, -24, -25],
  [-26, 50, 37],
  [14, -53, 45],
  [10, -9, -51],
  [-17, 34, 24],
  [-10, -42, -38],
  [29, 25, 38],
  [27, -47, -51],
  [-53, -30, -14],
  [-39, -43, 30],
  [-8, -19, -27],
  [-13, -44, -34],
  [-13, 40, -5],
];

// The model Z3 5.3.2 prints for it under sat.restart=luby, in the order Z3 prints it.
const RESTART_MODEL = [
  35, 43, -31, -54, -16, -13, 3, 37, -20, -28, -1, -15, -41, 46, -44, -42, -10, 2, 23, -51, -49,
  -29, -11, 38, -48, 52, 32, -26, -8, 50, 9, 24, 39, -22, -45, -21, -36, 25, -12, 30, -7, 19, -6,
  -18, -47, -53, 14, 27, -34, 5, 17, 4, -40, -33,
];

const getName = (literal: number) => `x${Math.abs(literal) - 1}`;

// Each expected value is what z3 5.3.2 prints for the script.
describe("runSmtlibScript runs its commands as Z3 does", () => {
  // parse_check_sat shrinks the expression stack, so p is a new term at each check.
  it("releases the literals of a check once it has run", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(check-sat-assuming (p p))",
        "(simplify (and p p (> x 3)))",
        "(check-sat-assuming (p p))",
        "(push)",
        "(assert (or p p))",
        "(check-sat-assuming (p))",
        "(pop)",
        "(assert (or (not q) (not s) (not r) (not p)))",
        "(check-sat-assuming (q s r p))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "(and p (not (<= x 3)))", "sat", "sat", "unsat", "(q s r p)"]);
  });

  // context::m_unsat_core keeps the assumptions of the core alive until the next check.
  it("keeps the unsat core alive after its literals are released", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or p q))",
        "(check-sat-assuming ((not p) (not q)))",
        "(simplify (+ x 7))",
        "(simplify (* x 2))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not q) (not p)))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(+ 7 x)", "(* 2 x)", "((not p) (not q))", "unsat", "((not p) (not q))"]);
  });

  // sat_params reads the sat module's global parameters where using-params sets none.
  it("searches with the global sat parameters in the sat tactic", () => {
    expect(
      run([
        "(set-option :sat.restart luby)",
        ...RESTART_MODEL.map((_, index) => `(declare-const x${index} Bool)`),
        ...RESTART_CLAUSES.map(
          (clause) =>
            `(assert (or ${clause.map((literal) => (literal < 0 ? `(not ${getName(literal)})` : getName(literal))).join(" ")}))`,
        ),
        "(check-sat-using sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      ...RESTART_MODEL.flatMap((literal) => [
        `  (define-fun ${getName(literal)} () Bool`,
        `    ${literal > 0})`,
      ]),
      ")",
    ]);
  });

  it("accepts restart.max and inprocess.max as parameters of the sat tactic", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(assert p)",
        "(check-sat-using (using-params sat :restart.max 3 :inprocess.max 1))",
        "(check-sat-using (using-params qffd :restart.max 3))",
      ]),
    ).toEqual(["sat", "sat"]);
  });

  // generic_model_converter reads the arity of div0 and mod0 from their declarations: two.
  it("defines division by zero as a function of two arguments", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= (rem x y) 3))",
        "(assert (> x 10))",
        "(check-sat-using (then purify-arith smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun x () Int",
      "    11)",
      "  (define-fun y () Int",
      "    8)",
      "  (define-fun div0 ((x!0 Int) (x!1 Int)) Int",
      "    (ite (and (= x!0 11) (= x!1 8)) 1",
      "      0))",
      "  (define-fun mod0 ((x!0 Int) (x!1 Int)) Int",
      "    (ite (and (= x!0 11) (= x!1 8)) 3",
      "      0))",
      ")",
    ]);
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= (div x y) 3))",
        "(assert (> x 10))",
        "(check-sat-using (then purify-arith smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun x () Int",
      "    12)",
      "  (define-fun y () Int",
      "    4)",
      "  (define-fun div0 ((x!0 Int) (x!1 Int)) Int",
      "    (ite (and (= x!0 12) (= x!1 4)) 3",
      "      0))",
      "  (define-fun mod0 ((x!0 Int) (x!1 Int)) Int",
      "    0)",
      ")",
    ]);
  });

  // dl_query_cmd prints the exception of the query and then the unknown status.
  it("reports a failed query as an error and unknown", () => {
    expect(
      run([
        "(declare-rel q (Int))",
        "(declare-rel p (Int))",
        "(declare-var x Int)",
        "(declare-fun f (Int) Int)",
        "(rule (=> (= (f x) x) (p x)))",
        "(rule (=> (p x) (q x)))",
        "(query q)",
        "(get-info :reason-unknown)",
        "(query (q 1))",
        "(query)",
        "(query zz)",
      ]),
    ).toEqual([
      "(error \"query failed: Uninterpreted 'f' in <null>:",
      "p(#0) :- ",
      " (= (f (:var 0)) (:var 0)).",
      '")',
      "unknown",
      '(:reason-unknown "state of the most recent check-sat command is not known")',
      "(error \"line 9 column 10: Invalid function name. Expecting sort list starting with '(' to disambiguate function name got q\")",
      '(error "line 10 column 6: invalid query command, argument expected")',
      '(error "line 11 column 7: invalid function declaration reference, unknown function zz")',
    ]);
  });

  // parser::parse_func_decl_ref and dl_query_cmd::set_next_arg.
  it("reads the predicate of a query as a function declaration reference", () => {
    expect(
      run([
        "(declare-rel q (Int))",
        "(declare-rel p (Int Int))",
        "(declare-fun g (Int) Bool)",
        "(declare-var x Int)",
        "(rule (q 1))",
        "(query (q 1))",
        "(query (q (Int) Bool))",
        "(query (p (Int)))",
        "(query (p (Int) Bool))",
        "(query ())",
        "(query 1)",
        "(query (q))",
        "(query (q (Int)))",
        "(query (q Int Bool))",
        "(query (zz (Int) Bool))",
        "(query g)",
      ]),
    ).toEqual([
      "(error \"line 6 column 10: Invalid function name. Expecting sort list starting with '(' to disambiguate function name got q\")",
      "sat",
      "(error \"line 8 column 15: Invalid function name invalid sort, unexpected ')'\")",
      '(error "line 9 column 20: invalid function declaration reference, unknown indexed function p")',
      "(error \"line 10 column 8: invalid function declaration reference, symbol or '(' expected got query\")",
      "(error \"line 11 column 7: invalid function declaration reference, symbol or '(' expected got query\")",
      "(error \"line 12 column 9: Invalid function name. Expecting sort list starting with '(' to disambiguate function name got q\")",
      "(error \"line 13 column 15: Invalid function name invalid sort, unexpected ')'\")",
      "(error \"line 14 column 10: Invalid function name. Expecting sort list starting with '(' to disambiguate function name got Int\")",
      '(error "line 15 column 21: invalid function declaration reference, unknown indexed function zz")',
      '(error "line 16 column 8: Invalid query argument, expected a predicate registered as a relation")',
    ]);
  });

  // cmd_context::reason_unknown and check_sat_using_tactic_cmd.
  it("prints the reason of an unknown answer", () => {
    expect(
      run([
        "(get-info :reason-unknown)",
        "(declare-const x Int)",
        "(assert (> x 1))",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
        "(assert (< x 5))",
        "(get-info :reason-unknown)",
        "(check-sat-using fail)",
        "(get-info :reason-unknown)",
        "(assert (< x 0))",
        "(check-sat-using (then simplify smt))",
        "(get-info :reason-unknown)",
        "(push)",
        "(get-info :reason-unknown)",
        "(check-sat-using (fail-if (> num-consts 0)))",
        "(get-info :reason-unknown)",
        "(pop)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(:reason-unknown "state of the most recent check-sat command is not known")',
      "sat",
      '(:reason-unknown "")',
      '(:reason-unknown "state of the most recent check-sat command is not known")',
      "unknown",
      '(:reason-unknown "fail tactic")',
      "unsat",
      '(:reason-unknown "")',
      '(:reason-unknown "state of the most recent check-sat command is not known")',
      "unknown",
      '(:reason-unknown "fail-if tactic")',
      '(:reason-unknown "state of the most recent check-sat command is not known")',
    ]);
  });

  // mk_fm_tactic is and_then(simplify, fm), and and_then stops at a decided goal.
  it("skips fm once simplify has decided the goal", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(assert (and (> x 1.0) (< x 1.0)))",
        "(apply fm)",
        "(assert (> (+ x 1.0) x))",
        "(apply fm)",
        "(reset)",
        "(declare-const x Real)",
        "(assert (> (+ x 1.0) x))",
        "(apply fm)",
        "(declare-const y Real)",
        "(assert (> y x))",
        "(apply fm)",
      ]),
    ).toEqual([
      "(goals",
      "(goal",
      "  false",
      "  :precision precise :depth 2)",
      ")",
      "(goals",
      "(goal",
      "  false",
      "  :precision precise :depth 2)",
      ")",
      "(goals",
      "(goal",
      "  :precision precise :depth 1)",
      ")",
      "(goals",
      "(goal",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  // set-logic makes a new solver; the scopes that are open stay open in it.
  it("sets the logic inside a scope", () => {
    expect(
      run([
        "(push)",
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(check-sat)",
        "(pop)",
        "(check-sat)",
        "(push 2)",
        "(assert (< x 0))",
        "(check-sat)",
        "(pop 2)",
        "(check-sat)",
      ]),
    ).toEqual(["sat", "sat", '(error "line 9 column 11: unknown constant x")', "sat", "sat"]);
  });

  // Deviation from Z3: its new solver ignores the pop of a scope opened before set-logic and keeps
  // p, so it prints sat, unsat, unsat here.
  it("pops the assertions of a scope opened before set-logic", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(push)",
        "(push)",
        "(set-logic QF_UF)",
        "(assert p)",
        "(pop)",
        "(check-sat)",
        "(assert (not p))",
        "(check-sat)",
        "(pop)",
        "(check-sat)",
      ]),
    ).toEqual(["sat", "sat", "sat"]);
  });

  // check_sat counts one resource unit once the model of a decided goal is converted, and answers unknown when that exceeds the limit.
  it("counts the resource units of check-sat-using as Z3 does", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(get-info :rlimit)",
        "(check-sat-using skip)",
        "(get-info :rlimit)",
        "(check-sat-using sat)",
        "(get-info :rlimit)",
        "(apply sat)",
        "(get-info :rlimit)",
        "(check-sat-using (then simplify sat))",
        "(get-info :rlimit)",
        "(set-option :rlimit 1)",
        "(check-sat-using sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
        "(check-sat-using skip)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "(:rlimit 1)",
      "sat",
      "(:rlimit 2)",
      "sat",
      "(:rlimit 7)",
      "(goals",
      "(goal",
      "  :precision precise :depth 1)",
      ")",
      "(:rlimit 11)",
      "sat",
      "(:rlimit 12)",
      "unknown",
      '(:reason-unknown "canceled")',
      "(:rlimit 13)",
      "sat",
      '(:reason-unknown "")',
      "(:rlimit 14)",
    ]);
  });

  // Z3 writes to a stream, so text without a newline starts the next line and ends the output.
  it("keeps text written without a newline", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(dbg-elim-unused-vars p)",
        '(echo "b")',
        "(dbg-elim-unused-vars (and p p))",
        "(simplify (or p p))",
        "(dbg-elim-unused-vars (forall ((x Int) (y Int)) (> x 0)))",
        "(dbg-elim-unused-vars (not p))",
      ]),
    ).toEqual(["pb", "(and p p)p", "(forall ((x Int)) (> x 0))", "(not p)"]);
  });

  // opt_solver reads optsmt_dual_bound_rlimit; 0 turns the probe of a strict bound off.
  it("reads opt.optsmt_dual_bound_rlimit", () => {
    expect(
      run([
        "(set-option :opt.optsmt_dual_bound_rlimit 0)",
        "(declare-const x Real)",
        "(declare-fun f (Real) Real)",
        "(assert (<= (* x x) 2.0))",
        "(assert (<= (f x) 5.0))",
        "(maximize x)",
        "(check-sat)",
        "(get-objectives)",
      ]),
    ).toEqual([
      "unknown",
      "(objectives",
      " (x  (interval (/ 3339217363285192246361.0 2361183241434822606848.0) (/ 6678434726570484986977.0 4722366482869645213696.0)))",
      ")",
    ]);
  });
});
