// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
// A hash-consed DAG of applications, de Bruijn variables and quantifiers, as in Z3's ast_manager.
import { astArrayHash, bytesHash, combineHash, getCompositeHash, mkMix, stringHash } from "./hash";
import { Rational } from "./rational";
import type { ResourceLimit } from "./rlimit";

export const KIND_APP = 0;
export const KIND_VAR = 1;
export const KIND_QUANTIFIER = 2;

export const SORT_BOOL = 0;
export const SORT_INT = 1;
export const SORT_REAL = 2;

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
export const OP_DIV = 23;
export const OP_TO_REAL = 24;
export const OP_TO_INT = 25;
export const OP_IS_INT = 26;
// Z3's div0, idiv0 and mod0: division by zero, which theory_lra's found_underspecified equates with
// the division it stands for.
export const OP_DIV0 = 27;
export const OP_IDIV0 = 28;
export const OP_MOD0 = 29;
export const OP_UNINTERPRETED = 30;
export const OP_MODEL_VALUE = 31;

// A Z3 symbol: a string, or a number for a numerical symbol, which Z3 prints as k!n.
export type SmtSymbol = string | number;

export const getSymbolName = (symbol: SmtSymbol) =>
  typeof symbol === "number" ? `k!${symbol}` : symbol;

export interface FuncDecl {
  name: SmtSymbol;
  family: number;
  op: number;
  domain: number[];
  range: number;
  isSkolem: boolean;
  // Z3's small id of the declaration, which its matcher hashes.
  smallId: number;
}

export interface QuantifierData {
  isForall: boolean;
  sorts: number[];
  // The names of the variables, which tell apart quantifiers that differ only in them, as in Z3.
  names: SmtSymbol[];
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
  ["/", FAMILY_ARITH, OP_DIV, SORT_REAL],
  ["to_real", FAMILY_ARITH, OP_TO_REAL, SORT_REAL],
  ["to_int", FAMILY_ARITH, OP_TO_INT, SORT_INT],
  ["is_int", FAMILY_ARITH, OP_IS_INT, SORT_BOOL],
  ["/0", FAMILY_ARITH, OP_DIV0, SORT_REAL],
  ["div0", FAMILY_ARITH, OP_IDIV0, SORT_INT],
  ["mod0", FAMILY_ARITH, OP_MOD0, SORT_INT],
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
  [OP_DIV, ["/", 10, 2]],
  [OP_TO_REAL, ["to_real", 18, 1]],
  [OP_TO_INT, ["to_int", 19, 1]],
  [OP_IS_INT, ["is_int", 20, 1]],
  [OP_DIV0, ["/0", 12, 2]],
  [OP_IDIV0, ["div0", 13, 2]],
  [OP_MOD0, ["mod0", 17, 2]],
]);

// The small ids of the Int declarations Z3 makes when it starts, from arith_decl_plugin::set_manager,
// which Real terms share. The declarations of Real terms only have the ids of Real's /, Int's
// to_real, Real's to_int and is_int. Z3 makes =, ite, distinct, pattern, numeral, /0, div0 and mod0
// declarations per signature on first use, so they get -1 here, and their small ids are kept by
// signature.
const Z3_SMALL_IDS = new Map([
  [OP_TRUE, 1],
  [OP_FALSE, 2],
  [OP_AND, 3],
  [OP_OR, 4],
  [OP_XOR, 5],
  [OP_NOT, 6],
  [OP_IMPLIES, 7],
  [OP_LE, 17],
  [OP_GE, 18],
  [OP_LT, 19],
  [OP_GT, 20],
  [OP_ADD, 36],
  [OP_SUB, 37],
  [OP_MUL, 38],
  [OP_IDIV, 39],
  [OP_MOD, 41],
  [OP_UMINUS, 42],
  [OP_ABS, 50],
  [OP_DIV, 24],
  [OP_TO_REAL, 43],
  [OP_TO_INT, 45],
  [OP_IS_INT, 47],
]);

