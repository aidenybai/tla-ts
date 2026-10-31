import { describe, expect, it } from "vite-plus/test";
import { Rational } from "../../src/prove/smt/solver/rational";
import { CrossNested } from "../../src/prove/smt/solver/lp/cross-nested";
import {
  type DepInterval,
  add,
  checkIntervalForConflictOnZero,
  displayDepInterval,
  div,
  intersect,
  isEmpty,
  mkDepInterval,
  mul,
  mulScalar,
  power,
  separatedFromZero,
  setValue,
  setZeroIntervalDepsForMult,
} from "../../src/prove/smt/solver/lp/dep-intervals";
import { linearize, mkLeaf } from "../../src/prove/smt/solver/lp/dependency";
import { type Nex, getNexVal, printNex } from "../../src/prove/smt/solver/lp/nex";
import { NexCreator } from "../../src/prove/smt/solver/lp/nex-creator";

const mkClosed = (lower: Rational, upper: Rational, lowerLeaf: number, upperLeaf: number) => {
  const interval = mkDepInterval();
  setValue(interval, lower);
  interval.upper = upper;
  interval.lowerDep = mkLeaf(lowerLeaf);
  interval.upperDep = mkLeaf(upperLeaf);
  return interval;
};

const int = (value: number) => Rational.fromNumber(value);

// Z3's rand(): the LCG of the Microsoft C runtime.
const mkRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (Math.imul(state, 214013) + 2531011) >>> 0;
    return (state >>> 16) & 0x7fff;
  };
};

// mk_random_interval from Z3's src/test/interval.cpp.
const mkRandomInterval = (random: () => number, magnitude: number) => {
  const interval = mkDepInterval();
  const kind = random() % 3;
  if (kind === 0) {
    if (random() % 4 === 0) {
      interval.isUpperOpen = random() % 2 === 0;
      interval.isUpperInf = false;
      interval.upper = int(-(random() % magnitude));
      return interval;
    }
    interval.isUpperOpen = random() % 2 === 0;
    interval.isUpperInf = false;
    const upper = -(random() % magnitude);
    interval.upper = int(upper);
    interval.isLowerOpen = random() % 2 === 0;
    interval.isLowerInf = false;
    const gap = random() % magnitude;
    interval.lower = int(upper - gap - (interval.isLowerOpen || interval.isUpperOpen ? 1 : 0));
    return interval;
  }
  if (kind === 1) {
    if (random() % 4 !== 0) {
      interval.isLowerOpen = random() % 2 === 0;
      interval.isLowerInf = false;
      interval.lower = int(-(random() % magnitude) - 1);
    }
    if (random() % 4 !== 0) {
      interval.isUpperOpen = random() % 2 === 0;
      interval.isUpperInf = false;
      interval.upper = int((random() % magnitude) + 1);
    }
    return interval;
  }
  if (random() % 4 === 0) {
    interval.isLowerOpen = random() % 2 === 0;
    interval.isLowerInf = false;
    interval.lower = int(random() % magnitude);
    return interval;
  }
  interval.isLowerOpen = random() % 2 === 0;
  interval.isLowerInf = false;
  const lower = random() % magnitude;
  interval.lower = int(lower);
  interval.isUpperOpen = random() % 2 === 0;
  interval.isUpperInf = false;
  const gap = random() % magnitude;
  interval.upper = int(lower + gap + (interval.isLowerOpen || interval.isUpperOpen ? 1 : 0));
  return interval;
};

const GRID = Array.from({ length: 33 }, (_, index) => Rational.of(BigInt(index - 16), 2n));

// The points that satisfy the bounds the dependency names: leaf lowerLeaf for the lower bound,
// upperLeaf for the upper bound. A bound the dependency leaves out does not constrain them.
const getSamples = (
  interval: DepInterval,
  leaves: number[],
  lowerLeaf: number,
  upperLeaf: number,
) => {
  const isLowerUsed = leaves.includes(lowerLeaf) && !interval.isLowerInf;
  const isUpperUsed = leaves.includes(upperLeaf) && !interval.isUpperInf;
  const nearBounds = [interval.lower, interval.upper].flatMap((bound) => [
    bound,
    bound.add(Rational.of(1n, 8n)),
    bound.sub(Rational.of(1n, 8n)),
  ]);
  return [...GRID, ...nearBounds].filter((value) => {
    if (isLowerUsed) {
      const comparison = value.compare(interval.lower);
      if (comparison < 0 || (comparison === 0 && interval.isLowerOpen)) return false;
    }
    if (isUpperUsed) {
      const comparison = value.compare(interval.upper);
      if (comparison > 0 || (comparison === 0 && interval.isUpperOpen)) return false;
    }
    return true;
  });
};

