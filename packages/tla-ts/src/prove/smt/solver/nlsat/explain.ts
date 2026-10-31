// Ported from Z3 (src/nlsat/nlsat_explain.cpp), MIT license, see z3-license.txt. Explains a set of
// literals that is infeasible at the sample: the literals of a lemma that exclude a cell around
// the sample in which the set stays infeasible. Only Z3's default nlsat parameters are ported:
// simplify_conflicts and factor on, minimize_conflicts, add_all_coeffs and zero_disc off, and lws
// on. So the cell always comes from the levelwise construction, and Z3's fallback projection
// (project with cac_add_cell_lits, add_lcs and the psc_* helpers) is not ported.
import type { AlgebraicManager, Anum } from "./algebraic";
import {
  type AtomTable,
  FALSE_LITERAL,
  flipKind,
  ScopedLiteral,
  ScopedLiterals,
  TRUE_BOOL_VAR,
  TRUE_LITERAL,
} from "./atoms";
import { getSingleCell, TodoSet } from "./levelwise";
import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
} from "./polynomial";
import { type IneqAtom, type IneqKind, type RootKind, isIneqAtom } from "./types";

// The solver state an explanation reads.
export interface ExplainContext {
  atoms: AtomTable;
  // sample(): the solver's assignment, refined in place.
  sample: (Anum | undefined)[];
  // value(l): l_true, l_false or l_undef, as 1, -1 and 0.
  getValue: (literal: number) => number;
  // m_var2eq: the equation of least degree assigned for each variable.
  var2eq: (IneqAtom | null)[];
}

// add_all_coeffs_restart: every coefficient of a polynomial vanished, so the explanation starts
// over adding all coefficients.
class AddAllCoeffsRestart {}

// eq_info: an equation used to rewrite the core, and what its leading coefficient must satisfy.
interface EqInfo {
  eq: Polynomial;
  variable: number;
  degree: number;
  lc: Polynomial;
  lcSign: number;
  isLcConst: boolean;
  isLcAdded: boolean;
  isLcIneqAdded: boolean;
}

const ROOT_TO_INEQ: Record<RootKind, { kind: IneqKind; isNeg: boolean }> = {
  ROOT_EQ: { kind: "EQ", isNeg: false },
  ROOT_LT: { kind: "LT", isNeg: false },
  ROOT_GT: { kind: "GT", isNeg: false },
  ROOT_LE: { kind: "GT", isNeg: true },
  ROOT_GE: { kind: "LT", isNeg: true },
};

const addLcIneq = (info: EqInfo) => {
  info.isLcAdded = true;
  info.isLcIneqAdded = true;
};

const addLcDiseq = (info: EqInfo) => {
  if (info.isLcAdded) return;
  info.isLcAdded = true;
  info.isLcIneqAdded = false;
};

const getKindForSign = (sign: number): IneqKind => (sign === 0 ? "EQ" : sign < 0 ? "LT" : "GT");

export class Explain {
  private result: ScopedLiterals | null = null;
  private added = new Set<number>();
  private todo: TodoSet;
  private lowerStagePolys: Polynomial[] = [];
  private core: ScopedLiterals;
  private isAddAllCoeffs = false;

  // m_full_dimensional: the solver sets it when every clause is full dimensional, and the cell
  // bounds are then closed.
  isFullDimensional = false;

  constructor(
    private pm: PolynomialManager,
    private am: AlgebraicManager,
    private cache: PolynomialCache,
    private context: ExplainContext,
  ) {
    this.todo = new TodoSet(pm, cache);
    this.core = new ScopedLiterals(context.atoms);
  }

  private getSign(polynomial: Polynomial) {
    return this.am.evalSignAt(this.pm, polynomial, this.context.sample);
  }

  private getAtom(literal: number) {
    return this.context.atoms.getAtom(literal)!;
  }

  private addLiteral(literal: number) {
    if (literal === FALSE_LITERAL || this.added.has(literal)) return;
    this.added.add(literal);
    this.result!.push(literal);
  }

  private resetResult() {
    this.added.clear();
    this.result = null;
  }

