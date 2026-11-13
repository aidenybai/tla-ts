// Ported from Z3 (src/smt/mam.cpp), MIT license, see z3-license.txt.
import { KIND_VAR, type AstManager } from "./ast";
import type { Enode } from "./enode";

export const OP_INIT = 0;
export const OP_BIND = 1;
export const OP_YIELD = 2;
export const OP_COMPARE = 3;
export const OP_CHECK = 4;
export const OP_FILTER = 5;
export const OP_CFILTER = 6;
export const OP_PFILTER = 7;
export const OP_CHOOSE = 8;
export const OP_NOOP = 9;
export const OP_CONTINUE = 10;
export const OP_GET_ENODE = 11;
export const OP_GET_CGR = 12;
export const OP_IS_CGR = 13;
export const OP_INITAC = 14;

const JOINT_NULL = 0;
export const JOINT_GROUND = 1;
export const JOINT_VAR = 2;
export const JOINT_NESTED = 3;

export interface Joint<E = Enode> {
  kind: number;
  enode: E | null;
  reg: number;
  decl: number;
  argPos: number;
}

export interface Instruction<E = Enode> {
  op: number;
  next: Instruction<E> | null;
  numArgs: number;
  reg: number;
  reg2: number;
  oreg: number;
  label: number;
  enode: E | null;
  lblLow: number;
  lblHigh: number;
  alt: Instruction<E> | null;
  quantifier: number;
  pattern: number;
  regs: number[];
  joints: Joint<E>[];
}

export interface CodeTree<E = Enode> {
  numArgs: number;
  isFilteringCandidates: boolean;
  numRegs: number;
  numChoices: number;
  root: Instruction<E>;
  candidates: E[];
  qhead: number;
  candidateGcThreshold: number;
}

export interface LabelHasher<E = Enode> {
  getLabelHash(decl: number): number;
  getGroundEnode(expr: number, quantifier: number): E | null;
  getLblHash(node: E): number;
}

// The part of an enode that compiling a pattern reads.
export interface MamEnode<E> {
  readonly root: E;
  lblHash: number;
}

// The context that undoes a compiler's updates of shared code trees.
export interface CompilerContext {
  readonly manager: AstManager;
  pushTrail(undo: () => void): void;
}

const NOT_CHECKED = 0;
const CHECK_SET = 1;
const CHECK_SINGLETON = 2;

const FIND_BEST_CHILD_THRESHOLD = 64;
const SIMPLE_SEQ_THRESHOLD = 4;

const mkInstruction = <E>(op: number): Instruction<E> => ({
  op,
  next: null,
  numArgs: 0,
  reg: 0,
  reg2: 0,
  oreg: 0,
  label: -1,
  enode: null,
  lblLow: 0,
  lblHigh: 0,
  alt: null,
  quantifier: -1,
  pattern: -1,
  regs: [],
  joints: [],
});

const mkNullJoint = <E>(): Joint<E> => ({
  kind: JOINT_NULL,
  enode: null,
  reg: 0,
  decl: -1,
  argPos: 0,
});

export const hasHash = (low: number, high: number, hash: number) =>
  ((hash < 32 ? low : high) & (1 << hash)) !== 0;

const countBits = (word: number) => {
  let count = 0;
  for (let rest = word; rest !== 0; rest &= rest - 1) count++;
  return count;
};

const setHash = <E>(instr: Instruction<E>, hash: number) => {
  if (hash < 32) instr.lblLow |= 1 << hash;
  else instr.lblHigh |= 1 << hash;
};

const mkFilter = <E>(op: number, reg: number, low: number, high: number) => {
  const instr = mkInstruction<E>(op);
  instr.reg = reg;
  instr.lblLow = low;
  instr.lblHigh = high;
  return instr;
};

const mkSingletonFilter = <E>(op: number, reg: number, hash: number) => {
  const instr = mkFilter<E>(op, reg, 0, 0);
  setHash(instr, hash);
  return instr;
};

const mkCompare = <E>(reg1: number, reg2: number) => {
  const instr = mkInstruction<E>(OP_COMPARE);
  instr.reg = reg1;
  instr.reg2 = reg2;
  return instr;
};

