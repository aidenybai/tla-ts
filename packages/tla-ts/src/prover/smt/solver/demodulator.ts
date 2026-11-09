// Ported from Z3 (src/ast/substitution/demodulator_rewriter.cpp,
// src/ast/substitution/substitution.cpp, src/util/array_map.h,
// src/tactic/ufbv/ufbv_rewriter_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_ARRAY_EXT,
  OP_BADD,
  OP_BAND,
  OP_BCOMP,
  OP_BMUL,
  OP_BOR,
  OP_BXNOR,
  OP_BXOR,
  OP_EQ,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import type { Goal } from "./goal";
import { ObjHashtable, ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { VarShifter } from "./rewriter-tpl";
import { UnusedVarsEliminator } from "./var-subst";

const COMMUTATIVE_OPS = new Set([
  OP_EQ,
  OP_AND,
  OP_OR,
  OP_XOR,
  OP_ADD,
  OP_MUL,
  OP_BADD,
  OP_BMUL,
  OP_BAND,
  OP_BOR,
  OP_BXOR,
  OP_BXNOR,
  OP_BCOMP,
  OP_ARRAY_EXT,
]);

interface ExprOffset {
  expr: number;
  offset: number;
}

interface Demodulator {
  large: number;
  small: number;
}

interface CacheEntry {
  key: number;
  value: number;
  isDone: boolean;
  timestamp: number;
}

const getOffsetKey = (node: ExprOffset) => node.expr * 2 + node.offset;

const isUninterp = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.funcDecls[manager.decls[expr]].family === FAMILY_USER;

const forEachSubterm = (manager: AstManager, expr: number, visit: (term: number) => void) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    visit(current);
    if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    if (manager.kinds[current] !== KIND_QUANTIFIER) continue;
    const data = manager.getQuantifier(current);
    todo.push(data.body, ...data.patterns, ...data.noPatterns);
  }
};

const getVarSet = (manager: AstManager, expr: number) => {
  const vars = new Set<number>();
  forEachSubterm(manager, expr, (term) => {
    if (manager.kinds[term] === KIND_VAR) vars.add(manager.values[term]);
  });
  return vars;
};

const isSubsetOf = (left: Set<number>, right: Set<number>) =>
  [...left].every((index) => right.has(index));

const getSubsetOrder = (manager: AstManager, left: number, right: number) => {
  if (manager.isValue(left)) return 1;
  const leftVars = getVarSet(manager, left);
  const rightVars = getVarSet(manager, right);
  if (isSubsetOf(leftVars, rightVars)) return isSubsetOf(rightVars, leftVars) ? 2 : 1;
  return isSubsetOf(rightVars, leftVars) ? -1 : 0;
};

const getSizeOrder = (manager: AstManager, left: number, right: number) => {
  if (manager.isValue(left)) return 1;
  if (manager.isValue(right)) return -1;
  const isLeftUninterp = isUninterp(manager, left);
  const isRightUninterp = isUninterp(manager, right);
  if (!isLeftUninterp && isRightUninterp) return 1;
  if (isLeftUninterp && !isRightUninterp) return -1;
  if (isLeftUninterp && isRightUninterp) {
    const numArgsOrder = Math.sign(manager.getNumArgs(right) - manager.getNumArgs(left));
    if (numArgsOrder !== 0) return numArgsOrder;
    const declOrder = Math.sign(manager.getDeclId(right) - manager.getDeclId(left));
    if (declOrder !== 0) return declOrder;
  }
  return Math.sign(manager.depths[right] - manager.depths[left]);
};

