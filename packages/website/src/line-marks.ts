import type { Mark } from "./site-data";

const NO_MARKS: Mark[] = [];

// Gives each line only the marks on it, measured from the line's start, so a line whose marks
// did not change keeps the same array and skips its render.
export const getLineMarks = (lines: string[], marks: Mark[]) => {
  let offset = 0;
  return lines.map((line) => {
    const start = offset;
    offset += line.length + 1;
    const lineMarks = marks
      .filter((mark) => mark.start < start + line.length && mark.end > start)
      .map((mark) => ({ name: mark.name, start: mark.start - start, end: mark.end - start }));
    return lineMarks.length > 0 ? lineMarks : NO_MARKS;
  });
};
