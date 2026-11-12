// Ported from Z3 (src/sat/smt/pb_constraint.h, src/sat/smt/pb_constraint.cpp,
// src/sat/smt/pb_card.h, src/sat/smt/pb_card.cpp, src/sat/smt/pb_pb.h, src/sat/smt/pb_pb.cpp),
// MIT license, see z3-license.txt.
import { L_FALSE } from "../lbool";
import { NULL_LITERAL } from "./clause";
import { WATCH_EXT_CONSTRAINT, type WatchList } from "./watch-list";

export interface ConstraintHost {
  value(lit: number): number;
  lvl(lit: number): number;
  getWlist(lit: number): WatchList;
  assignBy(constraint: Constraint, lit: number): void;
  setConflictBy(constraint: Constraint, lit: number): void;
}

export abstract class Constraint {
  isRemoved = false;
  watch = NULL_LITERAL;
  glue = 0;
  psm = 0;
  isLearned = false;

  constructor(
    readonly index: number,
    public lit: number,
    public lits: number[],
    public k: number,
  ) {}

  abstract isCard(): this is Card;
  abstract negate(): void;
  abstract clearWatch(host: ConstraintHost): void;
  abstract initWatch(host: ConstraintHost): boolean;

  get size() {
    return this.lits.length;
  }

  getCoeff(_index: number) {
    return 1;
  }

  setK(k: number) {
    this.k = k;
  }

  setSize(size: number) {
    this.lits.length = size;
  }

  swap(first: number, second: number) {
    const lit = this.lits[first];
    this.lits[first] = this.lits[second];
    this.lits[second] = lit;
  }

  isWatchedLit() {
    return this.watch === this.lit && this.lit !== NULL_LITERAL;
  }

  isClear() {
    return this.watch === NULL_LITERAL && this.lit !== NULL_LITERAL;
  }

  isWatched(host: ConstraintHost, lit: number) {
    const wlist = host.getWlist(lit ^ 1);
    for (let index = 0; index < wlist.size; index++)
      if (wlist.val1(index) === this.index && wlist.getKind(index) === WATCH_EXT_CONSTRAINT)
        return true;
    return false;
  }

  unwatchLiteral(host: ConstraintHost, lit: number) {
    host.getWlist(lit ^ 1).erase(this.index, WATCH_EXT_CONSTRAINT);
  }

  watchLiteral(host: ConstraintHost, lit: number) {
    host.getWlist(lit ^ 1).push(this.index, WATCH_EXT_CONSTRAINT);
  }

  nullifyTrackingLiteral(host: ConstraintHost) {
    if (this.lit === NULL_LITERAL) return;
    this.unwatchLiteral(host, this.lit);
    this.unwatchLiteral(host, this.lit ^ 1);
    this.lit = NULL_LITERAL;
  }
}

export class Card extends Constraint {
  isCard(): this is Card {
    return true;
  }

  negate() {
    this.lit ^= 1;
    for (let index = 0; index < this.size; index++) this.lits[index] ^= 1;
    this.k = this.size - this.k + 1;
  }

  clearWatch(host: ConstraintHost) {
    if (this.isClear()) return;
    this.watch = NULL_LITERAL;
    const size = Math.min(this.k + 1, this.size);
    for (let index = 0; index < size; index++) this.unwatchLiteral(host, this.lits[index]);
  }

