// Ported from Z3 (src/nlsat/nlsat_solver.cpp, src/nlsat/nlsat_justification.h), MIT license, see
// z3-license.txt. Only Z3's default nlsat parameters are ported, so nlsat_simplify and the bounds
// of eliminated variables are not. The search counts its steps against the resource limit, but not
// the memory, which Z3 also bounds by max_memory.
import { SmtCanceledError, SmtInvariantError } from "../../../../errors";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { type Dependency, linearize, mkJoin, mkLeaf } from "../lp/dependency";
import { RandomGen } from "../random-gen";
import { Rational } from "../rational";
import type { ResourceLimit } from "../rlimit";
import { AlgebraicManager, Anum } from "./algebraic";
import { AtomTable, FALSE_LITERAL, ScopedLiterals, TRUE_LITERAL } from "./atoms";
import { Evaluator } from "./evaluator";
import { Explain } from "./explain";
import type { IntervalSet } from "./interval-set";
import { NULL_VAR, type Polynomial, PolynomialCache, PolynomialManager } from "./polynomial";
import { type Clause, type IneqAtom, type IneqKind, isIneqAtom, type RootKind } from "./types";

// Past every Boolean variable.
const NULL_BOOL_VAR = Infinity;

const RESTART_THRESHOLD = 10000;

type Justification =
  | { kind: "decision" }
  | { kind: "clause"; clause: Clause }
  | { kind: "lazy"; literals: number[]; clauses: Clause[] };

const DECISION: Justification = { kind: "decision" };

type Trail =
  | { kind: "assignment"; boolVar: number }
  | { kind: "infeasible"; old: IntervalSet | null }
  | { kind: "level" }
  | { kind: "stage" }
  | { kind: "eq"; old: IneqAtom | null };

export class NlsatSolver {
  readonly pm = new PolynomialManager();
  readonly am = new AlgebraicManager();
  private cache = new PolynomialCache(this.pm);
  private bvalues: number[] = [];
  private levels: number[] = [];
  private justifications: (Justification | null)[] = [];
  private bwatches: Clause[][] = [];
  private isDead: boolean[] = [];
  private atoms = new AtomTable(this.pm, this.cache, {
    onMk: (boolVar) => {
      this.bvalues[boolVar] = L_UNDEF;
      this.levels[boolVar] = Infinity;
      this.justifications[boolVar] = null;
      this.bwatches[boolVar] = [];
      this.isDead[boolVar] = false;
    },
    onDelete: (boolVar) => {
      this.isDead[boolVar] = true;
      this.bvalues[boolVar] = L_UNDEF;
    },
  });
  private assignment: (Anum | undefined)[] = [];
  private evaluator = new Evaluator(this.pm, this.am, this.assignment);
  private ism = this.evaluator.ism;
  private clauses: Clause[] = [];
  private learned: Clause[] = [];
  private nextClauseId = 0;
  private isInt: boolean[] = [];
  private watches: Clause[][] = [];
  private infeasible: (IntervalSet | null)[] = [];
  private var2eq: (IneqAtom | null)[] = [];
  // perm: internal to external variables. invPerm: external to internal.
  private perm: number[] = [];
  private invPerm: number[] = [];
  private explain = new Explain(this.pm, this.am, this.cache, {
    atoms: this.atoms,
    sample: this.assignment,
    getValue: (literal) => this.value(literal),
    var2eq: this.var2eq,
  });
  private bk = 0;
  private xk = NULL_VAR;
  private scopeLevel = 0;
  private trail: Trail[] = [];
  private marks: boolean[] = [];
  private markCount = 0;
  private lemma = new ScopedLiterals(this.atoms);
  private lazyClause = new ScopedLiterals(this.atoms);
  private lemmaAssumptions: Dependency = null;
  private randomSeed = 0;
  private isReordered = false;
  private maxVar = NULL_VAR;
  private nextTag = 0;
  maxConflicts = Infinity;
  isReordering = true;
  readonly stats = {
    conflicts: 0,
    restarts: 0,
    propagations: 0,
    decisions: 0,
    stages: 0,
    irrationalAssignments: 0,
  };

  // Z3 sets the solver's own budget with a scoped_rlimit on a child limit.
  steps = 0;

  constructor(
    private limit: ResourceLimit | null = null,
    private budget = Infinity,
  ) {
    // mk_true_bvar: the clause [true], whose literal the first Boolean stage assigns.
    this.mkClause([TRUE_LITERAL], false, null);
  }

  setSeed(seed: number) {
    this.randomSeed = seed;
    this.ism.setSeed(seed);
  }