// The lemma Z3's test writes for each bound of the result: the argument bounds its dependency
// names imply the bound.
const expectDepsJustify = (
  first: DepInterval,
  second: DepInterval | null,
  result: DepInterval,
  apply: (left: Rational, right: Rational) => Rational | null,
) => {
  for (const side of ["lower", "upper"] as const) {
    const isInf = side === "lower" ? result.isLowerInf : result.isUpperInf;
    if (isInf) continue;
    const leaves = linearize([side === "lower" ? result.lowerDep : result.upperDep]);
    const bound = side === "lower" ? result.lower : result.upper;
    const isOpen = side === "lower" ? result.isLowerOpen : result.isUpperOpen;
    const rights = second === null ? [Rational.zero] : getSamples(second, leaves, 3, 4);
    for (const left of getSamples(first, leaves, 1, 2)) {
      for (const right of rights) {
        const value = apply(left, right);
        if (value === null) continue;
        const comparison = side === "lower" ? value.compare(bound) : bound.compare(value);
        const isSound = comparison > 0 || (comparison === 0 && !isOpen);
        if (!isSound)
          throw new Error(
            `${displayDepInterval(first)} ${second === null ? "" : displayDepInterval(second)} -> ${displayDepInterval(result)} fails at ${left.toString()}, ${right.toString()}`,
          );
      }
    }
  }
};

const withLeaves = (interval: DepInterval, lowerLeaf: number, upperLeaf: number) => {
  interval.lowerDep = mkLeaf(lowerLeaf);
  interval.upperDep = mkLeaf(upperLeaf);
  return interval;
};

describe("dep_intervals", () => {
  it("multiplies the intervals of Z3's nla_intervals tests", () => {
    const product = (first: DepInterval, second: DepInterval) => {
      const result = mkDepInterval();
      mul(first, second, result, "with-deps");
      return result;
    };
    const positive = product(mkClosed(int(1), int(3), 1, 2), mkClosed(int(2), int(4), 3, 4));
    expect(displayDepInterval(positive)).toBe("[2,12] ld 1 3 ud 4 1 2");
    const negative = product(mkClosed(int(-3), int(-1), 1, 2), mkClosed(int(2), int(4), 3, 4));
    expect(displayDepInterval(negative)).toBe("[-12,-2] ld 4 1 2 ud 3 2");
    const crossing = product(mkClosed(int(-2), int(3), 1, 2), mkClosed(int(1), int(4), 3, 4));
    expect(displayDepInterval(crossing)).toBe("[-8,12] ld 4 1 3 ud 4 3 2");
    const mixed = product(
      product(mkClosed(int(-1), int(1), 1, 2), mkClosed(int(-2), int(2), 3, 4)),
      mkClosed(int(1), int(3), 5, 6),
    );
    expect(displayDepInterval(mixed).split(" ")[0]).toBe("[-6,6]");
    const fractional = product(
      mkClosed(Rational.of(1n, 2n), Rational.of(3n, 2n), 1, 2),
      mkClosed(Rational.of(5n, 2n), Rational.of(7n, 2n), 3, 4),
    );
    expect(displayDepInterval(fractional).split(" ")[0]).toBe("[5/4,21/4]");
  });

  it("squares an interval that crosses zero from its two bounds", () => {
    const square = mkDepInterval();
    power(mkClosed(int(-3), int(2), 1, 2), 2, square, "with-deps");
    expect(displayDepInterval(square)).toBe("[0,9] ud 1 2");
  });

  it("keeps open bounds open and closes a zero bound of a product", () => {
    const first = withLeaves(mkDepInterval(), 1, 2);
    first.isLowerInf = false;
    first.isLowerOpen = false;
    first.lower = Rational.zero;
    first.isUpperInf = false;
    first.isUpperOpen = false;
    first.upper = int(2);
    const second = mkClosed(int(1), int(3), 3, 4);
    second.isLowerOpen = true;
    const product = mkDepInterval();
    mul(first, second, product, "without-deps");
    expect(displayDepInterval(product)).toBe("[0,6]");
    const sum = mkDepInterval();
    add(first, second, sum, "with-deps");
    expect(displayDepInterval(sum)).toBe("(1,5] ld 1 3 ud 2 4");
  });

  it("swaps the dependencies when a scalar is negative", () => {
    const scaled = mkDepInterval();
    mulScalar(int(-2), mkClosed(int(1), int(3), 1, 2), scaled, "with-deps");
    expect(displayDepInterval(scaled)).toBe("[-6,-2] ld 2 ud 1");
  });

  it("divides by an interval that excludes zero", () => {
    const quotient = mkDepInterval();
    const divisor = mkClosed(Rational.zero, int(2), 3, 4);
    divisor.isLowerOpen = true;
    div(mkClosed(int(1), int(4), 1, 2), divisor, quotient, "with-deps");
    expect(displayDepInterval(quotient)).toBe("[1/2,oo) ld 4 1 3");
  });

  it("intersects with the tighter bound and finds the empty intersection", () => {
    const result = mkDepInterval();
    intersect(mkClosed(int(0), int(5), 1, 2), mkClosed(int(3), int(8), 3, 4), result, "with-deps");
    expect(displayDepInterval(result)).toBe("[3,5] ld 3 ud 2");
    expect(isEmpty(result)).toBe(false);
    const disjoint = mkDepInterval();
    intersect(
      mkClosed(int(0), int(1), 1, 2),
      mkClosed(int(3), int(8), 3, 4),
      disjoint,
      "with-deps",
    );
    expect(isEmpty(disjoint)).toBe(true);
  });

  it("explains the bound that separates an interval from zero", () => {
    const interval = mkClosed(int(1), int(3), 1, 2);
    expect(separatedFromZero(interval)).toBe(true);
    const explanations: number[][] = [];
    const isConflict = checkIntervalForConflictOnZero(interval, mkLeaf(7), (explanation) =>
      explanations.push(explanation),
    );
    expect(isConflict).toBe(true);
    expect(explanations).toEqual([[7, 1]]);
    expect(separatedFromZero(mkClosed(int(0), int(3), 1, 2))).toBe(false);
  });

  it("joins both dependencies of a zero factor", () => {
    const interval = mkClosed(Rational.zero, Rational.zero, 1, 2);
    setZeroIntervalDepsForMult(interval);
    expect(displayDepInterval(interval)).toBe("[0,0] ld 1 2 ud 1 2");
  });

  it("justifies each bound by the bounds its dependency names, like Z3's interval tests", () => {
    const random = mkRandom(0);
    for (let index = 0; index < 150; index++) {
      const first = withLeaves(mkRandomInterval(random, 3), 1, 2);
      const second = withLeaves(mkRandomInterval(random, 3), 3, 4);
      const result = mkDepInterval();
      mul(first, second, result, "with-deps");
      expectDepsJustify(first, second, result, (left, right) => left.mul(right));
      add(first, second, result, "with-deps");
      expectDepsJustify(first, second, result, (left, right) => left.add(right));
      power(first, 2, result, "with-deps");
      expectDepsJustify(first, null, result, (left) => left.mul(left));
      power(first, 3, result, "with-deps");
      expectDepsJustify(first, null, result, (left) => left.mul(left).mul(left));
      const isSecondSeparated =
        (!second.isLowerInf &&
          (second.lower.isPositive() || (second.lower.isZero() && second.isLowerOpen))) ||
        (!second.isUpperInf &&
          (second.upper.isNegative() || (second.upper.isZero() && second.isUpperOpen)));
      if (!isSecondSeparated) continue;
      div(first, second, result, "with-deps");
      expectDepsJustify(first, second, result, (left, right) =>
        right.isZero() ? null : left.div(right),
      );
    }
  });
});

