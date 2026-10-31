import { describe, expect, it } from "vite-plus/test";
import { KIND_EQ, KIND_GE, KIND_LE } from "../../src/prove/smt/solver/lp/constraints";
import { mkLeaf, linearize } from "../../src/prove/smt/solver/lp/dependency";
import { LarSolver } from "../../src/prove/smt/solver/lp/lar-solver";
import { isConflictLemma, NlaCore } from "../../src/prove/smt/solver/lp/nla-core";
import { PddMemoryOutError } from "../../src/errors";
import { evaluatePdd, Pdd, PddManager } from "../../src/prove/smt/solver/lp/pdd";
import { PddSimplifier } from "../../src/prove/smt/solver/lp/pdd-simplifier";
import { PddSolver, SOLVED } from "../../src/prove/smt/solver/lp/pdd-solver";
import { Rational } from "../../src/prove/smt/solver/rational";

const rational = (value: number) => Rational.fromNumber(value);

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
        .add(rational(3))
        .add(rational(1))
        .equals(v0.mul(v2).add(v1.mul(v2)).add(rational(1)).add(rational(3))),
    ).toBe(true);
    const a = manager.mkVar(0);
    const b = manager.mkVar(1);
    expect(
      a
        .sub(b)
        .mul(a.add(b))
        .equals(a.mul(a).sub(b.mul(b))),
    ).toBe(true);
    const square = a.mul(rational(2)).sub(rational(3));
    const expanded = a
      .mul(a)
      .mul(rational(4))
      .sub(a.mul(rational(12)))
      .add(rational(9));
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
    const [a, b, c, d] = getVars(manager, 4);
    const poly = a
      .mul(b)
      .mul(b)
      .mul(c)
      .mul(d)
      .add(a.mul(b).mul(c).mul(rational(2)))
      .add(b.mul(c).mul(d))
      .add(b.mul(c))
      .add(c.mul(d))
      .add(rational(3));
    const bc = b.mul(c);
    expect(manager.reduce(poly, bc).equals(c.mul(d).add(rational(3)))).toBe(true);
    expect(manager.reduce(bc, poly).equals(bc)).toBe(true);
    const bcd = b.mul(c).mul(d).sub(d.mul(d));
    const expected = a
      .mul(b)
      .mul(d)
      .mul(d)
      .add(a.mul(b).mul(c).mul(rational(2)))
      .add(d.mul(d))
      .add(b.mul(c))
      .add(c.mul(d))
      .add(rational(3));
    expect(manager.reduce(poly, bcd).equals(expected)).toBe(true);
    const k = d.mul(d).add(b.mul(rational(3)));
    expect(
      manager.reduce(bcd, k).equals(
        b
          .mul(c)
          .mul(d)
          .add(b.mul(rational(3))),
      ),
    ).toBe(true);
  });

  it("iterates monomials from the highest variable", () => {
    const manager = new PddManager(4);
    const [a, b, c, d] = getVars(manager, 4);
    const count = (poly: Pdd) => [...poly].length;
    const sum = a.add(b).add(rational(2));
    expect(count(sum.mul(c.add(d.mul(rational(3))).add(rational(5))).add(rational(2)))).toBe(9);
    expect(
      count(
        a
          .add(b)
          .mul(c.add(d.mul(rational(3))))
          .add(rational(2)),
      ),
    ).toBe(5);
    expect(count(a)).toBe(1);
    expect(count(a.add(rational(5)))).toBe(2);
    expect(count(manager.mkVal(rational(5)))).toBe(1);
    expect(count(manager.zero())).toBe(0);
    expect([...a.add(b)].map((monomial) => monomial.vars)).toEqual([[1], [0]]);
    const ccbbaa = c.mul(c).mul(b).mul(b).mul(a).mul(a);
    const ccbbba = c.mul(c).mul(b).mul(b).mul(b).mul(a);
    const monomials = [...ccbbaa.add(ccbbba)];
    expect(monomials.map((monomial) => monomial.vars[4])).toEqual([1, 0]);
    const p0 = ccbbaa.add(ccbbba).add(d.mul(d));
    expect(manager.lmLt(ccbbaa.add(ccbbba), p0)).toBe(true);
    expect(manager.lmLt(p0.add(a.mul(b)), p0.add(b.mul(b)))).toBe(true);
  });

  it("prints monomials in the order of the levels", () => {
    const manager = new PddManager(4);
    const product = (vars: Pdd[]) => vars[0].add(vars[1]).mul(vars[2].add(vars[3]));
    expect(`${product(getVars(manager, 4))}`).toBe("v3*v1 + v3*v0 + v2*v1 + v2*v0");
    manager.reset([3, 2, 1, 0]);
    expect(`${product(getVars(manager, 4))}`).toBe("v0*v2 + v0*v3 + v1*v2 + v1*v3");
    expect(
      `${getVars(manager, 2)[0]
        .sub(rational(1))
        .neg()
        .mul(rational(1).div(rational(2)))}`,
    ).toBe("- 1/2*v0 + 1/2");
  });

  it("factors out a power of a variable", () => {
    const manager = new PddManager(4);
    const [a, b, c, d] = getVars(manager, 4);
    const getDegree = (poly: Pdd, variable: number) =>
      Math.max(
        0,
        ...[...poly].map(
          (monomial) => monomial.vars.filter((innerVar) => innerVar === variable).length,
        ),
      );
    const polys = [
      b,
      b.pow(3),
      b.add(c),
      a.pow(5).add(a.pow(3).mul(b)).add(a.mul(a).mul(b).mul(b)).add(c),
      c
        .pow(5)
        .add(b.pow(3).mul(c))
        .add(b.mul(c).mul(c).mul(rational(3)))
        .add(a),
      a.add(b).mul(b.add(c)).mul(c.add(d)).mul(d.add(a)),
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
    const [a, b] = getVars(manager, 2);
    expect(a.pow(0).isOne()).toBe(true);
    expect(a.pow(1).equals(a)).toBe(true);
    expect(a.pow(7).equals(a.mul(a).mul(a).mul(a).mul(a).mul(a).mul(a))).toBe(true);
    const cube = a.mul(a).mul(a).mul(b).mul(b).mul(b).mul(rational(27));
    expect(a.mul(b).mul(rational(3)).pow(3).equals(cube)).toBe(true);
  });

  it("factors out the variables of every monomial", () => {
    const manager = new PddManager(3);
    const vars = getVars(manager, 5);
    const poly = vars[0].mul(vars[1]).mul(vars[2]).add(vars[2].mul(vars[0])).add(vars[1]);
    const c1 = poly.add(rational(1));
    const none = c1.varFactors();
    expect(none.poly.equals(c1) && none.vars.length === 0).toBe(true);
    for (let first = 0; first < 5; first++) {
      const single = c1.mul(vars[first]).varFactors();
      expect(single.poly.equals(c1)).toBe(true);
      expect(single.vars).toEqual([first]);
      for (let second = first; second < 5; second++) {
        for (let third = second; third < 5; third++) {
          const triple = c1.mul(vars[first]).mul(vars[second]).mul(vars[third]).varFactors();
          expect(triple.poly.equals(c1)).toBe(true);
          expect(triple.vars.toSorted()).toEqual([first, second, third]);
        }
      }
    }
  });

  it("evaluates, substitutes and reads the shape", () => {
    const manager = new PddManager(3);
    const [x, y, z] = getVars(manager, 3);
    const poly = x
      .mul(x)
      .mul(y)
      .add(z.mul(rational(3)))
      .sub(rational(4));
    const values = [rational(2), rational(5), rational(-1)];
    expect(evaluatePdd(poly, (variable) => values[variable])).toEqual(rational(13));
    expect(
      poly.substPdd(0, y.add(rational(1))).equals(
        y
          .add(rational(1))
          .pow(2)
          .mul(y)
          .add(z.mul(rational(3)))
          .sub(rational(4)),
      ),
    ).toBe(true);
    expect(poly.freeVars().toSorted()).toEqual([0, 1, 2]);
    expect(y.mul(z).mul(z).add(y).getPowers()).toEqual([{ var: 2, degree: 2 }]);
    // As in Z3, a value under the lowest variable counts as one more power of it: x + 1 reports
    // x^2, and x^2*y reports x^3.
    expect(x.add(rational(1)).getPowers()).toEqual([{ var: 0, degree: 2 }]);
    expect(poly.getPowers()).toEqual([{ var: 0, degree: 3 }]);
    expect(poly.degree()).toBe(3);
    expect(poly.isLinear()).toBe(false);
    expect(x.add(y).isLinear()).toBe(true);
    expect(x.mul(rational(2)).isUnary()).toBe(true);
    expect(z.add(rational(2)).isOffset()).toBe(true);
    expect([...poly.coefficients()].map((value) => `${value.coeff}:${value.isConstant}`)).toEqual([
      "3:false",
      "1:false",
      "-4:true",
    ]);
  });

  it("runs out of nodes only outside an operation", () => {
    const manager = new PddManager(2);
    const [a, b] = getVars(manager, 2);
    manager.setMaxNumNodes(0);
    let value = 2;
    while (manager.numNodes() < 1036) manager.mkVal(rational(value++));
    expect(() => manager.mkVal(rational(value))).toThrow(PddMemoryOutError);
    expect(`${a.mul(b)}`).toBe("v1*v0");
    expect(manager.mkVal(rational(value)).val()).toEqual(rational(value));
  });
});