  private checkpoint() {
    this.steps++;
    if ((this.limit !== null && !this.limit.inc()) || this.steps > this.budget)
      throw new SmtCanceledError();
  }

  mkVar(isInt: boolean) {
    const variable = this.isInt.length;
    this.isInt.push(isInt);
    this.watches.push([]);
    this.infeasible.push(null);
    this.var2eq.push(null);
    this.perm.push(variable);
    this.invPerm.push(variable);
    return variable;
  }

  mkIneqLiteral(kind: IneqKind, polynomials: readonly Polynomial[], isEven: readonly boolean[]) {
    return this.atoms.mkIneqLiteral(kind, polynomials, isEven);
  }

  getAtom(literal: number) {
    return this.atoms.getAtom(literal);
  }

  mkBoolVar() {
    return this.atoms.mkBoolVar();
  }

  mkRootAtom(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    return this.atoms.mkRootAtom(kind, variable, index, polynomial);
  }

  getBoolValue(boolVar: number) {
    return this.bvalues[boolVar];
  }

  setMaxVar(variable: number) {
    this.maxVar = variable;
  }

  getMaxVarSup() {
    if (this.maxVar === NULL_VAR || this.assignment[this.maxVar] === undefined) return null;
    return this.ism.queryMaxInComplement(this.infeasible[this.maxVar]);
  }

  mkExternalClause(literals: readonly number[], assumption: number | null) {
    this.mkClause(literals, false, assumption === null ? null : mkLeaf(assumption));
  }

  // Zero when unassigned.
  getValue(variable: number) {
    return this.assignment[variable] ?? new Anum(Rational.zero);
  }

  getCore() {
    return linearize([this.lemmaAssumptions]);
  }

  private getMaxVar(clause: Clause) {
    let result = NULL_VAR;
    for (const literal of clause.literals) {
      const atom = this.atoms.getAtom(literal);
      if (atom !== null && (result === NULL_VAR || atom.maxVar > result)) result = atom.maxVar;
    }
    return result;
  }

  private getClauseDegree(clause: Clause) {
    if (this.getMaxVar(clause) === NULL_VAR) return 0;
    let max = 0;
    for (const literal of clause.literals) {
      const atom = this.atoms.getAtom(literal);
      if (atom !== null) max = Math.max(max, this.atoms.getDegree(atom));
    }
    return max;
  }

  // lit_lt: Boolean literals first, then by maximal variable, degree, inequalities before
  // equations, and index.
  private compareLiterals(first: number, second: number) {
    const firstAtom = this.atoms.getAtom(first);
    const secondAtom = this.atoms.getAtom(second);
    if (firstAtom === null || secondAtom === null) {
      if (firstAtom === null && secondAtom === null) return first - second;
      return firstAtom === null ? -1 : 1;
    }
    if (firstAtom.maxVar !== secondAtom.maxVar) return firstAtom.maxVar - secondAtom.maxVar;
    const firstDegree = this.atoms.getDegree(firstAtom);
    const secondDegree = this.atoms.getDegree(secondAtom);
    if (firstDegree !== secondDegree) return firstDegree - secondDegree;
    const isFirstEq = firstAtom.kind === "EQ";
    const isSecondEq = secondAtom.kind === "EQ";
    if (isFirstEq !== isSecondEq) return isFirstEq ? 1 : -1;
    return first - second;
  }

  private mkClause(literals: readonly number[], isLearned: boolean, assumptions: Dependency) {
    const clause: Clause = {
      id: this.nextClauseId++,
      literals: literals.length === 0 ? [FALSE_LITERAL] : [...literals],
      isLearned,
      assumptions,
      isActive: false,
    };
    for (const literal of clause.literals) this.atoms.incRef(literal);
    clause.literals.sort((first, second) => this.compareLiterals(first, second));
    (isLearned ? this.learned : this.clauses).push(clause);
    this.addClauseToWatches(clause);
    return clause;
  }

  private addClauseToWatches(clause: Clause) {
    const variable = this.getMaxVar(clause);
    if (variable !== NULL_VAR) this.watches[variable].push(clause);
    else this.bwatches[Math.max(...clause.literals.map((literal) => literal >> 1))].push(clause);
  }

  private delClause(clause: Clause) {
    const variable = this.getMaxVar(clause);
    const watches =
      variable !== NULL_VAR
        ? this.watches[variable]
        : this.bwatches[Math.max(...clause.literals.map((literal) => literal >> 1))];
    const index = watches.indexOf(clause);
    if (index !== -1) watches.splice(index, 1);
    for (const literal of clause.literals) this.atoms.decRef(literal);
  }

