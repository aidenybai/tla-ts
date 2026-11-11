// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
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
export const OP_DIV0 = 27;
export const OP_IDIV0 = 28;
export const OP_MOD0 = 29;
export const OP_UNINTERPRETED = 30;
const OP_MODEL_VALUE = 31;

export type SmtSymbol = string | number;

const getSymbolName = (symbol: SmtSymbol) => (typeof symbol === "number" ? `k!${symbol}` : symbol);

export interface FuncDecl {
  name: SmtSymbol;
  family: number;
  op: number;
  domain: number[];
  range: number;
  isSkolem: boolean;
  smallId: number;
}

interface QuantifierData {
  isForall: boolean;
  sorts: number[];
  names: SmtSymbol[];
  body: number;
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

const Z3_BASIC_FAMILY = 0;
const Z3_PATTERN_FAMILY = 2;
const Z3_MODEL_VALUE_FAMILY = 3;
const Z3_USER_SORT_FAMILY = 4;
const Z3_ARITH_FAMILY = 5;
const Z3_RECFUN_FAMILY = 10;
const Z3_NULL = 0xffffffff;
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

const FIRST_DECLARED_SMALL_ID = 143;

const FIRST_FREE_ID = 22;
const MAX_SMALL_NUM_TO_CACHE = 16;
const NUM_FINITE_SET_PLUGIN_SORTS = 7;

const getSymbolHash = (symbol: SmtSymbol) =>
  typeof symbol === "number" ? symbol : stringHash(symbol, 17);

export const isArithSort = (sort: number) => sort === SORT_INT || sort === SORT_REAL;

const getIntegerHash = (value: bigint) => {
  const magnitude = value < 0n ? -value : value;
  if (magnitude <= 0xffffffffn) return Number(magnitude);
  const digits: number[] = [];
  for (let rest = magnitude; rest > 0n; rest >>= 32n) digits.push(Number(rest & 0xffffffffn));
  return bytesHash(new Uint8Array(Uint32Array.from(digits).buffer), 17);
};

const getInfoHash = (family: number, kind: number, parameterHashes: number[]) =>
  mkMix(family, kind, parameterHashes.length === 0 ? 0 : getCompositeHash(parameterHashes));

const SIGNATURE_EQ = 0;
const SIGNATURE_ITE = 1;
const SIGNATURE_DIV0 = 2;
const SIGNATURE_MODEL_VALUE = 3;
const SIGNATURE_NUMERAL = 4;

interface SignatureDecl {
  smallId: number;
  refCount: number;
}

export class AstManager {
  private numNodes = 0;
  kinds = new Uint8Array(1024);
  decls = new Int32Array(1024);
  private argPool = new Int32Array(1024);
  private argStarts = new Int32Array(1024);
  sorts = new Int32Array(1024);
  values = new Int32Array(1024);
  private numeralValues: Rational[] = [];
  private intNumerals = new Map<bigint, number>();
  freeVarBounds = new Int32Array(1024);
  hasQuantifierFlags = new Uint8Array(1024);
  depths = new Int32Array(1024);
  hashes = new Uint32Array(1024);
  quantifiers = new Map<number, QuantifierData>();
  readonly flatLiterals = new FlatLiterals(this);
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int", "Real"];
  private sortHashes = [
    combineHash(getSymbolHash("Bool"), getInfoHash(Z3_BASIC_FAMILY, 0, [])),
    combineHash(getSymbolHash("Int"), getInfoHash(Z3_ARITH_FAMILY, 1, [])),
    combineHash(getSymbolHash("Real"), getInfoHash(Z3_ARITH_FAMILY, 0, [])),
  ];
  private declHashes: number[] = [];
  private builtinKeys = new Int32Array(4 * 256).fill(-1);
  private builtinHashes = new Uint32Array(256);
  private numBuiltinHashes = 0;
  private patternHashes = new Map<string, number>();
  private table = new Map<string, number>();
  private appHandles = new Int32Array(1024).fill(-1);
  private appHashes = new Int32Array(1024);
  private numApps = 0;
  private nextSmallId = FIRST_DECLARED_SMALL_ID;
  private freeSmallIds: number[] = [];
  private numDecls = FIRST_DECLARED_SMALL_ID;
  private signatureDecls = new Map<number | string, SignatureDecl>();
  private declRefCounts: number[] = [];
  readonly macros = new ObjMap<number>((decl) => this.declHashes[decl]);
  private deletedDecls = new Set<number>();
  private freshId = 0;
  ids = new Int32Array(1024);
  private refCounts = new Int32Array(1024);
  private freeIds: number[] = [];
  private nextId = 1;
  private numLive = 0;
  private temporaries: number[] = [];
  private temporariesMark = -1;
  private argBuffer: number[] = [];
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