// is_demodulator: the rule comes with references to both sides, which the caller releases.
const getDemodulator = (manager: AstManager, expr: number): Demodulator | undefined => {
  if (manager.kinds[expr] !== KIND_QUANTIFIER || !manager.getQuantifier(expr).isForall)
    return undefined;
  const body = manager.getQuantifier(expr).body;
  const own = (large: number, small: number) => {
    manager.incRef(large);
    manager.incRef(small);
    return { large, small };
  };
  if (manager.getOp(body) === OP_EQ) {
    const lhs = manager.getArg(body, 0);
    const rhs = manager.getArg(body, 1);
    const subsetOrder = getSubsetOrder(manager, lhs, rhs);
    const sizeOrder = getSizeOrder(manager, lhs, rhs);
    if ((subsetOrder === 1 || subsetOrder === 2) && sizeOrder === 1) {
      if (isUninterp(manager, rhs)) return own(rhs, lhs);
      if (manager.isNot(rhs) && isUninterp(manager, manager.getArg(rhs, 0)))
        return own(manager.getArg(rhs, 0), manager.mkApp(OP_NOT, [lhs], SORT_BOOL));
    }
    if ((subsetOrder === -1 || subsetOrder === 2) && sizeOrder === -1) {
      if (isUninterp(manager, lhs)) return own(lhs, rhs);
      if (manager.isNot(lhs) && isUninterp(manager, manager.getArg(lhs, 0)))
        return own(manager.getArg(lhs, 0), manager.mkApp(OP_NOT, [rhs], SORT_BOOL));
    }
    return undefined;
  }
  if (manager.isNot(body) && manager.kinds[manager.getArg(body, 0)] === KIND_APP)
    return own(manager.getArg(body, 0), manager.falseExpr);
  if (isUninterp(manager, body)) return own(body, manager.trueExpr);
  return undefined;
};

// A substitution from the variables of two banks: offset 0 holds the variables of a rule, and
// offset 1 those of the term it matches. The shifts of both banks are zero.
class Substitution {
  private bindings = new Map<number, ExprOffset>();
  private refs: RefVector;
  private cache = new Map<number, number>();
  private newExprs: RefVector;
  private isInserted = false;

  constructor(private manager: AstManager) {
    this.refs = new RefVector(manager);
    this.newExprs = new RefVector(manager);
  }

  find(index: number, offset: number) {
    return this.bindings.get(index * 2 + offset);
  }

  insert(index: number, offset: number, value: ExprOffset) {
    this.bindings.set(index * 2 + offset, value);
    this.refs.push(value.expr);
    this.isInserted = true;
  }

  reset() {
    this.bindings.clear();
    this.refs.reset();
    this.resetCache();
  }

  private resetCache() {
    this.cache.clear();
    this.newExprs.reset();
    this.isInserted = false;
  }

  // The result stays referenced by the substitution until its next reset.
  apply(root: ExprOffset) {
    const manager = this.manager;
    if (this.isInserted) this.resetCache();
    const todo = [root];
    while (todo.length > 0) {
      const node = todo[todo.length - 1];
      const key = getOffsetKey(node);
      if (this.cache.has(key)) {
        todo.pop();
        continue;
      }
      const expr = node.expr;
      const offset = node.offset;
      if (manager.kinds[expr] === KIND_VAR) {
        const bound = this.find(manager.values[expr], offset);
        const boundValue = bound === undefined ? expr : this.cache.get(getOffsetKey(bound));
        if (bound !== undefined && boundValue === undefined) {
          todo.push(bound);
          continue;
        }
        todo.pop();
        this.cache.set(key, boundValue as number);
        continue;
      }
      if (manager.kinds[expr] === KIND_APP) {
        let isVisited = true;
        for (let index = manager.getNumArgs(expr); index > 0; index--) {
          const child = { expr: manager.getArg(expr, index - 1), offset };
          if (this.cache.has(getOffsetKey(child))) continue;
          todo.push(child);
          isVisited = false;
        }
        if (!isVisited) continue;
        todo.pop();
        const args = manager.mapArgs(expr, (arg) => this.cache.get(arg * 2 + offset) as number);
        if (args.every((arg, index) => arg === manager.getArg(expr, index))) {
          this.cache.set(key, expr);
          continue;
        }
        const created = manager.mkApp(manager.decls[expr], args, manager.sorts[expr]);
        this.newExprs.push(created);
        this.cache.set(key, created);
        continue;
      }
      todo.pop();
      const result = this.applyQuantifier(expr, offset);
      this.cache.set(key, result);
      this.newExprs.pushOwned(result);
    }
    const result = this.cache.get(getOffsetKey(root)) as number;
    this.newExprs.push(result);
    return result;
  }