// The small id of the first sort or declaration a problem declares, after Z3's own.
const FIRST_DECLARED_SMALL_ID = 143;

// The ids of Z3's own expressions when it starts: the undef proof, true and false, then pi, euler, a
// bit-vector numeral, fifteen real variables and a sum of two of them, which no problem shares.
const FIRST_FREE_ID = 22;
// MAX_SMALL_NUM_TO_CACHE: arith_decl_plugin holds the numerals below it once it makes them.
const MAX_SMALL_NUM_TO_CACHE = 16;
// The sorts that finite_set_decl_plugin::init makes.
const NUM_FINITE_SET_PLUGIN_SORTS = 7;

// symbol::hash: a numerical symbol hashes to its number.
const getSymbolHash = (symbol: SmtSymbol) =>
  typeof symbol === "number" ? symbol : stringHash(symbol, 17);

// Whether a sort is Int or Real.
export const isArithSort = (sort: number) => sort === SORT_INT || sort === SORT_REAL;

// mpz_manager::hash: the absolute value of an integer below 2^32, else the hash of its 32-bit digits,
// least significant first.
const getIntegerHash = (value: bigint) => {
  const magnitude = value < 0n ? -value : value;
  if (magnitude <= 0xffffffffn) return Number(magnitude);
  const digits: number[] = [];
  for (let rest = magnitude; rest > 0n; rest >>= 32n) digits.push(Number(rest & 0xffffffffn));
  return bytesHash(new Uint8Array(Uint32Array.from(digits).buffer), 17);
};

// decl_info::hash.
const getInfoHash = (family: number, kind: number, parameterHashes: number[]) =>
  mkMix(family, kind, parameterHashes.length === 0 ? 0 : getCompositeHash(parameterHashes));

export class AstManager {
  kinds: number[] = [];
  // The declaration of an application.
  decls: number[] = [];
  args: number[][] = [];
  sorts: number[] = [];
  // The index of a variable or model value, or of a numeral's value in numeralValues.
  values: number[] = [];
  private numeralValues: Rational[] = [];
  // One more than the largest free de Bruijn index, so 0 means the expression is ground.
  freeVarBounds: number[] = [];
  hasQuantifierFlags: boolean[] = [];
  depths: number[] = [];
  // Z3's hash of each expression, which orders Z3's hash tables.
  hashes: number[] = [];
  quantifiers = new Map<number, QuantifierData>();
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int", "Real"];
  private sortHashes = [
    combineHash(getSymbolHash("Bool"), getInfoHash(Z3_BASIC_FAMILY, 0, [])),
    combineHash(getSymbolHash("Int"), getInfoHash(Z3_ARITH_FAMILY, 1, [])),
    combineHash(getSymbolHash("Real"), getInfoHash(Z3_ARITH_FAMILY, 0, [])),
  ];
  // The hash of each uninterpreted declaration, and of each builtin by its Z3 declaration.
  private declHashes: number[] = [];
  private builtinHashes = new Map<string | number, number>();
  private table = new Map<string, number>();
  // The hash-consing table of applications: open addressing with linear probing over the handles,
  // -1 for an empty slot, which takes a few bytes per application where a map of buckets takes
  // dozens. Applications stay in it when they are deleted, so a lookup can create them again.
  private appHandles = new Int32Array(1024).fill(-1);
  private appHashes = new Int32Array(1024);
  private numApps = 0;
  // id_gen for sorts and declarations: the small id of the next one, and the ids of deleted ones,
  // which Z3 reuses the last freed first. Z3 keeps the declarations of = and ite, and deletes the
  // others with their last reference.
  private nextSmallId = FIRST_DECLARED_SMALL_ID;
  private freeSmallIds: number[] = [];
  private numDecls = FIRST_DECLARED_SMALL_ID;
  // The small id and the number of live applications of each builtin declaration that Z3 makes
  // per signature, by its signature.
  private signatureSmallIds = new Map<string, number>();
  private signatureRefCounts = new Map<string, number>();
  // The references to each user declaration: the script holds the declared ones, and applications
  // and models hold the fresh ones. A deleted declaration keeps its small id here, in case an
  // application of it is created again.
  private declRefCounts: number[] = [];
  private deletedDecls = new Set<number>();
  // ast_manager::m_fresh_id, which numbers fresh declarations and variable names.
  private freshId = 0;
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
  // m_small_ints and m_small_reals: the numerals below MAX_SMALL_NUM_TO_CACHE, which are held.
  private smallInts: number[] = [];
  private smallReals: number[] = [];
  private isFiniteSetPluginInitialized = false;
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
        smallId: Z3_SMALL_IDS.get(builtin[2]) ?? -1,
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

