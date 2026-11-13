// Ported from Z3 (src/ast/euf/euf_mam.h, src/ast/euf/euf_mam.cpp), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  FAMILY_BV,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_MUL,
  OP_OR,
  OP_XOR,
} from "../ast";
import { isAssociativeBvOp } from "../bv-decl-plugin";
import { hashU, mkMix } from "../hash";
import {
  type CodeTree,
  Compiler,
  hasHash,
  type Instruction,
  type Joint,
  JOINT_GROUND,
  JOINT_NESTED,
  JOINT_VAR,
  type LabelHasher,
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
  OP_INITAC,
  OP_IS_CGR,
  OP_NOOP,
  OP_PFILTER,
  OP_YIELD,
} from "../mam-compiler";
import { type Egraph, type Enode, getClass } from "./egraph";
import type { TrailStack } from "./th-solver";

// euf::mam_solver: the solver whose trail undoes the matcher.
export interface MamSolver {
  readonly manager: AstManager;
  readonly egraph: Egraph;
  readonly trail: TrailStack;
}

// euf::on_binding_callback.
export type OnBinding = (
  quantifier: number,
  pattern: number,
  bindings: readonly Enode[],
  maxGeneration: number,
  minTopGeneration: number,
  maxTopGeneration: number,
) => void;

// func_decl::is_associative() && is_commutative().
const isAcDecl = (manager: AstManager, decl: number) => {
  const info = manager.funcDecls[decl];
  if (info.family === FAMILY_BASIC)
    return info.op === OP_AND || info.op === OP_OR || info.op === OP_XOR;
  if (info.family === FAMILY_ARITH) return info.op === OP_ADD || info.op === OP_MUL;
  return info.family === FAMILY_BV && isAssociativeBvOp(info.op);
};

interface BacktrackPoint {
  instr: Instruction<Enode>;
  oldMaxGeneration: number;
  currGeneration: number;
  curr: Enode | null;
  candidates: readonly Enode[];
  index: number;
}

const MAX_FILTERED_GET_CGR_ARGS = 6;

class Interpreter {
  private registers: Enode[] = [];
  private bindings: Enode[] = [];
  private backtrackStack: BacktrackPoint[] = [];
  private top = 0;
  private maxGeneration = 0;
  private currMaxGeneration = 0;
  private patternInstances: Enode[] = [];
  private minTopGeneration: number[] = [];
  private maxTopGeneration: number[] = [];
  private acArgs: Enode[] = [];
  private acBitset: boolean[] = [];
  private acPatArg: number[] = [];

  constructor(
    private ctx: MamSolver,
    private onBinding: OnBinding,
  ) {}

  private getMinMaxTopGeneration() {
    const minTop = this.minTopGeneration;
    const maxTop = this.maxTopGeneration;
    const instances = this.patternInstances;
    if (minTop.length === 0) {
      minTop.push(instances[0].generation);
      maxTop.push(instances[0].generation);
    }
    let min = minTop[minTop.length - 1];
    let max = maxTop[maxTop.length - 1];
    for (let index = minTop.length; index < instances.length; index++) {
      min = Math.min(min, instances[index].generation);
      minTop.push(min);
      max = Math.max(max, instances[index].generation);
      maxTop.push(max);
    }
    return [min, max];
  }

  private pushPoint(instr: Instruction<Enode>, oldMaxGeneration: number) {
    let point = this.backtrackStack[this.top];
    if (point === undefined) {
      point = {
        instr,
        oldMaxGeneration,
        currGeneration: 0,
        curr: null,
        candidates: [],
        index: 0,
      };
      this.backtrackStack.push(point);
    }
    point.instr = instr;
    point.oldMaxGeneration = oldMaxGeneration;
    this.top++;
    return point;
  }

  private updateMaxGeneration(node: Enode) {
    this.maxGeneration = Math.max(this.maxGeneration, node.generation);
  }

  private getFirstFApp(label: number, numArgs: number, first: Enode) {
    let matchingCgr: Enode | null = null;
    let minGenMatch: Enode | null = null;
    for (const curr of getClass(first)) {
      if (curr.decl !== label || curr.numArgs !== numArgs) continue;
      if (curr.isCgr && matchingCgr === null) matchingCgr = curr;
      if (minGenMatch === null || minGenMatch.generation > curr.generation) minGenMatch = curr;
    }
    if (matchingCgr !== null) this.updateMaxGeneration(minGenMatch as Enode);
    return matchingCgr;
  }

