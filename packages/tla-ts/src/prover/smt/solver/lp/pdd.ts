import { PddMemoryOutError } from "../../../../errors";
import { getGcd, Rational } from "../rational";
import { shrink } from "../array";

const ZERO_PDD = 0;
const ONE_PDD = 1;
const ADD_OP = 2;
const SUB_OP = 3;
const MINUS_OP = 4;
const MUL_OP = 5;
const REDUCE_OP = 6;
const NO_OP = 10;
const MAX_RC = (1 << 10) - 1;

interface PddMonomial {
  coeff: Rational;
  vars: number[];
}

interface PddCoefficient {
  coeff: Rational;
  isConstant: boolean;
}

interface PddPower {
  var: number;
  degree: number;
}

interface FactorEntry {
  lc: number;
  rest: number;
}

interface PddVarFactors {
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

const getNodeKey = (level: number, lo: number, hi: number) => `${level},${lo},${hi}`;

export class PddManager {
  private levels: number[] = [];
  private los: number[] = [];
  private his: number[] = [];
  private refcounts: number[] = [];
  private values: Rational[] = [];
  private opCache = new Map<number, number>();
  private factorCache = new Map<string, FactorEntry>();
  private nodeTable = new Map<string, number>();
  private valueTable = new Map<string, number>();
  private pddStack: number[] = [];
  private pddStackSize = 0;
  private var2pdd: number[] = [];
  var2level: number[] = [];
  level2var: number[] = [];
  private freeNodes: number[] = [];
  private dmarks: number[] = [];
  private dmarkLevel = 0;
  private degrees: number[] = [];
  private degreeTodo: number[] = [];
  private maxNumNodes = 1 << 24;
  private freeValues: number[] = [];
  private freezeValue = Rational.zero;

  constructor(numVars: number) {
    this.initNodes(Array.from({ length: numVars }, (_value, index) => index));
  }

  reset(level2var: number[]) {
    this.opCache.clear();
    this.factorCache.clear();
    this.nodeTable.clear();
    this.levels = [];
    this.los = [];
    this.his = [];
    this.refcounts = [];
    this.dmarks = [];
    this.degrees = [];
    this.freeNodes = [];
    this.pddStackSize = 0;
    this.values = [];
    this.freeValues = [];
    this.valueTable.clear();
    this.initNodes(level2var);
  }

  setMaxNumNodes(limit: number) {
    this.maxNumNodes = limit + this.level2var.length;
  }

  numNodes() {
    return this.levels.length - this.freeNodes.length;
  }

  private initNodes(level2var: number[]) {
    for (let index = 0; index < NO_OP; index++) {
      this.levels.push(0);
      this.los.push(0);
      this.his.push(0);
      this.refcounts.push(MAX_RC);
      this.dmarks.push(0);
      this.degrees.push(0);
    }
    this.los[ONE_PDD] = 1;
    this.values.push(Rational.zero, Rational.one);
    this.allocFreeNodes(1024 + level2var.length);
    this.initVars(level2var);
  }

  private initVars(level2var: number[]) {
    const count = level2var.length;
    this.level2var = Array.from({ length: count }, () => 0);
    this.var2level = Array.from({ length: count }, () => 0);
    this.var2pdd = Array.from({ length: count }, () => 0);
    for (let level = 0; level < count; level++) {
      const variable = level2var[level];
      this.var2pdd[variable] = this.makeNode(level, ZERO_PDD, ONE_PDD);
      this.refcounts[this.var2pdd[variable]] = MAX_RC;
      this.var2level[variable] = level;
      this.level2var[level] = variable;
    }
  }

  isVal(node: number) {
    return this.his[node] === 0;
  }

  private level(node: number) {
    return this.levels[node];
  }

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

  incRef(node: number) {
    if (this.refcounts[node] !== MAX_RC) this.refcounts[node]++;
  }

  decRef(node: number) {
    if (this.refcounts[node] !== MAX_RC) this.refcounts[node]--;
  }

  private reserveVar(variable: number) {
    while (this.var2level.length <= variable) {
      const next = this.var2level.length;
      this.var2pdd.push(this.makeNode(next, ZERO_PDD, ONE_PDD));
      this.refcounts[this.var2pdd[next]] = MAX_RC;
      this.var2level.push(next);
      this.level2var.push(next);
    }
  }

