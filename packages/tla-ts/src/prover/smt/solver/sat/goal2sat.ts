// Ported from Z3 (src/sat/tactic/goal2sat.h, src/sat/tactic/goal2sat.cpp,
// src/ast/expr2var.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError, SmtTacticError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_PB,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
} from "../ast";
import { DEFAULT_PRINT_OPTIONS, printExpr } from "../smt2-printer";
import { NULL_LITERAL } from "./clause";
import { PbSolver, type SatInternalizer } from "./pb-solver";
import type { Solver } from "./solver";

const PRINT_ENVIRONMENT = {
  options: DEFAULT_PRINT_OPTIONS,
  isUsed: () => false,
  isClashing: () => false,
};

interface Frame {
  expr: number;
  isRoot: boolean;
  isSign: boolean;
  index: number;
}

export class Goal2Sat implements SatInternalizer {
  readonly atoms = new Map<number, number>();
  readonly unhandledFuns: number[] = [];
  private frames: Frame[] = [];
  private results: number[] = [];
  private app2lit = new Map<number, number>();

  constructor(
    private manager: AstManager,
    private solver: Solver,
    private isIteExtra: boolean,
  ) {}

  private throwOpNotHandled(expr: number) {
    throw new SmtTacticError(
      `operator ${printExpr(this.manager, PRINT_ENVIRONMENT, expr)} not supported, apply simplifier before invoking translator`,
    );
  }

  private mkClause(lits: number[]) {
    this.solver.mkClause(lits);
  }

  private addVar(isExternal: boolean) {
    return this.solver.mkVar(isExternal, true);
  }

  private mkBoolVar(expr: number) {
    const boolVar = this.addVar(true);
    this.atoms.set(expr, boolVar);
    return boolVar;
  }

  private convertAtom(expr: number, isRoot: boolean, isSign: boolean) {
    const manager = this.manager;
    const boolVar = this.atoms.get(expr);
    let lit: number;
    if (boolVar !== undefined) {
      lit = 2 * boolVar + (isSign ? 1 : 0);
      this.solver.setEliminated(boolVar, false);
    } else if (manager.isTrue(expr)) {
      const trueLit = 2 * this.mkBoolVar(expr);
      this.mkClause([trueLit]);
      lit = isSign ? trueLit ^ 1 : trueLit;
    } else if (manager.isFalse(expr)) {
      const falseLit = 2 * this.mkBoolVar(expr);
      this.mkClause([falseLit ^ 1]);
      lit = isSign ? falseLit ^ 1 : falseLit;
    } else {
      if (!manager.isUninterpretedConst(expr)) {
        if (!manager.isApp(expr)) this.throwOpNotHandled(expr);
        this.unhandledFuns.push(manager.decls[expr]);
      }
      lit = 2 * this.mkBoolVar(expr) + (isSign ? 1 : 0);
    }
    if (isRoot) this.mkClause([lit]);
    else this.results.push(lit);
  }

  private processCached(expr: number, isRoot: boolean, isSign: boolean) {
    const cached = this.app2lit.get(expr);
    if (cached === undefined) return false;
    const lit = isSign ? cached ^ 1 : cached;
    if (isRoot) this.mkClause([lit]);
    else this.results.push(lit);
    return true;
  }

  private visit(expr: number, isRoot: boolean, isSign: boolean) {
    const manager = this.manager;
    if (!manager.isApp(expr)) {
      this.convertAtom(expr, isRoot, isSign);
      return true;
    }
    if (this.processCached(expr, isRoot, isSign)) return true;
    if (manager.getFamily(expr) === FAMILY_PB) {
      this.frames.push({ expr, isRoot, isSign, index: 0 });
      return false;
    }
    if (manager.getFamily(expr) !== FAMILY_BASIC) {
      this.convertAtom(expr, isRoot, isSign);
      return true;
    }
    switch (manager.getOp(expr)) {
      case OP_NOT:
      case OP_OR:
      case OP_AND:
      case OP_ITE:
      case OP_XOR:
      case OP_IMPLIES:
        this.frames.push({ expr, isRoot, isSign, index: 0 });
        return false;
      case OP_EQ:
        if (manager.isBool(manager.getArg(expr, 1))) {
          this.frames.push({ expr, isRoot, isSign, index: 0 });
          return false;
        }
        this.convertAtom(expr, isRoot, isSign);
        return true;
      case OP_DISTINCT:
        return this.throwOpNotHandled(expr);
      default:
        this.convertAtom(expr, isRoot, isSign);
        return true;
    }
  }

