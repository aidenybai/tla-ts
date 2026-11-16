// Ported from Z3 (src/sat/smt/arith_solver.cpp), MIT license, see z3-license.txt.
import { mkBoundAtom, mkTermEqSides } from "../arith-terms";
import {
  FAMILY_ARITH,
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_REM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
} from "../ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { getImpliedKind, BoundPropagator, type ImpliedBound } from "../lp/bound-propagator";
import {
  type ConstraintKind,
  KIND_EQ,
  KIND_GE,
  KIND_GT,
  KIND_LE,
  KIND_LT,
  KIND_NE,
} from "../lp/constraints";
import { LP_FEASIBLE, LP_INFEASIBLE, LP_OPTIMAL, LP_UNBOUNDED } from "../lp/core-solver";
import { type Dependency, linearize, mkJoin, mkLeaf } from "../lp/dependency";
import type { Explanation } from "../lp/explanation";
import { IntSolver } from "../lp/int-solver";
import { NULL_LPVAR } from "../lp/lar-solver";
import type { LarTerm } from "../lp/lar-term";
import type { Ineq, Lemma } from "../lp/nla-types";
import { Impq } from "../lp/numeric-pair";
import { randomUpdate } from "../lp/random-updater";
import { Anum } from "../nlsat/algebraic";
import type { ProtoModel } from "../proto-model";
import { Rational } from "../rational";
import { CR_CONTINUE, CR_DONE, CR_GIVEUP } from "../sat/solver";
import type { ArithBound } from "./arith-internalize";
import { ArithAxioms } from "./arith-axioms";
import { type Enode, NULL_THEORY_VAR } from "./egraph";
import { addDependency, type Dependencies } from "./th-solver";

const SMALL_LEMMA_SIZE = 16;

interface TermBound {
  readonly constraint: number;
  readonly value: Rational;
}

// lp_api::bound::get_value: the value the bound asserts when its atom has the polarity isTrue.
const getBoundValue = (bound: ArithBound, isTrue: boolean) => {
  if (isTrue !== ((bound.lit & 1) === 1)) return new Impq(bound.value);
  if (bound.isInt)
    return new Impq(bound.isLower ? bound.value.sub(Rational.one) : bound.value.add(Rational.one));
  return new Impq(bound.value, bound.isLower ? Rational.minusOne : Rational.one);
};

const compareToRational = (value: Impq, rational: Rational) => value.compare(new Impq(rational));

export class ArithSolver extends ArithAxioms {
  private assertedLits: number[] = [];
  private assertedQhead = 0;
  private lia = new IntSolver(this.solver);
  private bp = new BoundPropagator(this.solver, {
    columnIsInteresting: (column) => this.columnIsInteresting(column),
    boundIsInteresting: (column, kind, value) => this.boundIsInteresting(column, kind, value),
    isEqual: (first, second) => this.isEqual(first, second),
    addEq: (first, second, explanation, isFixed) => this.addEq(first, second, explanation, isFixed),
  });
  private lowerTerms: (TermBound | undefined)[] = [];
  private upperTerms: (TermBound | undefined)[] = [];
  private isModelInitialized = false;
  private isUsingNraModel = false;
  private assumeEqCandidates: [number, number][] = [];
  private assumeEqHead = 0;

  override asserted(lit: number) {
    this.forcePush();
    this.assertedLits.push(lit);
    const bound = this.boolVar2bound.get(lit >> 1);
    if (bound !== undefined) this.updateUnassignedBounds(bound.thVar, -1);
  }

  override unitPropagate() {
    this.isModelInitialized = false;
    if (
      this.solver.columnsWithChangedBounds.size === 0 &&
      !this.isNewEq &&
      this.newBounds.length === 0 &&
      this.assertedQhead === this.assertedLits.length
    )
      return false;
    this.isNewEq = false;
    this.flushBoundAxioms();
    this.propagateNla();
    const s = this.s;
    const limit = this.manager.limit;
    const qhead = this.assertedQhead;
    while (this.assertedQhead < this.assertedLits.length && !s.isInconsistent && limit.inc()) {
      const lit = this.assertedLits[this.assertedQhead];
      const bound = this.boolVar2bound.get(lit >> 1);
      if (bound !== undefined) this.assertBound((lit & 1) === (bound.lit & 1), bound);
      this.assertedQhead++;
    }
    if (s.isInconsistent) return true;
    const status = this.makeFeasible();
    if (!limit.inc()) return false;
    if (status === L_FALSE) this.setInfeasibilityConflict();
    else if (status === L_TRUE) {
      this.propagateBasicBounds(qhead);
      this.propagateBoundsWithLpSolver();
    }
    return true;
  }

