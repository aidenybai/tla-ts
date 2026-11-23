import { describe, expect, it } from "vite-plus/test";
import { SmtCanceledError, SmtUnsupportedError } from "../../src/errors";
import { AstManager, SORT_BOOL } from "../../src/prover/smt/solver/ast";
import { CardPbRewriter, getCardinalityOptions } from "../../src/prover/smt/solver/card2bv";
import { L_UNDEF } from "../../src/prover/smt/solver/lbool";
import { mkPp } from "../../src/prover/smt/solver/muz/dl-rule";
import { RefVector } from "../../src/prover/smt/solver/ref-vector";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { IncSatSolver } from "../../src/prover/smt/solver/sat/inc-sat-solver";
import { Solver } from "../../src/prover/smt/solver/sat/solver";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";
import { type CardinalityEncoding, PsortNw } from "../../src/prover/smt/solver/sorting-network";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output.join("\n");
};

const NUM_VARS = 54;

// A random 3-SAT instance of 221 clauses over x0 to x53.
const getClauses = () => {
  let state = 8;
  const getNext = () => {
    state = (state + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    const remixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return (remixed ^ (remixed >>> 14)) >>> 0;
  };
  return Array.from({ length: 221 }, () => {
    const clause: { boolVar: number; isNegated: boolean }[] = [];
    while (clause.length < 3) {
      const boolVar = getNext() % NUM_VARS;
      if (clause.some((innerLit) => innerLit.boolVar === boolVar)) continue;
      clause.push({ boolVar, isNegated: getNext() % 2 === 1 });
    }
    return clause;
  });
};

const getScript = (command: string) => [
  ...Array.from({ length: NUM_VARS }, (_, index) => `(declare-const x${index} Bool)`),
  ...getClauses().map(
    (clause) =>
      `(assert (or ${clause
        .map((innerLit) =>
          innerLit.isNegated ? `(not x${innerLit.boolVar})` : `x${innerLit.boolVar}`,
        )
        .join(" ")}))`,
  ),
  command,
  "(get-model)",
];

const createSolver = (params: [string, string | number][], limit: ResourceLimit) => {
  const solver = new Solver(new Map(params), limit);
  for (let index = 0; index < NUM_VARS; index++) solver.mkVar(true);
  for (const clause of getClauses())
    solver.mkClause(
      clause.map((innerLit) => 2 * (innerLit.boolVar + 1) + (innerLit.isNegated ? 1 : 0)),
    );
  return solver;
};

// Z3 5.3.2's model, in the order it prints it: -x34 is x34 = false.
const RESTART_MODEL =
  "-x34 -x42 -x30 -x53 -x15 -x12 x36 -x19 x2 x27 -x0 -x40 -x14 -x45 x43 x32 -x9 -x41 x1 -x22 x50 " +
  "x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 -x11 -x6 " +
  "x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39";

const getModelOutput = (model: string) =>
  [
    "sat",
    "(",
    ...model
      .split(" ")
      .flatMap((entry) => [
        `  (define-fun ${entry.replace("-", "")} () Bool`,
        `    ${!entry.startsWith("-")})`,
      ]),
    ")",
  ].join("\n");

describe("sat simplifier", () => {
  it.each(["luby", "geometric", "static"])(
    "finds Z3's model when a %s restart ends the burst search and the simplifier runs",
    (restart) => {
      expect(run(getScript(`(check-sat-using (using-params sat :restart ${restart}))`))).toBe(
        getModelOutput(RESTART_MODEL),
      );
    },
  );
});

describe("sat parameters", () => {
  it.each([
    [
      ":restart geometric :restart.factor 3.0",
      "x34 -x42 -x30 x53 -x15 -x12 x36 -x19 -x2 x27 x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 x50 " +
        "x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 -x11 -x6 " +
        "x29 -x5 x18 x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39",
    ],
    [
      ":random_freq 0.5",
      "-x34 -x42 -x30 -x53 -x15 -x12 x36 -x19 -x2 x27 x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 x50 " +
        "x48 -x28 x10 -x37 x47 -x51 x31 -x25 x7 x49 x8 x38 x21 -x44 -x23 -x20 -x35 x24 -x17 -x11 -x6 " +
        "-x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 x39",
    ],
    [
      ":restart.margin 0.5",
      "-x34 -x42 -x30 -x53 -x15 -x12 x36 -x19 -x2 -x27 x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 x50 " +
        "x48 -x28 x10 -x37 x47 -x51 x31 -x25 x7 x49 x8 x38 x21 -x44 -x23 -x20 -x35 x24 -x17 -x11 -x6 " +
        "-x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 x39",
    ],
    [
      ":restart.margin 0.5 :restart.emafastglue 0.5",
      "-x34 -x42 -x30 x53 -x15 -x12 x36 -x19 x2 x27 -x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 x50 " +
        "x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 -x11 -x6 " +
        "x29 -x5 x18 x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39",
    ],
    [
      ":restart.margin 0.5 :restart.emafastglue 0.5 :restart.emaslowglue 0.5",
      "-x34 -x42 -x30 x53 -x15 -x12 x36 -x19 x2 x27 -x0 -x40 -x14 -x45 x43 x32 -x9 -x41 x1 -x22 x50 " +
        "x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 -x11 -x6 " +
        "x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39",
    ],
  ])("finds Z3's model when using-params sets the doubles %s", (params, model) => {
    expect(run(getScript(`(check-sat-using (using-params sat ${params}))`))).toBe(
      getModelOutput(model),
    );
  });

  it("searches with the local_search phase as with caching when the solver has no extension", () => {
    expect(run(getScript("(check-sat-using (using-params sat :phase local_search))"))).toBe(
      getModelOutput(
        "-x34 -x42 -x30 -x53 -x15 -x12 x36 -x19 x2 x27 -x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 " +
          "x50 x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 " +
          "-x11 -x6 x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39",
      ),
    );
  });

  it("reads a double of using-params over the global one set-option gave", () => {
    expect(
      run(
        getScript(
          "(set-option :sat.random_freq 0.5)\n(check-sat-using (using-params sat :random_freq 0.3))",
        ),
      ),
    ).toBe(
      getModelOutput(
        "x34 -x42 -x30 -x53 -x15 -x12 x36 -x19 x2 x27 x0 -x40 -x14 -x45 x43 x32 x9 -x41 x1 -x22 x50 " +
          "x48 -x28 x10 -x37 x47 x51 -x31 -x25 x7 x49 x8 x38 x21 -x44 x23 -x20 -x35 x24 -x17 -x11 -x6 " +
          "x29 -x5 x18 -x46 -x52 x13 -x33 -x26 x4 -x16 x3 -x39",
      ),
    );
  });
});

describe("sat2goal", () => {
  it("keeps the cardinality and pb constraints of the pb solver", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(declare-const e Bool)",
        "(assert ((_ at-most 2) a b c d))",
        "(assert (= e ((_ at-least 2) a b c)))",
        "(assert ((_ pbge 4 2 3 4) a b e))",
        "(assert ((_ pbeq 3 1 2 3) c d e))",
        "(assert (or a b e))",
        "(apply (using-params sat :max_conflicts 0))",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  (or (not e) k!0)",
        "  (or e (not k!0))",
        "  (or a b e)",
        "  ((_ at-least 2) (not a) (not b) (not c) (not d))",
        "  (= k!0 ((_ at-least 2) a b c))",
        "  ((_ pbge 4 2 3 4) a b e)",
        "  ((_ pbge 3 1 2 3) c d e)",
        "  ((_ pbge 3 1 2 3) (not c) (not d) (not e))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("frees the terms of its conversions once the incremental solver is released", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const [p, q, r] = [0, 1, 2].map(() => manager.mkFreshConst(null, SORT_BOOL));
    for (const atom of [p, q, r]) manager.incRef(atom);
    const negations = [p, q, r].map((atom) => manager.mkNot(atom));
    const solver = new IncSatSolver(manager, new Map(), new Map());
    solver.assertExpr(manager.mkOr([p, q]));
    solver.check();
    solver.assertExpr(manager.mkOr([negations[0], r]));
    solver.check();
    const converted = [...solver.getAssertions()];
    expect(converted.length).toBe(2);
    solver.release();
    expect([...converted, ...negations].filter((expr) => manager.ids[expr] !== -1)).toEqual([]);
  });

  it("adds the equalities of the egraph in sat.euf mode", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :sat.max_conflicts 0)",
        "(declare-sort U 0)",
        "(declare-fun f (U) U)",
        "(declare-const a U)",
        "(declare-const b U)",
        "(declare-const c U)",
        "(declare-const d U)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or (= a b) p))",
        "(assert (or (= (f a) c) q (not p)))",
        "(assert (= b c))",
        "(assert (= (f b) d))",
        "(assert (= (f c) a))",
        "(apply smt)",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  (= b c)",
        "  (= (f b) d)",
        "  (= (f c) a)",
        "  (or (= a b) p)",
        "  (or (not p) (= (f a) c) q)",
        "  (= a d)",
        "  (= b c)",
        "  (= (f b) d)",
        "  (= (f c) d)",
        "  (= (= (f c) a) (= (f b) d))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("keeps the atoms of popped variables until their variables are reused, as flush_smc does", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(push 1)",
        "(assert (bvsge (bvadd #x8 x) (bvsub #b0011 y)))",
        "(check-sat)",
        "(pop 1)",
        "(assert (= x (bvadd y (bvashr y #x4))))",
        "(check-sat)",
        "(get-value (x y))",
      ]),
    ).toBe(["sat", "sat", "((x #x8)", " (y #x9))"].join("\n"));
  });

  it("keeps the shared terms of its propagate-values across a pop, until it preprocesses again", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const z (_ BitVec 4))",
        "(push 1)",
        "(assert (bvsge #b0011 (bvsub #b0111 z)))",
        "(assert (bvsge x z))",
        "(check-sat)",
        "(pop 1)",
        "(assert (bvsge #b0001 (bvurem x #b0101)))",
        "(check-sat)",
        "(get-value (x))",
      ]),
    ).toBe(["sat", "sat", "((x #xa))"].join("\n"));
  });

  it("keeps the substitution of its propagate-values across a pop, until it preprocesses again", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(declare-const z (_ BitVec 4))",
        "(declare-const w (_ BitVec 4))",
        "(assert (or (bvult x (bvudiv #x0 z)) (bvsge y (bvudiv #x2 #x2))))",
        "(push 1)",
        "(assert (= w #xa))",
        "(assert (= w #x8))",
        "(check-sat)",
        "(pop 1)",
        "(push 1)",
        "(assert (bvslt (bvlshr #x1 z) (bvurem x #x6)))",
        "(check-sat)",
        "(pop 1)",
        "(check-sat)",
        "(get-value (z))",
      ]),
    ).toBe(["unsat", "sat", "sat", "((z #x7))"].join("\n"));
  });

  it("keeps the rewriter cache of its propagate-values across a pop, until it preprocesses again", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(declare-const z (_ BitVec 4))",
        "(declare-const w (_ BitVec 4))",
        "(declare-const p Bool)",
        "(push 1)",
        "(assert p)",
        "(assert (bvult (ite p #xd z) #xa))",
        "(check-sat)",
        "(pop 1)",
        "(push 1)",
        "(assert (= (bvurem w (bvurem #x9 y)) (bvxor (bvneg #xf) w)))",
        "(check-sat)",
        "(pop 1)",
        "(assert (bvugt y #x0))",
        "(assert (= x (bvlshr x y)))",
        "(check-sat)",
        "(get-value (x y))",
      ]),
    ).toBe(["unsat", "sat", "sat", "((x #x0)", " (y #xa))"].join("\n"));
  });

  it("frees the equation that names a dependency and the clause of a tracked formula", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const x (_ BitVec 3))",
        "(declare-const y (_ BitVec 3))",
        "(declare-const z (_ BitVec 3))",
        "(assert (bvule (bvneg (bvmul y x)) z))",
        "(assert (bvult (bvurem (bvneg (_ bv1 3)) (bvsdiv y x)) z))",
        "(get-consequences ((bvule (bvurem x (_ bv5 3)) x)) ())",
        "(assert (= z (_ bv5 3)))",
        "(check-sat)",
        "(get-value (x y z))",
      ]),
    ).toBe(["unknown", "", "sat", "((x #b110)", " (y #b101)", " (z #b101))"].join("\n"));
  });

  it("frees the state of its propagate-values at the start of get-consequences", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x (_ BitVec 3))",
        "(declare-const y (_ BitVec 3))",
        "(declare-const z (_ BitVec 3))",
        "(declare-const p Bool)",
        "(assert (bvule z (bvsdiv (_ bv0 3) y)))",
        "(get-consequences () (x p y z))",
        "(push 1)",
        "(assert (= z (_ bv2 3)))",
        "(assert (bvsge (bvsub z (bvadd x (_ bv7 3))) (bvurem (bvneg y) (bvlshr z x))))",
        "(check-sat)",
        "(pop 1)",
        "(get-consequences (p) (z p x))",
        "(assert (bvult z (bvsdiv (bvadd y x) z)))",
        "(check-sat)",
        "(get-value (x y z))",
      ]),
    ).toBe(
      ["sat", "", "sat", "sat", "", "sat", "((x #b100)", " (y #b000)", " (z #b011))"].join("\n"),
    );
  });
});