const mkCheck = <E>(reg: number, enode: E | null) => {
  const instr = mkInstruction<E>(OP_CHECK);
  instr.reg = reg;
  instr.enode = enode;
  return instr;
};

const mkChoose = <E>(alt: Instruction<E> | null) => {
  const instr = mkInstruction<E>(OP_CHOOSE);
  instr.alt = alt;
  return instr;
};

const mkInit = <E>(op: number, numArgs: number) => {
  const instr = mkInstruction<E>(op);
  instr.numArgs = numArgs;
  return instr;
};

// isAc marks the associative-commutative labels that euf's matcher starts with OP_INITAC.
export class Compiler<E extends MamEnode<E> = Enode> {
  private manager: AstManager;
  private registers: number[] = [];
  private todo: number[] = [];
  private aux: number[] = [];
  private vars: number[] = [];
  private quantifier = -1;
  private pattern = -1;
  private patterns: number[] = [];
  private tree: CodeTree<E> = {
    numArgs: 0,
    isFilteringCandidates: false,
    numRegs: 0,
    numChoices: 0,
    root: mkInit<E>(OP_INIT, 0),
    candidates: [],
    qhead: 0,
    candidateGcThreshold: 0,
  };
  private numChoices = 0;
  private isTmpTree = false;
  private isMpAlreadyProcessed: boolean[] = [];
  private matchedExprs = new Map<number, number>();
  private marks: number[] = [];
  private toReset: number[] = [];
  private compatible: Instruction<E>[] = [];
  private incompatible: Instruction<E>[] = [];
  private seq: Instruction<E>[] = [];

  constructor(
    private context: CompilerContext,
    private hasher: LabelHasher<E>,
    private isAc: (decl: number) => boolean = () => false,
  ) {
    this.manager = context.manager;
  }

  private getRegister(reg: number) {
    return this.registers[reg] ?? -1;
  }

  private getMark(reg: number) {
    return this.marks[reg] ?? NOT_CHECKED;
  }

  private setMark(reg: number, mark: number) {
    this.marks[reg] = mark;
  }

  private isApp(expr: number) {
    return expr !== -1 && this.manager.kinds[expr] !== KIND_VAR;
  }

  private init(
    tree: CodeTree<E>,
    quantifier: number,
    pattern: number,
    patterns: number[],
    firstIndex: number,
  ) {
    const manager = this.manager;
    this.tree = tree;
    this.quantifier = quantifier;
    this.pattern = pattern;
    this.patterns = patterns;
    this.numChoices = 0;
    this.todo = [];
    this.registers.fill(-1);
    const first = patterns[firstIndex];
    for (let index = 0; index < manager.getNumArgs(first); index++) {
      this.registers[index + 1] = manager.getArg(first, index);
      this.todo.push(index + 1);
    }
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    while (this.vars.length < numDecls) this.vars.push(-1);
    this.vars.fill(-1, 0, numDecls);
  }

  private isAllArgsBoundVars(expr: number) {
    const manager = this.manager;
    return manager.everyArg(
      expr,
      (arg) => manager.kinds[arg] === KIND_VAR && this.vars[manager.values[arg]] !== -1,
    );
  }

  private getStats(expr: number) {
    const manager = this.manager;
    let size = 0;
    let numUnboundVars = 0;
    const visit = (term: number) => {
      size++;
      if (manager.isGround(term)) return;
      for (let index = 0; index < manager.getNumArgs(term); index++) {
        const arg = manager.getArg(term, index);
        if (manager.kinds[arg] === KIND_VAR) {
          size++;
          if (this.vars[manager.values[arg]] === -1) numUnboundVars++;
        } else visit(arg);
      }
    };
    visit(expr);
    return { size, numUnboundVars };
  }

