// Ported from Zenon's node.ml, heap.ml and mlproof.ml, as shipped in tlapm. Copyright 2001-2004
// INRIA, see LICENSE.
//
// Tableau nodes and the queue that orders them. The search keeps the queue of every open branch,
// so the queue is persistent: inserting or removing returns a new queue and shares the rest.

import type { Expr } from "./expr";
import type { Definition } from "./parse";

// A rule application, as in Zenon's Mlproof.rule. `symbol` names a relation, or the extension
// rule for "ext". `definition` is the definition that "definition" unfolds.
export interface Rule {
  name: string;
  symbol: string;
  args: Expr[];
  definition?: Definition;
}

export type Priority = "prop" | "arity" | "arity_eq" | { instance: Expr };

export interface Node {
  conclusions: Expr[];
  rule: Rule;
  priority: Priority;
  goalness: number;
  branches: Expr[][];
}

// A proof of the formulas in `conclusions`: the node's rule applied to `uses`, with a subproof for
// each of its branches.
export interface Proof {
  conclusions: Expr[];
  rule: Rule;
  uses: Expr[];
  subproofs: Proof[];
}

export const makeRule = (name: string, args: Expr[], symbol = ""): Rule => ({
  name,
  symbol,
  args,
});

export interface Cons<Item> {
  head: Item;
  tail: Cons<Item> | undefined;
}

type List<Item> = Cons<Item> | undefined;

const cons = <Item>(head: Item, tail: List<Item>): Cons<Item> => ({ head, tail });

const reverse = <Item>(list: List<Item>) => {
  let result: List<Item> = undefined;
  for (let cell = list; cell !== undefined; cell = cell.tail) result = cons(cell.head, result);
  return result;
};

interface Tree {
  node: Node;
  left: Tree | undefined;
  right: Tree | undefined;
}

// Zenon's Heap: a persistent binary heap that alternates insertion paths.
interface Heap {
  tree: Tree | undefined;
  path: number;
}

const META_WEIGHT = 5;
const TAU_DIVISOR = 8;

const getInstanceSize = (node: Node) => {
  const term = node.rule.args[1];
  return term.size + term.metas.length * META_WEIGHT + Math.floor(term.taus / TAU_DIVISOR);
};

const compareNodes = (left: Node, right: Node) => getInstanceSize(left) - getInstanceSize(right);

const insertTree = (tree: Tree | undefined, node: Node, path: number): Tree => {
  if (tree === undefined) return { node, left: undefined, right: undefined };
  const isSmaller = compareNodes(node, tree.node) < 0;
  const here = isSmaller ? node : tree.node;
  const next = isSmaller ? tree.node : node;
  const nextPath = Math.floor(path / 2);
  return path % 2 === 0
    ? { node: here, left: insertTree(tree.left, next, nextPath), right: tree.right }
    : { node: here, left: tree.left, right: insertTree(tree.right, next, nextPath) };
};

const insertHeap = (heap: Heap, node: Node): Heap => ({
  tree: insertTree(heap.tree, node, heap.path),
  path: heap.path + 1,
});

const removeTree = (tree: Tree): [Node, Tree | undefined] => {
  if (tree.left === undefined) return [tree.node, tree.right];
  if (tree.right === undefined) return [tree.node, tree.left];
  const isLeftFirst = compareNodes(tree.left.node, tree.right.node) < 0;
  const first = isLeftFirst ? tree.left : tree.right;
  const second = isLeftFirst ? tree.right : tree.left;
  const removed = removeTree(first);
  return [tree.node, { node: removed[0], left: removed[1], right: second }];
};

const removeHeap = (heap: Heap): [Node, Heap] | undefined => {
  if (heap.tree === undefined) return undefined;
  const removed = removeTree(heap.tree);
  return [removed[0], { tree: removed[1], path: heap.path }];
};

