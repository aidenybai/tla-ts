// Ported from Z3 (src/ast/rewriter/bit_blaster/bit_blaster_tpl_def.h,
// src/ast/rewriter/bit_blaster/bit_blaster.cpp,
// src/ast/rewriter/bit_blaster/bit_blaster_rewriter.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError } from "../../../errors";
import type { AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { assign, assignOwned, release } from "./expr-ref";
import { Rewriter } from "./rewriter";

// Z3's default bool_rewriter parameters, after set_flat_and_or(false).
const BOOL_REWRITER_OPTIONS = {
  isEliminatingAnd: false,
  arith: TACTIC_ARITH_OPTIONS,
  isRewritingPatterns: false,
  isFlatAndOr: false,
};

type Bits = readonly number[];

export class BitBlaster {
  private rewriter: Rewriter;

  // isBlasterCfg: the blaster_cfg of bit_blaster_rewriter, whose bool_rewriter eliminates and and
  // whose xor3 and carry don't sort their arguments.
  constructor(
    private manager: AstManager,
    private isBlasterCfg = false,
  ) {
    this.rewriter = new Rewriter(manager, {
      ...BOOL_REWRITER_OPTIONS,
      isEliminatingAnd: isBlasterCfg,
    });
  }

  private checkpoint() {
    if (!this.manager.limit.inc()) throw new SmtCanceledError();
  }

  private own(expr: number) {
    this.manager.incRef(expr);
    return expr;
  }

  private drop(expr: number) {
    this.manager.decRef(expr);
  }

  private dropAll(exprs: number[]) {
    for (const expr of exprs) this.manager.decRef(expr);
  }

  private isBoolConst(expr: number) {
    return expr === this.manager.trueExpr || expr === this.manager.falseExpr;
  }

  // blaster_cfg's bool_rewriter releases the conjunction that eliminating and makes, so its
  // temporaries are held until it returns.
  private beginRewrite() {
    return this.isBlasterCfg ? this.manager.beginTemporaries() : -1;
  }

  private endRewrite(result: number, outer: number) {
    this.manager.incRef(result);
    if (this.isBlasterCfg) this.manager.endTemporaries(outer);
    return result;
  }

  mkNot(arg: number) {
    const outer = this.beginRewrite();
    return this.endRewrite(this.rewriter.mkNot(arg), outer);
  }

  mkAnd(args: number[]) {
    const outer = this.beginRewrite();
    return this.endRewrite(this.rewriter.mkAnd(args), outer);
  }

  mkOr(args: number[]) {
    const outer = this.beginRewrite();
    return this.endRewrite(this.rewriter.mkOr(args), outer);
  }

  mkIff(first: number, second: number) {
    const outer = this.beginRewrite();
    return this.endRewrite(this.rewriter.mkEq(first, second), outer);
  }

  // previous: the argument's expr_ref Z3 assigns the result to, released before the temporaries.

  mkXor(first: number, second: number, previous = -1) {
    const negation = this.mkNot(first);
    const result = this.mkIff(negation, second);
    release(this.manager, previous);
    this.drop(negation);
    return result;
  }

  mkIte(condition: number, thenExpr: number, elseExpr: number) {
    const outer = this.beginRewrite();
    const result = this.rewriter.mkIte(condition, thenExpr, elseExpr);
    return this.endRewrite(typeof result === "number" ? result : result.expr, outer);
  }

  private mkNand(first: number, second: number) {
    const conjunction = this.mkAnd([first, second]);
    const result = this.mkNot(conjunction);
    this.drop(conjunction);
    return result;
  }

  private mkNor(first: number, second: number) {
    const disjunction = this.mkOr([first, second]);
    const result = this.mkNot(disjunction);
    this.drop(disjunction);
    return result;
  }

  private mkGe2(first: number, second: number, third: number, previous: number) {
    const manager = this.manager;
    const result = manager.isFalse(first)
      ? this.mkAnd([second, third])
      : manager.isFalse(second)
        ? this.mkAnd([first, third])
        : manager.isFalse(third)
          ? this.mkAnd([first, second])
          : manager.isTrue(first)
            ? this.mkOr([second, third])
            : manager.isTrue(second)
              ? this.mkOr([first, third])
              : manager.isTrue(third)
                ? this.mkOr([first, second])
                : -1;
    if (result !== -1) {
      release(manager, previous);
      return result;
    }
    const pair1 = this.mkAnd([first, second]);
    const pair2 = this.mkAnd([first, third]);
    const pair3 = this.mkAnd([second, third]);
    const disjunction = this.mkOr([pair1, pair2, pair3]);
    release(manager, previous);
    this.drop(pair3);
    this.drop(pair2);
    this.drop(pair1);
    return disjunction;
  }

  private sortArgs(first: number, second: number, third: number) {
    const ids = this.manager.ids;
    return [first, second, third].sort((left, right) => ids[left] - ids[right]);
  }

  private mkXor3(first: number, second: number, third: number, previous = -1) {
    if (this.isBlasterCfg) {
      const partial = this.mkXor(second, third);
      const result = this.mkXor(first, partial, previous);
      this.drop(partial);
      return result;
    }
    const sorted = this.sortArgs(first, second, third);
    const partial = this.mkXor(sorted[0], sorted[1]);
    const result = this.mkXor(partial, sorted[2], previous);
    this.drop(partial);
    return result;
  }

  private mkCarry(first: number, second: number, third: number) {
    const sorted = this.isBlasterCfg ? [first, second, third] : this.sortArgs(first, second, third);
    const pair1 = this.mkAnd([sorted[0], sorted[1]]);
    const pair2 = this.mkAnd([sorted[0], sorted[2]]);
    const pair3 = this.mkAnd([sorted[1], sorted[2]]);
    const result = this.mkOr([pair1, pair2, pair3]);
    this.drop(pair3);
    this.drop(pair2);
    this.drop(pair1);
    return result;
  }

  private getNumeral(bits: Bits) {
    const manager = this.manager;
    let value = 0n;
    for (let index = bits.length - 1; index >= 0; index--) {
      if (manager.isTrue(bits[index])) value = value * 2n + 1n;
      else if (manager.isFalse(bits[index])) value *= 2n;
      else return undefined;
    }
    return value;
  }

  private isMinusOne(bits: Bits) {
    return bits.every((bit) => this.manager.isTrue(bit));
  }

  num2bits(value: bigint, size: number, out: number[]) {
    for (let index = 0; index < size; index++)
      out.push(
        this.own(
          ((value >> BigInt(index)) & 1n) === 1n ? this.manager.trueExpr : this.manager.falseExpr,
        ),
      );
  }

  mkNeg(bits: Bits, out: number[]) {
    const manager = this.manager;
    const size = bits.length;
    let carryIn = this.own(manager.trueExpr);
    let carryOut = -1;
    let output = -1;
    for (let index = 0; index < size; index++) {
      const negation = this.mkNot(bits[index]);
      output = assignOwned(manager, output, this.mkXor(negation, carryIn));
      if (index < size - 1)
        carryOut = assignOwned(manager, carryOut, this.mkAnd([negation, carryIn]));
      out.push(this.own(output));
      carryIn = assign(manager, carryIn, carryOut);
      this.drop(negation);
    }
    release(manager, output);
    release(manager, carryOut);
    release(manager, carryIn);
  }

  mkAdder(first: Bits, second: Bits, out: number[]) {
    const manager = this.manager;
    const size = first.length;
    let carryIn = this.own(manager.falseExpr);
    let carryOut = -1;
    let output = -1;
    for (let index = 0; index < size; index++) {
      output = assignOwned(manager, output, this.mkXor3(first[index], second[index], carryIn));
      if (index < size - 1)
        carryOut = assignOwned(
          manager,
          carryOut,
          this.mkCarry(first[index], second[index], carryIn),
        );
      out.push(this.own(output));
      carryIn = assign(manager, carryIn, carryOut);
    }
    release(manager, output);
    release(manager, carryOut);
    release(manager, carryIn);
  }

  // The carry out of the last bit, which it returns, is first >= second.
  mkSubtracter(first: Bits, second: Bits, out: number[]) {
    const manager = this.manager;
    let carryIn = this.own(manager.trueExpr);
    let carryOut = -1;
    let output = -1;
    for (let index = 0; index < first.length; index++) {
      const negation = this.mkNot(second[index]);
      output = assignOwned(manager, output, this.mkXor3(first[index], negation, carryIn));
      carryOut = assignOwned(manager, carryOut, this.mkCarry(first[index], negation, carryIn));
      out.push(this.own(output));
      carryIn = assign(manager, carryIn, carryOut);
      this.drop(negation);
    }
    release(manager, output);
    release(manager, carryIn);
    return carryOut;
  }

  mkMultiplier(inputFirst: Bits, inputSecond: Bits, out: number[]) {
    const manager = this.manager;
    const size = inputFirst.length;
    const isFirstNumeral = this.getNumeral(inputFirst) !== undefined;
    const first = isFirstNumeral ? inputSecond : inputFirst;
    const second = isFirstNumeral ? inputFirst : inputSecond;
    if (this.isMinusOne(second)) {
      this.mkNeg(first, out);
      return;
    }
    const firstValue = this.getNumeral(first);
    const secondValue = this.getNumeral(second);
    if (firstValue !== undefined && secondValue !== undefined) {
      this.num2bits(firstValue * secondValue, size, out);
      return;
    }
    if (this.mkConstCaseMultiplier(first, second, out)) return;
    let carryIns: number[] = [];
    let carryOuts: number[] = [];
    let output = this.mkAnd([first[0], second[0]]);
    let carryOut = -1;
    out.push(this.own(output));
    for (let index = 1; index < size; index++) {
      this.checkpoint();
      this.dropAll(carryOuts);
      carryOuts = [];
      const product1 = this.mkAnd([first[0], second[index]]);
      const product2 = this.mkAnd([first[1], second[index - 1]]);
      if (index < size - 1) {
        output = assignOwned(manager, output, this.mkXor(product1, product2));
        carryOut = assignOwned(manager, carryOut, this.mkAnd([product1, product2]));
        carryOuts.push(this.own(carryOut));
        for (let column = 2; column <= index; column++) {
          const previous = this.own(output);
          const product3 = this.mkAnd([first[column], second[index - column]]);
          const carry = carryIns[column - 2];
          output = assignOwned(manager, output, this.mkXor3(product3, previous, carry));
          carryOut = assignOwned(manager, carryOut, this.mkCarry(product3, previous, carry));
          carryOuts.push(this.own(carryOut));
          this.drop(product3);
          this.drop(previous);
        }
        out.push(this.own(output));
        const swapped = carryIns;
        carryIns = carryOuts;
        carryOuts = swapped;
      } else {
        output = assignOwned(manager, output, this.mkXor(product1, product2));
        for (let column = 2; column <= index; column++) {
          const product3 = this.mkAnd([first[column], second[index - column]]);
          output = this.mkXor3(product3, output, carryIns[column - 2], output);
          this.drop(product3);
        }
        out.push(this.own(output));
      }
      this.drop(product2);
      this.drop(product1);
    }
    release(manager, carryOut);
    this.drop(output);
    this.dropAll(carryOuts);
    this.dropAll(carryIns);
  }

  private mkConstCaseMultiplier(first: Bits, second: Bits, out: number[]) {
    const size = first.length;
    let caseSize = 1;
    const circuitSize = size * size * 5;
    for (let index = 0; caseSize < circuitSize && index < size; index++) {
      if (!this.isBoolConst(first[index])) caseSize *= 2;
      if (!this.isBoolConst(second[index])) caseSize *= 2;
    }
    if (caseSize >= circuitSize || size >= 100) return false;
    this.mkConstCaseMultiplierCore(true, 0, [...first], [...second], out);
    return true;
  }

  private mkConstCaseMultiplierCore(
    inputIsFirst: boolean,
    start: number,
    first: number[],
    second: number[],
    out: number[],
  ) {
    const manager = this.manager;
    const size = first.length;
    let isFirst = inputIsFirst;
    let index = start;
    while (isFirst && index < size && this.isBoolConst(first[index])) index++;
    if (isFirst && index === size) {
      isFirst = false;
      index = 0;
    }
    while (!isFirst && index < size && this.isBoolConst(second[index])) index++;
    if (index === size) {
      this.num2bits((this.getNumeral(first) ?? 0n) * (this.getNumeral(second) ?? 0n), size, out);
      return;
    }
    const bits = isFirst ? first : second;
    const split = this.own(bits[index]);
    const whenTrue: number[] = [];
    const whenFalse: number[] = [];
    bits[index] = manager.trueExpr;
    this.mkConstCaseMultiplierCore(isFirst, index + 1, first, second, whenTrue);
    bits[index] = manager.falseExpr;
    this.mkConstCaseMultiplierCore(isFirst, index + 1, first, second, whenFalse);
    bits[index] = split;
    let bit = -1;
    for (let position = 0; position < size; position++) {
      bit = assignOwned(manager, bit, this.mkIte(split, whenTrue[position], whenFalse[position]));
      out.push(this.own(bit));
    }
    release(manager, bit);
    this.drop(split);
    this.dropAll(whenFalse);
    this.dropAll(whenTrue);
  }

  private mkUdivUrem(first: Bits, second: Bits, quotient: number[], remainder: number[]) {
    const manager = this.manager;
    const size = first.length;
    const partial = remainder;
    partial.push(this.own(first[size - 1]));
    for (let index = 1; index < size; index++) partial.push(this.own(manager.falseExpr));
    for (let index = 0; index < size; index++) quotient.push(-1);
    const difference: number[] = [];
    for (let index = 0; index < size; index++) {
      this.checkpoint();
      this.dropAll(difference);
      difference.length = 0;
      const bit = this.mkSubtracter(partial, second, difference);
      quotient[size - index - 1] = bit;
      if (index < size - 1) {
        for (let position = size - 1; position > 0; position--) {
          const selected = this.mkIte(bit, difference[position - 1], partial[position - 1]);
          this.drop(partial[position]);
          partial[position] = selected;
        }
        this.drop(partial[0]);
        partial[0] = this.own(first[size - index - 2]);
      } else
        for (let position = 0; position < size; position++) {
          const selected = this.mkIte(bit, difference[position], partial[position]);
          this.drop(partial[position]);
          partial[position] = selected;
        }
    }
    this.dropAll(difference);
  }

  mkUdiv(first: Bits, second: Bits, out: number[]) {
    const remainder: number[] = [];
    this.mkUdivUrem(first, second, out, remainder);
    this.dropAll(remainder);
  }

  mkUrem(first: Bits, second: Bits, out: number[]) {
    const quotient: number[] = [];
    this.mkUdivUrem(first, second, quotient, out);
    this.dropAll(quotient);
  }

  mkMultiplexer(condition: number, thenBits: Bits, elseBits: Bits, out: number[]) {
    for (let index = 0; index < thenBits.length; index++)
      out.push(this.mkIte(condition, thenBits[index], elseBits[index]));
  }

  private mkAbs(bits: Bits, out: number[]) {
    const manager = this.manager;
    const sign = bits[bits.length - 1];
    if (manager.isFalse(sign)) {
      for (const bit of bits) out.push(this.own(bit));
      return;
    }
    if (manager.isTrue(sign)) {
      this.mkNeg(bits, out);
      return;
    }
    const negated: number[] = [];
    this.mkNeg(bits, negated);
    this.mkMultiplexer(sign, negated, bits, out);
    this.dropAll(negated);
  }

  mkSdiv(first: Bits, second: Bits, out: number[]) {
    const manager = this.manager;
    const size = first.length;
    const firstSign = first[size - 1];
    const secondSign = second[size - 1];
    const isFirstPositive = manager.isFalse(firstSign);
    const isFirstNegative = manager.isTrue(firstSign);
    const isSecondPositive = manager.isFalse(secondSign);
    const isSecondNegative = manager.isTrue(secondSign);
    if (isFirstPositive && isSecondPositive) {
      this.mkUdiv(first, second, out);
      return;
    }
    if ((isFirstPositive || isFirstNegative) && (isSecondPositive || isSecondNegative)) {
      const negatedFirst: number[] = [];
      const negatedSecond: number[] = [];
      if (isFirstNegative) this.mkNeg(first, negatedFirst);
      if (isSecondNegative) this.mkNeg(second, negatedSecond);
      const dividend = isFirstNegative ? negatedFirst : first;
      const divisor = isSecondNegative ? negatedSecond : second;
      if (isFirstNegative && isSecondNegative) this.mkUdiv(dividend, divisor, out);
      else {
        const quotient: number[] = [];
        this.mkUdiv(dividend, divisor, quotient);
        this.mkNeg(quotient, out);
        this.dropAll(quotient);
      }
      this.dropAll(negatedSecond);
      this.dropAll(negatedFirst);
      return;
    }
    const absFirst: number[] = [];
    const absSecond: number[] = [];
    this.mkAbs(first, absFirst);
    this.mkAbs(second, absSecond);
    const quotient: number[] = [];
    this.mkUdiv(absFirst, absSecond, quotient);
    const negatedQuotient: number[] = [];
    this.mkNeg(quotient, negatedQuotient);
    const isSameSign = this.mkIff(firstSign, secondSign);
    this.mkMultiplexer(isSameSign, quotient, negatedQuotient, out);
    this.drop(isSameSign);
    this.dropAll(negatedQuotient);
    this.dropAll(quotient);
    this.dropAll(absSecond);
    this.dropAll(absFirst);
  }

  mkSrem(first: Bits, second: Bits, out: number[]) {
    const manager = this.manager;
    const size = first.length;
    const firstSign = first[size - 1];
    const secondSign = second[size - 1];
    const isFirstPositive = manager.isFalse(firstSign);
    const isFirstNegative = manager.isTrue(firstSign);
    const isSecondPositive = manager.isFalse(secondSign);
    const isSecondNegative = manager.isTrue(secondSign);
    if (isFirstPositive && isSecondPositive) {
      this.mkUrem(first, second, out);
      return;
    }
    if ((isFirstPositive || isFirstNegative) && (isSecondPositive || isSecondNegative)) {
      const negatedFirst: number[] = [];
      const negatedSecond: number[] = [];
      if (isFirstNegative) this.mkNeg(first, negatedFirst);
      if (isSecondNegative) this.mkNeg(second, negatedSecond);
      const dividend = isFirstNegative ? negatedFirst : first;
      const divisor = isSecondNegative ? negatedSecond : second;
      if (!isFirstNegative) this.mkUrem(dividend, divisor, out);
      else {
        const remainder: number[] = [];
        this.mkUrem(dividend, divisor, remainder);
        this.mkNeg(remainder, out);
        this.dropAll(remainder);
      }
      this.dropAll(negatedSecond);
      this.dropAll(negatedFirst);
      return;
    }
    const absFirst: number[] = [];
    const absSecond: number[] = [];
    this.mkAbs(first, absFirst);
    this.mkAbs(second, absSecond);
    const remainder: number[] = [];
    const divisor = this.getNumeral(absSecond);
    const shift =
      divisor !== undefined && divisor > 0n && (divisor & (divisor - 1n)) === 0n
        ? divisor.toString(2).length - 1
        : -1;
    if (shift !== -1) this.mkZeroExtend(absFirst.slice(0, shift), size - shift, remainder);
    else this.mkUrem(absFirst, absSecond, remainder);
    const negatedRemainder: number[] = [];
    this.mkNeg(remainder, negatedRemainder);
    this.mkMultiplexer(firstSign, negatedRemainder, remainder, out);
    this.dropAll(negatedRemainder);
    this.dropAll(remainder);
    this.dropAll(absSecond);
    this.dropAll(absFirst);
  }

  mkSmod(first: Bits, second: Bits, out: number[]) {
    const size = first.length;
    const firstSign = first[size - 1];
    const secondSign = second[size - 1];
    const absFirst: number[] = [];
    const absSecond: number[] = [];
    this.mkAbs(first, absFirst);
    this.mkAbs(second, absSecond);
    const remainder: number[] = [];
    this.mkUrem(absFirst, absSecond, remainder);
    const negatedRemainder: number[] = [];
    this.mkNeg(remainder, negatedRemainder);
    const negatedPlusSecond: number[] = [];
    this.mkAdder(negatedRemainder, second, negatedPlusSecond);
    const remainderPlusSecond: number[] = [];
    this.mkAdder(remainder, second, remainderPlusSecond);
    const zero: number[] = [];
    this.num2bits(0n, size, zero);
    const isZero = this.mkEq(remainder, zero);
    const negativeCase: number[] = [];
    const positiveCase: number[] = [];
    const body: number[] = [];
    this.mkMultiplexer(secondSign, negatedRemainder, negatedPlusSecond, negativeCase);
    this.mkMultiplexer(secondSign, remainderPlusSecond, remainder, positiveCase);
    this.mkMultiplexer(firstSign, negativeCase, positiveCase, body);
    this.mkMultiplexer(isZero, remainder, body, out);
    this.dropAll(body);
    this.dropAll(positiveCase);
    this.dropAll(negativeCase);
    this.drop(isZero);
    this.dropAll(zero);
    this.dropAll(remainderPlusSecond);
    this.dropAll(negatedPlusSecond);
    this.dropAll(negatedRemainder);
    this.dropAll(remainder);
    this.dropAll(absSecond);
    this.dropAll(absFirst);
  }

  mkEq(first: Bits, second: Bits) {
    const equivalences: number[] = [];
    for (let index = 0; index < first.length; index++)
      equivalences.push(this.mkIff(first[index], second[index]));
    const result = this.mkAnd(equivalences);
    this.dropAll(equivalences);
    return result;
  }

  mkRotateLeft(bits: Bits, amount: number, out: number[]) {
    const size = bits.length;
    const shift = amount % size;
    for (let index = size - shift; index < size; index++) out.push(this.own(bits[index]));
    for (let index = 0; index < size - shift; index++) out.push(this.own(bits[index]));
  }

  mkRotateRight(bits: Bits, amount: number, out: number[]) {
    this.mkRotateLeft(bits, bits.length - (amount % bits.length), out);
  }

  mkSignExtend(bits: Bits, amount: number, out: number[]) {
    for (const bit of bits) out.push(this.own(bit));
    for (let index = 0; index < amount; index++) out.push(this.own(bits[bits.length - 1]));
  }

  mkZeroExtend(bits: Bits, amount: number, out: number[]) {
    for (const bit of bits) out.push(this.own(bit));
    for (let index = 0; index < amount; index++) out.push(this.own(this.manager.falseExpr));
  }

  private mkShift(bits: Bits, amountBits: Bits, isLeft: boolean, fill: number, out: number[]) {
    const manager = this.manager;
    const size = bits.length;
    const amount = this.getNumeral(amountBits);
    if (amount !== undefined) {
      const shift = amount > BigInt(size) ? size : Number(amount);
      if (isLeft) {
        for (let index = 0; index < shift; index++) out.push(this.own(fill));
        for (let index = 0; index + shift < size; index++) out.push(this.own(bits[index]));
      } else {
        for (let index = shift; index < size; index++) out.push(this.own(bits[index]));
        for (let index = size - shift; index < size; index++) out.push(this.own(fill));
      }
      return;
    }
    let current = bits.map((bit) => this.own(bit));
    let stage = 0;
    for (; stage < size; stage++) {
      this.checkpoint();
      const shift = 2 ** stage;
      if (shift >= size) break;
      const next: number[] = [];
      for (let index = 0; index < size; index++) {
        const source = isLeft ? index - shift : index + shift;
        const shifted = source >= 0 && source < size ? current[source] : fill;
        next.push(this.mkIte(amountBits[stage], shifted, current[index]));
      }
      this.dropAll(current);
      current = next;
    }
    let isLarge = this.own(manager.falseExpr);
    for (; stage < size; stage++)
      isLarge = assignOwned(manager, isLarge, this.mkOr([isLarge, amountBits[stage]]));
    for (let index = 0; index < size; index++) {
      const selected = this.mkIte(isLarge, fill, current[index]);
      this.drop(current[index]);
      current[index] = selected;
    }
    this.drop(isLarge);
    for (const bit of current) out.push(bit);
  }

  mkShl(bits: Bits, amountBits: Bits, out: number[]) {
    this.mkShift(bits, amountBits, true, this.manager.falseExpr, out);
  }

  mkLshr(bits: Bits, amountBits: Bits, out: number[]) {
    this.mkShift(bits, amountBits, false, this.manager.falseExpr, out);
  }

  mkAshr(bits: Bits, amountBits: Bits, out: number[]) {
    this.mkShift(bits, amountBits, false, bits[bits.length - 1], out);
  }

  private mkExtRotate(bits: Bits, amountBits: Bits, isLeft: boolean, out: number[]) {
    const size = bits.length;
    const amount = this.getNumeral(amountBits);
    if (amount !== undefined && amount < 2n ** 32n) {
      if (isLeft) this.mkRotateLeft(bits, Number(amount % BigInt(size)), out);
      else this.mkRotateRight(bits, Number(amount % BigInt(size)), out);
      return;
    }
    let current: number[] = bits.map((bit) => this.own(bit));
    const isPowerOfTwo = (size & (size - 1)) === 0;
    for (let index = 0, power = 1; index < size; index++) {
      const bit = amountBits[index];
      if (!this.manager.isFalse(bit)) {
        const next: number[] = [];
        for (let position = 0; position < size; position++) {
          const source = (isLeft ? size + position - power : position + power) % size;
          next.push(this.mkIte(bit, current[source], current[position]));
        }
        this.dropAll(current);
        current = next;
      }
      power *= 2;
      if (isPowerOfTwo && size === power) break;
      power %= size;
    }
    for (const bit of current) out.push(bit);
  }

  mkExtRotateLeft(bits: Bits, amountBits: Bits, out: number[]) {
    this.mkExtRotate(bits, amountBits, true, out);
  }

  mkExtRotateRight(bits: Bits, amountBits: Bits, out: number[]) {
    this.mkExtRotate(bits, amountBits, false, out);
  }

  private mkLe(first: Bits, second: Bits, isSigned: boolean) {
    const size = first.length;
    let negation = this.mkNot(first[0]);
    let result = this.mkOr([negation, second[0]]);
    const manager = this.manager;
    for (let index = 1; index < (isSigned ? size - 1 : size); index++) {
      negation = assignOwned(manager, negation, this.mkNot(first[index]));
      result = this.mkGe2(negation, second[index], result, result);
    }
    if (isSigned) {
      const negatedSign = this.mkNot(second[size - 1]);
      result = this.mkGe2(negatedSign, first[size - 1], result, result);
      this.drop(negatedSign);
    }
    this.drop(negation);
    return result;
  }

  mkSle(first: Bits, second: Bits) {
    return this.mkLe(first, second, true);
  }

  mkUle(first: Bits, second: Bits) {
    return this.mkLe(first, second, false);
  }

  mkNotBits(bits: Bits, out: number[]) {
    for (const bit of bits) out.push(this.mkNot(bit));
  }

  mkAndBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkAnd([first[index], second[index]]));
  }

  mkOrBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkOr([first[index], second[index]]));
  }

  mkXorBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkXor(first[index], second[index]));
  }

  mkXnorBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkIff(first[index], second[index]));
  }

  mkNandBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkNand(first[index], second[index]));
  }

  mkNorBits(first: Bits, second: Bits, out: number[]) {
    for (let index = 0; index < first.length; index++)
      out.push(this.mkNor(first[index], second[index]));
  }

  mkRedand(bits: Bits, out: number[]) {
    out.push(this.mkAnd([...bits]));
  }

  mkRedor(bits: Bits, out: number[]) {
    out.push(this.mkOr([...bits]));
  }

  mkComp(first: Bits, second: Bits, out: number[]) {
    out.push(this.mkEq(first, second));
  }

  mkUmulNoOverflow(first: Bits, second: Bits) {
    const manager = this.manager;
    const size = first.length;
    const product: number[] = [];
    this.mkMultiplier([...first, manager.falseExpr], [...second, manager.falseExpr], product);
    const overflow1 = this.own(product[size]);
    let accumulated = this.own(manager.falseExpr);
    let overflow2 = this.own(manager.falseExpr);
    let term = -1;
    for (let index = 1; index < size; index++) {
      accumulated = assignOwned(
        manager,
        accumulated,
        this.mkOr([accumulated, first[size - index]]),
      );
      term = assignOwned(manager, term, this.mkAnd([accumulated, second[index]]));
      overflow2 = assignOwned(manager, overflow2, this.mkOr([term, overflow2]));
    }
    const overflow = this.mkOr([overflow1, overflow2]);
    const result = this.mkNot(overflow);
    release(manager, term);
    this.drop(overflow2);
    this.drop(accumulated);
    this.drop(overflow);
    this.drop(overflow1);
    this.dropAll(product);
    return result;
  }

  private mkSmulNoOverflowCore(first: Bits, second: Bits, isOverflow: boolean) {
    const manager = this.manager;
    const size = first.length;
    const product: number[] = [];
    this.mkMultiplier([...first, first[size - 1]], [...second, second[size - 1]], product);
    const overflow1 = this.mkXor(product[size], product[size - 1]);
    let term = -1;
    let firstDiffers = -1;
    let secondDiffers = -1;
    let accumulated = this.own(manager.falseExpr);
    let overflow2 = this.own(manager.falseExpr);
    for (let index = 1; index + 1 < size; index++) {
      secondDiffers = assignOwned(
        manager,
        secondDiffers,
        this.mkXor(second[size - 1], second[index]),
      );
      firstDiffers = assignOwned(
        manager,
        firstDiffers,
        this.mkXor(first[size - 1], first[size - 1 - index]),
      );
      accumulated = assignOwned(manager, accumulated, this.mkOr([firstDiffers, accumulated]));
      term = assignOwned(manager, term, this.mkAnd([accumulated, secondDiffers]));
      overflow2 = assignOwned(manager, overflow2, this.mkOr([term, overflow2]));
    }
    let overflow = this.mkOr([overflow1, overflow2]);
    const sign = isOverflow
      ? this.mkIff(first[size - 1], second[size - 1])
      : this.mkXor(first[size - 1], second[size - 1]);
    overflow = assignOwned(manager, overflow, this.mkAnd([sign, overflow]));
    const result = this.mkNot(overflow);
    this.drop(sign);
    this.drop(accumulated);
    release(manager, secondDiffers);
    release(manager, firstDiffers);
    release(manager, term);
    this.drop(overflow2);
    this.drop(overflow);
    this.drop(overflow1);
    this.dropAll(product);
    return result;
  }

  mkSmulNoOverflow(first: Bits, second: Bits) {
    return this.mkSmulNoOverflowCore(first, second, true);
  }

  mkSmulNoUnderflow(first: Bits, second: Bits) {
    return this.mkSmulNoOverflowCore(first, second, false);
  }
}