  private lineariseCore() {
    const manager = this.manager;
    const hasher = this.hasher;
    this.aux.length = 0;
    let firstApp = -1;
    let firstAppReg = 0;
    let firstAppSize = 0;
    let firstAppNumUnboundVars = 0;
    for (const reg of this.todo) {
      const pattern = this.registers[reg];
      if (manager.kinds[pattern] === KIND_VAR) {
        const varIndex = manager.values[pattern];
        if (this.vars[varIndex] !== -1) this.seq.push(mkCompare(this.vars[varIndex], reg));
        else this.vars[varIndex] = reg;
        continue;
      }
      if (manager.isGround(pattern)) {
        this.seq.push(mkCheck(reg, hasher.getGroundEnode(pattern, this.quantifier)));
        this.setMark(reg, NOT_CHECKED);
        continue;
      }
      const matchedReg = this.matchedExprs.get(pattern);
      if (matchedReg !== undefined && reg !== matchedReg) {
        this.seq.push(mkCompare(matchedReg, reg));
        this.setMark(reg, NOT_CHECKED);
        continue;
      }
      this.matchedExprs.set(pattern, reg);
      if (this.getMark(reg) !== CHECK_SINGLETON) {
        this.seq.push(
          mkSingletonFilter(OP_FILTER, reg, hasher.getLabelHash(manager.decls[pattern])),
        );
        this.setMark(reg, CHECK_SINGLETON);
      }
      if (firstApp === -1) {
        firstApp = pattern;
        firstAppReg = reg;
        const stats = this.getStats(pattern);
        firstAppSize = stats.size;
        firstAppNumUnboundVars = stats.numUnboundVars;
      } else if (firstAppNumUnboundVars === 0) this.aux.push(reg);
      else {
        const stats = this.getStats(pattern);
        if (
          stats.numUnboundVars === 0 ||
          stats.size > firstAppSize ||
          (stats.size === firstAppSize && stats.numUnboundVars < firstAppNumUnboundVars)
        ) {
          this.aux.push(firstAppReg);
          firstApp = pattern;
          firstAppReg = reg;
          firstAppSize = stats.size;
          firstAppNumUnboundVars = stats.numUnboundVars;
        } else this.aux.push(reg);
      }
    }
    if (firstApp !== -1) {
      const label = manager.decls[firstApp];
      const numArgs = manager.getNumArgs(firstApp);
      if (this.isAllArgsBoundVars(firstApp)) {
        const instr = mkInstruction<E>(OP_IS_CGR);
        instr.label = label;
        instr.reg = firstAppReg;
        instr.numArgs = numArgs;
        instr.regs = manager.mapArgs(firstApp, (arg) => this.vars[manager.values[arg]]);
        this.seq.push(instr);
      } else {
        const oreg = this.tree.numRegs;
        this.tree.numRegs += numArgs;
        for (let index = 0; index < numArgs; index++) {
          this.registers[oreg + index] = manager.getArg(firstApp, index);
          this.aux.push(oreg + index);
        }
        const instr = mkInstruction<E>(OP_BIND);
        instr.label = label;
        instr.numArgs = numArgs;
        instr.reg = firstAppReg;
        instr.oreg = oreg;
        this.seq.push(instr);
        this.numChoices++;
      }
      this.setMark(firstAppReg, NOT_CHECKED);
    }
    const todo = this.todo;
    this.todo = this.aux;
    this.aux = todo;
  }

  private getNumBoundVars(expr: number) {
    const manager = this.manager;
    let count = 0;
    let hasUnboundVars = false;
    const visit = (term: number) => {
      if (manager.isGround(term)) return;
      for (let index = 0; index < manager.getNumArgs(term); index++) {
        const arg = manager.getArg(term, index);
        if (manager.kinds[arg] !== KIND_VAR) visit(arg);
        else if (this.vars[manager.values[arg]] !== -1) count++;
        else hasUnboundVars = true;
      }
    };
    visit(expr);
    return { count, hasUnboundVars };
  }

