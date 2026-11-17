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
import { type CellInterval, Levelwise, releaseIntervals, TodoSet } from "./levelwise";
import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
  PolynomialRef,
  PolynomialRefVector,
} from "./polynomial";
import { type IneqAtom, type IneqKind, type RootKind, isIneqAtom } from "./types";

interface ExplainContext {
  atoms: AtomTable;
  sample: (Anum | undefined)[];
  getValue: (literal: number) => number;
  var2eq: (IneqAtom | null)[];
  getNumVars: () => number;
  reorder: (permutation: readonly number[]) => void;
  restoreOrder: () => void;
}

class AddAllCoeffsRestart {}

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
  private ps: PolynomialRefVector;
  private factors: PolynomialRefVector;
  private factorsSave: PolynomialRefVector;
  private todo: TodoSet;
  private core: ScopedLiterals;
  private lowerStagePolys: PolynomialRefVector;
  private lastLwsInputPolys: PolynomialRefVector;
  private isAddAllCoeffs = false;

  isFullDimensional = false;
  isFactoring = true;

  constructor(
    private pm: PolynomialManager,
    private am: AlgebraicManager,
    private cache: PolynomialCache,
    private context: ExplainContext,
  ) {
    this.ps = new PolynomialRefVector(pm);
    this.factors = new PolynomialRefVector(pm);
    this.factorsSave = new PolynomialRefVector(pm);
    this.todo = new TodoSet(cache, true);
    this.core = new ScopedLiterals(context.atoms);
    this.lowerStagePolys = new PolynomialRefVector(pm);
    this.lastLwsInputPolys = new PolynomialRefVector(pm);
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

  reset() {
    this.resetResult();
    this.core.reset();
  }

  private collectPolys(literals: readonly number[], ps: PolynomialRefVector) {
    ps.reset();
    for (const literal of literals) {
      const atom = this.getAtom(literal);
      if (isIneqAtom(atom)) for (const polynomial of atom.polynomials) ps.push(polynomial);
      else ps.push(atom.polynomial);
    }
  }

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

  private addZeroAssumption(polynomial: Polynomial) {
    const q = new PolynomialRef(this.pm);
    try {
      this.pm.squareFree(polynomial, q);
      if (this.pm.isConst(q.get())) return;
      const variable = this.pm.maxVar(q.get());
      const index = this.findSectionRoot(q.get(), variable);
      if (index !== null) this.addRootLiteral("ROOT_EQ", variable, index, q.get());
    } finally {
      q.reset();
    }
  }

  private addAssumption(kind: IneqKind, polynomial: Polynomial, isNeg = false) {
    const boolVar = this.context.atoms.mkIneqAtom(kind, [polynomial], [false]);
    this.addLiteral(2 * boolVar + (isNeg ? 0 : 1));
  }

  private elimVanishing(p: PolynomialRef) {
    const pm = this.pm;
    let variable = pm.maxVar(p.get());
    let degree = pm.degree(p.get(), variable);
    const lc = new PolynomialRef(pm);
    const reduct = new PolynomialRef(pm);
    try {
      while (true) {
        if (pm.isConst(p.get())) return;
        if (degree === 0) {
          variable = pm.maxVar(p.get());
          degree = pm.degree(p.get(), variable);
        }
        if (pm.isNonzeroConstCoeff(p.get(), variable, degree)) return;
        lc.set(pm.coeffWithReduct(p.get(), variable, degree, reduct));
        this.insertFreshFactorsInTodo(lc);
        if (!pm.isZero(lc.get()) && this.getSign(lc.get()) !== 0) return;
        if (degree === 0) {
          p.set(pm.zero);
          if (this.isAddAllCoeffs) {
            this.addZeroAssumption(lc.get());
            return;
          }
          this.isAddAllCoeffs = true;
          throw new AddAllCoeffsRestart();
        }
        this.addZeroAssumption(lc.get());
        degree--;
        p.copy(reduct);
      }
    } finally {
      reduct.reset();
      lc.reset();
    }
  }

  private elimVanishingAll(ps: PolynomialRefVector) {
    const size = ps.size;
    const p = new PolynomialRef(this.pm);
    try {
      let kept = 0;
      for (let index = 0; index < size; index++) {
        p.set(ps.get(index));
        this.elimVanishing(p);
        if (!this.pm.isConst(p.get())) ps.set(kept++, p.get());
      }
      ps.shrink(kept);
    } finally {
      p.reset();
    }
  }

  private insertFreshFactorsInTodo(p: PolynomialRef) {
    if (this.pm.isConst(p.get())) return;
    this.elimVanishing(p);
    if (this.pm.isConst(p.get())) return;
    if (!this.isFactoring) {
      this.todo.insert(p.get());
      return;
    }
    const saved = this.factorsSave.size;
    this.factorsSave.append(this.factors);
    const f = new PolynomialRef(this.pm);
    try {
      this.cache.factor(p.get(), this.factors);
      for (let index = 0; index < this.factors.size; index++) {
        f.set(this.factors.get(index));
        this.elimVanishing(f);
        if (!this.pm.isConst(f.get())) this.todo.insert(f.get());
      }
    } finally {
      f.reset();
      this.factors.reset();
      for (let index = saved; index < this.factorsSave.size; index++)
        this.factors.push(this.factorsSave.get(index));
      this.factorsSave.shrink(saved);
    }
  }

  private normalizeLiteral(literal: number, max: number) {
    if (literal >> 1 === TRUE_BOOL_VAR) return literal;
    const atom = this.getAtom(literal);
    if (!isIneqAtom(atom)) return literal;
    const pm = this.pm;
    const isNeg = (literal & 1) === 1;
    const ps = new PolynomialRefVector(pm);
    const isEven: boolean[] = [];
    const p = new PolynomialRef(pm);
    try {
      let atomSign = 1;
      let isNormalized = false;
      for (let index = 0; index < atom.polynomials.length; index++) {
        p.set(atom.polynomials[index]);
        if (pm.maxVar(p.get()) === max) this.elimVanishing(p);
        if (pm.isConst(p.get()) || pm.maxVar(p.get()) < max) {
          const sign = this.getSign(p.get());
          if (!pm.isConst(p.get())) {
            this.lowerStagePolys.push(p.get());
            if (sign === 0) this.addAssumption("EQ", p.get());
            else if (atom.isEven[index]) this.addAssumption("EQ", p.get(), true);
            else this.addAssumption(getKindForSign(sign), p.get());
          }
          if (sign === 0) return (atom.kind === "EQ") !== isNeg ? TRUE_LITERAL : FALSE_LITERAL;
          if (sign < 0 && !atom.isEven[index]) atomSign = -atomSign;
          isNormalized = true;
          continue;
        }
        if (p.get() !== atom.polynomials[index]) isNormalized = true;
        isEven.push(atom.isEven[index]);
        ps.push(p.get());
      }
      if (ps.size === 0) {
        const isTrue =
          atom.kind === "EQ" ? false : atom.kind === "LT" ? atomSign < 0 : atomSign > 0;
        return isTrue !== isNeg ? TRUE_LITERAL : FALSE_LITERAL;
      }
      if (!isNormalized) return literal;
      const kind = atomSign < 0 ? flipKind(atom.kind) : atom.kind;
      return this.context.atoms.mkIneqLiteral(kind, ps.items, isEven) ^ (isNeg ? 1 : 0);
    } finally {
      p.reset();
      ps.reset();
    }
  }

  private normalizeCore(core: ScopedLiterals, max: number) {
    const size = core.size;
    let kept = 0;
    for (let index = 0; index < size; index++) {
      const normalized = this.normalizeLiteral(core.literals[index], max);
      if (normalized === TRUE_LITERAL) continue;
      if (normalized === FALSE_LITERAL) {
        core.reset();
        return;
      }
      core.set(kept++, normalized);
    }
    core.shrink(kept);
  }

  private simplifyLiteral(literal: number, info: EqInfo, max: number, newLiteral: ScopedLiteral) {
    const atom = this.getAtom(literal);
    if (!isIneqAtom(atom) || (atom.polynomials.length === 1 && atom.polynomials[0] === info.eq)) {
      newLiteral.set(literal);
      return;
    }
    const pm = this.pm;
    const isNeg = (literal & 1) === 1;
    let atomSign = 1;
    let isModified = false;
    const newFactors = new PolynomialRefVector(pm);
    const newFactorsEven: boolean[] = [];
    const newFactor = new PolynomialRef(pm);
    const addLcCondition = (steps: number, isFactorEven: boolean) => {
      if (info.isLcConst) return;
      if (steps % 2 === 0 || isFactorEven || atom.kind === "EQ") addLcDiseq(info);
      else addLcIneq(info);
    };
    try {
      for (let index = 0; index < atom.polynomials.length; index++) {
        const factor = atom.polynomials[index];
        const isFactorEven = atom.isEven[index];
        if (pm.degree(factor, info.variable) < info.degree) {
          newFactors.push(factor);
          newFactorsEven.push(isFactorEven);
          continue;
        }
        isModified = true;
        const steps = pm.pseudoRemainder(factor, info.eq, info.variable, newFactor);
        if (steps % 2 === 1 && !isFactorEven && info.lcSign < 0) atomSign = -atomSign;
        if (pm.isConst(newFactor.get())) {
          const sign = this.getSign(newFactor.get());
          if (sign === 0) {
            newLiteral.set((atom.kind === "EQ") !== isNeg ? TRUE_LITERAL : FALSE_LITERAL);
            if (!info.isLcConst) addLcDiseq(info);
            return;
          }
          addLcCondition(steps, isFactorEven);
          if (sign < 0 && !isFactorEven) atomSign = -atomSign;
          continue;
        }
        newFactors.push(newFactor.get());
        newFactorsEven.push(isFactorEven);
        addLcCondition(steps, isFactorEven);
      }
      if (!isModified) {
        newLiteral.set(literal);
        return;
      }
      const kind = atomSign < 0 ? flipKind(atom.kind) : atom.kind;
      newLiteral.set(
        this.context.atoms.mkIneqLiteral(kind, newFactors.items, newFactorsEven) ^ (isNeg ? 1 : 0),
      );
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
    } finally {
      newFactor.reset();
      newFactors.reset();
    }
  }

  private simplifyWithEq(core: ScopedLiterals, eq: Polynomial, max: number) {
    const variable = this.pm.maxVar(eq);
    const degree = this.pm.degree(eq, variable);
    const lcEq = new PolynomialRef(this.pm);
    const newLiteral = new ScopedLiteral(this.context.atoms);
    try {
      lcEq.set(this.pm.coeff(eq, variable, degree));
      const info = {
        eq,
        variable,
        degree,
        lc: lcEq.get(),
        lcSign: this.getSign(lcEq.get()),
        isLcConst: this.pm.isConst(lcEq.get()),
        isLcAdded: false,
        isLcIneqAdded: false,
      };
      const size = core.size;
      let isModified = false;
      let kept = 0;
      for (let index = 0; index < size; index++) {
        const literal = core.literals[index];
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
      lcEq.reset();
    }
  }

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

  private selectLowerStageEq(core: ScopedLiterals, max: number) {
    for (const literal of core.literals) {
      const atom = this.getAtom(literal);
      if (!isIneqAtom(atom)) continue;
      for (const factor of atom.polynomials) {
        for (const variable of this.pm.getVars(factor)) {
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

  private addRootLiteral(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    const pr = new PolynomialRef(this.pm);
    pr.set(polynomial);
    try {
      if (
        this.mkLinearRoot(kind, variable, polynomial) ||
        this.mkQuadraticRoot(kind, variable, index, polynomial)
      )
        return;
      const boolVar = this.context.atoms.mkRootAtom(kind, variable, index, polynomial);
      this.addLiteral(2 * boolVar + 1);
    } finally {
      pr.reset();
    }
  }

  private mkLinearRoot(kind: RootKind, variable: number, polynomial: Polynomial) {
    if (this.pm.degree(polynomial, variable) !== 1) return false;
    const coeff = this.pm.getConstCoeff(polynomial, variable, 1);
    if (coeff === null) return false;
    this.addLinearRoot(kind, polynomial, coeff < 0n);
    return true;
  }

  private mkPlinearRoot(kind: RootKind, variable: number, polynomial: Polynomial) {
    if (this.pm.degree(polynomial, variable) !== 1) return false;
    const c = new PolynomialRef(this.pm);
    try {
      c.set(this.pm.coeff(polynomial, variable, 1));
      const sign = this.getSign(c.get());
      if (sign === 0) return false;
      this.ensureSign(c);
      this.addLinearRoot(kind, polynomial, sign < 0);
      return true;
    } finally {
      c.reset();
    }
  }

  private mkQuadraticRoot(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    const pm = this.pm;
    if (pm.degree(polynomial, variable) !== 2) return false;
    if (index !== 1 && index !== 2) return false;
    const a = new PolynomialRef(pm);
    const b = new PolynomialRef(pm);
    const c = new PolynomialRef(pm);
    const q = new PolynomialRef(pm);
    const pDiff = new PolynomialRef(pm);
    const yy = new PolynomialRef(pm);
    const pr = new PolynomialRef(pm);
    const first = new PolynomialRef(pm);
    const second = new PolynomialRef(pm);
    const third = new PolynomialRef(pm);
    try {
      a.set(pm.coeff(polynomial, variable, 2));
      b.set(pm.coeff(polynomial, variable, 1));
      c.set(pm.coeff(polynomial, variable, 0));
      first.set(pm.mul(b.get(), b.get()));
      second.set(pm.mulConst(4n, a.get()));
      third.set(pm.mul(second.get(), c.get()));
      q.set(pm.sub(first.get(), third.get()));
      third.reset();
      second.reset();
      first.reset();
      yy.set(pm.mkVar(variable));
      first.set(pm.mulConst(2n, a.get()));
      second.set(pm.mul(first.get(), yy.get()));
      pDiff.set(pm.add(second.get(), b.get()));
      second.reset();
      first.reset();
      pDiff.set(pm.normalize(pDiff.get()));
      const discriminantSign = this.ensureSignQuad(q);
      if (discriminantSign < 0) return false;
      if (this.ensureSignQuad(a) === 0) {
        first.set(pm.mul(b.get(), yy.get()));
        q.set(pm.add(first.get(), c.get()));
        first.reset();
        return this.mkPlinearRoot(kind, variable, q.get());
      }
      this.ensureSign(pDiff);
      if (discriminantSign > 0) {
        pr.set(polynomial);
        this.ensureSign(pr);
      }
      return true;
    } finally {
      third.reset();
      second.reset();
      first.reset();
      pr.reset();
      yy.reset();
      pDiff.reset();
      q.reset();
      c.reset();
      b.reset();
      a.reset();
    }
  }

  private ensureSign(p: PolynomialRef) {
    if (this.pm.isConst(p.get())) return;
    this.addAssumption(getKindForSign(this.getSign(p.get())), p.get());
    this.insertFreshFactorsInTodo(p);
  }

  private ensureSignQuad(p: PolynomialRef) {
    const sign = this.getSign(p.get());
    if (!this.pm.isConst(p.get())) {
      this.addAssumption(getKindForSign(sign), p.get());
      this.insertFreshFactorsInTodo(p);
    }
    return sign;
  }

  private addLinearRoot(kind: RootKind, polynomial: Polynomial, isNegated: boolean) {
    const pPrime = new PolynomialRef(this.pm);
    pPrime.set(polynomial);
    if (isNegated) pPrime.set(this.pm.neg(pPrime.get()));
    const ineq = ROOT_TO_INEQ[kind];
    this.addAssumption(ineq.kind, pPrime.get(), ineq.isNeg);
    pPrime.reset();
  }

  private levelwiseSingleCell(ps: PolynomialRefVector, maxVar: number, isLinear: boolean) {
    this.lastLwsInputPolys.reset();
    for (let index = 0; index < ps.size; index++) this.lastLwsInputPolys.push(ps.get(index));
    const levelwise = new Levelwise(
      this.pm,
      this.am,
      this.cache,
      ps,
      maxVar,
      this.context.sample,
      isLinear,
    );
    let cell: CellInterval[] = [];
    try {
      cell = levelwise.singleCell();
      const isFull = this.isFullDimensional;
      for (const interval of cell) {
        if (interval.isSection) {
          const lower = interval.lower.get();
          this.addRootLiteral("ROOT_EQ", this.pm.maxVar(lower), interval.lowerIndex, lower);
          continue;
        }
        const lower = interval.lower.getOrNull();
        const upper = interval.upper.getOrNull();
        if (lower !== null)
          this.addRootLiteral(
            isFull ? "ROOT_GE" : "ROOT_GT",
            this.pm.maxVar(lower),
            interval.lowerIndex,
            lower,
          );
        if (upper !== null)
          this.addRootLiteral(
            isFull ? "ROOT_LE" : "ROOT_LT",
            this.pm.maxVar(upper),
            interval.upperIndex,
            upper,
          );
      }
    } finally {
      releaseIntervals(cell);
      levelwise.release();
    }
  }

  private project(ps: PolynomialRefVector, maxVar: number) {
    if (ps.size === 0) return;
    this.todo.reset();
    const p = new PolynomialRef(this.pm);
    try {
      for (let index = 0; index < ps.size; index++) {
        p.set(ps.get(index));
        this.insertFreshFactorsInTodo(p);
        p.reset();
      }
    } finally {
      p.reset();
    }
    ps.reset();
    for (const polynomial of this.todo.set.items) ps.push(polynomial);
    this.levelwiseSingleCell(ps, maxVar, false);
  }

  private main(literals: readonly number[]) {
    if (literals.length === 0) return;
    this.collectPolys(literals, this.ps);
    for (let index = 0; index < this.lowerStagePolys.size; index++)
      this.ps.push(this.lowerStagePolys.get(index));
    const maxVar = this.pm.getMaxVarOfPolys(this.ps.items);
    this.elimVanishingAll(this.ps);
    this.project(this.ps, maxVar);
  }

  private process(literals: readonly number[]) {
    this.lowerStagePolys.reset();
    const core = this.core;
    core.reset();
    for (const literal of literals) core.push(literal);
    const max = this.context.atoms.getMaxVarOfLiterals(literals);
    this.normalizeCore(core, max);
    this.simplifyCore(core, max);
    this.main(core.literals);
    core.reset();
  }

  computeConflictExplanation(literals: readonly number[], result: ScopedLiterals) {
    if (
      this.context.atoms.getMaxVarOfLiterals(literals) === 0 &&
      this.context.sample[0] === undefined
    ) {
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

  projectVariable(variable: number, literals: readonly number[], result: ScopedLiterals) {
    const base = result.size;
    while (true) {
      let isReordered = false;
      this.result = result;
      try {
        const kept: number[] = [];
        for (const literal of literals) {
          const atom = this.context.atoms.getAtom(literal);
          const polynomials =
            atom === null ? [] : isIneqAtom(atom) ? atom.polynomials : [atom.polynomial];
          const isContaining =
            (atom !== null && !isIneqAtom(atom) && atom.maxVar === variable) ||
            polynomials.some((polynomial) => this.pm.getVars(polynomial).includes(variable));
          if (isContaining) kept.push(literal);
          else this.addLiteral(literal ^ 1);
        }
        this.collectPolys(kept, this.ps);
        if (this.ps.size > 0) {
          const maxVar = this.pm.getMaxVarOfPolys(this.ps.items);
          if (maxVar !== variable) {
            const renaming = Array.from({ length: this.context.getNumVars() }, (_value, index) =>
              index === variable ? maxVar : index === maxVar ? variable : index,
            );
            this.context.reorder(renaming);
            isReordered = true;
          }
          this.elimVanishingAll(this.ps);
          this.project(this.ps, maxVar);
          this.resetResult();
          if (isReordered) this.context.restoreOrder();
        }
        break;
      } catch (error) {
        if (!(error instanceof AddAllCoeffsRestart)) throw error;
        if (isReordered) this.context.restoreOrder();
        result.shrink(base);
      } finally {
        this.resetResult();
      }
    }
    for (let index = 0; index < result.size; index++) result.set(index, result.literals[index] ^ 1);
  }

  computeLinearExplanation(literals: readonly number[], result: ScopedLiterals) {
    this.result = result;
    try {
      this.lowerStagePolys.reset();
      this.collectPolys(literals, this.ps);
      if (this.ps.size === 0) return;
      this.levelwiseSingleCell(this.ps, this.pm.getMaxVarOfPolys(this.ps.items) + 1, true);
    } finally {
      this.resetResult();
    }
  }
}