describe("sat solver", () => {
  it("leaves probing mode and keeps each clause once when inprocessing is canceled", () => {
    for (let delta = 800; delta < 2600; delta += 50) {
      const limit = new ResourceLimit(Infinity);
      const solver = createSolver(
        [
          ["restart", "luby"],
          ["burst_search", 10],
          ["asymm_branch.delay", 0],
        ],
        limit,
      );
      limit.push(delta);
      expect(() => solver.check()).toThrow(SmtCanceledError);
      expect(solver.isProbing).toBe(false);
      expect(new Set(solver.clauses).size).toBe(solver.clauses.length);
      expect(new Set(solver.learned).size).toBe(solver.learned.length);
    }
  });

  it.each([
    ["restart.max", "sat.max.restarts"],
    ["inprocess.max", "sat.max.inprocess"],
  ])("gives up when %s is reached", (param, reasonUnknown) => {
    const solver = createSolver([[param, 0]], new ResourceLimit(Infinity));
    expect(solver.check()).toBe(L_UNDEF);
    expect(solver.reasonUnknown).toBe(reasonUnknown);
  });

  it("propagates in user_pop with the resource limit suspended", () => {
    const limit = new ResourceLimit(Infinity);
    const solver = new Solver(new Map(), limit, true);
    const first = 2 * solver.mkVar(true);
    const second = 2 * solver.mkVar(true);
    solver.mkClause([first]);
    solver.mkClause([first ^ 1, second]);
    solver.userPush();
    limit.push(1);
    limit.inc();
    limit.inc();
    solver.userPop(1);
    expect(solver.value(second)).toBe(1);
    expect(limit.isSuspended).toBe(false);
  });

  it("makes a model for each command that asks for one, which the command frees", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(set-option :produce-models true)",
        "(declare-const v0 (_ BitVec 8))",
        "(declare-const v1 (_ BitVec 8))",
        "(declare-const p0 Bool)",
        "(declare-const p1 Bool)",
        "(assert (bvsge (bvmul (bvxor v0 v1) (bvadd v0 v0)) (bvudiv (_ bv53 8) (_ bv213 8))))",
        "(assert (bvult (bvmul (bvand (_ bv196 8) v0) (bvor v1 v1)) (bvmul (_ bv185 8) v0)))",
        "(assert p1)",
        "(assert (and p1 (bvult (bvudiv (bvmul (_ bv49 8) (_ bv3 8)) v1) (bvadd v0 v1))))",
        "(check-sat-assuming (p0))",
        "(get-value ((bvand (bvxor (_ bv26 8) (_ bv163 8)) (bvshl v0 v0))))",
        "(check-sat-assuming (p0))",
        "(get-value ((bvmul (bvshl (_ bv118 8) (_ bv166 8)) (bvurem v0 v1))))",
        "(assert (or (bvult (bvlshr (bvsub v1 v0) (bvudiv v0 v1)) (_ bv228 8)) (= (bvshl (bvand v1 (_ bv14 8)) (bvurem v0 (_ bv174 8))) v0)))",
        "(get-info :rlimit)",
        "(push 1)",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(((bvand (bvxor (_ bv26 8) (_ bv163 8)) (bvshl v0 v0)) #x00))",
        "sat",
        "(((bvmul (bvshl (_ bv118 8) (_ bv166 8)) (bvurem v0 v1)) #x00))",
        "(:rlimit 6566)",
        "sat",
        "(",
        "  (define-fun p1 () Bool",
        "    true)",
        "  (define-fun p0 () Bool",
        "    true)",
        "  (define-fun v0 () (_ BitVec 8)",
        "    #x7f)",
        "  (define-fun v1 () (_ BitVec 8)",
        "    #xb2)",
        ")",
        "(:rlimit 11385)",
      ].join("\n"),
    );
  });

  it("drops the cardinality constraints over the variables of a popped scope", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(declare-const e Bool)",
        "(declare-const f Bool)",
        "(declare-const g Bool)",
        "(assert ((_ at-least 1) a b))",
        "(push 1)",
        "(assert ((_ pbeq 2 1 1 1) a c d))",
        "(check-sat)",
        "(pop 1)",
        "(push 1)",
        "(assert (not a))",
        "(assert (and e (not f) g))",
        "(check-sat)",
      ]),
    ).toBe("sat\nsat");
  });

  it("keeps the cardinality constraints of a user scope to that scope", () => {
    const getScript = (constraint: string) => [
      "(set-option :tactic.default_tactic sat)",
      "(declare-const a Bool)",
      "(declare-const b Bool)",
      "(declare-const c Bool)",
      "(declare-const d Bool)",
      "(assert ((_ at-most 3) a b c d))",
      "(check-sat)",
      "(push 1)",
      `(assert ${constraint})`,
      "(check-sat)",
      "(pop 1)",
      "(assert a)",
      "(assert b)",
      "(check-sat)",
    ];
    expect(run(getScript("((_ at-most 1) a b c d)"))).toBe("sat\nsat\nsat");
    expect(run(getScript("((_ pbeq 1 1 1 1 1) a b c d)"))).toBe("sat\nsat\nsat");
  });

  it("drops a pseudo-Boolean equality of nine literals with its user scope, where Z3 keeps it", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        ...["a", "b", "c", "d", "e", "f", "g", "h", "i"].map(
          (name) => `(declare-const ${name} Bool)`,
        ),
        "(assert ((_ at-most 8) a b c d e f g h i))",
        "(check-sat)",
        "(push 1)",
        "(assert ((_ pbeq 1 1 1 1 1 1 1 1 1 1) a b c d e f g h i))",
        "(check-sat)",
        "(pop 1)",
        "(assert a)",
        "(assert b)",
        "(check-sat)",
      ]),
    ).toBe("sat\nsat\nsat");
  });

  it("declares each function it gives up on in the reason", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-sort U 0)",
        "(declare-fun a_rather_long_predicate_name_that_goes_on_and_on (U U U U (_ BitVec 8) U U U U U U U) Bool)",
        "(declare-const u U)",
        "(declare-const v U)",
        "(declare-const b (_ BitVec 8))",
        "(assert (a_rather_long_predicate_name_that_goes_on_and_on u u u u b u u u u u u u))",
        "(assert (or (= u v) (= v u)))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toBe(
      [
        "unknown",
        '(:reason-unknown "(sat.giveup interpreted functions sent to SAT solver (declare-fun a_rather_long_predicate_name_that_goes_on_and_on',
        "             (U U U U (_ BitVec 8) U U U U U U U)",
        "             Bool)",
        "(declare-fun = (U U) Bool)",
        "(declare-fun = (U U) Bool)",
        ')")',
      ].join("\n"),
    );
  });

  it("runs the euf solver in the finite-domain solver under sat.euf", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.euf true)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(declare-const p Bool)",
        "(assert (or p (bvult a b)))",
        "(assert (=> p (= a (bvadd b #x1))))",
        "(assert (not (= a #x0)))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun p () Bool",
        "    true)",
        "  (define-fun b () (_ BitVec 4)",
        "    #x0)",
        "  (define-fun a () (_ BitVec 4)",
        "    #x1)",
        ")",
        "(:rlimit 334)",
      ].join("\n"),
    );
  });
});

