// Ported from Z3 (src/ast/rewriter/recfun_rewriter.cpp, src/ast/recfun_decl_plugin.cpp), MIT
// license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_ITE,
} from "./ast";
import type { Rewrite } from "./rewriter-tpl";
import { VarSubst } from "./var-subst";

const getChildren = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_QUANTIFIER
    ? [manager.getQuantifier(expr).body]
    : manager.kinds[expr] === KIND_APP
      ? manager.getArgs(expr)
      : [];

// subterms::all, which goes under quantifiers.
const getSubterms = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    todo.push(...getChildren(manager, current));
  }
  return [...visited];
};

const isDefinedApp = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.recFunBodies.has(manager.decls[expr]);

// check_pred stops at quantifiers.
const hasPredicate = (manager: AstManager, expr: number, predicate: (term: number) => boolean) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current) || manager.kinds[current] === KIND_QUANTIFIER) continue;
    visited.add(current);
    if (predicate(current)) return true;
    if (manager.kinds[current] === KIND_APP) todo.push(...manager.getArgs(current));
  }
  return false;
};

const containsDef = (manager: AstManager, expr: number) =>
  hasPredicate(manager, expr, (term) => isDefinedApp(manager, term));

const containsIte = (manager: AstManager, expr: number) =>
  hasPredicate(
    manager,
    expr,
    (term) =>
      manager.getOp(term) === OP_ITE &&
      !containsDef(manager, manager.getArg(term, 0)) &&
      containsDef(manager, term),
  );

// def::compute_cases makes one case unless the first unfolding of the body meets an ite to split.
const isFunMacro = (manager: AstManager, decl: number, body: number) => {
  if (manager.funcDecls[decl].domain.length === 0 || !containsIte(manager, body)) return true;
  const stack = [body];
  for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
    if (manager.getOp(expr) === OP_ITE) {
      if (containsDef(manager, manager.getArg(expr, 0))) continue;
      if (
        !containsDef(manager, manager.getArg(expr, 1)) &&
        !containsDef(manager, manager.getArg(expr, 2))
      )
        continue;
      return false;
    }
    if (manager.kinds[expr] === KIND_APP)
      for (const arg of manager.getArgs(expr)) if (containsIte(manager, arg)) stack.push(arg);
  }
  return true;
};

// Leaves cycles through unconditional bodies to the resource-limited theory solver.
const isOnMacroCycle = (manager: AstManager, decl: number) => {
  const todo = [decl];
  const visited = new Set(todo);
  for (let index = 0; index < todo.length; index++) {
    for (const term of getSubterms(manager, manager.recFunBodies.get(todo[index]) ?? -1)) {
      if (!isDefinedApp(manager, term)) continue;
      const callee = manager.decls[term];
      if (callee === decl) return true;
      const body = manager.recFunBodies.get(callee) ?? -1;
      if (body !== -1 && isFunMacro(manager, callee, body) && !visited.has(callee)) {
        visited.add(callee);
        todo.push(callee);
      }
    }
  }
  return false;
};

const isDecreasingArg = (
  manager: AstManager,
  decl: number,
  position: number,
  isAnyAccessorAllowed: boolean,
) => {
  const body = manager.recFunBodies.get(decl) ?? -1;
  if (body === -1 || manager.hasQuantifierFlags[body]) return false;
  const index = manager.funcDecls[decl].domain.length - position - 1;
  const isParameter = (expr: number) =>
    manager.kinds[expr] === KIND_VAR && manager.values[expr] === index;
  const subterms = getSubterms(manager, body);
  let decreasing = -1;
  for (const term of subterms) {
    if (manager.kinds[term] !== KIND_APP || !manager.getArgs(term).some(isParameter)) continue;
    const op = manager.getOp(term);
    if (op !== OP_DT_ACCESSOR && op !== OP_DT_IS && op !== OP_DT_RECOGNISER) return false;
    if (op !== OP_DT_ACCESSOR) continue;
    if (!isAnyAccessorAllowed && decreasing !== -1 && manager.decls[term] !== decreasing)
      return false;
    decreasing = manager.decls[term];
  }
  if (!isAnyAccessorAllowed) return true;
  if (decreasing === -1) return false;
  for (const term of subterms) {
    if (manager.kinds[term] !== KIND_APP || manager.decls[term] !== decl) continue;
    let arg = manager.getArg(term, position);
    let isStrict = false;
    while (manager.getOp(arg) === OP_DT_ACCESSOR) {
      arg = manager.getArg(arg, 0);
      isStrict = true;
    }
    if (!isStrict || !isParameter(arg)) return false;
  }
  return true;
};

// recfun_rewriter::mk_app_core without unfold_recursive_functions, which only the model evaluator
// sets.
export const mkRecFunApp = (
  manager: AstManager,
  decl: number,
  args: number[],
): Rewrite | undefined => {
  const body = manager.recFunBodies.get(decl) ?? -1;
  if (args.length === 0 || body === -1) return undefined;
  if (isFunMacro(manager, decl, body) && isOnMacroCycle(manager, decl)) return undefined;
  if (
    getSubterms(manager, body).some(
      (term) =>
        manager.kinds[term] === KIND_APP &&
        manager.getFamily(term) === FAMILY_USER &&
        !manager.recFunBodies.has(manager.decls[term]),
    )
  )
    return undefined;
  const isSafe =
    args.every((arg) => manager.isValue(arg)) ||
    (!manager.hasQuantifierFlags[body] &&
      args.some(
        (arg, position) =>
          manager.getOp(arg) === OP_DT_CONSTRUCTOR &&
          isDecreasingArg(manager, decl, position, manager.isGround(arg)),
      ));
  if (!isSafe) return undefined;
  const subst = new VarSubst(manager, true);
  const result = subst.apply(body, args);
  subst.release();
  manager.releaseLater(result);
  return { expr: result, depth: Infinity };
};
