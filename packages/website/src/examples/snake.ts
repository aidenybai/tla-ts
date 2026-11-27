type Direction = "up" | "down" | "left" | "right";

const SIZE = 5;
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const MOVES = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// The squares are numbered 0 to 24, row by row.
let head = 12;
let neck = 11;
let tail = 10;
let direction: Direction = "right";

export const turn = (next: Direction) => {
  if (next !== OPPOSITE[direction]) direction = next;
};

export const step = () => {
  const [moveX, moveY] = MOVES[direction];
  const x = ((head % SIZE) + moveX + SIZE) % SIZE;
  const y = (Math.floor(head / SIZE) + moveY + SIZE) % SIZE;
  tail = neck;
  neck = head;
  head = y * SIZE + x;
};

export const neverBitesItself = () => head !== neck && head !== tail;
