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

// backtrack_point: the instruction to resume, the generation to restore, the term a BIND is at,
// and the terms a CONTINUE goes through, the first end of candidates. depthVector holds a
// CONTINUE's terms when they are the parents of a joint, and is reused by the next point at the same
// depth, like Z3's vector pool.
interface BacktrackPoint {
  instr: Instruction;
  oldMaxGeneration: number;
  curr: Enode | null;
  candidates: Enode[];
  index: number;
  end: number;
  depthVector: Enode[];
}

// GET_CGR1 to GET_CGR6 filter their arguments by the parent labels, GET_CGRN does not.
const MAX_FILTERED_GET_CGR_ARGS = 6;

export class Interpreter {
  private registers: (Enode | null)[] = [];
  // m_bindings: the terms a YIELD reports, which the match callback does not keep.
  private bindings: Enode[] = [];
  private backtrackStack: BacktrackPoint[] = [];
  private spareVector: Enode[] = [];
  // The arguments of IS_CGR and GET_CGR.
  private argBuffer: number[] = [];
  private top = 0;
  // m_max_generation: the largest generation of a term the match went through.
  private maxGeneration = 0;

  constructor(
    private context: Context,
    private onMatch: OnMatch,
  ) {}

  private updateMaxGeneration(node: Enode) {
    this.maxGeneration = Math.max(this.maxGeneration, this.context.getGeneration(node.id));
  }

  // The point above the top, which pushPoint pushes next.
  private getNextPoint(instr: Instruction, oldMaxGeneration: number) {
    const point = this.backtrackStack[this.top];
    if (point !== undefined) return point;
    const created: BacktrackPoint = {
      instr,
      oldMaxGeneration,
      curr: null,
      candidates: [],
      index: 0,
      end: 0,
      depthVector: [],
    };
    this.backtrackStack.push(created);
    return created;
  }

  private pushPoint(instr: Instruction, oldMaxGeneration: number) {
    const point = this.getNextPoint(instr, oldMaxGeneration);
    point.instr = instr;
    point.oldMaxGeneration = oldMaxGeneration;
    this.top++;
    return point;
  }

  // get_first_f_app and get_next_f_app: the next congruence root with the label in the class.
  private getNextFApp(label: number, numArgs: number, first: Enode, start: Enode | null) {
    let curr = start === null ? first : start.next;
    if (start !== null && curr === first) return null;
    do {
      if (curr.decl === label && curr.isCgr() && curr.numArgs === numArgs) {
        this.updateMaxGeneration(curr);
        return curr;
      }
      curr = curr.next;
    } while (curr !== first);
    return null;
  }

  // exec_is_cgr: whether the class has a term with the label and the arguments of the registers.
  private isCgr(instr: Instruction) {
    const registers = this.registers;
    const args = this.argBuffer;
    shrink(args, 0);
    for (const reg of instr.regs) {
      const node = registers[reg];
      if (node === null || node === undefined) return false;
      args.push(node.root.id);
    }
    const first = registers[instr.reg];
    if (first === null || first === undefined) return false;
    let node = first;
    do {
      let isMatch = node.decl === instr.label && node.numArgs === instr.numArgs;
      for (let index = 0; index < args.length && isMatch; index++)
        isMatch = node.getArg(index).root.id === args[index];
      if (isMatch) {
        this.updateMaxGeneration(node);
        return true;
      }
      node = node.next;
    } while (node !== first);
    return false;
  }

  private isRelevantParent(parent: Enode, decl: number, argIndex: number, child: Enode) {
    return (
      parent.decl === decl &&
      argIndex < parent.numArgs &&
      this.context.isRelevant(parent.owner) &&
      parent.isCgr() &&
      parent.getArg(argIndex).root === child
    );
  }

  // mk_depth1_vector: the relevant decl-parents of the class of node where it is argument argIndex,
  // written to the start of vector, and their number. init_continue drops a vector of limit terms or
  // more, so this stops at limit and returns -1.
  private collectDepth1(
    node: Enode,
    decl: number,
    argIndex: number,
    limit: number,
    vector: Enode[],
  ) {
    const root = node.root;
    let count = 0;
    for (let parentIndex = 0; parentIndex < root.numParents; parentIndex++) {
      const parent = root.getParent(parentIndex);
      if (!this.isRelevantParent(parent, decl, argIndex, root)) continue;
      if (count + 1 >= limit) return -1;
      if (count < vector.length) vector[count] = parent;
      else vector.push(parent);
      count++;
    }
    return count;
  }

