// Ported from Z3 (src/ast/rewriter/maximize_ac_sharing.cpp), MIT license, see z3-license.txt.
// maximize_bv_sharing_rw: an associative application of more than two arguments becomes a tree of
// binary applications that reuses the pairs it made before.
import { OP_ADD, OP_BADD, OP_BAND, OP_BMUL, OP_BOR, OP_OR, type AstManager } from "./ast";
import { RewriterTpl } from "./rewriter-tpl";
import { shrink } from "./array";

interface SharingEntry {
  decl: number;
  first: number;
  second: number;
}

// MAX_NUM_ARGS_FOR_OPT: pairs are reused only for fewer arguments.
const MAX_NUM_ARGS_FOR_OPT = 128;

// Z3 compares kinds without the family, and bvmul's kind is also that of or and +.
const SHARED_OPS = new Set([OP_BADD, OP_BMUL, OP_BOR, OP_BAND, OP_OR, OP_ADD]);

export class MaxBvSharing extends RewriterTpl {
  // Z3 registers the kinds when the first scope is pushed.
  private isInit = false;
  // m_entries and m_cache: the pairs made, which hold their arguments. The cache maps a declaration
  // and the lower of two arguments to the higher ones, so a pair matches in either order.
  private entries: SharingEntry[] = [];
  private pairCache = new Map<number, Map<number, Set<number>>>();
  private pairScopes: number[] = [];

  constructor(manager: AstManager) {
    super(manager);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (!this.isInit || !SHARED_OPS.has(op) || args.length <= 2) return -1;
    return manager.withTemporaries(() => {
      const numeral = manager.isBvNumeral(args[0]) ? args[0] : -1;
      const pending = numeral === -1 ? [...args] : args.slice(1);
      // Reuses the pairs made before, the first pair found first. Z3 scans every pair again after
      // each reuse, but no pair is made meanwhile, so before the reused pair only the pairs with
      // the argument it became can match.
      for (let merged = 0; pending.length > 1 && pending.length < MAX_NUM_ARGS_FOR_OPT;) {
        let pairFirst = -1;
        let pairSecond = -1;
        for (let first = 0; first < merged && pairFirst === -1; first++)
          if (this.hasPair(decl, pending[first], pending[merged])) {
            pairFirst = first;
            pairSecond = merged;
          }
        for (let first = merged; first + 1 < pending.length && pairFirst === -1; first++)
          for (let second = first + 1; second < pending.length && pairFirst === -1; second++)
            if (this.hasPair(decl, pending[first], pending[second])) {
              pairFirst = first;
              pairSecond = second;
            }
        if (pairFirst === -1) break;
        pending[pairFirst] = manager.mkApp(decl, [pending[pairFirst], pending[pairSecond]], sort);
        pending.splice(pairSecond, 1);
        merged = pairFirst;
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
      return numeral === -1 ? pending[0] : manager.mkApp(decl, [numeral, pending[0]], sort);
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
