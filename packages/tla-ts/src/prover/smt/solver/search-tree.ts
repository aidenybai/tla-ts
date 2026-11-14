// Ported from Z3 (src/util/search_tree.h), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import type { AstManager } from "./ast";
import { RandomGen } from "./random-gen";

const STATUS_OPEN = 0;
const STATUS_CLOSED = 1;
const STATUS_ACTIVE = 2;

// A literal is an expression, and -1 stands for the root's null literal.
export class SearchNode {
  left: SearchNode | undefined;
  right: SearchNode | undefined;
  status = STATUS_OPEN;
  core: number[] = [];
  numActivations = 0;
  effortSpent = 0;
  private roundMaxEffort = 0;
  private activeWorkers = 0;

  constructor(
    readonly literal: number,
    readonly parent: SearchNode | undefined,
  ) {}

  get isLeaf() {
    return this.left === undefined && this.right === undefined;
  }

  get depth() {
    let depth = 0;
    for (let node = this.parent; node !== undefined; node = node.parent) depth++;
    return depth;
  }

  markNewActivation() {
    this.status = STATUS_ACTIVE;
    this.numActivations++;
    this.activeWorkers++;
  }

  decActiveWorkers() {
    if (this.activeWorkers > 0) this.activeWorkers--;
    if (this.activeWorkers === 0 && this.status === STATUS_ACTIVE) {
      this.roundMaxEffort = 0;
      this.status = STATUS_OPEN;
    }
  }

  updateRoundMaxEffort(effort: number) {
    if (effort <= this.roundMaxEffort) return;
    this.effortSpent += effort - this.roundMaxEffort;
    this.roundMaxEffort = effort;
  }
}

interface Candidate {
  node: SearchNode | undefined;
  scaledEffort: number;
  depth: number;
}

const getAtom = (manager: AstManager, literal: number) =>
  manager.isNot(literal) ? manager.getArg(literal, 0) : literal;

const isPathContainingAtom = (manager: AstManager, node: SearchNode, literal: number) => {
  const atom = getAtom(manager, literal);
  for (let current: SearchNode | undefined = node; current !== undefined; current = current.parent)
    if (current.literal !== -1 && getAtom(manager, current.literal) === atom) return true;
  return false;
};

const isBetter = (first: Candidate, second: Candidate) => {
  if (first.node === undefined) return false;
  if (second.node === undefined) return true;
  if (first.scaledEffort !== second.scaledEffort) return first.scaledEffort < second.scaledEffort;
  return first.depth > second.depth;
};

export const isAncestor = (ancestor: SearchNode, node: SearchNode | undefined) => {
  for (let current = node; current !== undefined; current = current.parent)
    if (current === ancestor) return true;
  return false;
};

export const isPathContaining = (node: SearchNode, literal: number) => {
  for (let current: SearchNode | undefined = node; current !== undefined; current = current.parent)
    if (current.literal === literal) return true;
  return false;
};

const getSiblingResolvent = (left: SearchNode, right: SearchNode) => {
  const resolvent: number[] = [];
  if (left.core.length === 0 || right.core.length === 0 || left.parent !== right.parent)
    return resolvent;
  for (const literal of left.core)
    if (literal !== left.literal && !resolvent.includes(literal)) resolvent.push(literal);
  for (const literal of right.core)
    if (literal !== right.literal && !resolvent.includes(literal)) resolvent.push(literal);
  return resolvent;
};

const close = (node: SearchNode | undefined, core: number[]) => {
  if (node === undefined || node.status === STATUS_CLOSED) return;
  node.status = STATUS_CLOSED;
  node.core = core;
  close(node.left, core);
  close(node.right, core);
};

export class SearchTree {
  root = new SearchNode(-1, undefined);
  private random = new RandomGen(0);
  private effortUnit = 1000;

  constructor(private manager: AstManager) {}

  setEffortUnit(effortUnit: number) {
    this.effortUnit = Math.max(1, effortUnit);
  }

  private getScaledEffort(node: SearchNode) {
    return Math.trunc(node.effortSpent / Math.max(1, this.effortUnit));
  }

  private selectNextNode(node: SearchNode | undefined, status: number, best: Candidate) {
    if (node === undefined || node.status === STATUS_CLOSED) return;
    if (node.status === status) {
      const candidate = { node, scaledEffort: this.getScaledEffort(node), depth: node.depth };
      if (isBetter(candidate, best)) Object.assign(best, candidate);
    }
    this.selectNextNode(node.left, status, best);
    this.selectNextNode(node.right, status, best);
  }

  private hasUnvisitedOpenNode(node: SearchNode | undefined): boolean {
    if (node === undefined || node.status === STATUS_CLOSED) return false;
    if (node.status === STATUS_OPEN && node.numActivations === 0) return true;
    return this.hasUnvisitedOpenNode(node.left) || this.hasUnvisitedOpenNode(node.right);
  }

  private countUnsolvedNodes(node: SearchNode | undefined): number {
    if (node === undefined || node.status === STATUS_CLOSED) return 0;
    return 1 + this.countUnsolvedNodes(node.left) + this.countUnsolvedNodes(node.right);
  }

