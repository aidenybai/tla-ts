// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp, src/math/lp/lp_api.h), MIT
// license, see z3-license.txt. Linear integer arithmetic, as the theory_lra solver that Z3's
// default configuration uses for UFNIA. Terms become columns of the lp solver, atoms become
// bounds on them, propagation makes the tableau feasible and propagates implied bounds and
// equalities, and the final check runs the integer solver and assumes equalities between shared
// terms with equal values. Nonlinear products, and div and mod by a term, are opaque. As in nla's
// init_to_refine (src/math/lp/nla_core.cpp), a model whose values satisfy them needs no
// refinement, and the theory gives up on any other.
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  OP_ADD,
  OP_GE,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP, type Context } from "./context";
import { Enode, TheoryJustification } from "./enode";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { BoolVar, getVar, isNegated, Literal, mkLiteral, negate } from "./literal";
import type { ProtoModel } from "./proto-model";
import { getGcd, getLcm, Rational } from "./rational";
import { BoundPropagator, getImpliedKind, ImpliedBound } from "./lp/bound-propagator";
import { KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./lp/constraints";
import { LP_INFEASIBLE } from "./lp/core-solver";
import { Dependency, linearize, mkJoin, mkLeaf } from "./lp/dependency";
import { Explanation } from "./lp/explanation";
import { IntSolver } from "./lp/int-solver";
import { LarSolver, NULL_LPVAR } from "./lp/lar-solver";
import type { LarTerm } from "./lp/lar-term";
import { randomUpdate } from "./lp/random-updater";

const NULL_THEORY_VAR = -1;

// api_bound: an atom v <= value or v >= value, with its constraints when true and when false.
interface ApiBound {
  readonly boolVar: BoolVar;
  readonly thVar: number;
  readonly column: number;
  readonly isInt: boolean;
  readonly value: Rational;
  readonly isLower: boolean;
  readonly constraintTrue: number;
  readonly constraintFalse: number;
}

interface Scope {
  boundsLimit: number;
  assertedQhead: number;
  assertedAtomsLimit: number;
  numVars: number;
}

interface TermBound {
  constraint: number;
  value: Rational;
}

const getAtomLiteral = (bound: ApiBound) => mkLiteral(bound.boolVar);

const getIdentityHash = (key: number) => key;

export class TheoryLra {
  private solver: LarSolver;
  private bp: BoundPropagator;
  private lia: IntSolver;
  private varEnodes: Enode[] = [];
  private oneVar = NULL_LPVAR;
  private zeroVar = NULL_LPVAR;
  private realOneVar = NULL_LPVAR;
  private realZeroVar = NULL_LPVAR;
  private realConstants = new Set<number>();
  // The literal of each inequality constraint, and null for a definition.
  private constraintSources: (Literal | null)[] = [];
  private assertedAtoms: { boolVar: BoolVar; isTrue: boolean }[] = [];
  private assertedQhead = 0;
  private bounds: ApiBound[][] = [];
  private unassignedBounds: number[] = [];
  private boundsTrail: number[] = [];
  private boolVarToBound: (ApiBound | undefined)[] = [];
  private newBounds: ApiBound[] = [];
  private delayIneqs: number[] = [];
  private delayIneqsQhead = 0;
  private isNewDef = false;
  private scopes: Scope[] = [];
  private explanation = new Explanation();
  private coreLiterals: Literal[] = [];
  private numConflicts = 0;
  private lowerTerms: (TermBound | undefined)[] = [];
  private upperTerms: (TermBound | undefined)[] = [];
  private value2var = new Map<string, number>();
  private assumeEqCandidates: [number, number][] = [];
  private assumeEqHead = 0;
  private isModelInitialized = false;
  // m_not_handled: terms that the theory treats as uninterpreted, so a model may not satisfy them.
  // Their arguments have variables, as the factors of an nla monomial do.
  private unsupportedTerms: number[] = [];
  private processedEqs = new Set<string>();
  private processedDivMods = new Set<string>();

  constructor(private context: Context) {
    this.solver = new LarSolver(() => context.checkCanceled());
    this.bp = new BoundPropagator(this.solver, {
      columnIsInteresting: (column) => this.columnIsInteresting(column),
      boundIsInteresting: (column, kind, value) => this.boundIsInteresting(column, kind, value),
      isEqual: (first, second) => this.isEqual(first, second),
      addEq: (first, second, explanation, isFixed) =>
        this.addEq(first, second, explanation, isFixed),
    });
    this.lia = new IntSolver(this.solver);
  }

  private get manager(): AstManager {
    return this.context.manager;
  }

  // get_enode, get_expr and get_num_vars: the theory reaches enodes only through these and
  // isEqual.
  getEnode(thVar: number) {
    return this.varEnodes[thVar];
  }

  private getExpr(thVar: number) {
    return this.varEnodes[thVar].owner;
  }

  private getNumVars() {
    return this.varEnodes.length;
  }

  // init: the constants 1 and 0, integer and then real, each in a scope of its own. The context
  // runs it once, when it registers the theory.
  init() {
    const manager = this.manager;
    this.oneVar = this.addConst(manager.mkNumeral(1), 1, true);
    this.realOneVar = this.addConst(manager.mkRealNumeral(1), 1, false);
    this.zeroVar = this.addConst(manager.mkNumeral(0), 0, true);
    this.realZeroVar = this.addConst(manager.mkRealNumeral(0), 0, false);
  }

  private addConst(expr: number, value: number, isInt: boolean) {
    if (!isInt) this.realConstants.add(expr);
    this.mkEnode(expr);
    const column = this.solver.addVar(this.mkVar(expr), isInt);
    this.solver.push();
    this.addDefConstraintAndEquality(column, KIND_GE, Rational.fromNumber(value));
    this.addDefConstraintAndEquality(column, KIND_LE, Rational.fromNumber(value));
    return column;
  }

  private isIntExpr(expr: number) {
    return !this.realConstants.has(expr);
  }

  private isIntVar(thVar: number) {
    return this.isIntExpr(this.getExpr(thVar));
  }

  // Variables.

  private isAttached(node: Enode) {
    return node.thVar >= 0 && this.varEnodes[node.thVar] === node;
  }

  private mkVar(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const node = context.getEnode(expr);
    if (node === undefined) throw new Error("the term was not internalized");
    if (this.isAttached(node)) return node.thVar;
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    while (this.bounds.length <= thVar) {
      this.bounds.push([]);
      this.unassignedBounds.push(0);
    }
    context.attachThVar(node, thVar);
    return thVar;
  }

  private registerVar(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    return column !== NULL_LPVAR ? column : this.solver.addVar(thVar, this.isIntVar(thVar));
  }

  // mk_enode: the arguments, which become relevant, then the term.
  private mkEnode(expr: number) {
    const context = this.context;
    for (const arg of this.manager.args[expr]) {
      if (context.isEInternalized(arg)) continue;
      context.internalize(arg, false);
      context.markAsRelevant(arg);
    }
    if (context.isEInternalized(expr)) return;
    const op = this.manager.getOp(expr);
    const isArith = this.manager.getFamily(expr) === FAMILY_ARITH;
    context.mkEnode(expr, false, false, !(isArith && (op === OP_ADD || op === OP_MUL)));
  }

  private internalizeArgs(expr: number) {
    const context = this.context;
    for (const arg of this.manager.args[expr])
      if (!context.isEInternalized(arg)) context.internalize(arg, false);
  }

  // found_unsupported: the list of unsupported terms is on the trail.
  private foundUnsupported(expr: number) {
    this.unsupportedTerms.push(expr);
    this.context.pushTrail(() => this.unsupportedTerms.pop());
  }

  private registerFixedVar(thVar: number, value: Rational) {
    const key = value.toString();
    if (this.value2var.has(key)) return;
    this.value2var.set(key, thVar);
    this.context.pushTrail(() => this.value2var.delete(key));
  }

  private internalizeNumeral(expr: number, value: Rational) {
    if (!this.context.isEInternalized(expr)) this.mkEnode(expr);
    const thVar = this.mkVar(expr);
    if (this.solver.externalToLocalColumn(thVar) === NULL_LPVAR) {
      const column = this.solver.addVar(thVar, this.isIntExpr(expr));
      this.addDefConstraintAndEquality(column, KIND_GE, value);
      this.addDefConstraintAndEquality(column, KIND_LE, value);
      this.registerFixedVar(thVar, value);
    }
    return thVar;
  }

  // internalize_mul: a product of terms is a variable whose arguments have variables.
  private internalizeMul(expr: number) {
    this.internalizeArgs(expr);
    const hasVar = this.context.isEInternalized(expr) && this.isAttachedExpr(expr);
    this.mkEnode(expr);
    const thVar = this.mkVar(expr);
    if (!hasVar) {
      this.foundUnsupported(expr);
      for (const arg of this.manager.args[expr]) {
        this.internalizeTermCore(arg);
        this.registerVar(this.mkVar(arg));
      }
    }
    return thVar;
  }

  private isAttachedExpr(expr: number) {
    const node = this.context.getEnode(expr);
    return node !== undefined && this.isAttached(node);
  }

  // linearize: the theory variables of a weighted sum of terms, with their coefficients.
  private linearize(terms: number[], coeffs: Rational[]) {
    const manager = this.manager;
    const context = this.context;
    const vars: number[] = [];
    const toEnsureEnode: number[] = [];
    const toEnsureVar: number[] = [];
    const push = (term: number, coeff: Rational) => {
      terms.push(term);
      coeffs.push(coeff);
    };
    const addVar = (index: number, thVar: number) => {
      coeffs[vars.length] = coeffs[index];
      vars.push(thVar);
    };
    let index = 0;
    while (index < terms.length) {
      const term = terms[index];
      toEnsureEnode.push(term);
      const op = manager.getOp(term);
      const args = manager.args[term];
      if (op === OP_ADD) {
        for (const arg of args) push(arg, coeffs[index]);
        if (terms.length !== index + 1) {
          terms[index] = terms[terms.length - 1];
          coeffs[index] = coeffs[coeffs.length - 1];
          terms.pop();
          coeffs.pop();
        }
      } else if (op === OP_SUB) {
        terms[index] = args[0];
        for (let position = 1; position < args.length; position++)
          push(args[position], coeffs[index].neg());
      } else if (op === OP_MUL && args.length === 2 && manager.isNumeral(args[0])) {
        coeffs[index] = coeffs[index].mul(Rational.fromNumber(manager.values[args[0]]));
        terms[index] = args[1];
        toEnsureEnode.push(args[0]);
      } else if (op === OP_MUL && args.length === 2 && manager.isNumeral(args[1])) {
        coeffs[index] = coeffs[index].mul(Rational.fromNumber(manager.values[args[1]]));
        terms[index] = args[0];
        toEnsureEnode.push(args[1]);
      } else if (op === OP_MUL) {
        addVar(index, this.internalizeMul(term));
        index++;
      } else if (op === OP_NUM) {
        addVar(index, this.internalizeNumeral(term, Rational.fromNumber(manager.values[term])));
        index++;
      } else if (op === OP_UMINUS) {
        coeffs[index] = coeffs[index].neg();
        terms[index] = args[0];
      } else if (manager.getFamily(term) === FAMILY_ARITH) {
        const isFirst = !context.isEInternalized(term);
        this.internalizeArgs(term);
        this.mkEnode(term);
        addVar(index, this.mkVar(term));
        index++;
        if (isFirst) {
          const isDivision = (op === OP_IDIV || op === OP_MOD) && !manager.isNumeral(args[1]);
          if (isDivision || (op !== OP_IDIV && op !== OP_MOD)) {
            this.foundUnsupported(term);
            for (const arg of args) toEnsureVar.push(arg);
          }
          if (!context.relevancy.isEnabled) this.relevantEh(term);
        }
      } else {
        this.internalizeArgs(term);
        addVar(index, this.mkVar(term));
        index++;
      }
    }
    for (let position = toEnsureEnode.length; position-- > 0;)
      this.mkEnode(toEnsureEnode[position]);
    for (let position = toEnsureVar.length; position-- > 0;)
      this.internalizeTermCore(toEnsureVar[position]);
    return { vars, coeffs: coeffs.slice(0, vars.length) };
  }

  // init_left_side: the coefficients of the variables summed, in the order of the variables.
  private initLeftSide(vars: number[], coeffs: Rational[]) {
    const sums = new Map<number, Rational>();
    vars.forEach((thVar, index) =>
      sums.set(thVar, (sums.get(thVar) ?? Rational.zero).add(coeffs[index])),
    );
    const leftSide: [number, Rational][] = [];
    for (const thVar of vars) {
      const sum = sums.get(thVar);
      if (sum === undefined || sum.isZero()) continue;
      leftSide.push([this.registerVar(thVar), sum]);
      sums.delete(thVar);
    }
    return leftSide;
  }

  // internalize_def: the variable of a term, with a column for its linear combination.
  private internalizeDef(expr: number) {
    const linearized = this.linearize([expr], [Rational.one]);
    const thVar = this.mkVar(expr);
    if (
      linearized.vars.length === 1 &&
      linearized.coeffs[0].equals(Rational.one) &&
      thVar === linearized.vars[0]
    )
      return thVar;
    const leftSide = this.initLeftSide(linearized.vars, linearized.coeffs);
    if (this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR) return thVar;
    if (leftSide.length === 0) {
      const column = this.solver.addVar(thVar, this.isIntExpr(expr));
      this.addDefConstraintAndEquality(column, KIND_GE, Rational.zero);
      this.addDefConstraintAndEquality(column, KIND_LE, Rational.zero);
    } else this.solver.addTerm(leftSide, thVar);
    return thVar;
  }

  private internalizeTermCore(expr: number) {
    if (this.manager.getFamily(expr) !== FAMILY_ARITH && this.manager.isBool(expr)) return;
    if (this.context.isEInternalized(expr) && this.isAttachedExpr(expr)) return;
    this.internalizeDef(expr);
  }

  internalizeTerm(expr: number) {
    this.internalizeTermCore(expr);
    return true;
  }

  // Constraints.

  private addDefConstraintAndEquality(column: number, kind: number, bound: Rational) {
    const index = this.solver.mkVarBound(column, kind, bound);
    const equal = this.solver.activateCheckOnEqual(index);
    this.constraintSources[index] = null;
    if (equal !== NULL_LPVAR) this.reportEqualityOfFixedVars(column, equal);
    this.isNewDef = true;
  }

  // Atoms.

  internalizeAtom(expr: number) {
    const manager = this.manager;
    const context = this.context;
    const op = manager.getOp(expr);
    const boolVar = context.mkBoolVar(expr);
    this.boolVarToBound[boolVar] = undefined;
    context.setVarTheory(boolVar);
    const args = manager.args[expr];
    if (op !== OP_LE && op !== OP_GE) {
      this.foundUnsupported(expr);
      return true;
    }
    const isRightNumeral = manager.isNumeral(args[1]);
    if (!isRightNumeral && !manager.isNumeral(args[0])) {
      this.delayIneqs.push(expr);
      context.pushTrail(() => this.delayIneqs.pop());
      return true;
    }
    const term = isRightNumeral ? args[0] : args[1];
    const value = Rational.fromNumber(manager.values[isRightNumeral ? args[1] : args[0]]);
    const isLower = (op === OP_GE) === isRightNumeral;
    const thVar = this.internalizeDef(term);
    const bound = this.mkVarBound(boolVar, thVar, isLower, value);
    this.bounds[thVar].push(bound);
    this.updateUnassignedBounds(thVar, 1);
    this.boundsTrail.push(thVar);
    this.boolVarToBound[boolVar] = bound;
    this.mkBoundAxioms(bound);
    return true;
  }

  private updateUnassignedBounds(thVar: number, increment: number) {
    const saved = this.unassignedBounds[thVar];
    this.context.pushTrail(() => {
      this.unassignedBounds[thVar] = saved;
    });
    this.unassignedBounds[thVar] = saved + increment;
  }

  // bound2constraint_kind: the kind of the bound when its atom is true or false.
  private getBoundKind(bound: ApiBound, isTrue: boolean) {
    if (bound.isLower) return isTrue ? KIND_GE : bound.isInt ? KIND_LE : KIND_LT;
    return isTrue ? KIND_LE : bound.isInt ? KIND_GE : KIND_GT;
  }

  private mkVarBound(boolVar: BoolVar, thVar: number, isLower: boolean, value: Rational) {
    const column = this.registerVar(thVar);
    const isInt = this.isIntVar(thVar);
    const partial = { isLower, isInt };
    const kindTrue = isLower ? KIND_GE : KIND_LE;
    const kindFalse = isLower ? (isInt ? KIND_LE : KIND_LT) : isInt ? KIND_GE : KIND_GT;
    const constraintTrue = this.solver.mkVarBound(column, kindTrue, value);
    const falseValue = isInt
      ? isLower
        ? value.sub(Rational.one)
        : value.add(Rational.one)
      : value;
    const constraintFalse = this.solver.mkVarBound(column, kindFalse, falseValue);
    this.constraintSources[constraintTrue] = mkLiteral(boolVar);
    this.constraintSources[constraintFalse] = mkLiteral(boolVar, true);
    return { boolVar, thVar, column, value, constraintTrue, constraintFalse, ...partial };
  }

  // mk_bound_axioms: implications between a new bound and its closest neighbors on the variable.
  private mkBoundAxioms(bound: ApiBound) {
    if (!this.context.isSearching) {
      this.newBounds.push(bound);
      return;
    }
    let loInf: ApiBound | undefined;
    let loSup: ApiBound | undefined;
    let hiInf: ApiBound | undefined;
    let hiSup: ApiBound | undefined;
    for (const other of this.bounds[bound.thVar]) {
      if (other === bound || other.boolVar === bound.boolVar) continue;
      const comparison = other.value.compare(bound.value);
      if (comparison === 0 && other.isLower === bound.isLower) continue;
      if (other.isLower) {
        if (comparison < 0) {
          if (loInf === undefined || other.value.compare(loInf.value) > 0) loInf = other;
        } else if (loSup === undefined || other.value.compare(loSup.value) < 0) loSup = other;
      } else if (comparison < 0) {
        if (hiInf === undefined || other.value.compare(hiInf.value) > 0) hiInf = other;
      } else if (hiSup === undefined || other.value.compare(hiSup.value) < 0) hiSup = other;
    }
    for (const other of [loInf, loSup, hiInf, hiSup])
      if (other !== undefined) this.mkBoundAxiom(bound, other);
  }

  private mkBoundAxiom(first: ApiBound, second: ApiBound) {
    const l1 = getAtomLiteral(first);
    const l2 = getAtomLiteral(second);
    const k1 = first.value;
    const k2 = second.value;
    if (k1.equals(k2) && first.isLower === second.isLower) return;
    const mkClause = (literals: Literal[]) => this.context.mkThAxiom(literals);
    if (first.isLower) {
      if (second.isLower) {
        if (k2.compare(k1) <= 0) mkClause([negate(l1), l2]);
        else mkClause([l1, negate(l2)]);
      } else if (k1.compare(k2) <= 0) mkClause([l1, l2]);
      else {
        mkClause([negate(l1), negate(l2)]);
        if (first.isInt && k1.equals(k2.add(Rational.one))) mkClause([l1, l2]);
      }
    } else if (second.isLower) {
      if (k1.compare(k2) >= 0) mkClause([l1, l2]);
      else {
        mkClause([negate(l1), negate(l2)]);
        if (first.isInt && k1.equals(k2.sub(Rational.one))) mkClause([l1, l2]);
      }
    } else if (k1.compare(k2) >= 0) mkClause([l1, negate(l2)]);
    else mkClause([negate(l1), l2]);
  }

  // flush_bound_axioms: the axioms of the bounds created before the search, per variable.
  private flushBoundAxioms() {
    while (this.newBounds.length > 0) {
      const pending = this.newBounds.slice().sort((first, second) => first.thVar - second.thVar);
      this.newBounds = [];
      for (let index = 0; index < pending.length;) {
        const thVar = pending[index].thVar;
        const atoms: ApiBound[] = [];
        for (; index < pending.length && pending[index].thVar === thVar; index++)
          atoms.push(pending[index]);
        const byValue = (first: ApiBound, second: ApiBound) => first.value.compare(second.value);
        atoms.sort(byValue);
        const occs = this.bounds[thVar].slice().sort(byValue);
        const end = occs.length;
        const getFirst = (isLower: boolean) => {
          const position = occs.findIndex((bound) => bound.isLower === isLower);
          return position === -1 ? end : position;
        };
        const nextInf = (atom: ApiBound, isLower: boolean, start: number) => {
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
        const nextSup = (atom: ApiBound, isLower: boolean, start: number) => {
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
        const visited = new Set<ApiBound>();
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
  }

  assignEh(boolVar: BoolVar, isTrue: boolean) {
    this.assertedAtoms.push({ boolVar, isTrue });
    const bound = this.boolVarToBound[boolVar];
    if (bound !== undefined) this.updateUnassignedBounds(bound.thVar, -1);
  }

  // Propagation.

  canPropagate() {
    return (
      this.assertedAtoms.length > this.assertedQhead ||
      this.isNewDef ||
      this.solver.columnsWithChangedBounds.size > 0 ||
      this.delayIneqsQhead < this.delayIneqs.length
    );
  }

  propagate() {
    this.propagateCore();
  }

  // propagate_core: whether there was anything to propagate.
  private propagateCore() {
    const context = this.context;
    this.isModelInitialized = false;
    this.flushBoundAxioms();
    if (context.isInconsistent()) return true;
    if (!this.canPropagate()) return false;
    const manager = this.manager;
    for (
      ;
      this.delayIneqsQhead < this.delayIneqs.length &&
      !context.isInconsistent() &&
      !context.checkCanceled();
      this.delayIneqsQhead++
    ) {
      const saved = this.delayIneqsQhead;
      context.pushTrail(() => {
        this.delayIneqsQhead = saved;
      });
      const atom = this.delayIneqs[this.delayIneqsQhead];
      const args = manager.args[atom];
      const difference = manager.mkApp(OP_SUB, [args[0], args[1]], SORT_INT);
      const normalized = manager.mkApp(
        manager.getOp(atom),
        [difference, manager.mkNumeral(0)],
        SORT_BOOL,
      );
      const first = this.mkLiteral(atom);
      const second = this.mkLiteral(normalized);
      this.mkAxiom([negate(first), second]);
      this.mkAxiom([first, negate(second)]);
    }
    this.isNewDef = false;
    while (
      this.assertedQhead < this.assertedAtoms.length &&
      !context.isInconsistent() &&
      !context.checkCanceled()
    ) {
      const atom = this.assertedAtoms[this.assertedQhead];
      const bound = this.boolVarToBound[atom.boolVar];
      if (bound !== undefined && !this.assertBound(atom.isTrue, bound)) {
        this.setInfeasibilityConflict();
        return true;
      }
      this.assertedQhead++;
    }
    if (context.isInconsistent()) return true;
    const status = this.makeFeasible();
    if (context.checkCanceled()) return true;
    if (status === L_FALSE) this.setInfeasibilityConflict();
    else if (status === L_TRUE) this.propagateBoundsWithLpSolver();
    return true;
  }

  private makeFeasible() {
    const status = this.solver.findFeasibleSolution();
    if (this.solver.isFeasible()) return L_TRUE;
    return status === LP_INFEASIBLE ? L_FALSE : L_UNDEF;
  }

  private assertBound(isTrue: boolean, bound: ApiBound) {
    const solver = this.solver;
    const constraint = isTrue ? bound.constraintTrue : bound.constraintFalse;
    if (solver.constraintIsRedundant(constraint)) return solver.status !== LP_INFEASIBLE;
    solver.activate(constraint);
    if (solver.status === LP_INFEASIBLE) return false;
    const kind = this.getBoundKind(bound, isTrue);
    const value = isTrue
      ? bound.value
      : bound.isLower
        ? bound.value.sub(Rational.one)
        : bound.value.add(Rational.one);
    if (bound.isInt || isTrue) this.propagateEqs(bound.column, constraint, kind, bound, value);
    return true;
  }

  // propagate_eqs: a bound that fixes a column, with the opposite bound of the same value.
  private propagateEqs(
    column: number,
    constraint: number,
    kind: number,
    bound: ApiBound,
    value: Rational,
  ) {
    const isLower = kind === KIND_GE;
    if (kind !== KIND_GE && kind !== KIND_LE) return;
    if (!this.setTermBound(column, constraint, value, isLower)) return;
    const opposite = this.getFixingBound(column, value, !isLower);
    if (opposite === undefined) return;
    this.fixedVarEh(bound.thVar, column, mkJoin(mkLeaf(constraint), opposite), value);
  }

  // set_bound: records the bound of a term column, or checks that a column has the bound.
  private setTermBound(column: number, constraint: number, value: Rational, isLower: boolean) {
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
      this.context.pushTrail(() => {
        terms[column] = existing;
      });
      terms[column] = { constraint, value };
    }
    return true;
  }

  // has_bound: the dependency of a bound of the column with the value, if it has one.
  private getFixingBound(
    column: number,
    value: Rational,
    isLower: boolean,
  ): Dependency | undefined {
    const solver = this.solver;
    if (solver.hasTerm(column)) {
      const thVar = solver.getExternal(column);
      if (thVar !== NULL_THEORY_VAR) {
        const expr = this.getExpr(thVar);
        if (
          this.manager.isNumeral(expr) &&
          Rational.fromNumber(this.manager.values[expr]).equals(value)
        )
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

  private isEqual(first: number, second: number) {
    return this.getEnode(first).root === this.getEnode(second).root;
  }

  // report_equality_of_fixed_vars: two columns fixed to the same value are equal.
  private reportEqualityOfFixedVars(first: number, second: number) {
    const solver = this.solver;
    const v1 = solver.getExternal(first);
    const v2 = solver.getExternal(second);
    // Z3 assumes both columns have theory variables, but a cut column has none.
    if (v1 === NULL_THEORY_VAR || v2 === NULL_THEORY_VAR) return;
    if (this.isEqual(v1, v2) || this.isIntVar(v1) !== this.isIntVar(v2)) return;
    const value = Rational.zero;
    const deps = [
      this.getFixingBound(first, value, true),
      this.getFixingBound(first, value, false),
      this.getFixingBound(second, value, true),
      this.getFixingBound(second, value, false),
    ];
    if (deps.some((dep) => dep === undefined)) return;
    this.resetEvidence();
    for (const dep of deps) if (dep !== undefined) this.setEvidenceOfDep(dep);
    this.assignEq(v1, v2);
  }

  // fixed_var_eh: a column fixed to a value is equal to an offset term, or to the variable of the
  // numeral with that value.
  private fixedVarEh(thVar: number, column: number, dep: Dependency, value: Rational) {
    if (this.propagateOffsetEq(column, dep, value)) return;
    const isInt = this.isIntVar(thVar);
    let other = this.value2var.get(value.toString());
    if (other === undefined) {
      if (value.isZero()) other = this.solver.getExternal(isInt ? this.zeroVar : this.realZeroVar);
      else if (value.equals(Rational.one))
        other = this.solver.getExternal(isInt ? this.oneVar : this.realOneVar);
      else return;
    }
    if (this.isIntVar(other) !== isInt || this.isEqual(thVar, other)) return;
    this.resetEvidence();
    this.setEvidenceOfDep(dep);
    this.assignEq(thVar, other);
  }

  // propagate_offset_eq: x - y fixed to 0 makes x and y equal.
  private propagateOffsetEq(column: number, dep: Dependency, value: Rational) {
    if (!value.isZero() || !this.solver.hasTerm(column)) return false;
    const coeffs = this.getTermCoeffs(this.solver.getTerm(column));
    if (coeffs.length !== 2) return false;
    const [first, second] = coeffs;
    if (!first[1].add(second[1]).isZero() || first[0] === second[0]) return false;
    if (this.isEqual(first[0], second[0])) return false;
    if (this.isIntVar(first[0]) !== this.isIntVar(second[0])) return false;
    this.resetEvidence();
    this.setEvidenceOfDep(dep);
    this.assignEq(first[0], second[0]);
    return true;
  }

  // term2coeffs: the coefficients of the theory variables of a term, with term columns expanded,
  // in the slot order of Z3's u_map.
  private getTermCoeffs(term: LarTerm) {
    const coeffs = new ObjMap<Rational>(getIdentityHash);
    const visit = (current: LarTerm, coeff: Rational) => {
      for (const entry of current.coeffs) {
        if (this.solver.hasTerm(entry[0])) {
          visit(this.solver.getTerm(entry[0]), coeff.mul(entry[1]));
          continue;
        }
        const thVar = this.solver.getExternal(entry[0]);
        const sum = (coeffs.get(thVar) ?? Rational.zero).add(entry[1].mul(coeff));
        if (coeffs.has(thVar)) coeffs.replace(thVar, sum);
        else coeffs.set(thVar, sum);
      }
    };
    visit(term, Rational.one);
    return [...coeffs];
  }

  private assignEq(first: number, second: number) {
    this.context.pushEq(this.getEnode(first), this.getEnode(second), {
      kind: "justification",
      justification: new TheoryJustification(this.coreLiterals, []),
    });
  }

  // add_eq: an equality that the lp solver implies, with its explanation.
  private addEq(first: number, second: number, explanation: Explanation, isFixed: boolean) {
    if (this.context.isInconsistent()) return false;
    const v1 = this.solver.getExternal(first);
    const v2 = this.solver.getExternal(second);
    if (v1 === NULL_THEORY_VAR || v2 === NULL_THEORY_VAR) return false;
    if (this.isEqual(v1, v2) || this.isIntVar(v1) !== this.isIntVar(v2)) return false;
    const manager = this.manager;
    const e1 = this.getExpr(v1);
    const e2 = this.getExpr(v2);
    if (
      !isFixed &&
      !manager.isNumeral(e1) &&
      !manager.isNumeral(e2) &&
      (manager.getOp(e1) === OP_ITE || manager.getOp(e2) === OP_ITE)
    )
      return false;
    this.resetEvidence();
    for (const constraint of explanation) this.setEvidence(constraint);
    this.assignEq(v1, v2);
    return true;
  }

  // Bound propagation.

  private columnIsInteresting(column: number) {
    const thVar = this.solver.getExternal(column);
    return (
      thVar !== NULL_THEORY_VAR &&
      thVar < this.unassignedBounds.length &&
      this.unassignedBounds[thVar] > 0
    );
  }

  private boundIsInteresting(column: number, kind: number, value: Rational) {
    const thVar = this.solver.getExternal(column);
    if (thVar === NULL_THEORY_VAR || thVar >= this.bounds.length) return false;
    if (this.unassignedBounds[thVar] === 0) return false;
    const context = this.context;
    return this.bounds[thVar].some(
      (bound) =>
        context.getAssignment(getAtomLiteral(bound)) === L_UNDEF &&
        this.isBoundImplied(kind, value, bound) !== undefined,
    );
  }

  private propagateBoundsWithLpSolver() {
    this.bp.init();
    this.bp.propagateBoundsForTouchedRows();
    if (this.context.checkCanceled()) return;
    if (this.solver.status === LP_INFEASIBLE) {
      this.setInfeasibilityConflict();
      return;
    }
    for (const implied of this.bp.ibounds) {
      if (this.context.isInconsistent()) break;
      this.propagateLpSolverBound(implied);
    }
  }

  private propagateLpSolverBound(implied: ImpliedBound) {
    const thVar = this.solver.getExternal(implied.column);
    if (thVar === NULL_THEORY_VAR || this.unassignedBounds[thVar] === 0) return;
    const context = this.context;
    const kind = getImpliedKind(implied);
    let isFirst = true;
    for (const bound of this.bounds[thVar]) {
      if (context.getAssignment(getAtomLiteral(bound)) !== L_UNDEF) continue;
      const literal = this.isBoundImplied(kind, implied.bound, bound);
      if (literal === undefined) continue;
      if (isFirst) {
        isFirst = false;
        this.resetEvidence();
        this.explanation.clear();
        for (const entry of implied.explain())
          for (const constraint of linearize([entry[1]])) {
            this.setEvidence(constraint);
            this.explanation.addPair(constraint, entry[0]);
          }
      }
      context.assign(literal, new TheoryJustification(this.coreLiterals, []));
    }
  }

  // is_bound_implied: the literal of the bound that the implied bound makes true or false.
  private isBoundImplied(kind: number, value: Rational, bound: ApiBound) {
    const literal = getAtomLiteral(bound);
    const comparison = value.compare(bound.value);
    const isUpperKind = kind === KIND_LE || kind === KIND_LT;
    const isLowerKind = kind === KIND_GE || kind === KIND_GT;
    if (isUpperKind && !bound.isLower && comparison <= 0) return literal;
    if (isLowerKind && bound.isLower && comparison >= 0) return literal;
    if (kind === KIND_LE && bound.isLower && comparison < 0) return negate(literal);
    if (kind === KIND_LT && bound.isLower && comparison <= 0) return negate(literal);
    if (kind === KIND_GE && !bound.isLower && comparison > 0) return negate(literal);
    if (kind === KIND_GT && !bound.isLower && comparison >= 0) return negate(literal);
    return undefined;
  }

  // Explanations.

  private resetEvidence() {
    this.coreLiterals = [];
  }

  private setEvidenceOfDep(dep: Dependency) {
    for (const constraint of linearize([dep])) this.setEvidence(constraint);
  }

  private setEvidence(constraint: number) {
    const literal = this.constraintSources[constraint];
    if (literal !== undefined && literal !== null) this.coreLiterals.push(literal);
  }

  private setInfeasibilityConflict() {
    this.solver.getInfeasibilityExplanation(this.explanation);
    this.setConflict();
  }

  private setConflict() {
    this.resetEvidence();
    this.numConflicts++;
    for (const constraint of this.explanation) this.setEvidence(constraint);
    this.context.setConflict(new TheoryJustification(this.coreLiterals, []), null);
  }

  // Final check.

  finalCheckEh() {
    const context = this.context;
    if (this.propagateCore()) return FC_CONTINUE;
    this.isModelInitialized = false;
    const solver = this.solver;
    const status =
      !solver.isFeasible() || solver.columnsWithChangedBounds.size > 0
        ? this.makeFeasible()
        : L_TRUE;
    if (status === L_FALSE) {
      this.setInfeasibilityConflict();
      return FC_CONTINUE;
    }
    if (status === L_UNDEF) return context.checkCanceled() ? FC_GIVEUP : FC_CONTINUE;
    if (!this.isLiaSat()) return FC_CONTINUE;
    if (context.checkCanceled()) return FC_GIVEUP;
    if (solver.hasInfInt()) return FC_CONTINUE;
    if (this.assumeEqs()) return FC_CONTINUE;
    if (this.unsupportedTerms.length > 0) this.initVariableValues();
    for (const term of this.unsupportedTerms)
      if (context.isRelevant(term) && !this.isSatisfied(term)) return FC_GIVEUP;
    return FC_DONE;
  }

  // check_lia: whether the integer solver found the integer columns integral.
  private isLiaSat() {
    if (this.context.checkCanceled()) return false;
    const move = this.lia.check();
    if (move.kind === "branch") this.mkBound(this.lia.term, move.offset, !move.isUpper);
    else if (move.kind === "cut") {
      this.resetEvidence();
      for (const constraint of this.lia.explanation) this.setEvidence(constraint);
      const atom = this.mkBound(this.lia.term, move.offset, !move.isUpper);
      this.context.assign(
        this.context.getLiteral(atom),
        new TheoryJustification(this.coreLiterals, []),
      );
    } else if (move.kind === "conflict") {
      this.explanation.clear();
      this.explanation.addExplanation(this.lia.explanation);
      this.setConflict();
    }
    return move.kind === "sat";
  }

  // mk_bound: the atom of a bound on an lp term, over the theory variables of its columns.
  private mkBound(lpTerm: LarTerm, inputOffset: Rational, inputIsLower: boolean) {
    const manager = this.manager;
    const context = this.context;
    let coeffs = this.getTermCoeffs(lpTerm);
    let offset = inputOffset;
    let isLower = inputIsLower;
    let lcm = offset.den;
    const isInt = coeffs.every((entry) => this.isIntVar(entry[0]));
    if (isInt) {
      for (const entry of coeffs) lcm = getLcm(lcm, entry[1].den);
      if (lcm !== 1n) {
        const scale = Rational.of(lcm);
        offset = offset.mul(scale);
        coeffs = coeffs.map((entry) => [entry[0], entry[1].mul(scale)]);
      }
      let gcd = 0n;
      for (const entry of coeffs) gcd = getGcd(gcd, entry[1].num);
      if (gcd !== 0n && gcd !== 1n) {
        const divisor = Rational.of(gcd);
        coeffs = coeffs.map((entry) => [entry[0], entry[1].div(divisor)]);
        offset = isLower ? offset.div(divisor).ceil() : offset.div(divisor).floor();
      }
    }
    if (coeffs.length > 0 && coeffs[0][1].isNegative()) {
      offset = offset.neg();
      isLower = !isLower;
      coeffs = coeffs.map((entry) => [entry[0], entry[1].neg()]);
    }
    const summands = coeffs
      .filter((entry) => !entry[1].isZero())
      .map((entry) => {
        const expr = this.getExpr(entry[0]);
        return entry[1].equals(Rational.one)
          ? expr
          : manager.mkApp(OP_MUL, [manager.mkNumeral(Number(entry[1].num)), expr], SORT_INT);
      });
    const term =
      summands.length === 0
        ? manager.mkNumeral(0)
        : summands.length === 1
          ? summands[0]
          : manager.mkApp(OP_ADD, summands, SORT_INT);
    const atom = manager.mkApp(
      isLower ? OP_GE : OP_LE,
      [term, manager.mkNumeral(Number(offset.num))],
      SORT_BOOL,
    );
    context.internalize(atom, true);
    context.markAsRelevant(atom);
    return atom;
  }

  private initVariableValues() {
    this.isModelInitialized = false;
    if (this.context.checkCanceled() || this.getNumVars() === 0) return;
    const saved = this.isModelInitialized;
    this.context.pushTrail(() => {
      this.isModelInitialized = saved;
    });
    this.isModelInitialized = this.solver.initModel();
  }

  private isRelevantAndShared(node: Enode) {
    return this.context.isRelevant(node.owner) && this.isShared(node);
  }

  // random_update: moves the values of shared variables that collide with others.
  private randomUpdate() {
    const solver = this.solver;
    const byValue = new Map<string, number>();
    const tmpVarSet = new Set<number>();
    const columns: number[] = [];
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      if (!this.isRelevantAndShared(this.getEnode(thVar))) continue;
      const column = this.registerVar(thVar);
      const key = `${this.isIntVar(thVar)}:${solver.getValue(column)}`;
      const other = byValue.get(key);
      if (other === undefined) {
        byValue.set(key, thVar);
        continue;
      }
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

  // assume_eqs: model-based theory combination.
  private assumeEqs() {
    if (this.delayedAssumeEqs()) return true;
    this.randomUpdate();
    const context = this.context;
    const solver = this.solver;
    const numVars = this.getNumVars();
    const oldSize = this.assumeEqCandidates.length;
    let numCandidates = 0;
    const start = context.getRandomValue();
    const byValue = new Map<string, number>();
    for (let index = 0; index < numVars; index++) {
      const thVar = (index + start) % numVars;
      if (!this.isRelevantAndShared(this.getEnode(thVar))) continue;
      const column = this.registerVar(thVar);
      const key = `${this.isIntVar(thVar)}:${solver.getValue(column)}`;
      const other = byValue.get(key);
      if (other === undefined) {
        byValue.set(key, thVar);
        continue;
      }
      if (this.isEqual(thVar, other)) continue;
      this.assumeEqCandidates.push([thVar, other]);
      numCandidates++;
    }
    if (numCandidates > 0)
      context.pushTrail(() => {
        this.assumeEqCandidates.length = oldSize;
      });
    return this.delayedAssumeEqs();
  }

  private delayedAssumeEqs() {
    if (this.assumeEqHead === this.assumeEqCandidates.length) return false;
    const saved = this.assumeEqHead;
    this.context.pushTrail(() => {
      this.assumeEqHead = saved;
    });
    const solver = this.solver;
    while (this.assumeEqHead < this.assumeEqCandidates.length) {
      const candidate = this.assumeEqCandidates[this.assumeEqHead];
      this.assumeEqHead++;
      const isEq = solver
        .getValue(this.registerVar(candidate[0]))
        .equals(solver.getValue(this.registerVar(candidate[1])));
      if (
        isEq &&
        !this.isEqual(candidate[0], candidate[1]) &&
        this.context.assumeEq(this.getEnode(candidate[0]), this.getEnode(candidate[1]))
      )
        return true;
    }
    return false;
  }

  // The model.

  // init_model: the model knows the value of every theory variable, so fresh integers avoid them.
  initModel(model: ProtoModel) {
    this.initVariableValues();
    if (!this.isModelInitialized) return;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++)
      if (this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR)
        model.registerValue(this.getValueExpr(thVar));
  }

  // mk_value: the value of the class of a root, rounded down for an integer.
  mkValue(node: Enode) {
    return node.thVar < 0 ? undefined : this.getValueExpr(node.thVar);
  }

  private getValue(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    return column === NULL_LPVAR ? Rational.zero : this.solver.getModelValue(column);
  }

  private getValueExpr(thVar: number) {
    return this.manager.mkNumeral(Number(this.getValue(thVar).floor().num));
  }

  // Scopes.

  pushScopeEh() {
    this.scopes.push({
      boundsLimit: this.boundsTrail.length,
      assertedQhead: this.assertedQhead,
      assertedAtomsLimit: this.assertedAtoms.length,
      numVars: this.getNumVars(),
    });
    this.solver.push();
  }

  popScopeEh(numScopes = 1) {
    if (numScopes === 0) return;
    const oldSize = this.scopes.length - numScopes;
    const scope = this.scopes[oldSize];
    for (let index = this.boundsTrail.length; index-- > scope.boundsLimit;)
      this.bounds[this.boundsTrail[index]].pop();
    this.boundsTrail.length = scope.boundsLimit;
    this.assertedAtoms.length = scope.assertedAtomsLimit;
    this.assertedQhead = scope.assertedQhead;
    this.scopes.length = oldSize;
    this.solver.pop(numScopes);
    const numConstraints = this.solver.constraints.constraints.length;
    if (this.constraintSources.length > numConstraints)
      this.constraintSources.length = numConstraints;
    this.newBounds = [];
    this.varEnodes.length = scope.numVars;
  }

  restartEh() {}

  initSearchEh() {
    this.numConflicts = 0;
  }

  // arith_eq_adapter.

  // arith_eq_adapter.

  private mkEqAxioms(inputFirst: Enode, inputSecond: Enode) {
    if (inputFirst === inputSecond) return;
    const context = this.context;
    const manager = this.manager;
    const isSwapped = inputFirst.owner > inputSecond.owner;
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    let t1 = first.owner;
    let t2 = second.owner;
    if (manager.isNumeral(t1) && manager.isNumeral(t2)) return;
    const key = `${t1}:${t2}`;
    if (this.processedEqs.has(key)) return;
    this.processedEqs.add(key);
    context.pushTrail(() => this.processedEqs.delete(key));
    const eq = context.mkEqAtom(t1, t2);
    if (manager.isNumeral(t1)) {
      const saved = t1;
      t1 = t2;
      t2 = saved;
    }
    const zero = manager.mkNumeral(0);
    let le: number;
    let ge: number;
    if (manager.isNumeral(t2)) {
      le = manager.mkApp(OP_LE, [t1, t2], SORT_BOOL);
      ge = manager.mkApp(OP_GE, [t1, t2], SORT_BOOL);
    } else {
      const difference = manager.mkApp(
        OP_ADD,
        [t1, manager.mkApp(OP_MUL, [manager.mkNumeral(-1), t2], SORT_INT)],
        SORT_INT,
      );
      le = manager.mkApp(OP_LE, [difference, zero], SORT_BOOL);
      ge = manager.mkApp(OP_GE, [difference, zero], SORT_BOOL);
    }
    context.internalize(eq, true);
    context.internalize(le, true);
    context.internalize(ge, true);
    const eqLiteral = context.getLiteral(eq);
    const leLiteral = context.getLiteral(le);
    const geLiteral = context.getLiteral(ge);
    if (context.isTrueFirst(getVar(eqLiteral))) {
      context.setTrueFirstFlag(getVar(leLiteral));
      context.setTrueFirstFlag(getVar(geLiteral));
    }
    context.mkThAxiom([negate(eqLiteral), leLiteral]);
    context.mkThAxiom([negate(eqLiteral), geLiteral]);
    context.mkThAxiom([eqLiteral, negate(leLiteral), negate(geLiteral)]);
    const handler = () => {
      if (!context.isRelevant(first.owner) || !context.isRelevant(second.owner)) return;
      context.markAsRelevant(eq);
      context.markAsRelevant(le);
      context.markAsRelevant(ge);
    };
    context.relevancy.addHandler(first.owner, handler);
    context.relevancy.addHandler(second.owner, handler);
  }

  internalizeEqEh(expr: number) {
    const context = this.context;
    const args = this.manager.args[expr];
    const first = context.getEnode(args[0]);
    const second = context.getEnode(args[1]);
    if (first === undefined || second === undefined) return;
    if (first.thVar >= 0 && second.thVar >= 0 && first !== second) this.mkEqAxioms(first, second);
  }

  newEqEh(first: number, second: number) {
    this.mkEqAxioms(this.getEnode(first), this.getEnode(second));
  }

  newDiseqEh(first: number, second: number) {
    this.mkEqAxioms(this.getEnode(first), this.getEnode(second));
  }

  relevantEh(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op !== OP_IDIV && op !== OP_MOD) return;
    const args = manager.args[expr];
    const key = `${args[0]}:${args[1]}`;
    if (this.processedDivMods.has(key)) return;
    this.processedDivMods.add(key);
    this.context.pushTrail(() => this.processedDivMods.delete(key));
    this.mkIdivModAxioms(args[0], args[1]);
  }

  // mk_literal.
  private mkLiteral(atom: number) {
    const context = this.context;
    if (!context.isEInternalized(atom)) context.internalize(atom, false);
    return context.getLiteral(atom);
  }

  // ensure_enode: the relevant enode of a term.
  private ensureEnode(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    context.markAsRelevant(expr);
    const node = context.getEnode(expr);
    if (node === undefined) throw new Error("the term was not internalized");
    return node;
  }

  // mk_axiom: a theory axiom whose literals are relevant. Of two literals, the second becomes
  // relevant only once the first is false.
  private mkAxiom(literals: Literal[]) {
    const context = this.context;
    context.mkThAxiom(literals);
    if (!context.relevancy.isEnabled) return;
    if (literals.length !== 2) {
      for (const literal of literals) context.markLiteralAsRelevant(literal);
      return;
    }
    context.markLiteralAsRelevant(literals[0]);
    const consequent = context.boolVar2Expr[getVar(literals[1])];
    context.relevancy.addWatch(
      context.boolVar2Expr[getVar(literals[0])],
      isNegated(literals[0]),
      () => context.markAsRelevant(consequent),
    );
  }

  // mk_idiv_mod_axioms: q * (div p q) + (mod p q) = p and 0 <= (mod p q) < |q| when q is not 0.
  private mkIdivModAxioms(dividend: number, divisor: number) {
    const manager = this.manager;
    const context = this.context;
    if (manager.getNumeral(divisor) === 0) return;
    const quotient = manager.mkApp(OP_IDIV, [dividend, divisor], SORT_INT);
    const remainder = manager.mkApp(OP_MOD, [dividend, divisor], SORT_INT);
    const zero = manager.mkNumeral(0);
    if (manager.getNumeral(dividend) === 0) {
      // q != 0 implies div 0 q = 0 and mod 0 q = 0.
      const isDivisorNonnegative = this.mkLiteral(manager.mkApp(OP_GE, [divisor, zero], SORT_BOOL));
      const isDivisorNonpositive = this.mkLiteral(manager.mkApp(OP_LE, [divisor, zero], SORT_BOOL));
      const consequents = [
        manager.mkApp(OP_GE, [quotient, zero], SORT_BOOL),
        manager.mkApp(OP_LE, [quotient, zero], SORT_BOOL),
        manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL),
        manager.mkApp(OP_LE, [remainder, zero], SORT_BOOL),
      ].map((atom) => this.mkLiteral(atom));
      for (const antecedent of [isDivisorNonnegative, isDivisorNonpositive])
        for (const consequent of consequents) this.mkAxiom([antecedent, consequent]);
      return;
    }
    const combination = manager.mkApp(
      OP_ADD,
      [manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT), remainder],
      SORT_INT,
    );
    const eqAtom = context.mkEqAtom(combination, dividend);
    context.internalize(eqAtom, false);
    const eq = context.getLiteral(eqAtom);
    const divisorValue = manager.getNumeral(divisor);
    if (divisorValue !== undefined) {
      this.mkAxiom([eq]);
      this.mkEqAxioms(this.ensureEnode(combination), this.ensureEnode(dividend));
      this.mkAxiom([this.mkLiteral(manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL))]);
      const upper = manager.mkNumeral(Math.abs(divisorValue) - 1);
      this.mkAxiom([this.mkLiteral(manager.mkApp(OP_LE, [remainder, upper], SORT_BOOL))]);
      return;
    }
    // q = 0 or (mod p q) >= 0, q >= 0 or (mod p q) + q <= -1, and q <= 0 or (mod p q) - q <= -1.
    const minusOne = manager.mkNumeral(-1);
    const isZero = this.mkLiteral(manager.mkEq(divisor, zero));
    const isRemainderNonnegative = this.mkLiteral(
      manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL),
    );
    this.mkAxiom([isZero, eq]);
    this.mkAxiom([isZero, isRemainderNonnegative]);
    const isDivisorNonpositive = this.mkLiteral(manager.mkApp(OP_LE, [divisor, zero], SORT_BOOL));
    const isBelowDivisor = this.mkLiteral(
      manager.mkApp(
        OP_LE,
        [
          manager.mkApp(
            OP_ADD,
            [remainder, manager.mkApp(OP_MUL, [minusOne, divisor], SORT_INT)],
            SORT_INT,
          ),
          minusOne,
        ],
        SORT_BOOL,
      ),
    );
    this.mkAxiom([isDivisorNonpositive, isBelowDivisor]);
    const isDivisorNonnegative = this.mkLiteral(manager.mkApp(OP_GE, [divisor, zero], SORT_BOOL));
    const isBelowNegatedDivisor = this.mkLiteral(
      manager.mkApp(
        OP_LE,
        [manager.mkApp(OP_ADD, [remainder, divisor], SORT_INT), minusOne],
        SORT_BOOL,
      ),
    );
    this.mkAxiom([isDivisorNonnegative, isBelowNegatedDivisor]);
    this.mkEqAxioms(this.ensureEnode(combination), this.ensureEnode(dividend));
    // q = 0 or q * (div p q) <= p.
    const isProductBelow = context.rewriter.rewrite(
      manager.mkApp(
        OP_GE,
        [
          manager.mkApp(
            OP_SUB,
            [dividend, manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT)],
            SORT_INT,
          ),
          zero,
        ],
        SORT_BOOL,
      ),
    );
    this.mkAxiom([isZero, this.mkLiteral(isProductBelow)]);
  }

  private isShared(node: Enode) {
    const root = node.root;
    if (this.manager.getOp(root.owner) === OP_ITE) return true;
    if (root.thVar < 0) return false;
    if (this.context.qmanager.isShared(root)) return true;
    for (const parent of root.parents) {
      const family = this.manager.getFamily(parent.owner);
      if (family !== FAMILY_ARITH && family !== FAMILY_BASIC) return true;
    }
    return false;
  }

  // The value that the model gives the class of a term, if the class has a variable.
  private getModelValue(expr: number) {
    const manager = this.manager;
    if (manager.isNumeral(expr)) return Rational.fromNumber(manager.values[expr]);
    const root = this.context.getEnode(expr)?.root;
    return root === undefined || root.thVar < 0 ? undefined : this.getValue(root.thVar);
  }

  // Whether the values of a product, or of div or mod by a nonzero term, agree with the values of
  // its arguments. The remainder of SMT-LIB's division is in [0, |divisor|).
  private isSatisfied(term: number) {
    if (!this.isModelInitialized) return false;
    const manager = this.manager;
    const value = this.getModelValue(term);
    if (value === undefined) return false;
    const values: Rational[] = [];
    for (const arg of manager.args[term]) {
      const argValue = this.getModelValue(arg);
      if (argValue === undefined || !argValue.isInt()) return false;
      values.push(argValue);
    }
    const op = manager.getOp(term);
    if (op !== OP_MUL && op !== OP_IDIV && op !== OP_MOD) return false;
    if (op === OP_MUL)
      return values.reduce((product, factor) => product.mul(factor), Rational.one).equals(value);
    const dividend = values[0];
    const divisor = values[1];
    if (divisor.isZero()) return false;
    const magnitude = divisor.isNegative() ? divisor.neg() : divisor;
    const remainder = dividend.sub(magnitude.mul(dividend.div(magnitude).floor()));
    return value.equals(op === OP_MOD ? remainder : dividend.sub(remainder).div(divisor));
  }
}
