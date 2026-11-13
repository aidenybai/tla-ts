// Ported from Z3 (src/nlsat/nlsat_transcendentals.h, src/nlsat/nlsat_transcendentals.cpp), MIT
// license, see z3-license.txt.
import { getLcm, Rational } from "../rational";
import { Anum } from "./algebraic";
import { NULL_VAR } from "./polynomial";
import type { NlsatSolver } from "./solver";
import {
  getAtanTaylorBracket,
  getExpTaylorBracket,
  getLogTaylorBracket,
  getSinCosTaylorBracket,
  getWideIntervalEval,
  PI_2_UPPER,
  PI_LOWER_BRACKET,
  PI_UPPER,
  PI_UPPER_BRACKET,
  type TranscendentalOp,
} from "./transcendental-eval";

interface App {
  op: TranscendentalOp;
  arg: number;
  val: number;
  // Refinements in a row, each of which widens the box the next one excludes.
  retries: number;
}

interface Atan2App {
  y: number;
  x: number;
  val: number;
  retries: number;
}

const TWO = Rational.of(2n);

// A box around the witness rather than the point alone, so that converging toward a point where
// the function touches an axiom takes logarithmically many rounds.
const getExclusionDelta = (scale: Rational, retries: number) =>
  Rational.of(1n << BigInt(Math.min(retries, 30)), 1000000n).mul(scale);

export class NlsatTranscendentals {
  private apps: App[] = [];
  private atan2Apps: Atan2App[] = [];
  private hasPi = false;

  constructor(private solver: NlsatSolver) {}

  get isEmpty() {
    return this.apps.length === 0 && this.atan2Apps.length === 0;
  }

  private mkBoundLiteral(variable: number, kind: "LT" | "GT", bound: Rational) {
    const polynomial = this.solver.pm.mkLinear([bound.den], [variable], -bound.num);
    return this.solver.mkIneqLiteral(kind, [polynomial], [false]);
  }

  // first * firstCoeff + second * secondCoeff kind bound.
  private mkLinearLiteral(
    first: number,
    firstCoeff: Rational,
    second: number,
    secondCoeff: Rational,
    kind: "LT" | "GT",
    bound: Rational,
  ) {
    const den = Rational.of(getLcm(firstCoeff.den, getLcm(secondCoeff.den, bound.den)));
    const polynomial = this.solver.pm.mkLinear(
      [firstCoeff.mul(den).num, secondCoeff.mul(den).num],
      [first, second],
      bound.mul(den).neg().num,
    );
    return this.solver.mkIneqLiteral(kind, [polynomial], [false]);
  }

  private mkClause(literals: readonly number[]) {
    this.solver.mkExternalClause(literals, null);
  }

  private compare(anum: Anum, value: Rational) {
    return this.solver.am.compare(anum, new Anum(value));
  }

  private isPos(anum: Anum) {
    return !this.solver.am.isZero(anum) && !this.solver.am.isNeg(anum);
  }

  add(op: TranscendentalOp, arg: number, val: number) {
    this.apps.push({ op, arg, val, retries: 0 });
    this.addGlobalAxioms(op, arg, val);
    this.addRangeAxioms(op, val);
    this.addIdentityAxioms(op, arg, val);
  }

  addPi(val: number) {
    if (val === NULL_VAR || this.hasPi) return;
    this.hasPi = true;
    const lower = this.mkBoundLiteral(val, "LT", PI_LOWER_BRACKET) ^ 1;
    const upper = this.mkBoundLiteral(val, "GT", PI_UPPER_BRACKET) ^ 1;
    this.mkClause([lower]);
    this.mkClause([upper]);
  }

  addAtan2(y: number, x: number, val: number) {
    if (y === NULL_VAR || x === NULL_VAR || val === NULL_VAR) return;
    this.atan2Apps.push({ y, x, val, retries: 0 });
    this.addBounds(val, PI_UPPER.neg(), PI_UPPER);
  }

