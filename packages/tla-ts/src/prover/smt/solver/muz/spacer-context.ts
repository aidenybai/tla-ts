// Ported from Z3 (src/muz/spacer/spacer_context.cpp), MIT license, see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import { type AstManager, getSymbolName, KIND_VAR, OP_AND, OP_IMPLIES, SORT_BOOL } from "../ast";
import { pushNotOwned } from "../ast-util";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { getFreeVarSorts, VarSubst } from "../var-subst";
import type { DatalogContext, FpParams } from "./dl-context";
import { blastTermIte } from "./dl-mk-elim-term-ite";
import type { Rule } from "./dl-rule";
import type { RuleSet } from "./dl-rule-set";
import { mkLemmaGeneralizers, type LemmaGeneralizer } from "./spacer-generalizers";
import { SpacerManager } from "./spacer-manager";
import { gpdrCreateSplitChildren, gpdrSolveCore } from "./spacer-pdr";
import { IucSolver, PropSolver } from "./spacer-prop-solver";
import {
  computeImplicantLiterals,
  flattenAnd,
  INFTY_LEVEL,
  isFalseIn,
  isInftyLevel,
  isTrueIn,
  mkAndOf,
  mkOrOf,
  nextLevel,
  pin,
  prevLevel,
  qeProject,
  SpacerNormalizer,
  sortByAstLt,
  ZkConsts,
} from "./spacer-util";

export const L_GAVE_UP = 2;

class ReachFact {
  tag = -1;
  readonly justifications: ReachFact[] = [];

  constructor(
    readonly rule: Rule,
    readonly fact: number,
    readonly auxVars: readonly number[],
    readonly isInit = false,
  ) {}
}

export class Lemma {
  body = -1;
  cube: number[] = [];
  pob: Pob | undefined;
  ctp: ProtoModel | undefined;
  level: number;
  bumped = 0;
  weakness: number;
  isExternal = false;
  isBlocked = false;
  isBackground = false;

  constructor(
    private context: SpacerContext,
    level: number,
    body = -1,
    pob?: Pob,
  ) {
    this.level = level;
    this.weakness = pob === undefined ? 65535 : pob.weakness;
    this.pob = pob;
    if (body !== -1) this.body = context.normalizer.normalize(body);
  }

  static fromCube(context: SpacerContext, pob: Pob, cube: readonly number[], level: number) {
    const lemma = new Lemma(context, pob.level, -1, pob);
    lemma.updateCube(pob, cube);
    lemma.setLevel(level);
    return lemma;
  }

  private get manager() {
    return this.context.manager;
  }

  getExpr() {
    if (this.body !== -1) return this.body;
    const manager = this.manager;
    const conj = mkAndOf(manager, this.getCube());
    this.body = pushNotOwned(manager, this.context.normalizer.normalize(conj, false));
    return this.body;
  }

  getCube() {
    if (this.cube.length > 0) return this.cube;
    const manager = this.manager;
    const cube = this.pob !== undefined ? this.pob.post : pushNotOwned(manager, this.body);
    this.cube = flattenAnd(manager, [cube]);
    if (this.cube.length === 0) this.cube.push(manager.trueExpr);
    else sortByAstLt(manager, this.cube);
    return this.cube;
  }

  isFalse() {
    const manager = this.manager;
    if (this.cube.length === 1) return manager.isTrue(this.cube[0]);
    if (this.body !== -1) return manager.isFalse(this.body);
    if (this.pob !== undefined) return manager.isTrue(this.pob.post);
    return false;
  }

  updateCube(pob: Pob | undefined, cube: readonly number[]) {
    this.pob = pob;
    this.cube = [...cube];
    this.body = -1;
    if (this.cube.length === 0) this.cube.push(this.manager.trueExpr);
    if (cube.some((lit) => this.context.zkConsts.has(lit)))
      throw new SmtUnsupportedError("quantified spacer lemmas");
  }

  setLevel(level: number) {
    this.pob?.blockedAt(level);
    this.level = level;
  }

  isInductive() {
    return isInftyLevel(this.level);
  }

  hasCtp() {
    return !this.isInductive() && this.ctp !== undefined;
  }
}

const isLemmaLess = (manager: AstManager, first: Lemma, second: Lemma) =>
  first.level !== second.level
    ? first.level < second.level
    : sortByAstLt(manager, [second.getExpr(), first.getExpr()])[0] === first.getExpr() &&
      first.getExpr() !== second.getExpr();

export class Pob {
  readonly id: number;
  post = -1;
  binding: number[] = [];
  level: number;
  depth: number;
  desiredLevel = 0;
  isOpen = true;
  isUsingFarkas = true;
  isInQueue = false;
  weakness = 0;
  derivation: Derivation | undefined;
  readonly kids: Pob[] = [];
  readonly lemmas: Lemma[] = [];
  blockedLevel = 0;
  gas = 0;

  constructor(
    readonly parent: Pob | undefined,
    readonly pt: PredTransformer,
    level: number,
    depth: number,
    isAddingToParent = true,
  ) {
    this.id = pt.nextPobId++;
    this.level = level;
    this.depth = depth;
    if (isAddingToParent && parent !== undefined) parent.kids.push(this);
    if (parent !== undefined) this.gas = parent.gas;
  }

  setPost(post: number, binding: readonly number[] = []) {
    this.post = this.pt.context.normalizer.normalize(post, false);
    this.binding = [...binding];
  }

  inherit(other: Pob) {
    this.binding = [...other.binding];
    this.level = other.level;
    this.depth = other.depth;
    this.desiredLevel = Math.max(this.desiredLevel, other.desiredLevel);
    this.isOpen = other.isOpen;
    this.isUsingFarkas = other.isUsingFarkas;
    this.weakness = other.weakness;
    this.derivation = undefined;
  }

  close() {
    if (!this.isOpen) return;
    this.derivation = undefined;
    this.isOpen = false;
    for (const kid of this.kids) kid.close();
  }

  isClosed() {
    return !this.isOpen;
  }

  incLevel() {
    this.level++;
    this.depth++;
    this.weakness = 0;
  }

  blockedAt(level = 0) {
    this.blockedLevel = Math.max(level, this.blockedLevel);
    return this.blockedLevel;
  }
}

