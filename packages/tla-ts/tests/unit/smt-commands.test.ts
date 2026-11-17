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
});
