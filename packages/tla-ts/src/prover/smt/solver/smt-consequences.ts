// Ported from Z3 (src/smt/smt_consequences.cpp, src/smt/smt_solver.cpp), MIT license, see
// z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import { KIND_APP, OP_DT_IS, OP_DT_RECOGNISER, OP_EQ, OP_IMPLIES, OP_NOT, SORT_BOOL } from "./ast";
import { BinJustification, CLS_AUX } from "./clause";
import type { Context } from "./context";
import { getRecognizerConstructor } from "./datatype-decl-plugin";
import type { Enode } from "./enode";
import { getIdentityHash, ObjHashtable, ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type BoolVar, getVar, isNegated, type Literal, mkLiteral, negate } from "./literal";
import { RefVector } from "./ref-vector";
import type { SmtKernel } from "./smt-kernel";

const CHUNK_SIZE = 100;

type IndexSet = ObjHashtable;

const createIndexSet = () => new ObjHashtable(getIdentityHash);

const addAll = (target: IndexSet, source: IndexSet) => {
  for (const index of source) target.add(index);
};

class ConsequenceFinder {
  private readonly context: Context;
  private antecedents = new Map<BoolVar, IndexSet>();
  private readonly var2val: ObjMap<number>;
  private readonly var2orig = new Map<number, number>();
  private readonly assumption2orig = new Map<BoolVar, number>();
  readonly consequences: RefVector;

  constructor(private readonly kernel: SmtKernel) {
    this.context = kernel.context;
    const manager = this.context.manager;
    this.var2val = new ObjMap((expr) => manager.hashes[expr]);
    this.consequences = new RefVector(manager);
  }

  private antecedentToFormula(vars: IndexSet) {
    const context = this.context;
    const manager = context.manager;
    const premises: number[] = [];
    for (const index of vars) {
      const expr = this.assumption2orig.get(index as BoolVar);
      if (expr === undefined) continue;
      premises.push(
        context.getBoolVarAssignment(index as BoolVar) !== L_FALSE
          ? expr
          : manager.mkApp(OP_NOT, [expr], SORT_BOOL),
      );
    }
    return manager.mkAnd(premises);
  }

  private addConsequence(premises: IndexSet, conclusion: number) {
    const manager = this.context.manager;
    this.consequences.push(
      manager.mkApp(OP_IMPLIES, [this.antecedentToFormula(premises), conclusion], SORT_BOOL),
    );
  }

  private justify(literal: Literal, premises: IndexSet) {
    const context = this.context;
    const addAntecedent = (antecedent: Literal) => {
      const set = this.antecedents.get(getVar(antecedent));
      if (set !== undefined) addAll(premises, set);
    };
    const justification = context.justifications[getVar(literal)];
    if (typeof justification === "number") {
      const store = context.clauses;
      for (let index = 0; index < store.getNumLiterals(justification); index++) {
        const other = store.getLiteral(justification, index);
        if (getVar(other) !== getVar(literal)) addAntecedent(other);
      }
    } else if (justification instanceof BinJustification) addAntecedent(justification.literal);
    else if (justification !== null && justification !== "axiom")
      for (const antecedent of context.conflictResolution.justificationToLiterals(justification))
        addAntecedent(antecedent);
  }

