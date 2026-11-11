// Ported from Z3 (src/tactic/arith/nla2bv_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_BSHL,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UBV2INT,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { Bv2IntContext, Bv2IntRewriter } from "./bv2int-rewriter";
import { Bv2RealRewriter, Bv2RealUtil } from "./bv2real-rewriter";
import { type Definition, type Goal, UNDER } from "./goal";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { SubstReplacer } from "./solve-eqs";

export interface Nla2BvOptions {
  maxBvSize: number;
  bvSize: number;
  root: number;
  divisor: number;
}

const ARITH_OPS = [OP_MUL, OP_ADD, OP_SUB, OP_LE, OP_LT, OP_GE, OP_GT, OP_NUM, OP_UMINUS];

const getLog2 = (value: bigint) => {
  let power = 1n;
  let size = 0;
  while (power < value) {
    size++;
    power *= 2n;
  }
  return size === 0 ? 1 : size;
};

class Nla2Bv {
  private isSatPreserving = true;
  private bounds: BoundManager;
  private bv2int: Bv2IntContext;
  private bv2real: Bv2RealUtil;
  private substitution: ObjMap<number>;
  private trail: RefVector;
  private defs: RefVector;
  private vars: number[] = [];
  private hidden: number[] = [];
  private numBits: number;

  constructor(
    private manager: AstManager,
    private goal: Goal,
    options: Nla2BvOptions,
  ) {
    this.bv2real = new Bv2RealUtil(
      manager,
      BigInt(options.root),
      BigInt(options.divisor),
      options.maxBvSize,
    );
    this.bv2int = new Bv2IntContext(manager, options.maxBvSize);
    this.bounds = new BoundManager(manager);
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    this.trail = new RefVector(manager);
    this.defs = new RefVector(manager);
    this.numBits = options.bvSize;
  }

  run() {
    const manager = this.manager;
    const goal = this.goal;
    for (const form of goal.forms.items) this.bounds.add(form);
    this.collectPower2();
    const collected = this.collectVars();
    if (collected === "not-supported")
      throw new SmtTacticError("goal is not in the fragment supported by nla2bv");
    if (collected === "bool") return;
    this.substituteVars();
    this.reduce(new Bv2IntRewriter(manager, this.bv2int), false);
    this.assertSideConditions(this.bv2int.sideConditions);
    this.reduce(new Bv2RealRewriter(manager, this.bv2real), true);
    this.assertSideConditions(this.bv2real.sideConditions);
    const definitions: Definition[] = [
      ...this.hidden.map((decl) => ({ decl, def: -1 })),
      ...this.vars.map((decl, index) => ({ decl, def: this.defs.items[index] })),
      ...this.bv2real.decls.map((decl) => ({ decl, def: -1 })),
    ];
    goal.addDefinitions(definitions);
    goal.depth++;
    if (!this.isSatPreserving) goal.updatePrecision(UNDER);
  }

  private collectPower2() {
    const manager = this.manager;
    this.bv2int.collectPower2(this.goal);
    const power2 = this.bv2int.power2;
    if (power2.size === 0) return;
    for (const [key, value] of power2) {
      const size = manager.getBvSize(manager.sorts[value]);
      const shifted = mkBvApp(manager, OP_UBV2INT, [
        mkBvApp(manager, OP_BSHL, [manager.mkBvNumeral(1n, size), value]),
      ]);
      this.trail.push(shifted);
      this.substitution.set(key, shifted);
    }
    this.substituteVars();
    this.substitution.clear();
  }

  private reduce(rewriter: Bv2IntRewriter | Bv2RealRewriter, isReal: boolean) {
    const manager = this.manager;
    const goal = this.goal;
    for (let index = 0; index < goal.forms.size; index++) {
      const result = rewriter.rewrite(goal.forms.items[index]);
      if (isReal && this.bv2real.containsBv2Real(result)) {
        manager.decRef(result);
        rewriter.release();
        throw new SmtTacticError("nla2bv could not eliminate reals");
      }
      goal.update(index, result);
      manager.decRef(result);
    }
    rewriter.release();
  }

  private assertSideConditions(conditions: RefVector) {
    for (const condition of conditions.items) {
      this.goal.assert(condition);
      this.isSatPreserving = false;
    }
  }

  private substituteVars() {
    const manager = this.manager;
    const goal = this.goal;
    const replacer = new SubstReplacer(manager, this.substitution);
    for (let index = 0; index < goal.forms.size; index++) {
      const result = replacer.rewrite(goal.forms.items[index]);
      goal.update(index, result);
      manager.decRef(result);
    }
    replacer.release();
  }

