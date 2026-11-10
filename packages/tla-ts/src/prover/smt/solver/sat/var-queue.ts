// Ported from Z3 (src/util/var_queue.h, src/util/heap.h), MIT license, see z3-license.txt.

export class VarQueue {
  private values: number[] = [-1];
  private indices: number[] = [];

  constructor(private activity: number[]) {}

  private isLess(first: number, second: number) {
    return this.activity[first] > this.activity[second];
  }

  private moveUp(start: number) {
    let index = start;
    const value = this.values[index];
    for (;;) {
      const parentIndex = index >> 1;
      if (parentIndex === 0 || !this.isLess(value, this.values[parentIndex])) break;
      this.values[index] = this.values[parentIndex];
      this.indices[this.values[index]] = index;
      index = parentIndex;
    }
    this.values[index] = value;
    this.indices[value] = index;
  }

  private moveDown(start: number) {
    let index = start;
    const value = this.values[index];
    const size = this.values.length;
    for (;;) {
      const left = 2 * index;
      if (left >= size) break;
      const right = left + 1;
      const minIndex =
        right < size && this.isLess(this.values[right], this.values[left]) ? right : left;
      const minValue = this.values[minIndex];
      if (!this.isLess(minValue, value)) break;
      this.values[index] = minValue;
      this.indices[minValue] = index;
      index = minIndex;
    }
    this.values[index] = value;
    this.indices[value] = index;
  }

  contains(value: number) {
    return value < this.indices.length && this.indices[value] !== 0;
  }

  isEmpty() {
    return this.values.length === 1;
  }

  private insert(value: number) {
    const index = this.values.length;
    this.indices[value] = index;
    this.values.push(value);
    this.moveUp(index);
  }

  private erase(value: number) {
    const index = this.indices[value];
    if (index === this.values.length - 1) {
      this.indices[value] = 0;
      this.values.pop();
      return;
    }
    const last = this.values[this.values.length - 1];
    this.values[index] = last;
    this.indices[last] = index;
    this.indices[value] = 0;
    this.values.pop();
    const parentIndex = index >> 1;
    if (parentIndex !== 0 && this.isLess(last, this.values[parentIndex])) this.moveUp(index);
    else this.moveDown(index);
  }

  activityIncreased(value: number) {
    if (this.contains(value)) this.moveUp(this.indices[value]);
  }

  mkVar(value: number) {
    while (this.indices.length <= value) this.indices.push(0);
    this.unassignVar(value);
  }

  delVar(value: number) {
    if (this.contains(value)) this.erase(value);
  }

  unassignVar(value: number) {
    if (!this.contains(value)) this.insert(value);
  }

  nextVar() {
    const result = this.values[1];
    if (this.values.length === 2) {
      this.indices[result] = 0;
      this.values.pop();
      return result;
    }
    const last = this.values[this.values.length - 1];
    this.values[1] = last;
    this.indices[last] = 1;
    this.indices[result] = 0;
    this.values.pop();
    this.moveDown(1);
    return result;
  }

  minVar() {
    return this.values[1];
  }

  isMoreActive(first: number, second: number) {
    return this.isLess(first, second);
  }
}
