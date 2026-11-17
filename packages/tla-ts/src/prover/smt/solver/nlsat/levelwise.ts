import { NlsatUnsupportedError } from "../../../../errors";
import { Rational } from "../rational";
import { type AlgebraicManager, type Anum, mergeSortIndices } from "./algebraic";
import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
  PolynomialRef,
  PolynomialRefVector,
} from "./polynomial";

export class CellInterval {
  isSection = false;
  readonly lower: PolynomialRef;
  lowerIndex = 0;
  readonly upper: PolynomialRef;
  upperIndex = 0;

  constructor(pm: PolynomialManager) {
    this.lower = new PolynomialRef(pm);
    this.upper = new PolynomialRef(pm);
  }

  release() {
    this.upper.reset();
    this.lower.reset();
  }
}

interface RootFunction {
  value: Anum;
  polynomial: Polynomial;
  index: number;
  psIndex: number;
}

type ProjectionMode = "section" | "sector" | "spanningTree";

const UNSET = -1;
const BOTH_SIDES = 3;
const SPANNING_TREE_THRESHOLD = 4;

export const releaseIntervals = (intervals: readonly CellInterval[]) => {
  for (let index = intervals.length; index-- > 0;) intervals[index].release();
};

export class TodoSet {
  readonly set: PolynomialRefVector;
  private inSet: boolean[] = [];

  constructor(
    private cache: PolynomialCache,
    private isCanonicalizing: boolean,
  ) {
    this.set = new PolynomialRefVector(cache.pm);
  }

  get isEmpty() {
    return this.set.size === 0;
  }

  reset() {
    for (const polynomial of this.set.items) this.inSet[polynomial.id] = false;
    this.set.reset();
  }

  insert(polynomial: Polynomial) {
    const pm = this.cache.pm;
    if (this.inSet[polynomial.id] === true) return polynomial;
    if (this.cache.contains(polynomial)) {
      this.inSet[polynomial.id] = true;
      this.set.push(polynomial);
      return polynomial;
    }
    const pinned = new PolynomialRef(pm);
    let p = polynomial;
    if (this.isCanonicalizing) {
      if (!pm.isZero(p) && !pm.isConst(p)) {
        pinned.move(pm.pp(p, pm.maxVar(p)));
        p = pinned.get();
      } else pinned.set(p);
      p = pm.flipSignIfLmNeg(p);
      pinned.set(p);
    }
    p = this.cache.mkUnique(p);
    if (this.inSet[p.id] !== true) {
      this.inSet[p.id] = true;
      this.set.push(p);
    }
    pinned.reset();
    return p;
  }

  getMaxVar() {
    return this.cache.pm.getMaxVarOfPolys(this.set.items);
  }

  extractMaxPolys(out: PolynomialRefVector) {
    out.reset();
    const variable = this.getMaxVar();
    this.extractPolysAtLevel(variable, out);
    return variable;
  }

  extractPolysAtLevel(variable: number, out: PolynomialRefVector) {
    const pm = this.cache.pm;
    let kept = 0;
    for (let index = 0; index < this.set.size; index++) {
      const polynomial = this.set.get(index);
      if (pm.maxVar(polynomial) === variable) {
        out.push(polynomial);
        this.inSet[polynomial.id] = false;
      } else this.set.set(kept++, polynomial);
    }
    this.set.shrink(kept);
  }
}

export class Levelwise {
  readonly intervals: CellInterval[] = [];
  private level = 0;
  private lowerRf = UNSET;
  private upperRf = UNSET;
  private todo: TodoSet;
  private levelPs: PolynomialRefVector;
  private witnesses: PolynomialRef[] = [];
  private polyHasRoots: boolean[] = [];
  private pscTmp: PolynomialRefVector;
  private sideMask: number[] = [];
  private isLcOmitted: boolean[] = [];
  private degInOrderGraph: number[] = [];
  private rootFunctions: RootFunction[] = [];
  private pairs = new Map<string, [number, number]>();

