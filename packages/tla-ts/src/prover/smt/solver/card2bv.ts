import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_SUB,
  OP_UMINUS,
  OP_AND,
  OP_AT_LEAST_K,
  OP_AT_MOST_K,
  OP_OR,
  OP_PB_EQ,
  OP_PB_GE,
  OP_PB_LE,
  FAMILY_PB,
  SORT_BOOL,
} from "./ast";
import { assignOwned, release } from "./expr-ref";
import type { Definition, Goal } from "./goal";
import { getPbCoeff, getPbK, hasUnitCoefficients, isUnsigned } from "./pb-rewriter";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { type DependentExprState, runSimplifier } from "./dependent-expr-state";
import { RewriterTpl } from "./rewriter-tpl";
import type { SatParams } from "./sat/config";
import { type CardinalityEncoding, type PsortContext, PsortNw } from "./sorting-network";
import type { TacticParam, TacticParams } from "./tactic";

interface Bound {
  value: Rational;
}

const isPbSum = (manager: AstManager, expr: number, factor: Rational, bound: Bound): boolean => {
  if (manager.kinds[expr] !== KIND_APP) return false;
  const args = manager.getArgs(expr);
  switch (manager.getOp(expr)) {
    case OP_ADD:
      return args.every((arg) => isPbSum(manager, arg, factor, bound));
    case OP_SUB:
      return (
        isPbSum(manager, args[0], factor, bound) &&
        args.slice(1).every((arg) => isPbSum(manager, arg, factor.neg(), bound))
      );
    case OP_UMINUS:
      return isPbSum(manager, args[0], factor.neg(), bound);
    case OP_MUL:
      if (args.length !== 2) return false;
      if (manager.isNumeral(args[0]))
        return isPbSum(manager, args[1], manager.getRationalValue(args[0]).mul(factor), bound);
      if (manager.isNumeral(args[1]))
        return isPbSum(manager, args[0], manager.getRationalValue(args[1]).mul(factor), bound);
      return false;
    case OP_ITE: {
      if (!manager.isNumeral(args[1]) || !manager.isNumeral(args[2])) return false;
      const thenValue = manager.getRationalValue(args[1]).mul(factor);
      const elseValue = manager.getRationalValue(args[2]).mul(factor);
      const low = thenValue.compare(elseValue) < 0 ? thenValue : elseValue;
      bound.value = bound.value.sub(low);
      return bound.value.isInt() && thenValue.sub(elseValue).isInt();
    }
    default:
      if (!manager.isNumeral(expr)) return false;
      bound.value = bound.value.sub(factor.mul(manager.getRationalValue(expr)));
      return bound.value.isInt();
  }
};

const isPb = (manager: AstManager, first: number, second: number) => {
  const bound = { value: Rational.zero };
  return (
    isPbSum(manager, first, Rational.one, bound) &&
    isPbSum(manager, second, Rational.minusOne, bound)
  );
};

// The port has no mk_le_ge, so an arithmetic comparison the encoder would rewrite is unsupported.
export const checkPbFree = (manager: AstManager, form: number) => {
  const visited = new Set<number>();
  const todo = [form];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      todo.push(manager.getQuantifier(expr).body);
      continue;
    }
    if (manager.kinds[expr] !== KIND_APP) continue;
    const op = manager.getOp(expr);
    const args = manager.getArgs(expr);
    const isEncoded =
      op === OP_LE || op === OP_LT
        ? isPb(manager, args[0], args[1])
        : op === OP_GE || op === OP_GT
          ? isPb(manager, args[1], args[0])
          : op === OP_EQ && isPb(manager, args[0], args[1]);
    if (isEncoded) throw new SmtUnsupportedError("pseudo-Boolean constraints");
    todo.push(...args);
  }
};

export interface CardinalityOptions {
  isKeepingCardinality: boolean;
  pbSolver: string;
  encoding: CardinalityEncoding;
  minArity: number;
}

const getCardinalityEncoding = (value: TacticParam | undefined): CardinalityEncoding => {
  switch (value) {
    case "bimander":
    case "ordered":
    case "unate":
    case "circuit":
      return value;
    default:
      return "grouped";
  }
};

export const getCardinalityOptions = (
  params: TacticParams,
  satParams: SatParams,
): CardinalityOptions => ({
  isKeepingCardinality:
    params.get("keep_cardinality_constraints") === true ||
    satParams.get("cardinality.solver") === true,
  pbSolver: String(params.get("pb.solver") ?? satParams.get("pb.solver") ?? "solver"),
  encoding: getCardinalityEncoding(
    params.get("cardinality.encoding") ?? satParams.get("cardinality.encoding"),
  ),
  minArity: Number(satParams.get("pb.min_arity") ?? 9),
});

const PB_ENCODINGS = new Set(["totalizer", "sorting", "segmented", "binary_merge"]);

export class CardPbRewriter extends RewriterTpl implements PsortContext {
  private readonly sort: PsortNw;
  private readonly trail: RefVector;
  private readonly lemmas: RefVector;
  readonly freshDecls: number[] = [];

