export abstract class Reason {
  isMarked = false;
}

export type Why = { kind: "axiom" } | { kind: "reason"; reason: Reason };

export const AXIOM: Why = { kind: "axiom" };

export class Item {
  why: Why = AXIOM;
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}
