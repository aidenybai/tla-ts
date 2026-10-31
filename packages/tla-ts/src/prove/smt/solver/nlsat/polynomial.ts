// Ported from Z3 (src/math/polynomial/polynomial.{h,cpp}, src/math/polynomial/polynomial_cache.cpp),
// MIT license, see z3-license.txt. Multivariate polynomials over the integers for nlsat, with
// Z3's factorization: univariate through upolynomial-factorization, quadratics through the square
// root of the discriminant, and higher degrees through bivariate Hensel lifting. A polynomial keeps its monomials in the order Z3's som buffers
// produce, with a monomial of maximal degree in the maximal variable first, because factorization
// breaks ties on the order in which variables occur.
//
// Deviations from Z3, which only change the order of equal results:
// - gcd computes with Z3's subresultant PRS (gcd_prs), not its modular algorithms (mod_gcd,
//   uni_mod_gcd). Both return the same polynomial, normalized to a positive leading coefficient,
//   but its monomials may come out in another order. Z3's modular gcd can also return a constant
//   other than 1 for coprime primitive polynomials, gcd(2x - 3, 2x - 1) = 2
//   (polynomial.cpp:4815), where this port returns 1. The callers in scope only test whether
//   the gcd is constant.
// - Polynomial ids count up from zero. Z3 recycles the ids of deleted polynomials, so where nlsat
//   breaks a tie between two root functions on their ids it may pick the other one.
import { SmtInvariantError } from "../../../../errors";
import { getGcd, Rational } from "../rational";
import { UpolynomialManager } from "./upolynomial";
import {
  DEFAULT_FACTOR_PARAMS,
  factorSquareFree,
  getExactSquareRoot,
  type UpolynomialFactors,
} from "./upolynomial-factorization";

export const NULL_VAR = -1;

// s_factor_eval_values and s_factor_primes: the points multivariate factorization evaluates the
// other variables at, and the primes it lifts modulo.
const FACTOR_EVAL_VALUES = [0n, 1n, -1n, 2n, -2n, 3n, -3n];
const FACTOR_PRIMES = [39103n, 104729n, 1000003n, 100000007n];

// mpz div: rounds toward minus infinity.
const floorDiv = (dividend: bigint, divisor: bigint) => {
  const quotient = dividend / divisor;
  return dividend % divisor !== 0n && dividend < 0n !== divisor < 0n ? quotient - 1n : quotient;
};

// Input outside what the port of nlsat supports so far: subresultants of polynomials of degree 2
// or more in the variable being projected. The nra solver answers unknown on it, which is always
// sound.
// The arithmetic t_eval evaluates in: rationals, intervals or algebraic numbers.
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

export class Monomial {
  readonly totalDegree: number;

  // vars and degrees change only when the manager renames the variables.
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

  // max_smaller_than: the largest variable of the monomial below x.
  maxSmallerThan(variable: number) {
    let result = NULL_VAR;
    for (const current of this.vars) if (current < variable) result = current;
    return result;
  }
}

