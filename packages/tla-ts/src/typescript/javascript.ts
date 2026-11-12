import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol, getUndefined, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import { formatString } from "../printer";
import { getNumberValue, translateBigInt, translateExpression } from "./expressions";
import type { Scope } from "./scope";
import { getKind, isBigIntLike } from "./types";
import { apply, boolean, identifier, ifExpression, number, set, string } from "./tla";

// The names of the well-known symbols, such as iterator for Symbol.iterator.
export const WELL_KNOWN_SYMBOLS = [
  "asyncDispose",
  "asyncIterator",
  "dispose",
  "hasInstance",
  "isConcatSpreadable",
  "iterator",
  "match",
  "matchAll",
  "replace",
  "search",
  "species",
  "split",
  "toPrimitive",
  "toStringTag",
  "unscopables",
];

export const JAVASCRIPT_MODULE = `------------------------------ MODULE JavaScript ------------------------------
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Undefined, Null, Ref, Big, BuiltIns, ConstantFunctions, Symbols, Fractions,
          NaN, Infinity, NegativeInfinity, NegativeZero

LOCAL Digits == {"-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

\\* The numbers that TLA+ integers can't hold.
SpecialNumbers == {NaN, Infinity, NegativeInfinity, NegativeZero}

LOCAL Infinities == {Infinity, NegativeInfinity}

\\* The names of the well-known symbols, which are the first model values in Symbols. The rest stand
\\* for the symbols that a script makes, in the order it makes them.
LOCAL WellKnownSymbols == <<${WELL_KNOWN_SYMBOLS.map((name) => `"${name}"`).join(", ")}>>

\\* A model value equals only a model value, so this compares a value of any kind with Symbols.
IsSymbol(value) == \\E position \\in DOMAIN Symbols : Symbols[position] = value

\\* Fractions holds the numbers that a script's literals give and that aren't integers, with their
\\* negations, from the least. Each is a model value with its text, its floor, and Math.round of it.
IsFraction(value) == \\E position \\in DOMAIN Fractions : Fractions[position].value = value

LOCAL FractionPosition(value) ==
  CHOOSE position \\in DOMAIN Fractions : Fractions[position].value = value

LOCAL Floor(value) == Fractions[FractionPosition(value)].floor

\\* ToIntegerOrInfinity of a fraction.
LOCAL Truncate(value) == IF Floor(value) < 0 THEN Floor(value) + 1 ELSE Floor(value)

LOCAL SymbolPosition(symbol) == CHOOSE position \\in DOMAIN Symbols : Symbols[position] = symbol

\\* A BigInt, which tla-ts holds as its integer under the model value Big.
IsBigInt(value) ==
  LET text == ToString(value)
  IN Len(text) >= 7 /\\ SubSeq(text, 1, 7) = "(Big :>"

TypeOf(value) ==
  LET text == ToString(value)
      first == SubSeq(text, 1, 1)
  IN CASE value = Undefined -> "undefined"
       [] value = Null -> "object"
       [] value \\in SpecialNumbers -> "number"
       [] text \\in {"TRUE", "FALSE"} -> "boolean"
       [] first = "\\"" -> "string"
       [] \\A i \\in 1..Len(text) : SubSeq(text, i, i) \\in Digits -> "number"
       [] IsBigInt(value) -> "bigint"
       [] first \\in {"[", "<", "{", "("} \\cup Digits -> "object"
       [] IsSymbol(value) -> "symbol"
       [] IsFraction(value) -> "number"
       [] OTHER -> "function"

\\* TLC can't tell whether a value that isn't an integer is in Int, so this asks TypeOf.
IsNumber(value) == TypeOf(value) = "number"

LOCAL IsInteger(value) == IsNumber(value) /\\ value \\notin SpecialNumbers /\\ ~IsFraction(value)

\\* Whether a value is a number other than NaN and the infinities.
IsFinite(value) == IsInteger(value) \\/ value = NegativeZero \\/ IsFraction(value)

LOCAL IsZero(value) == value = 0 \\/ value = NegativeZero

LOCAL IsNegative(value) ==
  \\/ value = NegativeZero
  \\/ value = NegativeInfinity
  \\/ IsFraction(value) /\\ Floor(value) < 0
  \\/ IsInteger(value) /\\ value < 0

LOCAL Magnitude(value) == IF value = NegativeZero THEN 0 ELSE value

LOCAL Absolute(value) == IF value < 0 THEN -value ELSE value

Negate(value) ==
  CASE value = NaN -> NaN
    [] value = Infinity -> NegativeInfinity
    [] value = NegativeInfinity -> Infinity
    [] value = NegativeZero -> 0
    [] value = 0 -> NegativeZero
    [] IsFraction(value) -> Fractions[Len(Fractions) + 1 - FractionPosition(value)].value
    [] OTHER -> -value

Add(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] left \\in Infinities /\\ right \\in Infinities -> IF left = right THEN left ELSE NaN
    [] left \\in Infinities -> left
    [] right \\in Infinities -> right
    [] left = NegativeZero -> right
    [] right = NegativeZero -> left
    [] left = 0 -> right
    [] right = 0 -> left
    [] IsFraction(left) \\/ IsFraction(right) -> Assert(FALSE, "tla-ts can't add fractions")
    [] OTHER -> left + right

Subtract(left, right) == Add(left, Negate(right))

Multiply(left, right) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
  IN CASE left = NaN \\/ right = NaN -> NaN
       [] left \\in Infinities \\/ right \\in Infinities ->
            CASE IsZero(left) \\/ IsZero(right) -> NaN
              [] isNegative -> NegativeInfinity
              [] OTHER -> Infinity
       [] IsZero(left) \\/ IsZero(right) -> IF isNegative THEN NegativeZero ELSE 0
       [] left = 1 -> right
       [] right = 1 -> left
       [] left = -1 -> Negate(right)
       [] right = -1 -> Negate(left)
       [] IsFraction(left) \\/ IsFraction(right) -> Assert(FALSE, "tla-ts can't multiply fractions")
       [] OTHER ->
            LET product == Magnitude(left) * Magnitude(right)
            IN IF product = 0 /\\ isNegative THEN NegativeZero ELSE product

\\* JavaScript's /, where tla-ts represents only a quotient that is an integer, an infinity, NaN,
\\* or -0.
Divide(left, right) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
      signed(magnitude) == CASE magnitude = 0 /\\ isNegative -> NegativeZero
                             [] isNegative -> -magnitude
                             [] OTHER -> magnitude
  IN CASE left = NaN \\/ right = NaN \\/ (left \\in Infinities /\\ right \\in Infinities) -> NaN
       [] left \\in Infinities -> IF isNegative THEN NegativeInfinity ELSE Infinity
       [] right \\in Infinities -> signed(0)
       [] IsZero(right) /\\ IsZero(left) -> NaN
       [] IsZero(right) -> IF isNegative THEN NegativeInfinity ELSE Infinity
       [] IsZero(left) -> signed(0)
       [] right = 1 -> left
       [] IsFraction(left) \\/ IsFraction(right) -> Assert(FALSE, "tla-ts can't divide fractions")
       [] Absolute(Magnitude(left)) % Absolute(Magnitude(right)) = 0 ->
            signed(Absolute(Magnitude(left)) \\div Absolute(Magnitude(right)))
       [] OTHER -> Assert(FALSE, "tla-ts can't represent the fraction " \\o ToString(left) \\o " / "
                                 \\o ToString(right))

\\* JavaScript's %, whose result has the sign of the dividend.
Remainder(left, right) ==
  CASE left = NaN \\/ right = NaN \\/ left \\in Infinities \\/ IsZero(right) -> NaN
    [] right \\in Infinities \\/ IsZero(left) -> left
    [] IsFraction(left) \\/ IsFraction(right) ->
         Assert(FALSE, "tla-ts can't compute the remainder of fractions")
    [] OTHER ->
         LET remainder == Absolute(left) % Absolute(right)
         IN CASE left > 0 -> remainder
              [] remainder = 0 -> NegativeZero
              [] OTHER -> -remainder

LOCAL IsOdd(value) == IsInteger(value) /\\ value % 2 = 1

\\* JavaScript's **, as Number::exponentiate defines it.
Power(base, exponent) ==
  CASE exponent = NaN -> NaN
    [] IsZero(exponent) -> 1
    [] base = NaN -> NaN
    [] base = Infinity -> IF IsNegative(exponent) THEN 0 ELSE Infinity
    [] base = NegativeInfinity ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeInfinity
           [] ~IsNegative(exponent) -> Infinity
           [] IsOdd(Negate(exponent)) -> NegativeZero
           [] OTHER -> 0
    [] base = 0 -> IF IsNegative(exponent) THEN Infinity ELSE 0
    [] base = NegativeZero ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeZero
           [] ~IsNegative(exponent) -> 0
           [] IsOdd(Negate(exponent)) -> NegativeInfinity
           [] OTHER -> Infinity
    [] exponent \\in Infinities ->
         LET exceedsOne == IF IsFraction(base)
                           THEN Floor(base) >= 1 \\/ Floor(base) <= -2
                           ELSE Absolute(base) > 1
         IN CASE base \\in {1, -1} -> NaN
              [] exceedsOne = (exponent = Infinity) -> Infinity
              [] OTHER -> 0
    [] IsFraction(base) \\/ IsFraction(exponent) ->
         Assert(FALSE, "tla-ts can't raise fractions to a power")
    [] exponent >= 0 -> base ^ exponent
    [] Absolute(base) = 1 -> IF IsOdd(Negate(exponent)) THEN base ELSE 1
    [] OTHER -> Assert(FALSE, "tla-ts can't represent this value")

\\* The order of numbers, by their kind, then their floor, then their position in Fractions, where
\\* an integer comes before the fractions above it.
LOCAL Rank(value) ==
  CASE value = NegativeInfinity -> <<0, 0, 0>>
    [] value = Infinity -> <<2, 0, 0>>
    [] IsFraction(value) -> <<1, Floor(value), FractionPosition(value)>>
    [] OTHER -> <<1, Magnitude(value), 0>>

LOCAL Precedes(left, right) ==
  \\E position \\in DOMAIN left :
    /\\ left[position] < right[position]
    /\\ \\A earlier \\in 1..(position - 1) : left[earlier] = right[earlier]

LessThan(left, right) == left # NaN /\\ right # NaN /\\ Precedes(Rank(left), Rank(right))

LessOrEqual(left, right) == left # NaN /\\ right # NaN /\\ ~LessThan(right, left)

\\* TLC's integers have 32 bits, where a BigInt has as many as it needs, so tla-ts stops where one
\\* would leave them.
LOCAL MaxInteger == 2147483647

\\* The integer that a BigInt holds, where TypeScript's types may let another value through.
LOCAL IntegerOfBigInt(value) ==
  IF IsBigInt(value)
  THEN value[Big]
  ELSE Assert(FALSE, "tla-ts can't compute with a value that isn't a BigInt")

LOCAL TooBig == Assert(FALSE, "tla-ts can't hold a BigInt beyond 32 bits")

BigIntAdd(left, right) ==
  LET augend == IntegerOfBigInt(left)
      addend == IntegerOfBigInt(right)
  IN IF \\/ addend > 0 /\\ augend > MaxInteger - addend
        \\/ addend < 0 /\\ augend < -MaxInteger - addend
     THEN TooBig
     ELSE Big :> augend + addend

BigIntNegate(value) == Big :> -IntegerOfBigInt(value)

BigIntSubtract(left, right) == BigIntAdd(left, BigIntNegate(right))

BigIntMultiply(left, right) ==
  LET multiplicand == IntegerOfBigInt(left)
      multiplier == IntegerOfBigInt(right)
  IN IF multiplicand # 0 /\\ Absolute(multiplier) > MaxInteger \\div Absolute(multiplicand)
     THEN TooBig
     ELSE Big :> multiplicand * multiplier

\\* BigInt's /, which rounds toward zero.
BigIntDivide(left, right) ==
  LET dividend == IntegerOfBigInt(left)
      divisor == IntegerOfBigInt(right)
      quotient == Absolute(dividend) \\div Absolute(divisor)
  IN IF divisor = 0
     THEN Assert(FALSE, "tla-ts can't throw the RangeError of dividing a BigInt by zero")
     ELSE Big :> IF (dividend < 0) # (divisor < 0) THEN -quotient ELSE quotient

\\* BigInt's %, whose result has the sign of the dividend.
BigIntRemainder(left, right) ==
  LET dividend == IntegerOfBigInt(left)
      divisor == IntegerOfBigInt(right)
      remainder == Absolute(dividend) % Absolute(divisor)
  IN IF divisor = 0
     THEN Assert(FALSE, "tla-ts can't throw the RangeError of dividing a BigInt by zero")
     ELSE Big :> IF dividend < 0 THEN -remainder ELSE remainder

RECURSIVE BigIntPowerOf(_, _)
BigIntPowerOf(base, exponent) ==
  IF exponent = 0 THEN Big :> 1 ELSE BigIntMultiply(base, BigIntPowerOf(base, exponent - 1))

BigIntPower(base, exponent) ==
  LET magnitude == Absolute(IntegerOfBigInt(base))
      count == IntegerOfBigInt(exponent)
  IN CASE count < 0 ->
            Assert(FALSE, "tla-ts can't throw the RangeError of a BigInt's negative exponent")
       [] count = 0 \\/ IntegerOfBigInt(base) = 1 -> Big :> 1
       [] magnitude = 1 -> Big :> IF count % 2 = 0 THEN 1 ELSE -1
       [] magnitude = 0 -> Big :> 0
       [] count > 31 -> TooBig
       [] OTHER -> BigIntPowerOf(base, count)

\\* The order of numbers and BigInts, which compares their mathematical values.
LOCAL NumericRank(value) == IF IsBigInt(value) THEN <<1, value[Big], 0>> ELSE Rank(value)

NumericLessThan(left, right) ==
  left # NaN /\\ right # NaN /\\ Precedes(NumericRank(left), NumericRank(right))

NumericLessOrEqual(left, right) == left # NaN /\\ right # NaN /\\ ~NumericLessThan(right, left)

\\* Math.abs.
AbsoluteValue(value) == IF IsNegative(value) THEN Negate(value) ELSE value

\\* Math.sign.
Sign(value) ==
  CASE value \\in {NaN, NegativeZero, 0} -> value
    [] IsNegative(value) -> -1
    [] OTHER -> 1

\\* Math.round, which tla-ts works out for each fraction as it compiles.
Round(value) == IF IsFraction(value) THEN Fractions[FractionPosition(value)].round ELSE value

\\* ToInt32 of a number. TLC keeps integers in 32 bits, so it leaves an integer as it is.
LOCAL Int32(value) ==
  CASE value \\in SpecialNumbers -> 0
    [] IsFraction(value) -> Truncate(value)
    [] OTHER -> value

\\* The count that a shift takes: ToUint32 of its right operand, modulo 32.
LOCAL ShiftCount(value) == Int32(value) % 32

LOCAL BitOf(operation, left, right) ==
  CASE operation = "and" -> left * right
    [] operation = "or" -> IF left + right > 0 THEN 1 ELSE 0
    [] OTHER -> (left + right) % 2

\\* An operation on the bits of two integers from 0.
RECURSIVE Bits(_, _, _)
Bits(operation, left, right) ==
  IF left = 0 /\\ right = 0
  THEN 0
  ELSE 2 * Bits(operation, left \\div 2, right \\div 2) + BitOf(operation, left % 2, right % 2)

\\* JavaScript's &, |, and ^. An integer of 32 bits is its low 30 bits plus High * 2^30, where High,
\\* from -2 to 1, holds its top two bits in two's complement.
LOCAL BitwiseOperation(operation, left, right) ==
  LET a == Int32(left)
      b == Int32(right)
      high(value) == value \\div 1073741824
      top(value) == IF high(value) < 0 THEN 1 ELSE 0
      next(value) == high(value) % 2
  IN Bits(operation, a % 1073741824, b % 1073741824)
       + (BitOf(operation, next(a), next(b)) - 2 * BitOf(operation, top(a), top(b))) * 1073741824

BitwiseAnd(left, right) == BitwiseOperation("and", left, right)

BitwiseOr(left, right) == BitwiseOperation("or", left, right)

BitwiseXor(left, right) == BitwiseOperation("xor", left, right)

\\* JavaScript's ~.
BitwiseNot(value) == -Int32(value) - 1

\\* Math.imul: the low 32 bits of a product. Each integer splits into halves of 16 bits, and each
\\* product of halves into bytes, so no step leaves TLC's 32 bits.
Imul(left, right) ==
  LET a == Int32(left)
      b == Int32(right)
      lowOf(value) == value % 65536
      highOf(value) == (value \\div 65536) % 65536
      byteOf(value) == value % 256
      upperByteOf(value) == lowOf(value) \\div 256
      \\* The low 16 bits of the product of two halves.
      lowProduct(x, y) == (byteOf(x) * y + ((upperByteOf(x) * byteOf(y)) % 256) * 256) % 65536
      middle == upperByteOf(a) * byteOf(b) + byteOf(a) * upperByteOf(b)
      bottom == byteOf(a) * byteOf(b) + (middle % 256) * 256
      high ==
        (upperByteOf(a) * upperByteOf(b) + middle \\div 256 + bottom \\div 65536
          + lowProduct(highOf(a), lowOf(b)) + lowProduct(lowOf(a), highOf(b))) % 65536
  IN (IF high >= 32768 THEN high - 65536 ELSE high) * 65536 + (bottom % 65536)

\\* JavaScript's <<. The bit below the shifted bits becomes the sign bit.
LeftShift(left, right) ==
  LET a == Int32(left)
      count == ShiftCount(right)
  IN IF count = 0
     THEN a
     ELSE LET shifted == (a % 2 ^ (31 - count)) * 2 ^ (count - 1) * 2
          IN IF (a \\div 2 ^ (31 - count)) % 2 = 1 THEN shifted + (-2147483647 - 1) ELSE shifted

\\* JavaScript's >>, which keeps the sign.
SignedRightShift(left, right) ==
  LET a == Int32(left)
      count == ShiftCount(right)
  IN CASE count < 31 -> a \\div 2 ^ count
       [] a < 0 -> -1
       [] OTHER -> 0

\\* JavaScript's >>>, which reads its left operand as unsigned. tla-ts can't hold an integer from
\\* 2^31 that the shift doesn't make smaller.
UnsignedRightShift(left, right) ==
  LET a == Int32(left)
      count == ShiftCount(right)
  IN CASE a >= 0 /\\ count < 31 -> a \\div 2 ^ count
       [] a >= 0 -> 0
       [] count = 0 -> Assert(FALSE, "tla-ts can't hold " \\o ToString(a) \\o " >>> 0 in an integer")
       [] count = 31 -> 1
       [] OTHER -> a \\div 2 ^ count + 2 ^ (31 - count) + 2 ^ (31 - count)

\\* Math.min and Math.max of two numbers, where NaN wins and -0 is less than 0.
Minimum(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] IsZero(left) /\\ IsZero(right) -> IF left = NegativeZero THEN left ELSE right
    [] LessThan(right, left) -> right
    [] OTHER -> left

Maximum(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] IsZero(left) /\\ IsZero(right) -> IF left = 0 THEN left ELSE right
    [] LessThan(left, right) -> right
    [] OTHER -> left

MinimumOf(values) ==
  CASE NaN \\in values -> NaN
    [] values = {} -> Infinity
    [] OTHER -> CHOOSE value \\in values : \\A other \\in values : Minimum(value, other) = value

MaximumOf(values) ==
  CASE NaN \\in values -> NaN
    [] values = {} -> NegativeInfinity
    [] OTHER -> CHOOSE value \\in values : \\A other \\in values : Maximum(value, other) = value

\\* Math.floor or Math.trunc of left / right.
LOCAL Quotient(left, right, isFloor) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
      signed(magnitude) == IF isNegative THEN Negate(magnitude) ELSE magnitude
  IN CASE left = NaN \\/ right = NaN -> NaN
       [] left \\in Infinities /\\ right \\in Infinities -> NaN
       [] IsZero(left) /\\ IsZero(right) -> NaN
       [] left \\in Infinities \\/ IsZero(right) -> signed(Infinity)
       [] right \\in Infinities \\/ IsZero(left) -> signed(0)
       [] IsFraction(left) /\\ right = 1 ->
            LET whole == IF isFloor THEN Floor(left) ELSE Truncate(left)
            IN IF whole = 0 /\\ isNegative THEN NegativeZero ELSE whole
       [] IsFraction(left) \\/ IsFraction(right) -> Assert(FALSE, "tla-ts can't divide fractions")
       [] isFloor /\\ isNegative /\\ Absolute(left) % Absolute(right) # 0 ->
            -(Absolute(left) \\div Absolute(right) + 1)
       [] OTHER -> signed(Absolute(left) \\div Absolute(right))

FloorDivide(left, right) == Quotient(left, right, TRUE)

TruncDivide(left, right) == Quotient(left, right, FALSE)

\\* The position, counting from 1, of the element that a number reads, or 0 where it isn't an
\\* index.
ElementPosition(value) ==
  CASE value = NegativeZero -> 1
    [] value \\in SpecialNumbers \\/ IsFraction(value) -> 0
    [] OTHER -> value + 1

\\* The value that a Set or a Map keeps as a key, where -0 is 0.
KeyOf(value) == IF value = NegativeZero THEN 0 ELSE value

\\* The length of new Array(length), which throws a RangeError unless length is an array index.
ArrayLength(value) ==
  IF value = NegativeZero \\/ (IsInteger(value) /\\ value >= 0)
  THEN Magnitude(value)
  ELSE Assert(FALSE, "tla-ts can't throw the RangeError of an invalid array length")

\\* An index after ToIntegerOrInfinity, counting back from length where it's negative. An infinite
\\* index lands just past either end.
RelativeIndex(index, length) ==
  CASE index = NaN \\/ index = NegativeZero -> 0
    [] index = Infinity -> length
    [] index = NegativeInfinity -> -1
    [] IsFraction(index) -> IF Truncate(index) < 0 THEN length + Truncate(index) ELSE Truncate(index)
    [] index < 0 -> length + index
    [] OTHER -> index

ClampedIndex(index, length) ==
  LET relative == RelativeIndex(index, length)
  IN IF relative < 0 THEN 0 ELSE IF relative > length THEN length ELSE relative

\\* A count between 0 and a maximum, as toSpliced() and splice() take their delete count.
ClampedCount(count, maximum) ==
  CASE count = NaN \\/ count = NegativeZero \\/ count = NegativeInfinity -> 0
    [] count = Infinity -> maximum
    [] IsFraction(count) ->
         IF Truncate(count) < 0 THEN 0 ELSE IF Truncate(count) > maximum THEN maximum ELSE Truncate(count)
    [] count < 0 -> 0
    [] count > maximum -> maximum
    [] OTHER -> count

SequenceWith(sequence, index, value) ==
  LET relative == RelativeIndex(index, Len(sequence))
  IN IF relative \\in 0..(Len(sequence) - 1)
     THEN [sequence EXCEPT ![relative + 1] = value]
     ELSE Assert(FALSE, "tla-ts can't throw the RangeError of with()")

\\* fill() over the positions after start and up to end, as ClampedIndex gives them.
SequenceFill(sequence, value, start, end) ==
  [position \\in DOMAIN sequence |->
     IF position > start /\\ position <= end THEN value ELSE sequence[position]]

\\* copyWithin(), which reads every element it copies before it writes any, as the spec's copy in
\\* either direction does.
SequenceCopyWithin(sequence, target, start, end) ==
  LET count == IF end - start < Len(sequence) - target THEN end - start ELSE Len(sequence) - target
  IN [position \\in DOMAIN sequence |->
        IF position > target /\\ position <= target + count
        THEN sequence[start + position - target]
        ELSE sequence[position]]

\\* Inserts a value after the sorted elements that don't come after it, which keeps equal elements
\\* in their order, as sort() does.
LOCAL SortedInsert(sorted, value, IsBefore(_, _)) ==
  LET after == {position \\in DOMAIN sorted : IsBefore(value, sorted[position])}
      at == IF after = {} THEN Len(sorted) + 1
            ELSE CHOOSE position \\in after : \\A other \\in after : position <= other
  IN SubSeq(sorted, 1, at - 1) \\o <<value>> \\o SubSeq(sorted, at, Len(sorted))

RECURSIVE SortedPrefix(_, _, _)
SortedPrefix(sequence, length, IsBefore(_, _)) ==
  IF length = 0
  THEN <<>>
  ELSE SortedInsert(SortedPrefix(sequence, length - 1, IsBefore), sequence[length], IsBefore)

\\* sort() with a comparator that orders its elements consistently, which puts undefined last.
SortSequence(sequence, IsBefore(_, _)) ==
  LET defined == SelectSeq(sequence, LAMBDA value : value # Undefined)
  IN SortedPrefix(defined, Len(defined), IsBefore)
       \\o [position \\in 1..(Len(sequence) - Len(defined)) |-> Undefined]

RECURSIVE Join(_, _)
Join(sequence, separator) ==
  CASE sequence = <<>> -> ""
    [] Len(sequence) = 1 -> Head(sequence)
    [] OTHER -> Head(sequence) \\o separator \\o Join(Tail(sequence), separator)

RECURSIVE ReduceAt(_, _, _)
ReduceAt(Op(_, _), accumulator, positions) ==
  IF positions = <<>>
  THEN accumulator
  ELSE ReduceAt(Op, Op(accumulator, Head(positions)), Tail(positions))

Reduce(sequence, Op(_, _), isRight, hasInitial, initial) ==
  LET length == Len(sequence)
      order == [position \\in 1..length |-> IF isRight THEN length - position + 1 ELSE position]
  IN CASE hasInitial -> ReduceAt(Op, initial, order)
       [] length = 0 -> Assert(FALSE, "tla-ts can't throw the TypeError of reducing an empty array")
       [] OTHER -> ReduceAt(Op, sequence[order[1]], Tail(order))

IsRef(value) ==
  LET text == ToString(value)
  IN Len(text) >= 7 /\\ SubSeq(text, 1, 7) = "(Ref :>"

IsHeap(ref) == IsRef(ref) /\\ TypeOf(ref[Ref]) = "number"

\\* An array of arrays, one level flatter, as flat() makes it where every element is an array.
RECURSIVE Flatten(_)
Flatten(sequence) ==
  CASE sequence = <<>> -> <<>>
    [] IsRef(Head(sequence)) -> Assert(FALSE, "tla-ts can't flatten an array that the heap holds")
    [] OTHER -> Head(sequence) \\o Flatten(Tail(sequence))

LOCAL IsObject(value) == IsRef(value) \\/ TypeOf(value) = "function"

LOCAL ObjectPrototype == Ref :> "Object.prototype"

\\* The global object, which a script's this is at its top level, and whose properties tla-ts doesn't
\\* read.
GlobalObject == Ref :> "globalThis"

LOCAL Writable == [writable |-> TRUE, enumerable |-> TRUE, configurable |-> TRUE, kind |-> "data"]

EmptyObject ==
  [keys |-> <<>>, values |-> <<>>, attributes |-> <<>>, extensible |-> TRUE,
   prototype |-> ObjectPrototype, isCallable |-> FALSE, isConstructor |-> FALSE, isOpaque |-> FALSE,
   privates |-> <<>>]

\\* A heap holds the objects a script makes, and the built-in objects it has changed, by key.
EmptyHeap == [objects |-> <<>>, changed |-> <<>>, symbols |-> <<>>, registry |-> <<>>]

Allocate(heap, object) == [heap EXCEPT !.objects = Append(@, object)]

Allocated(heap) == Ref :> Len(heap.objects)

\\* The ref that the object an offset past the last one on the heap will have.
NextRef(heap, offset) == Ref :> (Len(heap.objects) + offset)

LOCAL BuiltInKey(ref) == IF IsRef(ref) THEN ref[Ref] ELSE ref

LOCAL IsBuiltIn(ref) ==
  /\\ IsObject(ref)
  /\\ BuiltInKey(ref) \\in DOMAIN BuiltIns
  /\\ ~BuiltIns[BuiltInKey(ref)].isOpaque

\\* A proxy, whose target and handler revoking it sets to null. Statements run its traps, and tla-ts
\\* stops wherever anything else reads it.
IsProxy(heap, value) == IsHeap(value) /\\ "handler" \\in DOMAIN heap.objects[value[Ref]]

ProxyTarget(heap, ref) == heap.objects[ref[Ref]].target

ProxyHandler(heap, ref) == heap.objects[ref[Ref]].handler

\\* An ArrayBuffer holds bytes, and a DataView or a typed array views them from an offset, for a
\\* length, or for a resizable buffer's length where that's -1. A typed array holds the type
\\* of its elements.
IsBuffer(heap, value) == IsHeap(value) /\\ "bytes" \\in DOMAIN heap.objects[value[Ref]]

IsDataView(heap, value) ==
  /\\ IsHeap(value)
  /\\ "viewed" \\in DOMAIN heap.objects[value[Ref]]
  /\\ "elementType" \\notin DOMAIN heap.objects[value[Ref]]

IsTypedArray(heap, value) == IsHeap(value) /\\ "elementType" \\in DOMAIN heap.objects[value[Ref]]

Lookup(heap, ref) ==
  CASE IsProxy(heap, ref) -> Assert(FALSE, "tla-ts can't run a proxy's internal method here")
    [] IsTypedArray(heap, ref) -> Assert(FALSE, "tla-ts can't run a typed array's internal method here")
    [] ref \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of reading a property of " \\o ToString(ref))
    [] IsHeap(ref) /\\ heap.objects[ref[Ref]].isOpaque ->
         Assert(FALSE, "tla-ts can't read the properties of a generator or a promise")
    [] IsHeap(ref) -> heap.objects[ref[Ref]]
    [] IsBuiltIn(ref) /\\ BuiltInKey(ref) \\in DOMAIN heap.changed -> heap.changed[BuiltInKey(ref)]
    [] IsBuiltIn(ref) -> BuiltIns[BuiltInKey(ref)]
    [] OTHER -> Assert(FALSE, "tla-ts can't read the properties of " \\o ToString(ref))

Update(heap, ref, object) ==
  IF IsHeap(ref)
  THEN [heap EXCEPT !.objects[ref[Ref]] = object]
  ELSE [heap EXCEPT !.changed = (BuiltInKey(ref) :> object) @@ @]

\\* Whether new can call a value.
IsConstructor(heap, value) ==
  CASE IsHeap(value) -> heap.objects[value[Ref]].isConstructor
    [] IsObject(value) /\\ BuiltInKey(value) \\in DOMAIN BuiltIns ->
         BuiltIns[BuiltInKey(value)].isConstructor
    [] TypeOf(value) # "function" -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell whether this function is a constructor")

TypeOfIn(heap, value) ==
  CASE IsHeap(value) -> IF heap.objects[value[Ref]].isCallable THEN "function" ELSE "object"
    [] IsRef(value) /\\ value[Ref] \\in DOMAIN BuiltIns ->
         IF BuiltIns[value[Ref]].isCallable THEN "function" ELSE "object"
    [] IsRef(value) /\\ value = GlobalObject -> "object"
    [] IsRef(value) -> Assert(FALSE, "tla-ts can't tell the type of " \\o ToString(value))
    [] OTHER -> TypeOf(value)

WithPrototype(object, value) ==
  CASE value = Null \\/ IsRef(value) -> [object EXCEPT !.prototype = value]
    [] TypeOf(value) \\in {"object", "function"} -> Assert(FALSE, "tla-ts can't make this a prototype")
    [] OTHER -> object

\\* An object's private names hold its private fields, and its class's key where the class has
\\* private methods or accessors. Only objects that a script makes have them.
PrivateAdd(object, key, value) == [object EXCEPT !.privates = (key :> value) @@ @]

HasPrivate(heap, ref, key) == IsHeap(ref) /\\ key \\in DOMAIN heap.objects[ref[Ref]].privates

PrivateGet(heap, ref, key) ==
  IF HasPrivate(heap, ref, key)
  THEN heap.objects[ref[Ref]].privates[key]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of reading a private name an object lacks")

PrivateSet(heap, ref, key, value) ==
  IF HasPrivate(heap, ref, key)
  THEN [heap EXCEPT !.objects[ref[Ref]].privates[key] = value]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of writing a private name an object lacks")

\\* A write to a property whose value TLA+ can't represent gives it one.
Put(object, key, value) ==
  IF key \\in DOMAIN object.values
  THEN [object EXCEPT !.values = (key :> value) @@ @, !.attributes[key].kind = "data"]
  ELSE [object EXCEPT !.keys = Append(@, key),
                      !.values = (key :> value) @@ @,
                      !.attributes = (key :> Writable) @@ @]

\\* The object that a generator's next gives, which CreateIterResultObject makes.
\\* A generator object, whose properties tla-ts doesn't model, as only its methods' calls run.
GeneratorObject == [EmptyObject EXCEPT !.isOpaque = TRUE]

IteratorResult(value, isDone) == Put(Put(EmptyObject, "value", value), "done", isDone)

\\* A property that a class defines, with its attributes.
Define(object, key, value, isWritable, isEnumerable, isConfigurable) ==
  [object EXCEPT !.keys = IF key \\in DOMAIN object.values THEN @ ELSE Append(@, key),
                 !.values = (key :> value) @@ @,
                 !.attributes = (key :> [writable |-> isWritable, enumerable |-> isEnumerable,
                                         configurable |-> isConfigurable, kind |-> "data"]) @@ @]

\\* A public field that a class defines on an object, which fails where the object has the key
\\* unconfigurable, or lacks it and can't grow.
DefineField(heap, ref, key, value) ==
  LET object == Lookup(heap, ref)
  IN IF IF key \\in DOMAIN object.values THEN object.attributes[key].configurable ELSE object.extensible
     THEN [heap |-> Update(heap, ref, Define(object, key, value, TRUE, TRUE, TRUE)), isDone |-> TRUE]
     ELSE [heap |-> heap, isDone |-> FALSE]

\\* The object of a class's constructor, which inherits from Function.prototype.
ClassObject(functionPrototype) ==
  [EmptyObject EXCEPT !.isCallable = TRUE, !.isConstructor = TRUE, !.prototype = functionPrototype]

\\* An arrow function, which has no prototype and can't construct.
ArrowObject(functionPrototype, name, length) ==
  Define(Define([ClassObject(functionPrototype) EXCEPT !.isConstructor = FALSE],
                "length", length, FALSE, FALSE, TRUE),
         "name", name, FALSE, FALSE, TRUE)

\\* A function that a function makes each time it runs, which holds the model value of its code, so
\\* that a call can tell which function it runs. tla-ts can't read its properties.
FunctionObject(functionPrototype, code) ==
  [code |-> code] @@ [ClassObject(functionPrototype) EXCEPT !.isOpaque = TRUE]

\\* A method that a function makes each time it runs, which can't construct.
MethodObject(functionPrototype, code) ==
  [FunctionObject(functionPrototype, code) EXCEPT !.isConstructor = FALSE]

\\* The code that a value runs where a script calls it.
CodeOf(heap, value) ==
  IF IsHeap(value) /\\ "code" \\in DOMAIN heap.objects[value[Ref]]
  THEN heap.objects[value[Ref]].code
  ELSE value

IsObjectIn(heap, value) == value # Null /\\ TypeOfIn(heap, value) \\in {"object", "function"}

\\* A proxy, which can call where its target can, and construct where its target, a constructor
\\* where isConstructor holds, can.
ProxyObject(heap, target, handler, isConstructor) ==
  IF IsObjectIn(heap, target) /\\ IsObjectIn(heap, handler)
  THEN [target |-> target, handler |-> handler]
         @@ [EmptyObject EXCEPT !.isCallable = TypeOfIn(heap, target) = "function",
                                !.isConstructor = TypeOfIn(heap, target) = "function" /\\ isConstructor]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of making a proxy of a primitive")

\\* What Proxy.revocable gives: the proxy, then the function that revokes it, which it holds until
\\* it does.
Revocable(heap, functionPrototype, target, handler, isConstructor) ==
  LET proxy == NextRef(heap, 1)
      revoke == NextRef(heap, 2)
  IN Allocate(Allocate(Allocate(heap, ProxyObject(heap, target, handler, isConstructor)),
                       [revokes |-> proxy] @@ ArrowObject(functionPrototype, "", 0)),
              Put(Put(EmptyObject, "proxy", proxy), "revoke", revoke))

IsRevoker(heap, value) == IsHeap(value) /\\ "revokes" \\in DOMAIN heap.objects[value[Ref]]

Revoke(heap, ref) ==
  LET proxy == heap.objects[ref[Ref]].revokes
  IN IF proxy = Null
     THEN heap
     ELSE [heap EXCEPT !.objects[ref[Ref]].revokes = Null,
                       !.objects[proxy[Ref]].target = Null,
                       !.objects[proxy[Ref]].handler = Null]

\\* A function that bind makes, which has no prototype and constructs where its target does.
BoundFunctionObject(functionPrototype, name, length, isConstructor) ==
  [ArrowObject(functionPrototype, "bound " \\o name, length) EXCEPT !.isConstructor = isConstructor]

\\* A generator function, which can't construct, and its prototype object, which the generator
\\* objects it makes inherit from. tla-ts can't read the properties of the built-in objects they
\\* inherit from.
GeneratorFunctionObject(name, length, prototype) ==
  Define(ArrowObject(Ref :> "GeneratorFunction.prototype", name, length),
         "prototype", prototype, TRUE, FALSE, FALSE)

GeneratorPrototypeObject == [EmptyObject EXCEPT !.prototype = Ref :> "GeneratorFunction.prototype.prototype"]

\\* Whether one string of digits is below another of the same length.
RECURSIVE DigitsBelow(_, _)
DigitsBelow(left, right) ==
  LET digit(text) == CHOOSE value \\in 0..9 : ToString(value) = SubSeq(text, 1, 1)
  IN /\\ left # ""
     /\\ \\/ digit(left) < digit(right)
        \\/ digit(left) = digit(right) /\\ DigitsBelow(Tail(left), Tail(right))

\\* An array index is below 2^32 - 1, where TLC's integers hold only those below 2^31.
LOCAL IsIndex(key) ==
  /\\ ~IsSymbol(key)
  /\\ Len(key) > 0
  /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\ {"-"}
  /\\ Len(key) = 1 \\/ SubSeq(key, 1, 1) # "0"
  /\\ \\/ Len(key) < 10
     \\/ /\\ Len(key) = 10
        /\\ Assert(~DigitsBelow(key, "4294967295"), "tla-ts can't order keys this big")
        /\\ FALSE

RECURSIVE ToIndex(_)
ToIndex(key) ==
  IF key = ""
  THEN 0
  ELSE 10 * ToIndex(SubSeq(key, 1, Len(key) - 1))
         + (CHOOSE digit \\in 0..9 : ToString(digit) = SubSeq(key, Len(key), Len(key)))

\\* The position in a sequence that a key reads, which may be a number or an index's string.
KeyPosition(key) ==
  CASE TypeOf(key) = "number" -> ElementPosition(key)
    [] TypeOf(key) = "string" /\\ IsIndex(key) -> ToIndex(key) + 1
    [] OTHER -> Assert(FALSE, "tla-ts can't read this key of an array")

\\* An object's own string keys, with the indices first in order.
OwnKeys(object) ==
  LET strings == SelectSeq(object.keys, LAMBDA key : ~IsSymbol(key))
  IN SortSeq(SelectSeq(strings, IsIndex), LAMBDA left, right : ToIndex(left) < ToIndex(right))
       \\o SelectSeq(strings, LAMBDA key : ~IsIndex(key))

LOCAL EnumerableKeys(object) ==
  SelectSeq(OwnKeys(object), LAMBDA key : object.attributes[key].enumerable)

\\* The enumerable own keys that spread and Object.assign copy, which include symbols.
LOCAL EnumerableOwnKeys(object) ==
  SelectSeq(OwnKeys(object) \\o SelectSeq(object.keys, IsSymbol),
            LAMBDA key : object.attributes[key].enumerable)

LOCAL Value(object, key) ==
  LET attributes == object.attributes[key]
  IN CASE attributes.kind = "data" -> object.values[key]
       [] attributes.kind = "accessor" /\\ object.values[key].get = Undefined -> Undefined
       [] attributes.kind = "accessor" /\\ object.values[key].get \\in DOMAIN ConstantFunctions ->
            ConstantFunctions[object.values[key].get]
       [] attributes.kind = "accessor" -> Assert(FALSE, "tla-ts can't call getters")
       [] OTHER -> Assert(FALSE, "tla-ts can't represent this value")

Own(heap, ref) == Lookup(heap, ref).values

\\* The keys a for-in visits: each enumerable key once, own keys first, and none that an object
\\* nearer the start of the prototype chain has.
RECURSIVE ForInKeys(_, _)
ForInKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
      inherited == IF object.prototype = Null THEN <<>> ELSE ForInKeys(heap, object.prototype)
  IN SelectSeq(OwnKeys(object), LAMBDA key : object.attributes[key].enumerable)
       \\o SelectSeq(inherited, LAMBDA key : key \\notin DOMAIN object.values)

OwnPropertyNames(heap, ref) == OwnKeys(Lookup(heap, ref))

OwnPropertySymbols(heap, ref) == SelectSeq(Lookup(heap, ref).keys, IsSymbol)

\\* Reflect.ownKeys, which gives the strings that key an object's properties and then its symbols.
OwnPropertyKeys(heap, ref) == OwnPropertyNames(heap, ref) \\o OwnPropertySymbols(heap, ref)

RECURSIVE PutAll(_, _, _)
PutAll(object, values, keys) ==
  IF keys = <<>>
  THEN object
  ELSE PutAll(Put(object, Head(keys), values[Head(keys)]), values, Tail(keys))

Spread(object, heap, ref) ==
  LET source == Lookup(heap, ref)
  IN PutAll(object, [key \\in DOMAIN source.values |-> Value(source, key)], EnumerableOwnKeys(source))

LOCAL DescribeObject(object, key) ==
  LET attributes == object.attributes[key]
      isAccessor == attributes.kind = "accessor"
      fields ==
        IF isAccessor
        THEN [get |-> object.values[key].get, set |-> object.values[key].set]
        ELSE [value |-> object.values[key], writable |-> attributes.writable]
      described ==
        PutAll(EmptyObject,
               fields @@ [enumerable |-> attributes.enumerable,
                          configurable |-> attributes.configurable],
               IF isAccessor
               THEN <<"get", "set", "enumerable", "configurable">>
               ELSE <<"value", "writable", "enumerable", "configurable">>)
  \\* A description's value is one TLA+ can't represent where the property's is.
  IN CASE key \\notin DOMAIN object.values -> EmptyObject
       [] isAccessor -> described
       [] OTHER -> [described EXCEPT !.attributes["value"].kind = attributes.kind]

Describe(heap, ref, key) == DescribeObject(Lookup(heap, ref), key)

\\* Object.getOwnPropertyDescriptors, which makes a description of each own property of an object,
\\* and then the object that holds them under their keys, last, so that Allocated names it.
DescribeAll(heap, object) ==
  LET keys == OwnKeys(object) \\o SelectSeq(object.keys, IsSymbol)
      first == Len(heap.objects)
      described == [heap EXCEPT !.objects =
                      @ \\o [position \\in DOMAIN keys |-> DescribeObject(object, keys[position])]]
      refs == [key \\in {keys[position] : position \\in DOMAIN keys} |->
                Ref :> (first + CHOOSE position \\in DOMAIN keys : keys[position] = key)]
  IN Allocate(described, PutAll(EmptyObject, refs, keys))

HasOwn(heap, ref, key) == key \\in DOMAIN Own(heap, ref)

IsEnumerableOwn(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN key \\in DOMAIN object.values /\\ object.attributes[key].enumerable

ElementSize(type) ==
  CASE type \\in {"Int8", "Uint8", "Uint8Clamped"} -> 1
    [] type \\in {"Int16", "Uint16", "Float16"} -> 2
    [] type \\in {"Int32", "Uint32", "Float32"} -> 4
    [] OTHER -> 8

LOCAL ViewedBytes(heap, view) == heap.objects[view.viewed[Ref]].bytes

LOCAL ViewSize(view) == IF "elementType" \\in DOMAIN view THEN ElementSize(view.elementType) ELSE 1

\\* Whether a view reaches past its buffer's end, as a detached buffer, or one that shrank, leaves it.
IsOutOfBounds(heap, view) ==
  LET buffer == heap.objects[view.viewed[Ref]]
  IN \\/ buffer.isDetached
     \\/ view.byteOffset > Len(buffer.bytes)
     \\/ /\\ view.viewLength # -1
        /\\ view.byteOffset + view.viewLength * ViewSize(view) > Len(buffer.bytes)

\\* The number of a typed array's elements, or of a DataView's bytes, which is 0 out of bounds.
ViewLength(heap, view) ==
  CASE IsOutOfBounds(heap, view) -> 0
    [] view.viewLength = -1 ->
         (Len(ViewedBytes(heap, view)) - view.byteOffset) \\div ViewSize(view)
    [] OTHER -> view.viewLength

RECURSIVE BitsValue(_, _, _)
BitsValue(bits, from, count) ==
  IF count = 0 THEN 0 ELSE bits[from] + 2 * BitsValue(bits, from + 1, count - 1)

LOCAL ByteBits(bytes) ==
  [position \\in 0..(8 * Len(bytes) - 1) |-> (bytes[position \\div 8 + 1] \\div 2^(position % 8)) % 2]

\\* A float's little-endian bytes as a number, which stops at a fraction, or at a number past TLC's
\\* integers.
LOCAL FloatOf(bytes, exponentBits, fractionBits) ==
  LET bits == ByteBits(bytes)
      isNegative == bits[8 * Len(bytes) - 1] = 1
      exponent == BitsValue(bits, fractionBits, exponentBits)
      power == exponent - (2^(exponentBits - 1) - 1)
      shift == fractionBits - power
      isFractionZero == \\A position \\in 0..(fractionBits - 1) : bits[position] = 0
      magnitude ==
        IF shift >= 0
        THEN 2^power + BitsValue(bits, shift, fractionBits - shift)
        ELSE 2^power + BitsValue(bits, 0, fractionBits) * 2^(-shift)
  IN CASE exponent = 2^exponentBits - 1 /\\ isFractionZero ->
            IF isNegative THEN NegativeInfinity ELSE Infinity
       [] exponent = 2^exponentBits - 1 -> NaN
       [] exponent = 0 /\\ isFractionZero -> IF isNegative THEN NegativeZero ELSE 0
       [] power < 0 \\/ \\E position \\in 0..(shift - 1) : bits[position] = 1 ->
            Assert(FALSE, "tla-ts can't represent a fraction")
       [] power > 30 -> Assert(FALSE, "tla-ts can't represent a number this big")
       [] isNegative -> -magnitude
       [] OTHER -> magnitude

\\* An element's little-endian bytes as the number they hold.
NumberOfBytes(type, bytes) ==
  LET unsigned == BitsValue(ByteBits(bytes), 0, 8 * Len(bytes) - 1)
      isNegative == bytes[Len(bytes)] >= 128
  IN CASE type = "Float16" -> FloatOf(bytes, 5, 10)
       [] type = "Float32" -> FloatOf(bytes, 8, 23)
       [] type = "Float64" -> FloatOf(bytes, 11, 52)
       [] type \\in {"Uint8", "Uint8Clamped", "Uint16"} -> unsigned + (IF isNegative THEN 2^(8 * Len(bytes) - 1) ELSE 0)
       [] type = "Uint32" /\\ isNegative -> Assert(FALSE, "tla-ts can't represent a number this big")
       [] type = "Uint32" -> unsigned
       [] isNegative -> (unsigned - 2^(8 * Len(bytes) - 2)) - 2^(8 * Len(bytes) - 2)
       [] OTHER -> unsigned

\\* How a typed array reads a key: as an index, as a number that is no index, or as a property.
TypedKey(key) ==
  CASE IsSymbol(key) -> "property"
    [] IsIndex(key) -> "index"
    [] key \\in {"-0", "Infinity", "-Infinity", "NaN"} -> "number"
    [] Len(key) > 1 /\\ SubSeq(key, 1, 1) = "-" /\\ IsIndex(SubSeq(key, 2, Len(key))) -> "number"
    [] \\E position \\in DOMAIN Fractions : Fractions[position].text = key -> "number"
    [] /\\ Len(key) > 0
       /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\cup {".", "e", "+"} ->
         Assert(FALSE, "tla-ts can't tell whether this key is a number")
    [] OTHER -> "property"

\\* A typed array's element at an index, or undefined past its end.
TypedElement(heap, ref, index) ==
  LET view == heap.objects[ref[Ref]]
      size == ElementSize(view.elementType)
      start == view.byteOffset + index * size
  IN IF index < ViewLength(heap, view)
     THEN NumberOfBytes(view.elementType, SubSeq(ViewedBytes(heap, view), start + 1, start + size))
     ELSE Undefined

LOCAL TypedArrayGetter == "get %Int8Array.prototype.[[Prototype]]%."

\\* A DisposableStack or an AsyncDisposableStack, whose resources tla-ts follows as it compiles, and which holds whether it's
\\* disposed for its disposed getter.
StackObject(prototype, isAsync) ==
  [EmptyObject EXCEPT !.prototype = prototype] @@ [isDisposed |-> FALSE, isAsync |-> isAsync]

IsStack(heap, value) == IsHeap(value) /\\ "isDisposed" \\in DOMAIN Lookup(heap, value)

SetDisposed(heap, ref) == [heap EXCEPT !.objects[ref[Ref]].isDisposed = TRUE]

\\* The paths of the getters that read a buffer's, a view's, or a DisposableStack's internal slots.
LOCAL ViewGetters ==
  {"get ArrayBuffer.prototype." \\o name : name \\in {"byteLength", "maxByteLength", "resizable", "detached"}}
    \\cup {"get SharedArrayBuffer.prototype." \\o name : name \\in {"byteLength", "maxByteLength", "growable"}}
    \\cup {"get DataView.prototype." \\o name : name \\in {"buffer", "byteLength", "byteOffset"}}
    \\cup {TypedArrayGetter \\o name : name \\in {"buffer", "byteLength", "byteOffset", "length", "@@toStringTag"}}
    \\cup {"get DisposableStack.prototype.disposed", "get AsyncDisposableStack.prototype.disposed"}

LOCAL HasPrefix(text, prefix) == Len(text) >= Len(prefix) /\\ SubSeq(text, 1, Len(prefix)) = prefix

LOCAL GetterPath(getter) == IF IsRef(getter) /\\ TypeOf(getter[Ref]) = "string" THEN getter[Ref] ELSE ""

\\* What one of those getters gives for a receiver.
LOCAL ViewGet(heap, path, receiver) ==
  LET object == heap.objects[receiver[Ref]]
      name(prefix) == SubSeq(path, Len(prefix) + 1, Len(path))
      wrong == Assert(FALSE, "tla-ts can't throw the TypeError of a getter on another kind of object")
      isShared == HasPrefix(path, "get Shared")
  IN CASE path \\in {"get DisposableStack.prototype.disposed", "get AsyncDisposableStack.prototype.disposed"} ->
            IF IsStack(heap, receiver) /\\ object.isAsync = HasPrefix(path, "get Async")
            THEN object.isDisposed
            ELSE wrong
       [] path = TypedArrayGetter \\o "@@toStringTag" ->
            IF IsTypedArray(heap, receiver) THEN object.elementType \\o "Array" ELSE Undefined
       [] HasPrefix(path, TypedArrayGetter) ->
            CASE ~IsTypedArray(heap, receiver) -> wrong
              [] name(TypedArrayGetter) = "buffer" -> object.viewed
              [] IsOutOfBounds(heap, object) -> 0
              [] name(TypedArrayGetter) = "length" -> ViewLength(heap, object)
              [] name(TypedArrayGetter) = "byteLength" ->
                   ViewLength(heap, object) * ElementSize(object.elementType)
              [] OTHER -> object.byteOffset
       [] HasPrefix(path, "get DataView.") ->
            CASE ~IsDataView(heap, receiver) -> wrong
              [] name("get DataView.prototype.") = "buffer" -> object.viewed
              [] IsOutOfBounds(heap, object) ->
                   Assert(FALSE, "tla-ts can't throw the TypeError of a DataView out of bounds")
              [] name("get DataView.prototype.") = "byteLength" -> ViewLength(heap, object)
              [] OTHER -> object.byteOffset
       [] ~IsBuffer(heap, receiver) \\/ object.isShared # isShared -> wrong
       [] OTHER ->
            LET field == IF isShared THEN name("get SharedArrayBuffer.prototype.")
                         ELSE name("get ArrayBuffer.prototype.")
            IN CASE field = "byteLength" -> Len(object.bytes)
                 [] field = "maxByteLength" ->
                      IF object.maxLength = Undefined THEN Len(object.bytes) ELSE object.maxLength
                 [] field \\in {"resizable", "growable"} -> object.maxLength # Undefined
                 [] OTHER -> object.isDetached

\\* Whether one of those getters reads the receiver's slots rather than throwing a TypeError: a typed
\\* array getter a typed array's, a DataView getter a view's, and a buffer getter a buffer's of its
\\* kind. A typed array's @@toStringTag gives undefined for any other value.
LOCAL ViewReceives(heap, path, receiver) ==
  CASE path = TypedArrayGetter \\o "@@toStringTag" -> TRUE
    [] HasPrefix(path, TypedArrayGetter) -> IsTypedArray(heap, receiver)
    [] HasPrefix(path, "get DataView.") -> IsDataView(heap, receiver)
    [] OTHER ->
         /\\ IsBuffer(heap, receiver)
         /\\ heap.objects[receiver[Ref]].isShared = HasPrefix(path, "get Shared")

\\* An object's own properties that hold a key, where a typed array's elements aren't properties.
LOCAL PropertiesOf(heap, ref, key) ==
  IF IsTypedArray(heap, ref) /\\ TypedKey(key) = "property"
  THEN heap.objects[ref[Ref]]
  ELSE Lookup(heap, ref)

\\* A promise that tla-ts follows as it compiles, whose properties the heap doesn't hold.
PromiseObject == [EmptyObject EXCEPT !.prototype = Ref :> "Promise.prototype", !.isOpaque = TRUE]

\\* A promise that tla-ts follows keeps Promise.prototype, as a script can't change the object.
Prototype(heap, ref) ==
  IF \\/ IsTypedArray(heap, ref)
     \\/ /\\ IsHeap(ref)
        /\\ heap.objects[ref[Ref]].isOpaque
        /\\ ToString(heap.objects[ref[Ref]].prototype) = ToString(PromiseObject.prototype)
  THEN heap.objects[ref[Ref]].prototype
  ELSE Lookup(heap, ref).prototype

RECURSIVE Has(_, _, _)
Has(heap, ref, key) ==
  IF IsTypedArray(heap, ref) /\\ TypedKey(key) # "property"
  THEN TypedKey(key) = "index" /\\ ToIndex(key) < ViewLength(heap, heap.objects[ref[Ref]])
  ELSE \\/ key \\in DOMAIN PropertiesOf(heap, ref, key).values
       \\/ LET prototype == Prototype(heap, ref) IN prototype # Null /\\ Has(heap, prototype, key)

\\* An error is a record of its constructor, its message and its name, an AggregateError's also of its
\\* errors, a SuppressedError's also of its error and the error it suppressed, and one that a script
\\* made also of its identity.
IsError(value) ==
  /\\ SubSeq(ToString(value), 1, 1) = "["
  /\\ DOMAIN value \\ {"identity"} \\in {{"constructor", "message", "name"},
                                     {"constructor", "errors", "message", "name"},
                                     {"constructor", "message", "name", "error", "suppressed"}}

\\* An error inherits its other properties from its constructor's prototype. The message of an error
\\* that JavaScript throws differs between engines, and tla-ts gives it none. A script can't read or
\\* change the prototype of an error class that isn't an object tla-ts holds, so its constructor
\\* property is still the class.
LOCAL IsSequenceValue(value) ==
  ~IsRef(value) /\\ TypeOf(value) = "object" /\\ SubSeq(ToString(value), 1, 2) = "<<"

LOCAL IsRegExp(heap, value) == IsHeap(value) /\\ "regexp" \\in DOMAIN heap.objects[value[Ref]]

LOCAL IsRegExpPrototype(value) == IsRef(value) /\\ ~IsHeap(value) /\\ value[Ref] = "RegExp.prototype"

\\* The getters of RegExp.prototype that read a regexp's record, which flags doesn't.
LOCAL RegExpGetters ==
  {"get RegExp.prototype." \\o name :
     name \\in {"source", "hasIndices", "global", "ignoreCase", "multiline", "dotAll", "unicode",
              "unicodeSets", "sticky"}}

\\* What one of those getters gives for a regexp or RegExp.prototype.
LOCAL RegExpGet(heap, path, receiver) ==
  LET name == SubSeq(path, Len("get RegExp.prototype.") + 1, Len(path))
  IN CASE IsRegExp(heap, receiver) -> heap.objects[receiver[Ref]].regexp[name]
       [] IsRegExpPrototype(receiver) -> IF name = "source" THEN "(?:)" ELSE Undefined
       [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of a getter on another kind of object")

\\* A read of a key from an object or its prototypes, where a getter that reads a buffer's or a view's
\\* internal slots reads the receiver's. An array outside the heap, which a value typed only as
\\* array-like may hold, holds its elements and its length, and reads the rest from its prototype.
RECURSIVE GetFrom(_, _, _, _)
GetFrom(heap, ref, key, receiver) ==
  CASE IsSequenceValue(ref) ->
         (CASE key = "length" -> Len(ref)
            [] TypedKey(key) = "index" /\\ ToIndex(key) < Len(ref) -> ref[ToIndex(key) + 1]
            [] OTHER -> GetFrom(heap, Ref :> "Array.prototype", key, receiver))
    [] IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" ->
         IF TypedKey(key) = "index" THEN TypedElement(heap, ref, ToIndex(key)) ELSE Undefined
    [] OTHER ->
         LET object == PropertiesOf(heap, ref, key)
             path == GetterPath(object.values[key].get)
         IN CASE key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path \\in ViewGetters -> ViewGet(heap, path, receiver)
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path \\in RegExpGetters -> RegExpGet(heap, path, receiver)
              [] key \\in DOMAIN object.values -> Value(object, key)
              [] object.prototype = Null -> Undefined
              [] OTHER -> GetFrom(heap, object.prototype, key, receiver)

RECURSIVE Get(_, _, _)
Get(heap, ref, key) ==
  IF ~IsRef(ref) /\\ IsError(ref)
  THEN CASE key = "message" /\\ ref.message # "" -> ref.message
         [] key = "message" -> Assert(FALSE, "tla-ts can't read the message of this error")
         [] key = "constructor" /\\ ~IsHeap(ref.constructor) /\\ ~IsBuiltIn(ref.constructor) ->
              ref.constructor
         [] key \\in {"error", "suppressed"} /\\ key \\in DOMAIN ref -> ref[key]
         [] key = "errors" /\\ "errors" \\in DOMAIN ref -> ref.errors
         [] OTHER -> Get(heap, Get(heap, ref.constructor, "prototype"), key)
  ELSE GetFrom(heap, ref, key, ref)

\\* A generator object that tla-ts follows, which is neither a promise nor a function.
IsGeneratorObject(heap, ref) ==
  LET object == heap.objects[ref[Ref]]
  IN /\\ object.isOpaque
     /\\ "code" \\notin DOMAIN object
     /\\ ToString(object.prototype) # ToString(PromiseObject.prototype)

\\* Whether any object on the heap, or any built-in that a script changed, has a then.
HasAnyThen(heap) ==
  \\/ \\E ref \\in DOMAIN heap.objects :
       "values" \\in DOMAIN heap.objects[ref] /\\ "then" \\in DOMAIN heap.objects[ref].values
  \\/ \\E key \\in DOMAIN heap.changed :
       "values" \\in DOMAIN heap.changed[key] /\\ "then" \\in DOMAIN heap.changed[key].values

\\* Whether resolving a promise with a value would call the value's then, which tla-ts doesn't, or
\\* follow a promise that tla-ts can't tell. A then that isn't callable leaves the value a value, and
\\* a getter that tla-ts can't call stops the check.
\\* An object that tla-ts keeps outside the heap, such as an array, inherits from Array.prototype or
\\* Object.prototype, which a script may give a then. A generator object's prototypes aren't on the
\\* heap, so it may have a then only where some object does.
IsThenable(heap, value, arrayPrototype, objectPrototype) ==
  IF IsRef(value)
  THEN IF IsHeap(value) /\\ heap.objects[value[Ref]].isOpaque
       THEN IF IsGeneratorObject(heap, value) THEN HasAnyThen(heap) ELSE TRUE
       ELSE TypeOfIn(heap, Get(heap, value, "then")) = "function"
  ELSE /\\ value # Null
       /\\ TypeOf(value) = "object"
       /\\ Has(heap, arrayPrototype, "then") \\/ Has(heap, objectPrototype, "then")

\\* Whether a value is an object on the heap whose then a job can call.
HasCallableThen(heap, value) ==
  /\\ IsRef(value)
  /\\ ~(IsHeap(value) /\\ heap.objects[value[Ref]].isOpaque)
  /\\ TypeOfIn(heap, Get(heap, value, "then")) = "function"

\\* The heap after a pattern reads keys of an object, which TLC would read only where something
\\* reads what the pattern binds, so that a getter that tla-ts can't call stops the check.
ReadKeys(heap, ref, keys) ==
  CASE ref \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of destructuring " \\o ToString(ref))
    [] \\A key \\in keys : Get(heap, ref, key) = Get(heap, ref, key) -> heap
    [] OTHER -> heap

\\* TLC builds a function's values only where something reads them. This reads each one, so a getter
\\* that tla-ts can't call stops the check even where nothing reads what it gives.
LOCAL Read(values) ==
  IF \\A position \\in DOMAIN values : values[position] = values[position] THEN values ELSE values

ObjectKeys(heap, ref) == EnumerableKeys(Lookup(heap, ref))

ObjectValues(heap, ref) ==
  LET keys == ObjectKeys(heap, ref)
  IN  Read([position \\in DOMAIN keys |-> Get(heap, ref, keys[position])])

\\* The object that an object pattern's rest element makes, which holds the enumerable own properties
\\* of the object that the pattern reads, except those it names, in their order.
\\* The rest of an object, where read holds the values that its getters gave.
RestObject(heap, ref, excluded, read) ==
  LET keys == SelectSeq(EnumerableOwnKeys(Lookup(heap, ref)), LAMBDA key : key \\notin excluded)
      kept == {keys[position] : position \\in DOMAIN keys}
  IN [EmptyObject EXCEPT !.keys = keys,
                         !.values = Read([key \\in kept |->
                                           IF key \\in DOMAIN read THEN read[key]
                                           ELSE Get(heap, ref, key)]),
                         !.attributes = [key \\in kept |-> Writable]]

ObjectEntries(heap, ref) ==
  LET keys == ObjectKeys(heap, ref)
  IN  Read([position \\in DOMAIN keys |-> <<keys[position], Get(heap, ref, keys[position])>>])

LOCAL IsDigitText(text) ==
  \\A position \\in 1..Len(text) : SubSeq(text, position, position) \\in Digits \\ {"-"}

LOCAL Alphanumerics == "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

LOCAL CharactersOf(text) == {SubSeq(text, position, position) : position \\in 1..Len(text)}

\\* The digits of a radix, where a digit past 9 is a letter of either case.
LOCAL DigitsOf(radix) ==
  {SubSeq(Alphanumerics, value + 1, value + 1) : value \\in 0..(radix - 1)}
    \\cup {SubSeq(Alphanumerics, value + 27, value + 27) : value \\in 10..(radix - 1)}

LOCAL DigitValue(character) ==
  CHOOSE value \\in 0..35 :
    \\/ SubSeq(Alphanumerics, value + 1, value + 1) = character
    \\/ value >= 10 /\\ SubSeq(Alphanumerics, value + 27, value + 27) = character

RECURSIVE StripZeros(_)
StripZeros(text) ==
  IF Len(text) > 1 /\\ SubSeq(text, 1, 1) = "0" THEN StripZeros(Tail(text)) ELSE text

\\* The digits of a radix that a TLC integer always holds.
LOCAL MaxDigits(radix) == CASE radix = 2 -> 30 [] radix = 8 -> 10 [] radix = 10 -> 9 [] OTHER -> 7

RECURSIVE ParseDigits(_, _)
ParseDigits(text, radix) ==
  IF text = ""
  THEN 0
  ELSE radix * ParseDigits(SubSeq(text, 1, Len(text) - 1), radix)
         + DigitValue(SubSeq(text, Len(text), Len(text)))

LOCAL ParseFitting(text, radix) ==
  LET stripped == StripZeros(text)
  IN IF Len(stripped) <= MaxDigits(radix)
     THEN ParseDigits(stripped, radix)
     ELSE Assert(FALSE, "tla-ts can't represent the number " \\o text)

LOCAL Prefix(text, length) == IF Len(text) < length THEN text ELSE SubSeq(text, 1, length)

\\* ToNumber of a string, without whitespace, which Use takes as its kind, its sign, and its
\\* magnitude truncated toward 0. TLC evaluates an argument only where Use reads it, so a magnitude
\\* too big for TLC doesn't stop the check where Use doesn't need it.
LOCAL ReadNumber(text, Use(_, _, _)) ==
  LET prefix == Prefix(text, 2)
      body == SubSeq(text, 3, Len(text))
      radix == CASE prefix \\in {"0x", "0X"} -> 16
                 [] prefix \\in {"0o", "0O"} -> 8
                 [] prefix \\in {"0b", "0B"} -> 2
                 [] OTHER -> 10
      isNegative == Prefix(text, 1) = "-"
      unsigned == IF Prefix(text, 1) \\in {"+", "-"} THEN Tail(text) ELSE text
      exponents == {position \\in 1..Len(unsigned) : SubSeq(unsigned, position, position) \\in {"e", "E"}}
      exponent == IF exponents = {} THEN Len(unsigned) + 1 ELSE CHOOSE position \\in exponents : TRUE
      mantissa == SubSeq(unsigned, 1, exponent - 1)
      exponentText == SubSeq(unsigned, exponent + 1, Len(unsigned))
      exponentDigits ==
        IF Prefix(exponentText, 1) \\in {"+", "-"} THEN Tail(exponentText) ELSE exponentText
      points == {position \\in 1..Len(mantissa) : SubSeq(mantissa, position, position) = "."}
      point == IF points = {} THEN Len(mantissa) + 1 ELSE CHOOSE position \\in points : TRUE
      whole == SubSeq(mantissa, 1, point - 1)
      fraction == SubSeq(mantissa, point + 1, Len(mantissa))
      isDecimal ==
        /\\ \\A left, right \\in exponents : left = right
        /\\ \\A left, right \\in points : left = right
        /\\ exponents = {} \\/ exponentDigits # ""
        /\\ Len(whole) + Len(fraction) > 0
        /\\ IsDigitText(whole) /\\ IsDigitText(fraction) /\\ IsDigitText(exponentDigits)
      significand == StripZeros(whole \\o fraction)
      shift ==
        (IF Prefix(exponentText, 1) = "-" THEN -1 ELSE 1) * ParseFitting(exponentDigits, 10)
          - Len(fraction)
      kept == Len(significand) + shift
      magnitude ==
        CASE significand = "0" \\/ kept <= 0 -> 0
          [] shift >= 0 -> ParseFitting(significand, 10) * 10 ^ shift
          [] OTHER -> ParseFitting(SubSeq(significand, 1, kept), 10)
      isExact ==
        \\/ significand = "0"
        \\/ shift >= 0
        \\/ \\A position \\in (IF kept < 1 THEN 1 ELSE kept + 1)..Len(significand) :
             SubSeq(significand, position, position) = "0"
  IN CASE text = "" -> Use("integer", FALSE, 0)
       [] radix # 10 /\\ body # "" /\\ CharactersOf(body) \\subseteq DigitsOf(radix) ->
            Use("integer", FALSE, ParseFitting(body, radix))
       [] isDecimal -> Use(IF isExact THEN "integer" ELSE "fraction", isNegative, magnitude)
       [] text \\in {"Infinity", "+Infinity", "-Infinity"} -> Use("infinity", isNegative, 0)
       [] \\/ CharactersOf(text) \\subseteq CharactersOf(Alphanumerics) \\cup {"+", "-", ".", "_", "!"}
          \\/ CharactersOf(text) \\cap CharactersOf("[]{}()<>,;:#$%&*=?@^|~") # {} ->
            Use("nan", FALSE, 0)
       [] OTHER -> Assert(FALSE, "tla-ts can't convert " \\o ToString(text) \\o " to a number")

\\* ToLength of a string, truncated and clamped at 0.
LOCAL ToLengthOfText(text) ==
  ReadNumber(text, LAMBDA kind, isNegative, magnitude :
    CASE kind = "nan" \\/ isNegative -> 0
      [] kind = "infinity" -> Assert(FALSE, "tla-ts can't convert " \\o ToString(text) \\o " to a length")
      [] OTHER -> magnitude)

\\* ToLength of a length property.
ToLength(value) ==
  CASE value \\in {Undefined, Null} -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] value = Infinity -> Assert(FALSE, "tla-ts can't represent this value")
    [] value \\in SpecialNumbers -> 0
    [] IsFraction(value) -> IF Floor(value) < 0 THEN 0 ELSE Floor(value)
    [] TypeOf(value) = "number" -> IF value < 0 THEN 0 ELSE value
    [] TypeOf(value) = "string" -> ToLengthOfText(value)
    [] value = <<>> -> 0
    [] OTHER -> Assert(FALSE, "tla-ts can't convert " \\o ToString(value) \\o " to a length")

RECURSIVE KeyCount(_, _)
KeyCount(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN Len(object.keys) + IF object.prototype = Null THEN 0 ELSE KeyCount(heap, object.prototype)

\\* The elements of an array-like object, which has an element at each index below its length.
ArrayLike(heap, ref) ==
  LET length == ToLength(Get(heap, ref, "length"))
  IN IF \\/ length > KeyCount(heap, ref)
        \\/ \\E position \\in 0..(length - 1) : ~Has(heap, ref, ToString(position))
     THEN Assert(FALSE, "tla-ts can't read an array-like object with holes")
     ELSE Read([position \\in 1..length |-> Get(heap, ref, ToString(position - 1))])

\\* An iterator of an array's keys, values, or entries, which reads the array as next steps it, so
\\* that it sees what the script changes in the array meanwhile.
ArrayIterator(heap, array, kind, prototype) ==
  LET allocated == Allocate(heap, [EmptyObject EXCEPT !.prototype = prototype]
                                    @@ [iterated |-> array, index |-> 0, kind |-> kind])
  IN [heap |-> allocated, value |-> Allocated(allocated), isThrown |-> FALSE]

\\* %ArrayIteratorPrototype%.next, which gives a new result object and forgets the array once done.
ArrayIteratorNext(heap, ref) ==
  LET iterator == heap.objects[ref[Ref]]
      array == iterator.iterated
      index == iterator.index
      isDone == array = Undefined \\/ index >= ToLength(Get(heap, array, "length"))
      element == Get(heap, array, ToString(index))
      value == CASE isDone -> Undefined
                 [] iterator.kind = "keys" -> index
                 [] iterator.kind = "values" -> element
                 [] OTHER -> <<index, element>>
      stepped == [heap EXCEPT !.objects[ref[Ref]] =
                    IF isDone THEN [@ EXCEPT !.iterated = Undefined] ELSE [@ EXCEPT !.index = index + 1]]
      allocated == Allocate(stepped, IteratorResult(value, isDone))
  IN IF IsHeap(ref) /\\ "iterated" \\in DOMAIN iterator
     THEN [heap |-> allocated, value |-> Allocated(allocated), isThrown |-> FALSE]
     ELSE Assert(FALSE, "tla-ts can't step an iterator that isn't an array's with its next")

\\* The values of an array-like object at each index below its length, which Get reads, so that a
\\* hole gives what a prototype holds there, or undefined.
ArrayLikeValues(heap, ref) ==
  LET length == ToLength(Get(heap, ref, "length"))
  IN IF length > KeyCount(heap, ref)
     THEN Assert(FALSE, "tla-ts can't read an array-like object this long")
     ELSE Read([position \\in 1..length |-> Get(heap, ref, ToString(position - 1))])

RECURSIVE IndexKeys(_, _)
IndexKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN {key \\in DOMAIN object.values : IsIndex(key)}
       \\cup IF object.prototype = Null THEN {} ELSE IndexKeys(heap, object.prototype)

\\* The elements that an array-like object or its prototypes hold below its length, in order, with
\\* their indices. The array methods that skip holes visit these. A record holds the length, so TLC
\\* reads it even when no element is present.
PresentElements(heap, ref) ==
  LET length == ToLength(Get(heap, ref, "length"))
      present == {position \\in {ToIndex(key) : key \\in IndexKeys(heap, ref)} : position < length}
      indices == [position \\in 1..Cardinality(present) |->
                   CHOOSE element \\in present :
                     Cardinality({other \\in present : other < element}) = position - 1]
  IN [length |-> length,
      indices |-> indices,
      values |-> Read([position \\in DOMAIN indices |-> Get(heap, ref, ToString(indices[position]))])]

\\* The accessor that a write to a key calls, which the object or a prototype holds, or Undefined
\\* where the write makes or changes a data property.
RECURSIVE AccessorOf(_, _, _)
AccessorOf(heap, ref, key) ==
  LET object == PropertiesOf(heap, ref, key)
  IN CASE key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor" THEN object.values[key] ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorOf(heap, object.prototype, key)

RECURSIVE AccessorFieldOf(_, _, _, _)
AccessorFieldOf(heap, ref, key, field) ==
  LET object == PropertiesOf(heap, ref, key)
  IN CASE key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor"
            THEN object.values[key][field]
            ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorFieldOf(heap, object.prototype, key, field)

GetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "get")

SetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "set")

\\* The TypeError that a read throws where it runs a getter of a buffer or a view on another kind
\\* of object, or "".
ReadError(heap, ref, key) ==
  LET path == GetterPath(GetterOf(heap, ref, key))
  IN IF path \\in ViewGetters /\\ ~ViewReceives(heap, path, ref) THEN "TypeError" ELSE ""

\\* Whether a write runs the __proto__ setter of Object.prototype.
IsProtoWrite(heap, ref, key) == GetterPath(SetterOf(heap, ref, key)) = "set Object.prototype.__proto__"

RECURSIVE IsWritable(_, _, _)
IsWritable(heap, ref, key) ==
  LET object == PropertiesOf(heap, ref, key)
  IN IF key \\in DOMAIN object.values
     THEN object.attributes[key].writable
     ELSE object.prototype = Null \\/ IsWritable(heap, object.prototype, key)

\\* Whether a write puts its value without a TypeError. %ThrowTypeError%, the setter of
\\* Function.prototype's arguments and caller, always throws one.
CanPut(heap, ref, key) ==
  LET accessor == AccessorOf(heap, ref, key)
      object == PropertiesOf(heap, ref, key)
  IN CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> TRUE
       [] accessor = Undefined ->
            /\\ IsWritable(heap, ref, key)
            /\\ key \\in DOMAIN object.values \\/ object.extensible
       [] OTHER ->
            /\\ accessor.set # Undefined
            /\\ GetterPath(accessor.set) # "get Function.prototype.arguments"

RECURSIVE IsPrototypeOf(_, _, _)
IsPrototypeOf(heap, owner, ref) ==
  LET prototype == Prototype(heap, ref)
  IN /\\ prototype # Null
     /\\ \\/ ToString(prototype) = ToString(owner)
        \\/ IsPrototypeOf(heap, owner, prototype)

\\* Whether a value of any type inherits from a prototype, where only an object can.
InheritsFrom(heap, owner, value) ==
  CASE IsRef(value) -> IsPrototypeOf(heap, owner, value)
    [] value = Null \\/ TypeOf(value) \\notin {"object", "function"} -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell what this value inherits from")

\\* Whether a value that may be any value is an error that one of the constructors made.
IsErrorOf(value, constructors) == IsError(value) /\\ value.constructor \\in constructors

\\* Whether a value that may be any value, or an object on the heap, is an error that one of the
\\* constructors made.
IsInstanceOfError(heap, value, constructors, name) ==
  CASE IsRef(value) /\\ ~IsPrototypeOf(heap, Ref :> "Error.prototype", value) -> FALSE
    [] IsRef(value) ->
         Assert(FALSE, "tla-ts can't tell whether this object is an instance of " \\o name)
    [] OTHER -> IsErrorOf(value, constructors)

CanDelete(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN key \\notin DOMAIN object.values \\/ object.attributes[key].configurable

Delete(heap, ref, key) ==
  LET object == Lookup(heap, ref)
      kept == DOMAIN object.values \\ {key}
  IN IF key \\in DOMAIN object.values
     THEN Update(heap, ref, [object EXCEPT !.keys = SelectSeq(@, LAMBDA other : other # key),
                                           !.values = [other \\in kept |-> @[other]],
                                           !.attributes = [other \\in kept |-> @[other]]])
     ELSE heap

\\* Whether a value is one that only itself equals: anything but an object outside the heap, or an
\\* error that a script made, whose record holds its identity.
HasIdentity(value) ==
  \\/ TypeOf(value) # "object"
  \\/ value = Null
  \\/ IsRef(value)
  \\/ SubSeq(ToString(value), 1, 1) = "[" /\\ "identity" \\in DOMAIN value

\\* Whether two values that a script compares are one, where two equal objects outside the heap may
\\* still be two objects.
IsIdentical(left, right) ==
  /\\ left = right
  /\\ Assert(HasIdentity(left), "tla-ts can't tell whether two equal objects are the same object")

SameValue(left, right) ==
  /\\ TypeOf(left) = TypeOf(right)
  /\\ Assert(HasIdentity(left) \\/ HasIdentity(right), "tla-ts can't compare objects by identity")
  /\\ IF IsRef(left) \\/ IsRef(right) THEN ToString(left) = ToString(right) ELSE left = right

\\* JavaScript's ===, where NaN differs from itself and -0 equals 0.
StrictEquals(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN left # NaN /\\ right # NaN /\\ Magnitude(left) = Magnitude(right)
  ELSE SameValue(left, right)

\\* What includes and Set compare by, where NaN equals itself and -0 equals 0.
SameValueZero(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN Magnitude(left) = Magnitude(right)
  ELSE SameValue(left, right)

\\* Whether a value that a proxy's get or set trap gives or takes agrees with a property that the
\\* target can't change, whose accessor must then have the function the trap stands for.
ProxyAgrees(heap, target, key, value, accessor) ==
  LET object == Lookup(heap, target)
      attributes == object.attributes[key]
  IN CASE key \\notin DOMAIN object.values \\/ attributes.configurable -> TRUE
       [] attributes.kind = "data" -> attributes.writable \\/ SameValue(value, object.values[key])
       [] attributes.kind = "accessor" ->
            object.values[key][accessor] # Undefined \\/ (accessor = "get" /\\ value = Undefined)
       [] OTHER -> Assert(FALSE, "tla-ts can't compare a trap's value with the target's")

\\* Whether a proxy's has or deleteProperty trap may say that it lacks a key: the target lacks it, or
\\* can change it and can grow.
ProxyCanLack(heap, target, key) ==
  LET object == Lookup(heap, target)
  IN key \\notin DOMAIN object.values \\/ (object.attributes[key].configurable /\\ object.extensible)

StringOf(value) ==
  CASE value = Undefined -> "undefined"
    [] value = Null -> "null"
    [] TypeOf(value) = "boolean" -> IF value THEN "true" ELSE "false"
    [] TypeOf(value) = "string" -> value
    [] value = NegativeInfinity -> "-Infinity"
    [] value = NegativeZero -> "0"
    [] IsFraction(value) -> Fractions[FractionPosition(value)].text
    [] TypeOf(value) = "number" -> ToString(value)
    [] IsBigInt(value) -> ToString(value[Big])
    [] OTHER -> Assert(FALSE, "tla-ts can't convert objects to strings")

\\* Array.prototype.join of values that aren't all strings, which writes undefined and null as
\\* empty strings.
JoinValues(sequence, separator) ==
  Join([position \\in DOMAIN sequence |->
          IF sequence[position] \\in {Undefined, Null} THEN "" ELSE StringOf(sequence[position])],
       separator)

\\* The heap after Symbol(description) makes a symbol, which holds the symbol's description.
NewSymbol(heap, description) ==
  IF Len(WellKnownSymbols) + Len(heap.symbols) < Len(Symbols)
  THEN [heap EXCEPT !.symbols =
          Append(@, IF description = Undefined THEN Undefined ELSE StringOf(description))]
  ELSE Assert(FALSE, "tla-ts can't make more symbols than a script has calls of Symbol")

\\* The symbol that the last call of Symbol made.
NewestSymbol(heap) == Symbols[Len(WellKnownSymbols) + Len(heap.symbols)]

WellKnownSymbol(name) ==
  Symbols[CHOOSE position \\in DOMAIN WellKnownSymbols : WellKnownSymbols[position] = name]

SymbolDescription(heap, symbol) ==
  LET position == SymbolPosition(symbol)
  IN IF position <= Len(WellKnownSymbols)
     THEN "Symbol." \\o WellKnownSymbols[position]
     ELSE heap.symbols[position - Len(WellKnownSymbols)]

\\* The heap after Symbol.for(key), which makes a symbol for the key where the registry holds none.
RegisterSymbol(heap, key) ==
  LET text == StringOf(key)
      made == NewSymbol(heap, text)
  IN IF text \\in DOMAIN heap.registry
     THEN heap
     ELSE [made EXCEPT !.registry = (text :> NewestSymbol(made)) @@ @]

RegisteredSymbol(heap, key) == heap.registry[StringOf(key)]

\\* Whether Symbol.for made a symbol, which a weak collection can't hold.
IsRegisteredSymbol(heap, value) == \\E key \\in DOMAIN heap.registry : heap.registry[key] = value

SymbolKeyFor(heap, symbol) ==
  LET keys == {key \\in DOMAIN heap.registry : heap.registry[key] = symbol}
  IN CASE ~IsSymbol(symbol) ->
            Assert(FALSE, "tla-ts can't throw the TypeError of Symbol.keyFor on a value that isn't a symbol")
       [] keys = {} -> Undefined
       [] OTHER -> CHOOSE key \\in keys : TRUE

\\* What String(symbol) and symbol.toString() give.
SymbolString(heap, symbol) ==
  LET description == SymbolDescription(heap, symbol)
  IN "Symbol(" \\o (IF description = Undefined THEN "" ELSE description) \\o ")"

PropertyKey(value) == IF IsSymbol(value) THEN value ELSE StringOf(value)

\\* Whether an array without holes has an own property: its length, or an index below the length.
SequenceHasOwn(sequence, key) ==
  LET text == PropertyKey(key)
  IN text = "length" \\/ \\E position \\in DOMAIN sequence : ToString(position - 1) = text

\\* Whether an object still holds a built-in function, which tla-ts runs as it compiles.
HoldsBuiltIn(heap, ref, key, path) == SameValue(Get(heap, ref, key), Ref :> path)

\\* What a symbol's toString, valueOf, or description gives, where Symbol.prototype still holds the
\\* built-in method or getter.
SymbolProperty(heap, symbol, prototype, name) ==
  LET found == IF name = "description"
               THEN GetterOf(heap, prototype, name)
               ELSE Get(heap, prototype, name)
      builtIn == Ref :> ((IF name = "description" THEN "get " ELSE "") \\o "Symbol.prototype." \\o name)
  IN CASE ~SameValue(found, builtIn) ->
            Assert(FALSE, "tla-ts can't call a symbol's " \\o name \\o " that a script replaced")
       [] name = "toString" -> SymbolString(heap, symbol)
       [] name = "valueOf" -> symbol
       [] OTHER -> SymbolDescription(heap, symbol)

\\* The text that a string method reads, where tla-ts reads only strings.
LOCAL Text(value) ==
  IF TypeOf(value) = "string"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a string method on a value that isn't a string")

\\* The string that String.prototype.method.call reads from the value that it calls the method on.
ThisString(value) ==
  IF value \\in {Undefined, Null}
  THEN Assert(FALSE, "tla-ts can't throw the TypeError of a string method on undefined or null")
  ELSE StringOf(value)

\\* The primitive that a String, Number, or Boolean object holds, for a call of a method that it
\\* reads from its prototype, which must still hold the built-in method. The prototype itself holds
\\* "", 0, or false.
WrappedPrimitive(heap, ref, kind, method) ==
  LET isPrototype == IsRef(ref) /\\ ~IsHeap(ref) /\\ ref[Ref] = kind \\o ".prototype"
      isWrapper ==
        /\\ IsHeap(ref)
        /\\ "primitive" \\in DOMAIN Lookup(heap, ref)
        /\\ TypeOf(Lookup(heap, ref).primitive) =
             CASE kind = "String" -> "string" [] kind = "Number" -> "number" [] OTHER -> "boolean"
  IN IF /\\ isPrototype \\/ isWrapper
        /\\ IsRef(Get(heap, ref, method))
        /\\ ~IsHeap(Get(heap, ref, method))
        /\\ Get(heap, ref, method)[Ref] = kind \\o ".prototype." \\o method
     THEN CASE isWrapper -> Lookup(heap, ref).primitive
            [] kind = "String" -> ""
            [] kind = "Number" -> 0
            [] OTHER -> FALSE
     ELSE Assert(FALSE, "tla-ts can't call this method on " \\o ToString(ref))

PrimitiveOf(value) == value

\\* What valueOf gives for a primitive whose prototype, one of Boolean.prototype, Number.prototype,
\\* or String.prototype, still holds the built-in valueOf, for a wrapper object, or for an object
\\* that reads Object.prototype.valueOf.
ValueOf(heap, value, prototypes) ==
  LET position == CASE TypeOf(value) = "boolean" -> 1
                    [] TypeOf(value) = "number" -> 2
                    [] TypeOf(value) = "string" -> 3
                    [] OTHER -> 0
      kinds == <<"Boolean", "Number", "String">>
      method == IF position = 0 THEN Undefined ELSE Get(heap, prototypes[position], "valueOf")
  IN CASE position # 0 /\\ IsRef(method) /\\ ~IsHeap(method) /\\
            method[Ref] = kinds[position] \\o ".prototype.valueOf" -> value
       [] IsHeap(value) /\\ "primitive" \\in DOMAIN Lookup(heap, value) ->
            WrappedPrimitive(heap, value, kinds[CASE TypeOf(Lookup(heap, value).primitive) = "boolean" -> 1
                                                 [] TypeOf(Lookup(heap, value).primitive) = "number" -> 2
                                                 [] OTHER -> 3], "valueOf")
       [] /\\ IsHeap(value)
          /\\ IsRef(Get(heap, value, "valueOf"))
          /\\ ~IsHeap(Get(heap, value, "valueOf"))
          /\\ Get(heap, value, "valueOf")[Ref] = "Object.prototype.valueOf" -> value
       [] OTHER -> Assert(FALSE, "tla-ts can't call valueOf on " \\o ToString(value))

BooleanToString(value) == IF value THEN "true" ELSE "false"

\\* The boolean that Boolean.prototype.method.call reads from the value that it calls the method on.
ThisBoolean(value) ==
  IF TypeOf(value) = "boolean"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a Boolean.prototype method on a value that isn't a boolean")

\\* The number that Number.prototype.method.call reads from the value that it calls the method on.
ThisNumber(value) ==
  IF TypeOf(value) = "number"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a Number.prototype method on a value that isn't a number")

\\* The BigInt that BigInt.prototype.method.call reads from the value that it calls the method on.
ThisBigInt(value) ==
  IF IsBigInt(value)
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a BigInt.prototype method on a value that isn't a BigInt")

\\* BigInt(value) of a primitive, where a number must be an integer.
ToBigInt(value) ==
  CASE IsBigInt(value) -> value
    [] value \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of converting this value to a BigInt")
    [] TypeOf(value) = "boolean" -> Big :> IF value THEN 1 ELSE 0
    [] value = NegativeZero -> Big :> 0
    [] IsInteger(value) -> Big :> value
    [] TypeOf(value) = "number" ->
         Assert(FALSE, "tla-ts can't throw the RangeError of converting this number to a BigInt")
    [] OTHER -> Assert(FALSE, "tla-ts can't convert this value to a BigInt")

\\* Number(value) of a BigInt.
NumberOfBigInt(value) == IntegerOfBigInt(value)

\\* ToIntegerOrInfinity of a number or undefined.
LOCAL IntegerOf(value) ==
  CASE value \\in {Undefined, NaN, NegativeZero} -> 0
    [] IsFraction(value) -> Truncate(value)
    [] OTHER -> value

\\* An integer or an infinity, clamped to 0..length.
LOCAL Clamp(value, length) ==
  CASE value = Infinity -> length
    [] value = NegativeInfinity -> 0
    [] value < 0 -> 0
    [] value > length -> length
    [] OTHER -> value

LOCAL OccursAt(text, search, index) ==
  index + Len(search) <= Len(text) /\\ SubSeq(text, index + 1, index + Len(search)) = search

LOCAL Occurrences(text, search) ==
  {index \\in 0..(Len(text) - Len(search)) : OccursAt(text, search, index)}

StringAt(value, index) ==
  LET text == Text(value)
      relative == RelativeIndex(IntegerOf(index), Len(text))
  IN  IF relative >= 0 /\\ relative < Len(text)
      THEN SubSeq(text, relative + 1, relative + 1)
      ELSE Undefined

CharAt(value, index) ==
  LET text == Text(value)
      position == IntegerOf(index)
  IN  IF position \\notin {Infinity, NegativeInfinity} /\\ position >= 0 /\\ position < Len(text)
      THEN SubSeq(text, position + 1, position + 1)
      ELSE ""

StringSlice(value, start, end) ==
  LET text == Text(value)
  IN  SubSeq(text,
             ClampedIndex(IntegerOf(start), Len(text)) + 1,
             IF end = Undefined THEN Len(text) ELSE ClampedIndex(IntegerOf(end), Len(text)))

Substring(value, start, end) ==
  LET text == Text(value)
      from == Clamp(IntegerOf(start), Len(text))
      to == IF end = Undefined THEN Len(text) ELSE Clamp(IntegerOf(end), Len(text))
  IN  IF from < to THEN SubSeq(text, from + 1, to) ELSE SubSeq(text, to + 1, from)

\\* String.prototype.substr, which takes length characters from start, where a negative start counts
\\* from the end.
Substr(value, start, length) ==
  LET text == Text(value)
      from == ClampedIndex(IntegerOf(start), Len(text))
      count == IF length = Undefined THEN Len(text) ELSE Clamp(IntegerOf(length), Len(text))
  IN  SubSeq(text, from + 1, IF from + count > Len(text) THEN Len(text) ELSE from + count)

StringIndexOf(value, search, position) ==
  LET text == Text(value)
      found == {index \\in Occurrences(text, Text(search)) :
                  index >= Clamp(IntegerOf(position), Len(text))}
  IN  IF found = {} THEN -1 ELSE CHOOSE index \\in found : \\A other \\in found : index <= other

\\* String.prototype.lastIndexOf, which searches from the end where position is NaN.
StringLastIndexOf(value, search, position) ==
  LET text == Text(value)
      start == IF position \\in {Undefined, NaN}
               THEN Len(text)
               ELSE Clamp(IntegerOf(position), Len(text))
      found == {index \\in Occurrences(text, Text(search)) : index <= start}
  IN  IF found = {} THEN -1 ELSE CHOOSE index \\in found : \\A other \\in found : index >= other

StringIncludes(value, search, position) == StringIndexOf(value, search, position) # -1

StartsWith(value, search, position) ==
  LET text == Text(value)
  IN  OccursAt(text, Text(search), Clamp(IntegerOf(position), Len(text)))

EndsWith(value, search, position) ==
  LET text == Text(value)
      end == IF position = Undefined THEN Len(text) ELSE Clamp(IntegerOf(position), Len(text))
  IN  end >= Len(Text(search)) /\\ OccursAt(text, search, end - Len(search))

\\* The characters whose codes are below 128, in order. tla-ts tells the codes of these only.
LOCAL AsciiCharacters == ${formatString(String.fromCharCode(...Array.from({ length: 128 }, (_, code) => code)))}

\\* String.fromCharCode, which takes each code modulo 2^16, or String.fromCodePoint, which throws a
\\* RangeError for a number that isn't a code point. tla-ts makes the characters of ASCII only.
RECURSIVE FromCharCodes(_, _)
FromCharCodes(codes, isCodePoint) ==
  IF codes = <<>>
  THEN ""
  ELSE LET code == Head(codes)
           point == CASE code \\in {NaN, Infinity, NegativeInfinity, NegativeZero} -> 0
                      [] isCodePoint -> code
                      [] OTHER -> code % 65536
       IN  CASE isCodePoint /\\ (code \\in {NaN, Infinity, NegativeInfinity} \\/ point < 0 \\/ point > 1114111) ->
                  Assert(FALSE, "tla-ts can't throw the RangeError of String.fromCodePoint")
             [] point >= 128 -> Assert(FALSE, "tla-ts can't make a character outside ASCII")
             [] OTHER ->
                  SubSeq(AsciiCharacters, point + 1, point + 1) \\o FromCharCodes(Tail(codes), isCodePoint)

LOCAL AsciiCodes ==
  [character \\in CharactersOf(AsciiCharacters) |->
     CHOOSE code \\in 0..127 : SubSeq(AsciiCharacters, code + 1, code + 1) = character]

\\* The code of a character, which a for-of visits and charCodeAt reads.
LOCAL CharacterCode(character) ==
  IF character \\in DOMAIN AsciiCodes
  THEN AsciiCodes[character]
  ELSE Assert(FALSE, "tla-ts can't tell the code of a character outside ASCII")

\\* The code of the character at an index, or outside where the index is out of range.
LOCAL CodeAt(value, index, outside) ==
  LET text == Text(value)
      position == IntegerOf(index)
  IN  IF position \\notin {Infinity, NegativeInfinity} /\\ position >= 0 /\\ position < Len(text)
      THEN CharacterCode(SubSeq(text, position + 1, position + 1))
      ELSE outside

CharCodeAt(value, index) == CodeAt(value, index, NaN)

\\* String.prototype.codePointAt, which reads the code of a surrogate pair, though an ASCII
\\* character's code point is its code.
CodePointAt(value, index) == CodeAt(value, index, Undefined)

LOCAL FirstOf(indices) == CHOOSE index \\in indices : \\A other \\in indices : index <= other

\\* The pieces that String.prototype.split cuts a string into at a nonempty separator, at most
\\* limit of them, where a negative limit takes them all.
RECURSIVE SplitPieces(_, _, _, _)
SplitPieces(text, separator, start, limit) ==
  LET found == {index \\in Occurrences(text, separator) : index >= start}
  IN  IF found = {}
      THEN <<SubSeq(text, start + 1, Len(text))>>
      ELSE <<SubSeq(text, start + 1, FirstOf(found))>>
             \\o (IF limit = 1
                 THEN <<>>
                 ELSE SplitPieces(text, separator, FirstOf(found) + Len(separator), limit - 1))

\\* String.prototype.split at a string separator. ToUint32 of a negative limit is past any string's
\\* length, so a negative limit takes every piece.
StringSplit(value, separator, limit) ==
  LET text == Text(value)
      count == CASE limit = Undefined -> -1
                 [] limit \\in {NaN, Infinity, NegativeInfinity, NegativeZero} -> 0
                 [] OTHER -> limit
      head == IF count < 0 \\/ count > Len(text) THEN text ELSE SubSeq(text, 1, count)
  IN  CASE count = 0 -> <<>>
        [] separator = Undefined -> <<text>>
        [] Text(separator) = "" ->
             [position \\in 1..Len(head) |->
                LET character == SubSeq(head, position, position)
                IN  IF character \\in DOMAIN AsciiCodes
                    THEN character
                    ELSE Assert(FALSE, "tla-ts can't split a string with a character outside ASCII")]
        [] text = "" -> <<text>>
        [] OTHER -> SplitPieces(text, separator, 0, count)

\\* GetSubstitution of a replacement template where a string matched, with no captures: $$ writes $,
\\* $& the match, $\` what precedes it, and $' what follows it. Any other $ stays as it is.
RECURSIVE Substitution(_, _, _, _)
Substitution(template, matched, preceding, following) ==
  LET next == IF Len(template) >= 2 THEN SubSeq(template, 2, 2) ELSE ""
      rest == IF Len(template) >= 2 THEN SubSeq(template, 3, Len(template)) ELSE ""
  IN  CASE template = "" -> ""
        [] SubSeq(template, 1, 1) # "$" \\/ next = "" ->
             SubSeq(template, 1, 1) \\o Substitution(Tail(template), matched, preceding, following)
        [] next = "$" -> "$" \\o Substitution(rest, matched, preceding, following)
        [] next = "&" -> matched \\o Substitution(rest, matched, preceding, following)
        [] next = "\`" -> preceding \\o Substitution(rest, matched, preceding, following)
        [] next = "'" -> following \\o Substitution(rest, matched, preceding, following)
        [] OTHER -> "$" \\o Substitution(Tail(template), matched, preceding, following)

\\* The positions where replaceAll replaces a string, where an empty one matches between characters.
RECURSIVE MatchPositions(_, _, _)
MatchPositions(text, search, start) ==
  LET found == {index \\in Occurrences(text, search) : index >= start}
  IN  IF found = {}
      THEN <<>>
      ELSE <<FirstOf(found)>>
             \\o MatchPositions(text, search, FirstOf(found) + (IF search = "" THEN 1 ELSE Len(search)))

\\* A string where each match at the positions becomes its substitution, the rest kept from end on.
RECURSIVE Replaced(_, _, _, _, _)
Replaced(text, search, template, positions, end) ==
  IF positions = <<>>
  THEN SubSeq(text, end + 1, Len(text))
  ELSE LET position == Head(positions)
       IN  SubSeq(text, end + 1, position)
             \\o Substitution(template, search, SubSeq(text, 1, position),
                             SubSeq(text, position + Len(search) + 1, Len(text)))
             \\o Replaced(text, search, template, Tail(positions), position + Len(search))

\\* String.prototype.replace of the first match of a string with a template.
StringReplace(value, search, template) ==
  LET text == Text(value)
      positions == MatchPositions(Text(value), Text(search), 0)
  IN  Replaced(text, search, Text(template), IF positions = <<>> THEN <<>> ELSE <<Head(positions)>>, 0)

\\* String.prototype.replaceAll of every match of a string with a template.
StringReplaceAll(value, search, template) ==
  Replaced(Text(value), Text(search), Text(template), MatchPositions(Text(value), Text(search), 0), 0)

\\* A string repeated a number of times, built by halves so that a long one recurses little.
RECURSIVE Repeated(_, _)
Repeated(text, times) ==
  IF times = 0
  THEN ""
  ELSE LET half == Repeated(text, times \\div 2)
       IN  half \\o half \\o (IF times % 2 = 1 THEN text ELSE "")

\\* String.prototype.repeat, which throws a RangeError for a negative or infinite count.
StringRepeat(value, count) ==
  LET text == Text(value)
      times == IntegerOf(count)
  IN  CASE times \\in {Infinity, NegativeInfinity} \\/ times < 0 ->
             Assert(FALSE, "tla-ts can't throw the RangeError of repeat")
        [] text = "" -> ""
        [] OTHER -> Repeated(text, times)

\\* String.prototype.concat of the strings that a call passes.
StringConcat(value, first, second, third) ==
  LET Part(part) == IF part = Undefined THEN "" ELSE part
  IN  Text(value) \\o Part(first) \\o Part(second) \\o Part(third)

LOCAL IsAscii(text) == \\A character \\in CharactersOf(text) : character \\in DOMAIN AsciiCodes

\\* String.prototype.isWellFormed, where a string of ASCII holds no lone surrogate.
IsWellFormed(value) ==
  IF IsAscii(Text(value))
  THEN TRUE
  ELSE Assert(FALSE, "tla-ts can't tell the surrogates of a character outside ASCII")

\\* String.prototype.toWellFormed, which leaves a string of ASCII as it is.
ToWellFormed(value) ==
  IF IsAscii(Text(value))
  THEN Text(value)
  ELSE Assert(FALSE, "tla-ts can't tell the surrogates of a character outside ASCII")

\\* String.prototype.normalize, which leaves a string of ASCII as it is in every form, and throws a
\\* RangeError for any other form.
StringNormalize(value, form) ==
  LET text == Text(value)
  IN  CASE form # Undefined /\\ form \\notin {"NFC", "NFD", "NFKC", "NFKD"} ->
             Assert(FALSE, "tla-ts can't throw the RangeError of normalize")
        [] IsAscii(text) -> text
        [] OTHER -> Assert(FALSE, "tla-ts can't normalize a character outside ASCII")

\\* String.prototype.localeCompare, which gives 0 for equal strings. The order of others depends on
\\* the locale.
LocaleCompare(value, that) ==
  IF Text(value) = (IF that = Undefined THEN "undefined" ELSE that)
  THEN 0
  ELSE Assert(FALSE, "tla-ts can't compare different strings by locale")

\\* An HTML method of String.prototype, which wraps the string in an element without attributes.
CreateHTML(value, tag) == "<" \\o tag \\o ">" \\o Text(value) \\o "</" \\o tag \\o ">"

LOCAL HexDigits == "0123456789ABCDEF"

\\* encodeURI and encodeURIComponent, which escape each character but those in kept as the bytes of
\\* its UTF-8, where a character of ASCII is one byte.
RECURSIVE EncodeURI(_, _)
EncodeURI(text, kept) ==
  IF text = ""
  THEN ""
  ELSE LET character == SubSeq(text, 1, 1)
           code == CharacterCode(character)
       IN  (IF character \\in kept
            THEN character
            ELSE "%" \\o SubSeq(HexDigits, code \\div 16 + 1, code \\div 16 + 1)
                     \\o SubSeq(HexDigits, (code % 16) + 1, (code % 16) + 1))
             \\o EncodeURI(Tail(text), kept)

LOCAL IsEscapeAt(text, position) ==
  /\\ position + 2 <= Len(text)
  /\\ SubSeq(text, position, position) = "%"
  /\\ \\A offset \\in 1..2 : SubSeq(text, position + offset, position + offset) \\in DigitsOf(16)

LOCAL ByteAt(text, position) ==
  DigitValue(SubSeq(text, position + 1, position + 1)) * 16
    + DigitValue(SubSeq(text, position + 2, position + 2))

\\* The bytes of UTF-8 that a code point takes after its first byte, or 0 where no code point starts
\\* with that byte.
LOCAL UTF8Length(first) ==
  CASE first < 128 -> 1 [] first \\in 194..223 -> 2 [] first \\in 224..239 -> 3 [] first \\in 240..244 -> 4
    [] OTHER -> 0

\\* Whether text starts with count escapes whose bytes are the UTF-8 of one code point, which
\\* excludes surrogates, overlong forms, and code points past 10FFFF.
LOCAL IsUTF8(text, count) ==
  /\\ count > 0
  /\\ \\A index \\in 1..count : IsEscapeAt(text, 3 * index - 2)
  /\\ \\A index \\in 2..count : ByteAt(text, 3 * index - 2) \\in 128..191
  /\\ LET first == ByteAt(text, 1)
         second == ByteAt(text, 4)
     IN  CASE first = 224 -> second >= 160
           [] first = 237 -> second < 160
           [] first = 240 -> second >= 144
           [] first = 244 -> second < 144
           [] OTHER -> TRUE

\\* Whether decodeURI or decodeURIComponent throws a URIError for text, where a % doesn't start the
\\* escapes of a code point's UTF-8.
RECURSIVE IsMalformedURI(_)
IsMalformedURI(text) ==
  CASE text = "" -> FALSE
    [] SubSeq(text, 1, 1) # "%" -> IsMalformedURI(Tail(text))
    [] ~IsEscapeAt(text, 1) -> TRUE
    [] OTHER ->
         LET count == UTF8Length(ByteAt(text, 1))
         IN  ~IsUTF8(text, count) \\/ IsMalformedURI(SubSeq(text, 3 * count + 1, Len(text)))

\\* decodeURI and decodeURIComponent of text that isn't malformed, which keep the escape of a
\\* character in reserved.
RECURSIVE DecodeURI(_, _)
DecodeURI(text, reserved) ==
  CASE text = "" -> ""
    [] SubSeq(text, 1, 1) # "%" -> SubSeq(text, 1, 1) \\o DecodeURI(Tail(text), reserved)
    [] ByteAt(text, 1) >= 128 -> Assert(FALSE, "tla-ts can't make a character outside ASCII")
    [] OTHER ->
         LET character == SubSeq(AsciiCharacters, ByteAt(text, 1) + 1, ByteAt(text, 1) + 1)
         IN  (IF character \\in reserved THEN SubSeq(text, 1, 3) ELSE character)
               \\o DecodeURI(SubSeq(text, 4, Len(text)), reserved)

LOCAL Lowercase == "abcdefghijklmnopqrstuvwxyz"

LOCAL Uppercase == "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

\\* A character in another case, where from and to list the letters of each case in order.
LOCAL Recased(character, from, to) ==
  CASE character \\in CharactersOf(from) ->
         LET position == CHOOSE index \\in 1..26 : SubSeq(from, index, index) = character
         IN  SubSeq(to, position, position)
    [] character \\in DOMAIN AsciiCodes -> character
    [] OTHER -> Assert(FALSE, "tla-ts can't change the case of a character outside ASCII")

RECURSIVE RecasedText(_, _, _)
RecasedText(text, from, to) ==
  IF text = "" THEN "" ELSE Recased(SubSeq(text, 1, 1), from, to) \\o RecasedText(Tail(text), from, to)

ToLowerCase(value) == RecasedText(Text(value), Uppercase, Lowercase)

ToUpperCase(value) == RecasedText(Text(value), Lowercase, Uppercase)

\\* JavaScript's < of two strings, which compares the codes of their first different characters.
RECURSIVE StringLessThan(_, _)
StringLessThan(left, right) ==
  CASE left = right -> FALSE
    [] left = "" -> TRUE
    [] right = "" -> FALSE
    [] SubSeq(left, 1, 1) = SubSeq(right, 1, 1) ->
         StringLessThan(SubSeq(left, 2, Len(left)), SubSeq(right, 2, Len(right)))
    [] OTHER -> CharacterCode(SubSeq(left, 1, 1)) < CharacterCode(SubSeq(right, 1, 1))

\\* sort()'s order without a comparator, which compares the strings of the elements.
DefaultSortBefore(left, right) == StringLessThan(StringOf(left), StringOf(right))

\\* The values that a for-of over a string visits, its code points, which are its characters where
\\* each is ASCII.
StringCharacters(value) ==
  [position \\in 1..Len(value) |->
     LET character == SubSeq(value, position, position)
     IN  IF character \\in DOMAIN AsciiCodes
         THEN character
         ELSE Assert(FALSE, "tla-ts can't iterate a string with a character outside ASCII")]

\\* A filler repeated and cut to a length.
RECURSIVE FillTo(_, _)
FillTo(filler, length) ==
  IF Len(filler) >= length THEN SubSeq(filler, 1, length) ELSE filler \\o FillTo(filler, length - Len(filler))

\\* StringPad, which padStart and padEnd fill a string with until it's maxLength long.
LOCAL StringPad(value, maxLength, fill, isStart) ==
  LET text == Text(value)
      target == ToLength(maxLength)
      filler == IF fill = Undefined THEN " " ELSE Text(fill)
  IN  CASE target <= Len(text) \\/ filler = "" -> text
        [] isStart -> FillTo(filler, target - Len(text)) \\o text
        [] OTHER -> text \\o FillTo(filler, target - Len(text))

PadStart(value, maxLength, fill) == StringPad(value, maxLength, fill, TRUE)

PadEnd(value, maxLength, fill) == StringPad(value, maxLength, fill, FALSE)

RECURSIVE RadixDigits(_, _)
RadixDigits(value, radix) ==
  LET digit == value % radix
  IN  IF value < radix
      THEN SubSeq("0123456789abcdefghijklmnopqrstuvwxyz", digit + 1, digit + 1)
      ELSE RadixDigits(value \\div radix, radix)
             \\o SubSeq("0123456789abcdefghijklmnopqrstuvwxyz", digit + 1, digit + 1)

\\* Number.prototype.toString, which writes a number in a radix from 2 to 36.
NumberToString(value, radix) ==
  LET base == IF radix = Undefined THEN 10 ELSE IntegerOf(radix)
  IN  CASE ~IsInteger(base) \\/ base < 2 \\/ base > 36 ->
             Assert(FALSE, "tla-ts can't throw the RangeError of a radix outside 2 to 36")
        [] IsFraction(value) /\\ base # 10 ->
             Assert(FALSE, "tla-ts can't write a fraction in a radix other than 10")
        [] ~IsInteger(value) \\/ base = 10 -> StringOf(value)
        [] value < 0 -> "-" \\o RadixDigits(-value, base)
        [] OTHER -> RadixDigits(value, base)

BigIntToString(value, radix) ==
  LET base == IF radix = Undefined THEN 10 ELSE IntegerOf(radix)
      integer == IntegerOfBigInt(ThisBigInt(value))
  IN  CASE ~IsInteger(base) \\/ base < 2 \\/ base > 36 ->
             Assert(FALSE, "tla-ts can't throw the RangeError of a radix outside 2 to 36")
        [] integer < 0 -> "-" \\o RadixDigits(-integer, base)
        [] OTHER -> RadixDigits(integer, base)

\\* The characters that trim() removes: WhiteSpace and LineTerminator.
LOCAL Spaces ==
  {"\\t", "\\n", "\\r", "\\f", " ", "\u000B", "\u00A0", "\uFEFF", "\u1680", "\u202F", "\u205F", "\u3000", "\u2028", "\u2029"}
    \\cup {SubSeq("\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A", position, position) : position \\in 1..11}

RECURSIVE TrimStart(_)
TrimStart(text) ==
  IF text # "" /\\ SubSeq(text, 1, 1) \\in Spaces THEN TrimStart(SubSeq(text, 2, Len(text))) ELSE text

RECURSIVE TrimEnd(_)
TrimEnd(text) ==
  IF text # "" /\\ SubSeq(text, Len(text), Len(text)) \\in Spaces
  THEN TrimEnd(SubSeq(text, 1, Len(text) - 1))
  ELSE text

StringTrim(value, isStart, isEnd) ==
  LET started == IF isStart THEN TrimStart(Text(value)) ELSE Text(value)
  IN  IF isEnd THEN TrimEnd(started) ELSE started

\\* Regular expressions. The compiler gives a pattern as the tree of matchers that the spec's
\\* CompilePattern makes, and RegExpStep runs a matcher with the continuation that a stack of frames
\\* holds, backtracking where the spec's continuations fail.
LOCAL RegExpFailure == [start |-> -1, end |-> -1, captures |-> <<>>]

LOCAL UppercaseOf ==
  [character \\in CharactersOf("abcdefghijklmnopqrstuvwxyz") |->
     LET position == CHOOSE position \\in 1..26 :
                       SubSeq("abcdefghijklmnopqrstuvwxyz", position, position) = character
     IN  SubSeq("ABCDEFGHIJKLMNOPQRSTUVWXYZ", position, position)]

\\* Canonicalize of a character that a backreference compares, which is in ASCII where the other
\\* character is, as Canonicalize maps no character outside ASCII into it.
LOCAL Canonical(regexp, character) ==
  IF regexp.ignoreCase /\\ character \\in DOMAIN UppercaseOf THEN UppercaseOf[character] ELSE character

LOCAL LineTerminators == {"\\n", "\\r", ${formatString(" ")}, ${formatString(" ")}}

LOCAL WordCharacters == CharactersOf("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")

\\* The character at an index of a text, or the empty string outside it.
LOCAL CharacterAt(text, index) ==
  IF index >= 0 /\\ index < Len(text) THEN SubSeq(text, index + 1, index + 1) ELSE ""

LOCAL IsWordAt(text, index) == CharacterAt(text, index) \\in WordCharacters

\\* Whether a class matches a character, where the compiler lists the characters in ASCII that it
\\* matches and, of those outside ASCII, the ones it matches where it matches none of the rest, or
\\* the ones it doesn't where it matches all of the rest.
LOCAL IsInClass(node, character) ==
  CASE character \\in node.characters -> TRUE
    [] character \\in node.excluded \\/ character \\in DOMAIN AsciiCodes -> FALSE
    [] node.others = "unknown" ->
         Assert(FALSE, "tla-ts can't tell whether a class matches a character outside ASCII")
    [] OTHER -> node.others = "all"

\\* Whether a backreference's characters are the same once canonicalized, which tla-ts tells for
\\* characters that differ only where one is an ASCII letter, digit, or underscore.
LOCAL IsSameCharacter(regexp, left, right) ==
  CASE left = right -> TRUE
    [] ~regexp.ignoreCase -> FALSE
    [] left \\in WordCharacters \\/ right \\in WordCharacters ->
         Canonical(regexp, left) = Canonical(regexp, right)
    [] OTHER -> Assert(FALSE, "tla-ts can't compare the case of characters that aren't ASCII letters")

RECURSIVE RegExpStep(_, _, _, _, _)
RECURSIVE RegExpContinue(_, _, _, _)
RECURSIVE RegExpRepeat(_, _, _, _, _, _, _)

\\* The state that a matcher reaches from a state, then running the continuation that a stack
\\* holds, or RegExpFailure.
RegExpStep(regexp, text, node, state, stack) ==
  CASE node.kind = "set" ->
         IF state.end < Len(text) /\\ IsInClass(node, CharacterAt(text, state.end))
         THEN RegExpContinue(regexp, text, [state EXCEPT !.end = @ + 1], stack)
         ELSE RegExpFailure
    [] node.kind = "sequence" ->
         IF node.items = <<>>
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpStep(regexp, text, Head(node.items), state,
                         <<[kind |-> "match", node |-> [node EXCEPT !.items = Tail(@)]]>> \\o stack)
    [] node.kind = "alternation" ->
         IF node.items = <<>>
         THEN RegExpFailure
         ELSE LET first == RegExpStep(regexp, text, Head(node.items), state, stack)
              IN  IF first.end # -1
                  THEN first
                  ELSE RegExpStep(regexp, text, [node EXCEPT !.items = Tail(@)], state, stack)
    [] node.kind = "group" ->
         RegExpStep(regexp, text, node.body, state,
                    <<[kind |-> "close", index |-> node.index, start |-> state.end]>> \\o stack)
    [] node.kind = "repeat" -> RegExpRepeat(regexp, text, node, node.min, node.max, state, stack)
    [] node.kind = "start" ->
         IF state.end = 0 \\/ (regexp.multiline /\\ CharacterAt(text, state.end - 1) \\in LineTerminators)
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpFailure
    [] node.kind = "end" ->
         IF state.end = Len(text) \\/ (regexp.multiline /\\ CharacterAt(text, state.end) \\in LineTerminators)
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpFailure
    [] node.kind = "boundary" ->
         IF (IsWordAt(text, state.end - 1) # IsWordAt(text, state.end)) # node.isInverted
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpFailure
    [] node.kind = "lookahead" ->
         LET found == RegExpStep(regexp, text, node.body, state, <<>>)
         IN  CASE node.isNegative /\\ found.end # -1 -> RegExpFailure
               [] node.isNegative -> RegExpContinue(regexp, text, state, stack)
               [] found.end = -1 -> RegExpFailure
               [] OTHER -> RegExpContinue(regexp, text, [state EXCEPT !.captures = found.captures], stack)
    [] node.kind = "backreference" ->
         LET captured == state.captures[node.index]
             length == IF captured = <<>> THEN 0 ELSE captured[2] - captured[1]
         IN  IF /\\ state.end + length <= Len(text)
                /\\ \\A offset \\in 0..(length - 1) :
                     IsSameCharacter(regexp, CharacterAt(text, captured[1] + offset),
                                     CharacterAt(text, state.end + offset))
             THEN RegExpContinue(regexp, text, [state EXCEPT !.end = @ + length], stack)
             ELSE RegExpFailure

\\* The continuation that a stack holds, run on the state that a matcher reaches.
RegExpContinue(regexp, text, state, stack) ==
  IF stack = <<>>
  THEN state
  ELSE LET frame == Head(stack)
       IN  CASE frame.kind = "match" -> RegExpStep(regexp, text, frame.node, state, Tail(stack))
             [] frame.kind = "close" ->
                  RegExpContinue(regexp, text,
                                 [state EXCEPT !.captures[frame.index] = <<frame.start, state.end>>],
                                 Tail(stack))
             [] OTHER ->
                  IF frame.min = 0 /\\ state.end = frame.start
                  THEN RegExpFailure
                  ELSE RegExpRepeat(regexp, text, frame.node,
                                    IF frame.min = 0 THEN 0 ELSE frame.min - 1,
                                    IF frame.max = -1 THEN -1 ELSE frame.max - 1,
                                    state, Tail(stack))

\\* RepeatMatcher, which matches a quantifier's atom at least min and at most max more times, where
\\* max is -1 for no bound, clearing the captures inside the atom before each time.
RegExpRepeat(regexp, text, node, min, max, state, stack) ==
  IF max = 0
  THEN RegExpContinue(regexp, text, state, stack)
  ELSE LET next == <<[kind |-> "repeat", node |-> node, min |-> min, max |-> max,
                      start |-> state.end]>> \\o stack
           cleared == [state EXCEPT !.captures =
                         [index \\in DOMAIN state.captures |->
                            IF index > node.parenIndex /\\ index <= node.parenIndex + node.parenCount
                            THEN <<>>
                            ELSE state.captures[index]]]
           taken == RegExpStep(regexp, text, node.body, cleared, next)
           skipped == RegExpContinue(regexp, text, state, stack)
       IN  CASE min # 0 -> taken
             [] node.isGreedy -> IF taken.end # -1 THEN taken ELSE skipped
             [] OTHER -> IF skipped.end # -1 THEN skipped ELSE taken

\\* The match that a regexp's matcher finds starting at an index, or RegExpFailure.
LOCAL RegExpAt(regexp, text, index) ==
  RegExpStep(regexp, text, regexp.pattern,
             [start |-> index, end |-> index,
              captures |-> [position \\in 1..regexp.captures |-> <<>>]],
             <<>>)

RECURSIVE RegExpSearch(_, _, _)
\\* The match that RegExpBuiltinExec finds from an index on: at that index alone for a sticky
\\* regexp, and else at the first index where the matcher succeeds.
RegExpSearch(regexp, text, index) ==
  IF index > Len(text)
  THEN RegExpFailure
  ELSE LET found == RegExpAt(regexp, text, index)
       IN  IF found.end # -1 \\/ regexp.sticky THEN found ELSE RegExpSearch(regexp, text, index + 1)

\\* The text that a regexp matches. A regexp with the u flag matches code points, which are the code
\\* units of text in ASCII, where tla-ts matches it only.
LOCAL RegExpText(regexp, value) ==
  IF regexp.unicode /\\ ~IsAscii(Text(value))
  THEN Assert(FALSE, "tla-ts can't match a regexp with the u flag on text outside ASCII")
  ELSE Text(value)

\\* The text of a match's capture, where 0 is the whole match, or undefined where it took no part.
LOCAL RegExpCapture(text, match, index) ==
  CASE index = 0 -> SubSeq(text, match.start + 1, match.end)
    [] match.captures[index] = <<>> -> Undefined
    [] OTHER -> SubSeq(text, match.captures[index][1] + 1, match.captures[index][2])

\\* The text of each named group of a match, by its name.
LOCAL RegExpGroups(regexp, text, match) ==
  [name \\in DOMAIN regexp.names |-> RegExpCapture(text, match, regexp.names[name])]

RECURSIVE RegExpMatches(_, _, _)
\\* The matches that a global regexp finds from an index on, where an empty match moves the next
\\* search one index past it, as AdvanceStringIndex does.
RegExpMatches(regexp, text, index) ==
  LET found == RegExpSearch(regexp, text, index)
  IN  IF found.end = -1
      THEN <<>>
      ELSE <<found>> \\o RegExpMatches(regexp, text, IF found.end = found.start THEN found.end + 1 ELSE found.end)

RECURSIVE RegExpSubstitute(_, _, _, _)
\\* GetSubstitution, which writes a replacement template with each $ pattern in it replaced by the
\\* text it names.
RegExpSubstitute(regexp, text, match, template) ==
  LET first == CharacterAt(template, 0)
      second == CharacterAt(template, 1)
      third == CharacterAt(template, 2)
      after(count) == RegExpSubstitute(regexp, text, match, SubSeq(template, count + 1, Len(template)))
      capture(index) ==
        LET captured == RegExpCapture(text, match, index) IN IF captured = Undefined THEN "" ELSE captured
      digits == CharactersOf("0123456789")
      hasTwoDigits ==
        /\\ third \\in digits
        /\\ DigitValue(second) * 10 + DigitValue(third) <= regexp.captures
      reference ==
        IF hasTwoDigits
        THEN DigitValue(second) * 10 + DigitValue(third)
        ELSE DigitValue(second)
      width == IF hasTwoDigits THEN 3 ELSE 2
      close == StringIndexOf(template, ">", 0)
  IN  CASE template = "" -> ""
        [] first # "$" \\/ Len(template) = 1 -> first \\o after(1)
        [] second = "$" -> "$" \\o after(2)
        [] second = "&" -> capture(0) \\o after(2)
        [] second = "\`" -> SubSeq(text, 1, match.start) \\o after(2)
        [] second = "'" -> SubSeq(text, match.end + 1, Len(text)) \\o after(2)
        [] second \\in digits ->
             (IF reference >= 1 /\\ reference <= regexp.captures
              THEN capture(reference)
              ELSE SubSeq(template, 1, width)) \\o after(width)
        [] second = "<" /\\ close # -1 /\\ DOMAIN regexp.names # {} ->
             LET name == SubSeq(template, 3, close)
             IN  (IF name \\in DOMAIN regexp.names THEN capture(regexp.names[name]) ELSE "")
                   \\o after(close + 1)
        [] OTHER -> first \\o after(1)

RECURSIVE RegExpAssemble(_, _, _, _)
\\* The text that replace gives: the text between the matches, with each match's replacement in its
\\* place.
RegExpAssemble(text, matches, replacements, from) ==
  IF matches = <<>>
  THEN SubSeq(text, from + 1, Len(text))
  ELSE SubSeq(text, from + 1, Head(matches).start) \\o Head(replacements)
         \\o RegExpAssemble(text, Tail(matches), Tail(replacements), Head(matches).end)

\\* The text that replace gives for matches with a replacement template.
LOCAL RegExpReplaced(regexp, text, matches, template) ==
  RegExpAssemble(text, matches,
                 [position \\in DOMAIN matches |-> RegExpSubstitute(regexp, text, matches[position], template)],
                 0)

RECURSIVE RegExpSplitFrom(_, _, _, _)
\\* The pieces that RegExp.prototype[@@split] cuts from p on, trying a sticky match at each q.
RegExpSplitFrom(regexp, text, p, q) ==
  IF q >= Len(text)
  THEN <<SubSeq(text, p + 1, Len(text))>>
  ELSE LET found == RegExpAt(regexp, text, q)
       IN  IF found.end = -1 \\/ found.end = p
           THEN RegExpSplitFrom(regexp, text, p, q + 1)
           ELSE <<SubSeq(text, p + 1, q)>>
                  \\o [position \\in 1..regexp.captures |-> RegExpCapture(text, found, position)]
                  \\o RegExpSplitFrom(regexp, text, found.end, found.end)

\\* The pieces that RegExp.prototype[@@split] gives, at most ToUint32 of a limit that is undefined or
\\* a number, where -1 is no limit, as ToUint32 of a negative integer is past any length.
LOCAL RegExpPieces(regexp, text, limit) ==
  LET count == CASE limit = Undefined -> -1
                 [] limit \\in {NaN, Infinity, NegativeInfinity, NegativeZero} -> 0
                 [] limit < 0 -> -1
                 [] OTHER -> limit
      pieces == CASE count = 0 -> <<>>
                  [] text = "" -> IF RegExpAt(regexp, text, 0).end # -1 THEN <<>> ELSE <<text>>
                  [] OTHER -> RegExpSplitFrom(regexp, text, 0, 0)
  IN  IF count = -1 \\/ count >= Len(pieces) THEN pieces ELSE SubSeq(pieces, 1, count)

\\* The match that exec and test find in a script without objects, where a regexp's lastIndex stays
\\* 0, as tla-ts can't keep what a global or sticky regexp sets it to.
LOCAL RegExpFirst(regexp, text) ==
  IF regexp.global \\/ regexp.sticky
  THEN Assert(FALSE, "tla-ts can't keep the lastIndex of a global or sticky regexp without objects")
  ELSE RegExpSearch(regexp, text, 0)

\\* The array that exec gives for a match in a script without objects, as a function from its keys.
LOCAL RegExpArray(regexp, text, match) ==
  [key \\in {ToString(index) : index \\in 0..regexp.captures} \\cup {"length", "index", "input", "groups"} |->
     CASE key = "length" -> regexp.captures + 1
       [] key = "index" -> match.start
       [] key = "input" -> text
       [] key = "groups" ->
            IF DOMAIN regexp.names = {} THEN Undefined ELSE RegExpGroups(regexp, text, match)
       [] OTHER -> RegExpCapture(text, match, ToIndex(key))]

\\* An element or a property of the array that exec or match gives, or undefined where it has none.
RegExpElement(array, key) == IF key \\in DOMAIN array THEN array[key] ELSE Undefined

\\* RegExp.prototype.exec: the array of the first match, or null.
RegExpExec(regexp, value) ==
  LET text == RegExpText(regexp, value)
      found == RegExpFirst(regexp, text)
  IN  IF found.end = -1 THEN Null ELSE RegExpArray(regexp, text, found)

RegExpTest(regexp, value) == RegExpFirst(regexp, RegExpText(regexp, value)).end # -1

\\* The matches that RegExp.prototype[@@replace] and [@@match] read: each for a global regexp, which
\\* leaves lastIndex at 0, or else the first.
LOCAL RegExpMatched(regexp, text) ==
  IF regexp.global
  THEN RegExpMatches(regexp, text, 0)
  ELSE LET found == RegExpFirst(regexp, text) IN IF found.end = -1 THEN <<>> ELSE <<found>>

\\* String.prototype.replace through RegExp.prototype[@@replace], with a replacement template.
RegExpReplace(regexp, value, template) ==
  LET text == RegExpText(regexp, value)
  IN  RegExpReplaced(regexp, text, RegExpMatched(regexp, text), Text(template))

\\* String.prototype.replaceAll, which throws a TypeError for a regexp that isn't global.
RegExpReplaceAll(regexp, value, template) ==
  IF regexp.global
  THEN RegExpReplace(regexp, value, template)
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of replaceAll with a regexp that isn't global here")

\\* The matches that replace or replaceAll with a function calls it for.
RegExpMatchesOf(regexp, value, isAll) ==
  IF isAll /\\ ~regexp.global
  THEN Assert(FALSE, "tla-ts can't throw the TypeError of replaceAll with a regexp that isn't global here")
  ELSE RegExpMatched(regexp, RegExpText(regexp, value))

\\* The argument at a position that replace calls a function with for a match: the matched text,
\\* each capture, the match's position, the text, and the named groups where the regexp has them.
RegExpArgument(regexp, text, match, position) ==
  CASE position <= regexp.captures -> RegExpCapture(text, match, position)
    [] position = regexp.captures + 1 -> match.start
    [] position = regexp.captures + 2 -> text
    [] position = regexp.captures + 3 /\\ DOMAIN regexp.names # {} -> RegExpGroups(regexp, text, match)
    [] OTHER -> Undefined

\\* The text that replace with a function gives, where each match's replacement is what the
\\* function returns for it.
RegExpReplaceWith(value, matches, replacements) == RegExpAssemble(Text(value), matches, replacements, 0)

\\* String.prototype.match through RegExp.prototype[@@match]: the array of the first match, or for a
\\* global regexp an array of each match's text, or null where nothing matches.
RegExpMatch(regexp, value) ==
  LET text == RegExpText(regexp, value)
      matches == RegExpMatched(regexp, text)
  IN  CASE matches = <<>> -> Null
        [] regexp.global ->
             [key \\in {ToString(position - 1) : position \\in DOMAIN matches} \\cup {"length"} |->
                IF key = "length" THEN Len(matches) ELSE RegExpCapture(text, matches[ToIndex(key) + 1], 0)]
        [] OTHER -> RegExpArray(regexp, text, Head(matches))

\\* String.prototype.search through RegExp.prototype[@@search], which restores lastIndex.
RegExpSearchIndex(regexp, value) ==
  LET found == RegExpSearch(regexp, RegExpText(regexp, value), 0)
  IN  IF found.end = -1 THEN -1 ELSE found.start

\\* String.prototype.split through RegExp.prototype[@@split].
RegExpSplit(regexp, value, limit) == RegExpPieces(regexp, RegExpText(regexp, value), limit)

ToBoolean(value) ==
  CASE value \\in {Undefined, Null} -> FALSE
    [] TypeOf(value) = "boolean" -> value
    [] TypeOf(value) = "number" -> value \\notin {0, NaN, NegativeZero}
    [] TypeOf(value) = "string" -> value # ""
    [] IsBigInt(value) -> value[Big] # 0
    [] OTHER -> TRUE

LOCAL Fields == {"value", "writable", "get", "set", "enumerable", "configurable"}

\\* A descriptor is valid if its get and set are functions or undefined, and it doesn't mix them
\\* with value or writable. Otherwise ToPropertyDescriptor throws a TypeError. The values are the
\\* fields that ToPropertyDescriptor read.
LOCAL FieldsDescriptor(heap, fields, values) ==
  LET valueOf(field) == IF field \\in fields THEN values[field] ELSE Undefined
      isCallable(field) == valueOf(field) = Undefined \\/ TypeOfIn(heap, valueOf(field)) = "function"
      isAccessor == fields \\cap {"get", "set"} # {}
      isData == fields \\cap {"value", "writable"} # {}
  IN [fields |-> fields,
      isAccessor |-> isAccessor,
      isData |-> isData,
      isValid |-> /\\ \\A field \\in fields \\cap {"get", "set"} : isCallable(field)
                  /\\ ~(isAccessor /\\ isData),
      value |-> valueOf("value"),
      get |-> valueOf("get"),
      set |-> valueOf("set"),
      writable |-> ToBoolean(valueOf("writable")),
      enumerable |-> ToBoolean(valueOf("enumerable")),
      configurable |-> ToBoolean(valueOf("configurable"))]

\\* The descriptor of the fields that a script read, running their getters, with whether it has
\\* each.
ReadDescriptor(heap, has, values) == FieldsDescriptor(heap, {field \\in Fields : has[field]}, values)

ToDescriptor(heap, ref) ==
  LET fields == {field \\in Fields : Has(heap, ref, field)}
  IN FieldsDescriptor(heap, fields, [field \\in fields |-> Get(heap, ref, field)])

\\* No value a script makes is the same as a value TLA+ can't represent.
LOCAL CanApply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      current == object.attributes[key]
      isSame(field) == SameValue(descriptor[field], object.values[key][field])
  IN CASE key \\notin DOMAIN object.values -> object.extensible
       [] current.configurable -> TRUE
       [] has("configurable") /\\ descriptor.configurable -> FALSE
       [] has("enumerable") /\\ descriptor.enumerable # current.enumerable -> FALSE
       [] (descriptor.isAccessor \\/ descriptor.isData)
            /\\ descriptor.isAccessor # (current.kind = "accessor") -> FALSE
       [] current.kind = "accessor" ->
            \\A field \\in {"get", "set"} : has(field) => isSame(field)
       [] current.writable -> TRUE
       [] OTHER ->
            /\\ ~(has("writable") /\\ descriptor.writable)
            /\\ has("value") => current.kind = "data" /\\ SameValue(descriptor.value, object.values[key])

\\* A descriptor that changes a property between data and accessor keeps only its enumerable and
\\* configurable.
LOCAL Apply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      isNew == key \\notin DOMAIN object.values
      wasAccessor == ~isNew /\\ object.attributes[key].kind = "accessor"
      isKept ==
        ~isNew /\\ ~(descriptor.isAccessor /\\ ~wasAccessor) /\\ ~(descriptor.isData /\\ wasAccessor)
      isNowAccessor == IF isKept THEN wasAccessor ELSE descriptor.isAccessor
      current == IF isKept THEN object.values[key] ELSE [get |-> Undefined, set |-> Undefined]
      pick(field, kept) == IF has(field) THEN descriptor[field] ELSE kept
      flag(field) ==
        IF has(field) THEN descriptor[field] ELSE ~isNew /\\ object.attributes[key][field]
      value ==
        IF isNowAccessor
        THEN [get |-> pick("get", current.get), set |-> pick("set", current.set)]
        ELSE pick("value", IF isKept THEN object.values[key] ELSE Undefined)
  IN [object EXCEPT
        !.keys = IF isNew THEN Append(@, key) ELSE @,
        !.values = (key :> value) @@ @,
        !.attributes = (key :> [writable |-> ~isNowAccessor /\\ IF has("writable")
                                                               THEN descriptor.writable
                                                               ELSE isKept /\\ object.attributes[key].writable,
                                enumerable |-> flag("enumerable"),
                                configurable |-> flag("configurable"),
                                kind |-> CASE isNowAccessor -> "accessor"
                                           [] isKept /\\ ~has("value") -> object.attributes[key].kind
                                           [] OTHER -> "data"]) @@ @]

\\* A getter or setter of a class or an object literal, which keeps the other half of an accessor
\\* that it defined.
DefineAccessor(object, key, field, function, isEnumerable) ==
  Apply(object, key, [fields |-> {field, "enumerable", "configurable"}, isAccessor |-> TRUE,
                      isData |-> FALSE, isValid |-> TRUE, value |-> Undefined, get |-> function,
                      set |-> function, writable |-> FALSE, enumerable |-> isEnumerable,
                      configurable |-> TRUE])

LOCAL IsArrayObject(object) == "isArray" \\in DOMAIN object /\\ object.isArray

\\* IsArray, which reads a proxy's target, where an array outside the heap is a sequence.
RECURSIVE IsArray(_, _)
IsArray(heap, value) ==
  CASE IsProxy(heap, value) ->
         IF ProxyHandler(heap, value) = Null
         THEN Assert(FALSE, "tla-ts can't throw the TypeError of a revoked proxy here")
         ELSE LET target == ProxyTarget(heap, value)
              IN \\/ ~IsRef(target) /\\ TypeOf(target) = "object" /\\ SubSeq(ToString(target), 1, 2) = "<<"
                 \\/ IsArray(heap, target)
    [] OTHER -> IsRef(value) /\\ IsArrayObject(Lookup(heap, value))

\\* Whether a proxy or a proxy that it reads through is revoked, so that IsArray throws a TypeError.
RECURSIVE IsRevokedProxy(_, _)
IsRevokedProxy(heap, value) ==
  /\\ IsProxy(heap, value)
  /\\ ProxyHandler(heap, value) = Null \\/ IsRevokedProxy(heap, ProxyTarget(heap, value))

\\* The kind that Object.prototype.toString gives an object without a Symbol.toStringTag.
LOCAL ClassOf(heap, ref) ==
  CASE IsHeap(ref) /\\ IsArrayObject(Lookup(heap, ref)) -> "Array"
    [] IsHeap(ref) /\\ "isArguments" \\in DOMAIN Lookup(heap, ref) -> "Arguments"
    [] IsHeap(ref) /\\ "primitive" \\in DOMAIN Lookup(heap, ref) ->
         CASE TypeOf(Lookup(heap, ref).primitive) = "boolean" -> "Boolean"
           [] TypeOf(Lookup(heap, ref).primitive) = "string" -> "String"
           [] OTHER -> "Number"
    [] IsHeap(ref) /\\ "time" \\in DOMAIN Lookup(heap, ref) -> "Date"
    [] IsHeap(ref) /\\ "regexp" \\in DOMAIN Lookup(heap, ref) -> "RegExp"
    [] IsHeap(ref) -> IF Lookup(heap, ref).isCallable THEN "Function" ELSE "Object"
    [] BuiltInKey(ref) = "Array.prototype" -> "Array"
    [] Lookup(heap, ref).isCallable -> "Function"
    [] BuiltInKey(ref) = "Boolean.prototype" -> "Boolean"
    [] BuiltInKey(ref) = "Number.prototype" -> "Number"
    [] BuiltInKey(ref) = "String.prototype" -> "String"
    [] OTHER -> "Object"

\\* The Symbol.toStringTag that an object has or inherits where it's a string, or else its kind.
LOCAL Tagged(heap, ref, kind) ==
  LET tag == Get(heap, ref, WellKnownSymbol("toStringTag"))
  IN IF TypeOf(tag) = "string" THEN tag ELSE kind

\\* The object that a proxy's internal methods read where the handler has none of their traps, which
\\* goes on through each proxy target whose handler has none either.
RECURSIVE ForwardTarget(_, _, _)
ForwardTarget(heap, ref, traps) ==
  CASE ~IsProxy(heap, ref) -> ref
    [] ProxyHandler(heap, ref) = Null ->
         Assert(FALSE, "tla-ts can't throw the TypeError of a revoked proxy's target")
    [] \\A trap \\in traps : Get(heap, ProxyHandler(heap, ref), trap) \\in {Undefined, Null} ->
         ForwardTarget(heap, ProxyTarget(heap, ref), traps)
    [] OTHER -> Assert(FALSE, "tla-ts can't run the traps that this reads a proxy through")

\\* Object.prototype.toString, which gives "[object Kind]". A value that isn't on the heap gives the
\\* kind of object that holds it, such as Array for a sequence.
ObjectToString(heap, value, kind) ==
  "[object "
    \\o (CASE value = Undefined -> "Undefined"
          [] value = Null -> "Null"
          [] TypeOf(value) = "number" -> "Number"
          [] TypeOf(value) = "string" -> "String"
          [] TypeOf(value) = "boolean" -> "Boolean"
          [] ~IsRef(value) /\\ IsError(value) ->
               Tagged(heap, Get(heap, value.constructor, "prototype"), "Error")
          [] IsProxy(heap, value) ->
               LET target == ForwardTarget(heap, value, {"get"})
                   class == CASE IsArray(heap, value) -> "Array"
                             [] TypeOfIn(heap, value) = "function" -> "Function"
                             [] OTHER -> "Object"
               IN CASE IsRef(target) -> Tagged(heap, target, class)
                    [] class = "Function" ->
                         Assert(FALSE, "tla-ts can't tell the kind of function that a proxy holds")
                    [] OTHER -> class
          [] IsHeap(value) \\/ IsBuiltIn(value) -> Tagged(heap, value, ClassOf(heap, value))
          [] TypeOf(value) = "function" -> "Function"
          [] kind # "" -> kind
          [] OTHER -> Assert(FALSE, "tla-ts can't tell the kind of " \\o ToString(value)))
    \\o "]"

\\* ToPrimitive of an object, which tla-ts follows where the object reads the built-in valueOf and
\\* toString and has no Symbol.toPrimitive.
LOCAL LoosePrimitive(heap, ref) ==
  LET valueOf == Get(heap, ref, "valueOf")
      isBuiltIn(method, path) == IsRef(method) /\\ ~IsHeap(method) /\\ method[Ref] = path
      kinds == {"Boolean", "Number", "String"}
      kind == CASE ~IsHeap(ref) /\\ \\E other \\in kinds : ref[Ref] = other \\o ".prototype" ->
                     CHOOSE other \\in kinds : ref[Ref] = other \\o ".prototype"
                [] IsHeap(ref) /\\ "primitive" \\in DOMAIN Lookup(heap, ref) ->
                     CASE TypeOf(Lookup(heap, ref).primitive) = "boolean" -> "Boolean"
                       [] TypeOf(Lookup(heap, ref).primitive) = "number" -> "Number"
                       [] OTHER -> "String"
                [] OTHER -> ""
  IN CASE ~IsRef(ref) \\/ Get(heap, ref, WellKnownSymbol("toPrimitive")) # Undefined ->
            Assert(FALSE, "tla-ts can't convert " \\o ToString(ref) \\o " to a primitive")
       [] kind # "" /\\ isBuiltIn(valueOf, kind \\o ".prototype.valueOf") ->
            WrappedPrimitive(heap, ref, kind, "valueOf")
       [] /\\ isBuiltIn(valueOf, "Object.prototype.valueOf")
          /\\ isBuiltIn(Get(heap, ref, "toString"), "Object.prototype.toString") ->
            ObjectToString(heap, ref, "")
       [] OTHER -> Assert(FALSE, "tla-ts can't call valueOf or toString on " \\o ToString(ref))

\\* What a built-in valueOf or toString gives where ToPrimitive calls it on an object. It's the
\\* object itself for Object.prototype.valueOf, so that ToPrimitive goes on to the next method.
ConvertWith(heap, ref, method) ==
  LET path == IF IsRef(method) /\\ ~IsHeap(method) THEN method[Ref] ELSE ""
      kinds == {"Boolean", "Number", "String"}
  IN CASE path = "Object.prototype.valueOf" -> ref
       [] path = "Object.prototype.toString" -> ObjectToString(heap, ref, "")
       [] \\E kind \\in kinds : path = kind \\o ".prototype.valueOf" ->
            WrappedPrimitive(heap, ref, CHOOSE kind \\in kinds : path = kind \\o ".prototype.valueOf",
                             "valueOf")
       [] path = "String.prototype.toString" -> WrappedPrimitive(heap, ref, "String", "toString")
       [] path = "Number.prototype.toString" ->
            NumberToString(WrappedPrimitive(heap, ref, "Number", "toString"), Undefined)
       [] path = "Boolean.prototype.toString" ->
            BooleanToString(WrappedPrimitive(heap, ref, "Boolean", "toString"))
       [] OTHER -> Assert(FALSE, "tla-ts can't tell what this method gives where it converts an object")

\\* ToNumber of a primitive. tla-ts can't represent a string's fraction.
ToNumber(value) ==
  CASE value = Undefined -> NaN
    [] value = Null -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] TypeOf(value) = "number" -> value
    [] TypeOf(value) = "string" ->
         ReadNumber(TrimEnd(TrimStart(value)), LAMBDA kind, isNegative, magnitude :
           CASE kind = "integer" /\\ isNegative -> IF magnitude = 0 THEN NegativeZero ELSE -magnitude
             [] kind = "integer" -> magnitude
             [] kind = "infinity" -> IF isNegative THEN NegativeInfinity ELSE Infinity
             [] kind = "nan" -> NaN
             [] \\E position \\in DOMAIN Fractions : Fractions[position].text = value ->
                  Fractions[CHOOSE position \\in DOMAIN Fractions :
                              Fractions[position].text = value].value
             [] OTHER -> Assert(FALSE, "tla-ts can't represent the number " \\o ToString(value)))
    [] IsRef(value) -> Assert(FALSE, "tla-ts can't convert this object to a number")
    [] IsBigInt(value) ->
         Assert(FALSE, "tla-ts can't throw the TypeError of converting a BigInt to a number")
    [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of converting a symbol to a number")

\\* The longest start of a text made of a radix's digits.
RECURSIVE DigitPrefix(_, _)
DigitPrefix(text, radix) ==
  IF text # "" /\\ SubSeq(text, 1, 1) \\in DigitsOf(radix)
  THEN SubSeq(text, 1, 1) \\o DigitPrefix(Tail(text), radix)
  ELSE ""

\\* The value of a radix's digits, which stops before it would leave TLC's integers.
RECURSIVE CheckedDigits(_, _, _)
CheckedDigits(text, radix, value) ==
  IF text = ""
  THEN value
  ELSE LET digit == DigitValue(SubSeq(text, 1, 1))
       IN  IF value > (2147483647 - digit) \\div radix
           THEN Assert(FALSE, "tla-ts can't represent the number that parseInt reads")
           ELSE CheckedDigits(Tail(text), radix, value * radix + digit)

\\* parseInt of a string and a radix, where an undefined radix is 0.
ParseInt(value, radix) ==
  LET text == TrimStart(Text(value))
      isNegative == Prefix(text, 1) = "-"
      unsigned == IF Prefix(text, 1) \\in {"+", "-"} THEN Tail(text) ELSE text
      requested == IF radix = Undefined THEN 0 ELSE Int32(ToNumber(radix))
      isHex == requested \\in {0, 16} /\\ Prefix(unsigned, 2) \\in {"0x", "0X"}
      base == CASE isHex -> 16 [] requested = 0 -> 10 [] OTHER -> requested
      digits == DigitPrefix(IF isHex THEN SubSeq(unsigned, 3, Len(unsigned)) ELSE unsigned, base)
  IN  IF (requested # 0 /\\ (requested < 2 \\/ requested > 36)) \\/ digits = ""
      THEN NaN
      ELSE LET magnitude == CheckedDigits(digits, base, 0)
           IN  CASE ~isNegative -> magnitude
                 [] magnitude = 0 -> NegativeZero
                 [] OTHER -> -magnitude

\\* JavaScript's + of two primitives, which joins them as strings where either is a string and adds
\\* them as numbers otherwise.
AddPrimitives(left, right) ==
  IF TypeOf(left) = "string" \\/ TypeOf(right) = "string"
  THEN StringOf(left) \\o StringOf(right)
  ELSE Add(ToNumber(left), ToNumber(right))

\\* JavaScript's < of two primitives.
LessThanPrimitives(left, right) ==
  IF TypeOf(left) = "string" /\\ TypeOf(right) = "string"
  THEN StringLessThan(left, right)
  ELSE LessThan(ToNumber(left), ToNumber(right))

\\* JavaScript's <= of two primitives.
LessOrEqualPrimitives(left, right) ==
  IF TypeOf(left) = "string" /\\ TypeOf(right) = "string"
  THEN ~StringLessThan(right, left)
  ELSE LessOrEqual(ToNumber(left), ToNumber(right))

\\* A number in a script that holds only integers, which can't hold NaN, the infinities, or -0.
PlainNumber(value) ==
  IF value \\in SpecialNumbers
  THEN Assert(FALSE, "tla-ts can't represent " \\o ToString(value) \\o " in this script")
  ELSE value

LOCAL LooseKind(value) ==
  CASE value = Null -> "null"
    [] TypeOf(value) = "function" -> "object"
    [] OTHER -> TypeOf(value)

\\* Whether a number equals what ToNumber gives for a string. Numbers that aren't integers aren't
\\* values, so a string that reads as a fraction equals none.
LOCAL EqualsText(number, text) ==
  ReadNumber(text, LAMBDA kind, isNegative, magnitude :
    CASE kind = "integer" -> StrictEquals(number, IF isNegative THEN -magnitude ELSE magnitude)
      [] kind = "infinity" -> number = IF isNegative THEN NegativeInfinity ELSE Infinity
      [] kind = "fraction" /\\ IsFraction(number) ->
           \\/ StringOf(number) = text
           \\/ /\\ IsNegative(number) = isNegative
              /\\ AbsoluteValue(Truncate(number)) = magnitude
              /\\ Assert(FALSE, "tla-ts can't compare a fraction with " \\o ToString(text))
      [] OTHER -> FALSE)

\\* JavaScript's ==, which converts a boolean to a number, a string to compare it with a number, and
\\* an object to compare it with a primitive.
RECURSIVE LooseEquals(_, _, _)
LooseEquals(heap, left, right) ==
  LET leftKind == LooseKind(left)
      rightKind == LooseKind(right)
      primitives == {"string", "number", "symbol", "bigint"}
      numbers == {"number", "bigint"}
  IN CASE leftKind = rightKind -> StrictEquals(left, right)
       [] {leftKind, rightKind} = numbers ->
            LET number == IF leftKind = "number" THEN left ELSE right
                bigint == IF leftKind = "bigint" THEN left ELSE right
            IN IsFinite(number) /\\ Magnitude(number) = bigint[Big]
       [] {leftKind, rightKind} = {"bigint", "string"} ->
            Assert(FALSE, "tla-ts can't compare a BigInt with a string")
       [] {leftKind, rightKind} = {"null", "undefined"} -> TRUE
       [] leftKind = "number" /\\ rightKind = "string" -> EqualsText(left, right)
       [] leftKind = "string" /\\ rightKind = "number" -> EqualsText(right, left)
       [] leftKind = "boolean" -> LooseEquals(heap, IF left THEN 1 ELSE 0, right)
       [] rightKind = "boolean" -> LooseEquals(heap, left, IF right THEN 1 ELSE 0)
       [] leftKind \\in primitives /\\ rightKind = "object" ->
            LooseEquals(heap, left, LoosePrimitive(heap, right))
       [] leftKind = "object" /\\ rightKind \\in primitives ->
            LooseEquals(heap, LoosePrimitive(heap, left), right)
       [] OTHER -> FALSE

\\* ArraySpeciesCreate, which makes the array that a method returns through the constructor of the
\\* array that the method copies, where tla-ts follows only Array.
Species(constructor, array, elements) ==
  IF SameValue(constructor, array)
  THEN elements
  ELSE Assert(FALSE, "tla-ts can't make an array through a constructor that a script gives")

SpeciesElements(heap, ref, array, elements) ==
  IF IsArray(heap, ref) THEN Species(Get(heap, ref, "constructor"), array, elements) ELSE elements

\\* An array that a script makes, which holds its elements under their indices, and its length.
\\* The positions in holes have no element, though the length counts them.
ArrayObjectWithHoles(prototype, elements, holes) ==
  LET present == SelectSeq([position \\in DOMAIN elements |-> position], LAMBDA position :
                   position \\notin holes)
      indices == {ToString(present[offset] - 1) : offset \\in DOMAIN present}
  IN [keys |-> [offset \\in DOMAIN present |-> ToString(present[offset] - 1)] \\o <<"length">>,
      values |-> [key \\in indices \\cup {"length"} |->
                   IF key = "length" THEN Len(elements) ELSE elements[ToIndex(key) + 1]],
      attributes |-> [key \\in indices \\cup {"length"} |->
                       IF key = "length"
                       THEN [Writable EXCEPT !.enumerable = FALSE, !.configurable = FALSE]
                       ELSE Writable],
      extensible |-> TRUE, prototype |-> prototype, isCallable |-> FALSE, isConstructor |-> FALSE,
      isOpaque |-> FALSE, privates |-> <<>>, isArray |-> TRUE]

ArrayObject(prototype, elements) == ArrayObjectWithHoles(prototype, elements, {})

\\* The description of a property of an array that a sequence holds.
DescribeElement(elements, key) == DescribeObject(ArrayObject(Null, elements), key)

ElementNames(elements) == OwnKeys(ArrayObject(Null, elements))

HasOwnElement(elements, key) == key \\in DOMAIN ArrayObject(Null, elements).values

\\* The arguments object of a call in strict mode, which holds the values the call gives under their
\\* indices, its length, and a callee that throws.
ArgumentsObject(elements, thrower) ==
  LET indices == {ToString(position - 1) : position \\in DOMAIN elements}
      callee == [writable |-> FALSE, enumerable |-> FALSE, configurable |-> FALSE, kind |-> "accessor"]
  IN [keys |-> [position \\in DOMAIN elements |-> ToString(position - 1)] \\o <<"length", "callee">>,
      values |-> [key \\in indices \\cup {"length", "callee"} |->
                   CASE key = "length" -> Len(elements)
                     [] key = "callee" -> [get |-> thrower, set |-> thrower]
                     [] OTHER -> elements[ToIndex(key) + 1]],
      attributes |-> [key \\in indices \\cup {"length", "callee"} |->
                       CASE key = "length" -> [Writable EXCEPT !.enumerable = FALSE]
                         [] key = "callee" -> callee
                         [] OTHER -> Writable],
      extensible |-> TRUE, prototype |-> ObjectPrototype, isCallable |-> FALSE,
      isConstructor |-> FALSE, isOpaque |-> FALSE, privates |-> <<>>, isArguments |-> TRUE]

\\* The object that new Boolean, new Number, or new String makes, which holds the primitive it wraps,
\\* and a string's characters under their indices and its length.
WrapperObject(prototype, primitive) ==
  LET isString == TypeOf(primitive) = "string"
      length == IF isString THEN Len(primitive) ELSE 0
      keys == IF isString THEN {ToString(position - 1) : position \\in 1..length} \\cup {"length"} ELSE {}
      fixed == [writable |-> FALSE, enumerable |-> FALSE, configurable |-> FALSE, kind |-> "data"]
  IN [keys |-> [position \\in 1..length |-> ToString(position - 1)]
               \\o (IF isString THEN <<"length">> ELSE <<>>),
      values |-> [key \\in keys |->
                   IF key = "length" THEN length ELSE SubSeq(primitive, ToIndex(key) + 1, ToIndex(key) + 1)],
      attributes |-> [key \\in keys |-> IF key = "length" THEN fixed ELSE [fixed EXCEPT !.enumerable = TRUE]],
      extensible |-> TRUE, prototype |-> prototype, isCallable |-> FALSE, isConstructor |-> FALSE,
      isOpaque |-> FALSE, privates |-> <<>>, primitive |-> primitive]

\\* The description of a property of the String object that a string converts to.
DescribeString(text, key) == DescribeObject(WrapperObject(Null, text), key)

HasOwnString(text, key) == key \\in DOMAIN WrapperObject(Null, text).values

\\* A Date's time value is NaN, or the day since 1970 and the milliseconds within it, so that every
\\* time value that TimeClip allows, up to 8.64e15 milliseconds, fits TLC's integers. tla-ts takes
\\* local time to be UTC.
LOCAL MsPerDay == 86400000

LOCAL TimeValue(day, ms) == [day |-> day + ms \\div MsPerDay, ms |-> ms % MsPerDay]

LOCAL TimeClip(time) ==
  IF /\\ time # NaN
     /\\ time.day >= -100000000
     /\\ (time.day < 100000000 \\/ (time.day = 100000000 /\\ time.ms = 0))
  THEN time
  ELSE NaN

LOCAL ToIntegerOrInfinity(value) ==
  CASE value \\in {NaN, NegativeZero} -> 0
    [] IsFraction(value) -> Truncate(value)
    [] OTHER -> value

LOCAL AreFinite(values) == \\A position \\in DOMAIN values : IsFinite(values[position])

\\* The time value that new Date or setTime makes from a number.
TimeFromNumber(value) ==
  IF IsFinite(value) THEN TimeClip(TimeValue(0, ToIntegerOrInfinity(value))) ELSE NaN

\\* The number that a time value is, where it fits TLC's integers.
TimeNumber(time) ==
  CASE time = NaN -> NaN
    [] time.day \\in -24..23 -> time.day * MsPerDay + time.ms
    [] time.day = 24 /\\ time.ms <= 73883647 -> 23 * MsPerDay + (time.ms + MsPerDay)
    [] time.day = -25 /\\ time.ms >= 12516352 -> -24 * MsPerDay + (time.ms - MsPerDay)
    [] OTHER -> Assert(FALSE, "tla-ts can't hold a time value this far from 1970 in a number")

LOCAL DayFromYear(year) ==
  365 * (year - 1970) + (year - 1969) \\div 4 - (year - 1901) \\div 100 + (year - 1601) \\div 400

LOCAL IsLeapYear(year) == year % 4 = 0 /\\ (year % 100 # 0 \\/ year % 400 = 0)

RECURSIVE YearAt(_, _)
YearAt(day, year) ==
  CASE DayFromYear(year) > day -> YearAt(day, year - 1)
    [] DayFromYear(year + 1) <= day -> YearAt(day, year + 1)
    [] OTHER -> year

\\* YearFromTime, from an estimate of 400 years per 146097 days that is off by a year at most.
LOCAL YearOf(time) ==
  YearAt(time.day, 1970 + (time.day \\div 146097) * 400 + ((time.day % 146097) * 400) \\div 146097)

LOCAL MonthStart(month, isLeap) ==
  <<0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365>>[month + 1]
    + (IF isLeap /\\ month >= 2 THEN 1 ELSE 0)

LOCAL MonthOf(time) ==
  LET within == time.day - DayFromYear(YearOf(time))
      isLeap == IsLeapYear(YearOf(time))
  IN CHOOSE month \\in 0..11 :
       MonthStart(month, isLeap) <= within /\\ within < MonthStart(month + 1, isLeap)

LOCAL DateOf(time) ==
  time.day - DayFromYear(YearOf(time)) - MonthStart(MonthOf(time), IsLeapYear(YearOf(time))) + 1

\\* What a Date getter gives for a time value, such as "FullYear" for getFullYear and getUTCFullYear.
DateField(time, field) ==
  IF time = NaN
  THEN NaN
  ELSE CASE field = "FullYear" -> YearOf(time)
         [] field = "Year" -> YearOf(time) - 1900
         [] field = "Month" -> MonthOf(time)
         [] field = "Date" -> DateOf(time)
         [] field = "Day" -> (time.day + 4) % 7
         [] field = "Hours" -> time.ms \\div 3600000
         [] field = "Minutes" -> (time.ms \\div 60000) % 60
         [] field = "Seconds" -> (time.ms \\div 1000) % 60
         [] field = "Milliseconds" -> time.ms % 1000
         [] field = "TimezoneOffset" -> 0

\\* MakeTime, as a time value whose day may be past what TimeClip allows.
LOCAL MakeTime(hour, minute, second, ms) ==
  LET h == ToIntegerOrInfinity(hour)
      m == ToIntegerOrInfinity(minute)
      s == ToIntegerOrInfinity(second)
      milli == ToIntegerOrInfinity(ms)
  IN IF AreFinite(<<hour, minute, second, ms>>)
     THEN TimeValue(h \\div 24 + m \\div 1440 + s \\div 86400 + milli \\div MsPerDay,
                    (h % 24) * 3600000 + (m % 1440) * 60000 + (s % 86400) * 1000
                      + (milli % MsPerDay))
     ELSE NaN

\\* MakeDay, where the year, month, and date stay within bounds that keep the day within TLC's
\\* integers.
LOCAL MakeDay(year, month, date) ==
  LET y == ToIntegerOrInfinity(year)
      m == ToIntegerOrInfinity(month)
      dt == ToIntegerOrInfinity(date)
      ym == y + m \\div 12
  IN CASE ~AreFinite(<<year, month, date>>) -> NaN
       [] \\/ y < -1000000 \\/ y > 1000000
          \\/ m < -10000000 \\/ m > 10000000
          \\/ dt < -1000000000 \\/ dt > 1000000000 ->
            Assert(FALSE, "tla-ts can't make a date this far from 1970")
       [] OTHER -> DayFromYear(ym) + MonthStart(m % 12, IsLeapYear(ym)) + dt - 1

LOCAL MakeDate(day, time) == IF day = NaN \\/ time = NaN THEN NaN ELSE TimeValue(day + time.day, time.ms)

\\* The time value of new Date or Date.UTC with a year and a month, where a year from 0 to 99 is one
\\* in the 1900s.
TimeFromFields(year, month, date, hours, minutes, seconds, ms) ==
  LET yr == IF IsFinite(year) /\\ ToIntegerOrInfinity(year) \\in 0..99
            THEN 1900 + ToIntegerOrInfinity(year)
            ELSE year
  IN TimeClip(MakeDate(MakeDay(yr, month, date), MakeTime(hours, minutes, seconds, ms)))

\\* The time value that a Date setter gives, which sets the fields from the given position on, the
\\* year at 1 and the milliseconds at 7, to the numbers it takes and keeps the rest. Only
\\* setFullYear sets an invalid date, as of 1970.
LOCAL DateSet(time, position, values) ==
  LET base == IF time = NaN /\\ position = 1 THEN TimeValue(0, 0) ELSE time
      fields == <<YearOf(base), MonthOf(base), DateOf(base), base.ms \\div 3600000,
                  (base.ms \\div 60000) % 60, (base.ms \\div 1000) % 60, base.ms % 1000>>
      field(index) ==
        IF index >= position /\\ index < position + Len(values)
        THEN values[index - position + 1]
        ELSE fields[index]
  IN IF base = NaN
     THEN NaN
     ELSE TimeClip(MakeDate(MakeDay(field(1), field(2), field(3)),
                            MakeTime(field(4), field(5), field(6), field(7))))

\\* Whether a value is the built-in Date.prototype method of the given name.
IsDateMethod(value, method) ==
  IsRef(value) /\\ ~IsHeap(value) /\\ value[Ref] = "Date.prototype." \\o method

\\* Whether a value is a Date, which holds a time value.
IsDate(heap, value) == IsHeap(value) /\\ "time" \\in DOMAIN Lookup(heap, value)

\\* What toISOString gives for a valid time value, with a six-digit year past 0 to 9999.
ISOString(time) ==
  LET year == YearOf(time)
      pad(value, width) ==
        LET text == ToString(value) IN SubSeq("000000", 1, width - Len(text)) \\o text
  IN (CASE year < 0 -> "-" \\o pad(-year, 6)
        [] year > 9999 -> "+" \\o pad(year, 6)
        [] OTHER -> pad(year, 4))
       \\o "-" \\o pad(MonthOf(time) + 1, 2) \\o "-" \\o pad(DateOf(time), 2)
       \\o "T" \\o pad(time.ms \\div 3600000, 2) \\o ":" \\o pad((time.ms \\div 60000) % 60, 2)
       \\o ":" \\o pad((time.ms \\div 1000) % 60, 2) \\o "." \\o pad(time.ms % 1000, 3) \\o "Z"

\\* The time value of a Date that reads the clock, which tla-ts doesn't read.
Clock == [clock |-> TRUE]

LOCAL Known(time) == IF time = Clock THEN Assert(FALSE, "tla-ts can't read the clock") ELSE time

\\* The object that new Date makes, which holds its time value.
DateObject(prototype, time) == [EmptyObject EXCEPT !.prototype = prototype] @@ [time |-> time]

\\* The time value that new Date takes from another Date.
TimeOfDate(heap, value) ==
  IF IsDate(heap, value)
  THEN Known(Lookup(heap, value).time)
  ELSE Assert(FALSE, "tla-ts can't convert " \\o ToString(value) \\o " to a time value")

\\* The time value of a Date that reads the built-in method from its prototype.
DateTime(heap, ref, method) ==
  IF IsDate(heap, ref) /\\ IsDateMethod(Get(heap, ref, method), method)
  THEN Known(Lookup(heap, ref).time)
  ELSE Assert(FALSE, "tla-ts can't call this method on " \\o ToString(ref))

\\* The heap after a Date setter, which takes the Date's time value, the method's name, and where it
\\* starts setting fields, or 0 for setTime and setYear, and the time value it sets.
DateChange(heap, ref, time, method, position, values) ==
  LET year == values[1]
      next == CASE method = "setTime" -> TimeFromNumber(values[1])
                [] method = "setYear" /\\ year = NaN -> NaN
                [] method = "setYear" ->
                     DateSet(time, 1, <<IF IsFinite(year) /\\ ToIntegerOrInfinity(year) \\in 0..99
                                        THEN 1900 + ToIntegerOrInfinity(year)
                                        ELSE year>>)
                [] OTHER -> DateSet(time, position, values)
  IN [heap |-> Update(heap, ref, [Lookup(heap, ref) EXCEPT !.time = next]), time |-> next]

\\* The object that a regular expression literal makes, which holds the record of its pattern, and
\\* whose lastIndex is a property of its own.
RegExpObject(prototype, regexp) ==
  [EmptyObject EXCEPT
     !.prototype = prototype,
     !.keys = <<"lastIndex">>,
     !.values = "lastIndex" :> 0,
     !.attributes = "lastIndex" :> [Writable EXCEPT !.enumerable = FALSE, !.configurable = FALSE]]
    @@ [regexp |-> regexp]

\\* The record of a regexp's pattern, where tla-ts follows the built-in methods only while a script
\\* has given the regexp no property but its lastIndex and hasn't changed the built-in objects in
\\* changeable, which hold the methods that the call reads.
RegExpOf(heap, ref, changeable) ==
  IF /\\ IsRegExp(heap, ref)
     /\\ heap.objects[ref[Ref]].prototype = Ref :> "RegExp.prototype"
     /\\ heap.objects[ref[Ref]].keys = <<"lastIndex">>
     /\\ DOMAIN heap.changed \\cap changeable = {}
  THEN heap.objects[ref[Ref]].regexp
  ELSE Assert(FALSE, "tla-ts can't call a regexp's method where a script changed what it reads")

\\* The record of a regexp literal's pattern, where a call can't observe the object that the literal
\\* makes, while a script hasn't changed the built-in objects in changeable.
RegExpFresh(heap, regexp, changeable) ==
  IF DOMAIN heap.changed \\cap changeable = {}
  THEN regexp
  ELSE Assert(FALSE, "tla-ts can't call a regexp's method where a script changed what it reads")

\\* The flags that RegExp.prototype's flags getter gives, which reads each flag from the receiver.
LOCAL FlagsOf(heap, receiver) ==
  LET flags == << <<"d", "hasIndices">>, <<"g", "global">>, <<"i", "ignoreCase">>,
                 <<"m", "multiline">>, <<"s", "dotAll">>, <<"u", "unicode">>,
                 <<"v", "unicodeSets">>, <<"y", "sticky">> >>
      set == SelectSeq(flags, LAMBDA flag : ToBoolean(Get(heap, receiver, flag[2])))
      RECURSIVE Join(_)
      Join(rest) == IF rest = <<>> THEN "" ELSE Head(rest)[1] \\o Join(Tail(rest))
  IN CASE IsRegExp(heap, receiver) -> RegExpOf(heap, receiver, {"RegExp.prototype"}).flags
       [] IsRegExpPrototype(receiver) /\\ "RegExp.prototype" \\notin DOMAIN heap.changed -> ""
       [] IsRef(receiver) -> Join(set)
       [] OTHER -> Assert(FALSE, "tla-ts can't read the flags of " \\o ToString(receiver))

\\* A call of a built-in getter that a script took from a descriptor, as the error that it throws,
\\* or "", and the value that it gives.
GetterCall(heap, getter, receiver) ==
  LET path == GetterPath(getter)
      give(value) == [error |-> "", value |-> value]
      typeError == [error |-> "TypeError", value |-> Undefined]
      object == IF IsHeap(receiver) THEN heap.objects[receiver[Ref]] ELSE EmptyObject
  IN CASE HasPrefix(path, "get RegExp.prototype.") /\\ ~IsObjectIn(heap, receiver) -> typeError
       [] path = "get RegExp.prototype.flags" -> give(FlagsOf(heap, receiver))
       [] path \\in RegExpGetters /\\ (IsRegExp(heap, receiver) \\/ IsRegExpPrototype(receiver)) ->
            give(RegExpGet(heap, path, receiver))
       [] HasPrefix(path, "get RegExp.prototype.") -> typeError
       [] path = "get Symbol.prototype.description" ->
            CASE IsSymbol(receiver) -> give(SymbolDescription(heap, receiver))
              [] "primitive" \\in DOMAIN object /\\ IsSymbol(object.primitive) ->
                   give(SymbolDescription(heap, object.primitive))
              [] OTHER -> typeError
       [] path = "get Object.prototype.__proto__" ->
            CASE receiver \\in {Undefined, Null} -> typeError
              [] IsProxy(heap, receiver) ->
                   Assert(FALSE, "tla-ts can't run a proxy's internal method here")
              [] IsRef(receiver) -> give(Prototype(heap, receiver))
              [] OTHER -> Assert(FALSE, "tla-ts can't read the prototype of " \\o ToString(receiver))
       [] path \\in ViewGetters ->
            IF ViewReceives(heap, path, receiver) THEN give(ViewGet(heap, path, receiver)) ELSE typeError
       [] path \\in {"get " \\o owner \\o ".@@species" :
                     owner \\in {"Array", "RegExp", "Map", "Set", "Promise", "ArrayBuffer",
                                "SharedArrayBuffer"}} ->
            give(receiver)
       [] OTHER -> Assert(FALSE, "tla-ts can't tell which function this value holds")

LOCAL LastIndexValue(heap, ref) == heap.objects[ref[Ref]].values["lastIndex"]

\\* The heap after Set of a regexp's lastIndex, which throws a TypeError where it isn't writable.
LOCAL SetLastIndex(heap, ref, value) ==
  IF heap.objects[ref[Ref]].attributes["lastIndex"].writable
  THEN [heap EXCEPT !.objects[ref[Ref]].values["lastIndex"] = value]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of setting a lastIndex that isn't writable")

\\* RegExpBuiltinExec, as the heap after it sets the lastIndex of a global or sticky regexp, and the
\\* match it finds from there, or a failure. It reads lastIndex with ToLength whatever the flags.
LOCAL RegExpRun(heap, ref, regexp, text) ==
  LET read == LastIndexValue(heap, ref)
      start == IF read = Infinity THEN Len(text) + 1 ELSE ToLength(read)
      isUpdating == regexp.global \\/ regexp.sticky
      found == CASE ~isUpdating /\\ start = start -> RegExpSearch(regexp, text, 0)
                 [] start > Len(text) -> RegExpFailure
                 [] OTHER -> RegExpSearch(regexp, text, start)
  IN  [heap |-> CASE ~isUpdating -> heap
                  [] found.end = -1 -> SetLastIndex(heap, ref, 0)
                  [] OTHER -> SetLastIndex(heap, ref, found.end),
       match |-> found]

\\* The heap once RegExpBuiltinExec makes the array of a match, which is the last object it holds,
\\* after the object of the match's named groups where the regexp has them.
LOCAL RegExpResult(heap, prototype, regexp, text, match) ==
  LET groups == RegExpGroups(regexp, text, match)
      hasGroups == regexp.groupNames # <<>>
      grouped ==
        IF hasGroups
        THEN Allocate(heap, [EmptyObject EXCEPT
                               !.prototype = Null,
                               !.keys = regexp.groupNames,
                               !.values = groups,
                               !.attributes = [name \\in DOMAIN groups |-> Writable]])
        ELSE heap
      array == ArrayObject(prototype, [position \\in 1..(regexp.captures + 1) |->
                                         RegExpCapture(text, match, position - 1)])
      added == ("index" :> match.start) @@ ("input" :> text)
                 @@ ("groups" :> IF hasGroups THEN Allocated(grouped) ELSE Undefined)
  IN  Allocate(grouped, [array EXCEPT
                           !.keys = @ \\o <<"index", "input", "groups">>,
                           !.values = @ @@ added,
                           !.attributes = @ @@ [key \\in DOMAIN added |-> Writable]])

\\* RegExp.prototype.exec, as the heap after it and the array of the match it finds, or null.
RegExpExecIn(heap, ref, value, prototype) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype"})
      text == RegExpText(regexp, value)
      run == RegExpRun(heap, ref, regexp, text)
      made == RegExpResult(run.heap, prototype, regexp, text, run.match)
  IN  IF run.match.end = -1
      THEN [heap |-> run.heap, value |-> Null]
      ELSE [heap |-> made, value |-> Allocated(made)]

\\* RegExp.prototype.test, as the heap after it and whether exec finds a match.
RegExpTestIn(heap, ref, value) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype"})
      run == RegExpRun(heap, ref, regexp, RegExpText(regexp, value))
  IN  [heap |-> run.heap, value |-> run.match.end # -1]

\\* String.prototype.match through RegExp.prototype[@@match]: what exec gives for a regexp that isn't
\\* global, and else the array of each match's text, or null, which leaves lastIndex at 0.
RegExpMatchIn(heap, ref, value, prototype) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      text == RegExpText(regexp, value)
      reset == SetLastIndex(heap, ref, 0)
      matches == RegExpMatches(regexp, text, 0)
      made == Allocate(reset, ArrayObject(prototype, [position \\in DOMAIN matches |->
                                                         RegExpCapture(text, matches[position], 0)]))
  IN  CASE ~regexp.global -> RegExpExecIn(heap, ref, value, prototype)
        [] matches = <<>> -> [heap |-> reset, value |-> Null]
        [] OTHER -> [heap |-> made, value |-> Allocated(made)]

\\* The heap once String.prototype.replace or replaceAll through RegExp.prototype[@@replace] finds its
\\* matches, and those matches. A global regexp finds each match and leaves lastIndex at 0, and
\\* another the match that exec finds.
RegExpMatchesIn(heap, ref, value) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      text == RegExpText(regexp, value)
      run == RegExpRun(heap, ref, regexp, text)
  IN  IF regexp.global
      THEN [heap |-> SetLastIndex(heap, ref, 0), value |-> RegExpMatches(regexp, text, 0)]
      ELSE [heap |-> run.heap, value |-> IF run.match.end = -1 THEN <<>> ELSE <<run.match>>]

\\* String.prototype.replace or replaceAll through RegExp.prototype[@@replace], with a replacement
\\* template.
RegExpReplaceIn(heap, ref, value, template) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      found == RegExpMatchesIn(heap, ref, value)
  IN  [heap |-> found.heap,
       value |-> RegExpReplaced(regexp, RegExpText(regexp, value), found.value, Text(template))]

\\* The argument at a position that replace calls a function with where a script has objects, which
\\* would pass the named groups as an object.
RegExpArgumentIn(regexp, text, match, position) ==
  IF position = regexp.captures + 3 /\\ DOMAIN regexp.names # {}
  THEN Assert(FALSE, "tla-ts can't pass a replace function the object of a match's groups")
  ELSE RegExpArgument(regexp, text, match, position)

\\* String.prototype.search through RegExp.prototype[@@search], which sets lastIndex to 0 while exec
\\* runs and then back.
RegExpSearchIn(heap, ref, value) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      previous == LastIndexValue(heap, ref)
      reset == IF SameValue(previous, 0) THEN heap ELSE SetLastIndex(heap, ref, 0)
      run == RegExpRun(reset, ref, regexp, RegExpText(regexp, value))
      restored == IF SameValue(LastIndexValue(run.heap, ref), previous)
                  THEN run.heap
                  ELSE SetLastIndex(run.heap, ref, previous)
  IN  [heap |-> restored, value |-> IF run.match.end = -1 THEN -1 ELSE run.match.start]

\\* String.prototype.split through RegExp.prototype[@@split], which splits with a new regexp that the
\\* RegExp constructor makes, so the regexp's lastIndex stays as it is.
RegExpSplitIn(heap, ref, value, limit) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype", "RegExp"})
  IN  [heap |-> heap, value |-> RegExpPieces(regexp, RegExpText(regexp, value), limit)]

\\* The length that a value gives an array, or -1 where ArraySetLength throws a RangeError.
LOCAL ArrayLengthOf(value) ==
  CASE value = Null -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] TypeOf(value) = "string" ->
         ReadNumber(value, LAMBDA kind, isNegative, magnitude :
           IF kind = "integer" /\\ (~isNegative \\/ magnitude = 0) THEN magnitude ELSE -1)
    [] value = NegativeZero -> 0
    [] IsInteger(value) /\\ value >= 0 -> value
    [] IsNumber(value) \\/ value = Undefined -> -1
    [] OTHER -> Assert(FALSE, "tla-ts can't convert this value to an array length")

LOCAL Ordinary(object, key, descriptor) ==
  IF CanApply(object, key, descriptor)
  THEN [object |-> Apply(object, key, descriptor), isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]

\\* ArraySetLength, which deletes the elements past a smaller length, from the last, and stops at
\\* one it can't delete.
LOCAL SetLength(object, descriptor) ==
  LET length == ArrayLengthOf(descriptor.value)
      removed == {key \\in DOMAIN object.values : IsIndex(key) /\\ ToIndex(key) >= length}
      blocked == {ToIndex(key) : key \\in {other \\in removed : ~object.attributes[other].configurable}}
      kept == IF blocked = {} THEN length ELSE (CHOOSE index \\in blocked : \\A other \\in blocked : other <= index) + 1
      deleted == {key \\in removed : ToIndex(key) >= kept}
      remaining == DOMAIN object.values \\ deleted
      trimmed == [object EXCEPT !.keys = SelectSeq(@, LAMBDA key : key \\notin deleted),
                                !.values = [key \\in remaining |-> @[key]],
                                !.attributes = [key \\in remaining |-> @[key]]]
  IN CASE length < 0 -> [object |-> object, isDone |-> FALSE, isRangeError |-> TRUE]
       [] length >= object.values["length"] ->
            Ordinary(object, "length", [descriptor EXCEPT !.value = length])
       [] ~object.attributes["length"].writable -> [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
       [] ~CanApply(object, "length", [descriptor EXCEPT !.value = length, !.writable = TRUE]) ->
            [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
       [] OTHER ->
            [object |-> Apply(trimmed, "length", [descriptor EXCEPT !.value = kept]),
             isDone |-> blocked = {},
             isRangeError |-> FALSE]

\\* An object's [[DefineOwnProperty]], where an index past an array's end grows its length.
LOCAL DefineOwn(object, key, descriptor) ==
  CASE ~IsArrayObject(object) -> Ordinary(object, key, descriptor)
    [] key = "length" /\\ "value" \\in descriptor.fields -> SetLength(object, descriptor)
    [] IsIndex(key) ->
         LET length == object.values["length"]
             defined == Ordinary(object, key, descriptor)
         IN CASE ToIndex(key) >= length /\\ ~object.attributes["length"].writable ->
                   [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
              [] ~defined.isDone \\/ ToIndex(key) < length -> defined
              [] OTHER -> [defined EXCEPT !.object.values["length"] = ToIndex(key) + 1]
    [] OTHER -> Ordinary(object, key, descriptor)

\\* The descriptor of a write, which changes a property's value or makes a writable one.
LOCAL WriteDescriptor(object, key, value) ==
  [fields |-> IF key \\in DOMAIN object.values
              THEN {"value"}
              ELSE {"value", "writable", "enumerable", "configurable"},
   isAccessor |-> FALSE, isData |-> TRUE, isValid |-> TRUE, value |-> value, get |-> Undefined,
   set |-> Undefined, writable |-> TRUE, enumerable |-> TRUE, configurable |-> TRUE]

LOCAL Reversed(sequence) == [position \\in DOMAIN sequence |-> sequence[Len(sequence) - position + 1]]

LOCAL ExponentBits(type) == CASE type = "Float16" -> 5 [] type = "Float32" -> 8 [] OTHER -> 11

LOCAL FractionBits(type) == CASE type = "Float16" -> 10 [] type = "Float32" -> 23 [] OTHER -> 52

LOCAL BitsBytes(bits, size) == [position \\in 1..size |-> BitsValue(bits, 8 * (position - 1), 8)]

\\* The little-endian bytes of a float that holds a number exactly, which stops where it would round.
LOCAL FloatBytes(value, type) ==
  LET size == ElementSize(type)
      exponentBits == ExponentBits(type)
      fractionBits == FractionBits(type)
      top == 8 * size - 1
      ones == 2^exponentBits - 1
      encode(isNegative, exponent, fraction) ==
        BitsBytes([position \\in 0..top |->
                     CASE position = top -> IF isNegative THEN 1 ELSE 0
                       [] position >= fractionBits -> (exponent \\div 2^(position - fractionBits)) % 2
                       [] OTHER -> fraction[position]], size)
      none == [position \\in 0..(fractionBits - 1) |-> 0]
      magnitude == IF value < 0 THEN -value ELSE value
      power == CHOOSE candidate \\in 0..30 : magnitude \\div 2^candidate = 1
      shift == fractionBits - power
      rest == magnitude - 2^power
  IN CASE value = NaN ->
            encode(FALSE, ones, [position \\in 0..(fractionBits - 1) |->
                                   IF position = fractionBits - 1 THEN 1 ELSE 0])
       [] value = Infinity -> encode(FALSE, ones, none)
       [] value = NegativeInfinity -> encode(TRUE, ones, none)
       [] value = NegativeZero -> encode(TRUE, 0, none)
       [] value = 0 -> encode(FALSE, 0, none)
       [] IsFraction(value) -> Assert(FALSE, "tla-ts can't write a fraction's bits")
       [] value = -2147483647 - 1 -> Assert(FALSE, "tla-ts can't represent a number this big")
       [] (shift < 0 /\\ magnitude % 2^(-shift) # 0) \\/ power + 2^(exponentBits - 1) - 1 >= ones ->
            Assert(FALSE, "tla-ts can't round a number to a float")
       [] OTHER ->
            encode(value < 0, power + 2^(exponentBits - 1) - 1,
                   [position \\in 0..(fractionBits - 1) |->
                      IF position < shift THEN 0 ELSE (rest \\div 2^(position - shift)) % 2])

\\* The little-endian bytes that an element of a type holds for a number.
NumberBytes(type, value) ==
  CASE type \\in {"Float16", "Float32", "Float64"} -> FloatBytes(value, type)
    [] IsFraction(value) /\\ type = "Uint8Clamped" ->
         Assert(FALSE, "tla-ts can't round a fraction to a byte")
    [] IsFraction(value) ->
         [position \\in 1..ElementSize(type) |-> (Truncate(value) \\div 2^(8 * (position - 1))) % 256]
    [] type = "Uint8Clamped" ->
         <<CASE value \\in {NaN, NegativeZero, NegativeInfinity} -> 0
             [] value = Infinity -> 255
             [] value < 0 -> 0
             [] value > 255 -> 255
             [] OTHER -> value>>
    [] value \\in SpecialNumbers -> [position \\in 1..ElementSize(type) |-> 0]
    [] OTHER -> [position \\in 1..ElementSize(type) |-> (value \\div 2^(8 * (position - 1))) % 256]

RECURSIVE NumbersBytes(_, _)
NumbersBytes(type, numbers) ==
  IF numbers = <<>> THEN <<>> ELSE NumberBytes(type, Head(numbers)) \\o NumbersBytes(type, Tail(numbers))

LOCAL WithBytes(heap, view, start, written) ==
  LET bytes == ViewedBytes(heap, view)
  IN [heap EXCEPT !.objects[view.viewed[Ref]].bytes =
        SubSeq(bytes, 1, start) \\o written \\o SubSeq(bytes, start + Len(written) + 1, Len(bytes))]

\\* A write to a typed array's element, which converts the value first, and does nothing at an
\\* index past the end.
TypedSet(heap, ref, key, value) ==
  LET number == ToNumber(value)
      view == heap.objects[ref[Ref]]
  IN IF number = number /\\ TypedKey(key) = "index" /\\ ToIndex(key) < ViewLength(heap, view)
     THEN WithBytes(heap, view, view.byteOffset + ToIndex(key) * ElementSize(view.elementType),
                    NumberBytes(view.elementType, number))
     ELSE heap

\\* ToIndex of an argument, or -1 where it throws a RangeError.
IndexOfArgument(value) ==
  LET number == ToNumber(value)
  IN CASE number \\in {NaN, NegativeZero} -> 0
       [] number \\in {Infinity, NegativeInfinity} -> -1
       [] IsFraction(number) -> IF Truncate(number) < 0 THEN -1 ELSE Truncate(number)
       [] number < 0 -> -1
       [] OTHER -> number

LOCAL MaxBytes == 65536

LOCAL RangeError(what) == Assert(FALSE, "tla-ts can't throw the RangeError of " \\o what)

LOCAL ViewObject(prototype, buffer, offset, length) ==
  [viewed |-> buffer, byteOffset |-> offset, viewLength |-> length]
    @@ [EmptyObject EXCEPT !.prototype = prototype]

LOCAL BufferObject(prototype, bytes, maxLength, isShared) ==
  [bytes |-> bytes, maxLength |-> maxLength, isShared |-> isShared, isDetached |-> FALSE]
    @@ [EmptyObject EXCEPT !.prototype = prototype]

\\* The heap with a new ArrayBuffer or SharedArrayBuffer of a length, which options may make
\\* resizable.
NewBuffer(heap, prototype, arguments, isShared) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      byteLength == IndexOfArgument(argument(1))
      options == argument(2)
      maximum == IF IsObjectIn(heap, options) THEN Get(heap, options, "maxByteLength") ELSE Undefined
      maxLength == IF maximum = Undefined THEN Undefined ELSE IndexOfArgument(maximum)
  IN CASE byteLength = -1 -> RangeError("an invalid length")
       [] maxLength = -1 -> RangeError("an invalid length")
       [] maxLength # Undefined /\\ byteLength > maxLength -> RangeError("a length past the maximum")
       [] byteLength > MaxBytes \\/ (maxLength # Undefined /\\ maxLength > MaxBytes) ->
            Assert(FALSE, "tla-ts can't make a buffer this big")
       [] OTHER ->
            Allocate(heap, BufferObject(prototype, [position \\in 1..byteLength |-> 0], maxLength,
                                        isShared))

\\* The heap with a new DataView of a buffer.
NewDataView(heap, prototype, arguments) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      buffer == argument(1)
      object == heap.objects[buffer[Ref]]
      offset == IndexOfArgument(argument(2))
      length == IF argument(3) = Undefined THEN Undefined ELSE IndexOfArgument(argument(3))
  IN CASE ~IsBuffer(heap, buffer) ->
            Assert(FALSE, "tla-ts can't throw the TypeError of a DataView of something other than a buffer")
       [] offset = -1 -> RangeError("an invalid offset")
       [] object.isDetached -> Assert(FALSE, "tla-ts can't throw the TypeError of a detached buffer")
       [] offset > Len(object.bytes) -> RangeError("an offset past the end")
       [] length = -1 -> RangeError("an invalid length")
       [] length # Undefined /\\ offset + length > Len(object.bytes) -> RangeError("a length past the end")
       [] OTHER ->
            Allocate(heap, ViewObject(prototype, buffer, offset,
                                      CASE length # Undefined -> length
                                        [] object.maxLength # Undefined -> -1
                                        [] OTHER -> Len(object.bytes) - offset))

\\* The heap with a new typed array of a length, of the elements of an array or a typed array, or
\\* viewing a buffer.
NewTypedArray(heap, type, prototype, bufferPrototype, arguments) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      size == ElementSize(type)
      first == argument(1)
      view(current, buffer, offset, length) ==
        Allocate(current, [elementType |-> type] @@ ViewObject(prototype, buffer, offset, length))
      withBytes(bytes) ==
        LET allocated == Allocate(heap, BufferObject(bufferPrototype, bytes, Undefined, FALSE))
        IN view(allocated, Allocated(allocated), 0, Len(bytes) \\div size)
      object == heap.objects[first[Ref]]
      offset == IndexOfArgument(argument(2))
      length == IF argument(3) = Undefined THEN Undefined ELSE IndexOfArgument(argument(3))
      byteLength == Len(object.bytes)
  IN CASE type \\in {"BigInt64", "BigUint64"} ->
            Assert(FALSE, "tla-ts can't hold BigInts in a typed array")
       [] ~IsObjectIn(heap, first) ->
            LET count == IndexOfArgument(first)
            IN CASE count = -1 -> RangeError("an invalid length")
                 [] count * size > MaxBytes -> Assert(FALSE, "tla-ts can't make a buffer this big")
                 [] OTHER -> withBytes([position \\in 1..(count * size) |-> 0])
       [] IsTypedArray(heap, first) ->
            IF IsOutOfBounds(heap, object)
            THEN Assert(FALSE, "tla-ts can't throw the TypeError of a typed array out of bounds")
            ELSE withBytes(NumbersBytes(type, [position \\in 1..ViewLength(heap, object) |->
                                                 TypedElement(heap, first, position - 1)]))
       [] IsSequenceValue(first) ->
            withBytes(NumbersBytes(type, [position \\in DOMAIN first |-> ToNumber(first[position])]))
       [] ~IsBuffer(heap, first) /\\ IsHeap(first) ->
            LET method == Get(heap, first, WellKnownSymbol("iterator"))
                count == ToLength(Get(heap, first, "length"))
            IN IF \\/ method \\in {Undefined, Null}
                  \\/ IsArray(heap, first) /\\ method = Ref :> "Array.prototype.values"
               THEN withBytes(NumbersBytes(type, [position \\in 1..count |->
                                                    ToNumber(Get(heap, first, ToString(position - 1)))]))
               ELSE Assert(FALSE, "tla-ts can't make a typed array of this object")
       [] ~IsBuffer(heap, first) -> Assert(FALSE, "tla-ts can't make a typed array of this object")
       [] offset = -1 \\/ offset % size # 0 -> RangeError("an invalid offset")
       [] length = -1 -> RangeError("an invalid length")
       [] object.isDetached -> Assert(FALSE, "tla-ts can't throw the TypeError of a detached buffer")
       [] length = Undefined /\\ object.maxLength # Undefined ->
            IF offset > byteLength THEN RangeError("an offset past the end") ELSE view(heap, first, offset, -1)
       [] length = Undefined ->
            IF byteLength % size # 0 \\/ offset > byteLength
            THEN RangeError("an invalid offset")
            ELSE view(heap, first, offset, (byteLength - offset) \\div size)
       [] offset + length * size > byteLength -> RangeError("a length past the end")
       [] OTHER -> view(heap, first, offset, length)

\\* Whether new of a typed array iterates an object through an @@iterator method that a script
\\* gives, which only statements can call.
IteratesScriptMethod(heap, value) ==
  /\\ IsHeap(value)
  /\\ ~IsTypedArray(heap, value)
  /\\ ~IsBuffer(heap, value)
  /\\ LET method == Get(heap, value, WellKnownSymbol("iterator"))
     IN method \\notin {Undefined, Null} /\\ ~(IsRef(method) /\\ ~IsHeap(method))

LOCAL Returned(heap, value) == [heap |-> heap, value |-> value, error |-> ""]

LOCAL Thrown(heap, error) == [heap |-> heap, value |-> Undefined, error |-> error]

\\* DataView's get and set methods, which give the heap after them, their value, and the error they
\\* throw, if any.
DataViewGet(heap, ref, type, request, littleEndian) ==
  LET view == heap.objects[ref[Ref]]
      index == IndexOfArgument(request)
      isLittle == ToBoolean(littleEndian)
      size == ElementSize(type)
      bytes == SubSeq(ViewedBytes(heap, view), view.byteOffset + index + 1, view.byteOffset + index + size)
  IN CASE index = -1 -> Thrown(heap, "RangeError")
       [] isLittle = isLittle /\\ IsOutOfBounds(heap, view) -> Thrown(heap, "TypeError")
       [] index + size > ViewLength(heap, view) -> Thrown(heap, "RangeError")
       [] OTHER -> Returned(heap, NumberOfBytes(type, IF isLittle THEN bytes ELSE Reversed(bytes)))

DataViewSet(heap, ref, type, request, value, littleEndian) ==
  LET view == heap.objects[ref[Ref]]
      index == IndexOfArgument(request)
      number == ToNumber(value)
      isLittle == ToBoolean(littleEndian)
      bytes == NumberBytes(type, number)
  IN CASE index = -1 -> Thrown(heap, "RangeError")
       [] number = number /\\ isLittle = isLittle /\\ IsOutOfBounds(heap, view) -> Thrown(heap, "TypeError")
       [] index + ElementSize(type) > ViewLength(heap, view) -> Thrown(heap, "RangeError")
       [] OTHER ->
            Returned(WithBytes(heap, view, view.byteOffset + index,
                               IF isLittle THEN bytes ELSE Reversed(bytes)), Undefined)

\\* ArrayBuffer's resize and SharedArrayBuffer's grow.
Resize(heap, ref, request, isShared) ==
  LET object == heap.objects[ref[Ref]]
      length == IndexOfArgument(request)
  IN CASE ~IsBuffer(heap, ref) \\/ object.isShared # isShared \\/ object.maxLength = Undefined ->
            Thrown(heap, "TypeError")
       [] length = -1 -> Thrown(heap, "RangeError")
       [] object.isDetached -> Thrown(heap, "TypeError")
       [] length > object.maxLength -> Thrown(heap, "RangeError")
       [] isShared /\\ length < Len(object.bytes) -> Thrown(heap, "RangeError")
       [] OTHER ->
            Returned([heap EXCEPT !.objects[ref[Ref]].bytes =
                        IF length <= Len(@) THEN SubSeq(@, 1, length)
                        ELSE @ \\o [position \\in 1..(length - Len(@)) |-> 0]], Undefined)

\\* ArrayBuffer's and SharedArrayBuffer's slice, which copies bytes into a new buffer that the
\\* receiver's constructor makes, where tla-ts follows only the built-in one.
BufferSlice(heap, ref, start, end, isShared, constructor) ==
  LET object == heap.objects[ref[Ref]]
      length == Len(object.bytes)
      clamped(index) == IF index < 0 THEN 0 ELSE IF index > length THEN length ELSE index
      first == clamped(RelativeIndex(ToIntegerOrInfinity(ToNumber(start)), length))
      final ==
        IF end = Undefined
        THEN length
        ELSE clamped(RelativeIndex(ToIntegerOrInfinity(ToNumber(end)), length))
      species == Get(heap, ref, "constructor")
  IN CASE ~IsBuffer(heap, ref) \\/ object.isShared # isShared -> Thrown(heap, "TypeError")
       [] object.isDetached -> Thrown(heap, "TypeError")
       [] species \\notin {Undefined, constructor} ->
            Assert(FALSE, "tla-ts can't make a buffer through a constructor that a script gives")
       [] OTHER ->
            LET made == Allocate(heap, BufferObject(Get(heap, constructor, "prototype"),
                                                    SubSeq(object.bytes, first + 1, final),
                                                    Undefined, isShared))
            IN Returned(made, Allocated(made))

\\* %TypedArray%.prototype's methods that read and write a typed array's elements, which give the
\\* heap after them, their value, and the error they throw, if any. slice and subarray make their
\\* typed array through the receiver's constructor, of those that constructors holds by their element
\\* types, where tla-ts follows only the built-in one. Any method throws a TypeError for a receiver
\\* that isn't a typed array.
TypedArrayMethod(heap, ref, method, arguments, bufferPrototype, constructors) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      integer(position) == ToIntegerOrInfinity(ToNumber(argument(position)))
      view == heap.objects[ref[Ref]]
      length == ViewLength(heap, view)
      clamped(index) == IF index < 0 THEN 0 ELSE IF index > length THEN length ELSE index
      start(position) == clamped(RelativeIndex(integer(position), length))
      end(position) ==
        IF argument(position) = Undefined THEN length ELSE clamped(RelativeIndex(integer(position), length))
      elements == [position \\in 1..length |-> TypedElement(heap, ref, position - 1)]
      at == RelativeIndex(integer(1), length)
      from ==
        LET index == integer(2)
        IN CASE index = NegativeInfinity -> 0
             [] index = Infinity -> length
             [] index < 0 -> IF length + index < 0 THEN 0 ELSE length + index
             [] OTHER -> index
      found(Equal(_, _)) == {index \\in from..(length - 1) : Equal(elements[index + 1], argument(1))}
      last ==
        LET index == IF Len(arguments) >= 2 THEN integer(2) ELSE length - 1
        IN CASE index = NegativeInfinity -> -1
             [] index = Infinity -> length - 1
             [] index < 0 -> length + index
             [] index >= length -> length - 1
             [] OTHER -> index
      separator == IF argument(1) = Undefined THEN "," ELSE StringOf(argument(1))
      write(current, first, values) ==
        IF values = <<>>
        THEN current
        ELSE WithBytes(current, view, view.byteOffset + first * ElementSize(view.elementType),
                       NumbersBytes(view.elementType, values))
      constructor == Get(heap, ref, "constructor")
      own == constructors[view.elementType]
      species ==
        IF /\\ constructor \\in {Undefined, own}
           /\\ GetterOf(heap, own, WellKnownSymbol("species"))
                = Ref :> "get %Int8Array.[[Prototype]]%.@@species"
        THEN own
        ELSE Assert(FALSE, "tla-ts can't make a typed array through a constructor that a script gives")
      made(current, kept) ==
        LET allocated == Allocate(current, BufferObject(bufferPrototype,
                                                        NumbersBytes(view.elementType, kept),
                                                        Undefined, FALSE))
            prototype == Get(allocated, species, "prototype")
            result == Allocate(allocated, [elementType |-> view.elementType]
                                            @@ ViewObject(prototype, Allocated(allocated), 0, Len(kept)))
        IN Returned(result, Allocated(result))
  IN CASE ~IsTypedArray(heap, ref) -> Thrown(heap, "TypeError")
       [] method \\notin {"at", "includes", "indexOf", "lastIndexOf", "join", "fill", "reverse", "slice",
                         "subarray"} ->
            Assert(FALSE, "tla-ts can't run this typed array method")
       [] method = "subarray" ->
            LET buffer == heap.objects[view.viewed[Ref]]
                first == start(1)
                count == IF end(2) > first THEN end(2) - first ELSE 0
                begin == view.byteOffset + first * ElementSize(view.elementType)
                isTracking == view.viewLength = -1 /\\ argument(2) = Undefined
                viewing == NewTypedArray(heap, view.elementType, Get(heap, species, "prototype"),
                                      bufferPrototype,
                                      IF isTracking THEN <<view.viewed, begin>>
                                      ELSE <<view.viewed, begin, count>>)
            IN CASE buffer.isDetached -> Thrown(heap, "TypeError")
                 [] begin + (IF isTracking THEN 0 ELSE count * ElementSize(view.elementType))
                      > Len(buffer.bytes) -> Thrown(heap, "RangeError")
                 [] OTHER -> Returned(viewing, Allocated(viewing))
       [] IsOutOfBounds(heap, view) -> Thrown(heap, "TypeError")
       [] method = "at" ->
            Returned(heap, IF at \\in 0..(length - 1) THEN elements[at + 1] ELSE Undefined)
       [] method = "includes" ->
            Returned(heap, length > 0 /\\ found(SameValueZero) # {})
       [] method = "indexOf" ->
            LET indices == found(StrictEquals)
            IN Returned(heap, IF length = 0 \\/ indices = {} THEN -1
                              ELSE CHOOSE index \\in indices : \\A other \\in indices : index <= other)
       [] method = "lastIndexOf" ->
            LET indices == {index \\in 0..last : StrictEquals(elements[index + 1], argument(1))}
            IN Returned(heap, IF length = 0 \\/ indices = {} THEN -1
                              ELSE CHOOSE index \\in indices : \\A other \\in indices : index >= other)
       [] method = "join" -> Returned(heap, Join([position \\in 1..length |-> StringOf(elements[position])], separator))
       [] method = "fill" ->
            LET number == ToNumber(argument(1))
                first == start(2)
                final == end(3)
                count == IF final > first THEN final - first ELSE 0
            IN Returned(write(heap, first, [position \\in 1..count |-> number]), ref)
       [] method = "reverse" ->
            Returned(write(heap, 0, [position \\in 1..length |-> elements[length + 1 - position]]), ref)
       [] method = "slice" ->
            LET first == start(1)
                final == end(2)
            IN made(heap, IF final > first THEN SubSeq(elements, first + 1, final) ELSE <<>>)

SetProperty(heap, ref, key, value) ==
  LET accessor == AccessorOf(heap, ref, key)
      object == PropertiesOf(heap, ref, key)
      written == DefineOwn(object, key, WriteDescriptor(object, key, value))
      failed == Assert(FALSE, "tla-ts can't throw the TypeError of a failed write")
  IN CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> TypedSet(heap, ref, key, value)
       [] ~CanPut(heap, ref, key) -> failed
       [] accessor = Undefined /\\ IsArrayObject(object) ->
            CASE written.isDone -> Update(heap, ref, written.object)
              [] written.isRangeError ->
                   Assert(FALSE, "tla-ts can't throw the RangeError of an invalid array length")
              [] OTHER -> failed
       [] accessor = Undefined -> Update(heap, ref, Put(object, key, value))
       [] accessor.set \\in DOMAIN ConstantFunctions -> heap
       [] OTHER -> Assert(FALSE, "tla-ts can't call setters")

\\* The elements of an array that the heap holds, which push, pop, shift, and unshift read and write
\\* whole: each index below its length is its own plain data property.
LOCAL DenseElements(heap, ref) ==
  LET object == Lookup(heap, ref)
      length == object.values["length"]
  IN IF /\\ IsArrayObject(object)
        /\\ \\A position \\in 0..(length - 1) :
             /\\ ToString(position) \\in DOMAIN object.values
             /\\ object.attributes[ToString(position)] = Writable
     THEN [position \\in 1..length |-> object.values[ToString(position - 1)]]
     ELSE Assert(FALSE, "tla-ts can't change an array in place that has holes or fixed elements")

\\* The heap after an array's elements change in place and its length becomes the given one, where
\\* each index past the old end takes an ordinary write.
LOCAL WithElements(heap, ref, elements, length) ==
  LET object == Lookup(heap, ref)
      old == {key \\in DOMAIN object.values : IsIndex(key)}
      indices == {ToString(position - 1) : position \\in DOMAIN elements}
      kept == (DOMAIN object.values \\ old) \\cup indices
  IN IF \\A key \\in indices \\ old : CanPut(heap, ref, key) /\\ AccessorOf(heap, ref, key) = Undefined
     THEN Update(heap, ref, [object EXCEPT
            !.keys = [position \\in DOMAIN elements |-> ToString(position - 1)]
                       \\o SelectSeq(@, LAMBDA key : ~IsIndex(key)),
            !.values = [key \\in kept |-> CASE key = "length" -> length
                                            [] key \\in indices -> elements[ToIndex(key) + 1]
                                            [] OTHER -> @[key]],
            !.attributes = [key \\in kept |-> IF key \\in indices THEN Writable ELSE @[key]]])
     ELSE Assert(FALSE, "tla-ts can't add an element where the array can't take it")

\\* The elements that an array holds at its own indices, by index, where it may have holes.
LOCAL OwnElements(object) ==
  [position \\in {ToIndex(key) : key \\in {key \\in DOMAIN object.values : IsIndex(key)}} |->
     object.values[ToString(position)]]

\\* The heap after an array's elements become the given ones by index, where each index that the
\\* elements leave out becomes a hole. Only an array whose elements are ordinary data properties,
\\* whose prototypes hold no elements, and that takes new ones, changes this way, as sort, reverse,
\\* and copyWithin would otherwise run setters or throw.
LOCAL WithOwnElements(heap, ref, elements, isWriting) ==
  LET object == Lookup(heap, ref)
      old == {key \\in DOMAIN object.values : IsIndex(key)}
      present == DOMAIN elements
      ordered == [position \\in 1..Cardinality(present) |->
                   CHOOSE element \\in present :
                     Cardinality({other \\in present : other < element}) = position - 1]
      indices == {ToString(position) : position \\in present}
      kept == (DOMAIN object.values \\ old) \\cup indices
  IN CASE object.prototype # Null /\\ IndexKeys(heap, object.prototype) # {} ->
            Assert(FALSE, "tla-ts can't reorder an array in place with inherited elements")
       [] ~isWriting -> heap
       [] (\\A key \\in old : object.attributes[key] = Writable) /\\ object.extensible ->
            Update(heap, ref, [object EXCEPT
            !.keys = [position \\in DOMAIN ordered |-> ToString(ordered[position])]
                       \\o SelectSeq(@, LAMBDA key : ~IsIndex(key)),
            !.values = [key \\in kept |->
                         IF key \\in indices THEN elements[ToIndex(key)] ELSE @[key]],
            !.attributes = [key \\in kept |-> IF key \\in indices THEN Writable ELSE @[key]]])
       [] OTHER ->
            Assert(FALSE, "tla-ts can't reorder an array in place with accessors or fixed elements")

\\* reverse() on an array that the heap holds, which moves each hole as it moves each element.
ArrayReverse(heap, ref) ==
  LET object == Lookup(heap, ref)
      elements == OwnElements(object)
      last == object.values["length"] - 1
  IN WithOwnElements(heap, ref,
       [position \\in {last - index : index \\in DOMAIN elements} |-> elements[last - position]],
       last > 0)

\\* sort() on an array that the heap holds, which sorts the elements it has to its start, with
\\* undefined after them and the holes last.
ArraySort(heap, ref, IsBefore(_, _)) ==
  LET elements == OwnElements(Lookup(heap, ref))
      present == DOMAIN elements
      ordered == [position \\in 1..Cardinality(present) |->
                   elements[CHOOSE element \\in present :
                              Cardinality({other \\in present : other < element}) = position - 1]]
      sorted == SortSequence(ordered, IsBefore)
  IN WithOwnElements(heap, ref, [position \\in 0..(Len(sorted) - 1) |-> sorted[position + 1]],
       present # {})

\\* copyWithin() on an array that the heap holds, where a hole that it copies deletes the element it
\\* copies over. The indices are the numbers that its arguments give, and end is Undefined where it
\\* takes the length.
ArrayCopyWithin(heap, ref, target, start, end) ==
  LET object == Lookup(heap, ref)
      elements == OwnElements(object)
      length == object.values["length"]
      to == ClampedIndex(target, length)
      from == ClampedIndex(start, length)
      final == IF end = Undefined THEN length ELSE ClampedIndex(end, length)
      count == IF final - from < length - to THEN final - from ELSE length - to
      isCopied(position) == position >= to /\\ position < to + count
      present == {position \\in DOMAIN elements : ~isCopied(position)}
                   \\cup {position \\in to..(to + count - 1) : position - to + from \\in DOMAIN elements}
  IN WithOwnElements(heap, ref,
       [position \\in present |->
          IF isCopied(position) THEN elements[position - to + from] ELSE elements[position]],
       count > 0)

\\* What push, pop, shift, or unshift does to an array that the heap holds: the heap after, the value
\\* that the method gives, and whether it throws a TypeError. An array whose length is fixed throws
\\* where the method sets its length, after a pop or a shift has moved and deleted its elements, and
\\* one that takes no new index throws where the method first writes one.
ArrayChange(heap, ref, method, items) ==
  LET object == Lookup(heap, ref)
      elements == DenseElements(heap, ref)
      length == Len(elements)
      isFixed == ~object.attributes["length"].writable
      isAdding == method \\in {"push", "unshift"} /\\ items # <<>>
      first == CASE method = "push" \\/ length = 0 -> ToString(length)
                 [] OTHER -> ToString(length + Len(items) - 1)
      changed == CASE method = "push" -> elements \\o items
                   [] method = "unshift" -> items \\o elements
                   [] elements = <<>> -> elements
                   [] method = "pop" -> SubSeq(elements, 1, length - 1)
                   [] method = "shift" -> Tail(elements)
  IN IF isAdding /\\ (isFixed \\/ ~object.extensible)
     THEN IF AccessorOf(heap, ref, first) = Undefined
          THEN [heap |-> heap, value |-> Undefined, isThrown |-> TRUE]
          ELSE Assert(FALSE, "tla-ts can't add an element where the array can't take it")
     ELSE [heap |-> WithElements(heap, ref, changed, IF isFixed THEN length ELSE Len(changed)),
           value |-> CASE method \\in {"push", "unshift"} -> Len(changed)
                       [] elements = <<>> -> Undefined
                       [] method = "pop" -> elements[length]
                       [] method = "shift" -> Head(elements),
           isThrown |-> isFixed]

\\* What a splice whose result nothing reads does to an array that the heap holds, which makes that
\\* result through the array's constructor, where tla-ts follows only Array.
ArraySplice(heap, ref, start, hasCount, count, items, array) ==
  LET object == Lookup(heap, ref)
      elements == DenseElements(heap, ref)
      length == Len(elements)
      relative == ToIntegerOrInfinity(ToNumber(start))
      deleting == IF hasCount THEN ToIntegerOrInfinity(ToNumber(count)) ELSE length
  IN CASE ~(relative \\in Int /\\ deleting \\in Int) ->
            Assert(FALSE, "tla-ts can't splice at a position that isn't an integer")
       [] ~object.attributes["length"].writable \\/ ~object.extensible ->
            Assert(FALSE, "tla-ts can't splice an array whose length is fixed")
       [] OTHER ->
            LET first == CASE relative < 0 /\\ length + relative < 0 -> 0
                           [] relative < 0 -> length + relative
                           [] relative > length -> length
                           [] OTHER -> relative
                deleted == CASE deleting < 0 -> 0
                             [] deleting > length - first -> length - first
                             [] OTHER -> deleting
                changed == SubSeq(elements, 1, first) \\o items
                             \\o SubSeq(elements, first + deleted + 1, length)
            IN Species(Get(heap, ref, "constructor"), array,
                       [heap |-> WithElements(heap, ref, changed, Len(changed)),
                        value |-> Undefined,
                        isThrown |-> FALSE])

RECURSIVE ApplyAll(_, _, _)
ApplyAll(object, keys, descriptors) ==
  IF keys = <<>>
  THEN [object |-> object, isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE LET defined == DefineOwn(object, Head(keys), Head(descriptors))
       IN IF defined.isDone THEN ApplyAll(defined.object, Tail(keys), Tail(descriptors)) ELSE defined

\\* Whether a value is an object, where a function throws a TypeError if it isn't. An object that
\\* isn't in the heap, such as an array, stops the run.
IsObjectArgument(value) ==
  CASE IsObject(value) -> TRUE
    [] value # Null /\\ TypeOf(value) = "object" ->
         Assert(FALSE, "tla-ts can't use " \\o ToString(value) \\o " as an object here")
    [] OTHER -> FALSE

\\* The values that tla-ts keeps outside the heap never read a built-in's accessors, but for an
\\* array, which reads Array.prototype past its end. Function.prototype is the one built-in function
\\* that inherits from Object.prototype, and only functions that the heap holds read it.
LOCAL CanDefineOn(ref, descriptor) ==
  Assert(\\/ IsHeap(ref)
         \\/ ~descriptor.isAccessor
         \\/ BuiltInKey(ref) \\in {"Array.prototype", "Object.prototype"}
         \\/ /\\ ~IsRef(ref)
            /\\ IsBuiltIn(ref)
            /\\ BuiltIns[ref].isCallable
            /\\ BuiltIns[ref].prototype = Ref :> "Object.prototype",
         "tla-ts can't define accessors on built-in objects")

\\* Defines each key with the descriptor that ToPropertyDescriptor gave it, in order.
DefineConvertedAll(heap, ref, keys, descriptors) ==
  LET applied == ApplyAll(Lookup(heap, ref), keys, descriptors)
  IN IF \\A position \\in DOMAIN keys :
          descriptors[position].isValid /\\ CanDefineOn(ref, descriptors[position])
     THEN [heap |-> Update(heap, ref, applied.object), isDone |-> applied.isDone,
           isRangeError |-> applied.isRangeError]
     ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]

DefineConverted(heap, ref, key, converted) == DefineConvertedAll(heap, ref, <<key>>, <<converted>>)

DefineProperty(heap, ref, key, descriptor) ==
  IF IsObjectArgument(ref) /\\ IsObjectArgument(descriptor)
  THEN DefineConverted(heap, ref, key, ToDescriptor(heap, descriptor))
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]

\\* Reflect.defineProperty, which throws a TypeError only where its target or its descriptor isn't
\\* an object or the descriptor isn't valid, and gives whether it defined the key otherwise.
ReflectDefineProperty(heap, ref, key, descriptor) ==
  IF IsObjectArgument(ref) /\\ IsObjectArgument(descriptor)
     /\\ ToDescriptor(heap, descriptor).isValid
  THEN LET defined == DefineConverted(heap, ref, key, ToDescriptor(heap, descriptor))
       IN [heap |-> defined.heap, isDone |-> ~defined.isRangeError,
           isRangeError |-> defined.isRangeError, value |-> defined.isDone]
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]

DefineProperties(heap, ref, properties) ==
  LET source == Lookup(heap, properties)
      keys == EnumerableOwnKeys(source)
      values == [position \\in DOMAIN keys |-> Value(source, keys[position])]
  IN IF \\/ ~IsObjectArgument(ref)
        \\/ ~IsObjectArgument(properties)
        \\/ \\E position \\in DOMAIN keys : ~IsObjectArgument(values[position])
     THEN [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
     ELSE DefineConvertedAll(heap, ref, keys,
                             [position \\in DOMAIN keys |-> ToDescriptor(heap, values[position])])

\\* The own keys of an object, with its symbols last, that Object.defineProperties visits.
PropertyKeysOf(heap, ref) ==
  LET object == Lookup(heap, ref) IN OwnKeys(object) \\o SelectSeq(object.keys, IsSymbol)


LOCAL EntryPart(heap, entry, position) ==
  CASE IsRef(entry) -> Get(heap, entry, ToString(position - 1))
    [] TypeOf(entry) = "object" /\\ entry # Null /\\ SubSeq(ToString(entry), 1, 2) = "<<" ->
         IF position <= Len(entry) THEN entry[position] ELSE Undefined
    [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of Object.fromEntries")

RECURSIVE PutEntries(_, _, _)
PutEntries(heap, object, entries) ==
  IF entries = <<>>
  THEN object
  ELSE PutEntries(heap,
                  Put(object, PropertyKey(EntryPart(heap, Head(entries), 1)),
                      EntryPart(heap, Head(entries), 2)),
                  Tail(entries))

\\* Object.fromEntries of an array of entries, each of which holds its key at "0" and its value at
\\* "1". A later entry's value replaces an earlier one's, where the key keeps its place.
FromEntries(heap, entries) == Allocate(heap, PutEntries(heap, EmptyObject, entries))

\\* Object.create as a change, which fails where it throws a TypeError.
CreateChange(heap, prototype, properties) ==
  LET created == Allocate(heap, [EmptyObject EXCEPT !.prototype = prototype])
  IN CASE ~(prototype = Null \\/ IsObjectArgument(prototype)) ->
            [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
       [] properties = Undefined -> [heap |-> created, isDone |-> TRUE, isRangeError |-> FALSE]
       [] OTHER -> DefineProperties(created, Allocated(created), properties)

Create(heap, prototype, properties) ==
  LET change == CreateChange(heap, prototype, properties)
  IN IF change.isDone
     THEN change.heap
     ELSE Assert(FALSE, "tla-ts can't throw the TypeError of Object.create")

\\* The writes of Object.assign from one source, which reads each key's value before it writes it.
RECURSIVE AssignKeys(_, _, _, _)
AssignKeys(heap, ref, source, keys) ==
  IF keys = <<>>
  THEN [heap |-> heap, isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE LET key == Head(keys)
           value == Value(IF IsObject(source) THEN Lookup(heap, source) ELSE source, key)
       IN IF value = value /\\ ~CanPut(heap, ref, key)
          THEN [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
          ELSE AssignKeys(SetProperty(heap, ref, key, value), ref, source, Tail(keys))

\\* Object.assign, which writes the enumerable own properties of each source in turn, and skips
\\* null, undefined, and the primitives that have none. A string copies its characters.
RECURSIVE Assign(_, _, _)
Assign(heap, ref, sources) ==
  IF sources = <<>>
  THEN [heap |-> heap, isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE LET value == Head(sources)
           source ==
             CASE IsObject(value) -> value
               [] TypeOf(value) = "string" -> WrapperObject(Null, value)
               [] value \\in {Undefined, Null} \\/ TypeOf(value) \\in {"number", "boolean", "symbol"} ->
                    EmptyObject
               [] OTHER -> Assert(FALSE, "tla-ts can't copy the properties of " \\o ToString(value))
           written ==
             AssignKeys(heap, ref, source,
                        EnumerableOwnKeys(IF IsObject(source) THEN Lookup(heap, source) ELSE source))
       IN IF written.isDone THEN Assign(written.heap, ref, Tail(sources)) ELSE written

\\* Whether a prototype chain reaches an object.
RECURSIVE ChainHas(_, _, _)
ChainHas(heap, prototype, ref) ==
  /\\ prototype # Null
  /\\ \\/ SameValue(prototype, ref)
     \\/ ChainHas(heap, Lookup(heap, prototype).prototype, ref)

\\* Object.setPrototypeOf, which fails where the object isn't extensible or the chain would loop.
\\* Object.prototype keeps the prototype it has, and a primitive stays as it is.
SetPrototypeOf(heap, ref, prototype) ==
  LET object == Lookup(heap, ref)
      result(isDone, isChanged) ==
        [heap |-> IF isChanged THEN Update(heap, ref, [object EXCEPT !.prototype = prototype]) ELSE heap,
         isDone |-> isDone, isRangeError |-> FALSE]
  IN CASE ref \\in {Undefined, Null} \\/ ~(prototype = Null \\/ IsObjectArgument(prototype)) ->
            result(FALSE, FALSE)
       [] ~IsObjectArgument(ref) \\/ SameValue(prototype, object.prototype) -> result(TRUE, FALSE)
       [] SameValue(ref, ObjectPrototype) \\/ ~object.extensible -> result(FALSE, FALSE)
       [] ChainHas(heap, prototype, ref) -> result(FALSE, FALSE)
       [] OTHER -> result(TRUE, TRUE)

\\* The heap after the __proto__ setter of Object.prototype sets a receiver's prototype, which it
\\* leaves where the value isn't an object or null or the receiver isn't an object, and the error
\\* that it throws where the receiver refuses, or "".
ProtoSet(heap, ref, prototype) ==
  IF ~(prototype = Null \\/ IsObjectArgument(prototype)) \\/ ~IsObjectArgument(ref)
  THEN [heap |-> heap, error |-> ""]
  ELSE LET set == SetPrototypeOf(heap, ref, prototype)
       IN [heap |-> set.heap, error |-> IF set.isDone THEN "" ELSE "TypeError"]

LOCAL Restrict(heap, ref, isFrozen) ==
  LET object == Lookup(heap, ref)
      attributes ==
        [key \\in DOMAIN object.attributes |->
          [object.attributes[key] EXCEPT !.configurable = FALSE,
                                         !.writable = IF isFrozen THEN FALSE ELSE @]]
  IN Update(heap, ref, [object EXCEPT !.extensible = FALSE, !.attributes = attributes])

PreventExtensions(heap, ref) == Update(heap, ref, [Lookup(heap, ref) EXCEPT !.extensible = FALSE])

Seal(heap, ref) == Restrict(heap, ref, FALSE)

Freeze(heap, ref) == Restrict(heap, ref, TRUE)

\\* Nothing makes the global object inextensible, since tla-ts stops where a script would.
IsExtensible(heap, ref) ==
  IF IsRef(ref) /\\ ~IsHeap(ref) /\\ ref = GlobalObject THEN TRUE ELSE Lookup(heap, ref).extensible

IsSealed(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN ~IsExtensible(heap, ref) /\\ \\A key \\in DOMAIN object.attributes : ~object.attributes[key].configurable

IsFrozen(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN /\\ IsSealed(heap, ref)
     /\\ \\A key \\in DOMAIN object.attributes :
          object.attributes[key].kind # "data" \\/ ~object.attributes[key].writable


\\* FromPropertyDescriptor, the object of a descriptor's fields.
DescriptorObject(descriptor) ==
  PutAll(EmptyObject, [field \\in descriptor.fields |-> descriptor[field]],
         SelectSeq(<<"value", "writable", "get", "set", "enumerable", "configurable">>,
                   LAMBDA field : field \\in descriptor.fields))

\\* CompletePropertyDescriptor, which gives a descriptor without get or set the fields of data.
LOCAL CompleteDescriptor(descriptor) ==
  [descriptor EXCEPT
     !.fields = @ \\cup {"enumerable", "configurable"}
                  \\cup IF descriptor.isAccessor THEN {"get", "set"} ELSE {"value", "writable"},
     !.isData = ~descriptor.isAccessor]

\\* The object of the completed descriptor that a proxy's getOwnPropertyDescriptor trap gives.
ProxyDescriptor(heap, result) == DescriptorObject(CompleteDescriptor(ToDescriptor(heap, result)))

\\* Whether what a proxy's getOwnPropertyDescriptor trap gives agrees with the target's property:
\\* undefined where the target can lack it, or else a valid descriptor that the target could hold,
\\* unconfigurable or read-only only where the target's property is.
ProxyDescriptorAgrees(heap, target, key, result) ==
  LET object == Lookup(heap, target)
      read == ToDescriptor(heap, result)
      described == CompleteDescriptor(read)
      current == object.attributes[key]
  IN CASE result = Undefined -> ProxyCanLack(heap, target, key)
       [] ~IsObjectIn(heap, result) -> FALSE
       [] OTHER ->
            /\\ read.isValid
            /\\ CanApply(object, key, described)
            /\\ \\/ described.configurable
               \\/ /\\ key \\in DOMAIN object.values
                  /\\ ~current.configurable
                  /\\ described.isAccessor \\/ described.writable \\/ ~current.writable

\\* Whether a definition that a proxy's defineProperty trap says it made agrees with the target's
\\* property, which it must be able to hold, unconfigurable or read-only only where the target's is.
ProxyDefinitionAgrees(heap, target, key, descriptor) ==
  LET object == Lookup(heap, target)
      current == object.attributes[key]
      isUnconfigurable == "configurable" \\in descriptor.fields /\\ ~descriptor.configurable
  IN IF key \\notin DOMAIN object.values
     THEN object.extensible /\\ ~isUnconfigurable
     ELSE /\\ CanApply(object, key, descriptor)
          /\\ isUnconfigurable => ~current.configurable
          /\\ (/\\ current.kind # "accessor"
              /\\ ~current.configurable
              /\\ current.writable
              /\\ "writable" \\in descriptor.fields) => descriptor.writable

\\* The descriptor that Object.seal defines on each key, and that Object.freeze defines on each
\\* where it also makes data read-only.
IntegrityDescriptor(heap, isData) ==
  FieldsDescriptor(heap, IF isData THEN {"configurable", "writable"} ELSE {"configurable"},
                   [field \\in {"configurable", "writable"} |-> FALSE])

\\* The completed descriptor that a proxy's getOwnPropertyDescriptor trap gives, or Undefined.
TrappedDescriptor(heap, result) ==
  IF result = Undefined THEN Undefined ELSE CompleteDescriptor(ToDescriptor(heap, result))

\\* The completed descriptor of an object's own property, or Undefined where it has none.
OwnDescriptor(heap, ref, key) ==
  IF HasOwn(heap, ref, key)
  THEN LET object == Lookup(heap, ref)
           attributes == object.attributes[key]
           fields == IF attributes.kind = "accessor"
                     THEN {"get", "set", "enumerable", "configurable"}
                     ELSE {"value", "writable", "enumerable", "configurable"}
       IN FieldsDescriptor(heap, fields,
                           [field \\in fields |->
                              CASE field = "value" -> object.values[key]
                                [] field \\in {"get", "set"} -> object.values[key][field]
                                [] OTHER -> attributes[field]])
  ELSE Undefined

\\* The object of keys and values that a spread or a rest element copies from a proxy.
RECURSIVE PutPairs(_, _)
PutPairs(object, pairs) ==
  IF pairs = <<>> THEN object ELSE PutPairs(Put(object, Head(pairs)[1], Head(pairs)[2]), Tail(pairs))

PairsObject(pairs) == PutPairs(EmptyObject, pairs)

\\* Object.getOwnPropertyDescriptors of a proxy, which makes the object of each descriptor that it
\\* gathered, and then the object that holds them under their keys, last, so that Allocated names it.
ProxyDescriptors(heap, described) ==
  LET keys == [position \\in DOMAIN described |-> described[position][1]]
      first == Len(heap.objects)
      allocated == [heap EXCEPT !.objects =
                      @ \\o [position \\in DOMAIN described |->
                               DescriptorObject(described[position][2])]]
      refs == [key \\in {keys[position] : position \\in DOMAIN keys} |->
                Ref :> (first + CHOOSE position \\in DOMAIN keys : keys[position] = key)]
  IN Allocate(allocated, PutAll(EmptyObject, refs, keys))

\\* The prototype of a proxy's target, where an array outside the heap has Array.prototype, which it
\\* holds there since nothing can change it.
TargetPrototype(heap, ref) ==
  IF IsSequenceValue(ref) THEN Ref :> "Array.prototype" ELSE Prototype(heap, ref)

\\* Whether a prototype that a proxy's getPrototypeOf trap gives, or that its setPrototypeOf trap
\\* says it set, agrees with the target's, which a target that can't grow fixes.
ProxyPrototypeAgrees(heap, target, prototype) ==
  IsExtensible(heap, target) \\/ SameValue(prototype, Prototype(heap, target))

\\* The keys that a proxy's ownKeys trap gives, as CreateListFromArrayLike reads them.
ProxyKeys(heap, result) == IF IsRef(result) THEN ArrayLike(heap, result) ELSE result

\\* Whether the keys that a proxy's ownKeys trap gives are strings and symbols, each once, that hold
\\* each key the target can't lose, and only the target's keys where it can't grow.
ProxyKeysAgree(heap, target, keys) ==
  LET object == Lookup(heap, target)
      isListed(key) == \\E position \\in DOMAIN keys : keys[position] = key
  IN /\\ \\A position \\in DOMAIN keys : TypeOf(keys[position]) \\in {"string", "symbol"}
     /\\ \\A left, right \\in DOMAIN keys : left # right => keys[left] # keys[right]
     /\\ \\A key \\in DOMAIN object.values : ~object.attributes[key].configurable => isListed(key)
     /\\ \\/ object.extensible
        \\/ /\\ \\A key \\in DOMAIN object.values : isListed(key)
           /\\ \\A position \\in DOMAIN keys : keys[position] \\in DOMAIN object.values

\\* What Object.keys, values, entries, getOwnPropertyNames, or getOwnPropertySymbols, or
\\* Reflect.ownKeys, gives of a proxy's keys, where the first three ask the object that the proxy
\\* reads descriptors and values through which of them are enumerable.
ProxyKeysOf(heap, target, keys, method) ==
  LET enumerable == SelectSeq(keys, LAMBDA key : ~IsSymbol(key) /\\ IsEnumerableOwn(heap, target, key))
  IN CASE method = "keys" -> enumerable
       [] method = "values" -> Read([position \\in DOMAIN enumerable |-> Get(heap, target, enumerable[position])])
       [] method = "entries" ->
            Read([position \\in DOMAIN enumerable |->
                    <<enumerable[position], Get(heap, target, enumerable[position])>>])
       [] method = "getOwnPropertyNames" -> SelectSeq(keys, LAMBDA key : ~IsSymbol(key))
       [] method = "getOwnPropertySymbols" -> SelectSeq(keys, IsSymbol)
       [] OTHER -> keys

\\* Whether a code unit is a surrogate that JSON.stringify escapes, where escapes maps each code unit
\\* that it escapes to its escape.
LOCAL JSONSurrogate(escapes, unit) ==
  IF unit \\in DOMAIN escapes /\\ Len(escapes[unit]) = 6 /\\ SubSeq(escapes[unit], 1, 3) = "\\\\ud"
  THEN IF SubSeq(escapes[unit], 4, 4) \\in {"8", "9", "a", "b"} THEN "high" ELSE "low"
  ELSE ""

\\* QuoteJSONString, which escapes a code unit unless it's a surrogate that pairs with a neighbor.
LOCAL QuoteJSON(text, escapes) ==
  LET unit(position) == SubSeq(text, position, position)
      kind(position) ==
        IF position \\in 1..Len(text) THEN JSONSurrogate(escapes, unit(position)) ELSE ""
      isPaired(position) ==
        \\/ kind(position) = "high" /\\ kind(position + 1) = "low"
        \\/ kind(position) = "low" /\\ kind(position - 1) = "high"
  IN "\\"" \\o Join([position \\in 1..Len(text) |->
                     IF unit(position) \\in DOMAIN escapes /\\ ~isPaired(position)
                     THEN escapes[unit(position)]
                     ELSE unit(position)], "") \\o "\\""

\\* Which of Boolean, Number, and String an object wraps the primitive of, or "" where it wraps none.
LOCAL JSONWrapperKind(heap, ref) ==
  CASE ~IsHeap(ref) /\\ ref[Ref] \\in {"Boolean.prototype", "Number.prototype", "String.prototype"} ->
         SubSeq(ref[Ref], 1, Len(ref[Ref]) - 10)
    [] IsHeap(ref) /\\ "primitive" \\in DOMAIN Lookup(heap, ref) ->
         CASE TypeOf(Lookup(heap, ref).primitive) = "boolean" -> "Boolean"
           [] TypeOf(Lookup(heap, ref).primitive) = "number" -> "Number"
           [] OTHER -> "String"
    [] OTHER -> ""

\\* The primitive that a wrapper object converts to, through the method that ToPrimitive calls first.
LOCAL JSONPrimitive(heap, ref, kind, method) ==
  CASE kind = "Boolean" -> IF IsHeap(ref) THEN Lookup(heap, ref).primitive ELSE FALSE
    [] Get(heap, ref, WellKnownSymbol("toPrimitive")) # Undefined ->
         Assert(FALSE, "tla-ts can't convert " \\o ToString(ref) \\o " to a primitive")
    [] OTHER -> WrappedPrimitive(heap, ref, kind, method)

\\* ToString of a String object, where it reads the built-in toString, or of a string that a
\\* String type holds.
WrapperString(heap, ref) ==
  IF TypeOf(ref) = "string" THEN ref ELSE JSONPrimitive(heap, ref, "String", "toString")

\\* The gap that JSON.stringify indents by for its space argument.
LOCAL JSONGap(heap, space) ==
  LET kind == IF IsRef(space) THEN JSONWrapperKind(heap, space) ELSE ""
      value == CASE kind = "Number" -> JSONPrimitive(heap, space, kind, "valueOf")
                 [] kind = "String" -> JSONPrimitive(heap, space, kind, "toString")
                 [] OTHER -> space
      count == CASE value \\in {NaN, NegativeInfinity, NegativeZero} -> 0
                 [] IsFraction(value) -> IF Truncate(value) > 10 THEN 10 ELSE Truncate(value)
                 [] value = Infinity -> 10
                 [] value > 10 -> 10
                 [] OTHER -> value
  IN CASE TypeOf(value) = "number" ->
            IF count < 1 THEN "" ELSE Join([position \\in 1..count |-> " "], "")
       [] TypeOf(value) = "string" -> IF Len(value) > 10 THEN SubSeq(value, 1, 10) ELSE value
       [] OTHER -> ""

\\* The keys that a replacer array lists, in order and without repeats.
LOCAL JSONKeys(heap, replacer) ==
  LET list == IF IsProxy(heap, replacer) THEN ForwardTarget(heap, replacer, {"get"}) ELSE replacer
      elements == IF IsRef(list)
                  THEN [position \\in 1..ToLength(Get(heap, list, "length")) |->
                          Get(heap, list, ToString(position - 1))]
                  ELSE list
      item(element) ==
        LET kind == IF IsRef(element) THEN JSONWrapperKind(heap, element) ELSE ""
        IN CASE TypeOf(element) = "string" -> element
             [] TypeOf(element) = "number" -> StringOf(element)
             [] kind \\in {"Number", "String"} ->
                  StringOf(JSONPrimitive(heap, element, kind, "toString"))
             [] OTHER -> Undefined
      items == [position \\in DOMAIN elements |-> item(elements[position])]
      kept == SelectSeq([position \\in DOMAIN items |-> position],
                        LAMBDA position :
                          /\\ items[position] # Undefined
                          /\\ \\A earlier \\in 1..(position - 1) : items[earlier] # items[position])
  IN [position \\in DOMAIN kept |-> items[kept[position]]]

\\* SerializeJSONProperty, which gives Undefined where JSON.stringify leaves a value out. A value
\\* that isn't on the heap and prints as a sequence is an array where state.isSequence holds, as
\\* where the script makes no Map.
RECURSIVE SerializeJSON(_, _, _, _, _)
SerializeJSON(heap, value, state, stack, indent) ==
  LET inner == indent \\o state.gap
      wrap(open, close, parts) ==
        CASE parts = <<>> -> open \\o close
          [] state.gap = "" -> open \\o Join(parts, ",") \\o close
          [] OTHER -> open \\o "\\n" \\o inner \\o Join(parts, ",\\n" \\o inner) \\o "\\n" \\o indent \\o close
      array(elements, seen) ==
        wrap("[", "]", [position \\in DOMAIN elements |->
                          LET text == SerializeJSON(heap, elements[position], state, seen, inner)
                          IN IF text = Undefined THEN "null" ELSE text])
      object(keys) ==
        LET texts == [position \\in DOMAIN keys |->
                        SerializeJSON(heap, Get(heap, value, keys[position]), state,
                                      stack \\cup {value}, inner)]
            present == SelectSeq([position \\in DOMAIN keys |-> position],
                                 LAMBDA position : texts[position] # Undefined)
        IN wrap("{", "}", [position \\in DOMAIN present |->
                             QuoteJSON(keys[present[position]], state.escapes) \\o ":"
                               \\o (IF state.gap = "" THEN "" ELSE " ") \\o texts[present[position]]])
      hasToJSON(ref) == TypeOfIn(heap, Get(heap, ref, "toJSON")) = "function"
      kind == IF IsRef(value) THEN JSONWrapperKind(heap, value) ELSE ""
  IN CASE value = Null -> "null"
       [] value = Undefined -> Undefined
       [] TypeOf(value) = "boolean" -> IF value THEN "true" ELSE "false"
       [] TypeOf(value) = "string" -> QuoteJSON(value, state.escapes)
       [] TypeOf(value) = "number" -> IF IsFinite(value) THEN StringOf(value) ELSE "null"
       [] TypeOf(value) = "symbol" -> Undefined
       [] IsProxy(heap, value) ->
            SerializeJSON(heap, ForwardTarget(heap, value, {"get", "ownKeys", "getOwnPropertyDescriptor"}),
                          state, stack, indent)
       [] IsRef(value) /\\ hasToJSON(value) -> Assert(FALSE, "tla-ts can't call toJSON")
       [] kind = "Number" ->
            SerializeJSON(heap, JSONPrimitive(heap, value, kind, "valueOf"), state, stack, indent)
       [] kind # "" ->
            SerializeJSON(heap, JSONPrimitive(heap, value, kind, "toString"), state, stack, indent)
       [] IsRef(value) /\\ TypeOfIn(heap, value) = "function" -> Undefined
       [] IsRef(value) /\\ value \\in stack ->
            Assert(FALSE, "tla-ts can't throw the TypeError of JSON.stringify of a cycle")
       [] IsArray(heap, value) ->
            array([position \\in 1..ToLength(Get(heap, value, "length")) |->
                     Get(heap, value, ToString(position - 1))], stack \\cup {value})
       [] IsRef(value) -> object(IF state.keys = Undefined THEN ObjectKeys(heap, value) ELSE state.keys)
       [] TypeOf(value) = "function" /\\ hasToJSON(state.functionPrototype) ->
            Assert(FALSE, "tla-ts can't call toJSON")
       [] TypeOf(value) = "function" -> Undefined
       [] state.isSequence /\\ SubSeq(ToString(value), 1, 2) = "<<" ->
            IF hasToJSON(state.arrayPrototype)
            THEN Assert(FALSE, "tla-ts can't call toJSON")
            ELSE array(value, stack)
       [] OTHER -> Assert(FALSE, "tla-ts can't tell what JSON.stringify writes for " \\o ToString(value))

\\* JSON.stringify, which can't call a replacer function, where escapes maps each code unit that
\\* QuoteJSONString escapes to its escape.
JSONStringify(heap, value, replacer, space, escapes, arrayPrototype, functionPrototype, isSequence) ==
  LET isList == IsArray(heap, replacer)
                  \\/ (isSequence /\\ ~IsRef(replacer) /\\ SubSeq(ToString(replacer), 1, 2) = "<<")
      keys == IF isList THEN JSONKeys(heap, replacer) ELSE Undefined
      gap == JSONGap(heap, space)
      state == [keys |-> keys, gap |-> gap, escapes |-> escapes, isSequence |-> isSequence,
                arrayPrototype |-> arrayPrototype, functionPrototype |-> functionPrototype]
  IN CASE TypeOfIn(heap, replacer) = "function" -> Assert(FALSE, "tla-ts can't call a replacer")
       [] /\\ ~IsRef(replacer)
          /\\ TypeOf(replacer) = "object"
          /\\ replacer # Null
          /\\ ~isList ->
            Assert(FALSE, "tla-ts can't tell whether " \\o ToString(replacer) \\o " is an array")
       [] keys = keys /\\ gap = gap -> SerializeJSON(heap, value, state, {}, "")

===============================================================================`;