  // mk_depth2_vector, which stops at limit like collectDepth1.
  private collectDepth2(
    joint: Joint,
    decl: number,
    argIndex: number,
    limit: number,
    vector: Enode[],
  ) {
    const node = this.registers[joint.reg];
    if (node === null || node === undefined) return -1;
    const root = node.root;
    if (root.numParents === 0) return -1;
    let count = 0;
    for (let parentIndex = 0; parentIndex < root.numParents; parentIndex++) {
      const parent = root.getParent(parentIndex);
      if (!this.isRelevantParent(parent, joint.decl, joint.argPos, root)) continue;
      const parentRoot = parent.root;
      for (let index = 0; index < parentRoot.numParents; index++) {
        const grandparent = parentRoot.getParent(index);
        if (!this.isRelevantParent(grandparent, decl, argIndex, parentRoot)) continue;
        if (count + 1 >= limit) return -1;
        if (count < vector.length) vector[count] = grandparent;
        else vector.push(grandparent);
        count++;
      }
    }
    return count;
  }

  // SET_VAR's filter: whether the class of each input register has a parent with the label.
  private hasParentLabels(instr: Instruction) {
    for (const reg of instr.regs) {
      const root = (this.registers[reg] as Enode).root;
      if ((root.plbls & instr.lblLow) === 0 && (root.plblsHigh & instr.lblHigh) === 0) return false;
    }
    return true;
  }

  private getJointNode(joint: Joint) {
    if (joint.kind === JOINT_GROUND) return joint.enode;
    if (joint.kind === JOINT_VAR) return this.registers[joint.reg] ?? null;
    return null;
  }

  // init_continue: the smallest candidate vector among the joints, or all terms with the label.
  private initContinue(instr: Instruction) {
    const context = this.context;
    const label = instr.label;
    const all = context.enodesOf(label);
    for (const joint of instr.joints) {
      const node = this.getJointNode(joint);
      if (node === null) continue;
      const root = node.root;
      if ((root.plbls & instr.lblLow) === 0 && (root.plblsHigh & instr.lblHigh) === 0) return null;
      if (root.numParents === 0) return null;
    }
    // Each joint's vector goes into the spare vector, which trades places with the next point's
    // vector when it is the smallest so far.
    const nextPoint = this.getNextPoint(instr, this.maxGeneration);
    let bestCount = -1;
    for (let argIndex = 0; argIndex < instr.joints.length; argIndex++) {
      const joint = instr.joints[argIndex];
      const node = this.getJointNode(joint);
      const limit = bestCount === -1 ? all.length : Math.min(all.length, bestCount);
      const spare = this.spareVector;
      const count =
        node !== null
          ? this.collectDepth1(node, label, argIndex, limit, spare)
          : joint.kind === JOINT_NESTED
            ? this.collectDepth2(joint, label, argIndex, limit, spare)
            : -1;
      if (count === -1 || count >= all.length || (bestCount !== -1 && count >= bestCount)) continue;
      if (count === 0) return null;
      this.spareVector = nextPoint.depthVector;
      nextPoint.depthVector = spare;
      bestCount = count;
    }
    const candidates = bestCount === -1 ? all : nextPoint.depthVector;
    const end = bestCount === -1 ? all.length : bestCount;
    let index = 0;
    while (index < end) {
      const node = candidates[index];
      if (node.numArgs === instr.numArgs && context.isRelevant(node.owner)) break;
      index++;
    }
    if (index === end) return null;
    const point = this.pushPoint(instr, this.maxGeneration);
    point.candidates = candidates;
    point.index = index;
    point.end = end;
    this.updateMaxGeneration(candidates[index]);
    return candidates[index];
  }

  private setArgs(oreg: number, node: Enode, numArgs: number) {
    for (let index = 0; index < numArgs; index++) this.registers[oreg + index] = node.getArg(index);
  }

