// Ported from Z3 (src/ast/pattern/pattern_inference.cpp), MIT license, see z3-license.txt.
// Infers E-matching patterns for quantifiers that have none, with Z3's default parameters:
// pi.max_multi_patterns=0, pi.block_loop_patterns=true, pi.decompose_patterns=true,
// pi.arith=1 (conservative), pi.avoid_skolems=true.
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_FALSE,
  OP_IDIV,
  OP_MOD,
  OP_MUL,
  OP_TRUE,
} from "./ast";
import { shiftVars } from "./rewriter";

interface CandidateInfo {
  freeVars: Set<number>;
  boundVars: Set<number>;
  size: number;
}

interface PrePattern {
  exprs: number[];
  freeVars: Set<number>;
  index: number;
}

const PI_ARITH_WEIGHT = 5;
const PI_NON_NESTED_ARITH_WEIGHT = 10;
const MAX_SPLITS = 32;

const isSameSet = (left: Set<number>, right: Set<number>) =>
  left.size === right.size && [...left].every((element) => right.has(element));

const isSubset = (left: Set<number>, right: Set<number>) =>
  [...left].every((element) => right.has(element));

class PatternInference {
  private candidates: number[] = [];
  private candidateInfos = new Map<number, CandidateInfo>();
  private numBindings = 0;
  isArithForbidden = true;
  isNestedArithOnly = true;
  isBlockingLoopPatterns = true;

  constructor(private manager: AstManager) {}

  private isForbidden(expr: number) {
    const manager = this.manager;
    if (manager.isGround(expr)) return false;
    const decl = manager.funcDecls[manager.decls[expr]];
    if (decl.isSkolem) return true;
    if (decl.family === FAMILY_BASIC) return decl.op !== OP_TRUE && decl.op !== OP_FALSE;
    return decl.family === FAMILY_ARITH && this.isArithForbidden;
  }

  private collect(body: number) {
    const manager = this.manager;
    const cache = new Map<string, CandidateInfo | null>();
    const visit = (expr: number, delta: number): CandidateInfo | null => {
      const key = `${expr}:${delta}`;
      if (cache.has(key)) return cache.get(key) ?? null;
      let info: CandidateInfo | null = null;
      const kind = manager.kinds[expr];
      if (kind === KIND_VAR) {
        const index = manager.values[expr];
        const freeVars = new Set<number>();
        const boundVars = new Set<number>();
        if (delta <= index && index < this.numBindings + delta) freeVars.add(index - delta);
        else if (index < delta) boundVars.add(index);
        info = { freeVars, boundVars, size: 1 };
      } else if (kind === KIND_APP) {
        const args = manager.args[expr];
        const childInfos = args.map((innerArg) => visit(innerArg, delta));
        if (this.isForbidden(expr)) info = null;
        else if (args.length === 0) info = { freeVars: new Set(), boundVars: new Set(), size: 1 };
        else if (childInfos.every((childInfo) => childInfo !== null)) {
          const freeVars = new Set<number>();
          const boundVars = new Set<number>();
          let size = 1;
          for (const childInfo of childInfos) {
            if (childInfo === null) continue;
            childInfo.freeVars.forEach((element) => freeVars.add(element));
            childInfo.boundVars.forEach((element) => boundVars.add(element));
            size += childInfo.size;
          }
          info = { freeVars, boundVars, size };
          const decl = manager.funcDecls[manager.decls[expr]];
          const isArithCandidate =
            !this.isNestedArithOnly &&
            (decl.op === OP_IDIV || decl.op === OP_MOD || decl.op === OP_MUL);
          if (
            freeVars.size > 0 &&
            boundVars.size === 0 &&
            (decl.family !== FAMILY_ARITH || isArithCandidate)
          )
            this.addCandidate(shiftVars(manager, expr, -delta), freeVars, size);
        }
      } else if (kind === KIND_QUANTIFIER) {
        const data = manager.getQuantifier(expr);
        const count = data.sorts.length;
        const bodyInfo = visit(data.body, delta + count);
        if (bodyInfo !== null) {
          const boundVars = new Set<number>();
          bodyInfo.boundVars.forEach((element) => {
            if (element >= count) boundVars.add(element - count);
          });
          info = { freeVars: bodyInfo.freeVars, boundVars, size: bodyInfo.size + 1 };
        }
      }
      cache.set(key, info);
      return info;
    };
    visit(body, 0);
  }