  constructor(
    private pm: PolynomialManager,
    private am: AlgebraicManager,
    private cache: PolynomialCache,
    private polynomials: PolynomialRefVector,
    private maxVar: number,
    private sample: readonly (Anum | undefined)[],
    private isLinear: boolean,
  ) {
    this.todo = new TodoSet(cache, true);
    this.levelPs = new PolynomialRefVector(pm);
    this.pscTmp = new PolynomialRefVector(pm);
    for (let index = 0; index < maxVar; index++) this.intervals.push(new CellInterval(pm));
  }

  release() {
    this.pscTmp.reset();
    this.clearWitnesses();
    this.levelPs.reset();
    this.todo.set.reset();
    releaseIntervals(this.intervals);
  }

  private getSign(polynomial: Polynomial) {
    return this.am.evalSignAt(this.pm, polynomial, this.sample);
  }

  private getValuesWithout(variable: number) {
    return this.sample.map((value, index) => (index === variable ? undefined : value));
  }

  private clearWitnesses() {
    for (let index = this.witnesses.length; index-- > 0;) this.witnesses[index].reset();
    this.witnesses = [];
  }

  private handleNullifiedPoly(p: Polynomial) {
    const pm = this.pm;
    const degree = pm.degree(p, this.level);
    for (let power = 0; power <= degree; power++) {
      const coeff = new PolynomialRef(pm);
      coeff.set(pm.coeff(p, this.level, power));
      if (!pm.isZero(coeff.get()) && !pm.isConst(coeff.get())) this.requestFactorized(coeff.get());
      coeff.reset();
    }
    let curPolys = new PolynomialRefVector(pm);
    let curMinVar: number[] = [];
    curPolys.push(p);
    curMinVar.push(0);
    while (curPolys.size > 0) {
      const nextPolys = new PolynomialRefVector(pm);
      const nextMinVar: number[] = [];
      for (let index = 0; index < curPolys.size; index++) {
        const q = new PolynomialRef(pm);
        q.set(curPolys.get(index));
        const maxVar = pm.maxVar(q.get());
        if (maxVar === NULL_VAR) {
          q.reset();
          continue;
        }
        for (let x = curMinVar[index]; x <= maxVar; x++) {
          if (pm.degree(q.get(), x) === 0) continue;
          const dq = new PolynomialRef(pm);
          dq.set(pm.derivative(q.get(), x));
          if (pm.isZero(dq.get()) || pm.isConst(dq.get())) {
            dq.reset();
            continue;
          }
          if (this.getSign(dq.get()) !== 0) {
            this.requestFactorized(dq.get());
            dq.reset();
            q.reset();
            nextPolys.reset();
            curPolys.reset();
            return;
          }
          nextPolys.push(dq.get());
          nextMinVar.push(x);
          dq.reset();
        }
        q.reset();
      }
      for (let index = 0; index < nextPolys.size; index++) {
        const dq = new PolynomialRef(pm);
        dq.set(nextPolys.get(index));
        this.requestFactorized(dq.get());
        dq.reset();
      }
      curPolys.reset();
      curPolys = nextPolys;
      curMinVar = nextMinVar;
    }
  }

  private resetInterval(interval: CellInterval) {
    interval.isSection = false;
    interval.lower.reset();
    interval.upper.reset();
    interval.lowerIndex = 0;
    interval.upperIndex = 0;
  }

  private getFirstPsc(chain: PolynomialRefVector) {
    const r = new PolynomialRef(this.pm);
    for (let index = 0; index < chain.size; index++) {
      r.set(chain.get(index));
      if (this.pm.isZero(r.get())) continue;
      if (this.pm.isConst(r.get())) {
        r.reset();
        return r;
      }
      return r;
    }
    r.reset();
    return r;
  }

