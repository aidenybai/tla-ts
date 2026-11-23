// Iterates an object whose Symbol.iterator method another module writes.
import { makeIterable } from "./iterable-maker.ts";

const seen: number[] = [];
for (const value of makeIterable([1, 2, 3])) seen.push(value * 10);
const result = seen.join();
if (result !== "10,20,30") throw new Error("seen " + result);
