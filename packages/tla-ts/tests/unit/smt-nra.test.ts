import { describe, expect, it } from "vite-plus/test";
import { L_FALSE, L_TRUE, L_UNDEF } from "../../src/prover/smt/solver/lbool";
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
import type { TranscendentalOp } from "../../src/prover/smt/solver/nlsat/transcendental-eval";
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
    expect(result.core.nra.check(Infinity)).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect(result.core.lemmas[0].ineqs).toHaveLength(0);
    expect([...result.core.lemmas[0].expl].sort()).toEqual(result.constraints);
    expect(result.core.isUsingNraModel).toBe(true);
  });

  it("finds the model x = sqrt(2) of x*x = 2 and makes it nla's", () => {
    const result = getSquare(KIND_EQ, 2n);
    const nra = result.core.nra;
    expect(nra.check(Infinity)).toBe(L_TRUE);
    expect(result.core.isUsingNraModel).toBe(true);
    const value = nra.value(result.xVariable);
    expect(nra.am.isRational(value)).toBe(false);
    expect(nra.am.compare(nra.am.mul(value, value), new Anum(Rational.of(2n)))).toBe(0);
    expect(nra.value(result.monicVariable).value).toEqual(Rational.of(2n));
  });

  it("answers unknown once nlsat runs past the budget of its resource limit", () => {
    const result = getSquare(KIND_EQ, 2n);
    const core = result.core;
    core.limit.pushChild(core.nraLimit);
    core.nraLimit.push(1);
    expect(core.nra.check(Infinity)).toBe(L_UNDEF);
    expect(core.nraLimit.count).toBe(2);
    core.nraLimit.pop();
    core.limit.popChild(core.nraLimit);
    expect(core.limit.count).toBe(1);
  });
});

describe("nra check_assignment on a transcendental identity", () => {
  const getCore = (
    firstOp: TranscendentalOp,
    secondOp: TranscendentalOp,
    firstValue: Rational,
    secondValue: Rational,
  ) => {
    const lra = new LarSolver(() => false);
    const xVariable = lra.addVar(0, false);
    const firstVariable = lra.addVar(1, false);
    const secondVariable = lra.addVar(2, false);
    const core = new NlaCore(lra, new ResourceLimit(Infinity));
    core.transcendentals.add(firstOp, xVariable, firstVariable);
    core.transcendentals.add(secondOp, xVariable, secondVariable);
    const constraints = [
      lra.mkVarBound(firstVariable, KIND_GE, firstValue),
      lra.mkVarBound(firstVariable, KIND_LE, firstValue),
      lra.mkVarBound(secondVariable, KIND_GE, secondValue),
      lra.mkVarBound(secondVariable, KIND_LE, secondValue),
    ];
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { lra, core, firstVariable, secondVariable };
  };

  it("refutes sin = cos = 1/2, reading sin^2 + cos^2 = 1 as sin + cos = 1 like Z3", () => {
    const half = Rational.of(1n, 2n);
    const result = getCore("sin", "cos", half, half);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect(
      result.core.lemmas[0].ineqs.map((ineq) => [ineq.cmp, ineq.rs, [...ineq.term.coeffs]]),
    ).toEqual([
      [KIND_LE, Rational.zero, [[result.firstVariable, Rational.one]]],
      [KIND_LE, Rational.zero, [[result.secondVariable, Rational.one]]],
    ]);
  });

  it("defines the product of cosh and tanh as a new monomial", () => {
    const result = getCore("tanh", "cosh", Rational.of(1n, 2n), Rational.of(2n));
    result.core.addMulDefHook = () => result.lra.addVar(3, false);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_UNDEF);
    expect(result.core.lemmas).toHaveLength(0);
    expect(result.core.emons.get(3).vars).toEqual([result.firstVariable, result.secondVariable]);
  });
});

describe("nla check", () => {
  // Z3's nla::core::check turns its lemmas into l_false only while the resource limit has budget.
  it("stays undecided after a lemma once the resource limit runs out", () => {
    const lra = new LarSolver(() => false);
    const xVariable = lra.addVar(0, false);
    const yVariable = lra.addVar(1, false);
    const monicVariable = lra.addVar(2, false);
    const core = new NlaCore(lra, new ResourceLimit(Infinity));
    core.addMonic(monicVariable, [xVariable, yVariable]);
    lra.activate(lra.mkVarBound(monicVariable, KIND_LE, Rational.of(-1n)));
    lra.findFeasibleSolution();
    core.limit.push(1);
    expect(core.check(2)).toBe(L_UNDEF);
    expect(core.lemmas).toHaveLength(1);
  });
});
