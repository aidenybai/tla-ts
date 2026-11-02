// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt. The model of
// theory_lra: the values of its variables, and the equalities between shared terms with equal
// values that it assumes.
import {
  FAMILY_ARITH,
  FAMILY_BASIC,
  OP_DIV,
  OP_DIV0,
  OP_IDIV,
  OP_IDIV0,
  OP_ITE,
  OP_MOD,
  OP_MOD0,
} from "./ast";
import { SmtUnsupportedError } from "../../../errors";
import { Enode } from "./enode";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { NULL_LPVAR } from "./lp/lar-solver";
import type { NlaCore } from "./lp/nla-core";
import { Anum } from "./nlsat/algebraic";
import { randomUpdate } from "./lp/random-updater";
import { shrink } from "./array";
import { TheoryLraPropagate } from "./theory-lra-propagate";

export abstract class TheoryLraModel extends TheoryLraPropagate {
  private assumeEqCandidates: [number, number][] = [];
  private assumeEqHead = 0;

  protected initVariableValues() {
    this.isModelInitialized = false;
    if (this.context.checkCanceled() || this.getNumVars() === 0) return;
    const saved = this.isModelInitialized;
    this.context.pushTrail(() => {
      this.isModelInitialized = saved;
    });
    this.isModelInitialized = this.solver.initModel();
  }

  private isRelevantAndShared(node: Enode) {
    return this.context.isRelevant(node.owner) && this.isShared(node);
  }

