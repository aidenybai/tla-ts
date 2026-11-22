import { SmtInvariantError } from "../../../errors";
import { KIND_APP, OP_NOT, OP_OR, SORT_BOOL } from "./ast";
import { AssertedFormulas } from "./asserted-formulas";
import { CS_ACTIVITY } from "./case-split-queue";
import { Context } from "./context";
import type { Enode } from "./enode";
import { getIdentityHash, ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE } from "./lbool";
import type { ModelFinder } from "./model-finder";
import type { ProtoModel } from "./proto-model";
import type { DefaultQuantifierManager } from "./quantifier-manager";
import { RefVector } from "./ref-vector";
import { VarSubst } from "./var-subst";

interface Instance {
  quantifier: number;
  offset: number;
  generation: number;
}

class AuxContext {
  private context: Context;
  private asserted: AssertedFormulas;

  // init_aux_context copies the kernel's smt_params and theories, so the context has a model
  // finder too, though it never sees a quantifier.
  constructor(parent: Context) {
    this.asserted = new AssertedFormulas(
      parent.manager,
      false,
      true,
      parent.params.isProofsEnabled,
    );
    this.context = new Context(parent.manager, {
      ...parent.params,
      relevancyLevel: 0,
      caseSplitStrategy: CS_ACTIVITY,
      isArrayFakeSupport: true,
    });
    this.context.config = { ...parent.config, relevancyLevel: 0 };
    for (const theory of parent.theories) this.context.registerFamily(theory.id);
    // Z3 gives the aux context no logic, so its setup adds every theory.
    this.context.setupContext(
      parent.setup === undefined ? undefined : { ...parent.setup, logic: undefined },
      false,
      this.asserted,
    );
  }

  release() {
    this.context.release(this.asserted);
  }

  push() {
    this.context.popToBaseLevel();
    this.context.internalizeAndPush(this.asserted);
  }

  pop() {
    this.context.pop(1);
  }

  assert(formula: number) {
    if (this.context.checkCanceled()) return;
    this.context.popToBaseLevel();
    this.asserted.assertExpr(formula);
  }

  check() {
    const context = this.context;
    context.popToBaseLevel();
    const result = context.checkResearching(this.asserted, []);
    return result === L_TRUE ? context.getModel() : result === L_FALSE ? "unsat" : "unknown";
  }
}

export class ModelChecker {
  private maxCexs = 1;
  private iterationIndex = 0;
  private newInstances: Instance[] = [];
  private pinnedExprs: RefVector;
  private root2value = new ObjMap<number>(getIdentityHash);
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

  release() {
    this.aux?.release();
    this.pinnedExprs.reset();
  }

  private get manager() {
    return this.context.manager;
  }

  private getValue2expr() {
    if (this.value2expr !== null) return this.value2expr;
    const value2expr = new Map<number, number>();
    for (const entry of this.root2value) {
      const root = this.context.getEnode(entry[0]);
      if (root === undefined) throw new SmtInvariantError("the term was not internalized");
      const node = this.getEqEnodeWithMinGen(root);
      if (!this.manager.isValue(node.owner)) value2expr.set(entry[1], node.owner);
    }
    this.value2expr = value2expr;
    return value2expr;
  }

  private getEqEnodeWithMinGen(root: Enode) {
    const context = this.context;
    let result = root;
    let resultGeneration = context.getGeneration(root);
    let current = root;
    do {
      const generation = context.getGeneration(current);
      if (generation === 0) return current;
      if (generation < resultGeneration) {
        result = current;
        resultGeneration = generation;
      }
      current = current.next;
    } while (current !== root);
    return result;
  }

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

