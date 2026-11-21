import { describe, expect, it } from "vite-plus/test";
import { SmtUnsupportedError } from "../../src/errors";
import {
  AstManager,
  OP_GT,
  OP_IMPLIES,
  OP_LT,
  SORT_BOOL,
  SORT_INT,
} from "../../src/prover/smt/solver/ast";
import { MkSlice } from "../../src/prover/smt/solver/muz/dl-mk-slice";
import { mkForall } from "../../src/prover/smt/solver/muz/dl-rule";
import {
  applyDefaultTransformation,
  transformRules,
} from "../../src/prover/smt/solver/muz/dl-rule-transformer";
import { createDatalogContext } from "../../src/prover/smt/solver/muz/horn-tactic";
import { TACTIC_REWRITER_OPTIONS } from "../../src/prover/smt/solver/rewriter";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

// dl_query_cmd prints the exception of a query and then the unknown status.
const getFailedQuery = (message: string) => [`(error "query failed: ${message}")`, "unknown"];

const COUNTER_RELATIONS = [
  "(declare-rel reach (Int))",
  "(declare-rel bad ())",
  "(declare-var x Int)",
  "(rule (reach 0))",
  "(rule (=> (and (reach x) (< x 5)) (reach (+ x 1))))",
];

const COUNTER_CLAUSES = [
  "(set-logic HORN)",
  "(declare-fun inv (Int) Bool)",
  "(assert (forall ((x Int)) (=> (= x 0) (inv x))))",
  "(assert (forall ((x Int) (y Int)) (=> (and (inv x) (< x 5) (= y (+ x 1))) (inv y))))",
];

const UNINTERPRETED_RELATION = [
  "(declare-rel p (Int))",
  "(declare-rel q (Int))",
  "(declare-fun f (Int) Int)",
  "(declare-var x Int)",
];

// The expected values are the output of z3 5.3.2.
describe("datalog queries", () => {
  it("answers sat for a reachable relation", () => {
    expect(
      run([...COUNTER_RELATIONS, "(rule (=> (and (reach x) (= x 5)) bad))", "(query bad)"]),
    ).toEqual(["sat"]);
  });

  // spacer marks the datalog context BOUNDED when it reaches fp.spacer.max_level, and only
  // dl_query_cmd prints that status.
  it.each([
    ["spacer", []],
    ["gpdr", ["(set-option :fp.spacer.gpdr true)"]],
  ])("answers bounded when %s stops at the maximum level", (_name, options) => {
    expect(
      run([
        ...options,
        "(set-option :fp.spacer.max_level 2)",
        ...COUNTER_RELATIONS,
        "(rule (=> (and (reach x) (= x 5)) bad))",
        "(query bad)",
        "(query reach)",
      ]),
    ).toEqual(["bounded", "sat"]);
  });

  // dl_context copies the fp parameters when its first declare-rel, declare-var, rule or query
  // makes the datalog context, so a later bound on the levels doesn't stop spacer.
  it.each([
    ["relation", COUNTER_RELATIONS[0]],
    ["variable", COUNTER_RELATIONS[2]],
  ])("ignores fp parameters set after the first declared %s", (_name, declaration) => {
    expect(
      run([
        declaration,
        "(set-option :fp.spacer.max_level 2)",
        ...COUNTER_RELATIONS.filter((line) => line !== declaration),
        "(rule (=> (and (reach x) (= x 5)) bad))",
        "(query bad)",
      ]),
    ).toEqual(["sat"]);
  });

  it("answers unsat for an unreachable relation", () => {
    expect(
      run([...COUNTER_RELATIONS, "(rule (=> (and (reach x) (> x 5)) bad))", "(query bad)"]),
    ).toEqual(["unsat"]);
  });

  it("answers each query over named rules with two predicates", () => {
    expect(
      run([
        "(declare-rel p (Int Int))",
        "(declare-rel q (Int))",
        "(declare-rel err ())",
        "(declare-var x Int)",
        "(declare-var y Int)",
        "(declare-var z Int)",
        "(rule (=> (>= x 0) (p x 0)) init)",
        "(rule (=> (and (p x y) (< y x)) (p x (+ y 1))) step)",
        "(rule (=> (and (p x y) (>= y x)) (q (- y x))) exit)",
        "(rule (=> (and (q z) (not (= z 0))) err) bad)",
        "(query err)",
        "(query q)",
      ]),
    ).toEqual(["unsat", "sat"]);
  });

  it("takes a divisor that rewrites to a nonzero numeral as interpreted", () => {
    expect(
      run([
        "(declare-rel p (Int))",
        "(declare-rel bad ())",
        "(declare-var x Int)",
        "(rule (p 0))",
        "(rule (=> (and (p x) (< x 9)) (p (+ x 3))))",
        "(rule (=> (and (p x) (= (div x (+ 1 2)) 2)) bad))",
        "(query bad)",
      ]),
    ).toEqual(["sat"]);
  });
});

