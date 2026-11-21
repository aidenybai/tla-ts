import { mkArrayApp } from "./array-decl-plugin";
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
  QUANTIFIER_FORALL,
  QUANTIFIER_LAMBDA,
} from "./ast";
import { mkNot } from "./ast-util";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { type Definition, type Dependency, type Goal, joinDependencies } from "./goal";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { getSubterms } from "./recfun-decl-plugin";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import { DependentExprState, finishSimplifier } from "./dependent-expr-state";

interface SolveEqsOptions {
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
  dependency: Dependency | undefined;
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

export class SubstReplacer extends RewriterTpl {
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

// default_expr_replacer empties its cache after a rewrite that used a dependency.
class DependentSubstReplacer extends SubstReplacer {
  dependency: Dependency | undefined = undefined;
  private usedDependency: Dependency | undefined = undefined;

  constructor(
    manager: AstManager,
    substitution: ObjMap<number>,
    private dependencies: Map<number, Dependency>,
  ) {
    super(manager, substitution);
  }

  override getSubst(expr: number) {
    const result = super.getSubst(expr);
    if (result !== undefined && this.dependencies.size > 0)
      this.usedDependency = joinDependencies(this.usedDependency, this.dependencies.get(expr));
    return result;
  }

  replace(expr: number) {
    const result = this.rewrite(expr);
    this.dependency = this.usedDependency;
    if (this.dependency !== undefined) {
      this.reset();
      this.usedDependency = undefined;
    }
    return result;
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
  private oldForms: RefVector;
  private nonzero = new Set<number>();
  private bounds: BoundManager;
  private isAllowingBool = true;
  private var2id = new Map<number, number>();
  private id2var: number[] = [];
  private next: DependentEq[][] = [];
  private id2level: number[] = [];
  private substIds: number[] = [];
  private substitution: ObjMap<number>;
  private substDependencies = new Map<number, Dependency>();
  private definitions: Definition[] = [];
  private containsV = new Set<number>();
  private unsafeVars = new Set<number>();
  private andPositive = new Set<number>();
  private andNegative = new Set<number>();
  private orPositive = new Set<number>();
  private orNegative = new Set<number>();
  private rewriter: Rewriter;
  private state: DependentExprState;

  constructor(
    private manager: AstManager,
    private goal: Goal,
    private options: SolveEqsOptions,
  ) {
    this.pinned = new RefVector(manager);
    this.eqTerms = new RefVector(manager);
    this.oldForms = new RefVector(manager);
    this.bounds = new BoundManager(manager);
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    this.rewriter = new Rewriter(manager, options.rewriter);
    this.state = new DependentExprState(manager, goal);
  }

  private mkMul(args: number[]) {
    return args.length === 1 ? args[0] : this.manager.mkApp(OP_MUL, args, SORT_REAL);
  }

  private push(eqs: DependentEq[], orig: number, variable: number, term: number) {
    this.eqTerms.push(term);
    eqs.push({ orig, variable, term, dependency: undefined });
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
              ? mkBvApp(manager, OP_BSUB, [term, arg])
              : manager.mkApp(OP_SUB, [term, arg], manager.sorts[rhs]),
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
              manager.mkApp(OP_UMINUS, [this.mkSubTerm(x, index, y)], manager.sorts[y]),
            );
          else if (isReal && !value.isZero())
            this.push(
              eqs,
              orig,
              variable,
              manager.mkApp(OP_DIV, [this.mkSubTerm(x, index, y), coefficient], SORT_REAL),
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
        const others = factors.filter((_value, otherIndex) => otherIndex !== factorIndex);
        const term = this.mkSubTerm(x, index, y);
        this.push(eqs, orig, factor, manager.mkApp(OP_DIV, [term, this.mkMul(others)], SORT_REAL));
      }
    }
  }

  private solveArithMod(orig: number, x: number, y: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (!this.options.isEliminatingMod || manager.getOp(x) !== OP_MOD) return;
    const [dividend, divisor] = manager.getArgs(x);
    if (!manager.isNumeral(divisor) || !manager.getRationalValue(divisor).isPositive()) return;
    const fresh = manager.mkFreshConst("mod", SORT_INT);
    const term = manager.mkApp(
      OP_ADD,
      [manager.mkApp(OP_MUL, [divisor, fresh], SORT_INT), y],
      SORT_INT,
    );
    manager.incRef(term);
    if (this.isConst(dividend)) this.push(eqs, orig, dividend, term);
    else this.solveArithEq(orig, dividend, term, eqs);
    manager.decRef(term);
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
      const others = factors.filter((_value, otherIndex) => otherIndex !== index);
      this.push(eqs, orig, factor, manager.mkApp(OP_DIV, [y, this.mkMul(others)], SORT_REAL));
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
    return { variable, value };
  }