export interface Queue {
  prop1: List<Node>;
  prop2: List<Node>;
  unary: List<Node>;
  binary: List<Node>;
  nary: List<Node>;
  eqFront: List<Node>;
  eqBack: List<Node>;
  eqCount: number;
  instState: number;
  instSize: List<[number, Heap]>;
  instFront: List<Node>;
  instBack: List<Node>;
  // The nodes inserted since the root. Removed nodes still count, because the queues of the
  // branches above keep them.
  insertedCount: number;
}

const SMALL_INSTANCES = 16;
const OLD_INSTANCES = 2;
const MAX_INSTANCES = SMALL_INSTANCES + OLD_INSTANCES;
const EQUALITY_COUNT = 10;

export const EMPTY_QUEUE: Queue = {
  prop1: undefined,
  prop2: undefined,
  unary: undefined,
  binary: undefined,
  nary: undefined,
  eqFront: undefined,
  eqBack: undefined,
  eqCount: EQUALITY_COUNT,
  instState: 0,
  instSize: undefined,
  instFront: undefined,
  instBack: undefined,
  insertedCount: 0,
};

const insertByGoalness = (list: List<[number, Heap]>, node: Node): List<[number, Heap]> => {
  const goalness = node.goalness;
  let heap: Heap = { tree: undefined, path: 0 };
  for (let cell = list; cell !== undefined; cell = cell.tail)
    if (cell.head[0] === goalness) {
      heap = cell.head[1];
      break;
    }
  const entry: [number, Heap] = [goalness, insertHeap(heap, node)];
  const insert = (rest: List<[number, Heap]>): Cons<[number, Heap]> => {
    if (rest === undefined) return cons(entry, undefined);
    if (rest.head[0] === goalness) return cons(entry, rest.tail);
    if (rest.head[0] > goalness) return cons(entry, rest);
    return cons(rest.head, insert(rest.tail));
  };
  return insert(list);
};

const canInstantiate = (meta: Expr, expression: Expr): boolean => {
  switch (expression.kind) {
    case "var":
    case "true":
    case "false":
      return true;
    case "meta":
      return !expression.args[0].metas.includes(meta);
    case "all":
    case "ex":
    case "tau":
    case "lam":
      return canInstantiate(meta, expression.args[1]);
    default:
      return expression.args.every((inner) => canInstantiate(meta, inner));
  }
};

export const insertNode = (previous: Queue, node: Node): Queue => {
  const queue = { ...previous, insertedCount: previous.insertedCount + 1 };
  const priority = node.priority;
  if (priority === "prop")
    return node.branches.length < 2
      ? { ...queue, prop1: cons(node, queue.prop1) }
      : { ...queue, prop2: cons(node, queue.prop2) };
  if (priority === "arity") {
    const count = node.branches.length;
    if (count === 0) return { ...queue, prop1: cons(node, queue.prop1) };
    if (count === 1) return { ...queue, unary: cons(node, queue.unary) };
    if (count === 2) return { ...queue, binary: cons(node, queue.binary) };
    return { ...queue, nary: cons(node, queue.nary) };
  }
  if (priority === "arity_eq") return { ...queue, eqBack: cons(node, queue.eqBack) };
  const rule = node.rule;
  const quantified =
    rule.name === "all"
      ? rule.args[0]
      : rule.name === "not_ex" && rule.args[0].kind === "not"
        ? rule.args[0].args[0]
        : undefined;
  if (quantified !== undefined && canInstantiate(quantified, rule.args[1]))
    return {
      ...queue,
      instBack: cons(node, queue.instBack),
      instSize: insertByGoalness(queue.instSize, node),
    };
  return { ...queue, instBack: cons(node, queue.instBack) };
};

const removeAt = (
  goalness: number,
  list: List<[number, Heap]>,
): [Node, List<[number, Heap]>] | undefined => {
  if (list === undefined) return undefined;
  if (list.head[0] < goalness) {
    const removed = removeAt(goalness, list.tail);
    return removed && [removed[0], cons(list.head, removed[1])];
  }
  const removed = removeHeap(list.head[1]);
  if (removed === undefined) return removeAt(goalness, list.tail);
  return [removed[0], cons([list.head[0], removed[1]], list.tail)];
};