  private countActiveNodes(node: SearchNode | undefined): number {
    if (node === undefined || node.status === STATUS_CLOSED) return 0;
    return (
      (node.status === STATUS_ACTIVE ? 1 : 0) +
      this.countActiveNodes(node.left) +
      this.countActiveNodes(node.right)
    );
  }

  private getShallowestTimedOutLeafDepth(node: SearchNode | undefined): number {
    if (node === undefined || node.status === STATUS_CLOSED) return Infinity;
    return Math.min(
      node.isLeaf && node.effortSpent > 0 ? node.depth : Infinity,
      this.getShallowestTimedOutLeafDepth(node.left),
      this.getShallowestTimedOutLeafDepth(node.right),
    );
  }

  // m_min_tree_size is 0, so the throttle always applies.
  private shouldSplit(node: SearchNode) {
    if (node.status !== STATUS_ACTIVE || !node.isLeaf) return false;
    const numActiveNodes = this.countActiveNodes(this.root);
    if (this.countUnsolvedNodes(this.root) >= numActiveNodes * 2) return false;
    if (this.hasUnvisitedOpenNode(this.root)) return false;
    if (this.random.next() % 2 !== 0) return false;
    return node.depth === this.getShallowestTimedOutLeafDepth(this.root);
  }

  private findHighestAttach(node: SearchNode, resolvent: number[]) {
    let attach = node;
    for (let candidate: SearchNode | undefined = node; candidate !== undefined;) {
      const current: SearchNode = candidate;
      if (resolvent.every((literal) => isPathContaining(current, literal))) attach = current;
      candidate = current.parent;
    }
    return attach;
  }

  private propagateClosureUpward(node: SearchNode) {
    for (let current = node; ;) {
      const parent = current.parent;
      if (parent?.left === undefined || parent.right === undefined) return;
      if (parent.left.status !== STATUS_CLOSED || parent.right.status !== STATUS_CLOSED) return;
      if (parent.left.core.length === 0 || parent.right.core.length === 0) return;
      const resolvent = getSiblingResolvent(parent.left, parent.right);
      if (resolvent.length === 0) {
        close(this.root, resolvent);
        return;
      }
      close(parent, resolvent);
      current = parent;
    }
  }

  private closeWithCore(node: SearchNode, core: number[]) {
    if (node.status === STATUS_CLOSED && node.core.every((literal) => core.includes(literal)))
      return;
    const parent = node.parent;
    if (parent !== undefined && core.every((literal) => literal !== node.literal)) {
      this.closeWithCore(parent, core);
      return;
    }
    close(node, core);
    if (parent?.left === undefined || parent.right === undefined) return;
    if (parent.left.status !== STATUS_CLOSED || parent.right.status !== STATUS_CLOSED) return;
    if (parent.left.core.length === 0 || parent.right.core.length === 0) return;
    const resolvent = getSiblingResolvent(parent.left, parent.right);
    if (resolvent.length === 0) {
      close(this.root, resolvent);
      return;
    }
    const attach = this.findHighestAttach(parent, resolvent);
    close(attach, resolvent);
    this.propagateClosureUpward(attach);
  }

  trySplit(node: SearchNode, literal: number, negation: number, effort: number) {
    if (this.isLeaseCanceled(node)) return false;
    node.updateRoundMaxEffort(effort);
    if (!this.shouldSplit(node)) return false;
    if (isPathContainingAtom(this.manager, node, literal))
      throw new SmtInvariantError("the search tree splits on an atom of its path");
    node.left = new SearchNode(literal, node);
    node.right = new SearchNode(negation, node);
    return true;
  }

  // The conflict's literals are on the path from the root to the node, or are assumptions.
  backtrack(node: SearchNode, conflict: number[]) {
    if (conflict.length === 0) {
      this.closeWithCore(this.root, conflict);
      return;
    }
    for (let current: SearchNode | undefined = node; current !== undefined;) {
      const literal = current.literal;
      if (conflict.includes(literal)) {
        this.closeWithCore(current, conflict);
        return;
      }
      current = current.parent;
    }
    throw new SmtInvariantError("the conflict has no literal of the search tree's path");
  }

  activateBestNode() {
    const best: Candidate = { node: undefined, scaledEffort: Infinity, depth: 0 };
    this.selectNextNode(this.root, STATUS_OPEN, best);
    if (best.node === undefined) this.selectNextNode(this.root, STATUS_ACTIVE, best);
    best.node?.markNewActivation();
    return best.node;
  }

  activateRoot() {
    if (this.root.status === STATUS_CLOSED) return undefined;
    this.root.markNewActivation();
    return this.root;
  }

  findNonclosedNodesWithLiteral(literal: number) {
    const found: SearchNode[] = [];
    const visit = (node: SearchNode | undefined) => {
      if (node === undefined) return;
      if (node.literal !== -1 && node.literal === literal && node.status !== STATUS_CLOSED)
        found.push(node);
      visit(node.left);
      visit(node.right);
    };
    visit(this.root);
    return found;
  }

  isLeaseCanceled(node: SearchNode) {
    return node.status === STATUS_CLOSED;
  }

  get isClosed() {
    return this.root.status === STATUS_CLOSED;
  }
}
