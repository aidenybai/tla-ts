// Ported from Z3 (src/tactic/core/tseitin_cnf_tactic.cpp, src/ast/shared_occs.cpp), MIT license,
// see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

const NO = 0;
const CONT = 1;
const DONE = 2;
const DISTRIBUTIVITY_BLOWUP = 32;

interface Frame {
  expr: number;
  isFirst: boolean;
}

const getSharedApps = (manager: AstManager, forms: readonly number[]) => {
  const visited = new Set<number>();
  const shared = new Set<number>();
  const todo = [...forms];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    const kind = manager.kinds[expr];
    if (kind !== KIND_QUANTIFIER && (kind !== KIND_APP || manager.getNumArgs(expr) === 0)) continue;
    if (visited.has(expr)) {
      shared.add(expr);
      continue;
    }
    visited.add(expr);
    if (kind === KIND_APP) manager.pushArgs(expr, todo);
  }
  return shared;
};

const getOrderedById = (first: number, second: number) =>
  first > second ? [second, first] : [first, second];

const getProductNext = (sizes: readonly number[], iterator: number[]) => {
  for (let index = 0; index < sizes.length; index++) {
    iterator[index]++;
    if (iterator[index] < sizes[index]) return true;
    iterator[index] = 0;
  }
  return false;
};

