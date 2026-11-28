type Direction = "up" | "down" | "left" | "right";

// # is a wall and o is the heart, which the walls are meant to close in.
const MAP = [".......", ".......", "..#.#..", "..#o#..", "..###..", ".......", "......."];
const MOVES = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let x = 0;
let y = 6;

export const move = (direction: Direction) => {
  const [moveX, moveY] = MOVES[direction];
  const square = MAP[y + moveY]?.[x + moveX];
  if (square === undefined || square === "#") return;
  x += moveX;
  y += moveY;
};

export const heartIsSafe = () => MAP[y][x] !== "o";