describe("smt.relevancy, as Z3 5.3.2 turns on euf's relevancy filter above 2", () => {
  const PROBLEM = [
    "(declare-fun f (Int) Int)",
    "(declare-const a Int)",
    "(declare-const b Int)",
    "(assert (or (= (f a) b) (> a b)))",
    "(assert (> (f a) 3))",
    "(assert (=> (> b 2) (= (f b) a)))",
  ];

  it("throws at sat.euf under an smt.relevancy above 2", () => {
    expect(() =>
      run([
        "(set-option :sat.euf true)",
        "(set-option :smt.relevancy 3)",
        ...PROBLEM,
        "(check-sat)",
      ]),
    ).toThrow(new SmtUnsupportedError("an smt.relevancy above 2 under sat.euf"));
  });

  it("throws at a sat tactic with euf under an smt.relevancy above 2", () => {
    expect(() =>
      run([
        "(set-option :smt.relevancy 3)",
        ...PROBLEM,
        "(check-sat-using (using-params sat :euf true))",
      ]),
    ).toThrow(new SmtUnsupportedError("an smt.relevancy above 2 under sat.euf"));
  });

  it("runs sat.euf under an smt.relevancy of 0", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :smt.relevancy 0)",
        ...PROBLEM,
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun b () Int",
        "    (- 8366))",
        "  (define-fun a () Int",
        "    0)",
        "  (define-fun f ((x!1 Int)) Int",
        "    (ite (= x!1 0) 4",
        "    (ite (= x!1 (- 8366)) 0",
        "      #unspecified)))",
        ")",
        "(:rlimit 185)",
      ].join("\n"),
    );
  });

  it("runs the smt kernel under an smt.relevancy of 3", () => {
    expect(
      run([
        "(set-option :smt.relevancy 3)",
        "(declare-sort U 0)",
        "(declare-fun f (U) U)",
        "(declare-const a U)",
        "(declare-const b U)",
        "(declare-const c U)",
        "(declare-const p Bool)",
        "(assert (or p (= (f a) b)))",
        "(assert (or (not p) (= (f b) c)))",
        "(assert (not (= (f a) (f b))))",
        "(assert (or (= a b) (= b c) (= (f c) a)))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  ;; universe for U:",
        "  ;;   U!val!1 U!val!0 U!val!2 ",
        "  ;; -----------",
        "  ;; definitions for universe elements:",
        "  (declare-fun U!val!1 () U)",
        "  (declare-fun U!val!0 () U)",
        "  (declare-fun U!val!2 () U)",
        "  ;; cardinality constraint:",
        "  (forall ((x U)) (or (= x U!val!1) (= x U!val!0) (= x U!val!2)))",
        "  ;; -----------",
        "  (define-fun b () U",
        "    U!val!1)",
        "  (define-fun c () U",
        "    U!val!1)",
        "  (define-fun p () Bool",
        "    false)",
        "  (define-fun a () U",
        "    U!val!0)",
        "  (define-fun f ((x!0 U)) U",
        "    (ite (= x!0 U!val!1) U!val!2",
        "      U!val!1))",
        ")",
        "(:rlimit 554)",
      ].join("\n"),
    );
  });
});

