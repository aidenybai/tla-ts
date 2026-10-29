// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp,
// der.cpp), MIT license, see z3-license.txt. Only the rewrites that tlapm's encoding
// exercises are ported.
import { ArithRewriter, ArithRewriterOptions } from "./arith-rewriter";
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
import { collectUsedVars, replaceFreeVars, shiftVars, substitute } from "./var-subst";

// Substitutes the variables with de Bruijn index i < map.length that have a definition in map,
// which may contain variables of the same scope, and keeps every other variable.
const substitutePartial = (manager: AstManager, expr: number, map: (number | undefined)[]) =>
  replaceFreeVars(manager, expr, (variable, index, shift) => {
    const definition = index < map.length ? map[index] : undefined;
    return definition === undefined ? variable : shiftVars(manager, definition, 0, shift, 0);
  });

// unused_vars_eliminator: drops the variables that neither the body nor a pattern uses.
const elimUnusedVars = (manager: AstManager, expr: number) => {
  if (manager.kinds[expr] !== KIND_QUANTIFIER) return expr;
  const data = manager.getQuantifier(expr);
  if (manager.isGround(data.body)) return data.body;
  const count = data.sorts.length;
  const used = collectUsedVars(manager, data.body, count);
  for (const pattern of data.patterns)
    for (const term of pattern)
      collectUsedVars(manager, term, count).forEach((isUsed, index) => {
        if (isUsed) used[index] = true;
      });
  if (used.every((isUsed) => isUsed)) return expr;
  const numKept = used.filter(Boolean).length;
  const bindings: number[] = [];
  const keptSorts: number[] = [];
  let nextIndex = numKept;
  for (let declIndex = 0; declIndex < count; declIndex++) {
    const varIndex = count - 1 - declIndex;
    if (used[varIndex]) {
      nextIndex--;
      bindings[declIndex] = manager.mkVar(nextIndex, data.sorts[declIndex]);
      keptSorts.push(data.sorts[declIndex]);
    } else bindings[declIndex] = manager.mkVar(0, data.sorts[declIndex]);
  }
  const remap = (term: number) => substitute(manager, term, bindings, numKept);
  if (numKept === 0) return remap(data.body);
  return manager.mkQuantifier({
    ...data,
    sorts: keptSorts,
    body: remap(data.body),
    patterns: data.patterns.map((pattern) => pattern.map(remap)),
  });
};

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

export class Rewriter {
  private cache = new Map<number, number>();
  private arith: ArithRewriter;

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

  mkAppCore(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
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
      case OP_MOD:
        return this.mkDivMod(decl, args);
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

  // bool_rewriter::mk_nflat_or_core: flattens, drops false and duplicates, and detects true or a
  // complementary pair.
  mkOr(args: number[]): number {
    const manager = this.manager;
    const result: number[] = [];
    const seen = new Set<number>();
    const add = (arg: number): boolean => {
      if (manager.getOp(arg) === OP_OR) {
        for (const innerArg of manager.args[arg]) if (add(innerArg)) return true;
        return false;
      }
      if (manager.isTrue(arg)) return true;
      if (manager.isFalse(arg) || seen.has(arg)) return false;
      if (seen.has(this.mkNot(arg))) return true;
      seen.add(arg);
      result.push(arg);
      return false;
    };
    for (const arg of args) if (add(arg)) return manager.trueExpr;
    return manager.mkOr(result);
  }

  mkAnd(args: number[]): number {
    const manager = this.manager;
    const result: number[] = [];
    const seen = new Set<number>();
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
      if (manager.isTrue(arg) || seen.has(arg)) return false;
      if (seen.has(this.mkNot(arg))) return true;
      seen.add(arg);
      result.push(arg);
      return false;
    };
    for (const arg of args) if (add(arg)) return manager.falseExpr;
    if (result.length <= 1 || !this.options.isEliminatingAnd) return manager.mkAnd(result);
    return this.mkNot(this.mkOr(result.map((innerArg) => this.mkNot(innerArg))));
  }

  // bool_rewriter::mk_eq_core, after arith_rewriter::mk_eq_core folds numerals.
  mkEq(inputLeft: number, inputRight: number): number {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (manager.isUniqueValue(inputLeft) && manager.isUniqueValue(inputRight))
      return manager.falseExpr;
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

  mkIte(condition: number, thenExpr: number, elseExpr: number): number {
    const manager = this.manager;
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (manager.isNot(condition)) return this.mkIte(manager.args[condition][0], elseExpr, thenExpr);
    if (manager.sorts[thenExpr] === SORT_BOOL) {
      if (manager.isTrue(thenExpr)) return this.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr)) return this.mkAnd([this.mkNot(condition), elseExpr]);
      if (manager.isTrue(elseExpr)) return this.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr)) return this.mkAnd([condition, thenExpr]);
      if (thenExpr === condition) return this.mkOr([condition, elseExpr]);
      if (elseExpr === condition) return this.mkAnd([condition, thenExpr]);
    }
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], manager.sorts[thenExpr]);
  }

  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }

  private mkDivMod(decl: number, args: number[]) {
    const manager = this.manager;
    const dividend = this.manager.getNumeral(args[0]);
    const divisor = this.manager.getNumeral(args[1]);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0) {
      // SMT-LIB integer division: the remainder is non-negative.
      const quotient =
        divisor > 0 ? Math.floor(dividend / divisor) : -Math.floor(dividend / -divisor);
      return this.manager.mkNumeral(
        manager.funcDecls[decl].op === OP_IDIV ? quotient : dividend - divisor * quotient,
      );
    }
    if (divisor === 1)
      return manager.funcDecls[decl].op === OP_IDIV ? args[0] : this.manager.mkNumeral(0);
    const isIdiv = manager.funcDecls[decl].op === OP_IDIV;
    return (
      (isIdiv ? this.arith.mkIdiv(args[0], args[1]) : undefined) ??
      manager.mkApp(decl, args, SORT_INT)
    );
  }
}
