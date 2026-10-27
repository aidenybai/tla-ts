// A port of Hanoi.tla from tlaplus/Examples, with D = 3 and N = 3.
type Tower = 0 | 1 | 2;

const d = 3;
const n = 3;

const and = (x: number, y: number, bit: number, rest: number): number =>
  rest === 0
    ? 0
    : 2 ** bit * (Math.floor(x / 2 ** bit) % 2) * (Math.floor(y / 2 ** bit) % 2) +
      and(x, y, bit + 1, Math.floor(rest / 2));

const bitwiseAnd = (x: number, y: number) => and(x, y, 0, x);

const isPowerOfTwo = (value: number) => bitwiseAnd(value, value - 1) === 0;

const setOfPowerOfTwo = (count: number) =>
  new Set(
    Array.from({ length: 2 ** count - 1 }, (_, index) => index + 1).filter((value) =>
      isPowerOfTwo(value),
    ),
  );

let towers = Array.from({ length: n }, (_, index) => (index === 0 ? 2 ** d - 1 : 0));

const isEmptyTower = (tower: number) => tower === 0;

const isOnTower = (tower: number, disk: number) => bitwiseAnd(tower, disk) === disk;

const isSmallestDisk = (tower: number, disk: number) =>
  isOnTower(tower, disk) && bitwiseAnd(tower, disk - 1) === 0;

const canMoveOff = (tower: number, disk: number) =>
  isOnTower(tower, disk) && isSmallestDisk(tower, disk);

const canMoveTo = (tower: number, disk: number) =>
  bitwiseAnd(tower, disk - 1) === 0 || isEmptyTower(tower);

export const move = (from: Tower, to: Tower, disk: number) => {
  if (!setOfPowerOfTwo(d).has(disk)) return;
  if (from === to) return;
  if (canMoveOff(towers[from], disk) && canMoveTo(towers[to], disk)) {
    towers[from] -= disk;
    towers[to] += disk;
  }
};

export const notSolved = () => towers[n - 1] !== 2 ** d - 1;
