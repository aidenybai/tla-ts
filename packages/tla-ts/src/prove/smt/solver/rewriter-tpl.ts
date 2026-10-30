// Ported from Z3 (src/ast/rewriter/rewriter.h, rewriter.cpp, rewriter_def.h), MIT license, see
// z3-license.txt. The main loop of Z3's rewriters, ported step for step with Z3's references: the
// result stack, the caches and m_r hold their expressions, so that expressions are created and
// deleted in Z3's order. A configuration overrides the hooks of default_rewriter_cfg.
import { SmtCanceledError } from "../../../errors";
import { ActCache } from "./act-cache";
import { KIND_APP, KIND_QUANTIFIER, KIND_VAR, OP_ITE, type AstManager } from "./ast";

// A result that the main loop rewrites again to depth levels, like Z3's BR_REWRITE1 (depth 1) to
// BR_REWRITE_FULL (depth Infinity).
export interface Rewrite {
  expr: number;
  depth: number;
}

// rewriter_tpl's frame states.
const PROCESS_CHILDREN = 0;
const REWRITE_BUILTIN = 1;

// A rewrite still to finish: its expression, state, next child, the depth left to rewrite, where
// its children's results start on the result stack, whether to cache its result, and whether a
// child changed.
interface Frame {
  curr: number;
  state: number;
  childIndex: number;
  maxDepth: number;
  spos: number;
  isCaching: boolean;
  hasNewChild: boolean;
}

interface Scope {
  root: number;
  numQvars: number;
}

// rewriter_core: the frames, the result stack and one cache per quantifier scope.
class RewriterCore {
  protected frames: Frame[] = [];
  protected resultStack: number[] = [];
  protected caches: ActCache[];
  protected scopes: Scope[] = [];
  protected root = -1;
  protected numQvars = 0;

  constructor(protected manager: AstManager) {
    this.caches = [new ActCache(manager, manager.getNumAsts())];
  }

  protected get cache() {
    return this.caches[this.scopes.length];
  }

  // must_cache: the result of a shared application with arguments or quantifier.
  protected isCaching(expr: number) {
    const manager = this.manager;
    return (
      manager.getRefCount(expr) > 1 &&
      expr !== this.root &&
      (manager.kinds[expr] === KIND_QUANTIFIER ||
        (manager.kinds[expr] === KIND_APP && manager.args[expr].length > 0))
    );
  }

  protected pushResult(expr: number) {
    this.manager.incRef(expr);
    this.resultStack.push(expr);
  }

  protected shrinkResults(size: number) {
    const resultStack = this.resultStack;
    for (let index = size; index < resultStack.length; index++)
      this.manager.decRef(resultStack[index]);
    resultStack.length = size;
  }

  protected setNewChildFlag(oldExpr: number, newExpr: number) {
    if (oldExpr !== newExpr && this.frames.length > 0)
      this.frames[this.frames.length - 1].hasNewChild = true;
  }

  protected pushFrame(expr: number, isCaching: boolean, maxDepth: number) {
    this.frames.push({
      curr: expr,
      state: PROCESS_CHILDREN,
      childIndex: 0,
      maxDepth,
      spos: this.resultStack.length,
      isCaching,
      hasNewChild: false,
    });
  }

  // begin_scope: each quantifier level gets its own cache, which starts empty.
  protected beginScope() {
    this.scopes.push({ root: this.root, numQvars: this.numQvars });
    if (this.scopes.length === this.caches.length)
      this.caches.push(new ActCache(this.manager, this.manager.getNumAsts()));
    this.cache.reset();
  }

  protected endScope() {
    this.cache.reset();
    const scope = this.scopes.pop() as Scope;
    this.root = scope.root;
    this.numQvars = scope.numQvars;
  }

  // rewriter_core::reset: releases the outermost cache and the result stack.
  protected resetCore() {
    this.caches[0].reset();
    this.frames = [];
    this.shrinkResults(0);
    this.root = -1;
    this.numQvars = 0;
    this.scopes = [];
  }

  // del_cache_stack: releases every cache, the outermost first.
  protected releaseCaches() {
    for (const cache of this.caches) cache.reset();
  }

