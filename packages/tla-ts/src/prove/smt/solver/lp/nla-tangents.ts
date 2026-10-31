// Ported from Z3 (src/math/lp/nla_tangent_lemmas.h, src/math/lp/nla_tangent_lemmas.cpp), MIT
// license, see z3-license.txt. The tangent lemmas of nla: for a binary product whose value is
// wrong, the lines through the point of its factors' values and two planes tangent to z = xy that
// cut the point off.
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LarTerm } from "./lar-term";
import {
  type Factor,
  type Factorization,
  getFactorSign,
  KIND_NE,
  LemmaBuilder,
  mkIneq,
  NLA_PARAMS,
  type NlaCore,
} from "./nla-core";
import type { Monic } from "./nla-emonics";
import { THROTTLE_TANGENT_LEMMA } from "./nla-throttle";

interface Point {
  readonly x: Rational;
  readonly y: Rational;
}

const mkPoint = (x: Rational, y: Rational): Point => ({ x, y });

const TWO = Rational.of(2n);

// tangent_imp: the lemmas for one monic and its binary factorization.
class TangentImp {
  private a = mkPoint(Rational.zero, Rational.zero);
  private b = mkPoint(Rational.zero, Rational.zero);
  private readonly correctValue: Rational;
  // Whether the wrong value is below the correct one.
  private readonly isBelow: boolean;
  // Whether the tangent points are strictly inside the bound box.
  private isPlStrictInterior = true;
  private readonly monicVar: number;
  private readonly x: Factor;
  private readonly y: Factor;
  private readonly xVar: number;
  private readonly yVar: number;
  private readonly isMon: boolean;

  constructor(
    private core: NlaCore,
    private xy: Point,
    private value: Rational,
    private monic: Monic,
    factorization: Factorization,
  ) {
    this.correctValue = xy.x.mul(xy.y);
    this.isBelow = value.compare(this.correctValue) < 0;
    this.monicVar = monic.variable;
    this.x = factorization.factors[0];
    this.y = factorization.factors[1];
    this.xVar = this.x.variable;
    this.yVar = this.y.variable;
    this.isMon = factorization.mon !== null;
  }

  run() {
    this.getPoints();
    this.generateLine1();
    this.generateLine2();
    this.generatePlane(this.a);
    this.generatePlane(this.b);
  }

  private explain(lemma: LemmaBuilder) {
    if (this.isMon) return;
    lemma.explainMonic(this.monic);
    lemma.explainFactor(this.x);
    lemma.explainFactor(this.y);
  }

  private generatePlane(plane: Point) {
    const core = this.core;
    if (
      core.throttle.insertSimplifiedTangent(
        THROTTLE_TANGENT_LEMMA,
        this.monicVar,
        this.xVar,
        this.yVar,
        this.isBelow,
      )
    )
      return;
    const lemma = new LemmaBuilder(core);
    core.negateRelation(lemma, this.xVar, getFactorSign(this.x).mul(plane.x));
    core.negateRelation(lemma, this.yVar, getFactorSign(this.y).mul(plane.y));
    const term = new LarTerm();
    term.addMonomial(getFactorSign(this.y).mul(plane.x).neg(), this.yVar);
    term.addMonomial(getFactorSign(this.x).mul(plane.y).neg(), this.xVar);
    term.addMonomial(Rational.one, this.monicVar);
    const cmp = this.isBelow
      ? this.isPlStrictInterior
        ? KIND_GT
        : KIND_GE
      : this.isPlStrictInterior
        ? KIND_LT
        : KIND_LE;
    lemma.addIneq(mkIneq(term, cmp, plane.x.mul(plane.y).neg()));
    this.explain(lemma);
  }

  private generateLine1() {
    const core = this.core;
    if (
      core.throttle.insertTangent(
        THROTTLE_TANGENT_LEMMA,
        this.monicVar,
        this.xVar,
        this.yVar,
        this.isBelow,
        1,
      )
    )
      return;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(this.xVar, KIND_NE, core.val(this.xVar)));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [this.monicVar, Rational.one],
          [this.yVar, getFactorSign(this.y).mul(this.xy.x).neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
    this.explain(lemma);
  }

