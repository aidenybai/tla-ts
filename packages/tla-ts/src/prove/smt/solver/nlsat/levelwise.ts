// Ported from Z3 (src/nlsat/levelwise.cpp, src/nlsat/nlsat_common.cpp), MIT license, see
// z3-license.txt. The levelwise single cell construction in the linear mode that nlsat's
// check_assignment uses, around a sample that assigns every variable. In scope every polynomial
// has degree 1 in its maximal variable, so it has at most one root above any sample of the lower
// variables, and a polynomial never has roots on both sides of the sample. That leaves out the
// spanning tree relation and the omitted leading coefficients (m_omit_lc), which need such
// polynomials, and every discriminant, which is null below degree 2.
import { isolateRootsClosest, selectBetween } from "./algebraic";
import type { Rational } from "../rational";
import {
  NULL_VAR,
  NlsatOutOfScope,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
} from "./polynomial";

// A section is the root of lower. A sector lies between the roots of lower and upper, either of
// which may be infinite. In scope each bound has a single root above the lower variables.
export interface CellInterval {
  isSection: boolean;
  lower: Polynomial | null;
  upper: Polynomial | null;
}

interface RootFunction {
  value: Rational;
  polynomial: Polynomial;
  index: number;
  levelIndex: number;
}

const UNSET = -1;

// todo_set with canonicalization: the distinct primitive, sign-normalized polynomials still to
// project, in insertion order.
class TodoSet {
  private polynomials: Polynomial[] = [];
  private inSet = new Set<number>();

  constructor(
    private pm: PolynomialManager,
    private cache: PolynomialCache,
  ) {}

  get isEmpty() {
    return this.polynomials.length === 0;
  }

  insert(polynomial: Polynomial) {
    if (this.inSet.has(polynomial.id)) return;
    if (this.cache.contains(polynomial)) {
      this.inSet.add(polynomial.id);
      this.polynomials.push(polynomial);
      return;
    }
    const primitive =
      this.pm.isZero(polynomial) || this.pm.isConst(polynomial)
        ? polynomial
        : this.pm.pp(polynomial, this.pm.maxVar(polynomial));
    const unique = this.cache.mkUnique(this.pm.flipSignIfLmNeg(primitive));
    if (this.inSet.has(unique.id)) return;
    this.inSet.add(unique.id);
    this.polynomials.push(unique);
  }

  getMaxVar() {
    let result = NULL_VAR;
    for (const polynomial of this.polynomials)
      result = Math.max(result, this.pm.maxVar(polynomial));
    return result;
  }

  // extract_polys_at_level: moves the polynomials whose maximal variable is x to out.
  extractPolysAtLevel(variable: number, out: Polynomial[]) {
    const kept: Polynomial[] = [];
    for (const polynomial of this.polynomials) {
      if (this.pm.maxVar(polynomial) !== variable) {
        kept.push(polynomial);
        continue;
      }
      out.push(polynomial);
      this.inSet.delete(polynomial.id);
    }
    this.polynomials = kept;
  }
}

class Levelwise {
  readonly intervals: CellInterval[];
  private todo: TodoSet;
  private level = 0;
  private levelPolys: Polynomial[] = [];
  private witnesses: (Polynomial | null)[] = [];
  private rootFunctions: RootFunction[] = [];
  private pairs: [number, number][] = [];
  private lowerRf = UNSET;
  private upperRf = UNSET;

  constructor(
    private pm: PolynomialManager,
    private cache: PolynomialCache,
    private sample: readonly Rational[],
    levels: number,
  ) {
    this.todo = new TodoSet(pm, cache);
    this.intervals = Array.from({ length: levels }, () => ({
      isSection: false,
      lower: null,
      upper: null,
    }));
  }

  private getSign(polynomial: Polynomial) {
    return this.pm.getSign(polynomial, this.sample);
  }

  private requestFactorized(polynomial: Polynomial | null) {
    if (polynomial === null || this.pm.isConst(polynomial)) return;
    for (const factor of this.cache.factor(polynomial))
      if (!this.pm.isConst(factor)) this.todo.insert(factor);
  }

  // psc_resultant: the first element of the subresultant chain that is neither zero nor constant.
  // A constant means the polynomials are coprime, which needs no projection.
  private getPscResultant(first: Polynomial, second: Polynomial) {
    for (const element of this.cache.pscChain(first, second, this.level)) {
      if (this.pm.isZero(element)) continue;
      return this.pm.isConst(element) ? null : element;
    }
    return null;
  }