  // rewriter_core::cleanup.
  protected cleanupCore() {
    this.releaseCaches();
    this.shrinkResults(0);
    this.caches = [new ActCache(this.manager, this.manager.getNumAsts())];
    this.frames = [];
    this.scopes = [];
    this.root = -1;
    this.numQvars = 0;
  }
}

// var_shifter_core: rebuilds an expression with its free variables renamed by processVar.
abstract class VarShifterCore extends RewriterCore {
  protected abstract processVar(variable: number): void;

  private visit(expr: number) {
    const manager = this.manager;
    if (manager.isGroundApp(expr)) {
      this.pushResult(expr);
      return true;
    }
    const isCaching = this.isCaching(expr);
    if (isCaching) {
      const cached = this.cache.find(expr, 0);
      if (cached !== undefined) {
        this.pushResult(cached);
        this.setNewChildFlag(expr, cached);
        return true;
      }
    }
    if (manager.kinds[expr] === KIND_VAR) {
      this.processVar(expr);
      return true;
    }
    this.pushFrame(expr, isCaching, Infinity);
    return false;
  }

  private processApp(expr: number, frame: Frame) {
    const manager = this.manager;
    const args = manager.args[expr];
    while (frame.childIndex < args.length) {
      const arg = args[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(arg)) return;
    }
    const result = frame.hasNewChild
      ? manager.mkApp(manager.decls[expr], this.resultStack.slice(frame.spos), manager.sorts[expr])
      : expr;
    this.finish(expr, frame, result);
    if (frame.isCaching) this.cache.insert(expr, 0, result);
  }

  private processQuantifier(expr: number, frame: Frame) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (frame.childIndex === 0) {
      this.beginScope();
      this.numQvars += data.sorts.length;
      this.root = data.body;
    }
    const children = [data.body, ...data.patterns];
    while (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(child)) return;
    }
    const result = frame.hasNewChild
      ? manager.mkQuantifier({
          ...data,
          body: this.resultStack[frame.spos],
          patterns: this.resultStack.slice(frame.spos + 1),
        })
      : expr;
    this.finish(expr, frame, result);
    this.endScope();
    if (frame.isCaching) this.cache.insert(expr, 0, result);
  }

  private finish(expr: number, frame: Frame, result: number) {
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.frames.pop();
    this.setNewChildFlag(expr, result);
  }

  // main_loop: the result comes with a reference, which the caller releases.
  protected mainLoop(expr: number) {
    this.root = expr;
    if (!this.visit(expr))
      while (this.frames.length > 0) {
        const frame = this.frames[this.frames.length - 1];
        const curr = frame.curr;
        if (frame.childIndex === 0 && frame.isCaching) {
          const cached = this.cache.find(curr, 0);
          if (cached !== undefined) {
            this.pushResult(cached);
            this.frames.pop();
            this.setNewChildFlag(curr, cached);
            continue;
          }
        }
        if (this.manager.kinds[curr] === KIND_APP) this.processApp(curr, frame);
        else this.processQuantifier(curr, frame);
      }
    return this.resultStack.pop() as number;
  }

  reset() {
    this.resetCore();
  }

  cleanup() {
    this.cleanupCore();
  }

  release() {
    this.releaseCaches();
  }
}

// var_shifter: a free variable with index at least bound moves up by shift1, any other by shift2.
export class VarShifter extends VarShifterCore {
  private bound = 0;
  private shift1 = 0;
  private shift2 = 0;

  // Returns the result with a reference, which the caller releases.
  shift(expr: number, bound: number, shift1: number, shift2: number) {
    if (this.manager.isGroundApp(expr)) {
      this.manager.incRef(expr);
      return expr;
    }
    this.caches[0].reset();
    this.bound = bound;
    this.shift1 = shift1;
    this.shift2 = shift2;
    return this.mainLoop(expr);
  }

  protected processVar(variable: number) {
    const manager = this.manager;
    const index = manager.values[variable];
    if (index < this.numQvars) {
      this.pushResult(variable);
      return;
    }
    const shifted = index + (index - this.numQvars >= this.bound ? this.shift1 : this.shift2);
    this.pushResult(manager.mkVar(shifted, manager.sorts[variable]));
    this.setNewChildFlag(variable, -1);
  }
}