// lex_compare: the biggest variable dominates, then its degree.
export const lexCompare = (first: Monomial, second: Monomial) => {
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

export const gradedLexCompare = (first: Monomial, second: Monomial) =>
  first.totalDegree === second.totalDegree
    ? lexCompare(first, second)
    : first.totalDegree < second.totalDegree
      ? -1
      : 1;

// po_gt: the order that puts a monomial with the maximal variable at its maximal degree first.
const isPoGreater = (first: Monomial, second: Monomial) => {
  if (first.size === 0) return false;
  if (second.size === 0) return true;
  if (first.maxVar !== second.maxVar) return first.maxVar > second.maxVar;
  return first.maxVarDegree > second.maxVarDegree;
};

export class Polynomial {
  isLexSorted = false;

  constructor(
    readonly id: number,
    readonly as: bigint[],
    readonly ms: Monomial[],
  ) {
    this.makeFirstMaximal();
  }

  // make_first_maximal: a monomial with the maximal variable at its maximal degree first.
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

  // lex_sort: puts the monomials in decreasing lexicographic order, which Z3 does in place whenever it
  // hashes the polynomial.
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

  // graded_lex_max_pos
  getGradedLexMaxPos() {
    if (this.ms.length === 0) return -1;
    let maxPos = 0;
    for (let index = 1; index < this.ms.length; index++)
      if (gradedLexCompare(this.ms[index], this.ms[maxPos]) > 0) maxPos = index;
    return maxPos;
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

// som_buffer: a sum of monomials, each kept at the position where it first appeared. Zero entries
// stay until mk removes them.
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
    const position = this.positions.get(monomial.id);
    if (position === undefined) {
      this.positions.set(monomial.id, this.ms.length);
      this.ms.push(monomial);
      this.as.push(coeff);
      return;
    }
    this.as[position] += coeff;
  }

  add(polynomial: Polynomial) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      const position = this.positions.get(monomial.id);
      if (position === undefined) {
        this.positions.set(monomial.id, this.ms.length);
        this.ms.push(monomial);
        this.as.push(polynomial.as[index]);
      } else this.as[position] += polynomial.as[index];
    }
  }

  // addmul: adds a*m*p.
  addmul(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return;
    for (let index = 0; index < polynomial.size; index++) {
      const product = this.manager.mulMonomials(monomial, polynomial.ms[index]);
      const position = this.positions.get(product.id);
      if (position === undefined) {
        this.positions.set(product.id, this.ms.length);
        this.ms.push(product);
        this.as.push(coeff * polynomial.as[index]);
      } else this.as[position] += coeff * polynomial.as[index];
    }
  }

  // addmul(a, m, buffer): adds a*m times each entry of another buffer, zero entries included,
  // which keeps their monomials at new positions as Z3 does.
  addmulBuffer(coeff: bigint, monomial: Monomial, buffer: SomBuffer) {
    if (coeff === 0n) return;
    for (let index = 0; index < buffer.ms.length; index++) {
      const product = this.manager.mulMonomials(monomial, buffer.ms[index]);
      const position = this.positions.get(product.id);
      if (position === undefined) {
        this.positions.set(product.id, this.ms.length);
        this.ms.push(product);
        this.as.push(coeff * buffer.as[index]);
      } else this.as[position] += coeff * buffer.as[index];
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

  // mk(normalize): the nonzero entries, divided by the gcd of their coefficients when normalizing.
  mk(isNormalized = false) {
    const as: bigint[] = [];
    const ms: Monomial[] = [];
    for (let index = 0; index < this.as.length; index++) {
      if (this.as[index] === 0n) continue;
      as.push(this.as[index]);
      ms.push(this.ms[index]);
    }
    this.reset();
    const gcd = isNormalized ? as.reduce((current, coeff) => getGcd(current, coeff), 0n) : 1n;
    return this.manager.mkPolynomialCore(gcd > 1n ? as.map((coeff) => coeff / gcd) : as, ms);
  }
}

// cheap_som_buffer: each monomial is added at most once, so it needs no position map.
class CheapSomBuffer {
  private as: bigint[] = [];
  private ms: Monomial[] = [];

  constructor(private manager: PolynomialManager) {}

  add(coeff: bigint, monomial: Monomial) {
    if (coeff === 0n) return;
    this.as.push(coeff);
    this.ms.push(monomial);
  }

  addmul(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return;
    for (let index = 0; index < polynomial.size; index++) {
      this.as.push(coeff * polynomial.as[index]);
      this.ms.push(this.manager.mulMonomials(monomial, polynomial.ms[index]));
    }
  }

  mk() {
    const result = this.manager.mkPolynomialCore(this.as, this.ms);
    this.as = [];
    this.ms = [];
    return result;
  }
}

export interface Factors {
  constant: bigint;
  factors: Polynomial[];
  degrees: number[];
}

export class PolynomialManager {
  private monomials = new Map<string, Monomial>();
  private nextPolynomialId = 0;
  readonly unit: Monomial;
  readonly zero: Polynomial;
  readonly one: Polynomial;
  private um = new UpolynomialManager();
  private som = new SomBuffer(this);
  private som2 = new SomBuffer(this);
  private cheap = new CheapSomBuffer(this);

  constructor() {
    this.unit = this.mkMonomial([], []);
    this.zero = this.mkPolynomialCore([], []);
    this.one = this.mkPolynomialCore([1n], [this.unit]);
  }

  // Monomials.

  mkMonomial(vars: readonly number[], degrees: readonly number[]) {
    const key = getMonomialKey(vars, degrees);
    const existing = this.monomials.get(key);
    if (existing !== undefined) return existing;
    const monomial = new Monomial(this.monomials.size, vars, degrees);
    this.monomials.set(key, monomial);
    return monomial;
  }

  // rename: every variable x becomes permutation[x], in place in every monomial, as Z3 renames its
  // monomial table. Z3 then moves a maximal monomial first in every live polynomial. Here that is
  // the given polynomials, the ones nlsat keeps in its atoms. Others keep their order, which
  // matches again once the order is restored.
  rename(permutation: readonly number[], polynomials: Iterable<Polynomial>) {
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
    for (const polynomial of polynomials) polynomial.makeFirstMaximal();
  }

  // mk_monomial(x, k): x^k, the unit for k = 0.
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

  // div: m1/m2, or null when m2 does not divide m1.
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

  // div_x_k: m/x^k.
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

  // div_x: m with x removed.
  private divX(monomial: Monomial, variable: number) {
    return this.divXk(monomial, variable, monomial.degreeOf(variable));
  }

  // Construction.

  mkPolynomialCore(as: bigint[], ms: Monomial[]) {
    return new Polynomial(this.nextPolynomialId++, as, ms);
  }

  mkConst(value: bigint) {
    if (value === 0n) return this.zero;
    if (value === 1n) return this.one;
    return this.mkPolynomialCore([value], [this.unit]);
  }

  mkVar(variable: number, degree = 1) {
    return this.mkPolynomialCore([1n], [this.mkMonomial([variable], [degree])]);
  }

  mkPolynomial(as: readonly bigint[], ms: readonly Monomial[]) {
    this.som.reset();
    for (let index = 0; index < as.length; index++) this.som.addTerm(as[index], ms[index]);
    return this.som.mk();
  }

  // mk_linear: sum of as[i]*xs[i] plus c.
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

  // Queries.

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

  // eq: the same monomials with the same coefficients, in any order.
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

  // The key of the hash-consing table. It lexicographically sorts the polynomial in place, as Z3's
  // hash does.
  getKey(polynomial: Polynomial) {
    polynomial.lexSort();
    let key = "";
    for (let index = 0; index < polynomial.size; index++)
      key += `${polynomial.as[index]}:${polynomial.ms[index].id};`;
    return key;
  }

  // Arithmetic.

  private addmul(firstCoeff: bigint, first: Polynomial, secondCoeff: bigint, second: Polynomial) {
    this.som.reset();
    this.som.addmul(firstCoeff, this.unit, first);
    this.som.addmul(secondCoeff, this.unit, second);
    return this.som.mk();
  }

  add(first: Polynomial, second: Polynomial) {
    return this.addmul(1n, first, 1n, second);
  }

  sub(first: Polynomial, second: Polynomial) {
    return this.addmul(1n, first, -1n, second);
  }

  mul(first: Polynomial, second: Polynomial) {
    if (first.size === 0 || second.size === 0) return this.zero;
    this.som.reset();
    for (let index = 0; index < first.size; index++)
      this.som.addmul(first.as[index], first.ms[index], second);
    return this.som.mk();
  }

  // mul(a, m, p): a*m*p.
  mulTerm(coeff: bigint, monomial: Monomial, polynomial: Polynomial) {
    if (coeff === 0n) return this.zero;
    if (coeff === 1n && monomial === this.unit) return polynomial;
    this.cheap.addmul(coeff, monomial, polynomial);
    return this.cheap.mk();
  }

  mulConst(coeff: bigint, polynomial: Polynomial) {
    return this.mulTerm(coeff, this.unit, polynomial);
  }

  neg(polynomial: Polynomial) {
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(-polynomial.as[index], polynomial.ms[index]);
    return this.cheap.mk();
  }

  pw(polynomial: Polynomial, power: number) {
    if (power === 0) return this.one;
    let result = polynomial;
    for (let index = 1; index < power; index++) result = this.mul(result, polynomial);
    return result;
  }

  // coeff: the coefficient of x^k, a polynomial in the other variables.
  coeff(polynomial: Polynomial, variable: number, power: number) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      if (monomial.degreeOf(variable) === power)
        this.cheap.add(polynomial.as[index], this.divX(monomial, variable));
    }
    return this.cheap.mk();
  }

  // const_coeff: the coefficient of x^k when it is a number, else null.
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

  lc(polynomial: Polynomial, variable: number) {
    return this.coeff(polynomial, variable, this.degree(polynomial, variable));
  }

  derivative(polynomial: Polynomial, variable: number) {
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      const degree = monomial.degreeOf(variable);
      if (degree > 0)
        this.cheap.add(polynomial.as[index] * BigInt(degree), this.divXk(monomial, variable, 1));
    }
    return this.cheap.mk();
  }

  // flip_sign_if_lm_neg: negates p when its graded-lex leading coefficient is negative.
  flipSignIfLmNeg(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    return polynomial.as[polynomial.getGradedLexMaxPos()] < 0n ? this.neg(polynomial) : polynomial;
  }

  // ic: the integer content, the gcd of the coefficients.
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

  // ic(p, a, c): p = a*c, with the coefficients of c coprime.
  private icWithContent(polynomial: Polynomial): [bigint, Polynomial] {
    if (polynomial.size === 0) return [0n, polynomial];
    if (this.isConst(polynomial)) return [polynomial.as[0], this.one];
    let content = 0n;
    for (const coeff of polynomial.as) content = getGcd(content, coeff);
    if (content === 1n) return [1n, polynomial];
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(polynomial.as[index] / content, polynomial.ms[index]);
    return [content, this.cheap.mk()];
  }

  // iccp: the integer content, the content and the primitive part of p with respect to x.
  iccp(polynomial: Polynomial, variable: number): [bigint, Polynomial, Polynomial] {
    if (polynomial.size === 0) return [0n, this.one, polynomial];
    if (this.isConst(polynomial)) return [polynomial.as[0], this.one, this.one];
    const degree = this.degree(polynomial, variable);
    if (degree === 0) {
      const [integer, content] = this.icWithContent(polynomial);
      return [integer, content, this.one];
    }
    // The quick filter: a power of x that occurs only as a pure power means the content is 1.
    const filter = Array.from({ length: degree + 1 }, () => 0);
    const powers: number[] = [];
    for (const monomial of polynomial.ms) {
      const power = monomial.degreeOf(variable);
      if (filter[power] === 0) powers.push(power);
      filter[power] += monomial.size === (power > 0 ? 1 : 0) ? 1 : 2;
    }
    const [integer, primitive] = this.icWithContent(polynomial);
    for (const power of powers) if (filter[power] === 1) return [integer, this.one, primitive];
    let content = this.coeff(primitive, variable, powers[0]);
    for (let index = 1; index < powers.length; index++) {
      content = this.gcd(content, this.coeff(primitive, variable, powers[index]));
      if (this.isConst(content)) return [integer, this.one, primitive];
    }
    content = this.flipSignIfLmNeg(content);
    return [integer, content, this.exactDiv(primitive, content)];
  }

  pp(polynomial: Polynomial, variable: number) {
    return this.iccp(polynomial, variable)[2];
  }

  // square_free: the integer content times the square-free parts of the content and the primitive
  // part in the maximal variable, or p itself when it is square-free.
  squareFree(polynomial: Polynomial): Polynomial {
    if (this.isConst(polynomial)) return polynomial;
    const variable = this.maxVar(polynomial);
    const [integer, content, primitive] = this.iccp(polynomial, variable);
    const squareFreeContent = this.squareFree(content);
    const g = this.gcd(primitive, this.derivative(primitive, variable));
    if (this.isConst(g) && this.eq(squareFreeContent, content)) return polynomial;
    const squareFreePrimitive = this.isConst(g) ? primitive : this.exactDiv(primitive, g);
    return this.mul(this.mulConst(integer, squareFreeContent), squareFreePrimitive);
  }

  // normalize: p divided by the gcd of its coefficients.
  normalize(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    let g = 0n;
    for (const coeff of polynomial.as) g = getGcd(g, coeff);
    if (g === 1n) return polynomial;
    for (let index = 0; index < polynomial.size; index++)
      this.cheap.add(polynomial.as[index] / g, polynomial.ms[index]);
    return this.cheap.mk();
  }

  // nonzero_const_coeff: whether the coefficient of x^k is a nonzero number.
  isNonzeroConstCoeff(polynomial: Polynomial, variable: number, power: number) {
    const coeff = this.getConstCoeff(polynomial, variable, power);
    return coeff !== null && coeff !== 0n;
  }

  // exact_div: p/q, where q divides p.
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
      const coeff = remainder.as[remainderPos] / divisorCoeff;
      quotient.addTerm(coeff, monomial);
      remainder.addmul(-coeff, monomial, divisor);
    }
  }

  // exact_pseudo_division: Q and R with lc(q)^(deg(p) - deg(q) + 1) * p = Q*q + R. The
  // quotient is only built when asked for, as in pseudo_division_core.
  exactPseudoDivision(
    polynomial: Polynomial,
    divisor: Polynomial,
    variable: number,
    isQuotient = true,
  ) {
    return this.pseudoDivisionCore(polynomial, divisor, variable, true, isQuotient);
  }

  // pseudo_remainder: R with lc(q)^d * p = Q*q + R, where d counts the division steps.
  pseudoRemainder(polynomial: Polynomial, divisor: Polynomial, variable: number) {
    return this.pseudoDivisionCore(polynomial, divisor, variable, false, false);
  }

  private pseudoDivisionCore(
    polynomial: Polynomial,
    divisor: Polynomial,
    variable: number,
    isExact: boolean,
    isQuotient: boolean,
  ) {
    const degA = this.degree(polynomial, variable);
    const degB = this.degree(divisor, variable);
    if (degB === 0) {
      const steps = isExact ? degA + 1 : 1;
      if (!isQuotient || !isExact || degA === 0)
        return { quotient: polynomial, remainder: this.zero, steps };
      return {
        quotient: this.mul(polynomial, this.pw(divisor, degA)),
        remainder: this.zero,
        steps,
      };
    }
    const lcB = this.coeff(divisor, variable, degB);
    const reductB = this.reduct(divisor, variable, degB);
    let remainder = polynomial;
    let quotient = this.zero;
    let steps = 0;
    while (true) {
      const degR = this.degree(remainder, variable);
      if (degB > degR) {
        const exactSteps = degA - degB + 1;
        if (isExact && steps < exactSteps) {
          const power = this.pw(lcB, exactSteps - steps);
          if (isQuotient) quotient = this.mul(power, quotient);
          remainder = this.mul(power, remainder);
        }
        return { quotient, remainder, steps };
      }
      this.som.reset();
      this.som2.reset();
      for (let index = 0; index < remainder.size; index++) {
        const monomial = remainder.ms[index];
        const coeff = remainder.as[index];
        if (monomial.degreeOf(variable) === degR) {
          const shifted = this.divXk(monomial, variable, degB);
          if (isQuotient) this.som2.addTerm(coeff, shifted);
          this.som.addmul(-coeff, shifted, reductB);
        } else this.som.addmul(coeff, monomial, lcB);
      }
      remainder = this.som.mk();
      if (isQuotient) {
        for (let index = 0; index < quotient.size; index++)
          this.som2.addmul(quotient.as[index], quotient.ms[index], lcB);
        quotient = this.som2.mk();
      }
      steps++;
    }
  }

  exactPseudoRemainder(polynomial: Polynomial, divisor: Polynomial, variable: number) {
    return this.exactPseudoDivision(polynomial, divisor, variable, false).remainder;
  }

  // The reduct of coeff(p, x, k, reduct): p without its x^k monomials.
  reduct(polynomial: Polynomial, variable: number, power: number) {
    for (let index = 0; index < polynomial.size; index++)
      if (polynomial.ms[index].degreeOf(variable) !== power)
        this.cheap.add(polynomial.as[index], polynomial.ms[index]);
    return this.cheap.mk();
  }

  // var_max_degrees, sorted by variable.
  private getVarMaxDegrees(polynomial: Polynomial) {
    const degrees = new Map<number, number>();
    for (const monomial of polynomial.ms)
      for (let index = 0; index < monomial.size; index++) {
        const variable = monomial.vars[index];
        degrees.set(variable, Math.max(degrees.get(variable) ?? 0, monomial.degrees[index]));
      }
    return [...degrees.entries()].sort((first, second) => first[0] - second[0]);
  }

  // gcd: the greatest common divisor, with a positive integer content and leading coefficient.
  gcd(first: Polynomial, second: Polynomial): Polynomial {
    if (first.size === 0) return this.flipSignIfLmNeg(second);
    if (second.size === 0) return this.flipSignIfLmNeg(first);
    if (first === second) return this.flipSignIfLmNeg(first);
    if (this.isConst(first) || this.isConst(second))
      return this.mkConst(getGcd(this.getIc(second), this.getIc(first)));
    const firstDegrees = this.getVarMaxDegrees(first);
    const secondDegrees = this.getVarMaxDegrees(second);
    const size = Math.min(firstDegrees.length, secondDegrees.length);
    for (let index = 0; index < size; index++) {
      const firstVar = firstDegrees[index][0];
      const secondVar = secondDegrees[index][0];
      if (firstVar < secondVar) return this.gcdContent(first, firstVar, second);
      if (firstVar > secondVar) return this.gcdContent(second, secondVar, first);
    }
    if (size < firstDegrees.length) return this.gcdContent(first, firstDegrees[size][0], second);
    if (size < secondDegrees.length) return this.gcdContent(second, secondDegrees[size][0], first);
    return this.gcdPrs(first, second, firstDegrees[size - 1][0]);
  }

  // gcd_content: gcd(content(u, x), v).
  private gcdContent(polynomial: Polynomial, variable: number, other: Polynomial) {
    const [integer, content] = this.iccp(polynomial, variable);
    return this.gcd(this.mulConst(integer, content), other);
  }

  // gcd_prs: Collins' subresultant polynomial remainder sequence.
  private gcdPrs(first: Polynomial, second: Polynomial, variable: number) {
    const [u, v] =
      this.degree(first, variable) < this.degree(second, variable)
        ? [second, first]
        : [first, second];
    const [integerU, contentU, primitiveU] = this.iccp(u, variable);
    const [integerV, contentV, primitiveV] = this.iccp(v, variable);
    const contentGcd = this.gcd(contentU, contentV);
    const integerGcd = getGcd(integerU, integerV);
    let ppU = primitiveU;
    let ppV = primitiveV;
    let g = this.one;
    let h = this.one;
    while (true) {
      const delta = this.degree(ppU, variable) - this.degree(ppV, variable);
      const remainder = this.exactPseudoRemainder(ppU, ppV, variable);
      if (remainder.size === 0) {
        const result = this.pp(this.flipSignIfLmNeg(ppV), variable);
        return this.mulConst(integerGcd, this.mul(contentGcd, result));
      }
      if (this.isConst(remainder)) return this.mulConst(integerGcd, contentGcd);
      ppU = ppV;
      ppV = this.exactDiv(remainder, g);
      for (let index = 0; index < delta; index++) ppV = this.exactDiv(ppV, h);
      g = this.lc(ppU, variable);
      let newH = this.one;
      for (let index = 0; index < delta; index++) newH = this.mul(newH, g);
      for (let index = 1; index < delta; index++) newH = this.exactDiv(newH, h);
      h = newH;
    }
  }

  // get_min_degree_var: the first variable, in order of occurrence, of minimal degree.
  private getMinDegreeVar(polynomial: Polynomial) {
    const degrees = new Map<number, number>();
    for (const monomial of polynomial.ms)
      for (let index = 0; index < monomial.size; index++) {
        const variable = monomial.vars[index];
        if (monomial.degrees[index] > (degrees.get(variable) ?? 0))
          degrees.set(variable, monomial.degrees[index]);
      }
    let result = NULL_VAR;
    let minDegree = Infinity;
    for (const [variable, degree] of degrees)
      if (degree < minDegree) {
        result = variable;
        minDegree = degree;
      }
    return result;
  }

  // factor: the constant and the irreducible factors, each with its multiplicity. A square-free
  // primitive part of degree 2 or more in its variable of minimal degree is out of scope.
  factor(polynomial: Polynomial): Factors {
    const result: Factors = { constant: 1n, factors: [], degrees: [] };
    if (polynomial.size === 0) result.constant = 0n;
    else this.factorCore(polynomial, result);
    return result;
  }

  private factorCore(polynomial: Polynomial, result: Factors) {
    if (this.isConst(polynomial)) {
      result.constant *= polynomial.as[0];
      return;
    }
    const variable = this.getMinDegreeVar(polynomial);
    const [integer, content, primitive] = this.iccp(polynomial, variable);
    result.constant *= integer;
    this.factorCore(content, result);
    let square = this.gcd(primitive, this.derivative(primitive, variable));
    if (this.isConst(square)) {
      this.factorSqfPp(primitive, variable, 1, result);
      return;
    }
    let product = this.exactDiv(primitive, square);
    for (let multiplicity = 1; !this.isConst(product); multiplicity++) {
      const next = this.gcd(product, square);
      const factor = this.exactDiv(product, next);
      if (!this.isConst(factor)) this.factorSqfPp(factor, variable, multiplicity, result);
      else if (factor.as[0] === -1n && multiplicity % 2 === 1) result.constant = -result.constant;
      square = this.exactDiv(square, next);
      product = next;
    }
  }

  // factor_sqf_pp: the factors of a primitive square-free p of positive degree in x.
  private factorSqfPp(polynomial: Polynomial, variable: number, k: number, result: Factors) {
    const degree = this.degree(polynomial, variable);
    if (degree === 1) this.pushFactor(result, polynomial, k);
    else if (this.isUnivariate(polynomial)) this.factorSqfPpUniv(polynomial, k, result);
    else if (degree === 2) this.factorQuadratic(polynomial, variable, k, result);
    else if (!this.factorMultivariate(polynomial, variable, k, result))
      this.pushFactor(result, polynomial, k);
  }

  private pushFactor(result: Factors, polynomial: Polynomial, k: number) {
    result.factors.push(polynomial);
    result.degrees.push(k);
  }

  // to_numeral_vector: the coefficients of a univariate p by degree. Z3 normalizes p first but
  // reads the coefficients of p itself.
  // to_numeral_vector: a univariate p as its coefficients, low to high.
  toCoeffs(polynomial: Polynomial) {
    const coeffs = Array.from({ length: this.totalDegree(polynomial) + 1 }, () => 0n);
    for (let index = 0; index < polynomial.size; index++)
      coeffs[polynomial.ms[index].totalDegree] = polynomial.as[index];
    return this.um.set(coeffs);
  }

  // to_polynomial, mk_univariate: the monomials from the highest degree down.
  fromCoeffs(coeffs: readonly bigint[], variable: number) {
    for (let power = coeffs.length - 1; power >= 0; power--)
      this.cheap.add(coeffs[power], this.mkPower(variable, power));
    return this.cheap.mk();
  }

  // factor_sqf_pp_univ
  private factorSqfPpUniv(polynomial: Polynomial, k: number, result: Factors) {
    const variable = this.maxVar(polynomial);
    const fs: UpolynomialFactors = { constant: 1n, factors: [], degrees: [] };
    factorSquareFree(this.um, this.toCoeffs(polynomial), fs, 1, DEFAULT_FACTOR_PARAMS);
    if (fs.factors.length === 1 && fs.degrees[0] === 1) {
      this.pushFactor(result, polynomial, k);
      return;
    }
    for (let index = 0; index < fs.factors.length; index++)
      this.pushFactor(result, this.fromCoeffs(fs.factors[index], variable), k * fs.degrees[index]);
    if (fs.constant === -1n && k % 2 === 1) result.constant = -result.constant;
  }

  // factor_2_sqf_pp: a*x^2 + b*x + c splits into the primitive parts of 2*a*x + b -/+ sqrt(disc)
  // when the discriminant b^2 - 4*a*c is a square.
  private factorQuadratic(polynomial: Polynomial, variable: number, k: number, result: Factors) {
    let a = this.coeff(polynomial, variable, 2);
    let b = this.coeff(polynomial, variable, 1);
    let c = this.coeff(polynomial, variable, 0);
    const isFlipped = a.as[a.getGradedLexMaxPos()] < 0n;
    if (isFlipped) {
      a = this.neg(a);
      b = this.neg(b);
      c = this.neg(c);
    }
    const root = this.sqrt(this.addmul(1n, this.mul(b, b), -4n, this.mul(a, c)));
    if (root === null) {
      this.pushFactor(result, polynomial, k);
      return;
    }
    if (isFlipped && k % 2 === 1) result.constant = -result.constant;
    const linear = this.add(this.mulTerm(2n, this.mkPower(variable, 1), a), b);
    this.pushFactor(result, this.pp(this.sub(linear, root), variable), k);
    this.pushFactor(result, this.pp(this.add(linear, root), variable), k);
  }

  // is_perfect_square for the monomial at a position: the square root of its coefficient when the
  // whole term is a square.
  private getTermSquareRoot(polynomial: Polynomial, position: number) {
    const monomial = polynomial.ms[position];
    if (monomial.degrees.some((degree) => degree % 2 === 1)) return null;
    return getExactSquareRoot(polynomial.as[position]);
  }

  // sqrt: the square root of p with a positive graded-lex leading coefficient, or null.
  sqrt(polynomial: Polynomial) {
    if (polynomial.size === 0) return polynomial;
    if (this.getTermSquareRoot(polynomial, this.getGradedLexMinPos(polynomial)) === null)
      return null;
    const maxPos = polynomial.getGradedLexMaxPos();
    const a = this.getTermSquareRoot(polynomial, maxPos);
    if (a === null) return null;
    const maxMonomial = polynomial.ms[maxPos];
    const m1 = this.mkMonomial(
      maxMonomial.vars,
      maxMonomial.degrees.map((degree) => degree / 2),
    );
    const root = this.som;
    const rest = this.som2;
    root.reset();
    rest.reset();
    const twoA = 2n * a;
    root.addTerm(a, m1);
    for (let index = 0; index < polynomial.size; index++)
      if (index !== maxPos) rest.addTerm(polynomial.as[index], polynomial.ms[index]);
    while (true) {
      const restMax = rest.getGradedLexMaxPos();
      if (restMax === -1) {
        rest.reset();
        return root.mk();
      }
      const monomial = this.divMonomials(rest.ms[restMax], m1);
      if (monomial === null || rest.as[restMax] % twoA !== 0n) {
        root.reset();
        rest.reset();
        return null;
      }
      const coeff = floorDiv(rest.as[restMax], twoA);
      const rootSize = root.as.length;
      for (let index = 0; index < rootSize; index++) {
        if (root.as[index] === 0n) continue;
        rest.addTerm(-(root.as[index] * coeff * 2n), this.mulMonomials(root.ms[index], monomial));
      }
      rest.addTerm(-(coeff * coeff), this.mulMonomials(monomial, monomial));
      root.addTerm(coeff, monomial);
    }
  }

  // graded_lex_min_pos
  private getGradedLexMinPos(polynomial: Polynomial) {
    let minPos = 0;
    for (let index = 1; index < polynomial.size; index++)
      if (gradedLexCompare(polynomial.ms[index], polynomial.ms[minPos]) < 0) minPos = index;
    return minPos;
  }

  // vars: the variables of p in order of occurrence.
  // vars: the variables of p in the order they first occur.
  getVars(polynomial: Polynomial) {
    const vars: number[] = [];
    for (const monomial of polynomial.ms)
      for (const variable of monomial.vars) if (!vars.includes(variable)) vars.push(variable);
    return vars;
  }

  // substitute: p with each xs[i] replaced by the integer values[i].
  substitute(polynomial: Polynomial, vars: readonly number[], values: readonly bigint[]) {
    this.som.reset();
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      let coeff = polynomial.as[index];
      const keptVars: number[] = [];
      const keptDegrees: number[] = [];
      for (let power = 0; power < monomial.size; power++) {
        const position = vars.indexOf(monomial.vars[power]);
        if (position === -1) {
          keptVars.push(monomial.vars[power]);
          keptDegrees.push(monomial.degrees[power]);
        } else coeff *= values[position] ** BigInt(monomial.degrees[power]);
      }
      this.som.addTerm(coeff, this.mkMonomial(keptVars, keptDegrees));
    }
    return this.som.mk();
  }

  // translate: p(x + v), by Horner on the coefficients of p in x.
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

  // substitute(p, x2v): p with the rational values of its assigned variables, each term scaled by
  // the denominators to the maximal degree of their variable, and the content divided out. p itself
  // when it has no assigned variable.
  substituteRational(polynomial: Polynomial, values: readonly (Rational | undefined)[]) {
    // Map keeps the order in which the variables first occur, as var_max_degree does.
    const maxDegrees = new Map<number, number>();
    for (const monomial of polynomial.ms)
      for (let index = 0; index < monomial.size; index++) {
        const variable = monomial.vars[index];
        if (monomial.degrees[index] > (maxDegrees.get(variable) ?? 0))
          maxDegrees.set(variable, monomial.degrees[index]);
      }
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
      this.som.addTerm(coeff, this.mkMonomial(keptVars, keptDegrees));
    }
    return this.som.mk(true);
  }

  // muladd: p*q + a.
  private muladd(first: Polynomial, second: Polynomial, constant: bigint) {
    if (first.size === 0 || second.size === 0) return this.mkConst(constant);
    this.som.reset();
    for (let index = 0; index < first.size; index++)
      this.som.addmul(first.as[index], first.ms[index], second);
    this.som.addTerm(constant, this.unit);
    return this.som.mk();
  }

  // compose: p(q) for a univariate p, by Horner.
  private compose(polynomial: Polynomial, inner: Polynomial) {
    if (this.isConst(polynomial)) return polynomial;
    const variable = this.maxVar(polynomial);
    const degree = this.degree(polynomial, variable);
    const coeffs = Array.from({ length: degree + 1 }, () => 0n);
    for (let index = 0; index < polynomial.size; index++)
      coeffs[polynomial.ms[index].degreeOf(variable)] = polynomial.as[index];
    let result = this.mkConst(coeffs[degree]);
    for (let power = degree - 1; power >= 0; power--)
      result = this.muladd(inner, result, coeffs[power]);
    return result;
  }

  // compose_x_minus_y: p(x - y) for a univariate p in x.
  composeXMinusY(polynomial: Polynomial, variable: number) {
    const x = this.maxVar(polynomial);
    if (variable === x) return this.coeff(polynomial, x, 0);
    return this.compose(polynomial, this.mkLinear([1n, -1n], [x, variable], 0n));
  }

  // compose_x_div_y: y^n * p(x/y) for a univariate p in x of degree n.
  composeXDivY(polynomial: Polynomial, variable: number) {
    if (this.isConst(polynomial)) return polynomial;
    const x = this.maxVar(polynomial);
    const degree = this.degree(polynomial, x);
    for (let index = 0; index < polynomial.size; index++) {
      const power = polynomial.ms[index].degreeOf(x);
      const powers: [number, number][] =
        x < variable
          ? [
              [x, power],
              [variable, degree - power],
            ]
          : [
              [variable, degree - power],
              [x, power],
            ];
      const kept = powers.filter((entry) => entry[1] > 0);
      this.cheap.add(
        polynomial.as[index],
        this.mkMonomial(
          kept.map((entry) => entry[0]),
          kept.map((entry) => entry[1]),
        ),
      );
    }
    return this.cheap.mk();
  }

  // resultant: Res(p, q) in x, by the subresultant PRS on the primitive parts, times the contents.
  resultant(first: Polynomial, second: Polynomial, variable: number) {
    if (first.size === 0 || second.size === 0) return this.zero;
    if (this.isConst(first))
      return this.isConst(second) ? this.one : this.pw(first, this.degree(second, variable));
    if (this.isConst(second)) return this.pw(second, this.degree(first, variable));
    const [integerA, contentA, ppA] = this.iccp(first, variable);
    const [integerB, contentB, ppB] = this.iccp(second, variable);
    const scale = this.mul(
      this.pw(this.mulConst(integerA, contentA), this.degree(second, variable)),
      this.pw(this.mulConst(integerB, contentB), this.degree(first, variable)),
    );
    let a = ppA;
    let b = ppB;
    let sign = 1;
    if (this.degree(a, variable) < this.degree(b, variable)) {
      if (this.degree(a, variable) % 2 === 1 && this.degree(b, variable) % 2 === 1) sign = -1;
      [a, b] = [b, a];
    }
    let g = this.one;
    let h = this.one;
    while (true) {
      const degreeA = this.degree(a, variable);
      const degreeB = this.degree(b, variable);
      const delta = degreeA - degreeB;
      if (degreeA % 2 === 1 && degreeB % 2 === 1) sign = -sign;
      const remainder = this.exactPseudoRemainder(a, b, variable);
      a = b;
      b = this.exactDiv(remainder, g);
      for (let index = 0; index < delta; index++) b = this.exactDiv(b, h);
      g = this.lc(a, variable);
      let nextH = this.pw(g, delta);
      for (let index = 1; index < delta; index++) nextH = this.exactDiv(nextH, h);
      h = nextH;
      if (this.degree(b, variable) === 0) {
        const degree = this.degree(a, variable);
        let lastH = this.pw(this.lc(b, variable), degree);
        for (let index = 1; index < degree; index++) lastH = this.exactDiv(lastH, h);
        const result = this.mul(scale, lastH);
        return sign < 0 ? this.neg(result) : result;
      }
    }
  }

  private isSquareFreeIn(polynomial: Polynomial, variable: number) {
    if (this.isConst(polynomial)) return polynomial.size > 0;
    return this.isConst(this.gcd(polynomial, this.derivative(polynomial, variable)));
  }

  private isPrimitive(polynomial: Polynomial, variable: number) {
    return this.eq(polynomial, this.pp(polynomial, variable));
  }

  // factor_n_sqf_pp, try_multivar_factor: reduces p to two variables by evaluating the others,
  // factors it at a point of the lifting variable, lifts a split of the univariate factors with
  // Hensel's lemma and keeps it when the lifted factors multiply back to p. Returns false when no
  // split lifts, leaving p unfactored.
  private factorMultivariate(polynomial: Polynomial, x: number, k: number, result: Factors) {
    const allVars = this.getVars(polynomial);
    const mainVars = [
      x,
      ...allVars
        .filter((variable) => variable !== x)
        .map((variable) => [this.degree(polynomial, variable), variable])
        .sort((first, second) => second[0] - first[0] || second[1] - first[1])
        .filter((entry) => entry[0] > 1)
        .map((entry) => entry[1]),
    ];
    for (const mainVar of mainVars) {
      const degMain = this.degree(polynomial, mainVar);
      if (degMain <= 1) continue;
      for (const liftVar of allVars) {
        if (liftVar === mainVar) continue;
        const evalVars = allVars.filter((variable) => variable !== mainVar && variable !== liftVar);
        const maxCombos = evalVars.length === 0 ? 1 : 5;
        for (let combo = 0; combo < maxCombos; combo++) {
          const bivariate =
            evalVars.length === 0
              ? polynomial
              : this.substitute(
                  polynomial,
                  evalVars,
                  evalVars.map(
                    (_variable, index) =>
                      FACTOR_EVAL_VALUES[
                        Math.floor(combo / FACTOR_EVAL_VALUES.length ** index) %
                          FACTOR_EVAL_VALUES.length
                      ],
                  ),
                );
          if (this.degree(bivariate, mainVar) !== degMain) continue;
          const degLift = this.degree(bivariate, liftVar);
          if (degLift === 0) continue;
          for (const point of FACTOR_EVAL_VALUES) {
            const univariate = this.substitute(bivariate, [liftVar], [point]);
            if (!this.isUnivariate(univariate)) continue;
            if (this.degree(univariate, mainVar) !== degMain) continue;
            if (!this.isSquareFreeIn(univariate, mainVar)) continue;
            const univariateFs: UpolynomialFactors = { constant: 1n, factors: [], degrees: [] };
            factorSquareFree(
              this.um,
              this.um.getPrimitive(this.toCoeffs(univariate)),
              univariateFs,
              1,
              DEFAULT_FACTOR_PARAMS,
            );
            const factorCount = univariateFs.factors.length;
            if (factorCount <= 1) continue;
            const translated = this.translate(bivariate, liftVar, point);
            const lcPolynomial = this.coeff(translated, mainVar, degMain);
            const lcAtZero = this.isConst(lcPolynomial)
              ? (lcPolynomial.as[0] ?? 0n)
              : this.getConstValue(this.substitute(lcPolynomial, [liftVar], [0n]));
            if (lcAtZero === null) continue;
            for (const prime of FACTOR_PRIMES) {
              if (getGcd(prime, lcAtZero) !== 1n) continue;
              for (let split = 1; split <= Math.floor(factorCount / 2); split++) {
                let h1 = univariateFs.factors[0];
                for (let index = 1; index < split; index++)
                  h1 = this.um.mul(h1, univariateFs.factors[index]);
                let h2 = univariateFs.factors[split];
                for (let index = split + 1; index < factorCount; index++)
                  h2 = this.um.mul(h2, univariateFs.factors[index]);
                const lifted = this.liftBivariate(
                  translated,
                  mainVar,
                  liftVar,
                  degLift,
                  this.um.flipSignIfLmNeg(h1),
                  this.um.flipSignIfLmNeg(h2),
                  lcAtZero,
                  prime,
                );
                if (lifted === null) continue;
                const candidates = lifted.map((factor) => this.translate(factor, liftVar, -point));
                if (evalVars.length === 0) {
                  for (const candidate of candidates) {
                    if (this.isConst(candidate) || this.degree(candidate, x) === 0) continue;
                    this.pushSmallFactor(candidate, x, k, result);
                  }
                  return true;
                }
                for (const candidate of candidates) {
                  if (this.isConst(candidate)) continue;
                  const division = this.exactPseudoDivision(
                    polynomial,
                    candidate,
                    this.maxVar(candidate),
                  );
                  if (division.remainder.size !== 0) continue;
                  if (!this.eq(this.mul(candidate, division.quotient), polynomial)) continue;
                  for (const part of [candidate, division.quotient]) {
                    if (this.isConst(part)) result.constant *= part.as[0];
                    else if (this.degree(part, x) !== 0) this.pushSmallFactor(part, x, k, result);
                  }
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  // The factors of a lifted part, splitting only linear and quadratic ones further.
  private pushSmallFactor(polynomial: Polynomial, x: number, k: number, result: Factors) {
    const degree = this.degree(polynomial, x);
    if (degree === 2 && this.isPrimitive(polynomial, x) && this.isSquareFreeIn(polynomial, x))
      this.factorQuadratic(polynomial, x, k, result);
    else this.pushFactor(result, polynomial, k);
  }

  private getConstValue(polynomial: Polynomial) {
    if (!this.isConst(polynomial)) return null;
    return polynomial.as[0] ?? 0n;
  }

  // try_bivar_hensel_lift: lifts q(x, 0) = lc * h1 * h2 to q = F1 * F2 in Z_p[x][y] by linear
  // Hensel lifting on the coefficients of y, then reads F1 and F2 back over Z. Null when h1 and h2
  // are not coprime in Z_p, q is not bivariate, or the product of the lifted factors is not q.
  private liftBivariate(
    q: Polynomial,
    x: number,
    y: number,
    degY: number,
    h1: readonly bigint[],
    h2: readonly bigint[],
    lc: bigint,
    prime: bigint,
  ) {
    const zp = new UpolynomialManager(prime);
    const f1 = zp.mkMonic(zp.set(h1));
    const f2 = zp.mkMonic(zp.set(h2));
    const ext = zp.extGcd(f1, f2);
    if (ext.d.length !== 1 || ext.d[0] !== 1n) return null;
    const qCoeffs: bigint[][] = [];
    for (let power = 0; power <= degY; power++) {
      const coeff = this.coeff(q, y, power);
      if (coeff.size !== 0 && !this.isUnivariate(coeff) && !this.isConst(coeff)) return null;
      qCoeffs.push(zp.set(coeff.size === 0 ? [] : this.toCoeffs(coeff)));
    }
    const f1Coeffs: bigint[][] = Array.from({ length: degY + 1 }, () => []);
    const f2Coeffs: bigint[][] = Array.from({ length: degY + 1 }, () => []);
    f1Coeffs[0] = zp.set(f1);
    f2Coeffs[0] = zp.mulConst(f2, zp.normalizeNumeral(lc));
    const lcInv = zp.inv(lc);
    for (let power = 1; power <= degY; power++) {
      let error = zp.set(qCoeffs[power]);
      for (let first = 0; first <= power; first++) {
        const second = power - first;
        if (second > degY || second === 0 || first === 0) continue;
        if (f1Coeffs[first].length === 0 || f2Coeffs[second].length === 0) continue;
        error = zp.sub(error, zp.mul(f1Coeffs[first], f2Coeffs[second]));
      }
      if (error.length === 0) continue;
      const a = zp.divRem(zp.mul(error, ext.v), f1).remainder;
      const b = zp.divRem(zp.mul(error, ext.u), f2).remainder;
      f1Coeffs[power] = zp.mulConst(a, lcInv);
      f2Coeffs[power] = zp.set(b);
    }
    const toPolynomial = (coeffs: readonly bigint[][]) => {
      let result = this.zero;
      for (let power = 0; power <= degY; power++) {
        if (coeffs[power].length === 0) continue;
        const univariate = this.fromCoeffs(coeffs[power], x);
        if (univariate.size === 0) continue;
        result = this.add(result, this.mulTerm(1n, this.mkPower(y, power), univariate));
      }
      return result;
    };
    const first = toPolynomial(f1Coeffs);
    const second = toPolynomial(f2Coeffs);
    return this.eq(this.mul(first, second), q) ? [first, second] : null;
  }

  // psc_chain: the nonzero principal subresultant coefficients of p and q in x, the resultant
  // first, or [0] when there are none. psc_chain_optimized: Ducos's subresultant chain with
  // Lazard's dichotomous S_e.
  pscChain(first: Polynomial, second: Polynomial, variable: number) {
    const chain =
      this.degree(first, variable) >= this.degree(second, variable)
        ? this.pscChainCore(first, second, variable)
        : this.pscChainCore(second, first, variable);
    return chain.length === 0 ? [this.zero] : chain.reverse();
  }

  private pscChainCore(p: Polynomial, q: Polynomial, x: number) {
    const chain: Polynomial[] = [];
    let s = this.pw(this.lc(q, x), this.degree(p, x) - this.degree(q, x));
    let a = q;
    let b = this.exactPseudoRemainder(p, this.neg(q), x);
    while (b.size > 0) {
      const d = this.degree(a, x);
      const e = this.degree(b, x);
      // b is S_{d-1}.
      const principal = this.coeff(b, x, d - 1);
      if (principal.size > 0) chain.push(principal);
      let c = b;
      if (d - e > 1) {
        c = this.getSeLazard(d, s, b, x);
        const principalE = this.coeff(c, x, e);
        if (principalE.size > 0) chain.push(principalE);
      }
      if (e === 0) break;
      b = this.getOptimizedSe1(d, e, a, b, c, s, x);
      a = c;
      s = this.lc(a, x);
    }
    return chain;
  }

  // Se_Lazard: S_e from S_{d-1} and lc(S_d) by dichotomous Lazard.
  private getSeLazard(d: number, lcSd: Polynomial, sd1: Polynomial, x: number) {
    let n = d - this.degree(sd1, x) - 1;
    if (n === 0) return sd1;
    const lcSd1 = this.lc(sd1, x);
    let a = 1 << (31 - Math.clz32(n));
    let c = lcSd1;
    n -= a;
    while (a !== 1) {
      a /= 2;
      c = this.exactDiv(this.mul(c, c), lcSd);
      if (n >= a) {
        c = this.exactDiv(this.mul(c, lcSd1), lcSd);
        n -= a;
      }
    }
    return this.exactDiv(this.mul(c, sd1), lcSd);
  }

  // optimized_S_e_1: S_{e-1} from A = S_{d+1}, S_{d-1}, S_e and s = lc(S_d).
  private getOptimizedSe1(
    d: number,
    e: number,
    a: Polynomial,
    sd1: Polynomial,
    se: Polynomial,
    s: Polynomial,
    x: number,
  ) {
    const cd1 = this.lc(sd1, x);
    const lcSe = this.lc(se, x);
    const getPower = (power: number) => (power === 0 ? this.one : this.mkVar(x, power));
    const h: Polynomial[] = [];
    for (let j = 0; j < e; j++) h.push(this.mul(lcSe, getPower(j)));
    h.push(this.sub(this.mul(lcSe, getPower(e)), se));
    const xPolynomial = this.mkVar(x);
    for (let j = e + 1; j < d; j++) {
      const xh = this.mul(xPolynomial, h[j - 1]);
      h.push(this.sub(xh, this.exactDiv(this.mul(this.coeff(xh, x, e), sd1), cd1)));
    }
    let sum = this.zero;
    for (let j = 0; j < d; j++) sum = this.add(sum, this.mul(this.coeff(a, x, j), h[j]));
    const dPolynomial = this.exactDiv(sum, this.lc(a, x));
    const xh = this.mul(xPolynomial, h[d - 1]);
    const result = this.exactDiv(
      this.sub(this.mul(cd1, this.add(xh, dPolynomial)), this.mul(this.coeff(xh, x, e), sd1)),
      s,
    );
    return (d - e + 1) % 2 === 1 ? this.neg(result) : result;
  }

  // Evaluation.

  // t_eval: p at the values of its variables, by Horner on the lexicographically sorted monomials,
  // which sorts p in place as Z3 does.
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

  // t_eval_core: the monomials in [start, end), ignoring the variables above x.
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

  // max_smaller_than: the largest variable below x in the monomials in [start, end).
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

// polynomial::cache: hash-conses polynomials and memoizes their subresultants and factors.
export class PolynomialCache {
  private table = new Map<string, Polynomial>();
  private inCache = new Set<number>();
  private pscChains = new Map<string, Polynomial[]>();
  private factorizations = new Map<number, Polynomial[]>();

  constructor(readonly pm: PolynomialManager) {}

  reset() {
    this.table.clear();
    this.inCache.clear();
    this.pscChains.clear();
    this.factorizations.clear();
  }

  mkUnique(polynomial: Polynomial) {
    if (this.inCache.has(polynomial.id)) return polynomial;
    const key = this.pm.getKey(polynomial);
    const existing = this.table.get(key);
    if (existing !== undefined) return existing;
    this.table.set(key, polynomial);
    this.inCache.add(polynomial.id);
    return polynomial;
  }

  contains(polynomial: Polynomial) {
    return this.inCache.has(polynomial.id);
  }

  pscChain(first: Polynomial, second: Polynomial, variable: number) {
    const p = this.mkUnique(first);
    const q = this.mkUnique(second);
    const key = `${p.id},${q.id},${variable}`;
    const cached = this.pscChains.get(key);
    if (cached !== undefined) return cached;
    const chain = this.pm.pscChain(p, q, variable).map((element) => this.mkUnique(element));
    this.pscChains.set(key, chain);
    return chain;
  }

  // factor: the distinct factors, without the constant.
  factor(polynomial: Polynomial) {
    const unique = this.mkUnique(polynomial);
    const cached = this.factorizations.get(unique.id);
    if (cached !== undefined) return cached;
    const factors = this.pm.factor(unique).factors.map((factor) => this.mkUnique(factor));
    this.factorizations.set(unique.id, factors);
    return factors;
  }
}