  private unassignBoolVar(boolVar: number) {
    this.bvalues[boolVar] = L_UNDEF;
    this.levels[boolVar] = Infinity;
    this.justifications[boolVar] = null;
    if (this.atoms.atoms[boolVar] === null && boolVar < this.bk) this.bk = boolVar;
  }

  private undoUntil(predicate: () => boolean) {
    while (predicate() && this.trail.length > 0) {
      const entry = this.trail[this.trail.length - 1];
      switch (entry.kind) {
        case "assignment":
          this.unassignBoolVar(entry.boolVar);
          break;
        case "infeasible":
          if (this.xk !== NULL_VAR && this.xk < this.infeasible.length)
            this.infeasible[this.xk] = entry.old;
          break;
        case "stage":
          if (this.xk === 0) this.xk = NULL_VAR;
          else if (this.xk !== NULL_VAR) this.assignment[--this.xk] = undefined;
          break;
        case "level":
          this.scopeLevel--;
          break;
        case "eq":
          if (this.xk !== NULL_VAR && this.var2eq.length > this.xk)
            this.var2eq[this.xk] = entry.old;
          break;
      }
      this.trail.pop();
    }
  }

  private undoUntilLevel(level: number) {
    this.undoUntil(() => this.scopeLevel > level);
  }

  private undoUntilStage(variable: number) {
    this.undoUntil(() => this.xk !== variable);
  }

  private newLevel() {
    this.scopeLevel++;
    this.trail.push({ kind: "level" });
  }

  private getAssignedValue(literal: number) {
    const value = this.bvalues[literal >> 1];
    return (literal & 1) === 1 ? -value : value;
  }

  private setLiteralToTrue(literal: number, justification: Justification) {
    if (justification.kind === "decision") this.stats.decisions++;
    else this.stats.propagations++;
    const boolVar = literal >> 1;
    this.bvalues[boolVar] = (literal & 1) === 1 ? L_FALSE : L_TRUE;
    this.levels[boolVar] = this.scopeLevel;
    this.justifications[boolVar] = justification;
    this.trail.push({ kind: "assignment", boolVar });
    this.updateEq(boolVar, justification);
  }

  private decideLiteral(literal: number) {
    this.newLevel();
    this.setLiteralToTrue(literal, DECISION);
  }

  private value(literal: number) {
    const assigned = this.getAssignedValue(literal);
    if (assigned !== L_UNDEF) return assigned;
    const atom = this.atoms.getAtom(literal);
    if (atom === null || this.assignment[atom.maxVar] === undefined) return L_UNDEF;
    return this.evaluator.eval(atom, (literal & 1) === 1) ? L_TRUE : L_FALSE;
  }

  private isClauseSatisfied(clause: Clause) {
    return clause.literals.some((literal) => this.value(literal) === L_TRUE);
  }

  private processBooleanClause(clause: Clause) {
    let undefCount = 0;
    let selected = -1;
    for (const [index, literal] of clause.literals.entries()) {
      if (this.value(literal) === L_FALSE) continue;
      undefCount++;
      if (selected === -1) selected = index;
    }
    if (undefCount === 0) return false;
    if (undefCount === 1)
      this.setLiteralToTrue(clause.literals[selected], { kind: "clause", clause });
    else this.decideLiteral(clause.literals[selected]);
    return true;
  }

  private propagate(literal: number, set: IntervalSet | null, isLiteralIncluded = true) {
    const justifications = this.ism.getJustifications(set);
    const literals = [...justifications.literals];
    if (isLiteralIncluded) literals.push(literal ^ 1);
    this.setLiteralToTrue(literal, { kind: "lazy", literals, clauses: justifications.clauses });
  }

  private updateInfeasible(set: IntervalSet | null) {
    const old = this.infeasible[this.xk];
    this.trail.push({ kind: "infeasible", old });
    this.infeasible[this.xk] = this.ism.mkUnion(set, old);
  }

  private updateEq(boolVar: number, justification: Justification) {
    if (this.bvalues[boolVar] !== L_TRUE) return;
    const atom = this.atoms.atoms[boolVar];
    if (
      atom === null ||
      !isIneqAtom(atom) ||
      atom.kind !== "EQ" ||
      atom.polynomials.length > 1 ||
      atom.isEven[0]
    )
      return;
    if (justification.kind === "clause" && justification.clause.assumptions !== null) return;
    if (
      justification.kind === "lazy" &&
      (justification.clauses.length > 0 || justification.literals.length > 0)
    )
      return;
    const old = this.var2eq[this.xk];
    if (old !== null && this.atoms.getDegree(old) <= this.atoms.getDegree(atom)) return;
    this.trail.push({ kind: "eq", old });
    this.var2eq[this.xk] = atom;
  }

