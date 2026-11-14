// Ported from Z3 (src/ast/rewriter/recfun_rewriter.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_VAR,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
} from "./ast";
import { getSubterms, isDefinedApp } from "./recfun-decl-plugin";
import type { Rewrite } from "./rewriter-tpl";
import { VarSubst } from "./var-subst";

const getRhs = (manager: AstManager, decl: number) => manager.recFunDefs.get(decl)?.rhs ?? -1;

const isFunMacro = (manager: AstManager, decl: number) =>
  manager.recFunDefs.get(decl)?.cases.length === 1;

// Leaves cycles through unconditional bodies to the resource-limited theory solver.
const isOnMacroCycle = (manager: AstManager, decl: number) => {
  const todo = [decl];
  const visited = new Set(todo);
  for (let index = 0; index < todo.length; index++) {
    for (const term of getSubterms(manager, getRhs(manager, todo[index]))) {
      if (!isDefinedApp(manager, term)) continue;
      const callee = manager.decls[term];
      if (callee === decl) return true;
      if (isFunMacro(manager, callee) && !visited.has(callee)) {
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
  const body = getRhs(manager, decl);
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

// recfun_rewriter::mk_app_core, which unfolds a body with uninterpreted functions only with
// unfold_recursive_functions, which only the model evaluator sets.
export const mkRecFunApp = (
  manager: AstManager,
  decl: number,
  args: number[],
  isUnfolding = false,
): Rewrite | undefined => {
  const body = getRhs(manager, decl);
  if (args.length === 0 || body === -1) return undefined;
  if (isFunMacro(manager, decl) && isOnMacroCycle(manager, decl)) return undefined;
  if (
    !isUnfolding &&
    getSubterms(manager, body).some(
      (term) => manager.kinds[term] === KIND_APP && manager.getFamily(term) === FAMILY_USER,
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
