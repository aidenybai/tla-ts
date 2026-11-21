import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[], timeLimitMs = 5000) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs }, (line) => output.push(line));
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

const BV_GOAL_LINES = [
  "(declare-const a (_ BitVec 8))",
  "(declare-const b (_ BitVec 8))",
  "(assert (= (bvadd a b) #x10))",
  "(assert (bvult a b))",
];

const getSoftLines = (rlimit: number) => [
  "(declare-const p Bool)",
  "(declare-const q Bool)",
  "(declare-const r Bool)",
  "(assert (not (and (or p q) (=> q r) (= p r))))",
  "(assert-soft p)",
  "(assert-soft q :weight 2)",
  "(assert-soft r)",
  `(set-option :rlimit ${rlimit})`,
  "(check-sat)",
  "(get-info :reason-unknown)",
];

// One more pigeon than holes, where pI_J puts pigeon I in hole J: unsatisfiable, and too hard for
// either solver to refute within the limits of these tests.
const getPigeonholeLines = (holeCount: number) => {
  const pigeons = [...Array(holeCount + 1).keys()];
  const holes = [...Array(holeCount).keys()];
  return [
    ...pigeons.flatMap((pigeon) => holes.map((hole) => `(declare-const p${pigeon}_${hole} Bool)`)),
    ...pigeons.map(
      (pigeon) => `(assert (or ${holes.map((hole) => `p${pigeon}_${hole}`).join(" ")}))`,
    ),
    ...holes.flatMap((hole) =>
      pigeons.flatMap((first) =>
        pigeons
          .slice(first + 1)
          .map((second) => `(assert (or (not p${first}_${hole}) (not p${second}_${hole})))`),
      ),
    ),
  ];
};

const MBQI_UNDER_PUSH = [
  "(set-option :auto_config false)",
  "(set-option :smt.mbqi true)",
  "(declare-sort U 0)",
  "(declare-fun f (U) U)",
  "(declare-fun g (U U) U)",
  "(declare-fun p (U) Bool)",
  "(declare-const a U)",
  "(declare-const b U)",
  "(push 1)",
  "(assert (forall ((x U)) (! (= (f (f x)) x) :pattern ((f x)))))",
  "(assert (forall ((x U) (y U)) (! (=> (p x) (p (g x y))) :pattern ((g x y)))))",
  "(assert (p a))",
  "(assert (not (= (f a) b)))",
];

const SMT_FIXTURES = join(import.meta.dirname, "../fixtures/smt");

// A tlapm obligation from tlaplus/Examples' MisraReachability, with its goal checked under a push.
const REACHABLE_PROOFS = readFileSync(join(SMT_FIXTURES, "ReachableProofs-40-push.smt2"), "utf8");

const readZ3Output = (name: string) =>
  readFileSync(join(SMT_FIXTURES, name), "utf8").trimEnd().split("\n");

const CHECK_AND_MODEL = [
  "(check-sat)",
  "(get-info :reason-unknown)",
  "(get-info :rlimit)",
  "(get-model)",
];

