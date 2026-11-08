// Ported from Z3 (src/model/model_smt2_pp.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BV,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_BSDIV0,
  OP_BSMOD0,
  OP_BSREM0,
  OP_BUDIV0,
  OP_BUREM0,
  OP_DIV0,
  OP_IDIV0,
  OP_MOD0,
} from "./ast";
import { ObjHashtable } from "./hashtable";
import type { ProtoModel } from "./proto-model";
import {
  type Format,
  formatExpr,
  formatSort,
  getQuotedName,
  LINE_BREAK,
  mkCompose,
  mkGroup,
  mkIndent,
  mkSeq1,
  mkSeq5,
  mkText,
  type PrintEnvironment,
  renderFormat,
} from "./smt2-printer";

const TAB_SIZE = 2;

const CONSIDERED_UNINTERPRETED_OPS = new Map([
  [FAMILY_ARITH, new Set([OP_DIV0, OP_IDIV0, OP_MOD0])],
  [FAMILY_BV, new Set([OP_BSDIV0, OP_BUDIV0, OP_BSREM0, OP_BUREM0, OP_BSMOD0])],
]);

const isConsideredUninterpreted = (manager: AstManager, decl: number) => {
  const funcDecl = manager.funcDecls[decl];
  return (
    funcDecl.family === FAMILY_USER ||
    (CONSIDERED_UNINTERPRETED_OPS.get(funcDecl.family)?.has(funcDecl.op) ?? false)
  );
};

// collect_func_decls: the uninterpreted functions applied to arguments in the expression.
const collectFuncDecls = (manager: AstManager, expr: number) => {
  const decls = new ObjHashtable((decl) => manager.getDeclHash(decl));
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      todo.push(manager.getQuantifier(current).body);
      continue;
    }
    if (manager.kinds[current] !== KIND_APP || manager.getNumArgs(current) === 0) continue;
    if (manager.funcDecls[manager.decls[current]].family === FAMILY_USER)
      decls.add(manager.decls[current]);
    manager.pushArgs(current, todo);
  }
  return decls;
};

// sort_fun_decls: a function comes after the functions its else expression applies.
const sortFuncDecls = (manager: AstManager, model: ProtoModel) => {
  const visited = new Set<number>();
  const result: number[] = [];
  for (const decl of model.getFuncDecls()) {
    if (visited.has(decl)) continue;
    visited.add(decl);
    const todo = [decl];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      const elseExpr = model.funcInterps.get(current)?.elseExpr ?? null;
      if (elseExpr !== null) {
        let isAllVisited = true;
        for (const dependency of collectFuncDecls(manager, elseExpr)) {
          if (
            manager.funcDecls[dependency].domain.length === 0 ||
            !model.funcInterps.has(dependency) ||
            visited.has(dependency)
          )
            continue;
          todo.push(dependency);
          visited.add(dependency);
          isAllVisited = false;
        }
        if (!isAllVisited) continue;
      }
      todo.pop();
      result.push(current);
    }
  }
  return result;
};

export const printModel = (
  manager: AstManager,
  environment: PrintEnvironment,
  model: ProtoModel,
  indent: number,
) => {
  const options = environment.options;
  const render = (format: Format, amount = 0) => renderFormat(mkIndent(amount, format), options);
  const formatValue = (expr: number) => formatExpr(manager, environment, expr).format;
  const pad = " ".repeat(indent);
  const output: string[] = [];

  for (const sort of model.getUninterpretedSorts()) {
    const universe = model.getKnownUniverse(sort);
    const names = universe.map((value) =>
      getQuotedName(manager.funcDecls[manager.decls[value]].name),
    );
    const header = `universe for ${render(formatSort(manager, sort), 13)}:\n  ${names.map((name) => `${name} `).join("")}\n-----------`;
    output.push(`${pad};; ${header.replaceAll("\n", `\n${pad};; `)}\n`);
    output.push(`${pad};; definitions for universe elements:\n`);
    for (const name of names)
      output.push(
        `${pad}(declare-fun ${name} () ${render(formatSort(manager, sort), indent + name.length + 16)})\n`,
      );
    output.push(`${pad};; cardinality constraint:\n`);
    const conditions = names.map((name) => mkSeq1([mkText("x"), mkText(name)], "="));
    const condition = conditions.length > 1 ? mkSeq1(conditions, "or") : conditions[0];
    const cardinality = mkSeq1(
      [
        mkCompose(mkText("((x "), mkIndent(4, mkCompose(formatSort(manager, sort), mkText("))")))),
        condition,
      ],
      "forall",
    );
    output.push(`${pad}${render(cardinality, indent)}\n`);
    output.push(`${pad};; -----------\n`);
  }

  for (const decl of model.getConstDecls()) {
    const name = getQuotedName(manager.funcDecls[decl].name);
    const range = render(
      formatSort(manager, manager.funcDecls[decl].range),
      indent + name.length + 16,
    );
    const value = render(formatValue(model.constInterps.get(decl) as number));
    output.push(`${pad}(define-fun ${name} () ${range}\n${pad}${" ".repeat(TAB_SIZE)}${value})\n`);
  }

  for (const decl of sortFuncDecls(manager, model)) {
    if (!isConsideredUninterpreted(manager, decl)) continue;
    const funcDecl = manager.funcDecls[decl];
    const interp = model.funcInterps.get(decl);
    if (interp === undefined) continue;
    const formatted =
      interp.elseExpr === null
        ? {
            format: mkText("#unspecified"),
            names: Array.from({ length: interp.arity }, (_unused, index) => `x!${index + 1}`),
          }
        : formatExpr(manager, environment, interp.elseExpr, interp.arity, "x");
    const varNames = formatted.names.map((name) => mkText(name));
    // The port's declarations of division by zero leave out their domain, the sort of their range.
    const domainSorts =
      funcDecl.domain.length === interp.arity
        ? funcDecl.domain
        : Array.from({ length: interp.arity }, () => funcDecl.range);
    const domain = mkSeq5(
      domainSorts.map((sort, index) => mkSeq5([varNames[index], formatSort(manager, sort)])),
    );
    const entries = interp.entries.flatMap((entry, index) => {
      const conditions = entry.args.map((arg, argIndex) =>
        mkSeq1([varNames[argIndex], formatValue(arg)], "="),
      );
      const condition = conditions.length > 1 ? mkSeq1(conditions, "and") : conditions[0];
      return [
        ...(index > 0 ? [LINE_BREAK] : []),
        mkGroup(
          mkCompose(
            mkText("(ite "),
            mkIndent(5, condition),
            mkIndent(TAB_SIZE, mkCompose(LINE_BREAK, formatValue(entry.result))),
          ),
        ),
      ];
    });
    const body =
      interp.entries.length === 0
        ? formatted.format
        : mkCompose(
            ...entries,
            mkIndent(TAB_SIZE, mkCompose(LINE_BREAK, formatted.format)),
            ...interp.entries.map(() => mkText(")")),
          );
    const definition = mkCompose(
      mkCompose(
        mkText(`(define-fun ${getQuotedName(funcDecl.name)} `),
        mkCompose(domain, mkText(" "), formatSort(manager, funcDecl.range)),
      ),
      mkIndent(TAB_SIZE, mkCompose(LINE_BREAK, body, mkText(")"))),
    );
    output.push(`${pad}${render(definition, indent)}\n`);
  }
  return output.join("");
};