  private processArithClause(clause: Clause) {
    let undefCount = 0;
    let selected = -1;
    let selectedSet: IntervalSet | null = null;
    const xkSet = this.infeasible[this.xk];
    for (const [index, literal] of clause.literals.entries()) {
      this.checkpoint();
      if (this.value(literal) === L_FALSE) continue;
      if (this.value(literal) === L_TRUE) return true;
      const atom = this.atoms.getAtom(literal)!;
      const set = this.evaluator.infeasibleIntervals(atom, (literal & 1) === 1, clause);
      if (set === null) {
        this.propagate(literal, null);
        return true;
      }
      if (this.ism.isFull(set)) {
        this.propagate(literal ^ 1, null);
        continue;
      }
      if (this.ism.subset(set, xkSet)) {
        this.propagate(literal, xkSet);
        return true;
      }
      const union = this.ism.mkUnion(set, xkSet);
      if (this.ism.isFull(union)) {
        this.propagate(literal ^ 1, union, false);
        continue;
      }
      undefCount++;
      if (selected === -1) {
        selected = index;
        selectedSet = set;
      }
    }
    if (undefCount === 0) return false;
    if (undefCount === 1)
      this.setLiteralToTrue(clause.literals[selected], { kind: "clause", clause });
    else this.decideLiteral(clause.literals[selected]);
    this.updateInfeasible(selectedSet);
    return true;
  }

  private processClause(clause: Clause) {
    if (this.isClauseSatisfied(clause)) return true;
    return this.xk === NULL_VAR
      ? this.processBooleanClause(clause)
      : this.processArithClause(clause);
  }

  private processClauses(clauses: readonly Clause[]) {
    for (const clause of clauses) if (!this.processClause(clause)) return clause;
    return null;
  }

  private peekNextBoolVar() {
    for (; this.bk < this.atoms.atoms.length; this.bk++)
      if (
        !this.isDead[this.bk] &&
        this.atoms.atoms[this.bk] === null &&
        this.bvalues[this.bk] === L_UNDEF
      )
        return;
    this.bk = NULL_BOOL_VAR;
  }

  private newStage() {
    this.stats.stages++;
    this.trail.push({ kind: "stage" });
    this.xk = this.xk === NULL_VAR ? 0 : this.xk + 1;
  }

  private selectWitness() {
    const set = this.infeasible[this.xk];
    const witness =
      (this.xk === this.maxVar ? this.ism.pickMaxInComplement(set) : null) ??
      this.ism.pickInComplement(set, true);
    if (!this.am.isRational(witness)) this.stats.irrationalAssignments++;
    this.assignment[this.xk] = witness;
  }

  private search() {
    this.bk = 0;
    this.xk = NULL_VAR;
    while (true) {
      if (this.stats.conflicts > 0 && this.stats.conflicts % RESTART_THRESHOLD === 0)
        this.reorderAtRestart();
      if (this.xk === NULL_VAR) {
        this.peekNextBoolVar();
        if (this.bk === NULL_BOOL_VAR) this.newStage();
      } else this.newStage();
      if (this.bk === NULL_BOOL_VAR && this.xk >= this.isInt.length) return L_TRUE;
      while (true) {
        this.checkpoint();
        const conflict = this.processClauses(
          this.xk === NULL_VAR ? this.bwatches[this.bk] : this.watches[this.xk],
        );
        if (conflict === null) break;
        if (!this.resolve(conflict)) return L_FALSE;
        if (this.stats.conflicts >= this.maxConflicts) return L_UNDEF;
      }
      if (this.xk === NULL_VAR) {
        if (this.bvalues[this.bk] === L_UNDEF) {
          this.decideLiteral(2 * this.bk + 1);
          this.bk++;
        }
      } else this.selectWitness();
    }
  }

  private gc() {
    if (this.learned.length <= 4 * this.clauses.length) return;
    this.resetWatches();
    this.atoms.reinitCache();
    let kept = 0;
    for (const [index, clause] of this.learned.entries()) {
      if (index - kept < this.clauses.length && clause.literals.length > 1 && !clause.isActive)
        this.delClause(clause);
      else {
        this.learned[kept++] = clause;
        clause.isActive = false;
      }
    }
    this.learned.length = kept;
    this.reattachArithClauses(this.clauses);
    this.reattachArithClauses(this.learned);
  }

