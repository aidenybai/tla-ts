import { type Branch, mark } from "./marks";

const inner: Branch = { items: [2], marked: false };
const tree: Branch = { items: [1, inner], marked: false };
mark(tree);
if (!tree.marked || !inner.marked) throw new Error("marked");
