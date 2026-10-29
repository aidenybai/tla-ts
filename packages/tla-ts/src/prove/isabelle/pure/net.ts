// Ported from Isabelle2025's Pure/net.ML, discrimination nets. Copyright (c) 1986-2025 University
// of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { boundName } from "./name";
import {
  emptyTable,
  fastStringOrd,
  isEmptyTable,
  lookupTable,
  tableEntries,
  updateTable,
  deleteTable,
  type Table,
} from "./table";
import { headOf, type Term } from "./term";

export type NetKey =
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

const isEmptyNet = <Item>(net: Net<Item>) => net.kind === "Leaf" && net.items.length === 0;

const makeNode = <Item>(): Extract<Net<Item>, { kind: "Net" }> => ({
  kind: "Net",
  comb: emptyNet,
  var: emptyNet,
  atoms: emptyTable(fastStringOrd),
});

// Net.key_of_term: preorder keys, with any term headed by a variable or an abstraction as a Var.
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

// Net.insert: raises nothing on a duplicate here; insert_safe semantics with eq. It walks down
// the keys and rebuilds the path bottom-up, so a long key list can't exhaust the stack.
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

export const insertTermSafe = <Item>(
  isEqual: (left: Item, right: Item) => boolean,
  term: Term,
  item: Item,
  net: Net<Item>,
) => insertNet(isEqual, keyOfTerm(term), item, net) ?? net;

const newNet = <Item>(node: Extract<Net<Item>, { kind: "Net" }>): Net<Item> =>
  isEmptyNet(node.comb) && isEmptyNet(node.var) && isEmptyTable(node.atoms) ? emptyNet : node;

// Net.delete: undefined where Isabelle raises DELETE.
export const deleteNet = <Item>(
  isEqual: (left: Item, right: Item) => boolean,
  keys: readonly NetKey[],
  item: Item,
  net: Net<Item>,
): Net<Item> | undefined => {
  const del = (position: number, node: Net<Item>): Net<Item> | undefined => {
    if (node.kind === "Leaf") {
      if (position < keys.length) return undefined;
      const index = node.items.findIndex((other) => isEqual(other, item));
      if (index === -1) return undefined;
      return { kind: "Leaf", items: node.items.filter((other) => !isEqual(other, item)) };
    }
    if (position === keys.length) return undefined;
    const key = keys[position];
    if (key.kind === "Comb") {
      const comb = del(position + 1, node.comb);
      return comb && newNet({ ...node, comb });
    }
    if (key.kind === "Var") {
      const child = del(position + 1, node.var);
      return child && newNet({ ...node, var: child });
    }
    const existing = lookupTable(node.atoms, key.name);
    if (existing === undefined) return undefined;
    const child = del(position + 1, existing);
    if (child === undefined) return undefined;
    return newNet({
      ...node,
      atoms: isEmptyNet(child)
        ? deleteTable(node.atoms, key.name)
        : updateTable(node.atoms, key.name, child),
    });
  };
  return del(0, net);
};

export const deleteTermSafe = <Item>(
  isEqual: (left: Item, right: Item) => boolean,
  term: Term,
  item: Item,
  net: Net<Item>,
) => deleteNet(isEqual, keyOfTerm(term), item, net) ?? net;

const netSkip = <Item>(net: Net<Item>, nets: Net<Item>[]): Net<Item>[] => {
  if (net.kind === "Leaf") return nets;
  const base = tableEntries(net.atoms).reduce<Net<Item>[]>(
    (result, entry) => [entry[1], ...result],
    [net.var, ...nets],
  );
  return netSkip(net.comb, []).reduceRight((result, child) => netSkip(child, result), base);
};

const look1 = <Item>(atoms: Table<string, Net<Item>>, name: string, nets: Net<Item>[]) => {
  const net = lookupTable(atoms, name);
  return net === undefined ? nets : [net, ...nets];
};

const matching = <Item>(
  isUnif: boolean,
  term: Term,
  net: Net<Item>,
  nets: Net<Item>[],
): Net<Item>[] => {
  const rands = (current: Term, node: Net<Item>, result: Net<Item>[]): Net<Item>[] => {
    if (node.kind === "Leaf") return result;
    if (current.kind === "App")
      return rands(current.fun, node.comb, []).reduceRight(
        (accumulated, child) => matching(isUnif, current.arg, child, accumulated),
        result,
      );
    if (current.kind === "Const" || current.kind === "Free")
      return look1(node.atoms, current.name, result);
    if (current.kind === "Bound") return look1(node.atoms, boundName(current.index), result);
    return result;
  };
  if (net.kind === "Leaf") return nets;
  const head = headOf(term);
  if (head.kind === "Var" || head.kind === "Abs")
    return isUnif ? netSkip(net, nets) : [net.var, ...nets];
  return rands(term, net, [net.var, ...nets]);
};

const extractLeaves = <Item>(nets: readonly Net<Item>[]) =>
  nets.flatMap((net) => (net.kind === "Leaf" ? net.items : []));

export const matchTermNet = <Item>(net: Net<Item>, term: Term) =>
  extractLeaves(matching(false, term, net, []));

export const unifyTermNet = <Item>(net: Net<Item>, term: Term) =>
  extractLeaves(matching(true, term, net, []));

// Net.content: every item, by the order of Net.dest.
export const netContent = <Item>(net: Net<Item>): Item[] => {
  if (net.kind === "Leaf") return [...net.items];
  return [
    ...netContent(net.comb),
    ...netContent(net.var),
    ...tableEntries(net.atoms).flatMap((entry) => netContent(entry[1])),
  ];
};

// Net.subtract: the items of second that are not in first.
export const subtractNet = <Item>(
  isEqual: (left: Item, right: Item) => boolean,
  first: Net<Item>,
  second: Net<Item>,
) => {
  const subtr = (left: Net<Item>, right: Net<Item>, result: Item[]): Item[] => {
    if (right.kind === "Leaf") {
      if (left.kind === "Net") return [...right.items, ...result];
      return right.items.reduceRight(
        (accumulated, item) =>
          left.items.some((other) => isEqual(other, item)) ? accumulated : [item, ...accumulated],
        result,
      );
    }
    if (left.kind === "Leaf") return subtr(makeNode(), right, result);
    const afterComb = subtr(left.comb, right.comb, result);
    const afterVar = subtr(left.var, right.var, afterComb);
    return tableEntries(right.atoms).reduce(
      (accumulated, entry) =>
        subtr(lookupTable(left.atoms, entry[0]) ?? makeNode(), entry[1], accumulated),
      afterVar,
    );
  };
  return subtr(first, second, []);
};

export const netEntries = <Item>(net: Net<Item>) => subtractNet(() => false, emptyNet, net);