  // choose_nonzero_coeff: a coefficient of p in x that is nonzero at the sample, preferring a
  // constant, then the least total degree, size and maximal variable. Null when p vanishes.
  private chooseNonzeroCoeff(polynomial: Polynomial, variable: number) {
    const degree = this.pm.degree(polynomial, variable);
    for (let power = 0; power <= degree; power++) {
      const coeff = this.pm.coeff(polynomial, variable, power);
      if (!this.pm.isZero(coeff) && this.pm.isConst(coeff)) return coeff;
    }
    let best: Polynomial | null = null;
    let bestTotalDegree = 0;
    let bestSize = 0;
    let bestMaxVar = NULL_VAR;
    for (let power = 0; power <= degree; power++) {
      const coeff = this.pm.coeff(polynomial, variable, power);
      if (this.pm.isZero(coeff) || this.getSign(coeff) === 0) continue;
      const totalDegree = this.pm.totalDegree(coeff);
      const maxVar = this.pm.maxVar(coeff);
      const isBetter =
        best === null ||
        totalDegree < bestTotalDegree ||
        (totalDegree === bestTotalDegree &&
          (coeff.size < bestSize ||
            (coeff.size === bestSize && (bestMaxVar === NULL_VAR || maxVar < bestMaxVar))));
      if (!isBetter) continue;
      best = coeff;
      bestTotalDegree = totalDegree;
      bestSize = coeff.size;
      bestMaxVar = maxVar;
    }
    return best;
  }

  // handle_nullified_poly: p vanishes identically at the sample of the lower variables. Projects its
  // coefficients, then its partial derivatives level by level until one is nonzero at the sample.
  private handleNullifiedPoly(polynomial: Polynomial) {
    const degree = this.pm.degree(polynomial, this.level);
    for (let power = 0; power <= degree; power++)
      this.requestFactorized(this.pm.coeff(polynomial, this.level, power));
    let current = [{ polynomial, minVar: 0 }];
    while (current.length > 0) {
      const next: { polynomial: Polynomial; minVar: number }[] = [];
      for (const entry of current) {
        const maxVar = this.pm.maxVar(entry.polynomial);
        if (maxVar === NULL_VAR) continue;
        for (let variable = entry.minVar; variable <= maxVar; variable++) {
          if (this.pm.degree(entry.polynomial, variable) === 0) continue;
          const derivative = this.pm.derivative(entry.polynomial, variable);
          if (this.pm.isConst(derivative)) continue;
          if (this.getSign(derivative) !== 0) {
            this.requestFactorized(derivative);
            return;
          }
          next.push({ polynomial: derivative, minVar: variable });
        }
      }
      for (const entry of next) this.requestFactorized(entry.polynomial);
      current = next;
    }
  }

  // add_projection_for_poly, without the discriminant, which is null below degree 2.
  private addProjectionForPoly(
    polynomial: Polynomial,
    witness: Polynomial | null,
    isLeadingCoeffAdded: boolean,
  ) {
    let isWitnessAdded = witness !== null && !this.pm.isConst(witness);
    if (isLeadingCoeffAdded) {
      const leadingCoeff = this.pm.lc(polynomial, this.level);
      this.requestFactorized(leadingCoeff);
      if (isWitnessAdded && this.getSign(leadingCoeff) !== 0) isWitnessAdded = false;
    }
    if (this.pm.degree(polynomial, this.level) >= 2)
      throw new NlsatOutOfScope(`the discriminant of ${polynomial} in x${this.level}`);
    if (isWitnessAdded) this.requestFactorized(witness);
  }

  private isRootFunctionLess(
    first: RootFunction,
    second: RootFunction,
    isDegreeDescending: boolean,
  ) {
    if (first.polynomial === second.polynomial) return first.index < second.index;
    const comparison = first.value.compare(second.value);
    if (comparison !== 0) return comparison < 0;
    const firstDegree = this.pm.degree(first.polynomial, this.level);
    const secondDegree = this.pm.degree(second.polynomial, this.level);
    if (firstDegree !== secondDegree)
      return isDegreeDescending ? firstDegree > secondDegree : firstDegree < secondDegree;
    return first.polynomial.id < second.polynomial.id;
  }

