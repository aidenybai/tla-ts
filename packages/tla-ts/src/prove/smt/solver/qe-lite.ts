// Ported from Z3 (src/qe/lite/qe_lite_tactic.cpp, src/qe/mbp/mbp_solve_plugin.cpp), MIT license, see
// z3-license.txt. The qe-lite tactic of Z3's ufnia strategy: each quantifier, innermost first, loses
// the variables that its body defines by an equality, Fourier-Motzkin elimination removes integer
// variables that only occur in bounds, and a quantifier over a small integer range becomes a finite
// disjunction. Like Z3, the port counts references, so that expressions are created and deleted in
// Z3's order. Arrays, bit-vectors and datatypes are not ported, as tlapm's encoding does not produce
// them.
import { SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import {
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { flattenAndVector, flattenOrVector, mkNot, pushNotOwned } from "./ast-util";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { isOccurring } from "./der";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { Goal } from "./goal";
import { ObjHashtable } from "./hashtable";
import { RefVector } from "./ref-vector";
import { Rewriter } from "./rewriter";
import { BetaReducer, InvVarShifter, RewriterTpl } from "./rewriter-tpl";
import { collectUsedVars, VarSubst } from "./var-subst";

// qe_lite's EXPAND_BOUND_LIMIT: the largest integer range that is expanded.
const EXPAND_BOUND_LIMIT = 10000;
// fm's parameters.
const FM_LIMIT = 5000000;
const FM_CUTOFF1 = 8;
const FM_CUTOFF2 = 256;
const FM_EXTRA = 0;

// expr_ref's assignment: the new value gains a reference before the old one loses its own.
const assign = (manager: AstManager, old: number, value: number) => {
  if (value !== -1) manager.incRef(value);
  if (old !== -1) manager.decRef(old);
  return value;
};

// expr_ref's move assignment of a value the caller owns.
const assignOwned = (manager: AstManager, old: number, value: number) => {
  if (old !== -1) manager.decRef(old);
  return value;
};

const release = (manager: AstManager, expr: number) => {
  if (expr !== -1) manager.decRef(expr);
};

// tactic::checkpoint.
const checkpoint = (manager: AstManager) => {
  if (!manager.limit.inc()) throw new SmtCanceledError();
};

const newRewriter = (manager: AstManager) =>
  new Rewriter(manager, {
    isEliminatingAnd: false,
    arith: TACTIC_ARITH_OPTIONS,
    isRewritingPatterns: false,
  });

const getGcd = (first: number, second: number) => {
  let left = Math.abs(first);
  let right = Math.abs(second);
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};

const checkSafe = (value: number) => {
  if (!Number.isSafeInteger(value))
    throw new SmtUnsupportedError(`the coefficient ${value} is too large`);
  return value;
};

// A summand of a linear equation and whether it is on the left-hand side.
interface SignedExpr {
  isLeft: boolean;
  expr: number;
}

interface SolvedVar {
  variable: number;
  // Held by a reference that the receiver releases.
  term: number;
}

// eq_der: destructive equality resolution on a conjunction.
class EqDer {
  private subst: BetaReducer;
  private substMap: RefVector;
  private newExprs: RefVector;
  private rewriter: Rewriter;
  private map: number[] = [];
  private pos2var: number[] = [];
  private var2pos: number[] = [];
  private inx2var: number[] = [];
  private order: number[] = [];
  // is_variable_test: the variables of the quantifier at hand are those below this index.
  numVars = 0;

  constructor(private manager: AstManager) {
    this.subst = new BetaReducer(manager);
    this.substMap = new RefVector(manager);
    this.newExprs = new RefVector(manager);
    this.rewriter = newRewriter(manager);
  }

  private isVariable(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_VAR && manager.values[expr] < this.numVars;
  }

  // operator(): reduce_var_set until nothing changes.
  apply(conjs: RefVector) {
    while (this.reduceVarSet(conjs));
    this.newExprs.reset();
  }

  // ~eq_der.
  release() {
    this.rewriter.release();
    this.newExprs.reset();
    this.substMap.reset();
    this.subst.release();
  }

  private reduceVarSet(conjs: RefVector) {
    const manager = this.manager;
    // flatten_definitions: a false conjunct is the whole conjunction.
    const falseConj = conjs.items.find((conj) => manager.isFalse(conj));
    if (falseConj !== undefined) {
      conjs.set(0, falseConj);
      conjs.shrink(1);
    }
    let isReduced = false;
    const found = this.findDefinitions(conjs.items);
    if (found.numDefs > 0) {
      this.sortVars();
      if (this.order.length > 0) {
        const conjunction = manager.mkApp(OP_AND, conjs.items, SORT_BOOL);
        manager.incRef(conjunction);
        this.createSubstitution(found.largestIndex + 1);
        let substituted = this.subst.rewriteWithBindings(conjunction, this.substMap.items);
        substituted = assignOwned(manager, substituted, this.rewriter.rewrite(substituted));
        conjs.reset();
        conjs.push(substituted);
        flattenAndVector(manager, conjs);
        isReduced = true;
        manager.decRef(substituted);
        manager.decRef(conjunction);
      }
    }
    return this.removeUnconstrained(conjs) || isReduced;
  }

  // find_definitions: one definition per variable, preferring values, then ground terms, then
  // constants.
  private findDefinitions(args: number[]) {
    const manager = this.manager;
    let numDefs = 0;
    let largestIndex = 0;
    this.map = [];
    this.pos2var = args.map(() => -1);
    this.var2pos = [];
    this.inx2var = [];
    args.forEach((arg, position) => {
      checkpoint(manager);
      const vars: number[] = [];
      const terms = new RefVector(manager);
      let term = -1;
      if (this.getVarEq(arg, vars, terms))
        vars.forEach((variable, index) => {
          term = assign(manager, term, terms.items[index]);
          term = assignOwned(manager, term, this.rewriter.rewrite(term));
          if (term !== terms.items[index]) this.newExprs.push(term);
          const varIndex = manager.values[variable];
          const old = this.map[varIndex] ?? -1;
          if (old === -1) {
            this.map[varIndex] = term;
            this.inx2var[varIndex] = variable;
            this.pos2var[position] = varIndex;
            this.var2pos[varIndex] = position;
            numDefs++;
            largestIndex = Math.max(varIndex, largestIndex);
          } else if (
            manager.isUniqueValue(old) ||
            !(
              manager.isUniqueValue(term) ||
              (manager.isGroundApp(term) && !manager.isGroundApp(old)) ||
              manager.isUninterpretedConst(term)
            )
          )
            return;
          else {
            this.pos2var[this.var2pos[varIndex]] = -1;
            this.pos2var[position] = varIndex;
            this.var2pos[varIndex] = position;
            this.map[varIndex] = term;
          }
          this.newExprs.pushOwned(term);
          term = -1;
        });
      release(manager, term);
      terms.reset();
    });
    return { numDefs, largestIndex };
  }

  // is_var_eq: a variable and its definition from a literal, through the solve plugin of the sort.
  private getVarEq(expr: number, vars: number[], terms: RefVector) {
    const manager = this.manager;
    const isEq = manager.getOp(expr) === OP_EQ;
    if (isEq) {
      const [lhs, rhs] = manager.args[expr];
      const isSwapped = !this.isVariable(lhs);
      if (this.isVariable(isSwapped ? rhs : lhs)) {
        vars.push(isSwapped ? rhs : lhs);
        terms.push(isSwapped ? lhs : rhs);
        return true;
      }
    }
    const sort = isEq ? manager.sorts[manager.args[expr][0]] : manager.sorts[expr];
    if (sort !== SORT_BOOL && sort !== SORT_INT) return false;
    // solve_plugin::operator(): the arithmetic plugin only sees positive equalities.
    const isNegated = manager.isNot(expr);
    const solved =
      sort === SORT_INT
        ? this.solveArithEq(expr)
        : this.solveBasic(isNegated ? manager.args[expr][0] : expr, !isNegated);
    const isFound =
      solved !== expr &&
      manager.getOp(solved) === OP_EQ &&
      this.isVariable(manager.args[solved][0]);
    if (isFound) {
      vars.push(manager.args[solved][0]);
      terms.push(manager.args[solved][1]);
    }
    manager.decRef(solved);
    return isFound;
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
    const [first, second] = manager.args[expr];
    const secondValue = this.getInvertibleConst(second);
    if (this.isVariable(first) && secondValue !== undefined)
      return { variable: first, coefficient: secondValue };
    const firstValue = this.getInvertibleConst(first);
    if (this.isVariable(second) && firstValue !== undefined)
      return { variable: second, coefficient: firstValue };
    return undefined;
  }

  // arith_solve_plugin::solve: lhs = rhs as variable = term.
  private solveLinear(lhs: number, rhs: number): SolvedVar | undefined {
    const manager = this.manager;
    if (manager.sorts[lhs] !== SORT_INT) return undefined;
    const todo: SignedExpr[] = [
      { isLeft: true, expr: lhs },
      { isLeft: false, expr: rhs },
    ];
    const done: SignedExpr[] = [];
    for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
      const op = manager.getOp(item.expr);
      const args = manager.args[item.expr];
      if (op === OP_ADD) for (const arg of args) todo.push({ isLeft: item.isLeft, expr: arg });
      else if (op === OP_SUB) {
        todo.push({ isLeft: item.isLeft, expr: args[0] });
        for (const arg of args.slice(1)) todo.push({ isLeft: !item.isLeft, expr: arg });
      } else if (op === OP_UMINUS) todo.push({ isLeft: !item.isLeft, expr: args[0] });
      else {
        const mul = this.getInvertibleMul(item.expr);
        if (mul === undefined) {
          done.push(item);
          continue;
        }
        done.push(...todo);
        // mk_term: the other summands times the inverse of the coefficient, negated on the
        // variable's side.
        const coefficient = 1 / mul.coefficient;
        const isLeft = item.isLeft;
        const terms = new RefVector(manager);
        for (const summand of done) {
          const factor = summand.isLeft === isLeft ? -coefficient : coefficient;
          terms.push(
            factor === 1
              ? summand.expr
              : manager.mkApp(OP_MUL, [manager.mkNumeral(factor), summand.expr], SORT_INT),
          );
        }
        const term =
          terms.size === 0
            ? manager.mkNumeral(0)
            : terms.size === 1
              ? terms.items[0]
              : manager.mkApp(OP_ADD, terms.items, SORT_INT);
        manager.incRef(term);
        terms.reset();
        return { variable: mul.variable, term };
      }
    }
    return undefined;
  }

  // arith_solve_plugin::mk_eq_core.
  private mkArithEqCore(inputLeft: number, inputRight: number) {
    const manager = this.manager;
    const solved = this.solveLinear(inputLeft, inputRight);
    if (solved !== undefined) {
      const result = manager.mkEq(solved.variable, solved.term);
      manager.incRef(result);
      manager.decRef(solved.term);
      return result;
    }
    const isLeftZero = manager.getNumeral(inputLeft) === 0;
    let left = isLeftZero ? inputRight : inputLeft;
    let right = isLeftZero ? inputLeft : inputRight;
    const leftArgs = manager.args[left];
    if (
      manager.getNumeral(right) === 0 &&
      manager.getOp(left) === OP_ADD &&
      leftArgs.length === 2
    ) {
      const negatedSecond = manager.getTimesMinusOneArg(leftArgs[1]);
      const negatedFirst = manager.getTimesMinusOneArg(leftArgs[0]);
      if (negatedSecond !== undefined) [left, right] = [leftArgs[0], negatedSecond];
      else if (negatedFirst !== undefined) [left, right] = [leftArgs[1], negatedFirst];
    }
    const result = manager.mkEq(left, right);
    manager.incRef(result);
    return result;
  }

  // arith_solve_plugin::try_int_mul_solve: k*y = x becomes y = x div k and x mod k = 0, or x = 0
  // when k is zero.
  private tryIntMulSolve(atom: number) {
    const manager = this.manager;
    let [lhs, rhs] = manager.args[atom];
    if (manager.sorts[lhs] !== SORT_INT) return -1;
    if (manager.getOp(rhs) !== OP_MUL) {
      if (manager.getOp(lhs) !== OP_MUL) return -1;
      [lhs, rhs] = [rhs, lhs];
    }
    if (manager.args[rhs].length !== 2) return -1;
    let [first, second] = manager.args[rhs];
    if (!manager.isNumeral(first)) {
      if (!manager.isNumeral(second)) return -1;
      [first, second] = [second, first];
    }
    if (manager.values[first] === 0) {
      const result = manager.mkEq(lhs, manager.mkNumeral(0));
      manager.incRef(result);
      return result;
    }
    const held = new RefVector(manager);
    const quotientEq = manager.mkEq(second, manager.mkApp(OP_IDIV, [lhs, first], SORT_INT));
    held.push(quotientEq);
    const zero = manager.mkNumeral(0);
    held.push(zero);
    const remainder = manager.mkApp(OP_MOD, [lhs, first], SORT_INT);
    held.push(remainder);
    const remainderEq = manager.mkEq(zero, remainder);
    held.push(remainderEq);
    const result = manager.mkApp(OP_AND, [quotientEq, remainderEq], SORT_BOOL);
    manager.incRef(result);
    held.items.reverse();
    held.reset();
    return result;
  }

  // arith_solve_plugin::solve on a positive equality.
  private solveArithEq(atom: number) {
    const manager = this.manager;
    const mulSolved = this.tryIntMulSolve(atom);
    if (mulSolved !== -1) return mulSolved;
    const [lhs, rhs] = manager.args[atom];
    let variable = assign(manager, -1, lhs);
    let term = assign(manager, -1, rhs);
    const solved = this.solveLinear(lhs, rhs);
    if (solved !== undefined) {
      variable = assign(manager, variable, solved.variable);
      term = assignOwned(manager, term, solved.term);
    }
    const result = this.mkArithEqCore(variable, term);
    manager.decRef(term);
    manager.decRef(variable);
    return result;
  }

  // basic_solve_plugin::solve.
  private solveBasic(atom: number, isPositive: boolean): number {
    const manager = this.manager;
    let result = assign(manager, -1, atom);
    if (manager.getOp(atom) === OP_EQ) {
      const [lhs, rhs] = manager.args[atom];
      if (manager.isNot(lhs) && this.isVariable(manager.args[lhs][0]))
        result = assign(manager, result, manager.mkEq(manager.args[lhs][0], mkNot(manager, rhs)));
      else if (manager.isNot(rhs) && this.isVariable(manager.args[rhs][0]))
        result = assign(manager, result, manager.mkEq(manager.args[rhs][0], mkNot(manager, lhs)));
      else if (this.isVariable(rhs) && !this.isVariable(lhs))
        result = assign(manager, result, manager.mkEq(rhs, lhs));
    }
    if (manager.getOp(atom) === OP_ITE) {
      const [condition, thenExpr, elseExpr] = manager.args[atom];
      const thenSolved = this.solveBasic(thenExpr, true);
      const elseSolved = this.solveBasic(elseExpr, true);
      if (
        manager.getOp(thenSolved) === OP_EQ &&
        manager.getOp(elseSolved) === OP_EQ &&
        manager.args[thenSolved][0] === manager.args[elseSolved][0]
      ) {
        const thenTerm = manager.args[thenSolved][1];
        const ite = manager.mkApp(
          OP_ITE,
          [condition, thenTerm, manager.args[elseSolved][1]],
          manager.sorts[thenTerm],
        );
        result = assign(manager, result, manager.mkEq(manager.args[thenSolved][0], ite));
      }
      manager.decRef(elseSolved);
      manager.decRef(thenSolved);
    }
    if (this.isVariable(atom) && manager.sorts[atom] === SORT_BOOL)
      return assign(
        manager,
        result,
        manager.mkEq(atom, isPositive ? manager.trueExpr : manager.falseExpr),
      );
    if (isPositive) return result;
    const negated = assign(manager, -1, mkNot(manager, result));
    manager.decRef(result);
    return negated;
  }

  // der_sort_vars: the definitions in an order where each only uses the ones before it, dropping
  // the definitions on a cycle.
  private sortVars() {
    const manager = this.manager;
    const definitions = this.map;
    const getDefinition = (index: number) => definitions[index] ?? -1;
    this.order = [];
    let isFound = false;
    for (let index = 0; index < definitions.length; index++) {
      const definition = getDefinition(index);
      if (
        definition === -1 ||
        manager.hasQuantifierFlags[definition] ||
        isOccurring(manager, manager.values[this.inx2var[index]], definition)
      )
        definitions[index] = -1;
      else isFound = true;
    }
    if (!isFound) return;
    const visiting = new Set<number>();
    const done = new Set<number>();
    for (let index = 0; index < definitions.length; index++) {
      if (getDefinition(index) === -1) continue;
      const todo: [number, number][] = [[this.inx2var[index], 0]];
      while (todo.length > 0) {
        const frame = todo[todo.length - 1];
        const expr = frame[0];
        if (done.has(expr)) {
          todo.pop();
          continue;
        }
        if (manager.kinds[expr] === KIND_VAR) {
          const varIndex = manager.values[expr];
          if (frame[1] === 0 && getDefinition(varIndex) !== -1) {
            if (!visiting.has(expr)) {
              visiting.add(expr);
              frame[1] = 1;
              todo.push([getDefinition(varIndex), 0]);
              continue;
            }
            visiting.delete(expr);
            definitions[varIndex] = -1;
          } else if (frame[1] === 1) {
            visiting.delete(expr);
            if (getDefinition(varIndex) !== -1) this.order.push(varIndex);
          }
        } else {
          const args = manager.args[expr];
          let isPushed = false;
          while (frame[1] < args.length && !isPushed) {
            const arg = args[frame[1]++];
            if (!done.has(arg)) {
              todo.push([arg, 0]);
              isPushed = true;
            }
          }
          if (isPushed) continue;
        }
        done.add(expr);
        todo.pop();
      }
    }
  }

  private createSubstitution(size: number) {
    const manager = this.manager;
    this.substMap.reset();
    this.substMap.resize(size);
    this.subst.reset();
    this.subst.setInvBindings(this.substMap.items);
    for (const index of this.order) {
      const definition = this.map[index];
      const result = manager.isGroundApp(definition)
        ? assign(manager, -1, definition)
        : this.subst.rewrite(definition);
      const position = size - index - 1;
      this.subst.updateInvBindingAt(position, result);
      this.substMap.setOwned(position, result);
    }
  }

  // is_unconstrained: an integer variable that no other conjunct mentions.
  private isUnconstrained(variable: number, term: number, position: number, conjs: number[]) {
    const manager = this.manager;
    const index = manager.values[variable];
    return (
      manager.sorts[variable] === SORT_INT &&
      !isOccurring(manager, index, term) &&
      conjs.every((conj, other) => other === position || !isOccurring(manager, index, conj))
    );
  }

  // remove_unconstrained: a disequality on an unconstrained integer variable holds.
  private removeUnconstrained(conjs: RefVector) {
    const manager = this.manager;
    let isReduced = false;
    for (let isChanged = true; isChanged;) {
      isChanged = false;
      for (let position = 0; position < conjs.size; position++) {
        const conj = conjs.items[position];
        if (!manager.isNot(conj) || manager.getOp(manager.args[conj][0]) !== OP_EQ) continue;
        const [lhs, rhs] = manager.args[manager.args[conj][0]];
        if (
          (this.isVariable(lhs) && this.isUnconstrained(lhs, rhs, position, conjs.items)) ||
          (this.isVariable(rhs) && this.isUnconstrained(rhs, lhs, position, conjs.items))
        ) {
          conjs.set(position, manager.trueExpr);
          isReduced = true;
          isChanged = true;
        }
      }
    }
    return isReduced;
  }
}

// A clause of Boolean literals and one linear inequality, a1*x1 + ... + an*xn <= c, or < c when
// strict. A literal is the index of a Boolean constant, negative when negated.
interface Constraint {
  lits: number[];
  xs: number[];
  as: number[];
  c: number;
  isStrict: boolean;
  isDead: boolean;
}

// fm: Fourier-Motzkin elimination of the integer variables that only occur in clauses with one
// linear inequality.
class Fm {
  private constraints: Constraint[] = [];
  private bvar2expr: RefVector;
  private bvar2sign: number[] = [];
  private expr2bvar = new Map<number, number>();
  private isInt: boolean[] = [];
  private forbidden: boolean[] = [];
  private var2expr: RefVector;
  private expr2var = new Map<number, number>();
  private var2pos: number[] = [];
  private lowers: Constraint[][] = [];
  private uppers: Constraint[][] = [];
  private forbiddenSet = new Set<number>();
  private newFmls: RefVector;
  private counter = 0;
  private isInconsistent = false;
  // m_sub_todo: the constraints to check for backward subsumption.
  private subTodo: Constraint[] = [];
  numVars = 0;

  constructor(private manager: AstManager) {
    this.bvar2expr = new RefVector(manager);
    this.var2expr = new RefVector(manager);
    this.newFmls = new RefVector(manager);
  }

  // ~fm.
  release() {
    this.resetConstraints();
    this.newFmls.reset();
    this.var2expr.reset();
    this.bvar2expr.reset();
  }

  apply(fmls: RefVector) {
    const manager = this.manager;
    this.init(fmls.items);
    this.initUseList(fmls.items);
    if (fmls.items.some((fml) => manager.hasQuantifierFlags[fml])) return;
    if (this.isInconsistent) this.setFalse();
    else {
      this.subsume();
      for (const variable of this.sortCandidates()) {
        checkpoint(manager);
        if (this.counter > FM_LIMIT) break;
        this.counter++;
        this.tryEliminate(variable);
        if (this.isInconsistent) {
          this.setFalse();
          break;
        }
      }
      if (!this.isInconsistent) this.copyRemaining();
    }
    this.resetConstraints();
    fmls.reset();
    for (const fml of this.newFmls.items) fmls.push(fml);
  }

  private setFalse() {
    this.newFmls.reset();
    this.newFmls.push(this.manager.falseExpr);
  }

  // Z3 keeps m_expr2bvar from the previous run, whose indices then point into the new, shorter
  // m_bvar2expr. This port clears it.
  private init(fmls: number[]) {
    this.subTodo = [];
    this.resetConstraints();
    this.bvar2expr.reset();
    this.bvar2sign = [0];
    this.bvar2expr.push(-1);
    this.expr2bvar.clear();
    this.expr2var.clear();
    this.isInt = [];
    this.var2pos = [];
    this.forbidden = [];
    this.var2expr.reset();
    this.lowers = [];
    this.uppers = [];
    this.newFmls.reset();
    this.counter = 0;
    this.isInconsistent = false;
    this.initForbiddenSet(fmls);
  }

  private isVariable(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_VAR && manager.values[expr] < this.numVars;
  }

  private isLiteral(expr: number) {
    const manager = this.manager;
    return (
      manager.isUninterpretedConst(expr) ||
      (manager.isNot(expr) && manager.isUninterpretedConst(manager.args[expr][0]))
    );
  }

  // is_linear_mon_core: the variable of x or c*x.
  private getMonomialVar(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_MUL && manager.args[expr].length === 2) {
      const [coefficient, variable] = manager.args[expr];
      if (manager.isNumeral(coefficient) && this.isVariable(variable)) return variable;
    }
    return this.isVariable(expr) ? expr : -1;
  }

  private isLinearPol(expr: number) {
    const manager = this.manager;
    const monomials = manager.getOp(expr) === OP_ADD ? manager.args[expr] : [expr];
    const visited = new Set<number>();
    let isAllForbidden = true;
    for (const monomial of monomials) {
      const variable = this.getMonomialVar(monomial);
      if (variable === -1 || visited.has(variable)) return false;
      visited.add(variable);
      if (!this.forbiddenSet.has(manager.values[variable])) isAllForbidden = false;
    }
    return !isAllForbidden;
  }

  private isLinearIneq(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.args[expr][0] : expr;
    const op = manager.getOp(atom);
    if ((op !== OP_LE && op !== OP_GE) || manager.args[atom].length !== 2) return false;
    const [lhs, rhs] = manager.args[atom];
    return manager.isNumeral(rhs) && this.isLinearPol(lhs);
  }

  // is_occ: a clause of literals with one linear inequality.
  private isOcc(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_OR) return this.isLinearIneq(expr);
    let isFound = false;
    for (const arg of manager.args[expr]) {
      if (this.isLiteral(arg)) continue;
      if (!this.isLinearIneq(arg) || isFound) return false;
      isFound = true;
    }
    return isFound;
  }

  // init_forbidden_set: the integer variables that occur outside the clauses are not eliminated.
  private initForbiddenSet(fmls: number[]) {
    const manager = this.manager;
    this.forbiddenSet.clear();
    const visited = new Set<number>();
    for (const fml of fmls) {
      if (this.isOcc(fml)) continue;
      const todo = [fml];
      for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
        if (visited.has(expr)) continue;
        visited.add(expr);
        const kind = manager.kinds[expr];
        if (kind === KIND_VAR) {
          if (this.isVariable(expr) && manager.sorts[expr] === SORT_INT)
            this.forbiddenSet.add(manager.values[expr]);
        } else if (kind === KIND_QUANTIFIER) {
          const data = manager.getQuantifier(expr);
          todo.push(data.body, ...data.patterns);
        } else todo.push(...manager.args[expr]);
      }
    }
  }

  private initUseList(fmls: number[]) {
    for (const fml of fmls) {
      if (this.isInconsistent) break;
      if (this.isOcc(fml)) this.addConstraint(fml);
      else this.newFmls.push(fml);
    }
  }

  private toVar(expr: number) {
    const manager = this.manager;
    const existing = this.expr2var.get(expr);
    if (existing !== undefined) return existing;
    const variable = this.var2expr.size;
    this.var2expr.push(expr);
    this.isInt.push(manager.sorts[expr] === SORT_INT);
    this.var2pos.push(-1);
    this.expr2var.set(expr, variable);
    this.lowers.push([]);
    this.uppers.push([]);
    this.forbidden.push(this.forbiddenSet.has(manager.values[expr]));
    return variable;
  }

  private toLiteral(expr: number) {
    const manager = this.manager;
    const isNegated = manager.isNot(expr);
    const atom = isNegated ? manager.args[expr][0] : expr;
    let bvar = this.expr2bvar.get(atom);
    if (bvar === undefined) {
      bvar = this.bvar2expr.size;
      this.bvar2expr.push(atom);
      this.bvar2sign.push(0);
      this.expr2bvar.set(atom, bvar);
    }
    return isNegated ? -bvar : bvar;
  }

  private addConstraint(fml: number) {
    const manager = this.manager;
    const args = manager.getOp(fml) === OP_OR ? manager.args[fml] : [fml];
    const lits: number[] = [];
    const xs: number[] = [];
    const as: number[] = [];
    let c = 0;
    let isStrict = false;
    for (const arg of args) {
      if (this.isLiteral(arg)) {
        lits.push(this.toLiteral(arg));
        continue;
      }
      const isNegated = manager.isNot(arg);
      const atom = isNegated ? manager.args[arg][0] : arg;
      isStrict = isNegated;
      const isFlipped = manager.getOp(atom) === OP_GE ? !isNegated : isNegated;
      const [lhs, rhs] = manager.args[atom];
      c = isFlipped ? -manager.values[rhs] : manager.values[rhs];
      const monomials = manager.getOp(lhs) === OP_ADD ? manager.args[lhs] : [lhs];
      let isAllInt = true;
      for (const monomial of monomials) {
        const isScaled = manager.getOp(monomial) === OP_MUL && manager.args[monomial].length === 2;
        const coefficient = isScaled ? manager.values[manager.args[monomial][0]] : 1;
        const variable = this.toVar(isScaled ? manager.args[monomial][1] : monomial);
        xs.push(variable);
        as.push(isFlipped ? -coefficient : coefficient);
        if (!this.isInt[variable]) isAllInt = false;
      }
      if (isAllInt && isStrict) {
        isStrict = false;
        c--;
      }
    }
    this.registerConstraint({ lits, xs, as, c, isStrict, isDead: false });
  }

  // normalize_coeffs: divides by the gcd of the coefficients and the constant.
  private normalizeCoeffs(constraint: Constraint) {
    if (constraint.xs.length === 0) return;
    let divisor = Math.abs(constraint.c);
    for (const coefficient of constraint.as) {
      if (divisor === 1) break;
      divisor = getGcd(coefficient, divisor);
    }
    if (divisor === 1) return;
    constraint.c /= divisor;
    constraint.as = constraint.as.map((coefficient) => coefficient / divisor);
  }

  private isFalseConstraint(constraint: Constraint) {
    return (
      constraint.lits.length === 0 &&
      constraint.xs.length === 0 &&
      (constraint.c < 0 || (constraint.isStrict && constraint.c === 0))
    );
  }

  private registerConstraint(constraint: Constraint) {
    this.normalizeCoeffs(constraint);
    if (this.isFalseConstraint(constraint)) {
      this.delConstraint(constraint);
      this.isInconsistent = true;
      return;
    }
    let isIndexed = false;
    constraint.xs.forEach((variable, index) => {
      if (this.forbidden[variable]) return;
      isIndexed = true;
      (constraint.as[index] < 0 ? this.lowers : this.uppers)[variable].push(constraint);
    });
    if (isIndexed) {
      if (!this.subTodo.includes(constraint)) this.subTodo.push(constraint);
      this.constraints.push(constraint);
      return;
    }
    this.newFmls.push(this.toExpr(constraint));
    this.delConstraint(constraint);
  }

  private delConstraint(constraint: Constraint) {
    const position = this.subTodo.indexOf(constraint);
    if (position === -1) return;
    const last = this.subTodo.pop() as Constraint;
    if (position < this.subTodo.length) this.subTodo[position] = last;
  }

  private resetConstraints() {
    for (const constraint of this.constraints) this.delConstraint(constraint);
    this.constraints = [];
  }

  // to_expr: the constraint as a formula, with a raw reference like Z3's.
  private toExpr(constraint: Constraint) {
    const manager = this.manager;
    let ineq = -1;
    if (constraint.xs.length === 0) {
      if (constraint.c > 0 || (!constraint.isStrict && constraint.c === 0)) return manager.trueExpr;
    } else {
      const monomials = constraint.xs.map((variable, index) => {
        const expr = this.var2expr.items[variable];
        const coefficient = constraint.as[index];
        return coefficient === 1
          ? expr
          : manager.mkApp(OP_MUL, [manager.mkNumeral(coefficient), expr], SORT_INT);
      });
      const lhs =
        monomials.length === 1 ? monomials[0] : manager.mkApp(OP_ADD, monomials, SORT_INT);
      const rhs = manager.mkNumeral(constraint.c);
      ineq = constraint.isStrict
        ? manager.mkApp(OP_NOT, [manager.mkApp(OP_GE, [lhs, rhs], SORT_BOOL)], SORT_BOOL)
        : manager.mkApp(OP_LE, [lhs, rhs], SORT_BOOL);
    }
    if (constraint.lits.length === 0) return ineq === -1 ? manager.falseExpr : ineq;
    const lits = constraint.lits.map((lit) => {
      const atom = this.bvar2expr.items[Math.abs(lit)];
      return lit < 0 ? manager.mkApp(OP_NOT, [atom], SORT_BOOL) : atom;
    });
    if (ineq !== -1) lits.push(ineq);
    return lits.length === 1 ? lits[0] : manager.mkApp(OP_OR, lits, SORT_BOOL);
  }

  // subsumes: c1's literals are among c2's, the polynomials are the same, and c1's bound is at most
  // c2's.
  private isSubsuming(first: Constraint, second: Constraint) {
    if (first === second) return false;
    if (first.lits.length > second.lits.length || first.xs.length !== second.xs.length)
      return false;
    if (first.c > second.c) return false;
    if (!first.isStrict && second.isStrict && first.c === second.c) return false;
    this.counter += first.lits.length + second.lits.length;
    first.xs.forEach((variable, index) => {
      this.var2pos[variable] = index;
    });
    const isSamePol = second.xs.every((variable, index) => {
      const position = this.var2pos[variable];
      return position !== -1 && first.as[position] === second.as[index];
    });
    for (const variable of first.xs) this.var2pos[variable] = -1;
    if (!isSamePol) return false;
    for (const lit of second.lits) this.bvar2sign[Math.abs(lit)] = lit < 0 ? -1 : 1;
    const isSubset = first.lits.every(
      (lit) => this.bvar2sign[Math.abs(lit)] === (lit < 0 ? -1 : 1),
    );
    for (const lit of second.lits) this.bvar2sign[Math.abs(lit)] = 0;
    return isSubset;
  }

  private backwardSubsumption(constraint: Constraint) {
    if (constraint.xs.length === 0) return;
    let best = -1;
    let bestSize = Infinity;
    let isBestLower = false;
    constraint.xs.forEach((variable, index) => {
      if (this.forbidden[variable]) return;
      const isLower = constraint.as[index] < 0;
      const candidates = (isLower ? this.lowers : this.uppers)[variable];
      if (candidates.length < bestSize) {
        best = variable;
        bestSize = candidates.length;
        isBestLower = isLower;
      }
    });
    if (bestSize === 0 || best === -1) return;
    const lists = isBestLower ? this.lowers : this.uppers;
    this.counter += lists[best].length;
    lists[best] = lists[best].filter((other) => {
      if (other.isDead) return false;
      if (!this.isSubsuming(constraint, other)) return true;
      other.isDead = true;
      return false;
    });
  }

  private subsume() {
    for (
      let constraint = this.subTodo.pop();
      constraint !== undefined;
      constraint = this.subTodo.pop()
    )
      if (!constraint.isDead) this.backwardSubsumption(constraint);
  }

  // sort_candidates: the variables without a lower or upper bound first, then by the number of
  // constraints they would create.
  private sortCandidates() {
    const costs: [number, number][] = [];
    this.forbidden.forEach((isForbidden, variable) => {
      if (!isForbidden)
        costs.push([variable, this.lowers[variable].length * this.uppers[variable].length]);
    });
    const isLess = (first: [number, number], second: [number, number]) => {
      if (first[1] === 0) return second[1] > 0 || first[0] < second[0];
      if (second[1] === 0) return false;
      const isFirstInt = this.isInt[first[0]];
      const isSecondInt = this.isInt[second[0]];
      return (!isFirstInt && isSecondInt) || (isFirstInt === isSecondInt && first[1] < second[1]);
    };
    costs.sort((first, second) => (isLess(first, second) ? -1 : isLess(second, first) ? 1 : 0));
    return costs.map((cost) => cost[0]);
  }

  // analyze: whether every variable is an integer, and whether x's coefficients are all 1 or -1.
  private analyze(constraints: Constraint[], variable: number) {
    let isUnit = true;
    for (const constraint of constraints)
      for (const [index, other] of constraint.xs.entries()) {
        if (!this.isInt[other]) return { isAllInt: false, isUnit };
        if (other === variable && Math.abs(constraint.as[index]) !== 1) isUnit = false;
      }
    return { isAllInt: true, isUnit };
  }

  private canEliminate(variable: number) {
    if (!this.isInt[variable]) return true;
    const lower = this.analyze(this.lowers[variable], variable);
    if (!lower.isAllInt) return false;
    const upper = this.analyze(this.uppers[variable], variable);
    return upper.isAllInt && (lower.isUnit || upper.isUnit);
  }

  private markDead(variable: number) {
    for (const constraint of this.lowers[variable]) constraint.isDead = true;
    for (const constraint of this.uppers[variable]) constraint.isDead = true;
  }

  // resolve: the combination of a lower and an upper bound of x without x, or undefined when it
  // holds.
  private resolve(lower: Constraint, upper: Constraint, variable: number) {
    this.counter += lower.xs.length + upper.xs.length + lower.lits.length + upper.lits.length;
    const a = -lower.as[lower.xs.indexOf(variable)];
    const b = upper.as[upper.xs.indexOf(variable)];
    let c = checkSafe(lower.c * b + upper.c * a);
    let isStrict = lower.isStrict || upper.isStrict;
    const xs: number[] = [];
    const as: number[] = [];
    lower.xs.forEach((other, index) => {
      if (other === variable) return;
      this.var2pos[other] = xs.length;
      xs.push(other);
      as.push(checkSafe(lower.as[index] * b));
    });
    upper.xs.forEach((other, index) => {
      if (other === variable) return;
      const position = this.var2pos[other];
      if (position === -1) {
        xs.push(other);
        as.push(checkSafe(upper.as[index] * a));
      } else as[position] = checkSafe(as[position] + upper.as[index] * a);
    });
    const kept = as.flatMap((coefficient, index) => (coefficient === 0 ? [] : [index]));
    const newXs = kept.map((index) => xs[index]);
    const newAs = kept.map((index) => as[index]);
    if (isStrict && newXs.every((other) => this.isInt[other])) {
      isStrict = false;
      c--;
    }
    for (const other of lower.xs) this.var2pos[other] = -1;
    if (newXs.length === 0 && (c > 0 || (!isStrict && c === 0))) return undefined;
    for (const lit of lower.lits) this.bvar2sign[Math.abs(lit)] = lit < 0 ? -1 : 1;
    const lits = [...lower.lits];
    let isTautology = false;
    for (const lit of upper.lits) {
      if (isTautology) break;
      const sign = this.bvar2sign[Math.abs(lit)];
      if (sign === 0) lits.push(lit);
      else if (sign === -1 ? lit > 0 : lit < 0) isTautology = true;
    }
    for (const lit of lower.lits) this.bvar2sign[Math.abs(lit)] = 0;
    if (isTautology) return undefined;
    if (lits.length === 0 && newXs.length === 0 && (c < 0 || (isStrict && c === 0))) {
      this.isInconsistent = true;
      return undefined;
    }
    return { lits, xs: newXs, as: newAs, c, isStrict, isDead: false };
  }

  private tryEliminate(variable: number) {
    const lowers = this.lowers[variable].filter((constraint) => !constraint.isDead);
    const uppers = this.uppers[variable].filter((constraint) => !constraint.isDead);
    this.lowers[variable] = lowers;
    this.uppers[variable] = uppers;
    if (lowers.length === 0 || uppers.length === 0) {
      this.markDead(variable);
      return;
    }
    if (lowers.length > FM_CUTOFF1 && uppers.length > FM_CUTOFF1) return;
    if (lowers.length * uppers.length > FM_CUTOFF2) return;
    if (!this.canEliminate(variable)) return;
    this.counter += lowers.length * uppers.length;
    const limit = lowers.length + uppers.length + FM_EXTRA;
    const created: Constraint[] = [];
    for (const lower of lowers)
      for (const upper of uppers) {
        if (this.isInconsistent || created.length > limit) return;
        const resolved = this.resolve(lower, upper, variable);
        if (resolved !== undefined) created.push(resolved);
      }
    this.markDead(variable);
    this.counter += created.length;
    for (const constraint of created) {
      this.backwardSubsumption(constraint);
      this.registerConstraint(constraint);
    }
  }

  // copy_remaining: the live constraints of the upper bounds, then of the lower bounds.
  private copyRemaining() {
    for (const lists of [this.uppers, this.lowers])
      for (const constraints of lists)
        for (const constraint of constraints) {
          if (constraint.isDead) continue;
          constraint.isDead = true;
          this.newFmls.push(this.toExpr(constraint));
        }
    this.uppers = [];
    this.lowers = [];
  }
}