describe("horn tactic", () => {
  it("answers sat for clauses with an invariant", () => {
    expect(
      run([
        ...COUNTER_CLAUSES,
        "(assert (forall ((x Int)) (=> (and (inv x) (> x 5)) false)))",
        "(check-sat-using horn)",
        "(check-sat)",
      ]),
    ).toEqual(["sat", "sat"]);
  });

  it("answers unsat for clauses that derive false", () => {
    expect(
      run([
        ...COUNTER_CLAUSES,
        "(assert (forall ((x Int)) (=> (and (inv x) (= x 5)) false)))",
        "(check-sat-using horn)",
        "(check-sat)",
      ]),
    ).toEqual(["unsat", "unsat"]);
  });

  it("answers z3test's regression 3825 with bit blasting", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(set-option :fp.engine bmc)",
        "(set-option :fp.xform.bit_blast true)",
        "(assert (forall ((q4 (_ BitVec 12)) (q5 (_ BitVec 12)) (q6 (_ BitVec 12)) (q7 (_ BitVec 9))) (= q5 (_ bv0 12))))",
        "(check-sat)",
        "(reset)",
        "(set-logic HORN)",
        "(set-option :fp.engine spacer)",
        "(set-option :fp.xform.bit_blast true)",
        "(assert (forall ((q3 (_ BitVec 1)) (q4 (_ BitVec 1)) (q5 (_ BitVec 10))) (distinct q3 (_ bv0 1))))",
        "(check-sat)",
        "(reset)",
        "(set-option :fp.xform.bit_blast true)",
        "(assert (forall ((a (_ BitVec 10))) (= (bvmul a a) a)))",
        "(check-sat-using horn)",
      ]),
    ).toEqual(["unsat", "unsat", "unsat"]);
  });

  it("answers a nonlinear system", () => {
    expect(
      run([
        "(declare-fun p (Int Int) Bool)",
        "(declare-fun q (Int) Bool)",
        "(assert (forall ((x Int)) (=> (>= x 0) (p x 0))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x y) (< y x)) (p x (+ y 1)))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x y) (>= y x)) (q (- y x)))))",
        "(assert (forall ((z Int)) (=> (and (q z) (not (= z 0))) false)))",
        "(check-sat-using horn)",
      ]),
    ).toEqual(["sat"]);
  });

  it("reads smt.relevancy in the solvers spacer makes", () => {
    const getSteps = (options: string[]) => {
      const output = run([
        ...options,
        "(set-logic HORN)",
        "(declare-fun p (Int Int) Bool)",
        "(assert (forall ((x Int) (y Int)) (=> (and (or (= x 1) (= x 2)) (= y (+ x 1))) (p x y))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x y) (or (< y x) (> y 3))) false)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]);
      expect(output[0]).toBe("sat");
      return Number(output[1].slice("(:rlimit ".length, -1));
    };
    // Deviation from Z3: the port's spacer takes fewer steps, so this checks the step relevancy adds.
    expect(getSteps(["(set-option :smt.relevancy 0)"]) - getSteps([])).toBe(938 - 937);
  });

  it("prints the formula that is not a Horn clause", () => {
    expect(
      run([
        "(declare-fun p (Int) Bool)",
        "(declare-fun q (Int) Bool)",
        "(assert (forall ((x Int)) (or (p x) (q x))))",
        "(apply horn)",
      ]),
    ).toEqual([
      '(error "tactic failed: formula is not in Horn fragment: (forall ((x Int)) (or (p x) (q x)))\n")',
    ]);
  });
});

