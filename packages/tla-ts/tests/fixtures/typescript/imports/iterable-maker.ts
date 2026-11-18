// An object whose Symbol.iterator method this module writes, which a module that imports it iterates.
export interface Values {
  src: number[];
  index: number;
  next: (this: Values) => IteratorResult<number>;
}

export interface Iterable {
  src: number[];
  [Symbol.iterator]: (this: Iterable) => Values;
}

function stepValues(this: Values): IteratorResult<number> {
  if (this.index < this.src.length) {
    const value = this.src[this.index];
    this.index += 1;
    return { value, done: false };
  }
  return { value: undefined, done: true };
}

function openValues(this: Iterable): Values {
  return { src: this.src, index: 0, next: stepValues };
}

export const makeIterable = (src: number[]): Iterable => ({ src, [Symbol.iterator]: openValues });