  mkVar(variable: number) {
    this.reserveVar(variable);
    return new Pdd(this, this.var2pdd[variable]);
  }

  mkVal(value: Rational) {
    return new Pdd(this, this.imkVal(value));
  }

  zero() {
    return new Pdd(this, ZERO_PDD);
  }

  private one() {
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

  mulValue(value: Rational, poly: Pdd) {
    const constant = this.mkVal(value);
    const result = new Pdd(this, this.apply(constant.root, poly.root, MUL_OP));
    constant.release();
    return result;
  }

  addValue(value: Rational, poly: Pdd) {
    const constant = this.mkVal(value);
    const result = new Pdd(this, this.apply(constant.root, poly.root, ADD_OP));
    constant.release();
    return result;
  }

  minus(poly: Pdd) {
    const size = this.pddStackSize;
    try {
      for (let count = 0; ; count++) {
        try {
          return new Pdd(this, this.minusRec(poly.root));
        } catch (error) {
          if (!(error instanceof PddMemoryOutError)) throw error;
          this.tryGc();
          if (count > 0) this.maxNumNodes *= 2;
        }
      }
    } finally {
      this.pddStackSize = size;
    }
  }

  pow(poly: Pdd, exponent: number) {
    return new Pdd(this, this.powNode(poly.root, exponent));
  }

  private powNode(node: number, exponent: number) {
    if (exponent === 0) return ONE_PDD;
    if (exponent === 1) return node;
    if (node === ZERO_PDD) return ZERO_PDD;
    if (node === ONE_PDD) return ONE_PDD;
    if (this.isVal(node)) return this.imkVal(this.val(node).pow(exponent));
    return this.powRec(node, exponent);
  }

  private powRec(node: number, exponent: number): number {
    if (exponent === 1) return node;
    const half = this.powRec(this.apply(node, node, MUL_OP), Math.floor(exponent / 2));
    return exponent % 2 === 1 ? this.apply(half, node, MUL_OP) : half;
  }

  private apply(first: number, second: number, op: number) {
    const size = this.pddStackSize;
    try {
      for (let count = 0; ; count++) {
        try {
          return this.applyRec(first, second, op);
        } catch (error) {
          if (!(error instanceof PddMemoryOutError)) throw error;
          this.tryGc();
          if (count > 0) this.maxNumNodes *= 2;
        }
      }
    } finally {
      this.pddStackSize = size;
    }
  }

  private applyRec(first: number, second: number, op: number): number {
    let p = first;
    let q = second;
    switch (op) {
      case SUB_OP:
        if (q === ZERO_PDD) return p;
        if (this.isVal(p) && this.isVal(q)) return this.imkVal(this.val(p).sub(this.val(q)));
        break;
      case ADD_OP:
        if (p === ZERO_PDD) return q;
        if (q === ZERO_PDD) return p;
        if (this.isVal(p) && this.isVal(q)) return this.imkVal(this.val(p).add(this.val(q)));
        if (this.isVal(p) || (!this.isVal(q) && this.level(p) < this.level(q))) {
          p = second;
          q = first;
        }
        break;
      case MUL_OP:
        if (p === ZERO_PDD || q === ZERO_PDD) return ZERO_PDD;
        if (p === ONE_PDD) return q;
        if (q === ONE_PDD) return p;
        if (this.isVal(p) && this.isVal(q)) return this.imkVal(this.val(p).mul(this.val(q)));
        if (this.isVal(p) || (!this.isVal(q) && this.level(p) < this.level(q))) {
          p = second;
          q = first;
        }
        break;
      default:
        if (q === ZERO_PDD || this.isVal(p)) return p;
        if (this.degree(p) < this.degree(q)) return p;
        if (this.level(this.firstLeading(q)) > this.level(p)) return p;
        break;
    }
    // Z3's op_entry equality compares the cached first operand with the new second one, so only equal operands hit.
    // Deviation from Z3: on a hash collision Z3 returns that result for unequal operands too.
    const isCached = p === q;
    if (isCached) {
      const cached = this.opCache.get(q * NO_OP + op);
      if (cached !== undefined) return cached;
    }
    let result: number;
    const levelP = this.level(p);
    const levelQ = this.level(q);
    let npop = 2;
    switch (op) {
      case ADD_OP:
        if (this.isVal(q)) {
          this.push(this.applyRec(this.lo(p), q, op));
          result = this.makeNode(levelP, this.read(1), this.hi(p));
          npop = 1;
        } else if (levelP === levelQ) {
          this.push(this.applyRec(this.lo(p), this.lo(q), op));
          this.push(this.applyRec(this.hi(p), this.hi(q), op));
          result = this.makeNode(levelP, this.read(2), this.read(1));
        } else {
          this.push(this.applyRec(this.lo(p), q, op));
          result = this.makeNode(levelP, this.read(1), this.hi(p));
          npop = 1;
        }
        break;
      case SUB_OP:
        if (this.isVal(p) || (!this.isVal(q) && levelP < levelQ)) {
          this.push(this.applyRec(p, this.lo(q), op));
          this.push(this.minusRec(this.hi(q)));
          result = this.makeNode(levelQ, this.read(2), this.read(1));
        } else if (this.isVal(q) || levelP > levelQ) {
          this.push(this.applyRec(this.lo(p), q, op));
          result = this.makeNode(levelP, this.read(1), this.hi(p));
          npop = 1;
        } else {
          this.push(this.applyRec(this.lo(p), this.lo(q), op));
          this.push(this.applyRec(this.hi(p), this.hi(q), op));
          result = this.makeNode(levelP, this.read(2), this.read(1));
        }
        break;
      case MUL_OP:
        if (this.isVal(q) || levelP !== levelQ) {
          this.push(this.applyRec(this.lo(p), q, op));
          this.push(this.applyRec(this.hi(p), q, op));
          result = this.makeNode(levelP, this.read(2), this.read(1));
        } else {
          this.push(this.applyRec(this.hi(p), this.hi(q), op));
          this.push(this.applyRec(this.hi(p), this.lo(q), op));
          this.push(this.applyRec(this.lo(p), this.hi(q), op));
          this.push(this.applyRec(this.lo(p), this.lo(q), op));
          const ac = this.read(4);
          const ad = this.read(3);
          const bc = this.read(2);
          const bd = this.read(1);
          this.push(this.applyRec(ad, bc, ADD_OP));
          const sum = this.read(1);
          if (!this.isVal(sum) && this.level(sum) === levelP) {
            this.push(this.applyRec(ac, this.hi(sum), ADD_OP));
            this.push(this.makeNode(levelP, this.lo(sum), this.read(1)));
            result = this.makeNode(levelP, bd, this.read(1));
            npop = 7;
          } else {
            this.push(this.makeNode(levelP, sum, ac));
            result = this.makeNode(levelP, bd, this.read(1));
            npop = 6;
          }
        }
        break;
      default:
        if (this.level(this.firstLeading(q)) < levelP) {
          this.push(this.applyRec(this.lo(p), q, op));
          this.push(this.applyRec(this.hi(p), q, op));
          const lo = this.read(2);
          const hi = this.read(1);
          if (lo === this.lo(p) && hi === this.hi(p)) {
            result = p;
          } else if (this.level(lo) < levelP && this.level(hi) <= levelP) {
            result = this.makeNode(levelP, lo, hi);
          } else {
            this.push(this.applyRec(hi, this.var2pdd[this.var(p)], MUL_OP));
            this.push(this.applyRec(this.read(1), lo, ADD_OP));
            result = this.read(1);
            npop = 4;
          }
        } else {
          result = this.reduceOnMatch(p, q);
          npop = 0;
        }
    }
    this.pop(npop);
    if (isCached) this.opCache.set(q * NO_OP + op, result);
    return result;
  }

  private minusRec(node: number): number {
    if (node === ZERO_PDD) return ZERO_PDD;
    if (this.isVal(node)) return this.imkVal(this.val(node).neg());
    const cached = this.opCache.get(node * NO_OP + MINUS_OP);
    if (cached !== undefined) return cached;
    this.push(this.minusRec(this.lo(node)));
    this.push(this.minusRec(this.hi(node)));
    const result = this.makeNode(this.level(node), this.read(2), this.read(1));
    this.pop(2);
    this.opCache.set(node * NO_OP + MINUS_OP, result);
    return result;
  }

  private reduceOnMatch(first: number, second: number) {
    let current = first;
    this.push(current);
    while (this.lmOccurs(second, current)) {
      this.push(this.ltQuotient(second, current));
      this.push(this.applyRec(this.read(1), second, MUL_OP));
      this.push(this.applyRec(current, this.read(1), ADD_OP));
      current = this.read(1);
      this.pop(4);
      this.push(current);
    }
    this.pop(1);
    return current;
  }

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
    this.push(this.ltQuotient(first, this.hi(second)));
    const result = this.applyRec(this.var2pdd[this.var(second)], this.read(1), MUL_OP);
    this.pop(1);
    return result;
  }

