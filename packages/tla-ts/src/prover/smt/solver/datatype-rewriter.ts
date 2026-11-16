// Ported from Z3 (src/ast/rewriter/datatype_rewriter.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_DT_UPDATE_FIELD,
} from "./ast";
import {
  getAccessorConstructor,
  getConstructorIs,
  getNumConstructors,
  getRecognizerConstructor,
} from "./datatype-decl-plugin";
import type { Rewrite } from "./rewriter-tpl";

const isAppOf = (manager: AstManager, expr: number, op: number) =>
  manager.kinds[expr] === KIND_APP && manager.getOp(expr) === op;

export const mkDatatypeAppCore = (
  manager: AstManager,
  decl: number,
  args: number[],
): number | Rewrite | undefined => {
  const funcDecl = manager.funcDecls[decl];
  const arg = args[0];
  if (funcDecl.op === OP_DT_RECOGNISER)
    return {
      expr: manager.mkApp(
        getConstructorIs(manager, getRecognizerConstructor(manager, decl)),
        [arg],
        funcDecl.range,
      ),
      depth: 1,
    };
  if (funcDecl.op === OP_DT_IS) {
    if (getNumConstructors(manager, manager.sorts[arg]) === 1) return manager.trueExpr;
    if (isAppOf(manager, arg, OP_DT_UPDATE_FIELD))
      return { expr: manager.mkApp(decl, [manager.getArg(arg, 0)], funcDecl.range), depth: 1 };
    if (!isAppOf(manager, arg, OP_DT_CONSTRUCTOR)) return undefined;
    return manager.decls[arg] === getRecognizerConstructor(manager, decl)
      ? manager.trueExpr
      : manager.falseExpr;
  }
  if (funcDecl.op === OP_DT_ACCESSOR) {
    if (manager.kinds[arg] !== KIND_APP) return undefined;
    if (
      isAppOf(manager, arg, OP_DT_UPDATE_FIELD) &&
      getNumConstructors(manager, manager.sorts[arg]) === 1
    ) {
      if (manager.funcDecls[manager.decls[arg]].parameters[0] === decl)
        return manager.getArg(arg, 1);
      return { expr: manager.mkApp(decl, [manager.getArg(arg, 0)], funcDecl.range), depth: 1 };
    }
    if (!isAppOf(manager, arg, OP_DT_CONSTRUCTOR)) return undefined;
    if (manager.decls[arg] !== getAccessorConstructor(manager, decl)) return undefined;
    return manager.getArg(arg, funcDecl.parameters[1]);
  }
  if (funcDecl.op !== OP_DT_UPDATE_FIELD || !isAppOf(manager, arg, OP_DT_CONSTRUCTOR))
    return undefined;
  const accessor = funcDecl.parameters[0];
  if (manager.decls[arg] !== getAccessorConstructor(manager, accessor)) return arg;
  const position = manager.funcDecls[accessor].parameters[1];
  return manager.mkApp(
    manager.decls[arg],
    manager.mapArgs(arg, (field, index) => (index === position ? args[1] : field)),
    manager.sorts[arg],
  );
};

export const mkDatatypeEqCore = (
  manager: AstManager,
  lhs: number,
  rhs: number,
): number | Rewrite | undefined => {
  if (!isAppOf(manager, lhs, OP_DT_CONSTRUCTOR) || !isAppOf(manager, rhs, OP_DT_CONSTRUCTOR))
    return undefined;
  if (manager.decls[lhs] !== manager.decls[rhs]) return manager.falseExpr;
  const eqs = manager.mapArgs(lhs, (arg, index) => manager.mkEq(arg, manager.getArg(rhs, index)));
  return { expr: manager.mkAnd(eqs), depth: 2 };
};
