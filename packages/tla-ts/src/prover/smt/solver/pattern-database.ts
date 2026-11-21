import { type AstManager, FAMILY_BASIC, FAMILY_USER, KIND_APP, KIND_VAR, OP_PATTERN } from "./ast";
import { isCommutativeDecl } from "./euf/egraph";
import { isAcDecl } from "./euf/mam";
import { PATTERN_DATABASE } from "./pattern-database-text";
import { createCommandReader, createSmtlibReader } from "./smtlib-parser";

const BACKTRACK = 0;
const BIND = 1;
const BIND_AC = 2;
const BIND_C = 3;
const CHOOSE_AC = 4;
const CHOOSE_C = 5;
const SET_VAR = 6;
const CHECK_VAR = 7;
const CHECK_TERM = 8;
const SET_BOUND = 9;
const CHECK_BOUND = 10;
const YIELD = 11;

interface Instruction {
  kind: number;
  offset: number;
  next: number;
  app: number;
  pattern: number;
  register: number;
  otherRegister: number;
  count: number;
  numBound: number;
}

interface DatabaseMatch {
  patterns: number[];
  weight: number;
}

const mkInstruction = (kind: number, offset = 0, next = 0, app = -1, count = 0) => ({
  kind,
  offset,
  next,
  app,
  pattern: -1,
  register: 0,
  otherRegister: 0,
  count,
  numBound: 0,
});

const isFunctionVar = (manager: AstManager, decl: number) => {
  const name = manager.funcDecls[decl].name;
  return typeof name === "string" && name.startsWith("?");
};

export class PatternDatabase {
  private precompiled: number[] = [];
  private firstInstructions: number[] = [];
  private instructions = [mkInstruction(BACKTRACK)];
  private registers: number[] = [];
  private boundDomain: number[] = [];
  private boundRange: number[] = [];

  constructor(private manager: AstManager) {
    // Z3 parses the database in a fresh cmd_context, whose builtin sorts include the seq plugin's.
    manager.initSeqPlugin();
    const reader = createSmtlibReader(manager);
    const commands = createCommandReader(PATTERN_DATABASE);
    const assertions: number[] = [];
    for (let list = commands.readCommand(); list !== undefined; list = commands.readCommand()) {
      const head = list.items[0];
      if (head.kind !== "list" && head.text === "assert")
        assertions.push(reader.parseAssertion(list.items[1], list.items[2] ?? list.end).formula);
      else reader.declareCommand(list);
    }
    reader.releaseTerms();
    for (const assertion of assertions) this.compile(assertion);
    for (const assertion of assertions) manager.decRef(assertion);
    for (const decl of reader.getDeclaredFuncs()) manager.decDeclRef(decl);
  }

  release() {
    for (const quantifier of this.precompiled) this.manager.decRef(quantifier);
  }

  private compile(quantifier: number) {
    const manager = this.manager;
    this.firstInstructions.push(this.instructions.length);
    this.precompiled.push(quantifier);
    manager.incRef(quantifier);
    const registers = [0];
    const patterns = [manager.getQuantifier(quantifier).body];
    let maxRegister = 1;
    const functionVars = new Map<number, number>();
    const bound = new Map<number, number>();
    for (let pattern = patterns.pop(); pattern !== undefined; pattern = patterns.pop()) {
      const instruction = mkInstruction(BACKTRACK, maxRegister, this.instructions.length + 1);
      instruction.pattern = pattern;
      instruction.register = registers.pop() ?? 0;
      if (manager.kinds[pattern] === KIND_VAR) {
        const index = bound.get(pattern);
        instruction.kind = index === undefined ? SET_BOUND : CHECK_BOUND;
        instruction.numBound = index ?? bound.size;
        if (index === undefined) bound.set(pattern, bound.size);
      } else if (manager.kinds[pattern] === KIND_APP) {
        const decl = manager.decls[pattern];
        for (let index = 0; index < manager.getNumArgs(pattern); index++) {
          registers.push(maxRegister);
          patterns.push(manager.getArg(pattern, index));
          maxRegister++;
        }
        const other = functionVars.get(decl);
        if (isFunctionVar(manager, decl) && other !== undefined) {
          instruction.kind = CHECK_VAR;
          instruction.otherRegister = other;
        } else if (isFunctionVar(manager, decl)) {
          instruction.kind = SET_VAR;
          functionVars.set(decl, instruction.register);
        } else if (isAcDecl(manager, decl)) instruction.kind = BIND_AC;
        else instruction.kind = isCommutativeDecl(manager, decl) ? BIND_C : BIND;
      } else instruction.kind = CHECK_TERM;
      this.instructions.push(instruction);
    }
    while (this.registers.length <= maxRegister) this.registers.push(-1);
    while (this.boundDomain.length <= bound.size) {
      this.boundDomain.push(-1);
      this.boundRange.push(-1);
    }
    this.instructions.push(mkInstruction(YIELD));
  }

