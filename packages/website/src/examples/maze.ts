const SIZE = 5;
const WALLS = ["3,0", "4,1", "1,1", "1,2", "3,3", "2,3"];

let x = 0;
let y = 4;

const move = (nextX: number, nextY: number) => {
  if (WALLS.includes(`${nextX},${nextY}`)) return;
  x = nextX;
  y = nextY;
};

export const up = () => move(x, Math.max(y - 1, 0));
export const down = () => move(x, Math.min(y + 1, SIZE - 1));
export const right = () => move(Math.min(x + 1, SIZE - 1), y);
export const left = () => move((x + SIZE - 1) % SIZE, y);

export const goldIsSafe = () => !(x === 4 && y === 0);
