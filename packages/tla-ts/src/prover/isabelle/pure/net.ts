// Ported from Isabelle2025's Pure/net.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import type { List } from "./list";
import { boundName } from "./name";
import {
  emptyTable,
  fastStringOrd,
  foldTable,
  lookupTable,
  updateTable,
  type Table,
} from "./table";
import { headOf, type Term } from "./term";

type NetKey =
  | { readonly kind: "Comb" }
  | { readonly kind: "Var" }
  | { readonly kind: "Atom"; readonly name: string };

const combKey: NetKey = { kind: "Comb" };
const varKey: NetKey = { kind: "Var" };

export type Net<Item> =
  | { readonly kind: "Leaf"; readonly items: readonly Item[] }
  | {
      readonly kind: "Net";
      readonly comb: Net<Item>;
      readonly var: Net<Item>;
      readonly atoms: Table<string, Net<Item>>;
    };

export const emptyNet: Net<never> = { kind: "Leaf", items: [] };

const makeNode = <Item>(): Extract<Net<Item>, { kind: "Net" }> => ({
  kind: "Net",
  comb: emptyNet,
  var: emptyNet,
  atoms: emptyTable(fastStringOrd),
});

export const keyOfTerm = (term: Term): NetKey[] => {
  const keys: NetKey[] = [];
  const add = (current: Term) => {
    const head = headOf(current);
    if (head.kind === "Var" || head.kind === "Abs") {
      keys.push(varKey);
      return;
    }
    const rands = (inner: Term) => {
      if (inner.kind === "App") {
        keys.push(combKey);
        rands(inner.fun);
        add(inner.arg);
        return;
      }
      if (inner.kind === "Const" || inner.kind === "Free")
        keys.push({ kind: "Atom", name: inner.name });
      else if (inner.kind === "Bound") keys.push({ kind: "Atom", name: boundName(inner.index) });
    };
    rands(current);
  };
  add(term);
  return keys;
};

export const insertNet = <Item>(
  isEqual: (left: Item, right: Item) => boolean,
  keys: readonly NetKey[],
  item: Item,
  net: Net<Item>,
): Net<Item> | undefined => {
  const path: Extract<Net<Item>, { kind: "Net" }>[] = [];
  const leaf = keys.reduce((node, key) => {
    const expanded = node.kind === "Net" ? node : makeNode<Item>();
    path.push(expanded);
    return key.kind === "Comb"
      ? expanded.comb
      : key.kind === "Var"
        ? expanded.var
        : (lookupTable(expanded.atoms, key.name) ?? emptyNet);
  }, net);
  const items = leaf.kind === "Leaf" ? leaf.items : [];
  if (items.some((other) => isEqual(other, item))) return undefined;
  return path.reduceRight<Net<Item>>(
    (child, expanded, position) => {
      const key = keys[position];
      return key.kind === "Comb"
        ? { ...expanded, comb: child }
        : key.kind === "Var"
          ? { ...expanded, var: child }
          : { ...expanded, atoms: updateTable(expanded.atoms, key.name, child) };
    },
    { kind: "Leaf", items: [item, ...items] },
  );
};

export const insertTermNet = <Item>(term: Term, item: Item, net: Net<Item>) =>
  insertNet(() => false, keyOfTerm(term), item, net) ?? net;

type Nets<Item> = List<Net<Item>> | undefined;

const toArray = <Item>(nets: Nets<Item>) => {
  const array: Net<Item>[] = [];
  for (let current = nets; current !== undefined; current = current.tail) array.push(current.head);
  return array;
};

const netSkip = <Item>(net: Net<Item>, nets: Nets<Item>): Nets<Item> => {
  if (net.kind === "Leaf") return nets;
  const children = toArray(netSkip(net.comb, undefined));
  let result = foldTable<string, Net<Item>, Nets<Item>>(
    (_name, child, tail) => ({ head: child, tail }),
    net.atoms,
    { head: net.var, tail: nets },
  );
  for (let index = children.length - 1; index >= 0; index -= 1)
    result = netSkip(children[index], result);
  return result;
};

const look1 = <Item>(atoms: Table<string, Net<Item>>, name: string, nets: Nets<Item>) => {
  const net = lookupTable(atoms, name);
  return net === undefined ? nets : { head: net, tail: nets };
};

const rands = <Item>(isUnif: boolean, term: Term, net: Net<Item>, nets: Nets<Item>): Nets<Item> => {
  if (net.kind === "Leaf") return nets;
  if (term.kind === "App") {
    const children = toArray(rands(isUnif, term.fun, net.comb, undefined));
    let result = nets;
    for (let index = children.length - 1; index >= 0; index -= 1)
      result = matching(isUnif, term.arg, children[index], result);
    return result;
  }
  if (term.kind === "Const" || term.kind === "Free") return look1(net.atoms, term.name, nets);
  if (term.kind === "Bound") return look1(net.atoms, boundName(term.index), nets);
  return nets;
};

const matching = <Item>(isUnif: boolean, term: Term, net: Net<Item>, nets: Nets<Item>) => {
  if (net.kind === "Leaf") return nets;
  const head = headOf(term);
  if (head.kind === "Var" || head.kind === "Abs")
    return isUnif ? netSkip(net, nets) : { head: net.var, tail: nets };
  return rands(isUnif, term, net, { head: net.var, tail: nets });
};

const extractLeaves = <Item>(nets: Nets<Item>) => {
  const items: Item[] = [];
  for (let current = nets; current !== undefined; current = current.tail)
    if (current.head.kind === "Leaf") for (const item of current.head.items) items.push(item);
  return items;
};

export const matchTermNet = <Item>(net: Net<Item>, term: Term) =>
  extractLeaves(matching(false, term, net, undefined));

export const unifyTermNet = <Item>(net: Net<Item>, term: Term) =>
  extractLeaves(matching(true, term, net, undefined));
