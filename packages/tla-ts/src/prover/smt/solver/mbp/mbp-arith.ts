// Ported from Z3 (src/qe/mbp/mbp_arith.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "../ast";
import { getExtendedNumeral, isAppOf, mkNot } from "../ast-util";
import { ExprSafeReplace } from "../expr-safe-replace";
import { ObjMap } from "../hashtable";
import {
  DEF_ADD,
  DEF_CONST,
  DEF_DIV,
  DEF_MUL,
  type MboDef,
  type MboRow,
  type MboVar,
  ModelBasedOpt,
  T_DIV,
  T_DIVIDES,
  T_EQ,
  T_LE,
  T_LT,
  T_MOD,
} from "../model-based-opt";
import { getEuclideanDiv, getEuclideanMod, Rational } from "../rational";
import type { RefVector } from "../ref-vector";
import { markRec, type MbpContext } from "./mbp-plugin";

const isArith = (manager: AstManager, expr: number) =>
  manager.sorts[expr] === SORT_INT || manager.sorts[expr] === SORT_REAL;

const getBinaryArgs = (manager: AstManager, expr: number, op: number) =>
  isAppOf(manager, expr, op) && manager.getNumArgs(expr) === 2
    ? [manager.getArg(expr, 0), manager.getArg(expr, 1)]
    : undefined;

const getNumeral = (manager: AstManager, expr: number) =>
  isAppOf(manager, expr, OP_NUM) ? manager.getRationalValue(expr) : undefined;

const insertMul = (terms: ObjMap<Rational>, expr: number, value: Rational) =>
  terms.set(expr, (terms.get(expr) ?? Rational.zero).add(value));

interface Constant {
  value: Rational;
}

interface Definition {
  readonly variable: number;
  readonly term: number;
}

export class ArithProjectPlugin {
  private manager: AstManager;
  isCheckPurified = true;
  isApplyProjection = false;

  constructor(private context: MbpContext) {
    this.manager = context.manager;
  }

  private mkNumeral(value: Rational, isInt: boolean) {
    return this.manager.mkNumeralOfSort(value, isInt ? SORT_INT : SORT_REAL);
  }

  private mkBinary(op: number, left: number, right: number) {
    const sort =
      op === OP_ADD || op === OP_MUL || op === OP_IDIV || op === OP_MOD || op === OP_DIV
        ? this.manager.sorts[left]
        : SORT_BOOL;
    return this.manager.mkApp(op, [left, right], sort);
  }

  private mkMul(coeff: Rational, expr: number) {
    const isInt = this.manager.sorts[expr] === SORT_INT;
    return this.mkBinary(OP_MUL, this.mkNumeral(coeff, isInt), expr);
  }

  private mkAdd(terms: number[]) {
    return terms.length === 0
      ? this.manager.mkNumeral(0n)
      : terms.length === 1
        ? terms[0]
        : this.manager.mkApp(OP_ADD, terms, this.manager.sorts[terms[0]]);
  }

