import { describe, expect, it } from "vite-plus/test";
import { KIND_EQ, KIND_GE, KIND_LE } from "../../src/prover/smt/solver/lp/constraints";
import { mkLeaf, linearize } from "../../src/prover/smt/solver/lp/dependency";
import { LarSolver } from "../../src/prover/smt/solver/lp/lar-solver";
import { NlaCore } from "../../src/prover/smt/solver/lp/nla-core";
import { isConflictLemma } from "../../src/prover/smt/solver/lp/nla-types";
import { PddMemoryOutError } from "../../src/errors";
import { evaluatePdd, Pdd, PddManager } from "../../src/prover/smt/solver/lp/pdd";
import { PddSimplifier } from "../../src/prover/smt/solver/lp/pdd-simplifier";
import { PddSolver, SOLVED } from "../../src/prover/smt/solver/lp/pdd-solver";
import { Rational } from "../../src/prover/smt/solver/rational";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";

const createRational = (value: number) => Rational.fromNumber(value);

const getVars = (manager: PddManager, count: number) =>
  Array.from({ length: count }, (_, index) => manager.mkVar(index));

const getPolys = (solver: PddSolver) => solver.equations().map((equation) => `${equation.poly}`);

// Ported from Z3's src/test/pdd.cpp.
describe("pdd", () => {
  it("canonizes sums and products", () => {
    const manager = new PddManager(3);
    const [v0, v1, v2] = getVars(manager, 3);
    expect(v0.mul(v1).mul(v2).equals(v2.mul(v0).mul(v1))).toBe(true);
    expect(v0.add(v1).add(v2).equals(v2.add(v1).add(v0))).toBe(true);
    const product = v0.add(v1).mul(v2);
    expect(product.equals(v0.mul(v2).add(v1.mul(v2)))).toBe(true);
    expect(
      product
        .add(createRational(3))
        .add(createRational(1))
        .equals(v0.mul(v2).add(v1.mul(v2)).add(createRational(1)).add(createRational(3))),
    ).toBe(true);
    const varA = manager.mkVar(0);
    const varB = manager.mkVar(1);
    expect(
      varA
        .sub(varB)
        .mul(varA.add(varB))
        .equals(varA.mul(varA).sub(varB.mul(varB))),
    ).toBe(true);
    const square = varA.mul(createRational(2)).sub(createRational(3));
    const expanded = varA
      .mul(varA)
      .mul(createRational(4))
      .sub(varA.mul(createRational(12)))
      .add(createRational(9));
    expect(square.mul(square).equals(expanded)).toBe(true);
  });

  it("forms S-polynomials of overlapping leading monomials", () => {
    const manager = new PddManager(3);
    const [v0, v1, v2] = getVars(manager, 3);
    expect(`${manager.trySpoly(v1.mul(v2), v0.mul(v2).add(v2.mul(v2)))}`).toBe("- v2*v1*v0");
    expect(`${manager.trySpoly(v1.mul(v2), v0.mul(v2).add(v1.mul(v1)))}`).toBe("- v1^3");
    expect(manager.trySpoly(v1, v2)).toBeNull();
    const reducer = v0.mul(v1).sub(v0.mul(v0));
    const reduced = v0.mul(v1).mul(v2.add(v0)).add(v2).reduce(reducer);
    expect(reduced.equals(reduced.reduce(reducer))).toBe(true);
  });

  it("reduces by the leading monomial", () => {
    const manager = new PddManager(4);
    const [varA, varB, varC, varD] = getVars(manager, 4);
    const poly = varA
      .mul(varB)
      .mul(varB)
      .mul(varC)
      .mul(varD)
      .add(varA.mul(varB).mul(varC).mul(createRational(2)))
      .add(varB.mul(varC).mul(varD))
      .add(varB.mul(varC))
      .add(varC.mul(varD))
      .add(createRational(3));
    const productBc = varB.mul(varC);
    expect(manager.reduce(poly, productBc).equals(varC.mul(varD).add(createRational(3)))).toBe(
      true,
    );
    expect(manager.reduce(productBc, poly).equals(productBc)).toBe(true);
    const reducerBcd = varB.mul(varC).mul(varD).sub(varD.mul(varD));
    const expected = varA
      .mul(varB)
      .mul(varD)
      .mul(varD)
      .add(varA.mul(varB).mul(varC).mul(createRational(2)))
      .add(varD.mul(varD))
      .add(varB.mul(varC))
      .add(varC.mul(varD))
      .add(createRational(3));
    expect(manager.reduce(poly, reducerBcd).equals(expected)).toBe(true);
    const quadraticReducer = varD.mul(varD).add(varB.mul(createRational(3)));
    expect(
      manager.reduce(reducerBcd, quadraticReducer).equals(
        varB
          .mul(varC)
          .mul(varD)
          .add(varB.mul(createRational(3))),
      ),
    ).toBe(true);
  });

  it("iterates monomials from the highest variable", () => {
    const manager = new PddManager(4);
    const [varA, varB, varC, varD] = getVars(manager, 4);
    const count = (poly: Pdd) => [...poly].length;
    const sum = varA.add(varB).add(createRational(2));
    expect(
      count(
        sum
          .mul(varC.add(varD.mul(createRational(3))).add(createRational(5)))
          .add(createRational(2)),
      ),
    ).toBe(9);
    expect(
      count(
        varA
          .add(varB)
          .mul(varC.add(varD.mul(createRational(3))))
          .add(createRational(2)),
      ),
    ).toBe(5);
    expect(count(varA)).toBe(1);
    expect(count(varA.add(createRational(5)))).toBe(2);
    expect(count(manager.mkVal(createRational(5)))).toBe(1);
    expect(count(manager.zero())).toBe(0);
    expect([...varA.add(varB)].map((monomial) => monomial.vars)).toEqual([[1], [0]]);
    const ccbbaa = varC.mul(varC).mul(varB).mul(varB).mul(varA).mul(varA);
    const ccbbba = varC.mul(varC).mul(varB).mul(varB).mul(varB).mul(varA);
    const monomials = [...ccbbaa.add(ccbbba)];
    expect(monomials.map((monomial) => monomial.vars[4])).toEqual([1, 0]);
    const extended = ccbbaa.add(ccbbba).add(varD.mul(varD));
    expect(manager.lmLt(ccbbaa.add(ccbbba), extended)).toBe(true);
    expect(manager.lmLt(extended.add(varA.mul(varB)), extended.add(varB.mul(varB)))).toBe(true);
  });

  it("prints monomials in the order of the levels", () => {
    const manager = new PddManager(4);
    const getProduct = (vars: Pdd[]) => vars[0].add(vars[1]).mul(vars[2].add(vars[3]));
    expect(`${getProduct(getVars(manager, 4))}`).toBe("v3*v1 + v3*v0 + v2*v1 + v2*v0");
    manager.reset([3, 2, 1, 0]);
    expect(`${getProduct(getVars(manager, 4))}`).toBe("v0*v2 + v0*v3 + v1*v2 + v1*v3");
    expect(
      `${getVars(manager, 2)[0]
        .sub(createRational(1))
        .neg()
        .mul(createRational(1).div(createRational(2)))}`,
    ).toBe("- 1/2*v0 + 1/2");
  });

  it("factors out a power of a variable", () => {
    const manager = new PddManager(4);
    const [varA, varB, varC, varD] = getVars(manager, 4);
    const getDegree = (poly: Pdd, variable: number) =>
      Math.max(
        0,
        ...[...poly].map(
          (monomial) => monomial.vars.filter((innerVar) => innerVar === variable).length,
        ),
      );
    const polys = [
      varB,
      varB.pow(3),
      varB.add(varC),
      varA.pow(5).add(varA.pow(3).mul(varB)).add(varA.mul(varA).mul(varB).mul(varB)).add(varC),
      varC
        .pow(5)
        .add(varB.pow(3).mul(varC))
        .add(varB.mul(varC).mul(varC).mul(createRational(3)))
        .add(varA),
      varA.add(varB).mul(varB.add(varC)).mul(varC.add(varD)).mul(varD.add(varA)),
    ];
    for (const poly of polys) {
      for (const variable of [0, 1, 2, 3]) {
        for (let degree = 0; degree <= 5; degree++) {
          const factor = poly.factor(variable, degree);
          const power = manager.mkVar(variable).pow(degree);
          expect(factor.lc.mul(power).add(factor.rest).equals(poly)).toBe(true);
          if (degree > 0) expect(getDegree(factor.rest, variable)).toBeLessThan(degree);
          else expect(factor.lc.isZero()).toBe(true);
        }
      }
    }
  });

  it("raises to powers", () => {
    const manager = new PddManager(4);
    const [varA, varB] = getVars(manager, 2);
    expect(varA.pow(0).isOne()).toBe(true);
    expect(varA.pow(1).equals(varA)).toBe(true);
    expect(
      varA.pow(7).equals(varA.mul(varA).mul(varA).mul(varA).mul(varA).mul(varA).mul(varA)),
    ).toBe(true);
    const cube = varA.mul(varA).mul(varA).mul(varB).mul(varB).mul(varB).mul(createRational(27));
    expect(varA.mul(varB).mul(createRational(3)).pow(3).equals(cube)).toBe(true);
  });

  it("factors out the variables of every monomial", () => {
    const manager = new PddManager(3);
    const vars = getVars(manager, 5);
    const poly = vars[0].mul(vars[1]).mul(vars[2]).add(vars[2].mul(vars[0])).add(vars[1]);
    const shifted = poly.add(createRational(1));
    const none = shifted.varFactors();
    expect(none.poly.equals(shifted) && none.vars.length === 0).toBe(true);
    for (let first = 0; first < 5; first++) {
      const single = shifted.mul(vars[first]).varFactors();
      expect(single.poly.equals(shifted)).toBe(true);
      expect(single.vars).toEqual([first]);
      for (let second = first; second < 5; second++) {
        for (let third = second; third < 5; third++) {
          const triple = shifted.mul(vars[first]).mul(vars[second]).mul(vars[third]).varFactors();
          expect(triple.poly.equals(shifted)).toBe(true);
          expect(triple.vars.toSorted()).toEqual([first, second, third]);
        }
      }
    }
  });

  it("evaluates, substitutes and reads the shape", () => {
    const manager = new PddManager(3);
    const [varX, varY, varZ] = getVars(manager, 3);
    const poly = varX
      .mul(varX)
      .mul(varY)
      .add(varZ.mul(createRational(3)))
      .sub(createRational(4));
    const values = [createRational(2), createRational(5), createRational(-1)];
    expect(evaluatePdd(poly, (variable) => values[variable])).toEqual(createRational(13));
    expect(
      poly.substPdd(0, varY.add(createRational(1))).equals(
        varY
          .add(createRational(1))
          .pow(2)
          .mul(varY)
          .add(varZ.mul(createRational(3)))
          .sub(createRational(4)),
      ),
    ).toBe(true);
    expect(poly.freeVars().toSorted()).toEqual([0, 1, 2]);
    expect(varY.mul(varZ).mul(varZ).add(varY).getPowers()).toEqual([{ var: 2, degree: 2 }]);
    // Z3 counts a value under the lowest variable as one more power of it: x + 1 reports x^2.
    expect(varX.add(createRational(1)).getPowers()).toEqual([{ var: 0, degree: 2 }]);
    expect(poly.getPowers()).toEqual([{ var: 0, degree: 3 }]);
    expect(poly.degree()).toBe(3);
    expect(poly.isLinear()).toBe(false);
    expect(varX.add(varY).isLinear()).toBe(true);
    expect(varX.mul(createRational(2)).isUnary()).toBe(true);
    expect(varZ.add(createRational(2)).isOffset()).toBe(true);
    expect([...poly.coefficients()].map((value) => `${value.coeff}:${value.isConstant}`)).toEqual([
      "3:false",
      "1:false",
      "-4:true",
    ]);
  });

  it("runs out of nodes only outside an operation", () => {
    const manager = new PddManager(2);
    const [varA, varB] = getVars(manager, 2);
    manager.setMaxNumNodes(0);
    let value = 2;
    while (manager.numNodes() < 1036) manager.mkVal(createRational(value++));
    expect(() => manager.mkVal(createRational(value))).toThrow(PddMemoryOutError);
    expect(`${varA.mul(varB)}`).toBe("v1*v0");
    expect(manager.mkVal(createRational(value)).val()).toEqual(createRational(value));
  });
});

