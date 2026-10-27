// A port of GameOfLife.tla from tlaplus/Examples, with N = 3.
type Row = [boolean, boolean, boolean];

const n = 3;

const neighbors = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

let grid: [Row, Row, Row];

const isAlive = (x: number, y: number) => x >= 0 && x < n && y >= 0 && y < n && grid[x][y];

const getScore = (x: number, y: number) =>
  neighbors.filter((neighbor) => isAlive(x + neighbor[0], y + neighbor[1])).length;

export const next = () => {
  grid = grid.map((row, x) =>
    row.map((isLive, y) => (isLive ? [2, 3].includes(getScore(x, y)) : getScore(x, y) === 3)),
  ) as typeof grid;
};

export const typeOK = () => grid.length === n && grid.every((row) => row.length === n);
