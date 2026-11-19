import { describe, expect, it } from "vite-plus/test";
import { AstManager, OP_BADD, OP_BSUB, SORT_INT } from "../../src/prover/smt/solver/ast";
import { mkBvApp } from "../../src/prover/smt/solver/bv-decl-plugin";
import { Egraph } from "../../src/prover/smt/solver/euf/egraph";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

const mkSwappedPair = (op: number) => {
  const manager = new AstManager(new ResourceLimit(Infinity));
  const egraph = new Egraph(manager);
  const sort = manager.mkBvSort(8);
  const consts = [0, 1, 2, 3].map(() => manager.mkFreshConst(null, sort));
  const nodes = consts.map((expr) => egraph.mk(expr, 0, []));
  const first = egraph.mk(mkBvApp(manager, op, [consts[0], consts[1]]), 0, [nodes[0], nodes[1]]);
  const second = egraph.mk(mkBvApp(manager, op, [consts[2], consts[3]]), 0, [nodes[2], nodes[3]]);
  egraph.merge(nodes[0], nodes[3], 7);
  egraph.merge(nodes[1], nodes[2], 9);
  egraph.propagate();
  return { egraph, first, second };
};

describe("the e-graph of sat.euf", () => {
  it("merges two applications of a commutative declaration whose arguments are swapped", () => {
    const pair = mkSwappedPair(OP_BADD);
    expect(pair.first.root).toBe(pair.second.root);
    const reasons: number[] = [];
    pair.egraph.beginExplain();
    pair.egraph.explainEq(reasons, pair.first, pair.second);
    pair.egraph.endExplain();
    expect(reasons.toSorted()).toEqual([7, 9]);
  });

  it("gives a node back its own theory variable when a replacement is undone, unlike Z3", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const egraph = new Egraph(manager);
    const [nodeX, nodeY, nodeZ] = [0, 1, 2].map(() =>
      egraph.mk(manager.mkFreshConst(null, SORT_INT), 0, []),
    );
    const theory = 1;
    egraph.addThVar(nodeX, 0, theory);
    egraph.addThVar(nodeY, 1, theory);
    egraph.addThVar(nodeZ, 3, theory);
    egraph.pushScope();
    egraph.merge(nodeX, nodeY, 0);
    egraph.propagate();
    expect(nodeX.root).toBe(nodeY);
    egraph.pushScope();
    egraph.addThVar(nodeX, 2, theory);
    egraph.popScopes(2);
    expect(nodeX.getThVar(theory)).toBe(0);
    egraph.merge(nodeX, nodeZ, 0);
    egraph.propagate();
    const equalities: number[][] = [];
    for (; egraph.hasThEq(); egraph.nextThEq()) {
      const equality = egraph.getThEq();
      equalities.push([equality.v1, equality.v2]);
    }
    expect(equalities).toEqual([[3, 0]]);
  });

  it("finds Z3's model when a congruence needs commutativity", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(declare-fun f ((_ BitVec 8)) Int)",
        "(declare-const a (_ BitVec 8))",
        "(declare-const b (_ BitVec 8))",
        "(declare-const c (_ BitVec 8))",
        "(declare-const d (_ BitVec 8))",
        "(declare-const p Bool)",
        "(assert (or p (and (= a d) (= b c))))",
        "(assert (or (not p) (and (= a d) (= b c) (bvult a b))))",
        "(assert (or (= (f (bvadd a b)) 1) (= (f (bvadd c d)) 2)))",
        "(assert (or (not (= (f (bvadd a b)) (f (bvadd c d)))) (= (f (bvmul a b)) (+ 1 (f (bvmul c d)))) (bvugt a #x10)))",
        "(assert (not (= a b)))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun d () (_ BitVec 8)",
        "    #x30)",
        "  (define-fun c () (_ BitVec 8)",
        "    #x3c)",
        "  (define-fun a () (_ BitVec 8)",
        "    #x30)",
        "  (define-fun p () Bool",
        "    true)",
        "  (define-fun b () (_ BitVec 8)",
        "    #x3c)",
        "  (define-fun f ((x!1 (_ BitVec 8))) Int",
        "    (ite (= x!1 #x6c) 2",
        "    (ite (= x!1 #x40) 8855",
        "      #unspecified)))",
        ")",
      ].join("\n"),
    );
  });

  it("keeps two applications of a declaration that is not commutative apart", () => {
    const pair = mkSwappedPair(OP_BSUB);
    expect(pair.first.root).not.toBe(pair.second.root);
  });
});