  private collectPolys(literals: readonly number[]) {
    return literals.flatMap((literal) => {
      const atom = this.getAtom(literal);
      return isIneqAtom(atom) ? atom.polynomials : [atom.polynomial];
    });
  }

  private getMaxVarOfPolys(polynomials: readonly Polynomial[]) {
    let result = NULL_VAR;
    for (const polynomial of polynomials) {
      const variable = this.pm.maxVar(polynomial);
      if (result === NULL_VAR || variable > result) result = variable;
    }
    return result;
  }

  private getMaxVarOfLiterals(literals: readonly number[]) {
    let result = NULL_VAR;
    for (const literal of literals) {
      const atom = this.context.atoms.getAtom(literal);
      if (atom !== null && (result === NULL_VAR || atom.maxVar > result)) result = atom.maxVar;
    }
    return result;
  }

  // add_assumption: the negation of p kind 0, or of p != 0 when isNeg, into the lemma.
  private addAssumption(kind: IneqKind, polynomial: Polynomial, isNeg = false) {
    const boolVar = this.context.atoms.mkIneqAtom(kind, [polynomial], [false]);
    this.addLiteral(2 * boolVar + (isNeg ? 0 : 1));
  }

  // find_cell_roots for one polynomial: the root equal to the sample of its maximal variable.
  private findSectionRoot(polynomial: Polynomial, variable: number) {
    const value = this.context.sample[variable]!;
    const values = this.context.sample.map((current, index) =>
      index === variable ? undefined : current,
    );
    const roots = this.am.isolateRoots(this.pm, polynomial, values);
    for (const [index, root] of roots.entries()) {
      const sign = this.am.compare(value, root);
      if (sign === 0) return index + 1;
      if (sign < 0) return null;
    }
    return null;
  }

  // add_zero_assumption: p vanishes at the sample, so the sample lies on a root of its square-free
  // part, which becomes a section literal.
  private addZeroAssumption(polynomial: Polynomial) {
    const squareFree = this.pm.squareFree(polynomial);
    if (this.pm.isConst(squareFree)) return;
    const variable = this.pm.maxVar(squareFree);
    const index = this.findSectionRoot(squareFree, variable);
    if (index !== null) this.addRootLiteral("ROOT_EQ", variable, index, squareFree);
  }

  // elim_vanishing: p without its leading coefficients that vanish at the sample, each of which
  // becomes an assumption. Zero when all do.
  private elimVanishing(polynomial: Polynomial) {
    let p = polynomial;
    let variable = this.pm.maxVar(p);
    let degree = this.pm.degree(p, variable);
    while (true) {
      if (this.pm.isConst(p)) return p;
      if (degree === 0) {
        variable = this.pm.maxVar(p);
        degree = this.pm.degree(p, variable);
      }
      if (this.pm.isNonzeroConstCoeff(p, variable, degree)) return p;
      // Z3 passes lc to insert_fresh_factors_in_todo by reference, so from here on lc is without
      // its own vanishing coefficients, which equals it given the assumptions that removed them.
      const lc = this.insertFreshFactorsInTodo(this.pm.coeff(p, variable, degree));
      const reduct = this.pm.reduct(p, variable, degree);
      if (!this.pm.isZero(lc) && this.getSign(lc) !== 0) return p;
      if (degree === 0) {
        if (this.isAddAllCoeffs) {
          this.addZeroAssumption(lc);
          return this.pm.zero;
        }
        this.isAddAllCoeffs = true;
        throw new AddAllCoeffsRestart();
      }
      this.addZeroAssumption(lc);
      degree--;
      p = reduct;
    }
  }

  private elimVanishingAll(polynomials: readonly Polynomial[]) {
    return polynomials
      .map((polynomial) => this.elimVanishing(polynomial))
      .filter((polynomial) => !this.pm.isConst(polynomial));
  }