  trySpoly(first: Pdd, second: Pdd, result: Pdd) {
    const factors = this.commonFactors(first, second);
    if (factors === null) return false;
    const spoly = this.spoly(first, second, factors);
    result.assign(spoly);
    spoly.release();
    return true;
  }

  private spoly(first: Pdd, second: Pdd, factors: CommonFactors) {
    const firstMultiplier = this.mkVal(factors.secondCoeff);
    try {
      for (let index = factors.second.length; index-- > 0;) {
        const variable = this.mkVar(factors.second[index]);
        firstMultiplier.mulAssign(variable);
        variable.release();
      }
      const secondMultiplier = this.mkVal(factors.firstCoeff.neg());
      for (let index = factors.first.length; index-- > 0;) {
        const variable = this.mkVar(factors.first[index]);
        secondMultiplier.mulAssign(variable);
        variable.release();
      }
      const firstProduct = firstMultiplier.mul(first);
      const secondProduct = secondMultiplier.mul(second);
      const result = firstProduct.add(secondProduct);
      secondProduct.release();
      firstProduct.release();
      secondMultiplier.release();
      return result;
    } finally {
      firstMultiplier.release();
    }
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

  degree(node: number) {
    if (node === ZERO_PDD || node === ONE_PDD) return 0;
    const dmarkLevel = this.dmarkLevel;
    if (this.dmarks[node] === dmarkLevel) return this.degrees[node];
    const todo = this.degreeTodo;
    todo.push(node);
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (this.dmarks[current] === dmarkLevel) {
        todo.pop();
      } else if (this.isVal(current)) {
        this.degrees[current] = 0;
        this.dmarks[current] = dmarkLevel;
      } else {
        const lo = this.lo(current);
        const hi = this.hi(current);
        if (this.dmarks[lo] !== dmarkLevel || this.dmarks[hi] !== dmarkLevel) {
          todo.push(lo, hi);
        } else {
          this.degrees[current] = Math.max(this.degrees[lo], this.degrees[hi] + 1);
          this.dmarks[current] = dmarkLevel;
        }
      }
    }
    return this.degrees[node];
  }

