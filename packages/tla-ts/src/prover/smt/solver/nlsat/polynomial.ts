import { SmtInvariantError } from "../../../../errors";
import { RandomGen } from "../random-gen";
import { getGcd, Rational } from "../rational";
import { BIG_PRIMES, getExtendedGcd, UpolynomialManager } from "./upolynomial";
import {
  DEFAULT_FACTOR_PARAMS,
  factorSquareFree,
  getExactSquareRoot,
  mkFactors,
} from "./upolynomial-factorization";

export const NULL_VAR = -1;

const FACTOR_EVAL_VALUES = [0n, 1n, -1n, 2n, -2n, 3n, -3n];
const FACTOR_PRIMES = [39103n, 104729n, 1000003n, 100000007n];

export interface ValueOps<T> {
  fromInteger(value: bigint): T;
  add(first: T, second: T): T;
  mul(first: T, second: T): T;
  power(base: T, exponent: number): T;
}

const RATIONAL_OPS: ValueOps<Rational> = {
  fromInteger: (value) => Rational.of(value),
  add: (first, second) => first.add(second),
  mul: (first, second) => first.mul(second),
  power: (base, exponent) => base.pow(exponent),
};

const getMonomialKey = (vars: readonly number[], degrees: readonly number[]) =>
  vars.map((variable, index) => `${variable}^${degrees[index]}`).join(",");

const normalizeZp = (value: bigint, modulus: bigint) => {
  const upper = modulus / 2n;
  const lower = modulus % 2n === 0n ? -upper + 1n : -upper;
  const rest = value % modulus;
  return rest > upper ? rest - modulus : rest < lower ? rest + modulus : rest;
};

const divMpz = (dividend: bigint, divisor: bigint) => {
  const quotient = dividend / divisor;
  if (dividend >= 0n || dividend % divisor === 0n) return quotient;
  return divisor < 0n ? quotient + 1n : quotient - 1n;
};

const modMpz = (value: bigint, modulus: bigint) => {
  const rest = value % modulus;
  return rest < 0n ? rest + (modulus < 0n ? -modulus : modulus) : rest;
};

class Monomial {
  readonly totalDegree: number;

  constructor(
    readonly id: number,
    public vars: readonly number[],
    public degrees: readonly number[],
  ) {
    let total = 0;
    for (const degree of degrees) total += degree;
    this.totalDegree = total;
  }

  get size() {
    return this.vars.length;
  }

  get maxVar() {
    return this.vars.length === 0 ? NULL_VAR : this.vars[this.vars.length - 1];
  }

  get maxVarDegree() {
    return this.vars.length === 0 ? 0 : this.degrees[this.degrees.length - 1];
  }

  degreeOf(variable: number) {
    const index = this.vars.indexOf(variable);
    return index === -1 ? 0 : this.degrees[index];
  }

  maxSmallerThan(variable: number) {
    let result = NULL_VAR;
    for (const current of this.vars) if (current < variable) result = current;
    return result;
  }

  isSquare() {
    for (const degree of this.degrees) if (degree % 2 === 1) return false;
    return true;
  }
}

const lexCompare = (first: Monomial, second: Monomial) => {
  if (first === second) return 0;
  let firstIndex = first.size - 1;
  let secondIndex = second.size - 1;
  while (firstIndex >= 0 && secondIndex >= 0) {
    const firstVar = first.vars[firstIndex];
    const secondVar = second.vars[secondIndex];
    if (firstVar === secondVar) {
      const firstDegree = first.degrees[firstIndex];
      const secondDegree = second.degrees[secondIndex];
      if (firstDegree === secondDegree) {
        firstIndex--;
        secondIndex--;
        continue;
      }
      return firstDegree < secondDegree ? -1 : 1;
    }
    return firstVar > secondVar ? 1 : -1;
  }
  return firstIndex < 0 ? -1 : 1;
};

const lexCompare2 = (first: Monomial, second: Monomial, minVar: number) => {
  if (first === second) return 0;
  let firstIndex = first.size - 1;
  let secondIndex = second.size - 1;
  let firstMinVarDegree = 0;
  let secondMinVarDegree = 0;
  while (firstIndex >= 0 && secondIndex >= 0) {
    const firstVar = first.vars[firstIndex];
    const secondVar = second.vars[secondIndex];
    if (firstVar === minVar) {
      firstMinVarDegree = first.degrees[firstIndex];
      firstIndex--;
      if (secondVar === minVar) {
        secondMinVarDegree = second.degrees[secondIndex];
        secondIndex--;
      }
      continue;
    }
    if (secondVar === minVar) {
      secondMinVarDegree = second.degrees[secondIndex];
      secondIndex--;
      continue;
    }
    if (firstVar === secondVar) {
      const firstDegree = first.degrees[firstIndex];
      const secondDegree = second.degrees[secondIndex];
      if (firstDegree === secondDegree) {
        firstIndex--;
        secondIndex--;
        continue;
      }
      return firstDegree < secondDegree ? -1 : 1;
    }
    return firstVar > secondVar ? 1 : -1;
  }
  if (firstIndex === secondIndex) return firstMinVarDegree < secondMinVarDegree ? -1 : 1;
  return firstIndex < 0 ? -1 : 1;
};

const gradedLexCompare = (first: Monomial, second: Monomial) =>
  first.totalDegree === second.totalDegree
    ? lexCompare(first, second)
    : first.totalDegree < second.totalDegree
      ? -1
      : 1;

const isPoGreater = (first: Monomial, second: Monomial) => {
  if (first.size === 0) return false;
  if (second.size === 0) return true;
  if (first.maxVar !== second.maxVar) return first.maxVar > second.maxVar;
  return first.maxVarDegree > second.maxVarDegree;
};

export class Polynomial {
  isLexSorted = false;
  refCount = 0;

  constructor(
    readonly id: number,
    readonly as: bigint[],
    readonly ms: Monomial[],
  ) {
    this.makeFirstMaximal();
  }

  makeFirstMaximal() {
    if (this.ms.length <= 1) return;
    let maxPos = 0;
    for (let index = 1; index < this.ms.length; index++)
      if (isPoGreater(this.ms[index], this.ms[maxPos])) maxPos = index;
    this.swapFirst(maxPos);
    this.isLexSorted = false;
  }

  get size() {
    return this.ms.length;
  }

  private swapFirst(position: number) {
    if (position === 0) return;
    const coeff = this.as[0];
    this.as[0] = this.as[position];
    this.as[position] = coeff;
    const monomial = this.ms[0];
    this.ms[0] = this.ms[position];
    this.ms[position] = monomial;
  }

  // Z3 sorts in place whenever it hashes or evaluates the polynomial, so later reads see this order.
  lexSort() {
    if (this.isLexSorted) return;
    this.isLexSorted = true;
    if (this.ms.length <= 1) return;
    const order = this.ms.map((_monomial, index) => index);
    order.sort((first, second) => lexCompare(this.ms[second], this.ms[first]));
    const as = order.map((index) => this.as[index]);
    const ms = order.map((index) => this.ms[index]);
    for (let index = 0; index < order.length; index++) {
      this.as[index] = as[index];
      this.ms[index] = ms[index];
    }
  }

  getGradedLexMaxPos() {
    if (this.ms.length === 0) return -1;
    let maxPos = 0;
    for (let index = 1; index < this.ms.length; index++)
      if (gradedLexCompare(this.ms[index], this.ms[maxPos]) > 0) maxPos = index;
    return maxPos;
  }

  getGradedLexMinPos() {
    let minPos = 0;
    for (let index = 1; index < this.ms.length; index++)
      if (gradedLexCompare(this.ms[index], this.ms[minPos]) < 0) minPos = index;
    return minPos;
  }

  toString() {
    if (this.ms.length === 0) return "0";
    return this.ms
      .map((monomial, index) => {
        const powers = monomial.vars.map((variable, power) =>
          monomial.degrees[power] === 1
            ? `x${variable}`
            : `x${variable}^${monomial.degrees[power]}`,
        );
        return [`${this.as[index]}`, ...powers].join("*");
      })
      .join(" + ");
  }
}

export class PolynomialRef {
  private value: Polynomial | null = null;

  constructor(private readonly pm: PolynomialManager) {}

  get() {
    const value = this.value;
    if (value === null) throw new SmtInvariantError("polynomial reference is null");
    return value;
  }

  getOrNull() {
    return this.value;
  }

  set(polynomial: Polynomial) {
    this.pm.incRef(polynomial);
    if (this.value !== null) this.pm.decRef(this.value);
    this.value = polynomial;
  }

  copy(other: PolynomialRef) {
    if (this.value === other.value) return;
    if (this.value !== null) this.pm.decRef(this.value);
    this.value = other.value;
    if (this.value !== null) this.pm.incRef(this.value);
  }

  move(other: PolynomialRef) {
    if (this === other) return;
    if (this.value !== null) this.pm.decRef(this.value);
    this.value = other.value;
    other.value = null;
  }

  swap(other: PolynomialRef) {
    const value = this.value;
    this.value = other.value;
    other.value = value;
  }

  reset() {
    if (this.value !== null) this.pm.decRef(this.value);
    this.value = null;
  }
}

export class PolynomialRefVector {
  readonly items: Polynomial[] = [];

  constructor(private readonly pm: PolynomialManager) {}

  get size() {
    return this.items.length;
  }

  get(index: number) {
    return this.items[index];
  }

  push(polynomial: Polynomial) {
    this.pm.incRef(polynomial);
    this.items.push(polynomial);
  }

  set(index: number, polynomial: Polynomial) {
    this.pm.incRef(polynomial);
    this.pm.decRef(this.items[index]);
    this.items[index] = polynomial;
  }

  append(other: PolynomialRefVector) {
    for (const polynomial of other.items) this.push(polynomial);
  }

  shrink(size: number) {
    for (let index = size; index < this.items.length; index++) this.pm.decRef(this.items[index]);
    this.items.length = size;
  }

  reset() {
    this.shrink(0);
  }
}

export class Factors {
  constant = 1n;
  readonly factors: Polynomial[] = [];
  readonly degrees: number[] = [];

  constructor(private readonly pm: PolynomialManager) {}

  push(polynomial: Polynomial, degree: number) {
    this.factors.push(polynomial);
    this.degrees.push(degree);
    this.pm.incRef(polynomial);
  }

  reset() {
    for (const factor of this.factors) this.pm.decRef(factor);
    this.factors.length = 0;
    this.degrees.length = 0;
    this.constant = 1n;
  }
}

class SomBuffer {
  as: bigint[] = [];
  ms: Monomial[] = [];
  private positions = new Map<number, number>();

  constructor(private manager: PolynomialManager) {}

  reset() {
    this.as = [];
    this.ms = [];
    this.positions.clear();
  }

  addTerm(coeff: bigint, monomial: Monomial) {
    if (coeff === 0n) return;
    const modulus = this.manager.modulus;
    const position = this.positions.get(monomial.id);
    if (position === undefined) {
      this.positions.set(monomial.id, this.ms.length);
      this.ms.push(monomial);
      this.as.push(modulus === null ? coeff : normalizeZp(coeff, modulus));
      return;
    }
    const sum = this.as[position] + coeff;
    this.as[position] = modulus === null ? sum : normalizeZp(sum, modulus);
  }

  add(polynomial: Polynomial) {
    const modulus = this.manager.modulus;
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      const position = this.positions.get(monomial.id);
      if (position === undefined) {
        this.positions.set(monomial.id, this.ms.length);
        this.ms.push(monomial);
        const coeff = polynomial.as[index];
        this.as.push(modulus === null ? coeff : normalizeZp(coeff, modulus));
        continue;
      }
      const sum = this.as[position] + polynomial.as[index];
      this.as[position] = modulus === null ? sum : normalizeZp(sum, modulus);
    }
  }

  addmul(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return;
    const modulus = this.manager.modulus;
    for (let index = 0; index < polynomial.size; index++) {
      const product = this.manager.mulMonomials(monomial, polynomial.ms[index]);
      const position = this.positions.get(product.id);
      if (position === undefined) {
        this.positions.set(product.id, this.ms.length);
        this.ms.push(product);
        const value = coeff * polynomial.as[index];
        this.as.push(modulus === null ? value : normalizeZp(value, modulus));
        continue;
      }
      const sum = this.as[position] + coeff * polynomial.as[index];
      this.as[position] = modulus === null ? sum : normalizeZp(sum, modulus);
    }
  }

  // Like Z3, zero entries of the other buffer are added too, which keeps their monomials' positions.
  addmulBuffer(coeff: bigint, monomial: Monomial, buffer: SomBuffer) {
    if (coeff === 0n) return;
    const modulus = this.manager.modulus;
    for (let index = 0; index < buffer.ms.length; index++) {
      const product = this.manager.mulMonomials(monomial, buffer.ms[index]);
      const position = this.positions.get(product.id);
      if (position === undefined) {
        this.positions.set(product.id, this.ms.length);
        this.ms.push(product);
        const value = coeff * buffer.as[index];
        this.as.push(modulus === null ? value : normalizeZp(value, modulus));
        continue;
      }
      const sum = this.as[position] + coeff * buffer.as[index];
      this.as[position] = modulus === null ? sum : normalizeZp(sum, modulus);
    }
  }

  getGradedLexMaxPos() {
    let maxPos = -1;
    for (let index = 0; index < this.as.length; index++) {
      if (this.as[index] === 0n) continue;
      if (maxPos === -1 || gradedLexCompare(this.ms[index], this.ms[maxPos]) > 0) maxPos = index;
    }
    return maxPos;
  }

  mk(isNormalized = false) {
    const as: bigint[] = [];
    const ms: Monomial[] = [];
    for (let index = 0; index < this.as.length; index++) {
      if (this.as[index] === 0n) continue;
      as.push(this.as[index]);
      ms.push(this.ms[index]);
    }
    this.reset();
    if (isNormalized) this.manager.normalizeNumerals(as);
    return this.manager.mkPolynomialCore(as, ms);
  }
}

class CheapSomBuffer {
  private as: bigint[] = [];
  private ms: Monomial[] = [];

  constructor(private manager: PolynomialManager) {}

