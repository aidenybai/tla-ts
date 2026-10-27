// A port of DieHard.tla from tlaplus/Examples.
let big = 0;
let small = 0;

export const fillSmallJug = () => {
  small = 3;
};

export const fillBigJug = () => {
  big = 5;
};

export const emptySmallJug = () => {
  small = 0;
};

export const emptyBigJug = () => {
  big = 0;
};

export const smallToBig = () => {
  const total = big + small;
  big = Math.min(total, 5);
  small = total - big;
};

export const bigToSmall = () => {
  const total = big + small;
  small = Math.min(total, 3);
  big = total - small;
};

export const typeOK = () => small >= 0 && small <= 3 && big >= 0 && big <= 5;

export const notSolved = () => big !== 4;
