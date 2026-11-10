// Ported from Z3 (src/tactic/bv/dt2bv_tactic.cpp, src/ast/rewriter/enum2bv_rewriter.cpp), MIT
// license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_VAR,
  OP_DISTINCT,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_ULEQ,
  SORT_BOOL,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import {
  getConstructorIndex,
  getDatatypeConstructors,
  getDatatypeDef,
  getNumConstructors,
  getRecognizerConstructor,
} from "./datatype-decl-plugin";
import { release } from "./expr-ref";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

const isEnumSort = (manager: AstManager, sort: number) =>
  manager.isDatatypeSort(sort) &&
  (getDatatypeDef(manager, sort)?.constructors.every(
    (constructor) => constructor.accessors.length === 0,
  ) ??
    false);

const getEnumBvSize = (manager: AstManager, sort: number) => {
  const numConstructors = getNumConstructors(manager, sort);
  let size = 1;
  while (2 ** size < numConstructors) size++;
  return size;
};

const mkEnumValue = (manager: AstManager, index: number, sort: number) =>
  manager.mkBvNumeral(BigInt(index), getEnumBvSize(manager, sort));

const constrainDomain = (manager: AstManager, bounds: RefVector, expr: number, sort: number) => {
  const domainSize = getNumConstructors(manager, sort);
  if ((domainSize & (domainSize - 1)) !== 0 || domainSize === 1)
    bounds.push(mkBvApp(manager, OP_ULEQ, [expr, mkEnumValue(manager, domainSize - 1, sort)]));
};

class Enum2BvRewriter extends RewriterTpl {
  readonly enumIndexes: ObjMap<number>;
  readonly enumConsts: number[] = [];
  readonly enumBvs: number[] = [];
  readonly enumDefs: RefVector;
  readonly bounds: RefVector;

  constructor(
    manager: AstManager,
    private fdSorts: Set<number>,
  ) {
    super(manager);
    this.enumIndexes = new ObjMap((decl) => manager.getDeclHash(decl));
    this.enumDefs = new RefVector(manager);
    this.bounds = new RefVector(manager);
  }

  private isFd(sort: number) {
    return isEnumSort(this.manager, sort) && this.fdSorts.has(sort);
  }

  private throwNonFd(expr: number): never {
    throw new SmtTacticError(
      `unable to handle nested data-type expression ${this.manager.toString(expr)}`,
    );
  }

  private reduceArg(arg: number) {
    const manager = this.manager;
    const sort = manager.sorts[arg];
    if (!this.isFd(sort)) return -1;
    const bvSort = manager.mkBvSort(getEnumBvSize(manager, sort));
    if (manager.kinds[arg] === KIND_VAR) return manager.mkVar(manager.values[arg], bvSort);
    const decl = manager.decls[arg];
    if (manager.funcDecls[decl].op === OP_DT_CONSTRUCTOR)
      return mkEnumValue(manager, getConstructorIndex(manager, decl), sort);
    if (!manager.isUninterpretedConst(arg)) this.throwNonFd(arg);
    const existing = this.enumIndexes.get(decl);
    if (existing !== undefined) return manager.mkApp(this.enumBvs[existing], [], bvSort);
    const fresh = manager.mkFreshConst(manager.funcDecls[decl].name, bvSort);
    constrainDomain(manager, this.bounds, fresh, sort);
    const constructors = getDatatypeConstructors(manager, sort);
    let def = manager.mkApp(constructors[constructors.length - 1], [], sort);
    for (let index = constructors.length - 2; index >= 0; index--)
      def = manager.mkApp(
        OP_ITE,
        [
          manager.mkEq(fresh, mkEnumValue(manager, index, sort)),
          manager.mkApp(constructors[index], [], sort),
          def,
        ],
        sort,
      );
    this.enumIndexes.set(decl, this.enumConsts.length);
    manager.incDeclRef(decl);
    this.enumConsts.push(decl);
    manager.incDeclRef(manager.decls[fresh]);
    this.enumBvs.push(manager.decls[fresh]);
    this.enumDefs.push(def);
    return fresh;
  }

