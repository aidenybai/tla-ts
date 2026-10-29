// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
// A hash-consed DAG of applications, de Bruijn variables and quantifiers, as in Z3's ast_manager.
import { SmtUnsupportedError } from "../errors";

export const KIND_APP = 0;
export const KIND_VAR = 1;
export const KIND_QUANTIFIER = 2;

export const SORT_BOOL = 0;
export const SORT_INT = 1;

export const FAMILY_BASIC = 0;
export const FAMILY_ARITH = 1;
export const FAMILY_USER = 2;

export const OP_TRUE = 0;
export const OP_FALSE = 1;
export const OP_EQ = 2;
export const OP_DISTINCT = 3;
export const OP_ITE = 4;
export const OP_AND = 5;
export const OP_OR = 6;
export const OP_XOR = 7;
export const OP_NOT = 8;
export const OP_IMPLIES = 9;
export const OP_NUM = 10;
export const OP_LE = 11;
export const OP_GE = 12;
export const OP_LT = 13;
export const OP_GT = 14;
export const OP_ADD = 15;
export const OP_SUB = 16;
export const OP_UMINUS = 17;
export const OP_MUL = 18;
export const OP_IDIV = 19;
export const OP_MOD = 20;
export const OP_ABS = 21;
export const OP_UNINTERPRETED = 22;

export interface FuncDecl {
  name: string;
  family: number;
  op: number;
  domain: number[];
  range: number;
  isSkolem: boolean;
}

export interface QuantifierData {
  isForall: boolean;
  sorts: number[];
  body: number;
  patterns: number[][];
  weight: number;
  qid: string;
}

const BUILTIN_DECLS: [string, number, number, number][] = [
  ["true", FAMILY_BASIC, OP_TRUE, SORT_BOOL],
  ["false", FAMILY_BASIC, OP_FALSE, SORT_BOOL],
  ["=", FAMILY_BASIC, OP_EQ, SORT_BOOL],
  ["distinct", FAMILY_BASIC, OP_DISTINCT, SORT_BOOL],
  ["ite", FAMILY_BASIC, OP_ITE, -1],
  ["and", FAMILY_BASIC, OP_AND, SORT_BOOL],
  ["or", FAMILY_BASIC, OP_OR, SORT_BOOL],
  ["xor", FAMILY_BASIC, OP_XOR, SORT_BOOL],
  ["not", FAMILY_BASIC, OP_NOT, SORT_BOOL],
  ["=>", FAMILY_BASIC, OP_IMPLIES, SORT_BOOL],
  ["num", FAMILY_ARITH, OP_NUM, SORT_INT],
  ["<=", FAMILY_ARITH, OP_LE, SORT_BOOL],
  [">=", FAMILY_ARITH, OP_GE, SORT_BOOL],
  ["<", FAMILY_ARITH, OP_LT, SORT_BOOL],
  [">", FAMILY_ARITH, OP_GT, SORT_BOOL],
  ["+", FAMILY_ARITH, OP_ADD, SORT_INT],
  ["-", FAMILY_ARITH, OP_SUB, SORT_INT],
  ["-", FAMILY_ARITH, OP_UMINUS, SORT_INT],
  ["*", FAMILY_ARITH, OP_MUL, SORT_INT],
  ["div", FAMILY_ARITH, OP_IDIV, SORT_INT],
  ["mod", FAMILY_ARITH, OP_MOD, SORT_INT],
  ["abs", FAMILY_ARITH, OP_ABS, SORT_INT],
];

export class AstManager {
  kinds: number[] = [];
  // The declaration of an application, the index of a variable, or the value of a numeral.
  decls: number[] = [];
  args: number[][] = [];
  sorts: number[] = [];
  values: number[] = [];
  // One more than the largest free de Bruijn index, so 0 means the expression is ground.
  freeVarBounds: number[] = [];
  hasQuantifierFlags: boolean[] = [];
  depths: number[] = [];
  quantifiers = new Map<number, QuantifierData>();
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int"];
  private table = new Map<string, number>();
  private appTable = new Map<number, number[]>();
  private freshCounter = 0;
  readonly trueExpr: number;
  readonly falseExpr: number;