  private getNextFApp(label: number, numArgs: number, first: Enode, start: Enode) {
    for (let curr = start.next; curr !== first; curr = curr.next)
      if (curr.decl === label && curr.numArgs === numArgs && curr.isCgr) return curr;
    return null;
  }

  private isCgr(instr: Instruction<Enode>) {
    const numArgs = instr.numArgs;
    const args = instr.regs.map((reg) => this.registers[reg].root);
    const first = this.registers[instr.reg];
    for (const node of getClass(first)) {
      if (node.decl !== instr.label || (numArgs > 2 && node.numArgs !== numArgs)) continue;
      if (args.every((arg, index) => node.getArg(index).root === arg)) {
        this.updateMaxGeneration(node);
        return true;
      }
    }
    return false;
  }

  private isRelevantParent(parent: Enode, decl: number, argIndex: number, child: Enode) {
    return (
      parent.decl === decl &&
      argIndex < parent.numArgs &&
      parent.isRelevant &&
      parent.isCgr &&
      parent.getArg(argIndex).root === child
    );
  }

  private getDepth1Vector(node: Enode, decl: number, argIndex: number, limit: number) {
    const root = node.root;
    const result: Enode[] = [];
    for (const parent of root.parents) {
      if (!this.isRelevantParent(parent, decl, argIndex, root)) continue;
      if (result.length + 1 >= limit) return null;
      result.push(parent);
    }
    return result;
  }

  private getDepth2Vector(joint: Joint<Enode>, decl: number, argIndex: number, limit: number) {
    const root = this.registers[joint.reg].root;
    if (root.parents.length === 0) return null;
    const result: Enode[] = [];
    for (const parent of root.parents) {
      if (!this.isRelevantParent(parent, joint.decl, joint.argPos, root)) continue;
      const parentRoot = parent.root;
      for (const grandparent of parentRoot.parents) {
        if (!this.isRelevantParent(grandparent, decl, argIndex, parentRoot)) continue;
        if (result.length + 1 >= limit) return null;
        result.push(grandparent);
      }
    }
    return result;
  }

  private getJointNode(joint: Joint<Enode>) {
    if (joint.kind === JOINT_GROUND) return joint.enode;
    if (joint.kind === JOINT_VAR) return this.registers[joint.reg];
    return null;
  }

  private initContinue(instr: Instruction<Enode>) {
    const label = instr.label;
    const all = this.ctx.egraph.enodesOf(label);
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
      const limit: number = best === null ? all.length : Math.min(all.length, best.length);
      const current =
        node !== null
          ? this.getDepth1Vector(node, label, argIndex, limit)
          : joint.kind === JOINT_NESTED
            ? this.getDepth2Vector(joint, label, argIndex, limit)
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
    let index = 0;
    while (index < candidates.length) {
      const node = candidates[index];
      if (node.numArgs === instr.numArgs && node.isRelevant) break;
      index++;
    }
    if (index === candidates.length) return null;
    const point = this.pushPoint(instr, this.maxGeneration);
    point.candidates = candidates;
    point.index = index;
    this.updateMaxGeneration(candidates[index]);
    return candidates[index];
  }

  private setArgs(oreg: number, node: Enode, numArgs: number) {
    for (let index = 0; index < numArgs; index++) this.registers[oreg + index] = node.getArg(index);
  }

  private initAc(instr: Instruction<Enode>) {
    const app = this.registers[0];
    const acArgs = this.acArgs;
    acArgs.length = 0;
    acArgs.push(app);
    const manager = this.ctx.manager;
    for (let index = 0; index < acArgs.length; index++) {
      const arg = acArgs[index];
      if (!manager.isApp(arg.owner) || arg.decl !== app.decl) continue;
      acArgs.push(...arg.args);
      acArgs[index] = acArgs[acArgs.length - 1];
      acArgs.pop();
      index--;
    }
    const numPatArgs = instr.numArgs;
    if (numPatArgs > acArgs.length) return false;
    this.acBitset = acArgs.map(() => false);
    this.acPatArg = acArgs.map(() => 0);
    this.pushPoint(instr, this.currMaxGeneration);
    for (let index = 0; index < numPatArgs; index++) {
      this.acPatArg[index] = index;
      this.acBitset[index] = true;
      this.registers[index + 1] = acArgs[index];
    }
    return true;
  }

