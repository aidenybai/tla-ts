declare function setTimeout(callback: () => void): void;
import * as ns from "./selfish";
export let b = 7;
const seen: unknown[] = [];
seen.push(ns.a, Object.keys(ns).join());
// A var's binding holds undefined until its declaration runs.
// oxlint-disable-next-line no-var
export var a = 1;
seen.push(ns.a);
a = 2;
const read = () => ns.a;
seen.push(read());
a += 3;
seen.push(read(), "a" in ns, ns.b);
b = 8;
const descriptor = Object.getOwnPropertyDescriptor(ns, "a");
seen.push(ns.b, Object.keys(ns).join(), descriptor?.value);
Promise.resolve().then(() => {
  seen.push(ns.a);
});
a = 9;
setTimeout(() => {
  if (seen.join() !== ",a,b,1,2,5,true,7,8,a,b,5,9") throw new Error(seen.join());
});
