export const limit = 3;

export function getNext() {
  return limit + 1;
}

export const box = { value: 1 };

export function bump() {
  box.value += 1;
}

export class Counter {
  count = limit;

  step() {
    this.count += 1;
  }
}
