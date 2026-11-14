// Ported from Z3 (src/smt/theory_seq.cpp, src/smt/seq_eq_solver.cpp, src/smt/seq_ne_solver.cpp),
// MIT license, see z3-license.txt.
import {
  OP_ADD,
  OP_EQ,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_SEQ_AT,
  OP_SEQ_CONTAINS,
  OP_SEQ_EXTRACT,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_INDEX,
  OP_SEQ_LAST_INDEX,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH_I,
  OP_SEQ_POWER,
  OP_SEQ_PREFIX,
  OP_SEQ_SUFFIX,
  OP_SEQ_UNIT,
  SORT_BOOL,
} from "./ast";
import type { Enode } from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { FALSE_LITERAL, type Literal, negate } from "./literal";
import { type Dependency, mkJoin } from "./lp/dependency";
import { Rational } from "./rational";
import { getMinLengthOf } from "./seq-axioms";
import { getConcat, mkSeqApp } from "./seq-decl-plugin";
import type { EqPair } from "./seq-rewriter";
import { type DecomposedEq, type DepEq, type Ne, TheorySeqState } from "./theory-seq-state";

export interface DepState {
  dep: Dependency;
  isChanged: boolean;
}

interface Cell {
  parent: Cell | undefined;
  expr: number;
  dep: Dependency;
  last: number;
}

const isSameList = (first: readonly number[], second: readonly number[]) =>
  first.length === second.length && first.every((expr, index) => expr === second[index]);

export abstract class TheorySeqSolve extends TheorySeqState {
  protected canonize(expr: number, state: DepState) {
    const expanded = this.expand(expr, state);
    return expanded === undefined ? undefined : this.rewrite(expanded);
  }

  private canonizeInto(input: number, result: number[], state: DepState): boolean {
    const manager = this.manager;
    let expr = input;
    for (;;) {
      if (this.isConcat(expr)) {
        if (!this.canonizeInto(manager.getArg(expr, 0), result, state)) return false;
        expr = manager.getArg(expr, 1);
        state.isChanged = true;
        continue;
      }
      if (this.isEmpty(expr)) {
        state.isChanged = true;
        return true;
      }
      const expanded = this.expand(expr, state);
      if (expanded === undefined) return false;
      if (expanded !== expr) state.isChanged = true;
      getConcat(manager, expanded, result);
      return true;
    }
  }

  protected canonizeList(exprs: readonly number[], result: number[], state: DepState) {
    return exprs.every((expr) => this.canonizeInto(expr, result, state));
  }

  private expand(input: number, state: DepState) {
    const todo = this.expandTodo;
    const size = todo.length;
    todo.push(input);
    let result: number | undefined;
    while (todo.length !== size) {
      const expanded = this.expand1(todo[todo.length - 1], state);
      if (expanded === false) return undefined;
      result = expanded;
      if (result !== undefined) todo.pop();
    }
    return result;
  }

  private tryExpand(expr: number, state: DepState) {
    const cached = this.rep.findCache(expr);
    if (cached === undefined) {
      this.expandTodo.push(expr);
      return undefined;
    }
    if (expr !== cached.expr) state.dep = mkJoin(state.dep, cached.dep);
    return cached.expr;
  }

  private expand1(original: number, outer: DepState): number | undefined | false {
    const manager = this.manager;
    const cached = this.tryExpand(original, outer);
    if (cached !== undefined) return cached;
    const found = this.rep.findWithDep(original);
    const expr = found.expr;
    const state: DepState = { dep: found.dep, isChanged: false };
    const op = manager.getOp(expr);
    const numArgs = manager.getNumArgs(expr);
    const expandArgs = (indexes: number[]) => {
      const args = manager.getArgs(expr).slice();
      let isComplete = true;
      for (const index of indexes) {
        const expanded = this.tryExpand(args[index], state);
        if (expanded === undefined) isComplete = false;
        else args[index] = expanded;
      }
      return isComplete ? args : undefined;
    };
    const rebuild = (indexes: number[], isRewriting = false) => {
      const args = expandArgs(indexes);
      if (args === undefined) return undefined;
      const rebuilt = manager.mkApp(manager.decls[expr], args, manager.sorts[expr]);
      return isRewriting ? this.context.rewriter.rewrite(rebuilt) : rebuilt;
    };
    let result: number | undefined;
    if (this.isConcat(expr)) {
      const args = expandArgs([0, 1]);
      if (args === undefined) return undefined;
      result = this.mkConcat2(args[0], args[1]);
    } else if (this.isEmpty(expr) || this.isString(expr)) result = expr;
    else if (op === OP_SEQ_PREFIX || op === OP_SEQ_SUFFIX || op === OP_SEQ_CONTAINS) {
      result = rebuild([0, 1]);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_UNIT) {
      result = rebuild([0]);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_INDEX && (numArgs === 2 || numArgs === 3)) {
      const args = expandArgs([0, 1]);
      if (args === undefined) return undefined;
      result = mkSeqApp(manager, OP_SEQ_INDEX, [
        args[0],
        args[1],
        numArgs === 2 ? this.mkInt(0) : args[2],
      ]);
    } else if (op === OP_SEQ_POWER) {
      result = rebuild([0], true);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_MAP) {
      result = rebuild([1], true);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_MAPI || op === OP_SEQ_FOLDL) {
      result = rebuild([2], true);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_FOLDLI) {
      result = rebuild([3], true);
      if (result === undefined) return undefined;
    } else if (op === OP_SEQ_LAST_INDEX) {
      result = rebuild([0, 1]);
      if (result === undefined) return undefined;
    } else if (op === OP_ITE) {
      const literal = this.mkLiteralOf(manager.getArg(expr, 0));
      const value = this.context.getAssignment(literal);
      if (value === L_UNDEF) {
        this.context.markLiteralAsRelevant(literal);
        this.isNewPropagation = true;
        return false;
      }
      state.dep = this.mkJoinLiteral(state.dep, value === L_TRUE ? literal : negate(literal));
      result = this.tryExpand(manager.getArg(expr, value === L_TRUE ? 1 : 2), state);
      if (result === undefined) return undefined;
    } else result = expr;
    const dep = result === original ? null : state.dep;
    this.rep.addCache(this.keep(original), this.keep(result), dep);
    outer.dep = mkJoin(outer.dep, dep);
    return result;
  }

  protected solveEqs(start: number) {
    let isChanged = false;
    for (let index = start; !this.context.isInconsistent() && index < this.eqs.size; index++) {
      if (this.solveEq(index)) {
        this.eqs.eraseAndSwap(index--);
        isChanged = true;
      }
    }
    return isChanged || this.isNewPropagation || this.context.isInconsistent();
  }

