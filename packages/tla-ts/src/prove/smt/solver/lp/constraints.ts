// Ported from Z3 (src/math/lp/lar_constraints.h), MIT license, see z3-license.txt. The bounds
// that the theory asserts on columns, each with a leaf dependency on its own index, and the set of
// active ones, both undone by pop.
import { Dependency, mkLeaf } from "./dependency";
import { Impq } from "./numeric-pair";
import { shrink } from "../array";

// lconstraint_kind: flipping negates the kind, and halving a non-strict kind gives the strict one.
export const KIND_LE = -2;
export const KIND_LT = -1;
export const KIND_EQ = 0;
export const KIND_GT = 1;
export const KIND_GE = 2;

export type ConstraintKind =
  | typeof KIND_LE
  | typeof KIND_LT
  | typeof KIND_EQ
  | typeof KIND_GT
  | typeof KIND_GE;

export interface LarConstraint {
  readonly column: number;
  readonly kind: ConstraintKind;
  readonly rhs: Impq;
  readonly dep: Dependency;
  isActive: boolean;
}

interface ConstraintScope {
  size: number;
  activeSize: number;
}

export class ConstraintSet {
  readonly constraints: LarConstraint[] = [];
  private active: number[] = [];
  private scopes: ConstraintScope[] = [];

  add(column: number, kind: ConstraintKind, rhs: Impq) {
    const index = this.constraints.length;
    this.constraints.push({ column, kind, rhs, dep: mkLeaf(index), isActive: false });
    return index;
  }

  activate(index: number) {
    const constraint = this.constraints[index];
    if (constraint.isActive) return;
    constraint.isActive = true;
    this.active.push(index);
  }

  pushScope() {
    this.scopes.push({ size: this.constraints.length, activeSize: this.active.length });
  }

  popScope(count: number) {
    const scope = this.scopes[this.scopes.length - count];
    shrink(this.scopes, this.scopes.length - count);
    for (let index = this.active.length; index-- > scope.activeSize;)
      this.constraints[this.active[index]].isActive = false;
    shrink(this.active, scope.activeSize);
    shrink(this.constraints, scope.size);
  }
}
