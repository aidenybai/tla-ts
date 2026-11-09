// Ported from Z3 (src/tactic/core/elim_uncnstr_tactic.cpp, src/tactic/core/collect_occs.cpp), MIT
// license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_DATATYPE,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_BADD,
  OP_BMUL,
  OP_BNOT,
  OP_BOR,
  OP_BSDIV,
  OP_BSDIV_I,
  OP_BSUB,
  OP_BUDIV,
  OP_BUDIV_I,
  OP_CONCAT,
  OP_CONST_ARRAY,
  OP_DT_ACCESSOR,
  OP_EQ,
  OP_EXTRACT,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SELECT,
  OP_SLEQ,
  OP_STORE,
  OP_SUB,
  OP_ULEQ,
  SORT_BOOL,
  SORT_REAL,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
  isArithSort,
} from "./ast";
import { mkArrayApp } from "./array-decl-plugin";
import { mkBvApp } from "./bv-decl-plugin";
import type { Definition, Goal } from "./goal";
import { getManagerSomeValue } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

const getModInverse = (value: bigint, modulus: bigint) => {
  let [oldRemainder, remainder] = [((value % modulus) + modulus) % modulus, modulus];
  let [oldCoefficient, coefficient] = [1n, 0n];
  while (remainder !== 0n) {
    const quotient = oldRemainder / remainder;
    [oldRemainder, remainder] = [remainder, oldRemainder - quotient * remainder];
    [oldCoefficient, coefficient] = [coefficient, oldCoefficient - quotient * coefficient];
  }
  return oldRemainder === 1n ? ((oldCoefficient % modulus) + modulus) % modulus : undefined;
};

export const collectUnconstrained = (manager: AstManager, goal: Goal) => {
  const visited = new Set<number>();
  const vars: number[] = [];
  const repeated = new Set<number>();
  for (const form of goal.forms.items) {
    const todo = [form];
    while (todo.length > 0) {
      const expr = todo.pop() as number;
      const isConst = manager.kinds[expr] === KIND_APP && manager.isUninterpretedConst(expr);
      if (visited.has(expr)) {
        if (isConst) repeated.add(expr);
        continue;
      }
      visited.add(expr);
      if (isConst) vars.push(expr);
      else if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
      else if (manager.kinds[expr] === KIND_APP)
        for (let index = manager.getNumArgs(expr) - 1; index >= 0; index--)
          todo.push(manager.getArg(expr, index));
    }
  }
  return new Set(vars.filter((variable) => !repeated.has(variable)));
};

// The bodies stay held until the next run, as Z3 holds them in the tactic.
export const disableQuantified = (manager: AstManager, goal: Goal, bodies: RefVector) => {
  const disabled = new Set<number>();
  const visited = new Set<number>();
  const todo = [...goal.forms.items];
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const body = manager.getQuantifier(expr).body;
      todo.push(body);
      if (disabled.has(body)) continue;
      bodies.push(body);
      const marks = [body];
      while (marks.length > 0) {
        const marked = marks.pop() as number;
        if (disabled.has(marked)) continue;
        disabled.add(marked);
        if (manager.kinds[marked] === KIND_APP) manager.pushArgs(marked, marks);
      }
    } else if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
  }
  return disabled;
};

class UncnstrRewriter extends RewriterTpl {
  vars = new Set<number>();
  disabled = new Set<number>();
  readonly entries: Definition[] = [];
  readonly terms: RefVector;
  private cache = new Map<number, number>();

  constructor(
    manager: AstManager,
    private isProofsEnabled: boolean,
  ) {
    super(manager);
    this.terms = new RefVector(manager);
  }

  private pin(expr: number) {
    this.terms.push(expr);
    return expr;
  }

  private isUncnstr(expr: number) {
    return this.vars.has(expr) && !this.disabled.has(expr);
  }

  private mkFreshFor(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const key = this.pin(manager.mkApp(decl, args, sort));
    const cached = this.cache.get(key);
    if (cached !== undefined) return { fresh: cached, isNew: false };
    const fresh = this.pin(manager.mkFreshConst(null, sort));
    this.entries.push({ decl: manager.decls[fresh], def: -1 });
    this.cache.set(key, fresh);
    return { fresh, isNew: true };
  }

  private addDef(variable: number, def: number) {
    this.entries.push({ decl: this.manager.decls[variable], def: this.pin(def) });
  }

  private addDefs(args: number[], fresh: number, identity: number) {
    this.addDef(args[0], fresh);
    for (const arg of args.slice(1)) this.addDef(arg, identity);
  }

