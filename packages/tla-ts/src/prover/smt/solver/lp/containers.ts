// Ported from Z3 (src/util/uint_set.h, src/util/heap.h, src/math/lp/stacked_vector.h), MIT license, see z3-license.txt.
import { shrink } from "../array";

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

interface StackedLogEntry<T> {
  index: number;
  value: T;
}

interface StackedScope {
  size: number;
  logSize: number;
}

export class StackedVector<T> {
  values: T[] = [];
  private log: StackedLogEntry<T>[] = [];
  private scopes: StackedScope[] = [];

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
    shrink(this.scopes, this.scopes.length - count);
    shrink(this.values, scope.size);
    for (let index = this.log.length; index-- > scope.logSize;) {
      const entry = this.log[index];
      if (entry.index < this.values.length) this.values[entry.index] = entry.value;
    }
    shrink(this.log, scope.logSize);
  }
}

interface HashLink<V> {
  readonly key: number;
  next: HashNode<V> | null;
}

interface HashNode<V> extends HashLink<V> {
  readonly value: V;
}

const constrainHash = (hash: number, count: number) =>
  (count & (count - 1)) === 0 ? hash & (count - 1) : hash < count ? hash : hash % count;

const isHashPowerOfTwo = (count: number) => count > 2 && (count & (count - 1)) === 0;

const isPrime = (value: number) => {
  for (let divisor = 2; divisor * divisor <= value; divisor++)
    if (value % divisor === 0) return false;
  return value >= 2;
};

const getNextPrime = (value: number) => {
  let candidate = value;
  while (!isPrime(candidate)) candidate++;
  return candidate;
};

// libc++'s std::unordered_map, whose iteration order Z3's macOS release build exposes: a Map would iterate differently.
export class UnorderedUintMap<V> {
  private readonly anchor: HashLink<V> = { key: -1, next: null };
  private buckets: (HashLink<V> | null)[] = [];
  private nodes = new Map<number, HashNode<V>>();

  has(key: number) {
    return this.nodes.has(key);
  }

  get(key: number) {
    return this.nodes.get(key)?.value;
  }

  *[Symbol.iterator](): IterableIterator<[number, V]> {
    for (let node = this.anchor.next; node !== null; node = node.next) yield [node.key, node.value];
  }

  insert(key: number, value: V) {
    const node: HashNode<V> = { key, value, next: null };
    const count = this.buckets.length;
    if (this.nodes.size + 1 > count || count === 0)
      this.rehash(Math.max(2 * count + (isHashPowerOfTwo(count) ? 0 : 1), this.nodes.size + 1));
    this.nodes.set(key, node);
    const bucket = constrainHash(key, this.buckets.length);
    const previous = this.buckets[bucket];
    if (previous !== null) {
      node.next = previous.next;
      previous.next = node;
      return;
    }
    node.next = this.anchor.next;
    this.anchor.next = node;
    this.buckets[bucket] = this.anchor;
    if (node.next !== null) this.buckets[constrainHash(node.next.key, this.buckets.length)] = node;
  }

  delete(key: number) {
    const node = this.nodes.get(key);
    if (node === undefined) return;
    this.nodes.delete(key);
    const count = this.buckets.length;
    const bucket = constrainHash(key, count);
    let previous = this.buckets[bucket] ?? this.anchor;
    while (previous.next !== node) previous = previous.next ?? this.anchor;
    const isPreviousOutside =
      previous === this.anchor || constrainHash(previous.key, count) !== bucket;
    if (isPreviousOutside && (node.next === null || constrainHash(node.next.key, count) !== bucket))
      this.buckets[bucket] = null;
    if (node.next !== null) {
      const nextBucket = constrainHash(node.next.key, count);
      if (nextBucket !== bucket) this.buckets[nextBucket] = previous;
    }
    previous.next = node.next;
  }

  clear() {
    this.anchor.next = null;
    this.buckets.fill(null);
    this.nodes.clear();
  }

  private rehash(requested: number) {
    const count =
      requested === 1
        ? 2
        : (requested & (requested - 1)) === 0
          ? requested
          : getNextPrime(requested);
    if (count <= this.buckets.length) return;
    this.buckets = Array.from<HashLink<V> | null>({ length: count }).fill(null);
    let previous: HashLink<V> = this.anchor;
    let current = previous.next;
    if (current === null) return;
    let previousBucket = constrainHash(current.key, count);
    this.buckets[previousBucket] = previous;
    previous = current;
    for (current = current.next; current !== null; current = previous.next) {
      const bucket = constrainHash(current.key, count);
      if (bucket === previousBucket) {
        previous = current;
        continue;
      }
      const head = this.buckets[bucket];
      if (head === null) {
        this.buckets[bucket] = previous;
        previous = current;
        previousBucket = bucket;
        continue;
      }
      previous.next = current.next;
      current.next = head.next;
      head.next = current;
    }
  }
}