// On even states, the smallest instance of the most goal-directed formulas; on odd states, the
// smallest instance overall.
const removeByGoalness = (state: number, list: List<[number, Heap]>) => {
  if (state % 2 === 0) return removeAt(0, list);
  let best = 0;
  let bestNode: Node | undefined = undefined;
  for (let cell = list; cell !== undefined; cell = cell.tail) {
    const head = cell.head[1].tree?.node;
    const isBetter =
      head !== undefined && (bestNode === undefined || compareNodes(head, bestNode) < 0);
    if (isBetter) {
      best = cell.head[0];
      bestNode = head;
    }
  }
  return removeAt(best, list);
};

const isEmptySizes = (list: List<[number, Heap]>) => {
  for (let cell = list; cell !== undefined; cell = cell.tail)
    if (cell.head[1].tree !== undefined) return false;
  return true;
};

const removeEquality = (queue: Queue): [Node, Queue] | undefined => {
  if (queue.eqFront !== undefined)
    return [queue.eqFront.head, { ...queue, eqFront: queue.eqFront.tail }];
  if (queue.eqBack === undefined) return undefined;
  const front = reverse(queue.eqBack);
  return front && [front.head, { ...queue, eqFront: front.tail, eqBack: undefined }];
};

const removeInstance = (queue: Queue): [Node, Queue] | undefined => {
  if (queue.instState < SMALL_INSTANCES) {
    const removed = removeByGoalness(queue.instState, queue.instSize);
    if (removed !== undefined)
      return [removed[0], { ...queue, instState: queue.instState + 1, instSize: removed[1] }];
    return removeInstance({ ...queue, instState: SMALL_INSTANCES });
  }
  if (queue.instFront !== undefined)
    return [
      queue.instFront.head,
      {
        ...queue,
        instFront: queue.instFront.tail,
        instState: (queue.instState + 1) % MAX_INSTANCES,
      },
    ];
  if (queue.instBack === undefined)
    return isEmptySizes(queue.instSize) ? undefined : removeInstance({ ...queue, instState: 0 });
  return removeInstance({ ...queue, instFront: reverse(queue.instBack), instBack: undefined });
};

export const removeNode = (queue: Queue): [Node, Queue] | undefined => {
  if (queue.prop1 !== undefined) return [queue.prop1.head, { ...queue, prop1: queue.prop1.tail }];
  if (queue.prop2 !== undefined) return [queue.prop2.head, { ...queue, prop2: queue.prop2.tail }];
  if (queue.unary !== undefined) return [queue.unary.head, { ...queue, unary: queue.unary.tail }];
  if (queue.binary !== undefined)
    return [queue.binary.head, { ...queue, binary: queue.binary.tail }];
  if (queue.nary !== undefined) return [queue.nary.head, { ...queue, nary: queue.nary.tail }];
  if (queue.eqCount > 0) {
    const counted = { ...queue, eqCount: queue.eqCount - 1 };
    return removeEquality(counted) ?? removeInstance(counted);
  }
  const reset = { ...queue, eqCount: EQUALITY_COUNT };
  return removeInstance(reset) ?? removeEquality(reset);
};

const last = <Item>(list: Cons<Item>) => {
  let cell = list;
  while (cell.tail !== undefined) cell = cell.tail;
  return cell.head;
};

export const getQueueHead = (queue: Queue) =>
  queue.prop1?.head ??
  queue.prop2?.head ??
  queue.unary?.head ??
  queue.binary?.head ??
  queue.nary?.head ??
  queue.eqFront?.head ??
  (queue.eqBack && last(queue.eqBack)) ??
  queue.instFront?.head ??
  (queue.instBack && last(queue.instBack));
