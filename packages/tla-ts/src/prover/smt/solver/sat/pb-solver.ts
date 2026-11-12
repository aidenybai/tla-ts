// Ported from Z3 (src/sat/smt/pb_solver.h, src/sat/smt/pb_solver.cpp,
// src/sat/smt/pb_internalize.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../../errors";
import { type AstManager, OP_AT_LEAST_K, OP_AT_MOST_K, OP_PB_EQ, OP_PB_GE, OP_PB_LE } from "../ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { getPbCoeff, getPbK, hasUnitCoefficients } from "../pb-rewriter";
import { Rational } from "../rational";
import { NULL_LITERAL } from "./clause";
import { Card, type Constraint, type ConstraintHost, Pbc } from "./pb-constraint";
import {
  JUSTIFICATION_BINARY,
  JUSTIFICATION_CLAUSE,
  JUSTIFICATION_EXT,
  JUSTIFICATION_NONE,
  type SatExtension,
  type Solver,
} from "./solver";

const UINT_MAX = 4294967295;
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

export interface SatInternalizer {
  internalize(expr: number): number;
  getCached(expr: number): number;
  cache(expr: number, lit: number): void;
}

const getGcd = (first: number, second: number) => {
  let left = first;
  let right = second;
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};

// Literals with their weights, the parallel arrays of a svector<wliteral>.
interface WLits {
  coeffs: number[];
  lits: number[];
}

export class PbSolver implements SatExtension, ConstraintHost {
  private readonly table = new Map<number, Constraint>();
  private nextIndex = 0;
  private constraints: Constraint[] = [];
  private learned: Constraint[] = [];
  private constraintToReinit: Constraint[] = [];
  private constraintToReinitLim: number[] = [];
  private constraintToReinitLastSize = 0;
  private numMarks = 0;
  private conflictLvl = 0;
  private coeffs: number[] = [];
  private activeVars: number[] = [];
  private bound = 0;
  private readonly activeVarSet = new Set<number>();
  private numPropagationsSincePop = 0;
  private pbUndef: number[] = [];
  private aMax = 0;
  private isOverflow = false;
  private cnstrUseList: Constraint[][] = [];
  private clauseUseCounts = new Int32Array(0);
  private clauseUseLists: number[][] = [];
  private isSimplifyChange = false;
  private isClauseRemoved = false;
  private isConstraintRemoved = false;
  private roots: number[] = [];
  private rootVars: boolean[] = [];
  private weights: number[] = [];

  constructor(
    private readonly manager: AstManager,
    private readonly si: SatInternalizer,
    private readonly solver: Solver,
  ) {}

  value(lit: number) {
    return this.solver.value(lit);
  }

  lvl(lit: number) {
    return this.solver.lvl(lit);
  }

  getWlist(lit: number) {
    return this.solver.getWlist(lit);
  }

  private getConstraint(index: number) {
    return this.table.get(index) as Constraint;
  }

  private isInconsistent() {
    return this.solver.isInconsistent;
  }

  setConflictBy(constraint: Constraint, lit: number) {
    const solver = this.solver;
    solver.setConflict(solver.scopeLvl, JUSTIFICATION_EXT, constraint.index, lit ^ 1);
  }

  assignBy(constraint: Constraint, lit: number) {
    if (this.isInconsistent()) return;
    const value = this.value(lit);
    if (value === L_TRUE) return;
    if (value === L_FALSE) {
      this.setConflictBy(constraint, lit);
      return;
    }
    this.numPropagationsSincePop++;
    const solver = this.solver;
    solver.assign(lit, solver.scopeLvl, JUSTIFICATION_EXT, constraint.index);
  }

  private mkClause(lits: number[], isLearned: boolean) {
    this.solver.mkClause(lits, isLearned);
  }

  private simplifyConstraint(constraint: Constraint) {
    const solver = this.solver;
    if (constraint.lit !== NULL_LITERAL && this.value(constraint.lit) === L_FALSE) return;
    if (constraint.lit !== NULL_LITERAL && this.value(constraint.lit) === L_TRUE) {
      constraint.nullifyTrackingLiteral(this);
      this.initWatch(constraint);
    }
    let trueVal = 0;
    let slack = 0;
    let numFalse = 0;
    for (let index = 0; index < constraint.size; index++) {
      const lit = constraint.lits[index];
      if (solver.wasEliminated(lit >> 1)) {
        this.removeConstraint(constraint);
        return;
      }
      const value = this.value(lit);
      if (value === L_TRUE) trueVal += constraint.getCoeff(index);
      else if (value === L_FALSE) numFalse++;
      else slack += constraint.getCoeff(index);
    }
    if (constraint.k === 1 && constraint.lit === NULL_LITERAL) {
      this.mkClause([...constraint.lits], constraint.isLearned);
      this.removeConstraint(constraint);
    } else if (trueVal === 0 && numFalse === 0) {
      if (constraint.lit === NULL_LITERAL || this.value(constraint.lit) === L_TRUE)
        this.initWatch(constraint);
    } else if (trueVal >= constraint.k) {
      if (constraint.lit !== NULL_LITERAL) solver.assignScoped(constraint.lit);
      else this.removeConstraint(constraint);
    } else if (slack + trueVal < constraint.k) {
      if (constraint.lit !== NULL_LITERAL) solver.assignScoped(constraint.lit ^ 1);
      else solver.setConflict();
    } else if (slack + trueVal === constraint.k) {
      this.assertUnconstrained(constraint.lit, [...constraint.lits]);
      this.removeConstraint(constraint);
    } else {
      constraint.clearWatch(this);
      let next = 0;
      for (let index = 0; index < constraint.size; index++) {
        if (this.value(constraint.lits[index]) !== L_UNDEF) continue;
        if (index !== next) constraint.swap(index, next);
        next++;
      }
      const k = constraint.k - trueVal;
      if (k === 1 && constraint.lit === NULL_LITERAL) {
        this.mkClause(constraint.lits.slice(0, next), constraint.isLearned);
        this.removeConstraint(constraint);
        return;
      }
      constraint.setSize(next);
      constraint.setK(k);
      if (constraint.lit === NULL_LITERAL || this.value(constraint.lit) === L_TRUE)
        this.initWatch(constraint);
      this.isSimplifyChange = true;
    }
  }

  // x <=> a*x + B*y >= k splits into k*~x + a*x + B*y >= k and its negation.
  private splitRoot(constraint: Constraint) {
    const weights = this.weights;
    const numLits = 2 * this.solver.numVars();
    while (weights.length < numLits) weights.push(0);
    let k = constraint.k;
    const root = constraint.lit;
    weights[root ^ 1] = k;
    for (let index = 0; index < constraint.size; index++)
      weights[constraint.lits[index]] += constraint.getCoeff(index);
    const lits = [...constraint.lits, root ^ 1];
    for (const lit of lits) {
      const w1 = weights[lit];
      const w2 = weights[lit ^ 1];
      if (w1 < w2) continue;
      if (w2 >= k) {
        for (const other of lits) weights[other] = 0;
        return;
      }
      k -= w2;
      weights[lit ^ 1] = 0;
      weights[lit] = w1 - w2;
    }
    const wlits: WLits = { coeffs: [], lits: [] };
    for (const lit of lits) {
      const weight = weights[lit];
      if (weight !== 0) {
        wlits.coeffs.push(weight);
        wlits.lits.push(lit);
      }
      weights[lit] = 0;
    }
    this.addPbGe(NULL_LITERAL, wlits, k, false);
  }