  factor(poly: Pdd, variable: number, degree: number, lc: Pdd, rest: Pdd) {
    const variableLevel = this.var2level[variable];
    if (degree === 0 || this.level(poly.root) < variableLevel) {
      const zero = this.zero();
      lc.assign(zero);
      zero.release();
      rest.assign(poly);
      return;
    }
    const key = `${poly.root},${variable},${degree}`;
    const cached = this.factorCache.get(key);
    if (cached !== undefined) {
      const cachedLc = new Pdd(this, cached.lc);
      lc.assign(cachedLc);
      cachedLc.release();
      const cachedRest = new Pdd(this, cached.rest);
      rest.assign(cachedRest);
      cachedRest.release();
      return;
    }
    if (this.level(poly.root) > variableLevel) {
      const lc1 = this.zero();
      const rest1 = this.zero();
      const node = this.mkVar(poly.var());
      const hi = poly.hi();
      this.factor(hi, variable, degree, lc, rest);
      hi.release();
      const lo = poly.lo();
      this.factor(lo, variable, degree, lc1, rest1);
      lo.release();
      lc.mulAssign(node);
      rest.mulAssign(node);
      lc.addAssign(lc1);
      rest.addAssign(rest1);
      node.release();
      rest1.release();
      lc1.release();
    } else {
      let found = 0;
      const current = poly.copy();
      while (found < degree && !current.isVal() && this.level(current.root) === variableLevel) {
        found++;
        const hi = current.hi();
        current.assign(hi);
        hi.release();
      }
      if (found === degree) {
        lc.assign(current);
        current.assign(poly);
        const zero = this.zero();
        rest.assign(zero);
        zero.release();
        const power = this.one();
        for (let index = 0; index < degree; index++) {
          const lo = current.lo();
          const term = power.mul(lo);
          rest.addAssign(term);
          term.release();
          lo.release();
          const hi = current.hi();
          current.assign(hi);
          const variablePdd = this.mkVar(variable);
          power.mulAssign(variablePdd);
          variablePdd.release();
          hi.release();
        }
        power.release();
      } else {
        const zero = this.zero();
        lc.assign(zero);
        zero.release();
        rest.assign(poly);
      }
      current.release();
    }
    this.factorCache.set(key, { lc: lc.root, rest: rest.root });
  }

