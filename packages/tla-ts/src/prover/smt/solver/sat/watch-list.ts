// Ported from Z3 (src/sat/sat_watched.h, src/sat/sat_watched.cpp), MIT license, see
// z3-license.txt.

export const WATCH_BINARY = 0;
export const WATCH_CLAUSE = 1;
export const WATCH_EXT_CONSTRAINT = 2;

export const mkBinaryWatch = (isLearned: boolean) => (isLearned ? 4 : 0);

export const mkClauseWatch = (blockedLit: number) => WATCH_CLAUSE + (blockedLit << 2);

export class WatchList {
  data = new Int32Array(8);
  size = 0;

  push(val1: number, val2: number) {
    if (2 * this.size + 2 > this.data.length) {
      const data = new Int32Array(this.data.length * 2);
      data.set(this.data);
      this.data = data;
    }
    this.data[2 * this.size] = val1;
    this.data[2 * this.size + 1] = val2;
    this.size++;
  }

  pushBinary(lit: number, isLearned: boolean) {
    this.push(lit, mkBinaryWatch(isLearned));
  }

  pushClause(blockedLit: number, clause: number) {
    this.push(clause, mkClauseWatch(blockedLit));
  }

  val1(index: number) {
    return this.data[2 * index];
  }

  val2(index: number) {
    return this.data[2 * index + 1];
  }

  getKind(index: number) {
    return this.data[2 * index + 1] & 3;
  }

  isBinary(index: number) {
    return (this.data[2 * index + 1] & 3) === WATCH_BINARY;
  }

  isClause(index: number) {
    return (this.data[2 * index + 1] & 3) === WATCH_CLAUSE;
  }

  getLiteral(index: number) {
    return this.data[2 * index];
  }

  isLearned(index: number) {
    return ((this.data[2 * index + 1] >> 2) & 1) === 1;
  }

  setLearned(index: number, isLearned: boolean) {
    this.data[2 * index + 1] = isLearned
      ? this.data[2 * index + 1] | 4
      : this.data[2 * index + 1] & ~4;
  }

  getClause(index: number) {
    return this.data[2 * index];
  }

  getBlockedLiteral(index: number) {
    return this.data[2 * index + 1] >> 2;
  }

  setClause(index: number, blockedLit: number, clause: number) {
    this.data[2 * index] = clause;
    this.data[2 * index + 1] = mkClauseWatch(blockedLit);
  }

  copy(target: number, source: number) {
    this.data[2 * target] = this.data[2 * source];
    this.data[2 * target + 1] = this.data[2 * source + 1];
  }

  setEnd(size: number) {
    this.size = size;
  }

  reset() {
    this.size = 0;
  }

  finalize() {
    this.data = new Int32Array(8);
    this.size = 0;
  }

  findBinary(lit: number) {
    for (let index = 0; index < this.size; index++)
      if (this.isBinary(index) && this.data[2 * index] === lit) return index;
    return -1;
  }

  eraseAt(position: number) {
    this.data.copyWithin(2 * position, 2 * position + 2, 2 * this.size);
    this.size--;
  }

  erase(val1: number, val2: number) {
    for (let index = 0; index < this.size; index++)
      if (this.data[2 * index] === val1 && this.data[2 * index + 1] === val2) {
        this.eraseAt(index);
        return;
      }
  }

  eraseClause(clause: number) {
    for (let index = 0; index < this.size; index++)
      if (this.isClause(index) && this.data[2 * index] === clause) {
        this.eraseAt(index);
        return true;
      }
    return false;
  }

  sortBinariesFirst() {
    const binaries: number[] = [];
    const others: number[] = [];
    for (let index = 0; index < this.size; index++)
      (this.isBinary(index) ? binaries : others).push(this.val1(index), this.val2(index));
    this.data.set(binaries, 0);
    this.data.set(others, binaries.length);
  }
}
