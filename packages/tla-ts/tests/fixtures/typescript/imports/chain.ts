export class Chain {
  items: number[];

  constructor(items: number[]) {
    this.items = items;
  }

  add(value: number) {
    this.items.push(value);
  }
}
