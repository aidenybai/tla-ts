// Ported from Z3 (src/smt/theory_lra.cpp, src/math/lp/lp_api.h), MIT license, see z3-license.txt.
// The atoms of theory_lra: each is a bound on a column, with axioms between the bounds of the same
// column.
import { OP_GE, OP_IS_INT, OP_LE } from "./ast";
import { BoolVar, Literal, mkLiteral, negate } from "./literal";
import { Rational } from "./rational";
import { KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./lp/constraints";
import { type ApiBound, TheoryLraInternalize } from "./theory-lra-internalize";

interface AssertedAtom {
  boolVar: BoolVar;
  isTrue: boolean;
}

export const getAtomLiteral = (bound: ApiBound) => mkLiteral(bound.boolVar);

export abstract class TheoryLraBounds extends TheoryLraInternalize {
  protected assertedAtoms: AssertedAtom[] = [];
  protected boundsTrail: number[] = [];
  protected boolVarToBound: (ApiBound | undefined)[] = [];
  protected newBounds: ApiBound[] = [];
  protected delayIneqs: number[] = [];

  internalizeAtom(expr: number) {
    const manager = this.manager;
    const context = this.context;
    const op = manager.getOp(expr);
    const boolVar = context.mkBoolVar(expr);
    this.boolVarToBound[boolVar] = undefined;
    context.setVarTheory(boolVar);
    const args = manager.args[expr];
    if (op === OP_IS_INT) {
      this.mkEnode(expr);
      if (!context.relevancy.isEnabled) this.mkIsIntAxiom(expr);
      return true;
    }
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
    const bound = manager.getRationalValue(isRightNumeral ? args[1] : args[0]);
    const isLower = (op === OP_GE) === isRightNumeral;
    const thVar = this.internalizeDef(term);
    const value =
      this.isIntVar(thVar) && !bound.isInt() ? (isLower ? bound.ceil() : bound.floor()) : bound;
    const apiBound = this.mkVarBound(boolVar, thVar, isLower, value);
    this.bounds[thVar].push(apiBound);
    this.updateUnassignedBounds(thVar, 1);
    this.boundsTrail.push(thVar);
    this.boolVarToBound[boolVar] = apiBound;
    this.mkBoundAxioms(apiBound);
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
  protected getBoundKind(bound: ApiBound, isTrue: boolean) {
    if (bound.isLower) return isTrue ? KIND_GE : bound.isInt ? KIND_LE : KIND_LT;
    return isTrue ? KIND_LE : bound.isInt ? KIND_GE : KIND_GT;
  }

  private mkVarBound(boolVar: BoolVar, thVar: number, isLower: boolean, value: Rational) {
    this.pushInternalizeState();
    this.internalizeHead--;
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
  protected flushBoundAxioms() {
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
}
