// Ported from Z3 (src/ast/normal_forms/nnf.cpp, name_exprs.cpp, defined_names.cpp), MIT license,
// see z3-license.txt. Like Z3, the frames, the result stack and the caches hold their expressions,
// so that expressions are created and deleted in Z3's order.
import { ActCache } from "./act-cache";
import {
  AstManager,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { mkNot } from "./ast-util";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";
import { elimUnusedVars, getFreeVarSorts, VarSubst } from "./var-subst";

export class DefinedNames {
  private names = new Map<number, number>();
  private exprs: RefVector;
  private nameRefs: RefVector;
  private lims: number[] = [];

  constructor(private manager: AstManager) {
    this.exprs = new RefVector(manager);
    this.nameRefs = new RefVector(manager);
  }

  push() {
    this.lims.push(this.exprs.size);
  }

  pop() {
    const size = this.lims[this.lims.length - 1];
    this.lims.pop();
    while (this.exprs.size > size) {
      this.names.delete(this.exprs.items[this.exprs.size - 1]);
      this.exprs.shrink(this.exprs.size - 1);
      this.nameRefs.shrink(this.nameRefs.size - 1);
    }
  }

  get numNames() {
    return this.nameRefs.size;
  }

  getNameDecl(index: number) {
    return this.manager.decls[this.nameRefs.items[index]];
  }

  release() {
    this.nameRefs.reset();
    this.exprs.reset();
  }

  mkName(expr: number) {
    const manager = this.manager;
    const existing = this.names.get(expr);
    if (existing !== undefined) return { name: existing, definition: -1 };
    // A variable that does not occur still takes a position, filled with true.
    const freeVarSorts = getFreeVarSorts(manager, expr, manager.freeVarBounds[expr]);
    const varSorts = freeVarSorts.map((sort) => sort ?? SORT_BOOL);
    const sort = manager.sorts[expr];
    const name = manager.mkApp(
      manager.mkFreshFuncDecl("z3name", varSorts, sort),
      freeVarSorts.map((varSort, index) =>
        varSort === undefined ? manager.trueExpr : manager.mkVar(index, varSort),
      ),
      sort,
    );
    this.names.set(expr, name);
    this.exprs.push(expr);
    this.nameRefs.push(name);
    // bound_vars: the variables are in reverse order in the quantifier.
    const definition = manager.withTemporaries(() => {
      const boundVars = (conjunct: number) =>
        varSorts.length === 0
          ? conjunct
          : elimUnusedVars(
              manager,
              manager.mkQuantifier({
                isForall: true,
                sorts: varSorts.toReversed(),
                names: varSorts.map((_sort, index) => varSorts.length - 1 - index),
                body: conjunct,
                patterns: [manager.mkPattern([name])],
                noPatterns: [],
                weight: 1,
                qid: "",
              }),
            );
      if (manager.isBool(expr)) {
        const first = boundVars(manager.mkOr([manager.mkNot(name), expr]));
        const second = boundVars(manager.mkOr([name, manager.mkNot(expr)]));
        return manager.mkAnd([first, second]);
      }
      if (manager.getOp(expr) !== OP_ITE) return boundVars(manager.mkEq(expr, name));
      const notCondition = manager.mkNot(manager.getArg(expr, 0));
      const thenEq = manager.mkEq(name, manager.getArg(expr, 1));
      const first = boundVars(manager.mkOr([notCondition, thenEq]));
      const elseEq = manager.mkEq(name, manager.getArg(expr, 2));
      const second = boundVars(manager.mkOr([manager.getArg(expr, 0), elseEq]));
      return manager.mkAnd([first, second]);
    });
    return { name, definition };
  }
}

// The nested formula namer also names each application of a Boolean operator below the root.
class ExprNamer extends RewriterTpl {
  private definitions: RefVector | null = null;
  private root = -1;

  constructor(
    manager: AstManager,
    private names: DefinedNames,
    private isNamingFormulas: boolean,
  ) {
    super(manager);
  }

  getSubst(expr: number) {
    const manager = this.manager;
    const isNamed =
      manager.kinds[expr] === KIND_QUANTIFIER ||
      (this.isNamingFormulas &&
        manager.kinds[expr] === KIND_APP &&
        manager.funcDecls[manager.decls[expr]].family === FAMILY_BASIC &&
        manager.getNumArgs(expr) > 0 &&
        expr !== this.root);
    if (!isNamed) return undefined;
    const named = this.names.mkName(expr);
    if (named.definition !== -1) {
      this.definitions?.push(named.definition);
      this.manager.decRef(named.definition);
    }
    return named.name;
  }

  // The result comes with a reference, which the caller releases.
  name(expr: number, definitions: RefVector) {
    this.definitions = definitions;
    this.root = expr;
    return this.rewrite(expr);
  }
}

// The function of the last variable comes first, and takes the variable's name.
class Skolemizer {
  private cache: ActCache;
  private subst: VarSubst;

  constructor(private manager: AstManager) {
    this.cache = new ActCache(manager, manager.getNumAsts());
    this.subst = new VarSubst(manager, true);
  }

  // The result comes with a reference, which the caller releases.
  skolemize(quantifier: number) {
    const manager = this.manager;
    const cached = this.cache.find(quantifier, 0);
    if (cached !== undefined) {
      manager.incRef(cached);
      return cached;
    }
    const data = manager.getQuantifier(quantifier);
    const count = data.sorts.length;
    const freeVarSorts = getFreeVarSorts(
      manager,
      data.body,
      manager.freeVarBounds[data.body],
    ).slice(count);
    const args = new RefVector(manager);
    const argSorts: number[] = [];
    freeVarSorts.forEach((sort, index) => {
      if (sort === undefined) return;
      args.push(manager.mkVar(index, sort));
      argSorts.push(sort);
    });
    const substitution = new RefVector(manager);
    for (let index = count - 1; index >= 0; index--) {
      const sort = data.sorts[index];
      substitution.push(
        manager.mkApp(
          manager.mkFreshFuncDecl(data.names[index], argSorts, sort, true, data.skid),
          args.items,
          sort,
        ),
      );
    }
    freeVarSorts.forEach((sort, index) =>
      substitution.push(sort === undefined ? -1 : manager.mkVar(index, sort)),
    );
    substitution.items.reverse();
    const result = this.subst.apply(data.body, substitution.items);
    substitution.reset();
    args.reset();
    this.cache.insert(quantifier, 0, result);
    return result;
  }

  // ~skolemizer: the cache goes first, then the substitution.
  release() {
    this.cache.reset();
    this.subst.release();
  }
}

interface Frame {
  curr: number;
  index: number;
  isPositive: boolean;
  isInQuantifier: boolean;
  isCaching: boolean;
  spos: number;
}

export const NNF_SKOLEM = 0;
export const NNF_QUANT = 1;
export const NNF_FULL = 2;

export class Nnf {
  private frames: Frame[] = [];
  private results: RefVector;
  // One cache per polarity and nesting in a quantifier, in Z3's order of get_cache_idx.
  private caches: ActCache[];
  private todoDefs: RefVector;
  private skolemizer: Skolemizer;
  private namer: ExprNamer;
  private nestedNamer: ExprNamer;

  constructor(
    private manager: AstManager,
    names: DefinedNames,
    private mode = NNF_SKOLEM,
  ) {
    this.results = new RefVector(manager);
    this.caches = Array.from({ length: 4 }, () => new ActCache(manager, manager.getNumAsts()));
    this.todoDefs = new RefVector(manager);
    this.skolemizer = new Skolemizer(manager);
    this.namer = new ExprNamer(manager, names, false);
    this.nestedNamer = new ExprNamer(manager, names, true);
  }

  // operator(): pushes the normal forms of the definitions of the names it introduced, the last
  // first, then returns the normal form of expr with a reference, which the caller releases.
  apply(expr: number, definitions: RefVector) {
    return this.manager.withoutTemporaries(() => {
      this.reset();
      const result = this.process(expr);
      const start = definitions.size;
      for (let index = 0; index < this.todoDefs.size; index++) {
        const definition = this.process(this.todoDefs.items[index]);
        definitions.pushOwned(definition);
      }
      const added = definitions.items.splice(start).reverse();
      definitions.items.push(...added);
      return result;
    });
  }

  // ~nnf: the namer, then the skolemizer, the definitions and the caches, the last first.
  release() {
    this.manager.withoutTemporaries(() => {
      this.nestedNamer.release();
      this.namer.release();
      this.skolemizer.release();
      this.todoDefs.reset();
      for (let index = this.caches.length - 1; index >= 0; index--) this.caches[index].reset();
      this.results.reset();
      this.popFrames(0);
    });
  }

  private reset() {
    this.popFrames(0);
    this.results.reset();
    this.todoDefs.reset();
  }

  private popFrames(size: number) {
    for (const frame of this.frames.splice(size)) this.manager.decRef(frame.curr);
  }

  private getCache(isPositive: boolean, isInQuantifier: boolean) {
    return this.caches[(isInQuantifier ? 2 : 0) + (isPositive ? 1 : 0)];
  }

  private pushFrame(
    expr: number,
    isPositive: boolean,
    isInQuantifier: boolean,
    isCaching: boolean,
  ) {
    this.manager.incRef(expr);
    this.frames.push({
      curr: expr,
      index: 0,
      isPositive,
      isInQuantifier,
      isCaching,
      spos: this.results.size,
    });
  }

  private skip(expr: number, isPositive: boolean) {
    this.results.push(isPositive ? expr : mkNot(this.manager, expr));
  }

  private visit(expr: number, isPositive: boolean, isInQuantifier: boolean) {
    const manager = this.manager;
    const isSkipping = this.mode === NNF_SKOLEM || (this.mode === NNF_QUANT && !isInQuantifier);
    if (isSkipping && !manager.hasQuantifierFlags[expr]) {
      this.skip(expr, isPositive);
      return true;
    }
    const isCaching = manager.getRefCount(expr) > 1;
    if (isCaching) {
      const cached = this.getCache(isPositive, isInQuantifier).find(expr, 0);
      if (cached !== undefined) {
        this.results.push(cached);
        return true;
      }
    }
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR || (kind === KIND_APP && manager.getNumArgs(expr) === 0)) {
      this.skip(expr, isPositive);
      return true;
    }
    this.pushFrame(expr, isPositive, isInQuantifier, isCaching);
    return false;
  }

  private process(expr: number) {
    const manager = this.manager;
    if (!this.visit(expr, true, false))
      while (this.frames.length > 0) {
        manager.limit.checkpoint();
        const frame = this.frames[this.frames.length - 1];
        const curr = frame.curr;
        if (frame.index === 0 && manager.getRefCount(curr) > 1) {
          const cached = this.getCache(frame.isPositive, frame.isInQuantifier).find(curr, 0);
          if (cached !== undefined) {
            this.results.push(cached);
            this.popFrames(this.frames.length - 1);
            continue;
          }
        }
        const isDone =
          manager.kinds[curr] === KIND_QUANTIFIER
            ? this.processQuantifier(curr, frame)
            : this.processApp(curr, frame);
        if (!isDone) continue;
        if (frame.isCaching)
          this.getCache(frame.isPositive, frame.isInQuantifier).insert(
            curr,
            0,
            this.results.items[this.results.size - 1],
          );
        this.popFrames(this.frames.length - 1);
      }
    const result = this.results.items[this.results.size - 1];
    this.results.items.pop();
    return result;
  }

  private visitChildren(frame: Frame, children: [number, boolean][]) {
    while (frame.index < children.length) {
      const child = children[frame.index++];
      if (!this.visit(child[0], child[1], frame.isInQuantifier)) return false;
    }
    return true;
  }

  private setResult(spos: number, result: number) {
    this.manager.incRef(result);
    this.results.shrink(spos);
    this.results.pushOwned(result);
  }

  private processApp(expr: number, frame: Frame) {
    const manager = this.manager;
    const isPositive = frame.isPositive;
    const op = manager.getOp(expr);
    switch (op === OP_EQ && !manager.isBool(manager.getArg(expr, 0)) ? -1 : op) {
      case OP_AND:
      case OP_OR: {
        if (
          !this.visitChildren(
            frame,
            manager.mapArgs(expr, (arg) => [arg, isPositive]),
          )
        )
          return false;
        const results = this.results.items.slice(frame.spos);
        this.setResult(
          frame.spos,
          manager.mkApp((op === OP_AND) === isPositive ? OP_AND : OP_OR, results, SORT_BOOL),
        );
        return true;
      }
      case OP_NOT:
        return this.visitChildren(frame, [[manager.getArg(expr, 0), !isPositive]]);
      case OP_IMPLIES: {
        if (
          !this.visitChildren(frame, [
            [manager.getArg(expr, 0), !isPositive],
            [manager.getArg(expr, 1), isPositive],
          ])
        )
          return false;
        const results = this.results.items.slice(frame.spos);
        this.setResult(frame.spos, manager.mkApp(isPositive ? OP_OR : OP_AND, results, SORT_BOOL));
        return true;
      }
      case OP_ITE: {
        if (
          !this.visitChildren(frame, [
            [manager.getArg(expr, 0), true],
            [manager.getArg(expr, 0), false],
            [manager.getArg(expr, 1), isPositive],
            [manager.getArg(expr, 2), isPositive],
          ])
        )
          return false;
        const results = this.results.items.slice(frame.spos);
        const first = manager.mkApp(OP_OR, [results[1], results[2]], SORT_BOOL);
        const second = manager.mkApp(OP_OR, [results[0], results[3]], SORT_BOOL);
        this.setResult(frame.spos, manager.mkApp(OP_AND, [first, second], SORT_BOOL));
        return true;
      }
      case OP_EQ:
      case OP_XOR: {
        if (
          !this.visitChildren(frame, [
            [manager.getArg(expr, 0), true],
            [manager.getArg(expr, 0), false],
            [manager.getArg(expr, 1), true],
            [manager.getArg(expr, 1), false],
          ])
        )
          return false;
        const results = this.results.items.slice(frame.spos);
        const isEquivalence = (op === OP_EQ) === isPositive;
        const first = manager.mkApp(
          OP_OR,
          isEquivalence ? [results[1], results[2]] : [results[0], results[2]],
          SORT_BOOL,
        );
        const second = manager.mkApp(
          OP_OR,
          isEquivalence ? [results[0], results[3]] : [results[1], results[3]],
          SORT_BOOL,
        );
        this.setResult(frame.spos, manager.mkApp(OP_AND, [first, second], SORT_BOOL));
        return true;
      }
      default: {
        if (this.mode !== NNF_FULL && !manager.hasQuantifierFlags[expr]) {
          this.skip(expr, isPositive);
          return true;
        }
        const namer =
          this.mode === NNF_FULL || (this.mode !== NNF_SKOLEM && frame.isInQuantifier)
            ? this.nestedNamer
            : this.namer;
        const named = namer.name(expr, this.todoDefs);
        if (isPositive) this.results.pushOwned(named);
        else {
          this.results.push(mkNot(manager, named));
          manager.decRef(named);
        }
        return true;
      }
    }
  }

  private processQuantifier(quantifier: number, frame: Frame) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const isUniversal = data.isForall === frame.isPositive;
    if (frame.index === 0) {
      frame.index = 1;
      if (isUniversal) {
        if (!this.visit(data.body, frame.isPositive, true)) return false;
      } else {
        const skolemized = this.skolemizer.skolemize(quantifier);
        const isDone = this.visit(skolemized, !data.isForall, frame.isInQuantifier);
        manager.decRef(skolemized);
        if (!isDone) return false;
      }
    }
    // A skolemized quantifier's result is already on the stack.
    if (!isUniversal) return true;
    const body = this.results.items[this.results.size - 1];
    this.setResult(this.results.size - 1, manager.mkQuantifier({ ...data, isForall: true, body }));
    return true;
  }
}
