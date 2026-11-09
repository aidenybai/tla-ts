// Ported from Z3 (src/smt/theory_seq.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_SEQ,
  OP_EQ,
  OP_ITE,
  OP_SEQ_AT,
  OP_SEQ_CONTAINS,
  OP_SEQ_EXTRACT,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_INDEX,
  OP_SEQ_IN_RE,
  OP_SEQ_LAST_INDEX,
  OP_SEQ_LENGTH,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH_I,
  OP_SEQ_NTH_U,
  OP_SEQ_POWER,
  OP_SEQ_PREFIX,
  OP_SEQ_REPLACE,
  OP_SEQ_REPLACE_ALL,
  OP_SEQ_REPLACE_RE,
  OP_SEQ_REPLACE_RE_ALL,
  OP_SEQ_SUFFIX,
  OP_SEQ_UNIT,
  OP_STRING_FROM_CODE,
  OP_STRING_IS_DIGIT,
  OP_STRING_ITOS,
  OP_STRING_LE,
  OP_STRING_LT,
  OP_STRING_SBVTOS,
  OP_STRING_STOI,
  OP_STRING_TO_CODE,
  OP_STRING_UBVTOS,
  SORT_BOOL,
} from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import {
  type BoolVar,
  FALSE_LITERAL,
  type Literal,
  mkLiteral,
  negate,
  TRUE_LITERAL,
} from "./literal";
import type { ProtoModel } from "./proto-model";
import { mkSeqApp } from "./seq-decl-plugin";
import type { SeqFactory } from "./seq-factory";
import { type DependentValue, FC_CONTINUE, FC_DONE, FC_GIVEUP } from "./theory";
import { TheorySeqSolve } from "./theory-seq-solve";

const MAX_UNFOLDING = 0x3fffffff;
const MAX_PAD = 1 << 16;
const SOURCE_UNIT = 0;
const SOURCE_INT = 1;
const SOURCE_STRING = 2;

const compareCodes = (first: readonly number[], second: readonly number[]) => {
  for (let index = 0; index < first.length && index < second.length; index++)
    if (first[index] !== second[index]) return first[index] - second[index];
  return first.length - second.length;
};

export class TheorySeq extends TheorySeqSolve {
  readonly name = "seq";
  private factory: SeqFactory | undefined;
  private limitMap: ObjMap<number>;

  constructor(context: Context) {
    super(context, FAMILY_SEQ);
    this.limitMap = new ObjMap((key) => context.manager.hashes[key]);
  }

  finalCheckEh() {
    if (!this.hasSeq) return FC_DONE;
    this.isNewPropagation = false;
    const checks = [
      () => this.simplifyAndSolveEqs(),
      () => this.checkLts(),
      () => this.solveNqs(0),
      () => this.checkFixedLength(true, false),
      () => this.checkFixedLength(false, false),
      () => this.checkFixedLength(false, true),
      () => this.checkContains(),
      () => this.checkIntString(),
      () => this.reduceLengthEq(),
      () => this.branchUnitVariable(),
      () => this.branchBinaryVariable(),
      () => this.branchVariable(),
      () => this.checkLengthCoherence(),
      () => !this.checkExtensionality(),
      () => this.branchNqs(),
      () => this.branchItos(),
      () => this.checkFixedLength(false, true),
      () => this.solveRecfuns(),
    ];
    if (checks.some((check) => check())) return FC_CONTINUE;
    if (this.unhandledExpr !== undefined) return FC_GIVEUP;
    return this.eqs.size === 0 && this.ncs.size === 0 ? FC_DONE : FC_GIVEUP;
  }

  private simplifyAndSolveEqs() {
    this.isNewSolution = true;
    while (this.isNewSolution && !this.context.isInconsistent()) {
      this.isNewSolution = false;
      this.solveEqs(0);
    }
    return this.isNewPropagation || this.context.isInconsistent();
  }

  private mkVar(node: Enode) {
    const expr = node.owner;
    if (this.isRe(expr)) throw new SmtUnsupportedError("regular expressions");
    if (!this.isSeq(expr) && !this.isNthU(expr)) return -1;
    if (this.isAttachedToVar(node)) return node.getThVar(this.id);
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.unionFind.mkVar();
    this.context.attachThVar(node, this, thVar);
    this.context.markAsRelevant(expr);
    return thVar;
  }

