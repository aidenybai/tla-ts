// Ported from Z3 (src/ast/seq/seq_eq_approx.cpp, src/ast/seq/seq_eq_approx.h), MIT license, see
// z3-license.txt.
import { type AstManager, OP_SEQ_CONCAT, OP_SEQ_UNIT } from "./ast";
import { GuardSet, GuardSetCache } from "./guard-set";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { isEmptySeq } from "./seq-decl-plugin";
import { TRANSITION_LIGHT_ANTIMIROV } from "./seq-derive";
import type { ReRewriter } from "./seq-re-rewriter";
import { isReEmpty, mkFullChar, mkFullSeq, mkToRe } from "./seq-re-util";

const RANGE_CACHE_CAP = 1 << 16;

interface Node {
  leftSegment: number;
  rightSegment: number;
  leftStates: number[];
  rightStates: number[];
}

export class SeqEqApprox {
  private views = new Map<number, number[]>();
  private pins: RefVector;
  readonly used: number[] = [];
  private rangeCache: GuardSetCache;
  private budget = 0;

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
    private maxStates: number,
  ) {
    this.pins = new RefVector(manager);
    this.rangeCache = new GuardSetCache(manager);
  }

  addView(term: number, state: number, target: number) {
    const views = this.views.get(term) ?? [];
    views.push(state, target);
    this.views.set(term, views);
    this.pins.push(term);
    this.pins.push(state);
    if (target !== -1) this.pins.push(target);
  }

  resetViews() {
    this.views.clear();
    this.pins.reset();
    this.used.length = 0;
  }

  private nullable(regex: number) {
    const manager = this.manager;
    const info = this.re.info.getInfo(regex).nullable;
    if (info !== L_UNDEF) return info;
    const formula = this.re.isNullable(regex);
    return manager.isTrue(formula) ? L_TRUE : manager.isFalse(formula) ? L_FALSE : L_UNDEF;
  }

  private isOutOfBudget() {
    if (this.budget === 0 || !this.manager.limit.inc()) return true;
    this.budget--;
    return false;
  }

  private addSegment(regex: number, segments: number[][]) {
    this.pins.push(regex);
    segments.push([regex, -1]);
  }

  private toSegments(term: number, segments: number[][]) {
    const manager = this.manager;
    if (isEmptySeq(manager, term)) return;
    if (manager.getOp(term) === OP_SEQ_CONCAT) {
      for (const arg of manager.getArgs(term)) this.toSegments(arg, segments);
      return;
    }
    const reSort = manager.mkReSort(manager.sorts[term]);
    const views = this.views.get(term);
    if (views !== undefined) {
      if (!this.used.includes(term)) this.used.push(term);
      segments.push(views);
      return;
    }
    const chars = manager.getString(term);
    if (chars !== undefined) {
      if (chars.length > 0) this.addSegment(mkToRe(manager, term), segments);
      return;
    }
    if (manager.getOp(term) === OP_SEQ_UNIT)
      this.addSegment(
        manager.isValue(manager.getArg(term, 0))
          ? mkToRe(manager, term)
          : mkFullChar(manager, reSort),
        segments,
      );
    else this.addSegment(mkFullSeq(manager, reSort), segments);
  }

  private isSegmentDone(views: readonly number[], states: readonly number[]) {
    for (let index = 0; index < states.length; index++) {
      const target = views[2 * index + 1];
      if (target !== -1) {
        if (states[index] !== target) return L_FALSE;
        continue;
      }
      const nullable = this.nullable(states[index]);
      if (nullable !== L_TRUE) return nullable;
    }
    return L_TRUE;
  }

  private intersectNonempty(left: number[][], right: number[][]) {
    const manager = this.manager;
    this.budget = this.maxStates;
    if (left.length === 0 && right.length === 0) return L_TRUE;
    let probe = -1;
    for (const segments of [left, right])
      for (const segment of segments) {
        if (segment.length === 0) return L_UNDEF;
        if (probe === -1) probe = segment[0];
      }
    if (probe === -1) return L_UNDEF;
    const elementSort = manager.getSeqElementSort(manager.getReSeqSort(manager.sorts[probe]));
    const variable0 = manager.mkVar(0, elementSort);
    const getStates = (segments: number[][], index: number) => {
      const states: number[] = [];
      if (index < segments.length)
        for (let view = 0; view < segments[index].length; view += 2)
          states.push(segments[index][view]);
      return states;
    };
    const work: Node[] = [];
    const visited = new Set<string>();
    const push = (node: Node) => {
      const key = [
        node.leftSegment,
        node.rightSegment,
        ...node.leftStates.map((state) => manager.ids[state]),
        ...node.rightStates.map((state) => manager.ids[state]),
      ].join(",");
      if (visited.has(key)) return;
      visited.add(key);
      work.push(node);
    };
    push({
      leftSegment: 0,
      rightSegment: 0,
      leftStates: getStates(left, 0),
      rightStates: getStates(right, 0),
    });
    const derive = this.re.getDerive();
    let isBailing = false;
    for (let head = 0; head < work.length; head++) {
      if (this.isOutOfBudget()) return L_UNDEF;
      const node = work[head];
      const isLeftDone = node.leftSegment === left.length;
      const isRightDone = node.rightSegment === right.length;
      if (isLeftDone && isRightDone) return L_TRUE;
      if (!isLeftDone) {
        const isDone = this.isSegmentDone(left[node.leftSegment], node.leftStates);
        if (isDone === L_UNDEF) return L_UNDEF;
        if (isDone === L_TRUE)
          push({
            ...node,
            leftSegment: node.leftSegment + 1,
            leftStates: getStates(left, node.leftSegment + 1),
          });
      }
      if (!isRightDone) {
        const isDone = this.isSegmentDone(right[node.rightSegment], node.rightStates);
        if (isDone === L_UNDEF) return L_UNDEF;
        if (isDone === L_TRUE)
          push({
            ...node,
            rightSegment: node.rightSegment + 1,
            rightStates: getStates(right, node.rightSegment + 1),
          });
      }
      if (isLeftDone || isRightDone) continue;
      const branches = [...node.leftStates, ...node.rightStates].map((state) =>
        derive.getCachedCofactors(TRANSITION_LIGHT_ANTIMIROV, state),
      );
      const currentLeft = [...node.leftStates];
      const currentRight = [...node.rightStates];
      const numLeft = currentLeft.length;
      const recurse = (index: number, accumulated: GuardSet) => {
        if (isBailing) return;
        if (index === branches.length) {
          push({
            leftSegment: node.leftSegment,
            rightSegment: node.rightSegment,
            leftStates: [...currentLeft],
            rightStates: [...currentRight],
          });
          return;
        }
        const cofactors = branches[index];
        for (let pair = 0; pair < cofactors.size; pair += 2) {
          const target = cofactors.items[pair + 1];
          if (isReEmpty(manager, target)) continue;
          const joint = accumulated.clone();
          joint.conjoin(cofactors.items[pair]);
          const status = joint.eval(false).status;
          if (status === L_UNDEF) {
            joint.release();
            isBailing = true;
            return;
          }
          if (status === L_FALSE) {
            joint.release();
            continue;
          }
          if (index < numLeft) currentLeft[index] = target;
          else currentRight[index - numLeft] = target;
          recurse(index + 1, joint);
          joint.release();
          if (isBailing) return;
        }
      };
      const top = new GuardSet(manager, elementSort, variable0, this.rangeCache);
      recurse(0, top);
      top.release();
      if (isBailing) return L_UNDEF;
    }
    return L_FALSE;
  }

  check(lhs: number, rhs: number) {
    this.used.length = 0;
    this.rangeCache.maybeReset(RANGE_CACHE_CAP);
    const left: number[][] = [];
    const right: number[][] = [];
    this.toSegments(lhs, left);
    this.toSegments(rhs, right);
    return this.intersectNonempty(left, right);
  }
}