// The model values that stand for the numbers that TLA+ integers can't hold.
export const SPECIAL_NUMBERS = ["NaN", "Infinity", "NegativeInfinity", "NegativeZero"];

// The operators that the JavaScript module exports, which a spec that extends it can't redefine.
export const JAVASCRIPT_OPERATORS: ReadonlySet<string> = new Set([
  ...[...JAVASCRIPT_MODULE.matchAll(/^([A-Z]\w*)(?:\(| ==)/gm)].map((match) => match[1]),
  ...SPECIAL_NUMBERS,
]);

export const useJavaScript = (operator: string, args: Expression[], context: Context) => {
  context.prelude.add("JavaScript");
  return apply(operator, args);
};

export const getTypeNames = (type: ts.Type, checker: ts.TypeChecker): string[] | undefined => {
  if (type.isUnion()) {
    const names = type.types.map((member) => getTypeNames(member, checker));
    return names.every((name) => name !== undefined) ? [...new Set(names.flat())] : undefined;
  }
  const flags = type.flags;
  if (flags & ts.TypeFlags.Never) return [];
  if (flags & ts.TypeFlags.NumberLike) return ["number"];
  if (flags & ts.TypeFlags.StringLike) return ["string"];
  if (flags & ts.TypeFlags.BooleanLike) return ["boolean"];
  if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return ["undefined"];
  if (flags & ts.TypeFlags.Null) return ["null"];
  if (flags & ts.TypeFlags.ESSymbolLike) return ["symbol"];
  if (!(flags & ts.TypeFlags.Object)) return undefined;
  // A structural type such as {} or { length: number } also holds the primitives that fit it.
  const isPrimitive = [
    checker.getStringType(),
    checker.getNumberType(),
    checker.getBooleanType(),
  ].some((primitive) => checker.isTypeAssignableTo(primitive, type));
  if (isPrimitive) return undefined;
  const isFunction =
    type.getCallSignatures().length > 0 ||
    type.getConstructSignatures().length > 0 ||
    type.getSymbol()?.name === "Function";
  return [isFunction ? "function" : "object"];
};

export const translateTypeOf = (node: ts.TypeOfExpression, scope: Scope, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node.expression), context.checker);
  const known = names && [...new Set(names.map((name) => (name === "null" ? "object" : name)))];
  // Object.defineProperty can give a property a value of another type than TypeScript's.
  const read = ts.isParenthesizedExpression(node.expression)
    ? node.expression.expression
    : node.expression;
  // An element of an array or a string may also lie past the end.
  const kind =
    ts.isPropertyAccessExpression(read) || ts.isElementAccessExpression(read)
      ? getKind(read.expression, context)
      : undefined;
  const isProperty =
    kind === "object" ||
    (ts.isElementAccessExpression(read) && (kind === "sequence" || kind === "string"));
  if (known?.length === 1 && !isProperty) return string(known[0]);
  if (context.modelValues.size > 0) {
    throw new TlaTypeScriptError("typeof can't tell a @symmetric value from a function", node);
  }
  const value = translateExpression(node.expression, scope, context);
  const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
  return heap === undefined
    ? useJavaScript("TypeOf", [value], context)
    : useJavaScript("TypeOfIn", [heap, value], context);
};