  private addIndex(constraint: Pbc, index: number, lit: number) {
    if (this.value(lit) !== L_UNDEF) return;
    this.pbUndef.push(index);
    if (constraint.coeffs[index] > this.aMax) this.aMax = constraint.coeffs[index];
  }

  private addAssignPb(constraint: Pbc, alit: number) {
    const lits = constraint.lits;
    const coeffs = constraint.coeffs;
    const size = constraint.size;
    const bound = constraint.k;
    let numWatch = constraint.numWatch;
    let slack = constraint.slack;
    let index = 0;
    this.aMax = 0;
    this.pbUndef = [];
    for (; index < numWatch; index++) {
      if (lits[index] === alit) break;
      this.addIndex(constraint, index, lits[index]);
    }
    if (index === numWatch || numWatch === 0) return L_UNDEF;
    for (let index1 = index + 1; this.aMax === 0 && index1 < numWatch; index1++)
      this.addIndex(constraint, index1, lits[index1]);
    const val = coeffs[index];
    slack -= val;
    for (let position = numWatch; position < size && slack < bound + this.aMax; position++) {
      const lit = lits[position];
      if (this.value(lit) === L_FALSE) continue;
      slack += coeffs[position];
      constraint.watchLiteral(this, lit);
      constraint.swap(numWatch, position);
      this.addIndex(constraint, numWatch, lit);
      numWatch++;
    }
    if (slack < bound) {
      constraint.slack = slack + val;
      constraint.numWatch = numWatch;
      this.setConflictBy(constraint, alit);
      return L_FALSE;
    }
    numWatch--;
    constraint.slack = slack;
    constraint.numWatch = numWatch;
    constraint.swap(numWatch, index);
    if (slack < bound + this.aMax)
      for (const undef of this.pbUndef) {
        const position = undef === numWatch ? index : undef;
        if (slack < bound + coeffs[position]) this.assignBy(constraint, lits[position]);
      }
    return L_UNDEF;
  }

  private normalize(wlits: WLits, k: number) {
    const weights = this.weights;
    const numLits = 2 * this.solver.numVars();
    while (weights.length < numLits) weights.push(0);
    const size = wlits.lits.length;
    for (let index = 0; index < size; index++) weights[wlits.lits[index]] += wlits.coeffs[index];
    let bound = k;
    let next = 0;
    for (let index = 0; index < size; index++) {
      const lit = wlits.lits[index];
      let w1 = weights[lit];
      const w2 = weights[lit ^ 1];
      if (w1 === 0 || w1 < w2) continue;
      if (bound <= w2) {
        bound = 0;
        break;
      }
      bound -= w2;
      w1 -= w2;
      weights[lit] = 0;
      weights[lit ^ 1] = 0;
      if (w1 === 0) continue;
      wlits.coeffs[next] = w1;
      wlits.lits[next] = lit;
      next++;
    }
    for (let index = 0; index < size; index++) {
      const lit = wlits.lits[index];
      weights[lit] = 0;
      weights[lit ^ 1] = 0;
    }
    return { size: next, k: bound };
  }

  private recompilePb(constraint: Pbc) {
    const wlits = { coeffs: constraint.coeffs, lits: constraint.lits };
    const normalized = this.normalize(wlits, constraint.k);
    constraint.setSize(normalized.size);
    const k = normalized.k;
    const isAllUnits = constraint.coeffs.every((coeff) => coeff === 1);
    if (k === 0) {
      if (constraint.lit !== NULL_LITERAL) this.solver.assignScoped(constraint.lit);
      this.removeConstraint(constraint);
      return;
    }
    if (k === 1 && constraint.lit === NULL_LITERAL) {
      this.mkClause([...constraint.lits], constraint.isLearned);
      this.removeConstraint(constraint);
      return;
    }
    if (isAllUnits) {
      this.addAtLeast(constraint.lit, [...constraint.lits], k, constraint.isLearned);
      this.removeConstraint(constraint);
      return;
    }
    constraint.updateMaxSum();
    if (constraint.maxSum < k) {
      if (constraint.lit === NULL_LITERAL) this.solver.setConflict();
      else this.solver.assignScoped(constraint.lit ^ 1);
      this.removeConstraint(constraint);
      return;
    }
    constraint.setK(k);
    if (constraint.lit === NULL_LITERAL || this.value(constraint.lit) === L_TRUE)
      this.initWatch(constraint);
  }

  private incCoeff(lit: number, offset: number) {
    const boolVar = lit >> 1;
    const coeffs = this.coeffs;
    while (coeffs.length <= boolVar) coeffs.push(0);
    const coeff0 = coeffs[boolVar];
    if (coeff0 === 0) this.activeVars.push(boolVar);
    const inc = lit & 1 ? -offset : offset;
    const coeff1 = inc + coeff0;
    coeffs[boolVar] = coeff1;
    if (coeff1 > INT_MAX || coeff1 < INT_MIN) {
      this.isOverflow = true;
      return;
    }
    if (coeff0 > 0 && inc < 0) this.incBound(Math.max(0, coeff1) - coeff0);
    else if (coeff0 < 0 && inc > 0) this.incBound(coeff0 - Math.min(0, coeff1));
    const bound = this.bound;
    if (coeff1 > bound) coeffs[boolVar] = bound;
    else if (coeff1 < 0 && -coeff1 > bound) coeffs[boolVar] = -bound;
  }

  private getCoeff(boolVar: number) {
    return this.coeffs[boolVar] ?? 0;
  }

  private getAbsCoeff(boolVar: number) {
    const abs = Math.abs(this.getCoeff(boolVar));
    const coeff = abs >>> 0;
    if (coeff !== abs) this.isOverflow = true;
    return coeff;
  }

  private incBound(inc: number) {
    const bound = this.bound + inc;
    const truncated = bound >>> 0;
    if (bound < 0 || truncated !== bound) this.isOverflow = true;
    this.bound = truncated;
  }

  private resetCoeffs() {
    for (let index = this.activeVars.length; index-- > 0;) this.coeffs[this.activeVars[index]] = 0;
    this.activeVars = [];
  }

  private bailResolveConflict(start: number) {
    const solver = this.solver;
    const trail = solver.trail;
    for (let index = start; this.numMarks > 0; index--) {
      const boolVar = trail[index] >> 1;
      if (solver.mark[boolVar]) {
        solver.mark[boolVar] = false;
        this.numMarks--;
      }
    }
  }