describe("the setup of the smt kernel", () => {
  it("drops relevancy for bit-vectors without quantifiers when no logic fits", () => {
    expect(
      run([
        "(declare-fun g ((_ BitVec 8) Int) Int)",
        "(declare-const b (_ BitVec 8))",
        "(declare-const c (_ BitVec 8))",
        "(declare-const n Int)",
        "(declare-const m Int)",
        "(assert (or (= (g b n) 3) (= (g c m) 4) (bvule b c)))",
        "(assert (or (not (= (g b n) 3)) (< n m) (= (bvor b c) #xf0)))",
        "(assert (or (= n (+ m 1)) (= (g (bvadd b #x01) m) (g c n))))",
        "(assert (not (= b c)))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun c () (_ BitVec 8)",
        "    #x00)",
        "  (define-fun n () Int",
        "    0)",
        "  (define-fun m () Int",
        "    (- 1))",
        "  (define-fun b () (_ BitVec 8)",
        "    #xfd)",
        "  (define-fun g ((x!0 (_ BitVec 8)) (x!1 Int)) Int",
        "    (ite (and (= x!0 #x00) (= x!1 (- 1))) 4",
        "    (ite (and (= x!0 #xfe) (= x!1 (- 1))) 7",
        "    (ite (and (= x!0 #x00) (= x!1 0)) 8",
        "      2))))",
        ")",
      ].join("\n"),
    );
  });

  it("turns off bound propagation for QF_LIA clauses of at most two literals with large coefficients", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x0 Int)",
        "(declare-const x1 Int)",
        "(declare-const x2 Int)",
        "(declare-const x3 Int)",
        "(declare-const x4 Int)",
        "(assert (> (+ (* -85063 x4) (* -20559 x0) (* -48732 x1)) -70725))",
        "(assert (>= (* -1719 x4) 13988))",
        "(assert (>= (+ (* -80993 x1) (* 16607 x0)) -199070))",
        "(assert (or (>= (* -21740 x1) -48321) (<= (+ (* -25806 x1) (* 39163 x4)) -10633)))",
        "(assert (< (* -43497 x2) 116203))",
        "(assert (or (> (+ (* 40117 x2) (* 41392 x0) (* -63075 x1)) 169449) (< (* 2998 x0) 11966)))",
        "(assert (>= (+ (* -59353 x2) (* -23714 x3)) -137599))",
        "(assert (or (< (+ (* 60667 x2) (* -77302 x4)) -44883) (< (* -27327 x3) 68896)))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x4 () Int",
        "    (- 9))",
        "  (define-fun x1 () Int",
        "    3)",
        "  (define-fun x2 () Int",
        "    3)",
        "  (define-fun x0 () Int",
        "    6)",
        "  (define-fun x3 () Int",
        "    (- 2))",
        ")",
      ].join("\n"),
    );
  });

  it("counts a step for each bound that the LP solver implies", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (and (<= (+ (* 2 x) y) 3) (>= x 1) (or (>= y 2) (>= z 5)) (or (<= y 0) (<= z 1))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 430)"]);
  });

  it("counts a step again once the random update of a shared variable finds its freedom interval", () => {
    expect(
      run([
        "(set-logic QF_UFLIA)",
        "(declare-const x0 Int)",
        "(declare-const x1 Int)",
        "(declare-fun f (Int) Int)",
        "(assert (<= -1 x0))",
        "(assert (= (f (+ x1 1)) x0))",
        "(assert (not (= (f x1) (f x0))))",
        "(assert (<= (+ x0 x1) 1))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 325)"]);
  });

  it("keeps nnf_cnf and propagates equalities in lp again when a set-option rereads the parameters", () => {
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (and (<= (+ (* 2 x) y) 7) (>= x 1) (or (>= y 2) (>= z 5)) (or (<= y 0) (<= z 1)) (< (+ x z) 4)))",
        "(push 1)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(set-option :pp.max_depth 10)",
        "(assert (> y -5))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 209)", "sat", "(:rlimit 261)"]);
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x0 Int)",
        "(declare-const x1 Int)",
        "(declare-const x2 Int)",
        "(assert (< (* -1 x2) 13))",
        "(assert (<= x0 13))",
        "(assert (>= (+ (* -9 x1) (* -9 x0)) 14))",
        "(assert (or (> (+ (* 6 x1) (* 7 x0)) -5) (= (* 4 x0) -1)))",
        "(assert (or (>= (+ (* -7 x2) (* -1 x1)) -6) (> (+ (* -8 x0) x1) 6)))",
        "(assert (or (> x0 12) (<= (* -3 x1) -1)))",
        "(assert (>= (* -2 x1) -4))",
        "(assert (< (* 6 x2) 19))",
        "(push 1)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(set-option :pp.max_depth 10)",
        "(assert (or (> (+ (* -5 x2) (* 3 x0)) -17) (>= (* -5 x2) 6)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 432)", "sat", "(:rlimit 561)"]);
  });
});

