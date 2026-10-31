// Ported from Z3 (src/math/polynomial/polynomial.{h,cpp}, src/math/polynomial/polynomial_cache.cpp),
// MIT license, see z3-license.txt. Multivariate polynomials over the integers, as far as nlsat's
// check_assignment needs them. A polynomial keeps its monomials in the order Z3's som buffers
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
import { getGcd, Rational } from "../rational";

export const NULL_VAR = -1;

// Input outside what the port of nlsat supports: a polynomial of degree 2 or more in the variable
// being projected or factored. The nra solver answers unknown on it, which is always sound.
export class NlsatOutOfScope extends Error {
  constructor(reason: string) {
    super(`nlsat input out of scope: ${reason}`);
  }
}

export class Monomial {
  readonly totalDegree: number;

  constructor(
    readonly id: number,
    readonly vars: readonly number[],
    readonly degrees: readonly number[],
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
    let maxPos = 0;
    for (let index = 1; index < ms.length; index++)
      if (isPoGreater(ms[index], ms[maxPos])) maxPos = index;
    this.swapFirst(maxPos);
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

  getGradedLexMaxPos() {
    let maxPos = -1;
    for (let index = 0; index < this.as.length; index++) {
      if (this.as[index] === 0n) continue;
      if (maxPos === -1 || gradedLexCompare(this.ms[index], this.ms[maxPos]) > 0) maxPos = index;
    }
    return maxPos;
  }

  mk() {
    const as: bigint[] = [];
    const ms: Monomial[] = [];
    for (let index = 0; index < this.as.length; index++) {
      if (this.as[index] === 0n) continue;
      as.push(this.as[index]);
      ms.push(this.ms[index]);
    }
    this.reset();
    return this.manager.mkPolynomialCore(as, ms);
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
    const key = vars.map((variable, index) => `${variable}^${degrees[index]}`).join(",");
    const existing = this.monomials.get(key);
    if (existing !== undefined) return existing;
    const monomial = new Monomial(this.monomials.size, vars, degrees);
    this.monomials.set(key, monomial);
    return monomial;
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
      if (monomial === null) throw new Error("exact_div: the divisor does not divide");
      const coeff = remainder.as[remainderPos] / divisorCoeff;
      quotient.addTerm(coeff, monomial);
      remainder.addmul(-coeff, monomial, divisor);
    }
  }

  // exact_pseudo_remainder: R with lc(q)^(deg(p) - deg(q) + 1) * p = Q*q + R.
  exactPseudoRemainder(polynomial: Polynomial, divisor: Polynomial, variable: number) {
    const degA = this.degree(polynomial, variable);
    const degB = this.degree(divisor, variable);
    if (degB === 0) return this.zero;
    const lcB = this.coeff(divisor, variable, degB);
    const reductB = this.reduct(divisor, variable, degB);
    let remainder = polynomial;
    let steps = 0;
    while (true) {
      const degR = this.degree(remainder, variable);
      if (degB > degR) {
        const exactSteps = degA - degB + 1;
        if (steps < exactSteps) remainder = this.mul(this.pw(lcB, exactSteps - steps), remainder);
        return remainder;
      }
      this.som.reset();
      for (let index = 0; index < remainder.size; index++) {
        const monomial = remainder.ms[index];
        const coeff = remainder.as[index];
        if (monomial.degreeOf(variable) === degR)
          this.som.addmul(-coeff, this.divXk(monomial, variable, degB), reductB);
        else this.som.addmul(coeff, monomial, lcB);
      }
      remainder = this.som.mk();
      steps++;
    }
  }

  // The reduct of coeff(p, x, k, reduct): p without its x^k monomials.
  private reduct(polynomial: Polynomial, variable: number, power: number) {
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

  private factorSqfPp(
    polynomial: Polynomial,
    variable: number,
    multiplicity: number,
    result: Factors,
  ) {
    if (this.degree(polynomial, variable) !== 1)
      throw new NlsatOutOfScope(`factoring ${polynomial} of degree 2 or more in x${variable}`);
    result.factors.push(polynomial);
    result.degrees.push(multiplicity);
  }

  // psc_chain: the principal subresultant coefficients of p and q in x, the resultant first. Only
  // polynomials of degree 1 in x are in scope, whose chain is the resultant alone.
  pscChain(first: Polynomial, second: Polynomial, variable: number) {
    const [p, q] =
      this.degree(first, variable) >= this.degree(second, variable)
        ? [first, second]
        : [second, first];
    if (this.degree(p, variable) > 1 || this.degree(q, variable) === 0)
      throw new NlsatOutOfScope(
        `the subresultants of polynomials of degree 2 or more in x${variable}`,
      );
    const remainder = this.exactPseudoRemainder(p, this.neg(q), variable);
    if (remainder.size === 0) return [this.zero];
    const coeff = this.coeff(remainder, variable, 0);
    return coeff.size === 0 ? [this.zero] : [coeff];
  }

  // Evaluation at a rational point.

  evaluate(polynomial: Polynomial, values: readonly (Rational | undefined)[]) {
    let result = Rational.zero;
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      let term = Rational.of(polynomial.as[index]);
      for (let power = 0; power < monomial.size; power++) {
        const value = values[monomial.vars[power]];
        if (value === undefined) throw new Error(`x${monomial.vars[power]} is unassigned`);
        for (let count = 0; count < monomial.degrees[power]; count++) term = term.mul(value);
      }
      result = result.add(term);
    }
    return result;
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
