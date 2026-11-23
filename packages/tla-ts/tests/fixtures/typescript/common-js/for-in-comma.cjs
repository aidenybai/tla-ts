// A for-in runs the operands of a comma before the object that it iterates, as React's
// createElement does, where some run only as a short circuit lets them.
const notes = [];
let warned = false;
let key = null;
const note = (text) => {
  notes.push(text);
};
function create(config) {
  const props = {};
  let propName;
  for (propName in (warned || !("__self" in config) || ((warned = true), note("warn")),
  "key" in config && (key = "" + config.key),
  config))
    if (propName !== "key") props[propName] = config[propName];
  return props;
}
const first = create({ a: 1, key: 2, b: 3 });
const second = create({ __self: 1, c: 4 });
const seen = [
  Object.keys(first).join("+"),
  Object.keys(second).join("+"),
  key,
  warned,
  notes.join("+"),
].join();
if (seen !== "a+b,__self+c,2,true,warn") throw new Error("seen " + seen);