  private propagateBasicBounds(start: number) {
    for (let qhead = start; qhead < this.assertedQhead && !this.s.isInconsistent; qhead++) {
      const lit = this.assertedLits[qhead];
      const bound = this.boolVar2bound.get(lit >> 1);
      if (bound !== undefined) this.propagateBound(lit, bound);
    }
  }

  private propagateBound(lit1: number, bound: ArithBound) {
    const isTrue = (lit1 & 1) === 0;
    const thVar = bound.thVar;
    const value = getBoundValue(bound, isTrue);
    const isSamePolarity = (bound.lit & 1) === (lit1 & 1);
    const bounds = this.bounds[thVar];
    if (bounds.length === 1 || this.unassignedBounds[thVar] === 0) return;
    const isStrict = isSamePolarity || bound.isInt;
    let lit2: number;
    if (isSamePolarity === bound.isLower) {
      let glb: ArithBound | undefined;
      for (const other of bounds) {
        if (other === bound) continue;
        if (glb !== undefined && glb.value.compare(other.value) >= 0) continue;
        const comparison = compareToRational(value, other.value);
        if (isStrict ? comparison > 0 : comparison >= 0) glb = other;
      }
      if (glb === undefined) return;
      lit2 = glb.isLower ? glb.lit : glb.lit ^ 1;
    } else {
      let lub: ArithBound | undefined;
      for (const other of bounds) {
        if (other === bound) continue;
        if (lub !== undefined && other.value.compare(lub.value) >= 0) continue;
        const comparison = compareToRational(value, other.value);
        if (isStrict ? comparison < 0 : comparison <= 0) lub = other;
      }
      if (lub === undefined) return;
      lit2 = lub.isLower ? lub.lit ^ 1 : lub.lit;
    }
    this.resetEvidence();
    this.core.push(lit1);
    this.assign(lit2, this.core, this.eqs);
  }

  private propagateBoundsWithLpSolver() {
    this.bp.init();
    this.bp.propagateBoundsForTouchedRows();
    const limit = this.manager.limit;
    if (!limit.inc()) return;
    if (this.solver.status === LP_INFEASIBLE) {
      this.setInfeasibilityConflict();
      return;
    }
    for (const implied of this.bp.ibounds)
      if (limit.inc() && !this.s.isInconsistent) this.propagateLpSolverBound(implied);
  }

  private propagateLpSolverBound(implied: ImpliedBound) {
    const thVar = this.solver.getExternal(implied.column);
    if (thVar === NULL_THEORY_VAR) return;
    this.reserveBounds(thVar);
    if (this.unassignedBounds[thVar] === 0) return;
    const kind = getImpliedKind(implied);
    let isFirst = true;
    for (const bound of this.bounds[thVar]) {
      if (this.s.value(bound.lit) !== L_UNDEF) continue;
      const lit = this.isBoundImplied(kind, implied.bound, bound);
      if (lit === undefined) continue;
      if (isFirst) {
        isFirst = false;
        this.resetEvidence();
        this.explanation.clear();
        for (const entry of implied.explain())
          for (const constraint of linearize([entry[1]])) this.consume(entry[0], constraint);
      }
      this.assign(lit, this.core, this.eqs);
    }
  }

  private isBoundImplied(kind: ConstraintKind, value: Rational, bound: ArithBound) {
    const comparison = value.compare(bound.value);
    if ((kind === KIND_LE || kind === KIND_LT) && !bound.isLower && comparison <= 0)
      return bound.lit;
    if ((kind === KIND_GE || kind === KIND_GT) && bound.isLower && comparison >= 0)
      return bound.lit;
    if (kind === KIND_LE && bound.isLower && comparison < 0) return bound.lit ^ 1;
    if (kind === KIND_LT && bound.isLower && comparison <= 0) return bound.lit ^ 1;
    if (kind === KIND_GE && !bound.isLower && comparison > 0) return bound.lit ^ 1;
    if (kind === KIND_GT && !bound.isLower && comparison >= 0) return bound.lit ^ 1;
    return undefined;
  }

