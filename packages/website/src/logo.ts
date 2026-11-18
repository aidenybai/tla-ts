const LOGO_ROWS = [
  "....X....",
  "....X....",
  "....X..XX",
  "...XXXX..",
  "XXX.X....",
  "....X....",
  "....X....",
  "....X...X",
  "....XXXXX",
];

const LEFT_ARM_ROW = 4;
const RIGHT_ARM_ROW = 2;
const STEM_COLUMN = 4;
const TOE_ROW = 7;

const getPath = (isPart: (x: number, y: number) => boolean) =>
  LOGO_ROWS.flatMap((row, y) =>
    [...row].flatMap((cell, x) => (cell === "X" && isPart(x, y) ? [`M${x} ${y}h1v1h-1z`] : [])),
  ).join("");

const isLeftArm = (x: number, y: number) => y === LEFT_ARM_ROW && x < STEM_COLUMN;
const isRightArm = (x: number, y: number) => y === RIGHT_ARM_ROW && x > STEM_COLUMN;
const isToe = (x: number, y: number) => y === TOE_ROW && x > STEM_COLUMN;

export const LOGO_PATH = getPath(() => true);

// The same pixels in four pieces, so the arms and the toe can move apart from the body.
export const LOGO_PARTS = {
  body: getPath((x, y) => !isLeftArm(x, y) && !isRightArm(x, y) && !isToe(x, y)),
  leftArm: getPath(isLeftArm),
  rightArm: getPath(isRightArm),
  toe: getPath(isToe),
};