  // The backtracking step of execute_core: the instruction to resume at, or null when the top choice
  // is exhausted and was popped.
  private resume(point: BacktrackPoint): Instruction | null {
    const instr = point.instr;
    if (instr.op === OP_CHOOSE) {
      this.top--;
      return instr.alt;
    }
    if (instr.op === OP_BIND) {
      const node = this.getNextFApp(
        instr.label,
        instr.numArgs,
        this.registers[instr.reg] as Enode,
        point.curr,
      );
      if (node === null) {
        this.top--;
        return null;
      }
      point.curr = node;
      this.setArgs(instr.oreg, node, instr.numArgs);
      return instr.next;
    }
    const context = this.context;
    for (point.index++; point.index < point.end; point.index++) {
      const node = point.candidates[point.index];
      if (node.numArgs === instr.numArgs && context.isRelevant(node.owner)) {
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
  executeCore(tree: CodeTree, node: Enode) {
    const context = this.context;
    const registers = this.registers;
    this.maxGeneration = context.getGeneration(node.id);
    registers[0] = node;
    this.top = 0;
    let sinceLastCheck = 0;
    let pc: Instruction | null = tree.root;
    for (;;) {
      if (pc === null) {
        if (this.top === 0) return true;
        const point = this.backtrackStack[this.top - 1];
        this.maxGeneration = point.oldMaxGeneration;
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
          const first = registers[0] as Enode;
          if (first.numArgs !== instr.numArgs) break;
          this.setArgs(1, first, instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_COMPARE: {
          const first = registers[instr.reg];
          const second = registers[instr.reg2];
          if (first === null || first === undefined || second === null || second === undefined)
            break;
          if (first.root === second.root) pc = instr.next;
          break;
        }
        case OP_CHECK: {
          const first = registers[instr.reg];
          const second = instr.enode;
          if (first === null || first === undefined || second === null) break;
          // Z3's hack for dynamically generated patterns: a ground if-then-else is not checked.
          if (first.root === second.root || context.manager.getOp(second.owner) === OP_ITE)
            pc = instr.next;
          break;
        }
        case OP_CFILTER:
        case OP_FILTER:
        case OP_PFILTER: {
          const root = (registers[instr.reg] as Enode).root;
          const isParent = instr.op === OP_PFILTER;
          const low = isParent ? root.plbls : root.lbls;
          const high = isParent ? root.plblsHigh : root.lblsHigh;
          if ((low & instr.lblLow) !== 0 || (high & instr.lblHigh) !== 0) pc = instr.next;
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
          const found = this.getNextFApp(
            instr.label,
            instr.numArgs,
            registers[instr.reg] as Enode,
            null,
          );
          if (found === null) break;
          this.pushPoint(instr, oldMaxGeneration).curr = found;
          this.setArgs(instr.oreg, found, instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_YIELD: {
          const numBindings = instr.regs.length;
          const bindings = this.bindings;
          shrink(bindings, 0);
          for (let index = 0; index < numBindings; index++) {
            const binding = registers[instr.regs[numBindings - index - 1]] as Enode;
            bindings.push(binding);
            this.updateMaxGeneration(binding);
          }
          this.onMatch(instr.quantifier, bindings, this.maxGeneration);
          break;
        }
        case OP_GET_ENODE:
          registers[instr.oreg] = instr.enode;
          pc = instr.next;
          break;
        case OP_GET_CGR: {
          if (instr.numArgs <= MAX_FILTERED_GET_CGR_ARGS && !this.hasParentLabels(instr)) break;
          const args = this.argBuffer;
          shrink(args, 0);
          for (const reg of instr.regs) args.push((registers[reg] as Enode).id);
          const found = context.findCongruent(instr.label, args);
          if (found === undefined || !context.isRelevant(found.owner)) break;
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
          if (found === null) break;
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
      if (context.checkCanceled() || !this.executeCore(tree, node)) {
        isComplete = false;
        break;
      }
      if (isFiltering) node.isMarked = true;
    }
    if (isFiltering) for (const node of candidates) node.isMarked = false;
    return isComplete;
  }
}