  // The bindings move under the bound variables. The result comes with a reference.
  private applyQuantifier(quantifier: number, offset: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const numVars = data.sorts.length;
    const nested = new Substitution(manager);
    const shifter = new VarShifter(manager);
    const bindings = [...this.bindings].toSorted(
      (left, right) => (left[0] % 2) - (right[0] % 2) || left[0] - right[0],
    );
    for (const [key, bound] of bindings) {
      const shifted = shifter.shift(bound.expr, 0, numVars, 0);
      nested.insert(Math.floor(key / 2) + numVars, key % 2, {
        expr: shifted,
        offset: bound.offset,
      });
      manager.decRef(shifted);
    }
    const patterns = new RefVector(manager);
    const noPatterns = new RefVector(manager);
    for (const pattern of data.patterns) patterns.push(nested.apply({ expr: pattern, offset }));
    for (const pattern of data.noPatterns) noPatterns.push(nested.apply({ expr: pattern, offset }));
    const body = nested.apply({ expr: data.body, offset });
    const isSame =
      body === data.body &&
      patterns.items.every((pattern, index) => pattern === data.patterns[index]) &&
      noPatterns.items.every((pattern, index) => pattern === data.noPatterns[index]);
    const result = isSame
      ? quantifier
      : manager.mkQuantifier({
          ...data,
          body,
          patterns: [...patterns.items],
          noPatterns: [...noPatterns.items],
        });
    manager.incRef(result);
    noPatterns.reset();
    patterns.reset();
    shifter.release();
    nested.release();
    return result;
  }

  release() {
    this.newExprs.reset();
    this.refs.reset();
  }
}

class MatchSubstitution {
  readonly subst: Substitution;
  private cache = new Set<string>();
  private todo: [number, number][] = [];
  private isAllArgsEq = true;

  constructor(private manager: AstManager) {
    this.subst = new Substitution(manager);
  }

  private fillCommutative(lhs: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[manager.decls[lhs]];
    if (funcDecl.family === FAMILY_USER || !COMMUTATIVE_OPS.has(funcDecl.op)) return false;
    if (manager.getNumArgs(lhs) !== 2) return false;
    const isDifferentApp = (left: number, right: number) =>
      manager.kinds[left] === KIND_APP &&
      manager.kinds[right] === KIND_APP &&
      manager.decls[left] !== manager.decls[right];
    if (
      !isDifferentApp(manager.getArg(lhs, 0), args[0]) &&
      !isDifferentApp(manager.getArg(lhs, 1), args[1])
    )
      return false;
    this.isAllArgsEq = false;
    this.todo.push([manager.getArg(lhs, 0), args[1]]);
    this.todo.push([manager.getArg(lhs, 1), args[0]]);
    return true;
  }

  // match_args_aux_proc: the variables of a shared term are bound to themselves.
  private bindToSelf(expr: number) {
    const manager = this.manager;
    let isMatching = true;
    forEachSubterm(manager, expr, (term) => {
      if (!isMatching) return;
      if (manager.kinds[term] === KIND_QUANTIFIER) {
        isMatching = false;
        return;
      }
      if (manager.kinds[term] !== KIND_VAR) return;
      const bound = this.subst.find(manager.values[term], 0);
      if (bound === undefined)
        this.subst.insert(manager.values[term], 0, { expr: term, offset: 1 });
      else if (bound.expr !== term) isMatching = false;
    });
    return isMatching;
  }

