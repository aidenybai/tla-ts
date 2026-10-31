// Ported from Z3 (src/math/dd/dd_pdd.h, src/math/dd/dd_pdd.cpp, src/math/dd/pdd_eval.h), MIT
// license, see z3-license.txt. Polynomial decision diagrams over the rationals, which nla's Grobner
// solver works on: a node is x*hi + lo for the variable x at its level, lo has no x, and the leaves
// are values. Only the free semantics is ported, the one nla and dd::solver use: not mod2, mod2N or
// zero_one_vars, nor what only those or polysat use (the boolean operations, substitution of
// values, resolve, quot_rem, and division without the inverse). Nodes are never freed, so there is
// no garbage collection: node indices match Z3's until its first collection, and the node limit
// counts every node made. The op cache keys on both operands, where Z3's eq_entry compares the
// first operand of one entry with the second of the other.
import { getGcd, Rational } from "../rational";
import { shrink } from "../array";

const ZERO_PDD = 0;
const ONE_PDD = 1;
const ADD_OP = 2;
const SUB_OP = 3;
const MINUS_OP = 4;
const MUL_OP = 5;
const REDUCE_OP = 6;
// Nodes below this index stand for the operations in the op cache, besides 0 and 1.
const NO_OP = 10;
const INITIAL_FREE_NODES = 1024;

// mem_out: a node past the limit was needed outside an operation, which grows the limit instead.
export class PddMemoryOut extends Error {
  constructor() {
    super("the pdd manager ran out of nodes");
  }
}

export interface PddMonomial {
  coeff: Rational;
  vars: number[];
}

export interface PddCoefficient {
  coeff: Rational;
  isConstant: boolean;
}

export interface PddPower {
  var: number;
  degree: number;
}

export interface PddFactor {
  lc: Pdd;
  rest: Pdd;
}

export interface PddVarFactors {
  vars: number[];
  poly: Pdd;
}

interface IteratorNode {
  isFirst: boolean;
  node: number;
}

interface CommonFactors {
  first: number[];
  second: number[];
  firstCoeff: Rational;
  secondCoeff: Rational;
}

export class PddManager {
  private levels: number[] = [];
  private los: number[] = [];
  private his: number[] = [];
  private values: Rational[] = [];
  private nodeTable = new Map<string, number>();
  private valueTable = new Map<string, number>();
  private opCache = new Map<string, number>();
  private factorCache = new Map<string, PddFactor>();
  private degrees: number[] = [];
  private numAllocated = 0;
  private maxNumNodes = 1 << 24;
  private isApplying = false;
  var2pdd: number[] = [];
  var2level: number[] = [];
  level2var: number[] = [];

  constructor(numVars: number) {
    this.initNodes(Array.from({ length: numVars }, (_, index) => index));
  }

  reset(level2var: number[]) {
    this.levels = [];
    this.los = [];
    this.his = [];
    this.values = [];
    this.nodeTable.clear();
    this.valueTable.clear();
    this.opCache.clear();
    this.factorCache.clear();
    this.degrees = [];
    this.initNodes(level2var);
  }

  private initNodes(level2var: number[]) {
    for (let index = 0; index < NO_OP; index++) {
      this.levels.push(0);
      this.los.push(0);
      this.his.push(0);
    }
    this.los[ONE_PDD] = 1;
    this.values.push(Rational.zero, Rational.one);
    this.numAllocated = NO_OP + INITIAL_FREE_NODES + level2var.length;
    this.var2pdd = [];
    this.var2level = [];
    this.level2var = [];
    for (let level = 0; level < level2var.length; level++) {
      const variable = level2var[level];
      this.var2pdd[variable] = this.makeNode(level, ZERO_PDD, ONE_PDD);
      this.var2level[variable] = level;
      this.level2var[level] = variable;
    }
  }

  setMaxNumNodes(limit: number) {
    this.maxNumNodes = limit + this.level2var.length;
  }

  numNodes() {
    return this.levels.length;
  }

  numVars() {
    return this.var2pdd.length;
  }

  isVal(node: number) {
    return this.his[node] === 0;
  }

  level(node: number) {
    return this.levels[node];
  }

  // A value node is at level 0, so its var is the lowest variable, as in Z3.
  var(node: number) {
    return this.level2var[this.levels[node]];
  }

  lo(node: number) {
    return this.los[node];
  }