// Ported from Z3's src/test/pdd_solver.cpp.
describe("pdd solver", () => {
  const solve = (polys: (vars: Pdd[]) => Pdd[]) => {
    const manager = new PddManager(4);
    const solver = new PddSolver(manager, () => false);
    polys(getVars(manager, 4)).forEach((poly, index) => solver.add(poly, mkLeaf(index)));
    solver.saturate();
    return solver;
  };

  it("solves for a variable and substitutes it", () => {
    const solver = solve((vars) => [
      vars[1].mul(vars[2]).add(vars[1].mul(vars[3])),
      vars[1].sub(createRational(1)),
    ]);
    expect(getPolys(solver).toSorted()).toEqual(["v1 - 1", "v3 + v2"]);
  });

  it("stops at a contradiction", () => {
    const solver = solve((vars) => {
      const v1v3 = vars[3].mul(vars[1]);
      const cubic = vars[1].mul(vars[3]).mul(vars[3]).add(v1v3);
      const sum = v1v3.add(vars[1].mul(vars[2])).add(vars[2].mul(vars[3]));
      return [cubic.add(createRational(2)), cubic, sum, sum.add(vars[1]), sum.add(vars[2])];
    });
    expect(solver.conflict?.poly.isVal()).toBe(true);
    expect(solver.conflict?.state).toBe(SOLVED);
    expect(linearize([solver.conflict?.dep ?? null]).toSorted()).toEqual([0, 1]);
  });

  it("finds that two variables are zero", () => {
    const solver = solve((vars) => {
      const v1v3 = vars[3].mul(vars[1]);
      const sum = v1v3.add(vars[1].mul(vars[2])).add(vars[2].mul(vars[3]));
      return [vars[1].mul(vars[3]).mul(vars[3]).add(v1v3), sum, sum.add(vars[1]), sum.add(vars[2])];
    });
    expect(solver.conflict).toBeNull();
    expect(getPolys(solver)).toContain("v1");
    expect(getPolys(solver)).toContain("v2");
  });

  it("keeps triangular linear equations", () => {
    const solver = solve((vars) => [
      vars[3].sub(vars[2].mul(createRational(2))),
      vars[2].sub(vars[1].mul(createRational(2))),
      vars[1].sub(vars[0].mul(createRational(2))),
    ]);
    expect(getPolys(solver).toSorted()).toEqual(["v1 - 2*v0", "v2 - 2*v1", "v3 - 2*v2"]);
  });

  it("simplifies linear equations before saturation", () => {
    const manager = new PddManager(4);
    const solver = new PddSolver(manager, () => false);
    const [v0, v1, v2, v3] = getVars(manager, 4);
    solver.add(v3.sub(v2).sub(createRational(1)));
    solver.add(v3.mul(v1).add(v0));
    new PddSimplifier(solver).run();
    expect(solver.solved.map((equation) => `${equation.poly}`)).toEqual(["v3 - v2 - 1"]);
    expect(solver.toSimplify.map((equation) => `${equation.poly}`)).toEqual(["v2*v1 + v1 + v0"]);
  });
});

