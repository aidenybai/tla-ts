// Ported from Z3 (src/tactic/aig/aig.cpp, src/tactic/aig/aig.h), MIT license, see z3-license.txt.
// A node is 2 * id for a variable and 2 * (id - FIRST_NODE_ID) + 1 for an and, and a literal is
// 2 * node, plus 1 when inverted.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  OP_AND,
  OP_EQ,
  OP_FALSE,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_TRUE,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { combineHash } from "./hash";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";

const FIRST_NODE_ID = 2147483647;
const NULL_LIT = -1;
const TRUE_LIT = 0;
const FALSE_LIT = 1;
const INITIAL_NODES = 64;
const INITIAL_TABLE = 64;

const AIG_AND = 0;
const AIG_AUX_AND = 1;
const AIG_ITE = 2;

const CONNECTIVE_OPS = new Set([OP_NOT, OP_OR, OP_AND, OP_XOR, OP_IMPLIES, OP_ITE]);

const isInverted = (lit: number) => (lit & 1) === 1;
const isVar = (node: number) => (node & 1) === 0;
const getId = (node: number) => (isVar(node) ? node >> 1 : FIRST_NODE_ID + (node >> 1));
const isNotEq = (first: number, second: number) => (first ^ second) === 1;

const compareLits = (first: number, second: number) => {
  const firstId = getId(first >> 1);
  const secondId = getId(second >> 1);
  return firstId === secondId ? (second & 1) - (first & 1) : firstId - secondId;
};

const sortRange = (lits: number[], start: number) => {
  const sorted = lits.slice(start).sort(compareLits);
  for (const [offset, lit] of sorted.entries()) lits[start + offset] = lit;
};

const getGrown = (array: Int32Array, size: number, fill: number) => {
  const grown = new Int32Array(size).fill(fill);
  grown.set(array);
  return grown;
};

export class AigManager {
  refCounts = new Int32Array(INITIAL_NODES);
  lefts = new Int32Array(INITIAL_NODES);
  rights = new Int32Array(INITIAL_NODES);
  readonly varExprs: RefVector;
  iteCond = NULL_LIT;
  iteThen = NULL_LIT;
  iteElse = NULL_LIT;
  private nextVarId = 0;
  private readonly freeVarIds: number[] = [];
  private nextNodeIndex = 0;
  private readonly freeNodeIndexes: number[] = [];
  private table = new Int32Array(INITIAL_TABLE).fill(-1);
  private tableSize = 0;
  private readonly toDelete: number[] = [];

  constructor(readonly manager: AstManager) {
    this.varExprs = new RefVector(manager);
    this.mkVar(manager.trueExpr);
    this.incRef(TRUE_LIT);
    this.incRef(FALSE_LIT);
  }

  release() {
    this.decRef(TRUE_LIT);
    this.decRef(FALSE_LIT);
    this.varExprs.reset();
  }

  incRef(lit: number) {
    this.refCounts[lit >> 1]++;
  }

  decRef(lit: number) {
    this.decRefCore(lit >> 1);
    for (let node = this.toDelete.pop(); node !== undefined; node = this.toDelete.pop())
      this.deleteNode(node);
  }

  decRefResult(lit: number) {
    this.refCounts[lit >> 1]--;
  }

  private decRefCore(node: number) {
    this.refCounts[node]--;
    if (this.refCounts[node] === 0) this.toDelete.push(node);
  }

  private deleteNode(node: number) {
    if (isVar(node)) {
      this.freeVarIds.push(node >> 1);
      this.varExprs.set(node >> 1, -1);
      return;
    }
    this.eraseNode(node);
    this.freeNodeIndexes.push(node >> 1);
    this.decRefCore(this.lefts[node] >> 1);
    this.decRefCore(this.rights[node] >> 1);
  }

  private reserve(node: number) {
    if (node < this.refCounts.length) return;
    const size = Math.max(node + 1, 2 * this.refCounts.length);
    this.refCounts = getGrown(this.refCounts, size, 0);
    this.lefts = getGrown(this.lefts, size, 0);
    this.rights = getGrown(this.rights, size, 0);
  }

  private getHash(left: number, right: number) {
    return combineHash(left, right) & (this.table.length - 1);
  }

