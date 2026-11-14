import { describe, expect, it } from "vite-plus/test";
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
