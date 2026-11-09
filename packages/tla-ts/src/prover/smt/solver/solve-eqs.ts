// Ported from Z3 (src/ast/simplifiers/solve_eqs.cpp, src/ast/simplifiers/extract_eqs.cpp,
// src/ast/simplifiers/solve_context_eqs.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_BADD,
  OP_BMUL,
  OP_BSUB,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_OR,
  OP_SELECT,
  OP_SUB,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

export interface SolveEqsOptions {
  isTheorySolver: boolean;
  isIteSolver: boolean;
  isContextSolve: boolean;
  isEliminatingMod: boolean;
  rewriter: RewriterOptions;
}

interface DependentEq {
  orig: number;
  variable: number;
  term: number;
}

interface Signed {
  isNegated: boolean;
  expr: number;
}

interface NestedItem {
  isNegated: boolean;
  depth: number;
  expr: number;
  parent: number;
}

class SubstReplacer extends RewriterTpl {
  constructor(
    manager: AstManager,
    private substitution: ObjMap<number>,
  ) {
    super(manager);
  }

  getSubst(expr: number) {
    return this.substitution.get(expr);
  }
}

const getModInverse = (value: bigint, modulus: bigint) => {
  let [oldRemainder, remainder] = [((value % modulus) + modulus) % modulus, modulus];
  let [oldCoefficient, coefficient] = [1n, 0n];
  while (remainder !== 0n) {
    const quotient = oldRemainder / remainder;
    [oldRemainder, remainder] = [remainder, oldRemainder - quotient * remainder];
    [oldCoefficient, coefficient] = [coefficient, oldCoefficient - quotient * coefficient];
  }
  return ((oldCoefficient % modulus) + modulus) % modulus;
};

export class SolveEqs {
  private pinned: RefVector;
  private eqTerms: RefVector;
  private nonzero = new Set<number>();
  private bounds: BoundManager;
  private isAllowingBool = true;
  private var2id = new Map<number, number>();
  private id2var: number[] = [];
  private next: DependentEq[][] = [];
  private id2level: number[] = [];
  private substIds: number[] = [];
  private substitution: ObjMap<number>;
  private definitions: Definition[] = [];
  private containsV = new Set<number>();
  private andPositive = new Set<number>();
  private andNegative = new Set<number>();
  private orPositive = new Set<number>();
  private orNegative = new Set<number>();
  private rewriter: Rewriter;

  constructor(
    private manager: AstManager,
    private goal: Goal,
    private options: SolveEqsOptions,
  ) {
    this.pinned = new RefVector(manager);
    this.eqTerms = new RefVector(manager);
    this.bounds = new BoundManager(manager);
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    this.rewriter = new Rewriter(manager, options.rewriter);
  }

  private pin(expr: number) {
    this.eqTerms.push(expr);
    return expr;
  }

  private mkApp(op: number, args: number[], sort: number) {
    return this.pin(this.manager.mkApp(op, args, sort));
  }

  private mkMul(args: number[], sort: number) {
    return args.length === 1 ? args[0] : this.mkApp(OP_MUL, args, sort);
  }

  private push(eqs: DependentEq[], orig: number, variable: number, term: number) {
    this.eqTerms.push(term);
    eqs.push({ orig, variable, term });
  }

  private isConst(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && this.manager.isUninterpretedConst(expr);
  }

  private isEqOf(first: number, second: number) {
    const manager = this.manager;
    if (manager.getOp(first) !== OP_EQ || manager.getOp(second) !== OP_EQ) return undefined;
    const [x1, x2] = manager.getArgs(first);
    const [y1, y2] = manager.getArgs(second);
    if (x1 === y1) return { variable: x1, thenExpr: x2, elseExpr: y2 };
    if (x1 === y2) return { variable: x1, thenExpr: x2, elseExpr: y1 };
    if (x2 === y1) return { variable: x2, thenExpr: x1, elseExpr: y2 };
    return undefined;
  }

  private isComplementary(first: number, second: number) {
    const manager = this.manager;
    return (
      (manager.isNot(first) && manager.getArg(first, 0) === second) ||
      (manager.isNot(second) && manager.getArg(second, 0) === first)
    );
  }