  private collectVars() {
    const manager = this.manager;
    const vars: number[] = [];
    let isNoArith = true;
    let isSupported = true;
    const visit = (expr: number) => {
      if (manager.kinds[expr] !== KIND_APP) {
        isSupported = false;
        return;
      }
      const sort = manager.sorts[expr];
      if (manager.isUninterpretedConst(expr)) {
        if (sort === SORT_INT || sort === SORT_REAL) vars.push(expr);
        else if (sort !== SORT_BOOL) isSupported = false;
      } else if (ARITH_OPS.includes(manager.getOp(expr))) isNoArith = false;
      else if (manager.getFamily(expr) !== FAMILY_BASIC) isSupported = false;
      const value = manager.getNumeral(expr);
      if (value === undefined) return;
      const log2 = getLog2(value < 0n ? -value : value);
      if (this.numBits <= log2) this.numBits = log2 + 1;
    };
    const visited = new Set<number>();
    for (const form of this.goal.forms.items) {
      if (visited.has(form)) continue;
      visited.add(form);
      const exprs = [form];
      const children = [this.getChildren(form)];
      const nextChildren = [0];
      while (exprs.length > 0) {
        const top = exprs.length - 1;
        const child = children[top][nextChildren[top]++];
        if (child === undefined) {
          visit(exprs.pop() as number);
          children.pop();
          nextChildren.pop();
          continue;
        }
        if (visited.has(child)) continue;
        visited.add(child);
        exprs.push(child);
        children.push(this.getChildren(child));
        nextChildren.push(0);
      }
    }
    for (const variable of vars) {
      if (manager.sorts[variable] === SORT_INT) this.addIntVar(variable);
      else this.addRealVar(variable);
    }
    if (!isSupported) return "not-supported";
    return vars.length === 0 && isNoArith ? "bool" : "num";
  }

  private getChildren(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] === KIND_APP) return manager.getArgs(expr);
    if (manager.kinds[expr] === KIND_VAR) return [];
    const data = manager.getQuantifier(expr);
    return [data.body, ...data.patterns, ...data.noPatterns];
  }

  private hide(expr: number) {
    const decl = this.manager.decls[expr];
    this.hidden.push(decl);
    return expr;
  }

  private addVar(variable: number, def: number, substitute: number) {
    this.trail.push(substitute);
    this.substitution.set(variable, substitute);
    this.vars.push(this.manager.decls[variable]);
    this.defs.push(def);
  }

  private addIntVar(variable: number) {
    const manager = this.manager;
    const lower = this.bounds.lowers.get(variable)?.value;
    const upper = this.bounds.uppers.get(variable)?.value;
    let numBits = this.numBits;
    if (lower !== undefined && upper !== undefined)
      numBits = getLog2(upper.sub(lower).abs().add(Rational.one).num);
    else this.isSatPreserving = false;
    const fresh = this.hide(
      manager.mkFreshConst(manager.getDeclName(variable), manager.mkBvSort(numBits)),
    );
    const value = mkBvApp(manager, OP_UBV2INT, [fresh]);
    const substitute =
      lower !== undefined
        ? lower.isZero()
          ? value
          : manager.mkApp(OP_ADD, [value, manager.mkNumeral(lower.num)], SORT_INT)
        : upper !== undefined
          ? manager.mkApp(OP_SUB, [manager.mkNumeral(upper.num), value], SORT_INT)
          : manager.mkApp(OP_SUB, [value, manager.mkNumeral(2n ** BigInt(numBits - 1))], SORT_INT);
    this.addVar(variable, substitute, substitute);
  }

  private addRealVar(variable: number) {
    const manager = this.manager;
    const sort = manager.mkBvSort(this.numBits);
    this.isSatPreserving = false;
    const name = manager.getDeclName(variable);
    const s = this.hide(manager.mkFreshConst(name, sort));
    const t = this.hide(manager.mkFreshConst(`${name}_r`, sort));
    const bv2real = this.bv2real;
    const substitute = bv2real.mkBv2RealC(s, t, bv2real.defaultDivisor, bv2real.defaultRoot);
    const def = bv2real.mkBv2RealReduced(s, t, bv2real.defaultDivisor, bv2real.defaultRoot);
    this.addVar(variable, def, substitute);
  }

  release() {
    this.trail.reset();
    this.defs.reset();
    this.bv2int.release();
    this.bv2real.release();
  }
}

export const nla2bv = (manager: AstManager, goal: Goal, options: Nla2BvOptions) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("nla2bv does not support proof production");
  if (goal.isCoresEnabled)
    throw new SmtTacticError("nla2bv does not support unsat core production");
  const converter = new Nla2Bv(manager, goal, options);
  try {
    converter.run();
  } finally {
    converter.release();
  }
};
