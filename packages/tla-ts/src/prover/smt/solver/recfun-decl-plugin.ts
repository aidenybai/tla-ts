import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_FUN_DEFINED,
  OP_ITE,
  OP_NOT,
  type RecFunDef,
  SORT_BOOL,
} from "./ast";
import { ExprSafeReplace } from "./expr-safe-replace";
import { ObjMap } from "./hashtable";

const getChildren = (manager: AstManager, expr: number, isUnderQuantifiers: boolean) =>
  manager.kinds[expr] === KIND_QUANTIFIER
    ? isUnderQuantifiers
      ? [manager.getQuantifier(expr).body]
      : []
    : manager.kinds[expr] === KIND_APP
      ? manager.getArgs(expr)
      : [];

// subterms::all goes under quantifiers, and subterms::ground does not.
export const getSubterms = (manager: AstManager, expr: number, isUnderQuantifiers = true) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    todo.push(...getChildren(manager, current, isUnderQuantifiers));
  }
  return [...visited];
};

// Whether a subterm of the roots satisfies the predicate, which the walk calls in no particular
// order.
export const hasSubterm = (
  manager: AstManager,
  roots: readonly number[],
  predicate: (term: number) => boolean,
  isUnderQuantifiers = true,
) => {
  const visited = new Set<number>();
  const todo = [...roots];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (predicate(current)) return true;
    if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    else if (isUnderQuantifiers && manager.kinds[current] === KIND_QUANTIFIER)
      todo.push(manager.getQuantifier(current).body);
  }
  return false;
};

export const isDefinedApp = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_FUN_DEFINED;

export const containsDef = (manager: AstManager, expr: number) =>
  hasSubterm(manager, [expr], (term) => isDefinedApp(manager, term), false);

// An ite on a condition without a defined function, with one in a branch.
const containsIte = (manager: AstManager, expr: number) =>
  hasSubterm(
    manager,
    [expr],
    (term) =>
      manager.getOp(term) === OP_ITE &&
      !containsDef(manager, manager.getArg(term, 0)) &&
      containsDef(manager, term),
    false,
  );

interface ChoiceList {
  ite: number;
  isPositive: boolean;
  next: ChoiceList | null;
}

interface ExprList {
  expr: number;
  next: ExprList | null;
}

interface Branch {
  path: ChoiceList | null;
  toSplit: ExprList | null;
  toUnfold: ExprList | null;
}

const addCase = (
  manager: AstManager,
  def: RecFunDef,
  guards: number[],
  rhs: number,
  isImmediate: boolean,
) => {
  for (const guard of guards) manager.incRef(guard);
  manager.incRef(rhs);
  def.cases.push({
    pred: manager.mkRecFunCasePredDecl(def.decl, def.cases.length),
    guards,
    rhs,
    isImmediate,
    def,
  });
};

// convert_path: the conditions of the choices, the last first, and the substitution of each ite by
// its branch.
const convertPath = (manager: AstManager, path: ChoiceList | null, subst: ExprSafeReplace) => {
  const conditions: number[] = [];
  for (let choice = path; choice !== null; choice = choice.next) {
    const condition = manager.getArg(choice.ite, 0);
    conditions.push(choice.isPositive ? condition : manager.mkApp(OP_NOT, [condition], SORT_BOOL));
    const target = subst.apply(manager.getArg(choice.ite, choice.isPositive ? 1 : 2));
    subst.insert(choice.ite, target);
    manager.decRef(target);
  }
  return conditions;
};