  // Extracts the linear inequalities of a literal into mbo. It picks the branches of conditionals
  // by the model, and gives mbo the values of the subterms that it treats as variables.
  private linearizeLit(
    mbo: ModelBasedOpt,
    lit: number,
    fmls: RefVector,
    tids: Map<number, number>,
  ): boolean {
    const context = this.context;
    const manager = this.manager;
    const terms = new ObjMap<Rational>((expr) => manager.hashes[expr]);
    const constant: Constant = { value: Rational.zero };
    let mul = Rational.one;
    let type = T_LE;
    const isNot = manager.isNot(lit);
    const atom = isNot ? manager.getArg(lit, 0) : lit;
    if (isNot) mul = mul.neg();
    const linearizeBoth = (first: number, second: number) => {
      this.linearize(mbo, mul, first, constant, fmls, terms, tids);
      this.linearize(mbo, mul.neg(), second, constant, fmls, terms, tids);
    };
    const op = manager.getOp(atom);
    const binary = manager.getNumArgs(atom) === 2 ? manager.getArgs(atom) : undefined;
    if (binary !== undefined && (op === OP_LE || op === OP_GE)) {
      if (op === OP_LE) linearizeBoth(binary[0], binary[1]);
      else linearizeBoth(binary[1], binary[0]);
      type = isNot ? T_LT : T_LE;
    } else if (binary !== undefined && (op === OP_LT || op === OP_GT)) {
      if (op === OP_LT) linearizeBoth(binary[0], binary[1]);
      else linearizeBoth(binary[1], binary[0]);
      type = isNot ? T_LE : T_LT;
    } else if (op === OP_EQ && !isNot && isArith(manager, manager.getArg(atom, 0))) {
      linearizeBoth(manager.getArg(atom, 0), manager.getArg(atom, 1));
      type = T_EQ;
    } else if (op === OP_EQ && isNot && isArith(manager, manager.getArg(atom, 0))) {
      let first = manager.getArg(atom, 0);
      let second = manager.getArg(atom, 1);
      const value1 = getNumeral(manager, context.eval(first, true));
      const value2 = getNumeral(manager, context.eval(second, true));
      if (value1 === undefined || value2 === undefined) return false;
      if (value1.compare(value2) < 0) [first, second] = [second, first];
      type = T_LT;
      linearizeBoth(first, second);
    } else if (op === OP_DISTINCT && !isNot && isArith(manager, manager.getArg(atom, 0))) {
      const nums: { expr: number; value: Rational }[] = [];
      for (const arg of manager.getArgs(atom)) {
        const value = getNumeral(manager, context.eval(arg, true));
        if (value === undefined) return false;
        nums.push({ expr: arg, value });
      }
      nums.sort((left, right) => left.value.compare(right.value));
      for (let index = 0; index + 1 < nums.length; index++) {
        const less = context.pin(this.mkBinary(OP_LT, nums[index].expr, nums[index + 1].expr));
        if (!this.linearizeLit(mbo, less, fmls, tids)) return false;
      }
      return true;
    } else if (op === OP_DISTINCT && isNot && isArith(manager, manager.getArg(atom, 0))) {
      // Linearizes two arguments that are equal.
      const values: { value: Rational; expr: number }[] = [];
      for (const arg of manager.getArgs(atom)) {
        const value = getNumeral(manager, context.eval(arg, true));
        if (value === undefined) return false;
        const other = values.find((entry) => entry.value.equals(value));
        if (other !== undefined) {
          type = T_EQ;
          linearizeBoth(arg, other.expr);
          break;
        }
        values.push({ value, expr: arg });
      }
    } else if (op === OP_AND && !isNot) {
      for (const arg of manager.getArgs(atom)) fmls.push(arg);
      return true;
    } else if (op === OP_OR && isNot) {
      for (const arg of manager.getArgs(atom)) fmls.push(context.pin(mkNot(manager, arg)));
      return true;
    } else if (op === OP_OR && !isNot) {
      const found = manager.getArgs(atom).find((arg) => context.isTrue(arg, true));
      if (found === undefined) return false;
      fmls.push(found);
      return true;
    } else if (op === OP_AND && isNot) {
      const found = manager.getArgs(atom).find((arg) => context.isFalse(arg, true));
      if (found === undefined) return false;
      fmls.push(context.pin(mkNot(manager, found)));
      return true;
    } else return false;
    mbo.addConstraint(this.extractCoefficients(mbo, terms, tids), constant.value, type);
    return true;
  }

