// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
// A hash-consed DAG of applications, de Bruijn variables and quantifiers, as in Z3's ast_manager.
import { SmtUnsupportedError } from "../../../errors";
import { astArrayHash, combineHash, getCompositeHash, mkMix, stringHash } from "./hash";
import type { ResourceLimit } from "./rlimit";

export const KIND_APP = 0;
export const KIND_VAR = 1;
export const KIND_QUANTIFIER = 2;

export const SORT_BOOL = 0;
export const SORT_INT = 1;

export const FAMILY_BASIC = 0;
export const FAMILY_ARITH = 1;
export const FAMILY_USER = 2;
// Model values: the elements that a model gives to an uninterpreted sort.
export const FAMILY_MODEL_VALUE = 3;

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
export const OP_PATTERN = 22;
export const OP_UNINTERPRETED = 23;
export const OP_MODEL_VALUE = 24;

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
  // Applications of the pattern declaration to the terms of each multi-pattern.
  patterns: number[];
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
  ["pattern", FAMILY_BASIC, OP_PATTERN, SORT_BOOL],
];

// Z3's family ids and decl kinds, which its AST hashes include.
const Z3_BASIC_FAMILY = 0;
const Z3_PATTERN_FAMILY = 2;
const Z3_MODEL_VALUE_FAMILY = 3;
const Z3_USER_SORT_FAMILY = 4;
const Z3_ARITH_FAMILY = 5;
const Z3_NULL = 0xffffffff;
// The name, Z3 decl kind and arity of each builtin, whose Z3 declaration has this many arguments
// whatever the number of arguments of the application (-1 for the arguments' own number).
const Z3_BUILTINS = new Map<number, [string, number, number]>([
  [OP_TRUE, ["true", 0, 0]],
  [OP_FALSE, ["false", 1, 0]],
  [OP_EQ, ["=", 2, 2]],
  [OP_DISTINCT, ["distinct", 3, -1]],
  [OP_ITE, ["if", 4, 3]],
  [OP_AND, ["and", 5, 2]],
  [OP_OR, ["or", 6, 2]],
  [OP_XOR, ["xor", 7, 2]],
  [OP_NOT, ["not", 8, 1]],
  [OP_IMPLIES, ["=>", 9, 2]],
  [OP_LE, ["<=", 2, 2]],
  [OP_GE, [">=", 3, 2]],
  [OP_LT, ["<", 4, 2]],
  [OP_GT, [">", 5, 2]],
  [OP_ADD, ["+", 6, 2]],
  [OP_SUB, ["-", 7, 2]],
  [OP_UMINUS, ["-", 8, 1]],
  [OP_MUL, ["*", 9, 2]],
  [OP_IDIV, ["div", 11, 2]],
  [OP_MOD, ["mod", 16, 2]],
  [OP_ABS, ["abs", 21, 1]],
  [OP_PATTERN, ["pattern", 0, -1]],
]);

// The ids of Z3's own expressions when it starts: the undef proof, true and false, then pi, euler, a
// bit-vector numeral, fifteen real variables and a sum of two of them, which no problem shares.
const FIRST_FREE_ID = 22;

// symbol::hash, for string symbols.
const getSymbolHash = (name: string) => stringHash(name, 17);

