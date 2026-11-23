export const box = (size: number) => ({ size });

export const counting = (start: number) => {
  const counter = { count: start };
  return (by: number) => {
    counter.count += by;
    return counter.count;
  };
};
