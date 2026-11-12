// Ported from Z3 (src/ast/rewriter/quant_hoist.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_OR,
  SORT_BOOL,
} from "./ast";
import { isAppOf } from "./ast-util";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { ExprSafeReplace } from "./expr-safe-replace";
import { InvVarShifter } from "./rewriter-tpl";
import { VarSubst } from "./var-subst";

const Q_FORALL_POS = 0x10;
const Q_EXISTS_POS = 0x20;
const Q_NONE_POS = 0x40;
const Q_FORALL_NEG = 0x11;
const Q_EXISTS_NEG = 0x21;
const Q_NONE_NEG = 0x41;

interface QuantifierType {
  value: number;
}

const negate = (type: QuantifierType) => {
  type.value ^= 0x1;
  return type;
};

const isCompatible = (type: number, isForall: boolean) =>
  type === Q_FORALL_POS || type === Q_EXISTS_NEG
    ? isForall
    : type === Q_EXISTS_POS || type === Q_FORALL_NEG
      ? !isForall
      : true;

const setQuantifierType = (type: QuantifierType, isForall: boolean) => {
  if (type.value === Q_NONE_POS) type.value = isForall ? Q_FORALL_POS : Q_EXISTS_POS;
  else if (type.value === Q_NONE_NEG) type.value = isForall ? Q_EXISTS_NEG : Q_FORALL_NEG;
};

// Brings the quantifiers of one kind into prenex form, with fresh constants for their variables.
export class QuantifierHoister {
  private rewriter: Rewriter;
  private trail: RefVector;

  constructor(private manager: AstManager) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.trail = new RefVector(manager);
  }

  release() {
    this.rewriter.release();
    this.trail.reset();
  }

  // The result comes with a reference, which the caller releases.
  pullQuantifier(isForall: boolean, formula: number, vars: RefVector) {
    const result = this.pull(formula, { value: isForall ? Q_FORALL_POS : Q_EXISTS_POS }, vars);
    this.manager.incRef(result);
    this.trail.reset();
    return result;
  }

  // The overload with sorts and names: the variables of the pulled quantifiers stay bound, numbered
  // after the free ones, and their sorts and names go in front of those of the prefix. The result
  // comes with a reference, which the caller releases.
  pullQuantifierBound(isForall: boolean, formula: number, sorts: number[], names: string[]) {
    const manager = this.manager;
    let index = manager.freeVarBounds[formula];
    let current = formula;
    while (
      manager.kinds[current] === KIND_QUANTIFIER &&
      manager.getQuantifier(current).isForall === isForall
    ) {
      const data = manager.getQuantifier(current);
      index += data.sorts.length;
      names.push(...data.names.map(String));
      sorts.push(...data.sorts);
      current = data.body;
    }
    if (!manager.hasQuantifierFlags[current]) {
      manager.incRef(current);
      return current;
    }
    const vars = new RefVector(manager);
    const pulled = this.pullQuantifier(isForall, current, vars);
    if (vars.size === 0) {
      vars.reset();
      return pulled;
    }
    const replace = new ExprSafeReplace(manager);
    for (const variable of vars.items)
      replace.insert(variable, manager.mkVar(index++, manager.sorts[variable]));
    const result = replace.apply(pulled);
    replace.release();
    manager.decRef(pulled);
    names.unshift(...vars.items.map((variable) => manager.getDeclName(variable)).reverse());
    sorts.unshift(...vars.items.map((variable) => manager.sorts[variable]).reverse());
    vars.reset();
    return result;
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  private pinOwned(expr: number) {
    this.trail.pushOwned(expr);
    return expr;
  }

  private extractQuantifier(quantifier: number, vars: RefVector) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const fresh = data.sorts.map((sort, index) =>
      this.pin(manager.mkFreshConst(String(data.names[index]), sort)),
    );
    for (const expr of fresh) vars.push(expr);
    const subst = new VarSubst(manager, true);
    const substituted = this.pinOwned(subst.apply(data.body, fresh));
    subst.release();
    const shifter = new InvVarShifter(manager);
    const result = this.pinOwned(shifter.shift(substituted, fresh.length));
    shifter.release();
    return result;
  }

  private pull(formula: number, type: QuantifierType, vars: RefVector): number {
    const manager = this.manager;
    if (!manager.hasQuantifierFlags[formula]) return formula;
    const kind = manager.kinds[formula];
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(formula);
      if (!isCompatible(type.value, data.isForall)) return formula;
      setQuantifierType(type, data.isForall);
      return this.pull(this.extractQuantifier(formula, vars), type, vars);
    }
    if (kind !== KIND_APP) return formula;
    const args = manager.getArgs(formula);
    const mkNot = (expr: number) => this.pin(manager.mkNot(expr));
    const mkOr = (first: number, second: number) => this.pin(manager.mkOr([first, second]));
    if (isAppOf(manager, formula, OP_AND) || isAppOf(manager, formula, OP_OR)) {
      const pulled = args.map((arg) => this.pull(arg, type, vars));
      const isAnd = isAppOf(manager, formula, OP_AND);
      return this.pinOwned(
        manager.withTemporaries(() =>
          isAnd ? this.rewriter.mkAnd(pulled) : this.rewriter.mkOr(pulled),
        ),
      );
    }
    if (manager.isNot(formula)) {
      const pulled = this.pull(args[0], negate(type), vars);
      negate(type);
      return mkNot(pulled);
    }
    if (isAppOf(manager, formula, OP_IMPLIES)) {
      const premise = this.pull(args[0], negate(type), vars);
      negate(type);
      const conclusion = this.pull(args[1], type, vars);
      return this.pin(manager.mkApp(OP_IMPLIES, [premise, conclusion], SORT_BOOL));
    }
    if (isAppOf(manager, formula, OP_ITE)) {
      const [condition, thenExpr, elseExpr] = args;
      const pulledThen = this.pull(thenExpr, type, vars);
      const pulledElse = this.pull(elseExpr, type, vars);
      if (!manager.hasQuantifierFlags[condition])
        return this.pin(
          manager.mkApp(OP_ITE, [condition, pulledThen, pulledElse], manager.sorts[formula]),
        );
      const pulledCondition = this.pull(condition, type, vars);
      const pulledNegated = this.pull(mkNot(condition), type, vars);
      return this.pin(
        manager.mkAnd([mkOr(pulledNegated, pulledThen), mkOr(pulledCondition, pulledElse)]),
      );
    }
    if (isAppOf(manager, formula, OP_EQ) && manager.sorts[args[0]] === SORT_BOOL) {
      const pulled1 = this.pull(args[0], type, vars);
      const pulled2 = this.pull(args[1], type, vars);
      const negated1 = this.pull(mkNot(args[0]), type, vars);
      const negated2 = this.pull(mkNot(args[1]), type, vars);
      return this.pin(manager.mkAnd([mkOr(negated1, pulled2), mkOr(negated2, pulled1)]));
    }
    // The formula has a quantifier, but out of reach.
    return formula;
  }
}
