// Ported from Z3 (src/ast/rewriter/rewriter.h, rewriter.cpp, rewriter_def.h), MIT license, see
// z3-license.txt. The main loop of Z3's rewriters, ported step for step with Z3's references: the
// result stack, the caches and m_r hold their expressions, so that expressions are created and
// deleted in Z3's order. A configuration overrides the hooks of default_rewriter_cfg.
import { ActCache } from "./act-cache";
import { KIND_APP, KIND_QUANTIFIER, KIND_VAR, OP_ITE, type AstManager } from "./ast";
import { shrink } from "./array";

// A result that the main loop rewrites again to depth levels, like Z3's BR_REWRITE1 (depth 1) to
// BR_REWRITE_FULL (depth Infinity).
export interface Rewrite {
  expr: number;
  depth: number;
}

// The depth to rewrite a Rewrite's result to. A frame keeps its depth in two bits, where 3 is
// RW_UNBOUNDED_DEPTH, so BR_REWRITE3 rewrites the result without a bound.
export const getRewriteDepth = (rewrite: Rewrite) =>
  rewrite.depth >= 3 ? Infinity : rewrite.depth;

// rewriter_tpl's frame states.
const PROCESS_CHILDREN = 0;
const REWRITE_BUILTIN = 1;
const EXPAND_DEF = 2;

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
  // m_frame_stack: the first numFrames frames are open. Like the svector, the stack keeps the frames
  // past them, which pushFrame writes over.
  protected frames: Frame[] = [];
  protected numFrames = 0;
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
    shrink(resultStack, size);
  }

  protected setNewChildFlag(oldExpr: number, newExpr: number) {
    if (oldExpr !== newExpr && this.numFrames > 0)
      this.frames[this.numFrames - 1].hasNewChild = true;
  }

  protected pushFrame(expr: number, isCaching: boolean, maxDepth: number) {
    if (this.numFrames === this.frames.length)
      this.frames.push({
        curr: expr,
        state: PROCESS_CHILDREN,
        childIndex: 0,
        maxDepth,
        spos: this.resultStack.length,
        isCaching,
        hasNewChild: false,
      });
    else {
      const frame = this.frames[this.numFrames];
      frame.curr = expr;
      frame.state = PROCESS_CHILDREN;
      frame.childIndex = 0;
      frame.maxDepth = maxDepth;
      frame.spos = this.resultStack.length;
      frame.isCaching = isCaching;
      frame.hasNewChild = false;
    }
    this.numFrames++;
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
    const scope = this.scopes[this.scopes.length - 1];
    this.scopes.pop();
    this.root = scope.root;
    this.numQvars = scope.numQvars;
  }

  // rewriter_core::reset: releases the outermost cache and the result stack.
  protected resetCore() {
    this.caches[0].reset();
    this.numFrames = 0;
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
    this.numFrames = 0;
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
    this.numFrames--;
    this.setNewChildFlag(expr, result);
  }

  // main_loop: the result comes with a reference, which the caller releases.
  protected mainLoop(expr: number) {
    this.root = expr;
    if (!this.visit(expr))
      while (this.numFrames > 0) {
        const frame = this.frames[this.numFrames - 1];
        const curr = frame.curr;
        if (frame.childIndex === 0 && frame.isCaching) {
          const cached = this.cache.find(curr, 0);
          if (cached !== undefined) {
            this.pushResult(cached);
            this.numFrames--;
            this.setNewChildFlag(curr, cached);
            continue;
          }
        }
        if (this.manager.kinds[curr] === KIND_APP) this.processApp(curr, frame);
        else this.processQuantifier(curr, frame);
      }
    const result = this.resultStack[this.resultStack.length - 1];
    this.resultStack.pop();
    return result;
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

// rewriter_tpl's main loop, which calls the hooks of its configuration. It is a class of its own,
// rather than the base of the configurations, so that V8 sees one shape of it and keeps its property
// accesses and calls monomorphic.
class RewriterEngine extends RewriterCore {
  // m_r: the last result, which Z3 holds until it assigns the next one.
  private lastResult = -1;
  // m_bindings and m_shifts: the binding of each variable of the substitution, innermost last, and
  // the number of bindings when it was bound.
  private bindings: number[] = [];
  private shifts: number[] = [];
  private newArgs: number[] = [];
  private shifter: VarShifter;
  private invShifter: InvVarShifter;
  // m_blocked: the constants that a nested rewriter does not expand.
  blocked = new Set<number>();
  // Whether the config overrides getSubst. Otherwise nothing is substituted and the call is skipped.
  private isSubstituting: boolean;

  constructor(
    manager: AstManager,
    private config: RewriterTpl,
  ) {
    super(manager);
    this.isSubstituting = config.getSubst !== RewriterTpl.prototype.getSubst;
    this.shifter = new VarShifter(manager);
    this.invShifter = new InvVarShifter(manager);
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
    this.invShifter.reset();
  }

  // cleanup: releases every cache.
  cleanup() {
    this.cleanupCore();
    this.bindings = [];
    this.shifter.cleanup();
    this.invShifter.cleanup();
    this.shifts = [];
  }

  // ~rewriter_tpl: the shifters' caches go first, the inverse shifter's before the other's, then
  // the rewriter's.
  release() {
    this.invShifter.release();
    this.shifter.release();
    this.releaseCaches();
  }

  // operator(): the result comes with a reference, which the caller releases.
  rewrite(expr: number): number {
    const manager = this.manager;
    return manager.withoutTemporaries(() => {
      if (this.numFrames > 0 || this.scopes.length > 0) {
        this.numFrames = 0;
        this.shrinkResults(0);
        this.scopes = [];
        this.caches[0].reset();
      }
      this.root = expr;
      this.numQvars = 0;
      // main_loop and each step of resume_core count a step of the resource limit, and throw
      // SmtCanceledError when it cancels the rewrite.
      manager.limit.checkpoint();
      if (!this.visit(expr, Infinity))
        while (this.numFrames > 0) {
          manager.limit.checkpoint();
          const frame = this.frames[this.numFrames - 1];
          const curr = frame.curr;
          if (frame.childIndex === 0 && frame.state === PROCESS_CHILDREN && frame.isCaching) {
            const cached = this.cache.find(curr, 0);
            if (cached !== undefined) {
              this.pushResult(cached);
              this.numFrames--;
              this.setNewChildFlag(curr, cached);
              continue;
            }
          }
          const kind = manager.kinds[curr];
          if (kind === KIND_APP) this.processApp(curr, frame);
          else if (kind === KIND_QUANTIFIER) this.processQuantifier(curr, frame);
          else {
            // A definition that is a variable gets a frame of its own.
            this.numFrames--;
            this.processVar(curr);
          }
        }
      const result = this.resultStack[this.resultStack.length - 1];
      this.resultStack.pop();
      return result;
    });
  }

  // operator() with bindings: resets the rewriter and substitutes bindings[n - 1 - i] for (:var i).
  rewriteWithBindings(expr: number, bindings: number[]) {
    this.reset();
    this.setInvBindings(bindings);
    return this.rewrite(expr);
  }

  setLastResult(expr: number) {
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
    const replacement = this.isSubstituting ? this.config.getSubst(expr) : undefined;
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
    if (!this.config.preVisit(expr)) {
      this.pushResult(expr);
      return true;
    }
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) {
      this.processVar(expr);
      return true;
    }
    if (kind === KIND_APP && manager.args[expr].length === 0) {
      if (!this.processConst(expr)) this.rewriteConstResult(expr);
      return true;
    }
    this.pushFrame(expr, isCaching, maxDepth === Infinity ? maxDepth : maxDepth - 1);
    return false;
  }

  // process_const: a constant is reduced, and a constant it rewrites to is reduced again. It
  // returns false when the constant rewrites to a term with arguments, which m_r holds. The constant
  // being reduced is held, like Z3's t.
  private processConst(expr: number) {
    const manager = this.manager;
    let current = expr;
    manager.incRef(current);
    for (let isRetried = false; ; isRetried = true) {
      const reduced = this.config.reduceApp(manager.decls[current], [], manager.sorts[current]);
      if (reduced !== -1) {
        const result = typeof reduced === "number" ? reduced : reduced.expr;
        this.setLastResult(result);
        manager.decRef(result);
      }
      if (reduced === -1 && !isRetried) {
        this.pushResult(current);
        manager.decRef(current);
        return true;
      }
      if (typeof reduced === "number") {
        if (reduced === -1) this.setLastResult(current);
        this.pushResult(this.lastResult);
        this.setLastResult(-1);
        this.setNewChildFlag(expr, -1);
        manager.decRef(current);
        return true;
      }
      const result = reduced.expr;
      if (manager.kinds[result] !== KIND_APP || manager.args[result].length > 0) {
        manager.decRef(current);
        return false;
      }
      manager.incRef(result);
      manager.decRef(current);
      current = result;
    }
  }

  // A constant that rewrites to a term with arguments: a rewriter with the same configuration
  // rewrites the term, with the constant blocked so that it is not expanded again. m_r keeps the
  // result.
  private rewriteConstResult(expr: number) {
    const manager = this.manager;
    if (!this.blocked.has(expr)) {
      const nested = this.config.mkNested();
      for (const blocked of this.blocked) nested.engine.blocked.add(blocked);
      nested.engine.blocked.add(expr);
      const result = nested.rewrite(this.lastResult);
      this.setLastResult(result);
      manager.decRef(result);
      nested.release();
    }
    this.setNewChildFlag(expr, -1);
    this.pushResult(this.lastResult);
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
    if (frame.state === EXPAND_DEF) {
      this.finishExpandDef(expr, frame);
      return;
    }
    const args = manager.args[expr];
    // visit pushes a child at depth 0 as it is when the config substitutes nothing.
    if (frame.maxDepth === 0 && !this.isSubstituting && manager.getOp(expr) !== OP_ITE)
      for (; frame.childIndex < args.length; frame.childIndex++)
        this.pushResult(args[frame.childIndex]);
    while (frame.childIndex < args.length) {
      if (this.isConstantFolded(expr, frame)) return;
      const arg = args[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(arg, frame.maxDepth)) return;
    }
    const decl = manager.decls[expr];
    if (this.config.isFlatAssoc(decl) && manager.getRefCount(expr) <= 1 && this.numFrames > 1) {
      const previous = this.frames[this.numFrames - 2];
      if (
        manager.kinds[previous.curr] === KIND_APP &&
        manager.decls[previous.curr] === decl &&
        previous.state === PROCESS_CHILDREN
      ) {
        this.numFrames--;
        this.setNewChildFlag(expr, -1);
        return;
      }
    }
    // new_args: Z3 passes the results on the stack itself. Nothing rewrites with this engine before
    // the arguments are used, so one buffer holds them.
    const newArgs = this.newArgs;
    const resultStack = this.resultStack;
    shrink(newArgs, 0);
    for (let index = frame.spos; index < resultStack.length; index++)
      newArgs.push(resultStack[index]);
    const reduced = this.config.reduceApp(decl, newArgs, manager.sorts[expr]);
    if (typeof reduced !== "number") {
      // BR_REWRITE: the result replaces the arguments and is rewritten to the depth it asks for.
      this.setLastResult(reduced.expr);
      manager.decRef(reduced.expr);
      this.shrinkResults(frame.spos);
      this.pushResult(reduced.expr);
      frame.state = REWRITE_BUILTIN;
      if (this.visit(reduced.expr, getRewriteDepth(reduced)))
        this.finishRewriteBuiltin(expr, frame);
      this.setLastResult(-1);
      return;
    }
    const definition = reduced === -1 ? this.config.getMacro(decl) : -1;
    if (definition !== -1 && (!manager.isGroundApp(definition) || this.config.isReducingMacro())) {
      // The definition is rewritten with the arguments bound to its variables.
      frame.state = EXPAND_DEF;
      const size = this.bindings.length;
      for (let index = newArgs.length - 1; index >= 0; index--) {
        this.bindings.push(newArgs[index]);
        this.shifts.push(size);
      }
      this.pushResult(definition);
      this.beginScope();
      this.numQvars += newArgs.length;
      this.root = definition;
      this.pushFrame(definition, false, Infinity);
      return;
    }
    if (definition !== -1) this.setLastResult(definition);
    else if (reduced === -1)
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
    this.numFrames--;
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
    this.numFrames--;
    this.setNewChildFlag(expr, -1);
  }

  // EXPAND_DEF: the rewritten definition, with its variables moved back down, replaces the term.
  // m_r keeps it until the next result.
  private finishExpandDef(expr: number, frame: Frame) {
    const manager = this.manager;
    const numArgs = manager.args[expr].length;
    shrink(this.bindings, this.bindings.length - numArgs);
    shrink(this.shifts, this.shifts.length - numArgs);
    this.numQvars -= numArgs;
    this.endScope();
    const rewritten = this.resultStack[this.resultStack.length - 1];
    if (manager.isGroundApp(rewritten)) this.setLastResult(rewritten);
    else {
      const shifted = this.invShifter.shift(rewritten, numArgs);
      this.setLastResult(shifted);
      manager.decRef(shifted);
    }
    const result = this.lastResult;
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.cacheResult(expr, result, frame.isCaching);
    this.numFrames--;
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
    const isRewritingPatterns = this.config.isRewritingPatterns();
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
    const reduced = this.config.reduceQuantifier(expr, body, patterns);
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
    shrink(this.bindings, this.bindings.length - numDecls);
    shrink(this.shifts, this.shifts.length - numDecls);
    this.endScope();
    this.cacheResult(expr, result, frame.isCaching);
    this.setLastResult(-1);
    this.numFrames--;
    this.setNewChildFlag(expr, result);
    for (const pattern of patterns) manager.decRef(pattern);
  }
}

