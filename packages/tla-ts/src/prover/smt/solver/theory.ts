// Ported from Z3 (src/smt/smt_theory.h, src/smt/smt_theory.cpp), MIT license, see z3-license.txt.
import { shrink } from "./array";
import type { AstManager } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { type BoolVar, FALSE_LITERAL, type Literal, negate, TRUE_LITERAL } from "./literal";
import type { ProtoModel } from "./proto-model";
import { L_UNDEF } from "./lbool";

export const FC_DONE = 0;
export const FC_CONTINUE = 1;
export const FC_GIVEUP = 2;

export interface ExtraFreshValue {
  sort: number;
  value: number | undefined;
}

export interface DependentValue {
  dependencies: (Enode | ExtraFreshValue)[];
  mkValue: (values: number[]) => number;
}

export abstract class Theory {
  abstract readonly name: string;
  protected varEnodes: Enode[] = [];
  private varEnodeLimits: number[] = [];

  constructor(
    protected context: Context,
    readonly id: number,
  ) {}

  protected get manager(): AstManager {
    return this.context.manager;
  }

  getEnode(thVar: number) {
    return this.varEnodes[thVar];
  }

  protected getExpr(thVar: number) {
    return this.varEnodes[thVar].owner;
  }

  getNumVars() {
    return this.varEnodes.length;
  }

  // The variable of the node itself, not one an equality moved to its list.
  isAttachedToVar(node: Enode) {
    const thVar = node.getThVar(this.id);
    return thVar >= 0 && this.varEnodes[thVar] === node;
  }

  getThVar(node: Enode) {
    return node.getThVar(this.id);
  }

  init() {}

  protected mkEqLiteral(first: number, second: number, isGateContext: boolean): Literal {
    if (first === second) return TRUE_LITERAL;
    if (this.manager.areDistinct(first, second)) return FALSE_LITERAL;
    const eq = this.context.mkEqAtom(first, second);
    this.context.internalize(eq, isGateContext);
    return this.context.getLiteral(eq);
  }

  protected mkLiteralOf(input: number): Literal {
    const manager = this.manager;
    const isNot = manager.isNot(input);
    const expr = isNot ? manager.getArg(input, 0) : input;
    if (!this.context.isEInternalized(expr)) this.context.internalize(expr, false);
    const literal = this.context.getLiteral(expr);
    this.context.markLiteralAsRelevant(literal);
    return isNot ? negate(literal) : literal;
  }

  protected ensureEnodeOf(expr: number): Enode {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    if (!this.manager.isBool(expr)) context.internalizeTerm(expr);
    const node = context.getEnode(expr)!;
    context.markAsRelevant(expr);
    return node;
  }

  abstract internalizeAtom(atom: number, isGateContext: boolean): boolean;

  abstract internalizeTerm(term: number): boolean;

  internalizeEqEh(_eq: number, _boolVar: BoolVar) {}

  applySortCnstr(_node: Enode, _sort: number) {}

  assignEh(_boolVar: BoolVar, _isTrue: boolean) {}

  abstract newEqEh(first: number, second: number): void;

  useDiseqs() {
    return true;
  }

  abstract newDiseqEh(first: number, second: number): void;

  relevantEh(_expr: number) {}

  pushScopeEh() {
    this.varEnodeLimits.push(this.varEnodes.length);
  }

  protected getOldNumVars(numScopes: number) {
    return this.varEnodeLimits[this.varEnodeLimits.length - numScopes];
  }

  popScopeEh(numScopes: number) {
    const newLevel = this.varEnodeLimits.length - numScopes;
    shrink(this.varEnodes, this.varEnodeLimits[newLevel]);
    shrink(this.varEnodeLimits, newLevel);
  }

  restartEh() {}

  getPhase(_boolVar: BoolVar) {
    return L_UNDEF;
  }

  initSearchEh() {}

  finalCheckEh(_level: number) {
    return FC_DONE;
  }

  numFinalCheckLevels() {
    return 1;
  }

  isShared(_thVar: number) {
    return false;
  }

  isBetaRedex(_parent: Enode, _node: Enode) {
    return false;
  }

  canPropagate() {
    return false;
  }

  propagate() {}

  buildModels() {
    return true;
  }

  initModel(_model: ProtoModel) {}

  finalizeModel() {}

  addTheoryAssumptions(_assumptions: number[]) {}

  shouldResearch(_unsatCore: readonly number[]) {
    return false;
  }

  // undefined stands for a fresh value of the sort.
  mkValue(_node: Enode): number | DependentValue | undefined {
    return undefined;
  }

  includeFuncInterp(_decl: number) {
    return false;
  }
}
