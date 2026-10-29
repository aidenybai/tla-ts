// Ported from Z3 (src/ast/normal_forms/nnf.cpp), MIT license, see z3-license.txt.
// Negation normal form in Z3's default NNF_SKOLEM mode: only subformulas that contain quantifiers
// are normalized, and existential quantifiers in positive positions become Skolem functions of the
// enclosing universal variables.
import { SmtUnsupportedError } from "../errors";
import {
  AstManager,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
} from "./ast";
import { collectUsedVars, substituteNonGround } from "./rewriter";

export const toNnf = (manager: AstManager, expr: number) => {
  const cache = new Map<string, number>();

  // skolemizer::process: the Skolem function takes the free variables of the quantifier.
  const skolemize = (quantifier: number) => {
    const data = manager.getQuantifier(quantifier);
    const count = data.sorts.length;
    const bound = manager.freeVarBounds[data.body];
    const used = collectUsedVars(manager, data.body, bound);
    const argVars: number[] = [];
    const argSorts: number[] = [];
    const sortOf = new Map<number, number>();
    const collectSorts = (current: number, shift: number) => {
      if (manager.freeVarBounds[current] <= shift) return;
      if (manager.kinds[current] === KIND_VAR) {
        sortOf.set(manager.values[current] - shift, manager.sorts[current]);
        return;
      }
      if (manager.kinds[current] === KIND_QUANTIFIER) {
        const inner = manager.getQuantifier(current);
        collectSorts(inner.body, shift + inner.sorts.length);
        return;
      }
      for (const arg of manager.args[current]) collectSorts(arg, shift);
    };
    collectSorts(data.body, 0);
    for (let index = count; index < bound; index++)
      if (used[index]) {
        const sort = sortOf.get(index);
        if (sort === undefined) continue;
        argVars.push(manager.mkVar(index - count, sort));
        argSorts.push(sort);
      }
    const bindings = data.sorts.map((sort) =>
      manager.mkApp(manager.mkFreshFuncDecl("sk", argSorts, sort, true), argVars, sort),
    );
    return substituteNonGround(manager, data.body, bindings);
  };

  const visit = (current: number, isPositive: boolean): number => {
    if (!manager.hasQuantifierFlags[current]) return isPositive ? current : manager.mkNot(current);
    const key = `${current}:${isPositive ? 1 : 0}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    let result: number;
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(current);
      if (data.isForall === isPositive) {
        result = manager.mkQuantifier({
          ...data,
          isForall: true,
          body: visit(data.body, isPositive),
        });
      } else result = visit(skolemize(current), !data.isForall);
    } else {
      const args = manager.args[current];
      switch (manager.getOp(current)) {
        case OP_AND:
        case OP_OR: {
          const newArgs = args.map((innerArg) => visit(innerArg, isPositive));
          result =
            (manager.getOp(current) === OP_AND) === isPositive
              ? manager.mkAnd(newArgs)
              : manager.mkOr(newArgs);
          break;
        }
        case OP_NOT:
          result = visit(args[0], !isPositive);
          break;
        case OP_IMPLIES: {
          const left = visit(args[0], !isPositive);
          const right = visit(args[1], isPositive);
          result = isPositive ? manager.mkOr([left, right]) : manager.mkAnd([left, right]);
          break;
        }
        case OP_ITE: {
          const condition = visit(args[0], true);
          const notCondition = visit(args[0], false);
          const thenExpr = visit(args[1], isPositive);
          const elseExpr = visit(args[2], isPositive);
          result = manager.mkAnd([
            manager.mkOr([notCondition, thenExpr]),
            manager.mkOr([condition, elseExpr]),
          ]);
          break;
        }
        case OP_EQ:
        case OP_XOR: {
          if (!manager.isBool(args[0])) throw new SmtUnsupportedError("a quantifier inside a term");
          const left = visit(args[0], true);
          const notLeft = visit(args[0], false);
          const right = visit(args[1], true);
          const notRight = visit(args[1], false);
          result =
            (manager.getOp(current) === OP_EQ) === isPositive
              ? manager.mkAnd([manager.mkOr([notLeft, right]), manager.mkOr([left, notRight])])
              : manager.mkAnd([manager.mkOr([left, right]), manager.mkOr([notLeft, notRight])]);
          break;
        }
        default:
          throw new SmtUnsupportedError("a quantifier inside a term");
      }
    }
    cache.set(key, result);
    return result;
  };

  return visit(expr, true);
};