  getNumAsts() {
    return this.numLive + FIRST_FREE_ID - 2 + this.numDecls;
  }

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

  initFiniteSetPlugin() {
    if (this.isFiniteSetPluginInitialized) return;
    this.isFiniteSetPluginInitialized = true;
    for (let index = 0; index < NUM_FINITE_SET_PLUGIN_SORTS; index++) this.mkSmallId();
    this.freeSmallIds.push(this.mkSmallId());
    this.numDecls--;
  }

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

  getDeclId(expr: number) {
    const signature = this.getSignature(expr);
    return signature === null
      ? this.funcDecls[this.decls[expr]].smallId
      : this.getSignatureDecl(signature).smallId;
  }

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
    this.signatureDecls.set(key, { smallId, refCount: decl === OP_EQ || decl === OP_ITE ? 2 : 1 });
    if (decl !== OP_NUM && this.funcDecls[decl].family === FAMILY_MODEL_VALUE)
      this.funcDecls[decl].smallId = smallId;
  }

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

  withoutTemporaries<T>(body: () => T) {
    const outer = this.temporariesMark;
    this.temporariesMark = -1;
    const result = body();
    this.temporariesMark = outer;
    return result;
  }

  releaseLater(expr: number) {
    if (this.temporariesMark === -1) this.decRef(expr);
    else this.temporaries.push(expr);
  }

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