  resolveConflict() {
    if (this.numPropagationsSincePop === 0) return L_UNDEF;
    const solver = this.solver;
    this.isOverflow = false;
    this.resetCoeffs();
    this.numMarks = 0;
    this.bound = 0;
    let consequent = solver.notL;
    let kind = solver.conflictKind;
    let val = solver.conflictVal;
    this.conflictLvl = solver.getMaxLvl(consequent, kind, val).level;
    if (this.conflictLvl === 0) return L_UNDEF;
    if (consequent !== NULL_LITERAL) {
      consequent ^= 1;
      this.processAntecedent(consequent, 1);
    }
    const trail = solver.trail;
    let index = trail.length - 1;
    let offset = 1;
    const bailOut = () => {
      this.isOverflow = false;
      this.bailResolveConflict(index);
      return L_UNDEF;
    };
    do {
      if (this.isOverflow || offset > 1 << 12) return bailOut();
      if (offset !== 0) {
        switch (kind) {
          case JUSTIFICATION_NONE:
            this.incBound(offset);
            break;
          case JUSTIFICATION_BINARY:
            this.incBound(offset);
            this.incCoeff(consequent, offset);
            this.processAntecedent(val, offset);
            break;
          case JUSTIFICATION_CLAUSE: {
            this.incBound(offset);
            const arena = solver.arena;
            let position = 0;
            if (consequent !== NULL_LITERAL) {
              this.incCoeff(consequent, offset);
              if (arena.get(val, 0) === consequent) position = 1;
              else {
                this.processAntecedent(arena.get(val, 0), offset);
                position = 2;
              }
            }
            for (; position < arena.size[val]; position++)
              this.processAntecedent(arena.get(val, position), offset);
            break;
          }
          default: {
            const constraint = this.getConstraint(val);
            if (constraint.isCard()) {
              this.incBound(offset * constraint.k);
              this.processCard(constraint, offset);
            } else {
              const antecedents: number[] = [];
              this.incBound(offset);
              this.incCoeff(consequent, offset);
              this.getPbAntecedents(consequent, constraint as Pbc, antecedents);
              for (const lit of antecedents) this.processAntecedent(lit ^ 1, offset);
            }
          }
        }
        this.cut();
      }
      let boolVar: number;
      for (;;) {
        consequent = trail[index];
        boolVar = consequent >> 1;
        if (solver.mark[boolVar] && solver.lvlVar(boolVar) === this.conflictLvl) break;
        if (index === 0) return bailOut();
        index--;
      }
      solver.mark[boolVar] = false;
      index--;
      this.numMarks--;
      kind = solver.justKind[boolVar];
      val = solver.justVal[boolVar];
      offset = this.getAbsCoeff(boolVar);
      if (offset > this.bound) {
        this.coeffs[boolVar] = this.getCoeff(boolVar) < 0 ? -this.bound : this.bound;
        offset = this.bound;
      }
    } while (this.numMarks > 0);
    if (!this.createAssertingLemma()) return bailOut();
    this.active2card();
    return L_TRUE;
  }

  private createAssertingLemma() {
    const solver = this.solver;
    let slack = -this.bound;
    this.activeVarSet.clear();
    let next = 0;
    for (const boolVar of this.activeVars) {
      const coeff = this.getAbsCoeff(boolVar);
      if (this.activeVarSet.has(boolVar) || coeff === 0) continue;
      this.activeVarSet.add(boolVar);
      slack += coeff;
      this.activeVars[next++] = boolVar;
    }
    this.activeVars.length = next;
    const lemma = [NULL_LITERAL];
    let assertingCoeff = 0;
    for (let index = 0; slack >= 0 && index < this.activeVars.length; index++) {
      const boolVar = this.activeVars[index];
      const coeff = this.getCoeff(boolVar);
      const value = solver.valueVar(boolVar);
      const isTrue = value === L_TRUE;
      if (coeff === 0 || value === L_UNDEF || coeff < 0 !== isTrue) continue;
      const lit = 2 * boolVar + (isTrue ? 0 : 1);
      if (this.lvl(lit) === this.conflictLvl) {
        if (lemma[0] === NULL_LITERAL) {
          assertingCoeff = Math.abs(coeff);
          slack -= assertingCoeff;
          lemma[0] = lit ^ 1;
        } else if (assertingCoeff < Math.abs(coeff)) {
          lemma[0] = lit ^ 1;
          slack -= Math.abs(coeff) - assertingCoeff;
          assertingCoeff = Math.abs(coeff);
        }
      } else if (this.lvl(lit) < this.conflictLvl) {
        slack -= Math.abs(coeff);
        lemma.push(lit ^ 1);
      }
    }
    if (slack >= 0 || this.isOverflow) return false;
    if (lemma[0] === NULL_LITERAL) {
      if (lemma.length === 1) solver.setConflict();
      return false;
    }
    solver.lemma = [...lemma];
    for (let index = 1; index < lemma.length; index++) solver.mark[lemma[index] >> 1] = true;
    return true;
  }

  private cut() {
    for (const boolVar of this.activeVars) if (this.getAbsCoeff(boolVar) === 1) return;
    let gcd = 0;
    for (let index = 0; gcd !== 1 && index < this.activeVars.length; index++) {
      const boolVar = this.activeVars[index];
      let coeff = this.getAbsCoeff(boolVar);
      if (coeff === 0) continue;
      if (this.bound < coeff) {
        this.coeffs[boolVar] = this.getCoeff(boolVar) > 0 ? this.bound : -this.bound;
        coeff = this.bound;
      }
      gcd = gcd === 0 ? coeff : getGcd(gcd, coeff);
    }
    if (gcd < 2) return;
    this.activeVarSet.clear();
    let next = 0;
    for (const boolVar of this.activeVars) {
      const coeff = this.coeffs[boolVar];
      if (this.activeVarSet.has(boolVar) || coeff === 0) continue;
      this.activeVarSet.add(boolVar);
      this.coeffs[boolVar] = Math.trunc(coeff / gcd);
      this.activeVars[next++] = boolVar;
    }
    this.activeVars.length = next;
    this.bound = Math.floor((this.bound + gcd - 1) / gcd);
  }

  private processCard(constraint: Card, offset: number) {
    const lit = constraint.lit;
    for (let index = constraint.k; index < constraint.size; index++)
      this.processAntecedent(constraint.lits[index], offset);
    for (let index = 0; index < constraint.k; index++)
      this.incCoeff(constraint.lits[index], offset);
    if (lit === NULL_LITERAL) return;
    const offset1 = offset * constraint.k;
    if (offset1 > UINT_MAX) this.isOverflow = true;
    this.processAntecedent(this.value(lit) === L_TRUE ? lit ^ 1 : lit, offset1 % 2 ** 32);
  }

  private processAntecedent(lit: number, offset: number) {
    const solver = this.solver;
    const boolVar = lit >> 1;
    if (!solver.mark[boolVar] && solver.lvlVar(boolVar) === this.conflictLvl) {
      solver.mark[boolVar] = true;
      this.numMarks++;
    }
    this.incCoeff(lit, offset);
  }

  addAtLeast(lit: number, lits: number[], k: number, isLearned: boolean): Constraint | null {
    const solver = this.solver;
    if (k === 1 && lit === NULL_LITERAL) {
      this.mkClause(lits, isLearned);
      return null;
    }
    if (k === 0) {
      if (lit !== NULL_LITERAL) this.mkClause([lit], false);
      return null;
    }
    if (k > lits.length) {
      this.mkClause(lit === NULL_LITERAL ? [] : [lit ^ 1], false);
      return null;
    }
    solver.initVisited();
    for (const other of lits) {
      if (solver.isVisited(other & ~1))
        return this.addPbGe(lit, { coeffs: lits.map(() => 1), lits: [...lits] }, k, isLearned);
      solver.markVisited(other & ~1);
    }
    const constraint = new Card(this.nextIndex++, lit, [...lits], k);
    constraint.isLearned = isLearned;
    this.addConstraint(constraint);
    return constraint;
  }

  private addConstraint(constraint: Constraint) {
    const solver = this.solver;
    this.table.set(constraint.index, constraint);
    (constraint.isLearned ? this.learned : this.constraints).push(constraint);
    const lit = constraint.lit;
    if (constraint.isLearned && !solver.atBaseLvl()) this.constraintToReinit.push(constraint);
    else if (lit === NULL_LITERAL) this.initWatch(constraint);
    else {
      solver.setExternal(lit >> 1);
      constraint.watchLiteral(this, lit);
      constraint.watchLiteral(this, lit ^ 1);
    }
  }

