// Ported from Z3 (src/ast/rewriter/var_subst.cpp), MIT license, see z3-license.txt.
import { KIND_APP, KIND_QUANTIFIER, KIND_VAR, type AstManager, type SmtSymbol } from "./ast";
import { ExprSafeReplace } from "./expr-safe-replace";
import { BetaReducer } from "./rewriter-tpl";

export class VarSubst {
  private reducer: BetaReducer;

  constructor(
    private manager: AstManager,
    private isStdOrder: boolean,
  ) {
    this.reducer = new BetaReducer(manager);
  }

  apply(expr: number, args: number[]) {
    const manager = this.manager;
    const count = args.length;
    if (manager.isGroundApp(expr) || count === 0) {
      manager.incRef(expr);
      return expr;
    }
    if (manager.hasQuantifierFlags[expr]) {
      const replace = new ExprSafeReplace(manager);
      args.forEach((arg, index) => {
        if (arg !== -1)
          replace.insert(
            manager.mkVar(this.isStdOrder ? count - index - 1 : index, manager.sorts[arg]),
            arg,
          );
      });
      const result = replace.apply(expr);
      replace.release();
      return result;
    }
    if (
      manager.kinds[expr] === KIND_APP &&
      manager.everyArg(expr, (arg) => manager.isGroundApp(arg) || manager.kinds[arg] === KIND_VAR)
    ) {
      const result = manager.mkApp(
        manager.decls[expr],
        manager.mapArgs(expr, (arg) => {
          if (manager.isGroundApp(arg)) return arg;
          const index = manager.values[arg];
          const replaced =
            index < count ? (this.isStdOrder ? args[count - index - 1] : args[index]) : -1;
          return replaced === -1 ? arg : replaced;
        }),
        manager.sorts[expr],
      );
      manager.incRef(result);
      return result;
    }
    this.reducer.reset();
    if (this.isStdOrder) this.reducer.setInvBindings(args);
    else this.reducer.setBindings(args);
    return this.reducer.rewrite(expr);
  }

  release() {
    this.reducer.release();
  }
}

interface ReplaceFrame {
  expr: number;
  shift: number;
  start: number;
  next: number;
}

export const replaceFreeVars = (
  manager: AstManager,
  expr: number,
  replace: (variable: number, index: number, shift: number) => number,
) => {
  const cache = new Map<number, number>();
  const numNodes = manager.kinds.length;
  const frames: ReplaceFrame[] = [];
  const results: number[] = [];
  const visit = (current: number, shift: number) => {
    if (manager.freeVarBounds[current] <= shift) {
      results.push(current);
      return;
    }
    const key = shift * numNodes + current;
    const cached = cache.get(key);
    if (cached !== undefined) results.push(cached);
    else if (manager.kinds[current] !== KIND_VAR)
      frames.push({ expr: current, shift, start: results.length, next: 0 });
    else {
      const result = replace(current, manager.values[current] - shift, shift);
      cache.set(key, result);
      results.push(result);
    }
  };
  visit(expr, 0);
  while (frames.length > 0) {
    const frame = frames[frames.length - 1];
    const current = frame.expr;
    const data = manager.kinds[current] === KIND_QUANTIFIER ? manager.getQuantifier(current) : null;
    const quantifierChildren =
      data === null ? [] : [data.body, ...data.patterns, ...data.noPatterns];
    const numChildren = data === null ? manager.getNumArgs(current) : quantifierChildren.length;
    if (frame.next < numChildren) {
      const index = frame.next++;
      if (data === null) visit(manager.getArg(current, index), frame.shift);
      else visit(quantifierChildren[index], frame.shift + data.sorts.length);
      continue;
    }
    const children = results.splice(frame.start);
    const result =
      data === null
        ? manager.mkApp(manager.decls[current], children, manager.sorts[current])
        : children.every((child, index) => child === quantifierChildren[index])
          ? current
          : manager.mkQuantifier({
              ...data,
              body: children[0],
              patterns: children.slice(1, 1 + data.patterns.length),
              noPatterns: [],
            });
    frames.pop();
    cache.set(frame.shift * numNodes + current, result);
    results.push(result);
  }
  return results[0];
};