  private getBasicEqs(form: number, eqs: DependentEq[]) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (op === OP_EQ) {
      const [left, right] = manager.getArgs(form);
      if (left === right) return;
      if (!this.isAllowingBool && manager.sorts[left] === SORT_BOOL) return;
      if (this.isConst(left)) this.push(eqs, form, left, right);
      if (this.isConst(right)) this.push(eqs, form, right, left);
    }
    if (this.isAllowingBool) {
      if (this.isConst(form)) this.push(eqs, form, form, manager.trueExpr);
      if (manager.isNot(form) && this.isConst(manager.getArg(form, 0)))
        this.push(eqs, form, manager.getArg(form, 0), manager.falseExpr);
    }
    if (this.goal.isProofsEnabled) return;
    if (this.options.isIteSolver && op === OP_ITE) {
      const [condition, thenExpr, elseExpr] = manager.getArgs(form);
      if (manager.getOp(thenExpr) === OP_EQ && manager.getOp(elseExpr) === OP_EQ) {
        let [x1, y1] = manager.getArgs(thenExpr);
        let [x2, y2] = manager.getArgs(elseExpr);
        if (!this.isAllowingBool && manager.sorts[x1] === SORT_BOOL) return;
        if (x1 === y2 && this.isConst(x1)) [x2, y2] = [y2, x2];
        if (x2 === y2 && this.isConst(x2)) {
          [x2, y2] = [y2, x2];
          [x1, y1] = [y1, x1];
        }
        if (x2 === y1 && this.isConst(x2)) [x1, y1] = [y1, x1];
        if (x1 === x2 && this.isConst(x1))
          this.push(eqs, form, x1, manager.mkApp(OP_ITE, [condition, y1, y2], manager.sorts[y1]));
      }
    }
    const isBinary = (expr: number, binaryOp: number) =>
      manager.getOp(expr) === binaryOp && manager.getNumArgs(expr) === 2;
    const outer = op === OP_OR ? OP_AND : op === OP_AND ? OP_OR : -1;
    if (outer === -1 || !isBinary(form, op)) return;
    const [first, second] = manager.getArgs(form);
    if (!isBinary(first, outer) || !isBinary(second, outer)) return;
    const [x1, x2] = manager.getArgs(first);
    const [y1, y2] = manager.getArgs(second);
    const cases: [number, number, number, number, number][] =
      op === OP_OR
        ? [
            [x1, y1, x2, y2, x2],
            [x1, y2, x2, y1, x2],
            [x2, y2, x1, y1, x1],
            [x2, y1, x1, y2, x1],
          ]
        : [
            [x1, y1, x2, y2, y2],
            [x1, y2, x2, y1, y1],
            [x2, y2, x1, y1, y1],
            [x2, y1, x1, y2, y2],
          ];
    for (const [eqFirst, eqSecond, complementFirst, complementSecond, condition] of cases) {
      const found = this.isEqOf(eqFirst, eqSecond);
      if (found !== undefined && this.isComplementary(complementFirst, complementSecond))
        this.push(
          eqs,
          form,
          found.variable,
          manager.mkApp(
            OP_ITE,
            [condition, found.thenExpr, found.elseExpr],
            manager.sorts[found.thenExpr],
          ),
        );
    }
  }

  private mkSubTerm(sum: number, index: number, rhs: number) {
    const manager = this.manager;
    const isBv = manager.isBvSort(manager.sorts[rhs]);
    return manager
      .getArgs(sum)
      .reduce(
        (term, arg, other) =>
          other === index
            ? term
            : isBv
              ? this.pin(mkBvApp(manager, OP_BSUB, [term, arg]))
              : this.mkApp(OP_SUB, [term, arg], manager.sorts[rhs]),
        rhs,
      );
  }

  private isNonzeroFactor(expr: number) {
    const manager = this.manager;
    return (
      this.nonzero.has(expr) ||
      (manager.isNumeral(expr) && !manager.getRationalValue(expr).isZero())
    );
  }

  private solveArithAdd(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (manager.getOp(x) !== OP_ADD) return;
    for (const [index, arg] of manager.getArgs(x).entries()) {
      if (this.isConst(arg)) {
        this.push(eqs, orig, arg, this.mkSubTerm(x, index, y));
        continue;
      }
      const isReal = manager.sorts[arg] === SORT_REAL;
      if (manager.getOp(arg) === OP_MUL && manager.getNumArgs(arg) === 2) {
        const [coefficient, variable] = manager.getArgs(arg);
        if (manager.isNumeral(coefficient) && this.isConst(variable)) {
          const value = manager.getRationalValue(coefficient);
          if (value.equals(Rational.minusOne))
            this.push(
              eqs,
              orig,
              variable,
              this.mkApp(OP_UMINUS, [this.mkSubTerm(x, index, y)], manager.sorts[y]),
            );
          else if (isReal && !value.isZero())
            this.push(
              eqs,
              orig,
              variable,
              this.mkApp(OP_DIV, [this.mkSubTerm(x, index, y), coefficient], SORT_REAL),
            );
          continue;
        }
      }
      if (!isReal || manager.getOp(arg) !== OP_MUL) continue;
      const factors = manager.getArgs(arg);
      for (const [factorIndex, factor] of factors.entries()) {
        if (!this.isConst(factor)) continue;
        if (
          !factors.every(
            (other, otherIndex) => otherIndex === factorIndex || this.isNonzeroFactor(other),
          )
        )
          continue;
        const others = factors.filter((_, otherIndex) => otherIndex !== factorIndex);
        const term = this.mkSubTerm(x, index, y);
        this.push(
          eqs,
          orig,
          factor,
          this.mkApp(OP_DIV, [term, this.mkMul(others, SORT_REAL)], SORT_REAL),
        );
      }
    }
  }

  private solveArithMod(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (!this.options.isEliminatingMod || manager.getOp(x) !== OP_MOD) return;
    const [dividend, divisor] = manager.getArgs(x);
    if (!manager.isNumeral(divisor) || !manager.getRationalValue(divisor).isPositive()) return;
    const fresh = this.pin(manager.mkFreshConst("mod", SORT_INT));
    const term = this.mkApp(OP_ADD, [this.mkApp(OP_MUL, [divisor, fresh], SORT_INT), y], SORT_INT);
    if (this.isConst(dividend)) this.push(eqs, orig, dividend, term);
    else this.solveArithEq(orig, dividend, term, eqs);
  }

  private solveArithMul(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (manager.getOp(x) !== OP_MUL) return;
    const factors = manager.getArgs(x);
    for (const [index, factor] of factors.entries()) {
      if (!this.isConst(factor) || manager.sorts[factor] !== SORT_REAL) continue;
      if (
        !factors.every((other, otherIndex) => otherIndex === index || this.isNonzeroFactor(other))
      )
        continue;
      const others = factors.filter((_, otherIndex) => otherIndex !== index);
      this.push(
        eqs,
        orig,
        factor,
        this.mkApp(OP_DIV, [y, this.mkMul(others, SORT_REAL)], SORT_REAL),
      );
    }
  }

  private solveArithToReal(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (manager.getOp(x) !== OP_TO_REAL || !this.isConst(manager.getArg(x, 0))) return;
    const variable = manager.getArg(x, 0);
    if (manager.getOp(y) === OP_TO_REAL) this.push(eqs, orig, variable, manager.getArg(y, 0));
    else if (manager.isNumeral(y) && manager.getRationalValue(y).isInt())
      this.push(eqs, orig, variable, manager.mkNumeral(manager.getRationalValue(y).num));
  }

  private solveArithEq(orig: number, x: number, y: number, eqs: DependentEq[]) {
    this.solveArithAdd(orig, x, y, eqs);
    this.solveArithMod(orig, x, y, eqs);
    this.solveArithMul(orig, x, y, eqs);
    this.solveArithToReal(orig, x, y, eqs);
  }

  private getArithEqs(form: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (!this.options.isTheorySolver) return;
    if (manager.getOp(form) === OP_EQ) {
      const [x, y] = manager.getArgs(form);
      if (manager.sorts[x] === SORT_INT || manager.sorts[x] === SORT_REAL) {
        this.solveArithEq(form, x, y, eqs);
        this.solveArithEq(form, y, x, eqs);
      }
    }
    if (manager.getOp(form) !== OP_LE) return;
    const [x, y] = manager.getArgs(form);
    const lower = this.bounds.lowers.get(x);
    if (
      !manager.isNumeral(y) ||
      lower === undefined ||
      lower.isStrict ||
      !lower.value.equals(manager.getRationalValue(y))
    )
      return;
    if (this.isConst(x)) this.push(eqs, form, x, y);
    else {
      this.solveArithEq(form, x, y, eqs);
      this.solveArithEq(form, y, x, eqs);
    }
  }

  private getOddCoefficient(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_BMUL || manager.getNumArgs(expr) !== 2) return undefined;
    const [coefficient, variable] = manager.getArgs(expr);
    if (!manager.isBvNumeral(coefficient) || !this.isConst(variable)) return undefined;
    const value = manager.getBvNumeralValue(coefficient);
    if (value % 2n === 0n) return undefined;
    const width = manager.getBvSize(manager.sorts[variable]);
    return {
      variable,
      inverse: manager.mkBvNumeral(getModInverse(value, 1n << BigInt(width)), width),
    };
  }

  private solveBvEq(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (manager.getOp(x) === OP_BADD)
      for (const [index, arg] of manager.getArgs(x).entries()) {
        if (this.isConst(arg)) {
          this.push(eqs, orig, arg, this.mkSubTerm(x, index, y));
          continue;
        }
        const odd = this.getOddCoefficient(arg);
        if (odd === undefined) continue;
        const term = this.mkSubTerm(x, index, y);
        this.push(
          eqs,
          orig,
          odd.variable,
          this.pin(mkBvApp(manager, OP_BMUL, [this.pin(odd.inverse), term])),
        );
      }
    const odd = this.getOddCoefficient(x);
    if (odd !== undefined)
      this.push(
        eqs,
        orig,
        odd.variable,
        this.pin(mkBvApp(manager, OP_BMUL, [this.pin(odd.inverse), y])),
      );
  }

  private getBvEqs(form: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (manager.getOp(form) !== OP_EQ) return;
    const [x, y] = manager.getArgs(form);
    if (!manager.isBvSort(manager.sorts[x])) return;
    this.solveBvEq(form, x, y, eqs);
    this.solveBvEq(form, y, x, eqs);
  }

  private hasSubterm(root: number, isMatch: (expr: number) => boolean) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [root];
    while (todo.length > 0) {
      const expr = todo.pop() as number;
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (isMatch(expr)) return true;
      if (manager.kinds[expr] === KIND_APP || manager.kinds[expr] === KIND_QUANTIFIER)
        manager.pushArgs(expr, todo);
    }
    return false;
  }

  // Array definitions by a universal quantifier need lambdas, which the port does not have.
  private checkArrayEqs(form: number) {
    const manager = this.manager;
    if (manager.kinds[form] !== KIND_QUANTIFIER || !manager.getQuantifier(form).isForall) return;
    const numVars = manager.getQuantifier(form).sorts.length;
    const body = manager.getQuantifier(form).body;
    const [guard, eq] =
      manager.getOp(body) === OP_IMPLIES
        ? manager.getArgs(body)
        : manager.getOp(body) === OP_OR && manager.getNumArgs(body) === 2
          ? manager.getOp(manager.getArg(body, 1)) === OP_EQ
            ? manager.getArgs(body)
            : manager.getOp(manager.getArg(body, 0)) === OP_EQ
              ? manager.getArgs(body).reverse()
              : [-1, -1]
          : [-1, body];
    if (eq === -1 || manager.getOp(eq) !== OP_EQ) return;
    const [lhs, rhs] = manager.getArgs(eq);
    const isGuardedIte =
      guard === -1 &&
      manager.getOp(lhs) === OP_ITE &&
      manager.getOp(rhs) === OP_ITE &&
      manager.getArg(lhs, 0) === manager.getArg(rhs, 0) &&
      manager.getArg(lhs, 2) === manager.getArg(rhs, 2);
    const [condition, left, right] = isGuardedIte
      ? [manager.getArg(lhs, 0), manager.getArg(lhs, 1), manager.getArg(rhs, 1)]
      : [guard, lhs, rhs];
    const isSelectOfVars = (expr: number) =>
      manager.getOp(expr) === OP_SELECT &&
      manager.getNumArgs(expr) === numVars + 1 &&
      manager
        .getArgs(expr)
        .slice(1)
        .every(
          (arg, index) =>
            manager.kinds[arg] === KIND_VAR && manager.values[arg] === numVars - index - 1,
        );
    const [select, def] = isSelectOfVars(left)
      ? [left, right]
      : isSelectOfVars(right)
        ? [right, left]
        : [-1, -1];
    if (select === -1) return;
    const array = manager.getArg(select, 0);
    const isQuantifier = (expr: number) => manager.kinds[expr] === KIND_QUANTIFIER;
    const parts = condition === -1 ? [def] : [def, condition];
    if (
      this.isConst(array) &&
      !parts.some((part) => this.hasSubterm(part, (expr) => expr === array)) &&
      !parts.some((part) => this.hasSubterm(part, isQuantifier))
    )
      throw new SmtUnsupportedError("solving for an array defined by a quantifier");
  }

  private getEqsOf(form: number, eqs: DependentEq[]) {
    if (!this.goal.isProofsEnabled) this.getArithEqs(form, eqs);
    this.getBasicEqs(form, eqs);
    if (!this.goal.isProofsEnabled) {
      this.getBvEqs(form, eqs);
      this.checkArrayEqs(form);
    }
  }

  private getEqs() {
    const eqs: DependentEq[] = [];
    const forms = this.goal.forms.items;
    if (!this.goal.isProofsEnabled) for (const form of forms) this.getArithEqs(form, eqs);
    for (const form of forms) this.getBasicEqs(form, eqs);
    if (!this.goal.isProofsEnabled) {
      for (const form of forms) this.getBvEqs(form, eqs);
      for (const form of forms) this.checkArrayEqs(form);
    }
    return eqs;
  }

  private extractDepGraph(eqs: DependentEq[]) {
    this.var2id.clear();
    this.id2var = [];
    for (const eq of eqs) {
      if (this.var2id.has(eq.variable) || !this.isConst(eq.variable)) continue;
      this.var2id.set(eq.variable, this.id2var.length);
      this.id2var.push(eq.variable);
    }
    this.next = this.id2var.map(() => []);
    for (const eq of eqs)
      if (this.isConst(eq.variable)) this.next[this.var2id.get(eq.variable) as number].push(eq);
  }

  private extractSubst() {
    const manager = this.manager;
    const size = this.id2var.length;
    this.id2level = this.id2var.map(() => Infinity);
    this.substIds = [];
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    let initLevel = 2 ** 32 - 1;
    const todo: number[] = [];
    for (let id = 0; id < size; id++) {
      if (this.id2level[id] !== Infinity) continue;
      if (initLevel < size + 1) return;
      initLevel -= size + 1;
      let currLevel = initLevel;
      todo.push(id);
      while (todo.length > 0) {
        const next = todo.pop() as number;
        if (this.id2level[next] !== Infinity) continue;
        this.id2level[next] = currLevel++;
        for (const eq of this.next[next]) {
          const todoSize = todo.length;
          let isSafe = true;
          const visited = new Set<number>();
          const stack = [eq.term];
          while (stack.length > 0) {
            const expr = stack.pop() as number;
            if (visited.has(expr)) continue;
            visited.add(expr);
            if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, stack);
            else if (manager.kinds[expr] === KIND_QUANTIFIER)
              stack.push(manager.getQuantifier(expr).body);
            const id = this.var2id.get(expr);
            if (id === undefined) continue;
            if (this.id2level[id] < currLevel) {
              isSafe = false;
              break;
            }
            if (this.id2level[id] === Infinity) todo.push(id);
          }
          if (!isSafe) {
            todo.length = todoSize;
            continue;
          }
          this.next[next][0] = eq;
          this.substIds.push(next);
          break;
        }
      }
    }
  }

  private normalize() {
    if (this.substIds.length === 0) return;
    const manager = this.manager;
    const replacer = new SubstReplacer(manager, this.substitution);
    this.substIds.sort((first, second) => this.id2level[second] - this.id2level[first]);
    for (const id of this.substIds) {
      manager.limit.checkpoint();
      const eq = this.next[id][0];
      const definition = replacer.rewrite(eq.term);
      this.pinned.pushOwned(definition);
      manager.incRef(eq.variable);
      this.pinned.pushOwned(eq.variable);
      this.substitution.set(eq.variable, definition);
    }
    replacer.release();
  }

  private applySubst() {
    if (this.substIds.length === 0) return;
    const manager = this.manager;
    const replacer = new SubstReplacer(manager, this.substitution);
    const goal = this.goal;
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const form = goal.forms.items[index];
      const replaced = replacer.rewrite(form);
      const simplified = this.rewriter.rewrite(replaced);
      manager.decRef(replaced);
      if (simplified !== form) goal.update(index, simplified);
      manager.decRef(simplified);
    }
    replacer.release();
  }

  private saveSubst() {
    for (const [variable, def] of this.substitution.entries())
      this.definitions.push({ decl: this.manager.decls[variable], def });
  }

  private runRound(getEqs: () => DependentEq[]) {
    this.eqTerms.reset();
    const eqs = getEqs();
    this.extractDepGraph(eqs);
    this.extractSubst();
    this.normalize();
    this.applySubst();
    this.saveSubst();
  }

  reduce() {
    const goal = this.goal;
    if (!goal.isProofsEnabled && this.options.isTheorySolver)
      for (const form of goal.forms.items) {
        this.markPositive(form);
        this.bounds.add(form);
      }
    for (let count = 0; count < 20; count++) {
      this.runRound(() => this.getEqs());
      if (this.substIds.length === 0) break;
      this.manager.limit.checkpoint();
    }
    if (this.options.isContextSolve && !goal.isProofsEnabled)
      this.runRound(() => this.collectNestedEqualities());
    this.eqTerms.reset();
    goal.elimTrue();
    goal.elimRedundancies();
    goal.depth++;
    if (this.definitions.length > 0) goal.addDefinitions(this.definitions);
  }

  private markPositive(form: number) {
    const manager = this.manager;
    const isNegated = manager.isNot(form);
    const atom = isNegated ? manager.getArg(form, 0) : form;
    const op = manager.getOp(atom);
    if (op !== OP_LE && op !== OP_GE && op !== OP_EQ) return;
    const [lhs, rhs] = manager.getArgs(atom);
    if (!manager.isNumeral(rhs)) return;
    const value = manager.getRationalValue(rhs);
    const isNonzero = isNegated
      ? (op === OP_LE && !value.isNegative()) ||
        (op === OP_GE && !value.isPositive()) ||
        (op === OP_EQ && value.isZero())
      : (op === OP_LE && value.isNegative()) || (op === OP_GE && value.isPositive());
    if (isNonzero) this.nonzero.add(lhs);
  }

  private markOccurs(roots: number[], variable: number) {
    const manager = this.manager;
    const occurs = this.containsV;
    const visited = new Set<number>([variable]);
    occurs.add(variable);
    const todo = [...roots];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (visited.has(expr)) {
        todo.pop();
        continue;
      }
      if (manager.kinds[expr] === KIND_APP) {
        let isOccurring = false;
        let isAllVisited = true;
        for (const arg of manager.getArgs(expr))
          if (!visited.has(arg)) {
            todo.push(arg);
            isAllVisited = false;
          } else if (occurs.has(arg)) isOccurring = true;
        if (isAllVisited) {
          if (isOccurring) occurs.add(expr);
          else occurs.delete(expr);
          visited.add(expr);
          todo.pop();
        }
      } else if (manager.kinds[expr] === KIND_QUANTIFIER) {
        const body = manager.getQuantifier(expr).body;
        if (visited.has(body)) {
          visited.add(expr);
          if (occurs.has(body)) occurs.add(expr);
          else occurs.delete(expr);
          todo.pop();
        } else todo.push(body);
      } else {
        visited.add(expr);
        todo.pop();
      }
    }
  }

  private isConjunction(isNegated: boolean, expr: number) {
    const op = this.manager.getOp(expr);
    return (!isNegated && op === OP_AND) || (isNegated && op === OP_OR);
  }

  private containsConjunctively(form: number, isNegated: boolean, eq: number, conjuncts: Signed[]) {
    const manager = this.manager;
    const todo: Signed[] = [{ isNegated, expr: form }];
    while (todo.length > 0) {
      const item = todo.pop() as Signed;
      if (!item.isNegated && item.expr === eq) return true;
      const marks = item.isNegated ? this.andNegative : this.andPositive;
      if (marks.has(item.expr)) continue;
      marks.add(item.expr);
      if (!this.containsV.has(item.expr)) continue;
      const op = manager.getOp(item.expr);
      if ((!item.isNegated && op === OP_AND) || (item.isNegated && op === OP_OR))
        for (const arg of manager.getArgs(item.expr))
          todo.push({ isNegated: item.isNegated, expr: arg });
      else if (manager.isNot(item.expr))
        todo.push({ isNegated: !item.isNegated, expr: manager.getArg(item.expr, 0) });
      else conjuncts.push(item);
    }
    return false;
  }

  private isDisjunctivelySafe(depth: number, root: number, isNegated: boolean, eq: number) {
    const manager = this.manager;
    const todo: Signed[] = [{ isNegated, expr: root }];
    while (todo.length > 0) {
      const item = todo.pop() as Signed;
      const marks = item.isNegated ? this.orNegative : this.orPositive;
      if (marks.has(item.expr)) continue;
      marks.add(item.expr);
      const op = manager.getOp(item.expr);
      if (!item.isNegated && item.expr === eq) continue;
      if (!this.containsV.has(item.expr)) continue;
      if ((item.isNegated && op === OP_AND) || (!item.isNegated && op === OP_OR))
        for (const arg of manager.getArgs(item.expr))
          todo.push({ isNegated: item.isNegated, expr: arg });
      else if (manager.isNot(item.expr))
        todo.push({ isNegated: !item.isNegated, expr: manager.getArg(item.expr, 0) });
      else if (!this.isConjunction(item.isNegated, item.expr)) return false;
      else if (!this.isSafeEqIn(depth + 1, item.expr, item.isNegated, eq)) return false;
    }
    return true;
  }

  private isSafeEqIn(depth: number, form: number, isNegated: boolean, eq: number): boolean {
    if (!this.containsV.has(form)) return true;
    const conjuncts: Signed[] = [];
    if (this.containsConjunctively(form, isNegated, eq, conjuncts)) return true;
    if (depth > 3) return false;
    return conjuncts.every((conjunct) =>
      this.isDisjunctivelySafe(depth, conjunct.expr, conjunct.isNegated, eq),
    );
  }

  private isSafeEq(eq: number) {
    this.andPositive.clear();
    this.andNegative.clear();
    this.orPositive.clear();
    this.orNegative.clear();
    return this.goal.forms.items.every((form) => this.isSafeEqIn(0, form, false, eq));
  }

  private isSafeVar(variable: number, index: number, form: number, todo: NestedItem[]) {
    this.containsV.clear();
    this.markOccurs([form], variable);
    const isParent = (parent: number, child: number) => {
      let current = child;
      while (current !== parent && current !== 0) current = todo[current].parent;
      return current === parent;
    };
    let top = index;
    while (top !== 0) {
      if (todo[top].depth !== todo[index].depth) break;
      top = todo[top].parent;
    }
    return todo.every(
      (item, other) =>
        other === index ||
        !this.containsV.has(item.expr) ||
        isParent(other, index) ||
        isParent(top, other),
    );
  }

  private collectNestedIn(form: number, visited: Set<number>, eqs: DependentEq[]) {
    const manager = this.manager;
    const todo: NestedItem[] = [{ isNegated: false, depth: 0, expr: form, parent: 0 }];
    const incOr = (depth: number) => (depth % 2 === 0 ? depth + 1 : depth);
    const incAnd = (depth: number) => (depth % 2 === 0 ? depth : depth + 1);
    for (let index = 0; index < todo.length; index++) {
      const item = todo[index];
      if (visited.has(item.expr)) continue;
      visited.add(item.expr);
      const op = manager.getOp(item.expr);
      const pushArgs = (depth: number) => {
        for (const arg of manager.getArgs(item.expr))
          todo.push({ isNegated: item.isNegated, depth, expr: arg, parent: index });
      };
      if ((item.isNegated && op === OP_AND) || (!item.isNegated && op === OP_OR))
        pushArgs(incOr(item.depth));
      if ((!item.isNegated && op === OP_AND) || (item.isNegated && op === OP_OR))
        pushArgs(incAnd(item.depth));
      else if (manager.isNot(item.expr))
        todo.push({
          isNegated: !item.isNegated,
          depth: item.depth,
          expr: manager.getArg(item.expr, 0),
          parent: index,
        });
      else if (!item.isNegated && item.depth >= 1) {
        const start = eqs.length;
        this.isAllowingBool = false;
        this.getEqsOf(item.expr, eqs);
        this.isAllowingBool = true;
        for (let current = start; current < eqs.length; current++)
          if (!this.isSafeVar(eqs[current].variable, index, form, todo)) {
            eqs[current] = eqs[eqs.length - 1];
            current--;
            eqs.pop();
          }
      }
    }
  }

  private collectNestedEqualities() {
    const manager = this.manager;
    const forms = this.goal.forms.items;
    const visited = new Set<number>();
    const collected: DependentEq[] = [];
    for (const form of forms) this.collectNestedIn(form, visited, collected);
    if (collected.length === 0) return collected;
    const eqs = collected
      .map((eq, index) => ({ eq, index }))
      .sort(
        (first, second) =>
          manager.ids[first.eq.variable] - manager.ids[second.eq.variable] ||
          first.index - second.index,
      )
      .map((entry) => entry.eq);
    const firstOccurrence = new Map<number, number>();
    const lastOccurrence = new Map<number, number>();
    const record = (occurrence: Map<number, number>, order: number[]) => {
      const seen = new Set<number>();
      for (const index of order) {
        const todo = [forms[index]];
        while (todo.length > 0) {
          const expr = todo.pop() as number;
          if (seen.has(expr)) continue;
          seen.add(expr);
          occurrence.set(expr, index);
          if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
          else if (manager.kinds[expr] === KIND_QUANTIFIER) {
            const data = manager.getQuantifier(expr);
            todo.push(data.body, ...data.patterns, ...data.noPatterns);
          }
        }
      }
    };
    record(
      firstOccurrence,
      forms.map((_, index) => index),
    );
    record(
      lastOccurrence,
      forms.map((_, index) => forms.length - 1 - index),
    );
    const kept: DependentEq[] = [];
    let lastVar = -1;
    let isUnsafe = false;
    for (const eq of eqs) {
      const first = firstOccurrence.get(eq.variable);
      if (first === undefined || first !== lastOccurrence.get(eq.variable)) continue;
      if (eq.variable !== lastVar) {
        this.containsV.clear();
        this.markOccurs([eq.term], eq.variable);
        lastVar = eq.variable;
        isUnsafe = false;
        if (this.containsV.has(eq.term)) {
          isUnsafe = true;
          continue;
        }
        this.markOccurs([forms[first]], eq.variable);
      } else if (this.containsV.has(eq.term) || isUnsafe) continue;
      if (this.isSafeEq(eq.orig)) kept.push(eq);
    }
    return kept;
  }

  release() {
    this.rewriter.release();
    this.pinned.reset();
    this.eqTerms.reset();
  }
}