  hi(node: number) {
    return this.his[node];
  }

  val(node: number) {
    return this.values[this.los[node]];
  }

  offset(node: number) {
    let current = node;
    while (!this.isVal(current)) current = this.lo(current);
    return this.val(current);
  }

  mkVar(variable: number) {
    while (this.var2level.length <= variable) {
      const next = this.var2level.length;
      this.var2pdd.push(this.makeNode(next, ZERO_PDD, ONE_PDD));
      this.var2level.push(next);
      this.level2var.push(next);
    }
    return new Pdd(this, this.var2pdd[variable]);
  }

  mkVal(value: Rational) {
    return new Pdd(this, this.imkVal(value));
  }

  zero() {
    return new Pdd(this, ZERO_PDD);
  }

  one() {
    return new Pdd(this, ONE_PDD);
  }

  add(first: Pdd, second: Pdd) {
    return new Pdd(this, this.apply(first.root, second.root, ADD_OP));
  }

  sub(first: Pdd, second: Pdd) {
    return new Pdd(this, this.apply(first.root, second.root, SUB_OP));
  }

  mul(first: Pdd, second: Pdd) {
    return new Pdd(this, this.apply(first.root, second.root, MUL_OP));
  }

  reduce(first: Pdd, second: Pdd) {
    return new Pdd(this, this.apply(first.root, second.root, REDUCE_OP));
  }

  minus(poly: Pdd) {
    return new Pdd(
      this,
      this.whileApplying(() => this.minusRec(poly.root)),
    );
  }

  pow(poly: Pdd, exponent: number): Pdd {
    if (exponent === 0) return this.one();
    if (exponent === 1 || poly.isZero() || poly.isOne()) return poly;
    if (poly.isVal()) {
      let power = Rational.one;
      for (let index = 0; index < exponent; index++) power = power.mul(poly.val());
      return this.mkVal(power);
    }
    // j even: pow(p,2*j') = pow(p*p,j'); j odd: pow(p,2*j'+1) = p*pow(p*p,j')
    const half = this.pow(this.mul(poly, poly), Math.floor(exponent / 2));
    return exponent % 2 === 1 ? this.mul(half, poly) : half;
  }

  // apply: operations grow the node limit where Z3 catches mem_out, collects garbage, retries and
  // then doubles the limit. Without garbage to collect, only the doubling matters.
  private apply(first: number, second: number, op: number) {
    return this.whileApplying(() => this.applyRec(first, second, op));
  }

  private whileApplying(compute: () => number) {
    this.isApplying = true;
    try {
      return compute();
    } finally {
      this.isApplying = false;
    }
  }

  private applyRec(first: number, second: number, op: number): number {
    switch (op) {
      case SUB_OP:
        if (second === ZERO_PDD) return first;
        if (this.isVal(first) && this.isVal(second)) {
          return this.imkVal(this.val(first).sub(this.val(second)));
        }
        break;
      case ADD_OP:
        if (first === ZERO_PDD) return second;
        if (second === ZERO_PDD) return first;
        if (this.isVal(first) && this.isVal(second)) {
          return this.imkVal(this.val(first).add(this.val(second)));
        }
        if (this.isVal(first) || (!this.isVal(second) && this.level(first) < this.level(second))) {
          return this.applyRec(second, first, op);
        }
        break;
      case MUL_OP:
        if (first === ZERO_PDD || second === ZERO_PDD) return ZERO_PDD;
        if (first === ONE_PDD) return second;
        if (second === ONE_PDD) return first;
        if (this.isVal(first) && this.isVal(second)) {
          return this.imkVal(this.val(first).mul(this.val(second)));
        }
        if (this.isVal(first) || (!this.isVal(second) && this.level(first) < this.level(second))) {
          return this.applyRec(second, first, op);
        }
        break;
      case REDUCE_OP:
        if (second === ZERO_PDD || this.isVal(first)) return first;
        if (this.degree(first) < this.degree(second)) return first;
        if (this.level(this.firstLeading(second)) > this.level(first)) return first;
        break;
    }
    const key = `${op},${first},${second}`;
    const cached = this.opCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.computeApply(first, second, op);
    this.opCache.set(key, result);
    return result;
  }