// rewriter_tpl with default_rewriter_cfg. A configuration overrides the hooks. The results of
// reduceApp and reduceQuantifier come with a reference, and -1 is Z3's BR_FAILED or false. A
// Rewrite from reduceApp is rewritten again.
export class RewriterTpl {
  readonly engine: RewriterEngine;

  constructor(protected manager: AstManager) {
    this.engine = new RewriterEngine(manager, this);
  }

  isFlatAssoc(_decl: number) {
    return false;
  }

  isRewritingPatterns() {
    return true;
  }

  preVisit(_expr: number) {
    return true;
  }

  getSubst(_expr: number): number | undefined {
    return undefined;
  }

  reduceApp(_decl: number, _args: number[], _sort: number): number | Rewrite {
    return -1;
  }

  // get_macro: the definition of decl over (:var i) for argument i, or -1.
  getMacro(_decl: number) {
    return -1;
  }

  // reduce_macro: whether a ground definition is rewritten rather than taken as it is.
  isReducingMacro() {
    return false;
  }

  reduceQuantifier(_expr: number, _body: number, _patterns: number[]) {
    return -1;
  }

  // A rewriter with the same configuration, for a constant that rewrites to a term with arguments.
  mkNested(): RewriterTpl {
    return new RewriterTpl(this.manager);
  }

  setInvBindings(bindings: number[]) {
    this.engine.setInvBindings(bindings);
  }

  setBindings(bindings: number[]) {
    this.engine.setBindings(bindings);
  }

  updateInvBindingAt(index: number, binding: number) {
    this.engine.updateInvBindingAt(index, binding);
  }

  reset() {
    this.engine.reset();
  }

  cleanup() {
    this.engine.cleanup();
  }

  release() {
    this.engine.release();
  }

  rewrite(expr: number) {
    return this.engine.rewrite(expr);
  }

  rewriteWithBindings(expr: number, bindings: number[]) {
    return this.engine.rewriteWithBindings(expr, bindings);
  }

  protected setLastResult(expr: number) {
    this.engine.setLastResult(expr);
  }
}

// beta_reducer: substitutes bindings for variables without rewriting.
export class BetaReducer extends RewriterTpl {
  preVisit(expr: number) {
    return !this.manager.isGroundApp(expr);
  }
}
