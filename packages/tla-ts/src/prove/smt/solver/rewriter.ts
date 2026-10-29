// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp,
// der.cpp), MIT license, see z3-license.txt. Only the rewrites that tlapm's encoding
// exercises are ported.
import { SmtCanceledError } from "../../../errors";
import { ArithRewriter, ArithRewriterOptions } from "./arith-rewriter";
import { isAstLess } from "./ast-lt";
import {
  AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { collectUsedVars, elimUnusedVars, replaceFreeVars, shiftVars } from "./var-subst";

// Substitutes the variables with de Bruijn index i < map.length that have a definition in map,
// which may contain variables of the same scope, and keeps every other variable.
const substitutePartial = (manager: AstManager, expr: number, map: (number | undefined)[]) =>
  replaceFreeVars(manager, expr, (variable, index, shift) => {
    const definition = index < map.length ? map[index] : undefined;
    return definition === undefined ? variable : shiftVars(manager, definition, 0, shift, 0);
  });

const flattenOr = (manager: AstManager, expr: number, result: number[]) => {
  const op = manager.getOp(expr);
  const inner = op === OP_NOT ? manager.args[expr][0] : -1;
  if (op === OP_OR) for (const arg of manager.args[expr]) flattenOr(manager, arg, result);
  else if (inner !== -1 && manager.getOp(inner) === OP_NOT)
    flattenOr(manager, manager.args[inner][0], result);
  else if (inner !== -1 && manager.getOp(inner) === OP_AND)
    for (const arg of manager.args[inner]) flattenOr(manager, manager.mkNot(arg), result);
  else result.push(expr);
};

const flattenAnd = (manager: AstManager, expr: number, result: number[]) => {
  const op = manager.getOp(expr);
  const inner = op === OP_NOT ? manager.args[expr][0] : -1;
  if (op === OP_AND) for (const arg of manager.args[expr]) flattenAnd(manager, arg, result);
  else if (inner !== -1 && manager.getOp(inner) === OP_NOT)
    flattenAnd(manager, manager.args[inner][0], result);
  else if (inner !== -1 && manager.getOp(inner) === OP_OR)
    for (const arg of manager.args[inner]) flattenAnd(manager, manager.mkNot(arg), result);
  else result.push(expr);
};

interface VarDefinition {
  index: number;
  definition: number;
}

// der::is_var_diseq for a universal quantifier and der::is_var_eq for an existential one.
const getVarDefinition = (
  manager: AstManager,
  literal: number,
  count: number,
  isForall: boolean,
): VarDefinition | undefined => {
  const isBoundVar = (term: number) =>
    manager.kinds[term] === KIND_VAR && manager.values[term] < count;
  const isNegatedVar = (term: number) => manager.isNot(term) && isBoundVar(manager.args[term][0]);
  const fromEq = (eq: number, isNegated: boolean): VarDefinition | undefined => {
    const sides = manager.args[eq];
    const isSwapped = !isBoundVar(sides[0]);
    const lhs = isSwapped ? sides[1] : sides[0];
    const rhs = isSwapped ? sides[0] : sides[1];
    if (!isBoundVar(lhs)) return undefined;
    return { index: manager.values[lhs], definition: isNegated ? manager.mkNot(rhs) : rhs };
  };
  if (isForall) {
    if (manager.isNot(literal) && manager.getOp(manager.args[literal][0]) === OP_EQ)
      return fromEq(manager.args[literal][0], false);
    if (manager.getOp(literal) === OP_EQ && manager.sorts[manager.args[literal][0]] === SORT_BOOL) {
      const found = fromEq(literal, true);
      if (found !== undefined) return found;
      const sides = manager.args[literal];
      const isSwapped = !isNegatedVar(sides[0]);
      const lhs = isSwapped ? sides[1] : sides[0];
      const rhs = isSwapped ? sides[0] : sides[1];
      return isNegatedVar(lhs)
        ? { index: manager.values[manager.args[lhs][0]], definition: rhs }
        : undefined;
    }
    if (isBoundVar(literal))
      return { index: manager.values[literal], definition: manager.falseExpr };
    if (isNegatedVar(literal))
      return { index: manager.values[manager.args[literal][0]], definition: manager.trueExpr };
    return undefined;
  }
  if (manager.getOp(literal) === OP_EQ) return fromEq(literal, false);
  if (isBoundVar(literal)) return { index: manager.values[literal], definition: manager.trueExpr };
  if (isNegatedVar(literal))
    return { index: manager.values[manager.args[literal][0]], definition: manager.falseExpr };
  return undefined;
};

const isOccurring = (manager: AstManager, index: number, expr: number) =>
  collectUsedVars(manager, expr, index + 1)[index];

// der_sort_vars: the definitions in an order where each only uses the ones before it, dropping the
// definitions on a cycle.
const getEliminationOrder = (manager: AstManager, definitions: (number | undefined)[]) => {
  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    if (
      definition !== undefined &&
      (manager.hasQuantifierFlags[definition] || isOccurring(manager, index, definition))
    )
      definitions[index] = undefined;
  }
  const order: number[] = [];
  const visiting = new Set<number>();
  const done = new Set<number>();
  const visit = (expr: number) => {
    if (done.has(expr)) return;
    if (manager.kinds[expr] === KIND_VAR) {
      const index = manager.values[expr];
      const definition = index < definitions.length ? definitions[index] : undefined;
      if (definition !== undefined && visiting.has(expr)) {
        visiting.delete(expr);
        definitions[index] = undefined;
      } else if (definition !== undefined) {
        visiting.add(expr);
        visit(definition);
        if (definitions[index] !== undefined) {
          visiting.delete(expr);
          order.push(index);
        }
      }
      done.add(expr);
      return;
    }
    for (const arg of manager.args[expr]) visit(arg);
    done.add(expr);
  };
  definitions.forEach((definition, index) => {
    if (definition !== undefined) visit(manager.mkVar(index, manager.sorts[definition]));
  });
  return order;
};