describe("psort_nw, as Z3 5.3.2's card2bv encodes cardinality constraints", () => {
  const getEncoding = (
    encoding: CardinalityEncoding,
    numVars: number,
    encode: (psort: PsortNw, xs: number[], manager: AstManager) => number,
  ) => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const xs = Array.from({ length: numVars }, (_value, index) =>
      manager.mkApp(manager.mkFuncDecl(`x${index}`, [], SORT_BOOL), [], SORT_BOOL),
    );
    for (const literal of xs) manager.incRef(literal);
    const rewriter = new CardPbRewriter(manager, getCardinalityOptions(new Map(), new Map()));
    const result = encode(new PsortNw(rewriter, encoding), xs, manager);
    const lemmas = new RefVector(manager);
    rewriter.flushSideConstraints(lemmas);
    const printed = [result, ...lemmas.items].map((expr) => mkPp(manager, expr));
    lemmas.reset();
    rewriter.release();
    return printed;
  };

  const getNegations = (manager: AstManager, xs: number[]) =>
    xs.map((innerX) => manager.mkNot(innerX));

  it("encodes an at-most-1 as pairwise clauses under a fresh literal", () => {
    expect(
      getEncoding("grouped", 3, (psort, xs, manager) =>
        psort.ge(false, 2, getNegations(manager, xs)),
      ),
    ).toEqual([
      "at-most-1!0",
      "(or (not at-most-1!0) (not x0) (not x1))",
      "(or (not at-most-1!0) (not x0) (not x2))",
      "(or (not at-most-1!0) (not x1) (not x2))",
    ]);
  });

  it("sorts a small at-least directly", () => {
    expect(getEncoding("grouped", 5, (psort, xs) => psort.ge(false, 2, xs))).toEqual([
      "dsort!1",
      "(or (not dsort!0) x0 x1 x2 x3 x4)",
      "(or (not dsort!1) x0 x1 x2 x3)",
      "(or (not dsort!1) x0 x1 x2 x4)",
      "(or (not dsort!1) x0 x1 x3 x4)",
      "(or (not dsort!1) x0 x2 x3 x4)",
      "(or (not dsort!1) x1 x2 x3 x4)",
    ]);
  });

  it("dualizes an at-least of more than half into an at-most", () => {
    expect(
      getEncoding("grouped", 5, (psort, xs, manager) =>
        psort.ge(false, 3, getNegations(manager, xs)),
      ),
    ).toEqual([
      "(not dsort!2)",
      "(or dsort!0 (not x0))",
      "(or dsort!0 (not x1))",
      "(or dsort!0 (not x2))",
      "(or dsort!0 (not x3))",
      "(or dsort!0 (not x4))",
      "(or dsort!1 (not x0) (not x1))",
      "(or dsort!1 (not x0) (not x2))",
      "(or dsort!1 (not x0) (not x3))",
      "(or dsort!1 (not x0) (not x4))",
      "(or dsort!1 (not x1) (not x2))",
      "(or dsort!1 (not x1) (not x3))",
      "(or dsort!1 (not x1) (not x4))",
      "(or dsort!1 (not x2) (not x3))",
      "(or dsort!1 (not x2) (not x4))",
      "(or dsort!1 (not x3) (not x4))",
      "(or dsort!2 (not x0) (not x1) (not x2))",
      "(or dsort!2 (not x0) (not x1) (not x3))",
      "(or dsort!2 (not x0) (not x1) (not x4))",
      "(or dsort!2 (not x0) (not x2) (not x3))",
      "(or dsort!2 (not x0) (not x2) (not x4))",
      "(or dsort!2 (not x0) (not x3) (not x4))",
      "(or dsort!2 (not x1) (not x2) (not x3))",
      "(or dsort!2 (not x1) (not x2) (not x4))",
      "(or dsort!2 (not x1) (not x3) (not x4))",
      "(or dsort!2 (not x2) (not x3) (not x4))",
    ]);
  });

  it("encodes an exactly-1 as an at-most-1 and a clause for at least one", () => {
    expect(getEncoding("grouped", 3, (psort, xs) => psort.eq(false, 1, xs))).toEqual([
      "at-most-1!0",
      "(or (not at-most-1!0) (not x0) (not x1))",
      "(or (not at-most-1!0) (not x0) (not x2))",
      "(or (not at-most-1!0) (not x1) (not x2))",
      "(or x0 x1 x2 (not at-most-1!0))",
    ]);
  });

  it("encodes an at-most-1 with the bimander encoding", () => {
    expect(
      getEncoding("bimander", 3, (psort, xs, manager) =>
        psort.ge(false, 2, getNegations(manager, xs)),
      ),
    ).toEqual([
      "bimander!0",
      "(or (not bimander!0) (not x0) (not x1))",
      "(or (not bimander!0) (not (or x0 x1)) (not bit!1))",
      "(or (not bimander!0) (not x2) bit!1)",
    ]);
  });

  it("encodes an exactly-1 with the ordered encoding", () => {
    expect(getEncoding("ordered", 3, (psort, xs) => psort.eq(false, 1, xs))).toEqual([
      "ordered!0",
      "(or (not y!1) y!2)",
      "(or (not x0) y!1)",
      "(or (not ordered!0) (not y!1) (not x1))",
      "(or (not x1) y!2)",
      "(or (not ordered!0) (not y!2) (not x2))",
      "(or (not ordered!0) y!2 x2)",
      "(or (not y!2) x1 y!1)",
      "(or (not y!1) x0)",
    ]);
  });

  it("adds up an at-least with the unate encoding, without fresh literals", () => {
    expect(getEncoding("unate", 5, (psort, xs) => psort.ge(false, 2, xs))).toEqual([
      [
        "(let ((a!1 (and x4 (or x3 (or x2 (or x1 x0))))))",
        "  (or a!1 (and x3 (or x2 (or x1 x0))) (and x2 (or x1 x0)) (and x1 x0)))",
      ].join("\n"),
    ]);
  });
});

describe("card2bv, as Z3 5.3.2 encodes cardinality constraints", () => {
  it("encodes an at-most in the finite-domain solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert ((_ at-most 1) p q r))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun r () Bool",
        "    false)",
        "  (define-fun p () Bool",
        "    false)",
        "  (define-fun q () Bool",
        "    false)",
        ")",
        "(:rlimit 67)",
      ].join("\n"),
    );
  });

  it("encodes an at-most of 10 literals in the finite-domain solver, which keeps none", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p0 Bool)",
        "(declare-const p1 Bool)",
        "(declare-const p2 Bool)",
        "(declare-const p3 Bool)",
        "(declare-const p4 Bool)",
        "(declare-const p5 Bool)",
        "(declare-const p6 Bool)",
        "(declare-const p7 Bool)",
        "(declare-const p8 Bool)",
        "(declare-const p9 Bool)",
        "(assert ((_ at-most 2) p0 p1 p2 p3 p4 p5 p6 p7 p8 p9))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun p9 () Bool",
        "    false)",
        "  (define-fun p5 () Bool",
        "    false)",
        "  (define-fun p0 () Bool",
        "    false)",
        "  (define-fun p1 () Bool",
        "    false)",
        "  (define-fun p2 () Bool",
        "    false)",
        "  (define-fun p3 () Bool",
        "    false)",
        "  (define-fun p4 () Bool",
        "    false)",
        "  (define-fun p6 () Bool",
        "    false)",
        "  (define-fun p7 () Bool",
        "    false)",
        "  (define-fun p8 () Bool",
        "    false)",
        ")",
        "(:rlimit 564)",
      ].join("\n"),
    );
  });

  it("encodes an at-least in the finite-domain solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(declare-const x3 Bool)",
        "(declare-const x4 Bool)",
        "(assert ((_ at-least 2) x0 x1 x2 x3 x4))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x4 () Bool",
        "    false)",
        "  (define-fun x3 () Bool",
        "    false)",
        "  (define-fun x0 () Bool",
        "    true)",
        "  (define-fun x1 () Bool",
        "    true)",
        "  (define-fun x2 () Bool",
        "    false)",
        ")",
        "(:rlimit 76)",
      ].join("\n"),
    );
  });

  it("encodes a pbeq with unit coefficients in the finite-domain solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(declare-const x3 Bool)",
        "(declare-const x4 Bool)",
        "(assert ((_ pbeq 2 1 1 1 1 1) x0 x1 x2 x3 x4))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x4 () Bool",
        "    false)",
        "  (define-fun x0 () Bool",
        "    true)",
        "  (define-fun x1 () Bool",
        "    true)",
        "  (define-fun x2 () Bool",
        "    false)",
        "  (define-fun x3 () Bool",
        "    false)",
        ")",
        "(:rlimit 364)",
      ].join("\n"),
    );
  });

  it("keeps an encoding's fresh literals across a pop in the finite-domain solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert ((_ at-most 1) p q (= a #x3)))",
        "(assert (or p q))",
        "(push 1)",
        "(assert (not p))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(pop 1)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toBe(["sat", "(:rlimit 252)", "sat", "(:rlimit 273)"].join("\n"));
  });

  it("encodes cardinality constraints in the card2bv tactic", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(declare-const t Bool)",
        "(assert ((_ at-most 1) p q r))",
        "(assert ((_ at-least 2) p q r s t))",
        "(assert ((_ pbeq 1 1 1 1) q s t))",
        "(apply card2bv)",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  at-most-1!0",
        "  dsort!2",
        "  at-most-1!3",
        "  (or (not at-most-1!0) (not p) (not q))",
        "  (or (not at-most-1!0) (not p) (not r))",
        "  (or (not at-most-1!0) (not q) (not r))",
        "  (or (not dsort!1) p q r s t)",
        "  (or (not dsort!2) p q r s)",
        "  (or (not dsort!2) p q r t)",
        "  (or (not dsort!2) p q s t)",
        "  (or (not dsort!2) p r s t)",
        "  (or (not dsort!2) q r s t)",
        "  (or (not at-most-1!3) (not q) (not s))",
        "  (or (not at-most-1!3) (not q) (not t))",
        "  (or (not at-most-1!3) (not s) (not t))",
        "  (or q s t (not at-most-1!3))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("keeps cardinality constraints of 9 or more literals in the incremental sat solver", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        "(declare-const a0 Bool) (declare-const a1 Bool) (declare-const a2 Bool) (declare-const a3 Bool) (declare-const a4 Bool) (declare-const a5 Bool) (declare-const a6 Bool) (declare-const a7 Bool) (declare-const a8 Bool) (declare-const a9 Bool)",
        "(push)",
        "(assert ((_ at-most 2) a0 a1 a2 a3 a4 a5 a6 a7 a8 a9))",
        "(assert ((_ at-most 1) a0 a1 a2))",
        "(assert (or a0 a1))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun a0 () Bool",
        "    true)",
        "  (define-fun a1 () Bool",
        "    false)",
        "  (define-fun a2 () Bool",
        "    false)",
        "  (define-fun a3 () Bool",
        "    false)",
        "  (define-fun a4 () Bool",
        "    false)",
        "  (define-fun a5 () Bool",
        "    false)",
        "  (define-fun a6 () Bool",
        "    false)",
        "  (define-fun a7 () Bool",
        "    false)",
        "  (define-fun a8 () Bool",
        "    false)",
        "  (define-fun a9 () Bool",
        "    false)",
        ")",
        "(:rlimit 286)",
      ].join("\n"),
    );
  });

  it("encodes the cardinality constraints under a disjunction in the pb2bv tactic", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(assert (<= 0 x 1))",
        "(assert (or (= x 1) ((_ at-most 1) p q r)))",
        "(assert (or s ((_ at-least 2) p q r)))",
        "(apply pb2bv)",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  true",
        "  true",
        "  (or k!0 at-most-1!1)",
        "  (or s at-most-1!3)",
        "  (or (not at-most-1!1) (not p) (not q))",
        "  (or (not at-most-1!1) (not p) (not r))",
        "  (or (not at-most-1!1) (not q) (not r))",
        "  (or and!2 q r)",
        "  (or and!2 p r)",
        "  (or and!2 p q)",
        "  (or at-most-1!1 (not and!2))",
        "  (or (not at-most-1!3) p q)",
        "  (or (not at-most-1!3) p r)",
        "  (or (not at-most-1!3) q r)",
        "  (or and!4 (not q) (not r))",
        "  (or and!4 (not p) (not r))",
        "  (or and!4 (not p) (not q))",
        "  (or at-most-1!3 (not and!4))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("throws at a pseudo-Boolean constraint whose coefficients sum past 2^32, which Z3 encodes as bit-vectors", () => {
    expect(() =>
      run([
        "(set-logic QF_FD)",
        ..."abcdefgh".split("").map((name) => `(declare-const ${name} Bool)`),
        "(assert ((_ pbge 2000000000 1000000007 900000011 800000017 700000019 600000023 500000029 400000031 300000037) a b c d e f g h))",
        "(check-sat)",
      ]),
    ).toThrow(new SmtUnsupportedError("the bit-vector encoding of a pseudo-Boolean constraint"));
  });
});