  private pscDiscriminant(pIn: Polynomial, x: number) {
    const pm = this.pm;
    if (pm.isZero(pIn) || pm.isConst(pIn) || pm.degree(pIn, x) < 2) return new PolynomialRef(pm);
    const p = new PolynomialRef(pm);
    p.set(pIn);
    const d = new PolynomialRef(pm);
    d.set(pm.derivative(p.get(), x));
    const chain = this.pscTmp;
    chain.reset();
    this.cache.pscChain(p.get(), d.get(), x, chain);
    const disc = this.getFirstPsc(chain);
    d.reset();
    p.reset();
    return disc;
  }

  private pscResultant(a: Polynomial, b: Polynomial, x: number) {
    const pa = new PolynomialRef(this.pm);
    pa.set(a);
    const pb = new PolynomialRef(this.pm);
    pb.set(b);
    const chain = this.pscTmp;
    chain.reset();
    this.cache.pscChain(pa.get(), pb.get(), x, chain);
    const r = this.getFirstPsc(chain);
    pb.reset();
    pa.reset();
    return r;
  }

  private requestFactorized(polynomial: Polynomial | null) {
    const pm = this.pm;
    if (polynomial === null || pm.isZero(polynomial) || pm.isConst(polynomial)) return;
    const factors = new PolynomialRefVector(pm);
    this.cache.factor(polynomial, factors);
    for (let index = 0; index < factors.size; index++) {
      const f = new PolynomialRef(pm);
      f.set(factors.get(index));
      if (!pm.isZero(f.get()) && !pm.isConst(f.get())) this.todo.insert(f.get());
      f.reset();
    }
    factors.reset();
  }

  private chooseNonzeroCoeff(p: Polynomial, x: number) {
    const pm = this.pm;
    const degree = pm.degree(p, x);
    const coeff = new PolynomialRef(pm);
    for (let power = 0; power <= degree; power++) {
      coeff.set(pm.coeff(p, x, power));
      if (pm.isZero(coeff.get())) continue;
      if (pm.isConst(coeff.get())) return coeff;
    }
    const best = new PolynomialRef(pm);
    let bestTotalDegree = 0;
    let bestSize = 0;
    let bestMaxVar = NULL_VAR;
    for (let power = 0; power <= degree; power++) {
      coeff.set(pm.coeff(p, x, power));
      const current = coeff.get();
      if (pm.isZero(current) || this.getSign(current) === 0) continue;
      const totalDegree = pm.totalDegree(current);
      const size = current.size;
      const maxVar = pm.maxVar(current);
      if (
        best.getOrNull() === null ||
        totalDegree < bestTotalDegree ||
        (totalDegree === bestTotalDegree &&
          (size < bestSize ||
            (size === bestSize && (bestMaxVar === NULL_VAR || maxVar < bestMaxVar))))
      ) {
        best.copy(coeff);
        bestTotalDegree = totalDegree;
        bestSize = size;
        bestMaxVar = maxVar;
      }
    }
    coeff.reset();
    return best;
  }

  private addProjectionForPoly(
    p: Polynomial,
    x: number,
    nonzeroCoeff: Polynomial | null,
    isLcAdded: boolean,
    isDiscAdded: boolean,
  ) {
    const pm = this.pm;
    let isNonzeroCoeffAdded = nonzeroCoeff !== null && !pm.isConst(nonzeroCoeff);
    if (isLcAdded) {
      const lc = new PolynomialRef(pm);
      lc.set(pm.coeff(p, x, pm.degree(p, x)));
      this.requestFactorized(lc.get());
      if (isNonzeroCoeffAdded && this.getSign(lc.get()) !== 0) isNonzeroCoeffAdded = false;
      lc.reset();
    }
    if (isDiscAdded) {
      const disc = new PolynomialRef(pm);
      disc.move(this.pscDiscriminant(p, x));
      const value = disc.getOrNull();
      if (value !== null) {
        this.requestFactorized(value);
        if (isNonzeroCoeffAdded && this.getSign(value) !== 0) isNonzeroCoeffAdded = false;
      }
      disc.reset();
    }
    if (isNonzeroCoeffAdded) this.requestFactorized(nonzeroCoeff);
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
    while (this.sideMask.length < this.levelPs.size) this.sideMask.push(0);
    this.rootFunctions.forEach((rootFunction, index) => {
      this.sideMask[rootFunction.psIndex] |= index <= this.lowerRf ? 1 : 2;
    });
  }