const isPobLess = (manager: AstManager, first: Pob, second: Pob) => {
  if (first.level !== second.level) return first.level < second.level;
  if (first.depth !== second.depth) return first.depth < second.depth;
  if (first.gas !== second.gas) return first.gas > second.gas;
  const getSize = (post: number) => (manager.getOp(post) === OP_AND ? manager.getNumArgs(post) : 1);
  if (getSize(first.post) !== getSize(second.post))
    return getSize(first.post) < getSize(second.post);
  if (first.post !== second.post) return manager.ids[first.post] < manager.ids[second.post];
  const firstHead = manager.funcDecls[first.pt.head].smallId;
  const secondHead = manager.funcDecls[second.pt.head].smallId;
  return firstHead !== secondHead ? firstHead < secondHead : first.id < second.id;
};

class PobQueue {
  root: Pob | undefined;
  maxLevel = 0;
  minDepth = 0;
  private data: Pob[] = [];

  constructor(private manager: AstManager) {}

  private getMinIndex() {
    let best = 0;
    for (let index = 1; index < this.data.length; index++)
      if (isPobLess(this.manager, this.data[index], this.data[best])) best = index;
    return best;
  }

  top() {
    if (this.data.length === 0) return undefined;
    const top = this.data[this.getMinIndex()];
    if (top.level > this.maxLevel) return undefined;
    if (top.level === this.maxLevel && top.depth > this.minDepth) return undefined;
    return top;
  }

  pop() {
    const index = this.getMinIndex();
    this.data[index].isInQueue = false;
    this.data.splice(index, 1);
  }

  setRoot(root: Pob) {
    this.root = root;
    this.maxLevel = root.level;
    this.minDepth = root.depth;
    this.reset();
  }

  reset() {
    for (const pob of this.data) pob.isInQueue = false;
    this.data = [];
    if (this.root === undefined) return;
    this.root.isInQueue = true;
    this.data.push(this.root);
  }

  push(pob: Pob) {
    if (pob.isInQueue) return;
    pob.isInQueue = true;
    this.data.push(pob);
  }

  incLevel() {
    this.maxLevel++;
    this.minDepth++;
    if (this.root === undefined || this.data.length > 0) return;
    this.root.isInQueue = true;
    this.data.push(this.root);
  }

  isRoot(pob: Pob) {
    return this.root === pob;
  }
}

interface Premise {
  pt: PredTransformer;
  oIndex: number;
  summary: number;
  isMust: boolean;
  oVars: number[];
}

class Derivation {
  private premises: Premise[] = [];
  private active = 0;

  constructor(
    readonly parent: Pob,
    readonly rule: Rule,
    private trans: number,
    private evars: number[],
  ) {}

  private get pt() {
    return this.parent.pt;
  }

  private getOVars(pt: PredTransformer, oIndex: number, auxVars: readonly number[] | undefined) {
    const spacer = pt.context.spacerManager;
    return [
      ...pt.sig.map((decl) => spacer.constOf(spacer.o2o(decl, oIndex))),
      ...(auxVars ?? []).map((variable) =>
        spacer.constOf(spacer.n2o(pt.manager.decls[variable], oIndex)),
      ),
    ];
  }

  addPremise(
    pt: PredTransformer,
    oIndex: number,
    summary: number,
    isMust: boolean,
    auxVars: readonly number[] | undefined,
  ) {
    this.premises.push({
      pt,
      oIndex,
      summary,
      isMust,
      oVars: this.getOVars(pt, oIndex, auxVars),
    });
  }

  createFirstChild(model: ProtoModel) {
    if (this.premises.length === 0) return undefined;
    this.active = 0;
    return this.createNextChildWith(model);
  }

  private existSkolemize(fml: number, vars: readonly number[]) {
    const manager = this.pt.manager;
    if (vars.length === 0 || manager.isTrue(fml) || manager.isFalse(fml)) return;
    throw new SmtUnsupportedError("existentially quantified spacer proof obligations");
  }

  private createNextChildWith(model: ProtoModel): Pob | undefined {
    const manager = this.pt.manager;
    const context = this.pt.context;
    const summaries: number[] = [];
    let vars: number[] = [];
    while (this.active < this.premises.length && this.premises[this.active].isMust) {
      summaries.push(this.premises[this.active].summary);
      vars.push(...this.premises[this.active].oVars);
      this.active++;
    }
    if (this.active >= this.premises.length) return undefined;
    summaries.push(this.trans);
    this.trans = mkAndOf(manager, summaries);
    if (vars.length > 0) {
      vars.push(...this.evars);
      this.evars = [];
      this.trans = this.pt.mbp(vars, this.trans, model, context.isUsingGroundPob);
      this.evars.push(...vars);
      vars = [];
    }
    if (!isTrueIn(model, this.premises[this.active].summary)) return undefined;
    const rest: number[] = [];
    for (let index = this.active + 1; index < this.premises.length; index++) {
      rest.push(this.premises[index].summary);
      vars.push(...this.premises[index].oVars);
    }
    rest.push(this.trans);
    let post = mkAndOf(manager, rest);
    vars.push(...this.evars);
    if (vars.length > this.evars.length)
      post = this.pt.mbp(vars, post, model, context.isUsingGroundPob);
    if (vars.length > 0) this.existSkolemize(post, vars);
    const premise = this.premises[this.active];
    post = context.spacerManager.formulaO2n(post, premise.oIndex);
    return premise.pt.mkPob(this.parent, prevLevel(this.parent.level), this.parent.depth, post);
  }

  createNextChild(): Pob | undefined {
    if (this.active + 1 >= this.premises.length) return undefined;
    const premise = this.premises[this.active];
    const pt = premise.pt;
    const context = pt.context;
    const manager = pt.manager;
    const spacer = context.spacerManager;
    const summaries = this.premises.slice(this.active + 1).map((other) => other.summary);
    const activeTrans = spacer.formulaO2n(this.trans, premise.oIndex);
    summaries.push(activeTrans);
    const model = pt.isMustReachable(mkAndOf(manager, summaries));
    if (model === undefined) return undefined;
    const reachFact = pt.getUsedRf(model, true);
    const summary = mkAndOf(manager, computeImplicantLiterals(model, [reachFact.fact]));
    premise.isMust = true;
    premise.summary = spacer.formulaN2o(summary, premise.oIndex);
    premise.oVars = this.getOVars(pt, premise.oIndex, reachFact.auxVars);
    this.trans = mkAndOf(manager, [summary, activeTrans]);
    const vars = [...reachFact.auxVars, ...pt.sig.map((decl) => spacer.constOf(spacer.o2n(decl)))];
    if (vars.length > 0) {
      vars.push(...this.evars);
      this.evars = [];
      this.trans = this.pt.mbp(vars, this.trans, model, context.isUsingGroundPob);
      this.evars.push(...vars);
    }
    this.active++;
    return this.createNextChildWith(model);
  }
}

