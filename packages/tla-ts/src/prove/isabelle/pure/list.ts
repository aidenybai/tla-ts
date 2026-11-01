// ML's lists: each shares its tail, so that adding to the front takes constant time and keeps the
// rest of the list alive only through the new cell.

export interface List<Item> {
  readonly head: Item;
  readonly tail: List<Item> | undefined;
}

export const cons = <Item>(head: Item, tail: List<Item> | undefined): List<Item> => ({
  head,
  tail,
});
