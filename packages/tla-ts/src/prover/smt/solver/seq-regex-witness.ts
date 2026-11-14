// Ported from Z3 (src/ast/rewriter/seq_regex_witness.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import { GuardSet, GuardSetCache } from "./guard-set";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { TRANSITION_LIGHT_ANTIMIROV } from "./seq-derive";
import { isReEmpty } from "./seq-re-util";
import type { ReRewriter } from "./seq-re-rewriter";

const MAX_STATES = 1 << 14;
const MAX_GUARD_CACHE_SIZE = 1 << 16;

export interface RegexWitnessResult {
  status: number;
  chars: number[];
}

export class RegexWitness {
  private pins: RefVector;
  private guardCache: GuardSetCache;

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
  ) {
    this.pins = new RefVector(manager);
    this.guardCache = new GuardSetCache(manager);
  }

  release() {
    this.guardCache.reset();
    this.pins.reset();
  }

  private getNullability(regex: number) {
    const manager = this.manager;
    const nullable = this.re.info.getInfo(regex).nullable;
    if (nullable !== L_UNDEF) return nullable;
    const result = this.re.isNullable(regex);
    return manager.isTrue(result) ? L_TRUE : manager.isFalse(result) ? L_FALSE : L_UNDEF;
  }

  getWitness(regex: number): RegexWitnessResult {
    const manager = this.manager;
    const undecided = { status: L_UNDEF, chars: [] };
    if (!manager.isStringSort(manager.getReSeqSort(manager.sorts[regex]))) return undecided;
    this.pins.reset();
    this.guardCache.maybeReset(MAX_GUARD_CACHE_SIZE);
    if (isReEmpty(manager, regex)) return { status: L_FALSE, chars: [] };
    const elementSort = manager.getSeqElementSort(manager.getReSeqSort(manager.sorts[regex]));
    const variable = manager.mkVar(0, elementSort);
    const visited = new Set([regex]);
    const work = [regex];
    const parents = new Map<number, number>();
    const parentChars = new Map<number, number>();
    const derive = this.re.getDerive();
    let isBailing = false;
    let numStates = 0;
    for (let head = 0; head < work.length; head++) {
      if (!manager.limit.inc()) return undecided;
      const state = work[head];
      if (++numStates > MAX_STATES) {
        isBailing = true;
        continue;
      }
      const nullability = this.getNullability(state);
      if (nullability === L_TRUE) {
        const chars: number[] = [];
        for (let current = state; current !== regex; current = parents.get(current)!)
          chars.push(manager.getChar(parentChars.get(current)!));
        return { status: L_TRUE, chars: chars.reverse() };
      }
      if (nullability === L_UNDEF) {
        isBailing = true;
        continue;
      }
      const cofactors = derive.getCachedCofactors(TRANSITION_LIGHT_ANTIMIROV, state);
      for (let index = 0; index < cofactors.size; index += 2) {
        const target = cofactors.items[index + 1];
        if (isReEmpty(manager, target) || visited.has(target)) continue;
        const guards = new GuardSet(manager, elementSort, variable, this.guardCache);
        guards.conjoin(cofactors.items[index]);
        const evaluated = guards.eval(true);
        guards.release();
        if (evaluated.status === L_UNDEF) {
          isBailing = true;
          continue;
        }
        if (evaluated.status === L_FALSE) continue;
        visited.add(target);
        this.pins.push(target);
        this.pins.push(evaluated.witness);
        parents.set(target, state);
        parentChars.set(target, evaluated.witness);
        work.push(target);
      }
    }
    return isBailing ? undecided : { status: L_FALSE, chars: [] };
  }
}