  private addCandidate(expr: number, freeVars: Set<number>, size: number) {
    if (this.candidateInfos.has(expr)) return;
    this.candidateInfos.set(expr, { freeVars, boundVars: new Set(), size });
    this.candidates.push(expr);
  }

  // smaller_pattern: whether second is an instance of first.
  private isSmaller(first: number, second: number) {
    const manager = this.manager;
    const bindings = new Array<number>(this.numBindings).fill(-1);
    const todo: [number, number][] = [[first, second]];
    while (todo.length > 0) {
      const pair = todo.pop();
      if (pair === undefined) break;
      const left = pair[0];
      const right = pair[1];
      const kind = manager.kinds[left];
      if (kind === KIND_APP) {
        if (
          manager.kinds[right] !== KIND_APP ||
          manager.decls[left] !== manager.decls[right] ||
          manager.args[left].length !== manager.args[right].length ||
          manager.values[left] !== manager.values[right]
        )
          return false;
        manager.args[left].forEach((innerArg, index) =>
          todo.push([innerArg, manager.args[right][index]]),
        );
      } else if (kind === KIND_VAR && manager.values[left] < this.numBindings) {
        const index = manager.values[left];
        if (bindings[index] === -1) bindings[index] = right;
        else if (bindings[index] !== right) return false;
      } else if (left !== right) return false;
    }
    return true;
  }

  private filterLoopingPatterns() {
    const result: number[] = [];
    for (const first of this.candidates) {
      const firstInfo = this.candidateInfos.get(first);
      if (firstInfo === undefined) continue;
      const isLooping =
        this.isBlockingLoopPatterns &&
        this.candidates.some((second) => {
          if (second === first) return false;
          const secondInfo = this.candidateInfos.get(second);
          return (
            secondInfo !== undefined &&
            isSameSet(firstInfo.freeVars, secondInfo.freeVars) &&
            this.isSmaller(first, second) &&
            !this.isSmaller(second, first)
          );
        });
      if (isLooping) this.candidateInfos.delete(first);
      else result.push(first);
    }
    return result;
  }

