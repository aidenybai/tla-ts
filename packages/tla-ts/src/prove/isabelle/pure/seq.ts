// Ported from Isabelle2025's Pure/General/seq.ML. Copyright (c) 1986-2025 University of
// Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Lazy sequences. As in Isabelle, pulling a sequence twice computes its head twice.

export type Cell<Item> = readonly [Item, Seq<Item>] | undefined;

export interface Seq<Item> {
  readonly pull: () => Cell<Item>;
}

export const makeSeq = <Item>(pull: () => Cell<Item>): Seq<Item> => ({ pull });

export const emptySeq: Seq<never> = makeSeq(() => undefined);

export const consSeq = <Item>(item: Item, rest: Seq<Item>): Seq<Item> =>
  makeSeq(() => [item, rest]);

export const singleSeq = <Item>(item: Item): Seq<Item> => consSeq(item, emptySeq);

export const ofCell = <Item>(cell: Cell<Item>): Seq<Item> => makeSeq(() => cell);

export const seqOfList = <Item>(items: readonly Item[]): Seq<Item> =>
  items.reduceRight<Seq<Item>>((rest, item) => consSeq(item, rest), emptySeq);

export const seqHead = <Item>(seq: Seq<Item>): Item | undefined => seq.pull()?.[0];

// Seq.chop: the first count elements and the rest of the sequence.
export const chopSeq = <Item>(count: number, seq: Seq<Item>): [Item[], Seq<Item>] => {
  const items: Item[] = [];
  let current = seq;
  while (items.length < count) {
    const cell = current.pull();
    if (cell === undefined) return [items, current];
    items.push(cell[0]);
    current = cell[1];
  }
  return [items, current];
};

export const listOfSeq = <Item>(seq: Seq<Item>): Item[] => {
  const items: Item[] = [];
  let cell = seq.pull();
  while (cell !== undefined) {
    items.push(cell[0]);
    cell = cell[1].pull();
  }
  return items;
};

export const appendSeq = <Item>(first: Seq<Item>, second: Seq<Item>): Seq<Item> => {
  const copy = (current: Seq<Item>): Seq<Item> =>
    makeSeq(() => {
      const cell = current.pull();
      return cell === undefined ? second.pull() : [cell[0], copy(cell[1])];
    });
  return copy(first);
};

export const mappSeq = <Item, Result>(
  map: (item: Item) => Result,
  first: Seq<Item>,
  second: Seq<Result>,
): Seq<Result> => {
  const copy = (current: Seq<Item>): Seq<Result> =>
    makeSeq(() => {
      const cell = current.pull();
      return cell === undefined ? second.pull() : [map(cell[0]), copy(cell[1])];
    });
  return copy(first);
};

export const interleaveSeq = <Item>(first: Seq<Item>, second: Seq<Item>): Seq<Item> =>
  makeSeq(() => {
    const cell = first.pull();
    return cell === undefined ? second.pull() : [cell[0], interleaveSeq(second, cell[1])];
  });

export const filterSeq = <Item>(predicate: (item: Item) => boolean, seq: Seq<Item>): Seq<Item> => {
  const copy = (current: Seq<Item>): Seq<Item> =>
    makeSeq(() => {
      let cell = current.pull();
      while (cell !== undefined && !predicate(cell[0])) cell = cell[1].pull();
      return cell === undefined ? undefined : [cell[0], copy(cell[1])];
    });
  return copy(seq);
};

export const flatSeq = <Item>(seqs: Seq<Seq<Item>>): Seq<Item> =>
  makeSeq(() => {
    const cell = seqs.pull();
    return cell === undefined ? undefined : appendSeq(cell[0], flatSeq(cell[1])).pull();
  });

export const mapSeq = <Item, Result>(map: (item: Item) => Result, seq: Seq<Item>): Seq<Result> =>
  makeSeq(() => {
    const cell = seq.pull();
    return cell === undefined ? undefined : [map(cell[0]), mapSeq(map, cell[1])];
  });

export const mapsSeq = <Item, Result>(
  map: (item: Item) => Seq<Result>,
  seq: Seq<Item>,
): Seq<Result> =>
  makeSeq(() => {
    const cell = seq.pull();
    return cell === undefined ? undefined : appendSeq(map(cell[0]), mapsSeq(map, cell[1])).pull();
  });

export const mapFilterSeq = <Item, Result>(
  map: (item: Item) => Result | undefined,
  seq: Seq<Item>,
): Seq<Result> =>
  mapsSeq((item) => {
    const result = map(item);
    return result === undefined ? emptySeq : singleSeq(result);
  }, seq);

// Seq.it_right: accumulates lazily from the right.
export const itRightSeq = <Item, Result>(
  combine: (item: Item, rest: Seq<Result>) => Seq<Result>,
  seq: Seq<Item>,
  tail: Seq<Result>,
): Seq<Result> => {
  const its = (current: Seq<Item>): Seq<Result> =>
    makeSeq(() => {
      const cell = current.pull();
      return cell === undefined ? tail.pull() : combine(cell[0], its(cell[1])).pull();
    });
  return its(seq);
};

export const takeSeq = <Item>(count: number, seq: Seq<Item>): Seq<Item> =>
  count <= 0
    ? emptySeq
    : makeSeq(() => {
        const cell = seq.pull();
        return cell === undefined ? undefined : [cell[0], takeSeq(count - 1, cell[1])];
      });
