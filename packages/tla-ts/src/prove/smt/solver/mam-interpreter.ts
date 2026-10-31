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

export type OnMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) => void;

// backtrack_point: the instruction to resume, the generation to restore, the term a BIND is at,
// and the terms a CONTINUE goes through.
interface BacktrackPoint {
  instr: Instruction;
  oldMaxGeneration: number;
  curr: Enode | null;
  candidates: Enode[];
  index: number;
  end: number;
}

// GET_CGR1 to GET_CGR6 filter their arguments by the parent labels, GET_CGRN does not.
const MAX_FILTERED_GET_CGR_ARGS = 6;

export class Interpreter {
  private registers: (Enode | null)[] = [];
  private backtrackStack: BacktrackPoint[] = [];
  private top = 0;
  // m_max_generation: the largest generation of a term the match went through.
  private maxGeneration = 0;

  constructor(
    private context: Context,
    private onMatch: OnMatch,
  ) {}

  private updateMaxGeneration(node: Enode) {
    this.maxGeneration = Math.max(this.maxGeneration, this.context.getGeneration(node));
  }

  private pushPoint(instr: Instruction, oldMaxGeneration: number) {
    let point = this.backtrackStack[this.top];
    if (point === undefined) {
      point = { instr, oldMaxGeneration, curr: null, candidates: [], index: 0, end: 0 };
      this.backtrackStack.push(point);
    }
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
      if (curr.decl === label && curr.isCgr() && curr.args.length === numArgs) {
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
    const args: Enode[] = [];
    for (const reg of instr.regs) {
      const node = registers[reg];
      if (node === null || node === undefined) return false;
      args.push(node.root);
    }
    const first = registers[instr.reg];
    if (first === null || first === undefined) return false;
    let node = first;
    do {
      if (
        node.decl === instr.label &&
        node.args.length === instr.numArgs &&
        node.args.every((arg, index) => arg.root === args[index])
      ) {
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
      argIndex < parent.args.length &&
      this.context.isRelevant(parent.owner) &&
      parent.isCgr() &&
      parent.args[argIndex].root === child
    );
  }

  // mk_depth1_vector: the relevant decl-parents of the class of node where it is argument argIndex.
  private getDepth1Vector(node: Enode, decl: number, argIndex: number) {
    const root = node.root;
    return root.parents.filter((parent) => this.isRelevantParent(parent, decl, argIndex, root));
  }

  // mk_depth2_vector.
  private getDepth2Vector(joint: Joint, decl: number, argIndex: number) {
    const node = this.registers[joint.reg];
    if (node === null || node === undefined) return null;
    const root = node.root;
    if (root.parents.length === 0) return null;
    const result: Enode[] = [];
    for (const parent of root.parents) {
      if (!this.isRelevantParent(parent, joint.decl, joint.argPos, root)) continue;
      const parentRoot = parent.root;
      for (const grandparent of parentRoot.parents)
        if (this.isRelevantParent(grandparent, decl, argIndex, parentRoot))
          result.push(grandparent);
    }
    return result;
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
      if (root.parents.length === 0) return null;
    }
    let best: Enode[] | null = null;
    for (let argIndex = 0; argIndex < instr.joints.length; argIndex++) {
      const joint = instr.joints[argIndex];
      const node = this.getJointNode(joint);
      const current =
        node !== null
          ? this.getDepth1Vector(node, label, argIndex)
          : joint.kind === JOINT_NESTED
            ? this.getDepth2Vector(joint, label, argIndex)
            : null;
      if (
        current === null ||
        current.length >= all.length ||
        (best !== null && current.length >= best.length)
      )
        continue;
      if (current.length === 0) return null;
      best = current;
    }
    const candidates = best ?? all;
    const end = candidates.length;
    let index = 0;
    while (index < end) {
      const node = candidates[index];
      if (node.args.length === instr.numArgs && context.isRelevant(node.owner)) break;
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
    for (let index = 0; index < numArgs; index++) this.registers[oreg + index] = node.args[index];
  }

  // One instruction: the next one, or null to backtrack.
  private exec(instr: Instruction): Instruction | null {
    const context = this.context;
    const registers = this.registers;
    switch (instr.op) {
      case OP_INIT: {
        const node = registers[0] as Enode;
        if (node.args.length !== instr.numArgs) return null;
        this.setArgs(1, node, instr.numArgs);
        return instr.next;
      }
      case OP_COMPARE: {
        const first = registers[instr.reg];
        const second = registers[instr.reg2];
        if (first === null || first === undefined || second === null || second === undefined)
          return null;
        return first.root === second.root ? instr.next : null;
      }
      case OP_CHECK: {
        const first = registers[instr.reg];
        const second = instr.enode;
        if (first === null || first === undefined || second === null) return null;
        // Z3's hack for dynamically generated patterns: a ground if-then-else is not checked.
        if (first.root !== second.root && context.manager.getOp(second.owner) !== OP_ITE)
          return null;
        return instr.next;
      }
      case OP_CFILTER:
      case OP_FILTER:
      case OP_PFILTER: {
        const root = (registers[instr.reg] as Enode).root;
        const isParent = instr.op === OP_PFILTER;
        const low = isParent ? root.plbls : root.lbls;
        const high = isParent ? root.plblsHigh : root.lblsHigh;
        return (low & instr.lblLow) === 0 && (high & instr.lblHigh) === 0 ? null : instr.next;
      }
      case OP_CHOOSE:
        this.pushPoint(instr, this.maxGeneration);
        return instr.next;
      case OP_NOOP:
        return instr.next;
      case OP_BIND: {
        const oldMaxGeneration = this.maxGeneration;
        const node = this.getNextFApp(
          instr.label,
          instr.numArgs,
          registers[instr.reg] as Enode,
          null,
        );
        if (node === null) return null;
        this.pushPoint(instr, oldMaxGeneration).curr = node;
        this.setArgs(instr.oreg, node, instr.numArgs);
        return instr.next;
      }
      case OP_YIELD: {
        const numBindings = instr.regs.length;
        const bindings: Enode[] = [];
        for (let index = 0; index < numBindings; index++) {
          const binding = registers[instr.regs[numBindings - index - 1]] as Enode;
          bindings.push(binding);
          this.updateMaxGeneration(binding);
        }
        this.onMatch(instr.quantifier, bindings, this.maxGeneration);
        return null;
      }
      case OP_GET_ENODE:
        registers[instr.oreg] = instr.enode;
        return instr.next;
      case OP_GET_CGR: {
        const args: Enode[] = [];
        const isFiltered = instr.numArgs <= MAX_FILTERED_GET_CGR_ARGS;
        for (const reg of instr.regs) {
          const arg = registers[reg] as Enode;
          if (
            isFiltered &&
            (arg.root.plbls & instr.lblLow) === 0 &&
            (arg.root.plblsHigh & instr.lblHigh) === 0
          )
            return null;
          args.push(arg);
        }
        const found = context.findCongruent(instr.label, args);
        if (found === undefined || !context.isRelevant(found.owner)) return null;
        this.updateMaxGeneration(found);
        registers[instr.oreg] = found;
        return instr.next;
      }
      case OP_IS_CGR:
        return this.isCgr(instr) ? instr.next : null;
      case OP_CONTINUE: {
        const node = this.initContinue(instr);
        if (node === null) return null;
        this.setArgs(instr.oreg, node, instr.numArgs);
        return instr.next;
      }
    }
    return null;
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
      if (node.args.length === instr.numArgs && context.isRelevant(node.owner)) {
        this.updateMaxGeneration(node);
        this.setArgs(instr.oreg, node, instr.numArgs);
        return instr.next;
      }
    }
    this.top--;
    return null;
  }

  // execute_core: runs the tree against a term. It returns false when the search is canceled.
  executeCore(tree: CodeTree, node: Enode) {
    this.maxGeneration = this.context.getGeneration(node);
    this.registers[0] = node;
    this.top = 0;
    let sinceLastCheck = 0;
    let pc: Instruction | null = tree.root;
    for (;;) {
      if (pc !== null) {
        pc = this.exec(pc);
        continue;
      }
      if (this.top === 0) return true;
      const point = this.backtrackStack[this.top - 1];
      this.maxGeneration = point.oldMaxGeneration;
      if (sinceLastCheck++ > 100) {
        sinceLastCheck = 0;
        if (this.context.checkCanceled()) {
          this.top = 0;
          return false;
        }
      }
      pc = this.resume(point);
    }
  }

  // execute: runs the tree against its candidates. A tree that filters its candidates runs each
  // term once.
  execute(tree: CodeTree) {
    const context = this.context;
    const seen = tree.isFilteringCandidates ? new Set<Enode>() : null;
    for (const node of tree.candidates) {
      if (seen?.has(node) || !node.isCgr()) continue;
      if (context.checkCanceled() || !this.executeCore(tree, node)) return false;
      seen?.add(node);
    }
    return true;
  }
}
