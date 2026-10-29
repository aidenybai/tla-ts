// Ported from Z3 (src/smt/smt_cg_table.h, src/smt/smt_cg_table.cpp), MIT license, see
// z3-license.txt. The congruence table maps a declaration and the roots of its arguments to the
// congruence root, so f(a) and f(b) meet when a and b are merged. Equalities are commutative.
import type { Enode } from "./enode";

export interface CgInsertResult {
  node: Enode;
  isCommutative: boolean;
}

export class CgTable {
  private table = new Map<string, Enode>();

  private getKey(node: Enode) {
    return this.getKeyFor(node.decl, node.args, node.isEq);
  }

  private getKeyFor(decl: number, args: Enode[], isEq: boolean) {
    if (isEq) {
      const first = args[0].root.owner;
      const second = args[1].root.owner;
      return first < second ? `${decl}=${first},${second}` : `${decl}=${second},${first}`;
    }
    if (args.length === 1) return `${decl}:${args[0].root.owner}`;
    if (args.length === 2) return `${decl}:${args[0].root.owner},${args[1].root.owner}`;
    let key = `${decl}:`;
    for (let index = 0; index < args.length; index++) key += `${args[index].root.owner},`;
    return key;
  }

  // Returns the congruence root for node, which is node itself when it is new.
  insert(node: Enode): CgInsertResult {
    const key = this.getKey(node);
    const existing = this.table.get(key);
    if (existing === undefined) {
      this.table.set(key, node);
      return { node, isCommutative: false };
    }
    const isCommutative = node.isEq && existing.args[0].root !== node.args[0].root;
    return { node: existing, isCommutative };
  }

  // get_enode_eq_to: the congruence root of decl applied to nodes equal to args, if any.
  findFor(decl: number, args: Enode[], isEq: boolean) {
    return this.table.get(this.getKeyFor(decl, args, isEq));
  }

  erase(node: Enode) {
    const key = this.getKey(node);
    if (this.table.get(key) === node) this.table.delete(key);
  }

  contains(node: Enode) {
    return this.table.get(this.getKey(node)) === node;
  }
}
