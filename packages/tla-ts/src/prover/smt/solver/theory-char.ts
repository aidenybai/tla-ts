// Ported from Z3 (src/smt/theory_char.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_CHAR,
  OP_ADD,
  OP_CHAR_FROM_BV,
  OP_CHAR_IS_DIGIT,
  OP_CHAR_LE,
  OP_CHAR_TO_BV,
  OP_CHAR_TO_INT,
  OP_ITE,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { BitBlaster } from "./bit-blaster";
import type { Context } from "./context";
import { type Enode, TheoryJustification } from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type Literal, mkLiteral, negate } from "./literal";
import type { ProtoModel } from "./proto-model";
import { isSkolemOf, mkSkolem } from "./seq-decl-plugin";
import { FC_CONTINUE, FC_DONE, Theory } from "./theory";

const BITS2CHAR = "bits2char";
const NO_VALUE = -1;

export class TheoryChar extends Theory {
  readonly name = "char";
  private bits: Literal[][] = [];
  private ebits: number[][] = [];
  private var2value: number[] = [];
  private value2var: number[] = [];
  private bitBlaster: BitBlaster;

  constructor(context: Context) {
    super(context, FAMILY_CHAR);
    this.bitBlaster = new BitBlaster(context.manager);
  }

  private hasBits(thVar: number) {
    return this.bits.length > thVar && this.bits[thVar].length > 0;
  }

  private mkVar(node: Enode) {
    if (this.isAttachedToVar(node)) return node.getThVar(this.id);
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.context.attachThVar(node, this, thVar);
    this.context.markAsRelevant(node.owner);
    return thVar;
  }

  internalizeAtom(term: number) {
    const context = this.context;
    const manager = this.manager;
    for (const arg of manager.getArgs(term)) this.mkVar(this.ensureEnodeOf(arg));
    const boolVar = context.mkBoolVar(term);
    context.setVarTheory(boolVar, this.id);
    context.markAsRelevant(term);
    const op = manager.getOp(term);
    if (op === OP_CHAR_LE) this.internalizeLe(mkLiteral(boolVar), term);
    if (op === OP_CHAR_IS_DIGIT) this.internalizeIsDigit(mkLiteral(boolVar), term);
    return true;
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const manager = this.manager;
    for (const arg of manager.getArgs(term)) this.mkVar(this.ensureEnodeOf(arg));
    const node = context.isEInternalized(term)
      ? context.getEnode(term)!
      : context.mkEnode(term, false, manager.isBool(term), true);
    const thVar = this.mkVar(node);
    const code = manager.getChar(term);
    if (code !== -1) this.newConstChar(thVar, code);
    const op = manager.getOp(term);
    if (op === OP_CHAR_TO_INT) this.newChar2int(thVar, manager.getArg(term, 0));
    else if (op === OP_CHAR_TO_BV || op === OP_CHAR_FROM_BV)
      throw new SmtUnsupportedError("conversions between characters and bit-vectors");
    return true;
  }

  private initBits(thVar: number) {
    if (this.hasBits(thVar)) return;
    const context = this.context;
    const manager = this.manager;
    const expr = this.getExpr(thVar);
    while (this.bits.length <= thVar) this.bits.push([]);
    while (this.ebits.length <= thVar) this.ebits.push([]);
    context.pushTrail(() => {
      this.bits[thVar] = [];
      this.ebits[thVar] = [];
    });
    const bits: Literal[] = [];
    const ebits: number[] = [];
    this.bits[thVar] = bits;
    this.ebits[thVar] = ebits;
    if (isSkolemOf(manager, expr, BITS2CHAR)) {
      for (const arg of manager.getArgs(expr)) {
        ebits.push(arg);
        bits.push(mkLiteral(context.getBoolVar(arg)));
      }
      return;
    }
    for (let index = 0; index < this.manager.charBits; index++) {
      const bit = mkSkolem(manager, "char.bit", [expr], SORT_BOOL, [index], [index]);
      manager.incRef(bit);
      ebits.push(bit);
    }
    for (const bit of ebits) context.internalize(bit, true);
    for (const bit of ebits) bits.push(mkLiteral(context.getBoolVar(bit)));
    for (const bit of bits) context.markLiteralAsRelevant(bit);
    const bits2char = mkSkolem(manager, BITS2CHAR, ebits, manager.sorts[expr]);
    manager.incRef(bits2char);
    context.markAsRelevant(bits2char);
    const first = this.ensureEnodeOf(expr);
    const second = this.ensureEnodeOf(bits2char);
    context.pushEq(first, second, {
      kind: "justification",
      justification: new TheoryJustification(this.id, [], []),
    });
  }