  constructor(
    manager: AstManager,
    private readonly options: CardinalityOptions,
  ) {
    super(manager);
    this.sort = new PsortNw(this, options.encoding);
    this.trail = new RefVector(manager);
    this.lemmas = new RefVector(manager);
  }

  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], _sort: number) {
    const result = this.mkApp(true, decl, args);
    if (result !== -1) this.manager.incRef(result);
    return result;
  }

  rewritePb(isFull: boolean, expr: number) {
    const manager = this.manager;
    const root =
      manager.kinds[expr] === KIND_APP
        ? this.mkApp(isFull, manager.decls[expr], manager.getArgs(expr))
        : -1;
    if (root === -1) return this.rewrite(expr);
    manager.incRef(root);
    const result = this.rewrite(root);
    manager.decRef(root);
    return result;
  }

  private mkApp(isFull: boolean, decl: number, args: number[]) {
    return this.manager.funcDecls[decl].family === FAMILY_PB ? this.mkPb(isFull, decl, args) : -1;
  }

  private mkPb(isFull: boolean, decl: number, args: number[]) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    const k = getPbK(manager, decl);
    if (this.isOr(op, k)) return manager.mkApp(OP_OR, args, SORT_BOOL);
    const isKUnsigned = isUnsigned(k);
    const isKept = this.options.isKeepingCardinality && args.length >= this.options.minArity;
    const bound = Number(k.num);
    if (op === OP_AT_MOST_K && isKUnsigned) return isKept ? -1 : this.sort.le(isFull, bound, args);
    if (op === OP_AT_LEAST_K && isKUnsigned) return isKept ? -1 : this.sort.ge(isFull, bound, args);
    if (op === OP_PB_EQ && isKUnsigned && hasUnitCoefficients(manager, decl))
      return isKept ? -1 : this.sort.eq(isFull, bound, args);
    if (op === OP_PB_LE && isKUnsigned && hasUnitCoefficients(manager, decl))
      return isKept ? -1 : this.sort.le(isFull, bound, args);
    if (op === OP_PB_GE && isKUnsigned && hasUnitCoefficients(manager, decl))
      return isKept ? -1 : this.sort.ge(isFull, bound, args);
    if (
      (op === OP_PB_EQ || op === OP_PB_LE || op === OP_PB_GE) &&
      isKUnsigned &&
      this.hasSmallCoefficients(decl, args.length) &&
      this.options.pbSolver === "solver"
    )
      return -1;
    const pbSolver = this.options.pbSolver;
    throw new SmtUnsupportedError(
      `the ${PB_ENCODINGS.has(pbSolver) ? pbSolver : "bit-vector"} encoding of a pseudo-Boolean constraint`,
    );
  }

  private isOr(op: number, k: Rational) {
    return (op === OP_AT_LEAST_K || op === OP_PB_GE) && k.equals(Rational.one);
  }

  private hasSmallCoefficients(decl: number, arity: number) {
    let sum = 0n;
    for (let index = 0; index < arity; index++) {
      const coeff = getPbCoeff(this.manager, decl, index);
      if (!isUnsigned(coeff)) return false;
      sum += coeff.num;
      if (sum >= 2n ** 32n) return false;
    }
    return true;
  }

  mkFalse() {
    return this.manager.falseExpr;
  }

  mkTrue() {
    return this.manager.trueExpr;
  }

  mkMax(lits: number[]) {
    return this.pushTrail(this.manager.mkApp(OP_OR, lits, SORT_BOOL));
  }

  mkMin(lits: number[]) {
    return this.pushTrail(this.manager.mkApp(OP_AND, lits, SORT_BOOL));
  }

  mkNot(lit: number) {
    if (this.manager.isNot(lit)) return this.manager.getArg(lit, 0);
    return this.pushTrail(this.manager.mkNot(lit));
  }

  fresh(name: string) {
    const manager = this.manager;
    const fresh = manager.mkFreshConst(name, SORT_BOOL);
    manager.incDeclRef(manager.decls[fresh]);
    this.freshDecls.push(manager.decls[fresh]);
    return this.pushTrail(fresh);
  }

  mkClause(lits: number[]) {
    this.lemmas.push(this.manager.mkOr(lits));
  }

  flushSideConstraints(sideConstraints: RefVector) {
    for (const lemma of this.lemmas.items) sideConstraints.push(lemma);
    this.lemmas.reset();
  }

  private pushTrail(lit: number) {
    this.trail.push(lit);
    return lit;
  }

  override release() {
    this.trail.reset();
    super.release();
    for (const decl of this.freshDecls) this.manager.decDeclRef(decl);
    this.lemmas.reset();
  }
}

export const createCard2Bv =
  (
    manager: AstManager,
    options: RewriterOptions,
    cardinality: CardinalityOptions,
    hide: (decl: number) => void,
  ) =>
  (state: DependentExprState) => ({
    reduce: () => {
      const goal = state.goal;
      const rewriter = new Rewriter(manager, options);
      const pbRewriter = new CardPbRewriter(manager, cardinality);
      let simplified = -1;
      let rewritten = -1;
      const sideConstraints = new RefVector(manager);
      try {
        state.forEachIndex((index) => {
          const form = state.get(index);
          simplified = assignOwned(manager, simplified, rewriter.rewrite(form));
          rewritten = assignOwned(manager, rewritten, pbRewriter.rewritePb(false, simplified));
          checkPbFree(manager, rewritten);
          if (rewritten !== form) goal.update(index, rewritten, goal.getDependency(index));
        });
        pbRewriter.flushSideConstraints(sideConstraints);
        for (const form of sideConstraints.items) goal.assert(form);
        for (const decl of pbRewriter.freshDecls) hide(decl);
      } finally {
        sideConstraints.reset();
        release(manager, rewritten);
        release(manager, simplified);
        pbRewriter.release();
        rewriter.release();
      }
    },
    release: () => {},
  });

export const card2bv = (
  manager: AstManager,
  goal: Goal,
  options: RewriterOptions,
  cardinality: CardinalityOptions,
) => {
  const hidden: Definition[] = [];
  try {
    runSimplifier(
      goal,
      false,
      createCard2Bv(manager, options, cardinality, (decl) => {
        manager.incDeclRef(decl);
        hidden.push({ decl, def: -1 });
      }),
      hidden,
    );
  } finally {
    for (const definition of hidden) manager.decDeclRef(definition.decl);
  }
};