  private undoToBase() {
    this.initSearch();
    this.bk = 0;
    this.xk = NULL_VAR;
  }

  private reorderAtRestart() {
    this.undoToBase();
    this.stats.restarts++;
    this.stats.conflicts++;
    if (this.isReordered) this.restoreOrder();
    this.applyReorder();
  }

  private tryReorder() {
    this.gc();
    if (this.stats.restarts % 10 !== 0) return;
    if (this.isReordered) this.restoreOrder();
    this.applyReorder();
  }

  private searchCheck() {
    this.stats.conflicts = 0;
    this.stats.restarts = 0;
    while (true) {
      const result = this.search();
      if (result !== L_TRUE) return result;
      this.stats.restarts++;
      this.tryReorder();
      const bounds: [number, Rational][] = [];
      for (let variable = 0; variable < this.isInt.length; variable++) {
        const value = this.assignment[variable];
        if (!this.isInt[variable] || value === undefined || this.am.isInt(value)) continue;
        const below = this.am.intLt(value).value;
        if (!(below instanceof Rational)) continue;
        let lower = below;
        while (true) {
          lower = lower.add(Rational.one);
          if (this.am.compare(value, new Anum(lower)) <= 0) {
            lower = lower.sub(Rational.one);
            break;
          }
        }
        bounds.push([variable, lower]);
      }
      if (bounds.length === 0) return result;
      this.initSearch();
      for (const bound of bounds) {
        this.lemma.reset();
        const below = this.pm.mkLinear([1n], [bound[0]], -bound[1].num);
        this.lemma.push(this.mkIneqLiteral("GT", [below], [false]) ^ 1);
        const above = this.pm.mkLinear([1n], [bound[0]], -bound[1].num - 1n);
        this.lemma.push(this.mkIneqLiteral("LT", [above], [false]) ^ 1);
        this.mkClause(this.lemma.literals, true, null);
      }
    }
  }

  private initSearch() {
    this.undoUntil(() => true);
    while (this.scopeLevel > 0) this.scopeLevel--;
    this.xk = NULL_VAR;
    this.bvalues.fill(L_UNDEF);
    this.assignment.length = 0;
  }

  // The variables are reordered for the search and restored after it.
  check() {
    this.initSearch();
    this.explain.isFullDimensional = this.clauses.every((clause) =>
      clause.literals.every((literal) => this.isFullDimensional(literal)),
    );
    const isReordered = this.canReorder();
    if (isReordered) this.reorderHeuristically();
    for (const watches of this.watches) this.sortClausesByDegree(watches);
    const result = this.searchCheck();
    if (isReordered) this.restoreOrder();
    return result;
  }

  private isFullDimensional(literal: number) {
    const atom = this.atoms.getAtom(literal);
    if (atom === null) return true;
    const isNeg = (literal & 1) === 1;
    switch (atom.kind) {
      case "EQ":
      case "ROOT_EQ":
      case "ROOT_LE":
      case "ROOT_GE":
        return isNeg;
      default:
        return !isNeg;
    }
  }

  private sortClausesByDegree(clauses: Clause[]) {
    if (clauses.length <= 1) return;
    const degrees = clauses.map((clause) => this.getClauseDegree(clause));
    const order = clauses
      .map((_clause, index) => index)
      .sort((first, second) => degrees[first] - degrees[second] || first - second);
    const sorted = order.map((index) => clauses[index]);
    for (let index = 0; index < sorted.length; index++) clauses[index] = sorted[index];
  }

  private projectModel() {
    const cube = new ScopedLiterals(this.atoms);
    const seen = new Set<number>();
    for (const clause of this.clauses) {
      this.checkpoint();
      const witness = clause.literals.find((literal) => this.value(literal) === L_TRUE);
      if (witness === undefined) throw new SmtInvariantError("nlsat's model falsifies a clause");
      if (this.atoms.getAtom(witness) === null || seen.has(witness >> 1)) continue;
      seen.add(witness >> 1);
      cube.push(witness);
    }
    // Strict sector bounds keep every point of the projection extensible.
    this.explain.isFullDimensional = false;
    for (let variable = this.isInt.length - 1; variable >= 1 && cube.size > 0; variable--) {
      this.checkpoint();
      const projected = new ScopedLiterals(this.atoms);
      this.explain.projectVariable(variable, cube.literals, projected);
      cube.reset();
      for (const literal of projected.literals) cube.push(literal);
      projected.reset();
    }
    return cube;
  }

