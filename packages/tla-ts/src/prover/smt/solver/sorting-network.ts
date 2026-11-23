export type CardinalityEncoding = "grouped" | "bimander" | "ordered" | "unate" | "circuit";

export interface PsortContext {
  mkFalse(): number;
  mkTrue(): number;
  mkMax(lits: number[]): number;
  mkMin(lits: number[]): number;
  mkNot(lit: number): number;
  fresh(name: string): number;
  mkClause(lits: number[]): void;
}

const LE = 0;
const GE = 1;
const EQ = 2;
const GE_FULL = 3;
const LE_FULL = 4;

const LAMBDA = 5;

interface Vc {
  vertices: number;
  clauses: number;
}

const mkVc = (vertices: number, clauses: number): Vc => ({
  vertices: vertices >>> 0,
  clauses: clauses >>> 0,
});

const addVc = (first: Vc, second: Vc) =>
  mkVc(first.vertices + second.vertices, first.clauses + second.clauses);

const subVc = (first: Vc, second: Vc) =>
  mkVc(first.vertices - second.vertices, first.clauses - second.clauses);

const mulVc = (vc: Vc, factor: number) =>
  mkVc(Math.imul(factor, vc.vertices), Math.imul(factor, vc.clauses));

const getVcInt = (vc: Vc) => (Math.imul(LAMBDA, vc.vertices) + vc.clauses) >>> 0;

const isVcLess = (first: Vc, second: Vc) => getVcInt(first) < getVcInt(second);

const isEven = (value: number) => (value & 1) === 0;

const getCeil2 = (value: number) => Math.floor(value / 2) + (isEven(value) ? 0 : 1);

const getFloor2 = (value: number) => Math.floor(value / 2);

export class PsortNw {
  private cmpType = GE;

  constructor(
    private readonly ctx: PsortContext,
    private readonly encoding: CardinalityEncoding,
  ) {}

  ge(isFull: boolean, k: number, xs: number[]): number {
    const n = xs.length;
    if (k > n) return this.ctx.mkFalse();
    if (k === 0) return this.ctx.mkTrue();
    if (k === 1) return this.mkOr(xs);
    const dual = this.dualize(k, xs);
    if (dual !== undefined) return this.le(isFull, n - k, dual);
    switch (this.encoding) {
      case "bimander":
      case "ordered":
      case "grouped": {
        this.cmpType = isFull ? GE_FULL : GE;
        const out: number[] = [];
        this.card(k, xs, out);
        return out[k - 1];
      }
      case "unate":
        return this.unateGe(isFull, k, xs);
      case "circuit":
        return this.circuitGe(isFull, k, xs);
    }
  }

  le(isFull: boolean, k: number, xs: number[]): number {
    const n = xs.length;
    if (k >= n) return this.ctx.mkTrue();
    const dual = this.dualize(k, xs);
    if (dual !== undefined) return this.ge(isFull, n - k, dual);
    if (k === 1) {
      const ors: number[] = [];
      switch (this.encoding) {
        case "grouped":
        case "unate":
        case "circuit":
          return this.mkAtMost1(isFull, xs, ors, false);
        case "bimander":
          return this.mkAtMost1Bimander(isFull, xs, ors);
        case "ordered":
          return this.mkOrderedAtMost1(isFull, xs);
      }
    }
    switch (this.encoding) {
      case "bimander":
      case "ordered":
      case "grouped": {
        this.cmpType = isFull ? LE_FULL : LE;
        const out: number[] = [];
        this.card(k + 1, xs, out);
        return this.mkNot(out[k]);
      }
      case "unate":
        return this.unateLe(isFull, k, xs);
      case "circuit":
        return this.circuitLe(isFull, k, xs);
    }
  }