  private initWatch(constraint: Constraint) {
    return !this.isInconsistent() && constraint.initWatch(this);
  }

  private addPbGe(lit: number, wlits: WLits, k: number, isLearned: boolean): Constraint | null {
    const solver = this.solver;
    const isUnits = wlits.coeffs.every((coeff) => coeff === 1);
    if (k === 0) {
      if (lit !== NULL_LITERAL) this.mkClause([lit], false);
      return null;
    }
    if (wlits.coeffs.reduce((sum, coeff) => sum + coeff, 0) < k) {
      this.mkClause(lit === NULL_LITERAL ? [] : [lit ^ 1], false);
      return null;
    }
    solver.initVisited();
    for (const other of wlits.lits) {
      if (solver.isVisited(other & ~1)) {
        const copy = { coeffs: [...wlits.coeffs], lits: [...wlits.lits] };
        const normalized = this.normalize(copy, k);
        copy.coeffs.length = normalized.size;
        copy.lits.length = normalized.size;
        return this.addPbGe(lit, copy, normalized.k, isLearned);
      }
      solver.markVisited(other & ~1);
    }
    if (!isLearned) for (const other of wlits.lits) solver.setExternal(other >> 1);
    if (isUnits || k === 1) return this.addAtLeast(lit, [...wlits.lits], k, isLearned);
    const constraint = new Pbc(this.nextIndex++, lit, [...wlits.lits], [...wlits.coeffs], k);
    constraint.isLearned = isLearned;
    this.addConstraint(constraint);
    return constraint;
  }

  propagated(lit: number, index: number) {
    const constraint = this.getConstraint(index);
    if (constraint.lit !== NULL_LITERAL && lit >> 1 === constraint.lit >> 1) {
      this.initWatch(constraint);
      return true;
    }
    if (constraint.lit !== NULL_LITERAL && this.value(constraint.lit) !== L_TRUE) return true;
    const result = constraint.isCard()
      ? this.addAssignCard(constraint, lit ^ 1)
      : this.addAssignPb(constraint as Pbc, lit ^ 1);
    return result !== L_UNDEF;
  }

  private isAssignedAbove(above: number, below: number) {
    const solver = this.solver;
    const level = this.lvl(above);
    if (level === 0) return false;
    const start = solver.scopes[level - 1].trailLim;
    const trail = solver.trail;
    for (let index = trail.length; index-- > start;) {
      if (trail[index] === above) return true;
      if (trail[index] === below) return false;
    }
    return false;
  }

  private getPbAntecedents(lit: number, constraint: Pbc, antecedents: number[]) {
    if (constraint.lit !== NULL_LITERAL) antecedents.push(constraint.lit);
    const k = constraint.k;
    const lits = constraint.lits;
    const coeffs = constraint.coeffs;
    if (this.value(lit) === L_FALSE) {
      let slack = 0;
      for (let index = 0; index < constraint.size; index++)
        if (this.value(lits[index]) !== L_FALSE) slack += coeffs[index];
      for (let index = 0; index < constraint.size; index++) {
        const other = lits[index];
        if (other === lit || this.value(other) !== L_FALSE) continue;
        if (slack + coeffs[index] < k) slack += coeffs[index];
        else antecedents.push(other ^ 1);
      }
      return;
    }
    let coeff = 0;
    let position = 0;
    for (; position < constraint.size; position++)
      if (lits[position] === lit) {
        coeff = coeffs[position];
        break;
      }
    position = Math.max(position + 1, constraint.numWatch);
    let slack = constraint.maxSum - coeff;
    for (; position < constraint.size; position++) {
      const other = lits[position];
      if (this.value(other) !== L_FALSE || this.lvl(other) > this.lvl(lit)) continue;
      if (this.lvl(other) === this.lvl(lit) && this.isAssignedAbove(other ^ 1, lit)) continue;
      if (slack + coeffs[position] < k) slack += coeffs[position];
      else antecedents.push(other ^ 1);
    }
  }

  private getCardAntecedents(lit: number, constraint: Card, antecedents: number[]) {
    if (lit === (constraint.lit ^ 1)) {
      for (let index = constraint.k - 1; index < constraint.size; index++)
        antecedents.push(constraint.lits[index] ^ 1);
      return;
    }
    if (constraint.lit !== NULL_LITERAL)
      antecedents.push(this.value(constraint.lit) === L_TRUE ? constraint.lit : constraint.lit ^ 1);
    for (let index = constraint.k; index < constraint.size; index++)
      antecedents.push(constraint.lits[index] ^ 1);
  }

  getAntecedents(lit: number, index: number, antecedents: number[]) {
    const constraint = this.getConstraint(index);
    if (constraint.isCard()) this.getCardAntecedents(lit, constraint, antecedents);
    else this.getPbAntecedents(lit, constraint as Pbc, antecedents);
  }

  private removeConstraint(constraint: Constraint) {
    constraint.nullifyTrackingLiteral(this);
    constraint.clearWatch(this);
    constraint.isRemoved = true;
    this.isConstraintRemoved = true;
  }

  private deallocate(constraint: Constraint) {
    this.table.delete(constraint.index);
  }

  private updatePsm(constraint: Constraint) {
    const phase = this.solver.phase;
    let psm = 0;
    for (const lit of constraint.lits) if (phase[lit >> 1] === ((lit & 1) === 0)) psm++;
    constraint.psm = psm;
  }

  gc() {
    const solver = this.solver;
    if (
      this.learned.length < 2 * this.constraints.length ||
      !(solver.scopeLvl === solver.searchLvl || solver.atBaseLvl())
    )
      return;
    for (const constraint of this.learned) this.updatePsm(constraint);
    const isLess = (first: Constraint, second: Constraint) =>
      first.glue < second.glue ||
      (first.glue === second.glue &&
        (first.psm < second.psm || (first.psm === second.psm && first.size < second.size)));
    this.learned.sort((first, second) =>
      isLess(first, second) ? -1 : isLess(second, first) ? 1 : 0,
    );
    this.gcHalf();
    this.cleanupConstraintList(this.learned, true);
  }

  private gcHalf() {
    const learned = this.learned;
    const size = learned.length;
    let next = size >>> 1;
    for (let index = next; index < size; index++) {
      const constraint = learned[index];
      if (!this.constraintToReinit.includes(constraint)) {
        this.removeConstraint(constraint);
        this.deallocate(constraint);
      } else learned[next++] = constraint;
    }
    learned.length = next;
  }