  // insert_fresh_factors_in_todo: the factors of p, without their vanishing coefficients. Returns
  // p without its vanishing coefficients, which Z3 writes back to its argument.
  private insertFreshFactorsInTodo(polynomial: Polynomial) {
    if (this.pm.isConst(polynomial)) return polynomial;
    const p = this.elimVanishing(polynomial);
    if (this.pm.isConst(p)) return p;
    for (const factor of this.cache.factor(p)) {
      const reduced = this.elimVanishing(factor);
      if (!this.pm.isConst(reduced)) this.todo.insert(reduced);
    }
    return p;
  }

  // normalize: the literal without the vanishing coefficients of max and the factors of lower
  // stages, which become assumptions. True or false when nothing is left.
  private normalizeLiteral(literal: number, max: number) {
    if (literal >> 1 === TRUE_BOOL_VAR) return literal;
    const atom = this.getAtom(literal);
    if (!isIneqAtom(atom)) return literal;
    const isNeg = (literal & 1) === 1;
    const polynomials: Polynomial[] = [];
    const isEven: boolean[] = [];
    let atomSign = 1;
    let isNormalized = false;
    for (const [index, factor] of atom.polynomials.entries()) {
      const p = this.pm.maxVar(factor) === max ? this.elimVanishing(factor) : factor;
      if (this.pm.isConst(p) || this.pm.maxVar(p) < max) {
        const sign = this.getSign(p);
        if (!this.pm.isConst(p)) {
          this.lowerStagePolys.push(p);
          if (sign === 0) this.addAssumption("EQ", p);
          else if (atom.isEven[index]) this.addAssumption("EQ", p, true);
          else this.addAssumption(getKindForSign(sign), p);
        }
        if (sign === 0) return (atom.kind === "EQ") !== isNeg ? TRUE_LITERAL : FALSE_LITERAL;
        if (sign < 0 && !atom.isEven[index]) atomSign = -atomSign;
        isNormalized = true;
        continue;
      }
      if (p !== factor) isNormalized = true;
      isEven.push(atom.isEven[index]);
      polynomials.push(p);
    }
    if (polynomials.length === 0) {
      const isTrue = atom.kind === "EQ" ? false : atom.kind === "LT" ? atomSign < 0 : atomSign > 0;
      return isTrue !== isNeg ? TRUE_LITERAL : FALSE_LITERAL;
    }
    if (!isNormalized) return literal;
    const kind = atomSign < 0 ? flipKind(atom.kind) : atom.kind;
    return this.context.atoms.mkIneqLiteral(kind, polynomials, isEven) ^ (isNeg ? 1 : 0);
  }

  private normalizeCore(core: ScopedLiterals, max: number) {
    let kept = 0;
    for (const literal of core.literals) {
      const normalized = this.normalizeLiteral(literal, max);
      if (normalized === TRUE_LITERAL) continue;
      if (normalized === FALSE_LITERAL) {
        core.reset();
        return;
      }
      core.set(kept++, normalized);
    }
    core.shrink(kept);
  }