  eq(isFull: boolean, k: number, xs: number[]): number {
    const n = xs.length;
    if (k > n) return this.ctx.mkFalse();
    const dual = this.dualize(k, xs);
    if (dual !== undefined) return this.eq(isFull, n - k, dual);
    if (k === 1) return this.mkExactly1(isFull, xs);
    switch (this.encoding) {
      case "bimander":
      case "grouped":
      case "ordered": {
        this.cmpType = EQ;
        const out: number[] = [];
        this.card(k + 1, xs, out);
        return k === 0 ? this.mkNot(out[k]) : this.mkMin(out[k - 1], this.mkNot(out[k]));
      }
      case "unate":
        return this.unateEq(k, xs);
      case "circuit":
        return this.circuitEq(k, xs);
    }
  }

  private unateCmp(cmp: number, k: number, xs: number[]) {
    const last = cmp === LE || cmp === EQ || cmp === LE_FULL ? k + 1 : k;
    const carry: number[] = [];
    for (let index = 0; index < last; index++) carry.push(this.ctx.mkFalse());
    for (let xIndex = 0; xIndex < xs.length; xIndex++) {
      for (let index = last; index-- > 0;) {
        const previous = index > 0 ? carry[index - 1] : this.ctx.mkTrue();
        carry[index] = this.mkOr([this.mkAnd([xs[xIndex], previous]), carry[index]]);
      }
    }
    switch (cmp) {
      case LE:
      case LE_FULL:
        return this.mkNot(carry[k]);
      case GE:
      case GE_FULL:
        return carry[k - 1];
      default:
        return this.mkAnd([this.mkNot(carry[k]), carry[k - 1]]);
    }
  }

  private unateGe(isFull: boolean, k: number, xs: number[]) {
    return this.unateCmp(isFull ? GE_FULL : GE, k, xs);
  }

  private unateLe(isFull: boolean, k: number, xs: number[]) {
    return this.unateCmp(isFull ? LE_FULL : LE, k, xs);
  }

  private unateEq(k: number, xs: number[]) {
    return this.unateCmp(EQ, k, xs);
  }

  private mkUnitCircuit(k: number, x: number, out: number[]) {
    out.push(x);
    for (let index = 1; index < k; index++) out.push(this.ctx.mkFalse());
  }

  private mkAddCircuit(xs: number[], ys: number[], out: number[]) {
    let carry = this.ctx.mkFalse();
    for (let index = 0; index < xs.length; index++) {
      const ors: number[] = [];
      const notX = this.mkNot(xs[index]);
      const notY = this.mkNot(ys[index]);
      ors.push(this.mkAnd([carry, notX, notY]));
      const notCarry = this.mkNot(carry);
      ors.push(this.mkAnd([xs[index], notCarry, notY]));
      ors.push(this.mkAnd([ys[index], notCarry, notX]));
      ors.push(this.mkAnd([carry, xs[index], ys[index]]));
      out.push(this.mkOr(ors));
      ors[0] = this.mkAnd([carry, xs[index]]);
      ors[1] = this.mkAnd([carry, ys[index]]);
      ors[2] = this.mkAnd([xs[index], ys[index]]);
      carry = this.mkOr(ors.slice(0, 3));
    }
    return carry;
  }

  private circuitAdd(k: number, xs: number[], out: number[]): number {
    switch (xs.length) {
      case 0:
        for (let index = 0; index < k; index++) out.push(this.ctx.mkFalse());
        return this.ctx.mkFalse();
      case 1:
        this.mkUnitCircuit(k, xs[0], out);
        return this.ctx.mkFalse();
      default: {
        const out1: number[] = [];
        const out2: number[] = [];
        const half = getFloor2(xs.length);
        const overflow1 = this.circuitAdd(k, xs.slice(0, half), out1);
        const overflow2 = this.circuitAdd(k, xs.slice(half), out2);
        const overflow3 = this.mkAddCircuit(out1, out2, out);
        return this.mkOr([overflow1, overflow2, overflow3]);
      }
    }
  }