  private containsSubpattern(expr: number) {
    const manager = this.manager;
    const info = this.candidateInfos.get(expr);
    if (info === undefined) return false;
    const visited = new Set<number>([expr]);
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo.pop();
      if (current === undefined) break;
      if (manager.kinds[current] !== KIND_APP) continue;
      if (current !== expr) {
        const currentInfo = this.candidateInfos.get(current);
        if (currentInfo !== undefined && isSameSet(currentInfo.freeVars, info.freeVars))
          return true;
      }
      for (const arg of manager.args[current])
        if (!visited.has(arg)) {
          visited.add(arg);
          todo.push(arg);
        }
    }
    return false;
  }

  private mkPattern(candidate: number): number[] {
    const manager = this.manager;
    const hasVarArg = (expr: number) =>
      manager.kinds[expr] === KIND_APP &&
      manager.args[expr].some((innerArg) => manager.isVar(innerArg));
    if (hasVarArg(candidate)) return [candidate];
    const args: number[] = [];
    for (const arg of manager.args[candidate]) {
      if (manager.kinds[arg] !== KIND_APP) return [candidate];
      args.push(arg);
    }
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (hasVarArg(arg)) continue;
      args[index] = args[args.length - 1];
      index--;
      args.pop();
      if (manager.isGround(arg)) continue;
      for (const innerArg of manager.args[arg]) {
        if (manager.kinds[innerArg] !== KIND_APP) return [candidate];
        args.push(innerArg);
      }
    }
    return args;
  }

  private candidatesToMultiPatterns(maxPatterns: number, candidates: number[], result: number[][]) {
    const prePatterns: (PrePattern | null)[] = [{ exprs: [], freeVars: new Set(), index: 0 }];
    let numSplits = 0;
    for (let index = 0; index < prePatterns.length; index++) {
      const current = prePatterns[index];
      if (current === null) continue;
      if (current.freeVars.size === this.numBindings) {
        result.push(current.exprs);
        if (result.length >= maxPatterns) return;
      } else if (current.index < candidates.length) {
        const candidate = candidates[current.index];
        const candidateFreeVars = this.candidateInfos.get(candidate)?.freeVars ?? new Set<number>();
        if (!isSubset(candidateFreeVars, current.freeVars)) {
          prePatterns.push({
            exprs: [...current.exprs, candidate],
            freeVars: new Set([...current.freeVars, ...candidateFreeVars]),
            index: current.index + 1,
          });
          if (numSplits < MAX_SPLITS) {
            prePatterns[index] = null;
            current.index++;
            prePatterns.push(current);
            numSplits++;
          }
        } else {
          prePatterns[index] = null;
          current.index++;
          prePatterns.push(current);
        }
      }
    }
  }

  mkPatterns(numBindings: number, body: number) {
    this.numBindings = numBindings;
    this.candidates = [];
    this.candidateInfos = new Map();
    this.collect(body);
    const result: number[][] = [];
    if (this.candidates.length === 0) return result;
    const nonLooping = this.filterLoopingPatterns();
    const smallest = nonLooping.filter((candidate) => !this.containsSubpattern(candidate));
    const remaining: number[] = [];
    for (const candidate of smallest) {
      const info = this.candidateInfos.get(candidate);
      if (info !== undefined && info.freeVars.size === numBindings)
        result.push(this.mkPattern(candidate));
      else remaining.push(candidate);
    }
    const numExtraMultiPatterns = result.length === 0 ? 1 : 0;
    if (numExtraMultiPatterns > 0 && remaining.length > 0) {
      const weightOf = (candidate: number) => this.candidateInfos.get(candidate);
      const sorted = remaining
        .map((candidate, index) => ({ candidate, index }))
        .sort((left, right) => {
          const leftInfo = weightOf(left.candidate);
          const rightInfo = weightOf(right.candidate);
          if (leftInfo === undefined || rightInfo === undefined) return left.index - right.index;
          if (leftInfo.freeVars.size !== rightInfo.freeVars.size)
            return rightInfo.freeVars.size - leftInfo.freeVars.size;
          if (leftInfo.size !== rightInfo.size) return leftInfo.size - rightInfo.size;
          return left.index - right.index;
        })
        .map((entry) => entry.candidate);
      this.candidatesToMultiPatterns(numExtraMultiPatterns, sorted, result);
    }
    return result;
  }
}

export interface InferredPatterns {
  patterns: number[][];
  weight: number;
}

// pattern_inference_cfg::reduce_quantifier for a quantifier without patterns.
export const inferPatterns = (
  manager: AstManager,
  numBindings: number,
  body: number,
  weight: number,
): InferredPatterns => {
  const inference = new PatternInference(manager);
  const patterns = inference.mkPatterns(numBindings, body);
  if (patterns.length > 0) return { patterns, weight };
  inference.isArithForbidden = false;
  inference.isBlockingLoopPatterns = false;
  const arithPatterns = inference.mkPatterns(numBindings, body);
  if (arithPatterns.length > 0)
    return { patterns: arithPatterns, weight: Math.max(weight, PI_ARITH_WEIGHT) };
  inference.isNestedArithOnly = false;
  const nonNestedPatterns = inference.mkPatterns(numBindings, body);
  return {
    patterns: nonNestedPatterns,
    weight: nonNestedPatterns.length > 0 ? Math.max(weight, PI_NON_NESTED_ARITH_WEIGHT) : weight,
  };
};
