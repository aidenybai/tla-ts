// Array.prototype.sort copies its array before sorting, which makes most of the garbage of short
// clauses and disjunctions. Insertion sort is stable like it and sorts a short array in place, so
// both give the same order.
const MAX_INSERTION_SORT_LENGTH = 16;

export const sortByKey = (values: number[], getKey: (value: number) => number) => {
  if (values.length > MAX_INSERTION_SORT_LENGTH) {
    values.sort((first, second) => getKey(first) - getKey(second));
    return;
  }
  for (let index = 1; index < values.length; index++) {
    const value = values[index];
    const key = getKey(value);
    let position = index;
    for (; position > 0 && getKey(values[position - 1]) > key; position--)
      values[position] = values[position - 1];
    values[position] = value;
  }
};