  addReset(coeff: bigint, monomial: Monomial) {
    if (coeff === 0n) return;
    this.as.push(coeff);
    this.ms.push(monomial);
  }

  add(coeff: bigint, monomial: Monomial) {
    if (coeff === 0n) return;
    const modulus = this.manager.modulus;
    this.as.push(modulus === null ? coeff : normalizeZp(coeff, modulus));
    this.ms.push(monomial);
  }

  addmul(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return;
    const modulus = this.manager.modulus;
    for (let index = 0; index < polynomial.size; index++) {
      const value = coeff * polynomial.as[index];
      this.as.push(modulus === null ? value : normalizeZp(value, modulus));
      this.ms.push(this.manager.mulMonomials(monomial, polynomial.ms[index]));
    }
  }

  normalize() {
    this.manager.normalizeNumerals(this.as);
  }

  reset() {
    this.as = [];
    this.ms = [];
  }

  mk() {
    const result = this.manager.mkPolynomialCore(this.as, this.ms);
    this.as = [];
    this.ms = [];
    return result;
  }
}

class NewtonInterpolator {
  readonly inputs: bigint[] = [];
  private invs: bigint[] = [0n];
  private vs: PolynomialRefVector;

  constructor(private readonly pm: PolynomialManager) {
    this.vs = new PolynomialRefVector(pm);
  }

  reset() {
    this.inputs.length = 0;
    this.invs.length = 1;
    this.vs.reset();
  }

  add(input: bigint, output: Polynomial) {
    const pm = this.pm;
    const size = this.inputs.length;
    if (size === 0) {
      this.inputs.push(input);
      this.vs.push(output);
      return;
    }
    const k = size;
    let product = pm.subNumeral(input, this.inputs[0]);
    for (let index = 1; index <= k - 1; index++)
      product = pm.mulNumeral(product, pm.subNumeral(input, this.inputs[index]));
    product = pm.invNumeral(product);
    this.inputs.push(input);
    this.invs.push(product);
    const temp = new PolynomialRef(pm);
    const auxPoly = new PolynomialRef(pm);
    temp.set(this.vs.get(k - 1));
    for (let j = k - 2; j >= 0; j--) {
      const aux = pm.subNumeral(input, this.inputs[j]);
      auxPoly.set(pm.mulConst(aux, temp.get()));
      temp.set(pm.add(auxPoly.get(), this.vs.get(j)));
    }
    auxPoly.set(pm.sub(output, temp.get()));
    auxPoly.set(pm.mulConst(this.invs[size], auxPoly.get()));
    this.vs.push(auxPoly.get());
    auxPoly.reset();
    temp.reset();
  }

  mk(x: number, r: PolynomialRef) {
    const pm = this.pm;
    const u = new PolynomialRef(pm);
    const auxPoly = new PolynomialRef(pm);
    const d = this.inputs.length - 1;
    u.set(this.vs.get(d));
    for (let k = d - 1; k >= 0; k--) {
      const c = pm.negNumeral(this.inputs[k]);
      auxPoly.set(pm.mkLinear([1n], [x], c));
      auxPoly.set(pm.mul(u.get(), auxPoly.get()));
      u.set(pm.add(auxPoly.get(), this.vs.get(k)));
    }
    r.copy(u);
    auxPoly.reset();
    u.reset();
  }
}

interface SkeletonEntry {
  monomial: Monomial;
  firstPowerIndex: number;
  numPowers: number;
}

class Skeleton {
  readonly entries: SkeletonEntry[] = [];
  readonly powers: number[] = [];
  readonly origMonomials: Monomial[] = [];
  maxPowers = 0;

  constructor(pm: PolynomialManager, polynomial: Polynomial, x: number) {
    const ms = [...polynomial.ms].sort((first, second) => lexCompare2(first, second, x));
    let previous: Monomial | null = null;
    for (const origMonomial of ms) {
      const k = origMonomial.degreeOf(x);
      const monomial = k > 0 ? pm.divX(origMonomial, x) : origMonomial;
      if (monomial === previous) {
        const entry = this.entries[this.entries.length - 1];
        entry.numPowers++;
        if (entry.numPowers > this.maxPowers) this.maxPowers = entry.numPowers;
      } else {
        previous = monomial;
        this.entries.push({ monomial, firstPowerIndex: this.powers.length, numPowers: 1 });
        if (this.maxPowers === 0) this.maxPowers = 1;
      }
      this.origMonomials.push(origMonomial);
      this.powers.push(k);
    }
  }

  getEntryIndex(monomial: Monomial) {
    for (let index = 0; index < this.entries.length; index++)
      if (this.entries[index].monomial === monomial) return index;
    return -1;
  }
}

const solveLinearEquations = (
  pm: PolynomialManager,
  rows: bigint[][],
  b: bigint[],
  xs: bigint[],
) => {
  const n = rows.length;
  for (let k = 0; k < n; k++) {
    let i = k;
    for (; i < n; i++) if (rows[i][k] !== 0n) break;
    if (i === n) return false;
    const row = rows[k];
    rows[k] = rows[i];
    rows[i] = row;
    const rowK = rows[k];
    const pivot = rowK[k];
    for (let column = k + 1; column < n; column++)
      rowK[column] = pm.divNumeral(rowK[column], pivot);
    b[k] = pm.divNumeral(b[k], pivot);
    rowK[k] = pm.normalizeNumeral(1n);
    for (let other = k + 1; other < n; other++) {
      const rowI = rows[other];
      const factor = rowI[k];
      for (let column = k + 1; column < n; column++)
        rowI[column] = pm.normalizeNumeral(rowI[column] - factor * rowK[column]);
      b[other] = pm.normalizeNumeral(b[other] - factor * b[k]);
      rowI[k] = 0n;
    }
  }
  for (let k = n; k-- > 0;) {
    xs[k] = b[k];
    for (let other = k; other-- > 0;) {
      b[other] = pm.normalizeNumeral(b[other] - rows[other][k] * b[k]);
      rows[other][k] = 0n;
    }
  }
  return true;
};

class SparseInterpolator {
  private inputs: bigint[] = [];
  private outputs: bigint[] = [];

  constructor(
    private readonly pm: PolynomialManager,
    skeleton: Skeleton | null,
  ) {
    if (skeleton !== null)
      for (const entry of skeleton.entries)
        for (let index = 0; index < entry.numPowers; index++) this.outputs.push(0n);
  }

  reset() {
    this.inputs.length = 0;
  }

  isReady(skeleton: Skeleton) {
    return this.inputs.length === skeleton.maxPowers;
  }

  add(skeleton: Skeleton, input: bigint, q: Polynomial) {
    const inputIndex = this.inputs.length;
    this.inputs.push(this.pm.normalizeNumeral(input));
    for (let index = 0; index < q.size; index++) {
      const entryIndex = skeleton.getEntryIndex(q.ms[index]);
      if (entryIndex === -1) return false;
      const entry = skeleton.entries[entryIndex];
      if (inputIndex >= entry.numPowers) continue;
      this.outputs[entry.firstPowerIndex + inputIndex] = this.pm.normalizeNumeral(q.as[index]);
    }
    return true;
  }

  mk(skeleton: Skeleton, r: PolynomialRef) {
    const pm = this.pm;
    const as: bigint[] = [];
    const ms: Monomial[] = [];
    let rows: bigint[][] = [];
    let b: bigint[] = [];
    for (const entry of skeleton.entries) {
      const numPowers = entry.numPowers;
      if (rows.length !== numPowers) {
        rows = Array.from({ length: numPowers }, () => Array.from({ length: numPowers }, () => 0n));
        b = Array.from({ length: numPowers }, () => 0n);
      }
      const newAs = Array.from({ length: numPowers }, () => 0n);
      for (let index = 0; index < numPowers; index++) {
        const input = this.inputs[index];
        for (let j = 0; j < numPowers; j++)
          rows[index][j] = pm.powerNumeral(input, skeleton.powers[entry.firstPowerIndex + j]);
        b[index] = this.outputs[entry.firstPowerIndex + index];
      }
      if (!solveLinearEquations(pm, rows, b, newAs)) return false;
      for (let index = 0; index < numPowers; index++) {
        if (newAs[index] === 0n) continue;
        as.push(newAs[index]);
        ms.push(skeleton.origMonomials[entry.firstPowerIndex + index]);
      }
    }
    r.set(pm.mkPolynomial(as, ms));
    return true;
  }
}

export class PolynomialManager {
  private monomials = new Map<string, Monomial>();
  private nextPolynomialId = 0;
  private freePolynomialIds: number[] = [];
  private polynomials: (Polynomial | null)[] = [];
  modulus: bigint | null = null;
  readonly unit: Monomial;
  readonly zero: Polynomial;
  readonly one: Polynomial;
  private um = new UpolynomialManager();
  private som = new SomBuffer(this);
  private som2 = new SomBuffer(this);
  private cheap = new CheapSomBuffer(this);
  private cheap2 = new CheapSomBuffer(this);
  private random = new RandomGen(0);
  private mgcdInterpolators: NewtonInterpolator[] = [];
  private mgcdSkeletons: (Skeleton | null)[] = [];
  private iccpZpXBuffers: SomBuffer[] = [];

  constructor() {
    this.unit = this.mkMonomial([], []);
    this.zero = this.mkPolynomialCore([], []);
    this.incRef(this.zero);
    this.one = this.mkConstCore(1n);
    this.incRef(this.one);
  }

  mkMonomial(vars: readonly number[], degrees: readonly number[]) {
    const key = getMonomialKey(vars, degrees);
    const existing = this.monomials.get(key);
    if (existing !== undefined) return existing;
    const monomial = new Monomial(this.monomials.size, vars, degrees);
    this.monomials.set(key, monomial);
    return monomial;
  }

  rename(permutation: readonly number[]) {
    const monomials = new Map<string, Monomial>();
    for (const monomial of this.monomials.values()) {
      const order = monomial.vars
        .map((_variable, index) => index)
        .sort(
          (first, second) => permutation[monomial.vars[first]] - permutation[monomial.vars[second]],
        );
      const degrees = monomial.degrees;
      monomial.degrees = order.map((index) => degrees[index]);
      monomial.vars = order.map((index) => permutation[monomial.vars[index]]);
      monomials.set(getMonomialKey(monomial.vars, monomial.degrees), monomial);
    }
    this.monomials = monomials;
    for (const polynomial of this.polynomials)
      if (polynomial !== null) polynomial.makeFirstMaximal();
  }

  mkPower(variable: number, power: number) {
    return power === 0 ? this.unit : this.mkMonomial([variable], [power]);
  }

  mulMonomials(first: Monomial, second: Monomial) {
    if (first.size === 0) return second;
    if (second.size === 0) return first;
    const vars: number[] = [];
    const degrees: number[] = [];
    let firstIndex = 0;
    let secondIndex = 0;
    while (firstIndex < first.size || secondIndex < second.size) {
      const firstVar = firstIndex < first.size ? first.vars[firstIndex] : Infinity;
      const secondVar = secondIndex < second.size ? second.vars[secondIndex] : Infinity;
      if (firstVar === secondVar) {
        vars.push(firstVar);
        degrees.push(first.degrees[firstIndex++] + second.degrees[secondIndex++]);
      } else if (firstVar < secondVar) {
        vars.push(firstVar);
        degrees.push(first.degrees[firstIndex++]);
      } else {
        vars.push(secondVar);
        degrees.push(second.degrees[secondIndex++]);
      }
    }
    return this.mkMonomial(vars, degrees);
  }

  divMonomials(first: Monomial, second: Monomial) {
    const vars: number[] = [];
    const degrees: number[] = [];
    let secondIndex = 0;
    for (let index = 0; index < first.size; index++) {
      const variable = first.vars[index];
      let degree = first.degrees[index];
      if (secondIndex < second.size && second.vars[secondIndex] === variable) {
        degree -= second.degrees[secondIndex++];
        if (degree < 0) return null;
      } else if (secondIndex < second.size && second.vars[secondIndex] < variable) return null;
      if (degree > 0) {
        vars.push(variable);
        degrees.push(degree);
      }
    }
    return secondIndex < second.size ? null : this.mkMonomial(vars, degrees);
  }

  private divXk(monomial: Monomial, variable: number, power: number) {
    const vars: number[] = [];
    const degrees: number[] = [];
    for (let index = 0; index < monomial.size; index++) {
      const degree =
        monomial.vars[index] === variable
          ? monomial.degrees[index] - power
          : monomial.degrees[index];
      if (degree === 0) continue;
      vars.push(monomial.vars[index]);
      degrees.push(degree);
    }
    return this.mkMonomial(vars, degrees);
  }

  divX(monomial: Monomial, variable: number) {
    return this.divXk(monomial, variable, monomial.degreeOf(variable));
  }

  private sqrtMonomial(monomial: Monomial) {
    return this.mkMonomial(
      monomial.vars,
      monomial.degrees.map((degree) => degree / 2),
    );
  }

  normalizeNumeral(value: bigint) {
    const modulus = this.modulus;
    return modulus === null ? value : normalizeZp(value, modulus);
  }

  subNumeral(first: bigint, second: bigint) {
    return this.normalizeNumeral(first - second);
  }

  mulNumeral(first: bigint, second: bigint) {
    return this.normalizeNumeral(first * second);
  }

  negNumeral(value: bigint) {
    return this.normalizeNumeral(-value);
  }

  invNumeral(value: bigint) {
    const modulus = this.modulus;
    if (modulus === null) throw new SmtInvariantError("inverse over Z");
    return normalizeZp(getExtendedGcd(normalizeZp(value, modulus), modulus).x, modulus);
  }

  divNumeral(dividend: bigint, divisor: bigint) {
    return this.modulus === null
      ? divMpz(dividend, divisor)
      : this.mulNumeral(dividend, this.invNumeral(divisor));
  }

  powerNumeral(base: bigint, exponent: number) {
    if (exponent === 1) return this.normalizeNumeral(base);
    if (exponent === 0) return this.normalizeNumeral(1n);
    let mask = 1;
    let power = this.normalizeNumeral(base);
    let result = this.normalizeNumeral(1n);
    while (mask <= exponent) {
      if ((mask & exponent) !== 0) result = this.mulNumeral(result, power);
      power = this.mulNumeral(power, power);
      mask <<= 1;
    }
    return result;
  }

