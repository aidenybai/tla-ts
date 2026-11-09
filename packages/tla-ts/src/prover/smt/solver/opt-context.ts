// Ported from Z3 (src/opt/opt_context.cpp, src/opt/optsmt.cpp, src/opt/opt_value.cpp), MIT
// license, see z3-license.txt. Only nonlinear real objectives are ported, and they skip the
// arithmetic climb that Z3 runs before nlsat, so a result nlsat does not certify is unsupported. A
// rational optimum has no exact value, as when the climb finds it, so it prints as Z3 prints it.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  OP_ADD,
  OP_GE,
  OP_MUL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { AlgebraicManager, type Anum } from "./nlsat/algebraic";
import { mkAlgebraicEq, NlsatOpt, type NlsatOptResult } from "./opt-nlsat";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import type { TacticEnvironment } from "./tactic";

export interface OptObjective {
  term: number;
  isMax: boolean;
}

export interface OptOptions {
  priority: string;
  bisectRounds: number;
  supremumRlimit: number;
}

interface ObjectiveValue {
  infinity: Rational;
  value: Rational;
  epsilon: Rational;
  exact: Anum | null;
}

const MINUS_INFINITY: ObjectiveValue = {
  infinity: Rational.minusOne,
  value: Rational.zero,
  epsilon: Rational.zero,
  exact: null,
};

const PLUS_INFINITY: ObjectiveValue = { ...MINUS_INFINITY, infinity: Rational.one };

export class OptContext {
  private am = new AlgebraicManager();
  private lower: ObjectiveValue[] = [];
  private upper: ObjectiveValue[] = [];
  private boxModels: ProtoModel[] = [];
  private boxIndex = -1;
  model: ProtoModel | null = null;
  reasonUnknown = "";

  constructor(
    private manager: AstManager,
    private environment: TacticEnvironment,
    private objectives: readonly OptObjective[],
  ) {}

  private setModel(model: ProtoModel | null) {
    model?.incRef();
    this.model?.decRef();
    this.model = model;
  }

  private getInternalTerm(index: number, pinned: RefVector) {
    const objective = this.objectives[index];
    if (objective.isMax) return objective.term;
    const negated = this.manager.mkApp(OP_UMINUS, [objective.term], SORT_REAL);
    pinned.push(negated);
    return negated;
  }

  private getCommitment(index: number, pinned: RefVector) {
    const manager = this.manager;
    const lower = this.lower[index];
    const term = this.getInternalTerm(index, pinned);
    const constraint =
      lower.exact !== null && !this.am.isRational(lower.exact)
        ? mkAlgebraicEq(manager, term, lower.exact)
        : manager.mkApp(OP_GE, [term, manager.mkRealNumeral(lower.value)], SORT_BOOL);
    pinned.push(constraint);
    return constraint;
  }

  private search(
    index: number,
    hard: readonly number[],
    options: OptOptions,
    isCommitting: boolean,
  ) {
    const pinned = new RefVector(this.manager);
    const commitments = Array.from({ length: isCommitting ? index : 0 }, (_value, earlier) =>
      this.lower[earlier].infinity.isZero() ? [this.getCommitment(earlier, pinned)] : [],
    ).flat();
    const optimized = new NlsatOpt(this.manager, this.environment).maximize(
      [...hard, ...commitments],
      this.getInternalTerm(index, pinned),
      null,
      null,
      options.bisectRounds,
      options.supremumRlimit,
    );
    pinned.reset();
    if (optimized.status === L_FALSE) return L_FALSE;
    if (optimized.status !== L_TRUE)
      throw new SmtUnsupportedError("an optimum that nlsat does not certify");
    this.setResult(index, optimized.result);
    this.setModel(optimized.result.model);
    optimized.result.model?.decRef();
    return L_TRUE;
  }

  private setResult(index: number, result: NlsatOptResult) {
    if (result.isUnbounded) {
      this.lower[index] = PLUS_INFINITY;
      this.upper[index] = PLUS_INFINITY;
      return;
    }
    const value = result.isOpen ? result.sup : result.value;
    if (value === null) throw new SmtUnsupportedError("an optimum that nlsat does not certify");
    const epsilon = result.isOpen ? Rational.minusOne : Rational.zero;
    const exact = !result.isOpen && this.am.isRational(value) ? null : value;
    const bracket = (rational: Rational) => ({
      infinity: Rational.zero,
      value: rational,
      epsilon,
      exact,
    });
    this.lower[index] = bracket(result.isOpen ? result.supLower : result.lower);
    this.upper[index] = bracket(
      exact === null ? result.lower : result.isOpen ? result.supUpper : result.upper,
    );
  }

  private executeLex(hard: readonly number[], options: OptOptions) {
    const count = this.objectives.length;
    for (let index = 0; index < count; index++) {
      const status = this.search(index, hard, options, true);
      if (status !== L_TRUE) return status;
      for (let later = index + 1; later < count; later++) this.lower[later] = MINUS_INFINITY;
      const isOpen = !this.lower[index].epsilon.isZero();
      if (isOpen && index + 1 < count) {
        this.reasonUnknown =
          "later lexicographic objectives after an unattained nonlinear optimum are not supported";
        return L_UNDEF;
      }
      if (!this.lower[index].infinity.isZero() && index + 1 < count)
        throw new SmtUnsupportedError("lexicographic objectives after an unbounded one");
    }
    return L_TRUE;
  }

