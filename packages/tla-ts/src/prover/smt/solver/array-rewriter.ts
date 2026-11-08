// Ported from Z3 (src/ast/rewriter/array_rewriter.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import { mkArrayApp } from "./array-decl-plugin";
import {
  type AstManager,
  OP_AND,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_ITE,
  OP_SELECT,
  OP_STORE,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
  SORT_BOOL,
} from "./ast";
import type { Rewrite } from "./rewriter-tpl";

const L_TRUE = 1;
const L_FALSE = -1;
const L_UNDEF = 0;
const MAX_SQUASH_ROUNDS = 10;

export class ArrayRewriter {
  constructor(private manager: AstManager) {}

  private isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  private mkApp(op: number, args: number[], parameters: number[] = []) {
    return mkArrayApp(this.manager, op, args, parameters);
  }

  // compare_args over the indices from start in each term.
  private compareArgs(count: number, first: number, firstStart: number, second: number[]) {
    const manager = this.manager;
    for (let index = 0; index < count; index++) {
      const left = manager.getArg(first, firstStart + index);
      const right = second[index];
      if (left === right) continue;
      return manager.areDistinct(left, right) ? L_FALSE : L_UNDEF;
    }
    return L_TRUE;
  }

  mkAppCore(op: number, args: number[]): number | Rewrite | undefined {
    if (op === OP_SELECT) return this.mkSelectCore(args);
    if (op === OP_STORE) return this.mkStoreCore(args);
    return undefined;
  }

  private mkStoreCore(args: number[]): number | Rewrite | undefined {
    const manager = this.manager;
    const array = args[0];
    const indices = args.slice(1, -1);
    if (this.isOp(array, OP_STORE)) {
      const comparison = this.compareArgs(indices.length, array, 1, indices);
      if (comparison === L_TRUE)
        return this.mkApp(OP_STORE, [manager.getArg(array, 0), ...args.slice(1)]);
      if (comparison === L_FALSE) {
        const squashed = this.squashStore(args);
        if (squashed !== undefined) return { expr: squashed, depth: 2 };
      }
    }
    const value = args[args.length - 1];
    if (this.isOp(array, OP_CONST_ARRAY) && manager.getArg(array, 0) === value) return array;
    if (this.isOp(value, OP_SELECT) && this.compareArgs(args.length - 1, value, 0, args) === L_TRUE)
      return array;
    return undefined;
  }

  private squashStore(args: number[]) {
    const manager = this.manager;
    const parents: number[] = [];
    const indices = args.slice(1, -1);
    let array = args[0];
    for (let rounds = 0; this.isOp(array, OP_STORE) && rounds < MAX_SQUASH_ROUNDS; rounds++) {
      const comparison = this.compareArgs(indices.length, array, 1, indices);
      if (comparison === L_UNDEF) return undefined;
      if (comparison === L_FALSE) {
        parents.push(array);
        array = manager.getArg(array, 0);
        continue;
      }
      let result = manager.getArg(array, 0);
      for (let index = parents.length - 1; index >= 0; index--)
        result = this.mkApp(OP_STORE, [result, ...manager.getArgs(parents[index]).slice(1)]);
      return this.mkApp(OP_STORE, [result, ...args.slice(1)]);
    }
    return undefined;
  }

  private mkSelectSameStore(args: number[]): number | Rewrite | undefined {
    const manager = this.manager;
    const indices = args.slice(1);
    let array = args[0];
    for (;;) {
      if (this.isOp(array, OP_STORE)) {
        const comparison = this.compareArgs(indices.length, array, 1, indices);
        if (comparison === L_TRUE) return manager.getArg(array, indices.length + 1);
        if (comparison === L_UNDEF) return undefined;
        array = manager.getArg(array, 0);
        continue;
      }
      if (this.isOp(array, OP_CONST_ARRAY)) return manager.getArg(array, 0);
      if (this.isOp(array, OP_ARRAY_MAP)) {
        const decl = manager.funcDecls[manager.decls[array]].parameters[0];
        const selects = manager.mapArgs(array, (arg) => this.mkApp(OP_SELECT, [arg, ...indices]));
        return { expr: manager.mkApp(decl, selects, manager.funcDecls[decl].range), depth: 2 };
      }
      if (this.isOp(array, OP_AS_ARRAY)) {
        const decl = manager.funcDecls[manager.decls[array]].parameters[0];
        return { expr: manager.mkApp(decl, indices, manager.funcDecls[decl].range), depth: 1 };
      }
      return undefined;
    }
  }

