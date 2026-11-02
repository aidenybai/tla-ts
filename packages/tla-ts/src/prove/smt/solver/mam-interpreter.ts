// Ported from Z3 (src/smt/mam.cpp), MIT license, see z3-license.txt. The interpreter of Z3's
// matching abstract machine: it runs a code tree against a term, backtracking through the choices
// of BIND, CONTINUE and CHOOSE, and reports each match.
import type { Context } from "./context";
import type { Enode } from "./enode";
import {
  type CodeTree,
  type Instruction,
  type Joint,
  JOINT_GROUND,
  JOINT_NESTED,
  JOINT_VAR,
  OP_BIND,
  OP_CFILTER,
  OP_CHECK,
  OP_CHOOSE,
  OP_COMPARE,
  OP_CONTINUE,
  OP_FILTER,
  OP_GET_CGR,
  OP_GET_ENODE,
  OP_INIT,
  OP_IS_CGR,
  OP_NOOP,
  OP_PFILTER,
  OP_YIELD,
} from "./mam-compiler";
import { OP_ITE } from "./ast";
import { shrink } from "./array";

export type OnMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) => void;

// GET_CGR1 to GET_CGR6 filter their arguments by the parent labels, GET_CGRN does not.
const MAX_FILTERED_GET_CGR_ARGS = 6;

const growVector = (vector: Int32Array, length: number) => {
  const grown = new Int32Array(Math.max(2 * vector.length, length));
  grown.set(vector);
  return grown;
};

// Registers, terms and candidates are node ids, and -1 is no node.
export class Interpreter {
  private registers = new Int32Array(64).fill(-1);
  // m_bindings: the terms a YIELD reports, which the match callback does not keep.
  private bindings: Enode[] = [];
  // backtrack_point, a column each: the instruction to resume, the generation to restore, the term
  // a BIND is at, and the terms a CONTINUE goes through, from index to the end of its candidates.
  private pointInstrs: Instruction[] = [];
  private pointOldMaxGenerations = new Int32Array(64);
  private pointCurrs = new Int32Array(64);
  private pointCandidates: Int32Array[] = [];
  private pointIndices = new Int32Array(64);
  private pointEnds = new Int32Array(64);
  // The vector of each depth, which holds a CONTINUE's terms when they are the parents of a joint,
  // and is reused by the next point at the same depth, like Z3's vector pool.
  private depthVectors: Int32Array[] = [];
  private spareVector: Int32Array = new Int32Array(16);
  // The arguments of GET_CGR.
  private argBuffer: number[] = [];
  private top = 0;
  // m_max_generation: the largest generation of a term the match went through.
  private maxGeneration = 0;

  constructor(
    private context: Context,
    private onMatch: OnMatch,
  ) {}

  private updateMaxGeneration(node: number) {
    this.maxGeneration = Math.max(this.maxGeneration, this.context.getGeneration(node));
  }

  // Makes room for the point above the top, which pushPoint pushes next.
  private reservePoint() {
    const top = this.top;
    if (top === this.pointOldMaxGenerations.length) {
      this.pointOldMaxGenerations = growVector(this.pointOldMaxGenerations, 0);
      this.pointCurrs = growVector(this.pointCurrs, 0);
      this.pointIndices = growVector(this.pointIndices, 0);
      this.pointEnds = growVector(this.pointEnds, 0);
    }
    if (top === this.depthVectors.length) this.depthVectors.push(new Int32Array(16));
  }

  private pushPoint(instr: Instruction, oldMaxGeneration: number) {
    this.reservePoint();
    const top = this.top;
    this.pointInstrs[top] = instr;
    this.pointOldMaxGenerations[top] = oldMaxGeneration;
    this.top = top + 1;
    return top;
  }

  // get_first_f_app and get_next_f_app: the next congruence root with the label in the class.
  private getNextFApp(label: number, numArgs: number, first: number, start: number) {
    const store = this.context.enodeStore;
    let curr = start === -1 ? first : store.next[start];
    if (start !== -1 && curr === first) return -1;
    do {
      if (
        store.decl[curr] === label &&
        store.cg[curr] === curr &&
        store.getNumArgs(curr) === numArgs
      ) {
        this.updateMaxGeneration(curr);
        return curr;
      }
      curr = store.next[curr];
    } while (curr !== first);
    return -1;
  }