  private computeApply(first: number, second: number, op: number) {
    const firstLevel = this.level(first);
    const secondLevel = this.level(second);
    const firstLo = this.lo(first);
    const firstHi = this.hi(first);
    switch (op) {
      case ADD_OP: {
        if (this.isVal(second) || firstLevel !== secondLevel) {
          return this.makeNode(firstLevel, this.applyRec(firstLo, second, op), firstHi);
        }
        const lo = this.applyRec(firstLo, this.lo(second), op);
        return this.makeNode(firstLevel, lo, this.applyRec(firstHi, this.hi(second), op));
      }
      case SUB_OP: {
        if (this.isVal(first) || (!this.isVal(second) && firstLevel < secondLevel)) {
          // p - (ax + b) = -ax + (p - b)
          const lo = this.applyRec(first, this.lo(second), op);
          return this.makeNode(secondLevel, lo, this.minusRec(this.hi(second)));
        }
        if (this.isVal(second) || firstLevel > secondLevel) {
          // (ax + b) - k = ax + (b - k)
          return this.makeNode(firstLevel, this.applyRec(firstLo, second, op), firstHi);
        }
        // (ax + b) - (cx + d) = (a - c)x + (b - d)
        const lo = this.applyRec(firstLo, this.lo(second), op);
        return this.makeNode(firstLevel, lo, this.applyRec(firstHi, this.hi(second), op));
      }
      case MUL_OP: {
        if (this.isVal(second) || firstLevel !== secondLevel) {
          // (x*hi(p)+lo(p))*b = x*hi(p)*b + lo(p)*b
          const lo = this.applyRec(firstLo, second, op);
          return this.makeNode(firstLevel, lo, this.applyRec(firstHi, second, op));
        }
        // (xa + b)(xc + d) = x(x*ac + ad + bc) + bd, where ad + bc may be x*e + f, so that the
        // hi child is x*(ac + e) + f.
        const ac = this.applyRec(firstHi, this.hi(second), op);
        const ad = this.applyRec(firstHi, this.lo(second), op);
        const bc = this.applyRec(firstLo, this.hi(second), op);
        const bd = this.applyRec(firstLo, this.lo(second), op);
        const sum = this.applyRec(ad, bc, ADD_OP);
        if (!this.isVal(sum) && this.level(sum) === firstLevel) {
          const hi = this.applyRec(ac, this.hi(sum), ADD_OP);
          return this.makeNode(firstLevel, bd, this.makeNode(firstLevel, this.lo(sum), hi));
        }
        return this.makeNode(firstLevel, bd, this.makeNode(firstLevel, sum, ac));
      }
      default: {
        if (this.level(this.firstLeading(second)) >= firstLevel) {
          return this.reduceOnMatch(first, second);
        }
        const lo = this.applyRec(firstLo, second, op);
        const hi = this.applyRec(firstHi, second, op);
        if (lo === firstLo && hi === firstHi) return first;
        if (this.level(lo) < firstLevel && this.level(hi) <= firstLevel) {
          return this.makeNode(firstLevel, lo, hi);
        }
        const product = this.applyRec(hi, this.var2pdd[this.var(first)], MUL_OP);
        return this.applyRec(product, lo, ADD_OP);
      }
    }
  }

  private minusRec(node: number): number {
    if (node === ZERO_PDD) return ZERO_PDD;
    if (this.isVal(node)) return this.imkVal(this.val(node).neg());
    const key = `${MINUS_OP},${node},${node}`;
    const cached = this.opCache.get(key);
    if (cached !== undefined) return cached;
    const lo = this.minusRec(this.lo(node));
    const result = this.makeNode(this.level(node), lo, this.minusRec(this.hi(node)));
    this.opCache.set(key, result);
    return result;
  }

  // reduce_on_match: the monomials of a that lm(b) divides become (b - lt(b))/lm(b).
  private reduceOnMatch(first: number, second: number) {
    let current = first;
    while (this.lmOccurs(second, current)) {
      const product = this.applyRec(this.ltQuotient(second, current), second, MUL_OP);
      current = this.applyRec(current, product, ADD_OP);
    }
    return current;
  }

  // lm_occurs: whether the leading monomial of p divides a monomial of q.
  private lmOccurs(first: number, second: number): boolean {
    let divisor = this.firstLeading(first);
    let target = second;
    for (;;) {
      if (this.isVal(divisor)) return true;
      if (this.isVal(target)) return false;
      if (this.level(divisor) > this.level(target)) return false;
      if (this.level(divisor) === this.level(target)) {
        divisor = this.nextLeading(divisor);
        target = this.hi(target);
      } else if (this.lmOccurs(divisor, this.hi(target))) {
        return true;
      } else {
        target = this.lo(target);
      }
    }
  }