  private addAssignCard(constraint: Card, alit: number) {
    const lits = constraint.lits;
    const size = constraint.size;
    const bound = constraint.k;
    const lit = constraint.lit;
    if (bound === size) {
      if (lit !== NULL_LITERAL && this.value(lit) === L_UNDEF) {
        this.assignBy(constraint, lit ^ 1);
        return this.isInconsistent() ? L_FALSE : L_TRUE;
      }
      this.setConflictBy(constraint, alit);
      return L_FALSE;
    }
    let index = 0;
    for (; index <= bound; index++) if (lits[index] === alit) break;
    if (index === bound + 1) return L_UNDEF;
    for (let position = bound + 1; position < size; position++) {
      const lit2 = lits[position];
      if (this.value(lit2) === L_FALSE) continue;
      constraint.swap(index, position);
      constraint.watchLiteral(this, lit2);
      return L_UNDEF;
    }
    if (bound !== index && this.value(lits[bound]) === L_FALSE) {
      if (lit !== NULL_LITERAL && this.value(lit) === L_UNDEF) {
        if (index + 1 < bound) constraint.swap(index, bound - 1);
        this.assignBy(constraint, lit ^ 1);
        return this.isInconsistent() ? L_FALSE : L_TRUE;
      }
      this.setConflictBy(constraint, alit);
      return L_FALSE;
    }
    if (index !== bound) constraint.swap(index, bound);
    if (lit !== NULL_LITERAL && this.value(lit) === L_UNDEF) return L_TRUE;
    for (let position = 0; position < bound; position++) this.assignBy(constraint, lits[position]);
    if (constraint.isLearned && constraint.glue > 2) {
      const glue = this.solver.numDiffFalseLevelsBelow(lits, constraint.glue - 1);
      if (glue !== -1) constraint.glue = glue;
    }
    return this.isInconsistent() ? L_FALSE : L_TRUE;
  }

  push() {
    this.constraintToReinitLim.push(this.constraintToReinit.length);
  }

  pop(numScopes: number) {
    const newLim = this.constraintToReinitLim.length - numScopes;
    this.constraintToReinitLastSize = this.constraintToReinitLim[newLim];
    this.constraintToReinitLim.length = newLim;
    this.numPropagationsSincePop = 0;
  }

  popReinit() {
    const toReinit = this.constraintToReinit;
    let size = this.constraintToReinitLastSize;
    for (let index = size; index < toReinit.length; index++) {
      const constraint = toReinit[index];
      if (!this.initWatch(constraint) && !this.solver.atBaseLvl()) toReinit[size++] = constraint;
    }
    toReinit.length = size;
  }

  simplify() {
    const solver = this.solver;
    if (!solver.atBaseLvl()) solver.popToBaseLevel();
    if (solver.isInconsistent) return;
    let trailSize = 0;
    let count = 0;
    do {
      trailSize = solver.initTrailSize();
      this.isSimplifyChange = false;
      this.isClauseRemoved = false;
      this.isConstraintRemoved = false;
      for (let index = 0, size = this.constraints.length; index < size; index++)
        this.simplifyConstraint(this.constraints[index]);
      for (let index = 0, size = this.learned.length; index < size; index++)
        this.simplifyConstraint(this.learned[index]);
      this.initUseLists();
      this.setNonExternal();
      this.elimPure();
      for (let index = 0, size = this.constraints.length; index < size; index++)
        this.subsumption(this.constraints[index]);
      for (let index = 0, size = this.learned.length; index < size; index++)
        this.subsumption(this.learned[index]);
      this.cleanupClauses();
      this.cleanupConstraints();
      count++;
    } while (count < 10 && (this.isSimplifyChange || trailSize < solver.initTrailSize()));
    this.gc();
  }

  private reserveRoots() {
    const numVars = this.solver.numVars();
    while (this.rootVars.length < numVars) this.rootVars.push(false);
    for (let lit = this.roots.length; lit < 2 * numVars; lit++) this.roots.push(lit);
  }

  setRoot(lit: number, root: number) {
    if (this.solver.isAssumption(lit >> 1)) return false;
    this.reserveRoots();
    this.roots[lit] = root;
    this.roots[lit ^ 1] = root ^ 1;
    this.roots[root] = root;
    this.roots[root ^ 1] = root ^ 1;
    this.rootVars[lit >> 1] = true;
    return true;
  }

  flushRoots() {
    if (this.roots.length === 0) return;
    this.reserveRoots();
    this.isConstraintRemoved = false;
    for (let index = 0, size = this.constraints.length; index < size; index++)
      this.flushConstraintRoots(this.constraints[index]);
    for (let index = 0, size = this.learned.length; index < size; index++)
      this.flushConstraintRoots(this.learned[index]);
    this.cleanupConstraints();
  }

  private recompile(constraint: Constraint) {
    if (constraint.isCard()) this.recompileCard(constraint);
    else this.recompilePb(constraint as Pbc);
  }

  private recompileCard(constraint: Card) {
    const weights = this.weights;
    const numLits = 2 * this.solver.numVars();
    while (weights.length < numLits) weights.push(0);
    for (const lit of constraint.lits) weights[lit]++;
    let k = constraint.k;
    let isAllUnits = true;
    const coeffs: number[] = [];
    const size = constraint.size;
    const lits = constraint.lits;
    let next = 0;
    for (let index = 0; index < size && k > 0; index++) {
      const lit = lits[index];
      let weight = weights[lit];
      const weight2 = weights[lit ^ 1];
      if (weight === 0 || weight < weight2) continue;
      if (k <= weight2) {
        k = 0;
        break;
      }
      k -= weight2;
      weight -= weight2;
      weights[lit ^ 1] = 0;
      weights[lit] = 0;
      if (weight === 0) continue;
      isAllUnits &&= weight === 1;
      coeffs.push(weight);
      lits[next++] = lit;
    }
    for (const lit of lits) {
      weights[lit] = 0;
      weights[lit ^ 1] = 0;
    }
    const root = constraint.lit;
    if (k === 0 && root === NULL_LITERAL) {
      this.removeConstraint(constraint);
      return;
    }
    if (k === 1 && root === NULL_LITERAL) {
      this.mkClause(lits.slice(0, next), constraint.isLearned);
      this.removeConstraint(constraint);
      return;
    }
    if (next === 0) {
      if (root === NULL_LITERAL) {
        if (k > 0) this.mkClause([], false);
      } else this.mkClause([k > 0 ? root ^ 1 : root], constraint.isLearned);
      this.removeConstraint(constraint);
      return;
    }
    if (isAllUnits && next < k) {
      this.mkClause(root === NULL_LITERAL ? [] : [root ^ 1], constraint.isLearned);
      this.removeConstraint(constraint);
      return;
    }
    constraint.setSize(next);
    constraint.setK(k);
    if (!isAllUnits) {
      const wlits = { coeffs, lits: [...constraint.lits] };
      this.removeConstraint(constraint);
      this.addPbGe(root, wlits, k, constraint.isLearned);
    } else if (root === NULL_LITERAL || this.value(root) === L_TRUE) this.initWatch(constraint);
  }

  private flushConstraintRoots(constraint: Constraint) {
    if (constraint.lit !== NULL_LITERAL && !constraint.isWatched(this, constraint.lit)) {
      constraint.watchLiteral(this, constraint.lit);
      constraint.watchLiteral(this, constraint.lit ^ 1);
    }
    let isFound = constraint.lit !== NULL_LITERAL && this.rootVars[constraint.lit >> 1];
    for (let index = 0; !isFound && index < constraint.size; index++)
      isFound = this.rootVars[constraint.lits[index] >> 1];
    if (!isFound) return;
    constraint.clearWatch(this);
    for (let index = 0; index < constraint.size; index++)
      constraint.lits[index] = this.roots[constraint.lits[index]];
    let root = constraint.lit;
    if (root !== NULL_LITERAL && this.roots[root] !== root) {
      root = this.roots[root];
      constraint.nullifyTrackingLiteral(this);
      constraint.lit = root;
      constraint.watchLiteral(this, root);
      constraint.watchLiteral(this, root ^ 1);
    }
    const solver = this.solver;
    let isDuplicate = false;
    solver.initVisited();
    for (const lit of constraint.lits) {
      if (solver.isVisited(lit)) {
        isDuplicate = true;
        break;
      }
      solver.markVisited(lit);
      solver.markVisited(lit ^ 1);
    }
    const isRootFound = constraint.lits.some((lit) => lit >> 1 === root >> 1);
    if (isRootFound) {
      this.splitRoot(constraint);
      constraint.negate();
      this.splitRoot(constraint);
      this.removeConstraint(constraint);
    } else if (isDuplicate) this.recompile(constraint);
    else if (constraint.lit === NULL_LITERAL || this.value(constraint.lit) !== L_UNDEF)
      this.initWatch(constraint);
  }

