type Direction = "up" | "down" | "left" | "right";

// # is a wall and o is the heart, which the walls close in.
const MAP = [".......", ".......", "..###..", "..#o#..", "..###..", ".......", "......."];
const MOVES = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let x = 0;
let y = 6;

const go = (direction: Direction, squares: number) => {
  const [moveX, moveY] = MOVES[direction];
  const nextX = x + moveX * squares;
  const nextY = y + moveY * squares;
  const square = MAP[nextY]?.[nextX];
  if (square === undefined || square === "#") return;
  x = nextX;
  y = nextY;
};

export const move = (direction: Direction) => go(direction, 1);

// A dash covers two squares at once.
export const dash = (direction: Direction) => go(direction, 2);

// The rule TLA-ts checks after every move: nobody stands on the heart.
export const heartIsSafe = () => MAP[y][x] !== "o";
