// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
// A hash-consed DAG of applications, de Bruijn variables and quantifiers, as in Z3's ast_manager.
import { SmtInvariantError } from "../../../errors";
import { FlatLiterals } from "./flat-literals";
import { astArrayHash, bytesHash, combineHash, getCompositeHash, mkMix, stringHash } from "./hash";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { grow, shrink } from "./array";
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
const OP_MODEL_VALUE = 31;

// A Z3 symbol: a string, or a number for a numerical symbol, which Z3 prints as k!n.
export type SmtSymbol = string | number;

const getSymbolName = (symbol: SmtSymbol) => (typeof symbol === "number" ? `k!${symbol}` : symbol);

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

interface QuantifierData {
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
const Z3_RECFUN_FAMILY = 10;
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

// The kinds of an integer signature, in its low three bits.
const SIGNATURE_EQ = 0;
const SIGNATURE_ITE = 1;
const SIGNATURE_DIV0 = 2;
const SIGNATURE_MODEL_VALUE = 3;
const SIGNATURE_NUMERAL = 4;

// A builtin declaration that Z3 makes once per signature: its small id, and the references that
// applications and model values hold to it.
interface SignatureDecl {
  smallId: number;
  refCount: number;
}

export class AstManager {
  // The tables of the expressions are typed arrays indexed by expression, which the collector does
  // not scan. They have room for more expressions than numNodes and double when full, which
  // replaces them, so a caller does not keep one across the creation of an expression.
  private numNodes = 0;
  kinds = new Uint8Array(1024);
  // The declaration of an application.
  decls = new Int32Array(1024);
  // The arguments of every expression end to end: those of expr are argPool[argStarts[expr]] up to
  // argPool[argStarts[expr + 1]]. Variables and constants take an empty range and a quantifier
  // takes its body. Both grow by doubling, which replaces the arrays.
  private argPool = new Int32Array(1024);
  private argStarts = new Int32Array(1024);
  sorts = new Int32Array(1024);
  // The index of a variable or model value, or of a numeral's value in numeralValues.
  values = new Int32Array(1024);
  private numeralValues: Rational[] = [];
  // One more than the largest free de Bruijn index, so 0 means the expression is ground.
  freeVarBounds = new Int32Array(1024);
  hasQuantifierFlags = new Uint8Array(1024);
  depths = new Int32Array(1024);
  // Z3's hash of each expression, which orders Z3's hash tables.
  hashes = new Uint32Array(1024);
  quantifiers = new Map<number, QuantifierData>();
  // The marks that the rewriters of this manager share to flatten conjunctions and disjunctions.
  readonly flatLiterals = new FlatLiterals(this);
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int", "Real"];
  private sortHashes = [
    combineHash(getSymbolHash("Bool"), getInfoHash(Z3_BASIC_FAMILY, 0, [])),
    combineHash(getSymbolHash("Int"), getInfoHash(Z3_ARITH_FAMILY, 1, [])),
    combineHash(getSymbolHash("Real"), getInfoHash(Z3_ARITH_FAMILY, 0, [])),
  ];
  // The hash of each uninterpreted declaration, and of each builtin by its Z3 declaration.
  private declHashes: number[] = [];
  // The hash of each builtin declaration other than pattern by op, argument sort, range and number
  // of arguments: open addressing with linear probing, with the four keys of slot i at 4 i in
  // builtinKeys and -1 for an empty slot.
  private builtinKeys = new Int32Array(4 * 256).fill(-1);
  private builtinHashes = new Uint32Array(256);
  private numBuiltinHashes = 0;
  // The hash of each pattern declaration by its domain and range.
  private patternHashes = new Map<string, number>();
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
  private signatureDecls = new Map<number | string, SignatureDecl>();
  // The references to each user declaration: the script holds the declared ones, and applications
  // and models hold the fresh ones. A deleted declaration keeps its small id here, in case an
  // application of it is created again.
  private declRefCounts: number[] = [];
  // The named expressions of the recfun plugin, by declaration.
  readonly macros = new ObjMap<number>((decl) => this.declHashes[decl]);
  private deletedDecls = new Set<number>();
  // ast_manager::m_fresh_id, which numbers fresh declarations and variable names.
  private freshId = 0;
  // Z3's id of each expression, which orders Z3's sorts. Like Z3, the manager counts references and
  // gives the id of a deleted expression to the next expression it creates, so its ids follow
  // Z3's. A deleted expression stays in the tables with the id -1 until it is created again.
  ids = new Int32Array(1024);
  private refCounts = new Int32Array(1024);
  private freeIds: number[] = [];
  private nextId = 1;
  private numLive = 0;
  // The expressions that the open withTemporaries hold, like the expr_ref temporaries of Z3
  // functions on the C++ stack: the innermost holds those from temporariesMark on, and -1 marks that
  // no temporaries are held.
  private temporaries: number[] = [];
  private temporariesMark = -1;
  // The arguments mkApp copies out of a caller's array that starts past index 0.
  private argBuffer: number[] = [];
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