  // lt_quotient: minus the r such that lt(p)*r is a monomial of q, given lm_occurs(p, q).
  private ltQuotient(first: number, second: number): number {
    let divisor = this.firstLeading(first);
    let target = second;
    while (!this.isVal(divisor)) {
      if (this.level(divisor) === this.level(target)) {
        divisor = this.nextLeading(divisor);
        target = this.lmOccurs(divisor, this.hi(target)) ? this.hi(target) : this.lo(target);
      } else if (this.lmOccurs(divisor, this.hi(target))) {
        return this.ltQuotientHi(divisor, target);
      } else {
        target = this.lo(target);
      }
    }
    if (this.isVal(target)) return this.imkVal(this.val(target).neg().div(this.val(divisor)));
    return this.ltQuotientHi(divisor, target);
  }

  private ltQuotientHi(first: number, second: number) {
    const quotient = this.ltQuotient(first, this.hi(second));
    return this.applyRec(this.var2pdd[this.var(second)], quotient, MUL_OP);
  }

  // try_spoly: a*q*qc - b*p*pc, where p = lcm(lm(a),lm(b))/lm(a), q = lcm(lm(a),lm(b))/lm(b) and pc
  // and qc are the leading coefficients of a and b, when the leading monomials share a variable.
  trySpoly(first: Pdd, second: Pdd) {
    const factors = this.commonFactors(first, second);
    if (factors === null) return null;
    let firstMultiplier = this.mkVal(factors.secondCoeff);
    for (let index = factors.second.length; index-- > 0;) {
      firstMultiplier = firstMultiplier.mul(this.mkVar(factors.second[index]));
    }
    let secondMultiplier = this.mkVal(factors.firstCoeff.neg());
    for (let index = factors.first.length; index-- > 0;) {
      secondMultiplier = secondMultiplier.mul(this.mkVar(factors.first[index]));
    }
    return firstMultiplier.mul(first).add(secondMultiplier.mul(second));
  }

  private commonFactors(first: Pdd, second: Pdd): CommonFactors | null {
    const firstVars: number[] = [];
    const secondVars: number[] = [];
    let firstNode = this.firstLeading(first.root);
    let secondNode = this.firstLeading(second.root);
    let hasCommon = false;
    for (;;) {
      if (this.isVal(firstNode) || this.isVal(secondNode)) {
        if (!hasCommon) return null;
        while (!this.isVal(secondNode)) {
          secondVars.push(this.var(secondNode));
          secondNode = this.nextLeading(secondNode);
        }
        while (!this.isVal(firstNode)) {
          firstVars.push(this.var(firstNode));
          firstNode = this.nextLeading(firstNode);
        }
        const firstCoeff = this.val(firstNode);
        const secondCoeff = this.val(secondNode);
        if (!firstCoeff.isInt() || !secondCoeff.isInt()) {
          return { first: firstVars, second: secondVars, firstCoeff, secondCoeff };
        }
        const gcd = Rational.of(getGcd(firstCoeff.num, secondCoeff.num));
        return {
          first: firstVars,
          second: secondVars,
          firstCoeff: firstCoeff.div(gcd),
          secondCoeff: secondCoeff.div(gcd),
        };
      }
      if (this.level(firstNode) === this.level(secondNode)) {
        hasCommon = true;
        firstNode = this.nextLeading(firstNode);
        secondNode = this.nextLeading(secondNode);
      } else if (this.level(firstNode) > this.level(secondNode)) {
        firstVars.push(this.var(firstNode));
        firstNode = this.nextLeading(firstNode);
      } else {
        secondVars.push(this.var(secondNode));
        secondNode = this.nextLeading(secondNode);
      }
    }
  }