interface PtRule {
  rule: Rule;
  trans: number;
  auxs: number[];
  tag: number;
}

const isInitRule = (ptRule: PtRule) => ptRule.rule.uninterpretedSize === 0;

class PredTransformer {
  readonly sig: number[] = [];
  readonly uses: PredTransformer[] = [];
  readonly ptRules = new Map<Rule, PtRule>();
  readonly rules: Rule[] = [];
  readonly solver: PropSolver;
  private reachSolver: IucSolver;
  private pobs = new Map<number, Pob[]>();
  nextPobId = 0;
  readonly lemmas: Lemma[] = [];
  private bgInvs: Lemma[] = [];
  private frameSize = 0;
  private isSorted = true;
  readonly reachFacts: ReachFact[] = [];
  private rfInitSize = 0;
  private transitionClause: number[] = [];
  private transition = -1;
  private init = -1;
  private extendLit: number;
  private isAllInit = false;
  readonly manager: AstManager;

  constructor(
    readonly context: SpacerContext,
    readonly head: number,
  ) {
    const manager = context.manager;
    this.manager = manager;
    const spacer = context.spacerManager;
    this.reachSolver = new IucSolver(manager, spacer);
    this.solver = new PropSolver(
      manager,
      spacer,
      this.getHeadName(),
      context.params.getUint("spacer.random_seed", 0),
    );
    manager.funcDecls[head].domain.forEach((sort, index) => {
      const decl = spacer.mkFuncDecl(`${this.getHeadName()}_${index}`, [], sort);
      this.sig.push(spacer.getOPred(decl, 0));
    });
    const ext = spacer.mkFuncDecl(`${this.getHeadName()}_ext0`, [], SORT_BOOL);
    this.extendLit = pin(manager, manager.mkNot(spacer.constOf(spacer.getNPred(ext))));
  }

  private getHeadName() {
    return getSymbolName(this.manager.funcDecls[this.head].name);
  }

  private get spacer() {
    return this.context.spacerManager;
  }

  getPredecessors(rule: Rule) {
    return rule.tail.slice(0, rule.uninterpretedSize).map((atom) => this.manager.decls[atom]);
  }

  getTransition(rule: Rule) {
    return (this.ptRules.get(rule) as PtRule).trans;
  }

  getAuxVars(rule: Rule) {
    return (this.ptRules.get(rule) as PtRule).auxs;
  }

  ensureLevel(level: number) {
    if (isInftyLevel(level)) return;
    while (this.frameSize <= level) {
      this.frameSize++;
      this.solver.addLevel();
    }
  }

  // The model of the state when it is reachable.
  isMustReachable(state: number) {
    const manager = this.manager;
    if (this.reachFacts.length === 0) return undefined;
    const solver = this.reachSolver;
    solver.push();
    solver.assertExpr(state);
    solver.assertExpr(manager.mkNot(this.getLastRfTag()));
    const result = solver.checkSat([]);
    const model = result === L_TRUE ? solver.getModel() : undefined;
    solver.pop(1);
    return model;
  }

  getUsedRf(model: ProtoModel, isAll: boolean) {
    for (const reachFact of this.reachFacts) {
      if (!isAll && reachFact.isInit) continue;
      if (isFalseIn(model, reachFact.tag)) return reachFact;
    }
    throw new SmtTacticError("spacer found no used reach fact");
  }

  getUsedOriginRf(model: ProtoModel, oIndex: number) {
    for (const reachFact of this.reachFacts)
      if (isFalseIn(model, this.spacer.formulaN2o(reachFact.tag, oIndex))) return reachFact;
    throw new SmtTacticError("spacer found no used origin reach fact");
  }

  private getAllUsedRf(model: ProtoModel, oIndex: number) {
    return this.reachFacts.filter((reachFact) =>
      isFalseIn(
        model,
        oIndex === -1 ? reachFact.tag : this.spacer.formulaN2o(reachFact.tag, oIndex),
      ),
    );
  }

  findRuleOf(model: ProtoModel) {
    for (const ptRule of this.ptRules.values())
      if (this.manager.isTrue(model.eval(ptRule.tag, false))) return ptRule.rule;
    return undefined;
  }