  // exec_is_cgr: whether the class has a term with the label and the arguments of the registers.
  private isCgr(instr: Instruction) {
    const registers = this.registers;
    const store = this.context.enodeStore;
    const regs = instr.regs;
    for (let index = 0; index < regs.length; index++)
      if (registers[regs[index]] === -1) return false;
    const first = registers[instr.reg];
    if (first === -1) return false;
    const root = store.root;
    let node = first;
    do {
      let isMatch = store.decl[node] === instr.label && store.getNumArgs(node) === instr.numArgs;
      for (let index = 0; index < regs.length && isMatch; index++)
        isMatch = root[store.getArg(node, index)] === root[registers[regs[index]]];
      if (isMatch) {
        this.updateMaxGeneration(node);
        return true;
      }
      node = store.next[node];
    } while (node !== first);
    return false;
  }

  private isRelevantParent(parent: number, decl: number, argIndex: number, child: number) {
    const store = this.context.enodeStore;
    return (
      store.decl[parent] === decl &&
      store.cg[parent] === parent &&
      argIndex < store.getNumArgs(parent) &&
      store.root[store.argPool[store.argStart[parent] + argIndex]] === child &&
      this.context.isRelevant(store.owner[parent])
    );
  }

  // Appends a candidate to the spare vector, the count-th, growing the vector when it is full.
  private pushSpare(count: number, node: number) {
    if (count === this.spareVector.length)
      this.spareVector = growVector(this.spareVector, count + 1);
    this.spareVector[count] = node;
  }

  // mk_depth1_vector: the relevant decl-parents of the class of node where it is argument argIndex,
  // written to the start of the spare vector, and their number. init_continue drops a vector of
  // limit terms or more, so this stops at limit and returns -1.
  private collectDepth1(node: number, decl: number, argIndex: number, limit: number) {
    const store = this.context.enodeStore;
    const root = store.root[node];
    const parentPool = store.parentPool;
    const end = store.parentStart[root] + store.parentCount[root];
    let count = 0;
    for (let parentIndex = store.parentStart[root]; parentIndex < end; parentIndex++) {
      const parent = parentPool[parentIndex];
      if (!this.isRelevantParent(parent, decl, argIndex, root)) continue;
      if (count + 1 >= limit) return -1;
      this.pushSpare(count, parent);
      count++;
    }
    return count;
  }

  // mk_depth2_vector, which stops at limit like collectDepth1.
  private collectDepth2(joint: Joint, decl: number, argIndex: number, limit: number) {
    const node = this.registers[joint.reg];
    if (node === -1) return -1;
    const store = this.context.enodeStore;
    const root = store.root[node];
    if (store.parentCount[root] === 0) return -1;
    const parentPool = store.parentPool;
    const end = store.parentStart[root] + store.parentCount[root];
    let count = 0;
    for (let parentIndex = store.parentStart[root]; parentIndex < end; parentIndex++) {
      const parent = parentPool[parentIndex];
      if (!this.isRelevantParent(parent, joint.decl, joint.argPos, root)) continue;
      const parentRoot = store.root[parent];
      const parentEnd = store.parentStart[parentRoot] + store.parentCount[parentRoot];
      for (let index = store.parentStart[parentRoot]; index < parentEnd; index++) {
        const grandparent = parentPool[index];
        if (!this.isRelevantParent(grandparent, decl, argIndex, parentRoot)) continue;
        if (count + 1 >= limit) return -1;
        this.pushSpare(count, grandparent);
        count++;
      }
    }
    return count;
  }

  // Whether the class of node has a parent with one of the labels, low and high.
  private hasParentLabel(node: number, low: number, high: number) {
    const store = this.context.enodeStore;
    const root = store.root[node];
    return (store.labels[4 * root + 2] & low) !== 0 || (store.labels[4 * root + 3] & high) !== 0;
  }

  // SET_VAR's filter: whether the class of each input register has a parent with the label.
  private hasParentLabels(instr: Instruction) {
    const regs = instr.regs;
    for (let index = 0; index < regs.length; index++)
      if (!this.hasParentLabel(this.registers[regs[index]], instr.lblLow, instr.lblHigh))
        return false;
    return true;
  }

  private getJointNode(joint: Joint) {
    if (joint.kind === JOINT_GROUND) return joint.enode === null ? -1 : joint.enode.id;
    if (joint.kind === JOINT_VAR) return this.registers[joint.reg];
    return -1;
  }