describe("card2bv's parameters, as Z3 5.3.2 reads them at each call site", () => {
  it("keeps cardinality constraints of 9 or more literals in the finite-domain solver under sat.cardinality.solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.solver true)",
        "(declare-const p0 Bool)",
        "(declare-const p1 Bool)",
        "(declare-const p2 Bool)",
        "(declare-const p3 Bool)",
        "(declare-const p4 Bool)",
        "(declare-const p5 Bool)",
        "(declare-const p6 Bool)",
        "(declare-const p7 Bool)",
        "(declare-const p8 Bool)",
        "(declare-const p9 Bool)",
        "(assert ((_ at-most 2) p0 p1 p2 p3 p4 p5 p6 p7 p8 p9))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun p0 () Bool",
        "    false)",
        "  (define-fun p1 () Bool",
        "    false)",
        "  (define-fun p2 () Bool",
        "    false)",
        "  (define-fun p3 () Bool",
        "    false)",
        "  (define-fun p4 () Bool",
        "    false)",
        "  (define-fun p5 () Bool",
        "    false)",
        "  (define-fun p6 () Bool",
        "    false)",
        "  (define-fun p7 () Bool",
        "    false)",
        "  (define-fun p8 () Bool",
        "    false)",
        "  (define-fun p9 () Bool",
        "    false)",
        ")",
        "(:rlimit 275)",
      ].join("\n"),
    );
  });

  it("keeps cardinality constraints down to sat.pb.min_arity literals under sat.cardinality.solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.solver true)",
        "(set-option :sat.pb.min_arity 3)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert ((_ at-most 1) p q r))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun p () Bool",
        "    false)",
        "  (define-fun q () Bool",
        "    false)",
        "  (define-fun r () Bool",
        "    false)",
        ")",
        "(:rlimit 107)",
      ].join("\n"),
    );
  });

  it("keeps cardinality constraints in the card2bv tactic under keep_cardinality_constraints", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const a0 Bool) (declare-const a1 Bool) (declare-const a2 Bool) (declare-const a3 Bool) (declare-const a4 Bool) (declare-const a5 Bool) (declare-const a6 Bool) (declare-const a7 Bool) (declare-const a8 Bool) (declare-const a9 Bool)",
        "(assert ((_ at-most 1) p q r))",
        "(assert ((_ at-most 2) a0 a1 a2 a3 a4 a5 a6 a7 a8 a9))",
        "(apply (using-params card2bv :keep_cardinality_constraints true))",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  at-most-1!0",
        "  ((_ at-least 8)",
        "    (not a0)",
        "    (not a1)",
        "    (not a2)",
        "    (not a3)",
        "    (not a4)",
        "    (not a5)",
        "    (not a6)",
        "    (not a7)",
        "    (not a8)",
        "    (not a9))",
        "  (or (not at-most-1!0) (not p) (not q))",
        "  (or (not at-most-1!0) (not p) (not r))",
        "  (or (not at-most-1!0) (not q) (not r))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("encodes with the card2bv tactic's cardinality.encoding", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(assert ((_ at-least 2) p q r s))",
        "(apply (using-params card2bv :cardinality.encoding unate))",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  (or (and s (or r (or q p))) (and r (or q p)) (and q p))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("encodes cardinality constraints of 9 or more literals in the incremental sat solver when sat.cardinality.solver is false", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        "(set-option :sat.cardinality.solver false)",
        "(declare-const a0 Bool) (declare-const a1 Bool) (declare-const a2 Bool) (declare-const a3 Bool) (declare-const a4 Bool) (declare-const a5 Bool) (declare-const a6 Bool) (declare-const a7 Bool) (declare-const a8 Bool) (declare-const a9 Bool)",
        "(push)",
        "(assert ((_ at-most 2) a0 a1 a2 a3 a4 a5 a6 a7 a8 a9))",
        "(assert ((_ at-most 1) a0 a1 a2))",
        "(assert (or a0 a1))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun a8 () Bool",
        "    false)",
        "  (define-fun a9 () Bool",
        "    false)",
        "  (define-fun a0 () Bool",
        "    false)",
        "  (define-fun a1 () Bool",
        "    true)",
        "  (define-fun a7 () Bool",
        "    false)",
        "  (define-fun a2 () Bool",
        "    false)",
        "  (define-fun a3 () Bool",
        "    false)",
        "  (define-fun a4 () Bool",
        "    false)",
        "  (define-fun a5 () Bool",
        "    true)",
        "  (define-fun a6 () Bool",
        "    false)",
        ")",
        "(:rlimit 1150)",
      ].join("\n"),
    );
  });

  it("keeps cardinality constraints down to sat.pb.min_arity literals in the incremental sat solver", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        "(set-option :sat.pb.min_arity 3)",
        "(declare-const a0 Bool) (declare-const a1 Bool) (declare-const a2 Bool) (declare-const a3 Bool) (declare-const a4 Bool) (declare-const a5 Bool) (declare-const a6 Bool) (declare-const a7 Bool) (declare-const a8 Bool) (declare-const a9 Bool)",
        "(push)",
        "(assert ((_ at-most 2) a0 a1 a2 a3 a4 a5 a6 a7 a8 a9))",
        "(assert ((_ at-most 1) a0 a1 a2))",
        "(assert (or a0 a1))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun a0 () Bool",
        "    true)",
        "  (define-fun a1 () Bool",
        "    false)",
        "  (define-fun a2 () Bool",
        "    false)",
        "  (define-fun a3 () Bool",
        "    false)",
        "  (define-fun a4 () Bool",
        "    false)",
        "  (define-fun a5 () Bool",
        "    false)",
        "  (define-fun a6 () Bool",
        "    false)",
        "  (define-fun a7 () Bool",
        "    false)",
        "  (define-fun a8 () Bool",
        "    false)",
        "  (define-fun a9 () Bool",
        "    false)",
        ")",
        "(:rlimit 242)",
      ].join("\n"),
    );
  });

  it("encodes with the pb2bv tactic's cardinality.encoding", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(assert (<= 0 x 1))",
        "(assert (or (= x 1) ((_ at-most 2) p q r s)))",
        "(apply (using-params pb2bv :cardinality.encoding unate))",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  true",
        "  true",
        "  (let ((a!1 (and s (or (and r (or q p)) (and q p)))))",
        "  (let ((a!2 (not (or a!1 (and r (and q p))))))",
        "    (or k!0 a!2)))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });

  it("encodes an at-most-1 with the bimander encoding under sat.cardinality.encoding", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.encoding bimander)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(assert ((_ at-most 1) x0 x1 x2))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x2 () Bool",
        "    false)",
        "  (define-fun x0 () Bool",
        "    false)",
        "  (define-fun x1 () Bool",
        "    false)",
        ")",
        "(:rlimit 72)",
      ].join("\n"),
    );
  });

  it("encodes an exactly-1 with the ordered encoding under sat.cardinality.encoding", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.encoding ordered)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(assert ((_ pbeq 1 1 1 1) x0 x1 x2))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x0 () Bool",
        "    true)",
        "  (define-fun x1 () Bool",
        "    false)",
        "  (define-fun x2 () Bool",
        "    false)",
        ")",
        "(:rlimit 97)",
      ].join("\n"),
    );
  });

  it("encodes an at-least with the unate encoding under sat.cardinality.encoding", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.encoding unate)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(declare-const x3 Bool)",
        "(declare-const x4 Bool)",
        "(assert ((_ at-least 2) x0 x1 x2 x3 x4))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x1 () Bool",
        "    true)",
        "  (define-fun x0 () Bool",
        "    true)",
        "  (define-fun x4 () Bool",
        "    true)",
        "  (define-fun x2 () Bool",
        "    true)",
        "  (define-fun x3 () Bool",
        "    true)",
        ")",
        "(:rlimit 301)",
      ].join("\n"),
    );
  });

  it("encodes an at-most with the circuit encoding under sat.cardinality.encoding", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.cardinality.encoding circuit)",
        "(declare-const x0 Bool)",
        "(declare-const x1 Bool)",
        "(declare-const x2 Bool)",
        "(declare-const x3 Bool)",
        "(declare-const x4 Bool)",
        "(assert ((_ at-most 2) x0 x1 x2 x3 x4))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x0 () Bool",
        "    false)",
        "  (define-fun x1 () Bool",
        "    false)",
        "  (define-fun x2 () Bool",
        "    false)",
        "  (define-fun x4 () Bool",
        "    false)",
        "  (define-fun x3 () Bool",
        "    false)",
        ")",
        "(:rlimit 1197)",
      ].join("\n"),
    );
  });

  it("encodes with a sat.cardinality.encoding set after the finite-domain solver starts", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((index) => `(declare-const x${index} Bool)`),
        "(assert ((_ at-most 2) x0 x1 x2 x3 x4 x5))",
        "(set-option :sat.cardinality.encoding unate)",
        "(assert ((_ at-least 3) x2 x3 x4 x5 x6 x7))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x7 () Bool",
        "    true)",
        "  (define-fun x3 () Bool",
        "    false)",
        "  (define-fun x2 () Bool",
        "    false)",
        "  (define-fun x5 () Bool",
        "    true)",
        "  (define-fun x4 () Bool",
        "    true)",
        "  (define-fun x6 () Bool",
        "    true)",
        "  (define-fun x1 () Bool",
        "    false)",
        "  (define-fun x0 () Bool",
        "    false)",
        ")",
        "(:rlimit 1003)",
      ].join("\n"),
    );
  });

  it("encodes with a sat.cardinality.encoding set after the incremental sat solver starts", () => {
    expect(
      run([
        "(set-option :tactic.default_tactic sat)",
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => `(declare-const x${index} Bool)`),
        "(assert (or x0 x1))",
        "(check-sat)",
        "(set-option :sat.cardinality.encoding unate)",
        "(assert ((_ at-most 2) x0 x1 x2 x3 x4 x5))",
        "(assert ((_ at-least 3) x0 x1 x2 x3 x4 x5 x6 x7 x8 x9))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        "sat",
        "(",
        "  (define-fun x0 () Bool",
        "    true)",
        "  (define-fun x1 () Bool",
        "    false)",
        "  (define-fun x5 () Bool",
        "    false)",
        "  (define-fun x3 () Bool",
        "    false)",
        "  (define-fun x2 () Bool",
        "    false)",
        "  (define-fun x4 () Bool",
        "    true)",
        "  (define-fun x6 () Bool",
        "    true)",
        "  (define-fun x7 () Bool",
        "    false)",
        "  (define-fun x8 () Bool",
        "    false)",
        "  (define-fun x9 () Bool",
        "    false)",
        "  (define-fun x10 () Bool",
        "    false)",
        "  (define-fun x11 () Bool",
        "    false)",
        ")",
        "(:rlimit 466)",
      ].join("\n"),
    );
  });

  for (const pbSolver of ["totalizer", "sorting", "binary_merge"])
    it(`throws at a weighted pseudo-Boolean constraint under sat.pb.solver ${pbSolver}`, () => {
      expect(() =>
        run([
          "(set-logic QF_FD)",
          `(set-option :sat.pb.solver ${pbSolver})`,
          "(declare-const p Bool)",
          "(declare-const q Bool)",
          "(declare-const r Bool)",
          "(assert ((_ pbge 5 3 4 2) p q r))",
          "(check-sat)",
        ]),
      ).toThrow(new SmtUnsupportedError(`the ${pbSolver} encoding of a pseudo-Boolean constraint`));
    });

  it("throws at a weighted pseudo-Boolean constraint under the card2bv tactic's pb.solver", () => {
    expect(() =>
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert ((_ pbge 5 3 4 2) p q r))",
        "(apply (using-params card2bv :pb.solver totalizer))",
      ]),
    ).toThrow(new SmtUnsupportedError("the totalizer encoding of a pseudo-Boolean constraint"));
  });

  it("answers unknown at a weighted pseudo-Boolean constraint under sat.pb.solver segmented", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver segmented)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert ((_ pbge 5 3 4 2) p q r))",
        "(check-sat)",
      ]),
    ).toBe("unknown");
  });

  it("encodes a weighted pseudo-Boolean constraint whose bound reduces to 0 or less, and fails on the segmented encoding past it", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or r ((_ pble 1 2 4) p q)))",
        "(assert ((_ pbge 6 2 4) p q))",
        "(apply (using-params pb2bv :pb.solver segmented))",
        "(assert ((_ pble 5 2 4 6) p q r))",
        "(apply (using-params pb2bv :pb.solver segmented))",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  (or r (not (or p q)))",
        "  p",
        "  q",
        "  :precision precise :depth 1)",
        ")",
        '(error "line 8 column 48: segmented encoding is disabled, use a different value for pb.solver")',
        "(:rlimit 66)",
      ].join("\n"),
    );
  });
});