// inv_var_shifter: the free variables move down by shift.
export class InvVarShifter extends VarShifterCore {
  private amount = 0;

  // Returns the result with a reference, which the caller releases.
  shift(expr: number, amount: number) {
    if (this.manager.isGroundApp(expr) || amount === 0) {
      this.manager.incRef(expr);
      return expr;
    }
    this.caches[0].reset();
    this.amount = amount;
    return this.mainLoop(expr);
  }

  protected processVar(variable: number) {
    const manager = this.manager;
    const index = manager.values[variable];
    if (index < this.numQvars) {
      this.pushResult(variable);
      return;
    }
    this.pushResult(manager.mkVar(index - this.amount, manager.sorts[variable]));
    this.setNewChildFlag(variable, -1);
  }
}

// rewriter_tpl with default_rewriter_cfg. A configuration overrides the hooks. The results of
// reduceApp and reduceQuantifier come with a reference, and -1 is Z3's BR_FAILED or false. A
// Rewrite from reduceApp is rewritten again.
export class RewriterTpl extends RewriterCore {
  // m_r: the last result, which Z3 holds until it assigns the next one.
  private lastResult = -1;
  // m_bindings and m_shifts: the binding of each variable of the substitution, innermost last, and
  // the number of bindings when it was bound.
  private bindings: number[] = [];
  private shifts: number[] = [];
  private shifter: VarShifter;
  private numSteps = 0;

  constructor(manager: AstManager) {
    super(manager);
    this.shifter = new VarShifter(manager);
  }

  protected isFlatAssoc(_decl: number) {
    return false;
  }

  protected isRewritingPatterns() {
    return true;
  }

  protected preVisit(_expr: number) {
    return true;
  }

  protected getSubst(_expr: number): number | undefined {
    return undefined;
  }

  protected reduceApp(_decl: number, _args: number[], _sort: number): number | Rewrite {
    return -1;
  }

  protected reduceQuantifier(_expr: number, _body: number, _patterns: number[]) {
    return -1;
  }

  // Throws SmtCanceledError when the resource limit cancels the rewrite. The check runs every 256
  // steps rather than on each step.
  protected checkLimit() {
    if ((++this.numSteps & 255) === 0 && !this.manager.limit.inc()) throw new SmtCanceledError();
  }

  // set_inv_bindings: (:var i) becomes bindings[n - 1 - i], and -1 keeps it.
  setInvBindings(bindings: number[]) {
    this.bindings = [...bindings];
    this.shifts = bindings.map(() => bindings.length);
  }

  // set_bindings: (:var i) becomes bindings[i].
  setBindings(bindings: number[]) {
    this.setInvBindings([...bindings].reverse());
  }

  updateInvBindingAt(index: number, binding: number) {
    this.bindings[index] = binding;
  }

  // reset: releases the outermost cache and the bindings.
  reset() {
    this.resetCore();
    this.bindings = [];
    this.shifts = [];
    this.shifter.reset();
  }

  // cleanup: releases every cache.
  cleanup() {
    this.cleanupCore();
    this.bindings = [];
    this.shifter.cleanup();
    this.shifts = [];
  }

  // ~rewriter_tpl: the shifter's caches go first, then the rewriter's.
  release() {
    this.shifter.release();
    this.releaseCaches();
  }

  // operator(): the result comes with a reference, which the caller releases.
  rewrite(expr: number): number {
    const manager = this.manager;
    return manager.withoutTemporaries(() => {
      if (this.frames.length > 0 || this.scopes.length > 0) {
        this.frames = [];
        this.shrinkResults(0);
        this.scopes = [];
        this.caches[0].reset();
      }
      this.root = expr;
      this.numQvars = 0;
      if (!this.visit(expr, Infinity))
        while (this.frames.length > 0) {
          this.checkLimit();
          const frame = this.frames[this.frames.length - 1];
          const curr = frame.curr;
          if (frame.childIndex === 0 && frame.state === PROCESS_CHILDREN && frame.isCaching) {
            const cached = this.cache.find(curr, 0);
            if (cached !== undefined) {
              this.pushResult(cached);
              this.frames.pop();
              this.setNewChildFlag(curr, cached);
              continue;
            }
          }
          if (manager.kinds[curr] === KIND_APP) this.processApp(curr, frame);
          else this.processQuantifier(curr, frame);
        }
      return this.resultStack.pop() as number;
    });
  }

