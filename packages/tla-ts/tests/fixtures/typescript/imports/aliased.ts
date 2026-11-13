export const getShared = () => {
  const first = { value: 1 };
  const second = first;
  second.value = 2;
  return first.value;
};