// A number as a string, where a value that TypeScript types as a number may still be undefined,
// such as an element past an array's end, which TLC would print as Undefined.
export const translateNumberString = (value: Expression, context: Context) =>
  context.hasSpecialNumbers
    ? useJavaScript("StringOf", [value], context)
    : ifExpression(
        apply("=", [value, getUndefined(context)]),
        string("undefined"),
        apply("ToString", [value]),
      );

export const isComparableType = (left: ts.Type, right: ts.Type, checker: ts.TypeChecker) => {
  const names = [left, right].map((type) => getTypeNames(type, checker));
  if (names.some((name) => name === undefined)) return false;
  const kinds = new Set(
    names.flatMap((name) => name ?? []).filter((name) => name !== "null" && name !== "undefined"),
  );
  return kinds.size <= 1;
};

// Whether a value may be a number, which may be NaN or -0 in a script that names them.
export const mayBeNumber = (node: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  return names === undefined || names.includes("number");
};

export const isComparable = (left: ts.Expression, right: ts.Expression, context: Context) =>
  isComparableType(
    context.checker.getTypeAtLocation(left),
    context.checker.getTypeAtLocation(right),
    context.checker,
  );

const CONVERSIONS = new Set([
  "BigInt",
  "Boolean",
  "String",
  "Number",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
]);