// def::compute_cases: a case for each path through the ites whose branches call a defined
// function, with the conditions on the path as its guards.
const computeCases = (manager: AstManager, def: RecFunDef, isMacro: boolean, rhs: number) => {
  manager.incRef(rhs);
  def.rhs = rhs;
  if (isMacro || manager.funcDecls[def.decl].domain.length === 0 || !containsIte(manager, rhs)) {
    addCase(manager, def, [], rhs, false);
    return;
  }
  const branches: Branch[] = [{ path: null, toSplit: null, toUnfold: { expr: rhs, next: null } }];
  for (let branch = branches.pop(); branch !== undefined; branch = branches.pop()) {
    while (branch.toUnfold !== null) {
      const stack = [branch.toUnfold.expr];
      branch.toUnfold = branch.toUnfold.next;
      for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
        if (manager.getOp(expr) === OP_ITE) {
          if (containsDef(manager, manager.getArg(expr, 0))) continue;
          if (
            !containsDef(manager, manager.getArg(expr, 1)) &&
            !containsDef(manager, manager.getArg(expr, 2))
          )
            continue;
          branch.toSplit = { expr, next: branch.toSplit };
        } else if (manager.kinds[expr] === KIND_APP)
          for (const arg of manager.getArgs(expr)) if (containsIte(manager, arg)) stack.push(arg);
      }
    }
    if (branch.toSplit !== null) {
      const ite = branch.toSplit.expr;
      const toSplit = branch.toSplit.next;
      const condition = manager.getArg(ite, 0);
      const mkBranch = (isPositive: boolean): Branch => ({
        path: { ite, isPositive, next: branch.path },
        toSplit,
        toUnfold: {
          expr: condition,
          next: { expr: manager.getArg(ite, isPositive ? 1 : 2), next: branch.toUnfold },
        },
      });
      branches.push(mkBranch(false), mkBranch(true));
      continue;
    }
    manager.withTemporaries(
      () => {
        const subst = new ExprSafeReplace(manager);
        const conditions = convertPath(manager, branch.path, subst);
        const caseRhs = subst.apply(rhs);
        const guards = conditions.map((condition) => subst.apply(condition));
        subst.release();
        const isImmediate = !hasSubterm(manager, [caseRhs], (term) => isDefinedApp(manager, term));
        addCase(manager, def, guards, caseRhs, isImmediate);
        manager.decRef(caseRhs);
        for (const guard of guards) manager.decRef(guard);
      },
      () => [],
    );
  }
};

// compute_scores: the number of ites on the paths from the root to each subterm. The scores are in
// an obj_map, whose order decides which of the ites with the highest score redirect_ite takes.
const computeScores = (manager: AstManager, expr: number) => {
  const parents = new Map<number, number[]>([[expr, []]]);
  const byDepth = new Map<number, number[]>();
  for (const term of getSubterms(manager, expr, false)) {
    if (manager.kinds[term] === KIND_APP)
      for (const arg of manager.getArgs(term)) {
        const argParents = parents.get(arg) ?? [];
        argParents.push(term);
        parents.set(arg, argParents);
      }
    const depth = manager.depths[term];
    byDepth.set(depth, [...(byDepth.get(depth) ?? []), term]);
  }
  const scores = new ObjMap<number>((term) => manager.hashes[term]);
  scores.set(expr, 0);
  for (let depth = manager.depths[expr]; depth > 0; depth--)
    for (const term of byDepth.get(depth) ?? []) {
      const score = (parents.get(term) ?? []).reduce(
        (sum, parent) => sum + (scores.get(parent) ?? 0),
        0,
      );
      scores.set(term, manager.getOp(term) === OP_ITE ? score + 1 : score);
    }
  return scores;
};

// redirect_ite: an ite under more than four others that calls a defined function becomes a fresh
// function, so that the cases do not multiply.
const redirectIte = (manager: AstManager, def: RecFunDef, rhs: number) => {
  const domain = manager.funcDecls[def.decl].domain;
  const vars = domain.map((sort, index) => manager.mkVar(domain.length - 1 - index, sort));
  for (const variable of vars) manager.incRef(variable);
  let result = rhs;
  manager.incRef(result);
  for (;;) {
    let maxScore = 0;
    let maxExpr = -1;
    for (const [term, score] of computeScores(manager, result))
      if (manager.getOp(term) === OP_ITE && score > maxScore && containsDef(manager, term)) {
        maxExpr = term;
        maxScore = score;
      }
    if (maxScore <= 4) break;
    // mk_fresh_id gives the id after the increment.
    const decl = manager.mkRecFuncDecl(
      `fold-rec-${manager.mkFreshId() + 1}`,
      domain,
      manager.sorts[maxExpr],
    );
    const newBody = manager.mkApp(decl, vars, manager.sorts[maxExpr]);
    manager.incRef(newBody);
    setRecFunDefinition(manager, manager.recFunDefs.get(decl)!, false, maxExpr);
    const subst = new ExprSafeReplace(manager);
    subst.insert(maxExpr, newBody);
    const replaced = subst.apply(result);
    subst.release();
    manager.decRef(newBody);
    manager.decRef(result);
    result = replaced;
  }
  for (const variable of vars) manager.decRef(variable);
  return result;
};

// plugin::set_definition: a definition that is not a macro is recursive.
export const setRecFunDefinition = (
  manager: AstManager,
  def: RecFunDef,
  isMacro: boolean,
  rhs: number,
) => {
  if (!isMacro) manager.hasRecDefs = true;
  const redirected = isMacro ? rhs : redirectIte(manager, def, rhs);
  if (isMacro) manager.incRef(redirected);
  def.isMacro = isMacro;
  computeCases(manager, def, isMacro, redirected);
  manager.decRef(redirected);
  for (const recFunCase of def.cases) manager.recFunCases.set(recFunCase.pred, recFunCase);
};