  private findNode(left: number, right: number) {
    const mask = this.table.length - 1;
    for (let slot = this.getHash(left, right); ; slot = (slot + 1) & mask) {
      const node = this.table[slot];
      if (node === -1 || (this.lefts[node] === left && this.rights[node] === right)) return node;
    }
  }

  private insertNode(node: number) {
    if (2 * (this.tableSize + 1) > this.table.length) {
      const old = this.table;
      this.table = new Int32Array(2 * old.length).fill(-1);
      for (const entry of old) if (entry !== -1) this.placeNode(entry);
    }
    this.placeNode(node);
    this.tableSize++;
  }

  private placeNode(node: number) {
    const mask = this.table.length - 1;
    let slot = this.getHash(this.lefts[node], this.rights[node]);
    while (this.table[slot] !== -1) slot = (slot + 1) & mask;
    this.table[slot] = node;
  }

  private eraseNode(node: number) {
    const mask = this.table.length - 1;
    let hole = this.getHash(this.lefts[node], this.rights[node]);
    while (this.table[hole] !== node) hole = (hole + 1) & mask;
    for (let next = (hole + 1) & mask; this.table[next] !== -1; next = (next + 1) & mask) {
      const home = this.getHash(this.lefts[this.table[next]], this.rights[this.table[next]]);
      if (((next - home) & mask) < ((next - hole) & mask)) continue;
      this.table[hole] = this.table[next];
      hole = next;
    }
    this.table[hole] = -1;
    this.tableSize--;
  }

  mkVar(expr: number) {
    const id = this.freeVarIds.pop() ?? this.nextVarId++;
    const node = 2 * id;
    this.reserve(node);
    this.refCounts[node] = 0;
    if (id === this.varExprs.size) this.varExprs.push(expr);
    else this.varExprs.set(id, expr);
    return 2 * node;
  }

  private mkNodeCore(left: number, right: number) {
    const found = this.findNode(left, right);
    if (found !== -1) return 2 * found;
    const node = 2 * (this.freeNodeIndexes.pop() ?? this.nextNodeIndex++) + 1;
    this.reserve(node);
    this.lefts[node] = left;
    this.rights[node] = right;
    this.refCounts[node] = 0;
    this.insertNode(node);
    this.incRef(left);
    this.incRef(right);
    return 2 * node;
  }

  mkAnd(first: number, second: number) {
    let left = first;
    let right = second;
    for (;;) {
      const isLeftInverted = isInverted(left);
      const leftNode = left >> 1;
      const isRightInverted = isInverted(right);
      const rightNode = right >> 1;
      if (leftNode === 0) return isLeftInverted ? FALSE_LIT : right;
      if (rightNode === 0) return isRightInverted ? FALSE_LIT : left;
      if (leftNode === rightNode) return isLeftInverted === isRightInverted ? left : FALSE_LIT;
      if (!isVar(leftNode)) {
        const a = this.lefts[leftNode];
        const b = this.rights[leftNode];
        if (isNotEq(a, right) || isNotEq(b, right)) return isLeftInverted ? right : FALSE_LIT;
        if (a === right) {
          if (!isLeftInverted) return left;
          left = b ^ 1;
          continue;
        }
        if (b === right) {
          if (!isLeftInverted) return left;
          left = a ^ 1;
          continue;
        }
        if (!isVar(rightNode)) {
          const c = this.lefts[rightNode];
          const d = this.rights[rightNode];
          const isComplementary = isNotEq(a, c) || isNotEq(a, d) || isNotEq(b, c) || isNotEq(b, d);
          if (!isLeftInverted && !isRightInverted) {
            if (isComplementary) return FALSE_LIT;
            if (a === c || b === c) {
              right = d;
              continue;
            }
            if (b === c || b === d) {
              left = a;
              continue;
            }
            if (a === d || b === d) {
              right = c;
              continue;
            }
            if (a === c || a === d) {
              left = b;
              continue;
            }
          }
          if (isLeftInverted && !isRightInverted) {
            if (isComplementary) return right;
            if (b === c || b === d) {
              left = a ^ 1;
              continue;
            }
            if (a === c || a === d) {
              left = b ^ 1;
              continue;
            }
          }
          if (!isLeftInverted && isRightInverted) {
            if (isComplementary) return left;
            if (c === a || c === b) {
              right = d ^ 1;
              continue;
            }
            if (d === a || d === b) {
              right = c ^ 1;
              continue;
            }
          }
          if (isLeftInverted && isRightInverted) {
            if (a === c && isNotEq(b, d)) return a ^ 1;
            if (isNotEq(a, c) && b === d) return b ^ 1;
          }
        }
      }
      if (!isVar(rightNode)) {
        const a = this.lefts[rightNode];
        const b = this.rights[rightNode];
        if (isNotEq(left, a) || isNotEq(left, b)) return isRightInverted ? left : FALSE_LIT;
        if (a === left) {
          if (!isRightInverted) return right;
          right = b ^ 1;
          continue;
        }
        if (b === left) {
          if (!isRightInverted) return right;
          right = a ^ 1;
          continue;
        }
      }
      return getId(leftNode) > getId(rightNode)
        ? this.mkNodeCore(right, left)
        : this.mkNodeCore(left, right);
    }
  }