  initWatch(host: ConstraintHost) {
    let root = this.lit;
    if (root !== NULL_LITERAL && host.value(root) === L_FALSE) {
      this.clearWatch(host);
      this.negate();
      root ^= 1;
    }
    if (root !== NULL_LITERAL) {
      if (!this.isWatched(host, root)) this.watchLiteral(host, root);
      if (!this.isWatched(host, root ^ 1)) this.watchLiteral(host, root ^ 1);
    }
    const lits = this.lits;
    const size = this.size;
    const bound = this.k;
    if (bound === size) {
      for (const lit of lits) host.assignBy(this, lit);
      return false;
    }
    let next = 0;
    for (let index = 0; index < size; index++) {
      if (host.value(lits[index]) === L_FALSE) continue;
      if (next !== index) {
        if (this.isWatchedLit() && next <= bound && index > bound) {
          this.unwatchLiteral(host, lits[next]);
          this.watchLiteral(host, lits[index]);
        }
        this.swap(index, next);
      }
      next++;
    }
    if (next < bound) {
      if (this.isWatchedLit()) this.clearWatch(host);
      let alit = lits[next];
      for (let index = bound; index < size; index++)
        if (host.lvl(alit) < host.lvl(lits[index])) {
          this.swap(index, next);
          alit = lits[next];
        }
      host.setConflictBy(this, alit);
      return false;
    }
    if (next === bound) {
      for (let index = 0; index < bound; index++) host.assignBy(this, lits[index]);
      return false;
    }
    if (this.isWatchedLit()) return true;
    this.clearWatch(host);
    for (let index = 0; index <= bound; index++)
      if (!this.isWatched(host, lits[index])) this.watchLiteral(host, lits[index]);
    this.watch = this.lit;
    return true;
  }
}

export class Pbc extends Constraint {
  slack = 0;
  numWatch = 0;
  maxSum = 0;

  constructor(
    index: number,
    lit: number,
    lits: number[],
    public coeffs: number[],
    k: number,
  ) {
    super(index, lit, lits, k);
    this.updateMaxSum();
  }

  isCard(): this is Card {
    return false;
  }

  getCoeff(index: number) {
    return this.coeffs[index];
  }

  setK(k: number) {
    this.k = k;
    this.updateMaxSum();
  }

  setSize(size: number) {
    this.lits.length = size;
    this.coeffs.length = size;
  }

  swap(first: number, second: number) {
    super.swap(first, second);
    const coeff = this.coeffs[first];
    this.coeffs[first] = this.coeffs[second];
    this.coeffs[second] = coeff;
  }

  updateMaxSum() {
    this.maxSum = 0;
    for (let index = 0; index < this.size; index++) {
      this.coeffs[index] = Math.min(this.k, this.coeffs[index]);
      this.maxSum += this.coeffs[index];
    }
  }

  negate() {
    this.lit ^= 1;
    let sum = 0;
    let max = 0;
    for (let index = 0; index < this.size; index++) {
      this.lits[index] ^= 1;
      sum += this.coeffs[index];
      max = Math.max(max, this.coeffs[index]);
    }
    this.k = sum - this.k + 1;
    if (max > this.k)
      for (let index = 0; index < this.size; index++)
        this.coeffs[index] = Math.min(this.k, this.coeffs[index]);
  }

  clearWatch(host: ConstraintHost) {
    this.watch = NULL_LITERAL;
    for (let index = 0; index < this.numWatch; index++) this.unwatchLiteral(host, this.lits[index]);
    this.numWatch = 0;
  }

  initWatch(host: ConstraintHost) {
    this.clearWatch(host);
    if (this.lit !== NULL_LITERAL && host.value(this.lit) === L_FALSE) this.negate();
    const lits = this.lits;
    const size = this.size;
    const bound = this.k;
    let slack = 0;
    let slack1 = 0;
    let numWatch = 0;
    let next = 0;
    for (let index = 0; index < size; index++) {
      if (host.value(lits[index]) === L_FALSE) continue;
      if (next !== index) this.swap(index, next);
      if (slack <= bound) {
        slack += this.coeffs[next];
        numWatch++;
      } else slack1 += this.coeffs[next];
      next++;
    }
    if (slack < bound) {
      let lit = lits[next];
      for (let index = next + 1; index < size; index++)
        if (host.lvl(lit) < host.lvl(lits[index])) lit = lits[index];
      host.setConflictBy(this, lit);
      return false;
    }
    for (let index = 0; index < numWatch; index++) this.watchLiteral(host, lits[index]);
    this.slack = slack;
    this.numWatch = numWatch;
    if (slack + slack1 === bound)
      for (let index = 0; index < next; index++) host.assignBy(this, lits[index]);
    return true;
  }
}