  // Adds a linear arithmetic term to the inequality for mbo.
  private linearize(
    mbo: ModelBasedOpt,
    mul: Rational,
    term: number,
    constant: Constant,
    fmls: RefVector,
    terms: ObjMap<Rational>,
    tids: Map<number, number>,
  ): void {
    const context = this.context;
    const manager = this.manager;
    const recurse = (factor: Rational, arg: number) =>
      this.linearize(mbo, factor, arg, constant, fmls, terms, tids);
    const addDef = (arg: number) => {
      const termsOfArg = new ObjMap<Rational>((expr) => manager.hashes[expr]);
      const argConstant: Constant = { value: Rational.zero };
      this.linearize(mbo, Rational.one, arg, argConstant, fmls, termsOfArg, tids);
      const coeffs = this.extractCoefficients(mbo, termsOfArg, tids);
      insertMul(terms, term, mul);
      return { coeffs, value: argConstant.value };
    };
    const mulArgs = getBinaryArgs(manager, term, OP_MUL);
    const factor0 = mulArgs === undefined ? undefined : getExtendedNumeral(manager, mulArgs[0]);
    const factor1 = mulArgs === undefined ? undefined : getExtendedNumeral(manager, mulArgs[1]);
    const op = manager.getOp(term);
    const divisor =
      (op === OP_MOD || op === OP_IDIV) && manager.getNumArgs(term) === 2
        ? getExtendedNumeral(manager, manager.getArg(term, 1))
        : undefined;
    const numeral = getNumeral(manager, term);
    if (tids.has(term)) insertMul(terms, term, mul);
    else if (mulArgs !== undefined && factor0 !== undefined) recurse(mul.mul(factor0), mulArgs[1]);
    else if (mulArgs !== undefined && factor1 !== undefined) recurse(mul.mul(factor1), mulArgs[0]);
    else if (op === OP_UMINUS && manager.getNumArgs(term) === 1)
      recurse(mul.neg(), manager.getArg(term, 0));
    else if (numeral !== undefined) constant.value = constant.value.add(mul.mul(numeral));
    else if (op === OP_ADD) for (const arg of manager.getArgs(term)) recurse(mul, arg);
    else if (op === OP_SUB && manager.getNumArgs(term) === 2) {
      recurse(mul, manager.getArg(term, 0));
      recurse(mul.neg(), manager.getArg(term, 1));
    } else if (op === OP_ITE) {
      const condition = manager.getArg(term, 0);
      const value = context.eval(condition, true);
      if (manager.isTrue(value)) {
        recurse(mul, manager.getArg(term, 1));
        fmls.push(condition);
      } else if (manager.isFalse(value)) {
        fmls.push(context.pin(mkNot(manager, condition)));
        recurse(mul, manager.getArg(term, 2));
      } else throw new SmtUnsupportedError("mbp evaluation didn't produce a truth value");
    } else if (op === OP_MOD && divisor !== undefined && divisor.isPositive()) {
      // v = t1 mod divisor
      const definition = addDef(manager.getArg(term, 0));
      tids.set(term, mbo.addMod(definition.coeffs, definition.value, divisor));
    } else if (op === OP_IDIV && divisor !== undefined && divisor.isPositive()) {
      // v = t1 div divisor
      const definition = addDef(manager.getArg(term, 0));
      tids.set(term, mbo.addDiv(definition.coeffs, definition.value, divisor));
    } else insertMul(terms, term, mul);
  }

  private extractCoefficients(
    mbo: ModelBasedOpt,
    terms: ObjMap<Rational>,
    tids: Map<number, number>,
  ) {
    const manager = this.manager;
    const coeffs: MboVar[] = [];
    for (const [expr, coeff] of terms) {
      let id = tids.get(expr);
      if (id === undefined) {
        const value = getNumeral(manager, this.context.eval(expr, true));
        if (value === undefined) throw new SmtUnsupportedError("mbp evaluation was only partial");
        id = mbo.addVar(value, manager.sorts[expr] === SORT_INT);
        tids.set(expr, id);
      }
      if (!coeff.isZero()) coeffs.push({ id, coeff });
    }
    return coeffs;
  }

  project1(variable: number, lits: RefVector) {
    const vars = [variable];
    return this.project(vars, lits) && vars.length === 0;
  }