export const getFreeVarSorts = (manager: AstManager, expr: number, count: number) => {
  const sorts: (number | undefined)[] = Array.from({ length: count }, () => undefined);
  const exprs = [expr];
  const deltas = [0];
  const visited = new Set<number>();
  for (let current = exprs.pop(); current !== undefined; current = exprs.pop()) {
    const delta = deltas.pop() ?? 0;
    if (manager.freeVarBounds[current] <= delta) continue;
    if (manager.getRefCount(current) > 1) {
      const key = delta * manager.kinds.length + current;
      if (visited.has(key)) continue;
      visited.add(key);
    }
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) {
      const index = manager.values[current] - delta;
      if (index < count && sorts[index] === undefined) sorts[index] = manager.sorts[current];
    } else if (kind === KIND_APP)
      for (let index = 0; index < manager.getNumArgs(current); index++) {
        exprs.push(manager.getArg(current, index));
        deltas.push(delta);
      }
    else {
      const data = manager.getQuantifier(current);
      for (const child of [data.body, ...data.patterns, ...data.noPatterns]) {
        exprs.push(child);
        deltas.push(delta + data.sorts.length);
      }
    }
  }
  return sorts;
};

export const collectUsedVars = (manager: AstManager, expr: number, count: number) =>
  getFreeVarSorts(manager, expr, count).map((sort) => sort !== undefined);

export class UnusedVarsEliminator {
  private subst: VarSubst;

  constructor(private manager: AstManager) {
    this.subst = new VarSubst(manager, true);
  }

  apply(expr: number) {
    const manager = this.manager;
    return manager.withoutTemporaries(() => {
      const data =
        manager.kinds[expr] === KIND_QUANTIFIER && !manager.isLambda(expr)
          ? manager.getQuantifier(expr)
          : null;
      const kept = data === null ? expr : manager.isGround(data.body) ? data.body : -1;
      if (kept !== -1 || data === null) {
        manager.incRef(kept);
        return kept;
      }
      const usedSorts: (number | undefined)[] = [];
      for (const term of [data.body, ...data.patterns, ...data.noPatterns])
        getFreeVarSorts(manager, term, manager.freeVarBounds[term]).forEach((sort, index) => {
          if (sort !== undefined) usedSorts[index] = sort;
        });
      const numDecls = data.sorts.length;
      if (usedSorts.slice(0, numDecls).filter((sort) => sort !== undefined).length === numDecls) {
        manager.incRef(expr);
        return expr;
      }
      const keptSorts: number[] = [];
      const keptNames: SmtSymbol[] = [];
      data.sorts.forEach((sort, index) => {
        if (usedSorts[numDecls - index - 1] === undefined) return;
        keptSorts.push(sort);
        keptNames.push(data.names[index]);
      });
      const mapping: number[] = [];
      let numRemoved = 0;
      for (let index = 0; index < Math.max(numDecls, usedSorts.length); index++) {
        const sort = usedSorts[index];
        if (sort === undefined) {
          if (index < numDecls) numRemoved++;
          mapping.push(-1);
          continue;
        }
        const variable = manager.mkVar(index - numRemoved, sort);
        manager.incRef(variable);
        mapping.push(variable);
      }
      mapping.reverse();
      const body = this.subst.apply(data.body, mapping);
      const patterns =
        numRemoved === numDecls
          ? []
          : data.patterns.map((pattern) => this.subst.apply(pattern, mapping));
      const noPatterns =
        numRemoved === numDecls
          ? []
          : data.noPatterns.map((noPattern) => this.subst.apply(noPattern, mapping));
      const result =
        numRemoved === numDecls
          ? body
          : manager.mkQuantifier({
              ...data,
              sorts: keptSorts,
              names: keptNames,
              body,
              patterns,
              noPatterns,
            });
      if (result !== body) {
        manager.incRef(result);
        for (const pattern of [...patterns, ...noPatterns]) manager.decRef(pattern);
        manager.decRef(body);
      }
      for (const variable of mapping) if (variable !== -1) manager.decRef(variable);
      return result;
    });
  }

  release() {
    this.subst.release();
  }
}

export const elimUnusedVars = (manager: AstManager, expr: number) => {
  const eliminator = new UnusedVarsEliminator(manager);
  const result = eliminator.apply(expr);
  eliminator.release();
  manager.releaseLater(result);
  return result;
};