  // init_continue: the smallest candidate vector among the joints, or all terms with the label.
  private initContinue(instr: Instruction) {
    const context = this.context;
    const store = context.enodeStore;
    const label = instr.label;
    const numAll = store.declCount[label];
    for (const joint of instr.joints) {
      const node = this.getJointNode(joint);
      if (node === -1) continue;
      if (!this.hasParentLabel(node, instr.lblLow, instr.lblHigh)) return -1;
      if (store.parentCount[store.root[node]] === 0) return -1;
    }
    // Each joint's vector goes into the spare vector, which trades places with the next point's
    // vector when it is the smallest so far.
    this.reservePoint();
    const top = this.top;
    let bestCount = -1;
    for (let argIndex = 0; argIndex < instr.joints.length; argIndex++) {
      const joint = instr.joints[argIndex];
      const node = this.getJointNode(joint);
      const limit = bestCount === -1 ? numAll : Math.min(numAll, bestCount);
      const count =
        node !== -1
          ? this.collectDepth1(node, label, argIndex, limit)
          : joint.kind === JOINT_NESTED
            ? this.collectDepth2(joint, label, argIndex, limit)
            : -1;
      if (count === -1 || count >= numAll || (bestCount !== -1 && count >= bestCount)) continue;
      if (count === 0) return -1;
      const spare = this.spareVector;
      this.spareVector = this.depthVectors[top];
      this.depthVectors[top] = spare;
      bestCount = count;
    }
    const candidates = bestCount === -1 ? store.declNodes[label] : this.depthVectors[top];
    const end = bestCount === -1 ? numAll : bestCount;
    let index = 0;
    while (index < end) {
      const node = candidates[index];
      if (store.getNumArgs(node) === instr.numArgs && context.isRelevant(store.owner[node])) break;
      index++;
    }
    if (index === end) return -1;
    this.pushPoint(instr, this.maxGeneration);
    this.pointCandidates[top] = candidates;
    this.pointIndices[top] = index;
    this.pointEnds[top] = end;
    this.updateMaxGeneration(candidates[index]);
    return candidates[index];
  }

  private setArgs(oreg: number, node: number, numArgs: number) {
    const store = this.context.enodeStore;
    const start = store.argStart[node];
    for (let index = 0; index < numArgs; index++)
      this.registers[oreg + index] = store.argPool[start + index];
  }

  // The backtracking step of execute_core: the instruction to resume at, or null when the top choice
  // is exhausted and was popped.
  private resume(point: number): Instruction | null {
    const instr = this.pointInstrs[point];
    if (instr.op === OP_CHOOSE) {
      this.top--;
      return instr.alt;
    }
    if (instr.op === OP_BIND) {
      const node = this.getNextFApp(
        instr.label,
        instr.numArgs,
        this.registers[instr.reg],
        this.pointCurrs[point],
      );
      if (node === -1) {
        this.top--;
        return null;
      }
      this.pointCurrs[point] = node;
      this.setArgs(instr.oreg, node, instr.numArgs);
      return instr.next;
    }
    const context = this.context;
    const store = context.enodeStore;
    const candidates = this.pointCandidates[point];
    const end = this.pointEnds[point];
    for (let index = this.pointIndices[point] + 1; index < end; index++) {
      const node = candidates[index];
      if (store.getNumArgs(node) === instr.numArgs && context.isRelevant(store.owner[node])) {
        this.pointIndices[point] = index;
        this.updateMaxGeneration(node);
        this.setArgs(instr.oreg, node, instr.numArgs);
        return instr.next;
      }
    }
    this.top--;
    return null;
  }