  private registerNode(expr: number) {
    this.ids[expr] = this.freeIds.pop() ?? this.nextId++;
    this.numLive++;
    this.refCounts[expr] = 0;
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

  getNumArgs(expr: number) {
    return this.argStarts[expr + 1] - this.argStarts[expr];
  }

  getArg(expr: number, index: number) {
    return this.argPool[this.argStarts[expr] + index];
  }

  pushArgs(expr: number, target: number[]) {
    const end = this.argStarts[expr + 1];
    for (let index = this.argStarts[expr]; index < end; index++) target.push(this.argPool[index]);
  }

  getArgs(expr: number) {
    const args: number[] = [];
    this.pushArgs(expr, args);
    return args;
  }

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

  private getFuncDeclHash(name: SmtSymbol, domain: number[], range: number, infoHash: number) {
    return astArrayHash(
      domain,
      this.sortHashes,
      combineHash(combineHash(getSymbolHash(name), this.sortHashes[range]), infoHash),
    );
  }

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

  private getPatternHash(args: number[], range: number) {
    const key = `${args.map((arg) => this.sorts[arg]).join(",")}:${range}`;
    const existing = this.patternHashes.get(key);
    if (existing !== undefined) return existing;
    const hash = this.mkBuiltinHash(OP_PATTERN, args, range);
    this.patternHashes.set(key, hash);
    return hash;
  }

  // Returns the slot, a small integer, because V8 boxes a hash it returns.
  private getBuiltinSlot(op: number, args: number[], range: number) {
    const argSort = args.length === 0 ? 0 : this.sorts[op === OP_ITE ? args[1] : args[0]];
    const count = args.length;
    const slot = this.findBuiltinSlot(op, argSort, range, count);
    if (this.builtinKeys[4 * slot] !== -1) return slot;
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
    return this.insertBuiltinHash(op, argSort, range, count, hash);
  }

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
    return slot;
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

  mkFreshFuncDecl(prefix: SmtSymbol | null, domain: number[], range: number, isSkolem = true) {
    const name = prefix === null ? this.freshId : `${getSymbolName(prefix)}!${this.freshId}`;
    this.freshId++;
    const decl = this.mkFuncDecl(name, domain, range, isSkolem);
    this.declRefCounts[decl] = 0;
    return decl;
  }

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

  mkApp(decl: number, args: number[], sort: number, start = 0) {
    const funcDecl = this.funcDecls[decl];
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
    const builtinSlot =
      funcDecl.family === FAMILY_USER || funcDecl.op === OP_PATTERN
        ? -1
        : this.getBuiltinSlot(funcDecl.op, nodeArgs, sort);
    const declHash =
      funcDecl.family === FAMILY_USER
        ? this.declHashes[decl]
        : builtinSlot === -1
          ? this.getPatternHash(nodeArgs, sort)
          : this.builtinHashes[builtinSlot];
    const id = this.create(
      KIND_APP,
      decl,
      nodeArgs,
      sort,
      0,
      astArrayHash(nodeArgs, this.hashes, declHash),
    );
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
    const existing = this.intNumerals.get(value);
    if (existing !== undefined)
      return this.holdSmallNumeral(this.revive(existing), value, this.smallInts);
    const numeral = this.internNumeral(`n${value}`, Rational.of(value), SORT_INT);
    this.intNumerals.set(value, numeral);
    return this.holdSmallNumeral(numeral, value, this.smallInts);
  }

  private holdSmallNumeral(numeral: number, value: bigint, cache: number[]) {
    if (value < 0n || value >= MAX_SMALL_NUM_TO_CACHE) return numeral;
    const index = Number(value);
    if (cache[index] !== undefined) return numeral;
    this.incRef(numeral);
    cache[index] = numeral;
    return numeral;
  }

  mkNumeralOfSort(value: Rational, sort: number) {
    return sort === SORT_INT ? this.mkNumeral(value.num) : this.mkRealNumeral(value);
  }

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

  mkPattern(terms: number[]) {
    return this.mkApp(OP_PATTERN, terms, SORT_BOOL);
  }

  getQuantifier(expr: number) {
    const data = this.quantifiers.get(expr);
    if (data === undefined) throw new SmtInvariantError("the expression is not a quantifier");
    return data;
  }

  isVar(expr: number) {
    return this.kinds[expr] === KIND_VAR;
  }

  isGround(expr: number) {
    return this.freeVarBounds[expr] === 0;
  }

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

  getNumeral(expr: number) {
    return this.isNumeral(expr) && this.sorts[expr] === SORT_INT
      ? this.getNumeralValue(expr)
      : undefined;
  }

  getNumeralValue(expr: number) {
    return this.numeralValues[this.values[expr]].num;
  }

  getRationalValue(expr: number) {
    return this.numeralValues[this.values[expr]];
  }

  isUniqueValue(expr: number) {
    const op = this.getOp(expr);
    return op === OP_NUM || op === OP_TRUE || op === OP_FALSE || op === OP_MODEL_VALUE;
  }

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

  isUninterpretedConst(expr: number) {
    return this.isUninterpreted(expr) && this.getNumArgs(expr) === 0;
  }

  isUninterpreted(expr: number) {
    return this.getFamily(expr) === FAMILY_USER;
  }

  getTimesMinusOneArg(expr: number) {
    if (this.getOp(expr) !== OP_MUL || this.getNumArgs(expr) !== 2) return undefined;
    const coefficient = this.getArg(expr, 0);
    return this.isNumeral(coefficient) &&
      this.getRationalValue(coefficient).equals(Rational.minusOne)
      ? this.getArg(expr, 1)
      : undefined;
  }

  isOccurring(decl: number, expr: number) {
    return this.someSubterm(expr, (current) => this.decls[current] === decl);
  }

  containsModelValue(expr: number) {
    return this.someSubterm(expr, (current) => this.isModelValue(current));
  }

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