  private assertNegQM(aux: AuxContext, quantifier: number, model: ProtoModel, sks: RefVector) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const body = model.tryEval(data.body, true);
    if (body === undefined) return false;
    const numDecls = data.sorts.length;
    sks.resize(numDecls);
    for (let index = 0; index < numDecls; index++) {
      const sort = data.sorts[numDecls - index - 1];
      const sk = manager.mkFreshConst(null, sort);
      sks.set(numDecls - index - 1, sk);
      if (model.isFinite(sort)) {
        const universe = model.getKnownUniverse(sort).map((value) => manager.mkEq(sk, value));
        // ast_manager::mk_or keeps a single disjunct in an or.
        const constraint = manager.mkApp(OP_OR, universe, SORT_BOOL);
        manager.incRef(constraint);
        aux.assert(constraint);
        manager.decRef(constraint);
      }
    }
    const subst = new VarSubst(manager, true);
    try {
      const skBody = subst.apply(body, sks.items);
      // m.mk_not, which makes (not true) of a true body too.
      const negated = manager.mkApp(OP_NOT, [skBody], SORT_BOOL);
      manager.incRef(negated);
      aux.assert(negated);
      manager.decRef(negated);
      manager.decRef(skBody);
    } finally {
      subst.release();
      manager.decRef(body);
    }
    return true;
  }

  private addInstance(
    quantifier: number,
    cex: ProtoModel | undefined,
    sks: number[],
    isUsingInv: boolean,
  ) {
    if (cex === undefined || sks.length === 0) return false;
    const manager = this.manager;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const bindings: number[] = [];
    let maxGeneration = 0;
    for (let index = 0; index < numDecls; index++) {
      const sk = sks[numDecls - index - 1];
      let skValue = cex.getSomeConstInterp(manager.decls[sk]);
      if (isUsingInv) {
        const inv = this.modelFinder.getInv(quantifier, index, skValue);
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

  private checkQuantifier(aux: AuxContext, quantifier: number, model: ProtoModel) {
    const manager = this.manager;
    aux.push();
    const sks = new RefVector(manager);
    try {
      return this.checkInScope(aux, quantifier, model, sks);
    } finally {
      sks.reset();
      aux.pop();
    }
  }

  private checkInScope(aux: AuxContext, quantifier: number, model: ProtoModel, skRefs: RefVector) {
    const flatQ = this.modelFinder.getFlatQuantifier(quantifier);
    if (!this.assertNegQM(aux, flatQ, model, skRefs)) return false;
    const sks = skRefs.items;
    const completeCex = aux.check();
    if (completeCex === "unsat") return true;
    if (completeCex === "unknown") return false;
    completeCex?.incRef();
    try {
      this.modelFinder.restrictSksToInstSet(quantifier, sks, (expr) => aux.assert(expr));
      let numNewInstances = 0;
      for (;;) {
        const cex = aux.check();
        if (cex === undefined || typeof cex === "string") break;
        cex.incRef();
        try {
          const isAdded = this.addInstance(quantifier, cex, sks, true);
          if (isAdded) numNewInstances++;
          if (isAdded && numNewInstances < this.maxCexs) this.addBlockingClause(aux, cex, sks);
          if (!isAdded || numNewInstances >= this.maxCexs) break;
        } finally {
          cex.decRef();
        }
      }
      if (numNewInstances === 0) this.addInstance(quantifier, completeCex, sks, false);
    } finally {
      completeCex?.decRef();
    }
    return false;
  }

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

  private checkQuantifiers(aux: AuxContext, model: ProtoModel) {
    const context = this.context;
    let isFoundRelevant = false;
    let numFailures = 0;
    for (const quantifier of this.qmanager.quantifiers) {
      const isMbqiEnabled = this.qmanager.isMbqiEnabled(quantifier);
      if (
        !isMbqiEnabled ||
        !context.isRelevant(quantifier) ||
        context.getAssignment(context.getLiteral(quantifier)) !== L_TRUE
      ) {
        if (!isMbqiEnabled) numFailures++;
        continue;
      }
      isFoundRelevant = true;
      if (!this.checkQuantifier(aux, quantifier, model)) numFailures++;
    }
    return { isFoundRelevant, numFailures };
  }

  check(model: ProtoModel, root2value: ObjMap<number>) {
    this.root2value = root2value;
    if (this.qmanager.quantifiers.length === 0) return true;
    if (this.iterationIndex >= this.context.params.mbqiMaxIterations) return false;
    this.value2expr = null;
    model.compress();
    const aux = this.aux ?? new AuxContext(this.context);
    this.aux = aux;
    const first = this.checkQuantifiers(aux, model);
    if (first.isFoundRelevant) this.iterationIndex++;
    this.maxCexs += this.context.config.mbqiMaxCexs;
    let numFailures = first.numFailures;
    if (numFailures === 0 && !this.context.validateModel(model))
      numFailures = 1 + this.checkQuantifiers(aux, model).numFailures;
    if (numFailures === 0) model.cleanup();
    return numFailures === 0;
  }

  initSearchEh() {
    this.maxCexs = this.context.config.mbqiMaxCexs;
    this.iterationIndex = 0;
  }

  hasNewInstances() {
    return this.newInstances.length > 0;
  }

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
    this.pinnedExprs.reset();
    this.newInstances = [];
  }
}
