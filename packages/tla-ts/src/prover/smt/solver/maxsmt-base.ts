// Ported from Z3 (src/opt/maxsmt.h, src/opt/maxsmt.cpp), MIT license, see z3-license.txt.
import { type AstManager, SORT_BOOL } from "./ast";
import { L_TRUE, L_UNDEF } from "./lbool";
import { Preprocess } from "./opt-preprocess";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

export interface MaxsatSolver {
  assertExpr(expr: number): void;
  checkSat(assumptions: readonly number[]): number;
  getModel(): ProtoModel | null;
  getUnsatCore(): readonly number[];
  findMutexes(vars: readonly number[]): { status: number; mutexes: number[][] };
}

export interface MaxsatParams {
  maxsatEngine: string;
  isMaxlexEnabled: boolean;
  isHillClimbing: boolean;
  maxCoreSize: number;
}

export interface MaxsatContext {
  readonly manager: AstManager;
  readonly params: MaxsatParams;
  readonly isSatEnabled: boolean;
  getSolver(): MaxsatSolver;
  getBaseModel(): ProtoModel | null;
  hide(decl: number): void;
  adjust(index: number, value: Rational): Rational;
  addOffset(index: number, value: Rational): void;
  verifyModel(index: number, model: ProtoModel, value: Rational): boolean;
  modelUpdated(model: ProtoModel): void;
}

export interface Soft {
  expr: number;
  weight: Rational;
  value: number;
}

export abstract class MaxsmtSolverBase {
  protected readonly manager: AstManager;
  lower = Rational.zero;
  upper = Rational.zero;
  model: ProtoModel | null;
  protected trail: RefVector;

  constructor(
    protected readonly context: MaxsatContext,
    protected soft: Soft[],
    protected readonly index: number,
  ) {
    this.manager = context.manager;
    this.model = context.getBaseModel();
    this.trail = new RefVector(context.manager);
  }

  abstract run(): number;

  abstract commitAssignment(): void;

  protected get solver() {
    return this.context.getSolver();
  }

  protected init() {
    this.lower = Rational.zero;
    this.upper = Rational.zero;
    for (const soft of this.soft) {
      soft.value = this.manager.isTrue(soft.expr) ? L_TRUE : L_UNDEF;
      if (soft.value !== L_TRUE) this.upper = this.upper.add(soft.weight);
    }
    const preprocess = new Preprocess(this.manager, this.solver);
    const preprocessed = preprocess.run(this.soft);
    if (preprocessed !== undefined) {
      this.soft.splice(0, this.soft.length, ...preprocessed.soft);
      for (const soft of this.soft) this.trail.push(soft.expr);
    }
    preprocess.release();
    if (preprocessed === undefined) return false;
    this.context.addOffset(this.index, preprocessed.lower);
    this.upper = this.upper.sub(preprocessed.lower);
    return true;
  }

  protected mkFreshBool(name: string) {
    const manager = this.manager;
    const fresh = manager.mkFreshConst(name, SORT_BOOL);
    this.trail.push(fresh);
    this.context.hide(manager.decls[fresh]);
    return fresh;
  }

  release() {
    this.trail.reset();
  }
}
