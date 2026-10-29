// Ported from Isabelle2025's Pure/General/table.ML. Copyright (c) 1986-2025 University of
// Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Persistent tables ordered by a comparison function. Isabelle's tables are 2-3 trees; any
// balanced search tree visits keys in the same order, which is all that the ports rely on.

export type Compare<Key> = (left: Key, right: Key) => number;

type Node<Key, Value> =
  | undefined
  | {
      readonly key: Key;
      readonly value: Value;
      readonly left: Node<Key, Value>;
      readonly right: Node<Key, Value>;
      readonly height: number;
    };

export interface Table<Key, Value> {
  readonly compare: Compare<Key>;
  readonly root: Node<Key, Value>;
}

const getHeight = <Key, Value>(node: Node<Key, Value>) => (node ? node.height : 0);

const makeNode = <Key, Value>(
  key: Key,
  value: Value,
  left: Node<Key, Value>,
  right: Node<Key, Value>,
): Node<Key, Value> => ({
  key,
  value,
  left,
  right,
  height: Math.max(getHeight(left), getHeight(right)) + 1,
});

const balance = <Key, Value>(
  key: Key,
  value: Value,
  left: Node<Key, Value>,
  right: Node<Key, Value>,
): Node<Key, Value> => {
  const difference = getHeight(left) - getHeight(right);
  if (difference > 1 && left) {
    if (getHeight(left.left) >= getHeight(left.right))
      return makeNode(left.key, left.value, left.left, makeNode(key, value, left.right, right));
    const middle = left.right;
    if (!middle) return makeNode(key, value, left, right);
    return makeNode(
      middle.key,
      middle.value,
      makeNode(left.key, left.value, left.left, middle.left),
      makeNode(key, value, middle.right, right),
    );
  }
  if (difference < -1 && right) {
    if (getHeight(right.right) >= getHeight(right.left))
      return makeNode(right.key, right.value, makeNode(key, value, left, right.left), right.right);
    const middle = right.left;
    if (!middle) return makeNode(key, value, left, right);
    return makeNode(
      middle.key,
      middle.value,
      makeNode(key, value, left, middle.left),
      makeNode(right.key, right.value, middle.right, right.right),
    );
  }
  return makeNode(key, value, left, right);
};

export const emptyTable = <Key, Value>(compare: Compare<Key>): Table<Key, Value> => ({
  compare,
  root: undefined,
});

export const isEmptyTable = <Key, Value>(table: Table<Key, Value>) => table.root === undefined;

export const lookupTable = <Key, Value>(table: Table<Key, Value>, key: Key): Value | undefined => {
  let node = table.root;
  while (node) {
    const order = table.compare(key, node.key);
    if (order === 0) return node.value;
    node = order < 0 ? node.left : node.right;
  }
  return undefined;
};

export const hasKey = <Key, Value>(table: Table<Key, Value>, key: Key) => {
  let node = table.root;
  while (node) {
    const order = table.compare(key, node.key);
    if (order === 0) return true;
    node = order < 0 ? node.left : node.right;
  }
  return false;
};

export const updateTable = <Key, Value>(
  table: Table<Key, Value>,
  key: Key,
  value: Value,
): Table<Key, Value> => {
  const insert = (node: Node<Key, Value>): Node<Key, Value> => {
    if (!node) return makeNode(key, value, undefined, undefined);
    const order = table.compare(key, node.key);
    if (order === 0) return makeNode(key, value, node.left, node.right);
    return order < 0
      ? balance(node.key, node.value, insert(node.left), node.right)
      : balance(node.key, node.value, node.left, insert(node.right));
  };
  return { compare: table.compare, root: insert(table.root) };
};

const removeMin = <Key, Value>(
  node: NonNullable<Node<Key, Value>>,
): [NonNullable<Node<Key, Value>>, Node<Key, Value>] => {
  if (!node.left) return [node, node.right];
  const [minimum, left] = removeMin(node.left);
  return [minimum, balance(node.key, node.value, left, node.right)];
};

export const deleteTable = <Key, Value>(table: Table<Key, Value>, key: Key): Table<Key, Value> => {
  const remove = (node: Node<Key, Value>): Node<Key, Value> => {
    if (!node) return undefined;
    const order = table.compare(key, node.key);
    if (order < 0) return balance(node.key, node.value, remove(node.left), node.right);
    if (order > 0) return balance(node.key, node.value, node.left, remove(node.right));
    if (!node.right) return node.left;
    const [minimum, right] = removeMin(node.right);
    return balance(minimum.key, minimum.value, node.left, right);
  };
  return { compare: table.compare, root: remove(table.root) };
};

export const minTable = <Key, Value>(table: Table<Key, Value>): [Key, Value] | undefined => {
  let node = table.root;
  if (!node) return undefined;
  while (node.left) node = node.left;
  return [node.key, node.value];
};

// The entries in key order, as Table.fold and Table.dest visit them.
export const tableEntries = <Key, Value>(table: Table<Key, Value>): [Key, Value][] => {
  const entries: [Key, Value][] = [];
  const visit = (node: Node<Key, Value>) => {
    if (!node) return;
    visit(node.left);
    entries.push([node.key, node.value]);
    visit(node.right);
  };
  visit(table.root);
  return entries;
};

export const tableSize = <Key, Value>(table: Table<Key, Value>): number => {
  const count = (node: Node<Key, Value>): number =>
    node ? 1 + count(node.left) + count(node.right) : 0;
  return count(table.root);
};

// fast_string_ord: shorter strings first, then by code units.
export const fastStringOrd = (left: string, right: string) =>
  left === right
    ? 0
    : left.length !== right.length
      ? left.length - right.length
      : left < right
        ? -1
        : 1;

export const stringOrd = (left: string, right: string) =>
  left === right ? 0 : left < right ? -1 : 1;

export interface IndexKey {
  readonly name: string;
  readonly index: number;
}

// Term_Ord.fast_indexname_ord: by index, then by fast_string_ord on the name.
export const fastIndexnameOrd = (left: IndexKey, right: IndexKey) =>
  left.index !== right.index ? left.index - right.index : fastStringOrd(left.name, right.name);

// Term_Ord.indexname_ord: by index, then by string_ord on the name.
export const indexnameOrd = (left: IndexKey, right: IndexKey) =>
  left.index !== right.index ? left.index - right.index : stringOrd(left.name, right.name);
