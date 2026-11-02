// Ported from Z3 (src/smt/smt_cg_table.h, src/smt/smt_cg_table.cpp), MIT license, see
// z3-license.txt. The congruence table maps a declaration and the roots of its arguments to the
// congruence root, so f(a) and f(b) meet when a and b are merged. Equalities are commutative.
import { CONGRUENCE_JUSTIFICATIONS, type Enode } from "./enode";

// The hash of an equality between the classes of first and second, in either order.
const getEqHash = (decl: number, first: number, second: number) =>
  first < second
    ? (Math.imul(Math.imul(decl, 0x9e3779b1) + first, 0x85ebca6b) + second) | 0
    : (Math.imul(Math.imul(decl, 0x9e3779b1) + second, 0x85ebca6b) + first) | 0;

const getHash = (decl: number, args: Enode[], isEq: boolean) => {
  if (isEq) return getEqHash(decl, args[0].root.owner, args[1].root.owner);
  let hash = decl;
  for (let index = 0; index < args.length; index++)
    hash = (Math.imul(hash, 0x9e3779b1) + args[index].root.owner) | 0;
  return hash;
};

const getNodeHash = (node: Enode) => {
  if (node.isEq) return getEqHash(node.decl, node.getArg(0).root.owner, node.getArg(1).root.owner);
  let hash = node.decl;
  for (let index = 0; index < node.numArgs; index++)
    hash = (Math.imul(hash, 0x9e3779b1) + node.getArg(index).root.owner) | 0;
  return hash;
};

// Whether node is decl applied to nodes equal to first and second, in either order for an equality.
const isPairCongruentTo = (node: Enode, first: Enode, second: Enode, isEq: boolean) => {
  const nodeFirst = node.getArg(0).root;
  const nodeSecond = node.getArg(1).root;
  return (
    (nodeFirst === first.root && nodeSecond === second.root) ||
    (isEq && nodeFirst === second.root && nodeSecond === first.root)
  );
};

const isCongruentTo = (node: Enode, decl: number, args: Enode[], isEq: boolean) => {
  if (node.decl !== decl || node.numArgs !== args.length) return false;
  if (isEq) return isPairCongruentTo(node, args[0], args[1], true);
  for (let index = 0; index < args.length; index++)
    if (node.getArg(index).root !== args[index].root) return false;
  return true;
};

// congruent: whether two nodes apply one declaration to equal arguments. Only equalities are
// commutative.
export const isCongruent = (first: Enode, second: Enode) => {
  if (first.decl !== second.decl || first.numArgs !== second.numArgs) return false;
  if (first.numArgs === 2)
    return isPairCongruentTo(first, second.getArg(0), second.getArg(1), first.isEq);
  for (let index = 0; index < first.numArgs; index++)
    if (first.getArg(index).root !== second.getArg(index).root) return false;
  return true;
};

// The justification of a node's equality with the congruent node that the table returned for it.
export const getCongruenceJustification = (node: Enode, congruent: Enode) =>
  CONGRUENCE_JUSTIFICATIONS[node.isEq && congruent.getArg(0).root !== node.getArg(0).root ? 1 : 0];

const EMPTY = 0;
const FULL = 1;
const DELETED = 2;

// Open addressing with linear probing. An erased node leaves a deleted slot, which probes pass over,
// until the table is rebuilt.
export class CgTable {
  private nodes = Array<Enode | null>(1024).fill(null);
  private hashes = new Int32Array(1024);
  private states = new Uint8Array(1024);
  private numFull = 0;
  private numDeleted = 0;

  private find(decl: number, args: Enode[], isEq: boolean, hash: number) {
    const mask = this.states.length - 1;
    for (let slot = hash & mask; this.states[slot] !== EMPTY; slot = (slot + 1) & mask) {
      const node = this.nodes[slot];
      if (
        this.states[slot] === FULL &&
        this.hashes[slot] === hash &&
        node !== null &&
        isCongruentTo(node, decl, args, isEq)
      )
        return node;
    }
    return undefined;
  }

  private findNode(node: Enode, hash: number) {
    const mask = this.states.length - 1;
    for (let slot = hash & mask; this.states[slot] !== EMPTY; slot = (slot + 1) & mask) {
      const candidate = this.nodes[slot];
      if (
        this.states[slot] === FULL &&
        this.hashes[slot] === hash &&
        candidate !== null &&
        isCongruent(candidate, node)
      )
        return candidate;
    }
    return undefined;
  }

  // Returns the congruence root for node, which is node itself when it is new.
  insert(node: Enode) {
    const hash = getNodeHash(node);
    const existing = this.findNode(node, hash);
    if (existing !== undefined) return existing;
    if (2 * (this.numFull + this.numDeleted + 1) > this.states.length) this.rebuild();
    const mask = this.states.length - 1;
    let slot = hash & mask;
    while (this.states[slot] === FULL) slot = (slot + 1) & mask;
    if (this.states[slot] === DELETED) this.numDeleted--;
    this.place(slot, node, hash);
    return node;
  }

  private place(slot: number, node: Enode, hash: number) {
    this.nodes[slot] = node;
    this.hashes[slot] = hash;
    this.states[slot] = FULL;
    this.numFull++;
  }

  // Drops the deleted slots, and doubles the table when it is more than a quarter full.
  private rebuild() {
    const nodes = this.nodes;
    const hashes = this.hashes;
    const states = this.states;
    const size = 4 * this.numFull > states.length ? 2 * states.length : states.length;
    this.nodes = Array<Enode | null>(size).fill(null);
    this.hashes = new Int32Array(size);
    this.states = new Uint8Array(size);
    this.numFull = 0;
    this.numDeleted = 0;
    const mask = size - 1;
    for (let index = 0; index < states.length; index++) {
      const node = nodes[index];
      if (states[index] !== FULL || node === null) continue;
      let slot = hashes[index] & mask;
      while (this.states[slot] === FULL) slot = (slot + 1) & mask;
      this.place(slot, node, hashes[index]);
    }
  }

  // get_enode_eq_to: the congruence root of decl applied to nodes equal to args, if any.
  findFor(decl: number, args: Enode[], isEq: boolean) {
    return this.find(decl, args, isEq, getHash(decl, args, isEq));
  }

  // The congruence root of a node congruent to node.
  findCongruent(node: Enode) {
    return this.findNode(node, getNodeHash(node));
  }

  private getSlot(node: Enode) {
    const mask = this.states.length - 1;
    for (let slot = getNodeHash(node) & mask; this.states[slot] !== EMPTY; slot = (slot + 1) & mask)
      if (this.nodes[slot] === node) return slot;
    return -1;
  }

  erase(node: Enode) {
    const slot = this.getSlot(node);
    if (slot === -1) return;
    this.nodes[slot] = null;
    this.states[slot] = DELETED;
    this.numFull--;
    this.numDeleted++;
  }

  contains(node: Enode) {
    return this.getSlot(node) !== -1;
  }
}