// rewriter_tpl with elim_cfg: rewrites the quantifiers bottom-up.
class ElimStar extends RewriterTpl {
  constructor(
    manager: AstManager,
    private reduce: (expr: number, body: number, patterns: number[]) => number,
  ) {
    super(manager);
  }

  protected reduceQuantifier(expr: number, body: number, patterns: number[]) {
    return this.reduce(expr, body, patterns);
  }
}

// qe_lite::impl.
class QeLite {
  private der: EqDer;
  private fm: Fm;
  private elimStar: ElimStar;
  private rewriter: Rewriter;

  constructor(private manager: AstManager) {
    this.der = new EqDer(manager);
    this.fm = new Fm(manager);
    this.elimStar = new ElimStar(manager, (expr, body, patterns) =>
      this.reduceQuantifier(expr, body, patterns),
    );
    this.rewriter = newRewriter(manager);
  }

  // operator()(expr_ref&): the result comes with a reference, which the caller releases.
  apply(formula: number) {
    return this.elimStar.rewrite(formula);
  }

  // ~impl.
  release() {
    this.rewriter.release();
    this.elimStar.release();
    this.fm.release();
    this.der.release();
  }

  // bool_rewriter's mk_and and mk_or, with a reference to the result.
  private mkAnd(args: number[]) {
    return this.manager.withTemporaries(() => this.rewriter.mkAnd(args));
  }

