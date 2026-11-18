export const isPositive = (value: 1 | 2): boolean => value > 0;

export const isSmall = (value: 1 | 2): boolean => {
  if (value > 1) throw new Error("big " + value);
  return true;
};