  private circuitCmp(cmp: number, k: number, xs: number[]) {
    const out: number[] = [];
    const kvec: number[] = [];
    let numBits = 0;
    const k1 = cmp === LE || cmp === LE_FULL ? k + 1 : k;
    for (let rest = k1; rest > 0; rest = Math.floor(rest / 2)) numBits++;
    for (let index = 0; index < numBits; index++)
      kvec.push(Math.floor(k1 / 2 ** index) % 2 === 1 ? this.ctx.mkTrue() : this.ctx.mkFalse());
    const overflow = this.circuitAdd(numBits, xs, out);
    switch (cmp) {
      case LE:
      case LE_FULL:
        return this.mkNot(this.mkOr([overflow, this.mkGe(out, kvec)]));
      case GE:
      case GE_FULL:
        return this.mkOr([overflow, this.mkGe(out, kvec)]);
      default: {
        const eqs: number[] = [];
        for (let index = 0; index < numBits; index++) {
          eqs.push(this.mkOr([this.mkNot(kvec[index]), out[index]]));
          eqs.push(this.mkOr([kvec[index], this.mkNot(out[index])]));
        }
        eqs.push(this.mkNot(overflow));
        return this.mkAnd(eqs);
      }
    }
  }

  private mkGe(xs: number[], ys: number[]) {
    let result = this.ctx.mkTrue();
    let greater = this.ctx.mkFalse();
    for (let index = xs.length; index-- > 0;) {
      greater = this.mkOr([
        greater,
        this.mkAnd([result, this.mkAnd([xs[index], this.mkNot(ys[index])])]),
      ]);
      result = this.mkOr([
        greater,
        this.mkAnd([result, this.mkOr([xs[index], this.mkNot(ys[index])])]),
      ]);
    }
    return result;
  }

  private circuitGe(isFull: boolean, k: number, xs: number[]) {
    return this.circuitCmp(isFull ? GE_FULL : GE, k, xs);
  }

  private circuitLe(isFull: boolean, k: number, xs: number[]) {
    return this.circuitCmp(isFull ? LE_FULL : LE, k, xs);
  }

  private circuitEq(k: number, xs: number[]) {
    return this.circuitCmp(EQ, k, xs);
  }

  private addImpliesOr(lit: number, xs: number[]) {
    this.addClause([...xs, this.mkNot(lit)]);
  }

  private mkOr(lits: number[]) {
    const ors: number[] = [];
    for (let index = 0; index < lits.length; index++) {
      if (this.isTrue(lits[index])) return lits[index];
      if (!this.isFalse(lits[index])) ors.push(lits[index]);
    }
    switch (ors.length) {
      case 0:
        return this.ctx.mkFalse();
      case 1:
        return ors[0];
      default:
        return this.ctx.mkMax(ors);
    }
  }

  private mkNot(lit: number) {
    if (this.isTrue(lit)) return this.ctx.mkFalse();
    if (this.isFalse(lit)) return this.ctx.mkTrue();
    return this.ctx.mkNot(lit);
  }

  private isTrue(lit: number) {
    return lit === this.ctx.mkTrue();
  }

  private isFalse(lit: number) {
    return lit === this.ctx.mkFalse();
  }

  private mkAnd(lits: number[]) {
    const ands: number[] = [];
    for (let index = 0; index < lits.length; index++) {
      if (this.isFalse(lits[index])) return lits[index];
      if (!this.isTrue(lits[index])) ands.push(lits[index]);
    }
    switch (ands.length) {
      case 0:
        return this.ctx.mkTrue();
      case 1:
        return ands[0];
      case 2:
        return this.mkMin(ands[0], ands[1]);
      default:
        return this.ctx.mkMin(ands);
    }
  }

  private mkExactly1(isFull: boolean, xs: number[]) {
    const ors: number[] = [];
    let result = this.ctx.mkFalse();
    switch (this.encoding) {
      case "grouped":
      case "unate":
      case "circuit":
        result = this.mkAtMost1(isFull, xs, ors, true);
        break;
      case "bimander":
        result = this.mkAtMost1Bimander(isFull, xs, ors);
        break;
      case "ordered":
        return this.mkOrderedExactly1(isFull, xs);
    }
    if (isFull) return this.mkAnd([result, this.mkOr(ors)]);
    this.addImpliesOr(result, ors);
    return result;
  }

