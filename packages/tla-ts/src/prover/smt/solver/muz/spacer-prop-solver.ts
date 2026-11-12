// Ported from Z3 (src/muz/spacer/spacer_prop_solver.cpp, src/muz/spacer/spacer_iuc_solver.cpp),
// MIT license, see z3-license.txt. Cores are subset cores: the port has no proofs to interpolate.
import { type AstManager, KIND_APP, SORT_BOOL } from "../ast";
import { flattenAndVector } from "../ast-util";
import { L_FALSE, L_TRUE } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { RandomGen } from "../random-gen";
import { RefVector } from "../ref-vector";
import { SmtKernel } from "../smt-kernel";
import type { SpacerManager } from "./spacer-manager";
import { INFTY_LEVEL, isInftyLevel, isFalseIn, pin } from "./spacer-util";

class DefManager {
  readonly expr2proxy = new Map<number, number>();
  readonly proxy2def = new Map<number, number>();
}

const isUninterpretedConst = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.isUninterpretedConst(expr);

// A solver of the pool, with Z3's iuc_solver around it: the assumptions that are not literals of
// constants become proxy constants, and the background assumptions come first.
export class IucSolver {
  private kernel: SmtKernel;
  private proxies: number[] = [];
  private numProxies = 0;
  private defs: DefManager[] = [];
  private baseDefs = new DefManager();
  private assumptions: number[] = [];
  private firstAssumption = 0;
  private isProxied = false;
  private lastModel: ProtoModel | undefined;
  private lastCore: number[] = [];

  constructor(
    private manager: AstManager,
    private spacerManager: SpacerManager,
  ) {
    this.kernel = new SmtKernel(manager, { isMbqi: true, isFindingMacros: false });
  }

  assertExpr(expr: number) {
    this.kernel.assertExpr(pin(this.manager, expr));
  }

  push() {
    this.defs.push(new DefManager());
    this.kernel.push();
  }

  pop(numScopes: number) {
    this.kernel.pop(numScopes);
    for (let index = 0; index < numScopes; index++) {
      this.numProxies -= (this.defs.pop() as DefManager).proxy2def.size;
    }
  }

  private freshProxy() {
    if (this.numProxies === this.proxies.length)
      this.proxies.push(
        this.spacerManager.mkConst(`spacer_proxy!${this.proxies.length}`, SORT_BOOL),
      );
    return this.proxies[this.numProxies++];
  }

  private mkProxy(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.getArg(expr, 0) : expr;
    if (isUninterpretedConst(manager, atom)) return expr;
    const defs = this.defs.length > 0 ? this.defs[this.defs.length - 1] : this.baseDefs;
    const existing = defs.expr2proxy.get(expr);
    if (existing !== undefined) return existing;
    const proxy = this.freshProxy();
    const def = pin(manager, manager.mkOr([manager.mkNot(proxy), expr]));
    defs.expr2proxy.set(expr, proxy);
    defs.proxy2def.set(proxy, def);
    this.assertExpr(def);
    return proxy;
  }

  mkProxies(exprs: number[], from = 0) {
    let isDirty = false;
    for (let index = from; index < exprs.length; index++) {
      const proxy = this.mkProxy(exprs[index]);
      if (proxy !== exprs[index]) isDirty = true;
      exprs[index] = proxy;
    }
    return isDirty;
  }

  private getProxyDef(expr: number) {
    if (!isUninterpretedConst(this.manager, expr)) return undefined;
    for (let index = this.defs.length - 1; index >= 0; index--) {
      const def = this.defs[index].proxy2def.get(expr);
      if (def !== undefined) return def;
    }
    return this.baseDefs.proxy2def.get(expr);
  }

  pushBg(expr: number) {
    this.assumptions.length = this.firstAssumption;
    this.assumptions.push(expr);
    this.firstAssumption = this.assumptions.length;
  }

  popBg(count: number) {
    if (count === 0) return;
    this.assumptions.length = this.firstAssumption;
    this.firstAssumption = this.firstAssumption > count ? this.firstAssumption - count : 0;
    this.assumptions.length = this.firstAssumption;
  }

  getNumBg() {
    return this.firstAssumption;
  }

  private run(clauses: readonly (readonly number[])[]) {
    const kernel = this.kernel;
    if (clauses.length > 0) {
      kernel.push();
      for (const clause of clauses)
        kernel.assertExpr(pin(this.manager, this.manager.mkOr([...clause])));
    }
    const result = kernel.check(this.assumptions);
    this.lastModel = undefined;
    if (result === L_TRUE) {
      this.lastModel = kernel.context.getModel();
      this.lastModel.incRef();
    }
    this.lastCore = result === L_FALSE ? [...kernel.context.unsatCore] : [];
    if (clauses.length > 0) kernel.pop(1);
    return result;
  }

  checkSatCc(cube: readonly number[], clauses: readonly (readonly number[])[]) {
    this.assumptions.length = this.firstAssumption;
    this.mkProxies(this.assumptions);
    this.firstAssumption = this.assumptions.length;
    this.assumptions.push(...cube);
    this.isProxied = this.mkProxies(this.assumptions, this.firstAssumption);
    return this.run(clauses);
  }

  checkSat(cube: readonly number[]) {
    return this.checkSatCc(cube, []);
  }

  getModel() {
    return this.lastModel as ProtoModel;
  }

  getFullUnsatCore() {
    return [...this.lastCore];
  }

  getUnsatCore() {
    const background = new Set(this.assumptions.slice(0, this.firstAssumption));
    const core: number[] = [];
    for (const expr of this.lastCore) {
      if (background.has(expr)) continue;
      const def = this.isProxied ? this.getProxyDef(expr) : undefined;
      core.push(def === undefined ? expr : this.manager.getArg(def, 1));
    }
    return core;
  }

