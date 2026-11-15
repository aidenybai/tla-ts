// Ported from Z3 (src/muz/spacer/spacer_util.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  isArithSort,
  KIND_APP,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_LT,
  OP_NOT,
  OP_OR,
  OP_XOR,
  FAMILY_BASIC,
  SORT_BOOL,
} from "../ast";
import { compareAsts } from "../ast-lt";
import { flattenAndVector } from "../ast-util";
import { pickEquality, MbpContext } from "../mbp/mbp-plugin";
import type { ProtoModel } from "../proto-model";
import { Mbproj } from "../qe-mbp";
import { RefVector } from "../ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../rewriter";

export const INFTY_LEVEL = 0xffffffff;

export const isInftyLevel = (level: number) => level >= 65535;

export const nextLevel = (level: number) => (isInftyLevel(level) ? level : level + 1);

export const prevLevel = (level: number) =>
  isInftyLevel(level) ? INFTY_LEVEL : level === 0 ? 0 : level - 1;

// Spacer keeps the expressions it makes alive until it is done.
export const pin = (manager: AstManager, expr: number) => {
  manager.incRef(expr);
  return expr;
};

export const mkAndOf = (manager: AstManager, exprs: readonly number[]) =>
  pin(manager, manager.mkAnd([...exprs]));

export const mkOrOf = (manager: AstManager, exprs: readonly number[]) =>
  pin(manager, manager.mkOr([...exprs]));

export const flattenAnd = (manager: AstManager, exprs: readonly number[]) => {
  const conjs = new RefVector(manager);
  for (const expr of exprs) conjs.push(expr);
  flattenAndVector(manager, conjs);
  const result = conjs.items.map((conj) => pin(manager, conj));
  conjs.reset();
  return result;
};

export const sortByAstLt = (manager: AstManager, exprs: number[]) =>
  exprs.sort((first, second) => compareAsts(manager, first, second));

export const isTrueIn = (model: ProtoModel, expr: number) =>
  model.manager.isTrue(model.eval(pin(model.manager, expr), false));

export const isFalseIn = (model: ProtoModel, expr: number) =>
  model.manager.isFalse(model.eval(pin(model.manager, expr), false));

export class SpacerNormalizer {
  private rewriter: Rewriter;

  constructor(private manager: AstManager) {
    this.rewriter = new Rewriter(manager, {
      ...TACTIC_REWRITER_OPTIONS,
      arith: {
        ...TACTIC_REWRITER_OPTIONS.arith,
        isSortSums: true,
        isGcdRounding: true,
        isArithIneqLhs: true,
        isSom: true,
        isFlat: true,
        isHoistMul: false,
      },
    });
  }

  normalize(expr: number, isSimplifyingBounds = true) {
    const manager = this.manager;
    const result = this.rewriter.rewrite(pin(manager, expr));
    if (manager.getOp(result) !== OP_AND) return result;
    const conjs = flattenAnd(manager, [result]);
    if (conjs.length <= 1) return result;
    if (isSimplifyingBounds)
      throw new SmtUnsupportedError("simplifying the bounds of a spacer cube");
    return mkAndOf(manager, sortByAstLt(manager, conjs));
  }
}

class ImplicantPicker {
  private todo: number[] = [];
  private visited = new Set<number>();

  constructor(
    private manager: AstManager,
    private model: ProtoModel,
  ) {}

  private eval(expr: number) {
    return this.model.eval(pin(this.manager, expr), false);
  }

  private addLiteral(expr: number, out: number[]) {
    const manager = this.manager;
    let result = manager.isFalse(this.eval(expr)) ? pin(manager, manager.mkNot(expr)) : expr;
    if (manager.getOp(result) === OP_DISTINCT && manager.getNumArgs(result) === 2)
      result = pin(
        manager,
        manager.mkNot(manager.mkEq(manager.getArg(result, 0), manager.getArg(result, 1))),
      );
    if (manager.isNot(result)) {
      const negated = manager.getArg(result, 0);
      const op = manager.getOp(negated);
      if (op === OP_XOR && manager.getNumArgs(negated) === 2)
        result = pin(manager, manager.mkEq(manager.getArg(negated, 0), manager.getArg(negated, 1)));
      else if (op === OP_EQ && isArithSort(manager.sorts[manager.getArg(negated, 0)])) {
        const left = manager.getArg(negated, 0);
        const right = manager.getArg(negated, 1);
        result = pin(manager, manager.mkApp(OP_LT, [left, right], SORT_BOOL));
        if (!isTrueIn(this.model, result))
          result = pin(manager, manager.mkApp(OP_LT, [right, left], SORT_BOOL));
      }
    }
    out.push(result);
  }