  private genMpFilter(expr: number): number {
    const manager = this.manager;
    if (manager.isGround(expr)) {
      const oreg = this.tree.numRegs;
      this.tree.numRegs += 1;
      const instr = mkInstruction<E>(OP_GET_ENODE);
      instr.oreg = oreg;
      instr.enode = this.hasher.getGroundEnode(expr, this.quantifier);
      this.seq.push(instr);
      return oreg;
    }
    const iregs = manager.mapArgs(expr, (arg) =>
      manager.kinds[arg] === KIND_VAR ? this.vars[manager.values[arg]] : this.genMpFilter(arg),
    );
    const oreg = this.tree.numRegs;
    this.tree.numRegs += 1;
    const instr = mkInstruction<E>(OP_GET_CGR);
    instr.label = manager.decls[expr];
    instr.numArgs = iregs.length;
    instr.oreg = oreg;
    instr.regs = iregs;
    setHash(instr, this.hasher.getLabelHash(instr.label));
    this.seq.push(instr);
    return oreg;
  }

  private lineariseMultiPattern() {
    const manager = this.manager;
    const patterns = this.patterns;
    for (let round = 1; round < patterns.length; round++) {
      let best = -1;
      let bestNumBoundVars = 0;
      let bestIndex = 0;
      let isFoundBoundedMp = false;
      for (let index = 0; index < patterns.length; index++) {
        if (this.isMpAlreadyProcessed[index]) continue;
        const pattern = patterns[index];
        const counted = this.getNumBoundVars(pattern);
        if (!counted.hasUnboundVars) {
          best = pattern;
          bestIndex = index;
          isFoundBoundedMp = true;
          break;
        }
        if (best === -1 || counted.count > bestNumBoundVars) {
          best = pattern;
          bestNumBoundVars = counted.count;
          bestIndex = index;
        }
      }
      if (best === -1) continue;
      this.isMpAlreadyProcessed[bestIndex] = true;
      if (isFoundBoundedMp) {
        this.genMpFilter(best);
        continue;
      }
      const oreg = this.tree.numRegs;
      this.tree.numRegs += manager.getNumArgs(best);
      let hasDepth1Joint = false;
      for (let index = 0; index < manager.getNumArgs(best); index++) {
        const arg = manager.getArg(best, index);
        this.registers[oreg + index] = arg;
        this.todo.push(oreg + index);
        if (
          (manager.kinds[arg] === KIND_VAR && this.vars[manager.values[arg]] >= 0) ||
          (manager.kinds[arg] !== KIND_VAR && manager.isGround(arg))
        )
          hasDepth1Joint = true;
      }
      const joints = manager.mapArgs(best, (arg): Joint<E> => {
        if (hasDepth1Joint) {
          if (manager.kinds[arg] === KIND_VAR) {
            const reg = this.vars[manager.values[arg]];
            return reg >= 0 ? { ...mkNullJoint<E>(), kind: JOINT_VAR, reg } : mkNullJoint<E>();
          }
          if (manager.isGround(arg))
            return {
              ...mkNullJoint<E>(),
              kind: JOINT_GROUND,
              enode: this.hasher.getGroundEnode(arg, this.quantifier),
            };
          return mkNullJoint<E>();
        }
        if (manager.kinds[arg] === KIND_VAR) return mkNullJoint<E>();
        let argPos = -1;
        for (let index = 0; index < manager.getNumArgs(arg) && argPos === -1; index++) {
          const innerArg = manager.getArg(arg, index);
          if (manager.kinds[innerArg] === KIND_VAR && this.vars[manager.values[innerArg]] >= 0)
            argPos = index;
        }
        if (argPos === -1) return mkNullJoint<E>();
        return {
          kind: JOINT_NESTED,
          enode: null,
          reg: this.vars[manager.values[manager.getArg(arg, argPos)]],
          decl: manager.decls[arg],
          argPos,
        };
      });
      const instr = mkInstruction<E>(OP_CONTINUE);
      instr.label = manager.decls[best];
      instr.numArgs = manager.getNumArgs(best);
      instr.oreg = oreg;
      instr.joints = joints;
      setHash(instr, this.hasher.getLabelHash(instr.label));
      this.seq.push(instr);
      this.numChoices++;
      while (this.todo.length > 0) this.lineariseCore();
    }
  }