  // get_num_asts: the live expressions, declarations and sorts, with Z3's own expressions.
  getNumAsts() {
    return this.numLive + FIRST_FREE_ID - 2 + this.numDecls;
  }

  private mkSmallId() {
    this.numDecls++;
    return this.freeSmallIds.length > 0 ? (this.freeSmallIds.pop() as number) : this.nextSmallId++;
  }

  // finite_set_decl_plugin::init, which the first final check of theory_finite_set runs when it
  // makes a set.range declaration: the plugin makes the sorts A and B, three FiniteSet sorts and two
  // Array sorts, which the manager keeps. The set.range declaration is released at once.
  initFiniteSetPlugin() {
    if (this.isFiniteSetPluginInitialized) return;
    this.isFiniteSetPluginInitialized = true;
    for (let index = 0; index < NUM_FINITE_SET_PLUGIN_SORTS; index++) this.mkSmallId();
    this.freeSmallIds.push(this.mkSmallId());
    this.numDecls--;
  }

  // insert_macro: cmd_context keeps a named expression as a recursive function with one case, whose
  // declaration and case predicate it holds.
  mkMacroDecls() {
    this.mkSmallId();
    this.mkSmallId();
  }

  // The signature of a builtin declaration that Z3 makes on first use, and whether Z3 keeps it once
  // made, or null for a declaration that is not one.
  private getSignature(expr: number): [string, boolean] | null {
    const decl = this.decls[expr];
    const args = this.args[expr];
    // The hash of a numeral tells an Int from a Real one.
    if (decl === OP_NUM) return [`n${this.values[expr]}:${this.hashes[expr]}`, false];
    if (decl === OP_EQ) return [`e${this.sorts[args[0]]}`, true];
    if (decl === OP_ITE) return [`i${this.sorts[expr]}`, true];
    if (decl === OP_DIV0 || decl === OP_IDIV0 || decl === OP_MOD0) return [`z${decl}`, false];
    if (decl === OP_DISTINCT || decl === OP_PATTERN)
      return [`${decl}:${args.map((arg) => this.sorts[arg]).join(",")}`, false];
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) return [`m${decl}`, false];
    return null;
  }

  // The id that Z3 gives the declaration of an application.
  getDeclId(expr: number) {
    const signature = this.getSignature(expr);
    return signature === null
      ? this.funcDecls[this.decls[expr]].smallId
      : (this.signatureSmallIds.get(signature[0]) as number);
  }

  // An application holds its declaration, which Z3 makes with its first application.
  private holdDecl(expr: number) {
    const decl = this.decls[expr];
    if (this.funcDecls[decl].family === FAMILY_USER) {
      this.incDeclRef(decl);
      return;
    }
    const signature = this.getSignature(expr);
    if (signature === null) return;
    const key = signature[0];
    const refCount = this.signatureRefCounts.get(key);
    if (refCount !== undefined) {
      this.signatureRefCounts.set(key, refCount + 1);
      return;
    }
    const smallId = this.mkSmallId();
    this.signatureSmallIds.set(key, smallId);
    this.signatureRefCounts.set(key, signature[1] ? 2 : 1);
    if (decl !== OP_NUM && this.funcDecls[decl].family === FAMILY_MODEL_VALUE)
      this.funcDecls[decl].smallId = smallId;
  }

  // The small id of the declaration a deleted application releases for good, or -1 when the
  // declaration stays.
  private releaseDecl(expr: number) {
    const decl = this.decls[expr];
    if (this.funcDecls[decl].family === FAMILY_USER) {
      this.declRefCounts[decl]--;
      if (this.declRefCounts[decl] > 0) return -1;
      this.deletedDecls.add(decl);
      return this.funcDecls[decl].smallId;
    }
    const signature = this.getSignature(expr);
    if (signature === null) return -1;
    const key = signature[0];
    const refCount = (this.signatureRefCounts.get(key) as number) - 1;
    if (refCount > 0) {
      this.signatureRefCounts.set(key, refCount);
      return -1;
    }
    const smallId = this.signatureSmallIds.get(key) as number;
    this.signatureRefCounts.delete(key);
    this.signatureSmallIds.delete(key);
    return smallId;
  }

  incRef(expr: number) {
    this.refCounts[expr]++;
  }

  incDeclRef(decl: number) {
    if (this.deletedDecls.delete(decl)) this.funcDecls[decl].smallId = this.mkSmallId();
    this.declRefCounts[decl]++;
  }

  decDeclRef(decl: number) {
    this.declRefCounts[decl]--;
    if (this.declRefCounts[decl] > 0) return;
    this.deletedDecls.add(decl);
    this.freeSmallIds.push(this.funcDecls[decl].smallId);
    this.numDecls--;
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
  // and declaration that lose their last reference, in the order of Z3's worklist. A released
  // declaration's small id goes on the worklist as -1 - id.
  decRef(expr: number) {
    if (this.ids[expr] === -1) return;
    this.refCounts[expr]--;
    if (this.refCounts[expr] > 0) return;
    const worklist = [expr];
    while (worklist.length > 0) {
      const node = worklist.pop() as number;
      if (node < 0) {
        this.freeSmallIds.push(-1 - node);
        this.numDecls--;
        continue;
      }
      this.deleteNode(node);
      if (this.kinds[node] === KIND_APP) {
        const smallId = this.releaseDecl(node);
        if (smallId !== -1) worklist.push(-1 - smallId);
      }
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
    if (this.kinds[expr] === KIND_APP) this.holdDecl(expr);
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
        getInfoHash(Z3_USER_SORT_FAMILY, this.sortNames.length - 3, []),
      ),
    );
    this.sortNames.push(name);
    this.mkSmallId();
    return this.sortNames.length - 1;
  }

  // The hash of a func_decl node: its name, range, info and domain.
  private getFuncDeclHash(name: SmtSymbol, domain: number[], range: number, infoHash: number) {
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

  // The domain of a builtin other than pattern depends only on the sort of an argument and the
  // number of arguments, which key the cache without a string.
  private getBuiltinHash(op: number, args: number[], range: number) {
    const argSort = (op === OP_ITE ? this.sorts[args[1]] : this.sorts[args[0]]) ?? 0;
    const key =
      op === OP_PATTERN
        ? `${args.map((arg) => this.sorts[arg]).join(",")}:${range}`
        : op + 32 * (argSort + 65536 * (range + 65536 * args.length));
    const existing = this.builtinHashes.get(key);
    if (existing !== undefined) return existing;
    const signature = this.getBuiltinSignature(op, args);
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

  // The hash of a user declaration, which Z3's tables of declarations hash.
  getDeclHash(decl: number) {
    return this.declHashes[decl];
  }

  mkFuncDecl(name: SmtSymbol, domain: number[], range: number, isSkolem = false) {
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
      smallId: this.mkSmallId(),
    });
    this.declRefCounts[this.funcDecls.length - 1] = 1;
    return this.funcDecls.length - 1;
  }

  // mk_fresh_func_decl: without a prefix the name is the numerical symbol of the fresh id.
  mkFreshFuncDecl(prefix: SmtSymbol | null, domain: number[], range: number, isSkolem = true) {
    const name = prefix === null ? this.freshId : `${getSymbolName(prefix)}!${this.freshId}`;
    this.freshId++;
    const decl = this.mkFuncDecl(name, domain, range, isSkolem);
    this.declRefCounts[decl] = 0;
    return decl;
  }

  // mk_fresh_var_name.
  mkFreshVarName(prefix: string | null) {
    const name = `${prefix ?? "var"}!${this.freshId}`;
    this.freshId++;
    return name;
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
    const mask = this.appHandles.length - 1;
    for (let slot = hash & mask; this.appHandles[slot] !== -1; slot = (slot + 1) & mask) {
      const candidate = this.appHandles[slot];
      if (this.appHashes[slot] !== hash || this.decls[candidate] !== decl) continue;
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
    this.insertApp(hash, id);
    this.registerNode(id);
    return id;
  }

  private insertApp(hash: number, id: number) {
    if (2 * (this.numApps + 1) > this.appHandles.length) {
      const handles = this.appHandles;
      const hashes = this.appHashes;
      this.appHandles = new Int32Array(2 * handles.length).fill(-1);
      this.appHashes = new Int32Array(2 * handles.length);
      this.numApps = 0;
      for (let slot = 0; slot < handles.length; slot++)
        if (handles[slot] !== -1) this.insertApp(hashes[slot], handles[slot]);
    }
    const mask = this.appHandles.length - 1;
    let slot = hash & mask;
    while (this.appHandles[slot] !== -1) slot = (slot + 1) & mask;
    this.appHandles[slot] = id;
    this.appHashes[slot] = hash;
    this.numApps++;
  }

  // A numeral's declaration has the parameters (value, is_int), and a rational hashes as
  // hash(numerator) + 3 hash(denominator).
  private internNumeral(key: string, value: Rational, sort: number) {
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    this.numeralValues.push(value);
    const isInt = sort === SORT_INT;
    return this.intern(key, KIND_APP, OP_NUM, [], sort, this.numeralValues.length - 1, () =>
      this.getFuncDeclHash(
        isInt ? "Int" : "Real",
        [],
        sort,
        getInfoHash(Z3_ARITH_FAMILY, 0, [
          (getIntegerHash(value.num) + 3 * getIntegerHash(value.den)) >>> 0,
          isInt ? 1 : 0,
        ]),
      ),
    );
  }

  mkRealNumeral(value: Rational) {
    const numeral = this.internNumeral(`r${value}`, value, SORT_REAL);
    return value.isInt() ? this.holdSmallNumeral(numeral, value.num, this.smallReals) : numeral;
  }

  mkNumeral(value: bigint) {
    return this.holdSmallNumeral(
      this.internNumeral(`n${value}`, Rational.of(value), SORT_INT),
      value,
      this.smallInts,
    );
  }

  private holdSmallNumeral(numeral: number, value: bigint, cache: number[]) {
    if (value < 0n || value >= MAX_SMALL_NUM_TO_CACHE) return numeral;
    const index = Number(value);
    if (cache[index] !== undefined) return numeral;
    this.incRef(numeral);
    cache[index] = numeral;
    return numeral;
  }

  // mk_numeral(value, is_int).
  mkNumeralOfSort(value: Rational, sort: number) {
    return sort === SORT_INT ? this.mkNumeral(value.num) : this.mkRealNumeral(value);
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
      smallId: -1,
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

  mkFreshConst(prefix: SmtSymbol | null, sort: number) {
    return this.mkApp(this.mkFreshFuncDecl(prefix, [], sort), [], sort);
  }

  mkVar(index: number, sort: number) {
    return this.intern(`v${index}:${sort}`, KIND_VAR, -1, [], sort, index, () =>
      combineHash(index, this.sortHashes[sort]),
    );
  }

  mkQuantifier(data: QuantifierData) {
    if (data.names.length !== data.sorts.length)
      throw new Error("a quantifier needs a name for each variable");
    const key = `q${data.isForall ? 1 : 0}:${data.sorts.join(",")}:${JSON.stringify(data.names)}:${
      data.body
    }:${data.patterns.join(",")}:${data.weight}`;
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
    this.quantifiers.set(id, {
      ...data,
      sorts: [...data.sorts],
      names: [...data.names],
      patterns: [...data.patterns],
    });
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

  isReal(expr: number) {
    return this.sorts[expr] === SORT_REAL;
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

  // The value of an integer numeral.
  getNumeral(expr: number) {
    return this.isNumeral(expr) && this.sorts[expr] === SORT_INT
      ? this.getNumeralValue(expr)
      : undefined;
  }

  // The value of an expression that is an integer numeral.
  getNumeralValue(expr: number) {
    return this.numeralValues[this.values[expr]].num;
  }

  // The value of an expression that is a numeral of either sort.
  getRationalValue(expr: number) {
    return this.numeralValues[this.values[expr]];
  }

  // Unique values are interpreted constants that are distinct from each other, as in Z3.
  isUniqueValue(expr: number) {
    const op = this.getOp(expr);
    return op === OP_NUM || op === OP_TRUE || op === OP_FALSE || op === OP_MODEL_VALUE;
  }

  // are_distinct: the plugin of the first term's family, or of the second's for a user term, tells
  // two terms apart. Every plugin separates distinct unique values, and arith also separates b from
  // (+ b k) and (+ k b) for a nonzero numeral k.
  areDistinct(first: number, second: number) {
    if (this.kinds[first] !== KIND_APP || this.kinds[second] !== KIND_APP) return false;
    if (first !== second && this.isUniqueValue(first) && this.isUniqueValue(second)) return true;
    const family = this.funcDecls[this.decls[first]].family;
    if (
      (family === FAMILY_USER ? this.funcDecls[this.decls[second]].family : family) !== FAMILY_ARITH
    )
      return false;
    const isOffsetOf = (sum: number, term: number) => {
      if (this.getOp(sum) !== OP_ADD || this.args[sum].length !== 2) return false;
      const args = this.args[sum];
      const isNonZero = (expr: number) =>
        this.isNumeral(expr) && !this.getRationalValue(expr).isZero();
      return (args[0] === term && isNonZero(args[1])) || (args[1] === term && isNonZero(args[0]));
    };
    return isOffsetOf(first, second) || isOffsetOf(second, first);
  }

  isModelValue(expr: number) {
    return this.getOp(expr) === OP_MODEL_VALUE;
  }

  isUninterpretedSort(sort: number) {
    return sort > SORT_REAL;
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
    return this.isNumeral(coefficient) &&
      this.getRationalValue(coefficient).equals(Rational.minusOne)
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

  // for_each_expr: visits the subterms with a stack of its own, so deep terms do not exhaust the call
  // stack.
  private someSubterm(expr: number, predicate: (expr: number) => boolean) {
    const visited = new Set<number>();
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo.pop() as number;
      if (visited.has(current)) continue;
      visited.add(current);
      const kind = this.kinds[current];
      if (kind === KIND_QUANTIFIER) todo.push(this.getQuantifier(current).body);
      else if (kind !== KIND_VAR) {
        if (predicate(current)) return true;
        todo.push(...this.args[current]);
      }
    }
    return false;
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
    return getSymbolName(this.funcDecls[this.decls[expr]].name);
  }

  toString(expr: number): string {
    const kind = this.kinds[expr];
    if (kind === KIND_VAR) return `(:var ${this.values[expr]})`;
    if (kind === KIND_QUANTIFIER) {
      const data = this.getQuantifier(expr);
      return `(${data.isForall ? "forall" : "exists"} (${data.sorts.length}) ${this.toString(data.body)})`;
    }
    if (this.getOp(expr) === OP_NUM) {
      const value = this.getRationalValue(expr);
      if (this.sorts[expr] === SORT_INT) return String(value.num);
      return value.isInt() ? `${value.num}.0` : `(/ ${value.num}.0 ${value.den}.0)`;
    }
    const name = this.getDeclName(expr);
    const args = this.args[expr];
    return args.length === 0
      ? name
      : `(${name} ${args.map((innerArg) => this.toString(innerArg)).join(" ")})`;
  }
}