  private getBoundIndex(rootFunctionIndex: number) {
    return rootFunctionIndex === UNSET ? UNSET : this.rootFunctions[rootFunctionIndex].psIndex;
  }

  private computeResultantGraphDegree() {
    this.degInOrderGraph = Array.from({ length: this.levelPs.size }, () => 0);
    for (const pair of this.pairs.values()) {
      this.degInOrderGraph[pair[0]]++;
      this.degInOrderGraph[pair[1]]++;
    }
  }

  private computeOmitLcBothSides(isLeafRequired: boolean) {
    this.isLcOmitted = Array.from({ length: this.levelPs.size }, () => false);
    if (this.rootFunctions.length === 0 || this.pairs.size === 0 || this.sideMask.length === 0)
      return;
    if (isLeafRequired) this.computeResultantGraphDegree();
    const lowerBound = this.getBoundIndex(this.lowerRf);
    const upperBound = this.getBoundIndex(this.upperRf);
    for (let index = 0; index < this.levelPs.size; index++) {
      if (this.sideMask[index] !== BOTH_SIDES) continue;
      if (isLeafRequired && this.degInOrderGraph[index] !== 1) continue;
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
    if (this.rootFunctions.length === 0) return;
    for (let index = 0; index < this.lowerRf; index++) this.addPair(index, this.lowerRf);
    for (let index = this.lowerRf + 1; index < this.rootFunctions.length; index++)
      this.addPair(this.lowerRf, index);
  }

  private buildBothSideSpanningTree() {
    const lowerRfs = Array.from({ length: this.levelPs.size }, () => UNSET);
    const upperRfs = Array.from({ length: this.levelPs.size }, () => UNSET);
    for (let index = 0; index <= this.lowerRf; index++)
      lowerRfs[this.rootFunctions[index].psIndex] = index;
    for (let index = this.upperRf; index < this.rootFunctions.length; index++)
      upperRfs[this.rootFunctions[index].psIndex] = index;
    const both: { psIndex: number; lowerRf: number; upperRf: number }[] = [];
    for (let psIndex = 0; psIndex < this.levelPs.size; psIndex++)
      if (this.sideMask[psIndex] === BOTH_SIDES)
        both.push({ psIndex, lowerRf: lowerRfs[psIndex], upperRf: upperRfs[psIndex] });
    both.sort((first, second) => first.lowerRf - second.lowerRf);
    for (let first = 0; first < both.length - 1; first++) {
      let closest = first + 1;
      for (let index = first + 2; index < both.length; index++)
        if (both[index].upperRf < both[closest].upperRf) closest = index;
      this.addPsPair(both[first].psIndex, both[closest].psIndex);
    }
  }

  private fillRelationSpanningTree() {
    this.buildBothSideSpanningTree();
    const isBoth = (rootFunctionIndex: number) =>
      this.sideMask[this.rootFunctions[rootFunctionIndex].psIndex] === BOTH_SIDES;
    for (let index = 0; index < this.lowerRf; index++)
      if (!isBoth(index)) this.addPair(index, this.lowerRf);
    for (let index = this.upperRf + 1; index < this.rootFunctions.length; index++)
      if (!isBoth(index)) this.addPair(this.upperRf, index);
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

  private isolateRootsAroundSample(
    p: Polynomial,
    psIndex: number,
    value: Anum,
    lower: RootFunction[],
    upper: RootFunction[],
  ) {
    const values = this.getValuesWithout(this.level);
    const mkRootFunction = (root: Anum, index: number) => ({
      value: this.am.copy(root),
      polynomial: p,
      index,
      psIndex,
    });
    if (value.value instanceof Rational) {
      const closest = this.am.isolateRootsClosest(this.pm, p, values, value.value);
      closest.roots.forEach((root, index) => {
        (this.am.compare(root, value) <= 0 ? lower : upper).push(
          mkRootFunction(root, closest.indices[index]),
        );
      });
      return closest.roots.length > 0;
    }
    const roots = this.am.isolateRoots(this.pm, p, values);
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
      lower.push(mkRootFunction(roots[lowerIndex], lowerIndex + 1));
      if (isSection) return roots.length > 0;
    }
    if (upperIndex !== UNSET) upper.push(mkRootFunction(roots[upperIndex], upperIndex + 1));
    return roots.length > 0;
  }

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
    return mergeSortIndices(rootFunctions.length, (first, second) =>
      this.isRootFunctionLess(rootFunctions[first], rootFunctions[second], isDegreeDesc),
    ).map((index) => rootFunctions[index]);
  }