const mkCreator = (weights: number[]) => {
  const creator = new NexCreator();
  creator.setNumberOfVars(weights.length);
  weights.forEach((weight, variable) => creator.setVarWeight(variable, weight));
  return creator;
};

describe("nex_creator", () => {
  it("orders expressions like Z3's test_nex_order", () => {
    const creator = mkCreator([10, 9, 8]);
    const a = creator.mkVar(0);
    const b = creator.mkVar(1);
    const c = creator.mkVar(2);
    expect(creator.gt(a, b) && creator.gt(b, c) && creator.gt(a, c)).toBe(true);
    const ab = creator.mkMul(a, b);
    const ba = creator.mkMul(b, a);
    const ac = creator.mkMul(a, c);
    expect(creator.gt(ab, ac)).toBe(true);
    expect(creator.gt(ac, ab)).toBe(false);
    const threeAc = creator.mkMul(int(3), a, c);
    const twoAb = creator.mkMul(int(2), a, b);
    expect(creator.gt(ab, threeAc)).toBe(true);
    expect(creator.gt(threeAc, ab)).toBe(false);
    expect(creator.gt(a, ab)).toBe(false);
    expect(creator.gt(ab, a)).toBe(true);
    expect(creator.gt(twoAb, threeAc)).toBe(true);
    expect(creator.gt(threeAc, twoAb)).toBe(false);
    const twoA = creator.mkMul(int(2), a);
    expect(creator.gt(twoA, twoAb)).toBe(false);
    expect(creator.gt(twoAb, twoA)).toBe(true);
    expect(NexCreator.equal(ab, ba)).toBe(true);
    const poly = creator.mkMul(
      creator.mkSum([creator.mkMul(int(5), a), creator.mkScalar(Rational.one)]),
      b,
    );
    expect(printNex(creator.simplify(poly))).toBe("((5 *j0)+1)*j1");
  });

  it("simplifies like Z3's test_simplify", () => {
    const creator = mkCreator([0, 1, 2]);
    const a = creator.mkVar(0);
    const b = creator.mkVar(1);
    const c = creator.mkVar(2);
    const aPlusBc = creator.mkSum([a, creator.mkMul(b, c)]);
    const twoAPlusBc = creator.mkMul(creator.mkScalar(int(2)), aPlusBc);
    expect(NexCreator.equal(creator.simplify(twoAPlusBc), twoAPlusBc)).toBe(true);
    const simplified = creator.simplify(aPlusBc);
    expect(simplified.kind === "sum" && simplified.children.length > 1).toBe(true);
    const threeAb = creator.mkMul(creator.mkScalar(int(3)), a, b);
    const cube = creator.simplify(creator.mkMul(threeAb, threeAb, threeAb));
    expect(cube.kind === "mul" && cube.coeff.equals(int(27))).toBe(true);
    expect(printNex(cube)).toBe("27 *(j1^3)*(j0^3)");
  });

  it("merges the summands that differ in their coefficient", () => {
    const creator = mkCreator([0, 1, 2]);
    const a = creator.mkVar(0);
    const b = creator.mkVar(1);
    const c = creator.mkVar(2);
    const sum = creator.mkSum([
      a,
      creator.mkMul(int(3), b, c),
      creator.mkScalar(int(4)),
      creator.mkMul(int(2), c, b),
      creator.mkScalar(int(-1)),
    ]);
    expect(printNex(creator.simplify(sum))).toBe("(5 *j2*j1)+j0+3");
  });

  it("divides a product by a variable and by a product", () => {
    const creator = mkCreator([0, 1, 2]);
    const a = creator.mkVar(0);
    const b = creator.mkVar(1);
    const product = creator.simplify(creator.mkMul(int(6), a, a, b));
    expect(printNex(creator.mkDivByVar(product, 0))).toBe("6 *j1*j0");
    if (product.kind !== "mul") throw new Error("expected a product");
    const divisor = creator.mkMul(int(2), a);
    expect(printNex(creator.mkDiv(product, divisor))).toBe("3 *j1*j0");
  });
});