  isBinary(node: number) {
    const lo = this.lo(node);
    return (
      this.isVal(node) ||
      (this.isVal(this.hi(node)) &&
        (this.isVal(lo) || (this.isVal(this.hi(lo)) && this.isVal(this.lo(lo)))))
    );
  }

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
      // Like Z3, a value under the lowest variable counts as one more power of it.
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

  private push(node: number) {
    this.pddStack[this.pddStackSize++] = node;
  }

  private pop(count: number) {
    this.pddStackSize -= count;
  }

  private read(index: number) {
    return this.pddStack[this.pddStackSize - index];
  }

  private imkVal(value: Rational) {
    if (value.isZero()) return ZERO_PDD;
    if (value.equals(Rational.one)) return ONE_PDD;
    const key = value.getKey();
    return this.valueTable.get(key) ?? this.initValue(value, key);
  }

  private initValue(value: Rational, key: string) {
    let valueIndex = this.values.length;
    if (this.freeValues.length === 0) {
      this.values.push(value);
    } else {
      valueIndex = this.freeValues[this.freeValues.length - 1];
      this.freeValues.pop();
      this.values[valueIndex] = value;
    }
    this.freezeValue = value;
    const node = this.insertNode(0, valueIndex, 0);
    this.valueTable.set(key, node);
    return node;
  }

  private makeNode(level: number, lo: number, hi: number) {
    return hi === ZERO_PDD ? lo : this.insertNode(level, lo, hi);
  }

  private insertNode(level: number, lo: number, hi: number) {
    const key = getNodeKey(level, lo, hi);
    const existing = this.nodeTable.get(key);
    if (existing !== undefined) return existing;
    if (this.freeNodes.length === 0) {
      this.gc();
      if (this.levels.length > this.maxNumNodes) throw new PddMemoryOutError();
      this.allocFreeNodes(Math.floor(this.levels.length / 2));
    }
    const node = this.freeNodes[this.freeNodes.length - 1];
    this.freeNodes.pop();
    this.levels[node] = level;
    this.los[node] = lo;
    this.his[node] = hi;
    this.refcounts[node] = 0;
    this.nodeTable.set(key, node);
    return node;
  }

  private tryGc() {
    this.gc();
    this.opCache.clear();
  }

  private allocFreeNodes(count: number) {
    for (let index = 0; index < count; index++) {
      this.freeNodes.push(this.levels.length);
      this.levels.push(0);
      this.los.push(0);
      this.his.push(0);
      this.refcounts.push(0);
      this.dmarks.push(0);
      this.degrees.push(0);
    }
    this.freeNodes.sort((first, second) => second - first);
    this.initDmark();
  }

  private computeReachable(reachable: Uint8Array) {
    const todo: number[] = [];
    for (let index = this.pddStackSize; index-- > 0;) {
      reachable[this.pddStack[index]] = 1;
      todo.push(this.pddStack[index]);
    }
    for (let node = NO_OP; node-- > 0;) reachable[node] = 1;
    for (let node = this.levels.length; node-- > NO_OP;) {
      if (this.refcounts[node] > 0) {
        reachable[node] = 1;
        todo.push(node);
      }
    }
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      if (this.isVal(node)) continue;
      const lo = this.lo(node);
      const hi = this.hi(node);
      if (reachable[lo] === 0) {
        reachable[lo] = 1;
        todo.push(lo);
      }
      if (reachable[hi] === 0) {
        reachable[hi] = 1;
        todo.push(hi);
      }
    }
  }