  constructor() {
    for (const builtin of BUILTIN_DECLS)
      this.funcDecls.push({
        name: builtin[0],
        family: builtin[1],
        op: builtin[2],
        domain: [],
        range: builtin[3],
        isSkolem: false,
      });
    this.trueExpr = this.mkApp(OP_TRUE, [], SORT_BOOL);
    this.falseExpr = this.mkApp(OP_FALSE, [], SORT_BOOL);
  }

  mkSort(name: string) {
    this.sortNames.push(name);
    return this.sortNames.length - 1;
  }

  mkFuncDecl(name: string, domain: number[], range: number, isSkolem = false) {
    this.funcDecls.push({
      name,
      family: FAMILY_USER,
      op: OP_UNINTERPRETED,
      domain,
      range,
      isSkolem,
    });
    return this.funcDecls.length - 1;
  }

  mkFreshFuncDecl(prefix: string, domain: number[], range: number, isSkolem: boolean) {
    this.freshCounter++;
    return this.mkFuncDecl(`${prefix}!${this.freshCounter}`, domain, range, isSkolem);
  }

  private intern(
    key: string,
    kind: number,
    decl: number,
    args: number[],
    sort: number,
    value: number,
  ) {
    const existing = this.table.get(key);
    if (existing !== undefined) return existing;
    const id = this.create(kind, decl, args, sort, value);
    this.table.set(key, id);
    return id;
  }