  findRule(model: ProtoModel) {
    const manager = this.manager;
    let rule: Rule | undefined;
    let isConcrete = false;
    let reachPredUsed: boolean[] = [];
    for (const ptRule of this.ptRules.values()) {
      if (!manager.isTrue(model.eval(ptRule.tag, false))) continue;
      rule = ptRule.rule;
      isConcrete = true;
      reachPredUsed = [];
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const pt = this.context.getPredTransformer(rule.getTailDecl(manager, index));
        let isUsed = false;
        if (pt.reachFacts.length === 0) isConcrete = false;
        else {
          const tag = this.spacer.formulaN2o(pt.getLastRfTag(), index);
          isUsed = manager.isFalse(model.eval(tag, false));
          isConcrete = isConcrete && isUsed;
        }
        reachPredUsed.push(isUsed);
      }
      if (isConcrete) break;
    }
    if (rule === undefined) isConcrete = true;
    return { rule, isConcrete, reachPredUsed };
  }

  getFormulas(level: number) {
    return mkAndOf(
      this.manager,
      this.lemmas.filter((lemma) => lemma.level >= level).map((lemma) => lemma.getExpr()),
    );
  }

  private addLemmaCore(lemma: Lemma, isGroundOnly = false) {
    const level = lemma.level;
    const expr = lemma.getExpr();
    if (!isInftyLevel(level)) this.ensureLevel(level);
    this.solver.assertExpr(expr, level);
    for (const use of this.uses) use.addLemmaFromChild(this, lemma, nextLevel(level), isGroundOnly);
  }

  private addLemmaFromChild(
    child: PredTransformer,
    lemma: Lemma,
    level: number,
    _isGroundOnly: boolean,
  ) {
    this.ensureLevel(level);
    for (const fml of this.mkAssumptions(child.head, lemma.getExpr()))
      this.solver.assertExpr(fml, level);
  }

  addLemma(lemma: Lemma) {
    const manager = this.manager;
    if (lemma.isBackground) {
      if (this.bgInvs.some((other) => other.getExpr() === lemma.getExpr())) return false;
      this.bgInvs.push(lemma);
      return true;
    }
    for (let index = 0; index < this.lemmas.length; index++) {
      const old = this.lemmas[index];
      if (old.getExpr() !== lemma.getExpr()) continue;
      if (lemma.pob !== undefined && !lemma.pob.lemmas.includes(old)) lemma.pob.lemmas.push(old);
      if (old.level >= lemma.level) {
        if (isInftyLevel(old.level)) {
          old.bumped++;
          if (old.bumped >= 100) throw new SmtTacticError("Stuck on a lemma");
        }
        return false;
      }
      old.setLevel(lemma.level);
      this.addLemmaCore(old);
      for (
        let next = index;
        next + 1 < this.lemmas.length &&
        isLemmaLess(manager, this.lemmas[next + 1], this.lemmas[next]);
        next++
      )
        [this.lemmas[next], this.lemmas[next + 1]] = [this.lemmas[next + 1], this.lemmas[next]];
      return true;
    }
    this.lemmas.push(lemma);
    this.isSorted = false;
    this.addLemmaCore(lemma);
    lemma.pob?.lemmas.push(lemma);
    return true;
  }

  private sortLemmas() {
    if (this.isSorted) return;
    this.isSorted = true;
    const manager = this.manager;
    this.lemmas.sort((first, second) =>
      isLemmaLess(manager, first, second) ? -1 : isLemmaLess(manager, second, first) ? 1 : 0,
    );
  }

  propagateToInfinity(level: number) {
    for (const lemma of this.lemmas)
      if (lemma.level >= level && !isInftyLevel(lemma.level)) {
        lemma.setLevel(INFTY_LEVEL);
        this.addLemmaCore(lemma);
        this.isSorted = false;
      }
  }

  propagateToNextLevel(level: number) {
    const manager = this.manager;
    this.sortLemmas();
    let isAll = true;
    if (this.lemmas.length === 0) return isAll;
    const targetLevel = nextLevel(level);
    this.ensureLevel(targetLevel);
    for (let index = 0; index < this.lemmas.length && this.lemmas[index].level <= level;) {
      const lemma = this.lemmas[index];
      if (lemma.level < level) {
        index++;
        continue;
      }
      const solverLevel = this.isInvariant(targetLevel, lemma);
      if (solverLevel !== undefined) {
        lemma.setLevel(solverLevel);
        this.addLemmaCore(lemma);
        for (
          let next = index;
          next + 1 < this.lemmas.length &&
          isLemmaLess(manager, this.lemmas[next + 1], this.lemmas[next]);
          next++
        )
          [this.lemmas[next], this.lemmas[next + 1]] = [this.lemmas[next + 1], this.lemmas[next]];
      } else {
        isAll = false;
        index++;
      }
    }
    return isAll;
  }

  private mkFreshRfTag() {
    const spacer = this.spacer;
    const decl = spacer.mkFuncDecl(
      `${this.getHeadName()}#reach_tag_${this.reachFacts.length}`,
      [],
      SORT_BOOL,
    );
    return spacer.constOf(spacer.getNPred(decl));
  }

  addRf(reachFact: ReachFact | undefined, isForcing = false) {
    const manager = this.manager;
    if (reachFact === undefined) return;
    if (!isForcing && this.reachFacts.some((other) => other.fact === reachFact.fact)) return;
    const lastTag = this.reachFacts.length > 0 ? this.getLastRfTag() : -1;
    reachFact.tag = reachFact.isInit
      ? this.mkFreshRfTag()
      : manager.getArg(this.extendInitial(reachFact.fact), 0);
    this.reachFacts.push(reachFact);
    if (reachFact.isInit) this.rfInitSize++;
    const fml = mkOrOf(
      manager,
      lastTag === -1
        ? [reachFact.fact, reachFact.tag]
        : [manager.mkNot(lastTag), reachFact.fact, reachFact.tag],
    );
    this.reachSolver.assertExpr(fml);
    const fakeLemma = new Lemma(this.context, INFTY_LEVEL, fml);
    for (const use of this.uses) use.addLemmaFromChild(this, fakeLemma, INFTY_LEVEL, false);
  }

  getLastRfTag() {
    return this.reachFacts[this.reachFacts.length - 1].tag;
  }

  getOriginSummary(model: ProtoModel, level: number, oIndex: number, isMust: boolean) {
    const manager = this.manager;
    let auxVars: readonly number[] | undefined;
    let summary: number;
    if (!isMust) summary = this.getFormulas(level);
    else {
      const reachFact = this.getUsedOriginRf(model, oIndex);
      summary = reachFact.fact;
      auxVars = reachFact.auxVars;
    }
    const conjs = flattenAnd(manager, [this.spacer.formulaN2o(summary, oIndex)]);
    if (conjs.some((conj) => !isTrueIn(model, conj))) return undefined;
    return { summary: mkAndOf(manager, computeImplicantLiterals(model, conjs)), auxVars };
  }

  isBlocked(pob: Pob) {
    this.ensureLevel(pob.level);
    const solver = this.solver;
    return solver.withLevel(pob.level, () => {
      solver.core = undefined;
      solver.model = undefined;
      const result = solver.checkAssumptions([pob.post], [], [], []);
      return result === L_FALSE ? solver.usesLevel : undefined;
    });
  }

  mbp(vars: number[], fml: number, model: ProtoModel, isForcing: boolean) {
    return qeProject(this.manager, vars, fml, model, !isForcing);
  }

  isReachable(pob: Pob, core: number[] | undefined, isWantingModel: boolean) {
    const manager = this.manager;
    const context = this.context;
    this.ensureLevel(pob.level);
    const solver = this.solver;
    return solver.withLevel(pob.level, () => {
      const modelHolder = isWantingModel
        ? { value: undefined as ProtoModel | undefined }
        : undefined;
      solver.core = core;
      solver.model = modelHolder;
      const post = flattenAnd(manager, [pob.post]);
      const reachAssumps: number[] = [];
      if (pob.level > 0 && !this.isAllInit)
        for (const ptRule of this.ptRules.values()) {
          const predicates = this.getPredecessors(ptRule.rule);
          for (let index = 0; index < predicates.length; index++) {
            const pt = context.getPredTransformer(predicates[index]);
            if (pt.reachFacts.length > 0)
              reachAssumps.push(
                pin(manager, manager.mkNot(this.spacer.formulaN2o(pt.getLastRfTag(), index))),
              );
            else {
              reachAssumps.push(pin(manager, manager.mkNot(ptRule.tag)));
              break;
            }
          }
        }
      const result = solver.checkAssumptions(post, reachAssumps, this.transitionClause, [
        this.extendLit,
      ]);
      const model = modelHolder?.value;
      if (result === L_TRUE || result === L_UNDEF) {
        if (core !== undefined) core.length = 0;
        const found = model === undefined ? undefined : this.findRule(model);
        return {
          result,
          model,
          rule: found?.rule,
          isConcrete: found?.isConcrete ?? false,
          reachPredUsed: found?.reachPredUsed ?? [],
          usesLevel: INFTY_LEVEL,
        };
      }
      return {
        result,
        model,
        rule: undefined,
        isConcrete: false,
        reachPredUsed: [] as boolean[],
        usesLevel: solver.usesLevel,
      };
    });
  }

  private isCtpBlocked(lemma: Lemma) {
    if (!this.context.isUsingCtp || !lemma.hasCtp()) return false;
    const ctp = lemma.ctp as ProtoModel;
    const rule = this.findRuleOf(ctp);
    if (rule === undefined) {
      lemma.isBlocked = true;
      return true;
    }
    const predicates = this.getPredecessors(rule);
    for (let index = 0; index < predicates.length; index++) {
      const pt = this.context.getPredTransformer(predicates[index]);
      const lemmas = this.spacer.formulaN2o(pt.getFormulas(lemma.level), index);
      if (isFalseIn(ctp, lemmas)) return false;
    }
    return true;
  }

  // The level the lemma is invariant at, or undefined.
  isInvariant(level: number, lemma: Lemma) {
    if (lemma.isBlocked || this.isCtpBlocked(lemma)) return undefined;
    const manager = this.manager;
    const candidate = flattenAnd(manager, [pushNotOwned(manager, lemma.getExpr())]);
    const solver = this.solver;
    return solver.withLevel(level, () => {
      const modelHolder = this.context.isUsingCtp
        ? { value: undefined as ProtoModel | undefined }
        : undefined;
      solver.core = undefined;
      solver.model = modelHolder;
      const result = solver.checkAssumptions(candidate, [], this.transitionClause, [
        this.extendLit,
      ]);
      if (result === L_FALSE) {
        lemma.ctp = undefined;
        return solver.usesLevel;
      }
      if (result === L_TRUE && modelHolder?.value !== undefined) lemma.ctp = modelHolder.value;
      else lemma.ctp = undefined;
      return undefined;
    });
  }

  // Shrinks the state to a core and returns the level it is inductive at, or undefined.
  checkInductive(level: number, state: number[]) {
    const manager = this.manager;
    const conj = this.mkAssumptions(
      this.head,
      pin(manager, manager.mkNot(mkAndOf(manager, state))),
    );
    conj.push(this.extendLit);
    const solver = this.solver;
    return solver.withLevel(level, () => {
      const core: number[] = [];
      solver.core = core;
      solver.model = undefined;
      const result = solver.checkAssumptions(state, [], this.transitionClause, conj);
      if (result !== L_FALSE) return undefined;
      state.length = 0;
      state.push(...core);
      return solver.usesLevel;
    });
  }

  private mkAssumptions(head: number, fml: number) {
    const manager = this.manager;
    const result: number[] = [];
    for (const ptRule of this.ptRules.values())
      this.getPredecessors(ptRule.rule).forEach((predicate, index) => {
        if (predicate !== head) return;
        const implication = manager.mkApp(OP_IMPLIES, [ptRule.tag, fml], SORT_BOOL);
        result.push(pin(manager, this.spacer.formulaN2o(pin(manager, implication), index)));
      });
    return result;
  }

  initialize(pts: Map<number, PredTransformer>) {
    const context = this.context;
    this.init = this.manager.falseExpr;
    this.transition = this.manager.trueExpr;
    this.initRules(pts);
    this.transition = context.simplify(this.transition);
    this.init = context.simplify(this.init);
    this.solver.assertExpr(this.transition);
    this.solver.assertExpr(this.init, 0);
  }

  initRfs() {
    for (const ptRule of this.ptRules.values())
      if (isInitRule(ptRule))
        this.addRf(new ReachFact(ptRule.rule, ptRule.trans, ptRule.auxs, true));
  }

  private initRules(pts: Map<number, PredTransformer>) {
    const manager = this.manager;
    for (const rule of this.rules) this.initRule(pts, rule);
    const notInits: number[] = [];
    if (this.ptRules.size === 0) {
      this.transition = manager.falseExpr;
      this.transitionClause = [];
    } else {
      const transitions: number[] = [];
      this.transitionClause = [manager.getArg(this.extendLit, 0)];
      let index = 0;
      for (const ptRule of this.ptRules.values()) {
        ptRule.tag = this.spacer.mkConst(`${this.getHeadName()}__tr${index}`, SORT_BOOL);
        this.transitionClause.push(ptRule.tag);
        transitions.push(manager.mkApp(OP_IMPLIES, [ptRule.tag, ptRule.trans], SORT_BOOL));
        if (!isInitRule(ptRule)) notInits.push(manager.mkNot(ptRule.tag));
        index++;
      }
      if (!this.context.params.getBool("spacer.use_inc_clause", true)) {
        transitions.push(manager.mkOr(this.transitionClause));
        this.transitionClause = [];
      }
      this.transition = mkAndOf(manager, transitions);
    }
    this.init = mkAndOf(manager, notInits);
    if (notInits.length === 0) this.isAllInit = true;
  }

  private initRule(pts: Map<number, PredTransformer>, rule: Rule) {
    const manager = this.manager;
    const context = this.context;
    const side: number[] = [];
    const varReprs: number[] = [];
    const auxVars: number[] = [];
    this.initAtom(pts, rule.head, varReprs, side, -1);
    for (let index = 0; index < rule.uninterpretedSize; index++) {
      if (rule.isNegated[index])
        throw new SmtTacticError("SPACER does not support negated predicates in rule tails");
      this.initAtom(pts, rule.tail[index], varReprs, side, index);
    }
    let trans = mkAndOf(manager, rule.tail.slice(rule.uninterpretedSize));
    getFreeVarSorts(manager, trans, manager.freeVarBounds[trans]).forEach((sort, index) => {
      if (sort === undefined || (varReprs[index] ?? -1) !== -1) return;
      const fresh = manager.mkFreshFuncDecl("aux", [], sort);
      manager.incDeclRef(fresh);
      const variable = this.spacer.constOf(this.spacer.getNPred(fresh));
      while (varReprs.length <= index) varReprs.push(-1);
      varReprs[index] = variable;
      auxVars.push(variable);
    });
    const subst = new VarSubst(manager, false);
    const substituted = pin(manager, subst.apply(trans, varReprs));
    subst.release();
    side.push(...flattenAnd(manager, [substituted]));
    trans = context.simplify(mkAndOf(manager, side));
    const inflation = context.params.getUint("spacer.blast_term_ite_inflation", 3);
    if (inflation > 0) trans = context.simplify(blastTermIte(manager, trans, inflation));
    if (rule.uninterpretedSize > 0 && !manager.isGround(trans))
      throw new SmtTacticError("spacer: quantifier in a recursive rule");
    if (manager.isFalse(trans)) return;
    if (!this.ptRules.has(rule)) this.ptRules.set(rule, { rule, trans, auxs: auxVars, tag: -1 });
  }

  private initAtom(
    pts: Map<number, PredTransformer>,
    atom: number,
    varReprs: number[],
    side: number[],
    tailIndex: number,
  ) {
    const manager = this.manager;
    const spacer = this.spacer;
    const pt = pts.get(manager.decls[atom]) as PredTransformer;
    manager.getArgs(atom).forEach((arg, index) => {
      const rep = spacer.constOf(
        tailIndex === -1 ? spacer.o2n(pt.sig[index]) : spacer.o2o(pt.sig[index], tailIndex),
      );
      if (manager.kinds[arg] !== KIND_VAR) {
        side.push(pin(manager, manager.mkEq(rep, arg)));
        return;
      }
      const varIndex = manager.values[arg];
      while (varReprs.length <= varIndex) varReprs.push(-1);
      if (varReprs[varIndex] !== -1) side.push(pin(manager, manager.mkEq(rep, varReprs[varIndex])));
      else varReprs[varIndex] = rep;
    });
  }

  private extendInitial(expr: number) {
    const manager = this.manager;
    const spacer = this.spacer;
    const fresh = manager.mkFreshFuncDecl(`${this.getHeadName()}_ext`, [], SORT_BOOL);
    manager.incDeclRef(fresh);
    const variable = spacer.constOf(spacer.getNPred(fresh));
    this.solver.assertExpr(mkOrOf(manager, [this.extendLit, expr, variable]));
    this.extendLit = pin(manager, manager.mkNot(variable));
    return this.extendLit;
  }

  mkRf(pob: Pob, model: ProtoModel, rule: Rule) {
    const manager = this.manager;
    const context = this.context;
    const spacer = this.spacer;
    const children: ReachFact[] = [];
    const pathCons = [this.getTransition(rule)];
    const vars: number[] = [];
    this.getPredecessors(rule).forEach((predicate, index) => {
      const pt = context.getPredTransformer(predicate);
      const kid = pt.getUsedOriginRf(model, index);
      children.push(kid);
      pathCons.push(spacer.formulaN2o(kid.fact, index));
      for (const decl of pt.sig) vars.push(spacer.constOf(spacer.o2o(decl, index)));
      for (const variable of kid.auxVars)
        vars.push(spacer.constOf(spacer.n2o(manager.decls[variable], index)));
    });
    const auxVars = this.getAuxVars(rule);
    const isElimAux = context.params.getBool("spacer.elim_aux", true);
    if (isElimAux) vars.push(...auxVars);
    let result = mkAndOf(manager, pathCons);
    if (context.params.getBool("spacer.reach_dnf", true))
      result = mkAndOf(manager, computeImplicantLiterals(model, [result]));
    result = this.mbp(vars, result, model, true);
    const reachFact = new ReachFact(rule, result, isElimAux ? [] : auxVars);
    reachFact.justifications.push(...children);
    void pob;
    return reachFact;
  }

  isMdlRfConsistent(rule: Rule, model: ProtoModel) {
    const context = this.context;
    const predicates = this.getPredecessors(rule);
    for (let index = 0; index < predicates.length; index++) {
      const pt = context.getPredTransformer(predicates[index]);
      let isAnyTrue = false;
      const used = pt.getAllUsedRf(model, index);
      for (const reachFact of used) {
        if (!isTrueIn(model, this.spacer.formulaN2o(reachFact.fact, index)))
          model.registerConst(this.manager.decls[reachFact.tag], this.manager.trueExpr);
        else isAnyTrue = true;
      }
      if (used.length > 0 && !isAnyTrue) return false;
    }
    return true;
  }

  getAllUsedRfAll(model: ProtoModel) {
    return this.getAllUsedRf(model, -1);
  }

  mkPob(
    parent: Pob | undefined,
    level: number,
    depth: number,
    post: number,
    binding: readonly number[] = [],
  ) {
    const probe = new Pob(parent, this, level, depth, false);
    probe.setPost(post, binding);
    const existing = this.pobs.get(probe.post);
    if (existing !== undefined)
      for (const pob of existing)
        if (pob.parent === parent && !pob.isInQueue) {
          pob.inherit(probe);
          return pob;
        }
    const pob = new Pob(parent, this, level, depth);
    pob.setPost(post, binding);
    const list = this.pobs.get(pob.post);
    if (list === undefined) this.pobs.set(pob.post, [pob]);
    else list.push(pob);
    return pob;
  }
}

