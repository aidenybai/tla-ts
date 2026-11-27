type Direction = "up" | "down" | "left" | "right";

const SIZE = 7;
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const MOVES = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// The squares are numbered row by row, and the snake's head comes first.
let snake = [23, 22, 21];
let apple = 26;
let direction: Direction = "right";

export const turn = (next: Direction) => {
  if (next !== OPPOSITE[direction]) direction = next;
};

export const step = () => {
  const [moveX, moveY] = MOVES[direction];
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