describe("cross_nested", () => {
  const unlimited = { inc: () => true };

  it("stops when the resource limit runs out, like Z3's test_simplify", () => {
    const creator = mkCreator([0, 0, 0]);
    const a = creator.mkVar(0);
    const sum = creator.simplify(
      creator.mkSum([creator.mkMul(a, creator.mkVar(1)), creator.mkMul(a, creator.mkVar(2))]),
    );
    let count = 0;
    let budget = 1;
    const crossNested = new CrossNested(
      () => {
        count++;
        return false;
      },
      () => false,
      { inc: () => budget-- > 0 },
      1,
      creator,
    );
    crossNested.run(sum);
    expect(count).toBe(0);
  });

  it("extracts the common factor of every summand", () => {
    const creator = mkCreator([0, 0, 0]);
    const a = creator.mkVar(0);
    const sum = creator.simplify(
      creator.mkSum([creator.mkMul(a, creator.mkVar(1)), creator.mkMul(a, creator.mkVar(2))]),
    );
    const forms: string[] = [];
    new CrossNested(
      (expr) => {
        forms.push(printNex(expr));
        return false;
      },
      () => false,
      unlimited,
      1,
      creator,
    ).run(sum);
    expect(forms).toEqual(["(j0)*(j2+j1)"]);
  });

  it("reports forms that keep the value of the sum", () => {
    const creator = mkCreator([0, 1, 2, 3]);
    const variables = [0, 1, 2, 3].map((variable) => creator.mkVar(variable));
    const original = creator.mkSum([
      creator.mkMul(variables[0], variables[1]),
      creator.mkMul(int(2), variables[0], variables[2]),
      creator.mkMul(variables[1], variables[2], variables[3]),
      creator.mkMul(variables[3], variables[3]),
      creator.mkScalar(int(5)),
    ]);
    const copy = creator.clone(original);
    const getVarVal = (variable: number) => int([2, -3, 5, 7][variable]);
    const expected = getNexVal(copy, getVarVal);
    const values: Rational[] = [];
    const forms = new Set<string>();
    const simplified = creator.simplify(original);
    new CrossNested(
      (expr: Nex) => {
        values.push(getNexVal(expr, getVarVal));
        forms.add(printNex(expr));
        return false;
      },
      () => false,
      unlimited,
      7,
      creator,
    ).run(simplified);
    expect(values.length).toBeGreaterThan(1);
    expect(values.every((value) => value.equals(expected))).toBe(true);
    expect(forms.size).toBe(values.length);
  });
});
