// Ported from Z3 (src/smt/smt_model_checker.cpp), MIT license, see z3-license.txt. Checks whether
// the candidate model satisfies each relevant quantifier: the negated body, with the model's
// interpretations in place of the uninterpreted symbols, goes to an auxiliary context. A model of it
// is a counterexample that becomes an instance of the quantifier.
import { SmtInvariantError } from "../../../errors";
import { KIND_APP, OP_NOT, OP_OR, SORT_BOOL, type AstManager } from "./ast";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import type { Enode } from "./enode";
import { L_FALSE, L_TRUE } from "./lbool";
import type { ModelFinder } from "./model-finder";
import type { ProtoModel } from "./proto-model";
import type { DefaultQuantifierManager } from "./quantifier-manager";
import { RefVector } from "./ref-vector";
import { VarSubst } from "./var-subst";

// qi_params' mbqi_max_cexs and mbqi_max_iterations.
const MBQI_MAX_CEXS = 1;
const MBQI_MAX_ITERATIONS = 1000;

// An instance whose bindings start at offset in m_pinned_exprs.
interface Instance {
  quantifier: number;
  offset: number;
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

  // The context makes its asserted formulas first. Its theories hold only constants that exist by
  // now, so setup_context can run at once. init_aux_context copies the kernel's smt_params, so the
  // context has a model finder too, though it never sees a quantifier.
  constructor(private manager: AstManager) {
    this.asserted = new AssertedFormulas(manager);
    this.context = new Context(manager, { isMbqi: true, relevancyLevel: 0 });
    this.context.setupContext();
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

  // assert_expr_core: outside the search, the scopes of the last search are popped first.
  assert(formula: number) {
    this.context.popToBaseLevel();
    this.asserted.assertExpr(formula);
  }

  // A model of the assertions, or whether they are unsatisfiable or undecided. Z3 registers
  // theory_polymorphism, which assumes a fresh constant whenever formulas were asserted since its
  // last assumption.
  check() {
    const context = this.context;
    context.popToBaseLevel();
    context.internalizeAssertions(this.asserted);
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
    return result === L_TRUE ? context.getModel() : result === L_FALSE ? "unsat" : "unknown";
  }
}

export class ModelChecker {
  private maxCexs = MBQI_MAX_CEXS;
  private iterationIndex = 0;
  private newInstances: Instance[] = [];
  // m_pinned_exprs: the bindings and quantifier of each new instance, held until they are asserted.
  private pinnedExprs: RefVector;
  private root2value = new Map<Enode, number>();
  private value2expr: Map<number, number> | null = null;
  private freshExprs: number[] = [];
  private aux: AuxContext | null = null;

  constructor(
    private context: Context,
    private modelFinder: ModelFinder,
    private qmanager: DefaultQuantifierManager,
  ) {
    this.pinnedExprs = new RefVector(context.manager);
  }

  private get manager() {
    return this.context.manager;
  }

  private getValue2expr() {
    if (this.value2expr !== null) return this.value2expr;
    const value2expr = new Map<number, number>();
    for (const entry of this.root2value) {
      const node = this.getEqEnodeWithMinGen(entry[0]);
      if (!this.manager.isUniqueValue(node.owner)) value2expr.set(entry[1], node.owner);
    }
    this.value2expr = value2expr;
    return value2expr;
  }

  // enode::get_eq_enode_with_min_gen: the first node of the class with generation 0, or else the
  // first with the least generation.
  private getEqEnodeWithMinGen(root: Enode) {
    const context = this.context;
    let result = root;
    let resultGeneration = context.getGeneration(root.id);
    let current = root;
    do {
      const generation = context.getGeneration(current.id);
      if (generation === 0) return current;
      if (generation < resultGeneration) {
        result = current;
        resultGeneration = generation;
      }
      current = current.next;
    } while (current !== root);
    return result;
  }