describe("nla grobner", () => {
  const getCore = (
    isXInt: boolean,
    addBounds: (lra: LarSolver, monic: number, base: number) => number[],
  ) => {
    const lra = new LarSolver(() => false);
    const base = lra.addVar(0, isXInt);
    const monic = lra.addVar(1, true);
    const core = new NlaCore(lra, new ResourceLimit(Infinity));
    core.addMonic(monic, [base, base]);
    const constraints = addBounds(lra, monic, base);
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { core, constraints };
  };

  it("finds that x^2 = 4y + 2 fails the gcd test", () => {
    const result = getCore(true, (lra, monic) => {
      const varY = lra.addVar(2, true);
      const term = lra.addTerm(
        [
          [monic, createRational(1)],
          [varY, createRational(-4)],
        ],
        3,
      );
      return [
        lra.mkVarBound(varY, KIND_GE, createRational(0)),
        lra.mkVarBound(varY, KIND_LE, createRational(10)),
        lra.mkVarBound(term, KIND_EQ, createRational(2)),
      ];
    });
    result.core.grobner.run();
    expect(result.core.lemmas).toHaveLength(1);
    const lemma = result.core.lemmas[0];
    expect(isConflictLemma(lemma)).toBe(true);
    expect([...lemma.expl]).toEqual([result.constraints[2]]);
  });

  it("finds that x^2 = -1 has no real solution", () => {
    const result = getCore(false, (lra, monic, base) => [
      lra.mkVarBound(base, KIND_GE, createRational(-5)),
      lra.mkVarBound(monic, KIND_EQ, createRational(-1)),
    ]);
    result.core.grobner.run();
    expect(result.core.lemmas).toHaveLength(1);
    const lemma = result.core.lemmas[0];
    expect(isConflictLemma(lemma)).toBe(true);
    expect([...lemma.expl]).toContain(result.constraints[1]);
  });
});