  private addBounds(val: number, lower: Rational, upper: Rational) {
    const belowUpper = this.mkBoundLiteral(val, "GT", upper) ^ 1;
    const aboveLower = this.mkBoundLiteral(val, "LT", lower) ^ 1;
    this.mkClause([belowUpper]);
    this.mkClause([aboveLower]);
  }

  // The tangent lines exp(x) >= 1 + x and log(x) <= x - 1 hold on the whole domain.
  private addGlobalAxioms(op: TranscendentalOp, arg: number, val: number) {
    if (op === "exp") {
      this.mkClause([
        this.mkLinearLiteral(val, Rational.one, arg, Rational.minusOne, "LT", Rational.one) ^ 1,
      ]);
      this.mkClause([
        this.mkBoundLiteral(arg, "LT", Rational.zero) ^ 1,
        this.mkBoundLiteral(val, "LT", Rational.one),
      ]);
    } else if (op === "log")
      this.mkClause([
        this.mkBoundLiteral(arg, "GT", Rational.zero) ^ 1,
        this.mkLinearLiteral(val, Rational.one, arg, Rational.minusOne, "GT", Rational.minusOne) ^
          1,
      ]);
  }

  private addRangeAxioms(op: TranscendentalOp, val: number) {
    if (op === "sin" || op === "cos") this.addBounds(val, Rational.minusOne, Rational.one);
    else if (op === "tanh") {
      const aboveLower = this.mkBoundLiteral(val, "GT", Rational.minusOne);
      const belowUpper = this.mkBoundLiteral(val, "LT", Rational.one);
      this.mkClause([aboveLower]);
      this.mkClause([belowUpper]);
    } else if (op === "cosh") this.mkClause([this.mkBoundLiteral(val, "LT", Rational.one) ^ 1]);
    else if (op === "acosh") this.mkClause([this.mkBoundLiteral(val, "LT", Rational.zero) ^ 1]);
    else if (op === "asin") this.addBounds(val, PI_2_UPPER.neg(), PI_2_UPPER);
    else if (op === "acos") this.addBounds(val, Rational.zero, PI_UPPER);
  }

  // sin^2 + cos^2 = 1, cosh^2 - sinh^2 = 1 and cosh^2 (1 - tanh^2) = 1 for applications to the
  // same argument.
  private addIdentityAxioms(op: TranscendentalOp, arg: number, val: number) {
    for (const other of this.apps.slice(0, -1)) {
      if (other.arg !== arg) continue;
      const pair = `${op} ${other.op}`;
      if (pair === "sin cos") this.addIdentityAxiom("sin", val, other.val);
      else if (pair === "cos sin") this.addIdentityAxiom("sin", other.val, val);
      else if (pair === "sinh cosh") this.addIdentityAxiom("sinh", other.val, val);
      else if (pair === "cosh sinh") this.addIdentityAxiom("sinh", val, other.val);
      else if (pair === "tanh cosh") this.addIdentityAxiom("tanh", other.val, val);
      else if (pair === "cosh tanh") this.addIdentityAxiom("tanh", val, other.val);
    }
  }

  private addIdentityAxiom(kind: "sin" | "sinh" | "tanh", first: number, second: number) {
    const pm = this.solver.pm;
    const firstSquare = pm.mul(pm.mkVar(first), pm.mkVar(first));
    const secondSquare = pm.mul(pm.mkVar(second), pm.mkVar(second));
    const one = pm.mkConst(1n);
    const equation =
      kind === "sin"
        ? pm.sub(pm.add(firstSquare, secondSquare), one)
        : kind === "sinh"
          ? pm.sub(pm.sub(firstSquare, secondSquare), one)
          : pm.sub(pm.sub(firstSquare, pm.mul(firstSquare, secondSquare)), one);
    this.mkClause([this.solver.mkIneqLiteral("EQ", [equation], [false])]);
  }