// Each expected value is what z3 5.3.2 prints for the script.
describe("runSmtlibScript runs its commands as Z3 does", () => {
  it("prints the assertions under :produce-assertions", () => {
    expect(
      run([
        "(set-option :produce-assertions true)",
        "(get-option :produce-assertions)",
        "(get-option :interactive-mode)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert p)",
        "(assert   (or p",
        "   q))",
        "(push)",
        "(assert (! q :named n))",
        "(get-assertions)",
        "(pop)",
        "(get-assertions)",
        "(set-option :produce-assertions false)",
        "(set-option :interactive-mode true)",
      ]),
    ).toEqual([
      "true",
      "true",
      "(p",
      " (or p",
      "   q)",
      " (! q :named n))",
      "(p",
      " (or p",
      "   q))",
      `(error "line 14 column 32: error setting ':produce-assertions', option value cannot be modified after initialization")`,
      `(error "line 15 column 30: error setting ':produce-assertions', option value cannot be modified after initialization")`,
    ]);
  });

  it("gets the assertions without initializing", () => {
    expect(
      run([
        "(get-assertions)",
        "(set-option :produce-assertions false)",
        "(get-option :produce-assertions)",
        "(set-option :interactive-mode true)",
        "(get-assertions)",
        "(declare-const p Bool)",
        "(assert p)",
        "(get-assertions)",
      ]),
    ).toEqual([
      '(error "line 1 column 16: command is only available in interactive mode, use command (set-option :interactive-mode true)")',
      "false",
      "()",
      "(p)",
    ]);
  });

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

  it("drops the implication of an assumption that is not a literal when its search pops", () => {
    expect(
      run([
        "(declare-fun x1 () Int)",
        "(declare-fun x2 () Int)",
        "(declare-const b0 Bool)",
        "(check-sat-assuming (b0))",
        "(check-sat)",
        "(assert (! (or false (>= x1 x2) (>= x1 2)) :named n3))",
        "(check-sat-assuming (b0 n3))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "sat",
      "sat",
      "sat",
      "(",
      "  (define-fun x1 () Int",
      "    0)",
      "  (define-fun x2 () Int",
      "    0)",
      "  (define-fun n3 () Bool",
      "    (or false (>= x1 x2) (>= x1 2)))",
      "  (define-fun b0 () Bool",
      "    false)",
      ")",
    ]);
  });

  it("frees the implication of an assumption that is not a literal once it is asserted", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-fun x1 () Int)",
        "(declare-const b0 Bool)",
        "(assert (! (<= (abs 6) x1) :named n0))",
        "(check-sat)",
        "(check-sat-assuming (n0))",
        "(check-sat)",
        "(check-sat-assuming (n0 b0 (not b0)))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "sat", "sat", "unsat", "(b0 (not b0))"]);
  });

  it("keeps the implication from the name of an assertion until its scope pops", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const v0 (_ BitVec 8))",
        "(declare-const v1 (_ BitVec 3))",
        "(assert (distinct v1 (bvsrem (bvshl #b000 v1) v1)))",
        "(check-sat)",
        "(push 1)",
        "(assert (! (bvsge (bvudiv v0 v0) ((_ rotate_right 9) v0)) :named n10))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "sat",
      "(",
      "  (define-fun n10 () Bool",
      "    (bvsge (bvudiv v0 v0) ((_ rotate_right 9) v0)))",
      "  (define-fun v1 () (_ BitVec 3)",
      "    #b101)",
      "  (define-fun v0 () (_ BitVec 8)",
      "    #x1d)",
      ")",
    ]);
  });

  it("reports an even root of a negative number as an error of the command", () => {
    const message = "even root of negative number is not real";
    expect(
      run([
        "(simplify (+ 1.0 (^ (- 2.0 (^ 6.0 0.5)) 0.5)))",
        "(declare-const x Real)",
        "(assert (= x (^ (- 2.0 (^ 6.0 0.5)) 0.5)))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      `(error "simplifier failed: ${message}")`,
      "(+ 1.0 (^ (- 2.0 (^ 6.0 (/ 1.0 2.0))) (/ 1.0 2.0)))",
      `(error "line 3 column 41: ${message}")`,
      "unknown",
      `(:reason-unknown "${message}")`,
    ]);
  });

  it("keeps the bounds of an optimization that fails, without a model", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-fun x () Int)",
        "(assert (= x (mod 0 0)))",
        "(assert-soft (> x 2) :weight 3 :id g)",
        "(minimize x)",
        "(check-sat)",
        "(get-objectives)",
        "(get-value (x))",
      ]),
    ).toEqual([
      '(error "line 6 column 10: Benchmark contains uninterpreted function symbols, but specified logic does not support them.")',
      "(objectives",
      " (g  (interval 0 3))",
      " (x  (interval (* (- 1) oo) oo))",
      ")",
      '(error "line 8 column 14: model is not available")',
    ]);
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

  // The tactic answers a fresh check and the incremental smt kernel answers once there are scopes.
  it("prints the reason of the solver that answered check-sat", () => {
    expect(
      run([
        "(set-option :smt.mbqi.max_iterations 1)",
        "(declare-const x Int)",
        "(assert (> x 1))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using skip)",
        "(get-info :reason-unknown)",
        "(push)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(assert (< x 0))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(pop)",
        "(declare-fun f (Int) Int)",
        "(assert (forall ((y Int)) (> (f y) (f (+ y 1)))))",
        "(assert (> (f 0) 5))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "sat",
      '(:reason-unknown "")',
      "unknown",
      '(:reason-unknown "unknown")',
      "sat",
      '(:reason-unknown "unknown")',
      "unsat",
      '(:reason-unknown "unknown")',
      "unknown",
      '(:reason-unknown "(incomplete quantifiers)")',
    ]);
  });

  // smt_tactic names the failure of the context it gives up on.
  it("prints the reason of an incomplete smt tactic", () => {
    expect(
      run([
        "(set-option :smt.mbqi.max_iterations 1)",
        "(declare-fun f (Int) Int)",
        "(assert (forall ((y Int)) (> (f y) (f (+ y 1)))))",
        "(assert (> (f 0) 5))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
        "(push)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "smt tactic failed to show goal to be sat/unsat (incomplete quantifiers)")',
      "unknown",
      '(:reason-unknown "smt tactic failed to show goal to be sat/unsat (incomplete quantifiers)")',
      "unknown",
      '(:reason-unknown "(incomplete quantifiers)")',
    ]);
  });

  it("counts the steps of a search that restarts", () => {
    expect(
      run([...getPigeonholeLines(7), "(check-sat-assuming (p0_0))", "(get-info :rlimit)"]),
    ).toEqual(["unsat", "(:rlimit 27949)"]);
  });

  it("queues no equality between nodes of one class", () => {
    expect(
      run([
        "(declare-datatypes ((C 0)) (((r) (g) (b))))",
        "(declare-datatypes ((D 0)) (((u) (v) (w) (z))))",
        "(declare-fun f (C) Int)",
        "(declare-fun h (C C) Int)",
        "(declare-const x C)",
        "(declare-const y C)",
        "(declare-const d D)",
        "(declare-const q Real)",
        "(assert (= (^ 2.0 q) 3.0))",
        "(assert (not (= d u)))",
        "(assert (> (h x y) 0))",
        "(assert (or (= x b) (= (f x) 3)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 870)"]);
  });

  it("evaluates nlsat's clauses twice to check nla's assignment", () => {
    expect(
      run([
        "(declare-const q Real)",
        "(assert (> (* q q) 2.0))",
        "(check-sat-using smt)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 1038)"]);
  });

  it("counts no step when nla's grobner solver checks the limit", () => {
    expect(
      run([
        "(declare-const q Real)",
        "(assert (= (* q q) 2.0))",
        "(check-sat-using smt)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 1173)"]);
  });

  it("counts the steps of an unknown answer", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic skip)",
        "(declare-const q Real)",
        "(declare-const p Bool)",
        "(assert (= (^ 2.0 q) 3.0))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat-using smt)",
        "(get-info :rlimit)",
        "(check-sat-assuming (p))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 8)", "unknown", "(:rlimit 169)", "unknown", "(:rlimit 448)"]);
  });

  // The sat tactic leaves the reason of its solver on the goal. A tactic's checkpoint reports an
  // exhausted rlimit, where the smt kernel reports a cancel.
  it("prints the reason of a check stopped at a limit", () => {
    expect(
      run([
        ...getPigeonholeLines(8),
        "(check-sat-using (using-params sat :max_conflicts 10))",
        "(get-info :reason-unknown)",
        "(set-option :rlimit 5000)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
        "(check-sat-assuming (p0_0))",
        "(get-info :reason-unknown)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "sat.max.conflicts")',
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
    ]);
  });

  it("tries the next tactic of or-else once the limit stops a rewriter", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        ...BV_GOAL_LINES,
        "(check-sat-using (or-else (then bit-blast sat) skip))",
        "(get-info :reason-unknown)",
        "(check-sat-using (or-else bit-blast skip))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "unknown")', "unknown", '(:reason-unknown "unknown")']);
  });

  it("lets the limit that stops nnf pass or-else, as nnf throws a default_exception", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (not (and (or p q) (=> q r) (= p r))))",
        "(check-sat-using (or-else nnf skip))",
        "(get-info :reason-unknown)",
        "(check-sat-using (or-else (then simplify nnf) skip))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
    ]);
  });

  it("leaves a goal as it is when the limit stops simplify", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        ...BV_GOAL_LINES,
        "(check-sat-using simplify)",
        "(get-info :reason-unknown)",
        "(check-sat-using (then simplify simplify))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "unknown")', "unknown", '(:reason-unknown "unknown")']);
  });

  it("reports the limit that stops the sat solver as the sat tactic's cancel", () => {
    expect(
      run([
        ...getPigeonholeLines(8),
        "(set-option :rlimit 5000)",
        "(check-sat-using sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using (then simplify sat))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
    ]);
  });

  it("reports the limit that stops the smt tactic before it reduces its goal as a cancel", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        ...BV_GOAL_LINES,
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
        "(check-sat-using (or-else (then simplify bit-blast sat) smt))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
    ]);
  });

  it("reports the limit that the smt tactic spends asserting its goal as a cancel", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(assert false)",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "canceled")']);
  });

  it("restores at pop the rlimit of the scope, as cmd_context does", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(push)",
        "(set-option :rlimit 3)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(pop)",
        "(check-sat)",
        "(get-option :rlimit)",
        "(push)",
        "(set-option :rlimit 3)",
        "(reset-assertions)",
        "(pop)",
        "(assert (> x 0))",
        "(check-sat)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "canceled")', "sat", "3", "sat"]);
  });

  it("bounds push by the rlimit and keeps the scopes that a canceled push leaves", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> x 0))",
        "(assert (or (< y x) (> (+ x y) 7)))",
        "(set-option :rlimit 2)",
        "(push)",
        "(set-option :rlimit 0)",
        "(assert (< x 0))",
        "(check-sat)",
        "(pop)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(error "line 6 column 5: push canceled")',
      "unsat",
      "unsat",
      '(:reason-unknown "canceled")',
    ]);
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult a b))",
        "(assert (= (bvadd a #x1) b))",
        "(set-option :rlimit 60)",
        "(push)",
        "(set-option :rlimit 0)",
        "(assert (= a b))",
        "(check-sat)",
        "(pop)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(error "line 7 column 5: max. resource limit exceeded")',
      "unsat",
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
    ]);
  });

  it("marks a search that the push of the model checker's context ends as canceled", () => {
    expect(run([...MBQI_UNDER_PUSH, "(set-option :rlimit 80)", ...CHECK_AND_MODEL])).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "(:rlimit 124)",
      '(error "line 18 column 10: model is not available")',
    ]);
  });

  it("answers unknown when the limit stops the model finder's checkpoint", () => {
    expect(run([...MBQI_UNDER_PUSH, "(set-option :rlimit 300)", ...CHECK_AND_MODEL])).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "(:rlimit 344)",
      '(error "line 18 column 10: model is not available")',
    ]);
  });

  it("gives up on a quantifier when the limit stops its evaluation in the model", () => {
    expect(run(["(set-option :rlimit 4000)", REACHABLE_PROOFS])).toEqual(
      readZ3Output("ReachableProofs-40-push-4000.z3out"),
    );
  });

  it("reports the limit that stops a push of ctx-solver-simplify as its reason", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(check-sat-using ctx-solver-simplify)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "push canceled")']);
  });

  it("checks the limit at each step of tseitin-cnf", () => {
    expect(
      run([
        "(set-option :rlimit 2)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or (= p (or q r)) (ite p q r) (= q (or p r))))",
        "(check-sat-using tseitin-cnf)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("counts a step of the limit for each formula that propagate-ineqs visits", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const b0 Bool)",
        "(declare-const v0 (_ BitVec 4))",
        "(declare-const v2 (_ BitVec 4))",
        "(assert (bvsge (bvshl #xd v0) v2))",
        "(assert (or b0 (bvult v0 v2)))",
        "(check-sat-using (then propagate-ineqs tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("pushes a scope of unit-subsume-simplify's context for each clause it prunes", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> x 0))",
        "(assert (or (> x 0) (> y 0)))",
        "(check-sat-using (or-else unit-subsume-simplify skip))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "push canceled")']);
  });

  it("counts the steps of card2bv's pseudo-Boolean rewriter against the limit", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const y0 Real)",
        "(declare-const b1 Bool)",
        "(assert (or b1 (= y0 1.25) (> y0 5.0)))",
        "(check-sat-using card2bv)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("stops solve-eqs without failing once the limit is spent", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= x (+ y 1)))",
        "(assert (> x 0))",
        "(check-sat-using solve-eqs)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "unknown")']);
  });

  it("counts a step of the limit for each formula that each pass of solve-eqs visits", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult (bvadd a b) #x7))",
        "(assert (or (= a b) (bvugt (bvmul a #x3) b)))",
        "(check-sat-using (then solve-eqs tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("counts a step of the limit for each formula that der visits", () => {
    expect(
      run([
        "(set-option :rlimit 13)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult (bvadd a b) #x7))",
        "(assert (or (= a b) (bvugt (bvmul a #x3) b)))",
        "(check-sat-using (then der tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("counts the steps of cofactor-term-ite against the limit", () => {
    expect(
      run([
        "(set-option :rlimit 2)",
        "(declare-fun f (Int) Int)",
        "(declare-const c Int)",
        "(assert (forall ((x Int) (y Int)) (or (not (= x (f y))) (> x y))))",
        "(assert (> (f c) c))",
        "(check-sat-using (then cofactor-term-ite tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("reports a limit that stops the model conversion of check-sat-using as a failed tactic", () => {
    expect(
      run([
        "(set-option :rlimit 85)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult (bvadd a b) #x7))",
        "(assert (or (= a b) (bvugt (bvmul a #x3) b)))",
        "(check-sat-using (then bv1-blast tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(error "tactic failed: max. resource limit exceeded")',
      '(:reason-unknown "max. resource limit exceeded")',
    ]);
  });

  it("counts the steps of a check as if the checks before it had freed their terms", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (> (+ x (ite p 1 2)) y))",
        "(assert (or p (= x (* 2 y))))",
        "(assert (=> (> y 3) (< x 10)))",
        "(set-option :rlimit 40)",
        "(check-sat-using (then blast-term-ite tseitin-cnf))",
        "(set-option :rlimit 78)",
        "(check-sat-using (then blast-term-ite tseitin-cnf))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", "unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("keeps the model as far as the conversion that the limit stopped got", () => {
    expect(
      run([
        "(set-option :rlimit 85)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult (bvadd a b) #x7))",
        "(assert (or (= a b) (bvugt (bvmul a #x3) b)))",
        "(check-sat-using (then bv1-blast tseitin-cnf))",
        "(get-model)",
      ]),
    ).toEqual([
      '(error "tactic failed: max. resource limit exceeded")',
      "(",
      "  (define-fun b () (_ BitVec 4)",
      "    #x0)",
      "  (define-fun a () (_ BitVec 4)",
      "    #x0)",
      ")",
    ]);
  });

  // The time limit is Z3's soft timeout: check-sat gives every solver the reason timeout, which
  // the smt kernel keeps for its later checks and reports while its last search did not fail.
  it("prints the reason of a check that timed out", () => {
    expect(
      run(
        [
          ...getPigeonholeLines(11),
          "(declare-const q Bool)",
          "(assert (not q))",
          "(check-sat)",
          "(get-info :reason-unknown)",
          "(check-sat-assuming (q))",
          "(get-info :reason-unknown)",
          "(check-sat-assuming (p0_0))",
          "(get-info :reason-unknown)",
          "(check-sat-using smt)",
          "(get-info :reason-unknown)",
        ],
        200,
      ),
    ).toEqual([
      "unknown",
      '(:reason-unknown "timeout")',
      "unsat",
      '(:reason-unknown "timeout")',
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
    ]);
  });

  // opt::context::reason_unknown asks the solver that optimized: opt_solver's kernel, or the sat
  // solver of a finite-domain maxsat problem.
  it("prints the reason of the solver that optimized", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 3))",
        "(minimize x)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(assert (< x 2))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["sat", '(:reason-unknown "unknown")', "unsat", '(:reason-unknown "unknown")']);
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(assert (or a b))",
        "(assert-soft (not a))",
        "(assert-soft (not b))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["sat", '(:reason-unknown "no reason given")']);
  });

  it("prints the reason of an optimization that timed out", () => {
    expect(
      run(
        [
          ...getPigeonholeLines(11),
          "(declare-const k Int)",
          "(assert (>= k 0))",
          "(minimize k)",
          "(check-sat)",
          "(get-info :reason-unknown)",
        ],
        200,
      ),
    ).toEqual(["unknown", '(:reason-unknown "canceled")']);
  });

  it("reports a cancel that escapes optimization as an error of check-sat", () => {
    expect(run(getSoftLines(1))).toEqual([
      '(error "line 9 column 10: max. resource limit exceeded")',
      '(:reason-unknown "unknown")',
    ]);
    expect(run(getSoftLines(161))).toEqual([
      '(error "line 9 column 10: max. resource limit exceeded")',
      '(:reason-unknown "no reason given")',
    ]);
    expect(run(getSoftLines(61))).toEqual([
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
    ]);
    expect(run(getSoftLines(195))).toEqual([
      '(error "line 9 column 10: push canceled")',
      '(:reason-unknown "no reason given")',
    ]);
  });

  it("converts the clauses of the SAT solver when maxres counts its assertions", () => {
    expect(run(getSoftLines(230))).toEqual(["unknown", '(:reason-unknown "no reason given")']);
    expect(run(getSoftLines(240))).toEqual(["unknown", '(:reason-unknown "sat.canceled")']);
    expect(run(getSoftLines(258))).toEqual(["unknown", '(:reason-unknown "no reason given")']);
    expect(run(getSoftLines(259))).toEqual(["sat", '(:reason-unknown "no reason given")']);
  });

  it("makes the auxiliary constants of the SAT solver's clauses once across its conversions", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (and (<= 0 a 1) (<= 0 b 1) (<= (+ a b) 1)))",
        "(maximize (+ (* 2 a) (* 3 b)))",
        "(check-sat)",
        "(reset-assertions)",
        "(declare-const p Bool)",
        "(declare-const x Int)",
        "(assert (> (ite p x 2) 1))",
        "(apply elim-term-ite)",
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (> k!7 1)",
      "  (or (not p) (= k!7 x))",
      "  (or p (= k!7 2))",
      "  :precision precise :depth 1)",
      ")",
    ]);
  });

  it("prints the reason and the core of get-consequences on the finite-domain solver", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-logic QF_FD)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(assert (=> a b))",
        "(get-consequences (a) (a b c))",
        "(get-info :reason-unknown)",
        "(assert (not b))",
        "(get-consequences (a c) (a b c))",
        "(get-unsat-core)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "sat",
      "",
      "(=> a a)",
      "(=> a b)",
      '(:reason-unknown "no reason given")',
      "unsat",
      "",
      "(a)",
      '(:reason-unknown "no reason given")',
    ]);
  });

  it("leaves out the variables that only the assumptions of get-consequences bring in", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or p q))",
        "(get-consequences (r) (r p))",
        "(get-consequences (r (not p)) (r p q))",
      ]),
    ).toEqual(["sat", "", "sat", "", "(=> r r)", "(=> (not p) (not p))", "(=> (not p) q)"]);
  });

  // The SAT solver gives up on the dependency, which goal2sat takes before the bit-blasting.
  it("tracks the assumptions of get-consequences that are not literals through the preprocessing", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(assert (=> a b))",
        "(assert (=> (and b c) (not a)))",
        "(get-consequences ((and a c)) (a b c))",
        "(get-consequences ((or a c)) (a b c))",
        "(declare-const x (_ BitVec 4))",
        "(assert (bvult x #x5))",
        "(get-consequences ((= x #x3)) (x))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unsat",
      "",
      "sat",
      "",
      "unknown",
      "",
      '(:reason-unknown "(sat.giveup interpreted functions sent to SAT solver (declare-fun = ((_ BitVec 4) (_ BitVec 4)) Bool)',
      ')")',
    ]);
  });

  it("assumes the named assertions in get-consequences on the finite-domain solver", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-logic QF_FD)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(assert (=> a b))",
        "(assert (! (or c d) :named n1))",
        "(get-consequences ((and a (not b))) (a b c))",
        "(get-unsat-core)",
        "(get-consequences ((=> c a) (not d)) (a b c d))",
      ]),
    ).toEqual([
      "unsat",
      "",
      "((and a (not b)))",
      "sat",
      "",
      "(=> (and n1 (not d) (=> c a)) a)",
      "(=> (and n1 (not d) (=> c a)) b)",
      "(=> (and n1 (not d)) c)",
      "(=> (not d) (not d))",
    ]);
  });

  it("orders the model of the SAT solver by its variables, as inc_sat_solver registers them", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const c Bool)",
        "(declare-const a Bool)",
        "(declare-const b (_ BitVec 2))",
        "(assert (or a c))",
        "(assert (= b #b10))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun a () Bool",
      "    true)",
      "  (define-fun c () Bool",
      "    false)",
      "  (define-fun b () (_ BitVec 2)",
      "    #b10)",
      ")",
    ]);
  });

  // The reason is left out: Z3 gives canceled when the sat solver throws at a checkpoint, and no
  // reason when its search stops first.
  it("answers unknown when the finite-domain solver stops in get-consequences", () => {
    expect(
      run([
        "(set-option :rlimit 20000)",
        "(set-logic QF_FD)",
        ...getPigeonholeLines(11),
        "(get-consequences () (p0_0))",
      ]),
    ).toEqual(["unknown", ""]);
  });

  it("answers get-consequences under QF_BV with the incremental sat solver", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 3))",
        "(declare-const y (_ BitVec 3))",
        "(declare-const p Bool)",
        "(get-consequences ((bvule y x)) (x))",
        "(get-info :reason-unknown)",
        "(get-consequences (p) (p x))",
      ]),
    ).toEqual([
      "unknown",
      "",
      '(:reason-unknown "(sat.giveup interpreted functions sent to SAT solver (declare-fun bvule ((_ BitVec 3) (_ BitVec 3)) Bool)',
      ')")',
      "sat",
      "",
    ]);
  });

  it("checks with the incremental sat solver after get-consequences under QF_BV", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(assert (bvult (bvmul x y) #x5))",
        "(assert (bvult #x3 (bvadd x y)))",
        "(get-consequences () ())",
        "(check-sat)",
        "(get-value (x y))",
      ]),
    ).toEqual(["sat", "", "sat", "((x #x4)", " (y #x1))"]);
  });

  it("holds the terms of get-consequences until the command ends", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(get-consequences ((bvsle x (bvadd x x))) (y))",
        "(assert (bvsge (bvadd x x) (bvmul y x)))",
        "(check-sat)",
        "(get-consequences () (x p q))",
        "(check-sat)",
        "(get-value (x y))",
      ]),
    ).toEqual(["unknown", "", "sat", "unknown", "", "sat", "((x #xf)", " (y #x7))"]);
  });

  it("runs the commands after a check that timed out", () => {
    expect(
      run(
        [
          ...getPigeonholeLines(11),
          "(check-sat)",
          "(push)",
          "(assert false)",
          "(check-sat)",
          "(pop)",
          "(simplify (and p0_0 (or p0_0 p1_0)))",
          "(reset-assertions)",
          "(check-sat)",
          "(eval (or p0_0 (not p0_0)))",
        ],
        200,
      ),
    ).toEqual(["unknown", "unsat", "(and p0_0 (or p0_0 p1_0))", "sat", "true"]);
  });

  it("gives smt.mbqi to the incremental kernel that exists", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (> (f x) 0)))",
        "(push)",
        "(check-sat)",
        "(set-option :smt.mbqi false)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(set-option :smt.mbqi true)",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "unknown",
      '(:reason-unknown "(incomplete quantifiers)")',
      "sat",
      "(",
      "  (define-fun f ((x!0 Int)) Int",
      "    2)",
      ")",
    ]);
  });

  it("drops the mbqi of the logic's setup once an option is set", () => {
    expect(
      run([
        "(set-logic AUFLIA)",
        "(set-option :smt.mbqi false)",
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (> (f x) 0)))",
        "(push)",
        "(check-sat)",
        "(set-option :smt.random_seed 0)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["sat", "unknown", '(:reason-unknown "(incomplete quantifiers)")']);
  });

  it("finds macros once smt.macro_finder is set, but not for functions already asserted", () => {
    expect(
      run([
        "(set-option :smt.mbqi false)",
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(assert (= (g 0) 5))",
        "(push)",
        "(set-option :smt.macro_finder true)",
        "(assert (forall ((x Int)) (= (f x) (+ x 1))))",
        "(assert (forall ((x Int)) (= (g x) (+ x 1))))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (forall ((x Int)) (= (f x) (+ x 1))))",
        "(check-sat)",
      ]),
    ).toEqual(["unsat", "sat"]);
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

  // Deviation from Z3: its new solver ignores the pop of a scope opened before set-logic and keeps p, so it prints sat, unsat, unsat here.
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

  it("pops the asserted formulas of two scopes at once, as asserted_formulas does", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(check-sat)",
        "(push 1)",
        "(assert (> (f a) (+ a 1)))",
        "(push 1)",
        "(assert (> (f b) (+ (* 3 b) 2)))",
        "(check-sat)",
        "(pop 2)",
        "(declare-const c Int)",
        "(declare-const d Int)",
        "(declare-const e Int)",
        "(simplify (+ (* 2 c) (* 5 d) e (f c) (f d) (f e)))",
        "(simplify (+ (* 3 e) (* 4 d) c (f d) (f c)))",
        "(assert (> (+ (f c) (f d)) (+ (* 2 c) (f e))))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "sat",
      "(+ (* 2 c) (* 5 d) e (f c) (f d) (f e))",
      "(+ (* 3 e) (* 4 d) c (f d) (f c))",
      "sat",
      "(",
      "  (define-fun c () Int",
      "    0)",
      "  (define-fun d () Int",
      "    2)",
      "  (define-fun e () Int",
      "    3)",
      "  (define-fun b () Int",
      "    0)",
      "  (define-fun a () Int",
      "    0)",
      "  (define-fun f ((x!0 Int)) Int",
      "    (ite (= x!0 2) 1",
      "      0))",
      ")",
    ]);
  });

  it("keeps the conflict that push propagates once its scope is popped", () => {
    expect(
      run([
        "(set-logic QF_FP)",
        "(declare-const y (_ FloatingPoint 3 4))",
        "(assert (fp.isNaN y))",
        "(assert (not (fp.isNaN (fp.neg y))))",
        "(push 1)",
        "(pop 1)",
        "(check-sat)",
      ]),
    ).toEqual(["unsat"]);
  });

  it("counts a step of the limit for each assertion of the smt kernel", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or p q))",
        "(get-info :rlimit)",
        "(assert (not p))",
        "(get-info :rlimit)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 4)", "(:rlimit 7)", "(:rlimit 14)"]);
  });

  it("reduces the asserted formulas when the first assertion after push opens its scope", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(push)",
        "(get-info :rlimit)",
        "(assert p)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 9)", "(:rlimit 12)"]);
  });

  it("counts a step of the limit after the final check of each theory", () => {
    expect(
      run([
        "(set-logic QF_AUFLIA)",
        "(declare-fun f (Int) Int)",
        "(declare-const a (Array Int Int))",
        "(declare-const x Int)",
        "(push)",
        "(assert (= (f x) (select a x)))",
        "(assert (> x 2))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 98)"]);
  });

  it("counts the final checks of the theories without terms that setup_unknown registers", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(push)",
        "(assert (= x y))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 62)"]);
  });

  it("counts a step of the limit when the smt kernel builds a model", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or p q))",
        "(push 1)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 69)",
      "(",
      "  (define-fun p () Bool",
      "    true)",
      "  (define-fun q () Bool",
      "    false)",
      ")",
      "(:rlimit 72)",
    ]);
  });

  it("builds a model in the smt tactic only for a goal that produces models", () => {
    const lines = [
      "(declare-const p Bool)",
      "(declare-const q Bool)",
      "(assert (or p q))",
      "(check-sat-using smt)",
      "(get-info :rlimit)",
    ];
    expect(run(lines)).toEqual(["sat", "(:rlimit 50)"]);
    expect(run(["(set-option :produce-models false)", ...lines])).toEqual(["sat", "(:rlimit 49)"]);
  });

  it("reads the model parameter as produce-models, which the solver takes only when it is made", () => {
    const lines = [
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(assert (= x (+ y 1)))",
      "(assert (> (* 2 y) 7))",
    ];
    expect(
      run([
        "(set-option :model false)",
        ...lines,
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(get-option :produce-models)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 152)",
      '(error "line 8 column 10: model is not available")',
      "false",
    ]);
    expect(
      run([
        ...lines,
        "(set-option :model false)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
      ]),
    ).toEqual(["sat", "(:rlimit 165)", '(error "line 8 column 10: model is not available")']);
    expect(
      run([
        "(set-option :model false)",
        "(set-option :produce-models true)",
        "(get-option :produce-models)",
        "(set-option :smt.random_seed 3)",
        "(get-option :produce-models)",
      ]),
    ).toEqual(["true", "false"]);
  });

  it("reads the unsat_core parameter as produce-unsat-cores", () => {
    expect(
      run([
        "(set-option :unsat_core true)",
        "(get-option :produce-unsat-cores)",
        "(declare-const p Bool)",
        "(assert (! p :named a))",
        "(assert (! (not p) :named b))",
        "(check-sat)",
        "(get-unsat-core)",
      ]),
    ).toEqual(["true", "unsat", "(a b)"]);
  });

  it("charges each pivot of the simplex the cells it touches", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(push)",
        "(assert (>= (+ x y z) 10))",
        "(assert (<= (- x y) 3))",
        "(assert (>= (+ y (* 2 z)) 7))",
        "(assert (<= (+ x z) 5))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 206)"]);
  });

  it("initializes the manager for get-info :rlimit", () => {
    expect(
      run(['(echo "a")', "(get-info :rlimit)", "(declare-const p Bool)", "(get-info :rlimit)"]),
    ).toEqual(["a", "(:rlimit 1)", "(:rlimit 1)"]);
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

  it("prints the information of get-info before it checks the rest of the command", () => {
    expect(
      run([
        '(set-option :diagnostic-output-channel "stdout")',
        "(get-info :name)",
        "(get-info :authors)",
        "(get-info :version)",
        "(get-info :status)",
        "(set-info :status sat)",
        "(get-info :status)",
        "(push 2)",
        "(pop 1)",
        "(get-info :assertion-stack-levels)",
        "(get-info :foo)",
        "(get-info :name :version)",
        "(get-info)",
      ]),
    ).toEqual([
      '(:name "Z3")',
      '(:authors "Leonardo de Moura, Nikolaj Bjorner, Lev Nachmanson and Christoph Wintersteiger")',
      '(:version "5.3.2")',
      "(:status unknown)",
      "(:status sat)",
      "(:assertion-stack-levels 1)",
      "unsupported",
      "; :foo line: 11 position: 0",
      "; Suppported get-info parameters:",
      "; (get-info :reason-unknown)",
      "; (get-info :status)",
      "; (get-info :version)",
      "; (get-info :authors)",
      "; (get-info :error-behavior)",
      "; (get-info :parameters)",
      "; (get-info :rlimit)",
      "; (get-info :assertion-stack-levels)",
      '(:name "Z3")',
      '(error "line 12 column 16: invalid command, too many arguments")',
      '(error "line 13 column 9: invalid command, argument(s) missing")',
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

  it("gets the objectives of the last check-sat that optimized, and none before the first", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const x Int)",
        "(get-objectives)",
        "(assert-soft p)",
        "(get-objectives  )",
        "(check-sat)",
        "(get-objectives)",
        "(push)",
        "(minimize x)",
        "(get-objectives)",
        "(reset-assertions)",
        "(get-objectives)",
        "(assert-soft p)",
        "(get-objectives)",
        "(check-sat)",
        "(get-objectives)",
      ]),
    ).toEqual([
      "(objectives",
      ")",
      '(error "line 5 column 17: check-sat has not been called with latest objectives")',
      "sat",
      "(objectives",
      " ( 0)",
      ")",
      '(error "line 10 column 15: check-sat has not been called with latest objectives")',
      "(objectives",
      ")",
      '(error "line 14 column 15: check-sat has not been called with latest objectives")',
      "sat",
      "(objectives",
      " ( 0)",
      ")",
    ]);
  });

  it("leaves the definitions of a popped scope out of the model", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const b Bool)",
        "(assert (! (> x 0) :named a1))",
        "(push)",
        "(define-fun c () Int 5)",
        "(assert (! (not b) :named a2))",
        "(assert (> x c))",
        "(check-sat)",
        "(pop)",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "sat",
      "(",
      "  (define-fun x () Int",
      "    6)",
      "  (define-fun a1 () Bool",
      "    (> x 0))",
      "  (define-fun b () Bool",
      "    false)",
      ")",
    ]);
  });

  it("puts a named formula among the defined functions, in the order of their hash table", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(declare-const p Bool)",
        "(define-fun c2 () Int a)",
        "(assert (! (>= b 0) :named n1))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun b () Int",
      "    0)",
      "  (define-fun p () Bool",
      "    false)",
      "  (define-fun a () Int",
      "    0)",
      "  (define-fun c2 () Int",
      "    a)",
      "  (define-fun n1 () Bool",
      "    (>= b 0))",
      ")",
    ]);
  });

  it("names the if-then-else terms of an integer problem before the search", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> (* 2 (ite (< x 0) (- x) x)) (ite (> y x) y 5)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun x () Int",
      "    (- 3))",
      "  (define-fun y () Int",
      "    (- 3))",
      ")",
    ]);
  });

  it("propagates no equalities from the bounds of an integer problem", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> (+ (ite (> x y) x y) (abs y)) 10))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun x () Int",
      "    11)",
      "  (define-fun y () Int",
      "    0)",
      ")",
    ]);
  });

  it("numbers a datatype after the sorts of the sequence plugin and List, as its first constructor depends on it", () => {
    const color = [
      "(declare-datatypes ((Color 0)) (((red) (green) (blue))))",
      "(declare-const c Color)",
      "(check-sat)",
      "(get-model)",
    ];
    expect(run([...color, "(reset)", "(set-logic ALL)", ...color])).toEqual([
      "sat",
      "(",
      "  (define-fun c () Color",
      "    red)",
      ")",
      "sat",
      "(",
      "  (define-fun c () Color",
      "    blue)",
      ")",
    ]);
  });

  it("has no model after a tactic leaves its goal undecided without a model converter", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> (* x x) 2))",
        "(check-sat-using simplify)",
        "(get-model)",
        "(reset)",
        "(set-logic QF_SLIA)",
        "(declare-const s String)",
        '(assert (= (str.replace_re (str.++ s s) (str.to_re "a") s) (str.replace_all "" s "ba")))',
        "(check-sat)",
        "(get-value (s))",
      ]),
    ).toEqual([
      "unknown",
      '(error "line 4 column 10: model is not available")',
      "unknown",
      '(error "line 10 column 14: model is not available")',
    ]);
  });

  it("has no model after the limit stops the search of the incremental kernel", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> (+ x y) 2))",
        "(push)",
        "(set-option :rlimit 3)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-model)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      '(error "line 8 column 10: model is not available")',
    ]);
  });

  it("bounds the tactic of apply by the rlimit", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (and (> (+ x y) 3) (or p (< (* 2 x) y)) (=> p (= x (+ y 1)))))",
        "(set-option :rlimit 8)",
        "(apply simplify)",
        "(apply bit-blast)",
      ]),
    ).toEqual([
      "(goals",
      "(goal",
      "  (not (<= (+ x y) 3))",
      "  (or p (< (* 2 x) y))",
      "  (=> p (= x (+ y 1)))",
      "  :precision precise :depth 1)",
      ")",
      '(error "tactic failed: max. resource limit exceeded")',
    ]);
  });

  it("keeps the reason of the SAT solver when the limit stops its internalization", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(push)",
        "(assert (not (and (or p q) (=> q r) (= p r))))",
        "(set-option :rlimit 1)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "no reason given")']);
  });

  it("keeps the options of proofs and cores while there are assertions", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(assert (! (> x 3) :named n))",
        "(set-option :produce-unsat-cores true)",
        "(set-option :produce-proofs true)",
        "(set-option :produce-unsat-assumptions true)",
        "(check-sat-assuming ((< x 2) p))",
        "(get-unsat-core)",
        "(get-option :produce-unsat-cores)",
        "(push)",
        "(assert p)",
        "(pop)",
        "(reset-assertions)",
        "(set-option :produce-unsat-cores true)",
        "(get-option :produce-unsat-cores)",
      ]),
    ).toEqual([
      "(error \"line 4 column 33: error setting ':produce-unsat-cores', option value cannot be modified after assertions have been added\")",
      "(error \"line 5 column 28: error setting ':produce-proofs', option value cannot be modified after assertions have been added\")",
      "(error \"line 6 column 39: error setting ':produce-unsat-assumptions', option value cannot be modified after assertions have been added\")",
      "unsat",
      '(error "line 8 column 15: unsat core construction is not enabled, use command (set-option :produce-unsat-cores true)")',
      "false",
      "true",
    ]);
  });

  it("prints the assumptions of the core with get-unsat-assumptions", () => {
    expect(
      run([
        "(get-option :produce-unsat-assumptions)",
        "(set-option :produce-unsat-assumptions true)",
        "(get-option :produce-unsat-assumptions)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(get-unsat-assumptions)",
        "(assert (! (not a) :named n))",
        "(assert (or b c))",
        "(check-sat-assuming (c b))",
        "(get-unsat-assumptions)",
        "(check-sat-assuming (a b (not c)))",
        "(get-unsat-assumptions)",
        "(get-unsat-core)",
        "(check-sat-assuming ((not b) (not c)))",
        "(get-unsat-assumptions)",
      ]),
    ).toEqual([
      "false",
      "true",
      '(error "line 7 column 22: unsat assumptions is not available")',
      "sat",
      '(error "line 11 column 22: unsat assumptions is not available")',
      "unsat",
      "(a)",
      '(error "line 14 column 15: unsat core construction is not enabled, use command (set-option :produce-unsat-cores true)")',
      "unsat",
      "((not b) (not c))",
    ]);
  });

  it("prints the core of the last check once get-unsat-assumptions is enabled", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(check-sat-assuming (a (not a)))",
        "(get-unsat-assumptions)",
        "(set-option :produce-unsat-assumptions true)",
        "(get-unsat-assumptions)",
      ]),
    ).toEqual([
      "unsat",
      '(error "line 3 column 22: unsat assumptions construction is not enabled, use command (set-option :produce-unsat-assumptions true)")',
      "(a (not a))",
    ]);
  });

  it("frees the evaluator of eval before its value, so later terms get Z3's ids", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= x 2))",
        "(assert (= y 3))",
        "(check-sat)",
        "(eval (+ (* x y) (* 2 x) (* y y y) 17 (- x y) (* x x)))",
        "(declare-const d1 Bool)",
        "(assert d1)",
        "(declare-const d2 Bool)",
        "(assert d2)",
        "(declare-const d3 Bool)",
        "(assert d3)",
        "(declare-const s Bool)",
        "(declare-const t Bool)",
        "(declare-const u Bool)",
        "(declare-const v Bool)",
        "(assert (or (not s) (not t) (not u) (not v)))",
        "(check-sat-assuming (v u t s))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "57", "unsat", "(s t v u)"]);
  });

  it("frees the terms of the local context simplification when it replaces them", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(declare-const e Bool)",
        "(simplify (or false (ite (not (= b b)) d (not (= c b))) (and a (not b)) b) :local_ctx true)",
        "(simplify (or (ite (not (= (not b) d)) a a) (and (ite b c b) (not d)) (and b (not c)) e) :local_ctx true)",
      ]),
    ).toEqual(["(or c (and a (not b)) b)", "(or a (and b (not c)) e (and b c (not d)))"]);
  });

  it("frees the terms of get-value after it prints them, in their order, as parse_get_value does", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-logic QF_UFBV)",
        "(declare-const v0 (_ BitVec 4))",
        "(declare-const v1 (_ BitVec 8))",
        "(declare-fun fb ((_ BitVec 4)) (_ BitVec 4))",
        "(assert (=> (bvule (concat (_ bv2 3) #b1) v0) (bvsge ((_ repeat 1) v0) (bvneg v0))))",
        "(check-sat)",
        "(get-value ( (bvadd v1 #x11) (bvadd v1 #x10)))",
        "(check-sat-using smt)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(((bvadd v1 #x11) #x11)",
      " ((bvadd v1 #x10) #x10))",
      "sat",
      "(",
      "  (define-fun v0 () (_ BitVec 4)",
      "    #x1)",
      "  (define-fun v1 () (_ BitVec 8)",
      "    #x00)",
      "  (define-fun fb ((x!0 (_ BitVec 4))) (_ BitVec 4)",
      "    #x0)",
      ")",
    ]);
  });

  it("frees the ids of select and store with their last terms, so later declarations reuse them", () => {
    expect(
      run([
        "(declare-fun A () (Array Int Int))",
        "(simplify (store A 1 (select A 0)))",
        "(declare-fun g (Int) Int)",
        "(declare-fun h (Int) Int)",
        "(declare-fun c () Int)",
        "(declare-fun d () Int)",
        "(assert (= (g c) (h d)))",
        "(assert (= (g d) (h c)))",
        "(assert (distinct (g c) (g d)))",
        "(assert (forall ((x Int)) (>= (g x) (h x))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(store A 1 (select A 0))", "unsat", "(:rlimit 713)"]);
  });
});

