// Ported from Z3 (src/sat/smt/bv_solver.h, src/sat/smt/bv_internalize.cpp), MIT license, see
// z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import {
  OP_ADD,
  OP_BADD,
  OP_BIT2BOOL,
  OP_BNAND,
  OP_BNEG,
  OP_BNEG_OVFL,
  OP_BNOR,
  OP_BNOT,
  OP_BSADD_OVFL,
  OP_BSDIV,
  OP_BSDIV0,
  OP_BSDIV_I,
  OP_BSDIV_OVFL,
  OP_BSMOD,
  OP_BSMOD0,
  OP_BSMOD_I,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSMUL_OVFL,
  OP_BSREM,
  OP_BSREM0,
  OP_BSREM_I,
  OP_BSSUB_OVFL,
  OP_BSUB,
  OP_BUADD_OVFL,
  OP_BUDIV,
  OP_BUDIV0,
  OP_BUDIV_I,
  OP_BUMUL_NO_OVFL,
  OP_BUMUL_OVFL,
  OP_BUREM,
  OP_BUREM0,
  OP_BUREM_I,
  OP_BUSUB_OVFL,
  OP_BV_NUM,
  OP_BXNOR,
  OP_CARRY,
  OP_CONCAT,
  OP_EXTRACT,
  OP_IDIV,
  OP_INT2BV,
  OP_ITE,
  OP_MKBV,
  OP_MOD,
  OP_REPEAT,
  OP_SGEQ,
  OP_SGT,
  OP_SLEQ,
  OP_SLT,
  OP_UBV2INT,
  OP_UGEQ,
  OP_UGT,
  OP_ULEQ,
  OP_ULT,
  OP_XOR3,
  OP_ZERO_EXT,
  SORT_BOOL,
  SORT_INT,
} from "../ast";
import { BitBlaster } from "../bit-blaster";
import { mkBvApp } from "../bv-decl-plugin";
import { mkBvDivremBound } from "../bv-divrem-bounds";
import { L_UNDEF } from "../lbool";
import { UnionFind } from "../lp/union-find";
import { NULL_LITERAL } from "../sat/clause";
import { AC_BLASTS, BINARY_BLASTS, type Blast, UNARY_BLASTS } from "../theory-bv";
import { BvAckerman } from "./bv-ackerman";
import { type Enode, NULL_THEORY_VAR } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { ThSolver } from "./th-solver";

export interface ZeroOneBit {
  readonly owner: number;
  readonly index: number;
  readonly isTrue: boolean;
}

export interface EqOccurs {
  readonly bv1: number;
  readonly bv2: number;
  readonly index: number;
  readonly v1: number;
  readonly v2: number;
  readonly lit: number;
  readonly node: Enode;
  next: EqOccurs | null;
  prev: EqOccurs | null;
}

export interface VarPosOcc {
  readonly thVar: number;
  readonly index: number;
  readonly next: VarPosOcc | null;
}

export interface BvAtom {
  readonly boolVar: number;
  eqs: EqOccurs | null;
  occs: VarPosOcc | null;
  readonly lit: number;
  readonly def: number;
}

interface LeOp {
  readonly isSigned: boolean;
  readonly isReversed: boolean;
  readonly isNegated: boolean;
}

const LE_OPS = new Map<number, LeOp>([
  [OP_ULEQ, { isSigned: false, isReversed: false, isNegated: false }],
  [OP_SLEQ, { isSigned: true, isReversed: false, isNegated: false }],
  [OP_UGEQ, { isSigned: false, isReversed: true, isNegated: false }],
  [OP_SGEQ, { isSigned: true, isReversed: true, isNegated: false }],
  [OP_ULT, { isSigned: false, isReversed: true, isNegated: true }],
  [OP_SLT, { isSigned: true, isReversed: true, isNegated: true }],
  [OP_UGT, { isSigned: false, isReversed: false, isNegated: true }],
  [OP_SGT, { isSigned: true, isReversed: false, isNegated: true }],
]);

const DIVREM_I_OPS: ReadonlySet<number> = new Set([
  OP_BSDIV_I,
  OP_BUDIV_I,
  OP_BUREM_I,
  OP_BSREM_I,
  OP_BSMOD_I,
]);