  // random_update: moves the values of shared variables that collide with others.
  private randomUpdate() {
    if (this.nla?.hasRelevantMonomial()) return;
    const solver = this.solver;
    const byValue = new Map<string, number>();
    const tmpVarSet = new Set<number>();
    const columns: number[] = [];
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      if (!this.isRelevantAndShared(this.getEnode(thVar))) continue;
      const column = this.registerVar(thVar);
      const key = `${this.isIntVar(thVar)}:${solver.getValue(column)}`;
      const other = byValue.get(key);
      if (other === undefined) {
        byValue.set(key, thVar);
        continue;
      }
      if (this.isEqual(thVar, other)) continue;
      if (!solver.isFixed(column)) columns.push(column);
      else if (!tmpVarSet.has(other)) {
        const otherColumn = solver.externalToLocalColumn(other);
        if (!solver.isFixed(otherColumn)) {
          tmpVarSet.add(other);
          columns.push(otherColumn);
        }
      }
    }
    if (columns.length > 0) randomUpdate(solver, columns);
  }

  // assume_eqs: model-based theory combination.
  protected assumeEqs() {
    if (this.delayedAssumeEqs()) return true;
    this.randomUpdate();
    const context = this.context;
    const solver = this.solver;
    const numVars = this.getNumVars();
    const oldSize = this.assumeEqCandidates.length;
    let numCandidates = 0;
    const start = context.getRandomValue();
    const byValue = new Map<string, number>();
    const representatives: number[] = [];
    for (let index = 0; index < numVars; index++) {
      const thVar = (index + start) % numVars;
      if (!this.isRelevantAndShared(this.getEnode(thVar))) continue;
      const column = this.registerVar(thVar);
      // m_model_eqs: with nlsat's model, the values are compared one by one.
      const key = `${this.isIntVar(thVar)}:${solver.getValue(column)}`;
      const other = this.nla?.isUsingNraModel
        ? representatives.find(
            (representative) =>
              this.isIntVar(representative) === this.isIntVar(thVar) &&
              this.isEq(representative, thVar),
          )
        : byValue.get(key);
      if (other === undefined) {
        byValue.set(key, thVar);
        representatives.push(thVar);
        continue;
      }
      if (this.isEqual(thVar, other)) continue;
      this.assumeEqCandidates.push([thVar, other]);
      numCandidates++;
    }
    if (numCandidates > 0)
      context.pushTrail(() => {
        shrink(this.assumeEqCandidates, oldSize);
      });
    return this.delayedAssumeEqs();
  }

  private delayedAssumeEqs() {
    if (this.assumeEqHead === this.assumeEqCandidates.length) return false;
    const saved = this.assumeEqHead;
    this.context.pushTrail(() => {
      this.assumeEqHead = saved;
    });
    while (this.assumeEqHead < this.assumeEqCandidates.length) {
      const candidate = this.assumeEqCandidates[this.assumeEqHead];
      this.assumeEqHead++;
      if (
        this.isEq(candidate[0], candidate[1]) &&
        !this.isEqual(candidate[0], candidate[1]) &&
        this.context.assumeEq(this.getEnode(candidate[0]), this.getEnode(candidate[1]))
      )
        return true;
    }
    return false;
  }

  // init_model: the model knows the value of every theory variable without δ, so fresh numbers
  // avoid them. Like get_value(enode*, expr_ref&), it skips an integer with a fractional value.
  initModel(model: ProtoModel) {
    this.initVariableValues();
    if (!this.isModelInitialized) return;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      const column = this.solver.externalToLocalColumn(thVar);
      const value = column === NULL_LPVAR ? undefined : this.solver.getExactValue(column);
      if (value === undefined) continue;
      if (!this.isIntVar(thVar)) model.registerValue(this.manager.mkRealNumeral(value));
      else if (value.isInt()) model.registerValue(this.manager.mkNumeral(value.num));
    }
  }

  // mk_value: the value of the class of a root, rounded down for an integer.
  mkValue(node: Enode) {
    if (node.thVar < 0) return undefined;
    const nla = this.nla;
    if (
      nla === undefined ||
      !nla.isUsingNraModel ||
      this.solver.externalToLocalColumn(node.thVar) === NULL_LPVAR
    )
      return this.getValueExpr(node.thVar);
    // nlsat's value, zero for an integer whose value is not one.
    const value = this.getNlValue(nla, node.thVar).value;
    if (this.isIntVar(node.thVar))
      return this.manager.mkNumeral(value instanceof Rational && value.isInt() ? value.num : 0n);
    if (!(value instanceof Rational)) throw new SmtUnsupportedError("an irrational model value");
    return this.manager.mkRealNumeral(value);
  }

  // is_eq: whether two variables have the same value, in nlsat's model when nla uses it.
  private isEq(first: number, second: number) {
    const nla = this.nla;
    if (nla !== undefined && nla.isUsingNraModel)
      return nla.nra.am.compare(this.getNlValue(nla, first), this.getNlValue(nla, second)) === 0;
    const solver = this.solver;
    return solver
      .getValue(this.registerVar(first))
      .equals(solver.getValue(this.registerVar(second)));
  }

  // nl_value: the value of a variable in nlsat's model, a term's the sum over its columns.
  private getNlValue(nla: NlaCore, thVar: number) {
    const solver = this.solver;
    const am = nla.nra.am;
    const column = solver.externalToLocalColumn(thVar);
    if (!solver.hasTerm(column)) return nla.nra.value(column);
    let result = new Anum(Rational.zero);
    const todo: [number, Rational][] = [[column, Rational.one]];
    while (todo.length > 0) {
      const pending = todo.pop()!;
      for (const entry of solver.getTerm(pending[0]).coeffs) {
        const coeff = entry[1].mul(pending[1]);
        if (solver.hasTerm(entry[0])) todo.push([entry[0], coeff]);
        else result = am.add(am.mul(nla.nra.value(entry[0]), new Anum(coeff)), result);
      }
    }
    return result;
  }

  private getValue(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    return column === NULL_LPVAR ? Rational.zero : this.solver.getModelValue(column);
  }

  private getValueExpr(thVar: number) {
    const value = this.getValue(thVar);
    return this.isIntVar(thVar)
      ? this.manager.mkNumeral(value.floor().num)
      : this.manager.mkRealNumeral(value);
  }

  private isShared(node: Enode) {
    const root = node.root;
    if (this.manager.getOp(root.owner) === OP_ITE) return true;
    if (root.thVar < 0) return false;
    if (this.context.qmanager.isShared(root)) return true;
    for (let index = 0; index < root.numParents; index++) {
      const family = this.manager.getFamily(root.getParent(index).owner);
      if (family !== FAMILY_ARITH && family !== FAMILY_BASIC) return true;
    }
    return this.isSharedWithUnderspecified(root);
  }

  // theory_lra::is_shared: whether the class is an argument of a division by a term or by zero.
  private isSharedWithUnderspecified(root: Enode) {
    const manager = this.manager;
    const count = this.underspecifiedTerms.length;
    if (count === 0) return false;
    if (root.numParents > 2 * count)
      return this.underspecifiedTerms.some((term) =>
        manager.someArg(term, (arg) => this.context.getEnode(arg)?.root === root),
      );
    for (let index = 0; index < root.numParents; index++)
      if (this.isUnderspecified(root.getParent(index).owner)) return true;
    return false;
  }

  // arith_util::is_underspecified.
  private isUnderspecified(expr: number) {
    const op = this.manager.getOp(expr);
    return (
      op === OP_DIV ||
      op === OP_IDIV ||
      op === OP_MOD ||
      op === OP_DIV0 ||
      op === OP_IDIV0 ||
      op === OP_MOD0
    );
  }
}