  // lm_lt: compares the leading monomials, then the monomials in degree-lex order.
  lmLt(first: Pdd, second: Pdd) {
    let firstNode = this.firstLeading(first.root);
    let secondNode = this.firstLeading(second.root);
    while (firstNode !== secondNode && !(this.isVal(firstNode) && this.isVal(secondNode))) {
      if (this.isVal(firstNode)) return true;
      if (this.isVal(secondNode)) return false;
      if (this.level(firstNode) !== this.level(secondNode)) {
        return this.level(firstNode) < this.level(secondNode);
      }
      firstNode = this.nextLeading(firstNode);
      secondNode = this.nextLeading(secondNode);
    }
    const isDegreeLexGt = (left: number[], right: number[]) => {
      if (left.length !== right.length) return left.length > right.length;
      let index = 0;
      while (index < left.length && left[index] === right[index]) index++;
      return index < left.length && this.var2level[left[index]] > this.var2level[right[index]];
    };
    const compare = (left: number[], right: number[]) =>
      isDegreeLexGt(left, right) ? -1 : isDegreeLexGt(right, left) ? 1 : 0;
    const firstMonomials = [...first].map((monomial) => monomial.vars).sort(compare);
    const secondMonomials = [...second].map((monomial) => monomial.vars).sort(compare);
    const length = Math.min(firstMonomials.length, secondMonomials.length);
    for (let index = 0; index < length; index++) {
      if (isDegreeLexGt(secondMonomials[index], firstMonomials[index])) return true;
      if (isDegreeLexGt(firstMonomials[index], secondMonomials[index])) return false;
    }
    return firstMonomials.length === length && secondMonomials.length > length;
  }

  differentLeadingTerm(first: Pdd, second: Pdd) {
    let firstNode = this.firstLeading(first.root);
    let secondNode = this.firstLeading(second.root);
    for (;;) {
      if (firstNode === secondNode) return false;
      if (this.isVal(firstNode) || this.isVal(secondNode)) return true;
      if (this.level(firstNode) !== this.level(secondNode)) return true;
      firstNode = this.nextLeading(firstNode);
      secondNode = this.nextLeading(secondNode);
    }
  }

  // first_leading: the first node with a term of the leading monomial, the monomial of highest
  // degree and then highest variables.
  private firstLeading(node: number) {
    let current = node;
    while (
      !this.isVal(current) &&
      this.degree(this.hi(current)) + 1 < this.degree(this.lo(current))
    ) {
      current = this.lo(current);
    }
    return current;
  }

  private nextLeading(node: number) {
    return this.firstLeading(this.hi(node));
  }

  degree(node: number): number {
    if (node === ZERO_PDD || node === ONE_PDD) return 0;
    const cached = this.degrees[node];
    if (cached !== undefined) return cached;
    const degree = this.isVal(node)
      ? 0
      : Math.max(this.degree(this.lo(node)), this.degree(this.hi(node)) + 1);
    this.degrees[node] = degree;
    return degree;
  }

  // factor: p = lc*v^degree + rest, where the degree of v in rest is below degree.
  factor(poly: Pdd, variable: number, degree: number): PddFactor {
    const variableLevel = this.var2level[variable];
    if (degree === 0 || this.level(poly.root) < variableLevel) {
      return { lc: this.zero(), rest: poly };
    }
    const key = `${poly.root},${variable},${degree}`;
    const cached = this.factorCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.computeFactor(poly, variable, degree);
    this.factorCache.set(key, result);
    return result;
  }

  private computeFactor(poly: Pdd, variable: number, degree: number): PddFactor {
    const variableLevel = this.var2level[variable];
    if (this.level(poly.root) > variableLevel) {
      const node = this.mkVar(poly.var());
      const hiFactor = this.factor(poly.hi(), variable, degree);
      const loFactor = this.factor(poly.lo(), variable, degree);
      const lc = hiFactor.lc.mul(node);
      const rest = hiFactor.rest.mul(node);
      return { lc: lc.add(loFactor.lc), rest: rest.add(loFactor.rest) };
    }
    let found = 0;
    let lc = poly;
    while (found < degree && !lc.isVal() && this.level(lc.root) === variableLevel) {
      found++;
      lc = lc.hi();
    }
    if (found < degree) return { lc: this.zero(), rest: poly };
    let rest = this.zero();
    let power = this.one();
    let current = poly;
    for (let index = 0; index < degree; index++) {
      rest = rest.add(power.mul(current.lo()));
      current = current.hi();
      power = power.mul(this.mkVar(variable));
    }
    return { lc, rest };
  }