  private linearise(head: Instruction<E>, firstIndex: number) {
    this.seq = [];
    this.matchedExprs.clear();
    while (this.todo.length > 0) this.lineariseCore();
    if (this.patterns.length > 1) {
      this.isMpAlreadyProcessed = this.patterns.map((_pattern, index) => index === firstIndex);
      this.lineariseMultiPattern();
    }
    const numDecls = this.manager.getQuantifier(this.quantifier).sorts.length;
    for (let index = 0; index < numDecls; index++) if (this.vars[index] === -1) return;
    const instr = mkInstruction<E>(OP_YIELD);
    instr.quantifier = this.quantifier;
    instr.pattern = this.pattern;
    instr.numArgs = numDecls;
    instr.regs = this.vars.slice(0, numDecls);
    this.seq.push(instr);
    let curr = head;
    for (const next of this.seq) {
      curr.next = next;
      curr = next;
    }
  }

  private setNext(instr: Instruction<E>, next: Instruction<E> | null) {
    if (!this.isTmpTree) {
      const old = instr.next;
      this.context.pushTrail(() => {
        instr.next = old;
      });
    }
    instr.next = next;
  }

  private findBestChild(firstChild: Instruction<E>) {
    let numTooSimple = 0;
    let bestChild: Instruction<E> | null = null;
    let maxCompatibility = 0;
    for (let child: Instruction<E> | null = firstChild; child !== null; child = child.alt) {
      const measure = this.getCompatibilityMeasure(child);
      if (measure.isSimple) {
        numTooSimple++;
        if (numTooSimple > FIND_BEST_CHILD_THRESHOLD) return null;
      }
      if (measure.weight > maxCompatibility) {
        bestChild = child;
        maxCompatibility = measure.weight;
      }
    }
    return bestChild;
  }

  private isBindCompatible(instr: Instruction<E>) {
    const manager = this.manager;
    const expr = this.getRegister(instr.reg);
    return (
      this.isApp(expr) &&
      !manager.isGround(expr) &&
      manager.decls[expr] === instr.label &&
      manager.getNumArgs(expr) === instr.numArgs
    );
  }

  private isCompareCompatible(instr: Instruction<E>) {
    const expr = this.getRegister(instr.reg);
    return expr !== -1 && expr === this.getRegister(instr.reg2);
  }

  private isCheckCompatible(instr: Instruction<E>) {
    const expr = this.getRegister(instr.reg);
    if (!this.isApp(expr) || !this.manager.isGround(expr)) return false;
    const node = this.hasher.getGroundEnode(expr, this.quantifier);
    return instr.enode !== null && node !== null && instr.enode.root === node.root;
  }

  private getPatLblHash(reg: number) {
    const expr = this.registers[reg];
    if (this.manager.isGround(expr)) {
      const node = this.hasher.getGroundEnode(expr, this.quantifier);
      return node === null ? -1 : this.hasher.getLblHash(node);
    }
    return this.hasher.getLabelHash(this.manager.decls[expr]);
  }

  private isCheckSemiCompatible(instr: Instruction<E>) {
    if (instr.enode !== null) this.hasher.getLblHash(instr.enode);
    const expr = this.getRegister(instr.reg);
    return (
      expr !== -1 &&
      this.getMark(instr.reg) === NOT_CHECKED &&
      this.manager.isGround(expr) &&
      instr.enode !== null &&
      this.getPatLblHash(instr.reg) === instr.enode.lblHash
    );
  }

  private isFilterCompatible(instr: Instruction<E>) {
    const expr = this.getRegister(instr.reg);
    return (
      this.isApp(expr) &&
      !this.manager.isGround(expr) &&
      hasHash(instr.lblLow, instr.lblHigh, this.getPatLblHash(instr.reg))
    );
  }

  private isCfilterCompatible(instr: Instruction<E>) {
    const expr = this.getRegister(instr.reg);
    return (
      expr !== -1 &&
      this.manager.isGround(expr) &&
      hasHash(instr.lblLow, instr.lblHigh, this.getPatLblHash(instr.reg))
    );
  }

  private isFilterSemiCompatible(instr: Instruction<E>) {
    const expr = this.getRegister(instr.reg);
    return (
      this.getMark(instr.reg) === NOT_CHECKED && this.isApp(expr) && !this.manager.isGround(expr)
    );
  }