  undoProxies(exprs: number[]) {
    for (let index = 0; index < exprs.length; index++) {
      const def = this.getProxyDef(exprs[index]);
      if (def !== undefined) exprs[index] = this.manager.getArg(def, 1);
    }
  }
}

export class PropSolver {
  private context: IucSolver;
  private levelPreds: number[] = [];
  private posLevelAtoms: number[] = [];
  private negLevelAtoms: number[] = [];
  private levelAtoms = new Set<number>();
  private random: RandomGen;
  core: number[] | undefined;
  model: { value: ProtoModel | undefined } | undefined;
  isSubsetBasedCore = false;
  usesLevel = INFTY_LEVEL;
  isDeltaLevel = false;
  isInLevel = false;
  currentLevel = 0;

  constructor(
    private manager: AstManager,
    spacerManager: SpacerManager,
    private name: string,
    randomSeed: number,
  ) {
    this.context = new IucSolver(manager, spacerManager);
    this.random = new RandomGen(randomSeed);
  }

  addLevel() {
    const manager = this.manager;
    const decl = manager.mkFreshFuncDecl(
      `${this.name}#level_${this.levelPreds.length}`,
      [],
      SORT_BOOL,
    );
    manager.incDeclRef(decl);
    this.levelPreds.push(decl);
    const positive = pin(manager, manager.mkApp(decl, [], SORT_BOOL));
    const negative = pin(manager, manager.mkNot(positive));
    this.posLevelAtoms.push(positive);
    this.negLevelAtoms.push(negative);
    this.levelAtoms.add(positive);
    this.levelAtoms.add(negative);
  }

  ensureLevel(level: number) {
    if (isInftyLevel(level)) return;
    while (level >= this.levelPreds.length) this.addLevel();
  }

  private assertLevelAtoms(level: number) {
    for (let index = 0; index < this.levelPreds.length; index++) {
      const isActive = this.isDeltaLevel ? index === level : index >= level;
      this.context.pushBg(isActive ? this.negLevelAtoms[index] : this.posLevelAtoms[index]);
    }
  }

  assertExpr(form: number, level = INFTY_LEVEL) {
    if (isInftyLevel(level)) {
      this.context.assertExpr(form);
      return;
    }
    this.ensureLevel(level);
    this.context.assertExpr(this.manager.mkOr([form, this.posLevelAtoms[level]]));
  }

  // prop_solver::maxsmt: the soft literals in the core are dropped one at a time.
  private maxsmt(hard: number[], soft: number[], clauses: readonly (readonly number[])[]) {
    const context = this.context;
    context.mkProxies(hard);
    const hardSize = hard.length;
    hard.push(...soft);
    let result = context.checkSatCc(hard, clauses);
    if (result !== L_FALSE || soft.length === 0) {
      hard.length = hardSize;
      return result;
    }
    soft.length = 0;
    let core = context.getUnsatCore();
    while (hard.length > hardSize) {
      const index = hard.findIndex((expr, position) => position >= hardSize && core.includes(expr));
      if (index === -1) {
        hard.length = hardSize;
        return L_FALSE;
      }
      hard[index] = hard[hard.length - 1];
      hard.pop();
      result = context.checkSatCc(hard, clauses);
      if (result !== L_FALSE) break;
      core = context.getUnsatCore();
    }
    if (result === L_TRUE) soft.push(...hard.slice(hardSize));
    hard.length = hardSize;
    return result;
  }

  private internalCheckAssumptions(
    hard: number[],
    soft: number[],
    clauses: readonly (readonly number[])[],
  ) {
    const context = this.context;
    if (this.isInLevel) this.assertLevelAtoms(this.currentLevel);
    const result = this.maxsmt(hard, soft, clauses);
    if (result !== L_FALSE && this.model !== undefined) this.model.value = context.getModel();
    if (result === L_FALSE) {
      this.usesLevel = INFTY_LEVEL;
      for (const expr of context.getFullUnsatCore()) {
        if (!this.levelAtoms.has(expr)) continue;
        const size = Math.min(this.usesLevel, this.negLevelAtoms.length);
        for (let index = 0; index < size; index++)
          if (this.negLevelAtoms[index] === expr) {
            this.usesLevel = index;
            break;
          }
      }
      if (this.core !== undefined) {
        const core = context.getUnsatCore();
        context.undoProxies(core);
        this.core.length = 0;
        this.core.push(...core);
      }
    }
    return result;
  }

  checkAssumptions(
    hardAtoms: readonly number[],
    soft: number[],
    clause: readonly number[],
    background: readonly number[],
  ) {
    const manager = this.manager;
    const flat = new RefVector(manager);
    for (const atom of hardAtoms) flat.push(atom);
    flattenAndVector(manager, flat);
    const hard = flat.items.map((atom) => pin(manager, atom));
    flat.reset();
    for (let size = hard.length; size > 1;) {
      const other = this.random.next() % size;
      size--;
      [hard[size], hard[other]] = [hard[other], hard[size]];
    }
    const context = this.context;
    const numBg = context.getNumBg();
    for (const expr of background) context.pushBg(expr);
    const result = this.internalCheckAssumptions(hard, soft, clause.length === 0 ? [] : [clause]);
    if (context.getNumBg() > numBg) context.popBg(context.getNumBg() - numBg);
    this.core = undefined;
    this.model = undefined;
    this.isSubsetBasedCore = false;
    return result;
  }

  withLevel<T>(level: number, body: () => T) {
    const saved = this.isInLevel;
    this.isInLevel = true;
    this.currentLevel = level;
    const result = body();
    this.isInLevel = saved;
    return result;
  }

  isFalseInModel(expr: number) {
    const model = this.model?.value;
    return model !== undefined && isFalseIn(model, expr);
  }
}