  private dividesNumeral(divisor: bigint, dividend: bigint) {
    if (this.modulus !== null && divisor !== 0n) return true;
    return divisor === 0n ? dividend === 0n : dividend % divisor === 0n;
  }

  private gcdNumerals(as: readonly bigint[]) {
    let result = 0n;
    for (const coeff of as) result = getGcd(result, coeff);
    return result;
  }

  normalizeNumerals(as: bigint[]) {
    if (as.length === 0) return;
    const g = this.gcdNumerals(as);
    if (g === 1n) return;
    for (let index = 0; index < as.length; index++) as[index] = this.divNumeral(as[index], g);
  }

  setZp(prime: bigint) {
    this.modulus = prime;
  }

  setZ() {
    this.modulus = null;
  }

  mkPolynomialCore(as: bigint[], ms: Monomial[]) {
    const id = this.freePolynomialIds.pop() ?? this.nextPolynomialId++;
    const polynomial = new Polynomial(id, as, ms);
    this.polynomials[id] = polynomial;
    return polynomial;
  }

  incRef(polynomial: Polynomial) {
    polynomial.refCount++;
  }

  decRef(polynomial: Polynomial) {
    if (--polynomial.refCount === 0) this.del(polynomial);
  }

  private del(polynomial: Polynomial) {
    this.polynomials[polynomial.id] = null;
    this.freePolynomialIds.push(polynomial.id);
  }

  private mkConstCore(value: bigint) {
    return this.mkPolynomialCore([value], [this.unit]);
  }

  mkConst(value: bigint) {
    if (value === 0n) return this.zero;
    if (value === 1n) return this.one;
    return this.mkConstCore(value);
  }

  mkVar(variable: number, degree = 1) {
    return this.mkPolynomialCore([1n], [this.mkPower(variable, degree)]);
  }

  mkPolynomial(as: readonly bigint[], ms: readonly Monomial[]) {
    this.som.reset();
    for (let index = 0; index < as.length; index++) this.som.addTerm(as[index], ms[index]);
    return this.som.mk();
  }

  private mkUnivariate(variable: number, coeffs: readonly bigint[]) {
    for (let power = coeffs.length - 1; power >= 0; power--)
      this.cheap.addReset(coeffs[power], this.mkPower(variable, power));
    return this.cheap.mk();
  }

  toPolynomial(coeffs: readonly bigint[], variable: number) {
    if (coeffs.length === 0) return this.zero;
    return this.mkUnivariate(variable, coeffs);
  }

  mkLinear(as: readonly bigint[], vars: readonly number[], constant: bigint) {
    const coeffs: bigint[] = [];
    const ms: Monomial[] = [];
    for (let index = 0; index < as.length; index++) {
      if (as[index] === 0n) continue;
      coeffs.push(as[index]);
      ms.push(this.mkMonomial([vars[index]], [1]));
    }
    if (constant !== 0n) {
      coeffs.push(constant);
      ms.push(this.unit);
    }
    return this.mkPolynomial(coeffs, ms);
  }

  isZero(polynomial: Polynomial) {
    return polynomial.size === 0;
  }

  isConst(polynomial: Polynomial) {
    return polynomial.size === 0 || (polynomial.size === 1 && polynomial.ms[0].size === 0);
  }

  isUnivariate(polynomial: Polynomial) {
    if (this.isConst(polynomial)) return true;
    const maxVar = this.maxVar(polynomial);
    for (const monomial of polynomial.ms)
      if (monomial.size > 1 || (monomial.size === 1 && monomial.vars[0] !== maxVar)) return false;
    return true;
  }

  maxVar(polynomial: Polynomial) {
    return polynomial.size === 0 ? NULL_VAR : polynomial.ms[0].maxVar;
  }

  getMaxVarOfPolys(polynomials: readonly Polynomial[]) {
    let result = NULL_VAR;
    for (const polynomial of polynomials) {
      const variable = this.maxVar(polynomial);
      if (result === NULL_VAR || variable > result) result = variable;
    }
    return result;
  }

  degree(polynomial: Polynomial, variable: number) {
    let result = 0;
    for (const monomial of polynomial.ms) result = Math.max(result, monomial.degreeOf(variable));
    return result;
  }

  totalDegree(polynomial: Polynomial) {
    let result = 0;
    for (const monomial of polynomial.ms) result = Math.max(result, monomial.totalDegree);
    return result;
  }

  eq(first: Polynomial, second: Polynomial) {
    if (first === second) return true;
    if (first.size !== second.size) return false;
    if (first.size === 0) return true;
    if (this.maxVar(first) !== this.maxVar(second)) return false;
    const coeffs = new Map<number, bigint>();
    for (let index = 0; index < first.size; index++)
      coeffs.set(first.ms[index].id, first.as[index]);
    for (let index = 0; index < second.size; index++)
      if (coeffs.get(second.ms[index].id) !== second.as[index]) return false;
    return true;
  }

  getKey(polynomial: Polynomial) {
    polynomial.lexSort();
    let key = "";
    for (let index = 0; index < polynomial.size; index++)
      key += `${polynomial.as[index]}:${polynomial.ms[index].id};`;
    return key;
  }

  addmulTerms(
    firstCoeff: bigint,
    firstMonomial: Monomial,
    first: Polynomial,
    secondCoeff: bigint,
    secondMonomial: Monomial,
    second: Polynomial,
  ) {
    this.som.reset();
    this.som.addmul(firstCoeff, firstMonomial, first);
    this.som.addmul(secondCoeff, secondMonomial, second);
    return this.som.mk();
  }

  addmul(first: Polynomial, secondCoeff: bigint, second: Polynomial) {
    return this.addmulTerms(1n, this.unit, first, secondCoeff, this.unit, second);
  }

  add(first: Polynomial, second: Polynomial) {
    return this.addmulTerms(1n, this.unit, first, 1n, this.unit, second);
  }

  sub(first: Polynomial, second: Polynomial) {
    return this.addmulTerms(1n, this.unit, first, this.normalizeNumeral(-1n), this.unit, second);
  }

  muladd(first: Polynomial, second: Polynomial, constant: bigint) {
    if (first.size === 0 || second.size === 0) return this.mkConst(constant);
    this.som.reset();
    for (let index = 0; index < first.size; index++)
      this.som.addmul(first.as[index], first.ms[index], second);
    this.som.addTerm(constant, this.unit);
    return this.som.mk();
  }

  mul(first: Polynomial, second: Polynomial) {
    return this.muladd(first, second, 0n);
  }

  mulTerm(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return this.zero;
    if (coeff === 1n && monomial === this.unit) return polynomial;
    this.cheap.addmul(coeff, monomial, polynomial);
    return this.cheap.mk();
  }

  mulConst(coeff: bigint, polynomial: Polynomial) {
    return this.mulTerm(coeff, this.unit, polynomial);
  }

  private mulScaled(coeff: bigint, first: Polynomial, second: Polynomial) {
    if (coeff === 0n || first.size === 0 || second.size === 0) return this.zero;
    this.som.reset();
    for (let index = 0; index < first.size; index++)
      this.som.addmul(this.mulNumeral(coeff, first.as[index]), first.ms[index], second);
    return this.som.mk();
  }

  private divConst(polynomial: Polynomial, divisor: bigint) {
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(this.divNumeral(polynomial.as[index], divisor), polynomial.ms[index]);
    return this.cheap.mk();
  }

  neg(polynomial: Polynomial) {
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(this.negNumeral(polynomial.as[index]), polynomial.ms[index]);
    return this.cheap.mk();
  }