describe("pseudo-Boolean bounds past 2^31, which Z3 5.3.2's int parameters can't hold", () => {
  const DECLARATIONS = "abcde".split("").map((name) => `(declare-const ${name} Bool)`);
  const ATOM =
    "((_ pbge 2500000000 1000000001 1000000002 1000000003 1000000004 1000000005) a b c d e)";

  // Deviation from Z3: it parses the bound 2500000000 as a negative int and prints true.
  it("keeps a pbge bound past 2^31 that any three literals reach", () => {
    expect(run([...DECLARATIONS, `(simplify ${ATOM})`])).toBe("((_ at-least 3) a b c d e)");
  });

  // Deviation from Z3: it answers sat, though d and e sum to 2000000009.
  it("answers unsat when only two literals of a pbge bound past 2^31 can hold", () => {
    expect(
      run([
        ...DECLARATIONS,
        `(assert ${ATOM})`,
        "(assert (not a))",
        "(assert (not b))",
        "(assert (not c))",
        "(check-sat)",
      ]),
    ).toBe("unsat");
  });

  // Deviation from Z3: it parses the coefficient 3000000000 as a negative int and answers unsat.
  it("keeps a pbge coefficient past 2^31", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(assert ((_ pbge 1 3000000000 1) a b))",
        "(assert (not b))",
        "(check-sat)",
      ]),
    ).toBe("sat");
  });

  // Deviation from Z3: it parses the bound 3000000000 as a negative int, rejects the atom and answers sat.
  it("keeps an at-least bound past 2^31", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert ((_ at-least 3000000000) p q))",
        "(check-sat)",
      ]),
    ).toBe("unsat");
  });

  it("rejects an at-most bound past 2^32", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert ((_ at-most 5000000000) p q))",
        "(check-sat)",
      ]),
    ).toBe(
      [
        '(error "line 3 column 35: function expects one non-negative integer parameter")',
        "sat",
      ].join("\n"),
    );
  });

  // Deviation from Z3: pb_util::mk_ge makes the bound 3000000000 a negative int, and the tactic fails with "function expects one non-negative integer parameter".
  it("keeps an at-least bound past 2^31 that lia2card makes from an equality", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (<= 0 x 1))",
        "(assert (<= 0 y 1))",
        "(assert (= (+ x y) 3000000000))",
        "(apply (using-params lia2card :compile_equality false))",
      ]),
    ).toBe(
      [
        "(goals",
        "(goal",
        "  true",
        "  true",
        "  true",
        "  true",
        "  ((_ at-least 3000000000) x!0 y!1)",
        "  ((_ pble 3000000000 1 1) x!0 y!1)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    );
  });
});