  private isFullyInterp(sort: number): boolean {
    const manager = this.manager;
    if (manager.isUninterpretedSort(sort)) return false;
    if (manager.isArraySort(sort))
      return manager.getSortParameters(sort).every((parameter) => this.isFullyInterp(parameter));
    if (manager.isDatatypeSort(sort))
      throw new SmtUnsupportedError("eliminating an unconstrained datatype constant");
    return true;
  }

  private mkNumeral(value: Rational, sort: number) {
    return this.pin(this.manager.mkNumeralOfSort(value, sort));
  }

  private mkDiff(term: number): number {
    const manager = this.manager;
    const sort = manager.sorts[term];
    if (sort === SORT_BOOL) return this.pin(manager.mkApp(OP_NOT, [term], SORT_BOOL));
    if (isArithSort(sort))
      return this.pin(manager.mkApp(OP_ADD, [term, this.mkNumeral(Rational.one, sort)], sort));
    if (manager.isBvSort(sort)) return this.pin(mkBvApp(manager, OP_BNOT, [term]));
    if (manager.isDatatypeSort(sort))
      throw new SmtUnsupportedError("eliminating an unconstrained datatype constant");
    if (!manager.isArraySort(sort)) return -1;
    const parameters = manager.getSortParameters(sort);
    if (parameters.some((parameter) => manager.isUninterpretedSort(parameter))) return -1;
    const indices = parameters
      .slice(0, -1)
      .map((parameter) => this.pin(getManagerSomeValue(manager, parameter)));
    const select = this.pin(mkArrayApp(manager, OP_SELECT, [term, ...indices]));
    const diff = this.mkDiff(select);
    return diff === -1 ? -1 : this.pin(mkArrayApp(manager, OP_STORE, [term, ...indices, diff]));
  }

  private processEq(decl: number, args: number[]) {
    const manager = this.manager;
    const [first, second] = args;
    const isFirst = this.isUncnstr(first);
    if (!isFirst && !this.isUncnstr(second)) return -1;
    const variable = isFirst ? first : second;
    const term = isFirst ? second : first;
    const sort = manager.sorts[first];
    if (!this.isFullyInterp(sort)) return -1;
    const size = manager.getSortSize(sort);
    if (size !== SORT_SIZE_INFINITE && size !== SORT_SIZE_VERY_BIG && size <= 1n) return -1;
    const diff = this.mkDiff(term);
    if (diff === -1) return -1;
    const found = this.mkFreshFor(decl, args, SORT_BOOL);
    if (found.isNew)
      this.addDef(variable, manager.mkApp(OP_ITE, [found.fresh, term, diff], manager.sorts[term]));
    return found.fresh;
  }

  private processBasic(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    switch (manager.funcDecls[decl].op) {
      case OP_ITE: {
        const [condition, thenExpr, elseExpr] = args;
        const isBranches = this.isUncnstr(thenExpr) && this.isUncnstr(elseExpr);
        const isThen = this.isUncnstr(condition) && this.isUncnstr(thenExpr);
        const isElse = this.isUncnstr(condition) && this.isUncnstr(elseExpr);
        if (!isBranches && !isThen && !isElse) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (!found.isNew) return found.fresh;
        if (isBranches) this.addDef(thenExpr, found.fresh);
        else this.addDef(condition, isThen ? manager.trueExpr : manager.falseExpr);
        this.addDef(isThen && !isBranches ? thenExpr : elseExpr, found.fresh);
        return found.fresh;
      }
      case OP_NOT: {
        if (!this.isUncnstr(args[0])) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (found.isNew) this.addDef(args[0], manager.mkApp(OP_NOT, [found.fresh], SORT_BOOL));
        return found.fresh;
      }
      case OP_AND:
      case OP_OR: {
        if (!args.every((arg) => this.isUncnstr(arg))) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        const identity =
          manager.funcDecls[decl].op === OP_AND ? manager.trueExpr : manager.falseExpr;
        if (found.isNew) this.addDefs(args, found.fresh, identity);
        return found.fresh;
      }
      case OP_EQ:
        return this.processEq(decl, args);
      default:
        return -1;
    }
  }

  private processAdd(decl: number, args: number[], sort: number, subOp: number) {
    const manager = this.manager;
    const index = args.findIndex((arg) => this.isUncnstr(arg));
    if (index === -1) return -1;
    const found = this.mkFreshFor(decl, args, sort);
    if (!found.isNew) return found.fresh;
    const rest = args.filter((_, other) => other !== index);
    const restExpr =
      rest.length === 0
        ? -1
        : rest.length === 1
          ? rest[0]
          : this.pin(manager.mkApp(decl, rest, sort));
    const def =
      restExpr === -1
        ? found.fresh
        : subOp === OP_BSUB
          ? mkBvApp(manager, OP_BSUB, [found.fresh, restExpr])
          : manager.mkApp(OP_SUB, [found.fresh, restExpr], sort);
    this.addDef(args[index], def);
    return found.fresh;
  }