  private mkAtMost1(isFull: boolean, xs: number[], ors: number[], isUsingOrs: boolean) {
    let input = [...xs];
    const result = this.ctx.fresh("at-most-1");
    let incSize = 4;
    const ands = [result];
    while (input.length > 0) {
      ors.length = 0;
      const n = input.length;
      if (n + 1 === incSize) incSize++;
      for (let index = 0; index < n; index += incSize) {
        const group = input.slice(index, index + Math.min(n - index, incSize));
        this.mkAtMost1Small(isFull, group, result, ands);
        if (isUsingOrs || n > incSize) ors.push(this.mkOr(group));
      }
      if (n <= incSize) break;
      input = [...ors];
    }
    if (isFull) this.addClause(ands);
    return result;
  }

  private mkAtMost1Small(isFull: boolean, xs: number[], result: number, ands: number[]) {
    const n = xs.length;
    if (n === 1) return;
    for (let first = 0; first < n; first++) {
      for (let second = first + 1; second < n; second++) {
        const notResult = this.mkNot(result);
        const notX = this.mkNot(xs[first]);
        this.addClause([notResult, notX, this.mkNot(xs[second])]);
      }
    }
    if (!isFull) return;
    const andLit = this.ctx.fresh("and");
    for (let first = 0; first < n; first++) {
      const lits = [andLit];
      for (let second = 0; second < n; second++) if (second !== first) lits.push(xs[second]);
      this.addClause(lits);
    }
    ands.push(this.mkNot(andLit));
  }

  private mkOrderedExactly1(isFull: boolean, xs: number[]) {
    return this.mkOrdered1(isFull, true, xs);
  }

  private mkOrderedAtMost1(isFull: boolean, xs: number[]) {
    return this.mkOrdered1(isFull, false, xs);
  }

  private mkOrdered1(isFull: boolean, isEq: boolean, xs: number[]) {
    const n = xs.length;
    if (n <= 1 && !isEq) return this.ctx.mkTrue();
    if (n === 0) return this.ctx.mkFalse();
    if (n === 1) return xs[0];
    const result = this.ctx.fresh("ordered");
    const ys: number[] = [];
    for (let index = 0; index + 1 < n; index++) ys.push(this.ctx.fresh("y"));
    for (let index = 0; index + 2 < n; index++)
      this.addClause([this.mkNot(ys[index]), ys[index + 1]]);
    for (let index = 0; index + 1 < n; index++) {
      this.addClause([this.mkNot(xs[index]), ys[index]]);
      const notResult = this.mkNot(result);
      const notY = this.mkNot(ys[index]);
      this.addClause([notResult, notY, this.mkNot(xs[index + 1])]);
    }
    if (isEq) this.addClause([this.mkNot(result), ys[n - 2], xs[n - 1]]);
    for (let index = 1; index < n - 1; index++)
      this.addClause([this.mkNot(ys[index]), xs[index], ys[index - 1]]);
    this.addClause([this.mkNot(ys[0]), xs[0]]);
    if (isFull) {
      const twos: number[] = [];
      for (let index = 0; index < n - 1; index++) twos.push(this.ctx.fresh("two"));
      this.addClause([this.mkNot(twos[0]), ys[0]]);
      this.addClause([this.mkNot(twos[0]), xs[1]]);
      for (let index = 1; index < n - 1; index++) {
        this.addClause([this.mkNot(twos[index]), ys[index], twos[index - 1]]);
        this.addClause([this.mkNot(twos[index]), xs[index + 1], twos[index - 1]]);
      }
      if (isEq) {
        const zero = this.ctx.fresh("zero");
        const notZero = this.mkNot(zero);
        const notX = this.mkNot(xs[n - 1]);
        this.addClause([notZero, notX]);
        const notY = this.mkNot(ys[n - 2]);
        this.addClause([notZero, notY]);
        this.addClause([result, zero, twos[twos.length - 1]]);
      } else this.addClause([result, twos[twos.length - 1]]);
    }
    return result;
  }

