// Each list shares its tail, so adding to the front takes constant time.

export interface List<Item> {
  readonly head: Item;
  readonly tail: List<Item> | undefined;
}

export const cons = <Item>(head: Item, tail: List<Item> | undefined): List<Item> => ({
  head,
  tail,
});
