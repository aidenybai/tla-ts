// Ported from Z3 (src/ast/rewriter/rewriter.h, rewriter.cpp, rewriter_def.h), MIT license, see
// z3-license.txt. The result stack, the caches and m_r hold their expressions, so that expressions
// are created and deleted in Z3's order.
import { ActCache } from "./act-cache";
import { KIND_APP, KIND_QUANTIFIER, KIND_VAR, OP_ITE, type AstManager } from "./ast";
import { grow, shrink } from "./array";

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

const PROCESS_CHILDREN = 0;
const REWRITE_BUILTIN = 1;
const EXPAND_DEF = 2;

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

class RewriterCore {
  // Like the svector, the stack keeps the frames past numFrames, which pushFrame writes over.
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

  protected isCaching(expr: number) {
    const manager = this.manager;
    return (
      manager.getRefCount(expr) > 1 &&
      expr !== this.root &&
      (manager.kinds[expr] === KIND_QUANTIFIER ||
        (manager.kinds[expr] === KIND_APP && manager.getNumArgs(expr) > 0))
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
    const numArgs = manager.getNumArgs(expr);
    while (frame.childIndex < numArgs) {
      const arg = manager.getArg(expr, frame.childIndex);
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
    const children = [data.body, ...data.patterns, ...data.noPatterns];
    while (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(child)) return;
    }
    // A rewritten no-pattern is not a pattern, so Z3 drops it.
    const result = frame.hasNewChild
      ? manager.mkQuantifier({
          ...data,
          body: this.resultStack[frame.spos],
          patterns: this.resultStack.slice(frame.spos + 1, frame.spos + 1 + data.patterns.length),
          noPatterns: [],
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

class SubstCore extends RewriterCore {
  protected bindings: number[] = [];
  protected shifts: number[] = [];

  // set_inv_bindings: (:var i) becomes bindings[n - 1 - i], and -1 keeps it.
  setInvBindings(bindings: number[]) {
    shrink(this.bindings, 0);
    shrink(this.shifts, 0);
    for (const binding of bindings) {
      this.bindings.push(binding);
      this.shifts.push(bindings.length);
    }
  }

  setBindings(bindings: number[]) {
    shrink(this.bindings, 0);
    shrink(this.shifts, 0);
    for (let index = bindings.length - 1; index >= 0; index--) {
      this.bindings.push(bindings[index]);
      this.shifts.push(bindings.length);
    }
  }

  updateInvBindingAt(index: number, binding: number) {
    this.bindings[index] = binding;
  }
}

// rewriter_tpl's main loop, which calls the hooks of its configuration. It is a class of its own,
// rather than the base of the configurations, so that V8 sees one shape of it and keeps its property
// accesses and calls monomorphic.
class RewriterEngine extends SubstCore {
  // m_r: the last result, which Z3 holds until it assigns the next one.
  private lastResult = -1;
  private newArgs: number[] = [];
  private shifter: VarShifter;
  private invShifter: InvVarShifter;
  blocked = new Set<number>();
  // Whether the config overrides getSubst and getMacro. Otherwise nothing is substituted or expanded
  // and the call is skipped.
  private isSubstituting: boolean;
  private isExpandingMacros: boolean;
  private isCheckingSteps: boolean;
  private isPreVisiting: boolean;
  private isReducingVars: boolean;
  // The config's hooks, read once. Many configs share the engine, so a call through config at each
  // site sees all of their classes and goes megamorphic.
  private reduceAppHook: RewriterTpl["reduceApp"];
  private isFlatAssocHook: RewriterTpl["isFlatAssoc"];
  private getMacroHook: RewriterTpl["getMacro"];
  private getSubstHook: RewriterTpl["getSubst"];

  constructor(
    manager: AstManager,
    private config: RewriterTpl,
  ) {
    super(manager);
    this.isSubstituting = config.getSubst !== RewriterTpl.prototype.getSubst;
    this.isExpandingMacros = config.getMacro !== RewriterTpl.prototype.getMacro;
    this.isCheckingSteps = config.checkMaxSteps !== RewriterTpl.prototype.checkMaxSteps;
    this.isPreVisiting = config.preVisit !== RewriterTpl.prototype.preVisit;
    this.isReducingVars = config.reduceVar !== RewriterTpl.prototype.reduceVar;
    this.reduceAppHook = config.reduceApp;
    this.isFlatAssocHook = config.isFlatAssoc;
    this.getMacroHook = config.getMacro;
    this.getSubstHook = config.getSubst;
    this.shifter = new VarShifter(manager);
    this.invShifter = new InvVarShifter(manager);
  }

  reset() {
    this.resetCore();
    shrink(this.bindings, 0);
    shrink(this.shifts, 0);
    this.shifter.reset();
    this.invShifter.reset();
  }

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
      // main_loop and each step of resume_core count a step of the resource limit.
      manager.limit.checkpoint();
      if (!this.visit(expr, Infinity))
        while (this.numFrames > 0) {
          manager.limit.checkpoint();
          if (this.isCheckingSteps) this.config.checkMaxSteps();
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

  private visit(expr: number, maxDepth: number) {
    const manager = this.manager;
    const replacement = this.isSubstituting ? this.getSubstHook.call(this.config, expr) : undefined;
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
    if (this.isPreVisiting && !this.config.preVisit(expr)) {
      this.pushResult(expr);
      return true;
    }
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) {
      this.processVar(expr);
      return true;
    }
    if (kind === KIND_APP && manager.getNumArgs(expr) === 0) {
      if (!this.processConst(expr)) this.rewriteConstResult(expr);
      return true;
    }
    this.pushFrame(expr, isCaching, maxDepth === Infinity ? maxDepth : maxDepth - 1);
    return false;
  }

  // It returns false when the constant rewrites to a term with arguments, which m_r holds. The
  // constant being reduced is held, like Z3's t.
  private processConst(expr: number) {
    const manager = this.manager;
    let current = expr;
    manager.incRef(current);
    for (let isRetried = false; ; isRetried = true) {
      const reduced = this.reduceAppHook.call(
        this.config,
        manager.decls[current],
        [],
        manager.sorts[current],
      );
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
      if (manager.kinds[result] !== KIND_APP || manager.getNumArgs(result) > 0) {
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

  private processVar(variable: number) {
    const manager = this.manager;
    const reduced = this.isReducingVars ? this.config.reduceVar(variable) : -1;
    if (reduced !== -1) {
      this.pushResult(reduced);
      manager.decRef(reduced);
      this.setNewChildFlag(variable, -1);
      return;
    }
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
    const numArgs = manager.getNumArgs(expr);
    // visit pushes a child at depth 0 as it is when the config substitutes nothing.
    if (frame.maxDepth === 0 && !this.isSubstituting && manager.getOp(expr) !== OP_ITE)
      for (; frame.childIndex < numArgs; frame.childIndex++)
        this.pushResult(manager.getArg(expr, frame.childIndex));
    while (frame.childIndex < numArgs) {
      if (this.isConstantFolded(expr, frame)) return;
      const arg = manager.getArg(expr, frame.childIndex);
      frame.childIndex++;
      if (!this.visit(arg, frame.maxDepth)) return;
    }
    const decl = manager.decls[expr];
    if (
      this.isFlatAssocHook.call(this.config, decl) &&
      manager.getRefCount(expr) <= 1 &&
      this.numFrames > 1
    ) {
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
    const reduced = this.reduceAppHook.call(this.config, decl, newArgs, manager.sorts[expr]);
    if (typeof reduced !== "number") {
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
    const definition =
      reduced === -1 && this.isExpandingMacros ? this.getMacroHook.call(this.config, decl) : -1;
    if (definition !== -1 && (!manager.isGroundApp(definition) || this.config.isReducingMacro())) {
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

  // m_r keeps the rewritten definition until the next result.
  private finishExpandDef(expr: number, frame: Frame) {
    const manager = this.manager;
    const numArgs = manager.getNumArgs(expr);
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

  private isConstantFolded(expr: number, frame: Frame) {
    const manager = this.manager;
    if (frame.childIndex !== 1 || manager.getOp(expr) !== OP_ITE) return false;
    const condition = this.resultStack[frame.spos];
    const arg = manager.isTrue(condition)
      ? manager.getArg(expr, 1)
      : manager.isFalse(condition)
        ? manager.getArg(expr, 2)
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
    const children = isRewritingPatterns
      ? [data.body, ...data.patterns, ...data.noPatterns]
      : [data.body];
    while (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(child, frame.maxDepth)) return;
    }
    const body = this.resultStack[frame.spos];
    // new_pats: the patterns, which Z3 holds until the quantifier is done.
    const patterns = isRewritingPatterns
      ? this.resultStack.slice(frame.spos + 1, frame.spos + 1 + data.patterns.length)
      : data.patterns;
    for (const pattern of patterns) manager.incRef(pattern);
    const reduced = this.config.reduceQuantifier(expr, body, patterns);
    const noPatterns = isRewritingPatterns ? [] : data.noPatterns;
    if (reduced === -1)
      this.setLastResult(
        frame.hasNewChild ? manager.mkQuantifier({ ...data, body, patterns, noPatterns }) : expr,
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
// reduceApp, reduceQuantifier and reduceVar come with a reference, and -1 is Z3's BR_FAILED or
// false. A Rewrite from reduceApp is rewritten again.
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

  getSubst(_expr: number): number | undefined {
    return undefined;
  }

  preVisit(_expr: number) {
    return true;
  }

  reduceApp(_decl: number, _args: number[], _sort: number): number | Rewrite {
    return -1;
  }

  // check_max_steps: Z3 asks the config at each step, which may count a step of the resource limit.
  checkMaxSteps() {}

  getMacro(_decl: number) {
    return -1;
  }

  isReducingMacro() {
    return false;
  }

  reduceQuantifier(_expr: number, _body: number, _patterns: number[]) {
    return -1;
  }

  reduceVar(_variable: number) {
    return -1;
  }

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

// The flags of a BetaReducer frame: whether to cache its result, whether a child changed, and
// whether it waits for the branch that an ite folded to, REWRITE_BUILTIN.
const FRAME_CACHING = 1;
const FRAME_NEW_CHILD = 2;
const FRAME_FOLDED = 4;

// beta_reducer: rewriter_tpl with beta_reducer_cfg, which substitutes bindings for variables and
// rewrites nothing else. Its main loop is RewriterEngine's with the config's hooks folded in:
// pre_visit skips a ground term, and nothing reduces, expands or rewrites to a depth. So a frame
// needs no depth and only the ite folding's state, and its fields are typed arrays.
export class BetaReducer extends SubstCore {
  // m_r: the last result, which Z3 holds until it assigns the next one.
  private lastResult = -1;
  private shifter: VarShifter;
  private isShifted = false;
  private frameExprs = new Int32Array(16);
  private frameChildIndexes = new Int32Array(16);
  private frameStarts = new Int32Array(16);
  private frameFlags = new Uint8Array(16);

  constructor(manager: AstManager) {
    super(manager);
    this.shifter = new VarShifter(manager);
  }

  // The inverse shifter of rewriter_tpl only shifts an expanded definition, so it is always empty
  // and left out.
  reset() {
    this.resetCore();
    shrink(this.bindings, 0);
    shrink(this.shifts, 0);
    if (!this.isShifted) return;
    this.shifter.reset();
    this.isShifted = false;
  }

  // ~rewriter_tpl: the shifter's cache goes first, then the rewriter's.
  release() {
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
      // main_loop and each step of resume_core count a step of the resource limit.
      manager.limit.checkpoint();
      if (!this.visit(expr))
        while (this.numFrames > 0) {
          manager.limit.checkpoint();
          const top = this.numFrames - 1;
          const curr = this.frameExprs[top];
          if (
            this.frameChildIndexes[top] === 0 &&
            (this.frameFlags[top] & (FRAME_CACHING | FRAME_FOLDED)) === FRAME_CACHING
          ) {
            const cached = this.cache.find(curr, 0);
            if (cached !== undefined) {
              this.pushResult(cached);
              this.numFrames--;
              this.markNewChild(curr, cached);
              continue;
            }
          }
          if (manager.kinds[curr] === KIND_APP) this.processApp(curr, top);
          else this.processQuantifier(curr, top);
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

  private setLastResult(expr: number) {
    if (expr !== -1) this.manager.incRef(expr);
    if (this.lastResult !== -1) this.manager.decRef(this.lastResult);
    this.lastResult = expr;
  }

  private markNewChild(oldExpr: number, newExpr: number) {
    if (oldExpr !== newExpr && this.numFrames > 0)
      this.frameFlags[this.numFrames - 1] |= FRAME_NEW_CHILD;
  }

  private openFrame(expr: number, isCaching: boolean) {
    const index = this.numFrames;
    if (index === this.frameExprs.length) {
      this.frameExprs = grow(this.frameExprs);
      this.frameChildIndexes = grow(this.frameChildIndexes);
      this.frameStarts = grow(this.frameStarts);
      this.frameFlags = grow(this.frameFlags);
    }
    this.frameExprs[index] = expr;
    this.frameChildIndexes[index] = 0;
    this.frameStarts[index] = this.resultStack.length;
    this.frameFlags[index] = isCaching ? FRAME_CACHING : 0;
    this.numFrames++;
  }

  // pre_visit's test for a ground term comes before the cache's, which holds no ground term.
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
        this.markNewChild(expr, cached);
        return true;
      }
    }
    if (manager.kinds[expr] === KIND_VAR) {
      this.processVar(expr);
      return true;
    }
    this.openFrame(expr, isCaching);
    return false;
  }

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
        this.isShifted = true;
        const shifted = this.shifter.shift(binding, 0, amount, 0);
        this.pushResult(shifted);
        this.cache.insert(binding, amount, shifted);
        manager.decRef(shifted);
      }
    }
    this.markNewChild(variable, -1);
  }

  private processApp(expr: number, top: number) {
    const manager = this.manager;
    if (this.frameFlags[top] & FRAME_FOLDED) {
      this.finishFolded(expr, top);
      return;
    }
    const numArgs = manager.getNumArgs(expr);
    while (this.frameChildIndexes[top] < numArgs) {
      const childIndex = this.frameChildIndexes[top];
      if (childIndex === 1 && this.isConstantFolded(expr, top)) return;
      this.frameChildIndexes[top] = childIndex + 1;
      if (!this.visit(manager.getArg(expr, childIndex))) return;
    }
    const spos = this.frameStarts[top];
    this.setLastResult(
      this.frameFlags[top] & FRAME_NEW_CHILD
        ? manager.mkApp(manager.decls[expr], this.resultStack, manager.sorts[expr], spos)
        : expr,
    );
    const result = this.lastResult;
    this.shrinkResults(spos);
    this.pushResult(result);
    if (this.frameFlags[top] & FRAME_CACHING) this.cache.insert(expr, 0, result);
    this.numFrames--;
    this.markNewChild(expr, result);
    this.setLastResult(-1);
  }

  private finishFolded(expr: number, top: number) {
    const result = this.resultStack[this.resultStack.length - 1];
    this.setLastResult(result);
    this.shrinkResults(this.resultStack.length - 1);
    this.shrinkResults(this.resultStack.length - 1);
    this.pushResult(result);
    if (this.frameFlags[top] & FRAME_CACHING) this.cache.insert(expr, 0, result);
    this.numFrames--;
    this.markNewChild(expr, -1);
  }

  private isConstantFolded(expr: number, top: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ITE) return false;
    const spos = this.frameStarts[top];
    const condition = this.resultStack[spos];
    const arg = manager.isTrue(condition)
      ? manager.getArg(expr, 1)
      : manager.isFalse(condition)
        ? manager.getArg(expr, 2)
        : -1;
    if (arg === -1) return false;
    this.shrinkResults(spos);
    this.pushResult(arg);
    this.frameFlags[top] |= FRAME_FOLDED;
    if (this.visit(arg)) this.finishFolded(expr, top);
    this.setLastResult(-1);
    return true;
  }

  private processQuantifier(expr: number, top: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const numDecls = data.sorts.length;
    if (this.frameChildIndexes[top] === 0) {
      this.beginScope();
      this.root = data.body;
      const size = this.bindings.length;
      for (let index = 0; index < numDecls; index++) {
        this.bindings.push(-1);
        this.shifts.push(size);
      }
      this.numQvars += numDecls;
    }
    const children = [data.body, ...data.patterns, ...data.noPatterns];
    while (this.frameChildIndexes[top] < children.length) {
      const childIndex = this.frameChildIndexes[top];
      this.frameChildIndexes[top] = childIndex + 1;
      if (!this.visit(children[childIndex])) return;
    }
    const spos = this.frameStarts[top];
    const body = this.resultStack[spos];
    // new_pats: the patterns, which Z3 holds until the quantifier is done.
    const patterns = this.resultStack.slice(spos + 1, spos + 1 + data.patterns.length);
    for (const pattern of patterns) manager.incRef(pattern);
    this.setLastResult(
      this.frameFlags[top] & FRAME_NEW_CHILD
        ? manager.mkQuantifier({ ...data, body, patterns, noPatterns: [] })
        : expr,
    );
    const result = this.lastResult;
    this.shrinkResults(spos);
    this.pushResult(result);
    shrink(this.bindings, this.bindings.length - numDecls);
    shrink(this.shifts, this.shifts.length - numDecls);
    this.endScope();
    if (this.frameFlags[top] & FRAME_CACHING) this.cache.insert(expr, 0, result);
    this.setLastResult(-1);
    this.numFrames--;
    this.markNewChild(expr, result);
    for (const pattern of patterns) manager.decRef(pattern);
  }
}