  private solveEq(index: number) {
    const context = this.context;
    const eq = this.eqs.items[index];
    const ls: number[] = [];
    const rs: number[] = [];
    const state: DepState = { dep: null, isChanged: false };
    if (!this.canonizeList(eq.ls, ls, state)) return false;
    if (!this.canonizeList(eq.rs, rs, state)) return false;
    const deps = mkJoin(state.dep, eq.dep);
    const pair = { left: ls, right: rs };
    if (!context.isInconsistent() && this.simplifyEq(pair, deps)) return true;
    if (!context.isInconsistent() && this.liftIte(pair.left, pair.right, deps)) return true;
    this.eqDeps = deps;
    if (!context.isInconsistent() && this.eqSolver.reduce(pair.left, pair.right)) return true;
    if (!context.isInconsistent() && this.solveNthEq(pair.left, pair.right, deps)) return true;
    if (!context.isInconsistent() && this.solveNthEq(pair.right, pair.left, deps)) return true;
    if (!context.isInconsistent() && state.isChanged)
      this.eqs.set(index, this.mkDepEq(this.eqId++, pair.left, pair.right, deps));
    return false;
  }

  private simplifyEq(pair: { left: number[]; right: number[] }, deps: Dependency) {
    const context = this.context;
    const newEqs: EqPair[] = [];
    const isChanged = this.seqRewriter.reduceEqOf(pair, newEqs);
    if (isChanged === undefined) {
      this.setConflict(deps);
      return true;
    }
    if (!isChanged) return false;
    this.seqRewriter.addSeqs(pair.left, pair.right, newEqs);
    for (const newEq of newEqs) {
      if (context.isInconsistent()) break;
      this.eqDeps = deps;
      if (this.eqSolver.reduce([newEq.left], [newEq.right])) continue;
      if (this.isSeq(newEq.left) || this.isRe(newEq.left))
        this.eqs.push(this.mkEqDep(newEq.left, newEq.right, deps));
      else
        this.propagateEqNodes(
          deps,
          this.ensureEnodeOf(newEq.left),
          this.ensureEnodeOf(newEq.right),
        );
    }
    return true;
  }

  private liftIte(ls: readonly number[], rs: readonly number[], deps: Dependency) {
    if (ls.length !== 1 || rs.length !== 1) return false;
    const manager = this.manager;
    const isRightIte = this.isOp(rs[0], OP_ITE);
    const left = isRightIte ? rs[0] : ls[0];
    const right = isRightIte ? ls[0] : rs[0];
    if (!this.isOp(left, OP_ITE)) return false;
    const condition = manager.getArg(left, 0);
    const value = this.context.findAssignment(condition);
    if (value === L_UNDEF) return false;
    const literal = this.context.getLiteral(condition);
    const dep = this.mkJoinLiteral(deps, value === L_TRUE ? literal : negate(literal));
    this.eqs.push(this.mkEqDep(manager.getArg(left, value === L_TRUE ? 1 : 2), right, dep));
    return true;
  }

  private solveNthEq(ls: readonly number[], rs: readonly number[], deps: Dependency) {
    const manager = this.manager;
    if (ls.length !== 1 || !this.isOp(ls[0], OP_SEQ_NTH_I)) return false;
    const seq = manager.getArg(ls[0], 0);
    const index = manager.getArg(ls[0], 1);
    const rhs = this.mkConcat(rs, manager.sorts[ls[0]]);
    if (rs.every((expr) => this.isUnit(expr) || this.isString(expr)))
      return this.addSolution(ls[0], rhs, deps);
    const isIndexZero = manager.getNumeral(index) === 0n;
    const nextIndex = this.rewrite(this.mkArith(OP_ADD, [index, this.mkInt(1)]));
    const key = `${rhs},${ls[0]}`;
    if (this.nthEq2Cache.has(key)) return false;
    this.keep(rhs);
    this.nthEq2Cache.add(key);
    this.trailStack.push(() => {
      this.nthEq2Cache.delete(key);
    });
    const rs1: number[] = [];
    if (!isIndexZero) rs1.push(this.sk.mkPre(seq, index));
    rs1.push(mkSeqApp(manager, OP_SEQ_UNIT, [rhs]));
    rs1.push(this.sk.mkPost(seq, nextIndex));
    this.eqs.push(this.mkDepEq(this.eqId++, [seq], rs1, deps));
    return true;
  }

  private getLengthOf(expr: number, literals: Literal[]) {
    const manager = this.manager;
    const context = this.context;
    const op = manager.getOp(expr);
    const isTrue = (literal: Literal) => context.getAssignment(literal) === L_TRUE;
    const isZero = (index: number) => manager.getNumeral(index) === 0n;
    if (op === OP_SEQ_EXTRACT) {
      const [seq, index, length] = manager.getArgs(expr);
      const seqLength = this.mkLen(seq);
      const rest = this.mkSub(this.mkSub(seqLength, index), length);
      const antecedents = [
        isZero(index) ? undefined : this.mkGeLiteral(index, 0),
        negate(this.mkGeLiteral(this.mkSub(index, seqLength), 0)),
        this.mkGeLiteral(rest, 0),
        this.mkGeLiteral(length, 0),
      ];
      if (!antecedents.every((literal) => literal === undefined || isTrue(literal)))
        return undefined;
      for (const literal of antecedents) if (literal !== undefined) literals.push(literal);
      return length;
    }
    if (op === OP_SEQ_AT || this.sk.isPre(expr)) {
      const seq = manager.getArg(expr, 0);
      const index = manager.getArg(expr, 1);
      const antecedents = [
        isZero(index) ? undefined : this.mkGeLiteral(index, 0),
        negate(this.mkGeLiteral(this.mkSub(index, this.mkLen(seq)), 0)),
      ];
      if (!antecedents.every((literal) => literal === undefined || isTrue(literal)))
        return undefined;
      for (const literal of antecedents) if (literal !== undefined) literals.push(literal);
      return op === OP_SEQ_AT ? this.mkInt(1) : index;
    }
    if (this.sk.isPost(expr)) {
      const seq = manager.getArg(expr, 0);
      const index = manager.getArg(expr, 1);
      const isIndexNonNegative = this.mkGeLiteral(index, 0);
      const isWithin = this.mkGeLiteral(this.mkSub(this.mkLen(seq), index), 0);
      if (!isTrue(isIndexNonNegative) || !isTrue(isWithin)) return undefined;
      literals.push(isIndexNonNegative, isWithin);
      return this.mkSub(this.mkLen(seq), index);
    }
    if (this.sk.isTail(expr)) {
      const seq = manager.getArg(expr, 0);
      const index = manager.getArg(expr, 1);
      const seqLength = this.mkLen(seq);
      const isLonger = this.mkGeLiteral(this.mkSub(seqLength, index), 1);
      const value = context.getAssignment(isLonger);
      if (value === L_TRUE) {
        literals.push(isLonger);
        return this.mkSub(this.mkSub(seqLength, index), this.mkInt(1));
      }
      if (value === L_FALSE) {
        literals.push(negate(isLonger));
        return this.mkInt(0);
      }
      return undefined;
    }
    if (op === OP_SEQ_UNIT) return this.mkInt(1);
    return undefined;
  }

  private reduceLength(left: number, right: number) {
    const literals: Literal[] = [];
    const leftLength = this.getLengthOf(left, literals);
    if (leftLength === undefined) return undefined;
    const rightLength = this.getLengthOf(right, literals);
    return rightLength !== undefined && leftLength === rightLength ? literals : undefined;
  }

