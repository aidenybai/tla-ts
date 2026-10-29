// Ported from Z3 (src/ast/normal_forms/pull_quant.cpp), MIT license, see z3-license.txt. Pulls
// the universal quantifiers nested in a formula in Skolem normal form to the top, so the model
// finder sees one flat quantifier.
import { KIND_APP, KIND_QUANTIFIER, OP_AND, OP_NOT, OP_OR, type AstManager } from "./ast";
import { shiftVars } from "./var-subst";

const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr) ? manager.args[expr][0] : manager.mkNot(expr);

// pull_quant1_core for an application of not, and or or.
const pullFromApp = (manager: AstManager, decl: number, args: number[], sort: number) => {
  const op = manager.funcDecls[decl].op;
  if (op === OP_NOT) {
    const child = args[0];
    if (manager.kinds[child] !== KIND_QUANTIFIER) return undefined;
    const data = manager.getQuantifier(child);
    return manager.mkQuantifier({
      ...data,
      isForall: !data.isForall,
      body: mkNot(manager, data.body),
    });
  }
  let isForall: boolean | undefined;
  const sorts: number[][] = [];
  let weight = Number.POSITIVE_INFINITY;
  let qid = "";
  for (const child of args) {
    if (manager.kinds[child] !== KIND_QUANTIFIER) continue;
    const data = manager.getQuantifier(child);
    if (isForall === undefined) isForall = data.isForall;
    else if (isForall !== data.isForall) return undefined;
    if (sorts.length === 0) qid = data.qid;
    weight = Math.min(weight, data.weight);
    sorts.push(data.sorts);
  }
  if (isForall === undefined) return undefined;
  const numDecls = sorts.reduce((total, innerSorts) => total + innerSorts.length, 0);
  let shiftAmount = 0;
  const adjusted = args.map((child) => {
    if (manager.kinds[child] !== KIND_QUANTIFIER) return shiftVars(manager, child, 0, numDecls, 0);
    const data = manager.getQuantifier(child);
    const result = shiftVars(
      manager,
      data.body,
      data.sorts.length,
      numDecls - data.sorts.length,
      shiftAmount,
    );
    shiftAmount += data.sorts.length;
    return result;
  });
  return manager.mkQuantifier({
    isForall,
    sorts: sorts.reverse().flat(),
    body: manager.mkApp(decl, adjusted, sort),
    patterns: [],
    weight,
    qid,
  });
};

export const pullQuant = (manager: AstManager, expr: number) => {
  const cache = new Map<number, number>();
  const visit = (current: number): number => {
    const cached = cache.get(current);
    if (cached !== undefined) return cached;
    const kind = manager.kinds[current];
    let result = current;
    if (kind === KIND_APP && manager.args[current].length > 0) {
      const decl = manager.decls[current];
      const args = manager.args[current].map((arg) => visit(arg));
      const op = manager.funcDecls[decl].op;
      if (op === OP_NOT && manager.isNot(args[0])) result = manager.args[args[0]][0];
      else
        result =
          op === OP_OR || op === OP_AND || op === OP_NOT
            ? (pullFromApp(manager, decl, args, manager.sorts[current]) ??
              manager.mkApp(decl, args, manager.sorts[current]))
            : manager.mkApp(decl, args, manager.sorts[current]);
    } else if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(current);
      const body = visit(data.body);
      if (!data.isForall)
        result = manager.mkNot(
          manager.mkQuantifier({ ...data, isForall: true, body: mkNot(manager, body) }),
        );
      else if (manager.kinds[body] === KIND_QUANTIFIER && manager.getQuantifier(body).isForall) {
        const nested = manager.getQuantifier(body);
        result = manager.mkQuantifier({
          isForall: true,
          sorts: [...data.sorts, ...nested.sorts],
          body: nested.body,
          patterns: [],
          weight: Math.min(data.weight, nested.weight),
          qid: data.qid,
        });
      } else result = manager.mkQuantifier({ ...data, body });
    }
    cache.set(current, result);
    return result;
  };
  return visit(expr);
};