  // Projects the arithmetic variables it can out of the literals, and leaves the others in vars.
  project(vars: number[], fmls: RefVector) {
    const context = this.context;
    const manager = this.manager;
    if (!vars.some((innerVar) => isArith(manager, innerVar))) return true;
    const mbo = new ModelBasedOpt();
    const tids = new Map<number, number>();
    let kept = 0;
    for (let index = 0; index < fmls.size; index++) {
      const formula = fmls.items[index];
      // The linearized formulas hold the terms of tids.
      if (this.linearizeLit(mbo, formula, fmls, tids)) context.pin(formula);
      else fmls.set(kept++, formula);
    }
    fmls.shrink(kept);
    const varMark = new Set(vars);
    for (const innerVar of vars) {
      if (!isArith(manager, innerVar) || tids.has(innerVar)) continue;
      const value = getNumeral(manager, context.eval(innerVar, true));
      if (value === undefined)
        throw new SmtUnsupportedError("evaluation did not produce a numeral");
      tids.set(innerVar, mbo.addVar(value, manager.sorts[innerVar] === SORT_INT));
    }
    // Variables in non-linear subterms stay.
    const isPure = (expr: number) => {
      const op = manager.getOp(expr);
      if (op === OP_MOD && manager.getNumArgs(expr) === 2)
        return manager.isNumeral(manager.getArg(expr, 1));
      if (op === OP_IDIV && manager.getNumArgs(expr) === 2)
        return getNumeral(manager, manager.getArg(expr, 1))?.isPositive() === true;
      return false;
    };
    const fmlsMark = new Set<number>();
    for (const expr of tids.keys())
      if (isArith(manager, expr) && !isPure(expr) && !varMark.has(expr))
        markRec(manager, fmlsMark, expr);
    if (this.isCheckPurified) {
      for (const formula of fmls.items) markRec(manager, fmlsMark, formula);
      for (const expr of tids.keys())
        if (!varMark.has(expr) && !isPure(expr)) markRec(manager, fmlsMark, expr);
    }
    const index2Expr: number[] = [];
    for (const [expr, id] of tids) index2Expr[id] = expr;
    const realVars: number[] = [];
    let keptVars = 0;
    for (const innerVar of vars) {
      if (isArith(manager, innerVar) && !fmlsMark.has(innerVar))
        realVars.push(tids.get(innerVar) as number);
      else vars[keptVars++] = innerVar;
    }
    vars.length = keptVars;
    const defs = mbo.project(realVars, this.isApplyProjection);
    const rows = mbo.getLiveRows();
    const defVars = new Map<number, MboRow>();
    for (const row of rows) if (row.type === T_MOD || row.type === T_DIV) defVars.set(row.id, row);
    this.rows2Fmls(defVars, rows, index2Expr, fmls);
    if (!this.isApplyProjection) return true;
    const definitions = defs.map((def, index) => {
      if (def === null) throw new SmtInvariantError("mbo computes a definition for each variable");
      const variable = index2Expr[realVars[index]];
      const isInt = manager.sorts[variable] === SORT_INT;
      return { variable, term: context.pin(this.fromDef(defVars, def, isInt, index2Expr)) };
    });
    return this.applyProjection(definitions, fmls);
  }

  private fromDef(
    defVars: Map<number, MboRow>,
    def: MboDef,
    isInt: boolean,
    index2Expr: number[],
  ): number {
    if (def.kind === DEF_ADD || def.kind === DEF_MUL)
      return this.mkBinary(
        def.kind === DEF_ADD ? OP_ADD : OP_MUL,
        this.fromDef(defVars, def.x, isInt, index2Expr),
        this.fromDef(defVars, def.y, isInt, index2Expr),
      );
    if (def.kind === DEF_CONST) return this.mkNumeral(def.value, isInt);
    if (def.kind === DEF_DIV)
      return this.mkBinary(
        isInt ? OP_IDIV : OP_DIV,
        this.fromDef(defVars, def.x, isInt, index2Expr),
        this.mkNumeral(def.div, isInt),
      );
    const term = this.id2Expr(defVars, index2Expr, def.v.id);
    return def.v.coeff.equals(Rational.one)
      ? term
      : this.mkBinary(OP_MUL, this.mkNumeral(def.v.coeff, isInt), term);
  }