  private matchArgs(lhs: number, args: number[]) {
    const manager = this.manager;
    this.cache.clear();
    this.todo = [];
    this.isAllArgsEq = true;
    if (!this.fillCommutative(lhs, args))
      for (const [index, arg] of args.entries()) {
        const lhsArg = manager.getArg(lhs, index);
        if (lhsArg !== arg) this.isAllArgsEq = false;
        if (
          manager.kinds[lhsArg] === KIND_APP &&
          manager.kinds[arg] === KIND_APP &&
          manager.decls[lhsArg] !== manager.decls[arg]
        )
          return false;
        this.todo.push([lhsArg, arg]);
      }
    if (this.isAllArgsEq) return true;
    this.subst.reset();
    while (this.todo.length > 0) {
      const [left, right] = this.todo[this.todo.length - 1];
      if (manager.kinds[left] === KIND_VAR) {
        const bound = this.subst.find(manager.values[left], 0);
        if (bound !== undefined && bound.expr !== right) return false;
        if (bound === undefined)
          this.subst.insert(manager.values[left], 0, { expr: right, offset: 1 });
        this.todo.pop();
        continue;
      }
      if (manager.kinds[right] === KIND_VAR) return false;
      if (manager.kinds[left] === KIND_QUANTIFIER || manager.kinds[right] === KIND_QUANTIFIER)
        return false;
      if (manager.isGround(left) && !manager.isGround(right)) return false;
      if (left === right && manager.isGround(left)) {
        this.todo.pop();
        continue;
      }
      const pairKey = `${left},${right}`;
      if (this.cache.has(pairKey)) {
        this.todo.pop();
        continue;
      }
      if (left === right) {
        if (!this.bindToSelf(left)) return false;
        this.todo.pop();
        this.cache.add(pairKey);
        continue;
      }
      if (manager.decls[left] !== manager.decls[right]) return false;
      const numArgs = manager.getNumArgs(left);
      if (numArgs !== manager.getNumArgs(right)) return false;
      this.todo.pop();
      if (numArgs === 0) continue;
      this.cache.add(pairKey);
      if (this.fillCommutative(left, manager.getArgs(right))) continue;
      for (let index = numArgs; index > 0; index--)
        this.todo.push([manager.getArg(left, index - 1), manager.getArg(right, index - 1)]);
    }
    return true;
  }

  // The instance of the right side, held by the substitution or the rule, and -1 is no match.
  rewrite(lhs: number, rhs: number, args: number[]) {
    if (!this.matchArgs(lhs, args)) return -1;
    return this.isAllArgsEq ? rhs : this.subst.apply({ expr: rhs, offset: 0 });
  }

  private isInstance(pattern: number, term: number) {
    const manager = this.manager;
    this.cache.clear();
    this.todo = [];
    if (manager.kinds[pattern] === KIND_VAR) return true;
    return (
      manager.kinds[pattern] === KIND_APP &&
      manager.kinds[term] === KIND_APP &&
      manager.decls[pattern] === manager.decls[term] &&
      manager.getNumArgs(pattern) === manager.getNumArgs(term) &&
      this.matchArgs(pattern, manager.getArgs(term))
    );
  }

  canRewrite(expr: number, lhs: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const stack = [expr];
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (visited.has(current)) {
        stack.pop();
        continue;
      }
      if (manager.kinds[current] === KIND_VAR) {
        visited.add(current);
        stack.pop();
        continue;
      }
      if (manager.kinds[current] === KIND_QUANTIFIER) {
        const body = manager.getQuantifier(current).body;
        if (visited.has(body)) stack.pop();
        else stack.push(body);
        continue;
      }
      let isVisited = true;
      for (const arg of manager.getArgs(current)) {
        if (visited.has(arg)) continue;
        stack.push(arg);
        isVisited = false;
      }
      if (!isVisited) continue;
      if (this.isInstance(lhs, current)) return true;
      visited.add(current);
      stack.pop();
    }
    return false;
  }
}

