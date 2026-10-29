// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp,
// var_subst.cpp), MIT license, see z3-license.txt. Only the rewrites that tlapm's encoding
// exercises are ported.
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
  OP_NUM,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
} from "./ast";

// Substitutes the variables of an expression, as Z3's var_subst does with std_order. The variable
// with de Bruijn index i (relative to the expression) becomes bindings[bindings.length - 1 - i].
// The bindings must be ground.
export const substitute = (manager: AstManager, expr: number, bindings: number[]) => {
  const cache = new Map<number, number>();
  const count = bindings.length;
  const visit = (current: number, shift: number): number => {
    if (manager.freeVarBounds[current] <= shift) return current;
    const key = current * 64 + shift;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const kind = manager.kinds[current];
    let result: number;
    if (kind === KIND_VAR) {
      const index = manager.values[current];
      result =
        index - shift < count
          ? bindings[count - 1 - (index - shift)]
          : manager.mkVar(index - count, manager.sorts[current]);
    } else if (kind === KIND_APP) {
      const args = manager.args[current];
      const newArgs = new Array<number>(args.length);
      for (let index = 0; index < args.length; index++) newArgs[index] = visit(args[index], shift);
      result = manager.mkApp(manager.decls[current], newArgs, manager.sorts[current]);
    } else {
      const data = manager.getQuantifier(current);
      const innerShift = shift + data.sorts.length;
      result = manager.mkQuantifier({
        ...data,
        body: visit(data.body, innerShift),
        patterns: data.patterns.map((pattern) =>
          pattern.map((innerTerm) => visit(innerTerm, innerShift)),
        ),
      });
    }
    cache.set(key, result);
    return result;
  };
  return visit(expr, 0);
};

// Adds amount to every free de Bruijn index, for a let binding used under more binders.
export const shiftVars = (manager: AstManager, expr: number, amount: number) => {
  if (amount === 0) return expr;
  const visit = (current: number, shift: number): number => {
    if (manager.freeVarBounds[current] <= shift) return current;
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) return manager.mkVar(manager.values[current] + amount, manager.sorts[current]);
    if (kind === KIND_APP)
      return manager.mkApp(
        manager.decls[current],
        manager.args[current].map((innerArg) => visit(innerArg, shift)),
        manager.sorts[current],
      );
    const data = manager.getQuantifier(current);
    const innerShift = shift + data.sorts.length;
    return manager.mkQuantifier({
      ...data,
      body: visit(data.body, innerShift),
      patterns: data.patterns.map((pattern) => pattern.map((innerTerm) => visit(innerTerm, innerShift))),
    });
  };
  return visit(expr, 0);
};

// Collects which variables of a quantifier body occur, indexed by de Bruijn index.
export const collectUsedVars = (manager: AstManager, expr: number, count: number) => {
  const used = new Array<boolean>(count).fill(false);
  const visited = new Set<number>();
  const visit = (current: number, shift: number) => {
    if (manager.freeVarBounds[current] <= shift) return;
    const key = current * 64 + shift;
    if (visited.has(key)) return;
    visited.add(key);
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) {
      const index = manager.values[current] - shift;
      if (index < count) used[index] = true;
    } else if (kind === KIND_APP) {
      for (const arg of manager.args[current]) visit(arg, shift);
    } else visit(manager.getQuantifier(current).body, shift + manager.getQuantifier(current).sorts.length);
  };
  visit(expr, 0);
  return used;
};

export interface RewriterOptions {
  // Replaces (and a b) with (not (or (not a) (not b))), as Z3's asserted_formulas does after NNF.
  isEliminatingAnd: boolean;
}

export class Rewriter {
  private cache = new Map<number, number>();

  constructor(
    private manager: AstManager,
    private options: RewriterOptions,
  ) {}

  rewrite(expr: number): number {
    const cached = this.cache.get(expr);
    if (cached !== undefined) return cached;
    const manager = this.manager;
    const kind = manager.kinds[expr];
    let result = expr;
    if (kind === KIND_APP && manager.args[expr].length > 0) {
      const args = manager.args[expr];
      const newArgs = new Array<number>(args.length);
      for (let index = 0; index < args.length; index++) newArgs[index] = this.rewrite(args[index]);
      result = this.mkAppCore(manager.decls[expr], newArgs, manager.sorts[expr]);
    } else if (kind === KIND_QUANTIFIER) result = this.reduceQuantifier(expr);
    this.cache.set(expr, result);
    return result;
  }

