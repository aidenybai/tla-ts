// A module whose export takes a function, which no caller of the module passes to it here.
const memo: number[] = [1, 2];

export const total = () => memo.reduce((sum, value) => sum + value, 0);

export const apply = (transform: (value: number) => number) => memo.map(transform);