describe("indices, as Z3 5.3.2's parser reads them", () => {
  const DECLARATIONS = ["(declare-const p Bool)", "(declare-const q Bool)"];

  it("reads a bit-vector index as the numeral of its value", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(simplify ((_ extract #b11 #x0) x))",
        "(simplify ((_ zero_extend #b1) x))",
        "(simplify ((_ sign_extend #x2) x))",
        "(simplify ((_ rotate_left #b11) x))",
        "(simplify ((_ repeat #x2) x))",
        "(simplify ((_ int2bv #x8) 5))",
        "(simplify ((_ to_fp #x8 #x18) RNE 1.0))",
        '(simplify (str.in_re "aa" ((_ re.loop #x1 #x2) (str.to_re "a"))))',
      ]),
    ).toBe(
      [
        "((_ extract 3 0) x)",
        "(concat #b0 x)",
        "(concat ((_ extract 7 7) x) ((_ extract 7 7) x) x)",
        "(concat ((_ extract 4 0) x) ((_ extract 7 5) x))",
        "(concat x x)",
        "#x05",
        "(fp #b0 #x7f #b00000000000000000000000)",
        "true",
      ].join("\n"),
    );
  });

  it.each([
    ["((_ at-most #b1) p q)", "sat", 48],
    ["((_ pbeq 1 0.5 0.5) p q)", "sat", 30],
    ["((_ pbge 1.5 0.5 0.5) p q)", "unsat", 6],
    ["((_ pbge 1500000000 0.5 0.5) p q)", "unsat", 6],
  ])("asserts %s and answers %s at Z3's rlimit %d", (assertion, verdict, rlimit) => {
    expect(
      run([...DECLARATIONS, `(assert ${assertion})`, "(check-sat)", "(get-info :rlimit)"]),
    ).toBe([verdict, `(:rlimit ${rlimit})`].join("\n"));
  });

  it("simplifies pseudo-Boolean constraints with bit-vector and decimal indices", () => {
    expect(
      run([
        ...DECLARATIONS,
        "(simplify ((_ at-most #x1) p q))",
        "(simplify ((_ pbeq 1 0.5 0.5) p q))",
        "(simplify ((_ pbge 1500000000 0.5 0.5) p q))",
      ]),
    ).toBe(["(or (not p) (not q))", "(and p q)", "false"].join("\n"));
  });

  it("rejects a decimal or keyword index where pb_decl_plugin wants an int", () => {
    expect(
      run([
        ...DECLARATIONS,
        "(assert ((_ at-most 2.0) p q))",
        "(assert ((_ at-most :k) p q))",
        "(assert ((_ pbge 1 :k 1) p q))",
        "(check-sat)",
      ]),
    ).toBe(
      [
        '(error "line 3 column 28: function expects one non-negative integer parameter")',
        '(error "line 4 column 27: function expects one non-negative integer parameter")',
        "(error \"line 5 column 28: functions 'pble/pbge/pbeq' expect arity+1 integer parameters\")",
        "sat",
      ].join("\n"),
    );
  });
});

describe("sat config, as Z3 5.3.2 checks the sat solver's parameters", () => {
  const getChecked = (options: string[]) =>
    run([
      ...options.map((option) => `(set-option ${option})`),
      "(declare-const p Bool)",
      "(declare-const q Bool)",
      "(assert (or p q))",
      "(check-sat)",
      "(get-info :reason-unknown)",
      "(get-info :rlimit)",
    ]);
  const getUnknown = (reason: string) =>
    ["unknown", `(:reason-unknown "${reason}")`, "(:rlimit 8)"].join("\n");
  const REWARD =
    "invalid reward type supplied: accepted heuristics are 'ternary', 'heuleu', 'unit' or 'heule_schur'";
  const CUTOFF =
    "invalid cutoff type supplied: accepted cutoffs are 'depth', 'freevars', 'psat', 'adaptive_freevars' and 'adaptive_psat'";
  const DELTA = "invalid value for delta fraction. It should be a number in the interval 0 to 1";
  const DRAT =
    "external DRAT output requires threads=1, local_search_threads=0, ddfw.threads=0, and drat.disable=false";
  const BRANCHING = "invalid branching heuristic: accepted heuristics are 'vsids' or 'chb'";
  const PB_SOLVER =
    "invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge";
  const PB_RESOLVE = "invalid PB resolve: 'cardinality' or 'rounding' expected";

  it.each([
    [[":sat.lookahead.reward foo"], REWARD],
    [[":sat.lookahead.cube.cutoff foo"], CUTOFF],
    [[":sat.lookahead.delta_fraction 2.0"], DELTA],
    [[":sat.lookahead.delta_fraction -0.5"], DELTA],
    [[":sat.drat.file foo.drat", ":sat.threads 2"], DRAT],
    [[":sat.drat.file foo.drat", ":sat.drat.disable true"], DRAT],
    [[":sat.drat.file foo.drat", ":sat.local_search_threads 1"], DRAT],
    [[":sat.drat.file foo.drat", ":sat.ddfw.threads 1"], DRAT],
    [[":sat.branching.heuristic foo"], BRANCHING],
    [[":sat.pb.solver foo"], PB_SOLVER],
    [[":sat.pb.solver 1"], PB_SOLVER],
    [[":sat.pb.resolve foo"], PB_RESOLVE],
    [[":sat.pb.lemma_format foo"], "invalid PB lemma format: 'cardinality' or 'pb' expected"],
  ])("gives up with Z3's reason when the options %j fail the check", (options, reason) => {
    expect(getChecked(options)).toBe(getUnknown(reason));
  });

  it.each([
    [
      [":sat.lookahead.reward foo", ":sat.phase foo"],
      "invalid phase selection strategy: always_false, always_true, basic_caching, caching, random",
    ],
    [[":sat.lookahead.cube.cutoff foo", ":sat.lookahead.reward foo"], REWARD],
    [[":sat.lookahead.delta_fraction 2.0", ":sat.lookahead.cube.cutoff foo"], CUTOFF],
    [[":sat.gc foo", ":sat.lookahead.delta_fraction 2.0"], DELTA],
    [[":sat.drat.file x", ":sat.threads 3", ":sat.gc foo"], "invalid gc strategy"],
    [[":sat.branching.heuristic foo", ":sat.drat.file x", ":sat.threads 3"], DRAT],
    [[":sat.pb.solver foo", ":sat.branching.heuristic foo"], BRANCHING],
    [[":sat.pb.resolve foo", ":sat.pb.solver foo"], PB_SOLVER],
    [[":sat.pb.lemma_format foo", ":sat.pb.resolve foo"], PB_RESOLVE],
  ])("reports the first failure in Z3's order among the options %j", (options, reason) => {
    expect(getChecked(options)).toBe(getUnknown(reason));
  });

  it("takes the valid values of the pseudo-Boolean options", () => {
    expect(
      getChecked([
        ":sat.pb.solver totalizer",
        ":sat.pb.resolve rounding",
        ":sat.pb.lemma_format pb",
      ]),
    ).toBe(["sat", '(:reason-unknown "")', "(:rlimit 30)"].join("\n"));
  });
});

