// Ported from Z3 (src/tactic/arith/eq2bv_tactic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_EQ,
  OP_GE,
  OP_LE,
  OP_ULEQ,
  SORT_INT,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import type { Goal } from "./goal";
import { FuncInterp, ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

const UNSIGNED_LIMIT = Rational.of(2n ** 32n);

const isUnsigned = (value: Rational) =>
  value.isInt() && !value.isNegative() && value.compare(UNSIGNED_LIMIT) < 0;

const getNumBits = (value: Rational) => value.num.toString(2).length;

class EqRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private fd: Map<number, number>,
  ) {
    super(manager);
  }

  override isRewritingPatterns() {
    return false;
  }

  private getFd(variable: number, other: number) {
    const manager = this.manager;
    const bv = this.fd.get(variable);
    if (bv === undefined || !manager.isNumeral(other)) return -1;
    const width = manager.getBvSize(manager.sorts[bv]);
    return manager.mkEq(bv, manager.mkBvNumeral(manager.getRationalValue(other).num, width));
  }

  override reduceApp(decl: number, args: number[]) {
    if (decl !== OP_EQ) return -1;
    const first = this.getFd(args[0], args[1]);
    const result = first === -1 ? this.getFd(args[1], args[0]) : first;
    if (result !== -1) this.manager.incRef(result);
    return result;
  }
}

interface BvModelConverter {
  bvToInt: Map<number, number>;
  vars: number[];
  values: Rational[];
}

const convertModel = (manager: AstManager, converter: BvModelConverter, source: ProtoModel) => {
  const target = new ProtoModel(manager).mkModel();
  for (const entry of source.funcInterps) {
    const copied = new FuncInterp(manager, entry[1].arity);
    for (const funcEntry of entry[1].entries)
      copied.insertNewEntry(funcEntry.args, funcEntry.result);
    if (entry[1].elseExpr !== null) copied.setElse(entry[1].elseExpr);
    target.registerFunc(entry[0], copied);
  }
  for (const sort of source.getUninterpretedSorts())
    for (const value of source.getKnownUniverse(sort)) target.registerValue(value);
  for (const decl of source.getConstDecls()) {
    const value = source.constInterps.get(decl) as number;
    const original = converter.bvToInt.get(decl);
    if (original !== undefined && manager.isBvNumeral(value))
      target.registerConst(original, manager.mkNumeral(manager.getBvNumeralValue(value)));
    else target.registerConst(decl, value);
  }
  for (const [index, decl] of converter.vars.entries())
    target.registerConst(
      decl,
      manager.mkNumeralOfSort(converter.values[index], manager.funcDecls[decl].range),
    );
  return target;
};