  protected reduceLengthEqOf(ls: readonly number[], rs: readonly number[], inputDeps: Dependency) {
    if (ls.length === 0 || rs.length === 0) return false;
    if (ls.length <= 1 && rs.length <= 1) return false;
    const front = this.reduceLength(ls[0], rs[0]);
    if (front !== undefined) {
      const deps = this.mkJoinLiterals(inputDeps, front);
      this.eqs.push(this.mkDepEq(this.eqId++, ls.slice(1), rs.slice(1), deps));
      this.propagateEq(deps, front, ls[0], rs[0], true);
      return true;
    }
    const back = this.reduceLength(ls.at(-1)!, rs.at(-1)!);
    if (back !== undefined) {
      const deps = this.mkJoinLiterals(inputDeps, back);
      this.eqs.push(this.mkDepEq(this.eqId++, ls.slice(0, -1), rs.slice(0, -1), deps));
      this.propagateEq(deps, back, ls.at(-1)!, rs.at(-1)!, true);
      return true;
    }
    const getLength = (expr: number) => this.getLengthValue(expr);
    const sumFront = (first: number, others: readonly number[], isStrict: boolean) => {
      const firstLength = getLength(first);
      if (firstLength === undefined) return undefined;
      let total = getLength(others[0]);
      if (total === undefined) return undefined;
      if (isStrict ? firstLength.compare(total) <= 0 : firstLength.compare(total) < 0)
        return undefined;
      let index = 1;
      for (; index < others.length && firstLength.compare(total) > 0; index++) {
        const length = getLength(others[index]);
        if (length === undefined) break;
        total = total.add(length);
      }
      return firstLength.equals(total) ? index : undefined;
    };
    if (ls.length > 1) {
      const index = sumFront(ls[0], rs, false);
      if (
        index !== undefined &&
        index < rs.length &&
        this.reduceLengthAt(1, index, true, ls, rs, inputDeps)
      )
        return true;
    }
    if (rs.length > 1) {
      const index = sumFront(rs[0], ls, true);
      if (
        index !== undefined &&
        index < ls.length &&
        this.reduceLengthAt(index, 1, true, ls, rs, inputDeps)
      )
        return true;
    }
    const sumBack = (first: number, others: readonly number[], isStrict: boolean) => {
      const firstLength = getLength(first);
      if (firstLength === undefined) return undefined;
      let total = getLength(others.at(-1)!);
      if (total === undefined) return undefined;
      if (isStrict ? firstLength.compare(total) <= 0 : firstLength.compare(total) < 0)
        return undefined;
      let index = others.length - 1;
      for (; index > 0 && firstLength.compare(total) > 0; index--) {
        const length = getLength(others[index - 1]);
        if (length === undefined) break;
        total = total.add(length);
      }
      return firstLength.equals(total) && index > 0 ? index : undefined;
    };
    if (ls.length > 1) {
      const index = sumBack(ls.at(-1)!, rs, false);
      if (
        index !== undefined &&
        index < rs.length &&
        this.reduceLengthAt(ls.length - 1, rs.length - index, false, ls, rs, inputDeps)
      )
        return true;
    }
    if (rs.length > 1) {
      const index = sumBack(rs.at(-1)!, ls, true);
      if (
        index !== undefined &&
        index < ls.length &&
        this.reduceLengthAt(ls.length - index, rs.length - 1, false, ls, rs, inputDeps)
      )
        return true;
    }
    return false;
  }

  private reduceLengthAt(
    leftIndex: number,
    rightIndex: number,
    isFront: boolean,
    ls: readonly number[],
    rs: readonly number[],
    inputDeps: Dependency,
  ) {
    const context = this.context;
    const ls1 = isFront ? ls.slice(0, leftIndex) : ls.slice(leftIndex);
    const ls2 = isFront ? ls.slice(leftIndex) : ls.slice(0, leftIndex);
    const rs1 = isFront ? rs.slice(0, rightIndex) : rs.slice(rightIndex);
    const rs2 = isFront ? rs.slice(rightIndex) : rs.slice(0, rightIndex);
    const sort = this.manager.sorts[ls[0]];
    const left = this.mkConcat(ls1, sort);
    const right = this.mkConcat(rs1, sort);
    const literal = this.mkEqLiteral(this.mkLen(left), this.mkLen(right), false);
    context.markLiteralAsRelevant(literal);
    if (context.getAssignment(literal) !== L_TRUE) return false;
    for (const eq of this.eqs.items)
      if (isSameList(eq.ls, ls2) && isSameList(eq.rs, rs2)) return false;
    const deps = this.mkJoinLiteral(inputDeps, literal);
    this.eqs.push(this.mkDepEq(++this.eqId, ls2, rs2, deps));
    this.propagateEq(deps, [], left, right, true);
    return true;
  }

  protected solveNqs(start: number) {
    for (let index = start; !this.context.isInconsistent() && index < this.nqs.size; index++)
      if (this.solveNe(index)) this.nqs.eraseAndSwap(index--);
    return this.isNewPropagation || this.context.isInconsistent();
  }

  private solveNe(index: number) {
    const ne = this.nqs.items[index];
    let numUndef = 0;
    for (const literal of ne.literals) {
      const value = this.context.getAssignment(literal);
      if (value === L_FALSE) return true;
      if (value === L_UNDEF) numUndef++;
    }
    return (
      (numUndef <= 1 && this.propagateNe2Lit(index)) ||
      (numUndef === 0 && this.propagateNe2Eq(index)) ||
      this.reduceNe(index)
    );
  }

  private propagateNe2Lit(index: number) {
    const context = this.context;
    const ne = this.nqs.items[index];
    if (ne.eqs.length > 0) return false;
    const literals: Literal[] = [];
    let undefLiteral: Literal | undefined;
    for (const literal of ne.literals) {
      const value = context.getAssignment(literal);
      if (value === L_TRUE) literals.push(literal);
      else if (value === L_FALSE) return true;
      else {
        if (undefLiteral !== undefined) return false;
        undefLiteral = literal;
      }
    }
    if (undefLiteral !== undefined) {
      this.propagateLit(ne.dep, literals, negate(undefLiteral));
      return true;
    }
    const explanation = this.explainEq(ne.left, ne.right);
    if (explanation !== undefined) {
      const diseq = this.mkEqLiteral(ne.left, ne.right, false);
      if (context.getAssignment(diseq) === L_FALSE) {
        this.setConflict(explanation, [negate(diseq)]);
        return true;
      }
    }
    this.setConflict(ne.dep, literals);
    return true;
  }

  private propagateNe2Eq(index: number) {
    const ne = this.nqs.items[index];
    if (ne.eqs.length !== 1) return false;
    const eq = ne.eqs[0];
    if (eq.ls.length === 0) return this.propagateNe2EqOf(ne, eq.rs);
    if (eq.rs.length === 0) return this.propagateNe2EqOf(ne, eq.ls);
    return false;
  }

  private propagateNe2EqOf(ne: Ne, exprs: readonly number[]) {
    if (exprs.length === 0) return false;
    for (const expr of exprs) {
      const lower = this.lowerBound(this.mkLen(expr));
      if (lower !== undefined && lower.isPositive()) return true;
    }
    const expr = this.mkConcat(exprs);
    const decomposition = this.decompose(expr);
    this.propagateEq(
      ne.dep,
      ne.literals,
      expr,
      this.mkConcat2(decomposition.head, decomposition.tail),
      true,
    );
    return true;
  }