  private addEquality(column: number, value: Rational, explanation: Explanation) {
    const thVar = value.equals(Rational.one)
      ? this.oneVar
      : value.isZero()
        ? this.zeroVar
        : this.value2var.get(value.toString());
    if (thVar === undefined) return;
    if (this.solver.getExternal(column) < 0) return;
    this.addEq(this.registerVar(thVar), column, explanation, true);
  }

  private addEq(first: number, second: number, explanation: Explanation, isFixed: boolean) {
    if (this.s.isInconsistent) return false;
    const solver = this.solver;
    const v1 = solver.getExternal(first);
    const v2 = solver.getExternal(second);
    if (v1 === NULL_THEORY_VAR || v2 === NULL_THEORY_VAR) return false;
    if (this.isEqual(v1, v2)) return false;
    const manager = this.manager;
    const n1 = this.var2enodeOf(v1);
    const n2 = this.var2enodeOf(v2);
    const e1 = n1.owner;
    const e2 = n2.owner;
    if (
      !isFixed &&
      !manager.isNumeral(e1) &&
      !manager.isNumeral(e2) &&
      (manager.getOp(e1) === OP_ITE || manager.getOp(e2) === OP_ITE)
    )
      return false;
    if (manager.sorts[e1] !== manager.sorts[e2]) return false;
    this.resetEvidence();
    for (const constraint of explanation) this.setEvidence(constraint);
    this.propagateEq(this.core, this.eqs, n1, n2);
    return true;
  }

  private columnIsInteresting(column: number) {
    const thVar = this.solver.getExternal(column);
    if (thVar === NULL_THEORY_VAR) return false;
    return thVar < this.unassignedBounds.length && this.unassignedBounds[thVar] > 0;
  }

  private boundIsInteresting(column: number, kind: ConstraintKind, value: Rational) {
    const thVar = this.solver.getExternal(column);
    if (thVar === NULL_THEORY_VAR) return false;
    if (this.bounds.length <= thVar || this.unassignedBounds[thVar] === 0) return false;
    return this.bounds[thVar].some(
      (bound) =>
        this.s.value(bound.lit) === L_UNDEF &&
        this.isBoundImplied(kind, value, bound) !== undefined,
    );
  }

  private assertBound(isTrue: boolean, bound: ArithBound) {
    const solver = this.solver;
    const constraint = isTrue ? bound.constraintTrue : bound.constraintFalse;
    if (solver.constraintIsRedundant(constraint)) return;
    solver.activate(constraint);
    if (solver.status === LP_INFEASIBLE) return;
    const kind = this.boundToConstraintKind(bound.isInt, bound.isLower, isTrue);
    const value = getBoundValue(bound, isTrue);
    if (value.y.isZero()) this.propagateEqs(bound.column, constraint, kind, bound, value.x);
  }

  private propagateEqs(
    column: number,
    constraint: number,
    kind: ConstraintKind,
    bound: ArithBound,
    value: Rational,
  ) {
    if (kind !== KIND_GE && kind !== KIND_LE) return;
    const isLower = kind === KIND_GE;
    if (!this.setBound(column, constraint, value, isLower)) return;
    const dep = this.hasBound(column, value, !isLower);
    if (dep === undefined) return;
    this.fixedVarEh(bound.thVar, mkJoin(mkLeaf(constraint), dep), value);
  }

  private setBound(column: number, constraint: number, value: Rational, isLower: boolean) {
    const solver = this.solver;
    if (!solver.hasTerm(column)) {
      const bound = solver.getBound(column, !isLower);
      return bound !== undefined && !bound.isStrict && bound.value.equals(value);
    }
    const terms = isLower ? this.lowerTerms : this.upperTerms;
    const existing = terms[column];
    if (
      existing === undefined ||
      (isLower ? existing.value.compare(value) < 0 : existing.value.compare(value) > 0)
    ) {
      this.ctx.trail.push(() => {
        terms[column] = existing;
      });
      terms[column] = { constraint, value };
    }
    return true;
  }

