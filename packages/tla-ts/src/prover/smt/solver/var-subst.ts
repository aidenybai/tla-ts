// Ported from Z3 (src/ast/rewriter/var_subst.cpp), MIT license, see z3-license.txt. Substitution and
// shifting of de Bruijn variables.
import { KIND_APP, KIND_QUANTIFIER, KIND_VAR, type AstManager, type SmtSymbol } from "./ast";
import { ExprSafeReplace } from "./expr-safe-replace";
import { BetaReducer } from "./rewriter-tpl";

// var_subst: substitutes args for the free variables, args[n - 1 - i] for (:var i) in standard
// order and args[i] otherwise, where -1 keeps the variable. Each result comes with a reference,
// which the caller releases.
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

  // ~var_subst.
  release() {
    this.reducer.release();
  }
}

// A term whose children replaceFreeVars is rebuilding: where its children's results start on the
// result stack, and the next child to visit.
interface ReplaceFrame {
  expr: number;
  shift: number;
  start: number;
  next: number;
}

// Rebuilds expr with each free variable replaced. replace gets the variable, its de Bruijn index
// relative to expr, and the number of binders above it. Like Z3's rewriter_tpl, it keeps its own
// stack, so deep terms do not exhaust the call stack.
export const replaceFreeVars = (
  manager: AstManager,
  expr: number,
  replace: (variable: number, index: number, shift: number) => number,
) => {
  const cache = new Map<number, number>();
  const frames: ReplaceFrame[] = [];
  const results: number[] = [];
  const visit = (current: number, shift: number) => {
    if (manager.freeVarBounds[current] <= shift) {
      results.push(current);
      return;
    }
    const key = current * 64 + shift;
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
    // A quantifier's children are its body and its patterns, under its binders.
    const numChildren = data === null ? manager.getNumArgs(current) : 1 + data.patterns.length;
    if (frame.next < numChildren) {
      const index = frame.next++;
      if (data === null) visit(manager.getArg(current, index), frame.shift);
      else
        visit(index === 0 ? data.body : data.patterns[index - 1], frame.shift + data.sorts.length);
      continue;
    }
    const children = results.splice(frame.start);
    const result =
      data === null
        ? manager.mkApp(manager.decls[current], children, manager.sorts[current])
        : manager.mkQuantifier({ ...data, body: children[0], patterns: children.slice(1) });
    frames.pop();
    cache.set(current * 64 + frame.shift, result);
    results.push(result);
  }
  return results[0];
};

// used_vars::process: the sort of each free variable of expr below count, indexed by de Bruijn
// index, undefined for a variable that does not occur. Like Z3, it walks the term without rebuilding
// it, and visits a shared term once for each number of binders above it.
export const getFreeVarSorts = (manager: AstManager, expr: number, count: number) => {
  const sorts: (number | undefined)[] = Array.from({ length: count }, () => undefined);
  const exprs = [expr];
  const deltas = [0];
  const visited = new Set<number>();
  for (let current = exprs.pop(); current !== undefined; current = exprs.pop()) {
    const delta = deltas.pop() ?? 0;
    if (manager.freeVarBounds[current] <= delta) continue;
    if (manager.getRefCount(current) > 1) {
      const key = current * 64 + delta;
      if (visited.has(key)) continue;
      visited.add(key);
    }
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) {
      const index = manager.values[current] - delta;
      if (index < count && sorts[index] === undefined) sorts[index] = manager.sorts[current];
    } else if (kind === KIND_APP)
      for (let index = 0; index < manager.getNumArgs(current); index++) {
        const arg = manager.getArg(current, index);
        exprs.push(arg);
        deltas.push(delta);
      }
    else {
      const data = manager.getQuantifier(current);
      for (const child of [data.body, ...data.patterns]) {
        exprs.push(child);
        deltas.push(delta + data.sorts.length);
      }
    }
  }
  return sorts;
};

// Which variables of a quantifier body occur, indexed by de Bruijn index.
export const collectUsedVars = (manager: AstManager, expr: number, count: number) =>
  getFreeVarSorts(manager, expr, count).map((sort) => sort !== undefined);

// unused_vars_eliminator: drops the variables that neither the body nor a pattern uses. Its
// var_subst keeps the cache of its last substitution until the next one.
export class UnusedVarsEliminator {
  private subst: VarSubst;

  constructor(private manager: AstManager) {
    this.subst = new VarSubst(manager, true);
  }

  // The result comes with a reference, which the caller releases.
  apply(expr: number) {
    const manager = this.manager;
    return manager.withoutTemporaries(() => {
      const data = manager.kinds[expr] === KIND_QUANTIFIER ? manager.getQuantifier(expr) : null;
      // ignore_patterns_on_ground_qbody: a ground body drops the patterns with the variables.
      const kept = data === null ? expr : manager.isGround(data.body) ? data.body : -1;
      if (kept !== -1 || data === null) {
        manager.incRef(kept);
        return kept;
      }
      // used_vars: the sort of each free variable of the body and the patterns.
      const usedSorts: (number | undefined)[] = [];
      for (const term of [data.body, ...data.patterns])
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
      // var_mapping: (:var i) becomes the variable it moves to, and an unused variable stays.
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
      const result =
        numRemoved === numDecls
          ? body
          : manager.mkQuantifier({ ...data, sorts: keptSorts, names: keptNames, body, patterns });
      if (result !== body) {
        manager.incRef(result);
        for (const pattern of patterns) manager.decRef(pattern);
        manager.decRef(body);
      }
      for (const variable of mapping) if (variable !== -1) manager.decRef(variable);
      return result;
    });
  }

  // ~unused_vars_eliminator.
  release() {
    this.subst.release();
  }
}

// elim_unused_vars: unused_vars_eliminator with a var_subst of its own. The result is a temporary.
export const elimUnusedVars = (manager: AstManager, expr: number) => {
  const eliminator = new UnusedVarsEliminator(manager);
  const result = eliminator.apply(expr);
  eliminator.release();
  manager.releaseLater(result);
  return result;
};
