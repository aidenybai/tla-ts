// Ported from Z3 (src/tactic/arith/fm_tactic.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError, SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import type { Goal } from "./goal";
import type { ProtoModel } from "./proto-model";
import { getGcd, getLcm, Rational } from "./rational";
import { RefVector } from "./ref-vector";

export interface FmOptions {
  isRealOnly: boolean;
  limit: number;
  cutoff1: number;
  cutoff2: number;
  extra: number;
  isOcc: boolean;
}

// lits \/ (as[0]*xs[0] + ... + as[n-1]*xs[n-1] <= c), with < when strict. A literal is the index
// of a Boolean constant, negative when negated.
interface Constraint {
  id: number;
  lits: number[];
  xs: number[];
  as: Rational[];
  c: Rational;
  isStrict: boolean;
  isDead: boolean;
}

const UINT_MAX = 4294967295;

class ConstraintSet {
  private id2pos: number[] = [];
  private set: Constraint[] = [];

  get isEmpty() {
    return this.set.length === 0;
  }

  insert(constraint: Constraint) {
    if (this.id2pos[constraint.id] !== undefined && this.id2pos[constraint.id] !== -1) return;
    this.id2pos[constraint.id] = this.set.length;
    this.set.push(constraint);
  }

  erase(constraint: Constraint) {
    const pos = this.id2pos[constraint.id];
    if (pos === undefined || pos === -1) return;
    this.id2pos[constraint.id] = -1;
    const last = this.set.length - 1;
    if (pos !== last) {
      const lastConstraint = this.set[last];
      this.set[pos] = lastConstraint;
      this.id2pos[lastConstraint.id] = pos;
    }
    this.set.pop();
  }

  pop() {
    const constraint = this.set.pop() as Constraint;
    this.id2pos[constraint.id] = -1;
    return constraint;
  }
}

class IdGen {
  private next = 0;
  private free: number[] = [];

  mk() {
    return this.free.pop() ?? this.next++;
  }

  recycle(id: number) {
    this.free.push(id);
  }
}

class Fm {
  private bvar2expr: RefVector;
  private bvar2sign: number[] = [0];
  private expr2bvar = new Map<number, number>();
  private isInts: boolean[] = [];
  private forbidden: boolean[] = [];
  private var2expr: RefVector;
  private expr2var = new Map<number, number>();
  private var2pos: number[] = [];
  private lowers: Constraint[][] = [];
  private uppers: Constraint[][] = [];
  private forbiddenSet = new Set<number>();
  private idGen = new IdGen();
  private counter = 0;
  private isInconsistent = false;
  private subTodo = new ConstraintSet();
  readonly converter: { decl: number; clauses: RefVector }[] = [];

  constructor(
    private manager: AstManager,
    private goal: Goal,
    private options: FmOptions,
  ) {
    this.bvar2expr = new RefVector(manager);
    this.bvar2expr.push(-1);
    this.var2expr = new RefVector(manager);
  }

  private isLiteral(expr: number) {
    const manager = this.manager;
    return (
      manager.isUninterpretedConst(expr) ||
      (manager.isNot(expr) && manager.isUninterpretedConst(manager.getArg(expr, 0)))
    );
  }

  private getVar(expr: number) {
    const manager = this.manager;
    if (manager.isUninterpretedConst(expr)) return expr;
    if (manager.getOp(expr) === OP_TO_REAL && manager.isUninterpretedConst(manager.getArg(expr, 0)))
      return manager.getArg(expr, 0);
    return undefined;
  }

  private getMulArgs(expr: number) {
    const manager = this.manager;
    return manager.getOp(expr) === OP_MUL && manager.getNumArgs(expr) === 2
      ? manager.getArgs(expr)
      : undefined;
  }

  private getLinearMonVar(expr: number) {
    const args = this.getMulArgs(expr);
    if (args !== undefined && this.manager.isNumeral(args[0])) {
      const variable = this.getVar(args[1]);
      if (variable !== undefined) return variable;
    }
    return this.getVar(expr);
  }

  private getMonomials(expr: number) {
    const manager = this.manager;
    return manager.getOp(expr) === OP_ADD ? manager.getArgs(expr) : [expr];
  }