  private gc() {
    this.initDmark();
    this.freeNodes = [];
    const size = this.levels.length;
    const reachable = new Uint8Array(size);
    this.computeReachable(reachable);
    for (let node = size; node-- > NO_OP;) {
      if (reachable[node] === 1) continue;
      if (this.his[node] === 0 && this.los[node] !== 0) {
        const value = this.values[this.los[node]];
        if (this.freezeValue.equals(value)) continue;
        this.freeValues.push(this.los[node]);
        this.valueTable.delete(value.getKey());
      }
      this.los[node] = 0;
      this.his[node] = 0;
      this.freeNodes.push(node);
    }
    this.opCache.clear();
    this.factorCache.clear();
    this.nodeTable.clear();
    for (let node = size; node-- > 2;) {
      if (reachable[node] === 0) continue;
      this.nodeTable.set(getNodeKey(this.levels[node], this.los[node], this.his[node]), node);
    }
  }

  private initDmark() {
    this.dmarkLevel++;
  }
}

const getMonomials = (poly: Pdd): PddMonomial[] => {
  if (poly.isVal()) return poly.val().isZero() ? [] : [{ coeff: poly.val(), vars: [] }];
  const hi = poly.hi();
  const monomials = getMonomials(hi);
  hi.release();
  for (const monomial of monomials) monomial.vars.push(poly.var());
  const lo = poly.lo();
  monomials.push(...getMonomials(lo));
  lo.release();
  return monomials;
};

export class Pdd {
  constructor(
    private readonly manager: PddManager,
    public root: number,
  ) {
    manager.incRef(root);
  }

  copy() {
    const result = new Pdd(this.manager, this.root);
    // Like Z3, whose copy constructor delegates to a counting constructor and then counts again.
    this.manager.incRef(this.root);
    return result;
  }

  release() {
    this.manager.decRef(this.root);
  }

  assign(other: Pdd) {
    const previous = this.root;
    this.root = other.root;
    this.manager.incRef(this.root);
    this.manager.decRef(previous);
  }

  addAssign(other: Pdd) {
    const sum = this.add(other);
    this.assign(sum);
    sum.release();
  }

  subAssign(value: Rational) {
    const difference = this.sub(value);
    this.assign(difference);
    difference.release();
  }

  mulAssign(other: Pdd | Rational) {
    const product = this.mul(other);
    this.assign(product);
    product.release();
  }

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

  isUnary() {
    if (this.isVal()) return false;
    const lo = this.lo();
    let isUnary = lo.isZero();
    if (isUnary) {
      const hi = this.hi();
      isUnary = hi.isVal();
      hi.release();
    }
    lo.release();
    return isUnary;
  }

  isOffset() {
    if (this.isVal()) return false;
    const lo = this.lo();
    let isOffset = lo.isVal();
    if (isOffset) {
      const hi = this.hi();
      isOffset = hi.isOne();
      hi.release();
    }
    lo.release();
    return isOffset;
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
      ? this.manager.addValue(other, this)
      : this.manager.add(this, other);
  }

  sub(other: Pdd | Rational) {
    return other instanceof Rational
      ? this.manager.addValue(other.neg(), this)
      : this.manager.sub(this, other);
  }

  mul(other: Pdd | Rational) {
    return other instanceof Rational
      ? this.manager.mulValue(other, this)
      : this.manager.mul(this, other);
  }

  pow(exponent: number) {
    return this.manager.pow(this, exponent);
  }

  reduce(other: Pdd) {
    return this.manager.reduce(this, other);
  }