  private nextAcMatch(numArgs: number) {
    const acArgs = this.acArgs;
    const bitset = this.acBitset;
    const patArg = this.acPatArg;
    for (let index = numArgs; index-- > 0;) {
      let next = patArg[index];
      bitset[next] = false;
      for (;;) {
        next++;
        while (next < acArgs.length && bitset[next]) next++;
        if (next === acArgs.length) break;
        this.registers[index + 1] = acArgs[next];
        bitset[next] = true;
        patArg[index] = next;
        let isFilled = true;
        for (let later = index + 1; later < numArgs; later++) {
          const free = bitset.indexOf(false);
          if (free === -1) {
            for (let undone = later - 1; undone >= index; undone--) bitset[patArg[undone]] = false;
            isFilled = false;
            break;
          }
          this.registers[later + 1] = acArgs[free];
          bitset[free] = true;
          patArg[later] = free;
        }
        if (isFilled) return true;
        next = patArg[index];
      }
    }
    return false;
  }

  private resume(point: BacktrackPoint): Instruction<Enode> | null {
    const instr = point.instr;
    switch (instr.op) {
      case OP_CHOOSE:
        this.top--;
        return instr.alt;
      case OP_BIND: {
        const node = this.getNextFApp(
          instr.label,
          instr.numArgs,
          this.registers[instr.reg],
          point.curr as Enode,
        );
        if (node === null) {
          this.top--;
          return null;
        }
        point.curr = node;
        this.maxGeneration = point.currGeneration;
        this.setArgs(instr.oreg, node, instr.numArgs);
        return instr.next;
      }
      case OP_INITAC:
        if (this.nextAcMatch(instr.numArgs)) return instr.next;
        this.top--;
        return null;
      default:
        for (point.index++; point.index < point.candidates.length; point.index++) {
          const node = point.candidates[point.index];
          if (node.numArgs === instr.numArgs && node.isRelevant) {
            const instances = this.patternInstances;
            if (instances.length === this.maxTopGeneration.length) {
              this.maxTopGeneration.pop();
              this.minTopGeneration.pop();
            }
            instances[instances.length - 1] = node;
            this.updateMaxGeneration(node);
            this.setArgs(instr.oreg, node, instr.numArgs);
            return instr.next;
          }
        }
        this.top--;
        return null;
    }
  }

