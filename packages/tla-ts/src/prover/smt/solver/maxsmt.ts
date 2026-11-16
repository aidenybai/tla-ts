// Ported from Z3 (src/opt/maxsmt.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import { L_FALSE, L_UNDEF } from "./lbool";
import { Maxcore } from "./maxcore";
import { isMaxlex, Maxlex } from "./maxlex";
import type { MaxsatContext, MaxsmtSolverBase, Soft } from "./maxsmt-base";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

export class Maxsmt {
  private soft: Soft[] = [];
  private softIndex = new Map<number, number>();
  private terms: RefVector;
  private msolver: MaxsmtSolverBase | null = null;
  private lower = Rational.zero;
  private upper = Rational.zero;
  model: ProtoModel | null = null;

  constructor(
    private readonly context: MaxsatContext,
    private readonly index: number,
  ) {
    this.terms = new RefVector(context.manager);
  }

  run(isCommitted: boolean) {
    const context = this.context;
    const engine = context.params.maxsatEngine;
    this.msolver?.release();
    this.msolver = null;
    if (!isCommitted && context.params.isMaxlexEnabled && isMaxlex(this.soft))
      this.msolver = new Maxlex(context, this.index, this.soft);
    else if (this.soft.length === 0 || engine === "maxres")
      this.msolver = new Maxcore(context, this.index, this.soft);
    else throw new SmtUnsupportedError(`the MaxSAT engine ${engine}`);
    const status = (() => {
      try {
        return this.msolver.run();
      } catch (error) {
        if (!(error instanceof SmtCanceledError)) throw error;
        return L_UNDEF;
      }
    })();
    if (status !== L_FALSE) this.model = this.msolver.model;
    return status;
  }

  add(expr: number, weight: Rational) {
    const existing = this.softIndex.get(expr);
    if (existing !== undefined) this.soft[existing].weight = this.soft[existing].weight.add(weight);
    else {
      this.terms.push(expr);
      this.softIndex.set(expr, this.soft.length);
      this.soft.push({ expr, weight, value: L_UNDEF });
    }
    this.upper = this.upper.add(weight);
  }

  getLower() {
    const lower = this.msolver?.lower;
    return this.context.adjust(
      this.index,
      lower !== undefined && lower.compare(this.lower) > 0 ? lower : this.lower,
    );
  }

  getUpper() {
    const upper = this.msolver?.upper;
    return this.context.adjust(
      this.index,
      upper !== undefined && upper.compare(this.upper) < 0 ? upper : this.upper,
    );
  }

  updateLower(value: Rational) {
    this.lower = value;
  }

  updateUpper(value: Rational) {
    this.upper = value;
  }

  commitAssignment() {
    this.msolver?.commitAssignment();
  }

  release() {
    this.msolver?.release();
    this.msolver = null;
    this.terms.reset();
  }
}
