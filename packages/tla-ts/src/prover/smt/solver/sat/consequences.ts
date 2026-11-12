// Ported from Z3 (src/sat/sat_solver.cpp, src/util/uint_set.h), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { getIdentityHash, ObjHashtable } from "../hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import {
  JUSTIFICATION_BINARY,
  JUSTIFICATION_CLAUSE,
  JUSTIFICATION_NONE,
  type Solver,
} from "./solver";

// tracked_uint_set: an insertion-ordered set whose removal moves the last element into the gap.
class TrackedSet {
  readonly items: number[] = [];
  private isIn = new Set<number>();

  constructor(values: readonly number[] = []) {
    for (const value of values) this.insert(value);
  }

  insert(value: number) {
    if (this.isIn.has(value)) return;
    this.isIn.add(value);
    this.items.push(value);
  }

  has(value: number) {
    return this.isIn.has(value);
  }

  remove(value: number) {
    if (!this.isIn.delete(value)) return;
    const index = this.items.lastIndexOf(value);
    this.items[index] = this.items[this.items.length - 1];
    this.items.pop();
  }
}

class ConsequenceFinder {
  private antecedents = new Map<number, ObjHashtable>();
  private todo: number[] = [];
  readonly consequences: number[][] = [];

  constructor(private readonly solver: Solver) {}

  private checkDomain(lit: number) {
    if (this.antecedents.has(lit >> 1)) return true;
    this.todo.push(lit);
    return false;
  }

  private addAntecedents(target: ObjHashtable, lit: number) {
    for (const index of this.antecedents.get(lit >> 1) ?? []) target.add(index);
  }

  private extractAssumptions(lit: number, premises: ObjHashtable) {
    const solver = this.solver;
    const boolVar = lit >> 1;
    const kind = solver.justKind[boolVar];
    const val = solver.justVal[boolVar];
    if (kind === JUSTIFICATION_NONE) return true;
    if (kind === JUSTIFICATION_BINARY) {
      if (!this.checkDomain(val ^ 1)) return false;
      this.addAntecedents(premises, val);
      return true;
    }
    if (kind !== JUSTIFICATION_CLAUSE)
      throw new SmtUnsupportedError("consequences of external SAT constraints");
    let isAllFound = true;
    for (let index = 0; index < solver.arena.size[val]; index++) {
      const other = solver.arena.get(val, index);
      if (other === lit) continue;
      if (this.checkDomain(other ^ 1) && isAllFound) this.addAntecedents(premises, other);
      else isAllFound = false;
    }
    return isAllFound;
  }

  private extractFixedConsequence1(lit: number, assumptions: TrackedSet, unfixed: TrackedSet) {
    if (this.antecedents.has(lit >> 1)) return true;
    const premises = new ObjHashtable(getIdentityHash);
    if (assumptions.has(lit)) premises.add(lit);
    else {
      if (!this.extractAssumptions(lit, premises)) return false;
      this.solver.addAssumption(lit);
    }
    if (unfixed.has(lit >> 1)) {
      this.consequences.push([lit, ...premises]);
      unfixed.remove(lit >> 1);
    }
    this.antecedents.set(lit >> 1, premises);
    return true;
  }

  private extractFixedConsequence(lit: number, assumptions: TrackedSet, unfixed: TrackedSet) {
    this.todo.push(lit);
    while (this.todo.length > 0)
      if (this.extractFixedConsequence1(this.todo[this.todo.length - 1], assumptions, unfixed))
        this.todo.pop();
  }

  private extractFixedConsequences(
    unfixedLits: TrackedSet,
    assumptions: TrackedSet,
    unfixedVars: TrackedSet,
  ) {
    const solver = this.solver;
    for (const lit of unfixedLits.items)
      if (solver.lvl(lit) <= 1 && solver.value(lit) === L_TRUE)
        this.extractFixedConsequence(lit, assumptions, unfixedVars);
  }