  internalizeAtom(atom: number) {
    return this.internalizeTerm(atom);
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const manager = this.manager;
    this.hasSeq = true;
    const op = manager.getOp(term);
    if (op === OP_SEQ_IN_RE) throw new SmtUnsupportedError("regular expressions");
    if (op === OP_STRING_UBVTOS || op === OP_STRING_SBVTOS)
      throw new SmtUnsupportedError("str.from_ubv in the theory of sequences");
    if (op === OP_SEQ_LENGTH) this.mkVar(this.ensureEnodeOf(manager.getArg(term, 0)));
    if (context.isEInternalized(term)) {
      this.mkVar(context.getEnode(term)!);
      return true;
    }
    const isBool = manager.isBool(term);
    if (isBool && this.sk.isSkolem(term)) {
      context.setVarTheory(context.mkBoolVar(term), this.id);
      context.markAsRelevant(term);
      return true;
    }
    for (const arg of manager.getArgs(term)) this.mkVar(this.ensureEnodeOf(arg));
    if (isBool) {
      context.setVarTheory(context.mkBoolVar(term), this.id);
      context.markAsRelevant(term);
    }
    const node = context.isEInternalized(term)
      ? context.getEnode(term)!
      : context.mkEnode(term, false, isBool, true);
    this.mkVar(node);
    return true;
  }

  internalizeEqEh(eq: number) {
    const context = this.context;
    for (const arg of this.manager.getArgs(eq)) this.mkVar(context.getEnode(arg)!);
  }

  applySortCnstr(node: Enode) {
    this.mkVar(node);
  }

  isBetaRedex(parent: Enode, node: Enode) {
    const op = this.manager.getOp(parent.owner);
    if (op !== OP_SEQ_MAP && op !== OP_SEQ_MAPI && op !== OP_SEQ_FOLDL && op !== OP_SEQ_FOLDLI)
      return false;
    return parent.getArg(0).root === node.root;
  }

  includeFuncInterp(decl: number) {
    return this.manager.funcDecls[decl].op === OP_SEQ_NTH_U;
  }

  private checkFixedLength(isZero: boolean, isCheckingLongStrings: boolean) {
    let isFound = false;
    for (let index = 0; index < this.lengths.length; index++)
      if (this.fixedLength(this.lengths[index], isZero, isCheckingLongStrings)) isFound = true;
    return isFound;
  }

  private fixedLength(length: number, isZero: boolean, isCheckingLongStrings: boolean) {
    const manager = this.manager;
    const context = this.context;
    const expr = manager.getArg(length, 0);
    if (!this.isVar(expr)) return false;
    const lower = this.lowerBound(length);
    if (lower === undefined) return false;
    const upper = this.upperBound(length);
    if (upper === undefined || !lower.equals(upper)) return false;
    if (isZero ? !lower.isZero() : lower.isNegative() || lower.num > 0xffffffffn) return false;
    const sk = this.sk;
    if (
      sk.isTail(expr) ||
      sk.isSeqFirst(expr) ||
      sk.isIndexofLeft(expr) ||
      sk.isIndexofRight(expr) ||
      this.fixed.has(expr)
    )
      return false;
    const isLength = this.mkEqLiteral(length, manager.mkNumeral(lower.num), false);
    if (context.getAssignment(isLength) === L_FALSE) return false;
    if (!isCheckingLongStrings && lower.num > 20n && !isZero) return false;
    this.fixed.add(this.keep(expr));
    this.trailStack.push(() => {
      this.fixed.delete(expr);
    });
    let seq = expr;
    if (lower.isZero()) seq = this.mkEmpty(manager.sorts[expr]);
    else if (!isZero) {
      const elems: number[] = [];
      for (let index = 0n; index < lower.num; index++) {
        const decomposition = this.decompose(seq);
        elems.push(decomposition.head);
        seq = decomposition.tail;
      }
      seq = this.mkConcat(elems);
    }
    const eq = this.mkSeqEq(seq, expr);
    if (context.getAssignment(eq) === L_TRUE) return false;
    this.addAxiomOf(negate(isLength), eq);
    if (context.scopeLevel !== context.baseLevel) {
      const kept = this.keep(length);
      this.trailStack.push(() => {
        this.replay.push(() => {
          this.fixedLength(kept, false, false);
        });
      });
    }
    return true;
  }

  private checkContains() {
    for (let index = 0; !this.context.isInconsistent() && index < this.ncs.size; index++)
      if (this.solveNc(index)) this.ncs.eraseAndSwap(index--);
    return this.isNewPropagation || this.context.isInconsistent();
  }

  private solveNc(index: number) {
    const manager = this.manager;
    const nc = this.ncs.items[index];
    const text = manager.getArg(nc.contains, 0);
    const pattern = manager.getArg(nc.contains, 1);
    const value = this.context.getAssignment(nc.lengthGreater);
    if (value === L_TRUE) {
      this.addLengthToEqc(text);
      this.addLengthToEqc(pattern);
      return true;
    }
    if (value === L_UNDEF) {
      this.context.markLiteralAsRelevant(nc.lengthGreater);
      this.isNewPropagation = true;
      return false;
    }
    if (!this.sk.isTail(text)) this.addLengthLimit(text, this.maxUnfoldingDepth, true);
    this.ax.unrollNotContains(nc.contains);
    return true;
  }