  private processArith(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (op === OP_ADD) return this.processAdd(decl, args, sort, OP_SUB);
    if (op === OP_LE || op === OP_GE) {
      const [first, second] = args;
      const isFirst = this.isUncnstr(first);
      if (!isFirst && !this.isUncnstr(second)) return -1;
      const isLe = isFirst === (op === OP_LE);
      const variable = isFirst ? first : second;
      const term = isFirst ? second : first;
      const found = this.mkFreshFor(decl, args, SORT_BOOL);
      if (!found.isNew) return found.fresh;
      const argSort = manager.sorts[first];
      const step = this.mkNumeral(isLe ? Rational.one : Rational.minusOne, argSort);
      const next = this.pin(manager.mkApp(OP_ADD, [term, step], argSort));
      this.addDef(variable, manager.mkApp(OP_ITE, [found.fresh, term, next], argSort));
      return found.fresh;
    }
    if (op !== OP_MUL) return -1;
    if (args.every((arg) => this.isUncnstr(arg))) {
      const found = this.mkFreshFor(decl, args, sort);
      if (found.isNew)
        this.addDefs(args, found.fresh, this.mkNumeral(Rational.one, manager.sorts[args[0]]));
      return found.fresh;
    }
    if (
      args.length !== 2 ||
      !this.isUncnstr(args[1]) ||
      !manager.isNumeral(args[0]) ||
      manager.sorts[args[0]] !== SORT_REAL
    )
      return -1;
    const value = manager.getRationalValue(args[0]);
    if (value.isZero()) return -1;
    const found = this.mkFreshFor(decl, args, sort);
    if (found.isNew)
      this.addDef(
        args[1],
        manager.mkApp(
          OP_MUL,
          [this.mkNumeral(Rational.one.div(value), SORT_REAL), found.fresh],
          sort,
        ),
      );
    return found.fresh;
  }

  private processBvLe(decl: number, args: number[], isSigned: boolean) {
    const manager = this.manager;
    if (this.isProofsEnabled) return -1;
    const [first, second] = args;
    const isFirst = this.isUncnstr(first);
    if (!isFirst && !this.isUncnstr(second)) return -1;
    const width = manager.getBvSize(manager.sorts[first]);
    const bound = isFirst
      ? isSigned
        ? (1n << BigInt(width - 1)) - 1n
        : (1n << BigInt(width)) - 1n
      : isSigned
        ? -(1n << BigInt(width - 1))
        : 0n;
    const variable = isFirst ? first : second;
    const term = isFirst ? second : first;
    const found = this.mkFreshFor(decl, args, SORT_BOOL);
    const isBound = this.pin(manager.mkEq(term, this.pin(manager.mkBvNumeral(bound, width))));
    const result = this.pin(manager.mkOr([found.fresh, isBound]));
    if (found.isNew) {
      const one = this.pin(manager.mkBvNumeral(1n, width));
      const next = this.pin(mkBvApp(manager, isFirst ? OP_BADD : OP_BSUB, [term, one]));
      this.addDef(variable, manager.mkApp(OP_ITE, [result, term, next], manager.sorts[term]));
    }
    return result;
  }

