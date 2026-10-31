// Ported from Z3 (src/nlsat/levelwise.cpp, src/nlsat/nlsat_common.cpp,
// src/util/index_sort_with_mutations.h), MIT license, see z3-license.txt. The levelwise single cell
// construction: around the sample, for each variable below the top one, the interval of root
// functions in which the projected polynomials keep their signs and orders.
//
// Deviation: Z3 breaks two ties by polynomial id: between root functions of equal value and degree,
// and in the order of the arguments of a top-level resultant. Z3 recycles the ids of freed
// polynomials (id_gen in polynomial.cpp), so its ids depend on its reference counting. Here ids
// follow creation order. Either choice bounds a valid cell, but the bounding polynomial can be a
// different one with the same root, such as x0 for -x0. Differential tests count these as ties.
import { NlsatUnsupportedError } from "../../../../errors";
import { Rational } from "../rational";
import type { AlgebraicManager, Anum } from "./algebraic";
import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
} from "./polynomial";

// A section is the index-th root of lower. A sector lies between the lowerIndex-th root of lower
// and the upperIndex-th root of upper, and a null bound is infinite.
export interface CellInterval {
  isSection: boolean;
  lower: Polynomial | null;
  lowerIndex: number;
  upper: Polynomial | null;
  upperIndex: number;
}

// lws_spt_threshold, lws_witness_subs_lc and lws_witness_subs_disc.
export interface LevelwiseParams {
  spanningTreeThreshold: number;
  isWitnessSubsLc: boolean;
  isWitnessSubsDisc: boolean;
}

export const DEFAULT_LEVELWISE_PARAMS: LevelwiseParams = {
  spanningTreeThreshold: 4,
  isWitnessSubsLc: true,
  isWitnessSubsDisc: true,
};

interface RootFunction {
  value: Anum;
  polynomial: Polynomial;
  index: number;
  psIndex: number;
}

type ProjectionMode = "section" | "sector" | "spanningTree";

const UNSET = -1;
// m_side_mask: bit 0 for a root at or below the sample, bit 1 above, 3 for both.
const BOTH_SIDES = 3;

// stable_index_merge_sort: bottom-up, so each pair is compared once even though comparing refines
// the numbers.
export const sortIndicesStably = (
  count: number,
  isLess: (first: number, second: number) => boolean,
) => {
  let source = Array.from({ length: count }, (_, index) => index);
  for (let width = 1; width < count; width *= 2) {
    const target: number[] = [];
    for (let low = 0; low < count; low += 2 * width) {
      const middle = Math.min(low + width, count);
      const high = Math.min(low + 2 * width, count);
      let left = low;
      let right = middle;
      while (left < middle && right < high)
        target.push(isLess(source[right], source[left]) ? source[right++] : source[left++]);
      while (left < middle) target.push(source[left++]);
      while (right < high) target.push(source[right++]);
    }
    source = target;
  }
  return source;
};

// todo_set with canonicalization: the distinct primitive, sign-normalized polynomials still to
// project, in insertion order. A polynomial already in the cache goes in as it is.
export class TodoSet {
  polynomials: Polynomial[] = [];
  private inSet = new Set<number>();

  constructor(
    private pm: PolynomialManager,
    private cache: PolynomialCache,
  ) {}

  get isEmpty() {
    return this.polynomials.length === 0;
  }

  reset() {
    this.polynomials = [];
    this.inSet.clear();
  }

  contains(polynomial: Polynomial) {
    return this.inSet.has(polynomial.id);
  }

  insert(polynomial: Polynomial) {
    if (this.inSet.has(polynomial.id)) return polynomial;
    if (this.cache.contains(polynomial)) {
      this.inSet.add(polynomial.id);
      this.polynomials.push(polynomial);
      return polynomial;
    }
    const primitive =
      this.pm.isZero(polynomial) || this.pm.isConst(polynomial)
        ? polynomial
        : this.pm.pp(polynomial, this.pm.maxVar(polynomial));
    const unique = this.cache.mkUnique(this.pm.flipSignIfLmNeg(primitive));
    if (!this.inSet.has(unique.id)) {
      this.inSet.add(unique.id);
      this.polynomials.push(unique);
    }
    return unique;
  }

