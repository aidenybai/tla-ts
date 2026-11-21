interface Precedence {
  low: number;
  high: number;
}

const createPrecedence = (low: number, high: number): Precedence => ({ low, high });

export const LOWEST = createPrecedence(1, 1);

export const PRECEDENCES = new Map([
  ["=>", LOWEST],
  ...["=", "#"].map((relation): [string, Precedence] => [relation, createPrecedence(5, 5)]),
]);