  private reduceNe(index: number) {
    const context = this.context;
    const ne = this.nqs.items[index];
    let isUpdated = false;
    let newDeps = ne.dep;
    const newEqs: DecomposedEq[] = [];
    const newLiterals = [...ne.literals];
    for (let eqIndex = 0; eqIndex < ne.eqs.length; eqIndex++) {
      const eq = ne.eqs[eqIndex];
      const pair = { left: [] as number[], right: [] as number[] };
      const state: DepState = { dep: null, isChanged: false };
      if (!this.canonizeList(eq.ls, pair.left, state)) return false;
      if (!this.canonizeList(eq.rs, pair.right, state)) return false;
      newDeps = mkJoin(state.dep, newDeps);
      const eqs: EqPair[] = [];
      const isChanged = this.seqRewriter.reduceEqOf(pair, eqs);
      if (isChanged === undefined) return true;
      if (!isChanged) {
        if (isUpdated) newEqs.push(eq);
        continue;
      }
      if (!isUpdated) {
        for (let previous = 0; previous < eqIndex; previous++) newEqs.push(ne.eqs[previous]);
        isUpdated = true;
      }
      if (pair.left.length > 0 || pair.right.length > 0)
        newEqs.push({
          ls: pair.left.map((expr) => this.keep(expr)),
          rs: pair.right.map((expr) => this.keep(expr)),
        });
      for (const newEq of eqs) {
        if (this.isSeq(newEq.left) || this.isRe(newEq.left)) {
          const ls = this.getConcatUnits(newEq.left, []).map((expr) => this.keep(expr));
          const rs = this.getConcatUnits(newEq.right, []).map((expr) => this.keep(expr));
          newEqs.push({ ls, rs });
        } else if (newEq.left !== newEq.right) {
          const literal = this.mkEqLiteral(newEq.left, newEq.right, false);
          context.markLiteralAsRelevant(literal);
          newLiterals.push(literal);
          const value = context.getAssignment(literal);
          if (value === L_FALSE) return true;
          if (value === L_UNDEF) this.isNewPropagation = true;
        }
      }
    }
    if (isUpdated)
      this.nqs.set(index, {
        left: ne.left,
        right: ne.right,
        eqs: newEqs,
        literals: newLiterals,
        dep: newDeps,
      });
    return false;
  }

  protected branchNqs() {
    for (let index = 0; index < this.nqs.size; index++) {
      const result = this.branchNq(this.nqs.items[index]);
      if (result === L_UNDEF) return true;
      this.nqs.eraseAndSwap(index--);
      if (result === L_FALSE) return true;
    }
    return false;
  }

  private branchNq(ne: Ne) {
    const context = this.context;
    const isLengthEqual = this.mkEqLiteral(this.mkLen(ne.left), this.mkLen(ne.right), false);
    context.markLiteralAsRelevant(isLengthEqual);
    const lengthValue = context.getAssignment(isLengthEqual);
    if (lengthValue === L_FALSE) return L_TRUE;
    if (lengthValue === L_UNDEF) return L_UNDEF;
    const eq = this.mkEqLiteral(ne.left, ne.right, false);
    const isNonEmpty = this.mkLiteralOf(this.mkArith(OP_GE, [this.mkLen(ne.left), this.mkInt(1)]));
    context.markLiteralAsRelevant(isNonEmpty);
    const nonEmptyValue = context.getAssignment(isNonEmpty);
    if (nonEmptyValue === L_FALSE) {
      this.addAxiomOf(eq, negate(isLengthEqual), isNonEmpty);
      return L_FALSE;
    }
    if (nonEmptyValue === L_UNDEF) return L_UNDEF;
    const first = this.mkDecompose(ne.left);
    const second = this.mkDecompose(ne.right);
    const isHeadEqual = this.mkEqLiteral(first.head, second.head, false);
    context.markLiteralAsRelevant(isHeadEqual);
    const headValue = context.getAssignment(isHeadEqual);
    if (headValue === L_FALSE) return L_TRUE;
    if (headValue === L_UNDEF) return L_UNDEF;
    this.addAxiomOf(eq, negate(isLengthEqual), isNonEmpty);
    this.addAxiomOf(
      eq,
      negate(isLengthEqual),
      negate(isHeadEqual),
      negate(this.mkEqLiteral(first.tail, second.tail, false)),
    );
    return L_FALSE;
  }

  private unfold(cell: Cell, cells: Cell[]) {
    const manager = this.manager;
    const found = this.rep.find1(cell.expr);
    if (found !== undefined) {
      this.unfold(
        { parent: cell, expr: found.expr, dep: mkJoin(found.dep, cell.dep), last: 0 },
        cells,
      );
    } else if (this.isConcat(cell.expr)) {
      this.unfold(
        { parent: cell, expr: manager.getArg(cell.expr, 0), dep: cell.dep, last: 0 },
        cells,
      );
      this.unfold(
        { parent: undefined, expr: manager.getArg(cell.expr, 1), dep: null, last: 0 },
        cells,
      );
    } else cells.push(cell);
    cell.last = cells.length - 1;
  }

  private explainEq(firstExpr: number, secondExpr: number, inputDep: Dependency = null) {
    if (firstExpr === secondExpr) return inputDep;
    const manager = this.manager;
    let dep = inputDep;
    const firstCells: Cell[] = [];
    const secondCells: Cell[] = [];
    this.unfold({ parent: undefined, expr: firstExpr, dep: null, last: 0 }, firstCells);
    this.unfold({ parent: undefined, expr: secondExpr, dep: null, last: 0 }, secondCells);
    let first = 0;
    let second = 0;
    while (first < firstCells.length || second < secondCells.length) {
      if (first === firstCells.length) {
        while (second < secondCells.length && this.isEmpty(secondCells[second].expr))
          dep = mkJoin(dep, secondCells[second++].dep);
        return second === secondCells.length ? dep : undefined;
      }
      if (second === secondCells.length) {
        while (first < firstCells.length && this.isEmpty(firstCells[first].expr))
          dep = mkJoin(dep, firstCells[first++].dep);
        return first === firstCells.length ? dep : undefined;
      }
      let firstCell = firstCells[first];
      let secondCell = secondCells[second];
      const left = firstCell.expr;
      const right = secondCell.expr;
      if (left === right) {
        if (
          firstCell.parent !== undefined &&
          secondCell.parent !== undefined &&
          firstCell.parent.expr === secondCell.parent.expr
        ) {
          firstCell = firstCell.parent;
          secondCell = secondCell.parent;
          firstCells[firstCell.last] = firstCell;
          first = firstCell.last;
          secondCells[secondCell.last] = secondCell;
          second = secondCell.last;
        } else {
          dep = mkJoin(mkJoin(dep, firstCell.dep), secondCell.dep);
          first++;
          second++;
        }
      } else if (this.isEmpty(left)) {
        dep = mkJoin(dep, firstCell.dep);
        first++;
      } else if (this.isEmpty(right)) {
        dep = mkJoin(dep, secondCell.dep);
        second++;
      } else if (this.isUnit(left) && this.isUnit(right)) {
        const explained = this.explainEq(manager.getArg(left, 0), manager.getArg(right, 0), dep);
        if (explained === undefined) return undefined;
        dep = explained;
        first++;
        second++;
      } else return undefined;
    }
    return dep;
  }