  private mkAtMost1Bimander(isFull: boolean, xs: number[], ors: number[]) {
    if (isFull) return this.mkAtMost1(isFull, xs, ors, true);
    const n = xs.length;
    const result = this.ctx.fresh("bimander");
    const incSize = 2;
    const ands: number[] = [];
    for (let index = 0; index < n; index += incSize) {
      const group = xs.slice(index, index + Math.min(n - index, incSize));
      this.mkAtMost1Small(isFull, group, result, ands);
      ors.push(this.mkOr(group));
    }
    let numBits = 0;
    while (2 ** numBits < ors.length) numBits++;
    const bits: number[] = [];
    for (let bit = 0; bit < numBits; bit++) bits.push(this.ctx.fresh("bit"));
    for (let index = 0; index < ors.length; index++) {
      for (let bit = 0; bit < numBits; bit++) {
        const isBitSet = Math.floor(index / 2 ** bit) % 2 === 1;
        const notResult = this.mkNot(result);
        const notOr = this.mkNot(ors[index]);
        this.addClause([notResult, notOr, isBitSet ? bits[bit] : this.mkNot(bits[bit])]);
      }
    }
    return result;
  }

  private dualize(k: number, xs: number[]) {
    if (2 * k <= xs.length) return undefined;
    const dual = new Array<number>(xs.length);
    for (let index = 0; index < xs.length; index++) dual[index] = this.mkNot(xs[index]);
    return dual;
  }

  private mkMax(first: number, second: number) {
    if (first === second) return first;
    return this.ctx.mkMax([first, second]);
  }

  private mkMin(first: number, second: number) {
    if (first === second) return first;
    return this.ctx.mkMin([first, second]);
  }

  private addClause(lits: number[]) {
    for (let index = 0; index < lits.length; index++) if (this.isTrue(lits[index])) return;
    this.ctx.mkClause(lits);
  }

  private cmpGe(x1: number, x2: number, y1: number, y2: number) {
    this.addClause([this.mkNot(y2), x1]);
    this.addClause([this.mkNot(y2), x2]);
    this.addClause([this.mkNot(y1), x1, x2]);
  }

  private cmpLe(x1: number, x2: number, y1: number, y2: number) {
    this.addClause([this.mkNot(x1), y1]);
    this.addClause([this.mkNot(x2), y1]);
    const notX1 = this.mkNot(x1);
    const notX2 = this.mkNot(x2);
    this.addClause([notX1, notX2, y2]);
  }

  private cmpEq(x1: number, x2: number, y1: number, y2: number) {
    this.cmpGe(x1, x2, y1, y2);
    this.cmpLe(x1, x2, y1, y2);
  }

  private cmp(x1: number, x2: number, y1: number, y2: number) {
    switch (this.cmpType) {
      case LE:
      case LE_FULL:
        this.cmpLe(x1, x2, y1, y2);
        break;
      case GE:
      case GE_FULL:
        this.cmpGe(x1, x2, y1, y2);
        break;
      default:
        this.cmpEq(x1, x2, y1, y2);
    }
  }

  private getVcCmp() {
    return mkVc(2, this.cmpType === EQ ? 6 : 3);
  }

  private card(k: number, xs: number[], out: number[]) {
    const n = xs.length;
    if (n <= k) this.sorting(xs, out);
    else if (this.isUsingDcard(k, n)) this.dsorting(k, xs, out);
    else {
      const out1: number[] = [];
      const out2: number[] = [];
      const half = getFloor2(n);
      this.card(k, xs.slice(0, half), out1);
      this.card(k, xs.slice(half), out2);
      this.smerge(k, out1, out2, out);
    }
  }