// der::reduce1: destructive equality resolution.
const reduceDer = (manager: AstManager, expr: number) => {
  const data = manager.getQuantifier(expr);
  const count = data.sorts.length;
  const single = getVarDefinition(manager, data.body, count, data.isForall);
  if (
    single !== undefined &&
    !manager.hasQuantifierFlags[single.definition] &&
    !isOccurring(manager, single.index, single.definition)
  )
    return data.isForall ? manager.falseExpr : manager.trueExpr;
  const literals: number[] = [];
  if (data.isForall) flattenOr(manager, data.body, literals);
  else flattenAnd(manager, data.body, literals);
  const definitions: (number | undefined)[] = [];
  const positions = literals.map((literal) => {
    const found = getVarDefinition(manager, literal, count, data.isForall);
    if (found === undefined || definitions[found.index] !== undefined) return -1;
    definitions[found.index] = found.definition;
    return found.index;
  });
  if (positions.every((position) => position === -1)) return expr;
  const order = getEliminationOrder(manager, definitions);
  if (order.length === 0) return expr;
  const substitution: (number | undefined)[] = [];
  for (const index of order) {
    const definition = definitions[index];
    if (definition !== undefined)
      substitution[index] = substitutePartial(manager, definition, substitution);
  }
  const kept = literals.filter((_literal, position) => {
    const index = positions[position];
    return index === -1 || definitions[index] === undefined;
  });
  const empty = data.isForall ? manager.falseExpr : manager.trueExpr;
  const combined =
    kept.length === 0
      ? empty
      : kept.length === 1
        ? kept[0]
        : data.isForall
          ? manager.mkOr(kept)
          : manager.mkAnd(kept);
  return manager.mkQuantifier({
    ...data,
    body: substitutePartial(manager, combined, substitution),
    patterns: data.patterns.map((pattern) =>
      pattern.map((term) => substitutePartial(manager, term, substitution)),
    ),
  });
};

// der::operator(): reduces until nothing changes, then drops the eliminated variables.
const applyDer = (manager: AstManager, expr: number) => {
  let current = expr;
  for (
    let next = reduceDer(manager, current);
    next !== current;
    next = reduceDer(manager, current)
  ) {
    current = next;
    if (manager.kinds[current] !== KIND_QUANTIFIER) return current;
  }
  return current === expr ? expr : elimUnusedVars(manager, current);
};

export interface RewriterOptions {
  // Replaces (and a b) with (not (or (not a) (not b))), as Z3's asserted_formulas does after NNF.
  isEliminatingAnd: boolean;
  arith: ArithRewriterOptions;
}

// The distinct literals of a flat conjunction or disjunction. It finds a complementary pair through
// the atoms of the negated literals, without creating each negation.
class FlatLiterals {
  readonly list: number[] = [];
  private seen = new Set<number>();
  private negatedAtoms = new Set<number>();

