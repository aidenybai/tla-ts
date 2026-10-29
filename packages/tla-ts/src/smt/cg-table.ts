// Ported from Z3 (src/smt/smt_cg_table.h, src/smt/smt_cg_table.cpp), MIT license, see
// z3-license.txt. The congruence table maps a declaration and the roots of its arguments to the
// congruence root, so f(a) and f(b) meet when a and b are merged. Equalities are commutative.
import type { Enode } from "./enode";

export interface CgInsertResult {
  node: Enode;
  isCommutative: boolean;
}

const getHash = (decl: number, args: Enode[], isEq: boolean) => {
  if (isEq) {
    const first = args[0].root.owner;
    const second = args[1].root.owner;
    return first < second
      ? (Math.imul(Math.imul(decl, 0x9e3779b1) + first, 0x85ebca6b) + second) | 0
      : (Math.imul(Math.imul(decl, 0x9e3779b1) + second, 0x85ebca6b) + first) | 0;
  }
  let hash = decl;
  for (let index = 0; index < args.length; index++)
    hash = (Math.imul(hash, 0x9e3779b1) + args[index].root.owner) | 0;
  return hash;
};

const isCongruentTo = (node: Enode, decl: number, args: Enode[], isEq: boolean) => {
  if (node.decl !== decl || node.args.length !== args.length) return false;
  if (isEq) {
    const first = args[0].root;
    const second = args[1].root;
    const nodeFirst = node.args[0].root;
    const nodeSecond = node.args[1].root;
    return (
      (nodeFirst === first && nodeSecond === second) ||
      (nodeFirst === second && nodeSecond === first)
    );
  }
  for (let index = 0; index < args.length; index++)
    if (node.args[index].root !== args[index].root) return false;
  return true;
};

export class CgTable {
  private table = new Map<number, Enode[]>();

  private find(decl: number, args: Enode[], isEq: boolean, hash: number) {
    const bucket = this.table.get(hash);
    if (bucket === undefined) return undefined;
    for (const node of bucket) if (isCongruentTo(node, decl, args, isEq)) return node;
    return undefined;
  }

  // Returns the congruence root for node, which is node itself when it is new.
  insert(node: Enode): CgInsertResult {
    const hash = getHash(node.decl, node.args, node.isEq);
    const existing = this.find(node.decl, node.args, node.isEq, hash);
    if (existing === undefined) {
      const bucket = this.table.get(hash);
      if (bucket === undefined) this.table.set(hash, [node]);
      else bucket.push(node);
      return { node, isCommutative: false };
    }
    const isCommutative = node.isEq && existing.args[0].root !== node.args[0].root;
    return { node: existing, isCommutative };
  }

  // get_enode_eq_to: the congruence root of decl applied to nodes equal to args, if any.
  findFor(decl: number, args: Enode[], isEq: boolean) {
    return this.find(decl, args, isEq, getHash(decl, args, isEq));
  }

  erase(node: Enode) {
    const hash = getHash(node.decl, node.args, node.isEq);
    const bucket = this.table.get(hash);
    if (bucket === undefined) return;
    const index = bucket.indexOf(node);
    if (index === -1) return;
    if (bucket.length === 1) this.table.delete(hash);
    else {
      bucket[index] = bucket[bucket.length - 1];
      bucket.pop();
    }
  }

  contains(node: Enode) {
    const bucket = this.table.get(getHash(node.decl, node.args, node.isEq));
    return bucket !== undefined && bucket.includes(node);
  }
}