  private getVcCard(k: number, n: number): Vc {
    if (n <= k) return this.getVcSorting(n);
    if (this.isUsingDcard(k, n)) return this.getVcDsorting(k, n);
    return this.getVcCardRec(k, n);
  }

  private getVcCardRec(k: number, n: number) {
    const half = getFloor2(n);
    return addVc(
      addVc(this.getVcCard(k, half), this.getVcCard(k, n - half)),
      this.getVcSmerge(k, half, n - half),
    );
  }

  private isUsingDcard(k: number, n: number) {
    return n < 10 && isVcLess(this.getVcDsorting(k, n), this.getVcCardRec(k, n));
  }

  private merge(as: number[], bs: number[], out: number[]) {
    const a = as.length;
    const b = bs.length;
    if (a === 1 && b === 1) {
      const y1 = this.mkMax(as[0], bs[0]);
      const y2 = this.mkMin(as[0], bs[0]);
      out.push(y1);
      out.push(y2);
      this.cmp(as[0], bs[0], y1, y2);
    } else if (a === 0) out.push(...bs);
    else if (b === 0) out.push(...as);
    else if (this.isUsingDsmerge(a, b, a + b)) this.dsmerge(a + b, as, bs, out);
    else if (isEven(a) && !isEven(b)) this.merge(bs, as, out);
    else {
      const evenA: number[] = [];
      const oddA: number[] = [];
      const evenB: number[] = [];
      const oddB: number[] = [];
      const out1: number[] = [];
      const out2: number[] = [];
      this.split(as, evenA, oddA);
      this.split(bs, evenB, oddB);
      this.merge(evenA, evenB, out1);
      this.merge(oddA, oddB, out2);
      this.interleave(out1, out2, out);
    }
  }

  private getVcMerge(a: number, b: number): Vc {
    if (a === 1 && b === 1) return this.getVcCmp();
    if (a === 0 || b === 0) return mkVc(0, 0);
    if (this.isUsingDsmerge(a, b, a + b)) return this.getVcDsmerge(a, b, a + b);
    return this.getVcMergeRec(a, b);
  }

  private getVcMergeRec(a: number, b: number) {
    return subVc(
      addVc(
        addVc(
          this.getVcMerge(getCeil2(a), getCeil2(b)),
          this.getVcMerge(getFloor2(a), getFloor2(b)),
        ),
        this.getVcInterleave(getCeil2(a) + getCeil2(b), getFloor2(a) + getFloor2(b)),
      ),
      mkVc(0, 2),
    );
  }

  private split(lits: number[], evens: number[], odds: number[]) {
    for (let index = 0; index < lits.length; index += 2) evens.push(lits[index]);
    for (let index = 1; index < lits.length; index += 2) odds.push(lits[index]);
  }

  private interleave(as: number[], bs: number[], out: number[]) {
    out.push(as[0]);
    const size = Math.min(as.length - 1, bs.length);
    for (let index = 0; index < size; index++) {
      const y1 = this.mkMax(as[index + 1], bs[index]);
      const y2 = this.mkMin(as[index + 1], bs[index]);
      this.cmp(as[index + 1], bs[index], y1, y2);
      out.push(y1);
      out.push(y2);
    }
    if (as.length === bs.length) out.push(bs[size]);
    else if (as.length === bs.length + 2) out.push(as[size + 1]);
  }

  private getVcInterleave(a: number, b: number) {
    return mulVc(this.getVcCmp(), Math.min((a - 1) >>> 0, b));
  }

  private sorting(xs: number[], out: number[]) {
    const n = xs.length;
    switch (n) {
      case 0:
        break;
      case 1:
        out.push(xs[0]);
        break;
      case 2:
        this.merge([xs[0]], [xs[1]], out);
        break;
      default:
        if (this.isUsingDsorting(n)) this.dsorting(n, xs, out);
        else {
          const out1: number[] = [];
          const out2: number[] = [];
          const half = getFloor2(n);
          this.sorting(xs.slice(0, half), out1);
          this.sorting(xs.slice(half), out2);
          this.merge(out1, out2, out);
        }
    }
  }

