export type Step = 1 | 2;

export const LIMIT = 4;

export const isWithin = (value: number) => value <= LIMIT;
