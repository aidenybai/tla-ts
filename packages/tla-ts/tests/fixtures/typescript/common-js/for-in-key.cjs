// A for-in writes the keys that it iterates to a var that a later declaration types as an object.
// oxlint-disable no-var
function list(source) {
  var seen = [];
  for (name in source) seen.push(name + "=" + source[name]);
  var name = { kind: "children" };
  return seen.join("+") + ";" + name.kind;
}
const seen = list({ a: 1, b: 2 });
if (seen !== "a=1+b=2;children") throw new Error("seen " + seen);
