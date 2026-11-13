// Ported from Z3 (src/ast/rewriter/der.cpp), MIT license, see z3-license.txt.
import {
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_EQ,
  SORT_BOOL,
  type AstManager,
  QUANTIFIER_FORALL,
  QUANTIFIER_LAMBDA,
} from "./ast";
import { flattenAndVector, flattenOrVector } from "./ast-util";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";
import { collectUsedVars, elimUnusedVars, VarSubst } from "./var-subst";

interface VarDefinition {
  index: number;
  definition: number;
}

const getVarDefinition = (
  manager: AstManager,
  literal: number,
  count: number,
  isForall: boolean,
): VarDefinition | undefined => {
  const isBoundVar = (term: number) =>
    manager.kinds[term] === KIND_VAR && manager.values[term] < count;
  const isNegatedVar = (term: number) => manager.isNot(term) && isBoundVar(manager.getArg(term, 0));
  const fromEq = (eq: number, isNegated: boolean): VarDefinition | undefined => {
    const isSwapped = !isBoundVar(manager.getArg(eq, 0));
    const lhs = isSwapped ? manager.getArg(eq, 1) : manager.getArg(eq, 0);
    const rhs = isSwapped ? manager.getArg(eq, 0) : manager.getArg(eq, 1);
    if (!isBoundVar(lhs)) return undefined;
    return { index: manager.values[lhs], definition: isNegated ? manager.mkNot(rhs) : rhs };
  };
  if (isForall) {
    if (manager.isNot(literal) && manager.getOp(manager.getArg(literal, 0)) === OP_EQ)
      return fromEq(manager.getArg(literal, 0), false);
    if (
      manager.getOp(literal) === OP_EQ &&
      manager.sorts[manager.getArg(literal, 0)] === SORT_BOOL
    ) {
      const found = fromEq(literal, true);
      if (found !== undefined) return found;
      const isSwapped = !isNegatedVar(manager.getArg(literal, 0));
      const lhs = isSwapped ? manager.getArg(literal, 1) : manager.getArg(literal, 0);
      const rhs = isSwapped ? manager.getArg(literal, 0) : manager.getArg(literal, 1);
      return isNegatedVar(lhs)
        ? { index: manager.values[manager.getArg(lhs, 0)], definition: rhs }
        : undefined;
    }
    if (isBoundVar(literal))
      return { index: manager.values[literal], definition: manager.falseExpr };
    if (isNegatedVar(literal))
      return { index: manager.values[manager.getArg(literal, 0)], definition: manager.trueExpr };
    return undefined;
  }
  if (manager.getOp(literal) === OP_EQ) return fromEq(literal, false);
  if (isBoundVar(literal)) return { index: manager.values[literal], definition: manager.trueExpr };
  if (isNegatedVar(literal))
    return { index: manager.values[manager.getArg(literal, 0)], definition: manager.falseExpr };
  return undefined;
};

export const isOccurring = (manager: AstManager, index: number, expr: number) =>
  collectUsedVars(manager, expr, index + 1)[index];

const getEliminationOrder = (manager: AstManager, definitions: (number | undefined)[]) => {
  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    if (
      definition !== undefined &&
      (manager.hasQuantifierFlags[definition] || isOccurring(manager, index, definition))
    )
      definitions[index] = undefined;
  }
  const order: number[] = [];
  const visiting = new Set<number>();
  const done = new Set<number>();
  const visit = (expr: number) => {
    if (done.has(expr)) return;
    if (manager.kinds[expr] === KIND_VAR) {
      const index = manager.values[expr];
      const definition = index < definitions.length ? definitions[index] : undefined;
      if (definition !== undefined && visiting.has(expr)) {
        visiting.delete(expr);
        definitions[index] = undefined;
      } else if (definition !== undefined) {
        visiting.add(expr);
        visit(definition);
        if (definitions[index] !== undefined) {
          visiting.delete(expr);
          order.push(index);
        }
      }
      done.add(expr);
      return;
    }
    for (let index = 0; index < manager.getNumArgs(expr); index++) {
      visit(manager.getArg(expr, index));
    }
    done.add(expr);
  };
  definitions.forEach((definition, index) => {
    if (definition !== undefined) visit(manager.mkVar(index, manager.sorts[definition]));
  });
  return order;
};