  private isLinearPol(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    let isAllForbidden = true;
    for (const monomial of this.getMonomials(expr)) {
      const variable = this.getLinearMonVar(monomial);
      if (variable === undefined || visited.has(variable)) return false;
      visited.add(variable);
      if (
        !this.forbiddenSet.has(manager.decls[variable]) &&
        (!this.options.isRealOnly || manager.sorts[variable] !== SORT_INT)
      )
        isAllForbidden = false;
    }
    return !isAllForbidden;
  }

  private isLinearIneq(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.getArg(expr, 0) : expr;
    const op = manager.getOp(atom);
    if (op !== OP_LE && op !== OP_GE) return false;
    if (!manager.isNumeral(manager.getArg(atom, 1))) return false;
    return this.isLinearPol(manager.getArg(atom, 0));
  }

  private isOcc(expr: number) {
    const manager = this.manager;
    if (this.options.isOcc && manager.getOp(expr) === OP_OR) {
      let isFound = false;
      for (const arg of manager.getArgs(expr)) {
        if (this.isLiteral(arg)) continue;
        if (!this.isLinearIneq(arg) || isFound) return false;
        isFound = true;
      }
      return isFound;
    }
    return this.isLinearIneq(expr);
  }

  private delConstraint(constraint: Constraint) {
    this.subTodo.erase(constraint);
    this.idGen.recycle(constraint.id);
  }

  private mkConstraint(
    lits: number[],
    xs: number[],
    as: Rational[],
    c: Rational,
    isStrict: boolean,
  ): Constraint {
    return {
      id: this.idGen.mk(),
      lits: [...lits],
      xs: [...xs],
      as: [...as],
      c,
      isStrict,
      isDead: false,
    };
  }

  private normalizeCoeffs(constraint: Constraint) {
    if (constraint.xs.length === 0) return;
    let gcd = constraint.c.num < 0n ? -constraint.c.num : constraint.c.num;
    for (const coeff of constraint.as) {
      if (gcd === 1n) break;
      gcd = getGcd(coeff.num, gcd);
    }
    if (gcd === 1n) return;
    const divisor = Rational.of(gcd);
    constraint.c = constraint.c.div(divisor);
    constraint.as = constraint.as.map((coeff) => coeff.div(divisor));
  }

  private subsumes(first: Constraint, second: Constraint) {
    if (first === second) return false;
    if (first.lits.length > second.lits.length) return false;
    if (first.xs.length !== second.xs.length) return false;
    if (first.c.compare(second.c) > 0) return false;
    if (!first.isStrict && second.isStrict && first.c.equals(second.c)) return false;
    this.counter += first.lits.length + second.lits.length;
    for (const [index, variable] of first.xs.entries()) this.var2pos[variable] = index;
    let isFailed = false;
    for (const [index, variable] of second.xs.entries()) {
      const pos = this.var2pos[variable];
      if (pos === UINT_MAX || !first.as[pos].equals(second.as[index])) {
        isFailed = true;
        break;
      }
    }
    for (const variable of first.xs) this.var2pos[variable] = UINT_MAX;
    if (isFailed) return false;
    for (const lit of second.lits) this.bvar2sign[Math.abs(lit)] = lit < 0 ? -1 : 1;
    for (const lit of first.lits)
      if (this.bvar2sign[Math.abs(lit)] !== (lit < 0 ? -1 : 1)) {
        isFailed = true;
        break;
      }
    for (const lit of second.lits) this.bvar2sign[Math.abs(lit)] = 0;
    return !isFailed;
  }

  private backwardSubsumption(constraint: Constraint) {
    if (constraint.xs.length === 0) return;
    let best = UINT_MAX;
    let bestSize = UINT_MAX;
    let isBestLower = false;
    for (const [index, variable] of constraint.xs.entries()) {
      if (this.forbidden[variable]) continue;
      const isNegative = constraint.as[index].isNegative();
      const list = isNegative ? this.lowers[variable] : this.uppers[variable];
      if (list.length < bestSize) {
        best = variable;
        bestSize = list.length;
        isBestLower = isNegative;
      }
    }
    if (bestSize === 0 || best === UINT_MAX) return;
    const list = isBestLower ? this.lowers[best] : this.uppers[best];
    this.counter += list.length;
    let kept = 0;
    for (const other of list) {
      if (other.isDead) continue;
      if (this.subsumes(constraint, other)) {
        other.isDead = true;
        continue;
      }
      list[kept++] = other;
    }
    list.length = kept;
  }