describe("the manager, as Z3 5.3.2 makes it and its solver at their first use", () => {
  it.each([
    [
      "a declare-fun, at its range",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(declare-fun p () Bool)",
        "(declare-fun q () Bool)",
        "(assert (or p q))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ],
      [
        '(error "line 3 column 15: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        '(error "line 5 column 12: unknown constant p")',
        "unknown",
        '(:reason-unknown "state of the most recent check-sat command is not known")',
        "(:rlimit 0)",
      ],
    ],
    [
      "a define-fun, at its parameters",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(define-fun f () Bool true)",
        "(assert f)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ],
      [
        '(error "line 3 column 14: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        '(error "line 4 column 8: unknown constant f")',
        "unknown",
        '(:reason-unknown "state of the most recent check-sat command is not known")',
        "(:rlimit 0)",
      ],
    ],
    [
      "a declare-datatypes, after the arity of its first sort",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(declare-datatypes ((D 0)) (((c) (d))))",
        "(declare-const x D)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ],
      [
        '(error "line 3 column 24: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "(error \"line 4 column 17: Invalid constant declaration: unknown sort 'D'\")",
        "unknown",
        '(:reason-unknown "state of the most recent check-sat command is not known")',
        "(:rlimit 0)",
      ],
    ],
    [
      "a declare-datatypes with parameters, at its bodies",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(declare-datatypes (T) ((L (n) (c (h T)))))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 23: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a define-fun-rec, at its name",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(define-fun-rec f () Bool true)",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 16: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "get-info :rlimit, at the keyword after its opening",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ],
      [
        '(:rlimit (error "line 3 column 10: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
        '(:reason-unknown "state of the most recent check-sat command is not known")',
        "(:rlimit 0)",
      ],
    ],
    [
      "a let, at its first binding",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(assert (let ((x true)) x))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 14: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "an attribute, at its term",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(assert (! true :named a))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 11: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a qualified identifier, at its sort",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(assert (as true Bool))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 17: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a root-obj, at the token after it",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(assert (= (root-obj (+ x 1) 1) 1))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 9: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a match, at its term",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(assert (match true ((x x))))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 15: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a rule, at its term",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(rule (and true true))",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 7: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "check-sat, at its first argument",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(check-sat true)",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 11: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "check-sat-using, at its end",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(check-sat-using smt)",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 20: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "dbg-some-value, at its sort",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(dbg-some-value Bool)",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 16: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
    [
      "a push of no scope, not at all",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(push 0)",
        "(declare-const zz Bool)",
        "(check-sat)",
      ],
      [
        '(error "line 4 column 18: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
  ])("reports a bad sat parameter in the solver of %s", (_name, lines, expected) => {
    expect(run(lines)).toBe(expected.join("\n"));
  });

  it.each([
    [
      "the commands after a failure, with no solver",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(declare-const p Bool)",
        "(declare-const p Bool)",
        "(assert p)",
        "(set-option :smt.random_seed 3)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-model)",
        "(get-value (p))",
        "(get-assertions)",
        "(push)",
        "(pop)",
        "(check-sat-assuming (p))",
        "(get-info :rlimit)",
      ],
      [
        '(error "line 3 column 17: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
        '(:reason-unknown "state of the most recent check-sat command is not known")',
        '(error "line 9 column 10: model is not available")',
        '(error "line 10 column 14: model is not available")',
        '(error "line 11 column 15: command is only available in interactive mode, use command (set-option :interactive-mode true)")',
        "unknown",
        "(:rlimit 0)",
      ],
    ],
    [
      "a set-logic after the first solver, which it keeps",
      [
        "(declare-const p Bool)",
        "(set-option :sat.pb.solver bv)",
        "(set-logic QF_FD)",
        "(assert p)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ],
      [
        '(error "line 3 column 11: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
        '(:reason-unknown "invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "(:rlimit 6)",
      ],
    ],
    [
      "the declarations after a failure, with no logic check",
      [
        "(set-logic QF_FD)",
        "(set-option :sat.pb.solver bv)",
        "(declare-const p Bool)",
        "(declare-fun f (Bool) Bool)",
        "(assert (f true))",
        "(assert (forall ((x Bool)) x))",
        "(check-sat)",
      ],
      [
        '(error "line 3 column 17: invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge")',
        "unknown",
      ],
    ],
  ])("answers %s as Z3 does", (_name, lines, expected) => {
    expect(run(lines)).toBe(expected.join("\n"));
  });

  it.each([
    [
      "push 0",
      [
        "(push 0)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      ["true"],
    ],
    [
      "get-model",
      [
        "(get-model)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      ['(error "line 1 column 11: model is not available")', "true"],
    ],
    [
      "reset-assertions",
      [
        "(reset-assertions)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      ["true"],
    ],
    [
      "get-unsat-core",
      [
        "(get-unsat-core)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      [
        '(error "line 1 column 16: unsat core construction is not enabled, use command (set-option :produce-unsat-cores true)")',
        "true",
      ],
    ],
    [
      "a declare-fun without a name",
      [
        "(declare-fun 5 () Bool)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      ['(error "line 1 column 14: invalid function declaration, symbol expected")', "true"],
    ],
    [
      "an assert without a term",
      [
        "(assert)",
        "(set-option :global-decls true)",
        "(set-option :produce-assertions true)",
        "(get-option :global-decls)",
      ],
      ["(error \"line 1 column 8: invalid expression, unexpected ')'\")", "true"],
    ],
  ])(
    "makes no manager in %s, so an option of the manager may still change",
    (_name, lines, expected) => {
      expect(run(lines)).toBe(expected.join("\n"));
    },
  );
});

describe("the sat solver, as Z3 5.3.2 updates its parameters at each set-option", () => {
  const getChecked = (prefix: string[], commands: string[]) =>
    run([...prefix, ...getScript("(check-sat)").slice(0, -1), ...commands]);
  const QF_FD = ["(set-logic QF_FD)"];
  const SAT_TACTIC = ["(set-option :tactic.default_tactic sat)"];
  const PB_SOLVER =
    "invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge";

  it.each([
    [QF_FD, [], "(or x1 x2 x3)", "sat", 5389],
    [QF_FD, ["(set-option :smt.random_seed 7)"], "(or x1 x2 x3)", "sat", 5387],
    [QF_FD, ["(set-option :sat.restart luby)"], "(or x1 x2 x3)", "sat", 5387],
    [QF_FD, ["(set-option :sat.phase always_true)"], "(or x1 x2 x3)", "sat", 5451],
    [
      QF_FD,
      ["(set-option :sat.cardinality.solver false)"],
      "((_ at-most 2) x1 x2 x3 x4)",
      "unsat",
      5710,
    ],
    [SAT_TACTIC, [], "(or x1 x2 x3)", "sat", 5950],
    [SAT_TACTIC, ["(set-option :sat.random_seed 7)"], "(or x1 x2 x3)", "sat", 4677],
  ])(
    "after %j and a check-sat, sets %j, asserts %s and answers %s at Z3's rlimit %d",
    (prefix, options, assertion, verdict, rlimit) => {
      expect(
        getChecked(prefix, [
          ...options,
          `(assert ${assertion})`,
          "(check-sat)",
          "(get-info :rlimit)",
        ]),
      ).toBe(["sat", verdict, `(:rlimit ${rlimit})`].join("\n"));
    },
  );

  it("reports a bad option at its value, again at each later option, and keeps the solver", () => {
    expect(
      getChecked(QF_FD, [
        "(set-option :sat.pb.solver foo)",
        "(set-option :smt.random_seed 3)",
        "(assert (or x1 x2 x3))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        `(error "line 278 column 27: ${PB_SOLVER}")`,
        `(error "line 279 column 29: ${PB_SOLVER}")`,
        "sat",
        '(:reason-unknown "no reason given")',
        "(:rlimit 5389)",
      ].join("\n"),
    );
  });

  it("reports a bad option in the solver of the sat tactic", () => {
    expect(
      getChecked(SAT_TACTIC, [
        "(set-option :sat.pb.solver foo)",
        "(assert (or x1 x2 x3))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toBe(
      [
        "sat",
        `(error "line 278 column 27: ${PB_SOLVER}")`,
        "sat",
        '(:reason-unknown "no reason given")',
        "(:rlimit 5950)",
      ].join("\n"),
    );
  });

  // Deviation from Z3: its fd solver crashes on sat.euf set after the sat solver starts.
  it.each([[QF_FD], [SAT_TACTIC]])(
    "leaves sat.euf, set after the sat solver of %j starts, unported",
    (prefix) => {
      expect(() => getChecked(prefix, ["(set-option :sat.euf true)", "(check-sat)"])).toThrow(
        new SmtUnsupportedError("the option :sat.euf after the sat solver starts"),
      );
    },
  );
});