  mkOr(first: number, second: number) {
    return this.mkAnd(first ^ 1, second ^ 1) ^ 1;
  }

  // Sorts the literals from start on in place, since the caller releases them in that order.
  mkJunction(lits: number[], start: number, isOr: boolean) {
    const count = lits.length - start;
    if (count === 0) return isOr ? FALSE_LIT : TRUE_LIT;
    if (count === 1) return lits[start];
    const mk = (first: number, second: number) =>
      isOr ? this.mkOr(first, second) : this.mkAnd(first, second);
    if (count === 2) return mk(lits[start], lits[start + 1]);
    sortRange(lits, start);
    let result = mk(lits[start], lits[start + 1]);
    this.incRef(result);
    for (let index = start + 2; index < lits.length; index++) {
      const next = mk(result, lits[index]);
      this.incRef(next);
      this.decRef(result);
      result = next;
    }
    this.decRefResult(result);
    return result;
  }

  mkIte(cond: number, then: number, otherwise: number) {
    const first = this.mkAnd(cond, then ^ 1);
    const second = this.mkAnd(cond ^ 1, otherwise ^ 1);
    return this.mkGate(first, second);
  }

  mkIff(left: number, right: number) {
    const first = this.mkAnd(left, right ^ 1);
    const second = this.mkAnd(left ^ 1, right);
    return this.mkGate(first, second);
  }

  private mkGate(first: number, second: number) {
    this.incRef(first);
    this.incRef(second);
    const result = this.mkAnd(first ^ 1, second ^ 1);
    this.incRef(result);
    this.decRef(first);
    this.decRef(second);
    this.decRefResult(result);
    return result;
  }

  mkXor(left: number, right: number) {
    return this.mkIff(left ^ 1, right);
  }

  mkImplies(left: number, right: number) {
    return this.mkOr(left ^ 1, right);
  }

  private setIte(cond: number, then: number, otherwise: number) {
    this.iteCond = cond;
    this.iteThen = then;
    this.iteElse = otherwise;
    return true;
  }

  isIte(node: number) {
    if (isVar(node)) return false;
    const left = this.lefts[node];
    const right = this.rights[node];
    if (!isInverted(left) || !isInverted(right)) return false;
    const leftNode = left >> 1;
    const rightNode = right >> 1;
    if (isVar(leftNode) || isVar(rightNode)) return false;
    const left1 = this.lefts[leftNode] ^ 1;
    const left2 = this.rights[leftNode] ^ 1;
    const right1 = this.lefts[rightNode] ^ 1;
    const right2 = this.rights[rightNode] ^ 1;
    if (isNotEq(left1, right1))
      return isInverted(left1)
        ? this.setIte(right1, left2, right2)
        : this.setIte(left1, right2, left2);
    if (isNotEq(left1, right2))
      return isInverted(left1)
        ? this.setIte(right2, left2, right1)
        : this.setIte(left1, right1, left2);
    if (isNotEq(left2, right1))
      return isInverted(left2)
        ? this.setIte(right1, left1, right2)
        : this.setIte(left2, right2, left1);
    if (isNotEq(left2, right2))
      return isInverted(left2)
        ? this.setIte(right2, left1, right1)
        : this.setIte(left2, right1, left1);
    return false;
  }

  mkAig(expr: number) {
    const converter = new Expr2Aig(this);
    const result = converter.convert(expr);
    this.incRef(result);
    converter.release();
    this.decRefResult(result);
    return result;
  }

  maxSharing(lit: number) {
    return new MaxSharing(this).apply(lit);
  }