  // has_bound: the dependency of a bound of the column at the value, or undefined if it has none.
  private hasBound(column: number, value: Rational, isLower: boolean): Dependency | undefined {
    const solver = this.solver;
    if (solver.hasTerm(column)) {
      const thVar = solver.getExternal(column);
      if (thVar !== NULL_THEORY_VAR) {
        const expr = this.var2expr(thVar);
        if (this.manager.isNumeral(expr) && this.manager.getRationalValue(expr).equals(value))
          return null;
      }
      const termBound = (isLower ? this.lowerTerms : this.upperTerms)[column];
      if (termBound === undefined || !termBound.value.equals(value)) return undefined;
      return mkLeaf(termBound.constraint);
    }
    const bound = solver.getBound(column, !isLower);
    if (bound === undefined || !bound.value.equals(value) || bound.isStrict) return undefined;
    return bound.dep;
  }

  protected flushBoundAxioms() {
    const newBounds = this.newBounds;
    while (newBounds.length > 0) {
      const atoms = [newBounds.pop() as ArithBound];
      const thVar = atoms[0].thVar;
      for (let index = 0; index < newBounds.length; index++) {
        if (newBounds[index].thVar !== thVar) continue;
        atoms.push(newBounds[index]);
        newBounds[index] = newBounds[newBounds.length - 1];
        newBounds.pop();
        index--;
      }
      const byValue = (first: ArithBound, second: ArithBound) => first.value.compare(second.value);
      atoms.sort(byValue);
      const occs = this.bounds[thVar].slice().sort(byValue);
      const end = occs.length;
      const getFirst = (isLower: boolean) => {
        const position = occs.findIndex((bound) => bound.isLower === isLower);
        return position === -1 ? end : position;
      };
      const nextInf = (atom: ArithBound, isLower: boolean, start: number) => {
        let result = end;
        let isFound = false;
        for (let position = start; position < end; position++) {
          const other = occs[position];
          if (other === atom || other.isLower !== isLower) continue;
          isFound = true;
          if (other.value.compare(atom.value) <= 0) result = position;
          else break;
        }
        return { result, isFound };
      };
      const nextSup = (atom: ArithBound, isLower: boolean, start: number) => {
        let isFound = false;
        for (let position = start; position < end; position++) {
          const other = occs[position];
          if (other === atom || other.isLower !== isLower) continue;
          isFound = true;
          if (atom.value.compare(other.value) < 0) return { result: position, isFound };
        }
        return { result: end, isFound };
      };
      let loInf = getFirst(true);
      let loSup = loInf;
      let hiInf = getFirst(false);
      let hiSup = hiInf;
      const visited = new Set<ArithBound>();
      for (const atom of atoms) {
        const loInf1 = nextInf(atom, true, loInf);
        const hiInf1 = nextInf(atom, false, hiInf);
        const loSup1 = nextSup(atom, true, loSup);
        const hiSup1 = nextSup(atom, false, hiSup);
        if (loInf1.result !== end) loInf = loInf1.result;
        if (loSup1.result !== end) loSup = loSup1.result;
        if (hiInf1.result !== end) hiInf = hiInf1.result;
        if (hiSup1.result !== end) hiSup = hiSup1.result;
        if (!loInf1.isFound) loInf = end;
        if (!hiInf1.isFound) hiInf = end;
        if (!loSup1.isFound) loSup = end;
        if (!hiSup1.isFound) hiSup = end;
        visited.add(atom);
        const tryAxiom = (found: number, position: number) => {
          if (found !== end && position !== end && !visited.has(occs[position]))
            this.mkBoundAxiom(atom, occs[position]);
        };
        tryAxiom(loInf1.result, loInf);
        tryAxiom(loSup1.result, loSup);
        tryAxiom(hiInf1.result, hiInf);
        tryAxiom(hiSup1.result, hiSup);
      }
    }
  }

  private getExprValue(node: Enode): number | undefined {
    const manager = this.manager;
    const thVar = node.getThVar(this.id);
    const expr = node.owner;
    const root = node.root.owner;
    if (manager.isValue(root)) return root;
    const nla = this.nla;
    if (
      this.useNraModel() &&
      nla !== undefined &&
      this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR
    ) {
      const value = this.getNlValue(thVar);
      if (manager.isInt(expr) && !nla.nra.am.isInt(value)) return manager.mkNumeral(0n);
      return manager.mkAlgebraicNumeral(value, manager.sorts[expr]);
    }
    if (thVar === NULL_THEORY_VAR) return undefined;
    const value = this.getRationalValue(thVar);
    return manager.mkNumeralOfSort(
      manager.isInt(expr) && !value.isInt() ? value.floor() : value,
      manager.sorts[expr],
    );
  }