  coeff(polynomial: Polynomial, variable: number, power: number) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      if (monomial.degreeOf(variable) === power)
        this.cheap.add(polynomial.as[index], this.divX(monomial, variable));
    }
    return this.cheap.mk();
  }

  coeffWithReduct(polynomial: Polynomial, variable: number, power: number, reduct: PolynomialRef) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      if (monomial.degreeOf(variable) === power)
        this.cheap.add(polynomial.as[index], this.divX(monomial, variable));
      else this.cheap2.add(polynomial.as[index], monomial);
    }
    reduct.set(this.cheap2.mk());
    return this.cheap.mk();
  }

  getConstCoeff(polynomial: Polynomial, variable: number, power: number) {
    let result = 0n;
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      if (monomial.degreeOf(variable) !== power) continue;
      if ((power > 0 && monomial.size > 1) || (power === 0 && monomial.size > 0)) return null;
      result = polynomial.as[index];
    }
    return result;
  }

  isNonzeroConstCoeff(polynomial: Polynomial, variable: number, power: number) {
    const coeff = this.getConstCoeff(polynomial, variable, power);
    return coeff !== null && coeff !== 0n;
  }

  private getUnivCoeff(polynomial: Polynomial, power: number) {
    for (let index = 0; index < polynomial.size; index++)
      if (polynomial.ms[index].totalDegree === power) return polynomial.as[index];
    return 0n;
  }

  lc(polynomial: Polynomial, variable: number) {
    return this.coeff(polynomial, variable, this.degree(polynomial, variable));
  }

  derivative(polynomial: Polynomial, variable: number) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      const degree = monomial.degreeOf(variable);
      if (degree > 0)
        this.cheap.addReset(
          this.mulNumeral(polynomial.as[index], BigInt(degree)),
          this.divXk(monomial, variable, 1),
        );
    }
    return this.cheap.mk();
  }

  flipSignIfLmNeg(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    return polynomial.as[polynomial.getGradedLexMaxPos()] < 0n ? this.neg(polynomial) : polynomial;
  }

  private getIc(polynomial: Polynomial) {
    if (polynomial.size === 0) return 0n;
    if (this.isConst(polynomial)) return polynomial.as[0];
    let result = polynomial.as[0];
    for (let index = 1; index < polynomial.size; index++) {
      if (result === 1n) return result;
      result = getGcd(result, polynomial.as[index]);
    }
    return result;
  }

  private icWithContent(polynomial: Polynomial, c: PolynomialRef) {
    if (polynomial.size === 0) {
      c.set(polynomial);
      return 0n;
    }
    if (this.isConst(polynomial)) {
      c.set(this.one);
      return polynomial.as[0];
    }
    const content = this.gcdNumerals(polynomial.as);
    if (content === 1n) {
      c.set(polynomial);
      return content;
    }
    this.cheap.reset();
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.addReset(this.divNumeral(polynomial.as[index], content), polynomial.ms[index]);
    c.set(this.cheap.mk());
    return content;
  }

  iccp(polynomial: Polynomial, variable: number, c: PolynomialRef, pp: PolynomialRef) {
    if (polynomial.size === 0) {
      c.set(this.one);
      pp.set(polynomial);
      return 0n;
    }
    if (this.isConst(polynomial)) {
      c.set(this.one);
      pp.set(this.one);
      return polynomial.as[0];
    }
    const degree = this.degree(polynomial, variable);
    if (degree === 0) {
      const integer = this.icWithContent(polynomial, c);
      pp.set(this.one);
      return integer;
    }
    const filter = Array.from({ length: degree + 1 }, () => 0);
    const powers: number[] = [];
    for (const monomial of polynomial.ms) {
      const power = monomial.degreeOf(variable);
      if (filter[power] === 0) powers.push(power);
      filter[power] += monomial.size === (power > 0 ? 1 : 0) ? 1 : 2;
    }
    for (const power of powers)
      if (filter[power] === 1) {
        const integer = this.icWithContent(polynomial, pp);
        c.set(this.one);
        return integer;
      }
    const integer = this.icWithContent(polynomial, pp);
    const ci = new PolynomialRef(this);
    c.set(this.coeff(pp.get(), variable, powers[0]));
    for (let index = 1; index < powers.length; index++) {
      ci.set(this.coeff(pp.get(), variable, powers[index]));
      this.gcd(c.get(), ci.get(), c);
      if (this.isConst(c.get())) {
        c.set(this.one);
        ci.reset();
        return integer;
      }
    }
    c.set(this.flipSignIfLmNeg(c.get()));
    pp.set(this.exactDiv(pp.get(), c.get()));
    ci.reset();
    return integer;
  }

  pp(polynomial: Polynomial, variable: number) {
    const c = new PolynomialRef(this);
    const result = new PolynomialRef(this);
    this.iccp(polynomial, variable, c, result);
    c.reset();
    return result;
  }

  isPrimitive(polynomial: Polynomial, variable: number) {
    const c = new PolynomialRef(this);
    const pp = new PolynomialRef(this);
    this.iccp(polynomial, variable, c, pp);
    const result = this.eq(polynomial, pp.get());
    pp.reset();
    c.reset();
    return result;
  }

  private gcdPrs(first: Polynomial, second: Polynomial, variable: number, r: PolynomialRef) {
    const isSwapped = this.degree(first, variable) < this.degree(second, variable);
    const u = isSwapped ? second : first;
    const v = isSwapped ? first : second;
    const cU = new PolynomialRef(this);
    const cV = new PolynomialRef(this);
    const ppU = new PolynomialRef(this);
    const ppV = new PolynomialRef(this);
    const dR = new PolynomialRef(this);
    const g = new PolynomialRef(this);
    const h = new PolynomialRef(this);
    const rem = new PolynomialRef(this);
    const newH = new PolynomialRef(this);
    const release = () => {
      newH.reset();
      rem.reset();
      h.reset();
      g.reset();
      dR.reset();
      ppV.reset();
      ppU.reset();
      cV.reset();
      cU.reset();
    };
    const iU = this.iccp(u, variable, cU, ppU);
    const iV = this.iccp(v, variable, cV, ppV);
    this.gcd(cU.get(), cV.get(), dR);
    const dA = getGcd(iU, iV);
    g.set(this.one);
    h.set(this.one);
    while (true) {
      const delta = this.degree(ppU.get(), variable) - this.degree(ppV.get(), variable);
      this.exactPseudoRemainder(ppU.get(), ppV.get(), variable, rem);
      if (this.isZero(rem.get())) {
        ppV.set(this.flipSignIfLmNeg(ppV.get()));
        r.move(this.pp(ppV.get(), variable));
        r.set(this.mulScaled(dA, dR.get(), r.get()));
        release();
        return;
      }
      if (this.isConst(rem.get())) {
        r.set(this.mulConst(dA, dR.get()));
        release();
        return;
      }
      ppU.copy(ppV);
      ppV.set(this.exactDiv(rem.get(), g.get()));
      for (let index = 0; index < delta; index++) ppV.set(this.exactDiv(ppV.get(), h.get()));
      g.set(this.lc(ppU.get(), variable));
      newH.set(this.one);
      for (let index = 0; index < delta; index++) newH.set(this.mul(newH.get(), g.get()));
      if (delta > 1)
        for (let index = 0; index < delta - 1; index++)
          newH.set(this.exactDiv(newH.get(), h.get()));
      h.copy(newH);
    }
  }

  private gcdContent(u: Polynomial, variable: number, v: Polynomial, r: PolynomialRef) {
    const cU = new PolynomialRef(this);
    const ppU = new PolynomialRef(this);
    const iU = this.iccp(u, variable, cU, ppU);
    cU.set(this.mulConst(iU, cU.get()));
    this.gcd(cU.get(), v, r);
    ppU.reset();
    cU.reset();
  }

  private euclidGcd(u: Polynomial, v: Polynomial, r: PolynomialRef) {
    if (this.isZero(u)) {
      r.set(v);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (this.isZero(v)) {
      r.set(u);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (u === v) {
      r.set(u);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (this.isConst(u) || this.isConst(v)) {
      const iV = this.getIc(v);
      const iU = this.getIc(u);
      r.set(this.mkConst(getGcd(iV, iU)));
      return;
    }
    this.gcdPrs(u, v, this.maxVar(u), r);
  }

  private craCombineImages(
    c1: Polynomial,
    b1: bigint,
    c2: Polynomial,
    b2: bigint,
    r: PolynomialRef,
  ) {
    c1.lexSort();
    c2.lexSort();
    const inverses = getExtendedGcd(b1, b2);
    const inv1 = modMpz(inverses.x, b2);
    const inv2 = modMpz(inverses.y, b1);
    const a1 = this.mulNumeral(b2, inv2);
    const a2 = this.mulNumeral(b1, inv1);
    const newBound = this.mulNumeral(b1, b2);
    const upper = divMpz(newBound, 2n);
    const add = (first: bigint, second: bigint, monomial: Monomial) => {
      const tmp3 = this.normalizeNumeral(this.mulNumeral(first, a1) + this.mulNumeral(second, a2));
      const value = modMpz(tmp3, newBound);
      this.cheap.add(value > upper ? this.subNumeral(value, newBound) : value, monomial);
    };
    let i1 = 0;
    let i2 = 0;
    while (true) {
      if (i1 === c1.size) {
        for (; i2 < c2.size; i2++) add(0n, c2.as[i2], c2.ms[i2]);
        break;
      }
      if (i2 === c2.size) {
        for (; i1 < c1.size; i1++) add(c1.as[i1], 0n, c1.ms[i1]);
        break;
      }
      const m1 = c1.ms[i1];
      const m2 = c2.ms[i2];
      const s = lexCompare(m1, m2);
      if (s === 0) {
        add(c1.as[i1], c2.as[i2], m1);
        i1++;
        i2++;
      } else if (s > 0) {
        add(c1.as[i1], 0n, m1);
        i1++;
      } else {
        add(0n, c2.as[i2], m2);
        i2++;
      }
    }
    r.set(this.cheap.mk());
    return newBound;
  }

  private uniModGcd(u: Polynomial, v: Polynomial, r: PolynomialRef) {
    const x = this.maxVar(u);
    const ppU = new PolynomialRef(this);
    const ppV = new PolynomialRef(this);
    const cU = this.icWithContent(u, ppU);
    const cV = this.icWithContent(v, ppV);
    const dA = getGcd(cU, cV);
    const dU = this.degree(ppU.get(), x);
    const dV = this.degree(ppV.get(), x);
    const lcU = this.getUnivCoeff(ppU.get(), dU);
    const lcV = this.getUnivCoeff(ppV.get(), dV);
    const lcG = getGcd(lcU, lcV);
    const uZp = new PolynomialRef(this);
    const vZp = new PolynomialRef(this);
    const cStar = new PolynomialRef(this);
    let bound = 0n;
    const q = new PolynomialRef(this);
    const candidate = new PolynomialRef(this);
    const release = () => {
      candidate.reset();
      q.reset();
      cStar.reset();
      vZp.reset();
      uZp.reset();
      ppV.reset();
      ppU.reset();
    };
    for (const prime of BIG_PRIMES) {
      const savedModulus = this.modulus;
      this.setZp(prime);
      uZp.set(this.normalize(ppU.get()));
      vZp.set(this.normalize(ppV.get()));
      const isBadPrime = this.degree(uZp.get(), x) < dU || this.degree(vZp.get(), x) < dV;
      if (!isBadPrime) {
        this.euclidGcd(uZp.get(), vZp.get(), q);
        q.set(this.mkGlexMonic(q.get()));
        q.set(this.mulConst(this.normalizeNumeral(lcG), q.get()));
      }
      this.modulus = savedModulus;
      if (isBadPrime) continue;
      if (this.isConst(q.get())) {
        // Deviation from Z3: when d_a is 1 and q is a constant other than 1, uni_mod_gcd returns q
        // (polynomial.cpp:4170), so gcd(2x - 3, 2x - 1) is 2 there. This returns 1 and frees q.
        r.set(dA === 1n && q.get().as[0] === 1n ? q.get() : this.mkConst(dA));
        release();
        return;
      }
      if (cStar.getOrNull() === null) {
        cStar.copy(q);
        bound = prime;
      } else if (this.degree(q.get(), x) < this.degree(cStar.get(), x)) {
        cStar.copy(q);
        bound = prime;
      } else bound = this.craCombineImages(q.get(), prime, cStar.get(), bound, cStar);
      candidate.move(this.pp(cStar.get(), x));
      const lcCandidate = this.getUnivCoeff(candidate.get(), this.degree(candidate.get(), x));
      if (
        this.dividesNumeral(lcCandidate, lcG) &&
        this.divides(candidate.get(), ppU.get()) &&
        this.divides(candidate.get(), ppV.get())
      ) {
        r.set(this.mulConst(dA, candidate.get()));
        r.set(this.flipSignIfLmNeg(r.get()));
        release();
        return;
      }
    }
    this.gcdPrs(u, v, x, r);
    release();
  }

  private iccpZpX(polynomial: Polynomial, x: number, c: PolynomialRef, pp: PolynomialRef): bigint {
    if (polynomial.size === 0) {
      c.set(this.one);
      pp.set(polynomial);
      return 0n;
    }
    if (this.isConst(polynomial)) {
      c.set(this.one);
      pp.set(this.one);
      return polynomial.as[0];
    }
    const degree = this.degree(polynomial, x);
    if (degree === 0) {
      const ci = this.icWithContent(polynomial, pp);
      c.set(this.one);
      return ci;
    }
    const marks = new Map<number, number>();
    const noXMonomials: Monomial[] = [];
    let minDegree = Infinity;
    for (const monomial of polynomial.ms) {
      const k = monomial.degreeOf(x);
      if (k === 0 && !marks.has(monomial.id)) {
        noXMonomials.push(monomial);
        marks.set(monomial.id, 1);
      }
      if (k < minDegree) minDegree = k;
    }
    if (minDegree > 0) {
      const xmin = new PolynomialRef(this);
      const newP = new PolynomialRef(this);
      xmin.set(this.mkVar(x, minDegree));
      newP.set(this.exactDiv(polynomial, xmin.get()));
      const ci = this.iccpZpX(newP.get(), x, c, pp);
      c.set(this.mul(xmin.get(), c.get()));
      newP.reset();
      xmin.reset();
      return ci;
    }
    const numMarked = noXMonomials.length;
    let numUnmarked = 0;
    for (const monomial of polynomial.ms) {
      if (monomial.degreeOf(x) === 0) continue;
      const reduced = this.divX(monomial, x);
      if (marks.get(reduced.id) === 1) {
        numUnmarked++;
        marks.delete(reduced.id);
      }
    }
    if (numUnmarked < numMarked) {
      const ci = this.icWithContent(polynomial, pp);
      c.set(this.one);
      return ci;
    }
    const ci = this.icWithContent(polynomial, pp);
    marks.clear();
    noXMonomials.length = 0;
    const buffers = this.iccpZpXBuffers;
    const ppValue = pp.get();
    for (let index = 0; index < polynomial.size; index++) {
      let monomial = ppValue.ms[index];
      const k = monomial.degreeOf(x);
      if (k !== 0) monomial = this.divX(monomial, x);
      let position = marks.get(monomial.id);
      if (position === undefined) {
        position = noXMonomials.length;
        noXMonomials.push(monomial);
        marks.set(monomial.id, position);
      }
      while (buffers.length <= position) buffers.push(new SomBuffer(this));
      buffers[position].addTerm(ppValue.as[index], this.mkPower(x, k));
    }
    const numMonomials = noXMonomials.length;
    const g = new PolynomialRef(this);
    const newG = new PolynomialRef(this);
    g.set(buffers[0].mk());
    for (let index = 1; index < numMonomials; index++) {
      const a = new PolynomialRef(this);
      a.set(buffers[index].mk());
      this.euclidGcd(g.get(), a.get(), newG);
      g.copy(newG);
      const isDone = this.isConst(g.get());
      a.reset();
      if (isDone) break;
    }
    if (!this.isConst(g.get())) {
      c.copy(g);
      pp.set(this.exactDiv(pp.get(), c.get()));
    } else c.set(this.one);
    for (let index = 0; index < numMonomials; index++) buffers[index].reset();
    newG.reset();
    g.reset();
    return ci;
  }

  private lcGlexZpX(polynomial: Polynomial, x: number) {
    this.som.reset();
    let maxMonomial: Monomial | null = null;
    for (let index = 0; index < polynomial.size; index++) {
      let monomial = polynomial.ms[index];
      const k = monomial.degreeOf(x);
      if (k !== 0) monomial = this.divX(monomial, x);
      if (maxMonomial === null || gradedLexCompare(monomial, maxMonomial) > 0) {
        this.som.reset();
        maxMonomial = monomial;
        this.som.addTerm(polynomial.as[index], this.mkPower(x, k));
      } else if (maxMonomial === monomial)
        this.som.addTerm(polynomial.as[index], this.mkPower(x, k));
    }
    return this.som.mk();
  }

  private primitiveZpX(polynomial: Polynomial, x: number, pp: PolynomialRef) {
    const c = new PolynomialRef(this);
    this.iccpZpX(polynomial, x, c, pp);
    c.reset();
  }

  private peekFresh(values: readonly bigint[], prime: number) {
    while (true) {
      const hi = this.random.next();
      const lo = this.random.next();
      const value = this.normalizeNumeral(BigInt(((hi << 15) | lo) % prime));
      if (!values.includes(value)) return value;
    }
  }

  private univEval(polynomial: Polynomial, value: bigint) {
    if (polynomial.size === 0) return 0n;
    if (this.isConst(polynomial)) return this.normalizeNumeral(polynomial.as[0]);
    polynomial.lexSort();
    let result = 0n;
    for (let index = 0; index < polynomial.size; index++)
      result = this.normalizeNumeral(
        result +
          this.mulNumeral(
            polynomial.as[index],
            this.powerNumeral(value, polynomial.ms[index].totalDegree),
          ),
      );
    return result;
  }

  private modGcdRec(
    u: Polynomial,
    v: Polynomial,
    prime: number,
    idx: number,
    vars: readonly number[],
    r: PolynomialRef,
  ): boolean {
    if (idx === vars.length - 1) {
      this.euclidGcd(u, v, r);
      return true;
    }
    const x = vars[idx];
    const cU = new PolynomialRef(this);
    const ppU = new PolynomialRef(this);
    const lcU = new PolynomialRef(this);
    const cV = new PolynomialRef(this);
    const ppV = new PolynomialRef(this);
    const lcV = new PolynomialRef(this);
    const cG = new PolynomialRef(this);
    const lcG = new PolynomialRef(this);
    const u1 = new PolynomialRef(this);
    const v1 = new PolynomialRef(this);
    const q = new PolynomialRef(this);
    const h = new PolynomialRef(this);
    const c = new PolynomialRef(this);
    const lcH = new PolynomialRef(this);
    try {
      const ciU = this.iccpZpX(u, x, cU, ppU);
      const ciV = this.iccpZpX(v, x, cV, ppV);
      lcU.set(this.lcGlexZpX(ppU.get(), x));
      lcV.set(this.lcGlexZpX(ppV.get(), x));
      const ciG = getGcd(ciU, ciV);
      this.euclidGcd(cU.get(), cV.get(), cG);
      this.euclidGcd(lcU.get(), lcV.get(), lcG);
      const skeleton = this.mgcdSkeletons[idx];
      while (this.mgcdInterpolators.length <= idx)
        this.mgcdInterpolators.push(new NewtonInterpolator(this));
      const interpolator = this.mgcdInterpolators[idx];
      const sparseInterpolator = new SparseInterpolator(this, skeleton);
      let minDegQ = Infinity;
      while (true) {
        let value = 0n;
        let lcGValue = 0n;
        while (true) {
          value = this.peekFresh(interpolator.inputs, prime);
          lcGValue = this.univEval(lcG.get(), value);
          if (lcGValue !== 0n) break;
        }
        u1.set(this.substitute(ppU.get(), [x], [value]));
        v1.set(this.substitute(ppV.get(), [x], [value]));
        if (!this.modGcdRec(u1.get(), v1.get(), prime, idx + 1, vars, q)) return false;
        q.set(this.mkGlexMonic(q.get()));
        q.set(this.mulConst(lcGValue, q.get()));
        const qVar = this.maxVar(q.get());
        const degQ = qVar === NULL_VAR ? 0 : this.degree(q.get(), qVar);
        if (degQ < minDegQ) {
          minDegQ = degQ;
          if (skeleton === null) {
            interpolator.reset();
            interpolator.add(value, q.get());
          } else {
            sparseInterpolator.reset();
            if (!sparseInterpolator.add(skeleton, value, q.get())) return false;
          }
        } else if (degQ === minDegQ) {
          if (skeleton === null) interpolator.add(value, q.get());
          else if (!sparseInterpolator.add(skeleton, value, q.get())) return false;
        } else continue;
        let isCandidate = false;
        if (skeleton === null) {
          interpolator.mk(x, h);
          lcH.set(this.lcGlexZpX(h.get(), x));
          if (this.eq(lcH.get(), lcG.get())) isCandidate = true;
        } else if (sparseInterpolator.isReady(skeleton)) {
          if (!sparseInterpolator.mk(skeleton, h)) return false;
          isCandidate = true;
        }
        if (!isCandidate) continue;
        if (this.degree(h.get(), x) > 0) this.primitiveZpX(h.get(), x, c);
        else c.set(this.normalize(h.get()));
        if (this.divides(c.get(), ppU.get()) && this.divides(c.get(), ppV.get())) {
          r.set(this.mul(cG.get(), c.get()));
          r.set(this.mulConst(ciG, r.get()));
        } else if (minDegQ === 0) {
          r.copy(cG);
          r.set(this.mulConst(ciG, r.get()));
        } else if (skeleton !== null) return false;
        else continue;
        if (skeleton === null) this.mgcdSkeletons[idx] = new Skeleton(this, h.get(), x);
        return true;
      }
    } finally {
      lcH.reset();
      c.reset();
      h.reset();
      q.reset();
      v1.reset();
      u1.reset();
      lcG.reset();
      cG.reset();
      lcV.reset();
      ppV.reset();
      cV.reset();
      lcU.reset();
      ppU.reset();
      cU.reset();
    }
  }

  private modGcd(
    u: Polynomial,
    v: Polynomial,
    uDegrees: readonly [number, number][],
    vDegrees: readonly [number, number][],
    r: PolynomialRef,
  ): boolean {
    const minDegrees = uDegrees.map((entry, index): [number, number] => [
      entry[0],
      Math.min(entry[1], vDegrees[index][1]),
    ]);
    minDegrees.sort((first, second) => first[1] - second[1] || first[0] - second[0]);
    this.mgcdSkeletons = minDegrees.map(() => null);
    const vars = minDegrees.map((entry) => entry[0]);
    const ppU = new PolynomialRef(this);
    const ppV = new PolynomialRef(this);
    const uZp = new PolynomialRef(this);
    const vZp = new PolynomialRef(this);
    const cStar = new PolynomialRef(this);
    const q = new PolynomialRef(this);
    const candidate = new PolynomialRef(this);
    try {
      const cU = this.icWithContent(u, ppU);
      const cV = this.icWithContent(v, ppV);
      const dA = getGcd(cU, cV);
      const lcU = ppU.get().as[ppU.get().getGradedLexMaxPos()];
      const lcV = ppV.get().as[ppV.get().getGradedLexMaxPos()];
      const lcG = getGcd(lcU, lcV);
      let bound = 0n;
      for (const prime of BIG_PRIMES) {
        const savedModulus = this.modulus;
        this.setZp(prime);
        try {
          uZp.set(this.normalize(ppU.get()));
          if (uZp.get().size !== ppU.get().size) continue;
          vZp.set(this.normalize(ppV.get()));
          if (vZp.get().size !== ppV.get().size) continue;
          if (!this.modGcdRec(uZp.get(), vZp.get(), Number(prime), 0, vars, q)) return false;
          q.set(this.mkGlexMonic(q.get()));
          q.set(this.mulConst(this.normalizeNumeral(lcG), q.get()));
        } finally {
          this.modulus = savedModulus;
        }
        if (this.isConst(q.get())) {
          r.set(this.mkConst(dA));
          return true;
        }
        if (cStar.getOrNull() === null) {
          cStar.copy(q);
          bound = prime;
        } else {
          const maxCStar = cStar.get().ms[cStar.get().getGradedLexMaxPos()];
          const maxQ = q.get().ms[q.get().getGradedLexMaxPos()];
          if (gradedLexCompare(maxQ, maxCStar) < 0) {
            cStar.copy(q);
            bound = prime;
          } else bound = this.craCombineImages(q.get(), prime, cStar.get(), bound, cStar);
        }
        candidate.set(this.normalize(cStar.get()));
        const lcCandidate = candidate.get().as[candidate.get().getGradedLexMaxPos()];
        if (
          this.dividesNumeral(lcCandidate, lcG) &&
          this.divides(candidate.get(), ppU.get()) &&
          this.divides(candidate.get(), ppV.get())
        ) {
          r.set(this.mulConst(dA, candidate.get()));
          r.set(this.flipSignIfLmNeg(r.get()));
          return true;
        }
      }
      this.gcdPrs(u, v, this.maxVar(u), r);
      return true;
    } finally {
      candidate.reset();
      q.reset();
      cStar.reset();
      vZp.reset();
      uZp.reset();
      ppV.reset();
      ppU.reset();
    }
  }

  private getVarMaxDegrees(polynomial: Polynomial) {
    return [...this.getMaxDegrees(polynomial).entries()].sort(
      (first, second) => first[0] - second[0],
    );
  }

  gcd(u: Polynomial, v: Polynomial, r: PolynomialRef) {
    if (this.isZero(u)) {
      r.set(v);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (this.isZero(v)) {
      r.set(u);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (u === v) {
      r.set(u);
      r.set(this.flipSignIfLmNeg(r.get()));
      return;
    }
    if (this.isConst(u) || this.isConst(v)) {
      const iV = this.getIc(v);
      const iU = this.getIc(u);
      r.set(this.mkConst(getGcd(iV, iU)));
      return;
    }
    const uDegrees = this.getVarMaxDegrees(u);
    const vDegrees = this.getVarMaxDegrees(v);
    const size = Math.min(uDegrees.length, vDegrees.length);
    for (let index = 0; index < size; index++) {
      const xu = uDegrees[index][0];
      const xv = vDegrees[index][0];
      if (xu < xv) {
        this.gcdContent(u, xu, v, r);
        return;
      }
      if (xu > xv) {
        this.gcdContent(v, xv, u, r);
        return;
      }
    }
    if (size < uDegrees.length) {
      this.gcdContent(u, uDegrees[size][0], v, r);
      return;
    }
    if (size < vDegrees.length) {
      this.gcdContent(v, vDegrees[size][0], u, r);
      return;
    }
    const x = uDegrees[size - 1][0];
    if (this.modulus !== null) {
      this.gcdPrs(u, v, x, r);
      return;
    }
    if (this.isUnivariate(u)) {
      this.uniModGcd(u, v, r);
      return;
    }
    if (!this.modGcd(u, v, uDegrees, vDegrees, r)) this.gcdPrs(u, v, x, r);
  }

  squareFree(polynomial: Polynomial, r: PolynomialRef) {
    if (this.isZero(polynomial)) {
      r.set(this.zero);
      return;
    }
    if (this.isConst(polynomial)) {
      r.set(polynomial);
      return;
    }
    const x = this.maxVar(polynomial);
    const c = new PolynomialRef(this);
    const pp = new PolynomialRef(this);
    const integer = this.iccp(polynomial, x, c, pp);
    const sqfC = new PolynomialRef(this);
    this.squareFree(c.get(), sqfC);
    const ppPrime = new PolynomialRef(this);
    ppPrime.set(this.derivative(pp.get(), x));
    const g = new PolynomialRef(this);
    this.gcd(pp.get(), ppPrime.get(), g);
    const release = () => {
      g.reset();
      ppPrime.reset();
      sqfC.reset();
      pp.reset();
      c.reset();
    };
    if (this.isConst(g.get())) {
      if (this.eq(sqfC.get(), c.get())) {
        r.set(polynomial);
        release();
        return;
      }
    } else pp.set(this.exactDiv(pp.get(), g.get()));
    r.set(this.mulConst(integer, sqfC.get()));
    r.set(this.mul(r.get(), pp.get()));
    release();
  }

  private squareFreeIn(polynomial: Polynomial, x: number, r: PolynomialRef) {
    if (this.isZero(polynomial)) {
      r.set(this.zero);
      return;
    }
    if (this.isConst(polynomial)) {
      r.set(polynomial);
      return;
    }
    const pPrime = new PolynomialRef(this);
    pPrime.set(this.derivative(polynomial, x));
    const g = new PolynomialRef(this);
    this.gcd(polynomial, pPrime.get(), g);
    if (this.isConst(g.get())) r.set(polynomial);
    else r.set(this.exactDiv(polynomial, g.get()));
    g.reset();
    pPrime.reset();
  }

  private isSquareFreeIn(polynomial: Polynomial, x: number) {
    const r = new PolynomialRef(this);
    this.squareFreeIn(polynomial, x, r);
    const result = polynomial === r.get();
    r.reset();
    return result;
  }

  pw(polynomial: Polynomial, k: number, r: PolynomialRef) {
    if (k === 0) {
      r.set(this.one);
      return;
    }
    if (k === 1) {
      r.set(polynomial);
      return;
    }
    const result = new PolynomialRef(this);
    result.set(polynomial);
    for (let index = 1; index < k; index++) result.set(this.mul(result.get(), polynomial));
    r.copy(result);
    result.reset();
  }

  composeXDivY(polynomial: Polynomial, y: number) {
    if (this.isConst(polynomial)) return polynomial;
    const x = this.maxVar(polynomial);
    const n = this.degree(polynomial, x);
    for (let index = 0; index < polynomial.size; index++) {
      const k = polynomial.ms[index].degreeOf(x);
      const vars: number[] = [];
      const degrees: number[] = [];
      const push = (variable: number, degree: number) => {
        if (degree === 0) return;
        vars.push(variable);
        degrees.push(degree);
      };
      if (x < y) {
        push(x, k);
        push(y, n - k);
      } else {
        push(y, n - k);
        push(x, k);
      }
      this.cheap.add(polynomial.as[index], this.mkMonomial(vars, degrees));
    }
    return this.cheap.mk();
  }

  private compose(polynomial: Polynomial, q: Polynomial, r: PolynomialRef) {
    if (this.isConst(polynomial)) {
      r.set(polynomial);
      return;
    }
    const x = this.maxVar(polynomial);
    const d = this.degree(polynomial, x);
    const degree2pos = Array.from({ length: d + 1 }, () => -1);
    for (let index = 0; index < polynomial.size; index++)
      degree2pos[polynomial.ms[index].totalDegree] = index;
    r.set(this.mkConst(polynomial.as[degree2pos[d]]));
    for (let index = 1; index <= d; index++) {
      const position = degree2pos[d - index];
      r.set(this.muladd(q, r.get(), position === -1 ? 0n : polynomial.as[position]));
    }
  }

  private mkXMinusY(x: number, y: number) {
    return this.mkLinear([1n, this.normalizeNumeral(-1n)], [x, y], 0n);
  }

  composeXMinusY(polynomial: Polynomial, y: number, r: PolynomialRef) {
    const x = this.maxVar(polynomial);
    if (y === x) {
      r.set(this.coeff(polynomial, x, 0));
      return;
    }
    const xMinusY = new PolynomialRef(this);
    xMinusY.set(this.mkXMinusY(x, y));
    this.compose(polynomial, xMinusY.get(), r);
    xMinusY.reset();
  }

  private pseudoDivisionCore(
    p: Polynomial,
    q: Polynomial,
    x: number,
    isExact: boolean,
    isQuotient: boolean,
    quotient: PolynomialRef,
    remainder: PolynomialRef,
  ) {
    const a = p;
    const b = q;
    const degA = this.degree(a, x);
    const degB = this.degree(b, x);
    if (degB === 0) {
      remainder.set(this.zero);
      if (!isQuotient) return 0;
      if (!isExact) {
        quotient.set(a);
        return 1;
      }
      const d = degA + 1;
      if (d === 1) {
        quotient.set(a);
        return d;
      }
      const bdm1 = new PolynomialRef(this);
      this.pw(b, d - 1, bdm1);
      quotient.set(this.mul(a, bdm1.get()));
      bdm1.reset();
      return d;
    }
    if (degB > degA) {
      quotient.set(this.zero);
      remainder.set(a);
    }
    const lB = new PolynomialRef(this);
    const rB = new PolynomialRef(this);
    lB.set(this.coeffWithReduct(b, x, degB, rB));
    let d = 0;
    remainder.set(a);
    quotient.set(this.zero);
    while (true) {
      const r = remainder.get();
      const degR = this.degree(r, x);
      if (degB > degR) {
        if (isExact) {
          const exactD = degA - degB + 1;
          if (d < exactD) {
            const lBE = new PolynomialRef(this);
            this.pw(lB.get(), exactD - d, lBE);
            if (isQuotient) quotient.set(this.mul(lBE.get(), quotient.get()));
            remainder.set(this.mul(lBE.get(), remainder.get()));
            lBE.reset();
          }
        }
        rB.reset();
        lB.reset();
        return d;
      }
      this.som.reset();
      this.som2.reset();
      for (let index = 0; index < r.size; index++) {
        const monomial = r.ms[index];
        const coeff = r.as[index];
        if (monomial.degreeOf(x) === degR) {
          const shifted = this.divXk(monomial, x, degB);
          if (isQuotient) this.som2.addTerm(coeff, shifted);
          this.som.addmul(this.negNumeral(coeff), shifted, rB.get());
        } else this.som.addmul(coeff, monomial, lB.get());
      }
      remainder.set(this.som.mk());
      if (isQuotient) {
        const current = quotient.get();
        for (let index = 0; index < current.size; index++)
          this.som2.addmul(current.as[index], current.ms[index], lB.get());
        quotient.set(this.som2.mk());
      }
      d++;
    }
  }

  exactPseudoRemainder(p: Polynomial, q: Polynomial, x: number, remainder: PolynomialRef) {
    const quotient = new PolynomialRef(this);
    this.pseudoDivisionCore(p, q, x, true, false, quotient, remainder);
    quotient.reset();
  }

  pseudoRemainder(p: Polynomial, q: Polynomial, x: number, remainder: PolynomialRef) {
    const quotient = new PolynomialRef(this);
    const d = this.pseudoDivisionCore(p, q, x, false, false, quotient, remainder);
    quotient.reset();
    return d;
  }

  exactPseudoDivision(
    p: Polynomial,
    q: Polynomial,
    x: number,
    quotient: PolynomialRef,
    remainder: PolynomialRef,
  ) {
    this.pseudoDivisionCore(p, q, x, true, true, quotient, remainder);
  }

  exactDiv(polynomial: Polynomial, divisor: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    const remainder = this.som;
    const quotient = this.som2;
    remainder.reset();
    quotient.reset();
    remainder.add(polynomial);
    const maxPos = divisor.getGradedLexMaxPos();
    const divisorMonomial = divisor.ms[maxPos];
    const divisorCoeff = divisor.as[maxPos];
    while (true) {
      const remainderPos = remainder.getGradedLexMaxPos();
      if (remainderPos === -1) {
        remainder.reset();
        return quotient.mk();
      }
      const monomial = this.divMonomials(remainder.ms[remainderPos], divisorMonomial);
      if (monomial === null) throw new SmtInvariantError("exact_div: the divisor does not divide");
      const coeff = this.divNumeral(remainder.as[remainderPos], divisorCoeff);
      quotient.addTerm(coeff, monomial);
      remainder.addmul(this.negNumeral(coeff), monomial, divisor);
    }
  }

  private divides(divisor: Polynomial, polynomial: Polynomial) {
    if (polynomial.size === 0) return true;
    const remainder = this.som;
    this.som.reset();
    this.som2.reset();
    remainder.add(polynomial);
    const maxPos = divisor.getGradedLexMaxPos();
    const divisorMonomial = divisor.ms[maxPos];
    const divisorCoeff = divisor.as[maxPos];
    while (true) {
      const remainderPos = remainder.getGradedLexMaxPos();
      if (remainderPos === -1) return true;
      const monomial = this.divMonomials(remainder.ms[remainderPos], divisorMonomial);
      if (monomial === null) return false;
      if (!this.dividesNumeral(divisorCoeff, remainder.as[remainderPos])) return false;
      const coeff = this.divNumeral(remainder.as[remainderPos], divisorCoeff);
      remainder.addmul(this.negNumeral(coeff), monomial, divisor);
    }
  }

  resultant(p: Polynomial, q: Polynomial, x: number, result: PolynomialRef) {
    const a = new PolynomialRef(this);
    const b = new PolynomialRef(this);
    a.set(p);
    b.set(q);
    if (this.isZero(a.get()) || this.isZero(b.get())) {
      result.set(this.zero);
      b.reset();
      a.reset();
      return;
    }
    if (this.isConst(a.get())) {
      if (this.isConst(b.get())) result.set(this.one);
      else this.pw(a.get(), this.degree(b.get(), x), result);
      b.reset();
      a.reset();
      return;
    }
    if (this.isConst(b.get())) {
      this.pw(b.get(), this.degree(a.get(), x), result);
      b.reset();
      a.reset();
      return;
    }
    const cA = new PolynomialRef(this);
    const cB = new PolynomialRef(this);
    const ppA = new PolynomialRef(this);
    const ppB = new PolynomialRef(this);
    const iA = this.iccp(a.get(), x, cA, ppA);
    const iB = this.iccp(b.get(), x, cB, ppB);
    cA.set(this.mulConst(iA, cA.get()));
    cB.set(this.mulConst(iB, cB.get()));
    const t = new PolynomialRef(this);
    this.pw(cA.get(), this.degree(b.get(), x), cA);
    this.pw(cB.get(), this.degree(a.get(), x), cB);
    t.set(this.mul(cA.get(), cB.get()));
    a.copy(ppA);
    b.copy(ppB);
    let s = 1;
    let degA = this.degree(a.get(), x);
    let degB = this.degree(b.get(), x);
    if (degA < degB) {
      a.swap(b);
      if (degA % 2 === 1 && degB % 2 === 1) s = -1;
    }
    const remainder = new PolynomialRef(this);
    const g = new PolynomialRef(this);
    const h = new PolynomialRef(this);
    const newH = new PolynomialRef(this);
    g.set(this.one);
    h.set(this.one);
    while (true) {
      degA = this.degree(a.get(), x);
      degB = this.degree(b.get(), x);
      const delta = degA - degB;
      if (degA % 2 === 1 && degB % 2 === 1) s = -s;
      this.exactPseudoRemainder(a.get(), b.get(), x, remainder);
      a.copy(b);
      b.set(this.exactDiv(remainder.get(), g.get()));
      for (let index = 0; index < delta; index++) b.set(this.exactDiv(b.get(), h.get()));
      g.set(this.lc(a.get(), x));
      newH.set(this.one);
      this.pw(g.get(), delta, newH);
      if (delta > 1)
        for (let index = 0; index < delta - 1; index++)
          newH.set(this.exactDiv(newH.get(), h.get()));
      h.copy(newH);
      if (this.degree(b.get(), x) === 0) {
        const lastDegA = this.degree(a.get(), x);
        newH.set(this.lc(b.get(), x));
        this.pw(newH.get(), lastDegA, newH);
        if (lastDegA > 1)
          for (let index = 0; index < lastDegA - 1; index++)
            newH.set(this.exactDiv(newH.get(), h.get()));
        h.copy(newH);
        result.set(this.mul(t.get(), h.get()));
        if (s < 0) result.set(this.neg(result.get()));
        newH.reset();
        h.reset();
        g.reset();
        remainder.reset();
        t.reset();
        ppB.reset();
        ppA.reset();
        cB.reset();
        cA.reset();
        b.reset();
        a.reset();
        return;
      }
    }
  }

  discriminant(polynomial: Polynomial, x: number, r: PolynomialRef) {
    const pPrime = new PolynomialRef(this);
    const m = this.degree(polynomial, x);
    if (m === 0) {
      r.set(this.zero);
      pPrime.reset();
      return;
    }
    pPrime.set(this.derivative(polynomial, x));
    this.resultant(polynomial, pPrime.get(), x, r);
    const isNegated = (m * (m - 1)) % 4 !== 0;
    const lc = this.getConstCoeff(polynomial, x, m);
    if (lc !== null) r.set(this.divConst(r.get(), isNegated ? this.negNumeral(lc) : lc));
    else {
      if (isNegated) r.set(this.neg(r.get()));
      const c = new PolynomialRef(this);
      c.set(this.coeff(polynomial, x, m));
      r.set(this.exactDiv(r.get(), c.get()));
      c.reset();
    }
    pPrime.reset();
  }

  private seLazard(d: number, lcSd: Polynomial, sd1: Polynomial, x: number, se: PolynomialRef) {
    let n = d - this.degree(sd1, x) - 1;
    if (n === 0) {
      se.set(sd1);
      return;
    }
    const xLc = new PolynomialRef(this);
    xLc.set(this.lc(sd1, x));
    const y = lcSd;
    let a = 1 << (31 - Math.clz32(n));
    const c = new PolynomialRef(this);
    c.copy(xLc);
    n -= a;
    while (a !== 1) {
      a /= 2;
      c.set(this.mul(c.get(), c.get()));
      c.set(this.exactDiv(c.get(), y));
      if (n >= a) {
        c.set(this.mul(c.get(), xLc.get()));
        c.set(this.exactDiv(c.get(), y));
        n -= a;
      }
    }
    se.set(this.mul(c.get(), sd1));
    se.set(this.exactDiv(se.get(), y));
    c.reset();
    xLc.reset();
  }

  private optimizedSe1(
    d: number,
    e: number,
    a: Polynomial,
    sd1: Polynomial,
    se: Polynomial,
    s: Polynomial,
    x: number,
    se1: PolynomialRef,
  ) {
    const cD1 = new PolynomialRef(this);
    const sE = new PolynomialRef(this);
    const xJ = new PolynomialRef(this);
    const tmp = new PolynomialRef(this);
    cD1.set(this.lc(sd1, x));
    sE.set(this.lc(se, x));
    const h = new PolynomialRefVector(this);
    xJ.set(this.one);
    for (let j = 0; j <= e - 1; j++) {
      xJ.set(this.mkVar(x, j));
      h.push(this.mul(sE.get(), xJ.get()));
    }
    xJ.set(this.mkVar(x, e));
    xJ.set(this.mul(sE.get(), xJ.get()));
    h.push(this.sub(xJ.get(), se));
    const xPol = new PolynomialRef(this);
    const xH = new PolynomialRef(this);
    const xHe = new PolynomialRef(this);
    xPol.set(this.mkVar(x, 1));
    for (let j = e + 1; j <= d - 1; j++) {
      xH.set(this.mul(xPol.get(), h.get(j - 1)));
      xHe.set(this.coeff(xH.get(), x, e));
      tmp.set(this.mul(xHe.get(), sd1));
      tmp.set(this.exactDiv(tmp.get(), cD1.get()));
      h.push(this.sub(xH.get(), tmp.get()));
    }
    const dPolynomial = new PolynomialRef(this);
    dPolynomial.set(this.zero);
    for (let j = 0; j < d; j++) {
      tmp.set(this.coeff(a, x, j));
      tmp.set(this.mul(tmp.get(), h.get(j)));
      dPolynomial.set(this.add(dPolynomial.get(), tmp.get()));
    }
    const lcA = new PolynomialRef(this);
    lcA.set(this.lc(a, x));
    dPolynomial.set(this.exactDiv(dPolynomial.get(), lcA.get()));
    xH.set(this.mul(xPol.get(), h.get(d - 1)));
    xHe.set(this.coeff(xH.get(), x, e));
    xHe.set(this.mul(xHe.get(), sd1));
    se1.set(this.add(xH.get(), dPolynomial.get()));
    se1.set(this.mul(cD1.get(), se1.get()));
    se1.set(this.sub(se1.get(), xHe.get()));
    se1.set(this.exactDiv(se1.get(), s));
    if ((d - e + 1) % 2 === 1) se1.set(this.neg(se1.get()));
    lcA.reset();
    dPolynomial.reset();
    xHe.reset();
    xH.reset();
    xPol.reset();
    h.reset();
    tmp.reset();
    xJ.reset();
    sE.reset();
    cD1.reset();
  }

  private pscChainOptimizedCore(
    p: Polynomial,
    q: Polynomial,
    x: number,
    chain: PolynomialRefVector,
  ) {
    const degP = this.degree(p, x);
    const degQ = this.degree(q, x);
    const a = new PolynomialRef(this);
    const b = new PolynomialRef(this);
    const c = new PolynomialRef(this);
    const minusQ = new PolynomialRef(this);
    const lcQ = new PolynomialRef(this);
    const ps = new PolynomialRef(this);
    lcQ.set(this.lc(q, x));
    const s = new PolynomialRef(this);
    const release = () => {
      s.reset();
      ps.reset();
      lcQ.reset();
      minusQ.reset();
      c.reset();
      b.reset();
      a.reset();
    };
    this.pw(lcQ.get(), degP - degQ, s);
    minusQ.set(this.neg(q));
    a.set(q);
    this.exactPseudoRemainder(p, minusQ.get(), x, b);
    while (true) {
      const d = this.degree(a.get(), x);
      const e = this.degree(b.get(), x);
      if (this.isZero(b.get())) {
        release();
        return;
      }
      ps.set(this.coeff(b.get(), x, d - 1));
      if (!this.isZero(ps.get())) chain.push(ps.get());
      const delta = d - e;
      if (delta > 1) {
        this.seLazard(d, s.get(), b.get(), x, c);
        ps.set(this.coeff(c.get(), x, e));
        if (!this.isZero(ps.get())) chain.push(ps.get());
      } else c.copy(b);
      if (e === 0) {
        release();
        return;
      }
      this.optimizedSe1(d, e, a.get(), b.get(), c.get(), s.get(), x, b);
      a.copy(c);
      s.set(this.lc(a.get(), x));
    }
  }

  pscChain(p: Polynomial, q: Polynomial, x: number, chain: PolynomialRefVector) {
    chain.reset();
    if (this.degree(p, x) >= this.degree(q, x)) this.pscChainOptimizedCore(p, q, x, chain);
    else this.pscChainOptimizedCore(q, p, x, chain);
    if (chain.size === 0) chain.push(this.zero);
    chain.items.reverse();
  }

  normalize(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    const modulus = this.modulus;
    if (modulus !== null) {
      let index = 0;
      for (; index < polynomial.size; index++)
        if (normalizeZp(polynomial.as[index], modulus) !== polynomial.as[index]) break;
      if (index < polynomial.size) {
        this.cheap.reset();
        for (let other = 0; other < polynomial.size; other++)
          this.cheap.addReset(normalizeZp(polynomial.as[other], modulus), polynomial.ms[other]);
        this.cheap.normalize();
        return this.cheap.mk();
      }
    }
    const g = this.gcdNumerals(polynomial.as);
    if (g === 1n) return polynomial;
    this.cheap.reset();
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.addReset(this.divNumeral(polynomial.as[index], g), polynomial.ms[index]);
    return this.cheap.mk();
  }

  private getTermSquareRoot(polynomial: Polynomial, position: number) {
    if (!polynomial.ms[position].isSquare()) return null;
    return getExactSquareRoot(polynomial.as[position]);
  }

  sqrt(polynomial: Polynomial, r: PolynomialRef) {
    if (polynomial.size === 0) {
      r.set(polynomial);
      return true;
    }
    if (this.getTermSquareRoot(polynomial, polynomial.getGradedLexMinPos()) === null) return false;
    const maxPos = polynomial.getGradedLexMaxPos();
    const a = this.getTermSquareRoot(polynomial, maxPos);
    if (a === null) return false;
    const m1 = this.sqrtMonomial(polynomial.ms[maxPos]);
    const root = this.som;
    const rest = this.som2;
    root.reset();
    rest.reset();
    const twoA = a * 2n;
    root.addTerm(a, m1);
    for (let index = 0; index < polynomial.size; index++)
      if (index !== maxPos) rest.addTerm(polynomial.as[index], polynomial.ms[index]);
    while (true) {
      const restMax = rest.getGradedLexMaxPos();
      if (restMax === -1) {
        r.set(root.mk());
        rest.reset();
        return true;
      }
      const monomial = this.divMonomials(rest.ms[restMax], m1);
      if (monomial === null || !this.dividesNumeral(twoA, rest.as[restMax])) {
        rest.reset();
        root.reset();
        return false;
      }
      const coeff = this.divNumeral(rest.as[restMax], twoA);
      const rootSize = root.as.length;
      for (let index = 0; index < rootSize; index++) {
        if (root.as[index] === 0n) continue;
        rest.addTerm(-(root.as[index] * coeff * 2n), this.mulMonomials(root.ms[index], monomial));
      }
      rest.addTerm(-(coeff * coeff), this.mulMonomials(monomial, monomial));
      root.addTerm(coeff, monomial);
    }
  }

  getVars(polynomial: Polynomial) {
    const vars: number[] = [];
    for (const monomial of polynomial.ms)
      for (const variable of monomial.vars) if (!vars.includes(variable)) vars.push(variable);
    return vars;
  }

  private getMaxDegrees(polynomial: Polynomial) {
    const degrees = new Map<number, number>();
    for (const monomial of polynomial.ms)
      for (let index = 0; index < monomial.size; index++) {
        const variable = monomial.vars[index];
        if (monomial.degrees[index] > (degrees.get(variable) ?? 0))
          degrees.set(variable, monomial.degrees[index]);
      }
    return degrees;
  }

  substitute(polynomial: Polynomial, vars: readonly number[], values: readonly bigint[]) {
    this.som.reset();
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      let coeff = this.normalizeNumeral(polynomial.as[index]);
      const keptVars: number[] = [];
      const keptDegrees: number[] = [];
      for (let power = 0; power < monomial.size; power++) {
        const position = vars.indexOf(monomial.vars[power]);
        if (position === -1) {
          keptVars.push(monomial.vars[power]);
          keptDegrees.push(monomial.degrees[power]);
        } else
          coeff = this.mulNumeral(
            this.powerNumeral(values[position], monomial.degrees[power]),
            coeff,
          );
      }
      this.som.addTerm(coeff, this.mkMonomial(keptVars, keptDegrees));
    }
    return this.som.mk();
  }

  translate(polynomial: Polynomial, variable: number, value: bigint) {
    const degree = this.degree(polynomial, variable);
    if (degree === 0 || value === 0n) return polynomial;
    const coeffs = Array.from({ length: degree + 1 }, () => new SomBuffer(this));
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      coeffs[monomial.degreeOf(variable)].addTerm(
        polynomial.as[index],
        this.divX(monomial, variable),
      );
    }
    for (let step = 1; step <= degree; step++)
      for (let power = degree - step; power <= degree - 1; power++)
        coeffs[power].addmulBuffer(value, this.unit, coeffs[power + 1]);
    this.som.reset();
    for (let power = 0; power <= degree; power++)
      this.som.addmulBuffer(1n, this.mkPower(variable, power), coeffs[power]);
    return this.som.mk();
  }

  substituteRational(polynomial: Polynomial, values: readonly (Rational | undefined)[]) {
    const maxDegrees = this.getMaxDegrees(polynomial);
    if (![...maxDegrees.keys()].some((variable) => values[variable] !== undefined))
      return polynomial;
    this.som.reset();
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      let coeff = polynomial.as[index];
      const keptVars: number[] = [];
      const keptDegrees: number[] = [];
      for (let power = 0; power < monomial.size; power++) {
        const variable = monomial.vars[power];
        const degree = monomial.degrees[power];
        const value = values[variable];
        if (value === undefined) {
          keptVars.push(variable);
          keptDegrees.push(degree);
          continue;
        }
        coeff *= value.num ** BigInt(degree);
        const maxDegree = maxDegrees.get(variable) ?? 0;
        if (degree < maxDegree) coeff *= value.den ** BigInt(maxDegree - degree);
      }
      for (const [variable, maxDegree] of maxDegrees) {
        const value = values[variable];
        if (value !== undefined && monomial.degreeOf(variable) === 0)
          coeff *= value.den ** BigInt(maxDegree);
      }
      if (coeff !== 0n) this.som.addTerm(coeff, this.mkMonomial(keptVars, keptDegrees));
    }
    return this.som.mk(true);
  }

  private mkGlexMonic(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    const position = polynomial.getGradedLexMaxPos();
    if (polynomial.as[position] === 1n) return polynomial;
    const inverse = this.invNumeral(polynomial.as[position]);
    this.cheap.reset();
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(this.mulNumeral(polynomial.as[index], inverse), polynomial.ms[index]);
    return this.cheap.mk();
  }

  private getMinDegreeVar(polynomial: Polynomial) {
    let result = NULL_VAR;
    let minDegree = Infinity;
    for (const [variable, degree] of this.getMaxDegrees(polynomial))
      if (degree < minDegree) {
        result = variable;
        minDegree = degree;
      }
    return result;
  }

  toCoeffs(polynomial: Polynomial) {
    // Z3's to_numeral_vector builds normalize(p) and drops it, which takes and frees an id.
    const normalized = this.normalize(polynomial);
    if (normalized !== polynomial) {
      this.incRef(normalized);
      this.decRef(normalized);
    }
    const coeffs = Array.from({ length: this.totalDegree(polynomial) + 1 }, () => 0n);
    for (let index = 0; index < polynomial.size; index++)
      coeffs[polynomial.ms[index].totalDegree] = polynomial.as[index];
    return this.um.set(coeffs);
  }

  factor(polynomial: Polynomial, r: Factors) {
    if (polynomial.size === 0) {
      r.constant = 0n;
      return;
    }
    this.factorCore(polynomial, r);
  }

  private factorCore(polynomial: Polynomial, r: Factors) {
    if (this.isConst(polynomial)) {
      r.constant *= polynomial.as[0];
      return;
    }
    const x = this.getMinDegreeVar(polynomial);
    const c = new PolynomialRef(this);
    const pp = new PolynomialRef(this);
    const integer = this.iccp(polynomial, x, c, pp);
    r.constant *= integer;
    this.factorCore(c.get(), r);
    const cPart = new PolynomialRef(this);
    cPart.copy(pp);
    const cPrime = new PolynomialRef(this);
    cPrime.set(this.derivative(cPart.get(), x));
    const b = new PolynomialRef(this);
    const a = new PolynomialRef(this);
    const d = new PolynomialRef(this);
    this.gcd(cPart.get(), cPrime.get(), b);
    if (this.isConst(b.get())) this.factorSqfPp(cPart.get(), r, x, 1);
    else {
      a.set(this.exactDiv(cPart.get(), b.get()));
      for (let j = 1; !this.isConst(a.get()); j++) {
        this.gcd(a.get(), b.get(), d);
        cPart.set(this.exactDiv(a.get(), d.get()));
        if (!this.isConst(cPart.get())) this.factorSqfPp(cPart.get(), r, x, j);
        else if (cPart.get().as[0] === -1n && j % 2 === 1) r.constant = -r.constant;
        b.set(this.exactDiv(b.get(), d.get()));
        a.copy(d);
      }
    }
    d.reset();
    a.reset();
    b.reset();
    cPrime.reset();
    cPart.reset();
    pp.reset();
    c.reset();
  }

  private factorSqfPp(polynomial: Polynomial, r: Factors, x: number, k: number) {
    const degree = this.degree(polynomial, x);
    if (degree === 1) r.push(polynomial, k);
    else if (this.isUnivariate(polynomial)) this.factorSqfPpUniv(polynomial, r, k);
    else if (degree === 2) this.factor2SqfPp(polynomial, r, x, k);
    else this.factorNSqfPp(polynomial, r, x, k);
  }

  private factor2SqfPp(polynomial: Polynomial, r: Factors, x: number, k: number) {
    const a = new PolynomialRef(this);
    const b = new PolynomialRef(this);
    const c = new PolynomialRef(this);
    a.set(this.coeff(polynomial, x, 2));
    b.set(this.coeff(polynomial, x, 1));
    c.set(this.coeff(polynomial, x, 0));
    let isFlipped = false;
    if (a.get().as[a.get().getGradedLexMaxPos()] < 0n) {
      a.set(this.neg(a.get()));
      b.set(this.neg(b.get()));
      c.set(this.neg(c.get()));
      isFlipped = true;
    }
    const b2 = new PolynomialRef(this);
    b2.set(this.mul(b.get(), b.get()));
    const ac = new PolynomialRef(this);
    ac.set(this.mul(a.get(), c.get()));
    const disc = new PolynomialRef(this);
    disc.set(this.addmul(b2.get(), -4n, ac.get()));
    const discSqrt = new PolynomialRef(this);
    const f1 = new PolynomialRef(this);
    const f2 = new PolynomialRef(this);
    const twoAx = new PolynomialRef(this);
    if (!this.sqrt(disc.get(), discSqrt)) r.push(polynomial, k);
    else {
      if (isFlipped && k % 2 === 1) r.constant = -r.constant;
      twoAx.set(this.mulTerm(2n, this.mkPower(x, 1), a.get()));
      f1.set(this.add(twoAx.get(), b.get()));
      f2.copy(f1);
      f1.set(this.sub(f1.get(), discSqrt.get()));
      f2.set(this.add(f2.get(), discSqrt.get()));
      f1.move(this.pp(f1.get(), x));
      f2.move(this.pp(f2.get(), x));
      r.push(f1.get(), k);
      r.push(f2.get(), k);
    }
    twoAx.reset();
    f2.reset();
    f1.reset();
    discSqrt.reset();
    disc.reset();
    ac.reset();
    b2.reset();
    c.reset();
    b.reset();
    a.reset();
  }

  private factorSqfPpUniv(polynomial: Polynomial, r: Factors, k: number) {
    const x = this.maxVar(polynomial);
    const pRef = new PolynomialRef(this);
    pRef.set(polynomial);
    const fs = mkFactors();
    factorSquareFree(this.um, this.toCoeffs(polynomial), fs, 1, DEFAULT_FACTOR_PARAMS);
    if (fs.factors.length === 1 && fs.degrees[0] === 1) r.push(polynomial, k);
    else {
      const f = new PolynomialRef(this);
      for (let index = 0; index < fs.factors.length; index++) {
        f.set(this.toPolynomial(fs.factors[index], x));
        r.push(f.get(), k * fs.degrees[index]);
      }
      if (fs.constant === -1n && k % 2 === 1) r.constant = -r.constant;
      f.reset();
    }
    pRef.reset();
  }

  private factorNSqfPp(polynomial: Polynomial, r: Factors, x: number, k: number) {
    if (this.isUnivariate(polynomial)) {
      this.factorSqfPpUniv(polynomial, r, k);
      return;
    }
    if (this.tryMultivarFactor(polynomial, r, x, k)) return;
    r.push(polynomial, k);
  }

  private pushSmallFactor(part: PolynomialRef, r: Factors, x: number, k: number) {
    const d = this.degree(part.get(), x);
    if (d === 1) r.push(part.get(), k);
    else if (d === 2 && this.isPrimitive(part.get(), x) && this.isSquareFreeIn(part.get(), x))
      this.factor2SqfPp(part.get(), r, x, k);
    else r.push(part.get(), k);
  }

  private tryMultivarFactor(polynomial: Polynomial, r: Factors, x: number, k: number) {
    const allVars = this.getVars(polynomial);
    const mainVars = [x];
    const varsByDegree: [number, number][] = [];
    for (const variable of allVars)
      if (variable !== x) varsByDegree.push([this.degree(polynomial, variable), variable]);
    varsByDegree.sort((first, second) => second[0] - first[0] || second[1] - first[1]);
    for (const [degree, variable] of varsByDegree) if (degree > 1) mainVars.push(variable);
    for (const mainVar of mainVars) {
      const degMain = this.degree(polynomial, mainVar);
      if (degMain <= 1) continue;
      for (const liftVar of allVars) {
        if (liftVar === mainVar) continue;
        const evalVars: number[] = [];
        for (const variable of allVars)
          if (variable !== mainVar && variable !== liftVar) evalVars.push(variable);
        const nEval = evalVars.length;
        const maxCombos = nEval === 0 ? 1 : Math.min(FACTOR_EVAL_VALUES.length, 5);
        for (let combo = 0; combo < maxCombos; combo++) {
          const pBivar = new PolynomialRef(this);
          const isFound = this.tryMultivarFactorCombo(
            polynomial,
            r,
            x,
            k,
            mainVar,
            degMain,
            liftVar,
            evalVars,
            combo,
            pBivar,
          );
          pBivar.reset();
          if (isFound) return true;
        }
      }
    }
    return false;
  }

  private tryMultivarFactorCombo(
    polynomial: Polynomial,
    r: Factors,
    x: number,
    k: number,
    mainVar: number,
    degMain: number,
    liftVar: number,
    evalVars: readonly number[],
    combo: number,
    pBivar: PolynomialRef,
  ) {
    const nEval = evalVars.length;
    if (nEval > 0) {
      const evalValues: bigint[] = [];
      for (let index = 0; index < nEval; index++) {
        let c = combo;
        for (let skip = 0; skip < index; skip++) c = Math.floor(c / FACTOR_EVAL_VALUES.length);
        evalValues.push(FACTOR_EVAL_VALUES[c % FACTOR_EVAL_VALUES.length]);
      }
      pBivar.set(this.substitute(polynomial, evalVars, evalValues));
    } else pBivar.set(polynomial);
    if (this.degree(pBivar.get(), mainVar) !== degMain) return false;
    const degLift = this.degree(pBivar.get(), liftVar);
    if (degLift === 0) return false;
    for (const point of FACTOR_EVAL_VALUES) {
      const pUniv = new PolynomialRef(this);
      const pUnivRef = new PolynomialRef(this);
      const q = new PolynomialRef(this);
      const lcPoly = new PolynomialRef(this);
      const isFound = this.tryMultivarFactorPoint(
        polynomial,
        r,
        x,
        k,
        mainVar,
        degMain,
        liftVar,
        nEval,
        degLift,
        point,
        pBivar,
        pUniv,
        pUnivRef,
        q,
        lcPoly,
      );
      lcPoly.reset();
      q.reset();
      pUnivRef.reset();
      pUniv.reset();
      if (isFound) return true;
    }
    return false;
  }

  private tryMultivarFactorPoint(
    polynomial: Polynomial,
    r: Factors,
    x: number,
    k: number,
    mainVar: number,
    degMain: number,
    liftVar: number,
    nEval: number,
    degLift: number,
    point: bigint,
    pBivar: PolynomialRef,
    pUniv: PolynomialRef,
    pUnivRef: PolynomialRef,
    q: PolynomialRef,
    lcPoly: PolynomialRef,
  ) {
    pUniv.set(this.substitute(pBivar.get(), [liftVar], [point]));
    if (!this.isUnivariate(pUniv.get())) return false;
    if (this.degree(pUniv.get(), mainVar) !== degMain) return false;
    if (!this.isSquareFreeIn(pUniv.get(), mainVar)) return false;
    pUnivRef.copy(pUniv);
    const univariateFs = mkFactors();
    factorSquareFree(
      this.um,
      this.um.getPrimitive(this.toCoeffs(pUnivRef.get())),
      univariateFs,
      1,
      DEFAULT_FACTOR_PARAMS,
    );
    const nf = univariateFs.factors.length;
    if (nf <= 1) return false;
    q.set(this.translate(pBivar.get(), liftVar, point));
    lcPoly.set(this.coeff(q.get(), mainVar, degMain));
    let lcAtZero = 0n;
    if (this.isConst(lcPoly.get())) lcAtZero = lcPoly.get().as[0] ?? 0n;
    else {
      const lcEval = new PolynomialRef(this);
      lcEval.set(this.substitute(lcPoly.get(), [liftVar], [0n]));
      const isConstant = this.isConst(lcEval.get());
      if (isConstant) lcAtZero = lcEval.get().as[0] ?? 0n;
      lcEval.reset();
      if (!isConstant) return false;
    }
    for (const prime of FACTOR_PRIMES) {
      if (getGcd(prime, lcAtZero) !== 1n) continue;
      for (let split = 1; split <= Math.floor(nf / 2); split++) {
        let h1 = this.um.set(univariateFs.factors[0]);
        for (let index = 1; index < split; index++)
          h1 = this.um.mul(h1, univariateFs.factors[index]);
        let h2 = this.um.set(univariateFs.factors[split]);
        for (let index = split + 1; index < nf; index++)
          h2 = this.um.mul(h2, univariateFs.factors[index]);
        if (h1.length > 0 && h1[h1.length - 1] < 0n) h1 = h1.map((coeff) => -coeff);
        if (h2.length > 0 && h2[h2.length - 1] < 0n) h2 = h2.map((coeff) => -coeff);
        const f1 = new PolynomialRef(this);
        const f2 = new PolynomialRef(this);
        const isFound =
          this.tryBivarHenselLift(
            q.get(),
            mainVar,
            liftVar,
            degLift,
            h1,
            h2,
            lcAtZero,
            prime,
            f1,
            f2,
          ) && this.pushLiftedFactors(polynomial, r, x, k, nEval, liftVar, point, f1, f2);
        f2.reset();
        f1.reset();
        if (isFound) return true;
      }
    }
    return false;
  }

  private pushLiftedFactors(
    polynomial: Polynomial,
    r: Factors,
    x: number,
    k: number,
    nEval: number,
    liftVar: number,
    point: bigint,
    f1: PolynomialRef,
    f2: PolynomialRef,
  ) {
    f1.set(this.translate(f1.get(), liftVar, -point));
    f2.set(this.translate(f2.get(), liftVar, -point));
    if (nEval === 0) {
      const bivarFs = [new PolynomialRef(this), new PolynomialRef(this)];
      bivarFs[0].copy(f1);
      bivarFs[1].copy(f2);
      for (const bf of bivarFs) {
        if (this.isConst(bf.get()) || this.degree(bf.get(), x) === 0) continue;
        this.pushSmallFactor(bf, r, x, k);
      }
      bivarFs[1].reset();
      bivarFs[0].reset();
      return true;
    }
    const cands = [new PolynomialRef(this), new PolynomialRef(this)];
    cands[0].copy(f1);
    cands[1].copy(f2);
    let isFound = false;
    for (const cand of cands) {
      if (this.isConst(cand.get())) continue;
      const qDiv = new PolynomialRef(this);
      const rDiv = new PolynomialRef(this);
      const divVar = this.maxVar(cand.get());
      this.exactPseudoDivision(polynomial, cand.get(), divVar, qDiv, rDiv);
      if (!this.isZero(rDiv.get())) {
        rDiv.reset();
        qDiv.reset();
        continue;
      }
      const check = new PolynomialRef(this);
      check.set(this.mul(cand.get(), qDiv.get()));
      if (this.eq(check.get(), polynomial)) {
        const parts = [new PolynomialRef(this), new PolynomialRef(this)];
        parts[0].copy(cand);
        parts[1].copy(qDiv);
        for (const part of parts) {
          if (this.isConst(part.get())) {
            r.constant *= part.get().as[0];
            continue;
          }
          if (this.degree(part.get(), x) === 0) continue;
          this.pushSmallFactor(part, r, x, k);
        }
        parts[1].reset();
        parts[0].reset();
        isFound = true;
      }
      check.reset();
      rDiv.reset();
      qDiv.reset();
      if (isFound) break;
    }
    cands[1].reset();
    cands[0].reset();
    return isFound;
  }

  private tryBivarHenselLift(
    q: Polynomial,
    x: number,
    y: number,
    degY: number,
    h1: readonly bigint[],
    h2: readonly bigint[],
    lcValue: bigint,
    prime: bigint,
    f1Out: PolynomialRef,
    f2Out: PolynomialRef,
  ) {
    const zp = new UpolynomialManager(prime);
    const f1 = zp.mkMonic(zp.set(h1));
    const f2 = zp.mkMonic(zp.set(h2));
    const ext = zp.extGcd(f1, f2);
    if (ext.d.length !== 1 || ext.d[0] !== 1n) return false;
    const qCoeffs: bigint[][] = [];
    for (let j = 0; j <= degY; j++) {
      const cj = new PolynomialRef(this);
      cj.set(this.coeff(q, y, j));
      const isBivariate = this.isZero(cj.get()) || this.isUnivariate(cj.get());
      if (isBivariate) qCoeffs.push(zp.set(this.isZero(cj.get()) ? [] : this.toCoeffs(cj.get())));
      cj.reset();
      if (!isBivariate) return false;
    }
    const f1Coeffs: bigint[][] = Array.from({ length: degY + 1 }, () => []);
    const f2Coeffs: bigint[][] = Array.from({ length: degY + 1 }, () => []);
    f1Coeffs[0] = zp.set(f1);
    f2Coeffs[0] = zp.mulConst(zp.set(f2), zp.normalizeNumeral(lcValue));
    const lcInv = zp.inv(lcValue);
    for (let j = 1; j <= degY; j++) {
      let e = zp.set(qCoeffs[j]);
      for (let first = 0; first <= j; first++) {
        const second = j - first;
        if (second > degY) continue;
        if (first === j && second === 0) continue;
        if (first === 0 && second === j) continue;
        if (f1Coeffs[first].length === 0 || f2Coeffs[second].length === 0) continue;
        e = zp.sub(e, zp.mul(f1Coeffs[first], f2Coeffs[second]));
      }
      if (e.length === 0) continue;
      const a = zp.divRem(zp.mul(e, ext.v), f1).remainder;
      const b = zp.divRem(zp.mul(e, ext.u), f2).remainder;
      f1Coeffs[j] = zp.mulConst(a, lcInv);
      f2Coeffs[j] = zp.set(b);
    }
    return this.reconstructLiftedFactors(q, x, y, degY, f1Coeffs, f2Coeffs, f1Out, f2Out);
  }

  private reconstructLiftedFactors(
    q: Polynomial,
    x: number,
    y: number,
    degY: number,
    f1Coeffs: readonly bigint[][],
    f2Coeffs: readonly bigint[][],
    f1Out: PolynomialRef,
    f2Out: PolynomialRef,
  ) {
    const f1Poly = new PolynomialRef(this);
    const f2Poly = new PolynomialRef(this);
    f1Poly.set(this.zero);
    f2Poly.set(this.zero);
    const addTerm = (coeffs: readonly bigint[], power: number, target: PolynomialRef) => {
      if (coeffs.length === 0) return;
      const univ = new PolynomialRef(this);
      univ.set(this.toPolynomial(coeffs, x));
      if (!this.isZero(univ.get())) {
        const term = new PolynomialRef(this);
        term.set(this.mulTerm(1n, this.mkPower(y, power), univ.get()));
        target.set(this.add(target.get(), term.get()));
        term.reset();
      }
      univ.reset();
    };
    for (let j = 0; j <= degY; j++) {
      addTerm(f1Coeffs[j], j, f1Poly);
      addTerm(f2Coeffs[j], j, f2Poly);
    }
    const product = new PolynomialRef(this);
    product.set(this.mul(f1Poly.get(), f2Poly.get()));
    const isEqual = this.eq(product.get(), q);
    if (isEqual) {
      f1Out.copy(f1Poly);
      f2Out.copy(f2Poly);
    }
    product.reset();
    f2Poly.reset();
    f1Poly.reset();
    return isEqual;
  }

  evaluateWith<T>(polynomial: Polynomial, ops: ValueOps<T>, getValue: (variable: number) => T) {
    if (polynomial.size === 0) return ops.fromInteger(0n);
    if (this.isConst(polynomial)) return ops.fromInteger(polynomial.as[0]);
    polynomial.lexSort();
    return this.evaluateCore(
      polynomial,
      ops,
      getValue,
      0,
      polynomial.size,
      this.maxVar(polynomial),
    );
  }

  private evaluateCore<T>(
    polynomial: Polynomial,
    ops: ValueOps<T>,
    getValue: (variable: number) => T,
    start: number,
    end: number,
    x: number,
  ): T {
    if (end === start + 1) {
      let result = ops.fromInteger(polynomial.as[start]);
      const monomial = polynomial.ms[start];
      for (let index = 0; index < monomial.size; index++) {
        const variable = monomial.vars[index];
        if (variable > x) break;
        result = ops.mul(result, ops.power(getValue(variable), monomial.degrees[index]));
      }
      return result;
    }
    const value = getValue(x);
    let result = ops.fromInteger(0n);
    let index = start;
    while (index < end) {
      const degree = polynomial.ms[index].degreeOf(x);
      if (degree === 0) {
        const below = this.maxSmallerThan(polynomial, index, end, x);
        result = ops.add(
          result,
          below === NULL_VAR
            ? ops.fromInteger(polynomial.as[index])
            : this.evaluateCore(polynomial, ops, getValue, index, end, below),
        );
        break;
      }
      let next = index + 1;
      let nextDegree = 0;
      for (; next < end; next++) {
        const current = polynomial.ms[next].degreeOf(x);
        if (current < degree) {
          nextDegree = current;
          break;
        }
      }
      const below = this.maxSmallerThan(polynomial, index, next, x);
      result = ops.add(
        result,
        below === NULL_VAR
          ? ops.fromInteger(polynomial.as[index])
          : this.evaluateCore(polynomial, ops, getValue, index, next, below),
      );
      result = ops.mul(result, ops.power(value, degree - nextDegree));
      index = next;
    }
    return result;
  }

  private maxSmallerThan(polynomial: Polynomial, start: number, end: number, x: number) {
    let max = NULL_VAR;
    for (let index = start; index < end; index++)
      max = Math.max(max, polynomial.ms[index].maxSmallerThan(x));
    return max;
  }

  evaluate(polynomial: Polynomial, values: readonly (Rational | undefined)[]) {
    return this.evaluateWith(polynomial, RATIONAL_OPS, (variable) => {
      const value = values[variable];
      if (value === undefined) throw new SmtInvariantError(`x${variable} is unassigned`);
      return value;
    });
  }

  getSign(polynomial: Polynomial, values: readonly (Rational | undefined)[]) {
    const value = this.evaluate(polynomial, values);
    return value.isZero() ? 0 : value.isPositive() ? 1 : -1;
  }
}

export class PolynomialCache {
  private table = new Map<string, Polynomial>();
  private cachedPolys: PolynomialRefVector;
  private inCache: boolean[] = [];
  private pscChains = new Map<string, Polynomial[]>();
  private factorizations = new Map<number, Polynomial[]>();

  constructor(readonly pm: PolynomialManager) {
    this.cachedPolys = new PolynomialRefVector(pm);
  }

  reset() {
    this.table.clear();
    this.pscChains.clear();
    this.factorizations.clear();
    this.inCache = [];
    this.cachedPolys.reset();
  }

  mkUnique(polynomial: Polynomial) {
    if (this.inCache[polynomial.id] === true) return polynomial;
    const key = this.pm.getKey(polynomial);
    const existing = this.table.get(key);
    if (existing !== undefined) return existing;
    this.table.set(key, polynomial);
    this.cachedPolys.push(polynomial);
    this.inCache[polynomial.id] = true;
    return polynomial;
  }

  contains(polynomial: Polynomial) {
    return this.inCache[polynomial.id] === true;
  }

  pscChain(first: Polynomial, second: Polynomial, variable: number, chain: PolynomialRefVector) {
    const p = this.mkUnique(first);
    const q = this.mkUnique(second);
    const key = `${p.id},${q.id},${variable}`;
    const cached = this.pscChains.get(key);
    if (cached !== undefined) {
      chain.reset();
      for (const element of cached) chain.push(element);
      return;
    }
    this.pm.pscChain(p, q, variable, chain);
    const result: Polynomial[] = [];
    for (let index = 0; index < chain.size; index++) {
      const unique = this.mkUnique(chain.get(index));
      chain.set(index, unique);
      result.push(unique);
    }
    this.pscChains.set(key, result);
  }

  factor(polynomial: Polynomial, distinctFactors: PolynomialRefVector) {
    distinctFactors.reset();
    const p = this.mkUnique(polynomial);
    const cached = this.factorizations.get(p.id);
    if (cached !== undefined) {
      distinctFactors.reset();
      for (const factor of cached) distinctFactors.push(factor);
      return;
    }
    const fs = new Factors(this.pm);
    this.pm.factor(p, fs);
    const result: Polynomial[] = [];
    for (const factor of fs.factors) {
      const unique = this.mkUnique(factor);
      distinctFactors.push(unique);
      result.push(unique);
    }
    this.factorizations.set(p.id, result);
    fs.reset();
  }
}