  private internalizeLe(literal: Literal, term: number) {
    const context = this.context;
    const manager = this.manager;
    const first = context.getEnode(manager.getArg(term, 0))!.getThVar(this.id);
    const second = context.getEnode(manager.getArg(term, 1))!.getThVar(this.id);
    this.initBits(first);
    this.initBits(second);
    const le = this.mkLiteralOf(this.bitBlaster.mkUle(this.ebits[first], this.ebits[second]));
    context.markLiteralAsRelevant(le);
    context.mkThAxiom([negate(literal), le]);
    context.mkThAxiom([literal, negate(le)]);
  }

  private internalizeIsDigit(literal: Literal, term: number) {
    const context = this.context;
    const manager = this.manager;
    const zero = this.ensureEnodeOf(manager.mkChar(48));
    const nine = this.ensureEnodeOf(manager.mkChar(57));
    const thVar = context.getEnode(manager.getArg(term, 0))!.getThVar(this.id);
    const zeroVar = zero.getThVar(this.id);
    const nineVar = nine.getThVar(this.id);
    this.initBits(thVar);
    this.initBits(zeroVar);
    this.initBits(nineVar);
    const bits = this.ebits[thVar];
    const atLeastZero = this.bitBlaster.mkUle(this.ebits[zeroVar], bits);
    const atMostNine = this.bitBlaster.mkUle(bits, this.ebits[nineVar]);
    const first = this.mkLiteralOf(atLeastZero);
    const second = this.mkLiteralOf(atMostNine);
    context.mkThAxiom([negate(literal), first]);
    context.mkThAxiom([negate(literal), second]);
    context.mkThAxiom([negate(first), negate(second), literal]);
  }

  private getBits(thVar: number) {
    this.initBits(thVar);
    return this.bits[thVar];
  }

  newEqEh(first: number, second: number) {
    if (!this.hasBits(first) || !this.hasBits(second)) return;
    const context = this.context;
    const firstBits = this.getBits(first);
    const secondBits = this.getBits(second);
    let eqLiteral: Literal | undefined;
    const getEq = () => {
      if (eqLiteral === undefined) {
        eqLiteral = this.mkLiteralOf(this.manager.mkEq(this.getExpr(first), this.getExpr(second)));
        context.markLiteralAsRelevant(eqLiteral);
      }
      return eqLiteral;
    };
    for (let index = firstBits.length - 1; index >= 0; index--) {
      const firstValue = context.getAssignment(firstBits[index]);
      const secondValue = context.getAssignment(secondBits[index]);
      if (firstValue !== L_UNDEF && secondValue !== L_UNDEF && firstValue !== secondValue) {
        this.enforceAckerman(first, second);
        return;
      }
      const firstBit = firstBits[index];
      const secondBit = secondBits[index];
      if (firstValue === L_TRUE) context.mkThAxiom([negate(getEq()), negate(firstBit), secondBit]);
      if (firstValue === L_FALSE) context.mkThAxiom([negate(getEq()), firstBit, negate(secondBit)]);
      if (secondValue === L_TRUE) context.mkThAxiom([negate(getEq()), firstBit, negate(secondBit)]);
      if (secondValue === L_FALSE)
        context.mkThAxiom([negate(getEq()), negate(firstBit), secondBit]);
    }
  }

  newDiseqEh(first: number, second: number) {
    if (!this.hasBits(first) || !this.hasBits(second)) return;
    const context = this.context;
    const firstBits = this.getBits(first);
    const secondBits = this.getBits(second);
    for (let index = firstBits.length - 1; index >= 0; index--) {
      const firstValue = context.getAssignment(firstBits[index]);
      const secondValue = context.getAssignment(secondBits[index]);
      if (firstValue === L_UNDEF || secondValue === L_UNDEF || firstValue !== secondValue) return;
    }
    this.enforceAckerman(first, second);
  }

  private newConstChar(thVar: number, code: number) {
    let rest = code;
    for (const bit of this.getBits(thVar)) {
      this.context.assign((rest & 1) !== 0 ? bit : negate(bit), null);
      rest >>= 1;
    }
  }

  private newChar2int(thVar: number, char: number) {
    const context = this.context;
    const manager = this.manager;
    const charVar = context.getEnode(char)!.getThVar(this.id);
    this.initBits(charVar);
    const sum = this.ebits[charVar].map((bit, position) => {
      const thenValue = manager.mkNumeral(BigInt(1 << position));
      const elseValue = manager.mkNumeral(0n);
      return manager.mkApp(OP_ITE, [bit, thenValue, elseValue], SORT_INT);
    });
    const sumBits = manager.mkApp(OP_ADD, sum, SORT_INT);
    manager.incRef(sumBits);
    const first = this.getEnode(thVar);
    const second = this.ensureEnodeOf(sumBits);
    context.pushEq(first, second, {
      kind: "justification",
      justification: new TheoryJustification(this.id, [], []),
    });
  }