  override addValue(node: Enode, model: ProtoModel, values: (number | undefined)[]) {
    const manager = this.manager;
    const expr = node.owner;
    const value =
      this.getExprValue(node) ??
      (manager.getFamily(expr) === FAMILY_ARITH
        ? this.rewrite(
            manager.mkApp(
              manager.decls[expr],
              manager.mapArgs(expr, (arg) =>
                manager.isValue(arg)
                  ? arg
                  : (values[(this.expr2enode(arg) as Enode).root.owner] as number),
              ),
              manager.sorts[expr],
            ),
          )
        : model.getFreshValue(manager.sorts[expr]));
    if (value === null) return;
    model.registerValue(value);
    values[node.root.owner] = value;
  }

  override addDep(node: Enode, deps: Dependencies) {
    const manager = this.manager;
    const expr = node.owner;
    const isArith = manager.getFamily(expr) === FAMILY_ARITH;
    if (node.getThVar(this.id) === NULL_THEORY_VAR && !isArith) return false;
    if (isArith && manager.getNumArgs(expr) > 0) {
      for (const arg of manager.getArgs(expr)) {
        const argNode = this.expr2enode(arg);
        if (argNode !== undefined) addDependency(deps, node, argNode);
      }
    } else deps.set(node, null);
    return true;
  }

  protected override pushCore() {
    this.scopes.push({
      boundsLim: this.boundsTrail.length,
      assertedQhead: this.assertedQhead,
      assertedLim: this.assertedLits.length,
    });
    this.solver.push();
    this.nla?.push();
    super.pushCore();
  }

  protected override popCore(numScopes: number) {
    const oldSize = this.scopes.length - numScopes;
    const scope = this.scopes[oldSize];
    this.delBounds(scope.boundsLim);
    this.assertedLits.length = scope.assertedLim;
    this.assertedQhead = scope.assertedQhead;
    this.scopes.length = oldSize;
    this.solver.pop(numScopes);
    this.newBounds.length = 0;
    this.nla?.pop(numScopes);
    super.popCore(numScopes);
  }

  private delBounds(oldSize: number) {
    for (let index = this.boundsTrail.length; index-- > oldSize;) {
      const thVar = this.boundsTrail[index];
      const bound = this.bounds[thVar].pop() as ArithBound;
      this.boolVar2bound.delete(bound.lit >> 1);
    }
    this.boundsTrail.length = oldSize;
  }

  protected reportEqualityOfFixedVars(first: number, second: number) {
    const solver = this.solver;
    const v1 = solver.getExternal(first);
    const v2 = solver.getExternal(second);
    if (this.isEqual(v1, v2) || this.isIntVar(v1) !== this.isIntVar(v2)) return;
    const value = Rational.zero;
    const firstLower = this.hasBound(first, value, true);
    if (firstLower === undefined) return;
    const firstUpper = this.hasBound(first, value, false);
    if (firstUpper === undefined) return;
    const secondLower = this.hasBound(second, value, true);
    if (secondLower === undefined) return;
    const secondUpper = this.hasBound(second, value, false);
    if (secondUpper === undefined) return;
    this.resetEvidence();
    this.explanation.clear();
    const dep = mkJoin(mkJoin(firstLower, firstUpper), mkJoin(secondLower, secondUpper));
    for (const constraint of linearize([dep])) this.consume(Rational.one, constraint);
    this.propagateEq(this.core, this.eqs, this.var2enodeOf(v1), this.var2enodeOf(v2));
  }

  private isEqual(first: number, second: number) {
    return first === second || this.var2enodeOf(first).root === this.var2enodeOf(second).root;
  }

  override initModel() {
    if (!this.manager.limit.inc() || this.numVars === 0) return;
    const saved = this.isModelInitialized;
    this.ctx.trail.push(() => {
      this.isModelInitialized = saved;
    });
    this.isModelInitialized = true;
    this.solver.initModel();
  }