  private processBv(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    const isAllUncnstr = args.every((arg) => this.isUncnstr(arg));
    switch (op) {
      case OP_BADD:
        return this.processAdd(decl, args, sort, OP_BSUB);
      case OP_BMUL: {
        const width = manager.getBvSize(manager.sorts[args[0]]);
        if (isAllUncnstr) {
          const found = this.mkFreshFor(decl, args, sort);
          if (found.isNew)
            this.addDefs(args, found.fresh, this.pin(manager.mkBvNumeral(1n, width)));
          return found.fresh;
        }
        if (args.length !== 2 || !this.isUncnstr(args[1]) || !manager.isBvNumeral(args[0]))
          return -1;
        const inverse = getModInverse(manager.getBvNumeralValue(args[0]), 1n << BigInt(width));
        if (inverse === undefined) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (found.isNew)
          this.addDef(
            args[1],
            mkBvApp(manager, OP_BMUL, [this.pin(manager.mkBvNumeral(inverse, width)), found.fresh]),
          );
        return found.fresh;
      }
      case OP_BSDIV:
      case OP_BUDIV:
      case OP_BSDIV_I:
      case OP_BUDIV_I: {
        if (!isAllUncnstr) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (found.isNew) {
          this.addDef(args[0], found.fresh);
          this.addDef(args[1], manager.mkBvNumeral(1n, manager.getBvSize(manager.sorts[args[0]])));
        }
        return found.fresh;
      }
      case OP_SLEQ:
      case OP_ULEQ:
        return this.processBvLe(decl, args, op === OP_SLEQ);
      case OP_CONCAT: {
        if (!isAllUncnstr) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (!found.isNew) return found.fresh;
        let low = 0;
        for (let index = args.length - 1; index >= 0; index--) {
          const width = manager.getBvSize(manager.sorts[args[index]]);
          this.addDef(
            args[index],
            mkBvApp(manager, OP_EXTRACT, [found.fresh], [low + width - 1, low]),
          );
          low += width;
        }
        return found.fresh;
      }
      case OP_EXTRACT: {
        const arg = args[0];
        if (!this.isUncnstr(arg)) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (!found.isNew) return found.fresh;
        const [high, low] = manager.funcDecls[decl].parameters;
        const width = manager.getBvSize(manager.sorts[arg]);
        if (width === high - low + 1) {
          this.addDef(arg, found.fresh);
          return found.fresh;
        }
        const parts = [
          ...(high < width - 1 ? [this.pin(manager.mkBvNumeral(0n, width - high - 1))] : []),
          found.fresh,
          ...(low > 0 ? [this.pin(manager.mkBvNumeral(0n, low))] : []),
        ];
        this.addDef(arg, mkBvApp(manager, OP_CONCAT, parts));
        return found.fresh;
      }
      case OP_BNOT: {
        if (!this.isUncnstr(args[0])) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (found.isNew) this.addDef(args[0], manager.mkApp(decl, [found.fresh], sort));
        return found.fresh;
      }
      case OP_BOR: {
        if (!isAllUncnstr) return -1;
        const found = this.mkFreshFor(decl, args, sort);
        if (found.isNew)
          this.addDefs(
            args,
            found.fresh,
            this.pin(manager.mkBvNumeral(0n, manager.getBvSize(sort))),
          );
        return found.fresh;
      }
      default:
        return -1;
    }
  }

  private processArray(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (op === OP_SELECT && this.isUncnstr(args[0])) {
      const found = this.mkFreshFor(decl, args, sort);
      if (found.isNew)
        this.addDef(
          args[0],
          mkArrayApp(manager, OP_CONST_ARRAY, [found.fresh], [manager.sorts[args[0]]]),
        );
      return found.fresh;
    }
    if (op !== OP_STORE || !this.isUncnstr(args[0]) || !this.isUncnstr(args[args.length - 1]))
      return -1;
    const found = this.mkFreshFor(decl, args, sort);
    if (found.isNew) {
      this.addDef(args[args.length - 1], mkArrayApp(manager, OP_SELECT, args.slice(0, -1)));
      this.addDef(args[0], found.fresh);
    }
    return found.fresh;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (args.length === 0 || !args.every((arg) => manager.isGround(arg))) return -1;
    const info = manager.funcDecls[decl];
    const result =
      info.family === FAMILY_BASIC
        ? this.processBasic(decl, args, sort)
        : info.family === FAMILY_ARITH
          ? this.processArith(decl, args, sort)
          : info.family === FAMILY_BV
            ? this.processBv(decl, args, sort)
            : info.family === FAMILY_ARRAY
              ? this.processArray(decl, args, sort)
              : -1;
    if (info.family === FAMILY_DATATYPE && info.op === OP_DT_ACCESSOR && this.isUncnstr(args[0]))
      throw new SmtUnsupportedError("eliminating an unconstrained datatype constant");
    if (result !== -1) manager.incRef(result);
    return result;
  }
}

export const elimUncnstr = (manager: AstManager, goal: Goal, bodies: RefVector) => {
  bodies.reset();
  const vars = collectUnconstrained(manager, goal);
  const disabled = disableQuantified(manager, goal, bodies);
  if (vars.size === 0) return;
  const rewriter = new UncnstrRewriter(manager, goal.isProofsEnabled);
  rewriter.vars = vars;
  rewriter.disabled = disabled;
  let isModified = true;
  let size = goal.forms.size;
  let start = 0;
  for (;;) {
    for (let index = start; index < size; index++) {
      const form = goal.forms.items[index];
      const rewritten = rewriter.rewrite(form);
      if (rewritten !== form) {
        isModified = true;
        goal.update(index, rewritten);
      }
      manager.decRef(rewritten);
    }
    if (!isModified) break;
    isModified = false;
    size = goal.forms.size;
    rewriter.reset();
    bodies.reset();
    rewriter.disabled = disableQuantified(manager, goal, bodies);
    rewriter.vars = collectUnconstrained(manager, goal);
    start = rewriter.vars.size === 0 ? size : 0;
  }
  goal.addDefinitions(rewriter.entries);
  rewriter.release();
  rewriter.terms.reset();
  goal.depth++;
};