  // The result comes with a reference.
  toFormula(lit: number) {
    const converter = new Aig2Expr(this);
    const result = converter.convert(lit);
    converter.release();
    return result;
  }
}

class Expr2Aig {
  private readonly frameExprs: number[] = [];
  private readonly frameIndexes: number[] = [];
  private readonly frameStarts: number[] = [];
  private readonly results: number[] = [];
  private readonly cache: ObjMap<number>;

  constructor(private readonly aigs: AigManager) {
    this.cache = new ObjMap((expr) => aigs.manager.hashes[expr]);
  }

  release() {
    for (const [, lit] of this.cache) this.aigs.decRef(lit);
    this.restoreResults(0);
  }

  private saveResult(lit: number) {
    this.aigs.incRef(lit);
    this.results.push(lit);
  }

  private cacheResult(expr: number, lit: number) {
    this.aigs.incRef(lit);
    this.cache.set(expr, lit);
  }

  private isCached(expr: number) {
    const lit = this.cache.get(expr);
    if (lit === undefined) return false;
    this.saveResult(lit);
    return true;
  }

  private visit(expr: number) {
    const manager = this.aigs.manager;
    if (manager.kinds[expr] === KIND_APP) {
      const op = manager.getOp(expr);
      if (op === OP_TRUE || op === OP_FALSE) {
        this.saveResult(op === OP_TRUE ? TRUE_LIT : FALSE_LIT);
        return true;
      }
      if (CONNECTIVE_OPS.has(op) || (op === OP_EQ && manager.isBool(manager.getArg(expr, 0)))) {
        if (manager.getRefCount(expr) > 1 && this.isCached(expr)) return true;
        this.frameExprs.push(expr);
        this.frameIndexes.push(0);
        this.frameStarts.push(this.results.length);
        return false;
      }
    }
    if (this.isCached(expr)) return true;
    const lit = this.aigs.mkVar(expr);
    this.cacheResult(expr, lit);
    this.saveResult(lit);
    return true;
  }

  private restoreResults(size: number) {
    for (let index = size; index < this.results.length; index++)
      this.aigs.decRef(this.results[index]);
    this.results.length = size;
  }

  private saveNodeResult(start: number, lit: number) {
    this.aigs.incRef(lit);
    this.restoreResults(start);
    this.saveResult(lit);
    this.aigs.decRef(lit);
  }

  private mkXor(start: number) {
    const results = this.results;
    if (results.length === start) return FALSE_LIT;
    let lit = results[start];
    for (let index = start + 1; index < results.length; index++)
      lit = this.aigs.mkXor(lit, results[index]);
    return lit;
  }

  private mkAig(expr: number, start: number) {
    const aigs = this.aigs;
    const results = this.results;
    const op = aigs.manager.getOp(expr);
    if (op === OP_NOT) results[start] ^= 1;
    else if (op === OP_OR || op === OP_AND)
      this.saveNodeResult(start, aigs.mkJunction(results, start, op === OP_OR));
    else if (op === OP_EQ) {
      if (start + 2 !== results.length)
        throw new SmtTacticError("aig conversion assumes expressions have been simplified");
      this.saveNodeResult(start, aigs.mkIff(results[start], results[start + 1]));
    } else if (op === OP_XOR) this.saveNodeResult(start, this.mkXor(start));
    else if (op === OP_IMPLIES)
      this.saveNodeResult(start, aigs.mkImplies(results[start], results[start + 1]));
    else
      this.saveNodeResult(
        start,
        aigs.mkIte(results[start], results[start + 1], results[start + 2]),
      );
    if (aigs.manager.getRefCount(expr) > 1) this.cacheResult(expr, results[results.length - 1]);
  }

  convert(root: number) {
    const manager = this.aigs.manager;
    if (!this.visit(root))
      while (this.frameExprs.length > 0) {
        manager.limit.checkpoint();
        const top = this.frameExprs.length - 1;
        const expr = this.frameExprs[top];
        if (this.frameIndexes[top] === 0 && manager.getRefCount(expr) > 1 && this.isCached(expr)) {
          this.popFrame();
          continue;
        }
        const numArgs = manager.getNumArgs(expr);
        let isDescending = false;
        while (!isDescending && this.frameIndexes[top] < numArgs) {
          const arg = manager.getArg(expr, this.frameIndexes[top]);
          this.frameIndexes[top]++;
          isDescending = !this.visit(arg);
        }
        if (isDescending) continue;
        this.mkAig(expr, this.frameStarts[top]);
        this.popFrame();
      }
    const result = this.results[this.results.length - 1];
    this.results.pop();
    this.aigs.decRefResult(result);
    return result;
  }