  private subsume() {
    while (!this.subTodo.isEmpty) {
      const constraint = this.subTodo.pop();
      if (!constraint.isDead) this.backwardSubsumption(constraint);
    }
  }

  private initForbiddenSet() {
    const manager = this.manager;
    const visited = new Set<number>();
    for (const form of this.goal.forms.items) {
      if (this.isOcc(form)) continue;
      const todo = [form];
      for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
        if (visited.has(expr)) continue;
        visited.add(expr);
        if (manager.kinds[expr] !== KIND_APP) continue;
        if (
          manager.isUninterpretedConst(expr) &&
          manager.getSortFamily(manager.sorts[expr]) === FAMILY_ARITH
        )
          this.forbiddenSet.add(manager.decls[expr]);
        manager.pushArgs(expr, todo);
      }
    }
  }

  private isAllInt(constraint: Constraint) {
    return constraint.xs.every((variable) => this.isInts[variable]);
  }

  private toExpr(constraint: Constraint) {
    const manager = this.manager;
    let ineq = -1;
    if (constraint.xs.length === 0) {
      if (constraint.c.isPositive() || (!constraint.isStrict && constraint.c.isZero()))
        return manager.trueExpr;
    } else {
      const isIntConstraint = this.isAllInt(constraint);
      const sort = isIntConstraint ? SORT_INT : SORT_REAL;
      const monomials = constraint.xs.map((variable, index) => {
        const expr = this.var2expr.items[variable];
        const term =
          !isIntConstraint && this.isInts[variable]
            ? manager.mkApp(OP_TO_REAL, [expr], SORT_REAL)
            : expr;
        const coeff = constraint.as[index];
        return coeff.equals(Rational.one)
          ? term
          : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(coeff, sort), term], sort);
      });
      const lhs = monomials.length === 1 ? monomials[0] : manager.mkApp(OP_ADD, monomials, sort);
      const rhs = manager.mkNumeralOfSort(constraint.c, sort);
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

  private toVar(expr: number) {
    const manager = this.manager;
    const existing = this.expr2var.get(expr);
    if (existing !== undefined) return existing;
    const variable = this.var2expr.size;
    this.var2expr.push(expr);
    const isInt = manager.sorts[expr] === SORT_INT;
    this.isInts.push(isInt);
    this.var2pos.push(UINT_MAX);
    this.expr2var.set(expr, variable);
    this.lowers.push([]);
    this.uppers.push([]);
    this.forbidden.push(
      this.forbiddenSet.has(manager.decls[expr]) || (this.options.isRealOnly && isInt),
    );
    return variable;
  }

  private toLiteral(expr: number) {
    const manager = this.manager;
    const isNegated = manager.isNot(expr);
    const atom = isNegated ? manager.getArg(expr, 0) : expr;
    let bvar = this.expr2bvar.get(atom);
    if (bvar === undefined) {
      bvar = this.bvar2expr.size;
      this.bvar2expr.push(atom);
      this.bvar2sign.push(0);
      this.expr2bvar.set(atom, bvar);
    }
    return isNegated ? -bvar : bvar;
  }

  private addConstraint(form: number) {
    const manager = this.manager;
    const lits: number[] = [];
    const xs: number[] = [];
    let as: Rational[] = [];
    let c = Rational.zero;
    let isStrict = false;
    const args = manager.getOp(form) === OP_OR ? manager.getArgs(form) : [form];
    for (const arg of args) {
      if (this.isLiteral(arg)) {
        lits.push(this.toLiteral(arg));
        continue;
      }
      let isNegated = manager.isNot(arg);
      const atom = isNegated ? manager.getArg(arg, 0) : arg;
      isStrict = isNegated;
      if (manager.getOp(atom) === OP_GE) isNegated = !isNegated;
      const [lhs, rhs] = manager.getArgs(atom);
      c = manager.getRationalValue(rhs);
      if (isNegated) c = c.neg();
      let isAllInt = true;
      for (const monomial of this.getMonomials(lhs)) {
        const mulArgs = this.getMulArgs(monomial);
        let coeff = mulArgs === undefined ? Rational.one : manager.getRationalValue(mulArgs[0]);
        if (isNegated) coeff = coeff.neg();
        const variable = this.toVar(
          this.getVar(mulArgs === undefined ? monomial : mulArgs[1]) as number,
        );
        xs.push(variable);
        as.push(coeff);
        if (!this.isInts[variable]) isAllInt = false;
      }
      const lcm = as.reduce((value, coeff) => getLcm(value, coeff.den), c.den);
      if (lcm !== 1n) {
        const factor = Rational.of(lcm);
        c = c.mul(factor);
        as = as.map((coeff) => coeff.mul(factor));
      }
      if (isAllInt && isStrict) {
        isStrict = false;
        c = c.sub(Rational.one);
      }
    }
    this.registerConstraint(this.mkConstraint(lits, xs, as, c, isStrict));
  }

  private isFalse(constraint: Constraint) {
    return (
      constraint.lits.length === 0 &&
      constraint.xs.length === 0 &&
      (constraint.c.isNegative() || (constraint.isStrict && constraint.c.isZero()))
    );
  }

  private registerConstraint(constraint: Constraint) {
    this.normalizeCoeffs(constraint);
    if (this.isFalse(constraint)) {
      this.delConstraint(constraint);
      this.isInconsistent = true;
      return;
    }
    let isIndexed = false;
    for (const [index, variable] of constraint.xs.entries()) {
      if (this.forbidden[variable]) continue;
      isIndexed = true;
      if (constraint.as[index].isNegative()) this.lowers[variable].push(constraint);
      else this.uppers[variable].push(constraint);
    }
    if (isIndexed) {
      this.subTodo.insert(constraint);
      return;
    }
    this.goal.assert(this.toExpr(constraint));
    this.delConstraint(constraint);
  }

  private getCost(variable: number) {
    return Math.min(this.lowers[variable].length * this.uppers[variable].length, UINT_MAX);
  }

  private sortCandidates() {
    const candidates: { variable: number; cost: number }[] = [];
    for (let variable = 0; variable < this.isInts.length; variable++)
      if (!this.forbidden[variable]) candidates.push({ variable, cost: this.getCost(variable) });
    const getKey = (candidate: { variable: number; cost: number }) =>
      candidate.cost === 0
        ? [0, candidate.variable, 0]
        : [1, this.isInts[candidate.variable] ? 1 : 0, candidate.cost];
    return candidates
      .sort((first, second) => {
        const firstKey = getKey(first);
        const secondKey = getKey(second);
        return (
          firstKey[0] - secondKey[0] || firstKey[1] - secondKey[1] || firstKey[2] - secondKey[2]
        );
      })
      .map((candidate) => candidate.variable);
  }

  private cleanupConstraints(list: Constraint[]) {
    let kept = 0;
    for (const constraint of list) if (!constraint.isDead) list[kept++] = constraint;
    list.length = kept;
  }

  // The coefficient of variable is unit in all of list, or undefined when a variable is real.
  private getUnitCoeff(list: Constraint[], variable: number) {
    let isUnit = true;
    for (const constraint of list)
      for (const [index, other] of constraint.xs.entries()) {
        if (!this.isInts[other]) return undefined;
        if (other === variable) {
          const coeff = constraint.as[index];
          if (!coeff.equals(Rational.one) && !coeff.equals(Rational.minusOne)) isUnit = false;
        }
      }
    return isUnit;
  }

  private canEliminate(variable: number) {
    if (!this.isInts[variable]) return true;
    const isLowerUnit = this.getUnitCoeff(this.lowers[variable], variable);
    if (isLowerUnit === undefined) return false;
    const isUpperUnit = this.getUnitCoeff(this.uppers[variable], variable);
    return isUpperUnit !== undefined && (isLowerUnit || isUpperUnit);
  }

  private markConstraintsDead(variable: number) {
    const clauses = new RefVector(this.manager);
    for (const constraint of [...this.lowers[variable], ...this.uppers[variable]])
      clauses.push(this.toExpr(constraint));
    const decl = this.manager.decls[this.var2expr.items[variable]];
    this.manager.incDeclRef(decl);
    this.converter.push({ decl, clauses });
    for (const constraint of this.lowers[variable]) constraint.isDead = true;
    for (const constraint of this.uppers[variable]) constraint.isDead = true;
  }

  private getCoeff(constraint: Constraint, variable: number) {
    return constraint.as[constraint.xs.indexOf(variable)];
  }

  private resolve(lower: Constraint, upper: Constraint, variable: number) {
    this.counter += lower.xs.length + upper.xs.length + lower.lits.length + upper.lits.length;
    const a = this.getCoeff(lower, variable).neg();
    const b = this.getCoeff(upper, variable);
    let newXs: number[] = [];
    let newAs: Rational[] = [];
    let newC = lower.c.mul(b).add(upper.c.mul(a));
    let isNewStrict = lower.isStrict || upper.isStrict;
    for (const [index, other] of lower.xs.entries()) {
      if (other === variable) continue;
      this.var2pos[other] = newXs.length;
      newXs.push(other);
      newAs.push(lower.as[index].mul(b));
    }
    for (const [index, other] of upper.xs.entries()) {
      if (other === variable) continue;
      const pos = this.var2pos[other];
      if (pos === UINT_MAX) {
        newXs.push(other);
        newAs.push(upper.as[index].mul(a));
      } else newAs[pos] = newAs[pos].add(upper.as[index].mul(a));
    }
    let isAllInt = true;
    const kept = newAs.map((coeff) => !coeff.isZero());
    newXs = newXs.filter((_other, index) => kept[index]);
    newAs = newAs.filter((_coeff, index) => kept[index]);
    for (const other of newXs) if (!this.isInts[other]) isAllInt = false;
    if (isAllInt && isNewStrict) {
      isNewStrict = false;
      newC = newC.sub(Rational.one);
    }
    for (const other of lower.xs) this.var2pos[other] = UINT_MAX;
    if (newXs.length === 0 && (newC.isPositive() || (!isNewStrict && newC.isZero())))
      return undefined;
    const newLits: number[] = [];
    for (const lit of lower.lits) {
      this.bvar2sign[Math.abs(lit)] = lit < 0 ? -1 : 1;
      newLits.push(lit);
    }
    let isTautology = false;
    for (const lit of upper.lits) {
      const sign = this.bvar2sign[Math.abs(lit)];
      if (sign === 0) newLits.push(lit);
      else if ((sign === -1 && lit > 0) || (sign === 1 && lit < 0)) {
        isTautology = true;
        break;
      }
    }
    for (const lit of lower.lits) this.bvar2sign[Math.abs(lit)] = 0;
    if (isTautology) return undefined;
    if (
      newLits.length === 0 &&
      newXs.length === 0 &&
      (newC.isNegative() || (isNewStrict && newC.isZero()))
    ) {
      this.isInconsistent = true;
      return undefined;
    }
    return this.mkConstraint(newLits, newXs, newAs, newC, isNewStrict);
  }

  private tryEliminate(variable: number) {
    const lowers = this.lowers[variable];
    const uppers = this.uppers[variable];
    this.cleanupConstraints(lowers);
    this.cleanupConstraints(uppers);
    if (lowers.length === 0 || uppers.length === 0) {
      this.markConstraintsDead(variable);
      return true;
    }
    const numLowers = lowers.length;
    const numUppers = uppers.length;
    if (numLowers > this.options.cutoff1 && numUppers > this.options.cutoff1) return false;
    if (numLowers * numUppers > this.options.cutoff2) return false;
    if (!this.canEliminate(variable)) return false;
    this.counter += numLowers * numUppers;
    const limit = numLowers + numUppers + this.options.extra;
    const newConstraints: Constraint[] = [];
    for (const lower of lowers)
      for (const upper of uppers) {
        if (this.isInconsistent || newConstraints.length > limit) {
          for (const constraint of newConstraints) this.delConstraint(constraint);
          return false;
        }
        const resolved = this.resolve(lower, upper, variable);
        if (resolved !== undefined) newConstraints.push(resolved);
      }
    this.markConstraintsDead(variable);
    this.counter += newConstraints.length;
    for (const constraint of newConstraints) {
      this.backwardSubsumption(constraint);
      this.registerConstraint(constraint);
    }
    return true;
  }

  private copyRemaining(lists: Constraint[][]) {
    for (const list of lists)
      for (const constraint of list) {
        if (constraint.isDead) continue;
        constraint.isDead = true;
        this.goal.assert(this.toExpr(constraint));
      }
  }

  run() {
    const manager = this.manager;
    const goal = this.goal;
    this.initForbiddenSet();
    const forms = new RefVector(manager);
    for (const form of goal.forms.items) forms.push(form);
    goal.reset();
    goal.depth++;
    for (const form of forms.items) {
      if (this.isInconsistent) break;
      if (this.isOcc(form)) this.addConstraint(form);
      else goal.assert(form);
    }
    forms.reset();
    if (this.isInconsistent) {
      goal.reset();
      goal.assert(manager.falseExpr);
      return false;
    }
    this.subsume();
    for (const variable of this.sortCandidates()) {
      if (!manager.limit.inc()) throw new SmtCanceledError();
      if (this.counter > this.options.limit) break;
      this.counter++;
      this.tryEliminate(variable);
      if (this.isInconsistent) {
        goal.reset();
        goal.assert(manager.falseExpr);
        return false;
      }
    }
    this.copyRemaining(this.uppers);
    this.copyRemaining(this.lowers);
    return true;
  }

  release() {
    this.bvar2expr.reset();
    this.var2expr.reset();
  }
}