  getMaxVar() {
    let result = NULL_VAR;
    for (const polynomial of this.polynomials) {
      const variable = this.pm.maxVar(polynomial);
      if (result === NULL_VAR || variable > result) result = variable;
    }
    return result;
  }

  // extract_max_polys: moves the polynomials of the maximal variable to out, after clearing it.
  extractMaxPolys(out: Polynomial[]) {
    out.length = 0;
    const variable = this.getMaxVar();
    this.extractPolysAtLevel(variable, out);
    return variable;
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
  private intervals: CellInterval[];
  private todo: TodoSet;
  private level = 0;
  private levelPolys: Polynomial[] = [];
  private witnesses: (Polynomial | null)[] = [];
  private hasRoots: boolean[] = [];
  private rootFunctions: RootFunction[] = [];
  // m_rel.m_pairs: pairs of levelPolys indices, smaller first, iterated in order.
  private pairs = new Map<string, [number, number]>();
  private sideMask: number[] = [];
  private isLcOmitted: boolean[] = [];
  private lowerRf = UNSET;
  private upperRf = UNSET;

  constructor(
    private pm: PolynomialManager,
    private am: AlgebraicManager,
    private cache: PolynomialCache,
    private sample: readonly (Anum | undefined)[],
    private maxVar: number,
    private isLinear: boolean,
    private params: LevelwiseParams,
  ) {
    this.todo = new TodoSet(pm, cache);
    this.intervals = Array.from({ length: maxVar }, () => ({
      isSection: false,
      lower: null,
      lowerIndex: 0,
      upper: null,
      upperIndex: 0,
    }));
  }

  private getSign(polynomial: Polynomial) {
    return this.am.evalSignAt(this.pm, polynomial, this.sample);
  }

  private getValuesWithout(variable: number) {
    return this.sample.map((value, index) => (index === variable ? undefined : value));
  }

  private requestFactorized(polynomial: Polynomial | null) {
    if (polynomial === null || this.pm.isConst(polynomial)) return;
    for (const factor of this.cache.factor(polynomial))
      if (!this.pm.isConst(factor)) this.todo.insert(factor);
  }

  // The first element of the subresultant chain that is not zero, or null when it is constant.
  private getFirstPsc(first: Polynomial, second: Polynomial, variable: number) {
    for (const element of this.cache.pscChain(first, second, variable)) {
      if (this.pm.isZero(element)) continue;
      return this.pm.isConst(element) ? null : element;
    }
    return null;
  }

  private getPscDiscriminant(polynomial: Polynomial, variable: number) {
    if (this.pm.isConst(polynomial) || this.pm.degree(polynomial, variable) < 2) return null;
    return this.getFirstPsc(polynomial, this.pm.derivative(polynomial, variable), variable);
  }

  // handle_nullified_poly: p vanishes at the sample. Its coefficients, then its partial
  // derivatives level by level, in non-decreasing variable order, until one does not vanish.
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

  // choose_nonzero_coeff: a coefficient of p in x that is nonzero at the sample: a constant if
  // there is one, else the least by total degree, size and maximal variable. Null when p vanishes.
  private chooseNonzeroCoeff(polynomial: Polynomial, variable: number) {
    const degree = this.pm.degree(polynomial, variable);
    for (let power = 0; power <= degree; power++) {
      const coeff = this.pm.coeff(polynomial, variable, power);
      if (!this.pm.isZero(coeff) && this.pm.isConst(coeff)) return coeff;
    }
    let best: Polynomial | null = null;
    for (let power = 0; power <= degree; power++) {
      const coeff = this.pm.coeff(polynomial, variable, power);
      if (this.pm.isZero(coeff) || this.getSign(coeff) === 0) continue;
      const totalDegree = this.pm.totalDegree(coeff);
      const bestDegree = best === null ? 0 : this.pm.totalDegree(best);
      if (
        best === null ||
        totalDegree < bestDegree ||
        (totalDegree === bestDegree &&
          (coeff.size < best.size ||
            (coeff.size === best.size && this.pm.maxVar(coeff) < this.pm.maxVar(best))))
      )
        best = coeff;
    }
    return best;
  }

  private addProjectionForPoly(
    polynomial: Polynomial,
    variable: number,
    witness: Polynomial | null,
    isLcAdded: boolean,
    isDiscAdded: boolean,
  ) {
    let isWitnessAdded = witness !== null && !this.pm.isConst(witness);
    if (isLcAdded) {
      const lc = this.pm.lc(polynomial, variable);
      this.requestFactorized(lc);
      if (isWitnessAdded && this.params.isWitnessSubsDisc && this.getSign(lc) !== 0)
        isWitnessAdded = false;
    }
    if (isDiscAdded) {
      const disc = this.getPscDiscriminant(polynomial, variable);
      if (disc !== null) {
        this.requestFactorized(disc);
        if (isWitnessAdded && this.params.isWitnessSubsDisc && this.getSign(disc) !== 0)
          isWitnessAdded = false;
      }
    }
    if (isWitnessAdded) this.requestFactorized(witness);
  }

  private addPair(first: number, second: number) {
    const firstIndex = this.rootFunctions[first].psIndex;
    const secondIndex = this.rootFunctions[second].psIndex;
    if (firstIndex !== secondIndex) this.addPsPair(firstIndex, secondIndex);
  }

  private addPsPair(first: number, second: number) {
    const pair: [number, number] = first < second ? [first, second] : [second, first];
    this.pairs.set(`${pair[0]},${pair[1]}`, pair);
  }

  private getSortedPairs() {
    return [...this.pairs.values()].sort((first, second) =>
      first[0] === second[0] ? first[1] - second[1] : first[0] - second[0],
    );
  }

  private computeSideMask() {
    if (this.lowerRf === UNSET) return;
    while (this.sideMask.length < this.levelPolys.length) this.sideMask.push(0);
    this.rootFunctions.forEach((rootFunction, index) => {
      this.sideMask[rootFunction.psIndex] |= index <= this.lowerRf ? 1 : 2;
    });
  }

  private getBoundIndex(rf: number) {
    return rf === UNSET ? UNSET : this.rootFunctions[rf].psIndex;
  }

  // compute_omit_lc_both_sides: by projective delineability, the leading coefficient of a
  // polynomial with roots on both sides that does not bound the cell may be left out. With
  // isLeafRequired, only for the leaves of the resultant graph.
  private computeOmitLcBothSides(isLeafRequired: boolean) {
    this.isLcOmitted = this.levelPolys.map(() => false);
    if (this.rootFunctions.length === 0 || this.pairs.size === 0 || this.sideMask.length === 0)
      return;
    const degrees = this.levelPolys.map(() => 0);
    for (const pair of this.pairs.values()) {
      degrees[pair[0]]++;
      degrees[pair[1]]++;
    }
    const lowerBound = this.getBoundIndex(this.lowerRf);
    const upperBound = this.getBoundIndex(this.upperRf);
    for (let index = 0; index < this.levelPolys.length; index++) {
      if (this.sideMask[index] !== BOTH_SIDES) continue;
      if (isLeafRequired && degrees[index] !== 1) continue;
      if (index === lowerBound || index === upperBound) continue;
      this.isLcOmitted[index] = true;
    }
  }

  private fillRelationSector() {
    if (this.lowerRf !== UNSET)
      for (let index = 0; index < this.lowerRf; index++) this.addPair(index, this.lowerRf);
    if (this.upperRf !== UNSET)
      for (let index = this.upperRf + 1; index < this.rootFunctions.length; index++)
        this.addPair(this.upperRf, index);
    if (this.lowerRf !== UNSET && this.upperRf !== UNSET) this.addPair(this.lowerRf, this.upperRf);
  }

  private fillRelationSection() {
    for (let index = 0; index < this.lowerRf; index++) this.addPair(index, this.lowerRf);
    for (let index = this.lowerRf + 1; index < this.rootFunctions.length; index++)
      this.addPair(this.lowerRf, index);
  }

  // build_both_side_spanning_tree: by the reaching orders lemma, in order of the lower root, each
  // polynomial with roots on both sides is joined to the remaining one whose upper root is least.
  private buildBothSideSpanningTree() {
    const lowerRfs = this.levelPolys.map(() => UNSET);
    const upperRfs = this.levelPolys.map(() => UNSET);
    for (let index = 0; index <= this.lowerRf; index++)
      lowerRfs[this.rootFunctions[index].psIndex] = index;
    for (let index = this.upperRf; index < this.rootFunctions.length; index++)
      upperRfs[this.rootFunctions[index].psIndex] = index;
    const both = this.levelPolys
      .map((_, psIndex) => ({ psIndex, lowerRf: lowerRfs[psIndex], upperRf: upperRfs[psIndex] }))
      .filter((info) => this.sideMask[info.psIndex] === BOTH_SIDES)
      .sort((first, second) => first.lowerRf - second.lowerRf);
    for (let first = 0; first < both.length - 1; first++) {
      let closest = first + 1;
      for (let index = first + 2; index < both.length; index++)
        if (both[index].upperRf < both[closest].upperRf) closest = index;
      this.addPsPair(both[first].psIndex, both[closest].psIndex);
    }
  }

  private fillRelationSpanningTree() {
    this.buildBothSideSpanningTree();
    const isBoth = (rf: number) => this.sideMask[this.rootFunctions[rf].psIndex] === BOTH_SIDES;
    // connect_non_tree_to_bounds
    for (let index = 0; index < this.lowerRf; index++)
      if (!isBoth(index)) this.addPair(index, this.lowerRf);
    for (let index = this.upperRf + 1; index < this.rootFunctions.length; index++)
      if (!isBoth(index)) this.addPair(this.upperRf, index);
    // connect_tree_extremes_to_bounds
    let maxLowerBoth = UNSET;
    for (let index = 0; index < this.lowerRf; index++) if (isBoth(index)) maxLowerBoth = index;
    let minUpperBoth = UNSET;
    for (let index = this.upperRf + 1; index < this.rootFunctions.length; index++)
      if (isBoth(index)) {
        minUpperBoth = index;
        break;
      }
    if (maxLowerBoth !== UNSET) this.addPair(maxLowerBoth, this.lowerRf);
    if (minUpperBoth !== UNSET) this.addPair(this.upperRf, minUpperBoth);
    this.addPair(this.lowerRf, this.upperRf);
  }

  // isolate_roots_around_sample: the roots of p closest to v, at or below it in lower and above
  // it in upper, only the one at v for a section. Whether p has roots.
  private isolateRootsAroundSample(
    psIndex: number,
    value: Anum,
    lower: RootFunction[],
    upper: RootFunction[],
  ) {
    const polynomial = this.levelPolys[psIndex];
    const values = this.getValuesWithout(this.level);
    const mk = (root: Anum, index: number) => ({
      value: this.am.copy(root),
      polynomial,
      index,
      psIndex,
    });
    if (value.value instanceof Rational) {
      const closest = this.am.isolateRootsClosest(this.pm, polynomial, values, value.value);
      closest.roots.forEach((root, index) => {
        (this.am.compare(root, value) <= 0 ? lower : upper).push(mk(root, closest.indices[index]));
      });
      return closest.roots.length > 0;
    }
    const roots = this.am.isolateRoots(this.pm, polynomial, values);
    let lowerIndex = UNSET;
    let upperIndex = UNSET;
    let isSection = false;
    for (const [index, root] of roots.entries()) {
      const sign = this.am.compare(root, value);
      if (sign > 0) {
        upperIndex = index;
        break;
      }
      lowerIndex = index;
      if (sign === 0) {
        isSection = true;
        break;
      }
    }
    if (lowerIndex !== UNSET) {
      lower.push(mk(roots[lowerIndex], lowerIndex + 1));
      if (isSection) return roots.length > 0;
    }
    if (upperIndex !== UNSET) upper.push(mk(roots[upperIndex], upperIndex + 1));
    return roots.length > 0;
  }

  // root_function_lt: by value, ties by degree, descending for the lower partition, whose last
  // element bounds the cell, then by polynomial id.
  private isRootFunctionLess(first: RootFunction, second: RootFunction, isDegreeDesc: boolean) {
    if (first.polynomial === second.polynomial) return first.index < second.index;
    const sign = this.am.compare(first.value, second.value);
    if (sign !== 0) return sign < 0;
    const firstDegree = this.pm.degree(first.polynomial, this.level);
    const secondDegree = this.pm.degree(second.polynomial, this.level);
    if (firstDegree !== secondDegree)
      return isDegreeDesc ? firstDegree > secondDegree : firstDegree < secondDegree;
    return first.polynomial.id < second.polynomial.id;
  }

  private sortRootFunctions(rootFunctions: RootFunction[], isDegreeDesc: boolean) {
    return sortIndicesStably(rootFunctions.length, (first, second) =>
      this.isRootFunctionLess(rootFunctions[first], rootFunctions[second], isDegreeDesc),
    ).map((index) => rootFunctions[index]);
  }

  private setIntervalFromRootPartition(value: Anum, middle: number) {
    const interval = this.intervals[this.level];
    const rootFunctions = this.rootFunctions;
    if (middle === 0) {
      this.lowerRf = UNSET;
      this.upperRf = 0;
      interval.upper = rootFunctions[0].polynomial;
      interval.upperIndex = rootFunctions[0].index;
      return;
    }
    this.lowerRf = middle - 1;
    const lower = rootFunctions[middle - 1];
    interval.lower = lower.polynomial;
    interval.lowerIndex = lower.index;
    if (this.am.compare(lower.value, value) === 0) {
      interval.isSection = true;
      this.upperRf = this.lowerRf;
      return;
    }
    if (middle < rootFunctions.length) {
      this.upperRf = this.lowerRf + 1;
      interval.upper = rootFunctions[middle].polynomial;
      interval.upperIndex = rootFunctions[middle].index;
    }
  }

  private addLinearPolyFromRoot(root: Anum, isLower: boolean) {
    const value = root.value as Rational;
    const polynomial = this.pm.sub(
      this.pm.mul(this.pm.mkConst(value.den), this.pm.mkVar(this.level)),
      this.pm.mkConst(value.num),
    );
    const interval = this.intervals[this.level];
    if (isLower) {
      interval.lower = polynomial;
      interval.lowerIndex = 1;
    } else {
      interval.upper = polynomial;
      interval.upperIndex = 1;
    }
    this.levelPolys.push(polynomial);
    this.hasRoots.push(true);
    this.witnesses.push(this.chooseNonzeroCoeff(polynomial, this.level));
    return polynomial;
  }

  // add_linear_approximations: bounds of degree 2 or more are replaced by linear polynomials
  // whose roots lie between them and the sample, so the cell only shrinks.
  private addLinearApproximations(value: Anum) {
    const interval = this.intervals[this.level];
    const mkRootFunction = (polynomial: Polynomial, root: Anum) => ({
      value: this.am.copy(root),
      polynomial,
      index: 1,
      psIndex: this.levelPolys.length - 1,
    });
    if (interval.isSection) {
      if (!this.am.isRational(value))
        // Z3's NOT_IMPLEMENTED_YET exits the process here.
        throw new NlsatUnsupportedError("a linear cell around an irrational section");
      if (this.pm.totalDegree(interval.lower!) > 1) {
        const polynomial = this.addLinearPolyFromRoot(value, true);
        this.rootFunctions.splice(this.lowerRf, 0, mkRootFunction(polynomial, value));
      }
      return;
    }
    if (interval.lower !== null && this.pm.totalDegree(interval.lower) > 1) {
      const between = this.am.select(this.rootFunctions[this.lowerRf].value, value);
      const polynomial = this.addLinearPolyFromRoot(between, true);
      this.rootFunctions.splice(this.lowerRf + 1, 0, mkRootFunction(polynomial, between));
      this.lowerRf++;
      if (this.upperRf !== UNSET) this.upperRf++;
    }
    if (interval.upper !== null && this.pm.totalDegree(interval.upper) > 1) {
      const between = this.am.select(value, this.rootFunctions[this.upperRf].value);
      const polynomial = this.addLinearPolyFromRoot(between, false);
      this.rootFunctions.splice(this.upperRf, 0, mkRootFunction(polynomial, between));
    }
  }

  // build_interval: the root functions around the sample, sorted, and the interval they bound.
  private buildInterval() {
    this.rootFunctions = [];
    this.pairs.clear();
    Object.assign(this.intervals[this.level], {
      isSection: false,
      lower: null,
      lowerIndex: 0,
      upper: null,
      upperIndex: 0,
    });
    this.lowerRf = UNSET;
    this.upperRf = UNSET;
    const value = this.sample[this.level]!;
    const lower: RootFunction[] = [];
    const upper: RootFunction[] = [];
    this.hasRoots = this.levelPolys.map((_, psIndex) =>
      this.isolateRootsAroundSample(psIndex, value, lower, upper),
    );
    if (lower.length === 0 && upper.length === 0) return false;
    this.rootFunctions = [
      ...this.sortRootFunctions(lower, true),
      ...this.sortRootFunctions(upper, false),
    ];
    this.setIntervalFromRootPartition(value, lower.length);
    if (this.isLinear) this.addLinearApproximations(value);
    this.computeSideMask();
    return true;
  }

  private addRelationResultants() {
    for (const pair of this.getSortedPairs())
      this.requestFactorized(
        this.getFirstPsc(this.levelPolys[pair[0]], this.levelPolys[pair[1]], this.level),
      );
  }

  // add_adjacent_root_resultants: at the top level, the resultants of the polynomials of adjacent
  // roots.
  private addAdjacentRootResultants() {
    const rootValues: { root: Anum; polynomial: Polynomial }[] = [];
    const values = this.getValuesWithout(this.maxVar);
    this.hasRoots = this.levelPolys.map((polynomial) => {
      const roots = this.am.isolateRoots(this.pm, polynomial, values);
      for (const root of roots) rootValues.push({ root: this.am.copy(root), polynomial });
      return roots.length > 0;
    });
    if (rootValues.length < 2) return;
    const order = sortIndicesStably(
      rootValues.length,
      (first, second) => this.am.compare(rootValues[first].root, rootValues[second].root) < 0,
    );
    const added = new Set<string>();
    for (let index = 0; index + 1 < order.length; index++) {
      const first = rootValues[order[index]].polynomial;
      const second = rootValues[order[index + 1]].polynomial;
      if (first === second) continue;
      const [low, high] = first.id < second.id ? [first, second] : [second, first];
      const key = `${low.id},${high.id}`;
      if (added.has(key)) continue;
      added.add(key);
      this.requestFactorized(this.getFirstPsc(low, high, this.maxVar));
    }
  }

  // Polynomials with roots keep their order by resultants with the section's polynomial. Those
  // without need their leading coefficient and discriminant to stay without.
  private addSectionProjections() {
    const sectionPolynomial = this.intervals[this.level].lower;
    const withRoots = new Set(this.rootFunctions.map((rootFunction) => rootFunction.psIndex));
    this.levelPolys.forEach((polynomial, index) => {
      const isFull = polynomial === sectionPolynomial || !withRoots.has(index);
      this.addProjectionForPoly(polynomial, this.level, this.witnesses[index], isFull, true);
    });
  }

  private addSectorProjections() {
    this.levelPolys.forEach((polynomial, index) => {
      const isLcAdded = !(this.isLcOmitted[index] ?? false);
      let witness = this.witnesses[index];
      // coeffNonNull: a leading coefficient nonzero at the sample is its own witness.
      if (
        isLcAdded &&
        witness !== null &&
        !this.pm.isConst(witness) &&
        this.params.isWitnessSubsLc &&
        this.getSign(this.pm.lc(polynomial, this.level)) !== 0
      )
        witness = null;
      this.addProjectionForPoly(polynomial, this.level, witness, isLcAdded, true);
    });
  }

  private shouldUseSpanningTree() {
    if (this.params.spanningTreeThreshold < 2) return false;
    if (this.rootFunctions.length < 4 || this.sideMask.length === 0) return false;
    if (this.lowerRf === UNSET || this.upperRf === UNSET) return false;
    if (this.getBoundIndex(this.lowerRf) === this.getBoundIndex(this.upperRf)) return false;
    let bothCount = 0;
    for (let index = 0; index < this.levelPolys.length; index++)
      if (this.sideMask[index] === BOTH_SIDES && ++bothCount >= this.params.spanningTreeThreshold)
        return true;
    return false;
  }

  private processLevelWithMode(mode: ProjectionMode, hasInterval: boolean) {
    if (hasInterval) {
      if (mode === "section") this.fillRelationSection();
      else {
        if (mode === "sector") this.fillRelationSector();
        else this.fillRelationSpanningTree();
        this.computeSideMask();
        this.computeOmitLcBothSides(mode === "spanningTree");
      }
    }
    if (mode === "section") this.addSectionProjections();
    else this.addSectorProjections();
    this.addRelationResultants();
  }

  // collect_non_null_witnesses: a witness per polynomial, until handling the vanishing ones adds
  // no more polynomials at this level.
  private collectNonNullWitnesses() {
    this.witnesses = [];
    for (let index = 0; index < this.levelPolys.length; index++) {
      const polynomial = this.levelPolys[index];
      const witness = this.chooseNonzeroCoeff(polynomial, this.level);
      if (witness === null) this.handleNullifiedPoly(polynomial);
      this.witnesses.push(witness);
      if (index + 1 === this.levelPolys.length)
        this.todo.extractPolysAtLevel(this.level, this.levelPolys);
    }
  }

  private processLevel() {
    this.isLcOmitted = [];
    this.pairs.clear();
    this.sideMask = [];
    this.collectNonNullWitnesses();
    const hasInterval = this.buildInterval();
    const mode: ProjectionMode = this.intervals[this.level].isSection
      ? "section"
      : this.shouldUseSpanningTree()
        ? "spanningTree"
        : "sector";
    this.processLevelWithMode(mode, hasInterval);
  }

  // The top level is projected out without an interval. By projective delineability, a
  // polynomial without roots whose leading coefficient is nonzero needs only its discriminant.
  private processTopLevel() {
    this.collectNonNullWitnesses();
    this.addAdjacentRootResultants();
    this.levelPolys.forEach((polynomial, index) => {
      const lc = this.pm.lc(polynomial, this.maxVar);
      const isLcAdded = this.hasRoots[index] || this.pm.isZero(lc) || this.getSign(lc) === 0;
      if (!isLcAdded) this.witnesses[index] = null;
      this.addProjectionForPoly(polynomial, this.maxVar, this.witnesses[index], isLcAdded, true);
    });
  }

  singleCell(polynomials: readonly Polynomial[]) {
    if (this.maxVar === 0) return this.intervals;
    for (const polynomial of polynomials) this.requestFactorized(polynomial);
    if (this.todo.isEmpty) return this.intervals;
    if (this.todo.getMaxVar() === this.maxVar) {
      this.level = this.todo.extractMaxPolys(this.levelPolys);
      this.processTopLevel();
    }
    while (!this.todo.isEmpty) {
      this.level = this.todo.extractMaxPolys(this.levelPolys);
      this.processLevel();
    }
    return this.intervals;
  }
}

// levelwise::single_cell: the cell intervals of the variables below maxVar around the sample.
// isLinear forces linear bounds, for check_assignment's explanations.
export const getSingleCell = (
  pm: PolynomialManager,
  am: AlgebraicManager,
  cache: PolynomialCache,
  polynomials: readonly Polynomial[],
  maxVar: number,
  sample: readonly (Anum | undefined)[],
  isLinear: boolean,
  params = DEFAULT_LEVELWISE_PARAMS,
) => new Levelwise(pm, am, cache, sample, maxVar, isLinear, params).singleCell(polynomials);