  // Exact Taylor brackets: exp, log and atan are increasing where their series apply, and the
  // bracket of sin and cos accounts for an extremum inside the box.
  private getExactBracket(op: TranscendentalOp, low: Rational, high: Rational) {
    if (op === "sin" || op === "cos") return getSinCosTaylorBracket(op, low, high);
    const getBracket =
      op === "exp"
        ? getExpTaylorBracket
        : op === "log"
          ? getLogTaylorBracket
          : op === "atan"
            ? getAtanTaylorBracket
            : undefined;
    const lowBracket = getBracket?.(low);
    const highBracket = lowBracket && getBracket?.(high);
    if (lowBracket === undefined || highBracket === undefined) return undefined;
    return { low: lowBracket.low, high: highBracket.high };
  }

  // Excludes the box [low, high] of arg unless val lies in [valLow, valHigh].
  private excludeBox(app: App, low: Rational, high: Rational, valLow: Rational, valHigh: Rational) {
    const value = this.solver.getValue(app.val);
    if (this.compare(value, valLow) >= 0 && this.compare(value, valHigh) <= 0) {
      app.retries = 0;
      return false;
    }
    this.mkClause([
      this.mkBoundLiteral(app.arg, "LT", low),
      this.mkBoundLiteral(app.arg, "GT", high),
      this.compare(value, valLow) < 0
        ? this.mkBoundLiteral(app.val, "LT", valLow) ^ 1
        : this.mkBoundLiteral(app.val, "GT", valHigh) ^ 1,
    ]);
    app.retries++;
    return true;
  }

  private refineApp(app: App) {
    const [low, high] = this.solver.am.getInterval(this.solver.getValue(app.arg), 64);
    const middle = low.add(high).div(TWO).abs();
    const delta = getExclusionDelta(
      middle.compare(Rational.one) > 0 ? middle : Rational.one,
      app.retries,
    );
    const wideLow = low.sub(delta);
    const wideHigh = high.add(delta);
    const exact = this.getExactBracket(app.op, wideLow, wideHigh);
    if (exact !== undefined) return this.excludeBox(app, wideLow, wideHigh, exact.low, exact.high);
    const wide = { low: wideLow.toDouble(), high: wideHigh.toDouble() };
    const wideEnclosure = getWideIntervalEval(app.op, wide.low, wide.high);
    const box = wideEnclosure === undefined ? { low: low.toDouble(), high: high.toDouble() } : wide;
    const enclosure = wideEnclosure ?? getWideIntervalEval(app.op, box.low, box.high);
    if (enclosure === undefined) return false;
    return this.excludeBox(
      app,
      Rational.fromDouble(box.low),
      Rational.fromDouble(box.high),
      Rational.fromDouble(enclosure.low),
      Rational.fromDouble(enclosure.high),
    );
  }

  // atan2(y, x) has the sign of y, and lies in the range of the open quadrant of a box around (y,
  // x). A box that crosses an axis may span the branch cut, so it is left alone.
  private refineAtan2(app: Atan2App) {
    const solver = this.solver;
    const am = solver.am;
    const yValue = solver.getValue(app.y);
    const value = solver.getValue(app.val);
    if (this.isPos(yValue) && !this.isPos(value)) {
      this.mkClause([
        this.mkBoundLiteral(app.y, "GT", Rational.zero) ^ 1,
        this.mkBoundLiteral(app.val, "GT", Rational.zero),
      ]);
      return true;
    }
    if (am.isNeg(yValue) && !am.isNeg(value)) {
      this.mkClause([
        this.mkBoundLiteral(app.y, "LT", Rational.zero) ^ 1,
        this.mkBoundLiteral(app.val, "LT", Rational.zero),
      ]);
      return true;
    }
    const [yLow, yHigh] = am.getInterval(yValue, 64);
    const [xLow, xHigh] = am.getInterval(solver.getValue(app.x), 64);
    const scale = [yLow.add(yHigh), xLow.add(xHigh)]
      .map((sum) => sum.div(TWO).abs())
      .reduce((first, second) => (first.compare(second) < 0 ? second : first), Rational.one);
    const delta = getExclusionDelta(scale, app.retries);
    const yWideLow = yLow.sub(delta);
    const yWideHigh = yHigh.add(delta);
    const xWideLow = xLow.sub(delta);
    const xWideHigh = xHigh.add(delta);
    const halfLow = PI_LOWER_BRACKET.div(TWO);
    const halfHigh = PI_UPPER_BRACKET.div(TWO);
    const range =
      yWideLow.isPositive() && xWideLow.isPositive()
        ? { lower: Rational.zero, upper: halfHigh }
        : yWideLow.isPositive() && xWideHigh.isNegative()
          ? { lower: halfLow, upper: PI_UPPER_BRACKET }
          : yWideHigh.isNegative() && xWideHigh.isNegative()
            ? { lower: PI_UPPER_BRACKET.neg(), upper: halfLow.neg() }
            : yWideHigh.isNegative() && xWideLow.isPositive()
              ? { lower: halfHigh.neg(), upper: Rational.zero }
              : undefined;
    if (range === undefined) return false;
    const isBelow = this.compare(value, range.lower) < 0;
    if (!isBelow && this.compare(value, range.upper) <= 0) return false;
    this.mkClause([
      this.mkBoundLiteral(app.y, "LT", yWideLow),
      this.mkBoundLiteral(app.y, "GT", yWideHigh),
      this.mkBoundLiteral(app.x, "LT", xWideLow),
      this.mkBoundLiteral(app.x, "GT", xWideHigh),
      isBelow
        ? this.mkBoundLiteral(app.val, "LT", range.lower) ^ 1
        : this.mkBoundLiteral(app.val, "GT", range.upper) ^ 1,
    ]);
    app.retries++;
    return true;
  }

