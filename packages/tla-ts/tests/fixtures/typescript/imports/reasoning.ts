import { AXIOM, Item } from "./reasons";

const first = new Item(1);
const second = new Item(2);
if (first.why !== AXIOM || second.why !== first.why) throw new Error("shared");
