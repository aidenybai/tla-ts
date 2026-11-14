import { describe, expect, it } from "vite-plus/test";
import {
  AstManager,
  OP_ADD,
  OP_GE,
  OP_LE,
  SORT_BOOL,
  SORT_INT,
} from "../../src/prover/smt/solver/ast";
import { getDependencyValues, Goal, mkDependencyLeaf } from "../../src/prover/smt/solver/goal";
import { lia2pb } from "../../src/prover/smt/solver/lia2pb";
import { TACTIC_REWRITER_OPTIONS } from "../../src/prover/smt/solver/rewriter";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

describe("a sum of one term is what Z3 5.3.2 makes of it", () => {
  it("frees the ids of to_int's one-term sums in Z3's order", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-const i Int)",
        "(simplify (to_int (+ (to_real i) x 2.0)))",
        "(simplify (>= (* x y) 0.0))",
      ]),
    ).toEqual(["(+ 2 i (to_int x))", "(or (= x 0.0) (= (>= x 0.0) (>= y 0.0)) (= y 0.0))"]);
  });

  it("rewrites a sum or product of one term to the term", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(declare-const i Int)",
        "(declare-const b (_ BitVec 4))",
        "(simplify (+ x))",
        "(simplify (* i))",
        "(simplify (bvadd b))",
        "(simplify (bvmul b))",
        "(simplify (to_int (+ x)))",
      ]),
    ).toEqual(["x", "i", "b", "b", "(to_int x)"]);
  });
});

// The expected lists are the `|-` lines of Z3 5.3.2's (apply lia2pb :print_dependencies true).
describe("lia2pb keeps the dependencies Z3 keeps", () => {
  it("joins the dependencies of a variable's bounds into every formula that uses it", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const mkConst = (name: string, sort: number) =>
      manager.mkApp(manager.mkFuncDecl(name, [], sort), [], sort);
    const x = mkConst("x", SORT_INT);
    const y = mkConst("y", SORT_INT);
    const mkAtom = (op: number, left: number, value: bigint) =>
      manager.mkApp(op, [left, manager.mkNumeral(value)], SORT_BOOL);
    const goal = new Goal(manager);
    goal.isCoresEnabled = true;
    const names = new Map<number, string>();
    const assertNamed = (name: string, form: number) => {
      const leaf = mkConst(name, SORT_BOOL);
      names.set(leaf, name);
      goal.assert(form, mkDependencyLeaf(leaf));
    };
    assertNamed("lo", mkAtom(OP_GE, x, 0n));
    assertNamed("hi", mkAtom(OP_LE, x, 5n));
    assertNamed("hi2", mkAtom(OP_LE, x, 9n));
    assertNamed("ylo", mkAtom(OP_GE, y, 0n));
    assertNamed("yhi", mkAtom(OP_LE, y, 3n));
    assertNamed("sum", mkAtom(OP_GE, manager.mkApp(OP_ADD, [x, y], SORT_INT), 12n));
    lia2pb(manager, goal, {
      isPartial: false,
      maxBits: 32,
      totalBits: 2048,
      rewriter: TACTIC_REWRITER_OPTIONS,
    });
    expect(
      goal.forms.items.map((_, index) =>
        getDependencyValues(goal.getDependency(index))
          .map((leaf) => names.get(leaf))
          .join(" "),
      ),
    ).toEqual([
      "lo hi",
      "hi lo",
      "hi2 lo hi",
      "ylo yhi",
      "yhi ylo",
      "sum lo hi ylo yhi",
      ...Array.from({ length: 10 }, () => ""),
    ]);
  });
});
