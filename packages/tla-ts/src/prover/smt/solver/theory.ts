// Ported from Z3 (src/smt/smt_theory.h, src/smt/smt_theory.cpp), MIT license, see z3-license.txt.
// A theory plugin of the SMT kernel. The context owns the E-graph and the Boolean search, and hands
// each theory the atoms and terms of its family, the equalities and disequalities between its
// variables, and the assignments of its atoms. A theory variable numbers the enodes the theory
// knows, and the context keeps it on the enode's list under the theory's id, its family.
import { shrink } from "./array";
import type { AstManager, FuncDecl } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import type { BoolVar } from "./literal";
import type { ProtoModel } from "./proto-model";

export const FC_DONE = 0;
export const FC_CONTINUE = 1;
export const FC_GIVEUP = 2;

export abstract class Theory {
  // m_var2enode and m_var2enode_lim.
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

  popScopeEh(numScopes: number) {
    const newLevel = this.varEnodeLimits.length - numScopes;
    shrink(this.varEnodes, this.varEnodeLimits[newLevel]);
    shrink(this.varEnodeLimits, newLevel);
  }

  restartEh() {}

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

  // is_beta_redex: a parent of another family that does not make the class shared.
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

  // mk_value: the value of a class whose root has a variable of the theory, or undefined for a fresh
  // value of its sort.
  mkValue(_node: Enode): number | undefined {
    return undefined;
  }

  includeFuncInterp(_decl: FuncDecl) {
    return false;
  }
}