  executeCore(tree: CodeTree<Enode>, node: Enode) {
    const manager = this.ctx.manager;
    const egraph = this.ctx.egraph;
    const registers = this.registers;
    if (!node.isRelevant) return false;
    this.patternInstances = [node];
    this.minTopGeneration = [];
    this.maxTopGeneration = [];
    this.maxGeneration = node.generation;
    registers[0] = node;
    this.top = 0;
    let pc: Instruction<Enode> | null = tree.root;
    for (;;) {
      if (pc === null) {
        if (this.top === 0) return true;
        const point = this.backtrackStack[this.top - 1];
        this.maxGeneration = point.oldMaxGeneration;
        pc = this.resume(point);
        continue;
      }
      const instr: Instruction<Enode> = pc;
      pc = null;
      switch (instr.op) {
        case OP_INIT: {
          const first = registers[0];
          if (first.numArgs !== instr.numArgs) break;
          this.setArgs(1, first, instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_INITAC:
          if (this.initAc(instr)) pc = instr.next;
          break;
        case OP_COMPARE:
          if (registers[instr.reg].root === registers[instr.reg2].root) pc = instr.next;
          break;
        case OP_CHECK:
          if (registers[instr.reg].root === (instr.enode as Enode).root) pc = instr.next;
          break;
        case OP_CFILTER:
        case OP_FILTER:
        case OP_PFILTER: {
          const root = registers[instr.reg].root;
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
          this.currMaxGeneration = this.maxGeneration;
          const found = this.getFirstFApp(instr.label, instr.numArgs, registers[instr.reg]);
          if (found === null) break;
          const point = this.pushPoint(instr, this.currMaxGeneration);
          point.curr = found;
          point.currGeneration = this.maxGeneration;
          this.setArgs(instr.oreg, found, instr.numArgs);
          pc = instr.next;
          break;
        }
        case OP_YIELD: {
          const numBindings = instr.regs.length;
          const bindings = this.bindings;
          bindings.length = 0;
          for (let index = 0; index < numBindings; index++)
            bindings.push(registers[instr.regs[numBindings - index - 1]]);
          for (const binding of bindings)
            this.maxGeneration = Math.max(this.maxGeneration, binding.generation);
          if (!manager.limit.inc()) return false;
          const topGenerations = this.getMinMaxTopGeneration();
          this.onBinding(
            instr.quantifier,
            instr.pattern,
            bindings,
            this.maxGeneration,
            topGenerations[0],
            topGenerations[1],
          );
          break;
        }
        case OP_GET_ENODE:
          registers[instr.oreg] = instr.enode as Enode;
          pc = instr.next;
          break;
        case OP_GET_CGR: {
          const args = instr.regs.map((reg) => registers[reg]);
          if (
            instr.numArgs <= MAX_FILTERED_GET_CGR_ARGS &&
            args.some(
              (arg) =>
                (arg.root.plbls & instr.lblLow) === 0 && (arg.root.plblsHigh & instr.lblHigh) === 0,
            )
          )
            break;
          const found = egraph.findCongruent(instr.label, args, false);
          if (found === undefined || !found.isRelevant) break;
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
          this.patternInstances.push(found);
          this.setArgs(instr.oreg, found, instr.numArgs);
          pc = instr.next;
          break;
        }
      }
    }
  }

  execute(tree: CodeTree<Enode>) {
    if (tree.qhead >= tree.candidates.length) return;
    const qhead = tree.qhead;
    this.ctx.trail.push(() => {
      tree.qhead = qhead;
    });
    const start = tree.qhead;
    const isFiltering = tree.isFilteringCandidates;
    while (tree.qhead < tree.candidates.length) {
      const app = tree.candidates[tree.qhead++];
      if (isFiltering ? !app.isMarked3 && app.isCgr : app.isCgr) {
        this.executeCore(tree, app);
        if (isFiltering) app.isMarked3 = true;
      }
    }
    if (!isFiltering) return;
    for (let index = tree.candidates.length; index-- > start;)
      tree.candidates[index].isMarked3 = false;
  }
}

interface Path {
  label: number;
  argIndex: number;
  groundArgIndex: number;
  groundArg: Enode | null;
  patternIndex: number;
  child: Path | null;
}

interface PathTree {
  label: number;
  argIndex: number;
  groundArgIndex: number;
  groundArg: Enode | null;
  filter: number;
  filterHigh: number;
  code: CodeTree<Enode> | null;
  firstChild: PathTree | null;
  sibling: PathTree | null;
  todo: Enode[] | null;
}

const isEqualPath = (first: Path, second: Path): boolean => {
  let left = first;
  let right = second;
  for (;;) {
    if (
      left.label !== right.label ||
      left.argIndex !== right.argIndex ||
      left.patternIndex !== right.patternIndex ||
      (left.child === null) !== (right.child === null)
    )
      return false;
    if (left.child === null || right.child === null) return true;
    left = left.child;
    right = right.child;
  }
};

interface MultiPattern {
  quantifier: number;
  pattern: number;
  patterns: number[];
}

// euf::mam::ground_subterms: the maximal ground applications of an expression.
export const getGroundSubterms = (manager: AstManager, expr: number) => {
  const ground: number[] = [];
  if (!manager.isApp(expr)) return ground;
  const seen = new Set<number>();
  const todo = [expr];
  for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
    if (seen.has(node)) continue;
    seen.add(node);
    if (manager.isGroundApp(node)) ground.push(node);
    else
      for (let index = 0; index < manager.getNumArgs(node); index++) {
        const arg = manager.getArg(node, index);
        if (manager.isApp(arg)) todo.push(arg);
      }
  }
  return ground;
};

export class Mam implements LabelHasher<Enode> {
  private trees = new Map<number, CodeTree<Enode>>();
  private toMatch: CodeTree<Enode>[] = [];
  private toMatchHead = 0;
  private newPatterns: MultiPattern[] = [];
  private newPatternsHead = 0;
  private pc = new Map<number, PathTree>();
  private pp = new Map<number, (PathTree | null)[]>();
  private plbls = new Set<number>();
  private clbls = new Set<number>();
  private root: Enode | null = null;
  private other: Enode | null = null;
  private visitedParents: Enode[] = [];
  private queuedRoots: Enode[] = [];
  private labelHashes: (number | undefined)[] = [];
  private compiler: Compiler<Enode>;
  private interpreter: Interpreter;

  constructor(
    private ctx: MamSolver,
    onBinding: OnBinding,
  ) {
    const manager = ctx.manager;
    this.compiler = new Compiler<Enode>(
      { manager, pushTrail: (undo) => ctx.trail.push(undo) },
      this,
      (decl) => isAcDecl(manager, decl),
    );
    this.interpreter = new Interpreter(ctx, onBinding);
  }