  private processApp(app: number, out: number[]) {
    const manager = this.manager;
    const model = this.model;
    if (this.visited.has(app)) return;
    const value = this.eval(app);
    const isTrue = manager.isTrue(value);
    if (!isTrue && !manager.isFalse(value)) return;
    const op = manager.getOp(app);
    const args = manager.getArgs(app);
    if (manager.isTrue(app) || manager.isFalse(app)) return;
    if (manager.getFamily(app) !== FAMILY_BASIC || manager.isUninterpretedConst(app)) {
      this.addLiteral(app, out);
      return;
    }
    switch (op) {
      case OP_NOT:
        this.todo.push(args[0]);
        return;
      case OP_DISTINCT: {
        if (!isTrue) {
          const context = new MbpContext(manager, model);
          this.todo.push(pin(manager, pickEquality(context, app)));
          context.release();
        } else if (args.length === 2) this.addLiteral(app, out);
        else {
          const expanded: number[] = [];
          for (let first = 0; first < args.length; first++)
            for (let second = first + 1; second < args.length; second++)
              expanded.push(manager.mkNot(manager.mkEq(args[first], args[second])));
          this.todo.push(mkAndOf(manager, expanded));
        }
        return;
      }
      case OP_AND:
        if (isTrue) this.todo.push(...args);
        else {
          const falseArg = args.find((arg) => isFalseIn(model, arg));
          if (falseArg !== undefined) this.todo.push(falseArg);
        }
        return;
      case OP_OR:
        if (!isTrue) this.todo.push(...args);
        else {
          const trueArg = args.find((arg) => isTrueIn(model, arg));
          if (trueArg !== undefined) this.todo.push(trueArg);
        }
        return;
      case OP_EQ: {
        const [left, right] = args;
        if (left === right || manager.areDistinct(left, right)) return;
        if (
          manager.sorts[left] === SORT_BOOL &&
          (!manager.isUninterpretedConst(left) || !manager.isUninterpretedConst(right))
        )
          this.todo.push(...args);
        else this.addLiteral(app, out);
        return;
      }
      case OP_ITE: {
        const [condition, thenExpr, elseExpr] = args;
        if (thenExpr === elseExpr) this.todo.push(thenExpr);
        else if (isTrueIn(model, thenExpr) && isTrueIn(model, elseExpr))
          this.todo.push(thenExpr, elseExpr);
        else if (isFalseIn(model, thenExpr) && isFalseIn(model, elseExpr))
          this.todo.push(thenExpr, elseExpr);
        else if (isTrueIn(model, condition)) this.todo.push(condition, thenExpr);
        else if (isFalseIn(model, condition)) this.todo.push(condition, elseExpr);
        return;
      }
      case OP_XOR:
        this.todo.push(...args);
        return;
      case OP_IMPLIES:
        if (!isTrue) this.todo.push(...args);
        else if (isTrueIn(model, args[1])) this.todo.push(args[1]);
        else if (isFalseIn(model, args[0])) this.todo.push(args[0]);
        return;
      default:
        throw new SmtUnsupportedError("picking an implicant of this Boolean operator");
    }
  }

  private pickLiterals(expr: number, out: number[]) {
    const manager = this.manager;
    if (this.visited.has(expr) || manager.kinds[expr] !== KIND_APP) return;
    this.todo = [expr];
    for (let current = this.todo.pop(); current !== undefined; current = this.todo.pop()) {
      if (manager.kinds[current] !== KIND_APP) continue;
      this.processApp(current, out);
      this.visited.add(current);
    }
  }

  pick(formula: readonly number[], out: number[]) {
    this.visited.clear();
    const isTrue = formula.every((expr) => isTrueIn(this.model, expr));
    for (const expr of formula)
      if (isTrue || isTrueIn(this.model, expr)) this.pickLiterals(expr, out);
    this.visited.clear();
  }
}

export const computeImplicantLiterals = (model: ProtoModel, formula: readonly number[]) => {
  const manager = model.manager;
  const flat = flattenAnd(manager, formula);
  const result: number[] = [];
  if (flat.length > 0) new ImplicantPicker(manager, model).pick(flat, result);
  return result;
};

// qe_project with spacer.native_mbp: the variables that remain come back in vars.
export const qeProject = (
  manager: AstManager,
  vars: number[],
  fml: number,
  model: ProtoModel,
  isDontSub: boolean,
) => {
  if (vars.length === 0) return fml;
  const varVector = new RefVector(manager);
  for (const variable of vars) varVector.push(variable);
  const fmls = new RefVector(manager);
  fmls.push(fml);
  const mbproj = new Mbproj(manager);
  mbproj.apply(!isDontSub, varVector, model, fmls);
  mbproj.release();
  const result = mkAndOf(manager, fmls.items);
  vars.length = 0;
  for (const variable of varVector.items) vars.push(pin(manager, variable));
  fmls.reset();
  varVector.reset();
  return result;
};

export class ZkConsts {
  constructor(private manager: AstManager) {}

  has(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current) || manager.kinds[current] !== KIND_APP) continue;
      visited.add(current);
      if (manager.getNumArgs(current) === 0 && manager.getDeclName(current).startsWith("sk!"))
        return true;
      manager.pushArgs(current, todo);
    }
    return false;
  }
}