export const createEq2BvTactic = (manager: AstManager) => (goal: Goal) => {
  const bounds = new BoundManager(manager);
  const trail = new RefVector(manager);
  const fd = new Map<number, number>();
  const max = new Map<number, Rational>();
  const nonFd = new Set<number>();
  const hasEq = new Set<number>();
  const converter: BvModelConverter = { bvToInt: new Map(), vars: [], values: [] };
  for (const form of goal.forms.items) bounds.add(form);
  if (bounds.isInconsistent() || goal.isProofsEnabled) {
    goal.depth++;
    return [goal];
  }
  const isVarConstPair = (expr: number, constant: number) =>
    manager.isUninterpretedConst(expr) &&
    manager.isNumeral(constant) &&
    isUnsigned(manager.getRationalValue(constant)) &&
    !nonFd.has(expr);
  // is_bound: a lower bound c <= x, then an upper bound x <= c, gives x.
  const getBoundVar = (form: number) => {
    const op = manager.getOp(form);
    if ((op !== OP_LE && op !== OP_GE) || manager.getNumArgs(form) !== 2) return -1;
    const small = manager.getArg(form, op === OP_LE ? 0 : 1);
    const large = manager.getArg(form, op === OP_LE ? 1 : 0);
    if (isVarConstPair(large, small)) return large;
    return isVarConstPair(small, large) ? small : -1;
  };
  const isFd = (variable: number, constant: number) => {
    if (
      !manager.isUninterpretedConst(variable) ||
      !manager.isNumeral(constant) ||
      nonFd.has(variable) ||
      manager.sorts[variable] !== SORT_INT
    )
      return false;
    const value = manager.getRationalValue(constant);
    if (!isUnsigned(value)) return false;
    const previous = max.get(variable);
    if (previous === undefined || previous.compare(value) < 0) max.set(variable, value);
    return true;
  };
  const collectFd = (root: number) => {
    trail.push(root);
    if (getBoundVar(root) !== -1) return;
    const todo = [root];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (nonFd.has(expr)) continue;
      nonFd.add(expr);
      if (manager.kinds[expr] === KIND_QUANTIFIER) {
        todo.push(manager.getQuantifier(expr).body);
        continue;
      }
      if (manager.kinds[expr] !== KIND_APP) continue;
      if (manager.getOp(expr) === OP_EQ) {
        const first = manager.getArg(expr, 0);
        const second = manager.getArg(expr, 1);
        for (const side of [first, second]) if (manager.isUninterpretedConst(side)) hasEq.add(side);
        if (isFd(first, second) || isFd(second, first)) continue;
      }
      manager.pushArgs(expr, todo);
    }
  };
  for (const form of goal.forms.items) collectFd(form);
  for (const variable of max.keys()) if (nonFd.has(variable)) max.delete(variable);
  for (const [variable, maximum] of max) {
    const upper = bounds.uppers.get(variable);
    const lower = bounds.lowers.get(variable);
    const atLeast = (value: Rational, bound: Rational | undefined) =>
      bound !== undefined && bound.compare(value) > 0 ? bound : value;
    const value = atLeast(
      upper === undefined ? maximum.add(Rational.one) : atLeast(maximum, upper.value),
      lower?.value,
    ).add(Rational.one);
    const bits = Math.max(getNumBits(value), 2);
    const fresh = manager.mkFreshConst("z", manager.mkBvSort(bits));
    trail.push(fresh);
    fd.set(variable, fresh);
    converter.bvToInt.set(manager.decls[fresh], manager.decls[variable]);
  }
  if (max.size === 0) {
    trail.reset();
    return [goal];
  }
  const rewriter = new EqRewriter(manager, fd);
  for (let index = 0; !goal.isInconsistent && index < goal.forms.size; index++) {
    const form = goal.forms.items[index];
    const variable = getBoundVar(form);
    if (variable !== -1 && !hasEq.has(variable)) {
      const upper = bounds.uppers.get(variable);
      const lower = bounds.lowers.get(variable);
      const value =
        upper !== undefined && !upper.isStrict && isUnsigned(upper.value)
          ? upper.value
          : lower !== undefined && !lower.isStrict && isUnsigned(lower.value)
            ? lower.value
            : undefined;
      if (value !== undefined) {
        converter.vars.push(manager.decls[variable]);
        converter.values.push(value);
        goal.update(index, manager.trueExpr);
        continue;
      }
    }
    if (variable !== -1 && max.has(variable)) {
      goal.update(index, manager.trueExpr);
      continue;
    }
    const rewritten = rewriter.rewrite(form);
    if (rewritten !== form) goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  rewriter.release();
  for (const variable of max.keys()) {
    const bv = fd.get(variable) as number;
    const width = manager.getBvSize(manager.sorts[bv]);
    const lower = bounds.lowers.get(variable);
    const upper = bounds.uppers.get(variable);
    if (lower !== undefined && !lower.value.isNegative())
      goal.assert(mkBvApp(manager, OP_ULEQ, [manager.mkBvNumeral(lower.value.num, width), bv]));
    if (upper !== undefined && !upper.value.isNegative())
      goal.assert(mkBvApp(manager, OP_ULEQ, [bv, manager.mkBvNumeral(upper.value.num, width)]));
  }
  for (const decl of converter.vars) manager.incDeclRef(decl);
  for (const entry of converter.bvToInt) {
    manager.incDeclRef(entry[0]);
    manager.incDeclRef(entry[1]);
  }
  trail.reset();
  goal.depth++;
  goal.addModelConversion((model) => convertModel(manager, converter, model));
  return [goal];
};