  private numNonlearnedBin(lit: number) {
    const wlist = this.getWlist(lit ^ 1);
    let count = 0;
    for (let index = 0; index < wlist.size; index++)
      if (wlist.isBinary(index) && !wlist.isLearned(index)) count++;
    return count;
  }

  private initUseLists() {
    const solver = this.solver;
    const arena = solver.arena;
    const numLits = 2 * solver.numVars();
    this.clauseUseCounts = new Int32Array(numLits);
    this.clauseUseLists = Array.from({ length: numLits }, () => []);
    this.cnstrUseList = Array.from({ length: numLits }, () => []);
    for (const clause of solver.clauses) {
      if (arena.isFrozen(clause)) continue;
      for (let index = 0; index < arena.size[clause]; index++) {
        const lit = arena.get(clause, index);
        this.clauseUseLists[lit].push(clause);
        this.clauseUseCounts[lit]++;
      }
    }
    for (const constraint of this.constraints) {
      const lit = constraint.lit;
      if (lit !== NULL_LITERAL) {
        this.cnstrUseList[lit].push(constraint);
        this.cnstrUseList[lit ^ 1].push(constraint);
      }
      for (const other of constraint.lits) {
        this.cnstrUseList[other].push(constraint);
        if (lit !== NULL_LITERAL) this.cnstrUseList[other ^ 1].push(constraint);
      }
    }
  }

  private useCount(lit: number) {
    return this.cnstrUseList[lit].length + this.clauseUseCounts[lit];
  }

  private isIncrementalMode() {
    return this.solver.simplifier.isIncrementalMode || this.solver.trackingAssumptions();
  }

  private setNonExternal() {
    const solver = this.solver;
    if (!this.isIncrementalMode())
      for (let boolVar = 0; boolVar < solver.numVars(); boolVar++)
        if (
          solver.isExternal(boolVar) &&
          this.cnstrUseList[2 * boolVar].length === 0 &&
          this.cnstrUseList[2 * boolVar + 1].length === 0
        )
          solver.external[boolVar] = false;
    for (const constraint of this.learned) {
      if (constraint.isRemoved) continue;
      if (constraint.lits.some((lit) => solver.wasEliminated(lit >> 1)))
        this.removeConstraint(constraint);
    }
  }

  private elimPureLit(lit: number) {
    if (
      this.value(lit) !== L_UNDEF ||
      this.cnstrUseList[lit].length === 0 ||
      this.useCount(lit ^ 1) !== 0 ||
      this.numNonlearnedBin(lit ^ 1) !== 0
    )
      return false;
    this.solver.assignScoped(lit);
    return true;
  }

  private elimPure() {
    const solver = this.solver;
    if (!solver.simplifier.isElimVars || this.isIncrementalMode()) return;
    for (let boolVar = 0; boolVar < solver.numVars(); boolVar++) {
      const lit = 2 * boolVar;
      if (solver.valueVar(boolVar) !== L_UNDEF) continue;
      if (this.cnstrUseList[lit].length === 0 && this.cnstrUseList[lit + 1].length === 0) continue;
      if (!this.elimPureLit(lit)) this.elimPureLit(lit + 1);
    }
  }

  private subsumption(constraint: Constraint) {
    if (constraint.isRemoved || constraint.k <= 1) return;
    if (constraint.isCard()) this.cardSubsumption(constraint);
    else this.pbSubsumption(constraint as Pbc);
  }

  private cleanupClauses() {
    if (!this.isClauseRemoved) return;
    const solver = this.solver;
    for (const clauses of [solver.clauses, solver.learned]) {
      let next = 0;
      for (const clause of clauses) {
        if (solver.arena.wasRemoved(clause) && solver.canDelete(clause)) {
          solver.detachClause(clause);
          solver.delClause(clause);
        } else clauses[next++] = clause;
      }
      clauses.length = next;
    }
  }

  private cleanupConstraints() {
    if (!this.isConstraintRemoved) return;
    this.cleanupConstraintList(this.constraints, false);
    this.cleanupConstraintList(this.learned, true);
    this.isConstraintRemoved = false;
  }

  private cleanupConstraintList(list: Constraint[], isLearnedList: boolean) {
    let next = 0;
    for (const constraint of list) {
      if (constraint.isRemoved) {
        constraint.clearWatch(this);
        constraint.nullifyTrackingLiteral(this);
        this.deallocate(constraint);
      } else if (isLearnedList && !constraint.isLearned) this.constraints.push(constraint);
      else list[next++] = constraint;
    }
    list.length = next;
  }

  // A >= k subsumes A + B >= k' when k' + |A'| + |comp| <= k.
  private isCardSubsumed(first: Card, second: Card, complements: number[]) {
    if (second.lit !== NULL_LITERAL) return false;
    const solver = this.solver;
    let common = 0;
    complements.length = 0;
    for (const lit of second.lits) {
      if (solver.isVisited(lit)) common++;
      else if (solver.isVisited(lit ^ 1)) complements.push(lit);
    }
    const exclusive = first.size - common - complements.length;
    return exclusive + second.k + complements.length <= first.k;
  }