describe("a distinct of more than two arguments", () => {
  const declareConsts = (sort: string, names: string[]) =>
    names.map((name) => `(declare-const ${name} ${sort})`);

  it("stays a distinct when the kernel asserts it", () => {
    expect(
      run([
        "(declare-sort U 0)",
        ...declareConsts("U", ["a0", "a1", "a2", "a3", "a4"]),
        "(assert (not (distinct a2 a3 a0 a4)))",
        "(get-info :rlimit)",
        "(assert (distinct a1 a2 a3))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 6)", "(:rlimit 9)"]);
  });

  it("stays a distinct when a tactic other than simplify rewrites it", () => {
    expect(
      run([
        ...declareConsts("Int", ["a", "b", "c"]),
        "(declare-const p Bool)",
        "(assert p)",
        "(assert (or (distinct a b c) (not p)))",
        "(apply propagate-values)",
      ]),
    ).toEqual([
      ["(goals", "(goal", "  p", "  (distinct a b c)", "  :precision precise :depth 1)", ")"].join(
        "\n",
      ),
    ]);
  });

  it("stays a distinct when qe-light rewrites it", () => {
    expect(
      run([
        ...declareConsts("Int", ["a", "b", "c"]),
        "(assert (exists ((x Int)) (and (= x a) (distinct x b c))))",
        "(apply qe-light)",
      ]),
    ).toEqual([
      ["(goals", "(goal", "  (distinct a b c)", "  :precision precise :depth 1)", ")"].join("\n"),
    ]);
  });

  it("is blasted by propagate-values under its parameter blast_distinct", () => {
    expect(
      run([
        ...declareConsts("Int", ["a", "b", "c"]),
        "(declare-const p Bool)",
        "(assert p)",
        "(assert (or (distinct a b c) (not p)))",
        "(apply (using-params propagate-values :blast_distinct true))",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  p",
        "  (not (= a b))",
        "  (not (= a c))",
        "  (not (= b c))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("is defined in the kernel by its disequalities, as internalize_distinct does", () => {
    const check = (lines: string[]) => run([...lines, "(check-sat)", "(get-info :rlimit)"]);
    const names = Array.from({ length: 32 }, (_value, index) => `a${index}`);
    expect(
      check([
        "(declare-sort U 0)",
        ...declareConsts("U", ["a", "b", "c"]),
        "(assert (distinct a b c))",
      ]),
    ).toEqual(["sat", "(:rlimit 77)"]);
    expect(
      check([
        "(declare-sort U 0)",
        ...declareConsts("U", ["a", "b", "c", "d"]),
        "(assert (distinct a b c d))",
      ]),
    ).toEqual(["sat", "(:rlimit 85)"]);
    expect(check(["(declare-fun f (Int) Int)", "(assert (distinct (f 1) (f 2) (f 3)))"])).toEqual([
      "sat",
      "(:rlimit 122)",
    ]);
    expect(
      check([
        "(declare-sort U 0)",
        ...declareConsts("U", ["a", "b", "c"]),
        "(declare-fun f (U) Int)",
        "(assert (distinct (f a) (f b) (f c)))",
      ]),
    ).toEqual(["sat", "(:rlimit 161)"]);
    expect(
      check([
        "(declare-sort U 0)",
        ...declareConsts("U", names),
        `(assert (distinct ${names.join(" ")}))`,
      ]),
    ).toEqual(["sat", "(:rlimit 1121)"]);
  });
});

describe("regular expressions", () => {
  it("collapses a character class given by re.of.pred as Z3 does", () => {
    const below = "(re.of.pred (lambda ((c Unicode)) (char.<= c (_ Char 98))))";
    expect(
      run([
        `(simplify (re.union ${below} (re.range "a" "z")))`,
        `(simplify (re.inter ${below} (re.range "a" "z")))`,
        '(simplify (re.diff (re.range "a" "z") (re.of.pred (lambda ((c Unicode)) (= c (_ Char 98))))))',
        '(simplify (re.inter (re.of.pred (lambda ((c Unicode)) (not (= c (_ Char 98))))) (re.range "a" "c")))',
      ]),
    ).toEqual([
      '(re.range "\\u{0}" "z")',
      '(re.range "a" "b")',
      '(re.union (str.to_re "a") (re.range "c" "z"))',
      '(re.union (str.to_re "a") (str.to_re "c"))',
    ]);
  });

  it("rejects an argument to the empty and the full character regular expression", () => {
    expect(
      run([
        "(simplify ((as re.none (RegEx String)) 1))",
        "(simplify ((as re.empty (RegEx String)) 1))",
        "(simplify ((as re.allchar (RegEx String)) 1))",
        "(simplify (re.none 1))",
        "(simplify (re.allchar 1))",
        "(simplify (re.empty 1))",
        "(simplify ((as re.empty (RegEx (Seq Int))) 1))",
        "(simplify ((as re.allchar (RegEx (Seq Int))) 1))",
        "(declare-const x String)",
        "(assert (str.in_re x ((as re.none (RegEx String)) 1)))",
        "(check-sat)",
      ]),
    ).toEqual([
      "(error \"line 1 column 41: Unexpected number of arguments to 're.none' 0 arguments expected 1 given\")",
      "(error \"line 2 column 41: Unexpected number of arguments to 're.empty' 0 arguments expected 1 given\")",
      "(error \"line 3 column 43: Unexpected number of arguments to 're.allchar' 0 arguments expected 1 given\")",
      "(error \"line 4 column 20: Unexpected number of arguments to 're.none' 0 arguments expected 1 given\")",
      "(error \"line 5 column 23: Unexpected number of arguments to 're.allchar' 0 arguments expected 1 given\")",
      "(error \"line 6 column 21: Unexpected number of arguments to 're.empty' 0 arguments expected 1 given\")",
      "(re.empty 1)",
      "(re.allchar 1)",
      "(error \"line 10 column 51: Unexpected number of arguments to 're.none' 0 arguments expected 1 given\")",
      "sat",
    ]);
  });
});

describe("algebraic datatypes", () => {
  it("rewrites each term that it enumerates for a fresh value of a mutually recursive datatype", () => {
    expect(
      run([
        "(declare-datatypes ((A 0) (B 0)) (((a0) (a1 (ab B))) ((b0) (b1 (ba A)))))",
        "(declare-const x B)",
        "(assert (not (= x b0)))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 132)",
      ["(", "  (define-fun x () B", "    (b1 a0))", ")"].join("\n"),
    ]);
  });

  it("rewrites an equality of two constructor applications through a conjunction of one equality", () => {
    expect(
      run([
        "(declare-datatypes ((B 0)) (((b0) (b1 (ba Int)))))",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (= (b1 y) (b1 z)))",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 12)", "sat", "(:rlimit 56)"]);
  });
});

describe("theory_bv, as Z3 5.3.2 bit-blasts its terms", () => {
  it("frees the negation mk_not_core makes of an equality's left side", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(push)",
        "(assert (= (bvmul x y) #x00))",
        "(check-sat)",
        "(pop)",
        "(assert (bvult (bvmul x y) #x10))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "sat", "(:rlimit 1854)"]);
  });
});