  private popFrame() {
    this.frameExprs.pop();
    this.frameIndexes.pop();
    this.frameStarts.pop();
  }
}

class MaxSharing {
  private readonly frameNodes: number[] = [];
  private readonly frameIndexes: number[] = [];
  private readonly results: number[] = [];
  private cache = new Int32Array(0);
  private readonly saved: number[] = [];

  constructor(private readonly aigs: AigManager) {}

  private pushResult(lit: number) {
    this.results.push(lit);
    if (lit !== NULL_LIT) this.aigs.incRef(lit);
  }

  private isCached(node: number) {
    if (this.aigs.refCounts[node] <= 1) return false;
    const lit = node >> 1 < this.cache.length ? this.cache[node >> 1] : NULL_LIT;
    if (lit === NULL_LIT) return false;
    this.pushResult(lit);
    return true;
  }

  private visit(node: number) {
    if (isVar(node)) {
      this.pushResult(NULL_LIT);
      return true;
    }
    if (this.isCached(node)) return true;
    this.frameNodes.push(node);
    this.frameIndexes.push(0);
    return false;
  }

  private saveResult(original: number, lit: number) {
    const aigs = this.aigs;
    if (aigs.refCounts[original] > 1) {
      const index = original >> 1;
      if (index >= this.cache.length)
        this.cache = getGrown(this.cache, Math.max(index + 1, 2 * this.cache.length), NULL_LIT);
      this.cache[index] = lit;
      this.saved.push(original, lit >> 1);
      aigs.incRef(2 * original);
      aigs.incRef(lit);
    }
    this.pushResult(original === lit >> 1 ? NULL_LIT : lit);
  }

  private pop2Results() {
    const size = this.results.length;
    const first = this.results[size - 1];
    const second = this.results[size - 2];
    this.results.length = size - 2;
    if (first !== NULL_LIT) this.aigs.decRef(first);
    if (second !== NULL_LIT) this.aigs.decRef(second);
  }

  private improveSharingLeft(original: number, lit: number) {
    const aigs = this.aigs;
    const leftNode = aigs.lefts[lit >> 1] >> 1;
    const a = aigs.lefts[leftNode];
    const b = aigs.rights[leftNode];
    const c = aigs.rights[lit >> 1];
    return (
      this.tryShared(original, lit, b, c, a, false) || this.tryShared(original, lit, a, c, b, false)
    );
  }

  private improveSharingRight(original: number, lit: number) {
    const aigs = this.aigs;
    const a = aigs.lefts[lit >> 1];
    const rightNode = aigs.rights[lit >> 1] >> 1;
    const b = aigs.lefts[rightNode];
    const c = aigs.rights[rightNode];
    return (
      this.tryShared(original, lit, a, b, c, true) || this.tryShared(original, lit, a, c, b, true)
    );
  }

  private tryShared(
    original: number,
    lit: number,
    first: number,
    second: number,
    rest: number,
    isInnerLeft: boolean,
  ) {
    const aigs = this.aigs;
    const inner = aigs.mkAnd(first, second);
    aigs.incRef(inner);
    const isShared = aigs.refCounts[inner >> 1] > 1;
    if (isShared) {
      const result = isInnerLeft ? aigs.mkAnd(inner, rest) : aigs.mkAnd(rest, inner);
      this.saveResult(original, isInverted(lit) ? result ^ 1 : result);
    }
    aigs.decRef(inner);
    return isShared;
  }

  private improveSharingCore(original: number, lit: number) {
    const aigs = this.aigs;
    const node = lit >> 1;
    if (!isVar(node)) {
      const left = aigs.lefts[node];
      if (
        !isInverted(left) &&
        aigs.refCounts[left >> 1] === 1 &&
        !isVar(left >> 1) &&
        this.improveSharingLeft(original, lit)
      )
        return;
      const right = aigs.rights[node];
      if (
        !isInverted(right) &&
        aigs.refCounts[right >> 1] === 1 &&
        !isVar(right >> 1) &&
        this.improveSharingRight(original, lit)
      )
        return;
    }
    this.saveResult(original, lit);
  }

