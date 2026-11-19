import { describe, expect, it } from "vite-plus/test";
import { SmtCanceledError } from "../../src/errors";
import { AstManager, SORT_BOOL } from "../../src/prover/smt/solver/ast";
import { L_UNDEF } from "../../src/prover/smt/solver/lbool";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { IncSatSolver } from "../../src/prover/smt/solver/sat/inc-sat-solver";
import { Solver } from "../../src/prover/smt/solver/sat/solver";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

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

describe("sat simplifier", () => {
  it.each(["luby", "geometric", "static"])(
    "finds Z3's model when a %s restart ends the burst search and the simplifier runs",
    (restart) => {
      expect(run(getScript(`(check-sat-using (using-params sat :restart ${restart}))`))).toBe(
        [
          "sat",
          "(",
          ...RESTART_MODEL.split(" ").flatMap((entry) => [
            `  (define-fun ${entry.replace("-", "")} () Bool`,
            `    ${!entry.startsWith("-")})`,
          ]),
          ")",
        ].join("\n"),
      );
    },
  );
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
    const solver = new IncSatSolver(manager, new Map());
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
});