// The divisions that hi_div0 defines through their _i counterparts.
const INTERP_OPS = new Map<number, number>([
  [OP_BUDIV, OP_BUDIV_I],
  [OP_BSDIV, OP_BSDIV_I],
  [OP_BSREM, OP_BSREM_I],
  [OP_BUREM, OP_BUREM_I],
  [OP_BSMOD, OP_BSMOD_I],
]);

const DIV0_OPS: ReadonlySet<number> = new Set([
  OP_BSDIV0,
  OP_BUDIV0,
  OP_BSREM0,
  OP_BUREM0,
  OP_BSMOD0,
]);

const NO_OVERFLOW_OPS: ReadonlySet<number> = new Set([
  OP_BUMUL_NO_OVFL,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
]);

const OVERFLOW_OPS: ReadonlySet<number> = new Set([
  OP_BUMUL_OVFL,
  OP_BSMUL_OVFL,
  OP_BSDIV_OVFL,
  OP_BNEG_OVFL,
  OP_BUADD_OVFL,
  OP_BSADD_OVFL,
  OP_BUSUB_OVFL,
  OP_BSSUB_OVFL,
]);

export abstract class BvInternalize extends ThSolver {
  protected abstract fixedVarEh(thVar: number): void;
  protected abstract findWpos(thVar: number): boolean;
  protected abstract findNewDiseqAxioms(atom: BvAtom, thVar: number, index: number): void;

  protected readonly blaster: BitBlaster;
  protected readonly find: UnionFind;
  protected readonly ackerman = new BvAckerman(this);
  readonly bits: number[][] = [];
  protected wpos: number[] = [];
  protected zeroOneBits: ZeroOneBit[][] = [];
  protected boolVar2atom: (BvAtom | undefined)[] = [];
  protected trueLit = NULL_LITERAL;
  protected bv2ints: Enode[] = [];

  constructor(ctx: EufSolver, id: number) {
    super(ctx, "bv", id);
    this.blaster = new BitBlaster(ctx.manager);
    this.find = new UnionFind(ctx.trail);
  }

  protected isBv(thVar: number) {
    const manager = this.manager;
    return manager.isBvSort(manager.sorts[this.var2expr(thVar)]);
  }

  protected getBvSize(thVar: number) {
    const manager = this.manager;
    return manager.getBvSize(manager.sorts[this.var2expr(thVar)]);
  }

  private getParameter(expr: number, index: number) {
    const manager = this.manager;
    return manager.funcDecls[manager.decls[expr]].parameters[index];
  }

  protected getBv2a(boolVar: number) {
    return this.boolVar2atom[boolVar];
  }

  private insertBv2a(boolVar: number, atom: BvAtom) {
    while (this.boolVar2atom.length <= boolVar) this.boolVar2atom.push(undefined);
    this.boolVar2atom[boolVar] = atom;
    this.ctx.trail.push(() => {
      this.boolVar2atom[boolVar] = undefined;
    });
  }

  override mkVar(node: Enode) {
    const thVar = super.mkVar(node);
    this.find.mkVar();
    this.bits.push([]);
    this.wpos.push(0);
    this.zeroOneBits.push([]);
    this.ctx.egraph.addThVar(node, thVar, this.id);
    return thVar;
  }

  override applySortCnstr(node: Enode) {
    this.forcePush();
    this.getVar(node);
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    this.forcePush();
    if (!this.visitRec(expr, isSign, isRoot)) return NULL_LITERAL;
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.forcePush();
    this.visitRec(expr, false, false);
  }

  protected override visit(expr: number) {
    const manager = this.manager;
    if (!manager.isApp(expr) || manager.getFamily(expr) !== this.id) {
      this.ctx.internalizeTerm(expr);
      return true;
    }
    this.stack.push({ expr, index: 0 });
    return false;
  }

