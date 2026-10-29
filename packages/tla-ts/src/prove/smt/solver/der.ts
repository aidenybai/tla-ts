// Ported from Z3 (src/ast/rewriter/der.cpp), MIT license, see z3-license.txt. Destructive equality
// resolution: a quantified variable that a literal of the body defines is replaced by its
// definition.
import { KIND_QUANTIFIER, KIND_VAR, OP_EQ, SORT_BOOL, type AstManager } from "./ast";
import { flattenAnd, flattenOr } from "./ast-util";
import { collectUsedVars, elimUnusedVars, replaceFreeVars, shiftVars } from "./var-subst";

// Substitutes the variables with de Bruijn index i < map.length that have a definition in map,
// which may contain variables of the same scope, and keeps every other variable.
export const substitutePartial = (manager: AstManager, expr: number, map: (number | undefined)[]) =>
  replaceFreeVars(manager, expr, (variable, index, shift) => {
    const definition = index < map.length ? map[index] : undefined;
    return definition === undefined ? variable : shiftVars(manager, definition, 0, shift, 0);
  });

interface VarDefinition {
  index: number;
  definition: number;
}

// der::is_var_diseq for a universal quantifier and der::is_var_eq for an existential one.
const getVarDefinition = (
  manager: AstManager,
  literal: number,
  count: number,
  isForall: boolean,
): VarDefinition | undefined => {
  const isBoundVar = (term: number) =>
    manager.kinds[term] === KIND_VAR && manager.values[term] < count;
  const isNegatedVar = (term: number) => manager.isNot(term) && isBoundVar(manager.args[term][0]);
  const fromEq = (eq: number, isNegated: boolean): VarDefinition | undefined => {
    const sides = manager.args[eq];
    const isSwapped = !isBoundVar(sides[0]);
    const lhs = isSwapped ? sides[1] : sides[0];
    const rhs = isSwapped ? sides[0] : sides[1];
    if (!isBoundVar(lhs)) return undefined;
    return { index: manager.values[lhs], definition: isNegated ? manager.mkNot(rhs) : rhs };
  };
  if (isForall) {
    if (manager.isNot(literal) && manager.getOp(manager.args[literal][0]) === OP_EQ)
      return fromEq(manager.args[literal][0], false);
    if (manager.getOp(literal) === OP_EQ && manager.sorts[manager.args[literal][0]] === SORT_BOOL) {
      const found = fromEq(literal, true);
      if (found !== undefined) return found;
      const sides = manager.args[literal];
      const isSwapped = !isNegatedVar(sides[0]);
      const lhs = isSwapped ? sides[1] : sides[0];
      const rhs = isSwapped ? sides[0] : sides[1];
      return isNegatedVar(lhs)
        ? { index: manager.values[manager.args[lhs][0]], definition: rhs }
        : undefined;
    }
    if (isBoundVar(literal))
      return { index: manager.values[literal], definition: manager.falseExpr };
    if (isNegatedVar(literal))
      return { index: manager.values[manager.args[literal][0]], definition: manager.trueExpr };
    return undefined;
  }
  if (manager.getOp(literal) === OP_EQ) return fromEq(literal, false);
  if (isBoundVar(literal)) return { index: manager.values[literal], definition: manager.trueExpr };
  if (isNegatedVar(literal))
    return { index: manager.values[manager.args[literal][0]], definition: manager.falseExpr };
  return undefined;
};

export const isOccurring = (manager: AstManager, index: number, expr: number) =>
  collectUsedVars(manager, expr, index + 1)[index];

// der_sort_vars: the definitions in an order where each only uses the ones before it, dropping the
// definitions on a cycle.
export const getEliminationOrder = (manager: AstManager, definitions: (number | undefined)[]) => {
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
    for (const arg of manager.args[expr]) visit(arg);
    done.add(expr);
  };
  definitions.forEach((definition, index) => {
    if (definition !== undefined) visit(manager.mkVar(index, manager.sorts[definition]));
  });
  return order;
};

// der::reduce1: destructive equality resolution.
const reduceDer = (manager: AstManager, expr: number) => {
  const data = manager.getQuantifier(expr);
  const count = data.sorts.length;
  const single = getVarDefinition(manager, data.body, count, data.isForall);
  if (
    single !== undefined &&
    !manager.hasQuantifierFlags[single.definition] &&
    !isOccurring(manager, single.index, single.definition)
  )
    return data.isForall ? manager.falseExpr : manager.trueExpr;
  const literals = data.isForall
    ? flattenOr(manager, [data.body])
    : flattenAnd(manager, [data.body]);
  const definitions: (number | undefined)[] = [];
  const positions = literals.map((literal) => {
    const found = getVarDefinition(manager, literal, count, data.isForall);
    if (found === undefined || definitions[found.index] !== undefined) return -1;
    definitions[found.index] = found.definition;
    return found.index;
  });
  if (positions.every((position) => position === -1)) return expr;
  const order = getEliminationOrder(manager, definitions);
  if (order.length === 0) return expr;
  const substitution: (number | undefined)[] = [];
  for (const index of order) {
    const definition = definitions[index];
    if (definition !== undefined)
      substitution[index] = substitutePartial(manager, definition, substitution);
  }
  const kept = literals.filter((_literal, position) => {
    const index = positions[position];
    return index === -1 || definitions[index] === undefined;
  });
  const empty = data.isForall ? manager.falseExpr : manager.trueExpr;
  const combined =
    kept.length === 0
      ? empty
      : kept.length === 1
        ? kept[0]
        : data.isForall
          ? manager.mkOr(kept)
          : manager.mkAnd(kept);
  return manager.mkQuantifier({
    ...data,
    body: substitutePartial(manager, combined, substitution),
    patterns: data.patterns.map((pattern) =>
      pattern.map((term) => substitutePartial(manager, term, substitution)),
    ),
  });
};

// der::operator(): reduces until nothing changes, then drops the eliminated variables.
export const applyDer = (manager: AstManager, expr: number) => {
  let current = expr;
  for (
    let next = reduceDer(manager, current);
    next !== current;
    next = reduceDer(manager, current)
  ) {
    current = next;
    if (manager.kinds[current] !== KIND_QUANTIFIER) return current;
  }
  return current === expr ? expr : elimUnusedVars(manager, current);
};
