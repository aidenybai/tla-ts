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