const PARSERS = new Map<string, (text: string) => number>([
  ["parseInt", (text) => Number.parseInt(text)],
  ["parseFloat", Number.parseFloat],
]);

// BigInt of a string, which reads an integer in decimal, or in binary, octal, or hexadecimal after
// a prefix, between white space, and throws a SyntaxError otherwise.
const translateBigIntText = (text: string, node: ts.Node, context: Context) => {
  const isInteger = /^\s*(?:[+-]?\d+|0[bB][01]+|0[oO][0-7]+|0[xX][\da-fA-F]+)?\s*$/.test(text);
  if (!isInteger) {
    return apply("Assert", [
      boolean(false),
      string("tla-ts can't throw the SyntaxError of converting this string to a BigInt"),
    ]);
  }
  const value = BigInt(text);
  if (value > 2n ** 31n - 1n || value < -(2n ** 31n - 1n)) {
    throw new TlaTypeScriptError(`TLC's integers have 32 bits, so ${text} is too big`, node);
  }
  return translateBigInt(Number(value), context);
};

const getConverted = (value: number, node: ts.Node, context: Context) => {
  const converted = getNumberValue(value, context);
  if (converted === undefined) {
    throw new TlaTypeScriptError(`Only integers are supported: ${node.getText()}`, node);
  }
  return converted;
};

