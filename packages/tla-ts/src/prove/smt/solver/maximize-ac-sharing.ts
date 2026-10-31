// Ported from Z3 (src/ast/rewriter/maximize_ac_sharing.cpp), MIT license, see z3-license.txt.
// maximize_bv_sharing_rw: an associative application of more than two arguments becomes a tree of
// binary applications that reuses the pairs it made before.
import { OP_ADD, OP_OR, type AstManager } from "./ast";
import { RewriterTpl } from "./rewriter-tpl";
import { shrink } from "./array";

interface SharingEntry {
  decl: number;
  first: number;
  second: number;
}

// MAX_NUM_ARGS_FOR_OPT: pairs are reused only for fewer arguments.
const MAX_NUM_ARGS_FOR_OPT = 128;

export class MaxBvSharing extends RewriterTpl {
  // Z3 registers the kinds of bvadd, bvmul, bvor and bvand when the first scope is pushed, and
  // compares the kind without the family. bvmul has the kind of or and of +, so those are shared.
  private isInit = false;
  // m_entries and m_cache: the pairs made, which hold their arguments. The cache maps a declaration
  // and the lower of two arguments to the higher ones, so a pair matches in either order.
  private entries: SharingEntry[] = [];
  private pairCache = new Map<number, Map<number, Set<number>>>();
  private pairScopes: number[] = [];

  constructor(manager: AstManager) {
    super(manager);
  }

  protected reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (!this.isInit || (op !== OP_OR && op !== OP_ADD) || args.length <= 2) return -1;
    return manager.withTemporaries(() => {
      const pending = [...args];
      // Reuses the pairs made before, the first pair found first.
      for (
        let isReused = true;
        isReused && pending.length > 1 && pending.length < MAX_NUM_ARGS_FOR_OPT;
      ) {
        isReused = false;
        for (let first = 0; first + 1 < pending.length && !isReused; first++)
          for (let second = first + 1; second < pending.length && !isReused; second++)
            if (this.hasPair(decl, pending[first], pending[second])) {
              pending[first] = manager.mkApp(decl, [pending[first], pending[second]], sort);
              pending.splice(second, 1);
              isReused = true;
            }
      }
      while (pending.length > 1) {
        const next: number[] = [];
        for (let index = 0; index < pending.length; index += 2) {
          if (index === pending.length - 1) {
            next.push(pending[index]);
            continue;
          }
          this.insert(decl, pending[index], pending[index + 1]);
          next.push(manager.mkApp(decl, [pending[index], pending[index + 1]], sort));
        }
        pending.splice(0, pending.length, ...next);
      }
      return pending[0];
    });
  }

  // entry orders its arguments by id, and pop_scope releases them in that order.
  private insert(decl: number, first: number, second: number) {
    const isOrdered = this.manager.ids[first] <= this.manager.ids[second];
    this.entries.push({
      decl,
      first: isOrdered ? first : second,
      second: isOrdered ? second : first,
    });
    const byDecl = this.pairCache.get(decl) ?? new Map<number, Set<number>>();
    this.pairCache.set(decl, byDecl);
    const low = Math.min(first, second);
    const highs = byDecl.get(low) ?? new Set<number>();
    byDecl.set(low, highs);
    highs.add(Math.max(first, second));
    this.manager.incRef(first);
    this.manager.incRef(second);
  }

  private hasPair(decl: number, first: number, second: number) {
    return (
      this.pairCache.get(decl)?.get(Math.min(first, second))?.has(Math.max(first, second)) === true
    );
  }

  pushScope() {
    this.isInit = true;
    this.pairScopes.push(this.entries.length);
  }

  // pop_scope: releases the pairs made since the matching push, the last first.
  popScope() {
    const size = this.pairScopes.pop() as number;
    for (let index = this.entries.length - 1; index >= size; index--) {
      const entry = this.entries[index];
      this.pairCache
        .get(entry.decl)
        ?.get(Math.min(entry.first, entry.second))
        ?.delete(Math.max(entry.first, entry.second));
      this.manager.decRef(entry.first);
      this.manager.decRef(entry.second);
    }
    shrink(this.entries, size);
  }
}