  private extractFixedConsequence(literal: Literal, assumptions: IndexSet) {
    const context = this.context;
    const manager = context.manager;
    if (literal === context.trueLiteral) return;
    const expr = context.boolVar2Expr[getVar(literal)];
    const premises = createIndexSet();
    if (assumptions.has(getVar(literal))) premises.add(getVar(literal));
    else this.justify(literal, premises);
    const conclusion = (() => {
      if (this.var2val.has(expr)) {
        this.var2val.delete(expr);
        const orig = this.var2orig.get(expr) as number;
        return isNegated(literal) ? manager.mkApp(OP_NOT, [orig], SORT_BOOL) : orig;
      }
      if (isNegated(literal) || manager.kinds[expr] !== KIND_APP) return -1;
      if (manager.decls[expr] === OP_EQ) {
        const lhs = manager.getArg(expr, 0);
        const rhs = manager.getArg(expr, 1);
        if (this.var2val.has(rhs) && manager.isValue(lhs)) {
          this.var2val.delete(rhs);
          return manager.mkEq(this.var2orig.get(rhs) as number, lhs);
        }
        if (this.var2val.has(lhs) && manager.isValue(rhs)) {
          this.var2val.delete(lhs);
          return manager.mkEq(this.var2orig.get(lhs) as number, rhs);
        }
        return -1;
      }
      const op = manager.getOp(expr);
      if (op !== OP_DT_RECOGNISER && op !== OP_DT_IS) return -1;
      const arg = manager.getArg(expr, 0);
      if (!this.var2val.has(arg)) return -1;
      this.var2val.delete(arg);
      const constructor = getRecognizerConstructor(manager, manager.decls[expr]);
      // Z3 names the fresh constant that stands for the variable here, not the variable.
      return manager.mkEq(
        this.var2orig.get(arg) as number,
        manager.mkApp(constructor, [], manager.sorts[arg]),
      );
    })();
    if (conclusion !== -1) this.addConsequence(premises, conclusion);
    this.antecedents.set(getVar(literal), premises);
  }

  private extractFixedConsequences(start: number, assumptions: IndexSet) {
    const context = this.context;
    context.popToSearchLevel();
    const literals = context.assignedLiterals;
    const size = literals.length;
    for (let index = start; index < size; index++)
      this.extractFixedConsequence(literals[index], assumptions);
    return size;
  }

  // Z3 takes the literal of the value itself for a Boolean that is not internalized yet.
  private mkDiseq(expr: number, value: number) {
    const context = this.context;
    const manager = context.manager;
    if (manager.sorts[expr] === SORT_BOOL) {
      if (!context.isBInternalized(expr)) context.internalize(expr, false);
      return mkLiteral(context.getBoolVar(expr), value === manager.trueExpr);
    }
    const eq = context.mkEqAtom(expr, value);
    context.internalize(eq, false);
    return mkLiteral(context.getBoolVar(eq), true);
  }

  private areEqual(key: number, value: number) {
    const keyNode = this.context.getEnode(key);
    const valueNode = this.context.getEnode(value);
    return keyNode !== undefined && valueNode !== undefined && keyNode.root === valueNode.root;
  }

  private deleteUnfixed() {
    const context = this.context;
    const manager = context.manager;
    const toDelete: number[] = [];
    for (const [key, value] of this.var2val) {
      const keyNode = context.getEnode(key);
      if (manager.sorts[key] === SORT_BOOL) {
        const literal = context.getLiteral(key);
        const assignment = context.getAssignment(literal);
        if (assignment === L_UNDEF) toDelete.push(key);
        else if (assignment === L_TRUE) {
          if (value === manager.falseExpr) toDelete.push(key);
          else context.forcePhase(negate(literal));
        } else if (value === manager.trueExpr) toDelete.push(key);
        else context.forcePhase(literal);
      } else if (this.areEqual(key, value)) continue;
      else if (keyNode !== undefined && manager.areDistinct(value, keyNode.root.owner))
        toDelete.push(key);
      else if (context.getAssignment(this.mkDiseq(key, value)) === L_TRUE) toDelete.push(key);
    }
    for (const key of toDelete) this.var2val.delete(key);
  }

  // The clause short-circuits the congruence justifications in the next rounds.
  private extractFixedEqs() {
    const context = this.context;
    const manager = context.manager;
    const toDelete: number[] = [];
    for (const [key, value] of this.var2val) {
      if (manager.sorts[key] === SORT_BOOL || !this.areEqual(key, value)) continue;
      const literals = context.conflictResolution.eqToLiterals(
        context.getEnode(value) as Enode,
        context.getEnode(key) as Enode,
      );
      const premises = createIndexSet();
      for (const literal of literals) {
        const set = this.antecedents.get(getVar(literal));
        if (set !== undefined) addAll(premises, set);
      }
      this.addConsequence(premises, manager.mkEq(this.var2orig.get(key) as number, value));
      toDelete.push(key);
      const clause = literals.map(negate);
      clause.push(negate(this.mkDiseq(key, value)));
      context.mkClause(clause, null, CLS_AUX);
    }
    for (const key of toDelete) this.var2val.delete(key);
  }