  private checkLts() {
    const manager = this.manager;
    const context = this.context;
    if (this.lts.size === 0 || this.isLtsChecked) return false;
    const size = this.lts.size;
    this.trailStack.push(() => {
      this.isLtsChecked = false;
    });
    this.isLtsChecked = true;
    const orient = (predicate: number) => {
      let first = manager.getArg(predicate, 0);
      let second = manager.getArg(predicate, 1);
      let literal = context.getLiteral(predicate);
      let isStrict = manager.getOp(predicate) === OP_STRING_LT;
      if (context.getAssignment(literal) === L_FALSE) {
        const swapped = first;
        first = second;
        second = swapped;
        literal = negate(literal);
        isStrict = !isStrict;
      }
      return { first, second, literal, isStrict };
    };
    for (let index = 0; index + 1 < size; index++) {
      const outer = orient(this.lts.items[index]);
      for (let other = index + 1; other < size; other++) {
        const inner = orient(this.lts.items[other]);
        if (context.getEnode(outer.second)!.root !== context.getEnode(inner.first)!.root) continue;
        const eq =
          outer.second === inner.first
            ? TRUE_LITERAL
            : this.mkEqLiteral(outer.second, inner.first, false);
        const isStrict = outer.isStrict || inner.isStrict;
        const lower = manager.getString(outer.first);
        const upper = manager.getString(inner.second);
        if (lower !== undefined && upper !== undefined) {
          const comparison = compareCodes(lower, upper);
          if (isStrict ? comparison >= 0 : comparison > 0)
            this.addAxiomOf(negate(outer.literal), negate(inner.literal), negate(eq));
          continue;
        }
        const bound = mkSeqApp(manager, isStrict ? OP_STRING_LT : OP_STRING_LE, [
          outer.first,
          inner.second,
        ]);
        this.addAxiomOf(
          negate(outer.literal),
          negate(inner.literal),
          negate(eq),
          this.mkLiteralOf(bound),
        );
      }
    }
    return true;
  }

  private checkIntString() {
    let isChanged = false;
    for (const expr of this.intStrings) if (this.checkIntStringOf(expr)) isChanged = true;
    return isChanged;
  }

  private checkIntStringOf(expr: number) {
    const manager = this.manager;
    if (this.context.isInconsistent()) return true;
    const arg = manager.getArg(expr, 0);
    if (
      this.isOp(expr, OP_STRING_ITOS) &&
      !this.isOp(arg, OP_STRING_STOI) &&
      this.addLengthToEqc(expr)
    )
      return true;
    return (
      this.isOp(expr, OP_STRING_STOI) && !this.isOp(arg, OP_STRING_ITOS) && this.addLengthToEqc(arg)
    );
  }

  private branchItos() {
    let isChanged = false;
    for (const expr of this.intStrings) if (this.branchItosOf(expr)) isChanged = true;
    return isChanged;
  }

  private branchItosOf(expr: number) {
    const manager = this.manager;
    const context = this.context;
    if (context.isInconsistent()) return true;
    if (!this.isOp(expr, OP_STRING_ITOS) || !context.isEInternalized(expr)) return false;
    if (this.isString(context.getEnode(expr)!.root.owner)) return false;
    const number = manager.getArg(expr, 0);
    const value = this.getNumValue(number);
    if (value === undefined || value.isNegative()) return false;
    const digits = [...value.num.toString()].map((digit) => digit.charCodeAt(0));
    const eq = this.mkEqLiteral(expr, manager.mkString(digits), false);
    const assignment = context.getAssignment(eq);
    if (assignment === L_TRUE) return false;
    if (assignment === L_FALSE)
      this.addAxiomOf(negate(this.mkEqLiteral(number, manager.mkNumeral(value.num), false)), eq);
    else {
      context.forcePhase(eq);
      context.markLiteralAsRelevant(eq);
    }
    return true;
  }

  private solveRecfuns() {
    for (let index = 0; index < this.recfuns.size && !this.context.isInconsistent(); index++) {
      const term = this.recfuns.items[index];
      const state = { dep: null, isChanged: false };
      const canonical = this.canonize(term, state);
      if (canonical !== undefined && canonical !== term) {
        this.addSolution(term, canonical, state.dep);
        this.recfuns.eraseAndSwap(index--);
      }
    }
    return this.isNewPropagation || this.context.isInconsistent();
  }