  private executeBox(hard: readonly number[], options: OptOptions) {
    for (let index = 0; index < this.objectives.length; index++) {
      const status = this.search(index, hard, options, false);
      if (status !== L_TRUE) return status;
      const model = this.model;
      if (model === null) throw new SmtUnsupportedError("a box objective without a model");
      model.incRef();
      this.boxModels.push(model);
    }
    this.boxIndex = 1;
    this.setModel(this.boxModels[0]);
    return L_TRUE;
  }

  optimize(hard: readonly number[], options: OptOptions) {
    if (this.boxIndex !== -1) {
      if (this.boxIndex < this.boxModels.length) {
        this.setModel(this.boxModels[this.boxIndex++]);
        return L_TRUE;
      }
      this.boxIndex = -1;
      return L_FALSE;
    }
    this.release();
    this.reasonUnknown = "";
    this.lower = this.objectives.map(() => MINUS_INFINITY);
    this.upper = this.objectives.map(() => PLUS_INFINITY);
    if (this.objectives.length > 1 && options.priority === "pareto")
      throw new SmtUnsupportedError("pareto optimization");
    return this.objectives.length > 1 && options.priority === "box"
      ? this.executeBox(hard, options)
      : this.executeLex(hard, options);
  }

  private getAdjusted(index: number, isLower: boolean): ObjectiveValue {
    const isMax = this.objectives[index].isMax;
    const value = (isLower === isMax ? this.lower : this.upper)[index];
    if (isMax) return value;
    const exact = value.exact === null ? null : this.am.copy(value.exact);
    if (exact !== null) this.am.neg(exact);
    return {
      infinity: value.infinity.neg(),
      value: value.value.neg(),
      epsilon: value.epsilon.neg(),
      exact,
    };
  }

  private isEqual(first: ObjectiveValue, second: ObjectiveValue) {
    if (!first.infinity.equals(second.infinity) || !first.epsilon.equals(second.epsilon))
      return false;
    if (first.exact === null && second.exact === null) return first.value.equals(second.value);
    const isFirstAlgebraic = first.exact !== null && !this.am.isRational(first.exact);
    const isSecondAlgebraic = second.exact !== null && !this.am.isRational(second.exact);
    if (isFirstAlgebraic !== isSecondAlgebraic) return false;
    if (first.exact !== null && second.exact !== null && isFirstAlgebraic)
      return this.am.compare(first.exact, second.exact) === 0;
    return first.value.equals(second.value);
  }

  private toExpr(value: ObjectiveValue, pinned: RefVector) {
    const manager = this.manager;
    const isAlgebraic = value.exact !== null && !this.am.isRational(value.exact);
    const sort =
      !isAlgebraic && value.epsilon.isZero() && value.value.isInt() ? SORT_INT : SORT_REAL;
    const mkConst = (name: string, constSort: number) =>
      manager.mkApp(manager.mkFuncDecl(name, [], constSort), [], constSort);
    const mkScaled = (coefficient: Rational, term: number) =>
      coefficient.equals(Rational.one)
        ? term
        : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(coefficient, sort), term], sort);
    const args: number[] = [];
    if (!value.infinity.isZero()) args.push(mkScaled(value.infinity, mkConst("oo", sort)));
    if (isAlgebraic && value.exact !== null) args.push(manager.mkAlgebraicNumeral(value.exact));
    else if (!value.value.isZero()) args.push(manager.mkNumeralOfSort(value.value, sort));
    if (!value.epsilon.isZero()) args.push(mkScaled(value.epsilon, mkConst("epsilon", SORT_REAL)));
    const expr =
      args.length === 0
        ? manager.mkNumeral(0n)
        : args.length === 1
          ? args[0]
          : manager.mkApp(OP_ADD, args, sort);
    pinned.push(expr);
    return expr;
  }

  getObjectives(format: (expr: number) => string) {
    const pinned = new RefVector(this.manager);
    const lines = this.objectives.map((objective, index) => {
      const lower = this.getAdjusted(index, true);
      const upper = this.getAdjusted(index, false);
      const name = format(objective.term);
      if (!this.isEqual(lower, upper))
        return ` (${name}  (interval ${format(this.toExpr(lower, pinned))} ${format(this.toExpr(upper, pinned))}))`;
      if (lower.exact !== null && lower.epsilon.isZero()) {
        const exact = this.manager.mkAlgebraicNumeral(lower.exact);
        pinned.push(exact);
        return ` (${name} ${format(exact)})`;
      }
      return ` (${name} ${format(this.toExpr(lower, pinned))})`;
    });
    pinned.reset();
    return ["(objectives", ...lines, ")"].join("\n");
  }

  release() {
    for (const model of this.boxModels) model.decRef();
    this.boxModels = [];
    this.boxIndex = -1;
    this.setModel(null);
  }
}