describe("rule errors", () => {
  it("displays the rule with a negated predicate", () => {
    expect(
      run([
        ...UNINTERPRETED_RELATION,
        "(rule (=> (> x 0) (p x)))",
        "(rule (=> (and (not (p x)) (< x 5)) (q x)) myrule)",
        "(query q)",
      ]),
    ).toEqual(
      getFailedQuery(
        "Rule contains negative predicate myrule:\nq(#0) :- \n not p(#0),\n (< (:var 0) 5).\n",
      ),
    );
  });

  it("numbers the declared variables as Z3 binds them", () => {
    expect(
      run([
        "(declare-rel p (Int Bool))",
        "(declare-fun f (Int) Int)",
        "(declare-var x Int)",
        "(declare-var b Bool)",
        "(rule (=> (and (> (f x) 0) (= (+ x 1) 3) b) (p (+ x 2) (not b))))",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "Uninterpreted 'f' in <null>:\np(#2,#3) :- \n (= (:var 3) (not (:var 0))),\n (= (:var 2) (+ (:var 1) 2)),\n (= (+ (:var 1) 1) 3),\n (> (f (:var 1)) 0),\n (= (:var 0) true).\n",
      ),
    );
  });

  it("reports the first uninterpreted function of Z3's table with its last rule", () => {
    expect(
      run([
        "(declare-rel p (Int))",
        "(declare-fun foo (Int) Int)",
        "(declare-fun bar (Int) Int)",
        "(declare-fun baz (Int) Int)",
        "(declare-var x Int)",
        "(rule (=> (> (foo x) 0) (p x)) r1)",
        "(rule (=> (> (bar x) 1) (p x)) r2)",
        "(rule (=> (> (baz x) 2) (p x)) r3)",
        "(rule (=> (> (foo (+ x 1)) 3) (p x)) r4)",
        "(rule (=> (> (bar (+ x 2)) (baz 3)) (p x)) r5)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery("Uninterpreted 'foo' in r4:\np(#0) :- \n (> (foo (+ (:var 0) 1)) 3).\n"),
    );
  });

  it("names a rule || with the empty symbol rather than the null one", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-rel p (Int))",
        "(declare-var x Int)",
        "(rule (=> (= x (f 1)) (p x)) ||)",
        "(query p)",
      ]),
    ).toEqual(getFailedQuery("Uninterpreted 'f' in :\np(#0) :- \n (= (:var 0) (f 1)).\n"));
  });

  it("visits the patterns of a quantifier", () => {
    expect(
      run([
        ...UNINTERPRETED_RELATION,
        "(rule (=> (forall ((y Int)) (! (> (+ y x) y) :pattern ((f y)))) (p x)) r1)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "Uninterpreted 'f' in r1:\np(#0) :- \n (= (forall ((y Int)) (! (> (+ y (:var 1)) y) :pattern ((f y)))) true).\n",
      ),
    );
  });

  it("takes a divisor that rewrites to zero as uninterpreted", () => {
    expect(
      run([
        "(declare-rel p (Int))",
        "(declare-var x Int)",
        "(rule (=> (> (div x (+ 1 2)) 0) (p x)) r1)",
        "(rule (=> (and (p x) (> (mod x (- 3 3)) 0)) (p (+ x 1))) r2)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "Uninterpreted 'mod' in r2:\np(#1) :- \n p(#0),\n (= (:var 1) (+ (:var 0) 1)),\n (> (mod (:var 0) (- 3 3)) 0).\n",
      ),
    );
  });

  it("displays the rule with an existential quantifier", () => {
    expect(
      run([
        "(declare-rel p (Int))",
        "(declare-var x Int)",
        "(rule (=> (forall ((z Int)) (exists ((y Int)) (> (+ y z) x))) (p x)) r1)",
        "(rule (=> (and (p x) (exists ((y Int)) (forall ((z Int)) (> (* y z x) x)))) (p (+ 1 x))) r2)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "cannot process EXISTS quantifier in rule r2:\np(#1) :- \n p(#0),\n (= (:var 1) (+ 1 (:var 0))),\n (let ((a!1 (exists ((y Int)) (forall ((z Int)) (> (* y z (:var 2)) (:var 2))))))\n  (= a!1 true)).\n",
      ),
    );
  });

  it("rejects a quantifier in a query that the datalog engine answers", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(assert (exists ((x (_ BitVec 4))) (= (bvadd x #x1) #x0)))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "cannot process quantifier in rule <null>:\nquery!0() :- \n (let ((a!1 (= (exists ((x (_ BitVec 4))) (= (bvadd x #x1) #x0)) true)))\n  (not a!1)).\n")',
    ]);
  });

  it("prints the term a recursive predicate is nested in", () => {
    expect(
      run([
        "(declare-rel p (Int))",
        "(declare-rel q (Int))",
        "(declare-var x Int)",
        "(rule (=> (> x 0) (p x)) r1)",
        "(rule (=> (and (q x) (= (p x) (> x 3))) (p (+ x 1))) r2)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "recursive predicate (= (p (:var 0)) (> (:var 0) 3)) occurs nested in the body of a rule",
      ),
    );
  });

  it("names the fresh predicate of a disjunction with an empty suffix", () => {
    expect(
      run([
        ...UNINTERPRETED_RELATION,
        "(rule (=> (and (q x) (or (p x) (> (f x) 0))) (p x)) r1)",
        "(query p)",
      ]),
    ).toEqual(getFailedQuery("Uninterpreted 'f' in r1:\nr1!!0(#0) :- \n (> (f (:var 0)) 0).\n"));
  });

  it("finds a predicate in the pattern of a quantifier", () => {
    expect(
      run([
        ...UNINTERPRETED_RELATION,
        "(rule (=> (and (q x) (forall ((y Int)) (! (> (f y) x) :pattern ((p y))))) (p x)) r1)",
        "(query p)",
      ]),
    ).toEqual(
      getFailedQuery(
        "recursive predicate (r1!!0 (:var 0) (:var 1)) occurs nested in the body of a rule",
      ),
    );
  });
});

describe("rule transformations", () => {
  const UNBOUND_SQUARE = [
    "(set-option :fp.xform.fix_unbound_vars true)",
    "(declare-rel p (Int Int))",
    "(declare-rel v (Int Int))",
    "(declare-rel u (Int))",
    "(declare-rel q (Int))",
    "(declare-rel s (Int))",
    "(declare-rel w (Int))",
    "(declare-rel t (Int))",
    "(declare-rel bad ())",
    "(declare-var x Int)",
    "(declare-var y Int)",
    "(declare-var z Int)",
    "(rule (=> (and (>= z 0) (= (* y y) z)) (p y z)))",
  ];

  it("substitutes under the quantifier of a resolvent", () => {
    expect(
      run([
        ...UNBOUND_SQUARE,
        "(rule (=> (> x 3) (v 1 x)))",
        "(rule (=> (< x 0) (v 2 x)))",
        "(rule (=> (and (p y z) (v 1 x) (> x z)) (w x)))",
        "(rule (=> (and (w x) (< x 3)) (w (+ x 1))))",
        "(rule (=> (and (v y x) (> x 7) (> y 5)) (t x)))",
        "(rule (=> (and (t x) (< x 9)) (t (+ x 1))))",
        "(rule (=> (and (w x) (t y) (= x 2)) bad))",
        "(query bad)",
      ]),
    ).toEqual(
      getFailedQuery(
        "cannot process EXISTS quantifier in rule <null>;<null>;<null>:\nw(#0) :- \n (not (<= (:var 0) 3)),\n (let ((a!1 (exists ((x!1 Int)) (not (<= (:var 1) (* x!1 x!1))))))\n  (= a!1 true)).\n",
      ),
    );
  });

  // Z3 answers unsat: it keeps the resolvent that has a quantifier without inlining u into it and
  // drops the rule of u. The query is reachable through p(0, 0), u(1), w(1), w(2).
  it("inlines the rest of the tail of a resolvent that has a quantifier", () => {
    expect(
      run([
        ...UNBOUND_SQUARE,
        "(rule (=> (< x 5) (u x)))",
        "(rule (=> (and (p y z) (u x) (> x z)) (w x)))",
        "(rule (=> (and (w x) (< x 3)) (w (+ x 1))))",
        "(rule (=> (and (w x) (= x 2)) bad))",
        "(query bad)",
      ]),
    ).toEqual(
      getFailedQuery(
        "cannot process EXISTS quantifier in rule <null>;<null>;<null>:\nw(#0) :- \n (not (<= 5 (:var 0))),\n (let ((a!1 (exists ((x!1 Int)) (not (<= (:var 1) (* x!1 x!1))))))\n  (= a!1 true)).\n",
      ),
    );
  });

  // Z3 aborts on the has_new_quantifier that plan_inlining throws.
  it("rejects inlining a rule that has a quantifier into an inlined rule", () => {
    expect(() =>
      run([
        ...UNBOUND_SQUARE,
        "(rule (=> (and (p y z) (> x z)) (q x)))",
        "(rule (=> (and (q x) (< x 5)) (s x)))",
        "(rule (=> (s x) bad))",
        "(query bad)",
      ]),
    ).toThrow(new SmtUnsupportedError("inlining a rule with a quantifier"));
  });

  // Z3 answers unknown: the inflation bound wraps to zero, so one if-then-else stays in the rule
  // and Z3 hands it to a tactic that is not ported.
  it("wraps the inflation bound of the if-then-else blaster", () => {
    expect(() =>
      run([
        "(set-option :fp.xform.elim_term_ite true)",
        "(set-option :fp.xform.elim_term_ite.inflation 2147483648)",
        "(declare-fun p (Int Int) Bool)",
        "(assert (forall ((x Int) (y Int)) (=> (and (= x 0) (= y 0)) (p x y))))",
        "(assert (forall ((x Int) (y Int) (x1 Int) (y1 Int) (c Bool) (d Bool)) (=> (and (p x y) (= x1 (+ x (ite c 1 2))) (= y1 (+ y (ite d 3 4))) (> x1 y)) (p x1 y1))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x y) (< y x)) false)))",
        "(check-sat-using horn)",
      ]),
    ).toThrow(new SmtUnsupportedError("eliminating the term if-then-else of a Horn rule"));
  });

  // The rules z3 -v:2 prints for the same rules and (query bad).
  it("slices the argument an equation under a negation solves", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const context = createDatalogContext(
      manager,
      new Map([
        ["fp.xform.inline_eager", "false"],
        ["fp.xform.inline_linear", "false"],
      ]),
      TACTIC_REWRITER_OPTIONS,
    );
    const mkVar = (index: number) => manager.mkVar(index, SORT_INT);
    const zero = manager.mkNumeral(0n);
    const pDecl = manager.mkFuncDecl("p", [SORT_INT, SORT_INT], SORT_BOOL);
    const qDecl = manager.mkFuncDecl("q", [SORT_INT, SORT_INT], SORT_BOOL);
    const bad = manager.mkApp(manager.mkFuncDecl("bad", [], SORT_BOOL), [], SORT_BOOL);
    for (const decl of [pDecl, qDecl, manager.decls[bad]]) context.registerPredicate(decl);
    const mkRule = (names: string[], body: number, head: number) =>
      context.addRule(
        mkForall(
          manager,
          names.map(() => SORT_INT),
          names,
          manager.mkApp(OP_IMPLIES, [body, head], SORT_BOOL),
        ),
      );
    mkRule(
      ["x", "z"],
      manager.mkApp(OP_GT, [mkVar(1), zero], SORT_BOOL),
      manager.mkApp(qDecl, [mkVar(1), mkVar(0)], SORT_BOOL),
    );
    mkRule(
      ["x", "y", "z"],
      manager.mkAnd([
        manager.mkApp(qDecl, [mkVar(2), mkVar(0)], SORT_BOOL),
        manager.mkNot(manager.mkEq(mkVar(1), mkVar(0))),
      ]),
      manager.mkApp(pDecl, [mkVar(2), mkVar(1)], SORT_BOOL),
    );
    mkRule(
      ["x", "y"],
      manager.mkAnd([
        manager.mkApp(pDecl, [mkVar(1), mkVar(0)], SORT_BOOL),
        manager.mkApp(OP_LT, [mkVar(1), zero], SORT_BOOL),
      ]),
      bad,
    );
    context.ruleManager.mkQuery(bad, context.getRules());
    applyDefaultTransformation(context);
    transformRules(context, [new MkSlice(context)]);
    expect(
      context
        .getRules()
        .rules.map((rule) => rule.display(context))
        .sort(),
    ).toEqual([
      "<null>:\nbad() :- \n p!slice!1(#0),\n (not (<= 0 (:var 0))).\n",
      "<null>:\np!slice!1(#0) :- \n q!slice!2(#0),\n true.\n",
      "<null>:\nq!slice!2(#0) :- \n (not (<= (:var 0) 0)).\n",
      "<null>:\nquery!0() :- \n bad().\n",
    ]);
  });
});

describe("gpdr", () => {
  // Z3 answers sat with fp.spacer.gpdr and unsat without it. False is derivable: the first rule
  // gives a(false, false, 0), the second a(false, true, g) for any g, and the third false.
  it("closes the parents of a reachable node", () => {
    expect(
      run([
        "(set-option :fp.spacer.gpdr true)",
        "(declare-fun a (Bool Bool Int) Bool)",
        "(assert (forall ((bc Bool) (bd Bool) (bk Int)) (=> (= bc bd false) (= bk 0) (a bc bd bk))))",
        "(assert (forall ((bc Bool) (bd Bool) (bk Int) (g Int) (f Bool) (gd Bool)) (=> (a bc bd bk) (or (= f bc) (= bk 2)) (a f gd g))))",
        "(assert (forall ((bc Bool) (bd Bool) (bk Int)) (=> (a bc bd bk) (or bc bd) false)))",
        "(check-sat-using horn)",
      ]),
    ).toEqual(["unsat"]);
  });

  it("answers the counter clauses as Z3 does", () => {
    expect(
      run([
        "(set-option :fp.spacer.gpdr true)",
        ...COUNTER_CLAUSES,
        "(assert (forall ((x Int)) (=> (and (inv x) (> x 5)) false)))",
        "(check-sat-using horn)",
      ]),
    ).toEqual(["sat"]);
  });
});