  // simplify(l, info, max, new_lit): rewrites the factors of degree at least the equation's by
  // their pseudo-remainders, recording the condition on the equation's leading coefficient.
  private simplifyLiteral(literal: number, info: EqInfo, max: number, newLiteral: ScopedLiteral) {
    const atom = this.getAtom(literal);
    if (!isIneqAtom(atom) || (atom.polynomials.length === 1 && atom.polynomials[0] === info.eq)) {
      newLiteral.set(literal);
      return;
    }
    const isNeg = (literal & 1) === 1;
    const factors: Polynomial[] = [];
    const isEven: boolean[] = [];
    let atomSign = 1;
    let isModified = false;
    const addLcCondition = (steps: number, isFactorEven: boolean) => {
      if (info.isLcConst) return;
      if (steps % 2 === 0 || isFactorEven || atom.kind === "EQ") addLcDiseq(info);
      else addLcIneq(info);
    };
    for (const [index, factor] of atom.polynomials.entries()) {
      const isFactorEven = atom.isEven[index];
      if (this.pm.degree(factor, info.variable) < info.degree) {
        factors.push(factor);
        isEven.push(isFactorEven);
        continue;
      }
      isModified = true;
      const division = this.pm.pseudoRemainder(factor, info.eq, info.variable);
      if (division.steps % 2 === 1 && !isFactorEven && info.lcSign < 0) atomSign = -atomSign;
      const remainder = division.remainder;
      if (!this.pm.isConst(remainder)) {
        factors.push(remainder);
        isEven.push(isFactorEven);
        addLcCondition(division.steps, isFactorEven);
        continue;
      }
      const sign = this.getSign(remainder);
      if (sign === 0) {
        newLiteral.set((atom.kind === "EQ") !== isNeg ? TRUE_LITERAL : FALSE_LITERAL);
        if (!info.isLcConst) addLcDiseq(info);
        return;
      }
      addLcCondition(division.steps, isFactorEven);
      if (sign < 0 && !isFactorEven) atomSign = -atomSign;
    }
    if (!isModified) {
      newLiteral.set(literal);
      return;
    }
    const kind = atomSign < 0 ? flipKind(atom.kind) : atom.kind;
    newLiteral.set(this.context.atoms.mkIneqLiteral(kind, factors, isEven) ^ (isNeg ? 1 : 0));
    // Z3's null_var is the largest unsigned, so true and false never count as lower stage.
    const maxVar = this.context.atoms.getMaxVar(newLiteral.literal);
    if (maxVar === NULL_VAR || maxVar >= max) {
      newLiteral.set(this.normalizeLiteral(newLiteral.literal, max));
      return;
    }
    if (this.context.getValue(newLiteral.literal) === 1) {
      newLiteral.set(literal);
      return;
    }
    this.addLiteral(newLiteral.literal);
    newLiteral.set(TRUE_LITERAL);
  }

  // simplify(C, eq, max): the core rewritten by eq. Like Z3's scoped_literal, newLiteral keeps a
  // reference until the next literal or the end, also when an elimination restarts.
  private simplifyWithEq(core: ScopedLiterals, eq: Polynomial, max: number) {
    const variable = this.pm.maxVar(eq);
    const degree = this.pm.degree(eq, variable);
    const lc = this.pm.coeff(eq, variable, degree);
    const info: EqInfo = {
      eq,
      variable,
      degree,
      lc,
      lcSign: this.getSign(lc),
      isLcConst: this.pm.isConst(lc),
      isLcAdded: false,
      isLcIneqAdded: false,
    };
    const newLiteral = new ScopedLiteral(this.context.atoms);
    try {
      let isModified = false;
      let kept = 0;
      for (const literal of core.literals) {
        newLiteral.set(TRUE_LITERAL);
        this.simplifyLiteral(literal, info, max, newLiteral);
        if (newLiteral.literal === literal) {
          core.set(kept++, literal);
          continue;
        }
        isModified = true;
        if (newLiteral.literal === TRUE_LITERAL) continue;
        if (newLiteral.literal === FALSE_LITERAL) {
          kept = 0;
          break;
        }
        core.set(kept++, newLiteral.literal);
      }
      core.shrink(kept);
      if (info.isLcAdded) {
        if (info.isLcIneqAdded) this.addAssumption(info.lcSign < 0 ? "LT" : "GT", info.lc);
        else this.addAssumption("EQ", info.lc, true);
      }
      return isModified;
    } finally {
      newLiteral.set(TRUE_LITERAL);
    }
  }

  // select_eq: the positive single-factor odd equation of least degree in max.
  private selectEq(core: ScopedLiterals, max: number) {
    let result: Polynomial | null = null;
    let minDegree = Infinity;
    for (const literal of core.literals) {
      if ((literal & 1) === 1) continue;
      const atom = this.getAtom(literal);
      if (!isIneqAtom(atom) || atom.kind !== "EQ" || atom.polynomials.length > 1 || atom.isEven[0])
        continue;
      const degree = this.pm.degree(atom.polynomials[0], max);
      if (degree < minDegree) {
        result = atom.polynomials[0];
        minDegree = degree;
        if (minDegree === 1) break;
      }
    }
    return result;
  }