// The number that +argument or Number(argument) converts a value to.
export const translateToNumber = (
  argument: ts.Expression,
  node: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  if (ts.isStringLiteral(argument)) return getConverted(Number(argument.text), node, context);
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  const kind = names?.length === 1 ? names[0] : undefined;
  if (kind === "null") return number(0);
  const value = translateExpression(argument, scope, context);
  if (kind === "number") return value;
  if (kind === "boolean") return ifExpression(value, number(1), number(0));
  // ToNumber stops at an object, whose valueOf and toString an expression can't call.
  if (
    kind === "string" ||
    (context.heap !== undefined &&
      (context.checker.getTypeAtLocation(argument).flags & ts.TypeFlags.Unknown) !== 0)
  ) {
    const converted = useJavaScript("ToNumber", [value], context);
    return context.hasSpecialNumbers
      ? converted
      : useJavaScript("PlainNumber", [converted], context);
  }
  throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
};

// parseInt(string, radix), or Number.parseInt, of a string and a radix that may be undefined, or
// undefined for any other.
export const translateParseInt = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const [text, radix] = node.arguments;
  const isRadixTyped =
    radix === undefined ||
    (getTypeNames(context.checker.getTypeAtLocation(radix), context.checker) ?? []).every(
      (radixName) => radixName === "number" || radixName === "undefined",
    );
  if (
    text === undefined ||
    node.arguments.length > 2 ||
    getKind(text, context) !== "string" ||
    !isRadixTyped
  ) {
    return undefined;
  }
  const parsed = useJavaScript(
    "ParseInt",
    [
      translateExpression(text, scope, context),
      radix === undefined ? getUndefined(context) : translateExpression(radix, scope, context),
    ],
    context,
  );
  return context.hasSpecialNumbers ? parsed : useJavaScript("PlainNumber", [parsed], context);
};

