import * as Combiner from "./namespace-maker";

const box = { seen: "" };
const sum = Combiner.make<number>((self, that) => self + that, 0);
const product = Combiner.make<number>((self, that) => self * that, 1);
const total = sum.combine(sum.initialValue, 5);
const scaled = product.combine(product.initialValue, 7);
box.seen = [total, scaled].join();
if (box.seen !== "5,7") throw new Error("seen " + box.seen);