  // The declaration that a held signature names.
  private getSignatureDecl(key: number | string) {
    const signatureDecl = this.signatureDecls.get(key);
    if (signatureDecl === undefined)
      throw new SmtInvariantError(`the signature ${key} is not held`);
    return signatureDecl;
  }

  private mkSmallId() {
    this.numDecls++;
    return this.freeSmallIds.pop() ?? this.nextSmallId++;
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
  // declaration and case predicate it holds. The recfun plugin maps the declaration to the
  // expression, which a model of the context takes as the declaration's interpretation.
  mkMacro(name: string, expr: number) {
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      [],
      this.sorts[expr],
      getInfoHash(Z3_RECFUN_FAMILY, 0, [0]),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_USER,
      op: OP_UNINTERPRETED,
      domain: [],
      range: this.sorts[expr],
      isSkolem: false,
      smallId: this.mkSmallId(),
    });
    this.declRefCounts[decl] = 1;
    this.mkSmallId();
    this.macros.set(decl, expr);
  }

  // The signature of a builtin declaration that Z3 makes on first use, or null for a declaration
  // that is not one. The low three bits of an integer signature tell its kind: an equality or ite
  // by sort, a division by zero or model value by declaration, or a numeral by its value, which a
  // numeral expression has alone. A distinct or pattern is keyed by its domain.
  private getSignature(expr: number) {
    const decl = this.decls[expr];
    if (decl === OP_NUM) return 8 * this.values[expr] + SIGNATURE_NUMERAL;
    if (decl === OP_EQ) return 8 * this.sorts[this.getArg(expr, 0)] + SIGNATURE_EQ;
    if (decl === OP_ITE) return 8 * this.sorts[expr] + SIGNATURE_ITE;
    if (decl === OP_DIV0 || decl === OP_IDIV0 || decl === OP_MOD0) return 8 * decl + SIGNATURE_DIV0;
    if (decl === OP_DISTINCT || decl === OP_PATTERN)
      return `${decl}:${this.mapArgs(expr, (arg) => this.sorts[arg]).join(",")}`;
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) return 8 * decl + SIGNATURE_MODEL_VALUE;
    return null;
  }

  // The id that Z3 gives the declaration of an application.
  getDeclId(expr: number) {
    const signature = this.getSignature(expr);
    return signature === null
      ? this.funcDecls[this.decls[expr]].smallId
      : this.getSignatureDecl(signature).smallId;
  }

  // An application holds its declaration, which Z3 makes with its first application.
  private holdDecl(expr: number) {
    const decl = this.decls[expr];
    if (this.funcDecls[decl].family === FAMILY_USER) {
      this.incDeclRef(decl);
      return;
    }
    const key = this.getSignature(expr);
    if (key === null) return;
    const signatureDecl = this.signatureDecls.get(key);
    if (signatureDecl !== undefined) {
      signatureDecl.refCount++;
      return;
    }
    const smallId = this.mkSmallId();
    // Z3 keeps the equality and ite declarations once it makes them.
    this.signatureDecls.set(key, { smallId, refCount: decl === OP_EQ || decl === OP_ITE ? 2 : 1 });
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
    const key = this.getSignature(expr);
    if (key === null) return -1;
    const signatureDecl = this.getSignatureDecl(key);
    signatureDecl.refCount--;
    if (signatureDecl.refCount > 0) return -1;
    this.signatureDecls.delete(key);
    return signatureDecl.smallId;
  }

  incRef(expr: number) {
    this.refCounts[expr]++;
  }

  // A model value's declaration is counted under its signature, like the applications that hold it.
  incDeclRef(decl: number) {
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) {
      const key = 8 * decl + SIGNATURE_MODEL_VALUE;
      const signatureDecl = this.signatureDecls.get(key);
      if (signatureDecl !== undefined) {
        signatureDecl.refCount++;
        return;
      }
      const smallId = this.mkSmallId();
      this.signatureDecls.set(key, { smallId, refCount: 1 });
      this.funcDecls[decl].smallId = smallId;
      return;
    }
    if (this.deletedDecls.delete(decl)) this.funcDecls[decl].smallId = this.mkSmallId();
    this.declRefCounts[decl]++;
  }

  decDeclRef(decl: number) {
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) {
      const key = 8 * decl + SIGNATURE_MODEL_VALUE;
      const signatureDecl = this.getSignatureDecl(key);
      signatureDecl.refCount--;
      if (signatureDecl.refCount > 0) return;
      this.freeSmallIds.push(signatureDecl.smallId);
      this.signatureDecls.delete(key);
      this.numDecls--;
      return;
    }
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
    const outer = this.beginTemporaries();
    const result = body();
    for (const kept of getKept(result)) this.incRef(kept);
    this.endTemporaries(outer);
    return result;
  }

  // withTemporaries without closures, for the hot paths: the caller passes what beginTemporaries
  // returns to endTemporaries, and takes its references before it.
  beginTemporaries() {
    const outer = this.temporariesMark;
    this.temporariesMark = this.temporaries.length;
    return outer;
  }

  endTemporaries(outer: number) {
    const temporaries = this.temporaries;
    const mark = this.temporariesMark;
    this.temporariesMark = outer;
    for (let index = temporaries.length - 1; index >= mark; index--)
      this.decRef(temporaries[index]);
    shrink(temporaries, mark);
  }

  // Runs body without temporaries, for code whose references are counted explicitly.
  withoutTemporaries<T>(body: () => T) {
    const outer = this.temporariesMark;
    this.temporariesMark = -1;
    const result = body();
    this.temporariesMark = outer;
    return result;
  }

  // Hands a reference the caller owns to the innermost withTemporaries, or releases it now.
  releaseLater(expr: number) {
    if (this.temporariesMark === -1) this.decRef(expr);
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
    for (let node = worklist.pop(); node !== undefined; node = worklist.pop()) {
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
      // The children: the arguments of an application, and the body and then the patterns of a
      // quantifier.
      if (this.kinds[node] !== KIND_QUANTIFIER) {
        const end = this.argStarts[node + 1];
        for (let index = this.argStarts[node]; index < end; index++)
          this.releaseChild(this.argPool[index], worklist);
        continue;
      }
      const data = this.getQuantifier(node);
      this.releaseChild(data.body, worklist);
      for (const pattern of data.patterns) this.releaseChild(pattern, worklist);
    }
  }

  private releaseChild(child: number, worklist: number[]) {
    this.refCounts[child]--;
    if (this.refCounts[child] === 0) worklist.push(child);
  }

  private deleteNode(expr: number) {
    this.numLive--;
    this.freeIds.push(this.ids[expr]);
    this.ids[expr] = -1;
  }

  // register_node_core: a new expression takes an id and a reference to each child.
  private registerNode(expr: number) {
    this.ids[expr] = this.freeIds.pop() ?? this.nextId++;
    this.numLive++;
    this.refCounts[expr] = 0;
    // The children: the arguments of an application, and the body and then the patterns of a
    // quantifier.
    if (this.kinds[expr] !== KIND_QUANTIFIER) {
      const end = this.argStarts[expr + 1];
      for (let index = this.argStarts[expr]; index < end; index++)
        this.incRef(this.revive(this.argPool[index]));
    } else {
      const data = this.getQuantifier(expr);
      this.incRef(this.revive(data.body));
      for (const pattern of data.patterns) this.incRef(this.revive(pattern));
    }
    if (this.kinds[expr] === KIND_APP) this.holdDecl(expr);
    if (this.temporariesMark === -1) return;
    this.incRef(expr);
    this.temporaries.push(expr);
  }

  // The arguments of an application, and the body of a quantifier as its one argument.
  getNumArgs(expr: number) {
    return this.argStarts[expr + 1] - this.argStarts[expr];
  }

  getArg(expr: number, index: number) {
    return this.argPool[this.argStarts[expr] + index];
  }

  // Appends the arguments to target, for a caller that needs them as an array.
  pushArgs(expr: number, target: number[]) {
    const end = this.argStarts[expr + 1];
    for (let index = this.argStarts[expr]; index < end; index++) target.push(this.argPool[index]);
  }

  // A new array of the arguments.
  getArgs(expr: number) {
    const args: number[] = [];
    this.pushArgs(expr, args);
    return args;
  }

  // The callbacks may create expressions, which can replace argPool, so each argument is read anew.
  mapArgs<T>(expr: number, map: (arg: number, index: number) => T) {
    const result: T[] = [];
    for (let index = 0; index < this.getNumArgs(expr); index++)
      result.push(map(this.getArg(expr, index), index));
    return result;
  }

  someArg(expr: number, predicate: (arg: number, index: number) => boolean) {
    for (let index = 0; index < this.getNumArgs(expr); index++)
      if (predicate(this.getArg(expr, index), index)) return true;
    return false;
  }

  everyArg(expr: number, predicate: (arg: number, index: number) => boolean) {
    for (let index = 0; index < this.getNumArgs(expr); index++)
      if (!predicate(this.getArg(expr, index), index)) return false;
    return true;
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
      domain,
      this.sortHashes,
      combineHash(combineHash(getSymbolHash(name), this.sortHashes[range]), infoHash),
    );
  }

  // The name, Z3 decl kind and domain of the Z3 declaration of a builtin application.
  getBuiltinSignature(op: number, args: number[]) {
    const builtin = Z3_BUILTINS.get(op);
    if (builtin === undefined)
      throw new SmtInvariantError(`the operator ${op} has no Z3 declaration`);
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

  // The hash of a builtin's Z3 declaration. The domain of a builtin other than pattern depends only
  // on the sort of an argument and the number of arguments, which key the cache with the op and
  // range.
  private getBuiltinHash(op: number, args: number[], range: number) {
    if (op === OP_PATTERN) {
      const key = `${args.map((arg) => this.sorts[arg]).join(",")}:${range}`;
      const existing = this.patternHashes.get(key);
      if (existing !== undefined) return existing;
      const hash = this.mkBuiltinHash(op, args, range);
      this.patternHashes.set(key, hash);
      return hash;
    }
    const argSort = args.length === 0 ? 0 : this.sorts[op === OP_ITE ? args[1] : args[0]];
    const count = args.length;
    const slot = this.findBuiltinSlot(op, argSort, range, count);
    if (this.builtinKeys[4 * slot] !== -1) return this.builtinHashes[slot];
    const hash = this.mkBuiltinHash(op, args, range);
    if (2 * (this.numBuiltinHashes + 1) > this.builtinHashes.length) {
      const keys = this.builtinKeys;
      const hashes = this.builtinHashes;
      this.builtinKeys = new Int32Array(2 * keys.length).fill(-1);
      this.builtinHashes = new Uint32Array(2 * hashes.length);
      this.numBuiltinHashes = 0;
      for (let index = 0; index < 4 * hashes.length; index += 4)
        if (keys[index] !== -1)
          this.insertBuiltinHash(
            keys[index],
            keys[index + 1],
            keys[index + 2],
            keys[index + 3],
            hashes[index / 4],
          );
    }
    this.insertBuiltinHash(op, argSort, range, count, hash);
    return hash;
  }

  // The slot of the builtin hash with these keys, or the free slot where it goes.
  private findBuiltinSlot(op: number, argSort: number, range: number, count: number) {
    const keys = this.builtinKeys;
    const mask = this.builtinHashes.length - 1;
    let slot =
      (Math.imul(Math.imul(Math.imul(op, 0x9e3779b1) + argSort, 0x9e3779b1) + range, 0x9e3779b1) +
        count) &
      mask;
    while (
      keys[4 * slot] !== -1 &&
      (keys[4 * slot] !== op ||
        keys[4 * slot + 1] !== argSort ||
        keys[4 * slot + 2] !== range ||
        keys[4 * slot + 3] !== count)
    )
      slot = (slot + 1) & mask;
    return slot;
  }

  private insertBuiltinHash(
    op: number,
    argSort: number,
    range: number,
    count: number,
    hash: number,
  ) {
    const slot = this.findBuiltinSlot(op, argSort, range, count);
    this.builtinKeys.set([op, argSort, range, count], 4 * slot);
    this.builtinHashes[slot] = hash;
    this.numBuiltinHashes++;
  }

  private mkBuiltinHash(op: number, args: number[], range: number) {
    const signature = this.getBuiltinSignature(op, args);
    const family =
      op === OP_PATTERN ? Z3_PATTERN_FAMILY : op < OP_NUM ? Z3_BASIC_FAMILY : Z3_ARITH_FAMILY;
    return this.getFuncDeclHash(
      signature.name,
      signature.domain,
      range,
      getInfoHash(family, signature.kind, []),
    );
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
    const id = this.numNodes++;
    if (id === this.kinds.length) {
      this.kinds = grow(this.kinds);
      this.decls = grow(this.decls);
      this.sorts = grow(this.sorts);
      this.values = grow(this.values);
      this.freeVarBounds = grow(this.freeVarBounds);
      this.hasQuantifierFlags = grow(this.hasQuantifierFlags);
      this.depths = grow(this.depths);
      this.hashes = grow(this.hashes);
      this.ids = grow(this.ids);
      this.refCounts = grow(this.refCounts);
    }
    this.hashes[id] = hash;
    this.kinds[id] = kind;
    this.decls[id] = decl;
    // Like Z3, a node keeps its own copy of the arguments, so callers may reuse their arrays.
    const start = this.argStarts[id];
    const end = start + args.length;
    if (end > this.argPool.length) {
      const pool = new Int32Array(Math.max(2 * this.argPool.length, end));
      pool.set(this.argPool);
      this.argPool = pool;
    }
    for (let index = 0; index < args.length; index++) this.argPool[start + index] = args[index];
    if (id + 2 > this.argStarts.length) {
      const starts = new Int32Array(2 * this.argStarts.length);
      starts.set(this.argStarts);
      this.argStarts = starts;
    }
    this.argStarts[id + 1] = end;
    this.sorts[id] = sort;
    this.values[id] = value;
    let freeVarBound = kind === KIND_VAR ? value + 1 : 0;
    let hasQuantifier = kind === KIND_QUANTIFIER;
    let depth = 1;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (this.freeVarBounds[arg] > freeVarBound) freeVarBound = this.freeVarBounds[arg];
      if (this.hasQuantifierFlags[arg]) hasQuantifier = true;
      if (this.depths[arg] + 1 > depth) depth = this.depths[arg] + 1;
    }
    this.freeVarBounds[id] = freeVarBound;
    this.hasQuantifierFlags[id] = hasQuantifier ? 1 : 0;
    this.depths[id] = depth;
    return id;
  }

  // The op of a builtin declaration doubles as its index in funcDecls. The arguments are those of
  // args from start on, so that a rewriter passes its result stack without copying it.
  mkApp(decl: number, args: number[], sort: number, start = 0) {
    const funcDecl = this.funcDecls[decl];
    // Numerals and model values carry their value, so only mkNumeral and mkModelValue create them.
    if (decl === OP_NUM || funcDecl.family === FAMILY_MODEL_VALUE)
      throw new SmtInvariantError(`${funcDecl.name} needs a value`);
    let hash = decl;
    for (let index = start; index < args.length; index++)
      hash = (Math.imul(hash, 0x9e3779b1) + args[index]) | 0;
    const count = args.length - start;
    const mask = this.appHandles.length - 1;
    let slot = hash & mask;
    for (; this.appHandles[slot] !== -1; slot = (slot + 1) & mask) {
      const candidate = this.appHandles[slot];
      if (this.appHashes[slot] !== hash || this.decls[candidate] !== decl) continue;
      const poolStart = this.argStarts[candidate];
      if (this.argStarts[candidate + 1] - poolStart !== count) continue;
      let isSame = true;
      for (let index = 0; index < count && isSame; index++)
        isSame = this.argPool[poolStart + index] === args[start + index];
      if (isSame) return this.revive(candidate);
    }
    if (start > 0) {
      shrink(this.argBuffer, 0);
      for (let index = start; index < args.length; index++) this.argBuffer.push(args[index]);
    }
    const nodeArgs = start > 0 ? this.argBuffer : args;
    const declHash =
      funcDecl.family === FAMILY_USER
        ? this.declHashes[decl]
        : this.getBuiltinHash(funcDecl.op, nodeArgs, sort);
    const id = this.create(
      KIND_APP,
      decl,
      nodeArgs,
      sort,
      0,
      astArrayHash(nodeArgs, this.hashes, declHash),
    );
    // The lookup ended at a free slot, which the application takes unless the table doubles.
    if (2 * (this.numApps + 1) > this.appHandles.length) {
      const handles = this.appHandles;
      const hashes = this.appHashes;
      this.appHandles = new Int32Array(2 * handles.length).fill(-1);
      this.appHashes = new Int32Array(2 * handles.length);
      this.numApps = 0;
      for (let index = 0; index < handles.length; index++)
        if (handles[index] !== -1) this.insertApp(hashes[index], handles[index]);
      this.insertApp(hash, id);
    } else {
      this.appHandles[slot] = id;
      this.appHashes[slot] = hash;
      this.numApps++;
    }
    this.registerNode(id);
    return id;
  }

  private insertApp(hash: number, id: number) {
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
    const decl = this.funcDecls.length - 1;
    this.declHashes[decl] = this.getFuncDeclHash(
      this.funcDecls[decl].name,
      [],
      sort,
      getInfoHash(Z3_MODEL_VALUE_FAMILY, 0, [index, this.sortHashes[sort]]),
    );
    return this.intern(key, KIND_APP, decl, [], sort, index, () => this.declHashes[decl]);
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
      throw new SmtInvariantError("a quantifier needs a name for each variable");
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
        astArrayHash(data.sorts, this.sortHashes, data.isForall ? 31 : 19),
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
    if (data === undefined) throw new SmtInvariantError("the expression is not a quantifier");
    return data;
  }

  isApp(expr: number) {
    return this.kinds[expr] === KIND_APP;
  }

  isVar(expr: number) {
    return this.kinds[expr] === KIND_VAR;
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
      (this.isNot(first) && this.getArg(first, 0) === second) ||
      (this.isNot(second) && this.getArg(second, 0) === first) ||
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
      if (this.getOp(sum) !== OP_ADD || this.getNumArgs(sum) !== 2) return false;
      const first = this.getArg(sum, 0);
      const second = this.getArg(sum, 1);
      const isNonZero = (expr: number) =>
        this.isNumeral(expr) && !this.getRationalValue(expr).isZero();
      return (first === term && isNonZero(second)) || (second === term && isNonZero(first));
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
    return this.isUninterpreted(expr) && this.getNumArgs(expr) === 0;
  }

  isUninterpreted(expr: number) {
    return this.getFamily(expr) === FAMILY_USER;
  }

  // arith_util::is_times_minus_one: the t of (* -1 t).
  getTimesMinusOneArg(expr: number) {
    if (this.getOp(expr) !== OP_MUL || this.getNumArgs(expr) !== 2) return undefined;
    const coefficient = this.getArg(expr, 0);
    return this.isNumeral(coefficient) &&
      this.getRationalValue(coefficient).equals(Rational.minusOne)
      ? this.getArg(expr, 1)
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
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const kind = this.kinds[current];
      if (kind === KIND_QUANTIFIER) todo.push(this.getQuantifier(current).body);
      else if (kind !== KIND_VAR) {
        if (predicate(current)) return true;
        this.pushArgs(current, todo);
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
    return this.getNumArgs(expr) === 0
      ? name
      : `(${name} ${this.mapArgs(expr, (innerArg) => this.toString(innerArg)).join(" ")})`;
  }
}