  private setIntervalFromRootPartition(value: Anum, middle: number) {
    const interval = this.intervals[this.level];
    const rootFunctions = this.rootFunctions;
    if (middle === 0) {
      this.lowerRf = UNSET;
      this.upperRf = 0;
      interval.upper.set(rootFunctions[0].polynomial);
      interval.upperIndex = rootFunctions[0].index;
      return;
    }
    this.lowerRf = middle - 1;
    const lower = rootFunctions[middle - 1];
    if (this.am.compare(lower.value, value) === 0) {
      interval.isSection = true;
      interval.lower.set(lower.polynomial);
      interval.lowerIndex = lower.index;
      this.upperRf = this.lowerRf;
      return;
    }
    interval.lower.set(lower.polynomial);
    interval.lowerIndex = lower.index;
    if (middle < rootFunctions.length) {
      this.upperRf = this.lowerRf + 1;
      interval.upper.set(rootFunctions[middle].polynomial);
      interval.upperIndex = rootFunctions[middle].index;
    }
  }

  private addLinearPolyFromRoot(root: Anum, isLower: boolean, p: PolynomialRef) {
    const pm = this.pm;
    const value = this.am.toRational(root);
    p.set(pm.mkVar(this.level));
    const scaled = new PolynomialRef(pm);
    scaled.set(pm.mulConst(value.den, p.get()));
    const constant = new PolynomialRef(pm);
    constant.set(pm.mkConst(value.num));
    const difference = new PolynomialRef(pm);
    difference.set(pm.sub(scaled.get(), constant.get()));
    constant.reset();
    p.move(difference);
    scaled.reset();
    const interval = this.intervals[this.level];
    if (isLower) {
      interval.lower.copy(p);
      interval.lowerIndex = 1;
    } else {
      interval.upper.copy(p);
      interval.upperIndex = 1;
    }
    this.levelPs.push(p.get());
    this.polyHasRoots.push(true);
    const witness = this.chooseNonzeroCoeff(p.get(), this.level);
    const copy = new PolynomialRef(pm);
    copy.copy(witness);
    this.witnesses.push(copy);
    witness.reset();
  }

  private addLinearApproximations(value: Anum) {
    const pLower = new PolynomialRef(this.pm);
    const pUpper = new PolynomialRef(this.pm);
    const interval = this.intervals[this.level];
    const mkRootFunction = (polynomial: Polynomial, root: Anum) => ({
      value: this.am.copy(root),
      polynomial,
      index: 1,
      psIndex: this.levelPs.size - 1,
    });
    if (interval.isSection) {
      if (!this.am.isRational(value))
        throw new NlsatUnsupportedError("a linear cell around an irrational section");
      if (this.pm.totalDegree(interval.lower.get()) > 1) {
        this.addLinearPolyFromRoot(value, true, pLower);
        this.rootFunctions.splice(this.lowerRf, 0, mkRootFunction(pLower.get(), value));
      }
      pUpper.reset();
      pLower.reset();
      return;
    }
    const lower = interval.lower.getOrNull();
    if (lower !== null && this.pm.totalDegree(lower) > 1) {
      const between = this.am.select(this.rootFunctions[this.lowerRf].value, value);
      this.addLinearPolyFromRoot(between, true, pLower);
      this.rootFunctions.splice(this.lowerRf + 1, 0, mkRootFunction(pLower.get(), between));
      this.lowerRf++;
      if (this.upperRf !== UNSET) this.upperRf++;
    }
    const upper = interval.upper.getOrNull();
    if (upper !== null && this.pm.totalDegree(upper) > 1) {
      const between = this.am.select(value, this.rootFunctions[this.upperRf].value);
      this.addLinearPolyFromRoot(between, false, pUpper);
      this.rootFunctions.splice(this.upperRf, 0, mkRootFunction(pUpper.get(), between));
    }
    pUpper.reset();
    pLower.reset();
  }

