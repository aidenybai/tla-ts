// Ported from Z3 (src/qe/lite/qe_lite_tactic.cpp, src/qe/mbp/mbp_solve_plugin.cpp), MIT license,
// see z3-license.txt. The eq_der of qe-lite: destructive equality resolution, which removes the
// variables of a quantifier that its body defines by an equality, with the solve plugins for
// Booleans and integer arithmetic.
import {
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_IDIV,
  OP_ITE,
  OP_MOD,
  OP_MUL,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { flattenAndVector, mkNot } from "./ast-util";
import { isOccurring } from "./der";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { BetaReducer } from "./rewriter-tpl";
import { assign, assignOwned, release } from "./expr-ref";

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
export class EqDer {
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
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
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
      manager.limit.checkpoint();
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
      const lhs = manager.args[expr][0];
      const rhs = manager.args[expr][1];
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
  private getInvertibleConst(expr: number): bigint | undefined {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_UMINUS) {
      const inner = this.getInvertibleConst(manager.args[expr][0]);
      return inner === undefined ? undefined : -inner;
    }
    const value = manager.getNumeral(expr);
    return value === 1n || value === -1n ? value : undefined;
  }

  // arith_solve_plugin::is_invertible_mul: a variable times an invertible coefficient.
  private getInvertibleMul(expr: number) {
    const manager = this.manager;
    if (this.isVariable(expr)) return { variable: expr, coefficient: 1n };
    if (manager.getOp(expr) !== OP_MUL || manager.args[expr].length !== 2) return undefined;
    const first = manager.args[expr][0];
    const second = manager.args[expr][1];
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
        const coefficient = 1n / mul.coefficient;
        const isLeft = item.isLeft;
        const terms = new RefVector(manager);
        for (const summand of done) {
          const factor = summand.isLeft === isLeft ? -coefficient : coefficient;
          terms.push(
            factor === 1n
              ? summand.expr
              : manager.mkApp(OP_MUL, [manager.mkNumeral(factor), summand.expr], SORT_INT),
          );
        }
        const term =
          terms.size === 0
            ? manager.mkNumeral(0n)
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
    const isLeftZero = manager.getNumeral(inputLeft) === 0n;
    const left = isLeftZero ? inputRight : inputLeft;
    const right = isLeftZero ? inputLeft : inputRight;
    const leftArgs = manager.args[left];
    const isBinarySum =
      manager.getNumeral(right) === 0n && manager.getOp(left) === OP_ADD && leftArgs.length === 2;
    const negatedSecond = isBinarySum ? manager.getTimesMinusOneArg(leftArgs[1]) : undefined;
    const negatedFirst = isBinarySum ? manager.getTimesMinusOneArg(leftArgs[0]) : undefined;
    const result =
      negatedSecond !== undefined
        ? manager.mkEq(leftArgs[0], negatedSecond)
        : negatedFirst !== undefined
          ? manager.mkEq(leftArgs[1], negatedFirst)
          : manager.mkEq(left, right);
    manager.incRef(result);
    return result;
  }

  // arith_solve_plugin::try_int_mul_solve: k*y = x becomes y = x div k and x mod k = 0, or x = 0
  // when k is zero.
  private tryIntMulSolve(atom: number) {
    const manager = this.manager;
    const atomArgs = manager.args[atom];
    if (manager.sorts[atomArgs[0]] !== SORT_INT) return -1;
    const isMulOnLeft = manager.getOp(atomArgs[1]) !== OP_MUL;
    if (isMulOnLeft && manager.getOp(atomArgs[0]) !== OP_MUL) return -1;
    const lhs = atomArgs[isMulOnLeft ? 1 : 0];
    const factors = manager.args[atomArgs[isMulOnLeft ? 0 : 1]];
    if (factors.length !== 2) return -1;
    const isNumeralSecond = !manager.isNumeral(factors[0]);
    if (isNumeralSecond && !manager.isNumeral(factors[1])) return -1;
    const first = factors[isNumeralSecond ? 1 : 0];
    const second = factors[isNumeralSecond ? 0 : 1];
    if (manager.getNumeralValue(first) === 0n) {
      const result = manager.mkEq(lhs, manager.mkNumeral(0n));
      manager.incRef(result);
      return result;
    }
    const held = new RefVector(manager);
    const quotientEq = manager.mkEq(second, manager.mkApp(OP_IDIV, [lhs, first], SORT_INT));
    held.push(quotientEq);
    const zero = manager.mkNumeral(0n);
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
    const lhs = manager.args[atom][0];
    const rhs = manager.args[atom][1];
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
      const lhs = manager.args[atom][0];
      const rhs = manager.args[atom][1];
      if (manager.isNot(lhs) && this.isVariable(manager.args[lhs][0]))
        result = assign(manager, result, manager.mkEq(manager.args[lhs][0], mkNot(manager, rhs)));
      else if (manager.isNot(rhs) && this.isVariable(manager.args[rhs][0]))
        result = assign(manager, result, manager.mkEq(manager.args[rhs][0], mkNot(manager, lhs)));
      else if (this.isVariable(rhs) && !this.isVariable(lhs))
        result = assign(manager, result, manager.mkEq(rhs, lhs));
    }
    if (manager.getOp(atom) === OP_ITE) {
      const condition = manager.args[atom][0];
      const thenExpr = manager.args[atom][1];
      const elseExpr = manager.args[atom][2];
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
        const lhs = manager.args[manager.args[conj][0]][0];
        const rhs = manager.args[manager.args[conj][0]][1];
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