  private reduceQuantifier(expr: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const body = this.rewrite(data.body);
    if (manager.isTrue(body) || manager.isFalse(body)) return body;
    const used = collectUsedVars(manager, body, data.sorts.length);
    if (used.every((isUsed) => !isUsed)) return body;
    if (used.every((isUsed) => isUsed))
      return body === data.body ? expr : manager.mkQuantifier({ ...data, body });
    // Z3's elim_unused_vars: drop the unused variables and renumber the rest.
    const count = data.sorts.length;
    const bindings = new Array<number>(count);
    const keptSorts: number[] = [];
    let nextIndex = used.filter(Boolean).length;
    for (let declIndex = 0; declIndex < count; declIndex++) {
      const varIndex = count - 1 - declIndex;
      if (used[varIndex]) {
        nextIndex--;
        bindings[declIndex] = manager.mkVar(nextIndex, data.sorts[declIndex]);
        keptSorts.push(data.sorts[declIndex]);
      } else bindings[declIndex] = manager.mkVar(0, data.sorts[declIndex]);
    }
    const remap = (term: number) => substituteNonGround(manager, term, bindings);
    const patterns = data.patterns.filter((pattern) =>
      pattern.every((innerTerm) => {
        const patternUsed = collectUsedVars(manager, innerTerm, count);
        return patternUsed.every((isUsed, index) => !isUsed || used[index]);
      }),
    );
    return manager.mkQuantifier({
      ...data,
      sorts: keptSorts,
      body: remap(body),
      patterns: patterns.map((pattern) => pattern.map(remap)),
    });
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
        return this.mkEq(args[0], args[1]);
      case OP_DISTINCT:
        return this.mkDistinct(args);
      case OP_ITE:
        return this.mkIte(args[0], args[1], args[2]);
      case OP_LE:
        return this.mkLe(args[0], args[1]);
      case OP_GE:
        return this.mkLe(args[1], args[0]);
      case OP_LT:
        return this.mkNot(this.mkLe(args[1], args[0]));
      case OP_GT:
        return this.mkNot(this.mkLe(args[0], args[1]));
      case OP_ADD:
        return this.mkAdd(args);
      case OP_SUB:
        return this.mkAdd([args[0], ...args.slice(1).map((innerArg) => this.mkUminus(innerArg))]);
      case OP_UMINUS:
        return this.mkUminus(args[0]);
      case OP_MUL:
        return this.mkMul(args);
      case OP_IDIV:
      case OP_MOD:
        return this.mkDivMod(decl, args);
      case OP_ABS:
        return this.mkIte(
          this.mkLe(manager.mkNumeral(0), args[0]),
          args[0],
          this.mkUminus(args[0]),
        );
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
      if (this.options.isEliminatingAnd && manager.isNot(arg) && manager.getOp(manager.args[arg][0]) === OP_OR) {
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

  mkEq(left: number, right: number): number {
    const manager = this.manager;
    if (left === right) return manager.trueExpr;
    if (manager.sorts[left] === SORT_BOOL) {
      if (manager.isTrue(left)) return right;
      if (manager.isTrue(right)) return left;
      if (manager.isFalse(left)) return this.mkNot(right);
      if (manager.isFalse(right)) return this.mkNot(left);
      if (this.mkNot(left) === right) return manager.falseExpr;
      if (manager.isNot(left) && manager.isNot(right))
        return this.mkEq(manager.args[left][0], manager.args[right][0]);
    }
    if (manager.isUniqueValue(left) && manager.isUniqueValue(right)) return manager.falseExpr;
    if (manager.sorts[left] === SORT_INT) {
      const leftValue = this.getNumeral(left);
      const rightValue = this.getNumeral(right);
      if (leftValue !== undefined && rightValue !== undefined)
        return leftValue === rightValue ? manager.trueExpr : manager.falseExpr;
    }
    return left < right ? manager.mkEq(left, right) : manager.mkEq(right, left);
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

  getNumeral(expr: number) {
    return this.manager.getOp(expr) === OP_NUM ? this.manager.values[expr] : undefined;
  }

  private mkNumeral(value: number) {
    return this.manager.mkNumeral(value);
  }

  mkLe(left: number, right: number) {
    const manager = this.manager;
    const leftValue = this.getNumeral(left);
    const rightValue = this.getNumeral(right);
    if (leftValue !== undefined && rightValue !== undefined)
      return leftValue <= rightValue ? manager.trueExpr : manager.falseExpr;
    if (left === right) return manager.trueExpr;
    return manager.mkApp(OP_LE, [left, right], SORT_BOOL);
  }

  mkUminus(arg: number) {
    const value = this.getNumeral(arg);
    if (value !== undefined) return this.mkNumeral(-value);
    return this.mkMul([this.mkNumeral(-1), arg]);
  }

  // poly_rewriter: flattens sums, folds the numerals into one leading coefficient, and drops zero.
  mkAdd(args: number[]) {
    const manager = this.manager;
    const terms: number[] = [];
    let constant = 0;
    const add = (arg: number) => {
      if (manager.getOp(arg) === OP_ADD) for (const innerArg of manager.args[arg]) add(innerArg);
      else {
        const value = this.getNumeral(arg);
        if (value !== undefined) constant += value;
        else terms.push(arg);
      }
    };
    for (const arg of args) add(arg);
    if (constant !== 0 || terms.length === 0) terms.unshift(this.mkNumeral(constant));
    return terms.length === 1 ? terms[0] : manager.mkApp(OP_ADD, terms, SORT_INT);
  }

  mkMul(args: number[]) {
    const manager = this.manager;
    const factors: number[] = [];
    let coefficient = 1;
    const add = (arg: number) => {
      if (manager.getOp(arg) === OP_MUL) for (const innerArg of manager.args[arg]) add(innerArg);
      else {
        const value = this.getNumeral(arg);
        if (value !== undefined) coefficient *= value;
        else factors.push(arg);
      }
    };
    for (const arg of args) add(arg);
    if (coefficient === 0 || factors.length === 0) return this.mkNumeral(coefficient);
    if (coefficient !== 1) factors.unshift(this.mkNumeral(coefficient));
    return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, SORT_INT);
  }

  private mkDivMod(decl: number, args: number[]) {
    const manager = this.manager;
    const dividend = this.getNumeral(args[0]);
    const divisor = this.getNumeral(args[1]);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0) {
      // SMT-LIB integer division: the remainder is non-negative.
      const quotient =
        divisor > 0 ? Math.floor(dividend / divisor) : -Math.floor(dividend / -divisor);
      return this.mkNumeral(
        manager.funcDecls[decl].op === OP_IDIV ? quotient : dividend - divisor * quotient,
      );
    }
    if (divisor === 1) return manager.funcDecls[decl].op === OP_IDIV ? args[0] : this.mkNumeral(0);
    return manager.mkApp(decl, args, SORT_INT);
  }
}

// Like substitute, but the bindings may contain variables, which keep their indices. It is used to
// renumber the variables of a quantifier body.
export const substituteNonGround = (manager: AstManager, expr: number, bindings: number[]) => {
  const count = bindings.length;
  const cache = new Map<number, number>();
  const visit = (current: number, shift: number): number => {
    if (manager.freeVarBounds[current] <= shift) return current;
    const key = current * 64 + shift;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const kind = manager.kinds[current];
    let result: number;
    if (kind === KIND_VAR) {
      const index = manager.values[current];
      result =
        index - shift < count
          ? shiftVars(manager, bindings[count - 1 - (index - shift)], shift)
          : manager.mkVar(index - count, manager.sorts[current]);
    } else if (kind === KIND_APP)
      result = manager.mkApp(
        manager.decls[current],
        manager.args[current].map((innerArg) => visit(innerArg, shift)),
        manager.sorts[current],
      );
    else {
      const data = manager.getQuantifier(current);
      const innerShift = shift + data.sorts.length;
      result = manager.mkQuantifier({
        ...data,
        body: visit(data.body, innerShift),
        patterns: data.patterns.map((pattern) => pattern.map((innerTerm) => visit(innerTerm, innerShift))),
      });
    }
    cache.set(key, result);
    return result;
  };
  return visit(expr, 0);
};
