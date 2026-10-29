// Ported from Z3 (src/ast/rewriter/var_subst.cpp), MIT license, see z3-license.txt. Substitution and
// shifting of de Bruijn variables.
import { KIND_APP, KIND_VAR, type AstManager } from "./ast";

// Rebuilds expr with each free variable replaced. replace gets the variable, its de Bruijn index
// relative to expr, and the number of binders above it.
export const replaceFreeVars = (
  manager: AstManager,
  expr: number,
  replace: (variable: number, index: number, shift: number) => number,
) => {
  const cache = new Map<number, number>();
  const visit = (current: number, shift: number): number => {
    if (manager.freeVarBounds[current] <= shift) return current;
    const key = current * 64 + shift;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const kind = manager.kinds[current];
    let result: number;
    if (kind === KIND_VAR) result = replace(current, manager.values[current] - shift, shift);
    else if (kind === KIND_APP)
      result = manager.mkApp(
        manager.decls[current],
        manager.args[current].map((arg) => visit(arg, shift)),
        manager.sorts[current],
      );
    else {
      const data = manager.getQuantifier(current);
      const innerShift = shift + data.sorts.length;
      result = manager.mkQuantifier({
        ...data,
        body: visit(data.body, innerShift),
        patterns: data.patterns.map((pattern) =>
          pattern.map((innerTerm) => visit(innerTerm, innerShift)),
        ),
      });
    }
    cache.set(key, result);
    return result;
  };
  return visit(expr, 0);
};

// var_shifter: a free variable with index at least bound moves by aboveShift, any other by
// belowShift.
export const shiftVars = (
  manager: AstManager,
  expr: number,
  bound: number,
  aboveShift: number,
  belowShift: number,
) =>
  aboveShift === 0 && belowShift === 0
    ? expr
    : replaceFreeVars(manager, expr, (variable, index, shift) =>
        manager.mkVar(
          index + shift + (index >= bound ? aboveShift : belowShift),
          manager.sorts[variable],
        ),
      );

// var_subst with std_order: (:var i) becomes bindings[n - 1 - i]. The bindings may contain
// variables. A variable beyond the bindings moves down by n - numKept.
export const substitute = (manager: AstManager, expr: number, bindings: number[], numKept = 0) => {
  const count = bindings.length;
  return replaceFreeVars(manager, expr, (variable, index, shift) =>
    index < count
      ? shiftVars(manager, bindings[count - 1 - index], 0, shift, 0)
      : manager.mkVar(index + shift - count + numKept, manager.sorts[variable]),
  );
};

// Which variables of a quantifier body occur, indexed by de Bruijn index.
export const collectUsedVars = (manager: AstManager, expr: number, count: number) => {
  const used = Array.from({ length: count }, () => false);
  replaceFreeVars(manager, expr, (variable, index) => {
    if (index < count) used[index] = true;
    return variable;
  });
  return used;
};