  private isClauseSubsumed(constraint: Card, clause: number) {
    const solver = this.solver;
    const arena = solver.arena;
    let common = 0;
    let complement = 0;
    let exclusive = 0;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      if (solver.isVisited(lit)) common++;
      else if (solver.isVisited(lit ^ 1)) complement++;
      else exclusive++;
    }
    const cardExclusive = constraint.size - common - complement;
    if (complement > 0 && constraint.k + 1 > cardExclusive + exclusive + common)
      return { isSubsumed: true, isSelf: true };
    return { isSubsumed: constraint.size - common < constraint.k, isSelf: false };
  }

  private isPbSubsumed(first: Pbc, second: Constraint) {
    if (first.k < second.k || first.size > second.size) return false;
    const solver = this.solver;
    let numSub = 0;
    for (let index = 0; index < second.size; index++) {
      const lit = second.lits[index];
      if (solver.isVisited(lit) && this.weights[lit] <= second.getCoeff(index)) numSub++;
      if (first.size + index > second.size + numSub) return false;
    }
    return numSub === first.size;
  }

  private pbSubsumes(first: Pbc, lit: number) {
    for (const constraint of this.cnstrUseList[lit]) {
      if (constraint === first || constraint.isRemoved || constraint.lit !== NULL_LITERAL) continue;
      if (!this.isPbSubsumed(first, constraint)) continue;
      this.setNonLearned(first);
      this.removeConstraint(constraint);
    }
  }

  private cardCardSubsumption(first: Card, lit: number) {
    const complements: number[] = [];
    for (const constraint of this.cnstrUseList[lit]) {
      if (!constraint.isCard() || constraint === first || constraint.isRemoved) continue;
      if (!this.isCardSubsumed(first, constraint, complements)) continue;
      if (complements.length === 0) {
        this.removeConstraint(constraint);
        this.setNonLearned(first);
        continue;
      }
      constraint.clearWatch(this);
      const solver = this.solver;
      let next = 0;
      for (let index = 0; index < constraint.size; index++)
        if (!solver.isVisited(constraint.lits[index] ^ 1))
          constraint.lits[next++] = constraint.lits[index];
      constraint.setSize(next);
      this.initWatch(constraint);
      this.isSimplifyChange = true;
    }
  }

  private clauseSubsumption(constraint: Card, lit: number, removedClauses: number[]) {
    const arena = this.solver.arena;
    for (const clause of this.clauseUseLists[lit]) {
      if (arena.wasRemoved(clause)) continue;
      const subsumed = this.isClauseSubsumed(constraint, clause);
      if (!subsumed.isSubsumed || subsumed.isSelf) continue;
      removedClauses.push(clause);
      this.setNonLearned(constraint);
    }
  }

  private setNonLearned(constraint: Constraint) {
    const solver = this.solver;
    if (constraint.lit !== NULL_LITERAL) solver.setExternal(constraint.lit >> 1);
    for (const lit of constraint.lits) solver.setExternal(lit >> 1);
    constraint.isLearned = false;
  }

  private binarySubsumption(constraint: Card, lit: number) {
    if (constraint.k + 1 !== constraint.size) return;
    const solver = this.solver;
    const wlist = this.getWlist(lit ^ 1);
    let next = 0;
    for (let index = 0; index < wlist.size; index++) {
      if (wlist.isBinary(index) && solver.isVisited(wlist.getLiteral(index))) {
        if (!wlist.isLearned(index)) this.setNonLearned(constraint);
        continue;
      }
      wlist.copy(next++, index);
    }
    wlist.setEnd(next);
  }

  private cardSubsumption(constraint: Card) {
    if (constraint.isRemoved || constraint.lit !== NULL_LITERAL) return;
    const solver = this.solver;
    const removedClauses: number[] = [];
    solver.initVisited();
    for (const lit of constraint.lits) solver.markVisited(lit);
    for (let index = 0; index < Math.min(constraint.size, constraint.k + 1); index++) {
      const lit = constraint.lits[index];
      this.cardCardSubsumption(constraint, lit);
      this.clauseSubsumption(constraint, lit, removedClauses);
      this.binarySubsumption(constraint, lit);
    }
    if (removedClauses.length > 0) this.isClauseRemoved = true;
    const arena = solver.arena;
    for (const clause of removedClauses) {
      arena.setRemoved(clause, true);
      for (let index = 0; index < arena.size[clause]; index++)
        this.clauseUseCounts[arena.get(clause, index)]--;
    }
  }

  private pbSubsumption(constraint: Pbc) {
    if (constraint.isRemoved || constraint.lit !== NULL_LITERAL) return;
    const solver = this.solver;
    const weights = this.weights;
    solver.initVisited();
    for (let index = 0; index < constraint.size; index++) {
      const lit = constraint.lits[index];
      while (weights.length <= lit) weights.push(0);
      weights[lit] = constraint.coeffs[index];
      solver.markVisited(lit);
    }
    for (let index = 0; index < Math.min(10, constraint.numWatch); index++) {
      const position = solver.rand.next() % constraint.numWatch;
      this.pbSubsumes(constraint, constraint.lits[position]);
    }
    for (const lit of constraint.lits) weights[lit] = 0;
  }

  // lit <=> the conjunction of the unassigned literals.
  private assertUnconstrained(lit: number, lits: number[]) {
    const solver = this.solver;
    if (lit === NULL_LITERAL) {
      for (const other of lits) if (this.value(other) === L_UNDEF) solver.assignScoped(other);
      return;
    }
    const clause = [lit];
    for (const other of lits)
      if (this.value(other) === L_UNDEF) {
        solver.mkClause([lit ^ 1, other]);
        clause.push(other ^ 1);
      }
    solver.mkClause(clause);
  }

  initUseList(useVars: Set<number>) {
    useVars.clear();
    for (const constraint of this.constraints) {
      if (constraint.lit !== NULL_LITERAL) useVars.add(constraint.lit >> 1);
      for (const lit of constraint.lits) useVars.add(lit >> 1);
    }
  }

  findMutexes(lits: number[], mutexes: number[][]) {
    const members = [...lits];
    const isMember = new Set(lits);
    const remove = (lit: number) => {
      if (!isMember.delete(lit)) return;
      const position = members.lastIndexOf(lit);
      members[position] = members[members.length - 1];
      members.pop();
    };
    let isChanged = false;
    for (const constraint of this.constraints) {
      if (!constraint.isCard() || constraint.lit !== NULL_LITERAL) continue;
      if (constraint.size !== constraint.k + 1) continue;
      const mutex = constraint.lits.map((lit) => lit ^ 1).filter((lit) => isMember.has(lit));
      if (mutex.length <= 1) continue;
      for (const lit of mutex) remove(lit);
      isChanged = true;
      mutexes.push(mutex);
    }
    if (isChanged) lits.splice(0, lits.length, ...members);
  }

  private active2card() {
    const wlits: { coeff: number; lit: number }[] = [];
    let sum = 0;
    this.activeVarSet.clear();
    for (const boolVar of this.activeVars) {
      if (this.activeVarSet.has(boolVar)) continue;
      this.activeVarSet.add(boolVar);
      const signed = this.getCoeff(boolVar);
      const abs = Math.abs(signed);
      const coeff = abs >>> 0;
      if (coeff !== abs) this.isOverflow = true;
      if (coeff === 0) continue;
      wlits.push({ coeff, lit: 2 * boolVar + (signed < 0 ? 1 : 0) });
      sum += coeff;
    }
    if (sum >= Math.floor(UINT_MAX / 2)) this.isOverflow = true;
    if (this.isOverflow) return;
    wlits.sort((first, second) => second.coeff - first.coeff || second.lit - first.lit);
    let k = 0;
    let total = 0;
    let total0 = 0;
    for (const wlit of wlits) {
      if (total >= this.bound) break;
      total0 = total;
      total += wlit.coeff;
      k++;
    }
    if (k === 1) return;
    while (wlits.length > 0) {
      if (wlits[wlits.length - 1].coeff + total0 >= this.bound) break;
      total0 += (wlits.pop() as { coeff: number }).coeff;
    }
    let slack = 0;
    for (const wlit of wlits) if (this.value(wlit.lit) !== L_FALSE) slack++;
    if (slack >= k) return;
    const constraint = this.addAtLeast(
      NULL_LITERAL,
      wlits.map((wlit) => wlit.lit),
      k,
      true,
    );
    if (constraint === null) return;
    const falseLits = wlits.map((wlit) => wlit.lit).filter((lit) => this.value(lit) === L_FALSE);
    constraint.glue = this.solver.numDiffLevels(falseLits);
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    const manager = this.manager;
    if (!isRoot) {
      const lit = this.si.getCached(expr);
      if (lit !== NULL_LITERAL) return isSign ? lit ^ 1 : lit;
    }
    const decl = manager.decls[expr];
    const k = getPbK(manager, decl);
    const isUnit = hasUnitCoefficients(manager, decl);
    switch (manager.getOp(expr)) {
      case OP_AT_MOST_K:
        return this.convertAtMostK(expr, k, isRoot, isSign);
      case OP_AT_LEAST_K:
        return this.convertAtLeastK(expr, k, isRoot, isSign);
      case OP_PB_LE:
        return isUnit
          ? this.convertAtMostK(expr, k, isRoot, isSign)
          : this.convertPbLe(expr, isRoot, isSign);
      case OP_PB_GE:
        return isUnit
          ? this.convertAtLeastK(expr, k, isRoot, isSign)
          : this.convertPbGe(expr, isRoot, isSign);
      case OP_PB_EQ:
        return isUnit
          ? this.convertEqK(expr, k, isRoot, isSign)
          : this.convertPbEq(expr, isRoot, isSign);
      default:
        throw new SmtTacticError("unexpected pseudo-Boolean operator");
    }
  }

  private checkUnsigned(value: Rational) {
    if (!value.isInt() || value.num < 0n || value.num > BigInt(UINT_MAX))
      throw new SmtTacticError("unsigned coefficient expected");
    return Number(value.num);
  }

  private convertPbArgs(expr: number) {
    const lits: number[] = [];
    for (const arg of this.manager.getArgs(expr)) {
      const lit = this.si.internalize(arg);
      lits.push(lit);
      this.solver.setExternal(lit >> 1);
    }
    return lits;
  }

  private convertPbWlits(expr: number): WLits {
    const manager = this.manager;
    const lits = this.convertPbArgs(expr);
    const coeffs = lits.map((_, index) =>
      this.checkUnsigned(getPbCoeff(manager, manager.decls[expr], index)),
    );
    return { coeffs, lits };
  }

  private addRootPbGe(wlits: WLits, k: number, isSign: boolean) {
    if (!isSign) {
      this.addPbGe(NULL_LITERAL, wlits, k, false);
      return;
    }
    let bound = 1 - k;
    for (let index = 0; index < wlits.lits.length; index++) {
      wlits.lits[index] ^= 1;
      bound += wlits.coeffs[index];
    }
    this.addPbGe(NULL_LITERAL, wlits, bound, false);
  }

  private convertPbLe(expr: number, isRoot: boolean, isSign: boolean) {
    const wlits = this.convertPbWlits(expr);
    let k = getPbK(this.manager, this.manager.decls[expr]).neg();
    for (let index = 0; index < wlits.lits.length; index++) {
      wlits.lits[index] ^= 1;
      k = k.add(Rational.of(BigInt(wlits.coeffs[index])));
    }
    const bound = this.checkUnsigned(k);
    if (isRoot) {
      this.addRootPbGe(wlits, bound, isSign);
      return NULL_LITERAL;
    }
    const lit = 2 * this.solver.mkVar(true, true);
    this.addPbGe(lit, wlits, bound, false);
    return isSign ? lit ^ 1 : lit;
  }

  private convertPbGe(expr: number, isRoot: boolean, isSign: boolean) {
    const bound = this.checkUnsigned(getPbK(this.manager, this.manager.decls[expr]));
    const wlits = this.convertPbWlits(expr);
    if (isRoot) {
      this.addRootPbGe(wlits, bound, isSign);
      return NULL_LITERAL;
    }
    const lit = 2 * this.solver.mkVar(true, true);
    this.addPbGe(lit, wlits, bound, false);
    return isSign ? lit ^ 1 : lit;
  }

  private convertPbEq(expr: number, isRoot: boolean, isSign: boolean) {
    const solver = this.solver;
    let k = getPbK(this.manager, this.manager.decls[expr]);
    const wlits = this.convertPbWlits(expr);
    const isBaseAssert = isRoot && !isSign;
    const lit1 = isBaseAssert ? NULL_LITERAL : 2 * solver.mkVar(true, true);
    const lit2 = isBaseAssert ? NULL_LITERAL : 2 * solver.mkVar(true, true);
    this.addPbGe(lit1, wlits, Number(BigInt.asUintN(32, k.num)), false);
    k = k.neg();
    for (let index = 0; index < wlits.lits.length; index++) {
      wlits.lits[index] ^= 1;
      k = k.add(Rational.of(BigInt(wlits.coeffs[index])));
    }
    if (k.isNegative()) {
      const lit = 2 * solver.mkVar(false, true);
      solver.assignUnit(lit ^ 1);
      this.si.cache(expr, lit);
      return isSign ? lit ^ 1 : lit;
    }
    this.addPbGe(lit2, wlits, this.checkUnsigned(k), false);
    if (isBaseAssert) return NULL_LITERAL;
    return this.mkConjunction(expr, lit1, lit2, isSign);
  }

  private mkConjunction(expr: number, lit1: number, lit2: number, isSign: boolean) {
    const solver = this.solver;
    const lit = 2 * solver.mkVar(false, true);
    solver.mkClause([lit ^ 1, lit1]);
    solver.mkClause([lit ^ 1, lit2]);
    solver.mkClause([lit1 ^ 1, lit2 ^ 1, lit]);
    this.si.cache(expr, lit);
    return isSign ? lit ^ 1 : lit;
  }

  private convertAtLeastK(expr: number, k: Rational, isRoot: boolean, isSign: boolean) {
    const lits = this.convertPbArgs(expr);
    let bound = k.compare(Rational.of(BigInt(lits.length))) > 0 ? lits.length + 1 : Number(k.num);
    if (isRoot) {
      if (isSign) {
        for (let index = 0; index < lits.length; index++) lits[index] ^= 1;
        bound = lits.length + 1 - bound;
      }
      this.addAtLeast(NULL_LITERAL, lits, bound, false);
      return NULL_LITERAL;
    }
    const lit = 2 * this.solver.mkVar(true, true);
    this.addAtLeast(lit, lits, bound, false);
    this.si.cache(expr, lit);
    return isSign ? lit ^ 1 : lit;
  }

  private convertAtMostK(expr: number, k: Rational, isRoot: boolean, isSign: boolean) {
    const lits = this.convertPbArgs(expr);
    for (let index = 0; index < lits.length; index++) lits[index] ^= 1;
    const bound1 = k.compare(Rational.of(BigInt(lits.length))) >= 0 ? lits.length : Number(k.num);
    let bound = lits.length - bound1;
    if (isRoot) {
      if (isSign) {
        for (let index = 0; index < lits.length; index++) lits[index] ^= 1;
        bound = lits.length + 1 - bound;
      }
      this.addAtLeast(NULL_LITERAL, lits, bound, false);
      return NULL_LITERAL;
    }
    const lit = 2 * this.solver.mkVar(true, true);
    this.addAtLeast(lit, lits, bound, false);
    this.si.cache(expr, lit);
    return isSign ? lit ^ 1 : lit;
  }

  private convertEqK(expr: number, k: Rational, isRoot: boolean, isSign: boolean) {
    const solver = this.solver;
    const lits = this.convertPbArgs(expr);
    const isBaseAssert = isRoot && !isSign;
    const lit1 = isBaseAssert ? NULL_LITERAL : 2 * solver.mkVar(true, true);
    const lit2 = isBaseAssert ? NULL_LITERAL : 2 * solver.mkVar(true, true);
    const bound = k.compare(Rational.of(BigInt(lits.length))) > 0 ? lits.length + 1 : Number(k.num);
    this.addAtLeast(lit1, lits, bound, false);
    for (let index = 0; index < lits.length; index++) lits[index] ^= 1;
    this.addAtLeast(lit2, lits, bound > lits.length ? 0 : lits.length - bound, false);
    if (isBaseAssert) return NULL_LITERAL;
    return this.mkConjunction(expr, lit1, lit2, isSign);
  }
}