  private mkSelectCore(args: number[]): number | Rewrite | undefined {
    const manager = this.manager;
    const sameStore = this.mkSelectSameStore(args);
    if (sameStore !== undefined) return sameStore;
    const indices = args.slice(1);
    const array = args[0];
    if (this.isOp(array, OP_STORE)) {
      const comparison = this.compareArgs(indices.length, array, 1, indices);
      if (comparison === L_FALSE) {
        let base = manager.getArg(array, 0);
        while (
          this.isOp(base, OP_STORE) &&
          this.compareArgs(indices.length, base, 1, indices) === L_FALSE
        )
          base = manager.getArg(base, 0);
        return { expr: this.mkApp(OP_SELECT, [base, ...indices]), depth: 1 };
      }
      const base = manager.getArg(array, 0);
      const areValues = indices.every(
        (index, position) =>
          manager.isValue(index) && manager.isValue(manager.getArg(array, position + 1)),
      );
      if (!this.isOp(base, OP_CONST_ARRAY) && !areValues) return undefined;
      const selectBase = this.mkApp(OP_SELECT, [base, ...indices]);
      const value = manager.getArg(array, indices.length + 1);
      const eqs = indices.map((index, position) =>
        manager.mkEq(manager.getArg(array, position + 1), index),
      );
      const condition = eqs.length === 1 ? eqs[0] : manager.mkApp(OP_AND, eqs, SORT_BOOL);
      return {
        expr: manager.mkApp(OP_ITE, [condition, value, selectBase], manager.sorts[value]),
        depth: eqs.length === 1 ? 2 : 3,
      };
    }
    if (this.isOp(array, OP_ITE)) {
      const thenArray = manager.getArg(array, 1);
      const elseArray = manager.getArg(array, 2);
      if (manager.getRefCount(thenArray) !== 1 && manager.getRefCount(elseArray) !== 1)
        return undefined;
      const thenSelect = this.mkApp(OP_SELECT, [thenArray, ...indices]);
      const elseSelect = this.mkApp(OP_SELECT, [elseArray, ...indices]);
      return {
        expr: manager.mkApp(
          OP_ITE,
          [manager.getArg(array, 0), thenSelect, elseSelect],
          manager.sorts[thenSelect],
        ),
        depth: 2,
      };
    }
    return undefined;
  }

  private getStoreBase(expr: number) {
    let base = expr;
    let count = 0;
    while (this.isOp(base, OP_STORE)) {
      base = this.manager.getArg(base, 0);
      count++;
    }
    return { base, count };
  }

  private isDomainLargerThan(sort: number, numStores: number) {
    const manager = this.manager;
    let size = 1n;
    for (let index = 0; index < manager.getArrayArity(sort); index++) {
      const domain = manager.getSortParameters(sort)[index];
      if (manager.isUninterpretedSort(domain)) continue;
      const domainSize = manager.getSortSize(domain);
      if (domainSize === SORT_SIZE_INFINITE) return true;
      if (domainSize === SORT_SIZE_VERY_BIG) return false;
      size *= domainSize;
      if (size > BigInt(numStores)) return true;
    }
    return false;
  }

  // mk_eq(e, lhs, rhs, fmls): the equalities of lhs and rhs at each index that e stores to.
  private pushStoreEqs(store: number, lhs: number, rhs: number, eqs: number[]) {
    const manager = this.manager;
    for (let current = store; this.isOp(current, OP_STORE); current = manager.getArg(current, 0)) {
      const indices = manager.getArgs(current).slice(1, -1);
      const left = this.mkSelect([lhs, ...indices]);
      const right = this.mkSelect([rhs, ...indices]);
      eqs.push(manager.mkEq(left, right));
    }
  }

  private mkSelect(args: number[]) {
    const result = this.mkSelectCore(args);
    if (result === undefined) return this.mkApp(OP_SELECT, args);
    return typeof result === "number" ? result : result.expr;
  }

  private hasValueIndices(expr: number) {
    const manager = this.manager;
    for (let current = expr; this.isOp(current, OP_STORE); current = manager.getArg(current, 0))
      for (let index = 1; index + 1 < manager.getNumArgs(current); index++)
        if (!manager.isValue(manager.getArg(current, index))) return false;
    return true;
  }

  mkEqCore(inputLhs: number, inputRhs: number): Rewrite | undefined {
    const manager = this.manager;
    const isSwapped = this.isOp(inputRhs, OP_CONST_ARRAY) && this.isOp(inputLhs, OP_STORE);
    const lhs = isSwapped ? inputRhs : inputLhs;
    const rhs = isSwapped ? inputLhs : inputRhs;
    if (this.isOp(lhs, OP_CONST_ARRAY) && this.isOp(rhs, OP_CONST_ARRAY))
      return { expr: manager.mkEq(manager.getArg(lhs, 0), manager.getArg(rhs, 0)), depth: 1 };
    const left = this.getStoreBase(lhs);
    const right = this.getStoreBase(rhs);
    const sort = manager.sorts[lhs];
    if (
      this.isOp(left.base, OP_CONST_ARRAY) &&
      this.isOp(right.base, OP_CONST_ARRAY) &&
      this.isDomainLargerThan(sort, left.count + right.count)
    ) {
      const eqs: number[] = [];
      this.pushStoreEqs(lhs, lhs, rhs, eqs);
      this.pushStoreEqs(rhs, lhs, rhs, eqs);
      eqs.push(manager.mkEq(manager.getArg(left.base, 0), manager.getArg(right.base, 0)));
      return { expr: manager.mkAnd(eqs), depth: Infinity };
    }
    if (
      this.isOp(left.base, OP_CONST_ARRAY) &&
      this.isOp(right.base, OP_CONST_ARRAY) &&
      !(this.hasValueIndices(lhs) && this.hasValueIndices(rhs)) &&
      manager
        .getSortParameters(sort)
        .slice(0, -1)
        .some((domain) => manager.isUninterpretedSort(domain))
    )
      throw new SmtUnsupportedError("lambdas");
    return undefined;
  }
}