interface Bound {
  value: Rational;
  expr: number;
}

const LOWER = 1;
const UPPER = 2;

class FmModelConverter {
  constructor(
    private manager: AstManager,
    private entries: { decl: number; clauses: RefVector }[],
  ) {}

  private evaluate(model: ProtoModel, expr: number) {
    const value = model.eval(expr, true);
    this.manager.releaseLater(value);
    return value;
  }

  private process(
    model: ProtoModel,
    decl: number,
    clause: number,
  ): { kind: number; bound: Bound } | undefined {
    const manager = this.manager;
    const isInt = manager.funcDecls[decl].range === SORT_INT;
    const lits = manager.getOp(clause) === OP_OR ? manager.getArgs(clause) : [clause];
    let result: { kind: number; bound: Bound } | undefined;
    for (const lit of lits) {
      if (
        manager.isUninterpretedConst(lit) ||
        (manager.isNot(lit) && manager.isUninterpretedConst(manager.getArg(lit, 0)))
      ) {
        if (manager.isTrue(this.evaluate(model, lit))) return undefined;
        continue;
      }
      let isNegated = manager.isNot(lit);
      const atom = isNegated ? manager.getArg(lit, 0) : lit;
      const isStrict = isNegated;
      if (manager.getOp(atom) === OP_GE) isNegated = !isNegated;
      const [lhs, rhs] = manager.getArgs(atom);
      if (!manager.isNumeral(rhs)) return undefined;
      let c = manager.getRationalValue(rhs);
      if (isNegated) c = c.neg();
      let cExpr = -1;
      let coeff = Rational.zero;
      const monomials = manager.getOp(lhs) === OP_ADD ? manager.getArgs(lhs) : [lhs];
      for (const monomial of monomials) {
        const mulArgs =
          manager.getOp(monomial) === OP_MUL && manager.getNumArgs(monomial) === 2
            ? manager.getArgs(monomial)
            : undefined;
        if (mulArgs !== undefined && !manager.isNumeral(mulArgs[0])) return undefined;
        const factor = mulArgs === undefined ? Rational.one : manager.getRationalValue(mulArgs[0]);
        const inner = mulArgs === undefined ? monomial : mulArgs[1];
        const variable = manager.getOp(inner) === OP_TO_REAL ? manager.getArg(inner, 0) : inner;
        if (!manager.isUninterpretedConst(variable)) return undefined;
        if (manager.decls[variable] === decl) {
          coeff = isNegated ? factor.neg() : factor;
          continue;
        }
        const value = this.evaluate(model, monomial);
        if (manager.isNumeral(value)) {
          const numeral = manager.getRationalValue(value);
          c = c.sub(isNegated ? numeral.neg() : numeral);
          continue;
        }
        const term = isNegated ? manager.mkApp(OP_UMINUS, [value], manager.sorts[value]) : value;
        cExpr =
          cExpr === -1
            ? manager.mkApp(OP_UMINUS, [term], manager.sorts[term])
            : manager.mkApp(OP_SUB, [cExpr, term], manager.sorts[term]);
      }
      if (isInt && isStrict) c = c.sub(Rational.one);
      const kind = coeff.isNegative() ? LOWER : UPPER;
      c = c.div(coeff);
      if (cExpr !== -1)
        cExpr = manager.mkApp(
          OP_DIV,
          [cExpr, manager.mkNumeralOfSort(coeff, SORT_REAL)],
          SORT_REAL,
        );
      if (isInt) c = kind === LOWER ? c.ceil() : c.floor();
      result = { kind, bound: { value: c, expr: cExpr } };
    }
    return result;
  }