  private improveSharing(node: number) {
    const aigs = this.aigs;
    const size = this.results.length;
    const newLeft = this.results[size - 2];
    const newRight = this.results[size - 1];
    if (newLeft === NULL_LIT && newRight === NULL_LIT) {
      this.pop2Results();
      this.improveSharingCore(node, 2 * node);
      return;
    }
    const oldLeft = aigs.lefts[node];
    const oldRight = aigs.rights[node];
    const left = newLeft === NULL_LIT ? oldLeft : newLeft ^ (oldLeft & 1);
    const right = newRight === NULL_LIT ? oldRight : newRight ^ (oldRight & 1);
    const lit = aigs.mkAnd(left, right);
    aigs.incRef(lit);
    this.pop2Results();
    this.improveSharingCore(node, lit);
    aigs.decRef(lit);
  }

  private process(root: number) {
    if (this.visit(root)) return;
    while (this.frameNodes.length > 0) {
      const top = this.frameNodes.length - 1;
      const node = this.frameNodes[top];
      if (this.frameIndexes[top] === 0) {
        this.frameIndexes[top]++;
        if (!this.visit(this.aigs.lefts[node] >> 1)) continue;
      }
      if (this.frameIndexes[top] === 1) {
        this.frameIndexes[top]++;
        if (!this.visit(this.aigs.rights[node] >> 1)) continue;
      }
      if (!this.isCached(node)) this.improveSharing(node);
      this.frameNodes.pop();
      this.frameIndexes.pop();
    }
  }

  apply(lit: number) {
    const aigs = this.aigs;
    this.process(lit >> 1);
    const top = this.results[this.results.length - 1];
    this.cache = new Int32Array(0);
    for (const node of this.saved) aigs.decRef(2 * node);
    this.saved.length = 0;
    const result = top === NULL_LIT ? lit : top ^ (lit & 1);
    if (top === NULL_LIT) aigs.incRef(result);
    this.results.pop();
    aigs.decRefResult(result);
    return result;
  }
}

class Aig2Expr {
  private readonly cache: RefVector;
  private readonly frameNodes: number[] = [];
  private readonly frameKinds: number[] = [];
  private readonly frameIsFirst: boolean[] = [];
  private readonly andChildren: number[] = [];
  private readonly andTodo: number[] = [];

  constructor(private readonly aigs: AigManager) {
    this.cache = new RefVector(aigs.manager);
  }

  release() {
    this.cache.reset();
  }

  private getCachedNode(node: number) {
    return this.cache.items[node >> 1];
  }

  private getNodeExpr(node: number) {
    return isVar(node) ? this.aigs.varExprs.items[node >> 1] : this.getCachedNode(node);
  }

  private invert(expr: number) {
    const manager = this.aigs.manager;
    if (manager.isNot(expr)) return manager.getArg(expr, 0);
    if (manager.isTrue(expr)) return manager.falseExpr;
    return manager.mkApp(OP_NOT, [expr], SORT_BOOL);
  }

  private getLitExpr(lit: number) {
    const expr = this.getNodeExpr(lit >> 1);
    return isInverted(lit) ? this.invert(expr) : expr;
  }

  private isCached(node: number) {
    if (isVar(node)) return true;
    if (node >> 1 >= this.cache.size) {
      this.cache.resize((node >> 1) + 1);
      return false;
    }
    return this.getCachedNode(node) !== -1;
  }

  private pushFrame(node: number, kind: number) {
    this.frameNodes.push(node);
    this.frameKinds.push(kind);
    this.frameIsFirst.push(true);
    return 1;
  }

  private visitAndChild(lit: number) {
    const node = lit >> 1;
    if (this.isCached(node)) return 0;
    if (this.aigs.isIte(node)) return this.pushFrame(node, AIG_ITE);
    if (!isInverted(lit) && this.aigs.refCounts[node] === 1)
      return this.pushFrame(node, AIG_AUX_AND);
    return this.pushFrame(node, AIG_AND);
  }

  private visitIteChild(lit: number) {
    const node = lit >> 1;
    if (this.isCached(node)) return 0;
    return this.pushFrame(node, this.aigs.isIte(node) ? AIG_ITE : AIG_AND);
  }