  private create(kind: number, decl: number, args: number[], sort: number, value: number) {
    const id = this.kinds.length;
    this.kinds.push(kind);
    this.decls.push(decl);
    this.args.push(args);
    this.sorts.push(sort);
    this.values.push(value);
    let freeVarBound = kind === KIND_VAR ? value + 1 : 0;
    let hasQuantifier = kind === KIND_QUANTIFIER;
    let depth = 1;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (this.freeVarBounds[arg] > freeVarBound) freeVarBound = this.freeVarBounds[arg];
      if (this.hasQuantifierFlags[arg]) hasQuantifier = true;
      if (this.depths[arg] + 1 > depth) depth = this.depths[arg] + 1;
    }
    this.freeVarBounds.push(freeVarBound);
    this.hasQuantifierFlags.push(hasQuantifier);
    this.depths.push(depth);
    return id;
  }

  // The op of a builtin declaration doubles as its index in funcDecls.
  mkApp(decl: number, args: number[], sort: number) {
    let hash = decl;
    for (let index = 0; index < args.length; index++)
      hash = (Math.imul(hash, 0x9e3779b1) + args[index]) | 0;
    const bucket = this.appTable.get(hash);
    if (bucket !== undefined)
      for (const candidate of bucket) {
        if (this.decls[candidate] !== decl || this.kinds[candidate] !== KIND_APP) continue;
        const candidateArgs = this.args[candidate];
        if (candidateArgs.length !== args.length) continue;
        let isSame = true;
        for (let index = 0; index < args.length && isSame; index++)
          isSame = candidateArgs[index] === args[index];
        if (isSame) return candidate;
      }
    const id = this.create(KIND_APP, decl, args, sort, 0);
    if (bucket === undefined) this.appTable.set(hash, [id]);
    else bucket.push(id);
    return id;
  }

  mkNumeral(value: number) {
    if (!Number.isSafeInteger(value))
      throw new SmtUnsupportedError(`the numeral ${value} is too large`);
    return this.intern(`n${value}`, KIND_APP, OP_NUM, [], SORT_INT, value);
  }

  mkVar(index: number, sort: number) {
    return this.intern(`v${index}:${sort}`, KIND_VAR, -1, [], sort, index);
  }

  mkQuantifier(data: QuantifierData) {
    const key = `q${data.isForall ? 1 : 0}:${data.sorts.join(",")}:${data.body}:${data.patterns
      .map((pattern) => pattern.join(","))
      .join(";")}:${data.weight}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return existing;
    const id = this.intern(key, KIND_QUANTIFIER, -1, [data.body], SORT_BOOL, 0);
    const bodyBound = this.freeVarBounds[data.body];
    this.freeVarBounds[id] = Math.max(0, bodyBound - data.sorts.length);
    this.quantifiers.set(id, data);
    return id;
  }

  getQuantifier(expr: number) {
    const data = this.quantifiers.get(expr);
    if (data === undefined) throw new SmtUnsupportedError("expected a quantifier");
    return data;
  }

  isApp(expr: number) {
    return this.kinds[expr] === KIND_APP;
  }

  isVar(expr: number) {
    return this.kinds[expr] === KIND_VAR;
  }

  isQuantifier(expr: number) {
    return this.kinds[expr] === KIND_QUANTIFIER;
  }

  isGround(expr: number) {
    return this.freeVarBounds[expr] === 0;
  }

  getOp(expr: number) {
    return this.kinds[expr] === KIND_APP ? this.funcDecls[this.decls[expr]].op : -1;
  }

  getFamily(expr: number) {
    return this.kinds[expr] === KIND_APP ? this.funcDecls[this.decls[expr]].family : -1;
  }

  isBool(expr: number) {
    return this.sorts[expr] === SORT_BOOL;
  }

  isInt(expr: number) {
    return this.sorts[expr] === SORT_INT;
  }

  isTrue(expr: number) {
    return expr === this.trueExpr;
  }

  isFalse(expr: number) {
    return expr === this.falseExpr;
  }

  isNot(expr: number) {
    return this.getOp(expr) === OP_NOT;
  }

  isComplement(first: number, second: number) {
    return (
      (this.isNot(first) && this.args[first][0] === second) ||
      (this.isNot(second) && this.args[second][0] === first) ||
      (first === this.trueExpr && second === this.falseExpr) ||
      (first === this.falseExpr && second === this.trueExpr)
    );
  }

  isNumeral(expr: number) {
    return this.getOp(expr) === OP_NUM;
  }

  // Unique values are interpreted constants that are distinct from each other, as in Z3.
  isUniqueValue(expr: number) {
    const op = this.getOp(expr);
    return op === OP_NUM || op === OP_TRUE || op === OP_FALSE;
  }

  isUninterpreted(expr: number) {
    return this.getFamily(expr) === FAMILY_USER;
  }

  // An equality between two Boolean expressions, which Z3 calls iff.
  isIff(expr: number) {
    return this.getOp(expr) === OP_EQ && this.sorts[this.args[expr][0]] === SORT_BOOL;
  }

  mkNot(expr: number) {
    if (expr === this.trueExpr) return this.falseExpr;
    if (expr === this.falseExpr) return this.trueExpr;
    return this.mkApp(OP_NOT, [expr], SORT_BOOL);
  }

  mkEq(left: number, right: number) {
    return this.mkApp(OP_EQ, [left, right], SORT_BOOL);
  }

  mkOr(args: number[]) {
    if (args.length === 0) return this.falseExpr;
    if (args.length === 1) return args[0];
    return this.mkApp(OP_OR, args, SORT_BOOL);
  }

  mkAnd(args: number[]) {
    if (args.length === 0) return this.trueExpr;
    if (args.length === 1) return args[0];
    return this.mkApp(OP_AND, args, SORT_BOOL);
  }

  getDeclName(expr: number) {
    return this.funcDecls[this.decls[expr]].name;
  }

  toString(expr: number): string {
    const kind = this.kinds[expr];
    if (kind === KIND_VAR) return `(:var ${this.values[expr]})`;
    if (kind === KIND_QUANTIFIER) {
      const data = this.getQuantifier(expr);
      return `(${data.isForall ? "forall" : "exists"} (${data.sorts.length}) ${this.toString(data.body)})`;
    }
    if (this.getOp(expr) === OP_NUM) return String(this.values[expr]);
    const name = this.getDeclName(expr);
    const args = this.args[expr];
    return args.length === 0
      ? name
      : `(${name} ${args.map((innerArg) => this.toString(innerArg)).join(" ")})`;
  }
}