  // get_type_compatible_term: a term of the context that stands for a value, which may be a fresh
  // constant.
  private getTypeCompatibleTerm(value: number): number {
    const manager = this.manager;
    let freshTerm: number;
    if (manager.kinds[value] === KIND_APP && manager.getNumArgs(value) > 0)
      freshTerm = manager.mkApp(
        manager.decls[value],
        manager.mapArgs(value, (arg) => this.getTypeCompatibleTerm(arg)),
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
  // variables, which sks holds.
  private assertNegQM(aux: AuxContext, quantifier: number, model: ProtoModel, sks: RefVector) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const body = model.eval(data.body, true);
    const numDecls = data.sorts.length;
    sks.resize(numDecls);
    for (let index = 0; index < numDecls; index++) {
      const sort = data.sorts[numDecls - index - 1];
      const sk = manager.mkFreshConst(null, sort);
      sks.set(numDecls - index - 1, sk);
      if (model.isFinite(sort)) {
        // restrict_to_universe: ast_manager::mk_or, which keeps a single disjunct in an or.
        const universe = model.getKnownUniverse(sort).map((value) => manager.mkEq(sk, value));
        const constraint = manager.mkApp(OP_OR, universe, SORT_BOOL);
        manager.incRef(constraint);
        aux.assert(constraint);
        manager.decRef(constraint);
      }
    }
    const subst = new VarSubst(manager, true);
    const skBody = subst.apply(body, sks.items);
    // m.mk_not, which makes (not true) of a true body too.
    const negated = manager.mkApp(OP_NOT, [skBody], SORT_BOOL);
    manager.incRef(negated);
    aux.assert(negated);
    manager.decRef(negated);
    manager.decRef(skBody);
    subst.release();
    manager.decRef(body);
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
    const offset = this.pinnedExprs.size;
    for (const binding of bindings) this.pinnedExprs.push(binding);
    this.pinnedExprs.push(quantifier);
    this.newInstances.push({
      quantifier,
      offset,
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
    // sks: the fresh constants of the variables, which are released before the scope is popped.
    const sks = new RefVector(manager);
    const isSatisfied = this.checkInScope(aux, quantifier, model, sks);
    sks.reset();
    aux.pop();
    return isSatisfied;
  }

  private checkInScope(aux: AuxContext, quantifier: number, model: ProtoModel, skRefs: RefVector) {
    const flatQ = this.modelFinder.getFlatQuantifier(quantifier);
    this.assertNegQM(aux, flatQ, model, skRefs);
    const sks = skRefs.items;
    const completeCex = aux.check();
    if (completeCex === "unsat") return true;
    if (completeCex === "unknown") return false;
    // complete_cex and cex hold their models.
    completeCex.incRef();
    // Try to find instances from the instantiation sets first.
    this.modelFinder.restrictSksToInstSet(quantifier, sks, (expr) => aux.assert(expr));
    let numNewInstances = 0;
    for (;;) {
      const cex = aux.check();
      if (typeof cex === "string") break;
      cex.incRef();
      const isAdded = this.addInstance(quantifier, cex, sks, true);
      if (isAdded) numNewInstances++;
      if (isAdded && numNewInstances < this.maxCexs) this.addBlockingClause(aux, cex, sks);
      cex.decRef();
      if (!isAdded || numNewInstances >= this.maxCexs) break;
    }
    if (numNewInstances === 0) this.addInstance(quantifier, completeCex, sks, false);
    completeCex.decRef();
    return false;
  }

  // add_blocking_clause: diseqs and blocking_clause hold their terms until it is asserted.
  private addBlockingClause(aux: AuxContext, cex: ProtoModel, sks: number[]) {
    const manager = this.manager;
    const diseqs = new RefVector(manager);
    for (const sk of sks)
      diseqs.push(manager.mkNot(manager.mkEq(sk, cex.getSomeConstInterp(manager.decls[sk]))));
    const blockingClause = manager.mkApp(OP_OR, diseqs.items, SORT_BOOL);
    manager.incRef(blockingClause);
    aux.assert(blockingClause);
    manager.decRef(blockingClause);
    diseqs.reset();
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
      const numDecls = this.manager.getQuantifier(instance.quantifier).sorts.length;
      const bindings = this.pinnedExprs.items.slice(instance.offset, instance.offset + numDecls);
      const nodes = bindings.map((binding) => {
        if (!context.isEInternalized(binding))
          context.internalize(binding, false, instance.generation);
        const node = context.getEnode(binding);
        if (node === undefined) throw new SmtInvariantError("the binding was not internalized");
        return node;
      });
      this.qmanager.addInstance(instance.quantifier, nodes, instance.generation);
    }
    // reset_new_instances.
    this.pinnedExprs.reset();
    this.newInstances = [];
  }
}