  private mkOr(args: number[]) {
    return this.manager.withTemporaries(() => this.rewriter.mkOr(args));
  }

  // elim_cfg::reduce_quantifier.
  private reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    let result = assign(manager, -1, body);
    if (data.isForall) result = assign(manager, result, manager.mkApp(OP_NOT, [result], SORT_BOOL));
    result = this.reduceFormula(data.sorts.length, result);
    result = this.eliminateDiseqVars(data.sorts, result);
    let expanded = this.tryExpandBoundedQuantifier(data.sorts, result);
    if (expanded !== -1) {
      if (data.isForall) expanded = assignOwned(manager, expanded, pushNotOwned(manager, expanded));
      result = assignOwned(manager, result, this.rewriter.rewrite(expanded));
      manager.decRef(expanded);
      return result;
    }
    if (data.isForall) result = assignOwned(manager, result, pushNotOwned(manager, result));
    const updated = assign(manager, -1, manager.mkQuantifier({ ...data, body: result, patterns }));
    result = assignOwned(manager, result, this.rewriter.rewrite(updated));
    manager.decRef(updated);
    return result;
  }

  // operator()(index_set, index_of_bound, expr_ref&): each disjunct is a conjunction to reduce. The
  // formula comes with a reference, and so does the result.
  private reduceFormula(numVars: number, formula: number) {
    const manager = this.manager;
    const disjs = new RefVector(manager);
    const conjs = new RefVector(manager);
    disjs.push(formula);
    flattenOrVector(manager, disjs);
    let result = formula;
    const size = disjs.size;
    for (let index = 0; index < size; index++) {
      conjs.reset();
      conjs.push(disjs.items[index]);
      this.reduceConjs(numVars, conjs);
      result = assignOwned(manager, result, this.mkAnd(conjs.items));
      disjs.setOwned(index, result);
      result = -1;
    }
    result = assignOwned(manager, result, this.mkOr(disjs.items));
    conjs.reset();
    disjs.reset();
    return result;
  }

  // operator()(index_set, index_of_bound, expr_ref_vector&): a single non-ground conjunct is reduced
  // as a disjunction, and otherwise eq_der and fm run.
  private reduceConjs(numVars: number, fmls: RefVector) {
    const manager = this.manager;
    flattenAndVector(manager, fmls);
    const nonGround = fmls.items.flatMap((fml, index) => (manager.isGroundApp(fml) ? [] : [index]));
    if (fmls.size > 1 && nonGround.length === 1) {
      const index = nonGround[0];
      const reduced = this.reduceFormula(numVars, assign(manager, -1, fmls.items[index]));
      fmls.set(index, reduced);
      manager.decRef(reduced);
      return;
    }
    this.der.numVars = numVars;
    this.fm.numVars = numVars;
    this.der.apply(fmls);
    this.fm.apply(fmls);
  }

  // collect_negative_equalities: whether every occurrence of the variable is in a negative equality
  // with a term without it, or outside any equality.
  private collectNegativeEqualities(
    expr: number,
    index: number,
    isPositive: boolean,
    equalities: ObjHashtable,
  ): boolean {
    const manager = this.manager;
    if (manager.isGroundApp(expr)) return true;
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) return manager.values[expr] !== index;
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      return !isOccurring(manager, index + data.sorts.length, data.body);
    }
    const op = manager.getOp(expr);
    const args = manager.args[expr];
    if (manager.isNot(expr))
      return this.collectNegativeEqualities(args[0], index, !isPositive, equalities);
    if (op === OP_AND || op === OP_OR)
      return args.every((arg) =>
        this.collectNegativeEqualities(arg, index, isPositive, equalities),
      );
    if (op === OP_EQ) {
      const isVarAt = (term: number) =>
        manager.kinds[term] === KIND_VAR && manager.values[term] === index;
      const isLeftVar = isVarAt(args[0]);
      if (isLeftVar !== isVarAt(args[1])) {
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
  // every value they name, so those equalities are false. The body comes with a reference, and so
  // does the result.
  private eliminateDiseqVars(sorts: number[], body: number) {
    const manager = this.manager;
    const replace = new ExprSafeReplace(manager);
    let isChanged = false;
    for (let index = 0; index < sorts.length; index++) {
      const equalities = new ObjHashtable((key) => manager.hashes[key]);
      if (
        this.collectNegativeEqualities(body, index, true, equalities) &&
        equalities.size > 0 &&
        sorts[sorts.length - index - 1] === SORT_INT
      ) {
        for (const equality of equalities) replace.insert(equality, manager.falseExpr);
        isChanged = true;
      }
    }
    if (!isChanged) {
      replace.release();
      return body;
    }
    const replaced = replace.apply(body);
    const result = assignOwned(manager, body, this.rewriter.rewrite(replaced));
    manager.decRef(replaced);
    replace.release();
    return result;
  }

  // extract_var_bound: an inclusive integer bound of the variable that a conjunct states.
  private getBound(expr: number, index: number) {
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
    if (!isNegated) return { isLower: !isVarOnLeft, value };
    return { isLower: isVarOnLeft, value: isVarOnLeft ? value + 1 : value - 1 };
  }

  // try_expand_bounded_quantifier: the disjunction of the body over every value of the integer
  // variables when their ranges are small, with a reference, or -1.
  private tryExpandBoundedQuantifier(sorts: number[], body: number) {
    const manager = this.manager;
    const numDecls = sorts.length;
    if (numDecls === 0) return -1;
    const used = collectUsedVars(manager, body, numDecls);
    const remaining = used.flatMap((isUsed, index) => (isUsed ? [index] : []));
    if (remaining.length === 0) return -1;
    // Z3 checks the declaration at position i for the variable with de Bruijn index i, which is
    // another variable's sort. This port checks the variable's own sort.
    if (remaining.some((index) => sorts[numDecls - 1 - index] !== SORT_INT)) return -1;
    const conjs = new RefVector(manager);
    conjs.push(body);
    flattenAndVector(manager, conjs);
    const lowers: (number | undefined)[] = [];
    const uppers: (number | undefined)[] = [];
    const isBoundConj = conjs.items.map((conj) => {
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
      if (lower === undefined || upper === undefined) {
        conjs.reset();
        return -1;
      }
      const size = upper - lower + 1;
      if (size <= 0) {
        conjs.reset();
        return assign(manager, -1, manager.falseExpr);
      }
      domainSize *= size;
      if (domainSize > EXPAND_BOUND_LIMIT) {
        conjs.reset();
        return -1;
      }
    }
    const payload = new RefVector(manager);
    conjs.items.forEach((conj, position) => {
      if (!isBoundConj[position]) payload.push(conj);
    });
    const substMap = new RefVector(manager);
    substMap.resize(numDecls);
    // Like Z3, an unused variable keeps the sort of the declaration at its index.
    for (let index = 0; index < numDecls; index++)
      if (!used[index]) substMap.set(index, manager.mkVar(index, sorts[index]));
    const values = remaining.map((index) => lowers[index] ?? 0);
    const subst = new VarSubst(manager, false);
    const shifter = new InvVarShifter(manager);
    const disjuncts = new RefVector(manager);
    for (;;) {
      remaining.forEach((index, position) => {
        substMap.set(index, manager.mkNumeral(values[position]));
      });
      const instConjs = new RefVector(manager);
      for (const conj of payload.items) {
        let instance = subst.apply(conj, substMap.items);
        instance = assignOwned(manager, instance, shifter.shift(instance, numDecls));
        instConjs.push(instance);
        manager.decRef(instance);
      }
      const instBody = this.mkAnd(instConjs.items);
      disjuncts.push(instBody);
      manager.decRef(instBody);
      instConjs.reset();
      // The rightmost variable moves first.
      let position = remaining.length - 1;
      for (; position >= 0; position--) {
        values[position]++;
        if (values[position] <= (uppers[remaining[position]] ?? 0)) break;
        values[position] = lowers[remaining[position]] ?? 0;
      }
      if (position < 0) break;
    }
    const result = this.mkOr(disjuncts.items);
    disjuncts.reset();
    shifter.release();
    subst.release();
    substMap.reset();
    payload.reset();
    conjs.reset();
    return result;
  }
}

// qe_lite_simplifier::reduce in a dependent_expr_state_tactic, on each formula with a quantifier.
// The tactic's m_dep holds the formula it read last, until the tactic is done.
export const applyQeLite = (manager: AstManager, goal: Goal) => {
  const qe = new QeLite(manager);
  let dep = -1;
  for (const form of goal.forms.items) dep = assign(manager, dep, form);
  if (goal.forms.items.some((form) => manager.hasQuantifierFlags[form])) {
    let formula = -1;
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const form = goal.forms.items[index];
      dep = assign(manager, dep, form);
      if (!manager.hasQuantifierFlags[form]) continue;
      formula = assign(manager, formula, form);
      formula = assignOwned(manager, formula, qe.apply(formula));
      if (formula !== form) goal.update(index, formula);
    }
    release(manager, formula);
  }
  goal.elimTrue();
  goal.elimRedundancies();
  qe.release();
  release(manager, dep);
};