  private getCubeSup(cube: ScopedLiterals) {
    let infeasible: IntervalSet | null = null;
    for (const literal of cube.literals) {
      const excluded = this.evaluator.infeasibleIntervals(
        this.atoms.getAtom(literal)!,
        (literal & 1) === 1,
        null,
      );
      infeasible = this.ism.mkUnion(infeasible, excluded);
    }
    if (this.ism.isFull(infeasible))
      throw new SmtInvariantError("nlsat's model projection is inconsistent");
    return this.ism.queryMaxInComplement(infeasible);
  }

  checkLimit(variable: number, bound: Anum | null) {
    if (variable !== 0 || this.invPerm[0] !== 0)
      throw new SmtInvariantError("nlsat checks the limit of the first variable");
    if (this.isInt.some(Boolean)) return { status: L_UNDEF, coverSup: null };
    const limit = bound === null ? null : this.am.copy(bound);
    const savedMaxVar = this.maxVar;
    this.maxVar = variable;
    const tag = --this.nextTag;
    let coverSup: Anum | null = null;
    try {
      if (limit !== null) {
        const isRational = this.am.isRational(limit);
        const polynomial = this.pm.fromCoeffs(this.am.getPolynomial(limit), variable);
        const upper = isRational
          ? this.mkIneqLiteral("LT", [polynomial], [false])
          : 2 * this.mkRootAtom("ROOT_LT", variable, this.am.getRootIndex(limit), polynomial);
        this.mkExternalClause([upper], tag);
      }
      while (true) {
        this.checkpoint();
        const status = this.check();
        if (status !== L_TRUE) return { status, coverSup };
        const cube = this.projectModel();
        const sup = this.getCubeSup(cube);
        if (
          limit === null
            ? sup === null
            : sup !== null && !sup.isAttained && this.am.compare(sup.sup, limit) === 0
        )
          return { status: L_TRUE, coverSup: null };
        if (sup !== null && (coverSup === null || this.am.compare(sup.sup, coverSup) > 0))
          coverSup = sup.sup;
        this.mkExternalClause(
          cube.literals.map((literal) => literal ^ 1),
          tag,
        );
        cube.reset();
      }
    } finally {
      this.maxVar = savedMaxVar;
      this.retract(tag);
    }
  }

  retract(tag: number, maxLemmas = Infinity) {
    this.initSearch();
    const isTagged = (clause: Clause) => {
      const isFound = linearize([clause.assumptions]).includes(tag);
      if (isFound) this.delClause(clause);
      return !isFound;
    };
    this.clauses = this.clauses.filter(isTagged);
    this.learned = this.learned.filter(isTagged);
    if (this.learned.length <= maxLemmas) return;
    this.learned.sort((first, second) => first.literals.length - second.literals.length);
    for (const clause of this.learned.splice(maxLemmas)) this.delClause(clause);
  }

  // Like Z3, only a falsified clause restores the assignment.
  checkAssignment(values: readonly (Anum | undefined)[]) {
    const saved = this.assignment.map((value) =>
      value === undefined ? undefined : this.am.copy(value),
    );
    this.setAssignment(values);
    let best: number | null = null;
    let result = L_TRUE;
    for (const clause of this.clauses) {
      const literalValues = clause.literals.map((literal) => this.value(literal));
      if (literalValues.some((value) => value === L_TRUE)) continue;
      if (!literalValues.every((value) => value === L_FALSE)) {
        result = L_UNDEF;
        continue;
      }
      for (const literal of clause.literals)
        if (
          best === null ||
          this.atoms.getDegree(this.atoms.getAtom(literal)!) <
            this.atoms.getDegree(this.atoms.getAtom(best)!)
        )
          best = literal;
    }
    if (best === null) return { result, clause: [] };
    this.lazyClause.reset();
    this.explain.computeLinearExplanation([best], this.lazyClause);
    const clause = [...this.lazyClause.literals, best ^ 1];
    this.setAssignment(saved);
    return { result: L_FALSE, clause };
  }

  private setAssignment(values: readonly (Anum | undefined)[]) {
    this.assignment.length = 0;
    for (const [variable, value] of values.entries())
      this.assignment[variable] = value === undefined ? undefined : this.am.copy(value);
  }

  private processAntecedent(antecedent: number) {
    this.checkpoint();
    const boolVar = antecedent >> 1;
    if (this.getAssignedValue(antecedent) === L_UNDEF) {
      this.checkpoint();
      if (!this.marks[boolVar]) {
        this.marks[boolVar] = true;
        this.lemma.push(antecedent);
      }
      return;
    }
    if (this.marks[boolVar]) return;
    this.marks[boolVar] = true;
    if (this.levels[boolVar] === this.scopeLevel && this.atoms.getMaxVar(antecedent) === this.xk)
      this.markCount++;
    else this.lemma.push(antecedent);
  }

