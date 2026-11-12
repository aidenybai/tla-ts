// Ported from Z3 (src/muz/spacer/spacer_pdr.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { L_GAVE_UP, type Pob, type SpacerContext } from "./spacer-context";
import { INFTY_LEVEL } from "./spacer-util";

class ModelNode {
  next: ModelNode | undefined;
  prev: ModelNode | undefined;
  readonly origLevel: number;
  depth = 0;
  isClosed = false;
  children: ModelNode[] = [];

  constructor(
    readonly parent: ModelNode | undefined,
    readonly pob: Pob,
  ) {
    this.origLevel = pob.level;
    parent?.addChild(this);
  }

  private addChild(kid: ModelNode) {
    this.children.push(kid);
    kid.depth = this.depth + 1;
    if (this.isClosed) this.setOpen();
  }

  isOneClosed() {
    if (this.isClosed) return true;
    if (this.children.length === 0) return false;
    return this.children.every((kid) => kid.isClosed);
  }

  checkPreClosed() {
    if (this.children.some((kid) => !kid.isClosed)) return;
    this.isClosed = true;
    for (let parent = this.parent; parent?.isOneClosed(); parent = parent.parent)
      parent.isClosed = true;
  }

  setOpen() {
    this.isClosed = false;
    for (let parent = this.parent; parent?.isClosed; parent = parent.parent)
      parent.isClosed = false;
  }

  isInQueue() {
    return this.next !== undefined && this.prev !== undefined;
  }

  insertAfter(node: ModelNode) {
    if (this === node) {
      this.next = node;
      this.prev = node;
      return;
    }
    const next = this.next as ModelNode;
    node.next = next;
    next.prev = node;
    this.next = node;
    node.prev = this;
  }
}

class ModelSearch {
  root: ModelNode | undefined;
  private head: ModelNode | undefined;
  private cache: Map<number, ModelNode[]>[] = [];

  constructor(private isBfs: boolean) {}

  private detach(node: ModelNode) {
    if (node === node.next) this.head = undefined;
    else {
      (node.next as ModelNode).prev = node.prev;
      (node.prev as ModelNode).next = node.next;
      if (node === this.head) this.head = node.next;
    }
    node.prev = undefined;
    node.next = undefined;
  }

  private getCache(node: ModelNode) {
    while (this.cache.length <= node.origLevel) this.cache.push(new Map());
    return this.cache[node.origLevel];
  }

  reset() {
    if (this.root !== undefined) {
      this.eraseChildren(this.root, false);
      this.removeNode(this.root, false);
      this.root = undefined;
    }
    this.cache = [];
  }

  popFront() {
    const result = this.head;
    if (result !== undefined) this.detach(result);
    return result;
  }

  addLeaf(node: ModelNode) {
    const cache = this.getCache(node);
    let nodes = cache.get(node.pob.post);
    if (nodes === undefined) {
      nodes = [];
      cache.set(node.pob.post, nodes);
    }
    if (nodes.includes(node)) return;
    nodes.push(node);
    if (nodes.length === 1) this.enqueueLeaf(node);
    else node.isClosed = true;
  }

  enqueueLeaf(node: ModelNode) {
    if (this.head === undefined) {
      this.head = node;
      node.insertAfter(node);
    } else if (this.isBfs) this.head.insertAfter(node);
    else (this.head.next as ModelNode).insertAfter(node);
  }

  setRoot(root: ModelNode) {
    this.reset();
    this.root = root;
    this.addLeaf(root);
  }

  backtrackLevel(node: ModelNode) {
    const parent = node.parent;
    if (parent === undefined) return;
    this.eraseChildren(parent, true);
    this.enqueueLeaf(parent);
  }

  private eraseChildren(node: ModelNode, isBacktracking: boolean) {
    const todo = [...node.children];
    if (node.isInQueue()) this.detach(node);
    node.children = [];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      todo.push(...current.children);
      this.removeNode(current, isBacktracking);
    }
  }

  private removeNode(node: ModelNode, isBacktracking: boolean) {
    const cache = this.getCache(node);
    const nodes = cache.get(node.pob.post) as ModelNode[];
    nodes.splice(nodes.indexOf(node), 1);
    if (node.isInQueue()) this.detach(node);
    if (nodes.length > 0 && isBacktracking && nodes[0].children.length === 0 && nodes[0].isClosed) {
      nodes[0].setOpen();
      this.enqueueLeaf(nodes[0]);
    }
    if (nodes.length === 0) cache.delete(node.pob.post);
  }
}

// Z3 closes a node that reaches its premises but never closes the parents it completes, so the
// root of a reachable query stays open and gpdr answers unreachable. The parents that all their
// children close are closed here, up to the root.
const closeNode = (node: ModelNode, root: ModelNode) => {
  node.isClosed = true;
  for (let parent = node.parent; parent?.isOneClosed(); parent = parent.parent)
    parent.isClosed = true;
  return root.isClosed;
};

const checkReachability = (context: SpacerContext, level: number, search: ModelSearch) => {
  const manager = context.manager;
  const query = context.query as NonNullable<SpacerContext["query"]>;
  const rootPob = query.mkPob(undefined, level, 0, manager.trueExpr);
  const root = new ModelNode(undefined, rootPob);
  search.setRoot(root);
  const newPobs: Pob[] = [];
  for (let node = search.popFront(); node !== undefined; node = search.popFront()) {
    newPobs.length = 0;
    manager.limit.checkpoint();
    if (node.pob.pt.isMustReachable(node.pob.post) !== undefined) {
      if (closeNode(node, root)) return L_TRUE;
      continue;
    }
    switch (context.expandPob(node.pob, newPobs)) {
      case L_TRUE:
        if (closeNode(node, root)) return L_TRUE;
        break;
      case L_FALSE:
        search.backtrackLevel(node);
        if (node === root) return L_FALSE;
        break;
      case L_GAVE_UP:
        return L_UNDEF;
      default:
        for (const pob of newPobs) if (pob !== node.pob) search.addLeaf(new ModelNode(node, pob));
        node.checkPreClosed();
    }
  }
  return root.isClosed ? L_TRUE : L_FALSE;
};

export const gpdrSolveCore = (context: SpacerContext) => {
  context.query = context.rels.get(context.queryPred);
  if (context.query === undefined) return L_FALSE;
  const search = new ModelSearch(context.isPdrBfs);
  for (let level = 0; level < context.maxLevel; level++) {
    context.manager.limit.checkpoint();
    context.expandedLevel = INFTY_LEVEL;
    const reachable = checkReachability(context, level, search);
    if (reachable !== L_FALSE) return reachable;
    if (level > 0 && context.propagate(context.expandedLevel, level)) return L_FALSE;
  }
  return L_UNDEF;
};

export const gpdrCreateSplitChildren = () => {
  throw new SmtUnsupportedError("gpdr on rules with several predecessors");
};