  private get manager() {
    return this.ctx.manager;
  }

  private pushTrail(undo: () => void) {
    this.ctx.trail.push(undo);
  }

  getLabelHash(decl: number) {
    const cached = this.labelHashes[decl];
    if (cached !== undefined) return cached;
    const hash = mkMix(17, 3, this.manager.funcDecls[decl].smallId) & 63;
    this.labelHashes[decl] = hash;
    return hash;
  }

  getLblHash(node: Enode) {
    if (node.lblHash === -1)
      this.ctx.egraph.setLblHash(node, hashU(this.manager.ids[node.owner]) & 63);
    return node.lblHash;
  }

  getGroundEnode(expr: number) {
    return this.ctx.egraph.find(expr) ?? null;
  }

  canPropagate() {
    return this.toMatch.length > 0 || this.newPatterns.length > 0;
  }

  private setLbls(root: Enode, isParent: boolean, hash: number) {
    const low = isParent ? root.plbls : root.lbls;
    const high = isParent ? root.plblsHigh : root.lblsHigh;
    if (hasHash(low, high, hash)) return;
    this.pushTrail(() => {
      if (isParent) {
        root.plbls = low;
        root.plblsHigh = high;
      } else {
        root.lbls = low;
        root.lblsHigh = high;
      }
    });
    const bit = 1 << hash;
    if (isParent && hash < 32) root.plbls |= bit;
    else if (isParent) root.plblsHigh |= bit;
    else if (hash < 32) root.lbls |= bit;
    else root.lblsHigh |= bit;
  }

  private updateChildrenPlbls(node: Enode, hash: number) {
    for (const arg of node.args) this.setLbls(arg.root, true, hash);
  }

  private updatePlbls(decl: number) {
    if (this.plbls.has(decl)) return;
    this.plbls.add(decl);
    this.pushTrail(() => this.plbls.delete(decl));
    const hash = this.getLabelHash(decl);
    for (const node of this.ctx.egraph.enodesOf(decl))
      if (node.isRelevant) this.updateChildrenPlbls(node, hash);
  }

  private updateClbls(decl: number) {
    if (this.clbls.has(decl)) return;
    this.clbls.add(decl);
    this.pushTrail(() => this.clbls.delete(decl));
    const hash = this.getLabelHash(decl);
    for (const node of this.ctx.egraph.enodesOf(decl))
      if (node.isRelevant) this.setLbls(node.root, false, hash);
  }

  private mkPathTree(path: Path, mp: MultiPattern): PathTree {
    const hash = this.getLabelHash(path.label);
    const tree: PathTree = {
      label: path.label,
      argIndex: path.argIndex,
      groundArgIndex: path.groundArgIndex,
      groundArg: path.groundArg,
      filter: hash < 32 ? 1 << hash : 0,
      filterHigh: hash < 32 ? 0 : 1 << hash,
      code: null,
      firstChild: null,
      sibling: null,
      todo: null,
    };
    if (path.child === null)
      tree.code = this.compiler.mkTree(
        mp.quantifier,
        mp.patterns,
        path.patternIndex,
        true,
        mp.pattern,
      );
    else tree.firstChild = this.mkPathTree(path.child, mp);
    return tree;
  }

  private insertPath(head: PathTree, path: Path, mp: MultiPattern) {
    let isLabelFound = false;
    let last = head;
    for (let tree: PathTree | null = head; tree !== null; tree = tree.sibling) {
      last = tree;
      if (tree.label !== path.label) continue;
      isLabelFound = true;
      if (
        tree.argIndex !== path.argIndex ||
        tree.groundArg !== path.groundArg ||
        tree.groundArgIndex !== path.groundArgIndex
      )
        continue;
      const found = tree;
      if (path.child !== null && found.firstChild !== null)
        this.insertPath(found.firstChild, path.child, mp);
      else if (path.child !== null) {
        found.firstChild = this.mkPathTree(path.child, mp);
        this.pushTrail(() => {
          found.firstChild = null;
        });
      } else if (found.code !== null)
        this.compiler.insert(
          found.code,
          mp.quantifier,
          mp.patterns,
          path.patternIndex,
          false,
          mp.pattern,
        );
      else {
        found.code = this.compiler.mkTree(
          mp.quantifier,
          mp.patterns,
          path.patternIndex,
          true,
          mp.pattern,
        );
        this.pushTrail(() => {
          found.code = null;
        });
      }
      return;
    }
    const previous = last;
    previous.sibling = this.mkPathTree(path, mp);
    this.pushTrail(() => {
      previous.sibling = null;
    });
    if (isLabelFound) return;
    const low = head.filter;
    const high = head.filterHigh;
    this.pushTrail(() => {
      head.filter = low;
      head.filterHigh = high;
    });
    const hash = this.getLabelHash(path.label);
    if (hash < 32) head.filter |= 1 << hash;
    else head.filterHigh |= 1 << hash;
  }