describe("reset-assertions, as Z3 5.3.2 frees the solver", () => {
  const ARITH = [
    "(declare-const x Int)",
    "(declare-const y Int)",
    "(assert (> (+ x y) 3))",
    "(assert (< (* 2 x) y))",
  ];
  const CLAUSES = [
    "(declare-const p Bool)",
    "(declare-const q Bool)",
    "(declare-const r Bool)",
    "(assert (or (and p q) (and (not p) r) (and q (not r))))",
    "(apply tseitin-cnf)",
  ];
  const GOAL = [
    "(goals",
    "(goal",
    "  (or p r q)",
    "  (or q (not p))",
    "  (or r q)",
    "  (or (not r) q (not p))",
    "  :precision precise :depth 2)",
    ")",
  ];

  it("frees the kernel before it makes the next one, and the assertions after", () => {
    expect(run([...ARITH, "(reset-assertions)", ...CLAUSES])).toEqual(GOAL);
    expect(run([...ARITH, "(reset-assertions)", "(reset-assertions)", ...CLAUSES])).toEqual(GOAL);
    expect(run([...ARITH, "(check-sat-using smt)", "(reset-assertions)", ...CLAUSES])).toEqual([
      "sat",
      ...GOAL,
    ]);
  });

  it("frees the assertions of the solver that the last check-sat holds after the solver", () => {
    expect(run([...ARITH, "(check-sat)", "(reset-assertions)", ...CLAUSES])).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or p q r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
    expect(
      run([
        ...ARITH,
        "(push)",
        "(assert (> x 0))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or q (not p) (not r))",
      "  (or p q r)",
      "  (or q r)",
      "  :precision precise :depth 2)",
      ")",
    ]);
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult a b))",
        "(assert (= (bvadd a b) #x9))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or (not p) q)",
      "  (or r p q)",
      "  (or r q)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("frees the pairs and caches of bv sharing after the theories", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const z (_ BitVec 8))",
        "(push)",
        "(assert (= (bvadd x y z (bvmul x z)) #x01))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or q p r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("keeps the 1-bit numerals of the QF_BV tactic it makes on the first QF_BV goal", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const z (_ BitVec 8))",
        "(assert (= (bvadd (bvmul x y) (bvmul y z) (bvmul x z)) #x00))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or p q r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("makes the 1-bit numerals of a bv logic's tactic before its solvers", () => {
    const getOutput = (logic: string) =>
      run([
        `(set-logic ${logic})`,
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const z (_ BitVec 8))",
        "(assert (bvult x y))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]).slice(3, 7);
    expect(getOutput("QF_AUFBV")).toEqual([
      "  (or q (not p))",
      "  (or p q r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
    ]);
    expect(getOutput("QF_BV")).toEqual([
      "  (or q r p)",
      "  (or q (not p))",
      "  (or q r)",
      "  (or q (not r) (not p))",
    ]);
  });

  it("keeps each bv term solve-eqs solves for only in its equation", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const z (_ BitVec 8))",
        "(assert (= (bvadd x y z (bvmul x z)) #x01))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or (not p) q)",
      "  (or r q p)",
      "  (or r q)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("keeps each arithmetic term solve-eqs solves for only in its equation", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= (+ (* (- 1) y) x) 8))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or q p r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("keeps the formulas solve-eqs replaces until its next round", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (= (+ (* (- 1) z) y (* 3 y)) 2))",
        "(assert (= 2 (+ (* (- 1) x) z)))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or q (not r) (not p))",
      "  (or q p r)",
      "  (or q r)",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("keeps the formulas the nested equalities replace in the model trail", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(declare-const w Int)",
        "(assert (or (and (= w z) (< (+ z w) w)) (<= x (+ z y)) (= y z)))",
        "(assert (> (+ z x) 2))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or p q r)",
      "  (or (not p) q)",
      "  (or q r)",
      "  (or (not p) q (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("keeps the solver of the last check-sat until the next assert", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult a b))",
        "(assert (= (bvadd a b) #x9))",
        "(check-sat)",
        "(reset-assertions)",
        ...CLAUSES,
      ]),
    ).toEqual([
      "sat",
      "(goals",
      "(goal",
      "  (or q (not p))",
      "  (or p q r)",
      "  (or q r)",
      "  (or q (not p) (not r))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });
});