  // execute_core: runs the tree against a term, one instruction at a time, and backtracks when an
  // instruction fails. It returns false when the search is canceled.
  executeCore(tree: CodeTree, node: number) {
    const context = this.context;
    const store = context.enodeStore;
    if (this.registers.length < tree.numRegs) {
      const grown = new Int32Array(Math.max(2 * this.registers.length, tree.numRegs)).fill(-1);
      grown.set(this.registers);
      this.registers = grown;
    }
    const registers = this.registers;
    this.maxGeneration = context.getGeneration(node);
    registers[0] = node;
    this.top = 0;
    let sinceLastCheck = 0;
    let pc: Instruction | null = tree.root;
    for (;;) {
      if (pc === null) {
        if (this.top === 0) return true;
        const point = this.top - 1;
        this.maxGeneration = this.pointOldMaxGenerations[point];
        if (sinceLastCheck++ > 100) {
          sinceLastCheck = 0;
          if (context.checkCanceled()) {
            this.top = 0;
            return false;
          }
        }
        pc = this.resume(point);
        continue;
      }
      const instr: Instruction = pc;
      pc = null;
      switch (instr.op) {
        case OP_INIT: {
          if (store.getNumArgs(registers[0]) !== instr.numArgs) break;
          this.setArgs(1, registers[0], instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_COMPARE: {
          const first = registers[instr.reg];
          const second = registers[instr.reg2];
          if (first === -1 || second === -1) break;
          if (store.root[first] === store.root[second]) pc = instr.next;
          break;
        }
        case OP_CHECK: {
          const first = registers[instr.reg];
          const second = instr.enode;
          if (first === -1 || second === null) break;
          // Z3's hack for dynamically generated patterns: a ground if-then-else is not checked.
          if (
            store.root[first] === store.root[second.id] ||
            context.manager.getOp(second.owner) === OP_ITE
          )
            pc = instr.next;
          break;
        }
        case OP_CFILTER:
        case OP_FILTER:
        case OP_PFILTER: {
          const offset = 4 * store.root[registers[instr.reg]] + (instr.op === OP_PFILTER ? 2 : 0);
          if (
            (store.labels[offset] & instr.lblLow) !== 0 ||
            (store.labels[offset + 1] & instr.lblHigh) !== 0
          )
            pc = instr.next;
          break;
        }
        case OP_CHOOSE:
          this.pushPoint(instr, this.maxGeneration);
          pc = instr.next;
          break;
        case OP_NOOP:
          pc = instr.next;
          break;
        case OP_BIND: {
          const oldMaxGeneration = this.maxGeneration;
          const found = this.getNextFApp(instr.label, instr.numArgs, registers[instr.reg], -1);
          if (found === -1) break;
          this.pointCurrs[this.pushPoint(instr, oldMaxGeneration)] = found;
          this.setArgs(instr.oreg, found, instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_YIELD: {
          const numBindings = instr.regs.length;
          const bindings = this.bindings;
          shrink(bindings, 0);
          for (let index = 0; index < numBindings; index++) {
            const binding = registers[instr.regs[numBindings - index - 1]];
            bindings.push(store.nodes[binding]);
            this.updateMaxGeneration(binding);
          }
          this.onMatch(instr.quantifier, bindings, this.maxGeneration);
          break;
        }
        case OP_GET_ENODE:
          registers[instr.oreg] = instr.enode === null ? -1 : instr.enode.id;
          pc = instr.next;
          break;
        case OP_GET_CGR: {
          if (instr.numArgs <= MAX_FILTERED_GET_CGR_ARGS && !this.hasParentLabels(instr)) break;
          const args = this.argBuffer;
          shrink(args, 0);
          for (const reg of instr.regs) args.push(registers[reg]);
          const found = context.findCongruent(instr.label, args);
          if (found === -1 || !context.isRelevant(store.owner[found])) break;
          this.updateMaxGeneration(found);
          registers[instr.oreg] = found;
          pc = instr.next;
          break;
        }
        case OP_IS_CGR:
          if (this.isCgr(instr)) pc = instr.next;
          break;
        case OP_CONTINUE: {
          const found = this.initContinue(instr);
          if (found === -1) break;
          this.setArgs(instr.oreg, found, instr.numArgs);
          pc = instr.next;
          break;
        }
      }
    }
  }

  // execute: runs the tree against its candidates. A tree that filters its candidates runs each
  // term once, marking the terms it ran.
  execute(tree: CodeTree) {
    const context = this.context;
    const candidates = tree.candidates;
    const isFiltering = tree.isFilteringCandidates;
    let isComplete = true;
    for (const node of candidates) {
      if ((isFiltering && node.isMarked) || !node.isCgr()) continue;
      if (context.checkCanceled() || !this.executeCore(tree, node.id)) {
        isComplete = false;
        break;
      }
      if (isFiltering) node.isMarked = true;
    }
    if (isFiltering) for (const node of candidates) node.isMarked = false;
    return isComplete;
  }
}