  private buildInterval() {
    this.rootFunctions = [];
    this.pairs.clear();
    this.resetInterval(this.intervals[this.level]);
    this.lowerRf = UNSET;
    this.upperRf = UNSET;
    const value = this.sample[this.level]!;
    this.polyHasRoots = Array.from({ length: this.levelPs.size }, () => false);
    const lower: RootFunction[] = [];
    const upper: RootFunction[] = [];
    for (let index = 0; index < this.levelPs.size; index++)
      this.polyHasRoots[index] = this.isolateRootsAroundSample(
        this.levelPs.get(index),
        index,
        value,
        lower,
        upper,
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
    for (const pair of this.getSortedPairs()) {
      const res = this.pscResultant(
        this.levelPs.get(pair[0]),
        this.levelPs.get(pair[1]),
        this.level,
      );
      this.requestFactorized(res.getOrNull());
      res.reset();
    }
  }

  private addAdjacentRootResultants() {
    this.polyHasRoots = Array.from({ length: this.levelPs.size }, () => false);
    const rootValues: { root: Anum; polynomial: Polynomial }[] = [];
    const values = this.getValuesWithout(this.maxVar);
    for (let index = 0; index < this.levelPs.size; index++) {
      const polynomial = this.levelPs.get(index);
      const roots = this.am.isolateRoots(this.pm, polynomial, values);
      this.polyHasRoots[index] = roots.length > 0;
      for (const root of roots) rootValues.push({ root: this.am.copy(root), polynomial });
    }
    if (rootValues.length < 2) return;
    const order = mergeSortIndices(
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
      const res = this.pscResultant(low, high, this.maxVar);
      this.requestFactorized(res.getOrNull());
      res.reset();
    }
  }

  private addSectionProjections() {
    const sectionPolynomial = this.intervals[this.level].lower.get();
    const withRoots = new Set(this.rootFunctions.map((rootFunction) => rootFunction.psIndex));
    for (let index = 0; index < this.levelPs.size; index++) {
      const p = new PolynomialRef(this.pm);
      p.set(this.levelPs.get(index));
      const witness = new PolynomialRef(this.pm);
      witness.copy(this.witnesses[index]);
      const isFull = this.levelPs.get(index) === sectionPolynomial || !withRoots.has(index);
      this.addProjectionForPoly(p.get(), this.level, witness.getOrNull(), isFull, true);
      witness.reset();
      p.reset();
    }
  }

  private addSectorProjections() {
    const pm = this.pm;
    for (let index = 0; index < this.levelPs.size; index++) {
      const p = new PolynomialRef(pm);
      p.set(this.levelPs.get(index));
      const lc = new PolynomialRef(pm);
      lc.set(pm.coeff(p.get(), this.level, pm.degree(p.get(), this.level)));
      const isLcAdded = !(this.isLcOmitted[index] ?? false);
      const witness = new PolynomialRef(pm);
      witness.copy(this.witnesses[index]);
      const value = witness.getOrNull();
      if (
        isLcAdded &&
        value !== null &&
        !pm.isConst(value) &&
        !pm.isZero(lc.get()) &&
        this.getSign(lc.get()) !== 0
      )
        witness.reset();
      this.addProjectionForPoly(p.get(), this.level, witness.getOrNull(), isLcAdded, true);
      witness.reset();
      lc.reset();
      p.reset();
    }
  }

  private shouldUseSpanningTree() {
    if (this.rootFunctions.length < 4 || this.sideMask.length === 0) return false;
    if (this.lowerRf === UNSET || this.upperRf === UNSET) return false;
    if (this.getBoundIndex(this.lowerRf) === this.getBoundIndex(this.upperRf)) return false;
    let bothCount = 0;
    for (let index = 0; index < this.levelPs.size; index++)
      if (this.sideMask[index] === BOTH_SIDES && ++bothCount >= SPANNING_TREE_THRESHOLD)
        return true;
    return false;
  }

  private clearLevelState() {
    this.isLcOmitted = [];
    this.pairs.clear();
    this.sideMask = [];
    this.degInOrderGraph = [];
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

  private collectNonNullWitnesses() {
    this.clearWitnesses();
    for (let index = 0; index < this.levelPs.size; index++) {
      const p = new PolynomialRef(this.pm);
      p.set(this.levelPs.get(index));
      const witness = this.chooseNonzeroCoeff(p.get(), this.level);
      if (witness.getOrNull() === null) this.handleNullifiedPoly(p.get());
      const copy = new PolynomialRef(this.pm);
      copy.copy(witness);
      this.witnesses.push(copy);
      if (index + 1 === this.levelPs.size) this.todo.extractPolysAtLevel(this.level, this.levelPs);
      witness.reset();
      p.reset();
    }
  }

  private processLevel() {
    this.clearLevelState();
    this.collectNonNullWitnesses();
    const hasInterval = this.buildInterval();
    this.processLevelWithMode(
      this.intervals[this.level].isSection
        ? "section"
        : this.shouldUseSpanningTree()
          ? "spanningTree"
          : "sector",
      hasInterval,
    );
  }

  private processTopLevel() {
    const pm = this.pm;
    this.collectNonNullWitnesses();
    this.addAdjacentRootResultants();
    for (let index = 0; index < this.levelPs.size; index++) {
      const p = new PolynomialRef(pm);
      p.set(this.levelPs.get(index));
      const lc = new PolynomialRef(pm);
      lc.set(pm.coeff(p.get(), this.maxVar, pm.degree(p.get(), this.maxVar)));
      let isLcAdded = true;
      if (
        !(this.polyHasRoots[index] ?? false) &&
        !pm.isZero(lc.get()) &&
        this.getSign(lc.get()) !== 0
      ) {
        isLcAdded = false;
        this.witnesses[index].reset();
      }
      this.addProjectionForPoly(
        p.get(),
        this.maxVar,
        this.witnesses[index].getOrNull(),
        isLcAdded,
        true,
      );
      lc.reset();
      p.reset();
    }
  }

  private copyIntervals() {
    return this.intervals.map((interval) => {
      const copy = new CellInterval(this.pm);
      copy.isSection = interval.isSection;
      copy.lower.copy(interval.lower);
      copy.lowerIndex = interval.lowerIndex;
      copy.upper.copy(interval.upper);
      copy.upperIndex = interval.upperIndex;
      return copy;
    });
  }

  singleCell() {
    if (this.maxVar === 0) return this.copyIntervals();
    this.todo.reset();
    for (let index = 0; index < this.polynomials.size; index++) {
      const p = new PolynomialRef(this.pm);
      p.set(this.polynomials.get(index));
      this.requestFactorized(p.get());
      p.reset();
    }
    if (this.todo.isEmpty) return this.copyIntervals();
    if (this.todo.getMaxVar() === this.maxVar) {
      this.level = this.todo.extractMaxPolys(this.levelPs);
      this.processTopLevel();
    }
    while (!this.todo.isEmpty) {
      this.level = this.todo.extractMaxPolys(this.levelPs);
      this.processLevel();
    }
    return this.copyIntervals();
  }
}