  factor(variable: number, degree: number, lc: Pdd, rest: Pdd) {
    this.manager.factor(this, variable, degree, lc, rest);
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

  varFactors(): PddVarFactors {
    if (this.isVal()) return { vars: [], poly: this.copy() };
    const manager = this.manager;
    const variable = this.var();
    const firstLo = this.lo();
    const isLoVal = firstLo.isVal();
    firstLo.release();
    if (isLoVal) {
      const secondLo = this.lo();
      const isLoZero = secondLo.isZero();
      secondLo.release();
      if (!isLoZero) return { vars: [], poly: this.copy() };
      const hi = this.hi();
      const factors = hi.varFactors();
      hi.release();
      factors.vars.push(variable);
      const result = { vars: factors.vars, poly: factors.poly.copy() };
      factors.poly.release();
      return result;
    }
    const lo = this.lo();
    const loFactors = lo.varFactors();
    lo.release();
    const loVars = loFactors.vars;
    if (loVars.length === 0) {
      const result = { vars: [], poly: this.copy() };
      loFactors.poly.release();
      return result;
    }
    const loAndHi: number[] = [];
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
    const multiply = (vars: number[], poly: Pdd) => {
      const product = poly.copy();
      for (const innerVar of vars) {
        const variablePdd = manager.mkVar(innerVar);
        product.mulAssign(variablePdd);
        variablePdd.release();
      }
      return product;
    };
    const hi = this.hi();
    const hiFactors = hi.varFactors();
    hi.release();
    const hiVars = hiFactors.vars;
    if (loVars[loVars.length - 1] === variable) {
      loVars.pop();
      merge(hiVars);
      loAndHi.push(variable);
    } else if (hiVars.length > 0) {
      merge(hiVars);
      hiVars.push(variable);
    }
    let result: PddVarFactors;
    if (loAndHi.length === 0) {
      result = { vars: [], poly: this.copy() };
    } else {
      const loProduct = multiply(loVars, loFactors.poly);
      const hiProduct = multiply(hiVars, hiFactors.poly);
      result = { vars: loAndHi, poly: loProduct.add(hiProduct) };
      hiProduct.release();
      loProduct.release();
    }
    hiFactors.poly.release();
    loFactors.poly.release();
    return result;
  }

  substPdd(variable: number, replacement: Pdd): Pdd {
    const manager = this.manager;
    if (this.isVal() || manager.var2level[this.var()] < manager.var2level[variable]) {
      return this.copy();
    }
    const lo = this.lo();
    const substitutedLo = lo.substPdd(variable, replacement);
    lo.release();
    const hi = this.hi();
    const substitutedHi = hi.substPdd(variable, replacement);
    hi.release();
    let result: Pdd;
    if (this.var() === variable) {
      const product = replacement.mul(substitutedHi);
      result = product.add(substitutedLo);
      product.release();
    } else {
      const thisLo = this.lo();
      let isUnchanged = substitutedLo.equals(thisLo);
      if (isUnchanged) {
        const thisHi = this.hi();
        isUnchanged = substitutedHi.equals(thisHi);
        thisHi.release();
      }
      thisLo.release();
      if (isUnchanged) {
        result = this.copy();
      } else {
        const variablePdd = manager.mkVar(this.var());
        const product = variablePdd.mul(substitutedHi);
        result = product.add(substitutedLo);
        product.release();
        variablePdd.release();
      }
    }
    substitutedHi.release();
    substitutedLo.release();
    return result;
  }

  *[Symbol.iterator](): Generator<PddMonomial> {
    const begin = this.copy();
    const end = this.copy();
    try {
      const manager = this.manager;
      const nodes: IteratorNode[] = [];
      const vars: number[] = [];
      let node = begin.root;
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
    } finally {
      end.release();
      begin.release();
    }
  }

  *coefficients(): Generator<PddCoefficient> {
    const begin = this.copy();
    const end = this.copy();
    try {
      const manager = this.manager;
      const nodes: number[] = [];
      let node = begin.root;
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
    } finally {
      end.release();
      begin.release();
    }
  }

  toString() {
    let text = "";
    for (const monomial of getMonomials(this)) {
      if (text !== "") text += " ";
      if (monomial.coeff.isNegative()) text += "- ";
      else if (text !== "") text += "+ ";
      const coeff = monomial.coeff.abs();
      const vars = monomial.vars.reverse();
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

export const evaluatePdd = (poly: Pdd, getValue: (variable: number) => Rational): Rational => {
  if (poly.isVal()) return poly.val();
  const hi = poly.hi();
  const product = evaluatePdd(hi, getValue).mul(getValue(poly.var()));
  const lo = poly.lo();
  const result = product.add(evaluatePdd(lo, getValue));
  lo.release();
  hi.release();
  return result;
};
