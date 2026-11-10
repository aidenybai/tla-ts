// Ported from Z3 (src/sat/sat_clause.h, src/sat/sat_clause.cpp), MIT license, see
// z3-license.txt.

export const NULL_LITERAL = -2;
export const NULL_BOOL_VAR = -1;

const STRENGTHENED = 1;
const REMOVED = 2;
const LEARNED = 4;
const USED = 8;
const FROZEN = 16;
const REINIT_STACK = 32;

const grow = (array: Int32Array<ArrayBuffer>, size: number) => {
  if (size <= array.length) return array;
  const grown = new Int32Array(Math.max(size, array.length * 2));
  grown.set(array);
  return grown;
};

export const getApprox = (lits: ArrayLike<number>, size: number) => {
  let approx = 0;
  for (let index = 0; index < size; index++) approx |= 1 << ((lits[index] >> 1) & 31);
  return approx;
};

export class ClauseArena {
  lits = new Int32Array(1024);
  private top = 0;
  private freeIds: number[] = [];
  private numIds = 0;
  start = new Int32Array(64);
  size = new Int32Array(64);
  capacity = new Int32Array(64);
  flags = new Int32Array(64);
  approx = new Int32Array(64);
  inactRounds = new Int32Array(64);
  glue = new Int32Array(64);
  psm = new Int32Array(64);

  private mkId() {
    const id = this.freeIds.pop() ?? this.numIds++;
    if (id >= this.start.length) {
      const length = this.start.length * 2;
      this.start = grow(this.start, length);
      this.size = grow(this.size, length);
      this.capacity = grow(this.capacity, length);
      this.flags = grow(this.flags, length);
      this.approx = grow(this.approx, length);
      this.inactRounds = grow(this.inactRounds, length);
      this.glue = grow(this.glue, length);
      this.psm = grow(this.psm, length);
    }
    return id;
  }

  mkClause(lits: ArrayLike<number>, numLits: number, isLearned: boolean) {
    const id = this.mkId();
    this.lits = grow(this.lits, this.top + numLits);
    for (let index = 0; index < numLits; index++) this.lits[this.top + index] = lits[index];
    this.start[id] = this.top;
    this.top += numLits;
    this.size[id] = numLits;
    this.capacity[id] = numLits;
    this.flags[id] = isLearned ? LEARNED : 0;
    this.inactRounds[id] = 0;
    this.glue[id] = 255;
    this.psm[id] = 255;
    this.markStrengthened(id);
    return id;
  }

  copyClause(other: ClauseArena, source: number) {
    const id = this.mkClause(other.lits.subarray(other.start[source]), other.size[source], false);
    this.flags[id] =
      (other.flags[source] & (LEARNED | REINIT_STACK | FROZEN)) | (this.flags[id] & STRENGTHENED);
    this.glue[id] = other.glue[source];
    this.psm[id] = other.psm[source];
    this.approx[id] = other.approx[source];
    return id;
  }

  delClause(id: number) {
    this.freeIds.push(id);
  }

  reset() {
    this.top = 0;
    this.freeIds = [];
    this.numIds = 0;
  }

  get(id: number, index: number) {
    return this.lits[this.start[id] + index];
  }

  set(id: number, index: number, lit: number) {
    this.lits[this.start[id] + index] = lit;
  }

  swap(id: number, first: number, second: number) {
    const base = this.start[id];
    const lit = this.lits[base + first];
    this.lits[base + first] = this.lits[base + second];
    this.lits[base + second] = lit;
  }

  contains(id: number, lit: number) {
    const base = this.start[id];
    for (let index = 0; index < this.size[id]; index++)
      if (this.lits[base + index] === lit) return true;
    return false;
  }

  getLits(id: number) {
    return Array.from(this.lits.subarray(this.start[id], this.start[id] + this.size[id]));
  }

  private hasFlag(id: number, flag: number) {
    return (this.flags[id] & flag) !== 0;
  }

  private setFlag(id: number, flag: number, isSet: boolean) {
    this.flags[id] = isSet ? this.flags[id] | flag : this.flags[id] & ~flag;
  }

  isLearned(id: number) {
    return this.hasFlag(id, LEARNED);
  }

  setLearned(id: number, isLearned: boolean) {
    this.setFlag(id, LEARNED, isLearned);
  }

  isStrengthened(id: number) {
    return this.hasFlag(id, STRENGTHENED);
  }

  markStrengthened(id: number) {
    this.setFlag(id, STRENGTHENED, true);
    this.updateApprox(id);
  }

  unmarkStrengthened(id: number) {
    this.setFlag(id, STRENGTHENED, false);
  }

  updateApprox(id: number) {
    this.approx[id] = getApprox(this.lits.subarray(this.start[id]), this.size[id]);
  }

  wasRemoved(id: number) {
    return this.hasFlag(id, REMOVED);
  }

  setRemoved(id: number, isRemoved: boolean) {
    this.setFlag(id, REMOVED, isRemoved);
  }

  wasUsed(id: number) {
    return this.hasFlag(id, USED);
  }

  markUsed(id: number) {
    this.setFlag(id, USED, true);
  }

  unmarkUsed(id: number) {
    this.setFlag(id, USED, false);
  }

  isFrozen(id: number) {
    return this.hasFlag(id, FROZEN);
  }

  setFrozen(id: number, isFrozen: boolean) {
    this.setFlag(id, FROZEN, isFrozen);
  }

  isOnReinitStack(id: number) {
    return this.hasFlag(id, REINIT_STACK);
  }

  setReinitStack(id: number, isOnStack: boolean) {
    this.setFlag(id, REINIT_STACK, isOnStack);
  }

  setGlue(id: number, glue: number) {
    this.glue[id] = Math.min(glue, 255);
  }

  setPsm(id: number, psm: number) {
    this.psm[id] = Math.min(psm, 255);
  }

  incInactRounds(id: number) {
    this.inactRounds[id] = (this.inactRounds[id] + 1) & 255;
  }

  shrink(id: number, numLits: number) {
    if (numLits < this.size[id]) {
      this.size[id] = numLits;
      this.markStrengthened(id);
    }
  }

  restore(id: number, numLits: number) {
    this.size[id] = numLits;
  }

  elim(id: number, lit: number) {
    const base = this.start[id];
    const size = this.size[id];
    let index = 0;
    while (this.lits[base + index] !== lit) index++;
    for (index++; index < size; index++) this.lits[base + index - 1] = this.lits[base + index];
    this.lits[base + size - 1] = lit;
    this.size[id] = size - 1;
    this.markStrengthened(id);
  }
}
