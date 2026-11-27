// The eight ways to move, clockwise from up.
const DIRECTIONS = [
  "up",
  "upRight",
  "right",
  "downRight",
  "down",
  "downLeft",
  "left",
  "upLeft",
] as const;
const MOVES = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];
const SIZE = 7;

type Direction = (typeof DIRECTIONS)[number];

// The squares are numbered row by row, and the snake's head comes first.
let snake = [23, 22, 21];
let apple = 26;
let direction: Direction = "right";

export const turn = (next: Direction) => {
  const opposite = DIRECTIONS[(DIRECTIONS.indexOf(direction) + 4) % 8];
  if (next !== opposite) direction = next;
};

export const step = () => {
  const [moveX, moveY] = MOVES[DIRECTIONS.indexOf(direction)];
  const x = ((snake[0] % SIZE) + moveX + SIZE) % SIZE;
  const y = (Math.floor(snake[0] / SIZE) + moveY + SIZE) % SIZE;
  const head = y * SIZE + x;
  if (head === apple) {
    snake = [head, ...snake];
    apple = (apple * 5 + 3) % (SIZE * SIZE);
  } else {
    snake = [head, ...snake.slice(0, -1)];
  }
};

export const neverBitesItself = () => !snake.slice(1).includes(snake[0]);