  convert(model: ProtoModel) {
    const manager = this.manager;
    const mkIte = (isMax: boolean, first: number, second: number) => {
      const condition = manager.mkApp(OP_GE, [first, second], SORT_BOOL);
      return manager.mkApp(
        OP_ITE,
        isMax ? [condition, first, second] : [condition, second, first],
        manager.sorts[first],
      );
    };
    const outer = manager.beginTemporaries();
    for (let index = this.entries.length - 1; index >= 0; index--) {
      const entry = this.entries[index];
      const decl = entry.decl;
      let lower: Rational | undefined;
      let upper: Rational | undefined;
      let lowerExpr = -1;
      let upperExpr = -1;
      for (const clause of entry.clauses.items) {
        if (!manager.limit.inc()) throw new SmtTacticError("canceled");
        const processed = this.process(model, decl, clause);
        if (processed === undefined) continue;
        const bound = processed.bound;
        if (processed.kind === LOWER) {
          if (bound.expr !== -1)
            lowerExpr = lowerExpr === -1 ? bound.expr : mkIte(true, lowerExpr, bound.expr);
          else if (lower === undefined || bound.value.compare(lower) > 0) lower = bound.value;
        } else if (bound.expr !== -1)
          upperExpr = upperExpr === -1 ? bound.expr : mkIte(false, upperExpr, bound.expr);
        else if (upper === undefined || bound.value.compare(upper) < 0) upper = bound.value;
      }
      const value =
        manager.funcDecls[decl].range === SORT_INT
          ? this.getIntValue(lower, upper, lowerExpr, upperExpr, mkIte)
          : this.getRealValue(lower, upper, lowerExpr, upperExpr, mkIte);
      model.registerConst(decl, value);
    }
    manager.endTemporaries(outer);
    return model;
  }