  protected isComplex(eq: DepEq) {
    const numLeftVars = eq.ls.filter((expr) => this.isVar(expr)).length;
    const numRightVars = eq.rs.filter((expr) => this.isVar(expr)).length;
    return numLeftVars > 0 && numRightVars > 0 && numLeftVars + numRightVars > 2;
  }

  protected enforceLength(exprs: readonly number[], lengths: Rational[]) {
    const manager = this.manager;
    let isAllKnown = true;
    for (const expr of exprs) {
      const chars = manager.getString(expr);
      const value = this.isUnit(expr)
        ? Rational.one
        : this.isEmpty(expr)
          ? Rational.zero
          : chars !== undefined
            ? Rational.of(BigInt(chars.length))
            : this.getLengthValue(expr);
      if (value !== undefined) lengths.push(value);
      else {
        this.addLengthToEqc(expr);
        isAllKnown = false;
      }
    }
    return isAllKnown;
  }

  protected branchVariable() {
    if (this.branchTernaryVariable()) return true;
    if (this.branchQuatVariable()) return true;
    let isTurn = this.context.getRandomValue() % 2 === 0;
    for (let index = 0; index < 2; index++, isTurn = !isTurn) {
      if (isTurn && this.branchVariableMb()) return true;
      if (!isTurn && this.branchVariableEq()) return true;
    }
    return false;
  }

  private branchVariableMb() {
    let isChanged = false;
    const size = this.eqs.size;
    const start = this.context.getRandomValue();
    for (let index = 0; index < size; index++) {
      const eq = this.eqs.items[(index + start) % size];
      if (!this.isComplex(eq)) continue;
      if (
        eq.ls.length === 0 ||
        eq.rs.length === 0 ||
        (!this.isVar(eq.ls[0]) && !this.isVar(eq.rs[0]))
      )
        continue;
      const leftLengths: Rational[] = [];
      const rightLengths: Rational[] = [];
      if (!this.enforceLength(eq.ls, leftLengths) || !this.enforceLength(eq.rs, rightLengths))
        continue;
      const leftTotal = leftLengths.reduce((sum, length) => sum.add(length), Rational.zero);
      const rightTotal = rightLengths.reduce((sum, length) => sum.add(length), Rational.zero);
      if (
        leftTotal.equals(rightTotal) &&
        this.splitLengths(eq.dep, eq.ls, eq.rs, leftLengths, rightLengths)
      ) {
        isChanged = true;
        break;
      }
      const left = this.mkConcat(eq.ls);
      const right = this.mkConcat(eq.rs);
      if (this.propagateEq(eq.dep, [], this.mkLen(left), this.mkLen(right), false))
        isChanged = true;
    }
    return isChanged;
  }

  private splitLengths(
    dep: Dependency,
    ls: readonly number[],
    rs: readonly number[],
    leftLengths: readonly Rational[],
    rightLengths: readonly Rational[],
  ): boolean {
    const context = this.context;
    if (ls.length === 0 || rs.length === 0) return false;
    if (this.isVar(ls[0]) && leftLengths[0].isZero()) return this.setEmpty(ls[0]);
    if (this.isVar(rs[0]) && rightLengths[0].isZero()) return this.setEmpty(rs[0]);
    if (this.isVar(rs[0]) && !this.isVar(ls[0]))
      return this.splitLengths(dep, rs, ls, rightLengths, leftLengths);
    if (!this.isVar(ls[0])) return false;
    const variable = ls[0];
    const variableLength = leftLengths[0];
    const bs: number[] = [];
    let prefixLength = Rational.zero;
    let lastLength = Rational.zero;
    for (let index = 0; variableLength.compare(prefixLength) > 0 && index < rs.length; index++) {
      bs.push(rs[index]);
      lastLength = rightLengths[index];
      prefixLength = prefixLength.add(lastLength);
    }
    const last = bs.pop()!;
    if (!this.isVar(last) && !this.isUnit(last)) return false;
    if (variable === last) return false;
    if (lastLength.isZero()) return this.setEmpty(last);
    const prefix = this.mkConcat(bs, this.manager.sorts[variable]);
    const variableLengthExpr = this.mkLen(variable);
    const lastLengthExpr = this.mkLen(last);
    const prefixLengthExpr = this.mkLen(prefix);
    const isLonger = negate(this.mkLeLiteral(this.mkSub(variableLengthExpr, prefixLengthExpr), 0));
    const isShorter = this.mkLeLiteral(
      this.mkSub(this.mkSub(variableLengthExpr, prefixLengthExpr), lastLengthExpr),
      0,
    );
    const literals = [isLonger, isShorter];
    if (context.getAssignment(isLonger) !== L_TRUE || context.getAssignment(isShorter) !== L_TRUE) {
      context.markLiteralAsRelevant(isLonger);
      context.markLiteralAsRelevant(isShorter);
    } else if (this.isUnit(last)) {
      bs.push(last);
      this.propagateEq(dep, literals, variable, this.mkConcat(bs, this.manager.sorts[last]), true);
    } else {
      const left = this.sk.mkLeft([variable, prefix, last]);
      const right = this.sk.mkRight([variable, prefix, last]);
      this.propagateEq(dep, literals, variable, this.mkConcat2(prefix, left), true);
      this.propagateEq(dep, literals, last, this.mkConcat2(left, right), true);
    }
    return true;
  }

  protected branchBinaryVariable() {
    return this.eqs.items.some((eq) => this.branchBinaryVariableOf(eq));
  }

  private branchBinaryVariableOf(eq: DepEq) {
    const context = this.context;
    if (this.isComplex(eq)) return false;
    const match =
      this.eqSolver.matchBinaryEq(eq.ls, eq.rs) ?? this.eqSolver.matchBinaryEq(eq.rs, eq.ls);
    if (match === undefined || match.x === match.y) return false;
    if (this.branchVariableEqOf(eq)) return true;
    const xLength = this.getLengthValue(match.x);
    if (xLength === undefined) {
      this.addLengthToEqc(match.x);
      return true;
    }
    const yLength = this.getLengthValue(match.y);
    if (yLength === undefined) {
      this.addLengthToEqc(match.y);
      return true;
    }
    const xsSize = Rational.of(BigInt(match.xs.length));
    const ysSize = Rational.of(BigInt(match.ys.length));
    if (!xLength.add(xsSize).equals(yLength.add(ysSize))) {
      const difference = this.mkSub(this.mkLen(match.x), this.mkLen(match.y));
      const offset = this.mkInt(match.ys.length - match.xs.length);
      this.propagateLit(eq.dep, [], this.mkEqLiteral(difference, offset, false));
      return true;
    }
    if (xLength.compare(ysSize) <= 0) {
      this.eqDeps = eq.dep;
      if (this.eqSolver.branchUnitVariableOf(match.x, match.ys)) return true;
    }
    const literal = this.mkLiteralOf(
      this.mkArith(OP_LE, [this.mkLen(match.x), this.mkInt(match.ys.length)]),
    );
    if (context.getAssignment(literal) === L_FALSE) {
      const left = this.sk.mkLeft([match.x, match.y]);
      const right = this.sk.mkRight([match.x, match.y]);
      const ysLeft = this.mkConcat([...match.ys, left]);
      const xs = this.mkConcat(match.xs);
      const notLiteral = [negate(literal)];
      this.propagateEq(eq.dep, notLiteral, match.x, ysLeft);
      this.propagateEq(eq.dep, notLiteral, match.y, this.mkConcat2(left, right));
      this.propagateEq(eq.dep, notLiteral, right, xs);
    } else context.markLiteralAsRelevant(literal);
    return true;
  }

