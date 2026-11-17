let key = 0;
const internals = { thrown: [] };

export const keys = () => {
  const seen = [];
  const object = { a: 1, b: 2 };
  for (key in object) seen.push(key);
  internals.thrown.push("first");
  return [...seen, internals.thrown.length].join();
};