class DemodulatorRewriter {
  private matchSubst: MatchSubstitution;
  private bsimp: Rewriter;
  // Keyed by Z3's declaration id, since a builtin has a declaration for each sort.
  private fwdIdx: ObjMap<ObjHashtable>;
  private fwdDeclHashes = new Map<number, number>();
  private backIdx: ObjMap<ObjHashtable>;
  private demodulators: ObjMap<Demodulator>;
  private todo: RefVector;
  private processed: ObjHashtable;
  private inProcessed: RefVector;
  private newArgs: RefVector;
  private rewriteTodo: RefVector;
  // array_map: reset only advances the timestamp, and a stale entry keeps its references until
  // its key is inserted again or the map is flushed.
  private rewriteCache = new Map<number, CacheEntry>();
  private timestamp = 0;
  private newExprs: RefVector;

  constructor(private manager: AstManager) {
    this.matchSubst = new MatchSubstitution(manager);
    this.bsimp = new Rewriter(manager, { ...TACTIC_REWRITER_OPTIONS, isEliminatingAnd: true });
    this.fwdIdx = new ObjMap((declId) => this.fwdDeclHashes.get(declId) as number);
    this.backIdx = new ObjMap((decl) => manager.getDeclHash(decl));
    this.demodulators = new ObjMap((expr) => manager.hashes[expr]);
    this.todo = new RefVector(manager);
    this.processed = new ObjHashtable((expr) => manager.hashes[expr]);
    this.inProcessed = new RefVector(manager);
    this.newArgs = new RefVector(manager);
    this.rewriteTodo = new RefVector(manager);
    this.newExprs = new RefVector(manager);
  }

  private getCached(expr: number) {
    const entry = this.rewriteCache.get(this.manager.ids[expr]);
    return entry !== undefined && entry.timestamp === this.timestamp ? entry : undefined;
  }

  private cache(expr: number, value: number, isDone: boolean) {
    const manager = this.manager;
    manager.incRef(expr);
    manager.incRef(value);
    const old = this.rewriteCache.get(manager.ids[expr]);
    if (old !== undefined) {
      manager.decRef(old.key);
      manager.decRef(old.value);
    }
    this.rewriteCache.set(manager.ids[expr], {
      key: expr,
      value,
      isDone,
      timestamp: this.timestamp,
    });
  }

  private insertFwdIdx(large: number, small: number, demodulator: number) {
    const manager = this.manager;
    const declId = manager.getDeclId(large);
    let demodulators = this.fwdIdx.get(declId);
    if (demodulators === undefined) {
      this.fwdDeclHashes.set(declId, manager.getAppDeclHash(large));
      demodulators = new ObjHashtable((expr) => manager.hashes[expr], 1);
      this.fwdIdx.set(declId, demodulators);
    }
    demodulators.add(demodulator);
    manager.incRef(demodulator);
    manager.incRef(large);
    manager.incRef(small);
    this.demodulators.set(demodulator, { large, small });
  }

  private removeFwdIdx(declId: number, demodulator: number) {
    const manager = this.manager;
    const demodulators = this.fwdIdx.get(declId);
    if (demodulators === undefined) return;
    const rule = this.demodulators.get(demodulator) as Demodulator;
    this.demodulators.delete(demodulator);
    demodulators.delete(demodulator);
    manager.decRef(rule.large);
    manager.decRef(rule.small);
    manager.decRef(demodulator);
  }

  // The instance is held by newExprs, and -1 is no rewrite.
  private rewriteStep(declId: number, args: number[]) {
    if (!this.fwdDeclHashes.has(declId)) return -1;
    const demodulators = this.fwdIdx.get(declId) as ObjHashtable;
    for (const demodulator of demodulators) {
      const rule = this.demodulators.get(demodulator) as Demodulator;
      if (this.manager.getNumArgs(rule.large) !== args.length) continue;
      const instance = this.matchSubst.rewrite(rule.large, rule.small, args);
      if (instance === -1) continue;
      this.newExprs.push(instance);
      return instance;
    }
    return -1;
  }

  private visitChildren(app: number) {
    let isVisited = true;
    for (const child of this.manager.getArgs(app)) {
      if (this.getCached(child)?.isDone === true) continue;
      if (this.rewriteTodo.items.includes(child)) {
        this.cache(child, child, true);
        continue;
      }
      this.rewriteTodo.push(child);
      isVisited = false;
    }
    return isVisited;
  }

