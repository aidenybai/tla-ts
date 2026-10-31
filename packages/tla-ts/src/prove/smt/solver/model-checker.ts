// Ported from Z3 (src/smt/smt_model_checker.cpp), MIT license, see z3-license.txt. Checks whether
// the candidate model satisfies each relevant quantifier: the negated body, with the model's
// interpretations in place of the uninterpreted symbols, goes to an auxiliary context. A model of it
// is a counterexample that becomes an instance of the quantifier.
import { KIND_APP, OP_OR, SORT_BOOL, type AstManager } from "./ast";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import type { Enode } from "./enode";
import { L_FALSE, L_TRUE } from "./lbool";
import type { ModelFinder } from "./model-finder";
import type { ProtoModel } from "./proto-model";
import type { DefaultQuantifierManager } from "./quantifier-manager";
import { RefVector } from "./ref-vector";
import { substitute } from "./var-subst";

// qi_params' mbqi_max_cexs and mbqi_max_iterations.
const MBQI_MAX_CEXS = 1;
const MBQI_MAX_ITERATIONS = 1000;

interface Instance {
  quantifier: number;
  bindings: number[];
  generation: number;
}

// The auxiliary context: Z3 keeps one context for every check and pushes a scope per check, so the
// restricted checks continue from the complete check, with its phases and activities. It runs without
// MBQI and with relevancy level 0, and preprocesses the assertions of a check together.
class AuxContext {
  private context: Context;
  private asserted: AssertedFormulas;
  // theory_polymorphism's m_qhead: the number of formulas when it last added an assumption. Its
  // trail restores it when the scope is popped, and no formula is asserted outside the scopes.
  private polyQhead = 0;
  // theory_polymorphism's m_assumption, which holds its last assumption.
  private polyAssumption = -1;

  constructor(private manager: AstManager) {
    this.context = new Context(manager, { isMbqi: false, relevancyLevel: 0 });
    this.asserted = new AssertedFormulas(manager);
  }

  push() {
    this.context.push();
    this.asserted.push();
  }

  pop() {
    this.context.pop(1);
    this.asserted.pop();
    this.polyQhead = 0;
  }

  assert(formula: number) {
    this.asserted.assertExpr(formula);
  }

  // A model of the assertions, or whether they are unsatisfiable or undecided. Z3 registers
  // theory_polymorphism, which assumes a fresh constant whenever formulas were asserted since its
  // last assumption.
  check() {
    const context = this.context;
    context.popToBaseLevel();
    for (const formula of this.asserted.reduce()) {
      if (context.isInconsistent()) break;
      context.internalizeAssertion(formula, 0);
    }
    const manager = this.manager;
    const numFormulas = this.asserted.getNumFormulas();
    const isAssuming = numFormulas !== this.polyQhead;
    this.polyQhead = numFormulas;
    if (isAssuming) {
      const assumption = manager.mkFreshConst("poly", SORT_BOOL);
      manager.incRef(assumption);
      if (this.polyAssumption !== -1) manager.decRef(this.polyAssumption);
      this.polyAssumption = assumption;
    }
    context.initAssumptions(isAssuming ? [this.polyAssumption] : []);
    const result = context.search();
    return result === L_TRUE
      ? context.mkProtoModel().model
      : result === L_FALSE
        ? "unsat"
        : "unknown";
  }
}

export class ModelChecker {
  private maxCexs = MBQI_MAX_CEXS;
  private iterationIndex = 0;
  private newInstances: Instance[] = [];
  private root2value = new Map<Enode, number>();
  private value2expr: Map<number, number> | null = null;
  private freshExprs: number[] = [];
  private aux: AuxContext | null = null;

  constructor(
    private context: Context,
    private modelFinder: ModelFinder,
    private qmanager: DefaultQuantifierManager,
  ) {}

  private get manager() {
    return this.context.manager;
  }

  private getValue2expr() {
    if (this.value2expr !== null) return this.value2expr;
    const value2expr = new Map<number, number>();
    for (const entry of this.root2value) {
      // get_eq_enode_with_min_gen.
      let node = entry[0];
      let current = node.next;
      while (current !== entry[0] && node.generation > 0) {
        if (current.generation < node.generation) node = current;
        current = current.next;
      }
      if (!this.manager.isUniqueValue(node.owner)) value2expr.set(entry[1], node.owner);
    }
    this.value2expr = value2expr;
    return value2expr;
  }

  // get_type_compatible_term: a term of the context that stands for a value, which may be a fresh
  // constant.
  private getTypeCompatibleTerm(value: number): number {
    const manager = this.manager;
    let freshTerm: number;
    if (manager.kinds[value] === KIND_APP && manager.args[value].length > 0)
      freshTerm = manager.mkApp(
        manager.decls[value],
        manager.args[value].map((arg) => this.getTypeCompatibleTerm(arg)),
        manager.sorts[value],
      );
    else {
      const term = this.getValue2expr().get(value);
      if (term !== undefined) return term;
      const existing = this.freshExprs.find(
        (fresh) => manager.sorts[fresh] === manager.sorts[value],
      );
      if (existing !== undefined) return existing;
      freshTerm = manager.mkFreshConst("sk", manager.sorts[value]);
    }
    this.freshExprs.push(freshTerm);
    if (!this.context.isEInternalized(freshTerm)) this.context.internalize(freshTerm, false);
    return freshTerm;
  }

