import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

// Each expected value is what z3 5.3.2 prints for the script.
describe("runSmtlibScript orders cores and terms as Z3 does", () => {
  // context::mk_unsat_core maps each literal of the conflict to its own assumption.
  it("keeps both polarities of an assumed variable in the unsat core", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(check-sat-assuming (p (not p)))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not p) p))",
        "(get-unsat-core)",
        "(check-sat-assuming (q (not p) r p (not q)))",
        "(get-unsat-core)",
        "(assert (! (or p q) :named a1))",
        "(assert (! (or p (not q)) :named a2))",
        "(check-sat-assuming (q (not q)))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not p)))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "unsat",
      "(p (not p))",
      "unsat",
      "(p (not p))",
      "unsat",
      "(p (not p))",
      "unsat",
      "(q (not q))",
      "unsat",
      "((not p) a1 a2)",
    ]);
  });
});