  constructor(private manager: AstManager) {}

  // Adds a literal, and returns whether its complement is already there.
  add(literal: number) {
    const manager = this.manager;
    if (this.seen.has(literal)) return false;
    const isNegated = manager.isNot(literal);
    if (isNegated ? this.seen.has(manager.args[literal][0]) : this.negatedAtoms.has(literal))
      return true;
    this.seen.add(literal);
    if (isNegated) this.negatedAtoms.add(manager.args[literal][0]);
    this.list.push(literal);
    return false;
  }
}

export class Rewriter {
  private cache = new Map<number, number>();
  private arith: ArithRewriter;
  private numSteps = 0;

  constructor(
    private manager: AstManager,
    private options: RewriterOptions,
    private isNestedDer = false,
  ) {
    this.arith = new ArithRewriter(manager, options.arith, (expr, depth) =>
      this.reduceTo(expr, depth),
    );
  }

  // Rewrites the top depth levels of a term that a rewrite returned, like BR_REWRITE1 and
  // BR_REWRITE2.
  private reduceTo(expr: number, depth: number): number {
    const manager = this.manager;
    if (depth === 0 || manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0)
      return expr;
    return this.mkAppCore(
      manager.decls[expr],
      manager.args[expr].map((arg) => this.reduceTo(arg, depth - 1)),
      manager.sorts[expr],
    );
  }

  rewrite(expr: number): number {
    const cached = this.cache.get(expr);
    if (cached !== undefined) return cached;
    const manager = this.manager;
    const kind = manager.kinds[expr];
    let result = expr;
    if (kind === KIND_APP && manager.args[expr].length > 0) {
      const args = manager.args[expr];
      result = this.mkAppCore(
        manager.decls[expr],
        args.map((arg) => this.rewrite(arg)),
        manager.sorts[expr],
      );
    } else if (kind === KIND_QUANTIFIER) result = this.reduceQuantifier(expr);
    this.cache.set(expr, result);
    return result;
  }

  // th_rewriter_cfg::reduce_quantifier: merges a directly nested quantifier of the same kind when
  // neither has patterns, eliminates unused variables, and applies der to pattern-free quantifiers.
  private reduceQuantifier(expr: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const body = this.rewrite(data.body);
    const nested =
      manager.kinds[body] === KIND_QUANTIFIER ? manager.getQuantifier(body) : undefined;
    const merged =
      nested !== undefined &&
      nested.isForall === data.isForall &&
      data.patterns.length === 0 &&
      nested.patterns.length === 0
        ? manager.mkQuantifier({
            ...data,
            sorts: [...data.sorts, ...nested.sorts],
            body: nested.body,
            weight: Math.min(data.weight, nested.weight),
          })
        : manager.mkQuantifier({ ...data, body });
    const reduced = elimUnusedVars(manager, merged);
    if (
      manager.kinds[reduced] !== KIND_QUANTIFIER ||
      manager.getQuantifier(reduced).patterns.length > 0
    )
      return reduced;
    const eliminated = applyDer(manager, reduced);
    if (eliminated === reduced || this.isNestedDer) return eliminated;
    return new Rewriter(manager, this.options, true).rewrite(eliminated);
  }