  // is_binary: v1, x*v1 + v2 or x*v1 + y*v2 + v3, for values v1, v2 and v3.
  isBinary(node: number) {
    const lo = this.lo(node);
    return (
      this.isVal(node) ||
      (this.isVal(this.hi(node)) &&
        (this.isVal(lo) || (this.isVal(this.hi(lo)) && this.isVal(this.lo(lo)))))
    );
  }

  // get_powers: the variables with a power above 1. The var of a value node is the lowest
  // variable, so Z3 counts a value under that variable as one more power of it.
  getPowers(poly: Pdd) {
    const powers: PddPower[] = [];
    const marked = new Set<number>();
    const todo = [poly.root];
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      if (this.isVal(node) || marked.has(node)) continue;
      marked.add(node);
      const variable = this.var(node);
      let current = node;
      let degree = 1;
      while (!this.isVal(current) && this.var(this.hi(current)) === variable) {
        degree++;
        todo.push(this.lo(current));
        current = this.hi(current);
      }
      if (degree > 1) powers.push({ var: variable, degree });
      if (!this.isVal(current)) todo.push(this.hi(current), this.lo(current));
    }
    return powers;
  }

  // var_is_leaf: whether every node of v has values as children.
  varIsLeaf(poly: Pdd, variable: number) {
    const marked = new Set<number>();
    const todo = [poly.root];
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      if (this.isVal(node) || marked.has(node)) continue;
      marked.add(node);
      if (this.var(node) === variable) {
        if (!this.isVal(this.lo(node)) || !this.isVal(this.hi(node))) return false;
        continue;
      }
      if (!marked.has(this.lo(node))) todo.push(this.lo(node));
      if (!marked.has(this.hi(node))) todo.push(this.hi(node));
    }
    return true;
  }

  treeSize(poly: Pdd) {
    const sizes = new Map<number, number>();
    const getSize = (node: number): number => {
      const cached = sizes.get(node);
      if (cached !== undefined) return cached;
      const size = this.isVal(node) ? 1 : 1 + getSize(this.lo(node)) + getSize(this.hi(node));
      sizes.set(node, size);
      return size;
    };
    return getSize(poly.root);
  }

  freeVars(poly: Pdd) {
    const vars: number[] = [];
    const marked = new Set<number>();
    const todo = [poly.root];
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      if (this.isVal(node) || marked.has(node)) continue;
      const variableNode = this.var2pdd[this.var(node)];
      if (!marked.has(variableNode)) vars.push(this.var(node));
      marked.add(node);
      marked.add(variableNode);
      if (!marked.has(this.lo(node))) todo.push(this.lo(node));
      if (!marked.has(this.hi(node))) todo.push(this.hi(node));
    }
    return vars;
  }

  private imkVal(value: Rational) {
    if (value.isZero()) return ZERO_PDD;
    if (value.equals(Rational.one)) return ONE_PDD;
    const key = value.toString();
    const existing = this.valueTable.get(key);
    if (existing !== undefined) return existing;
    const node = this.insertNode(0, this.values.length, 0);
    this.values.push(value);
    this.valueTable.set(key, node);
    return node;
  }

  private makeNode(level: number, lo: number, hi: number) {
    return hi === ZERO_PDD ? lo : this.insertNode(level, lo, hi);
  }

  // insert_node: Z3 adds half as many free nodes again when they run out, and is out of memory
  // when the nodes already number more than the limit.
  private insertNode(level: number, lo: number, hi: number) {
    const key = `${level},${lo},${hi}`;
    const existing = this.nodeTable.get(key);
    if (existing !== undefined) return existing;
    if (this.levels.length === this.numAllocated) {
      if (this.numAllocated > this.maxNumNodes && !this.isApplying) throw new PddMemoryOut();
      while (this.numAllocated > this.maxNumNodes) this.maxNumNodes *= 2;
      this.numAllocated += Math.floor(this.numAllocated / 2);
    }
    const node = this.levels.length;
    this.levels.push(level);
    this.los.push(lo);
    this.his.push(hi);
    this.nodeTable.set(key, node);
    return node;
  }
}

export class Pdd {
  constructor(
    readonly manager: PddManager,
    readonly root: number,
  ) {}

  lo() {
    return new Pdd(this.manager, this.manager.lo(this.root));
  }

  hi() {
    return new Pdd(this.manager, this.manager.hi(this.root));
  }

  var() {
    return this.manager.var(this.root);
  }

  val() {
    return this.manager.val(this.root);
  }