  private sortRootFunctions(rootFunctions: RootFunction[], isDegreeDescending: boolean) {
    return rootFunctions.sort((first, second) =>
      this.isRootFunctionLess(first, second, isDegreeDescending)
        ? -1
        : this.isRootFunctionLess(second, first, isDegreeDescending)
          ? 1
          : 0,
    );
  }

  // add_linear_poly_from_root: den*x - num, whose root is the rational root.
  private addLinearPolyFromRoot(root: Rational) {
    const polynomial = this.pm.sub(
      this.pm.mulConst(root.den, this.pm.mkVar(this.level)),
      this.pm.mkConst(root.num),
    );
    this.levelPolys.push(polynomial);
    this.witnesses.push(this.chooseNonzeroCoeff(polynomial, this.level));
    return polynomial;
  }

  // add_linear_approximations: replaces a bound of total degree 2 or more with a linear polynomial
  // whose root lies between that bound and the sample (Promies et al., CADE 2025).
  private addLinearApproximations(value: Rational) {
    const interval = this.intervals[this.level];
    if (interval.isSection) {
      if (interval.lower !== null && this.pm.totalDegree(interval.lower) > 1) {
        const polynomial = this.addLinearPolyFromRoot(value);
        interval.lower = polynomial;
        this.rootFunctions.splice(this.lowerRf, 0, {
          value,
          polynomial,
          index: 1,
          levelIndex: this.levelPolys.length - 1,
        });
      }
      return;
    }
    if (interval.lower !== null && this.pm.totalDegree(interval.lower) > 1) {
      const between = selectBetween(this.rootFunctions[this.lowerRf].value, value);
      const polynomial = this.addLinearPolyFromRoot(between);
      interval.lower = polynomial;
      this.rootFunctions.splice(this.lowerRf + 1, 0, {
        value: between,
        polynomial,
        index: 1,
        levelIndex: this.levelPolys.length - 1,
      });
      this.lowerRf++;
      if (this.upperRf !== UNSET) this.upperRf++;
    }
    if (interval.upper !== null && this.pm.totalDegree(interval.upper) > 1) {
      const between = selectBetween(value, this.rootFunctions[this.upperRf].value);
      const polynomial = this.addLinearPolyFromRoot(between);
      interval.upper = polynomial;
      this.rootFunctions.splice(this.upperRf, 0, {
        value: between,
        polynomial,
        index: 1,
        levelIndex: this.levelPolys.length - 1,
      });
    }
  }

  // build_interval: the root functions around the sample, sorted on each side, and the interval of
  // the sample between them. False when no polynomial has a root.
  private buildInterval() {
    this.rootFunctions = [];
    this.pairs = [];
    const interval = this.intervals[this.level];
    interval.isSection = false;
    interval.lower = null;
    interval.upper = null;
    this.lowerRf = UNSET;
    this.upperRf = UNSET;
    const value = this.sample[this.level];
    const lowerHalf: RootFunction[] = [];
    const upperHalf: RootFunction[] = [];
    this.levelPolys.forEach((polynomial, levelIndex) => {
      const closest = isolateRootsClosest(this.pm, polynomial, this.sample, this.level);
      closest.roots.forEach((root, rootIndex) => {
        const rootFunction = {
          value: root,
          polynomial,
          index: closest.indices[rootIndex],
          levelIndex,
        };
        if (root.compare(value) <= 0) lowerHalf.push(rootFunction);
        else upperHalf.push(rootFunction);
      });
    });
    if (lowerHalf.length === 0 && upperHalf.length === 0) return false;
    // Ties prefer a bound of low degree: the lower bound is the last of its side, the upper the first.
    this.rootFunctions = [
      ...this.sortRootFunctions(lowerHalf, true),
      ...this.sortRootFunctions(upperHalf, false),
    ];
    const middle = lowerHalf.length;
    if (middle === 0) {
      this.upperRf = 0;
      interval.upper = this.rootFunctions[0].polynomial;
    } else {
      this.lowerRf = middle - 1;
      const lower = this.rootFunctions[this.lowerRf];
      interval.lower = lower.polynomial;
      if (lower.value.compare(value) === 0) {
        interval.isSection = true;
        this.upperRf = this.lowerRf;
      } else if (middle < this.rootFunctions.length) {
        this.upperRf = this.lowerRf + 1;
        interval.upper = this.rootFunctions[this.upperRf].polynomial;
      }
    }
    this.addLinearApproximations(value);
    return true;
  }