  // select_lower_stage_eq: an assigned equation of a lower variable with a constant leading
  // coefficient that can rewrite a literal of the core.
  private selectLowerStageEq(core: ScopedLiterals, max: number) {
    for (const literal of core.literals) {
      const atom = this.getAtom(literal);
      if (!isIneqAtom(atom)) continue;
      for (const factor of atom.polynomials) {
        const variables = new Set(factor.ms.flatMap((monomial) => [...monomial.vars]));
        for (const variable of variables) {
          if (variable >= max) continue;
          const eq = this.context.var2eq[variable] ?? null;
          if (eq === null) continue;
          const eqPolynomial = eq.polynomials[0];
          const eqDegree = this.pm.degree(eqPolynomial, variable);
          if (!this.pm.isNonzeroConstCoeff(eqPolynomial, variable, eqDegree)) continue;
          if (this.pm.degree(factor, variable) >= eqDegree) return eq;
        }
      }
    }
    return null;
  }

  private simplifyCore(core: ScopedLiterals, max: number) {
    while (core.size > 0) {
      const eq = this.selectEq(core, max);
      if (eq === null || !this.simplifyWithEq(core, eq, max)) break;
    }
    while (core.size > 0) {
      const eq = this.selectLowerStageEq(core, max);
      if (eq === null) break;
      this.simplifyWithEq(core, eq.polynomials[0], max);
      this.addLiteral(2 * eq.boolVar + 1);
    }
  }

  // add_root_literal: the negation of y kind root[i](p), as an inequality when p is linear or
  // quadratic in y, else as a root atom.
  private addRootLiteral(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    if (this.mkLinearRoot(kind, variable, polynomial)) return;
    if (this.mkQuadraticRoot(kind, variable, index, polynomial)) return;
    const boolVar = this.context.atoms.mkRootAtom(kind, variable, index, polynomial);
    this.addLiteral(2 * boolVar + 1);
  }

  private mkLinearRoot(kind: RootKind, variable: number, polynomial: Polynomial) {
    const coeff = this.pm.getConstCoeff(polynomial, variable, 1);
    if (this.pm.degree(polynomial, variable) !== 1 || coeff === null) return false;
    this.addLinearRoot(kind, polynomial, coeff < 0n);
    return true;
  }

  private addLinearRoot(kind: RootKind, polynomial: Polynomial, isNegated: boolean) {
    const ineq = ROOT_TO_INEQ[kind];
    this.addAssumption(ineq.kind, isNegated ? this.pm.neg(polynomial) : polynomial, ineq.isNeg);
  }

  // mk_plinear_root: a root of p linear in y whose coefficient keeps its sign.
  private mkPlinearRoot(kind: RootKind, variable: number, polynomial: Polynomial) {
    if (this.pm.degree(polynomial, variable) !== 1) return false;
    const coeff = this.pm.coeff(polynomial, variable, 1);
    const sign = this.getSign(coeff);
    if (sign === 0) return false;
    this.ensureSign(coeff);
    this.addLinearRoot(kind, polynomial, sign < 0);
    return true;
  }

  // mk_quadratic_root: by Thom's lemma, the signs of the discriminant, the leading coefficient, the
  // derivative and p characterize the sample's position among the roots of a quadratic.
  private mkQuadraticRoot(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    if (this.pm.degree(polynomial, variable) !== 2 || (index !== 1 && index !== 2)) return false;
    const a = this.pm.coeff(polynomial, variable, 2);
    const b = this.pm.coeff(polynomial, variable, 1);
    const c = this.pm.coeff(polynomial, variable, 0);
    const discriminant = this.pm.sub(this.pm.mul(b, b), this.pm.mul(this.pm.mulConst(4n, a), c));
    const y = this.pm.mkVar(variable);
    const derivative = this.pm.normalize(this.pm.add(this.pm.mul(this.pm.mulConst(2n, a), y), b));
    if (this.ensureSignQuad(discriminant) < 0) return false;
    if (this.ensureSignQuad(a) === 0)
      return this.mkPlinearRoot(kind, variable, this.pm.add(this.pm.mul(b, y), c));
    this.ensureSign(derivative);
    if (this.getSign(discriminant) > 0) this.ensureSign(polynomial);
    return true;
  }