  private generateLine2() {
    const core = this.core;
    if (
      core.throttle.insertTangent(
        THROTTLE_TANGENT_LEMMA,
        this.monicVar,
        this.xVar,
        this.yVar,
        this.isBelow,
        2,
      )
    )
      return;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(this.yVar, KIND_NE, core.val(this.yVar)));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [this.monicVar, Rational.one],
          [this.xVar, getFactorSign(this.x).mul(this.xy.y).neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
    this.explain(lemma);
  }

  // get_initial_points: two planes tangent to z = xy, at a and at b, that make a cut.
  private getInitialPoints() {
    const x = this.xy.x;
    const y = this.xy.y;
    const isAllInts = this.value.isInt() && x.isInt() && y.isInt();
    const difference = this.correctValue.sub(this.value).abs();
    const delta = isAllInts || Rational.one.compare(difference) <= 0 ? Rational.one : difference;
    if (!this.isBelow) {
      this.a = mkPoint(x.sub(delta), y.add(delta));
      this.b = mkPoint(x.add(delta), y.sub(delta));
      return;
    }
    this.a = mkPoint(x.sub(delta), y.sub(delta));
    this.b = mkPoint(x.add(delta), y.add(delta));
  }

  // push_point: the point moved away from xy, doubling the distance, while the plane still cuts.
  private pushPoint(point: Point) {
    let result = point;
    let difference = mkPoint(point.x.sub(this.xy.x), point.y.sub(this.xy.y));
    for (let steps = 10; steps > 0 && !this.core.done(); steps--) {
      difference = mkPoint(difference.x.mul(TWO), difference.y.mul(TWO));
      const candidate = mkPoint(this.xy.x.add(difference.x), this.xy.y.add(difference.y));
      if (!this.isPlaneCorrectCut(candidate)) return result;
      result = candidate;
    }
    return result;
  }

  private getTangPlane(point: Point) {
    return point.x.mul(this.xy.y).add(point.y.mul(this.xy.x)).sub(point.x.mul(point.y));
  }

  // set_box_corners: McCormick points at the corners of the factors' bound box.
  private setBoxCorners() {
    const core = this.core;
    const xVar = this.xVar;
    const yVar = this.yVar;
    if (!core.hasLowerBound(xVar) || !core.hasUpperBound(xVar)) return false;
    if (!core.hasLowerBound(yVar) || !core.hasUpperBound(yVar)) return false;
    const xLow = core.getLowerBound(xVar);
    const xHigh = core.getUpperBound(xVar);
    const yLow = core.getLowerBound(yVar);
    const yHigh = core.getUpperBound(yVar);
    if (xLow.equals(xHigh) || yLow.equals(yHigh)) return false;
    const xValue = core.val(xVar);
    const yValue = core.val(yVar);
    if ([xLow, xHigh].some((bound) => bound.equals(xValue))) return false;
    if ([yLow, yHigh].some((bound) => bound.equals(yValue))) return false;
    if (this.isBelow) {
      this.a = mkPoint(xLow, yLow);
      this.b = mkPoint(xHigh, yHigh);
    } else {
      this.a = mkPoint(xLow, yHigh);
      this.b = mkPoint(xHigh, yLow);
    }
    this.isPlStrictInterior = false;
    return true;
  }

  private getPoints() {
    if (NLA_PARAMS.tangentsBoxCorners && this.setBoxCorners()) return;
    this.getInitialPoints();
    this.a = this.pushPoint(this.a);
    this.b = this.pushPoint(this.b);
  }

  private isPlaneCorrectCut(plane: Point) {
    const sign = this.isBelow ? Rational.one : Rational.minusOne;
    const tangPlane = this.getTangPlane(plane);
    return (
      this.correctValue.sub(tangPlane).mul(sign).isPositive() &&
      !tangPlane.sub(this.value).mul(sign).isNegative()
    );
  }
}

export class Tangents {
  constructor(private core: NlaCore) {}

  tangentLemma() {
    const core = this.core;
    if (!NLA_PARAMS.tangents) return;
    const found = core.findBfcToRefine();
    if (found === undefined) return;
    const factors = found.factorization.factors;
    new TangentImp(
      core,
      mkPoint(core.valFactor(factors[0]), core.valFactor(factors[1])),
      core.val(found.monic.variable),
      found.monic,
      found.factorization,
    ).run();
  }
}