  private resolveLiterals(boolVar: number, literals: readonly number[]) {
    for (const literal of literals) if (literal >> 1 !== boolVar) this.processAntecedent(literal);
  }

  private resolveClause(boolVar: number, clause: Clause) {
    clause.isActive = true;
    this.resolveLiterals(boolVar, clause.literals);
    this.lemmaAssumptions = mkJoin(clause.assumptions, this.lemmaAssumptions);
  }

  private resolveLazyJustification(boolVar: number, literals: number[], clauses: Clause[]) {
    this.lazyClause.reset();
    this.explain.computeConflictExplanation(literals, this.lazyClause);
    for (const literal of literals) this.lazyClause.push(literal ^ 1);
    this.checkpoint();
    this.resolveLiterals(boolVar, this.lazyClause.literals);
    for (const clause of clauses)
      this.lemmaAssumptions = mkJoin(clause.assumptions, this.lemmaAssumptions);
  }

  private resetMarks() {
    for (const literal of this.lemma.literals) this.marks[literal >> 1] = false;
  }

  private releaseMarks() {
    if (this.markCount > 0) {
      this.markCount = 0;
      this.marks.fill(false);
    } else this.resetMarks();
  }

  // False when the lemma is empty.
  private resolve(conflict: Clause) {
    let conflictClause = conflict;
    while (true) {
      this.stats.conflicts++;
      this.markCount = 0;
      this.lemma.reset();
      this.lemmaAssumptions = null;
      try {
        const lemma = this.learn(conflictClause);
        if (lemma === null) return false;
        if (lemma === true || this.processClause(lemma)) return true;
        conflictClause = lemma;
      } finally {
        this.releaseMarks();
      }
    }
  }

  // The body of resolve for one conflict: null for the empty lemma, true when the conflict clause
  // itself is the lemma and now propagates, else the learned clause.
  private learn(conflict: Clause): Clause | true | null {
    this.resolveClause(-1, conflict);
    let top = this.trail.length;
    let isDecision = false;
    while (true) {
      while (this.markCount > 0) {
        this.checkpoint();
        const entry = this.trail[top - 1];
        if (entry.kind === "assignment" && this.marks[entry.boolVar]) {
          const boolVar = entry.boolVar;
          this.markCount--;
          this.marks[boolVar] = false;
          const justification = this.justifications[boolVar]!;
          if (justification.kind === "clause") this.resolveClause(boolVar, justification.clause);
          else if (justification.kind === "lazy")
            this.resolveLazyJustification(boolVar, justification.literals, justification.clauses);
          else {
            isDecision = true;
            this.lemma.push(2 * boolVar + (this.bvalues[boolVar] === L_TRUE ? 1 : 0));
          }
        }
        top--;
      }
      if (isDecision) break;
      const literals = this.lemma.literals;
      if (literals.every((literal) => this.atoms.getMaxVar(literal) !== this.xk)) break;
      let maxLevel = 0;
      for (const literal of literals)
        if (this.getAssignedValue(literal) === L_FALSE)
          maxLevel = Math.max(maxLevel, this.levels[literal >> 1]);
      let kept = 0;
      for (const literal of literals) {
        const boolVar = literal >> 1;
        if (
          this.getAssignedValue(literal) === L_FALSE &&
          this.levels[boolVar] === maxLevel &&
          this.atoms.getMaxVar(literal) === this.xk
        ) {
          this.markCount++;
          continue;
        }
        this.lemma.set(kept++, literal);
      }
      this.lemma.shrink(kept);
      this.undoUntilLevel(maxLevel);
      top = this.trail.length;
    }
    if (this.lemma.size === 0) return null;
    this.resetMarks();
    const literals = this.lemma.literals;
    if (!isDecision) {
      let maxVar = NULL_VAR;
      for (const literal of literals) {
        const variable = this.atoms.getMaxVar(literal);
        if (variable !== NULL_VAR && (maxVar === NULL_VAR || variable > maxVar)) maxVar = variable;
      }
      this.undoUntilStage(maxVar);
      return this.mkClause(literals, true, this.lemmaAssumptions);
    }
    if (literals.every((literal) => this.atoms.getAtom(literal) === null)) {
      const boolVar = literals[literals.length - 1] >> 1;
      this.undoUntil(() => this.bvalues[boolVar] !== L_UNDEF);
    } else this.undoUntilLevel(this.findNewLevel(literals));
    if (
      literals.length === conflict.literals.length &&
      literals.every((literal, index) => literal === conflict.literals[index])
    ) {
      this.processClause(conflict);
      return true;
    }
    return this.mkClause(literals, true, this.lemmaAssumptions);
  }