  override getPhase(boolVar: number) {
    const bound = this.boolVar2bound.get(boolVar);
    if (bound === undefined) return L_UNDEF;
    const column = this.registerVar(bound.thVar);
    const comparison = compareToRational(this.solver.getValue(column), bound.value);
    return (bound.isLower ? comparison >= 0 : comparison <= 0) ? L_TRUE : L_FALSE;
  }

  private isRegisteredVar(thVar: number) {
    return thVar !== NULL_THEORY_VAR && this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR;
  }

  private getRationalValue(thVar: number) {
    return this.isRegisteredVar(thVar)
      ? this.solver.getModelValue(this.solver.externalToLocalColumn(thVar))
      : Rational.zero;
  }

  // m_model_eqs: the first variable inserted whose value equals that of thVar, after inserting it.
  private mkModelEqs() {
    const byValue = new Map<string, number>();
    const inserted: number[] = [];
    return (thVar: number) => {
      if (this.useNraModel()) {
        const other = inserted.find(
          (candidate) =>
            this.isIntVar(candidate) === this.isIntVar(thVar) && this.isEq(candidate, thVar),
        );
        if (other !== undefined) return other;
        inserted.push(thVar);
        return thVar;
      }
      const key = `${this.isIntVar(thVar)}:${this.getIvalue(thVar)}`;
      const other = byValue.get(key);
      if (other !== undefined) return other;
      byValue.set(key, thVar);
      return thVar;
    };
  }