  protected branchUnitVariable() {
    for (const eq of this.eqs.items) {
      this.eqDeps = eq.dep;
      if (this.eqSolver.branchUnitVariable(eq.ls, eq.rs)) return true;
    }
    return false;
  }

  private branchTernaryVariable() {
    return this.eqs.items.some(
      (eq) => this.branchTernaryVariableRhs(eq) || this.branchTernaryVariableLhs(eq),
    );
  }

  private canAlignOf(isFromLeft: boolean, ls: readonly number[], rs: readonly number[]) {
    const pair = this.manager.mkApp(OP_EQ, [this.mkConcat(ls), this.mkConcat(rs)], SORT_BOOL);
    const overlap = isFromLeft ? this.overlapLeft : this.overlapRight;
    const cached = overlap.get(pair);
    if (cached !== undefined) return cached;
    const result = isFromLeft
      ? this.eqSolver.canAlignFromLhs(ls, rs)
      : this.eqSolver.canAlignFromRhs(ls, rs);
    overlap.set(this.keep(pair), result);
    return result;
  }

  private ensureLengths(exprs: readonly number[]) {
    for (const expr of exprs)
      if (this.getLengthValue(expr) === undefined) this.addLengthToEqc(expr);
  }

  private branchTernaryVariableRhs(eq: DepEq) {
    const match = this.eqSolver.matchTernaryEqRhs(eq.ls, eq.rs);
    if (match === undefined) return false;
    if (this.sk.isAlignL(match.y1) || this.sk.isAlignR(match.y1)) return false;
    this.ensureLengths([match.x, match.y1, match.y2]);
    if (this.canAlignOf(true, match.xs, match.ys)) return false;
    const xs = this.mkConcat(match.xs);
    const ys = this.mkConcat(match.ys);
    const y1ys = this.mkConcat2(match.y1, ys);
    const align = this.sk.mkAlignR([xs, match.y1, ys, match.y2]);
    const dep = eq.dep;
    let isPropagated = false;
    if (this.propagateLit(dep, [], this.mkGeLiteral(this.mkLen(match.y2), match.xs.length)))
      isPropagated = true;
    const difference = this.mkSub(this.mkLen(match.x), this.mkLen(match.y1));
    if (this.propagateLit(dep, [], this.mkGeLiteral(difference, match.ys.length)))
      isPropagated = true;
    if (this.propagateEq(dep, [], match.x, this.mkConcat2(y1ys, align), true)) isPropagated = true;
    if (this.propagateEq(dep, [], match.y2, this.mkConcat2(align, xs), true)) isPropagated = true;
    return isPropagated;
  }

  private branchTernaryVariableLhs(eq: DepEq) {
    const match = this.eqSolver.matchTernaryEqLhs(eq.ls, eq.rs);
    if (match === undefined) return false;
    if (this.sk.isAlignL(match.y1) || this.sk.isAlignR(match.y1)) return false;
    this.ensureLengths([match.x, match.y1, match.y2]);
    if (this.canAlignOf(false, match.xs, match.ys)) return false;
    const xs = this.mkConcat(match.xs);
    const ys = this.mkConcat(match.ys);
    const ysy2 = this.mkConcat2(ys, match.y2);
    const align = this.sk.mkAlignL([xs, match.y1, ys, match.y2]);
    const dep = eq.dep;
    let isPropagated = false;
    if (this.propagateLit(dep, [], this.mkGeLiteral(this.mkLen(match.y1), match.xs.length)))
      isPropagated = true;
    const difference = this.mkSub(this.mkLen(match.x), this.mkLen(match.y2));
    if (this.propagateLit(dep, [], this.mkGeLiteral(difference, match.ys.length)))
      isPropagated = true;
    if (this.propagateEq(dep, [], match.x, this.mkConcat2(align, ysy2), true)) isPropagated = true;
    if (this.propagateEq(dep, [], match.y1, this.mkConcat2(xs, align), true)) isPropagated = true;
    return isPropagated;
  }

  private branchQuatVariable() {
    return this.eqs.items.some((eq) => this.branchQuatVariableOf(eq));
  }

  private mkAlignment(first: number, second: number): Literal {
    const manager = this.manager;
    if (this.sk.isAlign(first) && this.sk.isAlign(second)) {
      const firstPrefix = manager.getArg(first, 0);
      const secondPrefix = manager.getArg(second, 0);
      if (manager.getArg(first, 1) === manager.getArg(second, 1) && firstPrefix !== secondPrefix)
        return this.mkAlignment(firstPrefix, secondPrefix);
    }
    return this.mkSimplifiedLiteral(
      this.mkArith(OP_LE, [this.mkSub(this.mkLen(first), this.mkLen(second)), this.mkInt(0)]),
    );
  }