describe("solve-eqs on an array a quantifier defines, as Z3 5.3.2 solves it", () => {
  const getModel = (lines: string[]) =>
    run([...lines, "(check-sat)", "(get-info :rlimit)", "(get-model)"]);

  it("solves an array defined at every index and prints its value as stores", () => {
    expect(
      getModel([
        "(declare-fun f (Int) Int)",
        "(declare-fun A () (Array Int Int))",
        "(assert (forall ((x Int)) (= (f x) (select A x))))",
        "(assert (= (f 2) 7))",
        "(assert (= (select A 3) 1))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 271)",
      "(",
      "  (define-fun A () (Array Int Int)",
      "    (store ((as const (Array Int Int)) 7) 3 1))",
      "  (define-fun f ((x!0 Int)) Int",
      "    (ite (= x!0 3) 1",
      "      7))",
      ")",
    ]);
  });

  it("solves an array defined under the negation of the other disjunct", () => {
    expect(
      getModel([
        "(declare-fun A () (Array Int Int))",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (forall ((x Int)) (or (= x a) (= (select A x) 0))))",
        "(assert (= (select A b) 1))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 290)",
      "(",
      "  (define-fun A () (Array Int Int)",
      "    (store ((as const (Array Int Int)) 0) 0 1))",
      "  (define-fun a () Int",
      "    0)",
      "  (define-fun b () Int",
      "    0)",
      ")",
    ]);
  });

  it("keeps a lambda for an array defined under an implication", () => {
    expect(
      getModel([
        "(declare-fun A () (Array Int Int))",
        "(declare-const a Int)",
        "(assert (forall ((x Int)) (=> (> x 0) (= (select A x) (+ x 1)))))",
        "(assert (= (select A a) 5))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 597)",
      "(",
      "  (define-fun A () (Array Int Int)",
      "    (lambda ((x Int)) (ite (<= x 0) 5 (+ 1 x))))",
      "  (define-fun a () Int",
      "    0)",
      ")",
    ]);
  });

  it("reads the guard of two if-then-elses with the same condition and else", () => {
    expect(
      getModel([
        "(declare-fun p (Int) Bool)",
        "(declare-fun A () (Array Int Int))",
        "(assert (forall ((x Int)) (= (ite (p x) (select A x) 3) (ite (p x) 4 3))))",
        "(assert (p 1))",
        "(assert (not (= (select A 1) 4)))",
      ]),
    ).toEqual(["unsat", "(:rlimit 244)", '(error "line 8 column 10: model is not available")']);
  });

  it("solves an array of two indices", () => {
    expect(
      getModel([
        "(declare-fun C () (Array Int Int Int))",
        "(declare-const a Int)",
        "(assert (forall ((x Int) (y Int)) (= (select C x y) (ite (and (= x 1) (= y 2)) 5 0))))",
        "(assert (= (select C a 2) 5))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 245)",
      "(",
      "  (define-fun a () Int",
      "    1)",
      "  (define-fun C () (Array Int Int Int)",
      "    (store ((as const (Array Int Int Int)) 0) 1 2 5))",
      ")",
    ]);
  });

  it("prints a set of indices as stores, and any other lambda as it is", () => {
    expect(
      getModel([
        "(declare-fun B () (Array Int Bool))",
        "(declare-fun D () (Array Int Bool))",
        "(declare-fun E () (Array Int Bool))",
        "(assert (forall ((x Int)) (= (select B x) (or (= x 1) (= x 2)))))",
        "(assert (forall ((x Int)) (= (select D x) (and (not (= x 1)) (not (= x 2))))))",
        "(assert (forall ((x Int)) (= (select E x) (not (= x 3)))))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 1115)",
      "(",
      "  (define-fun E () (Array Int Bool)",
      "    (lambda ((x!1 Int)) (not (= x!1 3))))",
      "  (define-fun D () (Array Int Bool)",
      "    (store (store ((as const (Array Int Bool)) true) 2 false) 1 false))",
      "  (define-fun B () (Array Int Bool)",
      "    (store (store ((as const (Array Int Bool)) false) 2 true) 1 true))",
      ")",
    ]);
  });

  // Deviation from Z3: has_index_set reads this or as true only at 1, which gives a wrong model.
  it("keeps a lambda for an or of an equality and a disequality", () => {
    expect(
      run([
        "(declare-fun B () (Array Int Bool))",
        "(assert (forall ((x Int)) (= (select B x) (or (= x 1) (not (= x 2))))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(eval (= (select B 3) (or (= 3 1) (not (= 3 2)))))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 142)",
      "(",
      "  (define-fun B () (Array Int Bool)",
      "    (lambda ((x Int)) (or (= x 1) (not (= x 2)))))",
      ")",
      "true",
    ]);
  });

  // Deviation from Z3: has_index_set reads this and as true everywhere, which gives a wrong model.
  it("keeps a lambda for an and of two equalities", () => {
    expect(
      run([
        "(declare-fun B () (Array Int Bool))",
        "(assert (forall ((x Int)) (= (select B x) (and (= x 1) (= x 2)))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(eval (= (select B 3) (and (= 3 1) (= 3 2))))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 122)",
      "(",
      "  (define-fun B () (Array Int Bool)",
      "    (lambda ((x Int)) (and (= x 1) (= x 2))))",
      ")",
      "true",
    ]);
  });

  it("prints an or with a disequality as stores when they cover the indices", () => {
    expect(
      run([
        "(declare-fun B () (Array (_ BitVec 1) Bool))",
        "(assert (forall ((x (_ BitVec 1))) (= (select B x) (or (= x #b0) (not (= x #b1))))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(eval (select B #b0))",
        "(eval (select B #b1))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 142)",
      "(",
      "  (define-fun B () (Array (_ BitVec 1) Bool)",
      "    (store ((as const (Array (_ BitVec 1) Bool)) false) #b0 true))",
      ")",
      "true",
      "false",
    ]);
  });

  it("prints an and with an equality as stores when they cover the indices", () => {
    expect(
      run([
        "(declare-datatypes ((C 0)) (((r) (g) (k))))",
        "(declare-fun B () (Array C Bool))",
        "(assert (forall ((x C)) (= (select B x) (and (not (= x r)) (not (= x g)) (= x k)))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(eval (select B r))",
        "(eval (select B k))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 182)",
      "(",
      "  (define-fun B () (Array C Bool)",
      "    (store (store ((as const (Array C Bool)) true) g false) r false))",
      ")",
      "false",
      "true",
    ]);
  });

  // Deviation from Z3: has_index_set reads this or as false at both indices, which gives a wrong model.
  it("keeps a lambda for an or of two disequalities that cover the indices", () => {
    expect(
      run([
        "(declare-fun B () (Array (_ BitVec 1) Bool))",
        "(assert (forall ((x (_ BitVec 1))) (= (select B x) (or (not (= x #b0)) (not (= x #b1))))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
        "(eval (select B #b0))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 162)",
      "(",
      "  (define-fun B () (Array (_ BitVec 1) Bool)",
      "    (lambda ((x (_ BitVec 1))) (or (not (= x #b0)) (not (= x #b1)))))",
      ")",
      "true",
    ]);
  });

  it("prints an or with a disequality as stores when they cover the model's universe", () => {
    expect(
      run([
        ...TWO_ELEMENT_LAMBDA,
        "(assert (forall ((x U)) (= (select B x) (or (= x p) (not (= x q))))))",
        ...TWO_ELEMENT_CHECK,
        "(eval (select B q))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 247)",
      ...TWO_ELEMENT_MODEL,
      "  (define-fun B () (Array U Bool)",
      "    (store ((as const (Array U Bool)) false) U!val!0 true))",
      ")",
      "false",
    ]);
  });

  // Deviation from Z3: has_index_set reads this and as true at both elements of the universe, which gives a wrong model.
  it("keeps a lambda for an and of two equalities over the model's universe", () => {
    expect(
      run([
        ...TWO_ELEMENT_LAMBDA,
        "(assert (forall ((x U)) (= (select B x) (and (= x p) (= x q)))))",
        ...TWO_ELEMENT_CHECK,
        "(eval (= (select B p) (and (= p p) (= p q))))",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 227)",
      ...TWO_ELEMENT_MODEL,
      "  (define-fun B () (Array U Bool)",
      "    (lambda ((x U)) (and (= x U!val!0) (= x U!val!1))))",
      ")",
      "true",
    ]);
  });
});

const TWO_ELEMENT_LAMBDA = [
  "(declare-sort U 0)",
  "(declare-const p U)",
  "(declare-const q U)",
  "(declare-fun B () (Array U Bool))",
];
const TWO_ELEMENT_CHECK = [
  "(assert (not (= p q)))",
  "(check-sat)",
  "(get-info :rlimit)",
  "(get-model)",
];
const TWO_ELEMENT_MODEL = [
  "(",
  "  ;; universe for U:",
  "  ;;   U!val!1 U!val!0 ",
  "  ;; -----------",
  "  ;; definitions for universe elements:",
  "  (declare-fun U!val!1 () U)",
  "  (declare-fun U!val!0 () U)",
  "  ;; cardinality constraint:",
  "  (forall ((x U)) (or (= x U!val!1) (= x U!val!0)))",
  "  ;; -----------",
  "  (define-fun q () U",
  "    U!val!1)",
  "  (define-fun p () U",
  "    U!val!0)",
];

const POPPED_CHECK = [
  "(declare-fun g (Int) Int)",
  "(declare-fun h (Int) Int)",
  "(declare-fun c () Int)",
  "(declare-fun d () Int)",
  "(assert (= (g c) (h d)))",
  "(assert (= (g d) (h c)))",
  "(assert (distinct (g c) (g d)))",
  "(assert (forall ((x Int)) (! (>= (g x) (h x)) :pattern ((g x)))))",
  "(assert (forall ((x Int)) (! (<= (h x) (+ (g x) 1)) :pattern ((h x)))))",
  "(check-sat)",
  "(get-info :rlimit)",
];

describe("pop, as Z3 5.3.2 frees the declarations of a scope", () => {
  it("keeps a declaration that the congruence table read until the solver is freed", () => {
    expect(
      run([
        "(declare-fun a () (Array Int Bool))",
        "(declare-fun b () (Array Bool Int))",
        "(push 1)",
        "(assert (= (select b (select a 0)) 2))",
        "(check-sat)",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["sat", "unsat", "(:rlimit 638)"]);
  });

  it("frees the declarations of the scopes it pops in the order they were made", () => {
    expect(
      run([
        "(push 1)",
        "(declare-fun e () Int)",
        "(push 1)",
        "(declare-fun k (Int) Int)",
        "(pop 2)",
        "(push 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 603)"]);
  });

  it("frees the macros and named terms of the scopes it pops, as erase_macro does", () => {
    const define = "(define-fun m2 ((x Int)) Int (* 2 x))";
    expect(
      run(["(push 1)", define, "(declare-fun k (Int) Int)", "(pop 1)", ...POPPED_CHECK]),
    ).toEqual(["unsat", "(:rlimit 590)"]);
    expect(
      run([
        "(push 1)",
        define,
        "(declare-fun e () Int)",
        "(assert (> (m2 e) 4))",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 562)"]);
    expect(
      run([
        "(declare-fun e () Int)",
        "(push 1)",
        "(assert (! (> e 0) :named n1))",
        "(declare-fun k (Int) Int)",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 598)"]);
  });

  it("frees the recursive definitions of the scopes it pops, as erase_def does", () => {
    expect(
      run([
        "(push 1)",
        "(define-fun-rec sumto ((n Int)) Int (ite (<= n 0) 0 (+ n (sumto (- n 1)))))",
        "(declare-fun e () Int)",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 586)"]);
    expect(
      run([
        "(push 1)",
        "(define-funs-rec ((ev ((n Int)) Bool) (od ((n Int)) Bool)) ((ite (= n 0) true (od (- n 1))) (ite (= n 0) false (ev (- n 1)))))",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 548)"]);
  });
});

describe("macros, as Z3 5.3.2 substitutes them", () => {
  it("defines a macro with std_subst and expands its applications with rev_subst", () => {
    expect(
      run([
        "(push 1)",
        "(define-fun m3 ((x Int) (y Int)) Int (- (* 3 x) y))",
        "(pop 1)",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 557)"]);
    expect(
      run([
        "(declare-fun k () Int)",
        "(define-fun m ((x Int)) Int (+ (* 2 x) 1))",
        "(assert (> (m k) 0))",
        ...POPPED_CHECK,
      ]),
    ).toEqual(["unsat", "(:rlimit 1090)"]);
  });
});

describe(":global-declarations, as Z3 5.3.2 keeps declarations through a pop", () => {
  it("keeps the functions, datatypes and named terms of a popped scope", () => {
    expect(
      run([
        "(get-option :global-decls)",
        "(set-option :global-declarations true)",
        "(get-option :global-declarations)",
        "(declare-const x Int)",
        "(push 1)",
        "(declare-datatypes ((P 0)) (((mk (fst Int)))))",
        "(declare-fun a () Int)",
        "(assert (! (> x 0) :named n))",
        "(pop 1)",
        "(declare-const p P)",
        "(assert (= (fst p) a))",
        "(assert (not n))",
        "(check-sat)",
      ]),
    ).toEqual(["false", "true", "sat"]);
  });

  it("cannot be set once the solver is initialized", () => {
    expect(
      run([
        "(push 1)",
        "(set-option :global-declarations true)",
        "(declare-fun a () Int)",
        "(pop 1)",
        "(assert (= a 1))",
        "(check-sat)",
      ]),
    ).toEqual([
      "(error \"line 2 column 33: error setting ':global-decls', option value cannot be modified after initialization\")",
      '(error "line 5 column 11: unknown constant a")',
      "sat",
    ]);
  });
});

describe("opt, as Z3 5.3.2 sets up its solver", () => {
  it("delays the case splits a search makes", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x0 Int)",
        "(declare-fun x1 () Int)",
        "(declare-const b0 Bool)",
        "(assert (= (>= (abs x1) (- x0)) (=> (<= (div x0 1) x0) (= (- x0) x0))))",
        "(assert b0)",
        "(minimize 6)",
        "(assert-soft (not (and (>= (ite (distinct (div x0 2) (+ x0 x0 x0)) 0 x0) x1) (> (mod 4 5) (div x0 (- 2))) (<= (abs x0) (div x1 3)))) :weight 10)",
        "(check-sat)",
        "(eval (= (>= 0 (abs x0)) (xor (<= 5 (+ x0 x1 6)) b0)))",
      ]),
    ).toEqual(["sat", "false"]);
  });

  it("keeps relevancy on under a case split strategy other than 1", () => {
    const getRlimit = (options: string[]) =>
      run([
        ...options,
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-fun g (Real) Real)",
        "(assert (or (< x 3.5) (and (< (g x) y) (< x 8.0))))",
        "(assert (or (= (g y) x) (< y 1.0)))",
        "(assert (<= y 10.0))",
        "(minimize (- y x))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]);
    expect(getRlimit([])).toEqual(["sat", "(:rlimit 1132)"]);
    expect(getRlimit(["(set-option :smt.case_split 0)"])).toEqual(["sat", "(:rlimit 692)"]);
  });
});

describe("case splits, as Z3 5.3.2 reads smt.case_split", () => {
  it("delays the splits a search makes only under case_split 1", () => {
    const getRlimit = (options: string[]) =>
      run([
        ...options,
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(declare-const w Int)",
        "(declare-fun p0 (Int) Bool)",
        "(declare-fun p1 (Int) Bool)",
        "(declare-fun p2 (Int) Bool)",
        "(declare-fun p3 (Int) Bool)",
        "(assert (or (< (+ x x) 3) (> (+ x z) -2) (= (+ x y) -5)))",
        "(assert (or (not (>= w 0)) (not (<= (+ y z) 5)) (not (p2 (+ w x)))))",
        "(assert (or (p0 (+ x z)) (>= (+ x x) -3) (>= (+ w y) 0) (<= x -2)))",
        "(assert (or (> (+ z y) -4) (p1 (+ z z)) (not (= x -6))))",
        "(assert (or (<= (+ z z) -3) (<= y -1)))",
        "(assert (or (not (>= (+ x z) -3)) (p1 (+ z y)) (not (> (+ z z) -5)) (>= (+ x w) 4)))",
        "(assert (or (p1 w) (> w -2) (not (> x 6)) (<= (+ w x) 0)))",
        "(assert (or (< (+ z y) -4) (p3 x)))",
        "(assert (or (not (p2 y)) (not (< (+ y x) 1)) (= (+ w y) 4)))",
        "(assert (or (= (+ w y) -6) (p2 (+ x y))))",
        "(assert (or (not (< (+ z w) 2)) (not (> z 0))))",
        "(assert (or (>= (+ y w) 1) (= w 6) (p2 (+ w w))))",
        "(assert (or (p1 x) (p3 (+ y x)) (not (p3 z)) (not (<= (+ y z) 3))))",
        "(assert (or (p3 (+ y w)) (> (+ y x) -3) (<= z 0)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]);
    expect(getRlimit([])).toEqual(["sat", "(:rlimit 3420)"]);
    expect(getRlimit(["(set-option :smt.case_split 0)"])).toEqual(["sat", "(:rlimit 3465)"]);
  });

  const getRelevancySplits = (caseSplit: number, options: string[] = []) =>
    run([
      "(set-option :auto_config false)",
      `(set-option :smt.case_split ${caseSplit})`,
      ...options,
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(declare-fun p (Int) Bool)",
      "(assert (or (and (p x) (> x 3)) (and (p y) (> y x))))",
      "(assert (or (< x 2) (> y 7) (p (+ x y))))",
      "(check-sat)",
      "(get-info :rlimit)",
      "(get-value (x y (p x) (p y)))",
    ]);

  it("splits on the relevant terms under case_split 3 with full relevancy", () => {
    expect(getRelevancySplits(3)).toEqual([
      "sat",
      "(:rlimit 528)",
      "((x 21242)",
      " (y 0)",
      " ((p x) true)",
      " ((p y) true))",
    ]);
    expect(getRelevancySplits(3, ["(set-option :smt.relevancy 1)"])).toEqual([
      "sat",
      "(:rlimit 520)",
      "((x 0)",
      " (y 8)",
      " ((p x) true)",
      " ((p y) true))",
    ]);
  });

  it("splits on the relevant terms, then on the new variables by activity, under case_split 4", () => {
    expect(getRelevancySplits(4)).toEqual([
      "sat",
      "(:rlimit 490)",
      "((x 4)",
      " (y 8)",
      " ((p x) true)",
      " ((p y) true))",
    ]);
  });

  it("splits on the relevant terms, then on the new ones by generation, under case_split 5", () => {
    expect(getRelevancySplits(5)).toEqual([
      "sat",
      "(:rlimit 528)",
      "((x 21242)",
      " (y 0)",
      " ((p x) true)",
      " ((p y) true))",
    ]);
  });

  it("queues the terms a push makes relevant once get-consequences ends its search", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.case_split 4)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun q (Int) Bool)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(assert (or (and (p x) (> x 3)) (and (p y) (> y x))))",
        "(assert (or (< x 2) (> y 7) (p (+ x y))))",
        "(assert (=> a (= x 5)))",
        "(get-consequences (a b) (x y))",
        "(assert (or (and (q z) (< z y)) (and (q (+ z 1)) (> z 9)) (p z)))",
        "(assert (or (not (q z)) (and (> (+ x z) 4) (p (+ z 2)))))",
        "(assert (or (q x) (and (< z 3) (q y)) (not (p (+ y z)))))",
        "(push 1)",
        "(assert (or (p (+ x 1)) (q (+ y 1))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-value (x y z))",
      ]),
    ).toEqual([
      "sat",
      "",
      "(=> a (= x 5))",
      "sat",
      "(:rlimit 1058)",
      "((x 5)",
      " (y 2437)",
      " (z 0))",
    ]);
  });
});