  private getCompatibilityMeasure(child: Instruction<E>) {
    const manager = this.manager;
    this.toReset.length = 0;
    let weight = 0;
    let numInstructions = 0;
    let curr = child.next;
    while (curr !== null && curr.op !== OP_CHOOSE && curr.op !== OP_NOOP) {
      numInstructions++;
      switch (curr.op) {
        case OP_BIND:
          if (this.isBindCompatible(curr)) {
            weight += 4;
            const expr = this.registers[curr.reg];
            for (let index = 0; index < curr.numArgs; index++) {
              this.registers[curr.oreg + index] = manager.getArg(expr, index);
              this.toReset.push(curr.oreg + index);
            }
          }
          break;
        case OP_COMPARE:
          if (this.isCompareCompatible(curr)) weight += 2;
          break;
        case OP_CHECK:
          if (this.isCheckCompatible(curr)) weight += 2;
          else if (this.isCheckSemiCompatible(curr)) weight += 1;
          break;
        case OP_CFILTER:
          if (this.isCfilterCompatible(curr)) weight += 2;
          break;
        case OP_FILTER:
          if (this.isFilterCompatible(curr)) weight += 2;
          else if (this.isFilterSemiCompatible(curr)) weight += 1;
          break;
      }
      curr = curr.next;
    }
    const isSimple = !(
      numInstructions > SIMPLE_SEQ_THRESHOLD ||
      (curr !== null && curr.op === OP_CHOOSE)
    );
    for (const reg of this.toReset) this.registers[reg] = -1;
    return { weight, isSimple };
  }

  private eraseTodo(reg: number) {
    const index = this.todo.indexOf(reg);
    if (index !== -1) this.todo.splice(index, 1);
  }

  private insertAt(start: Instruction<E>, firstIndex: number) {
    const manager = this.manager;
    let head = start;
    for (;;) {
      const compatible = this.compatible;
      const incompatible = this.incompatible;
      compatible.length = 0;
      incompatible.length = 0;
      let curr = head.next;
      let last = head;
      while (curr !== null && curr.op !== OP_CHOOSE && curr.op !== OP_NOOP) {
        switch (curr.op) {
          case OP_BIND:
            if (this.isBindCompatible(curr)) {
              this.eraseTodo(curr.reg);
              this.setMark(curr.reg, NOT_CHECKED);
              compatible.push(curr);
              const expr = this.registers[curr.reg];
              for (let index = 0; index < curr.numArgs; index++) {
                this.registers[curr.oreg + index] = manager.getArg(expr, index);
                this.todo.push(curr.oreg + index);
              }
            } else incompatible.push(curr);
            break;
          case OP_CHECK:
            if (this.isCheckCompatible(curr)) {
              this.eraseTodo(curr.reg);
              this.setMark(curr.reg, NOT_CHECKED);
              compatible.push(curr);
            } else if (this.isCheckSemiCompatible(curr) && curr.enode !== null) {
              const filter = mkFilter<E>(OP_CFILTER, curr.reg, 0, 0);
              setHash(filter, this.hasher.getLblHash(curr.enode));
              setHash(filter, this.getPatLblHash(curr.reg));
              this.setMark(curr.reg, CHECK_SET);
              compatible.push(filter);
              incompatible.push(curr);
            } else incompatible.push(curr);
            break;
          case OP_COMPARE:
            if (this.isCompareCompatible(curr)) {
              this.eraseTodo(curr.reg2);
              this.setMark(curr.reg2, NOT_CHECKED);
              const expr = this.registers[curr.reg];
              if (manager.kinds[expr] === KIND_VAR) {
                this.eraseTodo(curr.reg);
                this.setMark(curr.reg, NOT_CHECKED);
                const varIndex = manager.values[expr];
                if (this.vars[varIndex] === -1) this.vars[varIndex] = curr.reg;
              }
              compatible.push(curr);
            } else incompatible.push(curr);
            break;
          case OP_CFILTER:
            if (this.isCfilterCompatible(curr)) {
              this.setMark(curr.reg, CHECK_SINGLETON);
              compatible.push(curr);
            } else incompatible.push(curr);
            break;
          case OP_FILTER:
            if (this.isFilterCompatible(curr)) {
              const isSingleton = countBits(curr.lblLow) + countBits(curr.lblHigh) === 1;
              this.setMark(curr.reg, isSingleton ? CHECK_SINGLETON : CHECK_SET);
              compatible.push(curr);
            } else if (this.isFilterSemiCompatible(curr)) {
              const hash = this.getPatLblHash(curr.reg);
              this.setMark(curr.reg, CHECK_SET);
              if (countBits(curr.lblLow) + countBits(curr.lblHigh) > 1) {
                const filter = curr;
                const low = filter.lblLow;
                const high = filter.lblHigh;
                this.context.pushTrail(() => {
                  filter.lblLow = low;
                  filter.lblHigh = high;
                });
                setHash(filter, hash);
                compatible.push(curr);
              } else {
                const filter = mkFilter<E>(OP_FILTER, curr.reg, curr.lblLow, curr.lblHigh);
                setHash(filter, hash);
                compatible.push(filter);
                incompatible.push(curr);
              }
            } else incompatible.push(curr);
            break;
          default:
            incompatible.push(curr);
        }
        last = curr;
        curr = curr.next;
      }
      if (incompatible.length === 0) {
        if (curr === null) return;
        const bestChild = this.findBestChild(curr);
        if (bestChild === null) {
          const newChild = mkChoose(curr);
          this.numChoices++;
          this.setNext(last, newChild);
          this.linearise(newChild, firstIndex);
          return;
        }
        head = bestChild;
        continue;
      }
      const firstChildHead = curr;
      const newChildHead2 = mkInstruction<E>(OP_NOOP);
      const newChildHead1 = mkChoose(newChildHead2);
      this.numChoices++;
      let tail = head;
      for (const instr of compatible) {
        this.setNext(tail, instr);
        tail = instr;
      }
      this.setNext(tail, newChildHead1);
      tail = newChildHead1;
      for (const instr of incompatible) {
        if (tail === newChildHead1) tail.next = instr;
        else this.setNext(tail, instr);
        tail = instr;
      }
      this.setNext(tail, firstChildHead);
      this.linearise(newChildHead2, firstIndex);
      return;
    }
  }