  reduceApp(decl: number, args: number[]) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (decl === OP_EQ) {
      const first = this.reduceArg(args[0]);
      const second = first === -1 ? -1 : this.reduceArg(args[1]);
      if (second !== -1) {
        const result = manager.mkEq(first, second);
        manager.incRef(result);
        return result;
      }
    } else if (decl === OP_DISTINCT) {
      const reduced: number[] = [];
      for (const arg of args) {
        const reducedArg = this.reduceArg(arg);
        if (reducedArg === -1) break;
        reduced.push(reducedArg);
      }
      if (reduced.length === args.length) {
        const result = manager.mkApp(OP_DISTINCT, reduced, SORT_BOOL);
        manager.incRef(result);
        return result;
      }
    } else if (op === OP_DT_RECOGNISER || op === OP_DT_IS) {
      const reduced = this.reduceArg(args[0]);
      if (reduced !== -1) {
        const constructor = getRecognizerConstructor(manager, decl);
        const result = manager.mkEq(
          reduced,
          mkEnumValue(manager, getConstructorIndex(manager, constructor), manager.sorts[args[0]]),
        );
        manager.incRef(result);
        return result;
      }
    }
    for (const arg of args) if (this.isFd(manager.sorts[arg])) this.throwNonFd(arg);
    return -1;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const numDecls = data.sorts.length;
    const bounds = new RefVector(manager);
    let isFound = false;
    const sorts = data.sorts.map((sort, index) => {
      if (!this.isFd(sort)) return sort;
      const bvSort = manager.mkBvSort(getEnumBvSize(manager, sort));
      constrainDomain(manager, bounds, manager.mkVar(numDecls - index - 1, bvSort), sort);
      isFound = true;
      return bvSort;
    });
    if (!isFound) return -1;
    if (bounds.size > 0 && !data.isForall) bounds.push(body);
    const newBody =
      bounds.size === 0
        ? body
        : data.isForall
          ? manager.mkApp(OP_IMPLIES, [manager.mkAnd(bounds.items), body], SORT_BOOL)
          : manager.mkAnd(bounds.items);
    const result = manager.mkQuantifier({
      ...data,
      sorts,
      body: newBody,
      patterns,
      noPatterns: [],
    });
    manager.incRef(result);
    bounds.reset();
    return result;
  }

  // ~imp: the rewriter goes before the vectors.
  release() {
    const manager = this.manager;
    super.release();
    this.enumDefs.reset();
    for (const decl of this.enumBvs) manager.decDeclRef(decl);
    for (const decl of this.enumConsts) manager.decDeclRef(decl);
    this.bounds.reset();
  }
}

export const createDt2BvTactic = (manager: AstManager) => {
  const fdSorts = new Set<number>();
  const nonFdSorts = new Set<number>();
  const isFd = (expr: number) => isEnumSort(manager, manager.sorts[expr]);
  const argsCannotBeFd = (expr: number) => {
    for (const arg of manager.getArgs(expr)) if (isFd(arg)) nonFdSorts.add(manager.sorts[arg]);
  };
  return (goal: Goal) => {
    const visited = new Set<number>();
    const todo = [...goal.forms.items];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      const kind = manager.kinds[expr];
      if (kind === KIND_VAR) {
        if (isFd(expr)) fdSorts.add(manager.sorts[expr]);
        continue;
      }
      if (kind !== KIND_APP) {
        const data = manager.getQuantifier(expr);
        todo.push(data.body, ...data.patterns, ...data.noPatterns);
        continue;
      }
      manager.pushArgs(expr, todo);
      const decl = manager.decls[expr];
      const op = manager.funcDecls[decl].op;
      if (decl === OP_EQ || decl === OP_DISTINCT) continue;
      if ((op === OP_DT_RECOGNISER || op === OP_DT_IS) && isFd(manager.getArg(expr, 0)))
        fdSorts.add(manager.sorts[manager.getArg(expr, 0)]);
      else if (isFd(expr) && manager.getNumArgs(expr) > 0) {
        nonFdSorts.add(manager.sorts[expr]);
        argsCannotBeFd(expr);
      } else if (isFd(expr)) fdSorts.add(manager.sorts[expr]);
      else argsCannotBeFd(expr);
    }
    for (const sort of nonFdSorts) fdSorts.delete(sort);
    if (fdSorts.size > 0) {
      const rewriter = new Enum2BvRewriter(manager, fdSorts);
      let rewritten = -1;
      const size = goal.forms.size;
      for (let index = 0; index < size && !goal.isInconsistent; index++) {
        const next = rewriter.rewrite(goal.forms.items[index]);
        release(manager, rewritten);
        rewritten = next;
        goal.update(index, rewritten);
      }
      const bounds = new RefVector(manager);
      for (const bound of rewriter.bounds.items) bounds.push(bound);
      rewriter.bounds.reset();
      for (const bound of bounds.items) goal.assert(bound);
      const definitions: Definition[] = [];
      for (const entry of rewriter.enumIndexes)
        definitions.push({ decl: rewriter.enumBvs[entry[1]], def: -1 });
      for (const entry of rewriter.enumIndexes)
        definitions.push({ decl: entry[0], def: rewriter.enumDefs.items[entry[1]] });
      goal.addDefinitions(definitions);
      bounds.reset();
      release(manager, rewritten);
      rewriter.release();
    }
    goal.depth++;
    return [goal];
  };
};