  private rewriteApp(expr: number, app: number) {
    const manager = this.manager;
    if (!this.visitChildren(app)) return;
    const decl = manager.decls[app];
    this.newArgs.reset();
    let isUntouched = true;
    for (const child of manager.getArgs(app)) {
      const newChild = (this.getCached(child) as CacheEntry).value;
      if (newChild !== child) isUntouched = false;
      this.newArgs.push(newChild);
    }
    const instance = this.rewriteStep(manager.getDeclId(app), this.newArgs.items);
    if (instance !== -1) {
      this.cache(expr, instance, false);
      return;
    }
    if (isUntouched) this.cache(expr, app, true);
    else {
      const args = [...this.newArgs.items];
      const created =
        manager.funcDecls[decl].family === FAMILY_BASIC
          ? manager.withTemporaries(() => this.bsimp.mkBoolApp(decl, args, manager.sorts[app]))
          : manager.mkApp(decl, args, manager.sorts[app]);
      if (manager.funcDecls[decl].family !== FAMILY_BASIC) manager.incRef(created);
      this.cache(expr, created, true);
      manager.decRef(created);
    }
    this.rewriteTodo.pop();
  }

  private rewriteQuantifier(expr: number, quantifier: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const cached = this.getCached(data.body);
    if (cached === undefined) {
      this.rewriteTodo.push(data.body);
      return;
    }
    const updated =
      cached.value === data.body
        ? quantifier
        : manager.mkQuantifier({ ...data, body: cached.value });
    manager.incRef(updated);
    this.newExprs.push(updated);
    const eliminator = new UnusedVarsEliminator(manager);
    const eliminated = eliminator.apply(updated);
    eliminator.release();
    this.newExprs.push(eliminated);
    this.cache(expr, eliminated, true);
    this.rewriteTodo.pop();
    manager.decRef(eliminated);
    manager.decRef(updated);
  }

  // The result is held by the rewrite cache.
  private rewrite(root: number) {
    const manager = this.manager;
    if (this.fwdIdx.size === 0) return root;
    this.timestamp++;
    this.rewriteTodo.push(root);
    while (this.rewriteTodo.size > 0) {
      const expr = this.rewriteTodo.items[this.rewriteTodo.size - 1];
      const cached = this.getCached(expr);
      if (cached?.isDone === true) {
        this.rewriteTodo.pop();
        continue;
      }
      const actual = cached === undefined ? expr : cached.value;
      manager.incRef(actual);
      if (manager.kinds[actual] === KIND_VAR) {
        this.cache(expr, actual, true);
        this.rewriteTodo.pop();
      } else if (manager.kinds[actual] === KIND_APP) this.rewriteApp(expr, actual);
      else this.rewriteQuantifier(expr, actual);
      manager.decRef(actual);
    }
    return (this.getCached(root) as CacheEntry).value;
  }

  private insertBwdIdx(expr: number) {
    const manager = this.manager;
    forEachSubterm(manager, expr, (term) => {
      if (manager.kinds[term] !== KIND_APP || manager.getNumArgs(term) === 0) return;
      const decl = manager.decls[term];
      if (manager.funcDecls[decl].family !== FAMILY_USER) return;
      let exprs = this.backIdx.get(decl);
      if (exprs === undefined) {
        exprs = new ObjHashtable((key) => manager.hashes[key]);
        this.backIdx.set(decl, exprs);
      }
      exprs.add(expr);
    });
  }

  private removeBwdIdx(expr: number) {
    const manager = this.manager;
    forEachSubterm(manager, expr, (term) => {
      if (manager.kinds[term] !== KIND_APP || manager.getNumArgs(term) === 0) return;
      const decl = manager.decls[term];
      if (manager.funcDecls[decl].family !== FAMILY_USER) return;
      this.backIdx.get(decl)?.delete(expr);
    });
  }