  private branchQuatVariableOf(eq: DepEq) {
    const context = this.context;
    const match = this.eqSolver.matchQuatEq(eq.ls, eq.rs);
    if (match === undefined) return false;
    const dep = eq.dep;
    this.ensureLengths([match.x1, match.y1, match.x2, match.y2]);
    const isSame = isSameList(match.xs, match.ys);
    let isCondition = false;
    if (isSame) {
      const xs1 = match.xs.slice(1);
      const xs2 = match.xs.slice(0, -1);
      if (xs1.length === 0 || xs2.length === 0) isCondition = true;
      else if (!this.canAlignOf(true, xs2, match.ys) && !this.canAlignOf(false, xs1, match.ys))
        isCondition = true;
    } else if (
      !this.canAlignOf(true, match.xs, match.ys) &&
      !this.canAlignOf(false, match.xs, match.ys) &&
      !this.canAlignOf(true, match.ys, match.xs) &&
      !this.canAlignOf(false, match.ys, match.xs)
    )
      isCondition = true;
    if (!isCondition) return false;
    const literals: Literal[] = [];
    if (isSame) {
      const literal = this.mkEqLiteral(this.mkLen(match.x1), this.mkLen(match.y1), false);
      const value = context.getAssignment(literal);
      if (value === L_UNDEF) {
        context.markLiteralAsRelevant(literal);
        return true;
      }
      if (value === L_TRUE) {
        this.propagateEq(dep, [literal], match.x1, match.y1, true);
        this.propagateEq(dep, [literal], match.x2, match.y2, true);
        return true;
      }
      literals.push(negate(literal));
    }
    const isAligned = this.mkAlignment(match.x1, match.y1);
    const isRightLonger = this.mkGeLiteral(
      this.mkSub(this.mkLen(match.y1), this.mkLen(match.x1)),
      match.xs.length,
    );
    const isLeftLonger = this.mkGeLiteral(
      this.mkSub(this.mkLen(match.x1), this.mkLen(match.y1)),
      match.ys.length,
    );
    const aligned = context.getAssignment(isAligned);
    if (aligned === L_UNDEF) {
      context.markLiteralAsRelevant(isAligned);
      return true;
    }
    if (aligned === L_TRUE) {
      if (context.getAssignment(isRightLonger) === L_UNDEF) {
        context.markLiteralAsRelevant(isRightLonger);
        return true;
      }
    } else if (context.getAssignment(isLeftLonger) === L_UNDEF) {
      context.markLiteralAsRelevant(isLeftLonger);
      return true;
    }
    const xs = this.mkConcat(match.xs);
    const ys = this.mkConcat(match.ys);
    const x1xs = this.mkConcat2(match.x1, xs);
    const y1ys = this.mkConcat2(match.y1, ys);
    const xsx2 = this.mkConcat2(xs, match.x2);
    const ysy2 = this.mkConcat2(ys, match.y2);
    const rightLonger = context.getAssignment(isRightLonger);
    const leftLonger = context.getAssignment(isLeftLonger);
    if (aligned === L_TRUE && rightLonger === L_TRUE) {
      const align = this.sk.mkAlignM(match.y1, match.x1, xs, match.x2);
      this.propagateEq(dep, [isRightLonger], this.mkConcat2(x1xs, align), match.y1, true);
      this.propagateEq(dep, [isRightLonger], match.x2, this.mkConcat2(align, ysy2), true);
      return true;
    }
    if (aligned === L_FALSE && leftLonger === L_TRUE) {
      const align = this.sk.mkAlignM(match.x1, match.y1, ys, match.y2);
      this.propagateEq(dep, [isLeftLonger], match.x1, this.mkConcat2(y1ys, align), true);
      this.propagateEq(dep, [isLeftLonger], this.mkConcat2(align, xsx2), match.y2, true);
      return true;
    }
    if (aligned === L_FALSE && rightLonger === L_TRUE)
      return this.propagateLit(
        null,
        [...literals, negate(isAligned), isRightLonger],
        FALSE_LITERAL,
      );
    if (aligned === L_TRUE && leftLonger === L_TRUE)
      return this.propagateLit(null, [...literals, isAligned, isLeftLonger], FALSE_LITERAL);
    if (aligned === L_TRUE && rightLonger === L_FALSE)
      return this.propagateLit(dep, [...literals, isAligned, negate(isRightLonger)], FALSE_LITERAL);
    return this.propagateLit(
      dep,
      [...literals, negate(isAligned), negate(isLeftLonger)],
      FALSE_LITERAL,
    );
  }

  private branchVariableEq() {
    const size = this.eqs.size;
    const start = this.context.getRandomValue();
    for (let index = 0; index < size; index++)
      if (this.branchVariableEqOf(this.eqs.items[(index + start) % size])) return true;
    return this.context.isInconsistent();
  }

  private branchVariableEqOf(eq: DepEq) {
    const key = 2 * eq.id;
    const front = { start: this.branchStart.get(key) ?? 0 };
    let isFound = this.findBranchCandidate(front, eq.dep, eq.ls, eq.rs);
    this.insertBranchStart(key, front.start);
    if (!isFound) {
      const back = { start: this.branchStart.get(key + 1) ?? 0 };
      isFound = this.findBranchCandidate(back, eq.dep, eq.rs, eq.ls);
      this.insertBranchStart(key + 1, back.start);
    }
    return isFound;
  }

  private insertBranchStart(key: number, start: number) {
    this.branchStart.set(key, start);
    this.trailStack.push(() => {
      this.branchStart.delete(key);
    });
  }

  private findBranchCandidate(
    position: { start: number },
    dep: Dependency,
    ls: readonly number[],
    rs: readonly number[],
  ) {
    const context = this.context;
    if (ls.length === 0) return false;
    const left = ls[0];
    if (!this.isVar(left)) return false;
    const rest = ls.slice(1);
    if (
      this.canBeEqual(rest, rs) &&
      this.assumeEquality(left, this.mkEmpty(this.manager.sorts[left]))
    )
      return true;
    for (; position.start < rs.length; position.start++) {
      const index = position.start;
      if (left === rs[index]) return false;
      if (!this.canBeEqual(rest, rs.slice(index + 1))) continue;
      if (this.assumeEquality(left, this.mkConcat(rs.slice(0, index + 1)))) {
        position.start++;
        return true;
      }
    }
    if (!rs.every((expr) => this.isUnit(expr))) return false;
    const literals = [negate(this.mkEqEmpty(left))];
    for (let index = 0; index < rs.length; index++)
      if (this.canBeEqual(rest, rs.slice(index + 1)))
        literals.push(negate(this.mkEqLiteral(left, this.mkConcat(rs.slice(0, index + 1)), false)));
    for (const literal of literals) {
      const value = context.getAssignment(literal);
      if (value === L_FALSE) {
        position.start = 0;
        return false;
      }
      if (value === L_UNDEF) {
        context.markLiteralAsRelevant(literal);
        context.forcePhase(negate(literal));
        position.start = 0;
        return true;
      }
    }
    this.setConflict(dep, literals);
    return true;
  }

  private canBeEqual(inputLs: readonly number[], inputRs: readonly number[]) {
    const manager = this.manager;
    let ls = inputLs;
    let rs = inputRs;
    let index = 0;
    for (; index < ls.length && index < rs.length; index++) {
      if (manager.areDistinct(ls[index], rs[index])) return false;
      if (ls[index] !== rs[index]) break;
    }
    if (index === rs.length) {
      const swapped = ls;
      ls = rs;
      rs = swapped;
    }
    if (index === ls.length && index < rs.length)
      for (; index < rs.length; index++) if (this.isUnit(rs[index])) return false;
    return true;
  }

  protected assumeEquality(left: number, right: number) {
    const context = this.context;
    const manager = this.manager;
    if (this.exclude.contains(left, right)) return false;
    const eq = this.rewrite(manager.mkApp(OP_EQ, [left, right], SORT_BOOL));
    if (eq === manager.trueExpr || eq === manager.falseExpr) return false;
    const first = this.ensureEnodeOf(left);
    const second = this.ensureEnodeOf(right);
    if (first.root === second.root || context.isDiseq(first, second)) return false;
    context.markAsRelevant(first.owner);
    context.markAsRelevant(second.owner);
    if (!context.assumeEq(first, second)) return false;
    return context.getAssignment(this.mkEqLiteral(left, right, false)) !== L_FALSE;
  }