  private getIntValue(
    lower: Rational | undefined,
    upper: Rational | undefined,
    lowerExpr: number,
    upperExpr: number,
    mkIte: (isMax: boolean, first: number, second: number) => number,
  ) {
    const manager = this.manager;
    if (lowerExpr !== -1)
      return lower === undefined
        ? lowerExpr
        : mkIte(true, lowerExpr, manager.mkNumeralOfSort(lower, SORT_INT));
    if (upperExpr !== -1)
      return upper === undefined
        ? upperExpr
        : mkIte(false, upperExpr, manager.mkNumeralOfSort(upper, SORT_INT));
    return manager.mkNumeralOfSort(lower ?? upper ?? Rational.zero, SORT_INT);
  }

  private getRealValue(
    lower: Rational | undefined,
    upper: Rational | undefined,
    inputLowerExpr: number,
    inputUpperExpr: number,
    mkIte: (isMax: boolean, first: number, second: number) => number,
  ) {
    const manager = this.manager;
    const real = (value: Rational) => manager.mkNumeralOfSort(value, SORT_REAL);
    const lowerExpr =
      inputLowerExpr !== -1 && lower !== undefined
        ? mkIte(true, inputLowerExpr, real(lower))
        : inputLowerExpr;
    const upperExpr =
      inputUpperExpr !== -1 && upper !== undefined
        ? mkIte(false, inputUpperExpr, real(upper))
        : inputUpperExpr;
    const two = Rational.of(2n);
    if (lowerExpr !== -1 && upperExpr !== -1)
      return manager.mkApp(
        OP_DIV,
        [manager.mkApp(OP_ADD, [lowerExpr, upperExpr], SORT_REAL), real(two)],
        SORT_REAL,
      );
    if (lowerExpr !== -1) return manager.mkApp(OP_ADD, [lowerExpr, real(Rational.one)], SORT_REAL);
    if (upperExpr !== -1) return manager.mkApp(OP_SUB, [upperExpr, real(Rational.one)], SORT_REAL);
    if (lower !== undefined && upper !== undefined) return real(upper.add(lower).div(two));
    if (lower !== undefined) return real(lower.add(Rational.one));
    if (upper !== undefined) return real(upper.sub(Rational.one));
    return real(Rational.zero);
  }
}

export const fm = (manager: AstManager, goal: Goal, options: FmOptions) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("fm does not support proof production");
  const eliminator = new Fm(manager, goal, options);
  const isConsistent = eliminator.run();
  eliminator.release();
  if (!isConsistent) return;
  const converter = new FmModelConverter(manager, eliminator.converter);
  goal.addModelConversion((model) => converter.convert(model));
};
