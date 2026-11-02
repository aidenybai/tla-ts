// Ported from Z3 (src/smt/smt_cg_table.h, src/smt/smt_cg_table.cpp), MIT license, see
// z3-license.txt. The congruence table maps a declaration and the roots of its arguments to the
// congruence root, so f(a) and f(b) meet when a and b are merged. Equalities are commutative. Nodes
// are ids of the store.
import { CONGRUENCE_JUSTIFICATIONS, type EnodeStore } from "./enode";

// The hash of an equality between the classes of first and second, in either order.
const getEqHash = (decl: number, first: number, second: number) =>
  first < second
    ? (Math.imul(Math.imul(decl, 0x9e3779b1) + first, 0x85ebca6b) + second) | 0
    : (Math.imul(Math.imul(decl, 0x9e3779b1) + second, 0x85ebca6b) + first) | 0;

// The expression of the root of a node, which the hashes take.
const getRootOwner = (store: EnodeStore, id: number) => store.owner[store.root[id]];

const getHash = (store: EnodeStore, decl: number, args: number[], isEq: boolean) => {
  if (isEq) return getEqHash(decl, getRootOwner(store, args[0]), getRootOwner(store, args[1]));
  let hash = decl;
  for (let index = 0; index < args.length; index++)
    hash = (Math.imul(hash, 0x9e3779b1) + getRootOwner(store, args[index])) | 0;
  return hash;
};

const getNodeHash = (store: EnodeStore, node: number) => {
  const decl = store.decl[node];
  if (store.isEq(node))
    return getEqHash(
      decl,
      getRootOwner(store, store.getArg(node, 0)),
      getRootOwner(store, store.getArg(node, 1)),
    );
  let hash = decl;
  const start = store.argStart[node];
  const numArgs = store.getNumArgs(node);
  for (let index = 0; index < numArgs; index++)
    hash = (Math.imul(hash, 0x9e3779b1) + getRootOwner(store, store.argPool[start + index])) | 0;
  return hash;
};

// Whether node is decl applied to nodes equal to first and second, in either order for an equality.
const isPairCongruentTo = (
  store: EnodeStore,
  node: number,
  first: number,
  second: number,
  isEq: boolean,
) => {
  const root = store.root;
  const nodeFirst = root[store.getArg(node, 0)];
  const nodeSecond = root[store.getArg(node, 1)];
  return (
    (nodeFirst === root[first] && nodeSecond === root[second]) ||
    (isEq && nodeFirst === root[second] && nodeSecond === root[first])
  );
};

const isCongruentTo = (
  store: EnodeStore,
  node: number,
  decl: number,
  args: number[],
  isEq: boolean,
) => {
  if (store.decl[node] !== decl || store.getNumArgs(node) !== args.length) return false;
  if (isEq) return isPairCongruentTo(store, node, args[0], args[1], true);
  const root = store.root;
  const start = store.argStart[node];
  for (let index = 0; index < args.length; index++)
    if (root[store.argPool[start + index]] !== root[args[index]]) return false;
  return true;
};

// congruent: whether two nodes apply one declaration to equal arguments. Only equalities are
// commutative.
export const isCongruent = (store: EnodeStore, first: number, second: number) => {
  const numArgs = store.getNumArgs(first);
  if (store.decl[first] !== store.decl[second] || numArgs !== store.getNumArgs(second))
    return false;
  if (numArgs === 2)
    return isPairCongruentTo(
      store,
      first,
      store.getArg(second, 0),
      store.getArg(second, 1),
      store.isEq(first),
    );
  const root = store.root;
  const firstStart = store.argStart[first];
  const secondStart = store.argStart[second];
  for (let index = 0; index < numArgs; index++)
    if (root[store.argPool[firstStart + index]] !== root[store.argPool[secondStart + index]])
      return false;
  return true;
};

// The justification of a node's equality with the congruent node that the table returned for it.
export const getCongruenceJustification = (store: EnodeStore, node: number, congruent: number) =>
  CONGRUENCE_JUSTIFICATIONS[
    store.isEq(node) && store.root[store.getArg(congruent, 0)] !== store.root[store.getArg(node, 0)]
      ? 1
      : 0
  ];

const EMPTY = 0;
const FULL = 1;
const DELETED = 2;

// Open addressing with linear probing. An erased node leaves a deleted slot, which probes pass over,
// until the table is rebuilt.
export class CgTable {
  private nodes = new Int32Array(1024);
  private hashes = new Int32Array(1024);
  private states = new Uint8Array(1024);
  private numFull = 0;
  private numDeleted = 0;

  constructor(private store: EnodeStore) {}

  private find(decl: number, args: number[], isEq: boolean, hash: number) {
    const mask = this.states.length - 1;
    for (let slot = hash & mask; this.states[slot] !== EMPTY; slot = (slot + 1) & mask) {
      if (
        this.states[slot] === FULL &&
        this.hashes[slot] === hash &&
        isCongruentTo(this.store, this.nodes[slot], decl, args, isEq)
      )
        return this.nodes[slot];
    }
    return -1;
  }

  private findNode(node: number, hash: number) {
    const mask = this.states.length - 1;
    for (let slot = hash & mask; this.states[slot] !== EMPTY; slot = (slot + 1) & mask) {
      if (
        this.states[slot] === FULL &&
        this.hashes[slot] === hash &&
        isCongruent(this.store, this.nodes[slot], node)
      )
        return this.nodes[slot];
    }
    return -1;
  }

  // Returns the congruence root for node, which is node itself when it is new.
  insert(node: number) {
    const hash = getNodeHash(this.store, node);
    const existing = this.findNode(node, hash);
    if (existing !== -1) return existing;
    if (2 * (this.numFull + this.numDeleted + 1) > this.states.length) this.rebuild();
    const mask = this.states.length - 1;
    let slot = hash & mask;
    while (this.states[slot] === FULL) slot = (slot + 1) & mask;
    if (this.states[slot] === DELETED) this.numDeleted--;
    this.place(slot, node, hash);
    return node;
  }

  private place(slot: number, node: number, hash: number) {
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
    this.nodes = new Int32Array(size);
    this.hashes = new Int32Array(size);
    this.states = new Uint8Array(size);
    this.numFull = 0;
    this.numDeleted = 0;
    const mask = size - 1;
    for (let index = 0; index < states.length; index++) {
      if (states[index] !== FULL) continue;
      let slot = hashes[index] & mask;
      while (this.states[slot] === FULL) slot = (slot + 1) & mask;
      this.place(slot, nodes[index], hashes[index]);
    }
  }

  // get_enode_eq_to: the congruence root of decl applied to nodes equal to args, or -1.
  findFor(decl: number, args: number[], isEq: boolean) {
    return this.find(decl, args, isEq, getHash(this.store, decl, args, isEq));
  }

  // The congruence root of a node congruent to node, or -1.
  findCongruent(node: number) {
    return this.findNode(node, getNodeHash(this.store, node));
  }

  private getSlot(node: number) {
    const mask = this.states.length - 1;
    for (
      let slot = getNodeHash(this.store, node) & mask;
      this.states[slot] !== EMPTY;
      slot = (slot + 1) & mask
    )
      if (this.states[slot] === FULL && this.nodes[slot] === node) return slot;
    return -1;
  }

  erase(node: number) {
    const slot = this.getSlot(node);
    if (slot === -1) return;
    this.states[slot] = DELETED;
    this.numFull--;
    this.numDeleted++;
  }

  contains(node: number) {
    return this.getSlot(node) !== -1;
  }
}