// decl_info::hash.
const getInfoHash = (family: number, kind: number, parameterHashes: number[]) =>
  mkMix(family, kind, parameterHashes.length === 0 ? 0 : getCompositeHash(parameterHashes));

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
  // Z3's hash of each expression, which orders Z3's hash tables.
  hashes: number[] = [];
  quantifiers = new Map<number, QuantifierData>();
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int"];
  private sortHashes = [
    combineHash(getSymbolHash("Bool"), getInfoHash(Z3_BASIC_FAMILY, 0, [])),
    combineHash(getSymbolHash("Int"), getInfoHash(Z3_ARITH_FAMILY, 1, [])),
  ];
  // The hash of each uninterpreted declaration, and of each builtin by its Z3 declaration.
  private declHashes: number[] = [];
  private builtinHashes = new Map<string, number>();
  private table = new Map<string, number>();
  private appTable = new Map<number, number[]>();
  private freshCounter = 0;
  // Z3's id of each expression, which orders Z3's sorts. Like Z3, the manager counts references and
  // gives the id of a deleted expression to the next expression it creates, so its ids follow
  // Z3's. A deleted expression stays in the tables with the id -1 until it is created again.
  ids: number[] = [];
  private refCounts: number[] = [];
  private freeIds: number[] = [];
  private nextId = 1;
  private numLive = 0;
  // The expressions created since the innermost withTemporaries began, which it holds like the
  // expr_ref temporaries of a Z3 function.
  private temporaries: number[] | null = null;
  readonly trueExpr: number;
  readonly falseExpr: number;

  constructor(readonly limit: ResourceLimit) {
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
    this.incRef(this.trueExpr);
    this.incRef(this.falseExpr);
    this.nextId = FIRST_FREE_ID;
  }

  getRefCount(expr: number) {
    return this.refCounts[expr];
  }

  // get_num_asts: the live expressions, declarations and sorts.
  getNumAsts() {
    return this.numLive + this.funcDecls.length + this.sortNames.length;
  }

  incRef(expr: number) {
    this.refCounts[expr]++;
  }

  // Runs body, holding each expression it creates until it returns, then releases them, the last
  // created first. The caller gets a reference to each expression that getKept picks from the
  // result, by default the result itself, and releases it.
  withTemporaries<T>(
    body: () => T,
    getKept: (result: T) => number[] = (result) => [result as number],
  ) {
    const outer = this.temporaries;
    const temporaries: number[] = [];
    this.temporaries = temporaries;
    const result = body();
    this.temporaries = outer;
    for (const kept of getKept(result)) this.incRef(kept);
    for (let index = temporaries.length - 1; index >= 0; index--) this.decRef(temporaries[index]);
    return result;
  }

  // Runs body without temporaries, for code whose references are counted explicitly.
  withoutTemporaries<T>(body: () => T) {
    const outer = this.temporaries;
    this.temporaries = null;
    const result = body();
    this.temporaries = outer;
    return result;
  }

  // Hands a reference the caller owns to the innermost withTemporaries, or releases it now.
  releaseLater(expr: number) {
    if (this.temporaries === null) this.decRef(expr);
    else this.temporaries.push(expr);
  }

  // dec_ref and delete_node: an expression without references is deleted, and so are its children
  // that lose their last reference, in the order of Z3's worklist.
  decRef(expr: number) {
    if (this.ids[expr] === -1) return;
    this.refCounts[expr]--;
    if (this.refCounts[expr] > 0) return;
    const worklist = [expr];
    while (worklist.length > 0) {
      const node = worklist.pop() as number;
      this.deleteNode(node);
      for (const child of this.getChildren(node)) {
        this.refCounts[child]--;
        if (this.refCounts[child] === 0) worklist.push(child);
      }
    }
  }

  private deleteNode(expr: number) {
    this.numLive--;
    this.freeIds.push(this.ids[expr]);
    this.ids[expr] = -1;
  }

  // register_node_core: a new expression takes an id and a reference to each child.
  private registerNode(expr: number) {
    this.ids[expr] = this.freeIds.length > 0 ? (this.freeIds.pop() as number) : this.nextId++;
    this.numLive++;
    this.refCounts[expr] = 0;
    for (const child of this.getChildren(expr)) this.incRef(this.revive(child));
    if (this.temporaries === null) return;
    this.incRef(expr);
    this.temporaries.push(expr);
  }

  // The children whose references an expression holds: the arguments of an application, and the
  // body and then the patterns of a quantifier.
  private getChildren(expr: number) {
    const data = this.quantifiers.get(expr);
    return data === undefined ? this.args[expr] : [data.body, ...data.patterns];
  }

  // A lookup that finds a deleted expression creates it again.
  private revive(expr: number) {
    if (this.ids[expr] === -1) this.registerNode(expr);
    return expr;
  }

  mkSort(name: string) {
    this.sortHashes.push(
      combineHash(
        getSymbolHash(name),
        getInfoHash(Z3_USER_SORT_FAMILY, this.sortNames.length - 2, []),
      ),
    );
    this.sortNames.push(name);
    return this.sortNames.length - 1;
  }

  // The hash of a func_decl node: its name, range, info and domain.
  private getFuncDeclHash(name: string, domain: number[], range: number, infoHash: number) {
    return astArrayHash(
      domain.map((sort) => this.sortHashes[sort]),
      combineHash(combineHash(getSymbolHash(name), this.sortHashes[range]), infoHash),
    );
  }

  // The name, Z3 decl kind and domain of the Z3 declaration of a builtin application.
  getBuiltinSignature(op: number, args: number[]) {
    const builtin = Z3_BUILTINS.get(op);
    if (builtin === undefined) throw new Error(`the operator ${op} has no Z3 declaration`);
    const argSort = op === OP_ITE ? this.sorts[args[1]] : this.sorts[args[0]];
    const arity = builtin[2] === -1 ? args.length : builtin[2];
    const domain = Array.from({ length: arity }, (_, index) =>
      op === OP_PATTERN
        ? this.sorts[args[index]]
        : op === OP_ITE && index === 0
          ? SORT_BOOL
          : argSort,
    );
    return { name: builtin[0], kind: builtin[1], domain };
  }

  private getBuiltinHash(op: number, args: number[], range: number) {
    const signature = this.getBuiltinSignature(op, args);
    const key = `${op}:${signature.domain.join(",")}:${range}`;
    const existing = this.builtinHashes.get(key);
    if (existing !== undefined) return existing;
    const family =
      op === OP_PATTERN ? Z3_PATTERN_FAMILY : op < OP_NUM ? Z3_BASIC_FAMILY : Z3_ARITH_FAMILY;
    const hash = this.getFuncDeclHash(
      signature.name,
      signature.domain,
      range,
      getInfoHash(family, signature.kind, []),
    );
    this.builtinHashes.set(key, hash);
    return hash;
  }

  mkFuncDecl(name: string, domain: number[], range: number, isSkolem = false) {
    this.declHashes[this.funcDecls.length] = this.getFuncDeclHash(
      name,
      domain,
      range,
      isSkolem ? getInfoHash(Z3_NULL, Z3_NULL, []) : 0,
    );
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
    getHash: () => number,
  ) {
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    const id = this.create(kind, decl, args, sort, value, getHash());
    this.table.set(key, id);
    this.registerNode(id);
    return id;
  }

  private create(
    kind: number,
    decl: number,
    args: number[],
    sort: number,
    value: number,
    hash: number,
  ) {
    const id = this.kinds.length;
    this.hashes.push(hash);
    this.kinds.push(kind);
    this.decls.push(decl);
    // Like Z3, a node keeps its own copy of the arguments, so callers may reuse their arrays.
    this.args.push([...args]);
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
    // Numerals and model values carry their value, so only mkNumeral and mkModelValue create them.
    if (decl === OP_NUM || this.funcDecls[decl].family === FAMILY_MODEL_VALUE)
      throw new Error(`${this.funcDecls[decl].name} needs a value`);
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
        if (isSame) return this.revive(candidate);
      }
    const declHash =
      this.funcDecls[decl].family === FAMILY_USER
        ? this.declHashes[decl]
        : this.getBuiltinHash(this.funcDecls[decl].op, args, sort);
    const id = this.create(
      KIND_APP,
      decl,
      args,
      sort,
      0,
      astArrayHash(
        args.map((arg) => this.hashes[arg]),
        declHash,
      ),
    );
    if (bucket === undefined) this.appTable.set(hash, [id]);
    else bucket.push(id);
    this.registerNode(id);
    return id;
  }

  mkNumeral(value: number) {
    if (!Number.isSafeInteger(value))
      throw new SmtUnsupportedError(`the numeral ${value} is too large`);
    // The Int numeral declaration has the parameters (value, is_int), and a rational hashes as
    // |numerator| + 3 |denominator|.
    return this.intern(`n${value}`, KIND_APP, OP_NUM, [], SORT_INT, value === 0 ? 0 : value, () =>
      this.getFuncDeclHash(
        "Int",
        [],
        SORT_INT,
        getInfoHash(Z3_ARITH_FAMILY, 0, [(Math.abs(value) + 3) >>> 0, 1]),
      ),
    );
  }

  // mk_model_value: the element with this index in the universe of an uninterpreted sort.
  mkModelValue(index: number, sort: number) {
    const key = `m${sort}:${index}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    this.funcDecls.push({
      name: `${this.sortNames[sort]}!val!${index}`,
      family: FAMILY_MODEL_VALUE,
      op: OP_MODEL_VALUE,
      domain: [],
      range: sort,
      isSkolem: false,
    });
    const sortHash = this.sortHashes[sort];
    return this.intern(key, KIND_APP, this.funcDecls.length - 1, [], sort, index, () =>
      this.getFuncDeclHash(
        this.funcDecls[this.funcDecls.length - 1].name,
        [],
        sort,
        getInfoHash(Z3_MODEL_VALUE_FAMILY, 0, [index, sortHash]),
      ),
    );
  }

  mkFreshConst(prefix: string, sort: number) {
    return this.mkApp(this.mkFreshFuncDecl(prefix, [], sort, false), [], sort);
  }

  mkVar(index: number, sort: number) {
    return this.intern(`v${index}:${sort}`, KIND_VAR, -1, [], sort, index, () =>
      combineHash(index, this.sortHashes[sort]),
    );
  }

  mkQuantifier(data: QuantifierData) {
    const key = `q${data.isForall ? 1 : 0}:${data.sorts.join(",")}:${data.body}:${data.patterns.join(
      ",",
    )}:${data.weight}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    const id = this.create(
      KIND_QUANTIFIER,
      -1,
      [data.body],
      SORT_BOOL,
      0,
      mkMix(
        astArrayHash(
          data.sorts.map((sort) => this.sortHashes[sort]),
          data.isForall ? 31 : 19,
        ),
        data.patterns.length,
        this.hashes[data.body],
      ),
    );
    this.table.set(key, id);
    const bodyBound = this.freeVarBounds[data.body];
    this.freeVarBounds[id] = Math.max(0, bodyBound - data.sorts.length);
    this.quantifiers.set(id, { ...data, sorts: [...data.sorts], patterns: [...data.patterns] });
    this.registerNode(id);
    return id;
  }

  // mk_pattern: a multi-pattern of a quantifier.
  mkPattern(terms: number[]) {
    return this.mkApp(OP_PATTERN, terms, SORT_BOOL);
  }

  getQuantifier(expr: number) {
    const data = this.quantifiers.get(expr);
    if (data === undefined) throw new Error("the expression is not a quantifier");
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

  // Z3's is_ground: an application without variables or quantifiers.
  isGroundApp(expr: number) {
    return (
      this.kinds[expr] === KIND_APP &&
      this.freeVarBounds[expr] === 0 &&
      !this.hasQuantifierFlags[expr]
    );
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

  getNumeral(expr: number) {
    return this.isNumeral(expr) ? this.values[expr] : undefined;
  }

  // Unique values are interpreted constants that are distinct from each other, as in Z3.
  isUniqueValue(expr: number) {
    const op = this.getOp(expr);
    return op === OP_NUM || op === OP_TRUE || op === OP_FALSE || op === OP_MODEL_VALUE;
  }

  isModelValue(expr: number) {
    return this.getOp(expr) === OP_MODEL_VALUE;
  }

  isUninterpretedSort(sort: number) {
    return sort > SORT_INT;
  }

  // An uninterpreted constant, such as a declared constant or a Skolem constant.
  isUninterpretedConst(expr: number) {
    return this.isUninterpreted(expr) && this.args[expr].length === 0;
  }

  isUninterpreted(expr: number) {
    return this.getFamily(expr) === FAMILY_USER;
  }

  // An equality between two Boolean expressions, which Z3 calls iff.
  isIff(expr: number) {
    return this.getOp(expr) === OP_EQ && this.sorts[this.args[expr][0]] === SORT_BOOL;
  }

  // arith_util::is_times_minus_one: the t of (* -1 t).
  getTimesMinusOneArg(expr: number) {
    if (this.getOp(expr) !== OP_MUL || this.args[expr].length !== 2) return undefined;
    const coefficient = this.args[expr][0];
    return this.isNumeral(coefficient) && this.values[coefficient] === -1
      ? this.args[expr][1]
      : undefined;
  }

  // occurs: decl is applied somewhere in expr.
  isOccurring(decl: number, expr: number) {
    return this.someSubterm(expr, (current) => this.decls[current] === decl);
  }

  containsModelValue(expr: number) {
    return this.someSubterm(expr, (current) => this.isModelValue(current));
  }

  private someSubterm(expr: number, predicate: (expr: number) => boolean) {
    const visited = new Set<number>();
    const visit = (current: number): boolean => {
      if (visited.has(current)) return false;
      visited.add(current);
      const kind = this.kinds[current];
      if (kind === KIND_VAR) return false;
      if (kind === KIND_QUANTIFIER) return visit(this.getQuantifier(current).body);
      return predicate(current) || this.args[current].some((arg) => visit(arg));
    };
    return visit(expr);
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
