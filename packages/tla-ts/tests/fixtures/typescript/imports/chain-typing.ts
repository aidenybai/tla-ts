import type { Chain } from "./chain";

interface Link {
  items: number[];
}
const link = { items: [1, 2] } as Chain | Link;
if (link.items.length !== 2) throw new Error("linked");