  private mkTseitinVar(expr: number) {
    const lit = 2 * this.addVar(false);
    this.app2lit.set(expr, lit);
    return lit;
  }

  private convertOr(expr: number, isRoot: boolean, isSign: boolean) {
    const results = this.results;
    const num = this.manager.getNumArgs(expr);
    const oldSize = results.length - num;
    if (isRoot) {
      if (isSign) for (let index = 0; index < num; index++) this.mkClause([results[index] ^ 1]);
      else this.mkClause(results.slice());
      results.length = oldSize;
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = this.mkTseitinVar(expr);
    for (let index = oldSize; index < oldSize + num; index++)
      this.mkClause([results[index] ^ 1, lit]);
    this.mkClause([...results.slice(oldSize), lit ^ 1]);
    this.solver.setPhaseLiteral(lit ^ 1);
    results.length = oldSize;
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertAnd(expr: number, isRoot: boolean, isSign: boolean) {
    const results = this.results;
    const num = this.manager.getNumArgs(expr);
    const oldSize = results.length - num;
    if (isRoot) {
      if (isSign) this.mkClause(results.slice(0, num).map((lit) => lit ^ 1));
      else for (let index = 0; index < num; index++) this.mkClause([results[index]]);
      results.length = oldSize;
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = this.mkTseitinVar(expr);
    for (let index = oldSize; index < oldSize + num; index++)
      this.mkClause([lit ^ 1, results[index]]);
    this.mkClause([...results.slice(oldSize).map((arg) => arg ^ 1), lit]);
    this.solver.setPhaseLiteral(lit);
    results.length = oldSize;
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertIte(expr: number, isRoot: boolean, isSign: boolean) {
    const results = this.results;
    const size = results.length;
    const condition = results[size - 3];
    const thenLit = results[size - 2];
    const elseLit = results[size - 1];
    results.length = size - 3;
    if (isRoot) {
      if (isSign) {
        this.mkClause([condition ^ 1, thenLit ^ 1]);
        this.mkClause([condition, elseLit ^ 1]);
      } else {
        this.mkClause([condition ^ 1, thenLit]);
        this.mkClause([condition, elseLit]);
      }
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = this.mkTseitinVar(expr);
    this.mkClause([lit ^ 1, condition ^ 1, thenLit]);
    this.mkClause([lit ^ 1, condition, elseLit]);
    this.mkClause([lit, condition ^ 1, thenLit ^ 1]);
    this.mkClause([lit, condition, elseLit ^ 1]);
    if (this.isIteExtra) {
      this.mkClause([thenLit ^ 1, elseLit ^ 1, lit]);
      this.mkClause([thenLit, elseLit, lit ^ 1]);
    }
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertNot(expr: number, isRoot: boolean, isSign: boolean) {
    const results = this.results;
    const arg = results.pop() as number;
    if (isRoot) {
      this.mkClause([isSign ? arg : arg ^ 1]);
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = this.mkTseitinVar(expr);
    this.mkClause([arg, lit]);
    this.mkClause([arg ^ 1, lit ^ 1]);
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertImplies(expr: number, isRoot: boolean, isSign: boolean) {
    const results = this.results;
    const second = results.pop() as number;
    const first = results.pop() as number;
    if (isRoot) {
      if (isSign) {
        this.mkClause([first]);
        this.mkClause([second ^ 1]);
      } else this.mkClause([first ^ 1, second]);
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = this.mkTseitinVar(expr);
    this.mkClause([lit ^ 1, first ^ 1, second]);
    this.mkClause([first, lit]);
    this.mkClause([second ^ 1, lit]);
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertIff(expr: number, isRoot: boolean, isSign: boolean) {
    const manager = this.manager;
    if (manager.getNumArgs(expr) !== 2)
      throw new SmtTacticError(
        `unexpected number of arguments to ${printExpr(manager, PRINT_ENVIRONMENT, expr)}`,
      );
    const results = this.results;
    const isXor = manager.getOp(expr) === OP_XOR;
    let first = results.pop() as number;
    const second = results.pop() as number;
    if (isRoot) {
      if (isSign !== isXor) {
        this.mkClause([first, second]);
        this.mkClause([first ^ 1, second ^ 1]);
      } else {
        this.mkClause([first, second ^ 1]);
        this.mkClause([first ^ 1, second]);
      }
      return;
    }
    if (this.processCached(expr, isRoot, isSign)) return;
    const lit = 2 * this.addVar(false);
    if (isXor) first ^= 1;
    this.mkClause([lit ^ 1, first, second ^ 1]);
    this.mkClause([lit ^ 1, first ^ 1, second]);
    this.mkClause([lit, first, second]);
    this.mkClause([lit, first ^ 1, second ^ 1]);
    this.app2lit.set(expr, lit);
    results.push(isSign ? lit ^ 1 : lit);
  }

  private convertBa(expr: number, isRoot: boolean, isSign: boolean) {
    const solver = this.solver;
    if (solver.ext === null) {
      const ext = new PbSolver(this.manager, this, solver);
      solver.ext = ext;
      for (let index = 0; index < solver.scopeLvl; index++) ext.push();
    }
    const lit = (solver.ext as PbSolver).internalize(expr, isSign, isRoot);
    this.results.length -= this.manager.getNumArgs(expr);
    if (lit === NULL_LITERAL) return;
    if (isRoot) this.mkClause([lit]);
    else this.results.push(lit);
  }

  private convert(expr: number, isRoot: boolean, isSign: boolean) {
    if (this.manager.getFamily(expr) === FAMILY_PB) return this.convertBa(expr, isRoot, isSign);
    switch (this.manager.getOp(expr)) {
      case OP_OR:
        return this.convertOr(expr, isRoot, isSign);
      case OP_AND:
        return this.convertAnd(expr, isRoot, isSign);
      case OP_ITE:
        return this.convertIte(expr, isRoot, isSign);
      case OP_EQ:
      case OP_XOR:
        return this.convertIff(expr, isRoot, isSign);
      case OP_IMPLIES:
        return this.convertImplies(expr, isRoot, isSign);
      default:
        return this.convertNot(expr, isRoot, isSign);
    }
  }

  private process(form: number, isRoot: boolean) {
    const manager = this.manager;
    const frames = this.frames;
    const baseSize = frames.length;
    if (this.visit(form, isRoot, false)) return;
    loop: while (frames.length > baseSize) {
      if (!manager.limit.inc()) throw new SmtCanceledError();
      const size = frames.length;
      const frame = frames[size - 1];
      const expr = frame.expr;
      if (frame.index === 0 && this.processCached(expr, frame.isRoot, frame.isSign)) {
        frames.pop();
        continue;
      }
      if (
        manager.isNot(expr) &&
        (frame.isRoot || (!manager.isNot(manager.getArg(expr, 0)) && size !== baseSize + 1))
      ) {
        frames.pop();
        this.visit(manager.getArg(expr, 0), frame.isRoot, !frame.isSign);
        continue;
      }
      const num = manager.getNumArgs(expr);
      while (frame.index < num) {
        const arg = manager.getArg(expr, frame.index);
        frame.index++;
        if (!this.visit(arg, false, false)) continue loop;
      }
      this.convert(expr, frame.isRoot, frame.isSign);
      frames.pop();
    }
  }

  internalize(expr: number) {
    const manager = this.manager;
    const isNot = manager.isNot(expr);
    const atom = isNot ? manager.getArg(expr, 0) : expr;
    this.process(atom, false);
    const result = this.results.pop() as number;
    if ((result & 1) === 0 && !this.atoms.has(atom)) {
      this.atoms.set(atom, result >> 1);
      this.solver.setExternal(result >> 1);
    }
    return isNot ? result ^ 1 : result;
  }

  getCached(expr: number) {
    return this.app2lit.get(expr) ?? NULL_LITERAL;
  }

  cache(expr: number, lit: number) {
    this.app2lit.set(expr, lit);
  }

  // insert_dep on an assumption, an uninterpreted constant or its negation.
  getAssumptionLit(assumption: number) {
    const manager = this.manager;
    const isNot = manager.isNot(assumption);
    this.convertAtom(isNot ? manager.getArg(assumption, 0) : assumption, false, false);
    const lit = this.results.pop() as number;
    return isNot ? lit ^ 1 : lit;
  }

  run(forms: readonly number[]) {
    try {
      for (const form of forms) this.process(form, true);
    } finally {
      this.frames = [];
      this.results = [];
      this.app2lit = new Map();
    }
  }
}