  private addLengthLimit(input: number, limit: number, isSearching: boolean) {
    const manager = this.manager;
    const todo = [input];
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (this.isConcat(expr)) {
        todo.push(...manager.getArgs(expr));
        continue;
      }
      if (this.isUnit(expr) || this.isEmpty(expr)) continue;
      if (this.sk.isSkolem(expr)) {
        for (const arg of manager.getArgs(expr))
          if (this.isSeq(arg) || this.sk.isSkolem(arg)) todo.push(arg);
        continue;
      }
      const tracker = this.keep(this.ax.lengthLimit(expr, limit));
      const previous = this.limitMap.get(expr);
      if (previous !== undefined && limit <= previous) continue;
      this.limitMap.set(this.keep(expr), limit);
      this.lengthLimits.push(tracker);
      this.trailStack.push(() => {
        this.lengthLimits.pop();
      });
      this.trailStack.push(() => {
        if (previous === undefined) this.limitMap.delete(expr);
        else this.limitMap.set(expr, previous);
      });
      if (isSearching) {
        const depth = this.sk.mkMaxUnfoldingDepth(this.maxUnfoldingDepth);
        this.addAxiomOf(negate(this.mkLiteralOf(depth)), this.mkLiteralOf(tracker));
      }
    }
  }

  assignEh(boolVar: BoolVar, isTrue: boolean) {
    const manager = this.manager;
    const context = this.context;
    const expr = context.boolVar2Expr[boolVar];
    const literal = mkLiteral(boolVar, !isTrue);
    const op = manager.getOp(expr);
    if (op === OP_SEQ_PREFIX || op === OP_SEQ_SUFFIX) {
      if (!isTrue) {
        this.propagateNotAffix(expr);
        return;
      }
      const first = this.rewrite(manager.getArg(expr, 0));
      const second = this.rewrite(manager.getArg(expr, 1));
      const isPrefix = op === OP_SEQ_PREFIX;
      const inverse = isPrefix
        ? this.sk.mkPrefixInv(first, second)
        : this.sk.mkSuffixInv(first, second);
      const whole = isPrefix ? this.mkConcat2(first, inverse) : this.mkConcat2(inverse, first);
      this.propagateEq(null, [literal], whole, second, true);
      this.propagateEq(null, [literal], this.mkLen(whole), this.mkLen(second), false);
      return;
    }
    if (op === OP_SEQ_CONTAINS) {
      if (this.canonizes(isTrue, expr)) return;
      const text = this.rewrite(manager.getArg(expr, 0));
      const pattern = this.rewrite(manager.getArg(expr, 1));
      if (isTrue) {
        const left = this.sk.mkContainsLeft(text, pattern);
        const right = this.sk.mkContainsRight(text, pattern);
        const whole = this.mkConcat([left, pattern, right]);
        const original = manager.getArg(expr, 0);
        this.propagateEq(null, [literal], whole, original, true);
        this.propagateEq(null, [literal], this.mkLen(whole), this.mkLen(original), false);
        return;
      }
      this.propagateLit(null, [literal], negate(this.mkEqEmpty(pattern)));
      const dep = this.mkLiteralLeaf(literal);
      const isShorter = this.mkLeLiteral(this.mkSub(this.mkLen(text), this.mkLen(pattern)), -1);
      context.forcePhase(isShorter);
      this.ncs.push({ contains: this.keep(expr), lengthGreater: isShorter, dep });
      return;
    }
    if (this.sk.isEq(expr)) {
      if (isTrue)
        this.propagateEq(null, [literal], manager.getArg(expr, 0), manager.getArg(expr, 1), true);
      return;
    }
    if (this.sk.getLengthLimit(expr) !== undefined) {
      if (isTrue) this.propagateLengthLimit(expr);
      return;
    }
    if (op === OP_STRING_LT || op === OP_STRING_LE) {
      this.assignLt(expr, literal, isTrue);
      return;
    }
    if (
      op === OP_SEQ_NTH_I ||
      op === OP_SEQ_NTH_U ||
      this.sk.isSkolem(expr) ||
      op === OP_STRING_IS_DIGIT ||
      op === OP_SEQ_FOLDL ||
      op === OP_SEQ_FOLDLI
    )
      return;
    throw new SmtUnsupportedError(
      `the sequence atom ${manager.funcDecls[manager.decls[expr]].name}`,
    );
  }

  private assignLt(expr: number, literal: Literal, isTrue: boolean) {
    const manager = this.manager;
    const context = this.context;
    this.lts.push(this.keep(expr));
    const getBound = (predicate: number) => {
      const first = manager.getArg(predicate, 0);
      const second = manager.getArg(predicate, 1);
      const firstChars = manager.getString(first);
      const secondChars = manager.getString(second);
      if (firstChars !== undefined && secondChars === undefined)
        return { isLower: true, bound: firstChars, variable: second };
      if (firstChars === undefined && secondChars !== undefined)
        return { isLower: false, bound: secondChars, variable: first };
      return undefined;
    };
    const own = isTrue && manager.getOp(expr) === OP_STRING_LT ? getBound(expr) : undefined;
    if (own === undefined || !context.isEInternalized(own.variable)) return;
    const root = context.getEnode(own.variable)!.root;
    for (const predicate of this.lts.items) {
      if (predicate === expr || manager.getOp(predicate) !== OP_STRING_LT) continue;
      const predicateLiteral = context.getLiteral(predicate);
      if (predicateLiteral === TRUE_LITERAL || predicateLiteral === FALSE_LITERAL) continue;
      if (context.getAssignment(predicateLiteral) !== L_TRUE) continue;
      const other = getBound(predicate);
      if (other === undefined || other.isLower === own.isLower) continue;
      if (!context.isEInternalized(other.variable)) continue;
      if (context.getEnode(other.variable)!.root !== root) continue;
      const lower = own.isLower ? own.bound : other.bound;
      const upper = own.isLower ? other.bound : own.bound;
      if (compareCodes(lower, upper) >= 0) {
        this.setConflict(null, [literal, predicateLiteral]);
        return;
      }
    }
  }

  newEqEh(first: number, second: number) {
    const firstNode = this.getEnode(first);
    const secondNode = this.getEnode(second);
    if (!this.isSeq(firstNode.owner)) return;
    this.newEqEhOf(
      this.mkAssumption({ first: firstNode, second: secondNode, literal: undefined }),
      firstNode,
      secondNode,
    );
  }

  newDiseqEh(first: number, second: number) {
    const manager = this.manager;
    const context = this.context;
    const firstNode = this.getEnode(first);
    const secondNode = this.getEnode(second);
    let left = firstNode.owner;
    let right = secondNode.owner;
    if (firstNode.root === secondNode.root || !this.isSeq(left)) return;
    this.exclude.update(this.keep(left), this.keep(right));
    if (this.rewrite(manager.mkApp(OP_EQ, [left, right], SORT_BOOL)) === manager.falseExpr) return;
    const literal = this.mkEqLiteral(left, right, false);
    context.markLiteralAsRelevant(literal);
    if (this.isEmpty(right)) {
      const swapped = left;
      left = right;
      right = swapped;
    }
    const dep = this.mkLiteralLeaf(negate(literal));
    this.nqs.push({ left, right, eqs: [{ ls: [left], rs: [right] }], literals: [], dep });
    if (context.getAssignment(literal) !== L_UNDEF) this.solveNqs(this.nqs.size - 1);
  }

  pushScopeEh() {
    super.pushScopeEh();
    this.rep.pushScope();
    this.exclude.pushScope();
    this.pushScopeDeps();
    this.trailStack.pushScope();
    const axiomsHead = this.axiomsHead;
    this.trailStack.push(() => {
      this.axiomsHead = axiomsHead;
    });
    this.eqs.pushScope();
    this.nqs.pushScope();
    this.ncs.pushScope();
    this.lts.pushScope();
    this.recfuns.pushScope();
  }

  popScopeEh(numScopes: number) {
    const context = this.context;
    this.trailStack.popScope(numScopes);
    super.popScopeEh(numScopes);
    this.popScopeDeps(numScopes);
    this.rep.popScope(numScopes);
    this.exclude.popScope(numScopes);
    this.eqs.popScope(numScopes);
    this.nqs.popScope(numScopes);
    this.ncs.popScope(numScopes);
    this.lts.popScope(numScopes);
    this.recfuns.popScope(numScopes);
    this.rewriter.reset();
    if (context.baseLevel > context.scopeLevel - numScopes) this.replay = [];
  }

  relevantEh(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (
      op === OP_SEQ_INDEX ||
      op === OP_SEQ_REPLACE ||
      op === OP_SEQ_EXTRACT ||
      op === OP_SEQ_AT ||
      op === OP_SEQ_NTH_I ||
      this.isEmpty(expr) ||
      this.isString(expr) ||
      op === OP_STRING_ITOS ||
      op === OP_STRING_STOI ||
      op === OP_STRING_LT ||
      op === OP_STRING_IS_DIGIT ||
      op === OP_STRING_FROM_CODE ||
      op === OP_STRING_TO_CODE ||
      op === OP_SEQ_UNIT ||
      op === OP_SEQ_POWER ||
      op === OP_SEQ_LAST_INDEX ||
      op === OP_SEQ_LENGTH ||
      op === OP_STRING_LE
    )
      this.enqueAxiom(expr);
    if (op === OP_STRING_ITOS || op === OP_STRING_STOI) {
      this.intStrings.push(this.keep(expr));
      this.trailStack.push(() => {
        this.intStrings.pop();
      });
    }
    if (op === OP_SEQ_FOLDL || op === OP_SEQ_FOLDLI || op === OP_SEQ_MAP || op === OP_SEQ_MAPI) {
      this.addLengthToEqc(manager.getArg(expr, manager.getNumArgs(expr) - 1));
      this.recfuns.push(this.keep(expr));
    }
    if (this.sk.isTail(expr))
      this.addLengthLimit(manager.getArg(expr, 0), this.maxUnfoldingDepth, true);
    if (op === OP_SEQ_LENGTH) {
      const arg = manager.getArg(expr, 0);
      if (!this.hasLength(arg) && this.context.isEInternalized(arg)) this.addLengthToEqc(arg);
    }
    if (op === OP_SEQ_REPLACE_ALL || op === OP_SEQ_REPLACE_RE || op === OP_SEQ_REPLACE_RE_ALL)
      this.addUnhandledExpr(expr);
  }

  private addUnhandledExpr(expr: number) {
    if (this.unhandledExpr !== undefined) return;
    this.context.pushTrail(() => {
      this.unhandledExpr = undefined;
    });
    this.unhandledExpr = this.keep(expr);
  }

  canPropagate() {
    return this.axiomsHead < this.axioms.length || this.replay.length > 0 || this.isNewSolution;
  }

  propagate() {
    const context = this.context;
    while (this.axiomsHead < this.axioms.length && !context.isInconsistent()) {
      this.dequeAxiom(this.axioms[this.axiomsHead]);
      this.axiomsHead++;
    }
    while (this.replay.length > 0 && !context.isInconsistent()) {
      this.replay[this.replay.length - 1]();
      this.replay.pop();
    }
    if (this.isNewSolution) {
      this.simplifyAndSolveEqs();
      this.isNewSolution = false;
    }
  }

  private enqueAxiom(expr: number) {
    if (this.axiomSet.has(expr)) return;
    this.axioms.push(this.keep(expr));
    this.axiomSet.add(expr);
    this.trailStack.push(() => {
      this.axioms.pop();
    });
    this.trailStack.push(() => {
      this.axiomSet.delete(expr);
    });
  }

  private dequeAxiom(expr: number) {
    const manager = this.manager;
    const ax = this.ax;
    const op = manager.getOp(expr);
    if (op === OP_SEQ_LENGTH) {
      this.addLength(expr);
      ax.lengthAxiom(expr);
      if (this.context.scopeLevel !== this.context.baseLevel)
        this.trailStack.push(() => {
          this.replay.push(() => {
            this.enqueAxiom(expr);
          });
        });
    } else if (this.isEmpty(expr) && !this.hasLength(expr) && this.hasLengthSet.size > 0)
      this.addLengthToEqc(expr);
    else if (op === OP_SEQ_INDEX) ax.indexofAxiom(expr);
    else if (op === OP_SEQ_LAST_INDEX) ax.lastIndexofAxiom(expr);
    else if (op === OP_SEQ_REPLACE) ax.replaceAxiom(expr);
    else if (op === OP_SEQ_EXTRACT) ax.extractAxiom(expr);
    else if (op === OP_SEQ_AT) ax.atAxiom(expr);
    else if (op === OP_SEQ_NTH_I) ax.nthAxiom(expr);
    else if (this.isString(expr)) this.addElimStringAxiom(expr);
    else if (op === OP_STRING_ITOS) {
      ax.itosAxiom(expr);
      this.addLengthLimit(expr, this.maxUnfoldingDepth, true);
    } else if (op === OP_STRING_STOI) {
      ax.stoiAxiom(expr);
      this.addLengthLimit(expr, this.maxUnfoldingDepth, true);
    } else if (op === OP_STRING_LT) ax.ltAxiom(expr);
    else if (op === OP_STRING_LE) ax.leAxiom(expr);
    else if (op === OP_SEQ_UNIT) ax.unitAxiom(expr);
    else if (op === OP_SEQ_POWER) {
      ax.powerAxiom(expr);
      this.addLengthLimit(expr, this.maxUnfoldingDepth, true);
    } else if (op === OP_STRING_IS_DIGIT) ax.isDigitAxiom(expr);
    else if (op === OP_STRING_FROM_CODE) ax.strFromCodeAxiom(expr);
    else if (op === OP_STRING_TO_CODE) ax.strToCodeAxiom(expr);
  }

  private addElimStringAxiom(expr: number) {
    const manager = this.manager;
    const chars = manager.getString(expr)!;
    if (chars.length === 0) return;
    const mkUnit = (code: number) => mkSeqApp(manager, OP_SEQ_UNIT, [manager.mkChar(code)]);
    let result = mkUnit(chars[chars.length - 1]);
    for (let index = chars.length - 1; index-- > 0;)
      result = this.mkConcat2(mkUnit(chars[index]), result);
    this.addAxiomOf(this.mkEqLiteral(expr, result, false));
    this.rep.update(this.keep(expr), this.keep(result), null);
    this.isNewSolution = true;
  }

  private propagateLengthLimit(expr: number) {
    const manager = this.manager;
    const limit = this.sk.getLengthLimit(expr)!;
    const op = manager.getOp(limit.seq);
    if (op === OP_STRING_STOI) this.ax.stoiAxiomOf(limit.seq, limit.limit);
    if (op === OP_STRING_ITOS) this.ax.itosAxiomOf(limit.seq, limit.limit);
    if (op === OP_SEQ_POWER) this.ax.powerUnfoldAxiom(limit.seq, limit.limit);
  }

  private propagateNotAffix(expr: number) {
    const literal = this.context.getLiteral(expr);
    const state = { dep: null, isChanged: false };
    const canonical = this.canonize(expr, state);
    if (canonical === this.manager.trueExpr) {
      this.propagateLit(state.dep, [], literal);
      return;
    }
    this.propagateLit(
      null,
      [negate(literal)],
      negate(this.mkEqEmpty(this.manager.getArg(expr, 0))),
    );
    if (this.isOp(expr, OP_SEQ_PREFIX)) this.ax.prefixAxiom(expr);
    else this.ax.suffixAxiom(expr);
  }

  private canonizes(isTrue: boolean, expr: number) {
    const manager = this.manager;
    const state = { dep: null, isChanged: false };
    const canonical = this.canonize(expr, state) ?? expr;
    if (
      (canonical === manager.trueExpr && !isTrue) ||
      (canonical === manager.falseExpr && isTrue)
    ) {
      const literal = this.context.getLiteral(expr);
      this.propagateLit(state.dep, [], isTrue ? negate(literal) : literal);
      return true;
    }
    return (
      (canonical === manager.falseExpr && !isTrue) || (canonical === manager.trueExpr && isTrue)
    );
  }

  addTheoryAssumptions(assumptions: number[]) {
    if (!this.hasSeq) return;
    const depth = this.sk.mkMaxUnfoldingDepth(this.maxUnfoldingDepth);
    const previous = this.maxUnfoldingLiteral;
    this.trailStack.push(() => {
      this.maxUnfoldingLiteral = previous;
    });
    this.maxUnfoldingLiteral = this.mkLiteralOf(depth);
    assumptions.push(this.keep(depth));
    for (const [seq, limit] of this.limitMap.entries())
      if (limit > 0) assumptions.push(this.keep(this.sk.mkLengthLimit(seq, limit)));
  }

  shouldResearch(unsatCore: readonly number[]) {
    if (!this.hasSeq) return false;
    let minLimit = Infinity;
    let minSeq: number | undefined;
    let count = 0;
    let hasMaxUnfolding = false;
    for (const expr of unsatCore) {
      const limit = this.sk.getLengthLimit(expr);
      if (this.sk.isMaxUnfolding(expr)) hasMaxUnfolding = true;
      else if (limit !== undefined) {
        if (limit.limit < minLimit) {
          minLimit = limit.limit;
          minSeq = limit.seq;
          count = 0;
        } else if (limit.limit === minLimit && this.context.getRandomValue() % ++count === 0)
          minSeq = limit.seq;
      }
    }
    if (minLimit < MAX_UNFOLDING) {
      this.maxUnfoldingDepth++;
      let limit = minLimit * 2;
      if (this.isSeq(minSeq!)) {
        limit = Math.max(this.getMinLength(minSeq!), limit);
        const lower = this.lowerBound2(minSeq!);
        if (lower !== undefined && !lower.isNegative() && lower.num <= 0xffffffffn)
          limit = Math.max(Number(lower.num), limit);
      }
      this.addLengthLimit(minSeq!, limit, false);
      return true;
    }
    if (hasMaxUnfolding) {
      this.maxUnfoldingDepth = Math.floor((1 + 3 * this.maxUnfoldingDepth) / 2);
      return true;
    }
    if (minLimit !== Infinity) throw new SmtUnsupportedError("a deeper unfolding of sequences");
    return false;
  }

  initModel(model: ProtoModel) {
    this.rep.pushScope();
    const factory = model.getSeqFactory();
    this.factory = factory;
    for (const ne of this.nqs.items) {
      factory.registerValue(ne.left);
      factory.registerValue(ne.right);
    }
    for (const ne of this.nqs.items)
      for (const eq of ne.eqs) {
        this.initModelOf(eq.ls);
        this.initModelOf(eq.rs);
      }
  }

  private initModelOf(exprs: readonly number[]) {
    for (const expr of exprs) {
      const state = { dep: null, isChanged: false };
      const canonical = this.canonize(expr, state) ?? expr;
      if (this.isVar(canonical)) {
        const fresh = this.keep(this.factory!.getFreshValue(this.manager.sorts[canonical]));
        this.rep.update(this.keep(canonical), fresh, state.dep);
      }
    }
  }

  finalizeModel() {
    this.rep.popScope(1);
  }

  private getIteValue(input: number) {
    const context = this.context;
    const manager = this.manager;
    let expr = input;
    while (this.isOp(expr, OP_ITE) && context.isEInternalized(expr)) {
      const root = context.getEnode(expr)!.root;
      const thenExpr = manager.getArg(expr, 1);
      const elseExpr = manager.getArg(expr, 2);
      if (context.getEnode(thenExpr)!.root === root) expr = thenExpr;
      else if (context.getEnode(elseExpr)!.root === root) expr = elseExpr;
      else break;
    }
    return expr;
  }

  mkValue(node: Enode): number | DependentValue {
    const manager = this.manager;
    const context = this.context;
    const expr = this.getIteValue(node.owner);
    if (!this.isSeq(expr)) return this.mkValueOf(expr);
    const concats: number[] = [];
    const todo = [expr];
    while (todo.length > 0) {
      const current = this.rep.find(this.getIteValue(this.rep.find(todo.pop()!)));
      if (this.isConcat(current)) todo.push(manager.getArg(current, 1), manager.getArg(current, 0));
      else concats.push(current);
    }
    const sort = manager.sorts[expr];
    const dependencies: Enode[] = [];
    const sources: number[] = [];
    const strings: number[] = [];
    for (const concat of concats) {
      const arg = manager.getNumArgs(concat) > 0 ? manager.getArg(concat, 0) : -1;
      if (this.isUnit(concat)) {
        if (context.isEInternalized(arg)) {
          dependencies.push(context.getEnode(arg)!);
          sources.push(SOURCE_UNIT);
        } else if (manager.isValue(arg)) {
          strings.push(concat);
          sources.push(SOURCE_STRING);
        }
      } else if (this.isOp(concat, OP_STRING_ITOS)) {
        if (context.isEInternalized(arg)) {
          dependencies.push(context.getEnode(arg)!);
          sources.push(SOURCE_INT);
        }
      } else if (this.isString(concat)) {
        strings.push(concat);
        sources.push(SOURCE_STRING);
      } else {
        strings.push(this.mkValueOf(concat));
        sources.push(SOURCE_STRING);
      }
    }
    return {
      dependencies,
      mkValue: (values) => this.mkSeqValue(sort, sources, strings, values),
    };
  }

  private mkSeqValue(
    sort: number,
    sources: readonly number[],
    strings: readonly number[],
    values: readonly number[],
  ) {
    const manager = this.manager;
    let valueIndex = 0;
    let stringIndex = 0;
    if (manager.isStringSort(sort)) {
      const codes: number[] = [];
      for (const source of sources) {
        if (source === SOURCE_UNIT) codes.push(manager.getChar(values[valueIndex++]));
        else if (source === SOURCE_STRING) {
          const string = strings[stringIndex++];
          const canonical = this.canonize(string, { dep: null, isChanged: false }) ?? string;
          const chars = manager.getString(this.strRewriter.rewrite(canonical));
          if (chars !== undefined) codes.push(...chars);
        } else {
          const value = manager.getNumeral(values[valueIndex++])!;
          if (value >= 0n) for (const digit of value.toString()) codes.push(digit.charCodeAt(0));
        }
      }
      return this.keep(manager.mkString(codes));
    }
    const args = sources.map((source) =>
      source === SOURCE_UNIT
        ? mkSeqApp(manager, OP_SEQ_UNIT, [values[valueIndex++]])
        : strings[stringIndex++],
    );
    return this.keep(this.strRewriter.rewrite(this.mkConcat(args, sort)));
  }

  private mkValueOf(input: number) {
    const manager = this.manager;
    const factory = this.factory!;
    const expr = this.getIteValue(input);
    let result = this.rep.find(expr);
    if (this.isVar(result)) result = factory.getFreshValue(manager.sorts[result]);
    else result = this.rewrite(result);
    if (this.isSeq(result) && !manager.isValue(result)) {
      const fresh = factory.getFreshValue(manager.sorts[result]);
      const chars = manager.getString(fresh);
      const lower = chars === undefined ? undefined : this.lowerBound2(expr);
      result = fresh;
      if (
        chars !== undefined &&
        lower !== undefined &&
        lower.isPositive() &&
        lower.num <= BigInt(MAX_PAD) &&
        BigInt(chars.length) < lower.num
      ) {
        const padded = [...chars];
        while (padded.length < Number(lower.num)) padded.push(97);
        result = manager.mkString(padded);
      }
    }
    this.keep(result);
    this.rep.update(this.keep(expr), result, null);
    return result;
  }
}