  // operator() with bindings: resets the rewriter and substitutes bindings[n - 1 - i] for (:var i).
  rewriteWithBindings(expr: number, bindings: number[]) {
    this.reset();
    this.setInvBindings(bindings);
    return this.rewrite(expr);
  }

  private setLastResult(expr: number) {
    if (expr !== -1) this.manager.incRef(expr);
    if (this.lastResult !== -1) this.manager.decRef(this.lastResult);
    this.lastResult = expr;
  }

  private cacheResult(expr: number, result: number, isCaching: boolean) {
    if (isCaching) this.cache.insert(expr, 0, result);
  }

  // visit: whether expr is rewritten and its result is on the result stack. Otherwise it pushes a
  // frame for expr.
  private visit(expr: number, maxDepth: number) {
    const manager = this.manager;
    const replacement = this.getSubst(expr);
    if (replacement !== undefined) {
      this.pushResult(replacement);
      this.setNewChildFlag(expr, replacement);
      return true;
    }
    if (maxDepth === 0) {
      this.pushResult(expr);
      return true;
    }
    const isCaching = this.isCaching(expr);
    if (isCaching) {
      const cached = this.cache.find(expr, 0);
      if (cached !== undefined) {
        this.pushResult(cached);
        this.setNewChildFlag(expr, cached);
        return true;
      }
    }
    if (!this.preVisit(expr)) {
      this.pushResult(expr);
      return true;
    }
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) {
      this.processVar(expr);
      return true;
    }
    if (kind === KIND_APP && manager.args[expr].length === 0) {
      this.pushResult(expr);
      return true;
    }
    this.pushFrame(expr, isCaching, maxDepth === Infinity ? maxDepth : maxDepth - 1);
    return false;
  }

  // process_var: a bound variable becomes its binding, shifted over the quantifiers entered since
  // it was bound.
  private processVar(variable: number) {
    const manager = this.manager;
    const index = manager.values[variable];
    const position = this.bindings.length - index - 1;
    const binding = index < this.bindings.length ? this.bindings[position] : -1;
    if (binding === -1) {
      this.pushResult(variable);
      return;
    }
    const amount = this.bindings.length - this.shifts[position];
    if (manager.isGroundApp(binding) || amount === 0) this.pushResult(binding);
    else {
      const cached = this.cache.find(binding, amount);
      if (cached !== undefined) this.pushResult(cached);
      else {
        const shifted = this.shifter.shift(binding, 0, amount, 0);
        this.pushResult(shifted);
        this.cache.insert(binding, amount, shifted);
        manager.decRef(shifted);
      }
    }
    this.setNewChildFlag(variable, -1);
  }

  private processApp(expr: number, frame: Frame) {
    const manager = this.manager;
    if (frame.state === REWRITE_BUILTIN) {
      this.finishRewriteBuiltin(expr, frame);
      return;
    }
    const args = manager.args[expr];
    while (frame.childIndex < args.length) {
      if (this.isConstantFolded(expr, frame)) return;
      const arg = args[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(arg, frame.maxDepth)) return;
    }
    const decl = manager.decls[expr];
    if (this.isFlatAssoc(decl) && manager.getRefCount(expr) <= 1 && this.frames.length > 1) {
      const previous = this.frames[this.frames.length - 2];
      if (
        manager.kinds[previous.curr] === KIND_APP &&
        manager.decls[previous.curr] === decl &&
        previous.state === PROCESS_CHILDREN
      ) {
        this.frames.pop();
        this.setNewChildFlag(expr, -1);
        return;
      }
    }
    const newArgs = this.resultStack.slice(frame.spos);
    const reduced = this.reduceApp(decl, newArgs, manager.sorts[expr]);
    if (typeof reduced !== "number") {
      // BR_REWRITE: the result replaces the arguments and is rewritten to the depth it asks for.
      this.setLastResult(reduced.expr);
      manager.decRef(reduced.expr);
      this.shrinkResults(frame.spos);
      this.pushResult(reduced.expr);
      frame.state = REWRITE_BUILTIN;
      if (this.visit(reduced.expr, reduced.depth)) this.finishRewriteBuiltin(expr, frame);
      this.setLastResult(-1);
      return;
    }
    if (reduced === -1)
      this.setLastResult(
        frame.hasNewChild ? manager.mkApp(decl, newArgs, manager.sorts[expr]) : expr,
      );
    else {
      this.setLastResult(reduced);
      manager.decRef(reduced);
    }
    const result = this.lastResult;
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.cacheResult(expr, result, frame.isCaching);
    this.frames.pop();
    this.setNewChildFlag(expr, result);
    this.setLastResult(-1);
  }

  // REWRITE_BUILTIN: the result of the rewritten term replaces the term on the result stack.
  private finishRewriteBuiltin(expr: number, frame: Frame) {
    const result = this.resultStack[this.resultStack.length - 1];
    this.setLastResult(result);
    this.shrinkResults(this.resultStack.length - 1);
    this.shrinkResults(this.resultStack.length - 1);
    this.pushResult(result);
    this.cacheResult(expr, result, frame.isCaching);
    this.frames.pop();
    this.setNewChildFlag(expr, -1);
  }

  // constant_fold: an ite whose condition rewrote to true or false becomes the chosen branch.
  private isConstantFolded(expr: number, frame: Frame) {
    const manager = this.manager;
    if (frame.childIndex !== 1 || manager.getOp(expr) !== OP_ITE) return false;
    const condition = this.resultStack[frame.spos];
    const arg = manager.isTrue(condition)
      ? manager.args[expr][1]
      : manager.isFalse(condition)
        ? manager.args[expr][2]
        : -1;
    if (arg === -1) return false;
    this.shrinkResults(frame.spos);
    this.pushResult(arg);
    frame.state = REWRITE_BUILTIN;
    if (this.visit(arg, frame.maxDepth)) this.finishRewriteBuiltin(expr, frame);
    this.setLastResult(-1);
    return true;
  }

  private processQuantifier(expr: number, frame: Frame) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const numDecls = data.sorts.length;
    if (frame.childIndex === 0) {
      this.beginScope();
      this.root = data.body;
      const size = this.bindings.length;
      for (let index = 0; index < numDecls; index++) {
        this.bindings.push(-1);
        this.shifts.push(size);
      }
      this.numQvars += numDecls;
    }
    const isRewritingPatterns = this.isRewritingPatterns();
    const children = isRewritingPatterns ? [data.body, ...data.patterns] : [data.body];
    while (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(child, frame.maxDepth)) return;
    }
    const body = this.resultStack[frame.spos];
    // new_pats: the patterns, which Z3 holds until the quantifier is done.
    const patterns = isRewritingPatterns ? this.resultStack.slice(frame.spos + 1) : data.patterns;
    for (const pattern of patterns) manager.incRef(pattern);
    const reduced = this.reduceQuantifier(expr, body, patterns);
    if (reduced === -1)
      this.setLastResult(
        frame.hasNewChild ? manager.mkQuantifier({ ...data, body, patterns }) : expr,
      );
    else {
      this.setLastResult(reduced);
      manager.decRef(reduced);
    }
    const result = this.lastResult;
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.bindings.length -= numDecls;
    this.shifts.length -= numDecls;
    this.endScope();
    this.cacheResult(expr, result, frame.isCaching);
    this.setLastResult(-1);
    this.frames.pop();
    this.setNewChildFlag(expr, result);
    for (const pattern of patterns) manager.decRef(pattern);
  }
}

// beta_reducer: substitutes bindings for variables without rewriting.
export class BetaReducer extends RewriterTpl {
  protected preVisit(expr: number) {
    return !this.manager.isGroundApp(expr);
  }
}