  finalCheckEh() {
    const manager = this.manager;
    const numVars = this.getNumVars();
    this.var2value = Array.from({ length: numVars }, () => NO_VALUE);
    this.value2var = [];
    const values = new Set<number>();
    for (let thVar = numVars - 1; thVar >= 0; thVar--) {
      const code = this.getCharValue(thVar);
      if (!manager.isCharSort(manager.sorts[this.getExpr(thVar)])) continue;
      if (this.var2value[thVar] !== NO_VALUE || code === undefined) continue;
      const root = this.getEnode(thVar).root;
      const other = this.value2var[code] ?? NO_VALUE;
      if (other !== NO_VALUE && root !== this.getEnode(other).root) {
        this.enforceAckerman(other, thVar);
        return FC_CONTINUE;
      }
      if (code > this.manager.maxChar) {
        this.enforceValueBound(thVar);
        return FC_CONTINUE;
      }
      let node = root;
      do {
        const member = node.getThVar(this.id);
        if (member >= 0) {
          const memberCode = this.getCharValue(member);
          if (memberCode !== undefined && memberCode !== code) {
            this.enforceAckerman(member, thVar);
            return FC_CONTINUE;
          }
          this.var2value[member] = code;
        }
        node = node.next;
      } while (node !== root);
      values.add(code);
      this.value2var[code] = thVar;
    }
    let code = 65;
    for (let thVar = numVars - 1; thVar >= 0; thVar--) {
      if (!manager.isCharSort(manager.sorts[this.getExpr(thVar)])) continue;
      if (this.var2value[thVar] !== NO_VALUE) continue;
      const start = code;
      while (values.has(code)) {
        code = (code + 1) % this.manager.maxChar;
        if (start === code) {
          this.enforceBits();
          return FC_CONTINUE;
        }
      }
      const first = this.getEnode(thVar);
      let node = first;
      do {
        this.var2value[node.getThVar(this.id)] = code;
        node = node.next;
      } while (node !== first);
      this.value2var[code] = thVar;
      values.add(code);
    }
    return FC_DONE;
  }

  private enforceBits() {
    const manager = this.manager;
    for (let thVar = this.getNumVars() - 1; thVar >= 0; thVar--) {
      const node = this.getEnode(thVar);
      if (
        manager.isCharSort(manager.sorts[node.owner]) &&
        node.root === node &&
        !this.hasBits(thVar)
      )
        this.initBits(thVar);
    }
  }

  private enforceValueBound(thVar: number) {
    const node = this.ensureEnodeOf(this.manager.mkChar(this.manager.maxChar));
    const maxVar = node.getThVar(this.id);
    this.initBits(maxVar);
    this.initBits(thVar);
    const le = this.bitBlaster.mkUle(this.ebits[thVar], this.ebits[maxVar]);
    this.context.assign(this.mkLiteralOf(le), null);
  }

  private enforceAckerman(inputFirst: number, inputSecond: number) {
    const context = this.context;
    const first = Math.min(inputFirst, inputSecond);
    const second = Math.max(inputFirst, inputSecond);
    const eq = this.mkLiteralOf(this.manager.mkEq(this.getExpr(first), this.getExpr(second)));
    context.markLiteralAsRelevant(eq);
    const literals: Literal[] = [];
    this.initBits(first);
    this.initBits(second);
    const firstBits = this.ebits[first];
    const secondBits = this.ebits[second];
    for (let index = firstBits.length - 1; index >= 0; index--) {
      const bitEq = this.mkEqLiteral(firstBits[index], secondBits[index], false);
      literals.push(negate(bitEq));
      context.markLiteralAsRelevant(bitEq);
      context.mkThAxiom([negate(eq), bitEq]);
    }
    literals.push(eq);
    context.mkThAxiom(literals);
  }

  private getCharValue(thVar: number) {
    if (!this.hasBits(thVar)) return undefined;
    let code = 0;
    let power = 1;
    for (const literal of this.bits[thVar]) {
      if (this.context.getAssignment(literal) === L_TRUE) code += power;
      power *= 2;
    }
    return code;
  }

  initModel(model: ProtoModel) {
    const factory = model.getCharFactory();
    for (const value of this.var2value) if (value !== NO_VALUE) factory.registerValue(value);
  }

  mkValue(node: Enode) {
    return this.manager.mkChar(this.var2value[node.getThVar(this.id)]);
  }
}