  private getVcSorting(n: number): Vc {
    switch (n) {
      case 0:
      case 1:
        return mkVc(0, 0);
      case 2:
        return this.getVcMerge(1, 1);
      default:
        return this.isUsingDsorting(n) ? this.getVcDsorting(n, n) : this.getVcSortingRec(n);
    }
  }

  private getVcSortingRec(n: number) {
    const half = getFloor2(n);
    return addVc(
      addVc(this.getVcSorting(half), this.getVcSorting(n - half)),
      this.getVcMerge(half, n - half),
    );
  }

  private isUsingDsorting(n: number) {
    return n < 10 && isVcLess(this.getVcDsorting(n, n), this.getVcSortingRec(n));
  }

  private smerge(c: number, as: number[], bs: number[], out: number[]) {
    const a = as.length;
    const b = bs.length;
    if (a === 1 && b === 1 && c === 1) {
      const y = this.mkMax(as[0], bs[0]);
      if (this.cmpType !== GE) {
        this.addClause([this.mkNot(as[0]), y]);
        this.addClause([this.mkNot(bs[0]), y]);
      }
      if (this.cmpType !== LE) this.addClause([this.mkNot(y), as[0], bs[0]]);
      out.push(y);
    } else if (a === 0) out.push(...bs.slice(0, Math.min(c, b)));
    else if (b === 0) out.push(...as.slice(0, Math.min(c, a)));
    else if (a > c) this.smerge(c, as.slice(0, c), bs, out);
    else if (b > c) this.smerge(c, as, bs.slice(0, c), out);
    else if (a + b <= c) this.merge(as, bs, out);
    else if (this.isUsingDsmerge(a, b, c)) this.dsmerge(c, as, bs, out);
    else {
      const evenA: number[] = [];
      const oddA: number[] = [];
      const evenB: number[] = [];
      const oddB: number[] = [];
      const out1: number[] = [];
      const out2: number[] = [];
      this.split(as, evenA, oddA);
      this.split(bs, evenB, oddB);
      const c1 = isEven(c) ? 1 + c / 2 : (c + 1) / 2;
      const c2 = isEven(c) ? c / 2 : (c - 1) / 2;
      this.smerge(c1, evenA, evenB, out1);
      this.smerge(c2, oddA, oddB, out2);
      let y = -1;
      if (isEven(c)) {
        const z1 = out1[out1.length - 1];
        const z2 = out2[out2.length - 1];
        out1.pop();
        out2.pop();
        y = this.mkMax(z1, z2);
        if (this.cmpType !== GE) {
          this.addClause([this.mkNot(z1), y]);
          this.addClause([this.mkNot(z2), y]);
        }
        if (this.cmpType !== LE) this.addClause([this.mkNot(y), z1, z2]);
      }
      this.interleave(out1, out2, out);
      if (isEven(c)) out.push(y);
    }
  }

  private getVcSmerge(a: number, b: number, c: number): Vc {
    if (a === 1 && b === 1 && c === 1) {
      let vc = mkVc(1, 0);
      if (this.cmpType !== GE) vc = addVc(vc, mkVc(0, 2));
      if (this.cmpType !== LE) vc = addVc(vc, mkVc(0, 1));
      return vc;
    }
    if (a === 0 || b === 0) return mkVc(0, 0);
    if (a > c) return this.getVcSmerge(c, b, c);
    if (b > c) return this.getVcSmerge(a, c, c);
    if (a + b <= c) return this.getVcMerge(a, b);
    if (this.isUsingDsmerge(a, b, c)) return this.getVcDsmerge(a, b, c);
    return this.getVcSmergeRec(a, b, c);
  }

