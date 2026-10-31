// Ported from Z3 (src/math/lp/var_eqs.h, src/math/lp/nla_defs.h), MIT license, see z3-license.txt.
// Equivalences between signed lp variables, x = y or x = -y, with the bounds that justify them. A
// signed variable is the index 2 * var + sign.
import { Dependency, linearize } from "./dependency";
import type { Explanation } from "./explanation";
import { TrailStack, UnionFind, UnionFindHandler } from "./union-find";
import { shrink } from "../array";

export const mkSignedVar = (lpVar: number, isNegated: boolean) => lpVar * 2 + (isNegated ? 1 : 0);
export const getSignedVarVar = (signedVar: number) => signedVar >> 1;
export const isSignedVarNegated = (signedVar: number) => (signedVar & 1) === 1;
export const negateSignedVar = (signedVar: number) => signedVar ^ 1;

// An eq_justification: its dependencies up to the first null.
type EqJustification = Dependency[];

interface EqEdge {
  readonly signedVar: number;
  readonly justification: EqJustification;
}

interface VarFrame {
  readonly signedVar: number;
  readonly index: number;
}

export class VarEqs {
  readonly trail = new TrailStack();
  private eqTrail: [number, number][] = [];
  private eqTrailScopes: number[] = [];
  private eqs: EqEdge[][] = [];
  private isMarked: boolean[] = [];

  private unionFind = new UnionFind(this.trail);

  setMergeHandler(handler: UnionFindHandler) {
    this.unionFind.handler = handler;
  }

  push() {
    this.eqTrailScopes.push(this.eqTrail.length);
    this.trail.pushScope();
  }

  pop(count: number) {
    const size = this.eqTrailScopes[this.eqTrailScopes.length - count];
    for (let index = this.eqTrail.length; index-- > size;) {
      const pair = this.eqTrail[index];
      this.eqs[pair[0]].pop();
      this.eqs[pair[1]].pop();
      this.eqs[negateSignedVar(pair[0])].pop();
      this.eqs[negateSignedVar(pair[1])].pop();
    }
    shrink(this.eqTrail, size);
    shrink(this.eqTrailScopes, this.eqTrailScopes.length - count);
    this.trail.popScope(count);
  }

  merge(v1: number, v2: number, justification: EqJustification) {
    if (v1 === v2 || getSignedVarVar(this.find(v1)) === getSignedVarVar(this.find(v2))) return;
    const maxIndex = Math.max(v1, v2) + 2;
    while (this.eqs.length < maxIndex) this.eqs.push([]);
    while (this.unionFind.numVars <= maxIndex) this.unionFind.mkVar();
    this.eqTrail.push([v1, v2]);
    this.unionFind.merge(v1, v2);
    this.unionFind.merge(negateSignedVar(v1), negateSignedVar(v2));
    this.eqs[v1].push({ signedVar: v2, justification });
    this.eqs[v2].push({ signedVar: v1, justification });
    this.eqs[negateSignedVar(v1)].push({ signedVar: negateSignedVar(v2), justification });
    this.eqs[negateSignedVar(v2)].push({ signedVar: negateSignedVar(v1), justification });
  }

  mergePlus(first: number, second: number, justification: EqJustification) {
    this.merge(mkSignedVar(first, false), mkSignedVar(second, false), justification);
  }

  mergeMinus(first: number, second: number, justification: EqJustification) {
    this.merge(mkSignedVar(first, false), mkSignedVar(second, true), justification);
  }

  find(signedVar: number) {
    return signedVar >= this.unionFind.numVars ? signedVar : this.unionFind.find(signedVar);
  }

  findVar(lpVar: number) {
    return this.find(mkSignedVar(lpVar, false));
  }

  isRoot(lpVar: number) {
    return getSignedVarVar(this.findVar(lpVar)) === lpVar;
  }

  // explain_bfs: the justifications along a shortest path from v1 to v2.
  explain(v1: number, v2: number, explanation: Explanation) {
    if (v1 === v2) return;
    const todo: VarFrame[] = [{ signedVar: v1, index: 0 }];
    const justifications: EqJustification[] = [[]];
    const markedTrail = [v1];
    this.isMarked[v1] = true;
    let head = 0;
    for (; ; head++) {
      const frame = todo[head];
      if (frame.signedVar === v2) break;
      const next = this.eqs[frame.signedVar];
      for (let index = next.length; index-- > 0;) {
        const edge = next[index];
        if (this.isMarked[edge.signedVar]) continue;
        todo.push({ signedVar: edge.signedVar, index: head });
        justifications.push(edge.justification);
        markedTrail.push(edge.signedVar);
        this.isMarked[edge.signedVar] = true;
      }
    }
    while (head !== 0) {
      for (const dep of justifications[head]) {
        if (dep === null) break;
        for (const constraint of linearize([dep])) explanation.push(constraint);
      }
      head = todo[head].index;
    }
    for (const signedVar of markedTrail) this.isMarked[signedVar] = false;
  }

  explainVar(lpVar: number, explanation: Explanation) {
    const signedVar = mkSignedVar(lpVar, false);
    this.explain(this.find(signedVar), signedVar, explanation);
  }

  // The members of the class of a signed variable, from the variable around the union-find cycle.
  *getClass(signedVar: number) {
    if (signedVar >= this.unionFind.numVars) {
      yield signedVar;
      return;
    }
    let current = signedVar;
    do {
      yield current;
      current = this.unionFind.next(current);
    } while (current !== signedVar);
  }
}