  private ensureSign(polynomial: Polynomial) {
    if (this.pm.isConst(polynomial)) return;
    this.addAssumption(getKindForSign(this.getSign(polynomial)), polynomial);
    this.insertFreshFactorsInTodo(polynomial);
  }

  private ensureSignQuad(polynomial: Polynomial) {
    const sign = this.getSign(polynomial);
    if (!this.pm.isConst(polynomial)) {
      this.addAssumption(getKindForSign(sign), polynomial);
      this.insertFreshFactorsInTodo(polynomial);
    }
    return sign;
  }

  // levelwise_single_cell: the literals that bound the cell.
  private addCellLiterals(polynomials: readonly Polynomial[], maxVar: number, isLinear: boolean) {
    const cell = getSingleCell(
      this.pm,
      this.am,
      this.cache,
      polynomials,
      maxVar,
      this.context.sample,
      isLinear,
    );
    const isFull = this.isFullDimensional;
    for (const interval of cell) {
      if (interval.isSection) {
        const lower = interval.lower!;
        this.addRootLiteral("ROOT_EQ", this.pm.maxVar(lower), interval.lowerIndex, lower);
        continue;
      }
      if (interval.lower !== null)
        this.addRootLiteral(
          isFull ? "ROOT_GE" : "ROOT_GT",
          this.pm.maxVar(interval.lower),
          interval.lowerIndex,
          interval.lower,
        );
      if (interval.upper !== null)
        this.addRootLiteral(
          isFull ? "ROOT_LE" : "ROOT_LT",
          this.pm.maxVar(interval.upper),
          interval.upperIndex,
          interval.upper,
        );
    }
  }

  // project: the factors of the polynomials, then the cell around the sample.
  private project(polynomials: readonly Polynomial[], maxVar: number) {
    if (polynomials.length === 0) return;
    this.todo.reset();
    for (const polynomial of polynomials) this.insertFreshFactorsInTodo(polynomial);
    this.addCellLiterals([...this.todo.polynomials], maxVar, false);
  }

  private explainCore(literals: readonly number[]) {
    if (literals.length === 0) return;
    const polynomials = [...this.collectPolys(literals), ...this.lowerStagePolys];
    const maxVar = this.getMaxVarOfPolys(polynomials);
    this.project(this.elimVanishingAll(polynomials), maxVar);
  }

  // process2: with simplify_conflicts, the core normalized and rewritten by its equations first.
  // As in Z3, a restart leaves the core holding its literals until the next attempt.
  private process(literals: readonly number[]) {
    this.lowerStagePolys = [];
    const core = this.core;
    core.reset();
    for (const literal of literals) core.push(literal);
    const max = this.getMaxVarOfLiterals(literals);
    this.normalizeCore(core, max);
    this.simplifyCore(core, max);
    this.explainCore(core.literals);
    core.reset();
  }

  // compute_conflict_explanation: the literals, appended to result, that with the negations of
  // literals make a valid lemma.
  computeConflictExplanation(literals: readonly number[], result: ScopedLiterals) {
    if (this.getMaxVarOfLiterals(literals) === 0 && this.context.sample[0] === undefined) {
      result.reset();
      return;
    }
    const savedAddAllCoeffs = this.isAddAllCoeffs;
    const base = result.size;
    try {
      while (true) {
        this.result = result;
        try {
          this.process(literals);
          return;
        } catch (error) {
          if (!(error instanceof AddAllCoeffsRestart)) throw error;
          result.shrink(base);
        } finally {
          this.resetResult();
        }
      }
    } finally {
      this.isAddAllCoeffs = savedAddAllCoeffs;
    }
  }

  // compute_linear_explanation: the literals of a linear cell around a sample of every variable.
  computeLinearExplanation(literals: readonly number[], result: ScopedLiterals) {
    this.result = result;
    this.lowerStagePolys = [];
    const polynomials = this.collectPolys(literals);
    try {
      if (polynomials.length > 0)
        this.addCellLiterals(polynomials, this.getMaxVarOfPolys(polynomials) + 1, true);
    } finally {
      this.resetResult();
    }
  }
}