  run(assumptions0: readonly number[], vars0: readonly number[]) {
    const kernel = this.kernel;
    const context = this.context;
    const manager = context.manager;
    for (const assumption of assumptions0)
      if (manager.sorts[assumption] !== SORT_BOOL)
        throw new SmtUnsupportedError("a get-consequences assumption that is not Boolean");
    this.antecedents.set(getVar(context.trueLiteral), createIndexSet());
    context.popToBaseLevel();
    const trail = new RefVector(manager);
    const vars: number[] = [];
    const assumptions: number[] = [];
    const assumptionSet = createIndexSet();
    const level = context.scopeLevel;
    let isPushed = false;
    const define = (expr: number, prefix: string) => {
      if (manager.isUninterpretedConst(expr)) return expr;
      if (!isPushed) kernel.push();
      isPushed = true;
      const fresh = manager.mkFreshConst(prefix, manager.sorts[expr]);
      trail.push(fresh);
      kernel.assertExpr(manager.mkEq(fresh, expr));
      return fresh;
    };
    try {
      for (const expr of vars0) {
        const variable = define(expr, "v");
        vars.push(variable);
        this.var2orig.set(variable, expr);
      }
      for (const assumption of assumptions0) {
        const constant = define(assumption, "a");
        assumptions.push(constant);
        if (!context.isEInternalized(constant)) context.internalize(constant, false);
        const boolVar = getVar(context.getLiteral(constant));
        assumptionSet.add(boolVar);
        this.assumption2orig.set(boolVar, assumption);
      }
      const result = kernel.check(assumptions);
      if (result !== L_TRUE) return result;
      if (context.qmanager.hasQuantifiers()) return L_UNDEF;
      const model = context.getModel();
      for (const variable of vars) {
        const value = model.eval(variable, false);
        trail.pushOwned(value);
        if (manager.isValue(value)) this.var2val.set(variable, value);
      }
      this.extractFixedConsequences(0, assumptionSet);
      context.popToBaseLevel();
      kernel.initAssumptions(assumptions);
      let numUnits = 0;
      while (this.var2val.size > 0) {
        let numVars = 0;
        for (const [variable, value] of this.var2val) {
          if (numVars >= CHUNK_SIZE) break;
          if (context.checkCanceled()) return L_UNDEF;
          const literal = this.mkDiseq(variable, value);
          if (context.getAssignment(literal) !== L_UNDEF) continue;
          context.markLiteralAsRelevant(literal);
          numVars++;
          context.pushScope();
          context.assign(literal, "axiom", true);
          while (context.canPropagate()) {
            if (context.propagate()) break;
            if (context.resolveConflict()) continue;
            if (context.isInconsistent()) return L_UNDEF;
          }
        }
        let status = context.boundedSearch();
        while (status === L_UNDEF && !context.hasSearchFailure()) {
          context.incLimits();
          status = context.boundedSearch();
        }
        if (status !== L_TRUE && context.hasSearchFailure()) return status;
        if (status === L_FALSE) context.resetConflict();
        if (status === L_TRUE) this.deleteUnfixed();
        numUnits = this.extractFixedConsequences(numUnits, assumptionSet);
        this.extractFixedEqs();
      }
      return L_TRUE;
    } finally {
      if (context.scopeLevel > level + (isPushed ? 1 : 0))
        context.popScope(context.scopeLevel - level - (isPushed ? 1 : 0));
      if (isPushed) kernel.pop(1);
      trail.reset();
    }
  }
}

export const getConsequences = (
  kernel: SmtKernel,
  assumptions: readonly number[],
  vars: readonly number[],
) => {
  const finder = new ConsequenceFinder(kernel);
  return { result: finder.run(assumptions, vars), consequences: finder.consequences };
};