  // assert_neg_q_m: asserts the negated body under the model, with fresh constants for the
  // variables.
  private assertNegQM(aux: AuxContext, quantifier: number, model: ProtoModel) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const body = model.eval(data.body, true);
    const numDecls = data.sorts.length;
    const sks: number[] = [];
    for (let index = 0; index < numDecls; index++) {
      const sort = data.sorts[numDecls - index - 1];
      const sk = manager.mkFreshConst(null, sort);
      sks[numDecls - index - 1] = sk;
      if (model.isFinite(sort)) {
        // restrict_to_universe: ast_manager::mk_or, which keeps a single disjunct in an or.
        const universe = model.getKnownUniverse(sort).map((value) => manager.mkEq(sk, value));
        const constraint = manager.mkApp(OP_OR, universe, SORT_BOOL);
        manager.incRef(constraint);
        aux.assert(constraint);
        manager.decRef(constraint);
      }
    }
    aux.assert(manager.mkNot(substitute(manager, body, sks)));
    return sks;
  }

  private addInstance(quantifier: number, cex: ProtoModel, sks: number[], isUsingInv: boolean) {
    if (sks.length === 0) return false;
    const manager = this.manager;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const bindings: number[] = [];
    let maxGeneration = 0;
    for (let index = 0; index < numDecls; index++) {
      const sk = sks[numDecls - index - 1];
      let skValue = cex.getSomeConstInterp(manager.decls[sk]);
      if (isUsingInv) {
        const inv = this.modelFinder.getInv(quantifier, index, skValue, cex);
        if (inv === null) return false;
        maxGeneration = Math.max(maxGeneration, inv.generation);
        skValue = inv.term;
      } else skValue = this.getValue2expr().get(skValue) ?? skValue;
      if (manager.containsModelValue(skValue)) skValue = this.getTypeCompatibleTerm(skValue);
      bindings[numDecls - index - 1] = skValue;
    }
    this.newInstances.push({
      quantifier,
      bindings,
      generation: Math.max(this.qmanager.getGeneration(quantifier), maxGeneration),
    });
    return true;
  }

  // check(q): whether the model satisfies the quantifier. A counterexample becomes an instance.
  private checkQuantifier(quantifier: number, model: ProtoModel) {
    const manager = this.manager;
    const aux = this.aux ?? new AuxContext(manager);
    this.aux = aux;
    aux.push();
    const isSatisfied = this.checkInScope(aux, quantifier, model);
    aux.pop();
    return isSatisfied;
  }

  private checkInScope(aux: AuxContext, quantifier: number, model: ProtoModel) {
    const manager = this.manager;
    const flatQ = this.modelFinder.getFlatQuantifier(quantifier);
    const sks = this.assertNegQM(aux, flatQ, model);
    const completeCex = aux.check();
    if (completeCex === "unsat") return true;
    if (completeCex === "unknown") return false;
    // Try to find instances from the instantiation sets first.
    this.modelFinder.restrictSksToInstSet(quantifier, sks, (expr) => aux.assert(expr));
    let numNewInstances = 0;
    for (;;) {
      const cex = aux.check();
      if (typeof cex === "string" || !this.addInstance(quantifier, cex, sks, true)) break;
      numNewInstances++;
      if (numNewInstances >= this.maxCexs) break;
      // add_blocking_clause: diseqs and blocking_clause hold their terms until it is asserted.
      const diseqs = new RefVector(manager);
      for (const sk of sks)
        diseqs.push(manager.mkNot(manager.mkEq(sk, cex.getSomeConstInterp(manager.decls[sk]))));
      const blockingClause = manager.mkApp(OP_OR, diseqs.items, SORT_BOOL);
      manager.incRef(blockingClause);
      aux.assert(blockingClause);
      manager.decRef(blockingClause);
      diseqs.reset();
    }
    if (numNewInstances === 0) this.addInstance(quantifier, completeCex, sks, false);
    return false;
  }

  private checkQuantifiers(model: ProtoModel) {
    const context = this.context;
    let isFoundRelevant = false;
    let numFailures = 0;
    for (const quantifier of this.qmanager.quantifiers) {
      // Z3's resource limit cancels the checks, and the search gives up.
      if (context.checkCanceled()) return { isFoundRelevant, numFailures: numFailures + 1 };
      if (
        !context.isRelevant(quantifier) ||
        context.getAssignment(context.getLiteral(quantifier)) !== L_TRUE
      )
        continue;
      isFoundRelevant = true;
      if (!this.checkQuantifier(quantifier, model)) numFailures++;
    }
    return { isFoundRelevant, numFailures };
  }

  // check(md, root2value): whether the model satisfies every relevant quantifier.
  check(model: ProtoModel, root2value: Map<Enode, number>) {
    this.root2value = root2value;
    if (this.qmanager.quantifiers.length === 0) return true;
    if (this.iterationIndex >= MBQI_MAX_ITERATIONS) return false;
    this.value2expr = null;
    model.compress();
    const first = this.checkQuantifiers(model);
    if (first.isFoundRelevant) this.iterationIndex++;
    this.maxCexs += MBQI_MAX_CEXS;
    let numFailures = first.numFailures;
    if (numFailures === 0 && !this.context.validateModel(model))
      numFailures = 1 + this.checkQuantifiers(model).numFailures;
    if (numFailures === 0) model.cleanup();
    return numFailures === 0;
  }

  initSearchEh() {
    this.maxCexs = MBQI_MAX_CEXS;
    this.iterationIndex = 0;
  }

  hasNewInstances() {
    return this.newInstances.length > 0;
  }

  // restart_eh: assert_new_instances.
  restartEh() {
    const context = this.context;
    for (const instance of this.newInstances) {
      if (!context.isBInternalized(instance.quantifier)) continue;
      const bindings = instance.bindings.map((binding) => {
        if (!context.isEInternalized(binding))
          context.internalize(binding, false, instance.generation);
        const node = context.getEnode(binding);
        if (node === undefined) throw new Error("the binding was not internalized");
        return node;
      });
      this.qmanager.addInstance(instance.quantifier, bindings, instance.generation);
    }
    this.newInstances = [];
  }
}
