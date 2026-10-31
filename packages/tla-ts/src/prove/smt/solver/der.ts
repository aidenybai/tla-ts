// Ported from Z3 (src/ast/rewriter/der.cpp), MIT license, see z3-license.txt. Destructive equality
// resolution: a quantified variable that a literal of the body defines is replaced by its
// definition.
import { KIND_QUANTIFIER, KIND_VAR, OP_EQ, SORT_BOOL, type AstManager } from "./ast";
import { flattenAndVector, flattenOrVector } from "./ast-util";
import { RefVector } from "./ref-vector";
import { collectUsedVars, elimUnusedVars, VarSubst } from "./var-subst";

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

// der: destructive equality resolution. Its var_subst keeps the cache of its last substitution until
// the next one.
export class Der {
  private subst: VarSubst;

  constructor(private manager: AstManager) {
    this.subst = new VarSubst(manager, true);
  }

  // der::operator(): reduces until nothing changes, then drops the eliminated variables. The result
  // is a temporary.
  apply(expr: number) {
    const manager = this.manager;
    let current = expr;
    for (let next = this.reduce(current); next !== current; next = this.reduce(current)) {
      current = next;
      if (manager.kinds[current] !== KIND_QUANTIFIER) return current;
    }
    return current === expr ? expr : elimUnusedVars(manager, current);
  }

  // ~der.
  release() {
    this.subst.release();
  }

  // der::reduce1.
  private reduce(expr: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const count = data.sorts.length;
    const single = getVarDefinition(manager, data.body, count, data.isForall);
    if (
      single !== undefined &&
      !manager.hasQuantifierFlags[single.definition] &&
      !isOccurring(manager, single.index, single.definition)
    )
      return data.isForall ? manager.falseExpr : manager.trueExpr;
    // The literals vector holds its expressions until reduce1 returns, and releases them in order.
    const vector = new RefVector(manager);
    manager.withoutTemporaries(() => {
      vector.push(data.body);
      if (data.isForall) flattenOrVector(manager, vector);
      else flattenAndVector(manager, vector);
    });
    const result = this.reduceLiterals(expr, vector.items);
    vector.reset();
    return result;
  }

  // The rest of der::reduce1, on the flattened literals of the body.
  private reduceLiterals(expr: number, literals: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const count = data.sorts.length;
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
    // create_substitution: (:var i) becomes the entry at size - i - 1, with the definitions before it
    // in the order substituted.
    const size = definitions.length;
    const substMap: number[] = Array.from({ length: size }, () => -1);
    for (const index of order)
      substMap[size - index - 1] = this.subst.apply(definitions[index] as number, substMap);
    // apply_substitution holds the junction of the kept literals until it returns.
    const kept = literals.filter((_literal, position) => {
      const index = positions[position];
      return index === -1 || definitions[index] === undefined;
    });
    const empty = data.isForall ? manager.falseExpr : manager.trueExpr;
    const combined = manager.withoutTemporaries(() =>
      kept.length === 0
        ? empty
        : kept.length === 1
          ? kept[0]
          : data.isForall
            ? manager.mkOr(kept)
            : manager.mkAnd(kept),
    );
    manager.incRef(combined);
    const body = this.subst.apply(combined, substMap);
    const patterns = data.patterns.map((pattern) => this.subst.apply(pattern, substMap));
    const result = manager.mkQuantifier({ ...data, body, patterns });
    for (const pattern of patterns) manager.releaseLater(pattern);
    manager.releaseLater(body);
    manager.decRef(combined);
    // m_subst_map holds the definitions until the next substitution.
    for (const definition of substMap) if (definition !== -1) manager.releaseLater(definition);
    return result;
  }
}