export class Der {
  private subst: VarSubst;
  private map: RefVector;
  private substMap: RefVector;
  private newArgs: RefVector;

  constructor(private manager: AstManager) {
    this.subst = new VarSubst(manager, true);
    this.map = new RefVector(manager);
    this.substMap = new RefVector(manager);
    this.newArgs = new RefVector(manager);
  }

  apply(expr: number) {
    const manager = this.manager;
    let current = expr;
    for (let next = this.reduce(current); next !== current; next = this.reduce(current)) {
      current = next;
      if (manager.kinds[current] !== KIND_QUANTIFIER) return current;
    }
    return current === expr ? expr : elimUnusedVars(manager, current);
  }

  release() {
    this.newArgs.reset();
    this.substMap.reset();
    this.map.reset();
    this.subst.release();
  }

  private reduce(expr: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (data.kind === QUANTIFIER_LAMBDA) return expr;
    const count = data.sorts.length;
    const single = getVarDefinition(manager, data.body, count, data.kind === QUANTIFIER_FORALL);
    if (
      single !== undefined &&
      !manager.hasQuantifierFlags[single.definition] &&
      !isOccurring(manager, single.index, single.definition)
    )
      return data.kind === QUANTIFIER_FORALL ? manager.falseExpr : manager.trueExpr;
    const vector = new RefVector(manager);
    manager.withoutTemporaries(() => {
      vector.push(data.body);
      if (data.kind === QUANTIFIER_FORALL) flattenOrVector(manager, vector);
      else flattenAndVector(manager, vector);
    });
    const result = this.reduceLiterals(expr, vector.items);
    vector.reset();
    return result;
  }

  private reduceLiterals(expr: number, literals: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const count = data.sorts.length;
    const map = this.map;
    map.reset();
    const positions = literals.map((literal) => {
      const found = getVarDefinition(manager, literal, count, data.kind === QUANTIFIER_FORALL);
      if (found === undefined || (map.items[found.index] ?? -1) !== -1) return -1;
      if (map.size <= found.index) map.resize(found.index + 1);
      map.set(found.index, found.definition);
      return found.index;
    });
    if (positions.every((position) => position === -1)) return expr;
    const definitions = map.items.map((definition) => (definition === -1 ? undefined : definition));
    const order = getEliminationOrder(manager, definitions);
    definitions.forEach((definition, index) => {
      if (definition === undefined && map.items[index] !== -1) map.set(index, -1);
    });
    if (order.length === 0) return expr;
    const size = map.size;
    const substMap = this.substMap;
    substMap.reset();
    substMap.resize(size);
    for (const index of order)
      substMap.setOwned(size - index - 1, this.subst.apply(map.items[index], substMap.items));
    this.newArgs.reset();
    literals.forEach((literal, position) => {
      const index = positions[position];
      if (index === -1 || map.items[index] === -1) this.newArgs.push(literal);
    });
    const kept = this.newArgs.items;
    const empty = data.kind === QUANTIFIER_FORALL ? manager.falseExpr : manager.trueExpr;
    const combined = manager.withoutTemporaries(() =>
      kept.length === 0
        ? empty
        : kept.length === 1
          ? kept[0]
          : data.kind === QUANTIFIER_FORALL
            ? manager.mkOr(kept)
            : manager.mkAnd(kept),
    );
    manager.incRef(combined);
    const body = this.subst.apply(combined, substMap.items);
    const patterns = data.patterns.map((pattern) => this.subst.apply(pattern, substMap.items));
    const noPatterns = data.noPatterns.map((noPattern) =>
      this.subst.apply(noPattern, substMap.items),
    );
    const result = manager.mkQuantifier({ ...data, body, patterns, noPatterns });
    for (const pattern of [...patterns, ...noPatterns]) manager.releaseLater(pattern);
    manager.releaseLater(body);
    manager.decRef(combined);
    return result;
  }
}

// der_rewriter: der on every quantifier of an expression.
export class DerRewriter extends RewriterTpl {
  readonly der: Der;

  constructor(manager: AstManager) {
    super(manager);
    this.der = new Der(manager);
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    return manager.withTemporaries(() =>
      this.der.apply(manager.mkQuantifier({ ...manager.getQuantifier(expr), body, patterns })),
    );
  }
}
