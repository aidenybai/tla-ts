import { describe, expect, it } from "vite-plus/test";
import { AstManager, OP_BADD, OP_BSUB } from "../../src/prover/smt/solver/ast";
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