  private rescheduleProcessed(decl: number) {
    const manager = this.manager;
    const exprs = this.backIdx.get(decl);
    if (exprs === undefined) return;
    const rescheduled = new ObjHashtable((key) => manager.hashes[key]);
    for (const expr of exprs) if (this.processed.has(expr)) rescheduled.add(expr);
    for (const expr of rescheduled) {
      this.processed.delete(expr);
      this.removeBwdIdx(expr);
      this.todo.push(expr);
    }
  }

  private rescheduleDemodulators(decl: number, lhs: number) {
    const manager = this.manager;
    const exprs = this.backIdx.get(decl);
    if (exprs === undefined) return;
    const occurrences = new ObjHashtable((key) => manager.hashes[key]);
    for (const expr of exprs) occurrences.add(expr);
    // The left side of the last rule stays referenced until the end, as Z3's l.
    let large = -1;
    for (const occurrence of occurrences) {
      if (manager.kinds[occurrence] !== KIND_QUANTIFIER) continue;
      const rule = this.demodulators.get(occurrence);
      if (rule === undefined) continue;
      manager.incRef(rule.large);
      if (large !== -1) manager.decRef(large);
      large = rule.large;
      manager.incRef(occurrence);
      if (this.matchSubst.canRewrite(occurrence, lhs)) {
        this.removeFwdIdx(manager.getDeclId(large), occurrence);
        this.removeBwdIdx(occurrence);
        this.todo.push(occurrence);
      }
      manager.decRef(occurrence);
    }
    if (large !== -1) manager.decRef(large);
  }

  apply(exprs: number[], newExprs: RefVector) {
    const manager = this.manager;
    for (const expr of exprs) this.todo.push(expr);
    while (this.todo.size > 0) {
      const current = this.todo.items[this.todo.size - 1];
      manager.incRef(current);
      this.todo.pop();
      const rewritten = this.rewrite(current);
      manager.incRef(rewritten);
      const demodulator = getDemodulator(manager, rewritten);
      if (demodulator === undefined) {
        this.processed.add(rewritten);
        this.inProcessed.push(rewritten);
        this.insertBwdIdx(rewritten);
      } else {
        const decl = manager.decls[demodulator.large];
        this.rescheduleProcessed(decl);
        this.rescheduleDemodulators(decl, demodulator.large);
        this.insertFwdIdx(demodulator.large, demodulator.small, rewritten);
        this.insertBwdIdx(rewritten);
        manager.decRef(demodulator.small);
        manager.decRef(demodulator.large);
      }
      manager.decRef(rewritten);
      manager.decRef(current);
    }
    for (const expr of this.processed) newExprs.push(expr);
    for (const [, demodulators] of this.fwdIdx.entries())
      for (const demodulator of demodulators) newExprs.push(demodulator);
  }

  release() {
    const manager = this.manager;
    for (const [demodulator, rule] of this.demodulators.entries()) {
      manager.decRef(demodulator);
      manager.decRef(rule.large);
      manager.decRef(rule.small);
    }
    this.newExprs.reset();
    for (const id of [...this.rewriteCache.keys()].toSorted((left, right) => left - right)) {
      const entry = this.rewriteCache.get(id) as CacheEntry;
      manager.decRef(entry.key);
      manager.decRef(entry.value);
    }
    this.rewriteCache.clear();
    this.newArgs.reset();
    this.inProcessed.reset();
    this.bsimp.release();
    this.matchSubst.subst.release();
  }
}

export const rewriteUfbv = (manager: AstManager, goal: Goal) => {
  if (goal.isCoresEnabled)
    throw new SmtTacticError("ufbv-rewriter does not support unsat core production");
  if (goal.isProofsEnabled) return;
  const demodulator = new DemodulatorRewriter(manager);
  const forms = new RefVector(manager);
  const newForms = new RefVector(manager);
  for (const form of goal.forms.items) forms.push(form);
  demodulator.apply(forms.items, newForms);
  goal.reset();
  for (const form of newForms.items) goal.assert(form);
  goal.depth++;
  newForms.reset();
  forms.reset();
  demodulator.release();
};
