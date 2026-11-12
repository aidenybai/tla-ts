// Ported from Z3 (src/muz/base/hnf.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_IMPLIES,
  OP_OR,
  SORT_BOOL,
} from "../ast";
import { flattenAndVector, mkNot } from "../ast-util";
import { QuantifierHoister } from "../quant-hoist";
import { RefVector } from "../ref-vector";
import { mkForall, getUsedVars } from "./dl-rule";

export class Hnf {
  private name = "P";
  private sorts: number[] = [];
  private names: string[] = [];
  private todo: number[] = [];
  private memoizedDisjunctions = new Map<number, number>();
  freshPredicates: number[] = [];

  constructor(private manager: AstManager) {}

  setName(name: string) {
    this.name = name === "" ? "P" : name;
  }

  private isPredicate(expr: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_APP &&
      manager.sorts[expr] === SORT_BOOL &&
      manager.getFamily(expr) === FAMILY_USER
    );
  }

  private containsPredicate(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const kind = manager.kinds[current];
      if (kind === KIND_QUANTIFIER) todo.push(manager.getQuantifier(current).body);
      else if (kind === KIND_APP) {
        if (this.isPredicate(current)) return true;
        manager.pushArgs(current, todo);
      }
    }
    return false;
  }

  private isHorn(expr: number) {
    const manager = this.manager;
    let current = expr;
    while (manager.kinds[current] === KIND_QUANTIFIER && manager.getQuantifier(current).isForall)
      current = manager.getQuantifier(current).body;
    if (manager.getOp(current) !== OP_IMPLIES) return false;
    const premise = manager.getArg(current, 0);
    if (!this.isPredicate(manager.getArg(current, 1))) return false;
    if (manager.kinds[premise] === KIND_VAR) return true;
    if (manager.kinds[premise] === KIND_QUANTIFIER) return false;
    const args = manager.getOp(premise) === OP_AND ? manager.getArgs(premise) : [premise];
    return args.every((arg) => this.isPredicate(arg) || !this.containsPredicate(arg));
  }

  apply(expr: number) {
    this.freshPredicates = [];
    if (this.isHorn(expr)) return [expr];
    this.todo = [expr];
    this.memoizedDisjunctions.clear();
    const result: number[] = [];
    for (let fml = this.todo.pop(); fml !== undefined; fml = this.todo.pop()) {
      this.manager.limit.checkpoint();
      const horn = this.mkHorn(fml);
      if (horn !== -1) result.push(horn);
    }
    return result;
  }

  private pin(expr: number) {
    this.manager.incRef(expr);
    return expr;
  }

  private mkHorn(fml: number) {
    const manager = this.manager;
    this.sorts = [];
    this.names = [];
    const hoister = new QuantifierHoister(manager);
    let head = hoister.pullQuantifierBound(true, fml, this.sorts, this.names);
    hoister.release();
    const body = new RefVector(manager);
    while (manager.getOp(head) === OP_IMPLIES) {
      body.push(manager.getArg(head, 0));
      head = manager.getArg(head, 1);
    }
    flattenAndVector(manager, body);
    if (
      body.size === 1 &&
      manager.getOp(body.items[0]) === OP_OR &&
      this.containsPredicate(body.items[0])
    ) {
      for (const arg of manager.getArgs(body.items[0]))
        this.todo.push(this.pin(this.bindVariables(this.mkImplies([arg], head))));
      body.reset();
      return -1;
    }
    for (let index = 0; index < body.size; index++)
      body.set(index, this.eliminateDisjunctions(body.items[index]));
    for (let index = 0; index < body.size; index++)
      body.set(index, this.eliminateQuantifierBody(body.items[index]));
    const result = this.pin(this.bindVariables(this.mkImplies(body.items, head)));
    body.reset();
    return result;
  }

  private eliminateDisjunctions(expr: number) {
    const manager = this.manager;
    if (!this.containsPredicate(expr)) return expr;
    const disjuncts =
      manager.getOp(expr) === OP_OR
        ? manager.getArgs(expr)
        : manager.isNot(expr) && manager.getOp(manager.getArg(expr, 0)) === OP_AND
          ? manager.getArgs(manager.getArg(expr, 0)).map((arg) => manager.mkNot(arg))
          : manager.getOp(expr) === OP_IMPLIES
            ? [mkNot(manager, manager.getArg(expr, 0)), manager.getArg(expr, 1)]
            : undefined;
    if (disjuncts === undefined) return expr;
    const memoized = this.memoizedDisjunctions.get(expr);
    if (memoized !== undefined) return memoized;
    const head = this.pin(this.mkFreshHead(expr));
    for (const disjunct of disjuncts)
      this.todo.push(
        this.pin(this.bindVariables(manager.mkApp(OP_IMPLIES, [disjunct, head], SORT_BOOL))),
      );
    this.pin(expr);
    this.memoizedDisjunctions.set(expr, head);
    return head;
  }

  private eliminateQuantifierBody(expr: number) {
    const manager = this.manager;
    if (
      manager.kinds[expr] !== KIND_QUANTIFIER ||
      !manager.getQuantifier(expr).isForall ||
      !this.containsPredicate(expr)
    )
      return expr;
    const data = manager.getQuantifier(expr);
    if (this.isPredicate(data.body)) return expr;
    const head = this.mkFreshHead(data.body);
    this.todo.push(
      this.pin(this.bindVariables(manager.mkApp(OP_IMPLIES, [data.body, head], SORT_BOOL))),
    );
    return manager.mkQuantifier({ ...data, body: head });
  }

  private mkFreshHead(expr: number) {
    const manager = this.manager;
    const used = getUsedVars(manager, [expr]);
    const args: number[] = [];
    used.forEach((sort, index) => {
      if (sort !== undefined) args.push(manager.mkVar(index, sort));
    });
    const decl = manager.mkFreshFuncDecl(
      this.name,
      args.map((arg) => manager.sorts[arg]),
      SORT_BOOL,
      true,
      "",
    );
    manager.incDeclRef(decl);
    this.freshPredicates.push(decl);
    return manager.mkApp(decl, args, SORT_BOOL);
  }

  private mkImplies(body: readonly number[], head: number) {
    const manager = this.manager;
    return body.length === 0
      ? head
      : manager.mkApp(
          OP_IMPLIES,
          [body.length === 1 ? body[0] : manager.mkApp(OP_AND, [...body], SORT_BOOL), head],
          SORT_BOOL,
        );
  }

  private bindVariables(expr: number) {
    return this.sorts.length === 0 ? expr : mkForall(this.manager, this.sorts, this.names, expr);
  }
}