  private deleteUnfixed(unfixedLits: TrackedSet, unfixedVars: TrackedSet) {
    const kept = new TrackedSet();
    for (const lit of unfixedLits.items)
      if (this.solver.value(lit) === L_TRUE) kept.insert(lit);
      else unfixedVars.remove(lit >> 1);
    return kept;
  }

  private updateUnfixedLiterals(unfixedLits: TrackedSet, unfixedVars: TrackedSet) {
    for (const lit of unfixedLits.items.filter((item) => !unfixedVars.has(item >> 1)))
      unfixedLits.remove(lit);
  }

  run(asms: readonly number[], lits: readonly number[]) {
    const solver = this.solver;
    let unfixedLits = new TrackedSet(lits);
    const assumptions = new TrackedSet(asms);
    const unfixedVars = new TrackedSet(lits.map((lit) => lit >> 1));
    solver.popToBaseLevel();
    if (solver.isInconsistent) return L_FALSE;
    solver.initSearch();
    solver.propagate(false);
    if (solver.isInconsistent) return L_FALSE;
    solver.initAssumptions(asms.length > 0 ? asms : [2 * solver.mkVar(true, false)]);
    solver.propagate(false);
    if (solver.checkInconsistent()) return L_FALSE;
    this.extractFixedConsequences(unfixedLits, assumptions, unfixedVars);
    this.updateUnfixedLiterals(unfixedLits, unfixedVars);
    while (unfixedLits.items.length > 0) {
      if (solver.scopeLvl > solver.searchLvl) solver.pop(solver.scopeLvl - solver.searchLvl);
      solver.propagate(false);
      solver.checkpoint();
      let numResolves = 0;
      let status = L_TRUE;
      for (const lit of unfixedLits.items) {
        if (solver.value(lit) !== L_UNDEF) {
          if (solver.lvl(lit) <= 1 && solver.value(lit) === L_TRUE)
            this.extractFixedConsequence(lit, assumptions, unfixedVars);
          continue;
        }
        solver.push();
        solver.assignScoped(lit ^ 1);
        solver.propagate(false);
        while (solver.isInconsistent) {
          if (!solver.resolveConflict()) {
            solver.isInconsistent = false;
            status = L_UNDEF;
            break;
          }
          solver.propagate(false);
          numResolves++;
        }
      }
      this.extractFixedConsequences(unfixedLits, assumptions, unfixedVars);
      if (status === L_TRUE) {
        if (solver.scopeLvl === solver.searchLvl && numResolves > 0) status = L_UNDEF;
        else {
          status = solver.boundedSearch();
          if (status === L_UNDEF) {
            solver.doRestart(true);
            solver.propagate(false);
          }
          this.extractFixedConsequences(unfixedLits, assumptions, unfixedVars);
        }
      }
      if (status === L_FALSE) solver.isInconsistent = false;
      if (status === L_TRUE) unfixedLits = this.deleteUnfixed(unfixedLits, unfixedVars);
      this.updateUnfixedLiterals(unfixedLits, unfixedVars);
    }
    return L_TRUE;
  }
}

// The SAT solver's get_consequences: each consequence is a fixed literal followed by the
// assumptions it depends on.
export const getConsequences = (
  solver: Solver,
  asms: readonly number[],
  vars: readonly number[],
) => {
  const finder = new ConsequenceFinder(solver);
  const result = solver.isModelCurrent ? L_TRUE : solver.check(asms);
  if (result !== L_TRUE) return { result, consequences: finder.consequences };
  const model = solver.model.slice();
  const lits = vars.flatMap((boolVar) =>
    model[boolVar] === L_TRUE ? [2 * boolVar] : model[boolVar] === L_FALSE ? [2 * boolVar + 1] : [],
  );
  const found = finder.run(asms, lits);
  solver.model = model;
  solver.isModelCurrent = model.length > 0;
  return { result: found, consequences: finder.consequences };
};
