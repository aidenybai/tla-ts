export interface Branch {
  items: (number | Branch)[];
  marked: boolean;
}

export const mark = (value: number | Branch): void => {
  if (typeof value === "number") return;
  value.marked = true;
  value.items.forEach((item) => mark(item));
};
