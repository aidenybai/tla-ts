// Ported from Z3 (src/math/lp/nla_transcendentals.h, src/math/lp/nla_transcendentals.cpp), MIT
// license, see z3-license.txt.
import { Rational } from "../rational";
import {
  evalTranscendental,
  getErrorBound,
  PI_2_UPPER,
  PI_UPPER,
  type TranscendentalOp,
} from "../nlsat/transcendental-eval";
import { type ConstraintKind, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { NULL_LPVAR } from "./lar-solver";
import { LarTerm } from "./lar-term";
import type { NlaCore } from "./nla-core";
import { LemmaBuilder, mkIneq } from "./nla-types";

export interface TranscendentalApp {
  readonly op: TranscendentalOp;
  readonly arg: number;
  readonly val: number;
}

export interface Atan2App {
  readonly y: number;
  readonly x: number;
  readonly val: number;
}

// atan2 has a branch cut where it jumps by 2 pi, so its error bound is generous.
const getAtan2ErrorBound = (value: number) => 4096 * Number.EPSILON * Math.max(1, Math.abs(value));

// Z3's arith.nl.transcendental_tolerance.
const TOLERANCE = 0.0000001;

const mkTerm = (first: number, firstCoeff: number, second: number, secondCoeff: number) =>
  new LarTerm([
    [first, Rational.fromNumber(firstCoeff)],
    [second, Rational.fromNumber(secondCoeff)],
  ]);

// A cheap check of the applications of transcendental functions against the LP assignment. It adds
// exact range bounds and linear lemmas, and leaves the polynomial refinement to nlsat, which a
// value away from the function by more than round-off sends the problem to.
export class NlaTranscendentals {
  readonly apps: TranscendentalApp[] = [];
  readonly atan2Apps: Atan2App[] = [];
  piVar = NULL_LPVAR;
  numFailures = 0;

  constructor(private core: NlaCore) {}

  get isEmpty() {
    return this.apps.length === 0 && this.atan2Apps.length === 0;
  }

  private addVarBound(column: number, kind: ConstraintKind, bound: Rational) {
    const lra = this.core.lra;
    lra.activate(lra.mkVarBound(column, kind, bound));
  }

  add(op: TranscendentalOp, arg: number, val: number) {
    if (arg === NULL_LPVAR || val === NULL_LPVAR) return;
    this.apps.push({ op, arg, val });
    this.core.emons.trail.push(() => this.apps.pop());
    this.addRangeAxioms(op, val);
  }

  addPi(val: number) {
    if (val === NULL_LPVAR || this.piVar !== NULL_LPVAR) return;
    this.core.emons.trail.push(() => {
      this.piVar = NULL_LPVAR;
    });
    this.piVar = val;
    this.addVarBound(val, KIND_GE, Rational.of(31415n, 10000n));
    this.addVarBound(val, KIND_LE, Rational.of(31416n, 10000n));
  }

  addAtan2(y: number, x: number, val: number) {
    if (y === NULL_LPVAR || x === NULL_LPVAR || val === NULL_LPVAR) return;
    this.atan2Apps.push({ y, x, val });
    this.core.emons.trail.push(() => this.atan2Apps.pop());
    this.addVarBound(val, KIND_LE, PI_UPPER);
    this.addVarBound(val, KIND_GE, PI_UPPER.neg());
  }

  private addRangeAxioms(op: TranscendentalOp, val: number) {
    const addBounds = (
      lowerKind: ConstraintKind,
      lower: Rational,
      upperKind: ConstraintKind,
      upper: Rational,
    ) => {
      this.addVarBound(val, upperKind, upper);
      this.addVarBound(val, lowerKind, lower);
    };
    if (op === "sin" || op === "cos") addBounds(KIND_GE, Rational.minusOne, KIND_LE, Rational.one);
    else if (op === "tanh") addBounds(KIND_GT, Rational.minusOne, KIND_LT, Rational.one);
    else if (op === "cosh") this.addVarBound(val, KIND_GE, Rational.one);
    else if (op === "acosh") this.addVarBound(val, KIND_GE, Rational.zero);
    else if (op === "asin") addBounds(KIND_GE, PI_2_UPPER.neg(), KIND_LE, PI_2_UPPER);
    else if (op === "atan") addBounds(KIND_GT, PI_2_UPPER.neg(), KIND_LT, PI_2_UPPER);
    else if (op === "acos") addBounds(KIND_GE, Rational.zero, KIND_LE, PI_UPPER);
    else if (op === "exp") this.addVarBound(val, KIND_GT, Rational.zero);
  }

  // sin, tanh and atan vanish at 0 and are 1-Lipschitz, so they stay below x for x >= 0 and above
  // it for x <= 0.
  private checkLinearMajorant(app: TranscendentalApp) {
    if (app.op !== "sin" && app.op !== "tanh" && app.op !== "atan") return false;
    const arg = this.core.val(app.arg);
    const val = this.core.val(app.val);
    const difference = mkTerm(app.val, 1, app.arg, -1);
    if (!arg.isNegative() && val.compare(arg) > 0) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(app.arg, KIND_LT, 0))
        .addIneq(mkIneq(difference, KIND_LE, 0));
      return true;
    }
    if (!arg.isPositive() && val.compare(arg) < 0) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(app.arg, KIND_GT, 0))
        .addIneq(mkIneq(difference, KIND_GE, 0));
      return true;
    }
    return false;
  }

  // sin is positive on (0, pi) and negative on (-pi, 0), and cos is positive on (-pi/2, pi/2) and
  // negative on (pi/2, 3pi/2), stated in terms of the pi column rather than its bounds.
  private checkSignOnPiRange(app: TranscendentalApp) {
    if (this.piVar === NULL_LPVAR || (app.op !== "sin" && app.op !== "cos")) return false;
    const core = this.core;
    const arg = core.val(app.arg);
    const val = core.val(app.val);
    const pi = core.val(this.piVar);
    if (app.op === "sin") {
      if (arg.isPositive() && arg.compare(pi) < 0 && !val.isPositive()) {
        new LemmaBuilder(this.core)
          .addIneq(mkIneq(app.arg, KIND_LE, 0))
          .addIneq(mkIneq(mkTerm(app.arg, 1, this.piVar, -1), KIND_GE, 0))
          .addIneq(mkIneq(app.val, KIND_GT, 0));
        return true;
      }
      if (arg.isNegative() && arg.compare(pi.neg()) > 0 && !val.isNegative()) {
        new LemmaBuilder(this.core)
          .addIneq(mkIneq(app.arg, KIND_GE, 0))
          .addIneq(mkIneq(mkTerm(app.arg, 1, this.piVar, 1), KIND_LE, 0))
          .addIneq(mkIneq(app.val, KIND_LT, 0));
        return true;
      }
      return false;
    }
    const twice = arg.mul(Rational.of(2n));
    if (twice.compare(pi.neg()) > 0 && twice.compare(pi) < 0 && !val.isPositive()) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(mkTerm(app.arg, 2, this.piVar, 1), KIND_LE, 0))
        .addIneq(mkIneq(mkTerm(app.arg, 2, this.piVar, -1), KIND_GE, 0))
        .addIneq(mkIneq(app.val, KIND_GT, 0));
      return true;
    }
    if (twice.compare(pi) > 0 && twice.compare(pi.mul(Rational.of(3n))) < 0 && !val.isNegative()) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(mkTerm(app.arg, 2, this.piVar, -1), KIND_LE, 0))
        .addIneq(mkIneq(mkTerm(app.arg, 2, this.piVar, -3), KIND_GE, 0))
        .addIneq(mkIneq(app.val, KIND_LT, 0));
      return true;
    }
    return false;
  }

  // exp(x) >= 1 + x everywhere.
  private checkExpLowerBound(app: TranscendentalApp) {
    if (app.op !== "exp") return false;
    const arg = this.core.val(app.arg);
    if (this.core.val(app.val).compare(arg.add(Rational.one)) >= 0) return false;
    new LemmaBuilder(this.core).addIneq(mkIneq(mkTerm(app.val, 1, app.arg, -1), KIND_GE, 1));
    return true;
  }

  // log(x) <= x - 1 for x > 0.
  private checkLogUpperBound(app: TranscendentalApp) {
    if (app.op !== "log") return false;
    const arg = this.core.val(app.arg);
    if (!arg.isPositive() || this.core.val(app.val).compare(arg.sub(Rational.one)) <= 0)
      return false;
    new LemmaBuilder(this.core)
      .addIneq(mkIneq(app.arg, KIND_LE, 0))
      .addIneq(mkIneq(mkTerm(app.val, 1, app.arg, -1), KIND_LE, -1));
    return true;
  }

  // exp is increasing, and so is log on positive arguments.
  private checkMonotonicity(app: TranscendentalApp) {
    if (app.op !== "exp" && app.op !== "log") return false;
    const core = this.core;
    const arg = core.val(app.arg);
    if (app.op === "log" && !arg.isPositive()) return false;
    const val = core.val(app.val);
    for (const other of this.apps) {
      if (other.op !== app.op || other.arg === app.arg) continue;
      const otherArg = core.val(other.arg);
      if (app.op === "log" && !otherArg.isPositive()) continue;
      const otherVal = core.val(other.val);
      const isLess = arg.compare(otherArg) < 0 && val.compare(otherVal) >= 0;
      if (!isLess && !(arg.compare(otherArg) > 0 && val.compare(otherVal) <= 0)) continue;
      const lemma = new LemmaBuilder(core);
      if (app.op === "log")
        lemma.addIneq(mkIneq(app.arg, KIND_LE, 0)).addIneq(mkIneq(other.arg, KIND_LE, 0));
      lemma
        .addIneq(mkIneq(mkTerm(app.arg, 1, other.arg, -1), isLess ? KIND_GE : KIND_LE, 0))
        .addIneq(mkIneq(mkTerm(app.val, 1, other.val, -1), isLess ? KIND_LT : KIND_GT, 0));
      return true;
    }
    return false;
  }

  // A value away from the function by more than round-off is a failure, which only nlsat can
  // settle. A value outside the domain is left to the rest of the solver.
  private checkApp(app: TranscendentalApp) {
    if (
      this.checkLinearMajorant(app) ||
      this.checkSignOnPiRange(app) ||
      this.checkExpLowerBound(app) ||
      (app.op === "exp" && this.checkMonotonicity(app)) ||
      this.checkLogUpperBound(app) ||
      (app.op === "log" && this.checkMonotonicity(app))
    )
      return true;
    const arg = this.core.val(app.arg).toDouble();
    const result = evalTranscendental(app.op, arg);
    if (!Number.isFinite(result)) return false;
    const distance = Math.abs(this.core.val(app.val).toDouble() - result);
    if (distance > getErrorBound(app.op, arg, result)) this.numFailures++;
    return false;
  }

  // sign(atan2(y, x)) = sign(y) for y != 0. Past that, a value away from atan2 by more than the
  // tolerance splits on x.
  private checkAtan2(app: Atan2App) {
    const core = this.core;
    const y = core.val(app.y);
    const x = core.val(app.x);
    const val = core.val(app.val);
    if (y.isPositive() && !val.isPositive()) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(app.y, KIND_LE, 0))
        .addIneq(mkIneq(app.val, KIND_GT, 0));
      return true;
    }
    if (y.isNegative() && !val.isNegative()) {
      new LemmaBuilder(this.core)
        .addIneq(mkIneq(app.y, KIND_GE, 0))
        .addIneq(mkIneq(app.val, KIND_LT, 0));
      return true;
    }
    const result = Math.atan2(y.toDouble(), x.toDouble());
    if (!Number.isFinite(result)) return false;
    const distance = Math.abs(val.toDouble() - result);
    const error = getAtan2ErrorBound(result);
    if (distance <= error) return false;
    this.numFailures++;
    if (distance <= error + TOLERANCE) return false;
    core.literals.push(mkIneq(app.x, KIND_LE, x));
    return true;
  }

  // Stops at the first lemma.
  check() {
    if (this.isEmpty || this.core.isUsingNraModel) return;
    for (const app of this.apps) if (this.checkApp(app)) return;
    for (const app of this.atan2Apps) if (this.checkAtan2(app)) return;
  }

  // Checks nlsat's model of every application against round-off.
  isNraModelValid() {
    const core = this.core;
    if (!core.isUsingNraModel) return false;
    const getMiddle = (lpVar: number) => {
      const [low, high] = core.nra.am.getInterval(core.nra.value(lpVar), 64);
      return low.add(high).div(Rational.of(2n)).toDouble();
    };
    for (const app of this.apps) {
      const arg = getMiddle(app.arg);
      const result = evalTranscendental(app.op, arg);
      if (!Number.isFinite(result)) continue;
      if (Math.abs(getMiddle(app.val) - result) > getErrorBound(app.op, arg, result)) return false;
    }
    for (const app of this.atan2Apps) {
      const result = Math.atan2(getMiddle(app.y), getMiddle(app.x));
      if (!Number.isFinite(result)) continue;
      if (Math.abs(getMiddle(app.val) - result) > getAtan2ErrorBound(result)) return false;
    }
    return true;
  }
}
