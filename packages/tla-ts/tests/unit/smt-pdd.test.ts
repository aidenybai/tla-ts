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

class Temporaries {
  private polys: Pdd[] = [];

  keep(poly: Pdd) {
    this.polys.push(poly);
    return poly;
  }

  release() {
    for (let index = this.polys.length; index-- > 0;) this.polys[index].release();
    this.polys.length = 0;
  }
}

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
    const getSpoly = (first: Pdd, second: Pdd) => {
      const result = manager.zero();
      return manager.trySpoly(first, second, result) ? `${result}` : null;
    };
    expect(getSpoly(v1.mul(v2), v0.mul(v2).add(v2.mul(v2)))).toBe("- v2*v1*v0");
    expect(getSpoly(v1.mul(v2), v0.mul(v2).add(v1.mul(v1)))).toBe("- v1^3");
    expect(getSpoly(v1, v2)).toBeNull();
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
          const lc = manager.zero();
          const rest = manager.zero();
          poly.factor(variable, degree, lc, rest);
          const power = manager.mkVar(variable).pow(degree);
          expect(lc.mul(power).add(rest).equals(poly)).toBe(true);
          if (degree > 0) expect(getDegree(rest, variable)).toBeLessThan(degree);
          else expect(lc.isZero()).toBe(true);
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

  // The expected lines are what a C++ driver of these steps prints against Z3 5.3.2's dd_pdd.
  it("collects unreachable nodes and reuses their indices", () => {
    const manager = new PddManager(3);
    const [varX, varY, varZ] = getVars(manager, 3);
    const temporaries = new Temporaries();
    const getVal = (value: number) => temporaries.keep(manager.mkVal(createRational(value)));
    const lines: string[] = [];
    for (let index = 2; index < 40; index++) {
      const first = temporaries
        .keep(varX.add(getVal(index)))
        .mul(temporaries.keep(temporaries.keep(varY.add(varZ)).add(getVal(index))));
      temporaries.release();
      const second = temporaries
        .keep(first.mul(first))
        .mul(temporaries.keep(varZ.add(getVal(index + 1))));
      temporaries.release();
      lines.push(`${index} ${first.root} ${second.root} ${manager.numNodes()}`);
      second.release();
      first.release();
    }
    expect(lines).toEqual([
      "2 21 69 70",
      "3 76 135 136",
      "4 139 197 198",
      "5 204 265 266",
      "6 269 327 328",
      "7 334 396 397",
      "8 400 456 457",
      "9 462 521 522",
      "10 525 586 587",
      "11 593 656 657",
      "12 660 719 720",
      "13 726 788 789",
      "14 792 851 852",
      "15 858 919 920",
      "16 923 981 982",
      "17 988 29 83",
      "18 37 105 157",
      "19 112 178 230",
      "20 185 251 303",
      "21 258 324 376",
      "22 331 397 449",
      "23 404 470 521",
      "24 477 543 594",
      "25 550 614 665",
      "26 621 687 738",
      "27 694 759 810",
      "28 766 831 882",
      "29 838 903 954",
      "30 910 977 1027",
      "31 991 1097 1098",
      "32 1104 1169 1170",
      "33 1176 1239 1240",
      "34 1243 1306 1307",
      "35 1313 1376 1377",
      "36 1380 1443 1444",
      "37 1450 1513 1514",
      "38 1517 40 83",
      "39 48 116 157",
    ]);
  });

  // The expected lines are what a C++ driver of these steps prints against Z3 5.3.2's dd_pdd.
  it("runs out of nodes outside an operation and grows inside one", () => {
    const manager = new PddManager(2);
    const [varX, varY] = getVars(manager, 2);
    manager.setMaxNumNodes(0);
    const values: Pdd[] = [];
    let value = 2;
    while (manager.numNodes() < 1036) values.push(manager.mkVal(createRational(value++)));
    expect(() => manager.mkVal(createRational(value))).toThrow(PddMemoryOutError);
    const lines = [`mem_out ${value} ${manager.numNodes()}`];
    const product = varX.mul(varY);
    lines.push(`x*y ${product.root} ${manager.numNodes()}`);
    const constant = manager.mkVal(createRational(value));
    lines.push(`val ${constant.root} ${manager.numNodes()}`);
    for (const held of values) held.release();
    const temporaries = new Temporaries();
    for (let index = 1; index <= 600; index++) {
      const poly = temporaries
        .keep(varX.add(temporaries.keep(manager.mkVal(createRational(value + index)))))
        .mul(varY);
      temporaries.release();
      if (index % 50 === 0 || (index >= 515 && index <= 520)) {
        lines.push(`${index} ${poly.root} ${manager.numNodes()}`);
      }
      poly.release();
    }
    expect(lines).toEqual([
      "mem_out 1026 1036",
      "x*y 1036 1037",
      "val 1037 1038",
      "50 1187 1188",
      "100 1337 1338",
      "150 1487 1488",
      "200 95 98",
      "250 245 248",
      "300 395 398",
      "350 545 548",
      "400 695 698",
      "450 845 848",
      "500 995 998",
      "515 1042 1043",
      "516 1045 1046",
      "517 1048 1049",
      "518 1051 1052",
      "519 1054 1055",
      "520 1057 1058",
      "550 1147 1148",
      "600 1297 1298",
    ]);
  });

  it("multiplies unequal operands whose op cache entries collide in Z3", () => {
    const manager = new PddManager(2);
    const [varX] = getVars(manager, 1);
    const sums: Pdd[] = [];
    let value = 2;
    const addSum = () => {
      const constant = manager.mkVal(createRational(value++));
      sums.push(varX.add(constant));
      constant.release();
    };
    do addSum();
    while (sums[sums.length - 1].root < 4299);
    const first = sums[sums.length - 1];
    manager.mkVal(createRational(1000000));
    do addSum();
    while (sums[sums.length - 1].root < 26642);
    const second = sums[sums.length - 1];
    expect([first.root, second.root]).toEqual([4299, 26642]);
    expect(`${second.mul(second)}`).toBe("v0^2 + 26632*v0 + 177315856");
    // Z3 5.3.2 finds the cached square here and returns v0^2 + 26632*v0 + 177315856.
    expect(`${first.mul(second)}`).toBe("v0^2 + 15461*v0 + 28562820");
  });
});

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

  // The expected indices are what a C++ driver of these steps prints against Z3 5.3.2's dd::solver.
  it("saturates past collections with Z3's node indices", () => {
    const manager = new PddManager(6);
    const solver = new PddSolver(manager, () => false);
    const vars = getVars(manager, 6);
    const temporaries = new Temporaries();
    const keep = (poly: Pdd) => temporaries.keep(poly);
    const getVal = (value: number) => keep(manager.mkVal(createRational(value)));
    const polys = [
      () => keep(keep(vars[0].mul(vars[1])).sub(vars[2])).sub(getVal(1)),
      () => keep(keep(vars[1].mul(vars[2])).sub(vars[3])).add(getVal(2)),
      () => keep(keep(vars[2].mul(vars[3])).sub(keep(vars[4].mul(vars[0])))).add(getVal(3)),
      () => keep(keep(vars[3].mul(vars[4])).sub(vars[5])).sub(vars[0]),
      () => keep(keep(vars[4].mul(vars[5])).sub(keep(vars[0].mul(vars[1])))).add(getVal(5)),
      () => keep(keep(vars[5].mul(vars[0])).sub(vars[1])).sub(getVal(7)),
    ];
    polys.forEach((getPoly, index) => {
      solver.add(keep(getPoly()), mkLeaf(index));
      temporaries.release();
    });
    solver.config.maxSteps = 40;
    solver.adjustConfig();
    solver.saturate();
    expect(solver.equations().map((equation) => equation.poly.root)).toEqual([
      20, 1244, 1245, 1197, 1265, 153, 1388, 172, 1415, 1347, 1373, 1513, 140, 1536, 270, 36, 49,
      42, 71, 68, 87, 32, 267, 241, 1149, 1171, 25, 1253, 1500,
    ]);
    expect(manager.numNodes()).toBe(823);
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
    core.grobner.updateParams();
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
