// Ported from Z3 (src/qe/lite/qe_lite_tactic.cpp), MIT license, see z3-license.txt. The fm of
// qe-lite: Fourier-Motzkin elimination of the integer variables of a quantifier that only occur in
// clauses with one linear inequality.
import {
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_GE,
  OP_LE,
  OP_MUL,
  OP_NOT,
  OP_OR,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { getGcd } from "./rational";
import { RefVector } from "./ref-vector";

// fm's parameters.
const FM_LIMIT = 5000000;
const FM_CUTOFF1 = 8;
const FM_CUTOFF2 = 256;
const FM_EXTRA = 0;

// A clause of Boolean literals and one linear inequality, a1*x1 + ... + an*xn <= c, or < c when
// strict. A literal is the index of a Boolean constant, negative when negated.
interface Constraint {
  lits: number[];
  xs: number[];
  as: bigint[];
  c: bigint;
  isStrict: boolean;
  isDead: boolean;
}

// fm: Fourier-Motzkin elimination of the integer variables that only occur in clauses with one
// linear inequality.
export class Fm {
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
        manager.limit.checkpoint();
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
      const coefficient = manager.args[expr][0];
      const variable = manager.args[expr][1];
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
    const lhs = manager.args[atom][0];
    const rhs = manager.args[atom][1];
    // Z3's fm also eliminates Real variables, whose rational coefficients the port does not keep.
    return manager.isInt(lhs) && manager.isNumeral(rhs) && this.isLinearPol(lhs);
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
    const as: bigint[] = [];
    let c = 0n;
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
      const lhs = manager.args[atom][0];
      const rhs = manager.args[atom][1];
      c = isFlipped ? -manager.getNumeralValue(rhs) : manager.getNumeralValue(rhs);
      const monomials = manager.getOp(lhs) === OP_ADD ? manager.args[lhs] : [lhs];
      let isAllInt = true;
      for (const monomial of monomials) {
        const isScaled = manager.getOp(monomial) === OP_MUL && manager.args[monomial].length === 2;
        const coefficient = isScaled ? manager.getNumeralValue(manager.args[monomial][0]) : 1n;
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
    let divisor = constraint.c < 0n ? -constraint.c : constraint.c;
    for (const coefficient of constraint.as) {
      if (divisor === 1n) break;
      divisor = getGcd(coefficient, divisor);
    }
    if (divisor === 1n) return;
    constraint.c /= divisor;
    constraint.as = constraint.as.map((coefficient) => coefficient / divisor);
  }

  private isFalseConstraint(constraint: Constraint) {
    return (
      constraint.lits.length === 0 &&
      constraint.xs.length === 0 &&
      (constraint.c < 0n || (constraint.isStrict && constraint.c === 0n))
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
      (constraint.as[index] < 0n ? this.lowers : this.uppers)[variable].push(constraint);
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
    this.subTodo[position] = this.subTodo[this.subTodo.length - 1];
    this.subTodo.pop();
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
      if (constraint.c > 0n || (!constraint.isStrict && constraint.c === 0n))
        return manager.trueExpr;
    } else {
      const monomials = constraint.xs.map((variable, index) => {
        const expr = this.var2expr.items[variable];
        const coefficient = constraint.as[index];
        return coefficient === 1n
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
      const isLower = constraint.as[index] < 0n;
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
      for (let index = 0; index < constraint.xs.length; index++) {
        const other = constraint.xs[index];
        if (!this.isInt[other]) return { isAllInt: false, isUnit };
        if (other === variable && constraint.as[index] !== 1n && constraint.as[index] !== -1n)
          isUnit = false;
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
    let c = lower.c * b + upper.c * a;
    let isStrict = lower.isStrict || upper.isStrict;
    const xs: number[] = [];
    const as: bigint[] = [];
    lower.xs.forEach((other, index) => {
      if (other === variable) return;
      this.var2pos[other] = xs.length;
      xs.push(other);
      as.push(lower.as[index] * b);
    });
    upper.xs.forEach((other, index) => {
      if (other === variable) return;
      const position = this.var2pos[other];
      if (position === -1) {
        xs.push(other);
        as.push(upper.as[index] * a);
      } else as[position] += upper.as[index] * a;
    });
    const kept = as.flatMap((coefficient, index) => (coefficient === 0n ? [] : [index]));
    const newXs = kept.map((index) => xs[index]);
    const newAs = kept.map((index) => as[index]);
    if (isStrict && newXs.every((other) => this.isInt[other])) {
      isStrict = false;
      c--;
    }
    for (const other of lower.xs) this.var2pos[other] = -1;
    if (newXs.length === 0 && (c > 0n || (!isStrict && c === 0n))) return undefined;
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
    if (lits.length === 0 && newXs.length === 0 && (c < 0n || (isStrict && c === 0n))) {
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