  private randomUpdate() {
    if (this.nla !== undefined) return;
    const solver = this.solver;
    const tmpVarSet = new Set<number>();
    const insertIfNotThere = this.mkModelEqs();
    const columns: number[] = [];
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      if (this.isBoolVar(thVar)) continue;
      this.ensureColumn(thVar);
      const column = solver.externalToLocalColumn(thVar);
      const other = insertIfNotThere(thVar);
      if (this.isEqual(thVar, other)) continue;
      if (!solver.isFixed(column)) columns.push(column);
      else if (!tmpVarSet.has(other)) {
        const otherColumn = solver.externalToLocalColumn(other);
        if (!solver.isFixed(otherColumn)) {
          tmpVarSet.add(other);
          columns.push(otherColumn);
        }
      }
    }
    if (columns.length > 0) randomUpdate(solver, columns);
  }

  override hasUnhandled() {
    return this.notHandled !== null;
  }

  override includeFuncInterp(decl: number) {
    switch (this.manager.funcDecls[decl].op) {
      case OP_ADD:
      case OP_SUB:
      case OP_UMINUS:
      case OP_MUL:
      case OP_LE:
      case OP_LT:
      case OP_GE:
      case OP_GT:
      case OP_MOD:
      case OP_REM:
      case OP_DIV:
      case OP_IDIV:
      case OP_POWER:
      case OP_IS_INT:
      case OP_TO_INT:
      case OP_TO_REAL:
      case OP_NUM:
        return false;
      default:
        return true;
    }
  }

  private assumeEqs() {
    if (this.delayedAssumeEqs()) return true;
    this.randomUpdate();
    const numVars = this.numVars;
    const oldSize = this.assumeEqCandidates.length;
    const start = this.random();
    const insertIfNotThere = this.mkModelEqs();
    for (let index = 0; index < numVars; index++) {
      const thVar = (index + start) % numVars;
      if (this.isBoolVar(thVar)) continue;
      if (!this.ctx.isShared(this.var2enodeOf(thVar))) continue;
      this.ensureColumn(thVar);
      if (!this.isRegisteredVar(thVar)) continue;
      const other = insertIfNotThere(thVar);
      if (!this.isEqual(other, thVar)) this.assumeEqCandidates.push([thVar, other]);
    }
    if (this.assumeEqCandidates.length > oldSize)
      this.ctx.trail.push(() => {
        this.assumeEqCandidates.length = oldSize;
      });
    return this.delayedAssumeEqs();
  }

  private delayedAssumeEqs() {
    if (this.assumeEqHead === this.assumeEqCandidates.length) return false;
    const saved = this.assumeEqHead;
    this.ctx.trail.push(() => {
      this.assumeEqHead = saved;
    });
    while (this.assumeEqHead < this.assumeEqCandidates.length) {
      const candidate = this.assumeEqCandidates[this.assumeEqHead];
      const v1 = candidate[0];
      const v2 = candidate[1];
      const n1 = this.var2enodeOf(v1);
      const n2 = this.var2enodeOf(v2);
      this.assumeEqHead++;
      if (!this.isEq(v1, v2) || n1.root === n2.root) continue;
      const eq = this.eqInternalize(n1.owner, n2.owner);
      const value = this.s.value(eq);
      if (value === L_TRUE) continue;
      if (value === L_FALSE) this.mkDiseqAxiom(v1, v2);
      return true;
    }
    return false;
  }

  private useNraModel() {
    return this.nla !== undefined && this.isUsingNraModel && this.nla.isUsingNraModel;
  }

  private isEq(first: number, second: number) {
    if (this.useNraModel())
      return (
        (this.nla as NonNullable<typeof this.nla>).nra.am.compare(
          this.getNlValue(first),
          this.getNlValue(second),
        ) === 0
      );
    return this.getIvalue(first).equals(this.getIvalue(second));
  }

  override check() {
    this.forcePush();
    this.isModelInitialized = false;
    this.isUsingNraModel = false;
    const solver = this.solver;
    if (!solver.isFeasible() || solver.columnsWithChangedBounds.size > 0) {
      const status = this.makeFeasible();
      if (status === L_FALSE) {
        this.setInfeasibilityConflict();
        return CR_CONTINUE;
      }
      if (status === L_UNDEF) return CR_CONTINUE;
    }
    const liaStatus = this.checkLia();
    if (liaStatus === L_FALSE) return CR_CONTINUE;
    let result = liaStatus === L_UNDEF ? CR_CONTINUE : CR_DONE;
    if (!this.checkDelayedEqs()) return CR_CONTINUE;
    const nlaStatus = this.checkNla(2);
    if (nlaStatus === L_TRUE) this.isUsingNraModel = true;
    else if (nlaStatus === L_FALSE) return CR_CONTINUE;
    else result = CR_GIVEUP;
    if (this.assumeEqs()) return CR_CONTINUE;
    if (!this.checkDelayedEqs()) return CR_CONTINUE;
    return this.notHandled !== null ? CR_GIVEUP : result;
  }

  private getNlValue(thVar: number) {
    const nla = this.nla as NonNullable<typeof this.nla>;
    const solver = this.solver;
    const am = nla.nra.am;
    const column = solver.externalToLocalColumn(thVar);
    if (!solver.hasTerm(column)) return nla.nra.value(column);
    let result = new Anum(Rational.zero);
    const todo: [number, Rational][] = [[column, Rational.one]];
    for (let pending = todo.pop(); pending !== undefined; pending = todo.pop()) {
      for (const entry of solver.getTerm(pending[0]).coeffs) {
        const coeff = entry[1].mul(pending[1]);
        if (solver.hasTerm(entry[0])) todo.push([entry[0], coeff]);
        else result = am.add(am.mul(nla.nra.value(entry[0]), new Anum(coeff)), result);
      }
    }
    return result;
  }

  private makeFeasible() {
    const status = this.solver.findFeasibleSolution();
    if (status === LP_INFEASIBLE) return L_FALSE;
    return status === LP_FEASIBLE || status === LP_OPTIMAL || status === LP_UNBOUNDED
      ? L_TRUE
      : L_UNDEF;
  }

  private checkDelayedEqs() {
    if (this.delayedEqs.length === 0) return true;
    this.forcePush();
    for (const delayed of this.delayedEqs) {
      if (delayed.isEq) this.newEqEh(delayed.eq);
      else if (this.isEq(delayed.eq.v1, delayed.eq.v2)) {
        this.mkDiseqAxiom(delayed.eq.v1, delayed.eq.v2);
        return false;
      }
    }
    return true;
  }

  private checkLia() {
    if (!this.manager.limit.inc()) return L_UNDEF;
    if (!this.checkIdivBounds()) return L_FALSE;
    const lia = this.lia;
    const move = lia.check();
    this.explanation.clear();
    this.explanation.addExplanation(lia.explanation);
    switch (move.kind) {
      case "sat":
        return L_TRUE;
      case "branch":
        this.mkBound(lia.term, move.offset, !move.isUpper);
        return L_FALSE;
      case "cut": {
        this.resetEvidence();
        for (const constraint of this.explanation) this.setEvidence(constraint);
        const atom = this.mkBound(lia.term, move.offset, !move.isUpper);
        this.assign(this.expr2literal(atom), this.core, this.eqs);
        return L_FALSE;
      }
      case "conflict":
        this.setArithConflict();
        return L_FALSE;
      case "continue":
        return L_FALSE;
      default:
        return L_UNDEF;
    }
  }

  private assign(lit: number, core: number[], eqs: [Enode, Enode][]) {
    if (core.length < SMALL_LEMMA_SIZE && eqs.length === 0) {
      this.addClause([...core.map((other) => other ^ 1), lit], true);
      return;
    }
    this.propagateLit(core, eqs, lit);
  }

  private setInfeasibilityConflict() {
    this.explanation.clear();
    this.solver.getInfeasibilityExplanation(this.explanation);
    this.setArithConflict();
  }

  private setArithConflict() {
    this.setConflictOrLemma([], true);
  }

  private setConflictOrLemma(core: number[], isConflict: boolean) {
    this.resetEvidence();
    this.core.push(...core);
    for (const constraint of this.explanation) this.setEvidence(constraint);
    if (isConflict) {
      this.setConflict(this.core, this.eqs);
      return;
    }
    const manager = this.manager;
    for (const eq of this.eqs)
      this.core.push(this.mkLiteral(manager.mkEq(eq[0].owner, eq[1].owner)));
    const clause = this.core.map((lit) => lit ^ 1);
    if (clause.some((lit) => this.s.value(lit) === L_TRUE)) return;
    this.addClause(clause, true);
  }

  private mkTermEq(term: LarTerm, offset: Rational) {
    const sides = mkTermEqSides(this.manager, this.solver, term, offset, (thVar) =>
      this.var2expr(thVar),
    );
    return this.eqInternalize(sides[0], sides[1]);
  }

  private mkBound(term: LarTerm, offset: Rational, isLower: boolean) {
    const atom = mkBoundAtom(this.manager, this.solver, term, offset, isLower, (thVar) =>
      this.var2expr(thVar),
    );
    this.mkLiteral(atom);
    return atom;
  }

  private falseCaseOfCheckNla(lemma: Lemma) {
    this.explanation.clear();
    this.explanation.addExplanation(lemma.expl);
    const core = lemma.ineqs.map((ineq) => this.mkIneqLiteral(ineq) ^ 1);
    this.setConflictOrLemma(core, false);
  }

  private mkIneqLiteral(ineq: Ineq) {
    const constraints = this.solver.constraints;
    constraints.isAuxiliaryMode = true;
    const kind = ineq.cmp;
    const isSign = kind === KIND_LT || kind === KIND_GT || kind === KIND_NE;
    const lit =
      kind === KIND_EQ || kind === KIND_NE
        ? this.mkTermEq(ineq.term, ineq.rs)
        : this.expr2literal(this.mkBound(ineq.term, ineq.rs, kind === KIND_LT || kind === KIND_GE));
    constraints.isAuxiliaryMode = false;
    return isSign ? lit ^ 1 : lit;
  }

  private checkNla(level: number) {
    if (!this.manager.limit.inc()) return L_UNDEF;
    const nla = this.nla;
    if (nla === undefined || !nla.hasRelevantMonomial()) return L_TRUE;
    const status = nla.check(level);
    if (status === L_FALSE) this.addLemmas();
    return status;
  }

  private addLemmas() {
    const nla = this.nla as NonNullable<typeof this.nla>;
    if (nla.isCheckFeasible && this.makeFeasible() === L_FALSE) {
      this.setInfeasibilityConflict();
      return;
    }
    for (const ineq of nla.literals) {
      const lit = this.mkIneqLiteral(ineq);
      if (this.s.value(lit) === L_TRUE) continue;
      this.s.setPhaseLiteral(lit);
    }
    for (const lemma of nla.lemmas) this.falseCaseOfCheckNla(lemma);
    for (const equality of nla.fixedEqualities)
      this.addEquality(equality.lpVar, equality.value, equality.explanation);
    for (const equality of nla.equalities)
      this.addEq(equality.first, equality.second, equality.explanation, false);
  }

  private propagateNla() {
    const nla = this.nla;
    if (nla === undefined) return;
    nla.propagate();
    this.addLemmas();
    this.solver.collectMoreRowsForLpPropagation();
  }
}