  private addPair(first: number, second: number) {
    const firstIndex = this.rootFunctions[first].levelIndex;
    const secondIndex = this.rootFunctions[second].levelIndex;
    if (firstIndex === secondIndex) return;
    const pair: [number, number] = [
      Math.min(firstIndex, secondIndex),
      Math.max(firstIndex, secondIndex),
    ];
    if (!this.pairs.some((existing) => existing[0] === pair[0] && existing[1] === pair[1]))
      this.pairs.push(pair);
  }

  // fill_relation_pairs_for_section_biggest_cell and fill_relation_sector_biggest_cell: every root
  // function is related to the bound on its side, and the two bounds to each other.
  private fillRelationPairs(isSection: boolean) {
    if (isSection) {
      for (let index = 0; index < this.lowerRf; index++) this.addPair(index, this.lowerRf);
      for (let index = this.lowerRf + 1; index < this.rootFunctions.length; index++)
        this.addPair(this.lowerRf, index);
      return;
    }
    if (this.lowerRf !== UNSET)
      for (let index = 0; index < this.lowerRf; index++) this.addPair(index, this.lowerRf);
    if (this.upperRf !== UNSET)
      for (let index = this.upperRf + 1; index < this.rootFunctions.length; index++)
        this.addPair(this.upperRf, index);
    if (this.lowerRf !== UNSET && this.upperRf !== UNSET) this.addPair(this.lowerRf, this.upperRf);
  }

  private processLevel() {
    this.pairs = [];
    // collect_non_null_witnesses: a nullified polynomial can bring back polynomials of this level.
    this.witnesses = [];
    for (let index = 0; index < this.levelPolys.length; index++) {
      const polynomial = this.levelPolys[index];
      const witness = this.chooseNonzeroCoeff(polynomial, this.level);
      if (witness === null) this.handleNullifiedPoly(polynomial);
      this.witnesses.push(witness);
      if (index + 1 === this.levelPolys.length)
        this.todo.extractPolysAtLevel(this.level, this.levelPolys);
    }
    const hasInterval = this.buildInterval();
    const interval = this.intervals[this.level];
    if (hasInterval) this.fillRelationPairs(interval.isSection);
    if (interval.isSection) {
      // add_section_projections: the section polynomial and the polynomials without roots keep their
      // leading coefficients.
      const withRoots = new Set(this.rootFunctions.map((rootFunction) => rootFunction.levelIndex));
      this.levelPolys.forEach((polynomial, index) =>
        this.addProjectionForPoly(
          polynomial,
          this.witnesses[index],
          polynomial === interval.lower || !withRoots.has(index),
        ),
      );
    } else {
      // add_sector_projections: a leading coefficient that is nonzero at the sample is the witness.
      this.levelPolys.forEach((polynomial, index) => {
        const leadingCoeff = this.pm.lc(polynomial, this.level);
        const witness = this.witnesses[index];
        const isLeadingWitness =
          witness !== null &&
          !this.pm.isConst(witness) &&
          !this.pm.isZero(leadingCoeff) &&
          this.getSign(leadingCoeff) !== 0;
        this.addProjectionForPoly(polynomial, isLeadingWitness ? null : witness, true);
      });
    }
    // add_relation_resultants, in the order of Z3's std::set of index pairs.
    this.pairs.sort((first, second) => first[0] - second[0] || first[1] - second[1]);
    for (const pair of this.pairs)
      this.requestFactorized(
        this.getPscResultant(this.levelPolys[pair[0]], this.levelPolys[pair[1]]),
      );
  }

  singleCell(polynomials: readonly Polynomial[]) {
    if (this.intervals.length === 0) return this.intervals;
    for (const polynomial of polynomials) this.requestFactorized(polynomial);
    while (!this.todo.isEmpty) {
      this.level = this.todo.getMaxVar();
      this.levelPolys = [];
      this.todo.extractPolysAtLevel(this.level, this.levelPolys);
      this.processLevel();
    }
    return this.intervals;
  }
}

// levelwise::single_cell in the linear mode, for a sample that assigns every variable below levels:
// for each variable, the interval of its sample value that keeps the polynomials sign-invariant.
export const getLinearCell = (
  pm: PolynomialManager,
  cache: PolynomialCache,
  polynomials: readonly Polynomial[],
  sample: readonly Rational[],
  levels: number,
) => new Levelwise(pm, cache, sample, levels).singleCell(polynomials);