  // Throws SmtCanceledError when the resource limit cancels the rewrite, like rewriter_tpl's
  // main_loop. The check runs every 256 steps rather than once per rewrite.
  mkAppCore(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
    if ((++this.numSteps & 255) === 0 && !manager.limit.inc()) throw new SmtCanceledError();
    const op = manager.funcDecls[decl].op;
    switch (op) {
      case OP_AND:
        return this.mkAnd(args);
      case OP_OR:
        return this.mkOr(args);
      case OP_NOT:
        return this.mkNot(args[0]);
      case OP_IMPLIES:
        return this.mkOr([this.mkNot(args[0]), args[1]]);
      case OP_XOR:
        return this.mkNot(this.mkEq(args[0], args[1]));
      case OP_EQ:
        return (
          (manager.sorts[args[0]] === SORT_INT ? this.arith.mkEq(args[0], args[1]) : undefined) ??
          this.mkEq(args[0], args[1])
        );
      case OP_DISTINCT:
        return this.mkDistinct(args);
      case OP_ITE:
        return this.mkIte(args[0], args[1], args[2]);
      case OP_LE:
        return this.arith.mkLe(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_GE:
        return this.arith.mkGe(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_LT:
        return this.arith.mkLt(args[0], args[1]);
      case OP_GT:
        return this.arith.mkGt(args[0], args[1]);
      case OP_ADD:
        return this.arith.mkAdd(args) ?? manager.mkApp(decl, args, sort);
      case OP_SUB:
        return this.arith.mkSub(args);
      case OP_UMINUS:
        return this.arith.mkUminus(args[0]);
      case OP_MUL:
        return this.arith.mkMul(args) ?? manager.mkApp(decl, args, sort);
      case OP_IDIV:
        return this.arith.mkIdiv(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_MOD:
        return this.arith.mkMod(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_ABS:
        return this.arith.mkAbs(args[0]);
      default:
        return manager.mkApp(decl, args, sort);
    }
  }

  mkNot(arg: number) {
    const manager = this.manager;
    if (manager.isNot(arg)) return manager.args[arg][0];
    return manager.mkNot(arg);
  }

  // bool_rewriter::mk_flat_or_core and mk_nflat_or_core: flattens, drops false and duplicates, and
  // detects true or a complementary pair. With sort_disjunctions, a disjunction that changed or is
  // out of ast_lt's order is stably sorted by id.
  mkOr(args: number[]): number {
    const manager = this.manager;
    const literals = new FlatLiterals(manager);
    let isChanged = false;
    let numCandidates = 0;
    const add = (arg: number): boolean => {
      if (manager.getOp(arg) === OP_OR) {
        isChanged = true;
        for (const innerArg of manager.args[arg]) if (add(innerArg)) return true;
        return false;
      }
      if (manager.isTrue(arg)) return true;
      if (manager.isFalse(arg)) {
        isChanged = true;
        return false;
      }
      numCandidates++;
      return literals.add(arg);
    };
    for (const arg of args) if (add(arg)) return manager.trueExpr;
    const result = literals.list;
    const isOutOfOrder = result.some(
      (arg, index) => index > 0 && isAstLess(manager, arg, result[index - 1]),
    );
    if (isChanged || numCandidates !== result.length || isOutOfOrder)
      result.sort((first, second) => first - second);
    return manager.mkOr(result);
  }

  mkAnd(args: number[]): number {
    const manager = this.manager;
    const literals = new FlatLiterals(manager);
    const add = (arg: number): boolean => {
      if (manager.getOp(arg) === OP_AND) {
        for (const innerArg of manager.args[arg]) if (add(innerArg)) return true;
        return false;
      }
      if (
        this.options.isEliminatingAnd &&
        manager.isNot(arg) &&
        manager.getOp(manager.args[arg][0]) === OP_OR
      ) {
        for (const innerArg of manager.args[manager.args[arg][0]])
          if (add(this.mkNot(innerArg))) return true;
        return false;
      }
      if (manager.isFalse(arg)) return true;
      return !manager.isTrue(arg) && literals.add(arg);
    };
    for (const arg of args) if (add(arg)) return manager.falseExpr;
    const result = literals.list;
    if (result.length <= 1 || !this.options.isEliminatingAnd) return manager.mkAnd(result);
    return this.mkNot(this.mkOr(result.map((innerArg) => this.mkNot(innerArg))));
  }

  // try_ite_eq: (ite c t e) = t is c when e is a value distinct from t, and likewise for e.
  private tryIteEq(ite: number, other: number) {
    const manager = this.manager;
    if (manager.getOp(ite) !== OP_ITE) return undefined;
    const args = manager.args[ite];
    if (args[1] === other && this.areDistinct(args[2], other)) return args[0];
    if (args[2] === other && this.areDistinct(args[1], other)) return this.mkNot(args[0]);
    return undefined;
  }

  private isIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE;
  }

  private areDistinct(first: number, second: number) {
    const manager = this.manager;
    return first !== second && manager.isUniqueValue(first) && manager.isUniqueValue(second);
  }

  // The ite_extra_rules of mk_eq_core: an ite against a value, or two ites of values.
  private mkIteValueEq(left: number, right: number) {
    const manager = this.manager;
    if (this.isIte(left) && manager.isUniqueValue(right)) return this.tryIteValue(left, right);
    if (this.isIte(right) && manager.isUniqueValue(left)) return this.tryIteValue(right, left);
    const leftArgs = manager.args[left];
    const rightArgs = manager.args[right];
    if (
      !this.isIte(left) ||
      !this.isIte(right) ||
      ![leftArgs[1], leftArgs[2], rightArgs[1], rightArgs[2]].every((arg) =>
        manager.isUniqueValue(arg),
      )
    )
      return undefined;
    const leftNot = this.mkNot(leftArgs[0]);
    const rightNot = this.mkNot(rightArgs[0]);
    return this.mkAnd([
      this.mkOr([leftArgs[0], rightArgs[0], this.mkEq(leftArgs[2], rightArgs[2])]),
      this.mkOr([leftNot, rightNot, this.mkEq(leftArgs[1], rightArgs[1])]),
      this.mkOr([leftNot, rightArgs[0], this.mkEq(leftArgs[1], rightArgs[2])]),
      this.mkOr([leftArgs[0], rightNot, this.mkEq(leftArgs[2], rightArgs[1])]),
    ]);
  }

  // try_ite_value: (ite c t e) = v for a value v.
  private tryIteValue(ite: number, value: number): number | undefined {
    const manager = this.manager;
    const args = manager.args[ite];
    const condition = args[0];
    const thenExpr = args[1];
    const elseExpr = args[2];
    // Z3 rewrites the equality of a branch only below depth 500.
    const mkBranchEq = (branch: number) =>
      manager.depths[branch] < 500 ? this.mkEq(branch, value) : manager.mkEq(branch, value);
    if (this.areDistinct(value, elseExpr)) return this.mkAnd([mkBranchEq(thenExpr), condition]);
    if (this.areDistinct(value, thenExpr))
      return this.mkAnd([mkBranchEq(elseExpr), this.mkNot(condition)]);
    if (value === thenExpr)
      return value === elseExpr
        ? manager.trueExpr
        : this.mkOr([this.mkEq(elseExpr, value), condition]);
    if (value === elseExpr) return this.mkOr([this.mkEq(thenExpr, value), this.mkNot(condition)]);
    const isValueIte = (expr: number) =>
      this.isIte(expr) &&
      manager.isUniqueValue(manager.args[expr][1]) &&
      manager.isUniqueValue(manager.args[expr][2]);
    const thenEq = isValueIte(thenExpr) ? this.tryIteValue(thenExpr, value) : undefined;
    if (thenEq !== undefined) return this.mkIte(condition, thenEq, this.mkEq(elseExpr, value));
    const elseEq = isValueIte(elseExpr) ? this.tryIteValue(elseExpr, value) : undefined;
    if (elseEq !== undefined) return this.mkIte(condition, this.mkEq(thenExpr, value), elseEq);
    return this.isDisjointFrom(ite, value) ? manager.falseExpr : undefined;
  }

  // simplify_eq_ite: whether every leaf of a tree of ites is a value distinct from the value.
  private isDisjointFrom(ite: number, value: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [ite];
    while (todo.length > 0) {
      const expr = todo.pop() ?? ite;
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (this.areDistinct(expr, value)) continue;
      if (!this.isIte(expr)) return false;
      todo.push(manager.args[expr][1], manager.args[expr][2]);
    }
    return true;
  }

  // bool_rewriter::mk_eq_core, after arith_rewriter::mk_eq_core folds numerals.
  mkEq(inputLeft: number, inputRight: number): number {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (manager.isUniqueValue(inputLeft) && manager.isUniqueValue(inputRight))
      return manager.falseExpr;
    const iteEq = this.tryIteEq(inputLeft, inputRight) ?? this.tryIteEq(inputRight, inputLeft);
    if (iteEq !== undefined) return iteEq;
    const iteValueEq = this.mkIteValueEq(inputLeft, inputRight);
    if (iteValueEq !== undefined) return iteValueEq;
    if (manager.sorts[inputLeft] !== SORT_BOOL) return manager.mkEq(inputLeft, inputRight);
    const isUnfolded = manager.isNot(inputLeft) && manager.isNot(inputRight);
    const left = isUnfolded ? manager.args[inputLeft][0] : inputLeft;
    const right = isUnfolded ? manager.args[inputRight][0] : inputRight;
    if (manager.isTrue(left)) return right;
    if (manager.isFalse(left)) return this.mkNot(right);
    if (manager.isTrue(right)) return left;
    if (manager.isFalse(right)) return this.mkNot(left);
    if (manager.isComplement(left, right)) return manager.falseExpr;
    const isSwapped = manager.isNot(right);
    const lhs = isSwapped ? right : left;
    const rhs = isSwapped ? left : right;
    if (manager.isNot(lhs)) return this.mkNot(this.mkEq(manager.args[lhs][0], rhs));
    if (isUnfolded) return this.mkEq(lhs, rhs);
    return manager.mkEq(lhs, rhs);
  }

  mkDistinct(args: number[]) {
    const pairs: number[] = [];
    for (let left = 0; left < args.length; left++)
      for (let right = left + 1; right < args.length; right++)
        pairs.push(this.mkNot(this.mkEq(args[left], args[right])));
    return this.mkAnd(pairs);
  }

  // bool_rewriter::mk_ite_core, with elim_ite and ite_extra_rules.
  mkIte(condition: number, thenExpr: number, elseExpr: number): number {
    const manager = this.manager;
    // (ite (not c) a b) is (ite c b a).
    if (manager.isNot(condition)) return this.mkIte(manager.args[condition][0], elseExpr, thenExpr);
    const isThenIte = manager.getOp(thenExpr) === OP_ITE;
    const isElseIte = manager.getOp(elseExpr) === OP_ITE;
    const thenArgs = manager.args[thenExpr];
    const elseArgs = manager.args[elseExpr];
    // (ite c (ite c t1 t2) t3) is (ite c t1 t3).
    if (isThenIte && thenArgs[0] === condition) return this.mkIte(condition, thenArgs[1], elseExpr);
    // (ite c t1 (ite c2 t1 t2)) is (ite (or c c2) t1 t2).
    if (isElseIte && elseArgs[1] === thenExpr)
      return this.mkIte(this.mkOr([condition, elseArgs[0]]), thenExpr, elseArgs[2]);
    // (ite c t1 (ite c t2 t3)) is (ite c t1 t3).
    if (isElseIte && elseArgs[0] === condition) return this.mkIte(condition, thenExpr, elseArgs[2]);
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (manager.sorts[thenExpr] === SORT_BOOL) {
      if (manager.isTrue(thenExpr))
        return manager.isFalse(elseExpr) ? condition : this.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr))
        return manager.isTrue(elseExpr)
          ? this.mkNot(condition)
          : this.mkAnd([this.mkNot(condition), elseExpr]);
      if (manager.isTrue(elseExpr)) return this.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr)) return this.mkAnd([condition, thenExpr]);
      if (elseExpr === condition) return this.mkAnd([condition, thenExpr]);
      if (thenExpr === condition) return this.mkOr([condition, elseExpr]);
      if (manager.isComplement(thenExpr, elseExpr)) return this.mkEq(condition, thenExpr);
    }
    if (isThenIte) {
      // (ite c1 (ite c2 t1 t2) t1) is (ite (and c1 (not c2)) t2 t1).
      if (elseExpr === thenArgs[1])
        return this.mkIte(this.mkAnd([condition, this.mkNot(thenArgs[0])]), thenArgs[2], elseExpr);
      // (ite c1 (ite c2 t1 t2) t2) is (ite (and c1 c2) t1 t2).
      if (elseExpr === thenArgs[2])
        return this.mkIte(this.mkAnd([condition, thenArgs[0]]), thenArgs[1], elseExpr);
      // (ite c1 (ite c2 t1 t2) (ite c3 t1 t2)) is (ite (or (and c1 c2) (and (not c1) c3)) t1 t2),
      // and with (ite c3 t2 t1) the last conjunct is (not c3).
      const isSameBranches =
        isElseIte && thenArgs[1] === elseArgs[1] && thenArgs[2] === elseArgs[2];
      const isSwappedBranches =
        isElseIte && thenArgs[1] === elseArgs[2] && thenArgs[2] === elseArgs[1];
      if (isSameBranches || isSwappedBranches)
        return this.mkIte(
          this.mkOr([
            this.mkAnd([condition, thenArgs[0]]),
            this.mkAnd([
              this.mkNot(condition),
              isSameBranches ? elseArgs[0] : this.mkNot(elseArgs[0]),
            ]),
          ]),
          thenArgs[1],
          thenArgs[2],
        );
    }
    // (ite c1 t1 (ite c2 t2 t1)) is (ite (or c1 (not c2)) t1 t2).
    if (isElseIte && thenExpr === elseArgs[2])
      return this.mkIte(this.mkOr([condition, this.mkNot(elseArgs[0])]), thenExpr, elseArgs[1]);
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], manager.sorts[thenExpr]);
  }

  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }
}