  protected override visited(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected override postVisit(expr: number) {
    if (this.visited(expr)) return true;
    this.mkVar(this.expr2enode(expr) ?? this.mkEnode(expr));
    this.internalizeCircuit(expr);
    return true;
  }

  private internalizeCircuit(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    const numArgs = manager.getNumArgs(expr);
    const unary =
      (op === OP_BNAND || op === OP_BNOR || op === OP_BXNOR) && numArgs === 1
        ? UNARY_BLASTS.get(OP_BNOT)
        : UNARY_BLASTS.get(op);
    const binary = BINARY_BLASTS.get(op) ?? AC_BLASTS.get(op);
    const le = LE_OPS.get(op);
    const interp = INTERP_OPS.get(op);
    if (op === OP_BV_NUM) this.internalizeNum(expr);
    else if (unary !== undefined) this.internalizeUnary(expr, unary);
    else if (binary !== undefined) {
      this.internalizeBinary(expr, binary);
      if (DIVREM_I_OPS.has(op)) this.assertBvDivremBoundAxiom(expr);
    } else if (NO_OVERFLOW_OPS.has(op)) this.internalizeNovfl(expr, op);
    else if (OVERFLOW_OPS.has(op)) this.internalizeOverflow(expr, op);
    else if (op === OP_BIT2BOOL) this.internalizeBit2bool(expr);
    else if (le !== undefined) this.internalizeLe(expr, le);
    else if (op === OP_XOR3) this.internalizeXor3(expr);
    else if (op === OP_CARRY) this.internalizeCarry(expr);
    else if (op === OP_BSUB) this.internalizeSub(expr);
    else if (op === OP_CONCAT) this.internalizeConcat(expr);
    else if (op === OP_EXTRACT) this.internalizeExtract(expr);
    else if (op === OP_REPEAT) this.internalizeRepeat(expr);
    else if (op === OP_MKBV) this.initBits(expr, manager.getArgs(expr));
    else if (op === OP_INT2BV) this.internalizeInt2bv(expr);
    else if (op === OP_UBV2INT) this.assertBv2intAxiom(expr);
    else if (interp !== undefined) this.internalizeInterp(expr, interp);
    else if (!DIV0_OPS.has(op))
      throw new SmtUnsupportedError(`the bit-vector operator ${manager.getDeclName(expr)}`);
  }

  protected mkBits(thVar: number) {
    const manager = this.manager;
    const expr = this.var2expr(thVar);
    const size = this.getBvSize(thVar);
    const bits = this.bits[thVar];
    bits.length = 0;
    for (let index = 0; index < size; index++) {
      const bit2bool = mkBvApp(manager, OP_BIT2BOOL, [expr], [index]);
      bits.push(NULL_LITERAL);
      const lit = this.ctx.internalize(bit2bool, false, false);
      if (bits[index] === NULL_LITERAL) bits[index] = lit;
    }
  }

  protected getVar(node: Enode) {
    const existing = node.getThVar(this.id);
    if (existing !== NULL_THEORY_VAR) return existing;
    const thVar = this.mkVar(node);
    if (this.isBv(thVar)) this.mkBits(thVar);
    return thVar;
  }

  private getArgVar(node: Enode, index: number) {
    return this.getVar(this.expr2enode(this.manager.getArg(node.owner, index)) as Enode);
  }

  private getBits(thVar: number) {
    const manager = this.manager;
    return this.bits[thVar].map((lit) => {
      const expr = this.literal2expr(lit);
      manager.incRef(expr);
      return expr;
    });
  }

  private getArgBits(expr: number, index: number) {
    return this.getBits(this.getVar(this.expr2enode(this.manager.getArg(expr, index)) as Enode));
  }

  private dropAll(exprs: readonly number[]) {
    for (const expr of exprs) this.manager.decRef(expr);
  }

  private registerTrueFalseBit(thVar: number, index: number) {
    this.zeroOneBits[thVar].push({
      owner: thVar,
      index,
      isTrue: this.bits[thVar][index] === this.mkTrue(),
    });
  }

  protected addBit(thVar: number, lit: number) {
    const index = this.bits[thVar].length;
    this.bits[thVar].push(lit);
    this.s.setExternal(lit >> 1);
    const node = this.boolVar2enode(lit >> 1) as Enode;
    if (node.getThVar(this.id) === NULL_THEORY_VAR) this.mkVar(node);
    this.setBitEh(thVar, lit, index);
  }

  protected mkAtom(boolVar: number) {
    const existing = this.getBv2a(boolVar);
    if (existing !== undefined) return existing;
    const atom: BvAtom = { boolVar, eqs: null, occs: null, lit: NULL_LITERAL, def: NULL_LITERAL };
    this.insertBv2a(boolVar, atom);
    return atom;
  }

  protected setBitEh(thVar: number, lit: number, index: number) {
    if (lit >> 1 === this.mkTrue() >> 1) {
      this.registerTrueFalseBit(thVar, index);
      return;
    }
    const atom = this.mkAtom(lit >> 1);
    if (atom.occs !== null) this.findNewDiseqAxioms(atom, thVar, index);
    const occs = atom.occs;
    this.ctx.trail.push(() => {
      atom.occs = occs;
    });
    atom.occs = { thVar, index, next: occs };
  }

  private initBits(expr: number, bitExprs: readonly number[]) {
    const ctx = this.ctx;
    const thVar = (this.expr2enode(expr) as Enode).getThVar(this.id);
    const bits = this.bits[thVar];
    if (bits.length > 0) {
      bitExprs.forEach((bitExpr, index) => {
        const lit = ctx.internalize(bitExpr, false, false);
        this.addClause([lit ^ 1, bits[index]]);
        this.addClause([lit, bits[index] ^ 1]);
      });
      return;
    }
    for (const bitExpr of bitExprs) this.addBit(thVar, ctx.internalize(bitExpr, false, false));
    for (const bitExpr of bitExprs) this.getVar(this.expr2enode(bitExpr) as Enode);
    this.findWpos(thVar);
  }

  protected mkTrue() {
    if (this.trueLit !== NULL_LITERAL) return this.trueLit;
    this.ctx.trail.push(() => {
      this.trueLit = NULL_LITERAL;
    });
    this.trueLit = this.ctx.internalize(this.manager.trueExpr, false, true);
    this.s.assignUnit(this.trueLit);
    return this.trueLit;
  }

  private internalizeNum(expr: number) {
    const manager = this.manager;
    const value = manager.getBvNumeralValue(expr);
    const thVar = (this.expr2enode(expr) as Enode).getThVar(this.id);
    const trueLit = this.mkTrue();
    for (let index = 0; index < this.getBvSize(thVar); index++) {
      this.bits[thVar].push(((value >> BigInt(index)) & 1n) === 1n ? trueLit : trueLit ^ 1);
      this.registerTrueFalseBit(thVar, index);
    }
    this.fixedVarEh(thVar);
  }

  // n = bv2int(k) = ite(bit2bool(k[sz-1]), 2^{sz-1}, 0) + ... + ite(bit2bool(k[0]), 1, 0)
  private assertBv2intAxiom(expr: number) {
    const manager = this.manager;
    const wordBits = this.getBits(this.getVar(this.expr2enode(manager.getArg(expr, 0)) as Enode));
    const zero = manager.mkNumeral(0n);
    const terms = wordBits.map((bit, index) =>
      manager.mkApp(OP_ITE, [bit, manager.mkNumeral(1n << BigInt(index)), zero], SORT_INT),
    );
    const sum = terms.length === 1 ? terms[0] : manager.mkApp(OP_ADD, terms, SORT_INT);
    const lit = this.eqInternalize(expr, sum);
    this.bv2ints.push(this.expr2enode(expr) as Enode);
    this.ctx.trail.push(() => this.bv2ints.pop());
    this.addUnit(lit);
    this.dropAll(wordBits);
  }

  private internalizeInt2bv(expr: number) {
    const node = this.expr2enode(expr) as Enode;
    this.mkBits(node.getThVar(this.id));
    this.getVar(node.getArg(0));
    this.assertInt2bvAxiom(expr);
  }

  // bv2int(n) = e mod 2^bit_width, and bit2bool(i, n) = ((e div 2^i) mod 2 = 1), where n = int2bv(e)
  private assertInt2bvAxiom(expr: number) {
    const manager = this.manager;
    const arg = manager.getArg(expr, 0);
    const size = manager.getBvSize(manager.sorts[expr]);
    const mkMod = (dividend: number, divisor: bigint) =>
      manager.mkApp(OP_MOD, [dividend, manager.mkNumeral(divisor)], SORT_INT);
    this.addUnit(
      this.eqInternalize(mkBvApp(manager, OP_UBV2INT, [expr]), mkMod(arg, 1n << BigInt(size))),
    );
    const bits = this.getBits(this.getVar(this.expr2enode(expr) as Enode));
    for (let index = 0; index < size; index++) {
      const quotient =
        index === 0
          ? arg
          : manager.mkApp(OP_IDIV, [arg, manager.mkNumeral(1n << BigInt(index))], SORT_INT);
      const isOne = this.mkEq(mkMod(quotient, 2n), manager.mkNumeral(1n));
      this.addUnit(this.eqInternalize(bits[index], isOne));
    }
    this.dropAll(bits);
  }

  private internalizeLe(expr: number, le: LeOp) {
    const first = this.getArgBits(expr, le.isReversed ? 1 : 0);
    const second = this.getArgBits(expr, le.isReversed ? 0 : 1);
    const circuit = le.isSigned
      ? this.blaster.mkSle(first, second)
      : this.blaster.mkUle(first, second);
    const def = this.ctx.internalize(circuit, false, false);
    this.addDef(le.isNegated ? def ^ 1 : def, this.expr2literal(expr));
    this.manager.decRef(circuit);
    this.dropAll(second);
    this.dropAll(first);
  }

  private argLits(expr: number) {
    return this.manager.getArgs(expr).map((arg) => this.expr2literal(arg));
  }

  private internalizeCarry(expr: number) {
    const result = this.expr2literal(expr);
    const [first, second, third] = this.argLits(expr);
    this.addClause([result ^ 1, first, second]);
    this.addClause([result ^ 1, first, third]);
    this.addClause([result ^ 1, second, third]);
    this.addClause([result, first ^ 1, second ^ 1]);
    this.addClause([result, first ^ 1, third ^ 1]);
    this.addClause([result, second ^ 1, third ^ 1]);
  }

  private internalizeXor3(expr: number) {
    const result = this.expr2literal(expr);
    const [first, second, third] = this.argLits(expr);
    this.addClause([result ^ 1, first, second, third]);
    this.addClause([result ^ 1, first ^ 1, second ^ 1, third]);
    this.addClause([result ^ 1, first ^ 1, second, third ^ 1]);
    this.addClause([result ^ 1, first, second ^ 1, third ^ 1]);
    this.addClause([result, first ^ 1, second, third]);
    this.addClause([result, first, second ^ 1, third]);
    this.addClause([result, first, second, third ^ 1]);
    this.addClause([result, first ^ 1, second ^ 1, third ^ 1]);
  }

  private assertBvDivremBoundAxiom(expr: number) {
    const clause = mkBvDivremBound(this.manager, expr);
    if (clause.length === 0) return;
    this.addClause(clause.map((lit) => this.mkLiteral(lit)));
  }

  private internalizeInterp(expr: number, op: number) {
    const manager = this.manager;
    this.mkBits((this.expr2enode(expr) as Enode).getThVar(this.id));
    if (!manager.isHiDiv0)
      throw new SmtUnsupportedError(`sat.euf ${manager.getDeclName(expr)} without hi_div0`);
    this.addUnit(this.eqInternalize(expr, mkBvApp(manager, op, manager.getArgs(expr))));
  }

  private internalizeUnary(expr: number, blast: Blast) {
    const argBits = this.getArgBits(expr, 0);
    const bits: number[] = [];
    blast(this.blaster, [argBits], this.getParameter(expr, 0) ?? 0, bits);
    this.initBits(expr, bits);
    this.dropAll(bits);
    this.dropAll(argBits);
  }

  private internalizeBinary(expr: number, blast: Blast) {
    let bits = this.getArgBits(expr, 0);
    for (let index = 1; index < this.manager.getNumArgs(expr); index++) {
      const argBits = this.getArgBits(expr, index);
      const newBits: number[] = [];
      blast(this.blaster, [bits, argBits], 0, newBits);
      this.dropAll(bits);
      this.dropAll(argBits);
      bits = newBits;
    }
    this.initBits(expr, bits);
    this.dropAll(bits);
  }

  private internalizeNovfl(expr: number, op: number) {
    const first = this.getArgBits(expr, 0);
    const second = this.getArgBits(expr, 1);
    const blaster = this.blaster;
    const circuit =
      op === OP_BUMUL_NO_OVFL
        ? blaster.mkUmulNoOverflow(first, second)
        : op === OP_BSMUL_NO_OVFL
          ? blaster.mkSmulNoOverflow(first, second)
          : blaster.mkSmulNoUnderflow(first, second);
    this.addDef(this.ctx.internalize(circuit, false, false), this.expr2literal(expr));
    this.manager.decRef(circuit);
    this.dropAll(second);
    this.dropAll(first);
  }

  private addDef(def: number, lit: number) {
    this.insertBv2a(lit >> 1, { boolVar: lit >> 1, eqs: null, occs: null, lit, def });
    this.addClause([lit, def ^ 1]);
    this.addClause([def, lit ^ 1]);
  }

  private mkOverflowDef(expr: number, op: number) {
    const manager = this.manager;
    const first = manager.getArg(expr, 0);
    const size = manager.getBvSize(manager.sorts[first]);
    const bv = (bvOp: number, args: number[], parameters: number[] = []) =>
      mkBvApp(manager, bvOp, args, parameters);
    const mkMinSigned = () => manager.mkBvNumeral(1n << BigInt(size - 1), size);
    if (op === OP_BNEG_OVFL) return manager.mkEq(first, mkMinSigned());
    const second = manager.getArg(expr, 1);
    if (op === OP_BUMUL_OVFL) return manager.mkNot(bv(OP_BUMUL_NO_OVFL, [first, second]));
    if (op === OP_BSMUL_OVFL) {
      const noOverflow = bv(OP_BSMUL_NO_OVFL, [first, second]);
      const noUnderflow = bv(OP_BSMUL_NO_UDFL, [first, second]);
      const overflow = manager.mkNot(noOverflow);
      return manager.mkOr([overflow, manager.mkNot(noUnderflow)]);
    }
    if (op === OP_BUADD_OVFL) {
      const firstExt = bv(OP_ZERO_EXT, [first], [1]);
      const secondExt = bv(OP_ZERO_EXT, [second], [1]);
      const carry = bv(OP_EXTRACT, [bv(OP_BADD, [firstExt, secondExt])], [size, size]);
      return manager.mkEq(carry, manager.mkBvNumeral(1n, 1));
    }
    if (op === OP_BSADD_OVFL) {
      const zero = manager.mkBvNumeral(0n, size);
      const sum = bv(OP_BADD, [first, second]);
      const firstPos = bv(OP_SLT, [zero, first]);
      const secondPos = bv(OP_SLT, [zero, second]);
      const sumNonPos = bv(OP_SLEQ, [sum, zero]);
      const overflow = manager.mkAnd([firstPos, secondPos, sumNonPos]);
      const firstNeg = bv(OP_SLT, [first, zero]);
      const secondNeg = bv(OP_SLT, [second, zero]);
      const sumNonNeg = bv(OP_SLEQ, [zero, sum]);
      return manager.mkOr([overflow, manager.mkAnd([firstNeg, secondNeg, sumNonNeg])]);
    }
    if (op === OP_BUSUB_OVFL) return manager.mkNot(bv(OP_ULEQ, [second, first]));
    if (op === OP_BSSUB_OVFL) {
      const minSigned = mkMinSigned();
      const saddo = bv(OP_BSADD_OVFL, [first, bv(OP_BNEG, [second])]);
      const firstNonNeg = bv(OP_SLEQ, [manager.mkBvNumeral(0n, size), first]);
      const isSecondMin = manager.mkEq(second, minSigned);
      return manager.mkApp(OP_ITE, [isSecondMin, firstNonNeg, saddo], SORT_BOOL);
    }
    const minSigned = mkMinSigned();
    const minusOne = manager.mkBvNumeral((1n << BigInt(size)) - 1n, size);
    const isFirstMin = manager.mkEq(first, minSigned);
    return manager.mkAnd([isFirstMin, manager.mkEq(second, minusOne)]);
  }

  private internalizeOverflow(expr: number, op: number) {
    const def = this.mkOverflowDef(expr, op);
    this.addDef(this.ctx.internalize(def, false, false), this.expr2literal(expr));
  }

  private internalizeConcat(expr: number) {
    const node = this.expr2enode(expr) as Enode;
    const thVar = node.getThVar(this.id);
    this.bits[thVar].length = 0;
    for (let index = node.numArgs - 1; index >= 0; index--)
      for (const lit of this.bits[this.getArgVar(node, index)]) this.addBit(thVar, lit);
    this.findWpos(thVar);
  }

  private internalizeSub(expr: number) {
    const first = this.getArgBits(expr, 0);
    const second = this.getArgBits(expr, 1);
    const bits: number[] = [];
    const carry = this.blaster.mkSubtracter(first, second, bits);
    this.initBits(expr, bits);
    this.manager.decRef(carry);
    this.dropAll(bits);
    this.dropAll(second);
    this.dropAll(first);
  }

  private internalizeExtract(expr: number) {
    const node = this.expr2enode(expr) as Enode;
    const thVar = node.getThVar(this.id);
    const argVar = this.getArgVar(node, 0);
    this.bits[thVar].length = 0;
    for (let index = this.getParameter(expr, 1); index <= this.getParameter(expr, 0); index++)
      this.addBit(thVar, this.bits[argVar][index]);
    this.findWpos(thVar);
  }

  private internalizeRepeat(expr: number) {
    const manager = this.manager;
    const arg = manager.getArg(expr, 0);
    const concat = mkBvApp(
      manager,
      OP_CONCAT,
      Array.from({ length: this.getParameter(expr, 0) }, () => arg),
    );
    this.mkBits((this.expr2enode(expr) as Enode).getThVar(this.id));
    this.addUnit(this.eqInternalize(expr, concat));
  }

  private internalizeBit2bool(expr: number) {
    const manager = this.manager;
    const index = this.getParameter(expr, 0);
    const arg = manager.getArg(expr, 0);
    const argNode = this.expr2enode(arg) as Enode;
    if (argNode.getThVar(this.id) === NULL_THEORY_VAR) this.mkVar(argNode);
    const argVar = argNode.getThVar(this.id);
    const lit = this.expr2literal(expr);
    const lit0 = this.bits[argVar][index];
    if (lit0 === NULL_LITERAL) {
      this.bits[argVar][index] = lit;
      this.insertBv2a(lit >> 1, {
        boolVar: lit >> 1,
        eqs: null,
        occs: { thVar: argVar, index, next: null },
        lit: NULL_LITERAL,
        def: NULL_LITERAL,
      });
    } else if (lit !== lit0) {
      this.addClause([lit0, lit ^ 1]);
      this.addClause([lit0 ^ 1, lit]);
    }
    if (manager.isBvNumeral(arg))
      this.addUnit(((manager.getBvNumeralValue(arg) >> BigInt(index)) & 1n) === 0n ? lit ^ 1 : lit);
  }

  override eqInternalized(node: Enode) {
    const lit = 2 * node.boolVar;
    const v1 = node.getArg(0).getThVar(this.id);
    const v2 = node.getArg(1).getThVar(this.id);
    const firstBits = this.bits[v1];
    const secondBits = this.bits[v2];
    if (firstBits.length === 1) {
      const bit1 = firstBits[0];
      const bit2 = secondBits[0];
      this.addClause([lit ^ 1, bit1 ^ 1, bit2]);
      this.addClause([lit ^ 1, bit2 ^ 1, bit1]);
      this.addClause([bit1 ^ 1, bit2 ^ 1, lit]);
      this.addClause([bit2, bit1, lit]);
      return;
    }
    const s = this.s;
    for (let index = 0; index < firstBits.length; index++) {
      const bit1 = firstBits[index];
      const bit2 = secondBits[index];
      const isReversed =
        s.value(bit1) !== L_UNDEF || (s.value(bit2) === L_UNDEF && this.random() % 2 === 0);
      if (isReversed) this.addEqOccurs(bit2 >> 1, bit1 >> 1, index, v2, v1, lit, node);
      else this.addEqOccurs(bit1 >> 1, bit2 >> 1, index, v1, v2, lit, node);
    }
  }

  protected addEqOccurs(
    bv1: number,
    bv2: number,
    index: number,
    v1: number,
    v2: number,
    lit: number,
    node: Enode,
  ) {
    const atom = this.mkAtom(bv1);
    this.ctx.trail.push(() => {
      atom.eqs = (atom.eqs as EqOccurs).next;
      if (atom.eqs !== null) atom.eqs.prev = null;
    });
    const next = atom.eqs;
    atom.eqs = { bv1, bv2, index, v1, v2, lit, node, next, prev: null };
    if (next !== null) next.prev = atom.eqs;
  }

  assertAckerman(inputV1: number, inputV2: number) {
    if (inputV1 === inputV2) return;
    const manager = this.manager;
    const v1 = Math.min(inputV1, inputV2);
    const v2 = Math.max(inputV1, inputV2);
    const first = this.var2expr(v1);
    const second = this.var2expr(v2);
    const eq = this.ctx.internalize(this.mkEq(first, second), false, false);
    const lits = [eq];
    for (let index = 0; index < this.bits[v1].length; index++) {
      const bitEq = this.eqInternalize(
        mkBvApp(manager, OP_BIT2BOOL, [first], [index]),
        mkBvApp(manager, OP_BIT2BOOL, [second], [index]),
      );
      this.addClause([bitEq, eq ^ 1]);
      lits.push(bitEq ^ 1);
    }
    this.addClause(lits, true);
  }
}