// A call to Boolean, String, Number, parseInt, parseFloat, isNaN, or isFinite, or undefined for any
// other call.
const URI_ALPHANUMERICS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// The characters that each URI function keeps: those that encodeURI and encodeURIComponent don't
// escape, and those whose escapes decodeURI and decodeURIComponent don't decode.
const URI_FUNCTIONS = new Map([
  ["encodeURI", `${URI_ALPHANUMERICS}-_.!~*'();/?:@&=+$,#`],
  ["encodeURIComponent", `${URI_ALPHANUMERICS}-_.!~*'()`],
  ["decodeURI", ";/?:@&=+$,#"],
  ["decodeURIComponent", ""],
]);

// A call of a URI function on a string.
export const getURICall = (node: ts.Node, context: Context) => {
  if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return undefined;
  const kept = URI_FUNCTIONS.get(node.expression.text);
  const declarations = getSymbol(node.expression, context.checker)?.declarations ?? [];
  const text = node.arguments.at(0);
  return kept !== undefined &&
    declarations.length > 0 &&
    declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile) &&
    node.arguments.length === 1 &&
    text !== undefined &&
    getKind(text, context) === "string"
    ? {
        isDecode: node.expression.text.startsWith("decode"),
        text,
        kept: set([...kept].map(string)),
      }
    : undefined;
};

