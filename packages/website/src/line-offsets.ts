export const getLineOffsets = (lines: string[]) =>
  lines.reduce<number[]>(
    (offsets, line, index) => {
      offsets.push(offsets[index] + line.length + 1);
      return offsets;
    },
    [0],
  );
