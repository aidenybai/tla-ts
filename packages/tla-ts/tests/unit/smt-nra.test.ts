import { describe, expect, it } from "vite-plus/test";
import { SmtCanceledError } from "../../src/errors";
import { L_FALSE, L_TRUE } from "../../src/prover/smt/solver/lbool";
import {
  type ConstraintKind,
  KIND_EQ,
  KIND_GE,
  KIND_LE,
  KIND_LT,
} from "../../src/prover/smt/solver/lp/constraints";
import { LarSolver } from "../../src/prover/smt/solver/lp/lar-solver";
import { NlaCore } from "../../src/prover/smt/solver/lp/nla-core";
import { NraSolver } from "../../src/prover/smt/solver/lp/nra-solver";
import { Anum } from "../../src/prover/smt/solver/nlsat/algebraic";
import { Rational } from "../../src/prover/smt/solver/rational";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";

describe("nra check_assignment", () => {
  const getCore = (
    getFactors: (xVariable: number, yVariable: number) => number[],
    kind: ConstraintKind,
    bound: bigint,
  ) => {
    const lra = new LarSolver(() => false);
    const xVariable = lra.addVar(0, false);
    const yVariable = lra.addVar(1, false);
    const monicVariable = lra.addVar(2, false);
    const core = new NlaCore(lra, new ResourceLimit(Infinity));
    core.addMonic(monicVariable, getFactors(xVariable, yVariable));
    const constraints = [
      lra.mkVarBound(xVariable, KIND_GE, Rational.of(2n)),
      lra.mkVarBound(xVariable, KIND_LE, Rational.of(2n)),
      lra.mkVarBound(yVariable, KIND_GE, Rational.of(1n)),
      lra.mkVarBound(yVariable, KIND_LE, Rational.of(1n)),
      lra.mkVarBound(monicVariable, kind, Rational.of(bound)),
    ];
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { core, constraints };
  };

  it("refutes x*y <= 1 at x = 2 and y = 1 with a lemma", () => {
    const result = getCore((xVariable, yVariable) => [xVariable, yVariable], KIND_LE, 1n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
    expect(result.core.isCheckFeasible).toBe(true);
  });

  it("refutes x*x <= 1 at x = 2 with a lemma, factoring x^2 - 1", () => {
    const result = getCore((xVariable) => [xVariable, xVariable], KIND_LE, 1n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
  });

  it("refutes x*x = 2 at x = 2 with a lemma, bounding the irrational root linearly", () => {
    const result = getCore((xVariable) => [xVariable, xVariable], KIND_EQ, 2n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
  });
});

describe("nra check", () => {
  const getSquare = (kind: ConstraintKind, bound: bigint) => {
    const lra = new LarSolver(() => false);
    const xVariable = lra.addVar(0, false);
    const monicVariable = lra.addVar(1, false);
    const core = new NlaCore(lra, new ResourceLimit(Infinity));
    core.addMonic(monicVariable, [xVariable, xVariable]);
    const constraints = [
      lra.mkVarBound(xVariable, KIND_GE, Rational.of(1n)),
      lra.mkVarBound(monicVariable, kind, Rational.of(bound)),
    ];
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { core, xVariable, monicVariable, constraints };
  };

  it("refutes x*x < 1 with a lemma over the constraints of nlsat's core", () => {
    const result = getSquare(KIND_LT, 1n);
    expect(result.core.nra.check(Infinity, Infinity)).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect(result.core.lemmas[0].ineqs).toHaveLength(0);
    expect([...result.core.lemmas[0].expl].sort()).toEqual(result.constraints);
    expect(result.core.isUsingNraModel).toBe(true);
  });

  it("finds the model x = sqrt(2) of x*x = 2 and makes it nla's", () => {
    const result = getSquare(KIND_EQ, 2n);
    const nra = result.core.nra;
    expect(nra.check(Infinity, Infinity)).toBe(L_TRUE);
    expect(result.core.isUsingNraModel).toBe(true);
    const value = nra.value(result.xVariable);
    expect(nra.am.isRational(value)).toBe(false);
    expect(nra.am.compare(nra.am.mul(value, value), new Anum(Rational.of(2n)))).toBe(0);
    expect(nra.value(result.monicVariable).value).toEqual(Rational.of(2n));
  });

  it("throws a named error once the search takes more steps than its budget", () => {
    const result = getSquare(KIND_EQ, 2n);
    expect(() => result.core.nra.check(Infinity, 1)).toThrow(SmtCanceledError);
  });
});