  private updatePc(firstHash: number, secondHash: number, path: Path, mp: MultiPattern) {
    const key = firstHash * 64 + secondHash;
    const existing = this.pc.get(key);
    if (existing !== undefined) {
      this.insertPath(existing, path, mp);
      return;
    }
    this.pc.set(key, this.mkPathTree(path, mp));
    this.pushTrail(() => this.pc.delete(key));
  }

  private updatePp(
    inputFirstHash: number,
    inputSecondHash: number,
    inputFirst: Path,
    inputSecond: Path,
    mp: MultiPattern,
  ) {
    if (inputFirstHash === inputSecondHash) {
      const key = inputFirstHash * 65;
      const entry = this.pp.get(key);
      if (entry !== undefined) {
        this.insertPath(entry[0] as PathTree, inputFirst, mp);
        if (!isEqualPath(inputFirst, inputSecond))
          this.insertPath(entry[0] as PathTree, inputSecond, mp);
        return;
      }
      const tree = this.mkPathTree(inputFirst, mp);
      this.pp.set(key, [tree, null]);
      this.pushTrail(() => this.pp.delete(key));
      this.insertPath(tree, inputSecond, mp);
      return;
    }
    const isSwapped = inputFirstHash > inputSecondHash;
    const firstHash = isSwapped ? inputSecondHash : inputFirstHash;
    const secondHash = isSwapped ? inputFirstHash : inputSecondHash;
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const key = firstHash * 64 + secondHash;
    const entry = this.pp.get(key);
    if (entry !== undefined) {
      this.insertPath(entry[0] as PathTree, first, mp);
      this.insertPath(entry[1] as PathTree, second, mp);
      return;
    }
    this.pp.set(key, [this.mkPathTree(first, mp), this.mkPathTree(second, mp)]);
    this.pushTrail(() => this.pp.delete(key));
  }

  private updateFilters(
    pattern: number,
    parentPath: Path | null,
    patternIndex: number,
    varPaths: Path[][],
    mp: MultiPattern,
  ) {
    const manager = this.manager;
    const numArgs = manager.getNumArgs(pattern);
    let groundArgIndex = 0;
    let groundArg: Enode | null = null;
    for (let index = 0; index < numArgs; index++)
      if (manager.isGround(manager.getArg(pattern, index))) {
        groundArgIndex = index;
        groundArg = this.getGroundEnode(manager.getArg(pattern, index));
        break;
      }
    const label = manager.decls[pattern];
    for (let index = 0; index < numArgs; index++) {
      const child = manager.getArg(pattern, index);
      const path: Path = {
        label,
        argIndex: index,
        groundArgIndex,
        groundArg,
        patternIndex,
        child: parentPath,
      };
      if (manager.kinds[child] === KIND_VAR) {
        const varIndex = manager.values[child];
        if (varIndex >= varPaths.length) continue;
        const paths = varPaths[varIndex];
        let isFound = false;
        for (const existing of paths) {
          if (isEqualPath(path, existing)) isFound = true;
          this.updatePlbls(existing.label);
          this.updatePlbls(path.label);
          this.updatePp(
            this.getLabelHash(existing.label),
            this.getLabelHash(path.label),
            existing,
            path,
            mp,
          );
        }
        if (!isFound) paths.push(path);
        continue;
      }
      if (manager.isGround(child)) {
        const node = this.getGroundEnode(child);
        if (node === null) continue;
        this.updatePlbls(label);
        this.updatePc(this.getLabelHash(label), this.getLblHash(node), path, mp);
        continue;
      }
      const childLabel = manager.decls[child];
      this.updatePlbls(label);
      this.updateClbls(childLabel);
      this.updatePc(this.getLabelHash(label), this.getLabelHash(childLabel), path, mp);
      this.updateFilters(child, path, patternIndex, varPaths, mp);
    }
  }