  private getVcSmergeRec(a: number, b: number, c: number) {
    return addVc(
      addVc(
        addVc(
          addVc(
            addVc(
              this.getVcSmerge(getCeil2(a), getCeil2(b), isEven(c) ? 1 + c / 2 : (c + 1) / 2),
              this.getVcSmerge(getFloor2(a), getFloor2(b), isEven(c) ? c / 2 : (c - 1) / 2),
            ),
            this.getVcInterleave(getCeil2(a) + getCeil2(b), getFloor2(a) + getFloor2(b)),
          ),
          mkVc(1, 0),
        ),
        this.cmpType !== GE ? mkVc(0, 2) : mkVc(0, 0),
      ),
      this.cmpType !== LE ? mkVc(0, 1) : mkVc(0, 0),
    );
  }

  private isUsingDsmerge(a: number, b: number, c: number) {
    return (
      a < 10 && b < 10 && isVcLess(this.getVcDsmerge(a, b, a + b), this.getVcSmergeRec(a, b, c))
    );
  }

  private dsmerge(c: number, as: number[], bs: number[], out: number[]) {
    const a = as.length;
    const b = bs.length;
    for (let index = 0; index < c; index++) out.push(this.ctx.fresh("dsmerge"));
    if (this.cmpType !== GE) {
      for (let index = 0; index < a; index++) this.addClause([this.mkNot(as[index]), out[index]]);
      for (let index = 0; index < b; index++) this.addClause([this.mkNot(bs[index]), out[index]]);
      for (let i = 1; i <= a; i++) {
        for (let j = 1; j <= b && i + j <= c; j++) {
          const notA = this.mkNot(as[i - 1]);
          const notB = this.mkNot(bs[j - 1]);
          this.addClause([notA, notB, out[i + j - 1]]);
        }
      }
    }
    if (this.cmpType !== LE) {
      for (let k = 0; k < c; k++) {
        const lits = [this.mkNot(out[k])];
        if (a <= k) this.addClause([this.mkNot(out[k]), bs[k - a]]);
        if (b <= k) this.addClause([this.mkNot(out[k]), as[k - b]]);
        for (let i = 0; i < Math.min(a, k + 1); i++) {
          const j = k - i;
          if (j < b) this.addClause([...lits, as[i], bs[j]]);
        }
      }
    }
  }

  private getVcDsmerge(a: number, b: number, c: number) {
    let vc = mkVc(c, 0);
    const products = Math.floor((Math.min(a, c) * Math.min(b, c)) / 2);
    if (this.cmpType !== GE) vc = addVc(vc, mkVc(0, a + b + products));
    if (this.cmpType !== LE) vc = addVc(vc, mkVc(0, products));
    return vc;
  }

  private dsorting(m: number, xs: number[], out: number[]) {
    const n = xs.length;
    const lits: number[] = [];
    for (let index = 0; index < m; index++) out.push(this.ctx.fresh("dsort"));
    if (this.cmpType !== GE) {
      for (let k = 1; k <= m; k++) {
        lits.push(out[k - 1]);
        this.addSubset(true, k, 0, lits, xs);
        lits.pop();
      }
    }
    if (this.cmpType !== LE) {
      for (let k = 1; k <= m; k++) {
        lits.push(this.mkNot(out[k - 1]));
        this.addSubset(false, n - k + 1, 0, lits, xs);
        lits.pop();
      }
    }
  }

  private getVcDsorting(m: number, n: number) {
    let vc = mkVc(m, 0);
    if (this.cmpType !== GE) vc = addVc(vc, mkVc(0, 2 ** (n - 1)));
    if (this.cmpType !== LE) vc = addVc(vc, mkVc(0, 2 ** (n - 1)));
    return vc;
  }

  private addSubset(isPositive: boolean, k: number, offset: number, lits: number[], xs: number[]) {
    if (k === 0) {
      this.addClause([...lits]);
      return;
    }
    for (let index = offset; index < xs.length - k + 1; index++) {
      lits.push(isPositive ? this.mkNot(xs[index]) : xs[index]);
      this.addSubset(isPositive, k - 1, index + 1, lits, xs);
      lits.pop();
    }
  }
}
