// Array.prototype.sort copies its array before sorting, which makes most of the garbage of short
// clauses and disjunctions. Insertion sort is stable like it and sorts a short array in place, so
// both give the same order.
const MAX_INSERTION_SORT_LENGTH = 16;

// A function of its own, since a closure that captures keys would make sortByKeys allocate a context
// on every call.
const sortLongByKeys = (values: number[], keys: ArrayLike<number>) =>
  values.sort((first, second) => keys[first] - keys[second]);

// Sorts the values by their keys, keys[value].
export const sortByKeys = (values: number[], keys: ArrayLike<number>) => {
  if (values.length > MAX_INSERTION_SORT_LENGTH) {
    sortLongByKeys(values, keys);
    return;
  }
  for (let index = 1; index < values.length; index++) {
    const value = values[index];
    const key = keys[value];
    let position = index;
    for (; position > 0 && keys[values[position - 1]] > key; position--)
      values[position] = values[position - 1];
    values[position] = value;
  }
};

// std::sort of literals: sortByKeys with the number as its key, which a call site of its own keeps
// cheap.
export const sortNumbers = (values: number[]) => {
  if (values.length > MAX_INSERTION_SORT_LENGTH) {
    values.sort((first, second) => first - second);
    return;
  }
  for (let index = 1; index < values.length; index++) {
    const value = values[index];
    let position = index;
    for (; position > 0 && values[position - 1] > value; position--)
      values[position] = values[position - 1];
    values[position] = value;
  }
};