  addPattern(quantifier: number, pattern: number) {
    const manager = this.manager;
    const patterns = manager.getArgs(pattern);
    if (patterns.every((arg) => manager.isGround(arg))) return;
    if (patterns.some((arg) => manager.hasQuantifierFlags[arg])) return;
    const mp: MultiPattern = { quantifier, pattern, patterns };
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const varPaths: Path[][] = Array.from({ length: numDecls }, () => []);
    patterns.forEach((arg, index) => this.updateFilters(arg, null, index, varPaths, mp));
    this.newPatterns.push(mp);
    this.pushTrail(() => this.newPatterns.pop());
    patterns.forEach((arg, firstIndex) => {
      if (manager.isGround(arg)) return;
      const label = manager.decls[arg];
      const tree = this.trees.get(label);
      if (tree !== undefined) {
        this.compiler.insert(tree, quantifier, patterns, firstIndex, false, pattern);
        return;
      }
      this.trees.set(label, this.compiler.mkTree(quantifier, patterns, firstIndex, false, pattern));
      this.pushTrail(() => this.trees.delete(label));
    });
  }

  private addCandidateTo(tree: CodeTree<Enode>, node: Enode) {
    if (tree.qhead >= tree.candidates.length) {
      this.toMatch.push(tree);
      this.pushTrail(() => this.toMatch.pop());
    }
    tree.candidates.push(node);
    this.pushTrail(() => tree.candidates.pop());
  }

  addNode(node: Enode, isLazy: boolean) {
    if (node.lblHash !== -1) this.setLbls(node.root, false, node.lblHash);
    if (node.numArgs === 0) return;
    const hash = this.getLabelHash(node.decl);
    if (this.clbls.has(node.decl)) this.setLbls(node.root, false, hash);
    if (this.plbls.has(node.decl)) this.updateChildrenPlbls(node, hash);
    const tree = this.trees.get(node.decl);
    if (!isLazy && tree !== undefined) this.addCandidateTo(tree, node);
  }

  private isEqModMerge(first: Enode, second: Enode) {
    const firstRoot = first.root;
    const secondRoot = second.root;
    return (
      firstRoot === secondRoot ||
      (firstRoot === this.other && secondRoot === this.root) ||
      (firstRoot === this.root && secondRoot === this.other)
    );
  }

  private collectParents(start: Enode, head: PathTree | null | undefined) {
    if (head === null || head === undefined) return;
    const levels: PathTree[] = [head];
    const visitedParents = this.visitedParents;
    const queuedRoots = this.queuedRoots;
    head.todo = [start];
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      const nodes = level.todo ?? [];
      level.todo = null;
      const filter = level.filter;
      const filterHigh = level.filterHigh;
      for (const node of nodes) {
        const child = node.root;
        if ((child.plbls & filter) === 0 && (child.plblsHigh & filterHigh) === 0) continue;
        for (const parent of child.parents) {
          if (parent.isEquality) continue;
          const label = parent.decl;
          const parentRoot = parent.root;
          if (
            !hasHash(filter, filterHigh, this.getLabelHash(label)) ||
            parent.isMarked1 ||
            (parent.cg !== parent && this.isEqModMerge(parent.cg, parentRoot)) ||
            !parent.isRelevant
          )
            continue;
          for (let tree: PathTree | null = level; tree !== null; tree = tree.sibling) {
            if (
              tree.label !== label ||
              tree.argIndex >= parent.numArgs ||
              parent.getArg(tree.argIndex).root !== child ||
              tree.groundArgIndex >= parent.numArgs ||
              (tree.groundArg !== null &&
                !this.isEqModMerge(tree.groundArg, parent.getArg(tree.groundArgIndex)))
            )
              continue;
            if (tree.code !== null) this.addCandidateTo(tree.code, parent);
            const next = tree.firstChild;
            if (next === null) continue;
            if (next.todo === null) {
              next.todo = [];
              levels.push(next);
            }
            if (!parentRoot.isMarked2) next.todo.push(parentRoot);
          }
          parent.isMarked1 = true;
          visitedParents.push(parent);
          if (!parentRoot.isMarked2) {
            parentRoot.isMarked2 = true;
            queuedRoots.push(parentRoot);
          }
        }
      }
      for (const parent of visitedParents) parent.isMarked1 = false;
      for (const root of queuedRoots) root.isMarked2 = false;
      visitedParents.length = 0;
      queuedRoots.length = 0;
    }
  }