  private propagateLengthCoherence(expr: number) {
    if (!this.isVar(expr) || !this.rep.isRoot(expr)) return false;
    const lower = this.lowerBound2(expr);
    if (lower === undefined || !lower.isPositive() || lower.compare(Rational.of(2048n)) >= 0)
      return false;
    const elems: number[] = [];
    let seq = expr;
    for (let index = 0n; index < lower.num; index++) {
      const decomposition = this.decompose(seq);
      elems.push(decomposition.head);
      seq = decomposition.tail;
    }
    const empty = this.mkEmpty(this.manager.sorts[expr]);
    elems.push(seq);
    const tail = this.mkConcat(elems);
    const isAtLeast = this.mkLiteralOf(
      this.mkArith(OP_GE, [this.mkLen(expr), this.manager.mkNumeral(lower.num)]),
    );
    const eq = this.mkSeqEq(expr, tail);
    let isAdded = false;
    if (this.context.getAssignment(eq) !== L_TRUE) {
      this.addAxiomOf(negate(isAtLeast), eq);
      isAdded = true;
    }
    const length = this.mkLen(expr);
    const upper = this.upperBound(length);
    if (upper === undefined) return this.assumeEquality(seq, empty) || isAdded;
    const isAtMost = this.mkArith(OP_LE, [length, this.manager.mkNumeral(upper.num)]);
    if (upper.equals(lower)) {
      this.addAxiomOf(
        negate(isAtLeast),
        negate(this.mkLiteralOf(isAtMost)),
        this.mkSeqEq(seq, empty),
      );
      return true;
    }
    const isRestShort = this.mkLiteralOf(
      this.mkArith(OP_LE, [this.mkLen(seq), this.manager.mkNumeral(upper.sub(lower).num)]),
    );
    if (this.context.getAssignment(isRestShort) !== L_TRUE) {
      this.addAxiomOf(negate(isAtLeast), negate(this.mkLiteralOf(isAtMost)), isRestShort);
      isAdded = true;
    }
    return isAdded;
  }

  protected checkLengthCoherenceOf(expr: number) {
    if (!this.isVar(expr) || !this.rep.isRoot(expr)) return false;
    if (!this.checkLengthCoherence0(expr)) {
      const empty = this.mkEmpty(this.manager.sorts[expr]);
      const decomposition = this.decompose(expr);
      const conc = this.mkConcat2(decomposition.head, decomposition.tail);
      if (this.propagateIsConc(expr, conc)) this.assumeEquality(decomposition.tail, empty);
    }
    return true;
  }

  private checkLengthCoherence0(expr: number) {
    if (!this.isVar(expr) || !this.rep.isRoot(expr)) return false;
    const empty = this.mkEmpty(this.manager.sorts[expr]);
    if (!this.propagateLengthCoherence(expr) && !this.assumeEquality(expr, empty)) return false;
    if (this.context.scopeLevel !== this.context.baseLevel) {
      const kept = this.keep(expr);
      this.trailStack.push(() => {
        this.replay.push(() => {
          this.checkLengthCoherenceOf(kept);
        });
      });
    }
    return true;
  }

  private propagateIsConc(expr: number, conc: number) {
    const literal = negate(this.mkEqEmpty(expr));
    if (this.context.getAssignment(literal) !== L_TRUE) return false;
    this.propagateLit(null, [literal], this.mkEqLiteral(expr, conc, false));
    this.newEqEhOf(
      this.mkLiteralLeaf(literal),
      this.context.getEnode(expr)!,
      this.context.getEnode(conc)!,
    );
    return true;
  }

  protected checkLengthCoherence() {
    const numLengths = this.lengths.length;
    for (let index = 0; index < numLengths; index++)
      if (this.checkLengthCoherence0(this.manager.getArg(this.lengths[index], 0))) return true;
    let isChanged = false;
    const size = this.lengths.length;
    for (let index = 0; index < size; index++) {
      const expr = this.manager.getArg(this.lengths[index], 0);
      if (this.checkLengthCoherenceOf(expr)) return true;
      if (!this.context.isEInternalized(expr)) isChanged = true;
      const node = this.ensureEnodeOf(expr);
      if (node.root !== node && this.hasLength(node.root.owner)) continue;
      if (this.addLengthToEqc(expr)) isChanged = true;
    }
    return isChanged;
  }

  protected reduceLengthEq() {
    const start = this.context.getRandomValue();
    for (let index = 0; !this.context.isInconsistent() && index < this.eqs.size; index++) {
      const eq = this.eqs.items[(index + start) % this.eqs.size];
      if (this.reduceLengthEqOf(eq.ls, eq.rs, eq.dep)) return true;
    }
    return false;
  }

  protected checkExtensionalityOf(canonical: number, first: Enode, second: Enode) {
    const firstExpr = first.owner;
    const secondExpr = second.owner;
    const manager = this.manager;
    if (manager.sorts[firstExpr] !== manager.sorts[secondExpr]) return true;
    if (this.context.isDiseq(first, second) || this.exclude.contains(firstExpr, secondExpr))
      return true;
    const other = this.canonize(secondExpr, { dep: null, isChanged: false });
    if (other === undefined) return false;
    const eqs: EqPair[] = [];
    if (this.seqRewriter.reduceEq(canonical, other, eqs) === undefined) {
      this.exclude.update(this.keep(firstExpr), this.keep(secondExpr));
      return true;
    }
    if (eqs.some((eq) => this.exclude.contains(eq.left, eq.right))) return true;
    this.context.assumeEq(first, second);
    return false;
  }

  protected checkExtensionality() {
    const context = this.context;
    const size = this.getNumVars();
    const seqs: number[] = [];
    for (let thVar = 0; thVar < size; thVar++) {
      const node = this.getEnode(thVar);
      const expr = node.owner;
      if (this.isNthU(expr) && node.isCgr()) {
        const firstRoot = node.getArg(0).root;
        const secondRoot = node.getArg(1).root;
        const canonical = this.canonize(firstRoot.owner, { dep: null, isChanged: false });
        if (canonical === undefined) return false;
        for (const parent of secondRoot.parents)
          if (
            parent !== node &&
            parent.isCgr() &&
            this.isNthU(parent.owner) &&
            !this.checkExtensionalityOf(canonical, firstRoot, parent.getArg(0).root)
          )
            return false;
      }
      if (node.root !== node || !this.isSeq(expr)) continue;
      if (seqs.length > 0 && context.isRelevant(expr) && context.isShared(node)) {
        const canonical = this.canonize(expr, { dep: null, isChanged: false });
        if (canonical === undefined) return false;
        for (const other of seqs)
          if (!this.checkExtensionalityOf(canonical, node, this.getEnode(other))) return false;
      }
      seqs.push(thVar);
    }
    return true;
  }

  protected newEqEhOf(dep: Dependency, first: Enode, second: Enode) {
    const firstExpr = first.owner;
    if (first === second || !this.isSeq(firstExpr)) return;
    const firstVar = first.getThVar(this.id);
    const secondVar = second.getThVar(this.id);
    if (firstVar < 0 || secondVar < 0) return;
    if (this.unionFind.find(firstVar) === this.unionFind.find(secondVar)) return;
    this.unionFind.merge(firstVar, secondVar);
    this.eqs.push(this.mkEqDep(firstExpr, second.owner, dep));
    this.solveEqs(this.eqs.size - 1);
    this.enforceLengthCoherence(first, second);
  }

  protected getMinLength(expr: number) {
    return getMinLengthOf(this.manager, expr);
  }
}