export class SpacerContext {
  readonly spacerManager: SpacerManager;
  readonly normalizer: SpacerNormalizer;
  readonly zkConsts: ZkConsts;
  rels = new Map<number, PredTransformer>();
  queryPred = -1;
  query: PredTransformer | undefined;
  readonly pobQueue: PobQueue;
  lastResult = L_UNDEF;
  inductiveLevel = 0;
  expandedLevel = 0;
  private generalizers: LemmaGeneralizer[] = [];
  readonly isUsingCtp: boolean;
  readonly isUsingGroundPob: boolean;
  readonly isUsingGpdr: boolean;
  private isResettingObligationQueue: boolean;
  private isUsingDerivations: boolean;
  private isUsingPropagate: boolean;
  readonly maxLevel: number;
  readonly isPdrBfs: boolean;

  constructor(
    readonly datalogContext: DatalogContext,
    readonly params: FpParams,
    readonly manager: AstManager,
  ) {
    this.spacerManager = new SpacerManager(manager);
    this.normalizer = new SpacerNormalizer(manager);
    this.zkConsts = new ZkConsts(manager);
    this.pobQueue = new PobQueue(manager);
    this.isUsingCtp = params.getBool("spacer.ctp", true);
    this.isUsingGpdr = params.getBool("spacer.gpdr", false);
    this.isUsingGroundPob = this.isUsingGpdr || params.getBool("spacer.ground_pobs", true);
    this.isResettingObligationQueue =
      !this.isUsingGpdr && params.getBool("spacer.reset_pob_queue", true);
    this.isUsingDerivations = !this.isUsingGpdr && params.getBool("spacer.use_derivations", true);
    this.isUsingPropagate = params.getBool("spacer.propagate", true);
    this.maxLevel = params.getUint("spacer.max_level", 0xffffffff);
    this.isPdrBfs = params.getBool("spacer.gpdr.bfs", true);
    if (params.getBool("spacer.push_pob", false) && !this.isUsingGpdr)
      throw new SmtUnsupportedError("spacer.push_pob");
    if (!params.getBool("spacer.ground_pobs", true) && !this.isUsingGpdr)
      throw new SmtUnsupportedError("spacer with spacer.ground_pobs=false");
    if (params.getUint("spacer.order_children", 0) !== 0)
      throw new SmtUnsupportedError("spacer.order_children");
    if (params.getBool("spacer.global", false) || params.getBool("spacer.q3.use_qgen", false))
      throw new SmtUnsupportedError("the global and quantified spacer generalizers");
  }