  offset() {
    return this.manager.offset(this.root);
  }

  isVal() {
    return this.manager.isVal(this.root);
  }

  isZero() {
    return this.root === ZERO_PDD;
  }

  isOne() {
    return this.root === ONE_PDD;
  }

  isLinear() {
    return this.manager.degree(this.root) === 1;
  }

  isVar() {
    return !this.isVal() && this.lo().isZero() && this.hi().isOne();
  }

  // a*x + b for values a and b.
  isUnilinear() {
    return !this.isVal() && this.lo().isVal() && this.hi().isVal();
  }

  // a*x for a value a.
  isUnary() {
    return !this.isVal() && this.lo().isZero() && this.hi().isVal();
  }

  // x + b for a value b.
  isOffset() {
    return !this.isVal() && this.lo().isVal() && this.hi().isOne();
  }

  isBinary() {
    return this.manager.isBinary(this.root);
  }

  equals(other: Pdd) {
    return this.root === other.root;
  }

  neg() {
    return this.manager.minus(this);
  }

  add(other: Pdd | Rational) {
    return other instanceof Rational
      ? this.manager.add(this.manager.mkVal(other), this)
      : this.manager.add(this, other);
  }

  sub(other: Pdd | Rational) {
    return other instanceof Rational ? this.add(other.neg()) : this.manager.sub(this, other);
  }

  mul(other: Pdd | Rational) {
    return other instanceof Rational
      ? this.manager.mul(this.manager.mkVal(other), this)
      : this.manager.mul(this, other);
  }

  // div: in the free semantics, multiplication by the inverse, which shares the op cache.
  div(divisor: Rational) {
    return this.mul(Rational.one.div(divisor));
  }

  pow(exponent: number) {
    return this.manager.pow(this, exponent);
  }

  reduce(other: Pdd) {
    return this.manager.reduce(this, other);
  }

  factor(variable: number, degree: number) {
    return this.manager.factor(this, variable, degree);
  }

  differentLeadingTerm(other: Pdd) {
    return this.manager.differentLeadingTerm(this, other);
  }

  degree() {
    return this.manager.degree(this.root);
  }

  treeSize() {
    return this.manager.treeSize(this);
  }

  freeVars() {
    return this.manager.freeVars(this);
  }

  varIsLeaf(variable: number) {
    return this.manager.varIsLeaf(this, variable);
  }

  getPowers() {
    return this.manager.getPowers(this);
  }

  // var_factors: the variables that divide every monomial, with their product divided out.
  varFactors(): PddVarFactors {
    if (this.isVal()) return { vars: [], poly: this };
    const manager = this.manager;
    const variable = this.var();
    if (this.lo().isVal()) {
      if (!this.lo().isZero()) return { vars: [], poly: this };
      const factors = this.hi().varFactors();
      factors.vars.push(variable);
      return factors;
    }
    const loFactors = this.lo().varFactors();
    const loVars = loFactors.vars;
    if (loVars.length === 0) return { vars: [], poly: this };
    const loAndHi: number[] = [];
    // Moves the variables in both lists to loAndHi and keeps the rest in place, by level.
    const merge = (hiVars: number[]) => {
      let loKept = 0;
      let hiKept = 0;
      let loIndex = 0;
      let hiIndex = 0;
      while (loIndex < loVars.length || hiIndex < hiVars.length) {
        if (loIndex === loVars.length) {
          hiVars[hiKept++] = hiVars[hiIndex++];
        } else if (hiIndex === hiVars.length) {
          loVars[loKept++] = loVars[loIndex++];
        } else if (loVars[loIndex] === hiVars[hiIndex]) {
          loAndHi.push(loVars[loIndex]);
          loIndex++;
          hiIndex++;
        } else if (manager.var2level[loVars[loIndex]] > manager.var2level[hiVars[hiIndex]]) {
          hiVars[hiKept++] = hiVars[hiIndex++];
        } else {
          loVars[loKept++] = loVars[loIndex++];
        }
      }
      shrink(loVars, loKept);
      shrink(hiVars, hiKept);
    };
    const multiply = (vars: number[], poly: Pdd) =>
      vars.reduce((product, innerVar) => product.mul(manager.mkVar(innerVar)), poly);
    const hiFactors = this.hi().varFactors();
    const hiVars = hiFactors.vars;
    if (loVars[loVars.length - 1] === variable) {
      loVars.pop();
      merge(hiVars);
      loAndHi.push(variable);
      return {
        vars: loAndHi,
        poly: multiply(loVars, loFactors.poly).add(multiply(hiVars, hiFactors.poly)),
      };
    }
    if (hiVars.length === 0) return { vars: [], poly: this };
    merge(hiVars);
    hiVars.push(variable);
    if (loAndHi.length === 0) return { vars: [], poly: this };
    return {
      vars: loAndHi,
      poly: multiply(loVars, loFactors.poly).add(multiply(hiVars, hiFactors.poly)),
    };
  }