  private processPc(r1: Enode, r2: Enode) {
    if ((r1.plbls === 0 && r1.plblsHigh === 0) || (r2.lbls === 0 && r2.lblsHigh === 0)) return;
    for (let parentHash = 0; parentHash < 64; parentHash++) {
      if (!hasHash(r1.plbls, r1.plblsHigh, parentHash)) continue;
      if (!this.manager.limit.inc()) return;
      for (let childHash = 0; childHash < 64; childHash++)
        if (hasHash(r2.lbls, r2.lblsHigh, childHash))
          this.collectParents(r1, this.pc.get(parentHash * 64 + childHash));
    }
  }

  private processPp(r1: Enode, r2: Enode) {
    if ((r1.plbls === 0 && r1.plblsHigh === 0) || (r2.plbls === 0 && r2.plblsHigh === 0)) return;
    for (let firstHash = 0; firstHash < 64; firstHash++) {
      if (!hasHash(r1.plbls, r1.plblsHigh, firstHash)) continue;
      if (!this.manager.limit.inc()) return;
      for (let secondHash = 0; secondHash < 64; secondHash++) {
        if (!hasHash(r2.plbls, r2.plblsHigh, secondHash)) continue;
        const isSwapped = firstHash > secondHash;
        const lowHash = isSwapped ? secondHash : firstHash;
        const highHash = isSwapped ? firstHash : secondHash;
        const lowRoot = isSwapped ? r2 : r1;
        const highRoot = isSwapped ? r1 : r2;
        const entry = this.pp.get(lowHash * 64 + highHash);
        if (entry === undefined) continue;
        if (lowHash === highHash) {
          if (lowRoot.parents.length <= highRoot.parents.length)
            this.collectParents(lowRoot, entry[0]);
          else this.collectParents(highRoot, entry[0]);
        } else if (lowRoot.parents.length <= highRoot.parents.length)
          this.collectParents(lowRoot, entry[0]);
        else this.collectParents(highRoot, entry[1]);
      }
    }
  }

  onMerge(root: Enode, other: Enode) {
    this.other = other;
    this.root = root;
    this.processPc(other, root);
    this.processPc(root, other);
    this.processPp(other, root);
    this.other = null;
    this.root = null;
    const lbls = root.lbls;
    const lblsHigh = root.lblsHigh;
    const plbls = root.plbls;
    const plblsHigh = root.plblsHigh;
    this.pushTrail(() => {
      root.lbls = lbls;
      root.lblsHigh = lblsHigh;
    });
    this.pushTrail(() => {
      root.plbls = plbls;
      root.plblsHigh = plblsHigh;
    });
    root.lbls |= other.lbls;
    root.lblsHigh |= other.lblsHigh;
    root.plbls |= other.plbls;
    root.plblsHigh |= other.plblsHigh;
  }

  propagate() {
    if (this.toMatchHead < this.toMatch.length) {
      const head = this.toMatchHead;
      this.pushTrail(() => {
        this.toMatchHead = head;
      });
      for (; this.toMatchHead < this.toMatch.length; this.toMatchHead++)
        this.interpreter.execute(this.toMatch[this.toMatchHead]);
    }
    this.propagateNewPatterns();
  }

  private propagateNewPatterns() {
    if (this.newPatternsHead >= this.newPatterns.length) return;
    const head = this.newPatternsHead;
    this.pushTrail(() => {
      this.newPatternsHead = head;
    });
    const manager = this.manager;
    const egraph = this.ctx.egraph;
    const tmpTrees = new Map<number, CodeTree<Enode>>();
    for (; this.newPatternsHead < this.newPatterns.length; this.newPatternsHead++) {
      if (!manager.limit.inc()) break;
      const mp = this.newPatterns[this.newPatternsHead];
      const label = manager.decls[mp.patterns[0]];
      if (egraph.enodesOf(label).length === 0) continue;
      const tree = tmpTrees.get(label);
      if (tree === undefined)
        tmpTrees.set(label, this.compiler.mkTree(mp.quantifier, mp.patterns, 0, false, mp.pattern));
      else this.compiler.insert(tree, mp.quantifier, mp.patterns, 0, true, mp.pattern);
    }
    for (const entry of tmpTrees) {
      const nodes = egraph.enodesOf(entry[0]);
      for (let index = 0; index < nodes.length; index++)
        if (nodes[index].isRelevant) this.interpreter.executeCore(entry[1], nodes[index]);
    }
  }
}