export const tseitinCnf = (manager: AstManager, goal: Goal) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("tseitin-cnf does not support proofs");
  const shared = getSharedApps(manager, goal.forms.items);
  const rewriter = new Rewriter(manager, { ...TACTIC_REWRITER_OPTIONS, isFlatAndOr: false });
  const pinned = new RefVector(manager);
  const clauses = new RefVector(manager);
  const cache = new Map<number, number>();
  const freshDecls: number[] = [];
  const frames: Frame[] = [];
  const pin = (expr: number) => {
    pinned.push(expr);
    return expr;
  };

  const isShared = (expr: number) => shared.has(expr);
  const isOp = (expr: number, op: number) =>
    manager.kinds[expr] === KIND_APP && manager.getOp(expr) === op;
  const isOrOf = (expr: number, count: number) =>
    isOp(expr, OP_OR) && manager.getNumArgs(expr) === count;
  const isIff = (expr: number) =>
    isOp(expr, OP_EQ) && manager.sorts[manager.getArg(expr, 0)] === SORT_BOOL;

  const inv = (expr: number) => {
    if (manager.isTrue(expr)) return manager.falseExpr;
    if (manager.isFalse(expr)) return manager.trueExpr;
    if (manager.isNot(expr)) return manager.getArg(expr, 0);
    return pin(manager.mkNot(expr));
  };

  const mkLit = (expr: number, isNeg: boolean) => (isNeg ? pin(manager.mkNot(expr)) : expr);

  const getLit = (form: number, isNegated: boolean): number => {
    let expr = form;
    let isNeg = isNegated;
    while (true) {
      if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0)
        return mkLit(expr, isNeg);
      if (manager.getFamily(expr) !== FAMILY_BASIC) return mkLit(expr, isNeg);
      const op = manager.getOp(expr);
      if (op === OP_NOT) {
        expr = manager.getArg(expr, 0);
        isNeg = !isNeg;
        continue;
      }
      if (op === OP_OR) return mkLit(cache.get(expr)!, isNeg);
      if ((op === OP_ITE || op === OP_EQ) && manager.sorts[manager.getArg(expr, 1)] === SORT_BOOL)
        return mkLit(cache.get(expr)!, isNeg);
      return mkLit(expr, isNeg);
    }
  };

  const visit = (form: number, isRoot = false) => {
    let expr = form;
    while (true) {
      if (manager.kinds[expr] !== KIND_APP || cache.has(expr) || manager.getNumArgs(expr) === 0)
        return true;
      if (manager.getFamily(expr) !== FAMILY_BASIC) return true;
      switch (manager.getOp(expr)) {
        case OP_NOT:
          if (isRoot) {
            frames.push({ expr, isFirst: true });
            return false;
          }
          expr = manager.getArg(expr, 0);
          continue;
        case OP_OR:
          frames.push({ expr, isFirst: true });
          return false;
        case OP_ITE:
        case OP_EQ:
          if (manager.sorts[manager.getArg(expr, 1)] !== SORT_BOOL) return true;
          frames.push({ expr, isFirst: true });
          return false;
        case OP_XOR:
        case OP_IMPLIES:
        case OP_DISTINCT:
        case OP_AND:
          throw new SmtTacticError(
            "operator not supported, apply simplifier before invoking this strategy",
          );
        default:
          return true;
      }
    }
  };

  const visitAll = (exprs: readonly number[]) =>
    exprs.reduce((isVisited, expr) => visit(expr) && isVisited, true);

  const mkClause = (literals: number[]) => clauses.push(pin(rewriter.mkOr(literals)));

  const mkFresh = () => {
    const fresh = manager.mkFreshConst(null, SORT_BOOL);
    freshDecls.push(manager.decls[fresh]);
    return pin(fresh);
  };

  const cacheResult = (expr: number, literal: number) => {
    pinned.push(expr);
    cache.set(expr, literal);
  };

  const getOr3And = (expr: number) => {
    if (!isOrOf(expr, 3)) return null;
    const ors: number[][] = [];
    for (const arg of manager.getArgs(expr)) {
      if (!manager.isNot(arg)) return null;
      const inner = manager.getArg(arg, 0);
      if (isShared(inner) || !isOrOf(inner, 2)) return null;
      ors.push(getOrderedById(manager.getArg(inner, 0), manager.getArg(inner, 1)));
    }
    const [[a1, a2], [b1, b2], [c1, c2]] = ors;
    if (
      (a1 === b1 && a2 === c1 && b2 === c2) ||
      (a1 === b1 && a2 === c2 && b2 === c1) ||
      (a1 === c1 && a2 === b1 && b2 === c2)
    )
      return [a1, a2, b2];
    if (
      (a1 === b2 && a2 === c2 && b1 === c1) ||
      (a1 === c1 && a2 === b2 && b1 === c2) ||
      (a1 === c2 && a2 === b2 && b1 === c1)
    )
      return [a1, a2, b1];
    return null;
  };

  const getIff3 = (expr: number) => {
    if (!isIff(expr)) return null;
    const left = manager.getArg(expr, 0);
    const right = manager.getArg(expr, 1);
    if (!isShared(left) && isIff(left))
      return [manager.getArg(left, 0), manager.getArg(left, 1), right];
    if (!isShared(right) && isIff(right))
      return [left, manager.getArg(right, 0), manager.getArg(right, 1)];
    return null;
  };

  const matchOr3And = (expr: number, isFirst: boolean, isRoot: boolean) => {
    const args = getOr3And(expr);
    if (args === null) return NO;
    if (isFirst && !visitAll(args)) return CONT;
    const [nla, nlb, nlc] = args.map((arg) => getLit(arg, true));
    if (isRoot) {
      mkClause([nla, nlb]);
      mkClause([nla, nlc]);
      mkClause([nlb, nlc]);
      return DONE;
    }
    const k = mkFresh();
    const nk = pin(manager.mkNot(k));
    mkClause([nk, nla, nlb]);
    mkClause([nk, nla, nlc]);
    mkClause([nk, nlb, nlc]);
    const [la, lb, lc] = [nla, nlb, nlc].map(inv);
    mkClause([k, la, lb]);
    mkClause([k, la, lc]);
    mkClause([k, lb, lc]);
    cacheResult(expr, k);
    return DONE;
  };

  const matchIff3 = (expr: number, isFirst: boolean, isRoot: boolean) => {
    const args = getIff3(expr);
    if (args === null) return NO;
    if (isFirst && !visitAll(args)) return CONT;
    const [la, lb, lc] = args.map((arg) => getLit(arg, false));
    const [nla, nlb, nlc] = [la, lb, lc].map(inv);
    if (isRoot) {
      mkClause([la, lb, lc]);
      mkClause([la, nlb, nlc]);
      mkClause([nla, lb, nlc]);
      mkClause([nla, nlb, lc]);
      return DONE;
    }
    const k = mkFresh();
    const nk = pin(manager.mkNot(k));
    mkClause([nk, la, lb, lc]);
    mkClause([nk, la, nlb, nlc]);
    mkClause([nk, nla, lb, nlc]);
    mkClause([nk, nla, nlb, lc]);
    mkClause([k, nla, nlb, nlc]);
    mkClause([k, nla, lb, lc]);
    mkClause([k, la, nlb, lc]);
    mkClause([k, la, lb, nlc]);
    cacheResult(expr, k);
    return DONE;
  };

  const matchIff = (expr: number, isFirst: boolean, isRoot: boolean) => {
    if (!isIff(expr)) return NO;
    const args = manager.getArgs(expr);
    if (isFirst && !visitAll(args)) return CONT;
    const [la, lb] = args.map((arg) => getLit(arg, false));
    const nla = inv(la);
    const nlb = inv(lb);
    if (isRoot) {
      mkClause([la, nlb]);
      mkClause([nla, lb]);
      return DONE;
    }
    const k = mkFresh();
    const nk = pin(manager.mkNot(k));
    mkClause([nk, la, nlb]);
    mkClause([nk, nla, lb]);
    mkClause([k, nla, nlb]);
    mkClause([k, la, lb]);
    cacheResult(expr, k);
    return DONE;
  };

  const getIteChainStep = (ite: number) => {
    const thenExpr = manager.getArg(ite, 1);
    const elseExpr = manager.getArg(ite, 2);
    if (isOp(thenExpr, OP_ITE) && !isShared(thenExpr)) return { next: thenExpr, isThen: true };
    if (isOp(elseExpr, OP_ITE) && !isShared(elseExpr)) return { next: elseExpr, isThen: false };
    return null;
  };

  const matchIte = (expr: number, isFirst: boolean, isRoot: boolean) => {
    if (!isOp(expr, OP_ITE)) return NO;
    if (isFirst) {
      let isVisited = true;
      let ite = expr;
      while (true) {
        isVisited = visit(manager.getArg(ite, 0)) && isVisited;
        const step = getIteChainStep(ite);
        if (step === null) {
          isVisited = visit(manager.getArg(ite, 1)) && isVisited;
          isVisited = visit(manager.getArg(ite, 2)) && isVisited;
          break;
        }
        isVisited = visit(manager.getArg(ite, step.isThen ? 2 : 1)) && isVisited;
        ite = step.next;
      }
      if (!isVisited) return CONT;
    }
    const context: number[] = [];
    const exNegContext: number[] = [];
    const exPosContext: number[] = [];
    const k = isRoot ? -1 : mkFresh();
    const nk = isRoot ? -1 : pin(manager.mkNot(k));
    if (!isRoot) cacheResult(expr, k);
    const mkIteClause = (literals: number[]) => mkClause([...context, ...literals]);
    let ite = expr;
    while (true) {
      const la = getLit(manager.getArg(ite, 0), false);
      const nla = inv(la);
      const step = getIteChainStep(ite);
      if (step !== null) {
        const other = getLit(manager.getArg(ite, step.isThen ? 2 : 1), false);
        const guard = step.isThen ? la : nla;
        if (isRoot) mkIteClause([guard, other]);
        else {
          const nother = inv(other);
          mkIteClause([guard, other, nk]);
          mkIteClause([guard, nother, k]);
          exNegContext.push(other);
          exPosContext.push(nother);
        }
        context.push(step.isThen ? nla : la);
        ite = step.next;
        continue;
      }
      const lb = getLit(manager.getArg(ite, 1), false);
      const lc = getLit(manager.getArg(ite, 2), false);
      if (isRoot) {
        mkIteClause([nla, lb]);
        mkIteClause([la, lc]);
        break;
      }
      const nlb = inv(lb);
      const nlc = inv(lc);
      mkIteClause([nla, lb, nk]);
      mkIteClause([la, lc, nk]);
      mkIteClause([nla, nlb, k]);
      mkIteClause([la, nlc, k]);
      mkIteClause([lb, lc, nk]);
      mkIteClause([nlb, nlc, k]);
      mkClause([...exNegContext, lb, lc, nk]);
      mkClause([...exPosContext, nlb, nlc, k]);
      break;
    }
    return DONE;
  };

  const matchAnd = (expr: number, isFirst: boolean, isRoot: boolean) => {
    if (!isOp(expr, OP_AND)) return NO;
    const args = manager.getArgs(expr);
    if (isFirst && !visitAll(args)) return CONT;
    if (isRoot) {
      for (const arg of args) mkClause([getLit(arg, false)]);
      return DONE;
    }
    const k = mkFresh();
    const nk = pin(manager.mkNot(k));
    cacheResult(expr, k);
    const literals: number[] = [];
    for (const arg of args) {
      const literal = getLit(arg, false);
      mkClause([nk, literal]);
      literals.push(inv(literal));
    }
    mkClause([...literals, k]);
    return DONE;
  };

  const getDistributed = (arg: number) => {
    if (!manager.isNot(arg)) return null;
    const inner = manager.getArg(arg, 0);
    return isOp(inner, OP_OR) && !isShared(inner) ? inner : null;
  };

  const matchOr = (expr: number, isFirst: boolean, isRoot: boolean) => {
    if (!isOp(expr, OP_OR)) return NO;
    const args = manager.getArgs(expr);
    const isExpanding = (count: number, blowup: number) =>
      count < DISTRIBUTIVITY_BLOWUP &&
      blowup * count < DISTRIBUTIVITY_BLOWUP &&
      blowup < blowup * count;
    if (isFirst) {
      let isVisited = true;
      let blowup = 1;
      for (const arg of args) {
        const inner = getDistributed(arg);
        if (inner !== null && isExpanding(manager.getNumArgs(inner), blowup)) {
          blowup *= manager.getNumArgs(inner);
          isVisited = visitAll(manager.getArgs(inner)) && isVisited;
          continue;
        }
        isVisited = visit(arg) && isVisited;
      }
      if (!isVisited) return CONT;
    }
    const k = isRoot ? -1 : mkFresh();
    const nk = isRoot ? -1 : pin(manager.mkNot(k));
    if (!isRoot) cacheResult(expr, k);
    const isDistributing = args.some((arg) => {
      const inner = getDistributed(arg);
      return inner !== null && manager.getNumArgs(inner) < DISTRIBUTIVITY_BLOWUP;
    });
    if (!isDistributing) {
      const literals = args.map((arg) => getLit(arg, false));
      if (isRoot) mkClause(literals);
      else {
        for (const literal of literals) mkClause([inv(literal), k]);
        mkClause([...literals, nk]);
      }
      return DONE;
    }
    const groups: number[][] = [];
    let blowup = 1;
    for (const arg of args) {
      const inner = getDistributed(arg);
      if (inner !== null && isExpanding(manager.getNumArgs(inner), blowup)) {
        blowup *= manager.getNumArgs(inner);
        const negated = manager.getArgs(inner).map((innerArg) => getLit(innerArg, true));
        if (!isRoot) mkClause([...negated.map(inv), k]);
        groups.push(negated);
        continue;
      }
      const literal = getLit(arg, false);
      if (!isRoot) mkClause([inv(literal), k]);
      groups.push([literal]);
    }
    const sizes = groups.map((group) => group.length);
    const iterator = sizes.map(() => 0);
    do {
      const literals = groups.map((group, index) => group[iterator[index]]);
      mkClause(isRoot ? literals : [...literals, nk]);
    } while (getProductNext(sizes, iterator));
    return DONE;
  };

  const matchNot = (expr: number, isFirst: boolean, isRoot: boolean) => {
    if (!manager.isNot(expr)) return NO;
    const arg = manager.getArg(expr, 0);
    if (isFirst && !visit(arg)) return CONT;
    const nla = getLit(arg, true);
    if (isRoot) mkClause([nla]);
    return DONE;
  };

  const matchers = [matchOr3And, matchOr, matchAnd, matchIff3, matchIff, matchIte, matchNot];

  const process = (root: number) => {
    if (visit(root, true)) {
      mkClause([getLit(root, false)]);
      return;
    }
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const isFirst = frame.isFirst;
      frame.isFirst = false;
      for (const match of matchers) {
        const result = match(frame.expr, isFirst, frame.expr === root);
        if (result === CONT) break;
        if (result === DONE) {
          frames.pop();
          break;
        }
      }
    }
  };

  try {
    for (const form of goal.forms.items) process(form);
  } catch (error) {
    pinned.reset();
    clauses.reset();
    rewriter.release();
    throw error;
  }
  goal.reset();
  const added = new Set<number>();
  for (const clause of clauses.items) {
    if (added.has(clause)) continue;
    added.add(clause);
    goal.assert(clause);
  }
  for (const decl of freshDecls) goal.addConverter(decl);
  goal.depth++;
  clauses.reset();
  pinned.reset();
  rewriter.release();
};