  mkTree(
    quantifier: number,
    patterns: number[],
    firstIndex: number,
    isFilteringCandidates: boolean,
    pattern = -1,
  ) {
    const first = patterns[firstIndex];
    const numArgs = this.manager.getNumArgs(first);
    const tree: CodeTree<E> = {
      numArgs,
      isFilteringCandidates,
      numRegs: numArgs + 1,
      numChoices: 0,
      root: mkInit<E>(this.isAc(this.manager.decls[first]) ? OP_INITAC : OP_INIT, numArgs),
      candidates: [],
      qhead: 0,
      candidateGcThreshold: 10000,
    };
    this.init(tree, quantifier, pattern, patterns, firstIndex);
    this.linearise(tree.root, firstIndex);
    if (tree.root.op === OP_INITAC) this.numChoices++;
    tree.numChoices = this.numChoices;
    return tree;
  }

  insert(
    tree: CodeTree<E>,
    quantifier: number,
    patterns: number[],
    firstIndex: number,
    isTmpTree: boolean,
    pattern = -1,
  ) {
    if (tree.numArgs !== this.manager.getNumArgs(patterns[firstIndex])) return;
    this.isTmpTree = isTmpTree;
    if (!isTmpTree) {
      const numRegs = tree.numRegs;
      this.context.pushTrail(() => {
        tree.numRegs = numRegs;
      });
    }
    this.init(tree, quantifier, pattern, patterns, firstIndex);
    this.numChoices = tree.numChoices;
    this.insertAt(tree.root, firstIndex);
    if (this.numChoices <= tree.numChoices) return;
    if (!isTmpTree) {
      const numChoices = tree.numChoices;
      this.context.pushTrail(() => {
        tree.numChoices = numChoices;
      });
    }
    tree.numChoices = this.numChoices;
  }
}
