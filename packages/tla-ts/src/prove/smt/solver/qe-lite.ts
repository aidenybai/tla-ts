// Ported from Z3 (src/qe/lite/qe_lite_tactic.cpp, src/qe/mbp/mbp_solve_plugin.cpp), MIT license, see
// z3-license.txt. The qe-lite tactic of Z3's ufnia strategy: each quantifier, innermost first, loses
// the variables that its body defines by an equality, and a quantifier over a small integer range
// becomes a finite disjunction. Arrays, bit-vectors and datatypes are not ported, as tlapm's encoding
// does not produce them.
import {
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { flattenAnd, flattenOr, mkNot, pushNot } from "./ast-util";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { getEliminationOrder, isOccurring, substitutePartial } from "./der";
import { Rewriter } from "./rewriter";
import { collectUsedVars, substitute } from "./var-subst";

// qe_lite's EXPAND_BOUND_LIMIT: the largest integer range that is expanded.
const EXPAND_BOUND_LIMIT = 10000;

interface VarDefinition {
  index: number;
  definition: number;
}

// A summand of a linear equation and whether it is on the left-hand side.
interface SignedExpr {
  isLeft: boolean;
  expr: number;
}

interface Bound {
  index: number;
  isLower: boolean;
  value: number;
}

class QeLite {
  private rewriter: Rewriter;
  // is_variable_test: the variables of the quantifier at hand are those below this index.
  private numVars = 0;

  constructor(private manager: AstManager) {
    this.rewriter = new Rewriter(manager, { isEliminatingAnd: false, arith: TACTIC_ARITH_OPTIONS });
  }

  private isVariable(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_VAR && manager.values[expr] < this.numVars;
  }

  // arith_solve_plugin::is_invertible_const: a numeral that a variable's coefficient may be.
  private getInvertibleConst(expr: number): number | undefined {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_UMINUS) {
      const inner = this.getInvertibleConst(manager.args[expr][0]);
      return inner === undefined ? undefined : -inner;
    }
    const value = manager.getNumeral(expr);
    return value === 1 || value === -1 ? value : undefined;
  }

  // arith_solve_plugin::is_invertible_mul: a variable times an invertible coefficient.
  private getInvertibleMul(expr: number) {
    const manager = this.manager;
    if (this.isVariable(expr)) return { variable: expr, coefficient: 1 };
    if (manager.getOp(expr) !== OP_MUL || manager.args[expr].length !== 2) return undefined;
    const factors = manager.args[expr];
    const second = this.getInvertibleConst(factors[1]);
    if (this.isVariable(factors[0]) && second !== undefined)
      return { variable: factors[0], coefficient: second };
    const first = this.getInvertibleConst(factors[0]);
    if (this.isVariable(factors[1]) && first !== undefined)
      return { variable: factors[1], coefficient: first };
    return undefined;
  }

  // arith_solve_plugin::solve: lhs = rhs as variable = term.
  private solveLinear(lhs: number, rhs: number) {
    const manager = this.manager;
    if (manager.sorts[lhs] !== SORT_INT) return undefined;
    const todo: SignedExpr[] = [
      { isLeft: true, expr: lhs },
      { isLeft: false, expr: rhs },
    ];
    const done: SignedExpr[] = [];
    while (todo.length > 0) {
      const item = todo.pop();
      if (item === undefined) break;
      const op = manager.getOp(item.expr);
      const args = manager.args[item.expr];
      if (op === OP_ADD) for (const arg of args) todo.push({ isLeft: item.isLeft, expr: arg });
      else if (op === OP_SUB) {
        todo.push({ isLeft: item.isLeft, expr: args[0] });
        for (const arg of args.slice(1)) todo.push({ isLeft: !item.isLeft, expr: arg });
      } else if (op === OP_UMINUS) todo.push({ isLeft: !item.isLeft, expr: args[0] });
      else {
        const mul = this.getInvertibleMul(item.expr);
        if (mul === undefined) done.push(item);
        else {
          done.push(...todo);
          // mk_term: the other summands times the inverse of the coefficient, negated on the
          // variable's side.
          const coefficient = 1 / mul.coefficient;
          const terms = done.map((summand) => {
            const factor = summand.isLeft === item.isLeft ? -coefficient : coefficient;
            return factor === 1
              ? summand.expr
              : manager.mkApp(OP_MUL, [manager.mkNumeral(factor), summand.expr], SORT_INT);
          });
          const term =
            terms.length === 0
              ? manager.mkNumeral(0)
              : terms.length === 1
                ? terms[0]
                : manager.mkApp(OP_ADD, terms, SORT_INT);
          return { variable: mul.variable, term };
        }
      }
    }
    return undefined;
  }

  // arith_solve_plugin::mk_eq_core.
  private mkArithEq(inputLeft: number, inputRight: number) {
    const manager = this.manager;
    const solved = this.solveLinear(inputLeft, inputRight);
    if (solved !== undefined) return manager.mkEq(solved.variable, solved.term);
    const isLeftZero = manager.getNumeral(inputLeft) === 0;
    const left = isLeftZero ? inputRight : inputLeft;
    const right = isLeftZero ? inputLeft : inputRight;
    const leftArgs = manager.args[left];
    if (manager.getNumeral(right) !== 0 || manager.getOp(left) !== OP_ADD || leftArgs.length !== 2)
      return manager.mkEq(left, right);
    const negatedSecond = manager.getTimesMinusOneArg(leftArgs[1]);
    if (negatedSecond !== undefined) return manager.mkEq(leftArgs[0], negatedSecond);
    const negatedFirst = manager.getTimesMinusOneArg(leftArgs[0]);
    if (negatedFirst !== undefined) return manager.mkEq(leftArgs[1], negatedFirst);
    return manager.mkEq(left, right);
  }

  // arith_solve_plugin::solve on a positive equality, whose result defines a variable only when it
  // is an equality.
  private solveArith(atom: number) {
    const manager = this.manager;
    const sides = manager.args[atom];
    // try_int_mul_solve turns k*y = x into a conjunction, unless k is zero.
    const mulIndex =
      manager.getOp(sides[1]) === OP_MUL ? 1 : manager.getOp(sides[0]) === OP_MUL ? 0 : -1;
    if (mulIndex !== -1) {
      const lhs = sides[1 - mulIndex];
      const factors = manager.args[sides[mulIndex]];
      if (factors.length === 2) {
        const valueIndex = manager.isNumeral(factors[0])
          ? 0
          : manager.isNumeral(factors[1])
            ? 1
            : -1;
        if (valueIndex !== -1)
          return manager.getNumeral(factors[valueIndex]) === 0
            ? manager.mkEq(lhs, manager.mkNumeral(0))
            : undefined;
      }
    }
    const solved = this.solveLinear(sides[0], sides[1]);
    return solved === undefined
      ? this.mkArithEq(sides[0], sides[1])
      : this.mkArithEq(solved.variable, solved.term);
  }

  // basic_solve_plugin::solve.
  private solveBasic(atom: number, isPositive: boolean): number {
    const manager = this.manager;
    const op = manager.getOp(atom);
    const args = manager.args[atom];
    let result = atom;
    if (op === OP_EQ) {
      const [lhs, rhs] = args;
      if (manager.isNot(lhs) && this.isVariable(manager.args[lhs][0]))
        result = manager.mkEq(manager.args[lhs][0], mkNot(manager, rhs));
      else if (manager.isNot(rhs) && this.isVariable(manager.args[rhs][0]))
        result = manager.mkEq(manager.args[rhs][0], mkNot(manager, lhs));
      else if (this.isVariable(rhs) && !this.isVariable(lhs)) result = manager.mkEq(rhs, lhs);
    }
    if (op === OP_ITE) {
      const thenResult = this.solveBasic(args[1], true);
      const elseResult = this.solveBasic(args[2], true);
      if (
        manager.getOp(thenResult) === OP_EQ &&
        manager.getOp(elseResult) === OP_EQ &&
        manager.args[thenResult][0] === manager.args[elseResult][0]
      ) {
        const variable = manager.args[thenResult][0];
        const term = manager.args[thenResult][1];
        result = manager.mkEq(
          variable,
          manager.mkApp(OP_ITE, [args[0], term, manager.args[elseResult][1]], manager.sorts[term]),
        );
      }
    }
    if (this.isVariable(atom) && manager.sorts[atom] === SORT_BOOL)
      return manager.mkEq(atom, isPositive ? manager.trueExpr : manager.falseExpr);
    return isPositive ? result : mkNot(manager, result);
  }

  // eq_der::is_var_eq.
  private getVarEq(expr: number): VarDefinition | undefined {
    const manager = this.manager;
    const isEq = manager.getOp(expr) === OP_EQ;
    if (isEq) {
      const sides = manager.args[expr];
      const isSwapped = !this.isVariable(sides[0]);
      const lhs = isSwapped ? sides[1] : sides[0];
      if (this.isVariable(lhs))
        return { index: manager.values[lhs], definition: isSwapped ? sides[0] : sides[1] };
    }
    const sort = isEq ? manager.sorts[manager.args[expr][0]] : manager.sorts[expr];
    const isNegated = manager.isNot(expr);
    const atom = isNegated ? manager.args[expr][0] : expr;
    const solved =
      sort === SORT_BOOL
        ? this.solveBasic(atom, !isNegated)
        : sort === SORT_INT && !isNegated && manager.getOp(atom) === OP_EQ
          ? this.solveArith(atom)
          : undefined;
    if (solved === undefined || solved === expr || manager.getOp(solved) !== OP_EQ)
      return undefined;
    const lhs = manager.args[solved][0];
    return this.isVariable(lhs)
      ? { index: manager.values[lhs], definition: manager.args[solved][1] }
      : undefined;
  }

  // eq_der::find_definitions: one definition per variable, preferring values, then ground terms,
  // then constants.
  private findDefinitions(conjs: number[]) {
    const manager = this.manager;
    const definitions: (number | undefined)[] = [];
    for (const conj of conjs) {
      const found = this.getVarEq(conj);
      if (found === undefined) continue;
      const definition = this.rewriter.rewrite(found.definition);
      const old = definitions[found.index];
      if (old === undefined) definitions[found.index] = definition;
      else if (
        !manager.isUniqueValue(old) &&
        (manager.isUniqueValue(definition) ||
          (manager.kinds[definition] === KIND_APP &&
            manager.isGround(definition) &&
            (manager.kinds[old] !== KIND_APP || !manager.isGround(old))) ||
          manager.isUninterpretedConst(definition))
      )
        definitions[found.index] = definition;
    }
    return definitions;
  }

  // eq_der::is_unconstrained: an integer variable that no other conjunct mentions.
  private isUnconstrained(variable: number, term: number, position: number, conjs: number[]) {
    const manager = this.manager;
    const index = manager.values[variable];
    return (
      manager.sorts[variable] === SORT_INT &&
      !isOccurring(manager, index, term) &&
      conjs.every((conj, other) => other === position || !isOccurring(manager, index, conj))
    );
  }

  // eq_der::remove_unconstrained: a disequality on an unconstrained integer variable holds.
  private removeUnconstrained(conjs: number[]) {
    const manager = this.manager;
    let isReduced = false;
    for (let isChanged = true; isChanged;) {
      isChanged = false;
      conjs.forEach((conj, position) => {
        if (!manager.isNot(conj) || manager.getOp(manager.args[conj][0]) !== OP_EQ) return;
        const [lhs, rhs] = manager.args[manager.args[conj][0]];
        if (
          (this.isVariable(lhs) && this.isUnconstrained(lhs, rhs, position, conjs)) ||
          (this.isVariable(rhs) && this.isUnconstrained(rhs, lhs, position, conjs))
        ) {
          conjs[position] = manager.trueExpr;
          isReduced = true;
          isChanged = true;
        }
      });
    }
    return isReduced;
  }

  // eq_der::operator() on conjuncts: reduce_var_set until nothing changes.
  private applyEqDer(input: number[]) {
    const manager = this.manager;
    let conjs = input;
    for (;;) {
      // flatten_definitions: a false conjunct is the whole conjunction.
      const falseConj = conjs.find((conj) => manager.isFalse(conj));
      if (falseConj !== undefined) conjs = [falseConj];
      let isReduced = false;
      const definitions = this.findDefinitions(conjs);
      if (definitions.some((definition) => definition !== undefined)) {
        const order = getEliminationOrder(manager, definitions);
        if (order.length > 0) {
          const substitution: (number | undefined)[] = [];
          for (const index of order) {
            const definition = definitions[index];
            if (definition !== undefined)
              substitution[index] = substitutePartial(manager, definition, substitution);
          }
          const substituted = substitutePartial(manager, manager.mkAnd(conjs), substitution);
          conjs = flattenAnd(manager, [this.rewriter.rewrite(substituted)]);
          isReduced = true;
        }
      }
      if (this.removeUnconstrained(conjs)) isReduced = true;
      if (!isReduced) return conjs;
    }
  }

  // The disjunction case of qe_lite::impl::operator(): each disjunct is a conjunction to reduce.
  private reduceDisjunction(formula: number) {
    const disjuncts = flattenOr(this.manager, [formula]).map((disjunct) =>
      this.rewriter.mkAnd(this.reduceConjunction([disjunct])),
    );
    return this.rewriter.mkOr(disjuncts);
  }

  // The conjunction case: a single non-ground conjunct is reduced as a disjunction, and otherwise
  // eq_der runs. fm only acts on linear integer bounds of the variables, which are not ported.
  private reduceConjunction(input: number[]) {
    const manager = this.manager;
    const conjs = flattenAnd(manager, input);
    const nonGround = conjs.flatMap((conj, index) => (manager.isGround(conj) ? [] : [index]));
    if (conjs.length > 1 && nonGround.length === 1) {
      conjs[nonGround[0]] = this.reduceDisjunction(conjs[nonGround[0]]);
      return conjs;
    }
    return this.applyEqDer(conjs);
  }

  // collect_negative_equalities: whether every occurrence of the variable is in a negative equality
  // with a term without it, or outside any equality.
  private collectNegativeEqualities(
    expr: number,
    index: number,
    isPositive: boolean,
    equalities: Set<number>,
  ): boolean {
    const manager = this.manager;
    if (manager.isGround(expr)) return true;
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) return manager.values[expr] !== index;
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      return !isOccurring(manager, index + data.sorts.length, data.body);
    }
    const op = manager.getOp(expr);
    const args = manager.args[expr];
    if (op === OP_NOT)
      return this.collectNegativeEqualities(args[0], index, !isPositive, equalities);
    if (op === OP_AND || op === OP_OR)
      return args.every((arg) =>
        this.collectNegativeEqualities(arg, index, isPositive, equalities),
      );
    if (op === OP_EQ) {
      const isLeftVar = manager.kinds[args[0]] === KIND_VAR && manager.values[args[0]] === index;
      const isRightVar = manager.kinds[args[1]] === KIND_VAR && manager.values[args[1]] === index;
      if (isLeftVar !== isRightVar) {
        const value = isLeftVar ? args[1] : args[0];
        if (!isPositive && !isOccurring(manager, index, value)) {
          equalities.add(expr);
          return true;
        }
      }
    }
    return !isOccurring(manager, index, expr);
  }

  // eliminate_diseq_vars: an integer variable that occurs only in negative equalities can avoid
  // every value they name, so those equalities are false.
  private eliminateDiseqVars(sorts: number[], body: number) {
    const manager = this.manager;
    const equalities = new Set<number>();
    for (let index = 0; index < sorts.length; index++) {
      const found = new Set<number>();
      if (
        sorts[sorts.length - index - 1] === SORT_INT &&
        this.collectNegativeEqualities(body, index, true, found)
      )
        for (const equality of found) equalities.add(equality);
    }
    if (equalities.size === 0) return body;
    const cache = new Map<number, number>();
    const replace = (expr: number): number => {
      if (equalities.has(expr)) return manager.falseExpr;
      if (manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0) return expr;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result = manager.mkApp(
        manager.decls[expr],
        manager.args[expr].map(replace),
        manager.sorts[expr],
      );
      cache.set(expr, result);
      return result;
    };
    return this.rewriter.rewrite(replace(body));
  }

  // extract_var_bound: an inclusive integer bound of the variable that a conjunct states.
  private getBound(expr: number, index: number): Bound | undefined {
    const manager = this.manager;
    const isNegated = manager.isNot(expr);
    const atom = isNegated ? manager.args[expr][0] : expr;
    const op = manager.getOp(atom);
    if (op !== OP_LE && op !== OP_GE && op !== OP_LT && op !== OP_GT) return undefined;
    const isSwapped = op === OP_GE || op === OP_GT;
    const isStrict = op === OP_LT || op === OP_GT;
    const lhs = manager.args[atom][isSwapped ? 1 : 0];
    const rhs = manager.args[atom][isSwapped ? 0 : 1];
    if (manager.sorts[lhs] !== SORT_INT) return undefined;
    const isIndex = (term: number) =>
      manager.kinds[term] === KIND_VAR && manager.values[term] === index;
    const isVarOnLeft = isIndex(lhs) && manager.isNumeral(rhs);
    if (!isVarOnLeft && !(isIndex(rhs) && manager.isNumeral(lhs))) return undefined;
    const numeral = manager.values[isVarOnLeft ? rhs : lhs];
    const value = isVarOnLeft
      ? isStrict
        ? numeral - 1
        : numeral
      : isStrict
        ? numeral + 1
        : numeral;
    if (!isNegated) return { index, isLower: !isVarOnLeft, value };
    return { index, isLower: isVarOnLeft, value: isVarOnLeft ? value + 1 : value - 1 };
  }

  // try_expand_bounded_quantifier: the disjunction of the body over every value of the integer
  // variables when their ranges are small.
  private expandBounded(sorts: number[], body: number) {
    const manager = this.manager;
    const numDecls = sorts.length;
    const used = collectUsedVars(manager, body, numDecls);
    const remaining = used.flatMap((isUsed, index) => (isUsed ? [index] : []));
    if (remaining.length === 0) return undefined;
    // Z3 checks the declaration at position i for the variable with de Bruijn index i, which is
    // another variable's sort. This port checks the variable's own sort.
    if (remaining.some((index) => sorts[numDecls - 1 - index] !== SORT_INT)) return undefined;
    const conjs = flattenAnd(manager, [body]);
    const lowers: (number | undefined)[] = [];
    const uppers: (number | undefined)[] = [];
    const isBoundConj = conjs.map((conj) => {
      let isBound = false;
      for (const index of remaining) {
        const bound = this.getBound(conj, index);
        if (bound === undefined) continue;
        const bounds = bound.isLower ? lowers : uppers;
        const old = bounds[index];
        if (old === undefined || (bound.isLower ? bound.value > old : bound.value < old))
          bounds[index] = bound.value;
        isBound = true;
      }
      return isBound;
    });
    let domainSize = 1;
    for (const index of remaining) {
      const lower = lowers[index];
      const upper = uppers[index];
      if (lower === undefined || upper === undefined) return undefined;
      const size = upper - lower + 1;
      if (size <= 0) return manager.falseExpr;
      domainSize *= size;
      if (domainSize > EXPAND_BOUND_LIMIT) return undefined;
    }
    const payload = conjs.filter((_conj, position) => !isBoundConj[position]);
    const values = remaining.map((index) => lowers[index] ?? 0);
    const disjuncts: number[] = [];
    for (;;) {
      const bindings = Array.from({ length: numDecls }, (_value, position) => {
        const index = numDecls - position - 1;
        const valueIndex = remaining.indexOf(index);
        return valueIndex === -1
          ? manager.mkVar(index, sorts[position])
          : manager.mkNumeral(values[valueIndex]);
      });
      disjuncts.push(
        this.rewriter.mkAnd(payload.map((conj) => substitute(manager, conj, bindings))),
      );
      // The rightmost variable moves first.
      let position = remaining.length - 1;
      for (; position >= 0; position--) {
        const index = remaining[position];
        values[position]++;
        if (values[position] <= (uppers[index] ?? 0)) break;
        values[position] = lowers[index] ?? 0;
      }
      if (position < 0) break;
    }
    return this.rewriter.mkOr(disjuncts);
  }

  // elim_cfg::reduce_quantifier.
  private reduceQuantifier(quantifier: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    this.numVars = data.sorts.length;
    const reduced = this.reduceDisjunction(data.isForall ? manager.mkNot(body) : body);
    const result = this.eliminateDiseqVars(data.sorts, reduced);
    const expanded = this.expandBounded(data.sorts, result);
    if (expanded !== undefined)
      return this.rewriter.rewrite(data.isForall ? pushNot(manager, expanded) : expanded);
    const newBody = data.isForall ? pushNot(manager, result) : result;
    return this.rewriter.rewrite(
      newBody === data.body ? quantifier : manager.mkQuantifier({ ...data, body: newBody }),
    );
  }

  // elim_star: rewrites the quantifiers bottom-up.
  apply(formula: number) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const visit = (expr: number): number => {
      if (!manager.hasQuantifierFlags[expr]) return expr;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result =
        manager.kinds[expr] === KIND_QUANTIFIER
          ? this.reduceQuantifier(expr, visit(manager.getQuantifier(expr).body))
          : manager.mkApp(manager.decls[expr], manager.args[expr].map(visit), manager.sorts[expr]);
      cache.set(expr, result);
      return result;
    };
    return visit(formula);
  }
}

// qe_lite_simplifier::reduce on each formula with a quantifier.
export const qeLite = (manager: AstManager, formulas: number[]) => {
  const qe = new QeLite(manager);
  return formulas.map((formula) => qe.apply(formula));
};
