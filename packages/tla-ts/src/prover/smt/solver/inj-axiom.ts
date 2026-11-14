// Ported from Z3 (src/ast/rewriter/inj_axiom.cpp), MIT license, see z3-license.txt.
import {
  FAMILY_USER,
  KIND_APP,
  KIND_VAR,
  OP_EQ,
  OP_NOT,
  OP_OR,
  type AstManager,
  QUANTIFIER_FORALL,
} from "./ast";
import { isAppOf } from "./ast-util";

// The result comes with a reference, which the caller releases.
export const simplifyInjAxiom = (manager: AstManager, quantifier: number) => {
  const data = manager.getQuantifier(quantifier);
  const body = data.body;
  if (
    data.kind !== QUANTIFIER_FORALL ||
    !isAppOf(manager, body, OP_OR) ||
    manager.getNumArgs(body) !== 2
  )
    return undefined;
  const isSwapped = isAppOf(manager, manager.getArg(body, 1), OP_NOT);
  const negated = manager.getArg(body, isSwapped ? 1 : 0);
  const varEq = manager.getArg(body, isSwapped ? 0 : 1);
  if (!isAppOf(manager, negated, OP_NOT)) return undefined;
  const appEq = manager.getArg(negated, 0);
  if (!isAppOf(manager, appEq, OP_EQ) || !isAppOf(manager, varEq, OP_EQ)) return undefined;
  const first = manager.getArg(appEq, 0);
  const second = manager.getArg(appEq, 1);
  const firstVar = manager.getArg(varEq, 0);
  const secondVar = manager.getArg(varEq, 1);
  const decl = manager.decls[first];
  const numArgs = manager.kinds[first] === KIND_APP ? manager.getNumArgs(first) : 0;
  if (
    manager.kinds[first] !== KIND_APP ||
    manager.kinds[second] !== KIND_APP ||
    manager.decls[second] !== decl ||
    manager.getNumArgs(second) !== numArgs ||
    manager.funcDecls[decl].family !== FAMILY_USER ||
    numArgs === 0 ||
    manager.kinds[firstVar] !== KIND_VAR ||
    manager.kinds[secondVar] !== KIND_VAR ||
    firstVar === secondVar
  )
    return undefined;
  let index = -1;
  for (let argIndex = 0; argIndex < numArgs; argIndex++) {
    const firstArg = manager.getArg(first, argIndex);
    const secondArg = manager.getArg(second, argIndex);
    if (manager.kinds[firstArg] !== KIND_VAR && !manager.isUninterpretedConst(firstArg))
      return undefined;
    if (
      (firstArg === firstVar && secondArg === secondVar) ||
      (firstArg === secondVar && secondArg === firstVar)
    ) {
      if (index !== -1) return undefined;
      index = argIndex;
    } else if (firstArg !== secondArg || firstArg === firstVar || firstArg === secondVar)
      return undefined;
  }
  if (index === -1 || !manager.isGround(quantifier)) return undefined;
  return manager.withTemporaries(() => {
    const domain = manager.funcDecls[decl].domain;
    const sorts: number[] = [];
    const names: number[] = [];
    const args: number[] = [];
    const invArgs: number[] = [];
    let inverted = -1;
    for (let argIndex = 0; argIndex < numArgs; argIndex++) {
      const arg = manager.getArg(first, argIndex);
      if (manager.kinds[arg] !== KIND_VAR) {
        args.push(arg);
        continue;
      }
      names.push(argIndex);
      sorts.push(domain[argIndex]);
      const variable = manager.mkVar(sorts.length - 1, domain[argIndex]);
      args.push(variable);
      if (argIndex === index) inverted = variable;
      else invArgs.push(variable);
    }
    const app = manager.mkApp(decl, args, manager.sorts[first]);
    invArgs.push(app);
    const inverse = manager.mkFreshFuncDecl(
      "inj",
      invArgs.map((arg) => manager.sorts[arg]),
      domain[index],
    );
    return manager.mkQuantifier({
      kind: QUANTIFIER_FORALL,
      sorts: sorts.reverse(),
      names,
      body: manager.mkEq(manager.mkApp(inverse, invArgs, domain[index]), inverted),
      patterns: [manager.mkPattern([app])],
      noPatterns: [],
      weight: 0,
      qid: "",
    });
  });
};