export const translateConversion = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const callee = node.expression;
  const declarations = getSymbol(callee, context.checker)?.declarations ?? [];
  if (
    !ts.isIdentifier(callee) ||
    !CONVERSIONS.has(callee.text) ||
    declarations.length === 0 ||
    !declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile)
  ) {
    return undefined;
  }
  const name = callee.text;
  const unsupported = new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  const argument = node.arguments.at(0);
  if (argument === undefined) {
    if (name === "Boolean") return boolean(false);
    if (name === "String") return string("");
    if (name === "Number") return number(0);
    throw unsupported;
  }
  if (name === "parseInt" && !(ts.isStringLiteral(argument) && node.arguments.length === 1)) {
    const parsed = translateParseInt(node, scope, context);
    if (parsed !== undefined) return parsed;
  }
  if (node.arguments.length > 1) throw unsupported;
  if (
    name === "BigInt" &&
    (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))
  ) {
    return translateBigIntText(argument.text, node, context);
  }
  if (name === "BigInt" && getKind(argument, context) === "string") throw unsupported;
  if (name === "BigInt") {
    return useJavaScript("ToBigInt", [translateExpression(argument, scope, context)], context);
  }
  if (isBigIntLike(argument, context) && (name === "Number" || name === "Boolean")) {
    const value = translateExpression(argument, scope, context);
    return name === "Number"
      ? useJavaScript("NumberOfBigInt", [value], context)
      : useJavaScript("ToBoolean", [value], context);
  }
  if (name === "Number") return translateToNumber(argument, node, scope, context);
  if (name === "isNaN") {
    context.prelude.add("JavaScript");
    return apply("=", [translateToNumber(argument, node, scope, context), identifier("NaN")]);
  }
  if (name === "isFinite") {
    return useJavaScript("IsFinite", [translateToNumber(argument, node, scope, context)], context);
  }
  const parse = PARSERS.get(name);
  if (parse !== undefined && ts.isStringLiteral(argument)) {
    return getConverted(parse(argument.text), node, context);
  }
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  const kind = names?.length === 1 ? names[0] : undefined;
  const value = translateExpression(argument, scope, context);
  const isEmpty = kind === "undefined" || kind === "null";
  if (name === "Boolean") {
    if (kind === "boolean") return value;
    if (kind === "number") {
      return context.hasSpecialNumbers
        ? useJavaScript("ToBoolean", [value], context)
        : apply("#", [value, number(0)]);
    }
    if (kind === "string") return apply("#", [value, string("")]);
    if (isEmpty || kind === "object" || kind === "function" || kind === "symbol") {
      return boolean(!isEmpty);
    }
  }
  if (name === "String") {
    if (kind === "string") return value;
    if (kind === "number") return translateNumberString(value, context);
    if (kind === "boolean") return ifExpression(value, string("true"), string("false"));
    if (isEmpty) return string(kind);
    const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
    if (kind === "symbol" && heap !== undefined) {
      return useJavaScript("SymbolString", [heap, value], context);
    }
    // A property key, which may be a symbol.
    if (
      heap !== undefined &&
      names !== undefined &&
      names.includes("symbol") &&
      names.every((inner) => ["string", "number", "symbol"].includes(inner))
    ) {
      return share(value, "key", context, (shared) =>
        ifExpression(
          useJavaScript("IsSymbol", [shared], context),
          useJavaScript("SymbolString", [heap, shared], context),
          useJavaScript("StringOf", [shared], context),
        ),
      );
    }
    if (names === undefined) return useJavaScript("StringOf", [value], context);
  }
  throw unsupported;
};