  matchQuantifier(quantifier: number): DatabaseMatch | undefined {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    this.registers[0] = data.body;
    for (let index = 0; index < this.precompiled.length; index++) {
      const other = manager.getQuantifier(this.precompiled[index]);
      if (other.sorts.length !== data.sorts.length) continue;
      const functionRegisters = new Map<number, number>();
      if (!this.match(this.firstInstructions[index], functionRegisters)) continue;
      return {
        patterns: other.patterns.map((pattern) =>
          this.instantiate(pattern, data.sorts.length, functionRegisters),
        ),
        weight: other.weight,
      };
    }
    return undefined;
  }

  // Z3's for_each_ast visits the arguments of a term last to first, which orders the terms made here.
  private instantiate(pattern: number, numBound: number, functionRegisters: Map<number, number>) {
    const manager = this.manager;
    const bound = new Map<number, number>();
    for (let index = 0; index < numBound; index++)
      bound.set(this.boundDomain[index], this.boundRange[index]);
    const results = new Map<number, number>();
    const pinned: number[] = [];
    const stack = [pattern];
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (results.has(current)) {
        stack.pop();
        continue;
      }
      if (manager.kinds[current] !== KIND_APP) {
        stack.pop();
        results.set(
          current,
          manager.kinds[current] === KIND_VAR ? (bound.get(current) ?? -1) : current,
        );
        continue;
      }
      const pending = manager.getArgs(current).filter((innerArg) => !results.has(innerArg));
      stack.push(...pending);
      if (pending.length > 0) continue;
      stack.pop();
      const decl = manager.decls[current];
      const register = functionRegisters.get(decl);
      const target = register === undefined ? decl : manager.decls[this.registers[register]];
      const args = manager.mapArgs(current, (innerArg) => results.get(innerArg) ?? -1);
      const result =
        manager.funcDecls[decl].family === FAMILY_BASIC && manager.funcDecls[decl].op === OP_PATTERN
          ? manager.mkPattern(args)
          : manager.mkApp(target, args, manager.funcDecls[target].range);
      manager.incRef(result);
      pinned.push(result);
      results.set(current, result);
    }
    const result = results.get(pattern) ?? -1;
    manager.incRef(result);
    for (const term of pinned) manager.decRef(term);
    return result;
  }

  private isMatchingDecl(patternDecl: number, decl: number) {
    if (patternDecl === decl) return true;
    const patternInfo = this.manager.funcDecls[patternDecl];
    const info = this.manager.funcDecls[decl];
    if (
      patternInfo.domain.length !== info.domain.length ||
      patternInfo.family === FAMILY_USER ||
      info.family !== patternInfo.family ||
      info.op !== patternInfo.op ||
      info.parameters.length !== patternInfo.parameters.length
    )
      return false;
    for (let index = 0; index < info.parameters.length; index++)
      if (info.parameters[index] !== patternInfo.parameters[index]) return false;
    return true;
  }

  private match(start: number, functionRegisters: Map<number, number>) {
    const manager = this.manager;
    const registers = this.registers;
    const backtrackStack: Instruction[] = [];
    let instruction = this.instructions[start];
    for (;;) {
      let isOk = false;
      const term = registers[instruction.register];
      switch (instruction.kind) {
        case YIELD:
          return true;
        case CHECK_TERM:
          isOk = instruction.pattern === term;
          break;
        case SET_VAR:
        case CHECK_VAR: {
          if (manager.kinds[term] !== KIND_APP) break;
          if (manager.getNumArgs(instruction.pattern) !== manager.getNumArgs(term)) break;
          if (
            instruction.kind === CHECK_VAR &&
            manager.decls[term] !== manager.decls[registers[instruction.otherRegister]]
          )
            break;
          for (let index = 0; index < manager.getNumArgs(term); index++)
            registers[instruction.offset + index] = manager.getArg(term, index);
          if (instruction.kind === SET_VAR)
            functionRegisters.set(manager.decls[instruction.pattern], instruction.register);
          isOk = true;
          break;
        }
        case SET_BOUND: {
          if (manager.kinds[term] !== KIND_VAR) break;
          isOk = true;
          for (let index = 0; isOk && index < instruction.numBound; index++)
            isOk = term !== this.boundRange[index];
          if (!isOk) break;
          this.boundDomain[instruction.numBound] = instruction.pattern;
          this.boundRange[instruction.numBound] = term;
          break;
        }
        case CHECK_BOUND:
          isOk = this.boundRange[instruction.numBound] === term;
          break;
        case BIND:
        case BIND_AC:
        case BIND_C: {
          if (manager.kinds[term] !== KIND_APP) break;
          if (manager.getNumArgs(instruction.pattern) !== manager.getNumArgs(term)) break;
          if (!this.isMatchingDecl(manager.decls[instruction.pattern], manager.decls[term])) break;
          if (instruction.kind === BIND_AC) {
            backtrackStack.push(
              mkInstruction(CHOOSE_AC, instruction.offset, instruction.next, term, 1),
            );
            break;
          }
          for (let index = 0; index < manager.getNumArgs(term); index++)
            registers[instruction.offset + index] = manager.getArg(term, index);
          if (instruction.kind === BIND_C)
            backtrackStack.push(
              mkInstruction(CHOOSE_C, instruction.offset, instruction.next, term, 2),
            );
          isOk = true;
          break;
        }
        case CHOOSE_C:
          isOk = true;
          registers[instruction.offset + 1] = manager.getArg(instruction.app, 0);
          registers[instruction.offset] = manager.getArg(instruction.app, 1);
          break;
        case CHOOSE_AC: {
          isOk = true;
          const numArgs = manager.getNumArgs(instruction.app);
          for (let index = 0; index < numArgs; index++)
            registers[instruction.offset + index] = manager.getArg(instruction.app, index);
          let factorial = 1;
          for (let index = 2; index <= numArgs; index++) {
            factorial *= index - 1;
            const first = instruction.offset + index - 1;
            const second =
              instruction.offset + index - (Math.floor(instruction.count / factorial) % index) - 1;
            const swapped = registers[first];
            registers[first] = registers[second];
            registers[second] = swapped;
          }
          if (instruction.count < factorial * numArgs)
            backtrackStack.push(
              mkInstruction(
                CHOOSE_AC,
                instruction.offset,
                instruction.next,
                instruction.app,
                instruction.count + 1,
              ),
            );
          break;
        }
        case BACKTRACK: {
          const top = backtrackStack.pop();
          if (top === undefined) return false;
          instruction = top;
          continue;
        }
      }
      instruction = this.instructions[isOk ? instruction.next : 0];
    }
  }
}