  // apply_projection: substitutes the definitions into the formulas, and fails on a formula the
  // model falsifies.
  private applyProjection(definitions: Definition[], fmls: RefVector) {
    const context = this.context;
    if (fmls.size === 0 || definitions.length === 0) return true;
    const subst = new ExprSafeReplace(this.manager);
    for (let index = definitions.length; index-- > 0;) {
      const term = subst.apply(definitions[index].term);
      context.pinned.pushOwned(term);
      subst.insert(definitions[index].variable, term);
    }
    for (let index = 0; index < fmls.size; index++) {
      const replaced = subst.apply(fmls.items[index]);
      context.pinned.pushOwned(replaced);
      if (context.isFalse(replaced, true)) {
        subst.release();
        return false;
      }
      fmls.set(index, replaced);
    }
    subst.release();
    return true;
  }

  private id2Expr(defVars: Map<number, MboRow>, index2Expr: number[], id: number): number {
    const row = defVars.get(id);
    return row === undefined ? index2Expr[id] : this.row2Expr(defVars, index2Expr, row);
  }

  private row2Expr(defVars: Map<number, MboRow>, index2Expr: number[], row: MboRow) {
    const manager = this.manager;
    const terms: number[] = [];
    for (const innerVar of row.vars) {
      const expr = this.id2Expr(defVars, index2Expr, innerVar.id);
      const value = getNumeral(manager, expr);
      if (value?.isZero()) continue;
      const isInt = manager.sorts[expr] === SORT_INT;
      terms.push(
        value !== undefined
          ? this.mkNumeral(innerVar.coeff.mul(value), isInt)
          : innerVar.coeff.equals(Rational.one)
            ? expr
            : this.mkMul(innerVar.coeff, expr),
      );
    }
    const mkInt = (value: bigint) => manager.mkNumeral(value);
    if (row.type === T_MOD || row.type === T_DIV) {
      const isMod = row.type === T_MOD;
      if (terms.length === 0)
        return mkInt(
          isMod
            ? getEuclideanMod(row.coeff.num, row.mod.num)
            : getEuclideanDiv(row.coeff.num, row.mod.num),
        );
      if (!row.coeff.isZero()) terms.push(mkInt(row.coeff.num));
      return this.mkBinary(isMod ? OP_MOD : OP_IDIV, this.mkAdd(terms), mkInt(row.mod.num));
    }
    if (row.type === T_DIVIDES) {
      terms.push(mkInt(row.coeff.num));
      return this.mkAdd(terms);
    }
    return this.mkAdd(terms);
  }

  private rows2Fmls(
    defVars: Map<number, MboRow>,
    rows: MboRow[],
    index2Expr: number[],
    fmls: RefVector,
  ) {
    const context = this.context;
    const manager = this.manager;
    for (const row of rows) {
      if (row.vars.length === 0 || row.type === T_MOD || row.type === T_DIV) continue;
      const single = row.vars[0];
      if (
        row.vars.length === 1 &&
        single.coeff.isNegative() &&
        (row.type === T_EQ || row.type === T_LE || row.type === T_LT)
      ) {
        let term = this.id2Expr(defVars, index2Expr, single.id);
        const isInt = manager.sorts[term] === SORT_INT;
        if (!single.coeff.equals(Rational.minusOne)) term = this.mkMul(single.coeff.neg(), term);
        const bound = this.mkNumeral(row.coeff, isInt);
        const op = row.type === T_LT ? OP_GT : row.type === T_LE ? OP_GE : OP_EQ;
        fmls.push(context.pin(this.mkBinary(op, term, bound)));
        continue;
      }
      const term = this.row2Expr(defVars, index2Expr, row);
      const bound = this.mkNumeral(
        row.coeff.neg(),
        row.coeff.isInt() && manager.sorts[term] === SORT_INT,
      );
      if (row.type === T_DIVIDES) {
        const remainder = this.mkBinary(OP_MOD, term, manager.mkNumeral(row.mod.num));
        fmls.push(context.pin(manager.mkEq(remainder, manager.mkNumeral(0n))));
        continue;
      }
      const op = row.type === T_LT ? OP_LT : row.type === T_LE ? OP_LE : OP_EQ;
      fmls.push(context.pin(this.mkBinary(op, term, bound)));
    }
  }
}