  private mkInverseMul(odd: { variable: number; value: bigint }, term: number) {
    const manager = this.manager;
    const width = manager.getBvSize(manager.sorts[odd.variable]);
    const inverse = manager.mkBvNumeral(getModInverse(odd.value, 1n << BigInt(width)), width);
    return mkBvApp(manager, OP_BMUL, [inverse, term]);
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
        this.push(eqs, orig, odd.variable, this.mkInverseMul(odd, this.mkSubTerm(x, index, y)));
      }
    const odd = this.getOddCoefficient(x);
    if (odd !== undefined) this.push(eqs, orig, odd.variable, this.mkInverseMul(odd, y));
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
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (isMatch(expr)) return true;
      if (manager.kinds[expr] === KIND_APP || manager.kinds[expr] === KIND_QUANTIFIER)
        manager.pushArgs(expr, todo);
    }
    return false;
  }

  // array_extract_eq: (forall (x) (=> G (= (select A x) t))) solves A as
  // (lambda (x) (ite G t (select A' x))) with a fresh A', and without G as (lambda (x) t).
  private getArrayEqs(form: number, eqs: DependentEq[]) {
    const manager = this.manager;
    if (
      manager.kinds[form] !== KIND_QUANTIFIER ||
      manager.getQuantifier(form).kind !== QUANTIFIER_FORALL
    )
      return;
    const body = manager.getQuantifier(form).body;
    const isOr = manager.getOp(body) === OP_OR && manager.getNumArgs(body) === 2;
    const [guard, eq] =
      manager.getOp(body) === OP_IMPLIES
        ? manager.getArgs(body)
        : isOr
          ? manager.getOp(manager.getArg(body, 1)) === OP_EQ
            ? [mkNot(manager, manager.getArg(body, 0)), manager.getArg(body, 1)]
            : manager.getOp(manager.getArg(body, 0)) === OP_EQ
              ? [mkNot(manager, manager.getArg(body, 1)), manager.getArg(body, 0)]
              : [-1, -1]
          : [-1, body];
    if (eq === -1) return;
    if (isOr) manager.incRef(guard);
    const definition = this.mkArrayDef(form, guard, eq);
    if (definition !== undefined) this.push(eqs, form, definition.array, definition.term);
    if (isOr) manager.decRef(guard);
  }

  private mkArrayDef(form: number, guard: number, eq: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(form);
    const numVars = data.sorts.length;
    if (manager.getOp(eq) !== OP_EQ) return undefined;
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
    if (select === -1) return undefined;
    const array = manager.getArg(select, 0);
    const isQuantifier = (expr: number) => manager.kinds[expr] === KIND_QUANTIFIER;
    const parts = condition === -1 ? [def] : [def, condition];
    if (
      !this.isConst(array) ||
      parts.some((part) => this.hasSubterm(part, (expr) => expr === array)) ||
      parts.some((part) => this.hasSubterm(part, isQuantifier))
    )
      return undefined;
    const lambdaBody =
      condition === -1
        ? def
        : manager.mkApp(
            OP_ITE,
            [
              condition,
              def,
              mkArrayApp(manager, OP_SELECT, [
                manager.mkFreshConst("array-def", manager.sorts[array]),
                ...manager.getArgs(select).slice(1),
              ]),
            ],
            manager.sorts[def],
          );
    const term = manager.mkQuantifier({
      kind: QUANTIFIER_LAMBDA,
      sorts: data.sorts,
      names: data.names,
      body: lambdaBody,
      patterns: [],
      noPatterns: [],
      weight: 1,
      qid: "",
    });
    return { array, term };
  }

  private getEqsOf(form: number, eqs: DependentEq[]) {
    if (!this.goal.isProofsEnabled) this.getArithEqs(form, eqs);
    this.getBasicEqs(form, eqs);
    if (!this.goal.isProofsEnabled) {
      this.getBvEqs(form, eqs);
      this.getArrayEqs(form, eqs);
    }
  }

  private setDependencies(eqs: DependentEq[], start: number, index: number) {
    if (!this.goal.isCoresEnabled) return;
    const dependency = this.goal.getDependency(index);
    for (let current = start; current < eqs.length; current++) eqs[current].dependency = dependency;
  }

  private getEqs() {
    const eqs: DependentEq[] = [];
    const state = this.state;
    const extract = (getFormEqs: (form: number, eqs: DependentEq[]) => void) =>
      state.forEachIndex((index) => {
        const start = eqs.length;
        getFormEqs(state.get(index), eqs);
        this.setDependencies(eqs, start, index);
      });
    if (!this.goal.isProofsEnabled) extract((form) => this.getArithEqs(form, eqs));
    extract((form) => this.getBasicEqs(form, eqs));
    if (!this.goal.isProofsEnabled) {
      extract((form) => this.getBvEqs(form, eqs));
      extract((form) => this.getArrayEqs(form, eqs));
      // ff_extract_eq finds no equations without finite fields, but its pass still counts steps.
      state.forEachIndex(() => {});
    }
    return eqs;
  }

  private resetNext() {
    for (let index = 0; index < this.next.length; index++) {
      const eqs = this.next[index];
      for (let eqIndex = 0; eqIndex < eqs.length; eqIndex++) this.manager.decRef(eqs[eqIndex].term);
    }
    this.next = [];
  }

  private extractDepGraph(eqs: DependentEq[]) {
    this.var2id.clear();
    this.id2var = [];
    this.resetNext();
    for (const eq of eqs) {
      if (this.var2id.has(eq.variable) || !this.canBeVar(eq.variable)) continue;
      this.var2id.set(eq.variable, this.id2var.length);
      this.id2var.push(eq.variable);
    }
    this.next = this.id2var.map(() => []);
    for (const eq of eqs) {
      if (!this.canBeVar(eq.variable)) continue;
      this.manager.incRef(eq.term);
      this.next[this.var2id.get(eq.variable) as number].push(eq);
    }
  }

  private extractSubst() {
    const manager = this.manager;
    const size = this.id2var.length;
    this.id2level = this.id2var.map(() => Infinity);
    this.substIds = [];
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    this.substDependencies.clear();
    let initLevel = 2 ** 32 - 1;
    const todo: number[] = [];
    for (let id = 0; id < size; id++) {
      if (this.id2level[id] !== Infinity) continue;
      if (initLevel < size + 1) return;
      initLevel -= size + 1;
      let currLevel = initLevel;
      todo.push(id);
      for (let next = todo.pop(); next !== undefined; next = todo.pop()) {
        if (this.id2level[next] !== Infinity) continue;
        this.id2level[next] = currLevel++;
        for (const eq of this.next[next]) {
          const todoSize = todo.length;
          let isSafe = true;
          const visited = new Set<number>();
          const stack = [eq.term];
          for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
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
          manager.incRef(eq.term);
          manager.decRef(this.next[next][0].term);
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
    const replacer = new DependentSubstReplacer(manager, this.substitution, this.substDependencies);
    this.substIds.sort((first, second) => this.id2level[second] - this.id2level[first]);
    for (const id of this.substIds) {
      if (!manager.limit.inc()) break;
      const eq = this.next[id][0];
      const definition = replacer.replace(eq.term);
      this.pinned.pushOwned(definition);
      manager.incRef(eq.variable);
      this.pinned.pushOwned(eq.variable);
      this.substitution.set(eq.variable, definition);
      const dependency = joinDependencies(eq.dependency, replacer.dependency);
      if (dependency !== undefined) this.substDependencies.set(eq.variable, dependency);
    }
    replacer.release();
  }

  private applySubst() {
    const manager = this.manager;
    if (!manager.limit.inc() || this.substIds.length === 0) return;
    const replacer = new DependentSubstReplacer(manager, this.substitution, this.substDependencies);
    const goal = this.goal;
    const state = this.state;
    state.forEachIndex((index) => {
      const form = state.get(index);
      const replaced = replacer.replace(form);
      const simplified = this.rewriter.rewrite(replaced);
      manager.decRef(replaced);
      if (simplified !== form) {
        this.oldForms.push(form);
        goal.update(
          index,
          simplified,
          joinDependencies(goal.getDependency(index), replacer.dependency),
        );
      }
      manager.decRef(simplified);
    });
    replacer.release();
  }

  private saveSubst() {
    for (const [variable, def] of this.substitution.entries())
      this.definitions.push({ decl: this.manager.decls[variable], def });
  }

  private canBeVar(expr: number) {
    return this.isConst(expr) && !this.unsafeVars.has(expr);
  }

  // filter_unsafe_vars: the recfun theory unfolds a recursive definition, which a substitution
  // does not reach, so the constants in its body stay.
  private runRound(getEqs: () => DependentEq[]) {
    const manager = this.manager;
    this.unsafeVars = new Set(
      [...manager.recFunDefs.values()]
        .filter((def) => !def.isMacro && def.rhs !== -1)
        .flatMap((def) => getSubterms(manager, def.rhs)),
    );
    this.oldForms.reset();
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
    const limit = this.manager.limit;
    let count = 0;
    do {
      this.runRound(() => this.getEqs());
      count++;
    } while (this.substIds.length > 0 && count < 20 && limit.inc());
    if (limit.inc() && this.options.isContextSolve && !goal.isProofsEnabled) {
      this.runRound(() => this.collectNestedEqualities());
      if (this.substitution.size > 0)
        for (let index = 0; index < this.oldForms.size; index++)
          this.pinned.push(this.oldForms.items[index]);
    }
    this.eqTerms.reset();
    this.oldForms.reset();
    finishSimplifier(goal, this.definitions);
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
    for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
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
    for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
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
    for (let index = 0; index < forms.length; index++) {
      const start = collected.length;
      this.collectNestedIn(forms[index], visited, collected);
      this.setDependencies(collected, start, index);
    }
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
        for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
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
      forms.map((_value, index) => index),
    );
    record(
      lastOccurrence,
      forms.map((_value, index) => forms.length - 1 - index),
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
    this.eqTerms.reset();
    this.resetNext();
    this.rewriter.release();
    this.pinned.reset();
    this.state.release();
  }
}