// Ported from Z3's src/test/pdd_solver.cpp, which prints the results.
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
      vars[1].sub(rational(1)),
    ]);
    expect(getPolys(solver).toSorted()).toEqual(["v1 - 1", "v3 + v2"]);
  });

  it("stops at a contradiction", () => {
    const solver = solve((vars) => {
      const v1v3 = vars[3].mul(vars[1]);
      const cubic = vars[1].mul(vars[3]).mul(vars[3]).add(v1v3);
      const sum = v1v3.add(vars[1].mul(vars[2])).add(vars[2].mul(vars[3]));
      return [cubic.add(rational(2)), cubic, sum, sum.add(vars[1]), sum.add(vars[2])];
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

  // Linear equations are solved and solved equations simplify nothing, so the triangular form
  // stays.
  it("keeps triangular linear equations", () => {
    const solver = solve((vars) => [
      vars[3].sub(vars[2].mul(rational(2))),
      vars[2].sub(vars[1].mul(rational(2))),
      vars[1].sub(vars[0].mul(rational(2))),
    ]);
    expect(getPolys(solver).toSorted()).toEqual(["v1 - 2*v0", "v2 - 2*v1", "v3 - 2*v2"]);
  });

  it("simplifies linear equations before saturation", () => {
    const manager = new PddManager(4);
    const solver = new PddSolver(manager, () => false);
    const [v0, v1, v2, v3] = getVars(manager, 4);
    solver.add(v3.sub(v2).sub(rational(1)));
    solver.add(v3.mul(v1).add(v0));
    new PddSimplifier(solver).run();
    expect(solver.solved.map((equation) => `${equation.poly}`)).toEqual(["v3 - v2 - 1"]);
    expect(solver.toSimplify.map((equation) => `${equation.poly}`)).toEqual(["v2*v1 + v1 + v0"]);
  });
});

describe("nla grobner", () => {
  // x*x is the monic m, and the constraints that addBounds makes are activated.
  const getCore = (
    isXInt: boolean,
    addBounds: (lra: LarSolver, m: number, x: number) => number[],
  ) => {
    const lra = new LarSolver(() => false);
    const x = lra.addVar(0, isXInt);
    const m = lra.addVar(1, true);
    const core = new NlaCore(lra);
    core.addMonic(m, [x, x]);
    const constraints = addBounds(lra, m, x);
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { core, constraints };
  };

  it("finds that x^2 = 4y + 2 fails the gcd test", () => {
    const result = getCore(true, (lra, m) => {
      const y = lra.addVar(2, true);
      const term = lra.addTerm(
        [
          [m, rational(1)],
          [y, rational(-4)],
        ],
        3,
      );
      return [
        lra.mkVarBound(y, KIND_GE, rational(0)),
        lra.mkVarBound(y, KIND_LE, rational(10)),
        lra.mkVarBound(term, KIND_EQ, rational(2)),
      ];
    });
    result.core.grobner.run();
    expect(result.core.lemmas).toHaveLength(1);
    const lemma = result.core.lemmas[0];
    expect(isConflictLemma(lemma)).toBe(true);
    expect([...lemma.expl]).toEqual([result.constraints[2]]);
  });

  it("finds that x^2 = -1 has no real solution", () => {
    const result = getCore(false, (lra, m, x) => [
      lra.mkVarBound(x, KIND_GE, rational(-5)),
      lra.mkVarBound(m, KIND_EQ, rational(-1)),
    ]);
    result.core.grobner.run();
    expect(result.core.lemmas).toHaveLength(1);
    const lemma = result.core.lemmas[0];
    expect(isConflictLemma(lemma)).toBe(true);
    expect([...lemma.expl]).toContain(result.constraints[1]);
  });
});