  // exp is increasing, and so is log on positive arguments.
  private refineMonotonicityPair(first: App, second: App) {
    const solver = this.solver;
    const am = solver.am;
    const firstArg = solver.getValue(first.arg);
    const secondArg = solver.getValue(second.arg);
    if (first.op === "log" && (!this.isPos(firstArg) || !this.isPos(secondArg))) return false;
    const firstVal = solver.getValue(first.val);
    const secondVal = solver.getValue(second.val);
    const isFirstLess = am.compare(firstArg, secondArg) < 0 && am.compare(firstVal, secondVal) >= 0;
    const isSecondLess =
      !isFirstLess && am.compare(secondArg, firstArg) < 0 && am.compare(secondVal, firstVal) >= 0;
    if (!isFirstLess && !isSecondLess) return false;
    const kind = isFirstLess ? "LT" : "GT";
    const domain =
      first.op === "log"
        ? [
            this.mkBoundLiteral(first.arg, "GT", Rational.zero) ^ 1,
            this.mkBoundLiteral(second.arg, "GT", Rational.zero) ^ 1,
          ]
        : [];
    const args = this.mkLinearLiteral(
      first.arg,
      Rational.one,
      second.arg,
      Rational.minusOne,
      kind,
      Rational.zero,
    );
    const vals = this.mkLinearLiteral(
      first.val,
      Rational.one,
      second.val,
      Rational.minusOne,
      kind,
      Rational.zero,
    );
    this.mkClause([...domain, args ^ 1, vals]);
    return true;
  }

  private refineMonotonicity() {
    let isAdded = false;
    for (const [index, first] of this.apps.entries()) {
      if (first.op !== "exp" && first.op !== "log") continue;
      for (const second of this.apps.slice(index + 1))
        if (second.op === first.op && this.refineMonotonicityPair(first, second)) isAdded = true;
    }
    return isAdded;
  }

  // Called when the search finds a model: adds a clause for each application the model violates.
  refine() {
    let isAdded = false;
    for (const app of this.apps) if (this.refineApp(app)) isAdded = true;
    for (const app of this.atan2Apps) if (this.refineAtan2(app)) isAdded = true;
    if (this.refineMonotonicity()) isAdded = true;
    return isAdded;
  }

  // The variables live outside polynomials, so a reorder of the solver renames them here.
  rename(permutation: readonly number[]) {
    for (const app of this.apps) {
      app.arg = permutation[app.arg];
      app.val = permutation[app.val];
    }
    for (const app of this.atan2Apps) {
      app.y = permutation[app.y];
      app.x = permutation[app.x];
      app.val = permutation[app.val];
    }
  }
}
