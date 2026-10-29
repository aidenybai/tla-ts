// Ported from Z3 (src/ast/normal_forms/nnf.cpp), MIT license, see z3-license.txt.
// Negation normal form in Z3's default NNF_SKOLEM mode: only subformulas that contain quantifiers
// are normalized, and existential quantifiers in positive positions become Skolem functions of the
// enclosing universal variables. A quantifier inside an atom gets a name, a fresh predicate over its
// free variables, with a definition that is normalized too (src/ast/normal_forms/name_exprs.cpp,
// src/ast/normal_forms/defined_names.cpp).
import {
  AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { elimUnusedVars, getFreeVarSorts, substitute } from "./var-subst";

// Returns the definitions of the names it introduced, then the normal form of expr. names maps each
// named quantifier to its name, across the formulas of a problem.
export const toNnf = (manager: AstManager, expr: number, names: Map<number, number>) => {
  const cache = new Map<string, number>();
  const todoDefs: number[] = [];

  // defined_names::mk_name: (n x1 ... xk) for the free variables x1 ... xk of the quantifier, with
  // n => q and q => n as the definition, under a universal quantifier whose pattern is the name.
  const mkName = (quantifier: number) => {
    const existing = names.get(quantifier);
    if (existing !== undefined) return existing;
    const bound = manager.freeVarBounds[quantifier];
    const freeVarSorts = getFreeVarSorts(manager, quantifier, bound);
    // A variable that does not occur still takes a position, filled with true.
    const varSorts = freeVarSorts.map((sort) => sort ?? SORT_BOOL);
    const args = freeVarSorts.map((sort, index) =>
      sort === undefined ? manager.trueExpr : manager.mkVar(index, sort),
    );
    const name = manager.mkApp(
      manager.mkFreshFuncDecl("z3name", varSorts, SORT_BOOL, true),
      args,
      SORT_BOOL,
    );
    names.set(quantifier, name);
    const boundVars = (conjunct: number) =>
      bound === 0
        ? conjunct
        : elimUnusedVars(
            manager,
            manager.mkQuantifier({
              isForall: true,
              sorts: varSorts.toReversed(),
              body: conjunct,
              patterns: [[name]],
              weight: 1,
              qid: "",
            }),
          );
    todoDefs.push(
      manager.mkAnd([
        boundVars(manager.mkOr([manager.mkNot(name), quantifier])),
        boundVars(manager.mkOr([name, manager.mkNot(quantifier)])),
      ]),
    );
    return name;
  };

  // name_quantifier_labels: replaces each outermost quantifier of an atom by its name.
  const nameQuantifiers = (current: number): number => {
    if (!manager.hasQuantifierFlags[current]) return current;
    if (manager.kinds[current] === KIND_QUANTIFIER) return mkName(current);
    return manager.kinds[current] === KIND_APP
      ? manager.mkApp(
          manager.decls[current],
          manager.args[current].map(nameQuantifiers),
          manager.sorts[current],
        )
      : current;
  };

  // skolemizer::process: the Skolem function takes the free variables of the quantifier.
  const skolemize = (quantifier: number) => {
    const data = manager.getQuantifier(quantifier);
    const count = data.sorts.length;
    const sorts = getFreeVarSorts(manager, data.body, manager.freeVarBounds[data.body]);
    const argVars: number[] = [];
    const argSorts: number[] = [];
    for (let index = count; index < sorts.length; index++) {
      const sort = sorts[index];
      if (sort === undefined) continue;
      argVars.push(manager.mkVar(index - count, sort));
      argSorts.push(sort);
    }
    const bindings = data.sorts.map((sort) =>
      manager.mkApp(manager.mkFreshFuncDecl("sk", argSorts, sort, true), argVars, sort),
    );
    return substitute(manager, data.body, bindings);
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
      // process_eq: an equality between terms is an atom.
      const op = manager.getOp(current);
      switch (op === OP_EQ && !manager.isBool(args[0]) ? -1 : op) {
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
        default: {
          const named = nameQuantifiers(current);
          result = isPositive ? named : manager.mkNot(named);
        }
      }
    }
    cache.set(key, result);
    return result;
  };

  const result = visit(expr, true);
  const defs: number[] = [];
  for (let index = 0; index < todoDefs.length; index++) defs.push(visit(todoDefs[index], true));
  return [...defs.reverse(), result];
};