  private findNewLevel(literals: readonly number[]) {
    let level = -1;
    for (const literal of literals.slice(0, -1))
      if (this.atoms.getMaxVar(literal) === this.xk)
        level = Math.max(level, this.levels[literal >> 1]);
    return level === -1 ? this.scopeLevel - 1 : level;
  }

  private canReorder() {
    return (
      this.isReordering &&
      this.maxVar === NULL_VAR &&
      [...this.learned, ...this.clauses].every((clause) =>
        clause.literals.every(
          (literal) => this.atoms.getAtom(literal)?.kind.startsWith("ROOT") !== true,
        ),
      )
    );
  }

  private applyReorder() {
    this.isReordered = false;
    if (!this.canReorder()) return;
    this.reorderHeuristically();
    this.isReordered = true;
  }

  // heuristic_reorder: higher maximal degree first, then more occurrences, then a random order.
  private reorderHeuristically() {
    const count = this.isInt.length;
    const maxDegrees = Array.from({ length: count }, () => 0);
    const occurrences = Array.from({ length: count }, () => 0);
    const collect = (polynomial: Polynomial) => {
      const variables = new Set(polynomial.ms.flatMap((monomial) => [...monomial.vars]));
      for (const variable of variables) {
        occurrences[variable]++;
        maxDegrees[variable] = Math.max(maxDegrees[variable], this.pm.degree(polynomial, variable));
      }
    };
    for (const clause of [...this.clauses, ...this.learned])
      for (const literal of clause.literals) {
        const atom = this.atoms.getAtom(literal);
        if (atom === null) continue;
        if (isIneqAtom(atom)) atom.polynomials.forEach(collect);
        else collect(atom.polynomial);
      }
    const shuffle = Array.from({ length: count }, (_value, index) => index);
    const random = new RandomGen(++this.randomSeed);
    for (let index = count; index-- > 0;) {
      const other = random.next() % (index + 1);
      [shuffle[index], shuffle[other]] = [shuffle[other], shuffle[index]];
    }
    const order = Array.from({ length: count }, (_value, index) => index).sort(
      (first, second) =>
        maxDegrees[second] - maxDegrees[first] ||
        occurrences[second] - occurrences[first] ||
        shuffle[first] - shuffle[second],
    );
    const permutation: number[] = [];
    for (const [position, variable] of order.entries()) permutation[variable] = position;
    this.reorder(permutation);
  }

  private reorder(permutation: readonly number[]) {
    let kept = 0;
    for (const clause of this.learned) {
      if (clause.literals.some((literal) => this.atoms.getAtom(literal)?.kind.startsWith("ROOT")))
        this.delClause(clause);
      else this.learned[kept++] = clause;
    }
    this.learned.length = kept;
    this.atoms.reinitCache();
    this.resetWatches();
    const assignment: (Anum | undefined)[] = [];
    for (const [variable, value] of this.assignment.entries())
      if (value !== undefined) assignment[permutation[variable]] = value;
    this.undoUntilStage(NULL_VAR);
    this.cache.reset();
    const invPerm = this.invPerm.map((variable) => permutation[variable]);
    for (const [external, internal] of invPerm.entries()) this.perm[internal] = external;
    const isInt = [...this.isInt];
    for (const [variable, flag] of isInt.entries()) this.isInt[permutation[variable]] = flag;
    this.invPerm = invPerm;
    const polynomials = new Set<Polynomial>();
    for (const atom of this.atoms.atoms) {
      if (atom === null || atom === undefined) continue;
      if (isIneqAtom(atom)) for (const polynomial of atom.polynomials) polynomials.add(polynomial);
      else polynomials.add(atom.polynomial);
    }
    this.pm.rename(permutation, polynomials);
    this.atoms.reinitCache();
    this.setAssignment(assignment);
    this.reattachArithClauses(this.clauses);
    this.reattachArithClauses(this.learned);
  }

  restoreOrder() {
    this.reorder([...this.perm]);
  }

  private resetWatches() {
    for (const watches of this.watches) watches.length = 0;
  }

  private reattachArithClauses(clauses: readonly Clause[]) {
    for (const clause of clauses) {
      const variable = this.getMaxVar(clause);
      if (variable !== NULL_VAR) this.watches[variable].push(clause);
    }
  }
}