  private addChild(lit: number) {
    const node = lit >> 1;
    if (isInverted(lit)) this.andChildren.push(this.getNodeExpr(node));
    else if (this.isCached(node)) this.andChildren.push(this.invert(this.getNodeExpr(node)));
    else this.andTodo.push(node);
  }

  private mkAnd(node: number) {
    const aigs = this.aigs;
    this.andChildren.length = 0;
    this.andTodo.length = 0;
    this.addChild(aigs.lefts[node]);
    this.addChild(aigs.rights[node]);
    for (let todo = this.andTodo.pop(); todo !== undefined; todo = this.andTodo.pop()) {
      this.addChild(aigs.lefts[todo]);
      this.addChild(aigs.rights[todo]);
    }
    const manager = aigs.manager;
    const disjunction = manager.mkApp(OP_OR, this.andChildren, SORT_BOOL);
    this.cache.set(node >> 1, manager.mkApp(OP_NOT, [disjunction], SORT_BOOL));
  }

  private mkIte(node: number) {
    const aigs = this.aigs;
    const manager = aigs.manager;
    aigs.isIte(node);
    const isSwapped = isInverted(aigs.iteCond);
    const cond = aigs.iteCond & ~1;
    const then = isSwapped ? aigs.iteElse : aigs.iteThen;
    const otherwise = isSwapped ? aigs.iteThen : aigs.iteElse;
    const condExpr = this.getLitExpr(cond);
    const thenExpr = this.getLitExpr(then);
    this.cache.set(
      node >> 1,
      isNotEq(then, otherwise)
        ? manager.mkEq(condExpr, thenExpr)
        : manager.mkApp(OP_ITE, [condExpr, thenExpr, this.getLitExpr(otherwise)], SORT_BOOL),
    );
  }

  private processRoot(root: number) {
    const aigs = this.aigs;
    if (this.isCached(root)) return this.getNodeExpr(root);
    this.pushFrame(root, aigs.isIte(root) ? AIG_ITE : AIG_AND);
    while (this.frameNodes.length > 0) {
      aigs.manager.limit.checkpoint();
      const top = this.frameNodes.length - 1;
      const node = this.frameNodes[top];
      if (this.isCached(node)) {
        this.popFrame();
        continue;
      }
      const kind = this.frameKinds[top];
      if (this.frameIsFirst[top]) {
        this.frameIsFirst[top] = false;
        if (kind !== AIG_ITE) {
          const pushed =
            this.visitAndChild(aigs.lefts[node]) + this.visitAndChild(aigs.rights[node]);
          if (pushed > 0) continue;
        } else {
          const leftNode = aigs.lefts[node] >> 1;
          const rightNode = aigs.rights[node] >> 1;
          const a = aigs.lefts[leftNode];
          const b = aigs.rights[leftNode];
          const c = aigs.lefts[rightNode];
          const d = aigs.rights[rightNode];
          const isNew = (lit: number) => lit >> 1 !== a >> 1 && lit >> 1 !== b >> 1;
          const pushed =
            this.visitIteChild(a) +
            this.visitIteChild(b) +
            (isNew(c) ? this.visitIteChild(c) : 0) +
            (isNew(d) ? this.visitIteChild(d) : 0);
          if (pushed > 0) continue;
        }
      }
      if (kind === AIG_AND) this.mkAnd(node);
      else if (kind === AIG_ITE) this.mkIte(node);
      this.popFrame();
    }
    return this.getNodeExpr(root);
  }

  private popFrame() {
    this.frameNodes.pop();
    this.frameKinds.pop();
    this.frameIsFirst.pop();
  }

  convert(lit: number) {
    const aigs = this.aigs;
    const manager = aigs.manager;
    const roots = [lit];
    const conjuncts = new RefVector(manager);
    for (let current = roots.pop(); current !== undefined; current = roots.pop()) {
      const node = current >> 1;
      if (isInverted(current)) conjuncts.push(this.invert(this.processRoot(node)));
      else if (aigs.isIte(node)) conjuncts.push(this.processRoot(node));
      else if (isVar(node)) conjuncts.push(aigs.varExprs.items[node >> 1]);
      else roots.push(aigs.lefts[node], aigs.rights[node]);
    }
    const result = manager.mkAnd(conjuncts.items);
    manager.incRef(result);
    conjuncts.reset();
    return result;
  }
}