  // subst_pdd: replaces the variable by the polynomial, without the op cache.
  substPdd(variable: number, replacement: Pdd): Pdd {
    const manager = this.manager;
    if (this.isVal() || manager.var2level[this.var()] < manager.var2level[variable]) return this;
    const lo = this.lo().substPdd(variable, replacement);
    const hi = this.hi().substPdd(variable, replacement);
    if (this.var() === variable) return replacement.mul(hi).add(lo);
    if (lo.equals(this.lo()) && hi.equals(this.hi())) return this;
    return manager.mkVar(this.var()).mul(hi).add(lo);
  }

  // The monomials, hi before lo, each with its variables from the highest level down.
  *[Symbol.iterator](): Generator<PddMonomial> {
    const manager = this.manager;
    const nodes: IteratorNode[] = [];
    const vars: number[] = [];
    let node = this.root;
    while (!manager.isVal(node)) {
      nodes.push({ isFirst: true, node });
      vars.push(manager.var(node));
      node = manager.hi(node);
    }
    if (nodes.length === 0) {
      if (!manager.val(node).isZero()) yield { coeff: manager.val(node), vars: [] };
      return;
    }
    yield { coeff: manager.val(node), vars: [...vars] };
    while (nodes.length > 0) {
      const top = nodes[nodes.length - 1];
      if (!top.isFirst) {
        nodes.pop();
        continue;
      }
      top.isFirst = false;
      vars.pop();
      let next = manager.lo(top.node);
      if (next === ZERO_PDD) {
        nodes.pop();
        continue;
      }
      while (!manager.isVal(next)) {
        nodes.push({ isFirst: true, node: next });
        vars.push(manager.var(next));
        next = manager.hi(next);
      }
      yield { coeff: manager.val(next), vars: [...vars] };
    }
  }

  // The coefficients, each marked as the constant term or not. Zero yields one constant 0.
  *coefficients(): Generator<PddCoefficient> {
    const manager = this.manager;
    const nodes: number[] = [];
    let node = this.root;
    while (!manager.isVal(node)) {
      nodes.push(node);
      node = manager.hi(node);
    }
    yield { coeff: manager.val(node), isConstant: nodes.length === 0 };
    for (let top = nodes.pop(); top !== undefined; top = nodes.pop()) {
      let next = manager.lo(top);
      if (next === ZERO_PDD) continue;
      while (!manager.isVal(next)) {
        nodes.push(next);
        next = manager.hi(next);
      }
      yield { coeff: manager.val(next), isConstant: nodes.length === 0 };
    }
  }

  toString() {
    let text = "";
    for (const monomial of this) {
      if (text !== "") text += " ";
      if (monomial.coeff.isNegative()) text += "- ";
      else if (text !== "") text += "+ ";
      const coeff = monomial.coeff.abs();
      const vars = monomial.vars;
      if (!coeff.equals(Rational.one) || vars.length === 0) {
        text += vars.length === 0 ? `${coeff}` : `${coeff}*`;
      }
      const factors: string[] = [];
      for (let start = 0; start < vars.length;) {
        let end = start;
        while (end < vars.length && vars[end] === vars[start]) end++;
        factors.push(end - start > 1 ? `v${vars[start]}^${end - start}` : `v${vars[start]}`);
        start = end;
      }
      text += factors.join("*");
    }
    return text === "" ? "0" : text;
  }
}

// pdd_eval: the value of the polynomial under the values of its variables.
export const evaluatePdd = (poly: Pdd, getValue: (variable: number) => Rational): Rational =>
  poly.isVal()
    ? poly.val()
    : evaluatePdd(poly.hi(), getValue)
        .mul(getValue(poly.var()))
        .add(evaluatePdd(poly.lo(), getValue));
