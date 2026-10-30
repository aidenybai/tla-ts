// Ported from Z3 (src/util/uint_set.h, src/util/heap.h, src/math/lp/stacked_vector.h), MIT
// license, see z3-license.txt. The containers whose iteration order the lp solver depends on.

// indexed_uint_set: insertion order, and a removal moves the last element into the gap.
export class IndexedUintSet {
  elems: number[] = [];
  private positions: number[] = [];

  get size() {
    return this.elems.length;
  }

  has(value: number) {
    const position = this.positions[value];
    return position !== undefined && position < this.elems.length && this.elems[position] === value;
  }

  add(value: number) {
    if (this.has(value)) return;
    this.positions[value] = this.elems.length;
    this.elems.push(value);
  }

  delete(value: number) {
    const last = this.elems[this.elems.length - 1];
    if (value !== last) {
      const position = this.positions[value];
      this.positions[last] = position;
      this.elems[position] = last;
      this.positions[value] = this.elems.length - 1;
      this.elems[this.elems.length - 1] = value;
    }
    this.elems.pop();
  }

  clear() {
    this.elems = [];
  }
}

// heap<lpvar_lt>: the infeasible columns, smallest first.
export class VarHeap {
  private values: number[] = [];
  private positions: number[] = [];

  get size() {
    return this.values.length;
  }

  has(value: number) {
    const position = this.positions[value];
    return position !== undefined && position >= 0 && this.values[position] === value;
  }

  getMin() {
    return this.values[0];
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  insert(value: number) {
    this.values.push(value);
    this.positions[value] = this.values.length - 1;
    this.moveUp(this.values.length - 1);
  }

  erase(value: number) {
    const position = this.positions[value];
    const last = this.values.pop() ?? -1;
    this.positions[value] = -1;
    if (last === value) return;
    this.values[position] = last;
    this.positions[last] = position;
    this.moveUp(position);
    this.moveDown(this.positions[last]);
  }

  clear() {
    for (const value of this.values) this.positions[value] = -1;
    this.values = [];
  }

  private swap(first: number, second: number) {
    const values = this.values;
    const saved = values[first];
    values[first] = values[second];
    values[second] = saved;
    this.positions[values[first]] = first;
    this.positions[values[second]] = second;
  }

  private moveUp(start: number) {
    let position = start;
    while (position > 0) {
      const parent = (position - 1) >> 1;
      if (this.values[parent] <= this.values[position]) return;
      this.swap(parent, position);
      position = parent;
    }
  }

  private moveDown(start: number) {
    let position = start;
    for (;;) {
      const left = 2 * position + 1;
      if (left >= this.values.length) return;
      const right = left + 1;
      const child =
        right < this.values.length && this.values[right] < this.values[left] ? right : left;
      if (this.values[position] <= this.values[child]) return;
      this.swap(position, child);
      position = child;
    }
  }
}

// stacked_vector: a vector whose size and values a pop restores to the matching push.
export class StackedVector<T> {
  values: T[] = [];
  private log: { index: number; value: T }[] = [];
  private scopes: { size: number; logSize: number }[] = [];

  get(index: number) {
    return this.values[index];
  }

  set(index: number, value: T) {
    if (this.values[index] === value) return;
    if (this.scopes.length > 0) this.log.push({ index, value: this.values[index] });
    this.values[index] = value;
  }

  push(value: T) {
    this.values.push(value);
  }

  pushScope() {
    this.scopes.push({ size: this.values.length, logSize: this.log.length });
  }

  popScope(count: number) {
    const scope = this.scopes[this.scopes.length - count];
    this.scopes.length -= count;
    this.values.length = scope.size;
    for (let index = this.log.length; index-- > scope.logSize;) {
      const entry = this.log[index];
      if (entry.index < this.values.length) this.values[entry.index] = entry.value;
    }
    this.log.length = scope.logSize;
  }
}