  simplify(expr: number) {
    return this.datalogContext.simplify(expr);
  }

  getPredTransformer(decl: number) {
    return this.rels.get(decl) as PredTransformer;
  }

  setQuery(queryPred: number) {
    this.queryPred = queryPred;
  }

  updateRules(rules: RuleSet) {
    const rels = new Map<number, PredTransformer>();
    const manager = this.manager;
    for (const predicate of rules.getHeadPredicates()) {
      const pt = new PredTransformer(this, predicate);
      rels.set(predicate, pt);
      pt.rules.push(...rules.getPredicateRules(predicate));
    }
    for (const rule of rules.rules)
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const predicate = rule.getTailDecl(manager, index);
        if (!rels.has(predicate)) rels.set(predicate, new PredTransformer(this, predicate));
      }
    for (const [predicate, pt] of rels)
      for (const dependency of rules.deps.getDeps(predicate)) {
        const user = rels.get(dependency) as PredTransformer;
        if (!user.uses.includes(pt)) user.uses.push(pt);
      }
    for (const pt of rels.values()) pt.initialize(rels);
    for (const pt of rels.values()) pt.initRfs();
    this.rels = rels;
    this.query = undefined;
    this.lastResult = L_UNDEF;
    this.inductiveLevel = 0;
    this.generalizers = mkLemmaGeneralizers(this);
  }

  solve(fromLevel: number) {
    this.lastResult = this.isUsingGpdr ? gpdrSolveCore(this) : this.solveCore(fromLevel);
    return this.lastResult;
  }

  private solveCore(fromLevel: number) {
    const manager = this.manager;
    this.query = this.rels.get(this.queryPred);
    if (this.query === undefined) return L_FALSE;
    let level = fromLevel;
    const root = this.query.mkPob(undefined, fromLevel, 0, manager.trueExpr);
    this.pobQueue.setRoot(root);
    for (let index = fromLevel; index < this.maxLevel; index++) {
      manager.limit.checkpoint();
      this.expandedLevel = INFTY_LEVEL;
      const reachable = this.checkReachability();
      if (reachable !== L_FALSE) return reachable;
      if (level > 0 && this.isUsingPropagate && this.propagate(this.expandedLevel, level))
        return L_FALSE;
      this.pobQueue.incLevel();
      level = this.pobQueue.maxLevel;
    }
    return L_UNDEF;
  }

  // L_UNDEF when spacer gives up, where Z3 throws unknown_exception.
  private checkReachability() {
    const queue = this.pobQueue;
    let lastReachable: Pob | undefined;
    const newPobs: Pob[] = [];
    if (this.isResettingObligationQueue) queue.reset();
    while (queue.top() !== undefined) {
      this.manager.limit.checkpoint();
      while (lastReachable !== undefined) {
        const node: Pob = lastReachable;
        lastReachable = undefined;
        if (queue.isRoot(node)) return L_TRUE;
        const parent = node.parent as Pob;
        if (this.isReachablePob(parent)) {
          lastReachable = parent;
          parent.close();
        } else if (!parent.isClosed()) parent.weakness++;
      }
      while ((queue.top() as Pob).isClosed()) {
        const closed = queue.top() as Pob;
        queue.pop();
        if (queue.isRoot(closed)) return L_TRUE;
      }
      const node = queue.top() as Pob;
      queue.pop();
      switch (this.expandPob(node, newPobs)) {
        case L_TRUE:
          node.close();
          lastReachable = node;
          if (queue.isRoot(node)) return L_TRUE;
          break;
        case L_FALSE:
          if (queue.isRoot(node)) return L_FALSE;
          break;
        case L_GAVE_UP:
          return L_UNDEF;
        default:
          for (const pob of newPobs) queue.push(pob);
      }
      newPobs.length = 0;
    }
    throw new SmtTacticError("spacer ran out of proof obligations");
  }

  private isReachablePob(pob: Pob): boolean {
    const saved = pob.level;
    pob.level = INFTY_LEVEL;
    const reach = pob.pt.isReachable(pob, undefined, true);
    pob.level = saved;
    if (reach.result !== L_TRUE || !reach.isConcrete) return false;
    if (reach.rule !== undefined && reach.rule.uninterpretedSize > 0)
      pob.pt.addRf(pob.pt.mkRf(pob, reach.model as ProtoModel, reach.rule));
    const derivation = pob.derivation;
    pob.derivation = undefined;
    pob.close();
    const next = derivation?.createNextChild();
    if (next !== undefined) {
      next.derivation = derivation;
      if (this.pobQueue.top() === pob) this.pobQueue.pop();
      this.pobQueue.push(next);
    }
    return next !== undefined ? this.isReachablePob(next) : true;
  }

  private isMdlRfConsistent(model: ProtoModel) {
    for (const pt of this.rels.values()) {
      let isAnyTrue = false;
      const used = pt.getAllUsedRfAll(model);
      for (const reachFact of used) {
        if (!isTrueIn(model, reachFact.fact))
          model.registerConst(this.manager.decls[reachFact.tag], this.manager.trueExpr);
        else isAnyTrue = true;
      }
      if (used.length > 0 && !isAnyTrue) return false;
    }
    return true;
  }

  private handleUnknown(pob: Pob, rule: Rule | undefined, model: ProtoModel) {
    if (rule === undefined)
      return isTrueIn(model, pob.post) && this.isMdlRfConsistent(model) ? L_TRUE : L_UNDEF;
    return isTrueIn(model, pob.pt.getTransition(rule)) &&
      isTrueIn(model, pob.post) &&
      rule.uninterpretedSize === 0 &&
      pob.pt.isMdlRfConsistent(rule, model)
      ? L_TRUE
      : L_UNDEF;
  }

  expandPob(pob: Pob, out: Pob[]): number {
    const cube: number[] = [];
    const reach = pob.pt.isReachable(pob, cube, true);
    let result = reach.result;
    if (result === L_UNDEF && reach.model !== undefined)
      result = this.handleUnknown(pob, reach.rule, reach.model);
    this.manager.limit.checkpoint();
    switch (result) {
      case L_TRUE: {
        const model = reach.model as ProtoModel;
        if (reach.isConcrete) {
          const isRoot = this.pobQueue.isRoot(pob);
          if (reach.rule !== undefined && (reach.rule.uninterpretedSize > 0 || isRoot))
            pob.pt.addRf(pob.pt.mkRf(pob, model, reach.rule), isRoot);
          const derivation = pob.derivation;
          pob.derivation = undefined;
          pob.close();
          const next = derivation?.createNextChild();
          if (next !== undefined) {
            next.derivation = derivation;
            out.push(next);
          }
          return next !== undefined ? L_UNDEF : L_TRUE;
        }
        if (this.createChildren(pob, reach.rule as Rule, model, reach.reachPredUsed, out)) {
          out.push(pob);
          return L_UNDEF;
        }
        if (pob.weakness < 10) {
          pob.weakness++;
          return this.expandPob(pob, out);
        }
        return L_GAVE_UP;
      }
      case L_FALSE: {
        if (pob.level < this.expandedLevel) this.expandedLevel = pob.level;
        const lemma = Lemma.fromCube(this, pob, cube, reach.usesLevel);
        for (const generalizer of this.generalizers) {
          if (!pob.isUsingFarkas || lemma.isFalse()) break;
          this.manager.limit.checkpoint();
          generalizer(lemma);
        }
        pob.pt.addLemma(lemma);
        pob.incLevel();
        out.push(pob);
        return L_FALSE;
      }
      default: {
        if (pob.weakness < 10) {
          if (reach.rule !== undefined && reach.rule.uninterpretedSize > 0) {
            const reachPredUsed = reach.reachPredUsed.map(() => false);
            if (
              this.createChildren(pob, reach.rule, reach.model as ProtoModel, reachPredUsed, out)
            ) {
              out.push(pob);
              return L_UNDEF;
            }
          }
          pob.weakness++;
          return this.expandPob(pob, out);
        }
        return L_GAVE_UP;
      }
    }
  }

  propagate(minLevel: number, maxLevel: number) {
    if (minLevel === INFTY_LEVEL) return false;
    for (let level = minLevel; ; level++) {
      this.manager.limit.checkpoint();
      let isAllPropagated = true;
      for (const pt of this.rels.values())
        isAllPropagated = pt.propagateToNextLevel(level) && isAllPropagated;
      if (!isAllPropagated) continue;
      for (const pt of this.rels.values()) pt.propagateToInfinity(level);
      if (level <= maxLevel) {
        this.inductiveLevel = level;
        return true;
      }
      return false;
    }
  }

  createChildren(
    pob: Pob,
    rule: Rule,
    model: ProtoModel,
    reachPredUsed: readonly boolean[],
    out: Pob[],
  ) {
    const manager = this.manager;
    const spacer = this.spacerManager;
    const pt = pob.pt;
    const predicates = pt.getPredecessors(rule);
    let phi = mkAndOf(manager, computeImplicantLiterals(model, [pt.getTransition(rule), pob.post]));
    const vars = [
      ...pt.sig.map((decl) => spacer.constOf(spacer.o2n(decl))),
      ...pt.getAuxVars(rule),
    ];
    phi = pt.mbp(vars, phi, model, this.isUsingGroundPob);
    if (this.isUsingGpdr && predicates.length > 1) return gpdrCreateSplitChildren();
    const derivation = new Derivation(pob, rule, phi, vars);
    for (let index = 0; index < predicates.length; index++) {
      const premisePt = this.getPredTransformer(predicates[index]);
      const summary = premisePt.getOriginSummary(
        model,
        prevLevel(pob.level),
        index,
        reachPredUsed[index],
      );
      if (summary === undefined) return false;
      derivation.addPremise(
        premisePt,
        index,
        summary.summary,
        reachPredUsed[index],
        summary.auxVars,
      );
    }
    const kid = derivation.createFirstChild(model);
    if (kid === undefined) return false;
    kid.derivation = derivation;
    if (!this.isUsingDerivations) kid.derivation = undefined;
    if (
      this.params.getBool("spacer.weak_abs", true) &&
      !this.isUsingGpdr &&
      (!isTrueIn(model, pt.getTransition(rule)) || !isTrueIn(model, pob.post))
    )
      kid.derivation = undefined;
    out.push(kid);
    return true;
  }
}
