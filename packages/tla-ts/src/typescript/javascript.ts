import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol, getUndefined, isAssignedElsewhere, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import { formatString } from "../printer";
import {
  PRIMITIVE_NAMES,
  getNumberValue,
  translateBigInt,
  translateExpression,
  translateToString,
} from "./expressions";
import { rejectBeforeDeclaration, type Scope } from "./scope";
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

CONSTANTS Undefined, Null, Ref, Big, Wide, Double, BuiltIns, ConstantFunctions, Symbols, Fractions,
          Doubles,
          Characters, Cases, Normals, NaN, Infinity, NegativeInfinity, NegativeZero

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

SymbolDescription(heap, symbol) ==
  LET position == SymbolPosition(symbol)
  IN IF position <= Len(WellKnownSymbols)
     THEN "Symbol." \\o WellKnownSymbols[position]
     ELSE heap.symbols[position - Len(WellKnownSymbols)]

\\* A BigInt, which tla-ts holds as its integer under the model value Big.
IsBigInt(value) ==
  LET text == ToString(value)
  IN Len(text) >= 7 /\\ SubSeq(text, 1, 7) = "(Big :>"

\\* An integer beyond TLC's 32 bits, which tla-ts holds as two halves under the model value Wide.
IsWide(value) ==
  LET text == ToString(value)
  IN Len(text) >= 8 /\\ SubSeq(text, 1, 8) = "(Wide :>"

\\* A number that is neither an integer up to 2^53 either way nor a fraction that a literal gives,
\\* which tla-ts holds exactly under the model value Double, as its sign, the power of 2 of its odd
\\* significand's last bit, and that significand's two halves.
IsDouble(value) ==
  LET text == ToString(value)
  IN Len(text) >= 10 /\\ SubSeq(text, 1, 10) = "(Double :>"

\\* Whether a number may hold no TLC integer, so that no comparison with an integer may read it.
LOCAL IsBig(value) == IsWide(value) \\/ IsDouble(value)

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
       [] IsWide(value) \\/ IsDouble(value) -> "number"
       [] first \\in {"[", "<", "{", "("} \\cup Digits -> "object"
       [] IsSymbol(value) -> "symbol"
       [] IsFraction(value) -> "number"
       [] OTHER -> "function"

\\* TLC can't tell whether a value that isn't an integer is in Int, so this asks TypeOf.
IsNumber(value) == TypeOf(value) = "number"

LOCAL IsInteger(value) ==
  IsNumber(value) /\\ value \\notin SpecialNumbers /\\ ~IsFraction(value) /\\ ~IsBig(value)

\\* Whether a value is an integer from 0 to a maximum.
IsIntegerWithin(value, maximum) == IsInteger(value) /\\ value \\in 0..maximum

\\* Whether a value is a number other than NaN and the infinities.
IsFinite(value) == IsInteger(value) \\/ value = NegativeZero \\/ IsFraction(value) \\/ IsBig(value)

\\* Number.isSafeInteger, where a Wide integer is past 2^53 - 1 only at 2^53 either way.
IsSafeInteger(value) ==
  /\\ IsFinite(value)
  /\\ ~IsFraction(value)
  /\\ ~IsDouble(value)
  /\\ ~(IsWide(value) /\\ value[Wide][1] \\in {-4194304, 4194304} /\\ value[Wide][2] = 0)

LOCAL IsZero(value) == value = NegativeZero \\/ (~IsBig(value) /\\ value = 0)

LOCAL IsNegative(value) ==
  \\/ value = NegativeZero
  \\/ value = NegativeInfinity
  \\/ IsFraction(value) /\\ Floor(value) < 0
  \\/ IsWide(value) /\\ value[Wide][1] < 0
  \\/ IsDouble(value) /\\ value[Double][1]
  \\/ IsInteger(value) /\\ value < 0

LOCAL Magnitude(value) == IF value = NegativeZero THEN 0 ELSE value

LOCAL Absolute(value) == IF value < 0 THEN -value ELSE value

LOCAL MaxInteger == 2147483647

\\* A Wide integer is high * 2^31 + low, with low from 0 to 2^31 - 1, so that each half fits TLC's
\\* integers. tla-ts holds an integer as Wide only outside them, and only up to 2^53 either way,
\\* where every integer is a number.
LOCAL Halves(value) ==
  CASE IsWide(value) -> value[Wide]
    [] value >= 0 -> <<0, value>>
    [] OTHER -> <<-1, value + MaxInteger + 1>>

LOCAL WideOf(halves) ==
  CASE halves[1] = 0 -> halves[2]
    [] halves[1] = -1 -> halves[2] - MaxInteger - 1
    [] \\/ halves[1] > 4194304
       \\/ halves[1] = 4194304 /\\ halves[2] > 0
       \\/ halves[1] < -4194304 ->
         Assert(FALSE, "tla-ts can't hold an integer beyond 2^53")
    [] OTHER -> Wide :> halves

LOCAL WideNegate(value) ==
  LET halves == Halves(value)
  IN WideOf(IF halves[2] = 0
            THEN <<-halves[1], 0>>
            ELSE <<-halves[1] - 1, MaxInteger - halves[2] + 1>>)

LOCAL WideAdd(left, right) ==
  LET augend == Halves(left)
      addend == Halves(right)
      isCarried == augend[2] > MaxInteger - addend[2]
  IN WideOf(<<augend[1] + addend[1] + (IF isCarried THEN 1 ELSE 0),
              IF isCarried THEN augend[2] - (MaxInteger - addend[2]) - 1 ELSE augend[2] + addend[2]>>)

\\* The halves of a sum of two integers from 0 that halves give, whose high half may pass 2^22.
LOCAL RawAdd(augend, addend) ==
  LET isCarried == augend[2] > MaxInteger - addend[2]
  IN <<augend[1] + addend[1] + (IF isCarried THEN 1 ELSE 0),
       IF isCarried THEN augend[2] - (MaxInteger - addend[2]) - 1 ELSE augend[2] + addend[2]>>

\\* The halves of an integer from 0 below 2^31 times 2^shift, for a shift from 1 to 30.
LOCAL RawShifted(value, shift) ==
  <<value \\div 2^(31 - shift), (value % 2^(31 - shift)) * 2^shift>>

\\* The halves of the product of two integers from 0 below 2^31, from the products of their 16-bit
\\* halves.
LOCAL RawProduct(left, right) ==
  LET leftHigh == left \\div 65536
      leftLow == left % 65536
      rightHigh == right \\div 65536
      rightLow == right % 65536
  IN RawAdd(RawAdd(<<2 * leftHigh * rightHigh, 0>>, RawShifted(leftHigh * rightLow, 16)),
            RawAdd(RawAdd(RawShifted(leftLow * rightHigh, 16), RawShifted((leftLow \\div 256) * rightLow, 8)),
                   <<0, (leftLow % 256) * rightLow>>))

\\* Whether halves hold an integer up to 2^53.
LOCAL FitsWide(halves) == halves[1] < 4194304 \\/ (halves[1] = 4194304 /\\ halves[2] = 0)

\\* The decimal digits of high * 2^31 + low, from 0, each a division by 10 with 2^31 as
\\* 10 * 214748364 + 8.
RECURSIVE WideDigits(_, _)
WideDigits(high, low) ==
  IF high = 0
  THEN ToString(low)
  ELSE LET part == (high % 10) * 8 + (low % 10)
       IN WideDigits(high \\div 10, (high % 10) * 214748364 + low \\div 10 + part \\div 10)
            \\o ToString(part % 10)

LOCAL WideText(value) ==
  IF value[Wide][1] < 0
  THEN "-" \\o WideDigits(WideNegate(value)[Wide][1], WideNegate(value)[Wide][2])
  ELSE WideDigits(value[Wide][1], value[Wide][2])

LOCAL BeyondInteger == Assert(FALSE, "tla-ts can't use an integer beyond 32 bits here")

\\* An integer's magnitude, which is Wide for -2^31.
LOCAL Unsigned(value) == IF IsNegative(value) THEN WideNegate(value) ELSE value

\\* The bits that an integer from 0 below 2^31 takes.
RECURSIVE BitLength(_)
BitLength(value) == IF value = 0 THEN 0 ELSE 1 + BitLength(value \\div 2)

LOCAL HalvesBits(halves) == IF halves[1] = 0 THEN BitLength(halves[2]) ELSE 31 + BitLength(halves[1])

LOCAL Halved(halves) == <<halves[1] \\div 2, (halves[1] % 2) * 1073741824 + halves[2] \\div 2>>

LOCAL Doubled(halves) == <<halves[1] * 2 + halves[2] \\div 1073741824, (halves[2] % 1073741824) * 2>>

RECURSIVE ShiftedLeft(_, _)
ShiftedLeft(halves, count) == IF count = 0 THEN halves ELSE ShiftedLeft(Doubled(halves), count - 1)

\\* The halves of an integer other than 0 without its trailing zero bits, and how many it had.
RECURSIVE OddPart(_, _)
OddPart(halves, zeros) ==
  CASE halves = <<0, 0>> -> Assert(FALSE, "tla-ts can't take the binary form of 0")
    [] halves[2] % 2 = 1 -> <<halves, zeros>>
    [] OTHER -> OddPart(Halved(halves), zeros + 1)

\\* A finite number other than 0 as a Double holds it: its sign, the power of 2 of its odd
\\* significand's last bit, and the significand's halves.
LOCAL Binary(value) ==
  CASE IsDouble(value) -> value[Double]
    [] IsFraction(value) -> Fractions[FractionPosition(value)].binary
    [] OTHER -> LET odd == OddPart(Halves(Unsigned(value)), 0)
                IN <<IsNegative(value), odd[2], odd[1][1], odd[1][2]>>

\\* The number of a binary form: an integer up to 2^53 either way as an integer, a fraction that a
\\* literal gives as that fraction, and any other as a Double, so that each number has one form.
\\* Past the largest number it's an infinity, and tla-ts stops where it would round below the least.
LOCAL FromBinary(binary) ==
  LET significand == <<binary[3], binary[4]>>
      top == binary[2] + HalvesBits(significand) - 1
  IN CASE top > 1023 -> IF binary[1] THEN NegativeInfinity ELSE Infinity
       [] binary[2] < -1074 -> Assert(FALSE, "tla-ts can't round a number below 2^-1074")
       [] binary[2] >= 0 /\\ (top < 53 \\/ (significand = <<0, 1>> /\\ top = 53)) ->
            LET magnitude == WideOf(ShiftedLeft(significand, binary[2]))
            IN IF binary[1] THEN WideNegate(magnitude) ELSE magnitude
       [] \\E position \\in DOMAIN Fractions : Fractions[position].binary = binary ->
            Fractions[CHOOSE position \\in DOMAIN Fractions : Fractions[position].binary = binary].value
       [] OTHER -> Double :> binary

\\* The power of 2 that an integer other than 0 is, either way, or -1.
LOCAL TwoPower(value) ==
  IF (IsInteger(value) \\/ IsWide(value)) /\\ ~IsZero(value) /\\ <<Binary(value)[3], Binary(value)[4]>> = <<0, 1>>
  THEN Binary(value)[2]
  ELSE -1

\\* Whether one binary form's magnitude is below another's, by the power of 2 of their first bits,
\\* then by their significands with 53 bits each.
LOCAL MagnitudeBelow(left, right) ==
  LET leftBits == HalvesBits(<<left[3], left[4]>>)
      rightBits == HalvesBits(<<right[3], right[4]>>)
      leftTop == left[2] + leftBits - 1
      rightTop == right[2] + rightBits - 1
      leftSignificand == ShiftedLeft(<<left[3], left[4]>>, 53 - leftBits)
      rightSignificand == ShiftedLeft(<<right[3], right[4]>>, 53 - rightBits)
  IN \\/ leftTop < rightTop
     \\/ /\\ leftTop = rightTop
        /\\ \\/ leftSignificand[1] < rightSignificand[1]
           \\/ leftSignificand[1] = rightSignificand[1] /\\ leftSignificand[2] < rightSignificand[2]

\\* The order of numbers where one is a Double.
LOCAL BinaryLessThan(left, right) ==
  CASE left = NegativeInfinity -> right # NegativeInfinity
    [] right = Infinity -> left # Infinity
    [] left = Infinity \\/ right = NegativeInfinity -> FALSE
    [] IsZero(left) -> ~IsZero(right) /\\ ~IsNegative(right)
    [] IsZero(right) -> IsNegative(left)
    [] IsNegative(left) # IsNegative(right) -> IsNegative(left)
    [] IsNegative(left) -> MagnitudeBelow(Binary(right), Binary(left))
    [] OTHER -> MagnitudeBelow(Binary(left), Binary(right))


\\* Exact arithmetic on naturals as sequences of 14-bit limbs, the least first, without a last 0, so
\\* that a product of two limbs and a carry stays inside TLC's integers.
LOCAL Limb == 16384

RECURSIVE NatTrim(_)
NatTrim(nat) == IF nat # <<>> /\\ nat[Len(nat)] = 0 THEN NatTrim(SubSeq(nat, 1, Len(nat) - 1)) ELSE nat

LOCAL NatOf(value) == NatTrim(<<value % Limb, (value \\div Limb) % Limb, value \\div (Limb * Limb)>>)

LOCAL LimbAt(nat, position) == IF position <= Len(nat) THEN nat[position] ELSE 0

RECURSIVE NatSum(_, _, _, _)
NatSum(left, right, position, carry) ==
  IF position > Len(left) /\\ position > Len(right) /\\ carry = 0
  THEN <<>>
  ELSE LET total == LimbAt(left, position) + LimbAt(right, position) + carry
       IN <<total % Limb>> \\o NatSum(left, right, position + 1, total \\div Limb)

LOCAL NatAdd(left, right) == NatTrim(NatSum(left, right, 1, 0))

\\* The limbs of left - right from a position on, where left isn't below right.
RECURSIVE NatDifference(_, _, _, _)
NatDifference(left, right, position, borrow) ==
  IF position > Len(left)
  THEN <<>>
  ELSE LET total == LimbAt(left, position) - LimbAt(right, position) - borrow
       IN <<IF total < 0 THEN total + Limb ELSE total>>
            \\o NatDifference(left, right, position + 1, IF total < 0 THEN 1 ELSE 0)

LOCAL NatSubtract(left, right) == NatTrim(NatDifference(left, right, 1, 0))

RECURSIVE NatBelowFrom(_, _, _)
NatBelowFrom(left, right, position) ==
  /\\ position >= 1
  /\\ \\/ left[position] < right[position]
     \\/ left[position] = right[position] /\\ NatBelowFrom(left, right, position - 1)

LOCAL NatBelow(left, right) ==
  \\/ Len(left) < Len(right)
  \\/ Len(left) = Len(right) /\\ NatBelowFrom(left, right, Len(left))

\\* The limbs of a natural times a factor below Limb, from a position on.
RECURSIVE NatTimesFrom(_, _, _, _)
NatTimesFrom(nat, factor, position, carry) ==
  IF position > Len(nat)
  THEN NatOf(carry)
  ELSE LET total == nat[position] * factor + carry
       IN <<total % Limb>> \\o NatTimesFrom(nat, factor, position + 1, total \\div Limb)

LOCAL NatTimes(nat, factor) == NatTrim(NatTimesFrom(nat, factor, 1, 0))

LOCAL NatShiftLimbs(nat, count) == IF nat = <<>> THEN <<>> ELSE [position \\in 1..count |-> 0] \\o nat

RECURSIVE NatProduct(_, _)
NatProduct(left, right) ==
  IF right = <<>>
  THEN <<>>
  ELSE NatAdd(NatTimes(left, Head(right)), NatShiftLimbs(NatProduct(left, Tail(right)), 1))

LOCAL NatShiftLeft(nat, bits) == NatShiftLimbs(NatTimes(nat, 2^(bits % 14)), bits \\div 14)

\\* The limbs of a natural's quotient by a divisor below Limb, the highest limbs divided first.
RECURSIVE NatQuotientFrom(_, _, _, _)
NatQuotientFrom(nat, divisor, position, remainder) ==
  IF position = 0
  THEN <<>>
  ELSE LET current == remainder * Limb + nat[position]
       IN NatQuotientFrom(nat, divisor, position - 1, current % divisor) \\o <<current \\div divisor>>

\\* A natural divided by 2^bits, rounded down.
LOCAL NatShiftRight(nat, bits) ==
  LET kept == IF bits \\div 14 >= Len(nat) THEN <<>> ELSE SubSeq(nat, bits \\div 14 + 1, Len(nat))
  IN NatTrim(NatQuotientFrom(kept, 2^(bits % 14), Len(kept), 0))

LOCAL NatBits(nat) == IF nat = <<>> THEN 0 ELSE 14 * (Len(nat) - 1) + BitLength(nat[Len(nat)])

LOCAL NatIsOdd(nat) == nat # <<>> /\\ nat[1] % 2 = 1

LOCAL NatOfHalves(halves) == NatAdd(NatShiftLeft(NatOf(halves[1]), 31), NatOf(halves[2]))

\\* The halves of a natural below 2^54, whose third limb straddles bit 31.
LOCAL NatHalves(nat) ==
  <<LimbAt(nat, 3) \\div 8 + LimbAt(nat, 4) * 2048,
    LimbAt(nat, 1) + LimbAt(nat, 2) * Limb + (LimbAt(nat, 3) % 8) * 268435456>>

\\* A natural's quotient and remainder by another, one bit at a time from the highest.
RECURSIVE NatDivideFrom(_, _, _, _, _)
NatDivideFrom(nat, divisor, bit, quotient, remainder) ==
  IF bit < 0
  THEN <<quotient, remainder>>
  ELSE LET current == NatAdd(NatShiftLeft(remainder, 1),
                             IF NatIsOdd(NatShiftRight(nat, bit)) THEN <<1>> ELSE <<>>)
           fits == ~NatBelow(current, divisor)
       IN NatDivideFrom(nat, divisor, bit - 1,
                        NatAdd(NatShiftLeft(quotient, 1), IF fits THEN <<1>> ELSE <<>>),
                        IF fits THEN NatSubtract(current, divisor) ELSE current)

LOCAL NatDivide(nat, divisor) == NatDivideFrom(nat, divisor, NatBits(nat) - 1, <<>>, <<>>)

\\* A natural other than 0 below 2^54 times 2^exponent as a number.
LOCAL FromNat(isNegative, nat, exponent) ==
  LET odd == OddPart(NatHalves(nat), 0)
  IN FromBinary(<<isNegative, exponent + odd[2], odd[1][1], odd[1][2]>>)

\\* A natural other than 0 times 2^exponent, rounded to the nearest number, an even significand where
\\* two are as near, as IEEE 754 rounds: 53 bits, or fewer where the number is below 2^-1022.
LOCAL Rounded(isNegative, nat, exponent) ==
  LET bits == NatBits(nat)
      shift == IF bits - 53 > -1074 - exponent THEN bits - 53 ELSE -1074 - exponent
      kept == NatShiftRight(nat, shift)
      rest == NatSubtract(nat, NatShiftLeft(kept, shift))
      half == NatShiftLeft(<<1>>, shift - 1)
      rounded == IF NatBelow(half, rest) \\/ (rest = half /\\ NatIsOdd(kept))
                 THEN NatAdd(kept, <<1>>)
                 ELSE kept
  IN CASE shift <= 0 -> FromNat(isNegative, nat, exponent)
       [] rounded = <<>> -> IF isNegative THEN NegativeZero ELSE 0
       [] OTHER -> FromNat(isNegative, rounded, exponent + shift)

LOCAL Significand(binary) == NatOfHalves(<<binary[3], binary[4]>>)

\\* A finite number other than 0 times 2^count, which is exact unless it falls below 2^-1022, where it
\\* may need rounding.
LOCAL Scaled(value, count) ==
  LET binary == Binary(value)
  IN IF binary[2] + count < -1074
     THEN Rounded(binary[1], Significand(binary), binary[2] + count)
     ELSE FromBinary(<<binary[1], binary[2] + count, binary[3], binary[4]>>)

\\* The sum of two finite numbers other than 0, rounded.
LOCAL ExactSum(left, right) ==
  LET a == Binary(left)
      b == Binary(right)
      low == IF a[2] < b[2] THEN a[2] ELSE b[2]
      aligned(binary) == NatShiftLeft(Significand(binary), binary[2] - low)
  IN CASE a[1] = b[1] -> Rounded(a[1], NatAdd(aligned(a), aligned(b)), low)
       [] aligned(a) = aligned(b) -> 0
       [] NatBelow(aligned(b), aligned(a)) -> Rounded(a[1], NatSubtract(aligned(a), aligned(b)), low)
       [] OTHER -> Rounded(b[1], NatSubtract(aligned(b), aligned(a)), low)

\\* The product of two finite numbers other than 0, rounded.
LOCAL ExactProduct(left, right) ==
  LET a == Binary(left)
      b == Binary(right)
  IN Rounded(a[1] # b[1], NatProduct(Significand(a), Significand(b)), a[2] + b[2])

\\* The quotient of two finite numbers other than 0, rounded, from 55 bits of it or more and whether
\\* any remain, which decide the rounding.
LOCAL ExactQuotient(left, right) ==
  LET a == Binary(left)
      b == Binary(right)
      spare == 55 + NatBits(Significand(b)) - NatBits(Significand(a))
      shift == IF spare > 0 THEN spare ELSE 0
      division == NatDivide(NatShiftLeft(Significand(a), shift), Significand(b))
  IN Rounded(a[1] # b[1],
             NatAdd(NatShiftLeft(division[1], 1), IF division[2] = <<>> THEN <<>> ELSE <<1>>),
             a[2] - b[2] - shift - 1)

LOCAL NatModulo(nat, modulus) == NatDivide(nat, modulus)[2]

\\* 2^exponent modulo a natural, by squaring.
RECURSIVE TwoPowerModulo(_, _)
TwoPowerModulo(exponent, modulus) ==
  IF exponent = 0
  THEN NatModulo(<<1>>, modulus)
  ELSE LET half == TwoPowerModulo(exponent \\div 2, modulus)
           squared == NatModulo(NatProduct(half, half), modulus)
       IN IF exponent % 2 = 1 THEN NatModulo(NatShiftLeft(squared, 1), modulus) ELSE squared

\\* The remainder of two finite numbers other than 0, which is exact, with the dividend's sign. A
\\* dividend below the divisor is the remainder, and the divisor's significand divides one that its
\\* power of 2 shifts.
LOCAL ExactRemainder(left, right) ==
  LET a == Binary(left)
      b == Binary(right)
      remainder ==
        IF a[2] >= b[2]
        THEN NatModulo(NatProduct(NatModulo(Significand(a), Significand(b)),
                                  TwoPowerModulo(a[2] - b[2], Significand(b))),
                       Significand(b))
        ELSE NatModulo(Significand(a), NatShiftLeft(Significand(b), b[2] - a[2]))
      low == IF a[2] < b[2] THEN a[2] ELSE b[2]
  IN CASE b[2] - a[2] >= 54 -> left
       [] remainder = <<>> -> IF a[1] THEN NegativeZero ELSE 0
       [] OTHER -> Rounded(a[1], remainder, low)


\\* 5^count, by squaring.
RECURSIVE FivePower(_)
FivePower(count) ==
  IF count = 0
  THEN <<1>>
  ELSE LET half == FivePower(count \\div 2)
           squared == NatProduct(half, half)
       IN IF count % 2 = 1 THEN NatTimes(squared, 5) ELSE squared

\\* The decimal digits of a natural, four at a time from the least.
RECURSIVE NatText(_)
NatText(nat) ==
  IF NatBelow(nat, <<10000>>)
  THEN ToString(LimbAt(nat, 1))
  ELSE LET quotient == NatTrim(NatQuotientFrom(nat, 10000, Len(nat), 0))
           rest == ToString(LimbAt(NatSubtract(nat, NatTimes(quotient, 10000)), 1))
       IN NatText(quotient) \\o SubSeq("000", 1, 4 - Len(rest)) \\o rest

\\* The exact decimal digits of a finite number other than 0, without its sign, and the power of 10
\\* of the first: its significand times 2^exponent, or, below 1, times 5^-exponent over 10^-exponent.
LOCAL ExactDecimal(value) ==
  LET binary == Binary(value)
      text == NatText(IF binary[2] >= 0
                      THEN NatShiftLeft(Significand(binary), binary[2])
                      ELSE NatProduct(Significand(binary), FivePower(-binary[2])))
  IN [digits |-> text, exponent |-> Len(text) - 1 + (IF binary[2] >= 0 THEN 0 ELSE binary[2])]

\\* Number.isInteger.
IsIntegral(value) ==
  IsFinite(value) /\\ ~IsFraction(value) /\\ ~(IsDouble(value) /\\ value[Double][2] < 0)

Negate(value) ==
  CASE value = NaN -> NaN
    [] value = Infinity -> NegativeInfinity
    [] value = NegativeInfinity -> Infinity
    [] value = NegativeZero -> 0
    [] IsDouble(value) ->
         Double :> <<~value[Double][1], value[Double][2], value[Double][3], value[Double][4]>>
    [] IsWide(value) -> WideNegate(value)
    [] value = 0 -> NegativeZero
    [] IsFraction(value) -> Fractions[Len(Fractions) + 1 - FractionPosition(value)].value
    [] value = -2147483647 - 1 -> WideNegate(value)
    [] OTHER -> -value

Add(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] left \\in Infinities /\\ right \\in Infinities -> IF left = right THEN left ELSE NaN
    [] left \\in Infinities -> left
    [] right \\in Infinities -> right
    [] left = NegativeZero -> right
    [] right = NegativeZero -> left
    [] IsDouble(left) \\/ IsDouble(right) ->
         CASE IsDouble(left) /\\ IsDouble(right) /\\ left = Negate(right) -> 0
           [] IsDouble(left) /\\ IsDouble(right) /\\ left = right -> Scaled(left, 1)
           [] IsZero(left) -> right
           [] IsZero(right) -> left
           [] OTHER -> ExactSum(left, right)
    \\* Wide integers below 2^52 either way add to one up to 2^53.
    [] IsWide(left) /\\ IsZero(right) -> left
    [] IsWide(right) /\\ IsZero(left) -> right
    [] IsWide(left) \\/ IsWide(right) ->
         IF /\\ ~IsFraction(left) /\\ ~IsFraction(right)
            /\\ ~IsWide(left) \\/ (left[Wide][1] >= -2097152 /\\ left[Wide][1] < 2097152)
            /\\ ~IsWide(right) \\/ (right[Wide][1] >= -2097152 /\\ right[Wide][1] < 2097152)
         THEN WideAdd(left, right)
         ELSE ExactSum(left, right)
    [] left = 0 -> right
    [] right = 0 -> left
    \\* A number plus itself is twice it, and plus its negation 0, exactly.
    [] IsFraction(left) /\\ IsFraction(right) /\\ left = right -> Scaled(left, 1)
    [] IsFraction(left) /\\ IsFraction(right) /\\ left = Negate(right) -> 0
    [] IsFraction(left) \\/ IsFraction(right) -> ExactSum(left, right)
    [] \\/ right > 0 /\\ left > MaxInteger - right
       \\/ right < 0 /\\ left < -MaxInteger - 1 - right ->
         WideAdd(left, right)
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
       [] (IsDouble(left) \\/ IsFraction(left)) /\\ TwoPower(right) >= 0 ->
            IF IsNegative(right) THEN Negate(Scaled(left, TwoPower(right))) ELSE Scaled(left, TwoPower(right))
       [] (IsDouble(right) \\/ IsFraction(right)) /\\ TwoPower(left) >= 0 ->
            IF IsNegative(left) THEN Negate(Scaled(right, TwoPower(left))) ELSE Scaled(right, TwoPower(left))
       [] IsDouble(left) \\/ IsDouble(right) -> ExactProduct(left, right)
       [] IsWide(left) \\/ IsWide(right) ->
            LET wide == Unsigned(IF IsWide(left) THEN left ELSE right)
                factor == Unsigned(IF IsWide(left) THEN right ELSE left)
                signed(product) == IF isNegative THEN WideNegate(product) ELSE product
            IN CASE IsFraction(left) \\/ IsFraction(right) \\/ IsWide(factor) -> ExactProduct(left, right)
                 [] factor = 1 -> signed(wide)
                 [] wide[Wide][1] > 4194304 \\div factor -> ExactProduct(left, right)
                 [] OTHER ->
                      LET raw == RawAdd(<<wide[Wide][1] * factor, 0>>, RawProduct(wide[Wide][2], factor))
                      IN IF FitsWide(raw) THEN signed(WideOf(raw)) ELSE ExactProduct(left, right)
       [] left = 1 -> right
       [] right = 1 -> left
       [] left = -1 -> Negate(right)
       [] right = -1 -> Negate(left)
       [] IsFraction(left) \\/ IsFraction(right) -> ExactProduct(left, right)
       \\* -2^31 has no negation that TLC holds.
       [] -2147483647 - 1 \\in {left, right} -> ExactProduct(left, right)
       [] Absolute(left) > MaxInteger \\div Absolute(right) ->
            LET raw == RawProduct(Absolute(left), Absolute(right))
            IN IF FitsWide(raw)
               THEN IF isNegative THEN WideNegate(WideOf(raw)) ELSE WideOf(raw)
               ELSE ExactProduct(left, right)
       [] OTHER ->
            LET product == Magnitude(left) * Magnitude(right)
            IN IF product = 0 /\\ isNegative THEN NegativeZero ELSE product

\\* JavaScript's /, rounded as IEEE 754 rounds.
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
       [] IsDouble(right) -> ExactQuotient(left, right)
       [] TwoPower(right) >= 0 /\\ (IsDouble(left) \\/ IsFraction(left) \\/ IsBig(right) \\/ IsWide(left)) ->
            IF IsNegative(right) THEN Negate(Scaled(left, -TwoPower(right))) ELSE Scaled(left, -TwoPower(right))
       [] IsBig(left) \\/ IsBig(right) -> ExactQuotient(left, right)
       [] right = 1 -> left
       [] IsFraction(left) \\/ IsFraction(right) \\/ -2147483647 - 1 \\in {left, right} ->
            ExactQuotient(left, right)
       [] Absolute(Magnitude(left)) % Absolute(Magnitude(right)) = 0 ->
            signed(Absolute(Magnitude(left)) \\div Absolute(Magnitude(right)))
       [] TwoPower(right) >= 0 ->
            IF IsNegative(right) THEN Negate(Scaled(left, -TwoPower(right))) ELSE Scaled(left, -TwoPower(right))
       [] OTHER -> ExactQuotient(left, right)

\\* JavaScript's %, whose result has the sign of the dividend.
Remainder(left, right) ==
  CASE left = NaN \\/ right = NaN \\/ left \\in Infinities \\/ IsZero(right) -> NaN
    [] right \\in Infinities \\/ IsZero(left) -> left
    [] IsFraction(left) \\/ IsFraction(right) \\/ IsBig(left) \\/ IsBig(right) ->
         ExactRemainder(left, right)
    [] -2147483647 - 1 \\in {left, right} -> ExactRemainder(left, right)
    [] OTHER ->
         LET remainder == Absolute(left) % Absolute(right)
         IN CASE left > 0 -> remainder
              [] remainder = 0 -> NegativeZero
              [] OTHER -> -remainder

\\* 2^31 is even, so a Wide integer is odd where its low half is.
LOCAL IsOdd(value) ==
  \\/ IsInteger(value) /\\ value % 2 = 1
  \\/ IsWide(value) /\\ value[Wide][2] % 2 = 1

\\* An integer to a power, one product at a time, where each may need a Wide integer.
RECURSIVE WidePower(_, _)
WidePower(base, exponent) == IF exponent = 0 THEN 1 ELSE Multiply(base, WidePower(base, exponent - 1))

\\* JavaScript's **, as Number::exponentiate defines it.
Power(base, exponent) ==
  CASE exponent = NaN -> NaN
    [] IsZero(exponent) -> 1
    [] base = NaN -> NaN
    [] base = Infinity -> IF IsNegative(exponent) THEN 0 ELSE Infinity
    [] base = NegativeInfinity ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeInfinity
           [] ~IsNegative(exponent) -> Infinity
           [] IsOdd(exponent) -> NegativeZero
           [] OTHER -> 0
    [] /\\ IsNegative(base)
       /\\ base # NegativeZero
       /\\ exponent \\notin Infinities
       /\\ ~IsIntegral(exponent) -> NaN
    [] IsBig(base) /\\ exponent \\notin Infinities -> BeyondInteger
    [] ~IsBig(base) /\\ base = 0 -> IF IsNegative(exponent) THEN Infinity ELSE 0
    [] base = NegativeZero ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeZero
           [] ~IsNegative(exponent) -> 0
           [] IsOdd(exponent) -> NegativeInfinity
           [] OTHER -> Infinity
    [] exponent \\in Infinities ->
         LET exceedsOne == CASE IsFraction(base) -> Floor(base) >= 1 \\/ Floor(base) <= -2
                              [] IsWide(base) -> TRUE
                              [] IsDouble(base) -> MagnitudeBelow(<<FALSE, 0, 0, 1>>, Binary(base))
                              [] OTHER -> Absolute(base) > 1
         IN CASE ~IsBig(base) /\\ base \\in {1, -1} -> NaN
              [] exceedsOne = (exponent = Infinity) -> Infinity
              [] OTHER -> 0
    [] IsFraction(base) \\/ IsFraction(exponent) ->
         Assert(FALSE, "tla-ts can't raise fractions to a power")
    [] IsBig(base) \\/ IsBig(exponent) -> BeyondInteger
    [] exponent >= 0 -> IF Absolute(base) <= 1 THEN base ^ exponent ELSE WidePower(base, exponent)
    [] Absolute(base) = 1 -> IF IsOdd(exponent) THEN base ELSE 1
    \\* 2 ** -1075 is half the least number above 0, so it and any power nearer 0 round to 0.
    [] exponent <= -1075 -> IF IsNegative(base) /\\ IsOdd(exponent) THEN NegativeZero ELSE 0
    \\* A power of 2 to a power is a power of 2, which a double holds exactly.
    [] TwoPower(base) > 0 ->
         FromBinary(<<IsNegative(base) /\\ IsOdd(exponent), TwoPower(base) * exponent, 0, 1>>)
    [] OTHER -> Assert(FALSE, "tla-ts can't represent this value")

\\* The order of numbers, by their kind, then their floor, then their position in Fractions, where
\\* an integer comes before the fractions above it.
LOCAL Rank(value) ==
  CASE value = NegativeInfinity -> <<0, 0, 0, 0>>
    [] value = Infinity -> <<2, 0, 0, 0>>
    [] IsFraction(value) -> <<1, Halves(Floor(value))[1], Halves(Floor(value))[2], FractionPosition(value)>>
    [] OTHER -> <<1, Halves(Magnitude(value))[1], Halves(Magnitude(value))[2], 0>>

LOCAL Precedes(left, right) ==
  \\E position \\in DOMAIN left :
    /\\ left[position] < right[position]
    /\\ \\A earlier \\in 1..(position - 1) : left[earlier] = right[earlier]

LessThan(left, right) ==
  /\\ left # NaN
  /\\ right # NaN
  /\\ IF IsDouble(left) \\/ IsDouble(right)
     THEN BinaryLessThan(left, right)
     ELSE Precedes(Rank(left), Rank(right))

LessOrEqual(left, right) == left # NaN /\\ right # NaN /\\ ~LessThan(right, left)

\\* TLC's integers have 32 bits, where a BigInt has as many as it needs, so tla-ts stops where one
\\* would leave them.
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
LOCAL NumericRank(value) ==
  IF IsBigInt(value) THEN <<1, Halves(value[Big])[1], Halves(value[Big])[2], 0>> ELSE Rank(value)

NumericLessThan(left, right) ==
  CASE (IsDouble(left) \\/ IsDouble(right)) /\\ (IsBigInt(left) \\/ IsBigInt(right)) ->
         Assert(FALSE, "tla-ts can't compare a BigInt with this number")
    [] IsDouble(left) \\/ IsDouble(right) -> LessThan(left, right)
    [] OTHER -> left # NaN /\\ right # NaN /\\ Precedes(NumericRank(left), NumericRank(right))

NumericLessOrEqual(left, right) == left # NaN /\\ right # NaN /\\ ~NumericLessThan(right, left)

\\* Math.abs.
AbsoluteValue(value) == IF IsNegative(value) THEN Negate(value) ELSE value

\\* Math.sign.
Sign(value) ==
  CASE value \\in {NaN, NegativeZero} \\/ IsZero(value) -> value
    [] IsNegative(value) -> -1
    [] OTHER -> 1

\\* Math.round, which tla-ts works out for each fraction as it compiles.
Round(value) ==
  CASE IsFraction(value) -> Fractions[FractionPosition(value)].round
    [] IsDouble(value) /\\ value[Double][2] < 0 -> Assert(FALSE, "tla-ts can't round this number")
    [] OTHER -> value

\\* ToInt32 of a number. TLC keeps integers in 32 bits, so it leaves an integer as it is.
LOCAL Int32(value) ==
  CASE value \\in SpecialNumbers -> 0
    [] IsFraction(value) -> Truncate(value)
    [] IsWide(value) ->
         IF value[Wide][1] % 2 = 1 THEN value[Wide][2] - MaxInteger - 1 ELSE value[Wide][2]
    \\* A Double that is an integer keeps the low 32 bits of its magnitude, negated with it.
    [] IsDouble(value) /\\ value[Double][2] >= 0 ->
         LET magnitude == NatShiftLeft(Significand(value[Double]), value[Double][2])
             low == NatHalves(NatSubtract(magnitude, NatShiftLeft(NatShiftRight(magnitude, 32), 32)))
             signed == IF low[1] = 1 THEN low[2] - MaxInteger - 1 ELSE low[2]
         IN IF ~value[Double][1] \\/ signed = -MaxInteger - 1 THEN signed ELSE -signed
    [] IsDouble(value) -> Assert(FALSE, "tla-ts can't convert this number to 32 bits")
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
\\* JavaScript's ~, as -1 - x, which keeps -2^31 inside TLC's integers.
BitwiseNot(value) == -1 - Int32(value)

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

\\* Math.clz32: the count of leading zero bits in a number's low 32 bits.
Clz32(value) ==
  LET int32 == Int32(value)
  IN CASE int32 < 0 -> 0
       [] int32 = 0 -> 32
       [] OTHER -> 31 - (CHOOSE bit \\in 0..30 : int32 \\div 2 ^ bit = 1)

RECURSIVE RootBetween(_, _, _)
RootBetween(square, low, high) ==
  IF low = high
  THEN low
  ELSE LET middle == (low + high + 1) \\div 2
       IN IF middle * middle <= square
          THEN RootBetween(square, middle, high)
          ELSE RootBetween(square, low, middle - 1)

RECURSIVE SquareSum(_)
SquareSum(values) ==
  IF values = <<>>
  THEN 0
  ELSE LET value == IF Head(values) = NegativeZero THEN 0 ELSE Head(values)
       IN value * value + SquareSum(Tail(values))

\\* Math.hypot of numbers, whose root tla-ts holds only where it's an integer. An infinity gives
\\* Infinity even beside NaN.
Hypot(values) ==
  LET has(numbers) == \\E position \\in DOMAIN values : values[position] \\in numbers
      square == SquareSum(values)
      root == RootBetween(square, 0, IF square < 46340 THEN square ELSE 46340)
  IN CASE has({Infinity, NegativeInfinity}) -> Infinity
       [] has({NaN}) -> NaN
       [] \\E position \\in DOMAIN values : IsFraction(values[position]) ->
            Assert(FALSE, "tla-ts can't represent a fraction")
       [] \\E position \\in DOMAIN values : IsBig(values[position]) -> BeyondInteger
       [] root * root # square -> Assert(FALSE, "tla-ts can't represent a fraction")
       [] OTHER -> root

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

\\* JavaScript's >>>, which reads its left operand as unsigned, so that a shift by 0 of an integer
\\* below 0 gives a Wide integer.
UnsignedRightShift(left, right) ==
  LET a == Int32(left)
      count == ShiftCount(right)
  IN CASE a >= 0 /\\ count < 31 -> a \\div 2 ^ count
       [] a >= 0 -> 0
       [] count = 0 -> WideOf(<<1, a + MaxInteger + 1>>)
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
       [] IsBig(left) \\/ IsBig(right) ->
            IF /\\ ~IsBig(right) /\\ right = 1
               /\\ IsWide(left) \\/ (IsDouble(left) /\\ left[Double][2] >= 0)
            THEN left
            ELSE Assert(FALSE, "tla-ts can't divide this number exactly")
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
\\* index, or is past any sequence's end, as an integer beyond 32 bits is.
ElementPosition(value) ==
  CASE value = NegativeZero -> 1
    [] value \\in SpecialNumbers \\/ IsFraction(value) \\/ IsBig(value) \\/ value = MaxInteger -> 0
    [] OTHER -> value + 1

\\* The value that a Set or a Map keeps as a key, where -0 is 0.
KeyOf(value) ==
  CASE value = NegativeZero -> 0
    [] IsBig(value) -> BeyondInteger
    [] OTHER -> value

\\* The map that new Map makes from an array of entries, each a key and its value, where a later
\\* entry of a key replaces an earlier one's value.
MapOf(entries) ==
  [key \\in {entries[index][1] : index \\in DOMAIN entries} |->
     entries[CHOOSE index \\in DOMAIN entries :
               /\\ entries[index][1] = key
               /\\ \\A later \\in index + 1..Len(entries) : entries[later][1] # key][2]]

\\* MapOf, where the keys may be -0, which a map keeps as 0.
KeyedMapOf(entries) ==
  MapOf([index \\in DOMAIN entries |-> <<KeyOf(entries[index][1]), entries[index][2]>>])

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
    \\* An integer past 2^31 either way lies past either end of any array that tla-ts holds.
    [] IsWide(index) \\/ (IsDouble(index) /\\ index[Double][2] >= 0) ->
         IF IsNegative(index) THEN -1 ELSE length
    [] IsBig(index) -> BeyondInteger
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
    [] IsWide(count) \\/ (IsDouble(count) /\\ count[Double][2] >= 0) ->
         IF IsNegative(count) THEN 0 ELSE maximum
    [] IsBig(count) -> BeyondInteger
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

\\* sort() as V8 runs it on fewer than 64 elements, between the calls of its comparator: it takes the
\\* run that starts the elements, reversed where it descends, and inserts each element after it by
\\* binary search. The state holds the elements other than undefined, the run or the elements that it
\\* sorted so far, and the pair that it compares next.
SortState(sequence) ==
  LET defined == SelectSeq(sequence, LAMBDA value : value # Undefined)
  IN [items |-> defined, trailing |-> Len(sequence) - Len(defined), sorted |-> defined,
      stage |-> IF Len(defined) < 2 THEN "done" ELSE "first", isDescending |-> FALSE, at |-> 2,
      left |-> 1, right |-> 1]

\\* The state of sort() with a comparator that runs as statements.
SortStart(sequence) ==
  IF Len(SelectSeq(sequence, LAMBDA value : value # Undefined)) >= 64
  THEN Assert(FALSE, "tla-ts can't sort 64 or more elements with a comparator that runs statements")
  ELSE SortState(sequence)

\\* Inserts the element at a position on, or ends where none is left.
LOCAL SortInsertFrom(state, sorted, at) ==
  IF at > Len(state.items)
  THEN [state EXCEPT !.stage = "done", !.sorted = sorted]
  ELSE [state EXCEPT !.stage = "insert", !.sorted = sorted, !.at = at, !.left = 1,
          !.right = Len(sorted) + 1]

\\* Ends the run before the element at the state's position, ascending.
LOCAL SortRunEnd(state) ==
  LET run == SubSeq(state.items, 1, state.at - 1)
  IN SortInsertFrom(state,
       IF state.isDescending THEN [position \\in DOMAIN run |-> run[Len(run) - position + 1]]
       ELSE run,
       state.at)

\\* Ends the run where the elements end.
LOCAL SortRun(state) == IF state.at <= Len(state.items) THEN state ELSE SortRunEnd(state)

\\* The pair that sort() compares next.
SortPair(state) ==
  CASE state.stage = "first" -> <<state.items[2], state.items[1]>>
    [] state.stage = "run" -> <<state.items[state.at], state.items[state.at - 1]>>
    [] OTHER -> <<state.items[state.at], state.sorted[state.left + (state.right - state.left) \\div 2]>>

\\* The state after the comparator tells whether the first of the pair comes before the second.
SortNext(state, isBefore) ==
  CASE state.stage = "first" ->
         SortRun([state EXCEPT !.stage = "run", !.isDescending = isBefore, !.at = 3])
    [] state.stage = "run" ->
         IF isBefore = state.isDescending
         THEN SortRun([state EXCEPT !.at = @ + 1])
         ELSE SortRunEnd(state)
    [] OTHER ->
         LET middle == state.left + (state.right - state.left) \\div 2
             next == IF isBefore THEN [state EXCEPT !.right = middle]
                     ELSE [state EXCEPT !.left = middle + 1]
         IN IF next.left < next.right
            THEN next
            ELSE SortInsertFrom(next,
                   SubSeq(next.sorted, 1, next.left - 1) \\o <<next.items[next.at]>>
                     \\o SubSeq(next.sorted, next.left, Len(next.sorted)),
                   next.at + 1)

\\* The array that sort() gives, with undefined last.
SortResult(state) == state.sorted \\o [position \\in 1..state.trailing |-> Undefined]

RECURSIVE SortedState(_, _)
SortedState(state, IsBefore(_, _)) ==
  IF state.stage = "done"
  THEN state
  ELSE LET pair == SortPair(state)
       IN SortedState(SortNext(state, IsBefore(pair[1], pair[2])), IsBefore)

\\* sort(). V8 merges runs of 64 or more elements, which only a comparator that can't throw and
\\* orders them consistently sorts alike.
SortSequence(sequence, IsBefore(_, _), mayThrow) ==
  LET defined == SelectSeq(sequence, LAMBDA value : value # Undefined)
  IN CASE Len(defined) < 64 -> SortResult(SortedState(SortState(sequence), IsBefore))
       [] mayThrow ->
            Assert(FALSE, "tla-ts can't sort 64 or more elements with a comparator that may throw")
       [] OTHER -> SortedPrefix(defined, Len(defined), IsBefore)
            \\o [position \\in 1..(Len(sequence) - Len(defined)) |-> Undefined]

\\* An element that join() writes, where undefined and null write nothing, as a regexp's split gives
\\* undefined for a capture that didn't take part where TypeScript types the array as strings.
LOCAL JoinPart(value) == IF value \\in {Undefined, Null} THEN "" ELSE value

RECURSIVE Join(_, _)
Join(sequence, separator) ==
  CASE sequence = <<>> -> ""
    [] Len(sequence) = 1 -> JoinPart(Head(sequence))
    [] OTHER -> JoinPart(Head(sequence)) \\o separator \\o Join(Tail(sequence), separator)

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

\\* Reduce without an initial value, which gives whether it found no element to start from, where
\\* reduce throws a TypeError, and otherwise what it gives.
CheckedReduce(sequence, Op(_, _), isRight) ==
  IF sequence = <<>> THEN <<TRUE>> ELSE <<FALSE, Reduce(sequence, Op, isRight, FALSE, FALSE)>>

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

\\* The global object, which a script's this is at its top level. A host gives it properties besides
\\* the standard globals', such as Node's process, so tla-ts reads only the keys of those.
GlobalObject == Ref :> "globalThis"

\\* The this of a function outside strict mode, which is the global object for undefined or null and
\\* an object that wraps a primitive.
SloppyThis(value) ==
  CASE value \\in {Undefined, Null} -> GlobalObject
    [] TypeOf(value) \\in {"object", "function"} -> value
    [] OTHER -> Assert(FALSE, "tla-ts can't wrap a primitive this outside strict mode")

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

\\* Allocates objects in turn, which may hold the refs that NextRef gives each.
AllocateEach(heap, objects) == [heap EXCEPT !.objects = @ \\o objects]

\\* Whether a heap holds what another does, and only adds objects after them.
IsExtendedHeap(heap, before) == [heap EXCEPT !.objects = SubSeq(@, 1, Len(before.objects))] = before

LOCAL BuiltInKey(ref) == IF IsRef(ref) THEN ref[Ref] ELSE ref

LOCAL IsBuiltIn(ref) ==
  /\\ IsObject(ref)
  /\\ BuiltInKey(ref) \\in DOMAIN BuiltIns
  /\\ ~BuiltIns[BuiltInKey(ref)].isOpaque

\\* Whether a value is an object that the heap or the built-in objects hold, as they hold the object of
\\* a function that a model value stands for.
IsHeldObject(value) == IsRef(value) \\/ IsBuiltIn(value)

\\* A proxy, whose target and handler revoking it sets to null. Statements run its traps, and tla-ts
\\* stops wherever anything else reads it.
IsProxy(heap, value) == IsHeap(value) /\\ "handler" \\in DOMAIN heap.objects[value[Ref]]

\\* The object whose internal method a proxy runs where its handler has none of the traps that the
\\* method reads, which is the object itself where it isn't a proxy.
RECURSIVE ForwardTarget(_, _, _)
Forward(heap, ref, traps) == IF IsProxy(heap, ref) THEN ForwardTarget(heap, ref, traps) ELSE ref

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

\\* ArrayBuffer.isView, which a typed array or a DataView passes, and not a proxy of one.
IsView(heap, value) == IsHeap(value) /\\ "viewed" \\in DOMAIN heap.objects[value[Ref]]

\\* The traps that a proxy's handler may hold.
LOCAL ProxyTraps ==
  {"getPrototypeOf", "setPrototypeOf", "isExtensible", "preventExtensions", "getOwnPropertyDescriptor",
   "defineProperty", "has", "get", "set", "deleteProperty", "ownKeys", "apply", "construct"}

\\* Whether a handler holds none of the traps, nor inherits any: an ordinary object that a script
\\* makes, whose prototype is null or Object.prototype.
LOCAL HasNoTraps(heap, handler) ==
  LET object == heap.objects[handler[Ref]]
      inherited == IF "Object.prototype" \\in DOMAIN heap.changed
                   THEN heap.changed["Object.prototype"]
                   ELSE BuiltIns["Object.prototype"]
  IN /\\ IsHeap(handler)
     /\\ DOMAIN object = DOMAIN EmptyObject
     /\\ ProxyTraps \\cap DOMAIN object.values = {}
     /\\ \\/ object.prototype = Null
        \\/ object.prototype = ObjectPrototype /\\ ProxyTraps \\cap DOMAIN inherited.values = {}

\\* The object that a proxy runs its internal methods on where its handler holds none of the traps,
\\* and neither does any proxy's on the way, as each then runs its target's. tla-ts runs them only
\\* on an ordinary object that a script makes, and stops at any other.
RECURSIVE ProxiedObject(_, _)
ProxiedObject(heap, ref) ==
  LET target == ProxyTarget(heap, ref)
  IN CASE ProxyHandler(heap, ref) = Null \\/ ~HasNoTraps(heap, ProxyHandler(heap, ref)) ->
            Assert(FALSE, "tla-ts can't run a proxy's internal method here")
       [] IsProxy(heap, target) -> ProxiedObject(heap, target)
       [] /\\ IsHeap(target)
          /\\ DOMAIN heap.objects[target[Ref]] = DOMAIN EmptyObject
          /\\ ~heap.objects[target[Ref]].isOpaque ->
            target
       [] OTHER -> Assert(FALSE, "tla-ts can't run a proxy's internal method here")

LOCAL LookupFor(heap, ref, isGlobalKey) ==
  CASE IsProxy(heap, ref) -> heap.objects[ProxiedObject(heap, ref)[Ref]]
    [] IsTypedArray(heap, ref) -> Assert(FALSE, "tla-ts can't run a typed array's internal method here")
    [] ref \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of reading a property of " \\o ToString(ref))
    [] IsHeap(ref) /\\ heap.objects[ref[Ref]].isOpaque ->
         Assert(FALSE, "tla-ts can't read the properties of a generator or a promise")
    [] IsHeap(ref) -> heap.objects[ref[Ref]]
    [] IsRef(ref) /\\ ref = GlobalObject /\\ ~isGlobalKey ->
         Assert(FALSE, "tla-ts can't tell which properties the global object has")
    [] IsBuiltIn(ref) /\\ BuiltInKey(ref) \\in DOMAIN heap.changed -> heap.changed[BuiltInKey(ref)]
    [] IsBuiltIn(ref) -> BuiltIns[BuiltInKey(ref)]
    [] OTHER -> Assert(FALSE, "tla-ts can't read the properties of " \\o ToString(ref))

Lookup(heap, ref) == LookupFor(heap, ref, FALSE)

\\* An object's own properties, where what reads or writes them names keys, none of which is one
\\* that tla-ts hides where the object is the global object.
LookupKeys(heap, ref, keys) ==
  LookupFor(heap, ref,
            LET global == BuiltIns[GlobalObject[Ref]]
            IN \\A key \\in keys :
                 key \\notin DOMAIN global.values \\/ global.attributes[key].kind # "hidden")

LookupKey(heap, ref, key) == LookupKeys(heap, ref, {key})

\\* The built-in objects that a built-in iterator inherits from, whose return closing the iterator
\\* calls where a loop or a pattern leaves it early. tla-ts doesn't call it, so it stops where a
\\* script gives one a return or another prototype.
LOCAL IteratorPrototypes ==
  {"Object.prototype", "Iterator.prototype", "%ArrayIteratorPrototype%",
   "%StringIteratorPrototype%", "%MapIteratorPrototype%", "%SetIteratorPrototype%",
   "%RegExpStringIteratorPrototype%"}

\\* Whether the global object still holds the built-in that a name reads under a key.
LOCAL HoldsGlobal(global, key) ==
  /\\ key \\in DOMAIN global.values
  /\\ global.attributes[key].kind = "data"
  /\\ ToString(global.values[key]) = ToString(BuiltIns[GlobalObject[Ref]].values[key])

GlobalHolds(heap, keys) ==
  \\/ GlobalObject[Ref] \\notin DOMAIN heap.changed
  \\/ \\A key \\in keys : HoldsGlobal(heap.changed[GlobalObject[Ref]], key)

Update(heap, ref, object) ==
  CASE IsHeap(ref) ->
         LET held == IF IsProxy(heap, ref) THEN ProxiedObject(heap, ref) ELSE ref
         IN [heap EXCEPT !.objects[held[Ref]] = object]
    [] ~IsRef(ref) /\\ TypeOf(ref) = "object" ->
         Assert(FALSE, "tla-ts can't change an object that the heap doesn't hold")
    [] /\\ BuiltInKey(ref) \\in IteratorPrototypes \\cap DOMAIN BuiltIns
       /\\ \\/ "return" \\in DOMAIN object.values
          \\/ ToString(object.prototype) # ToString(BuiltIns[BuiltInKey(ref)].prototype) ->
         Assert(FALSE,
                "tla-ts can't close an iterator whose prototypes a script may give a return")
    [] /\\ BuiltInKey(ref) = GlobalObject[Ref]
       /\\ \\E key \\in BuiltIns[GlobalObject[Ref]].named : ~HoldsGlobal(object, key) ->
         Assert(FALSE, "tla-ts can't change a global that the script names")
    [] OTHER -> [heap EXCEPT !.changed = (BuiltInKey(ref) :> object) @@ @]

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

\\* A generator object that inherits from a prototype that tla-ts holds.
GeneratorObjectOf(prototype) == [GeneratorObject EXCEPT !.prototype = prototype]

\\* An iterator helper, which tla-ts follows as a generator, inherits from %IteratorHelperPrototype%.
IteratorHelperObject == GeneratorObjectOf(Ref :> "%IteratorHelperPrototype%")

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

\\* A function on the heap, which holds the model value of its code.
WithCode(object, code) == [code |-> code] @@ object

\\* A method that a function makes each time it runs, which can't construct.
MethodObject(functionPrototype, code) ==
  [FunctionObject(functionPrototype, code) EXCEPT !.isConstructor = FALSE]

\\* A function object that reads the locals of the call that made it, with the environment of that
\\* call, which holds the locals that it reads once it outlives the call, by key.
ClosureObject(function, environment) == [environment |-> environment] @@ function

EnvironmentObject(bindings) == [bindings |-> bindings] @@ [EmptyObject EXCEPT !.isOpaque = TRUE]

\\* A local that a closure reads from the call that made it.
Captured(heap, closure, key) ==
  heap.objects[heap.objects[closure[Ref]].environment[Ref]].bindings[key]

\\* A heap where a closure's environment holds a new value of a local that the closure changed.
SetCaptured(heap, closure, key, value) ==
  [heap EXCEPT !.objects[heap.objects[closure[Ref]].environment[Ref]].bindings[key] = value]

\\* A heap where an environment holds the values that the locals of its call have now.
SetEnvironment(heap, environment, bindings) ==
  [heap EXCEPT !.objects[environment[Ref]].bindings = bindings @@ @]

\\* A local that an environment holds.
EnvironmentValue(heap, environment, key) == heap.objects[environment[Ref]].bindings[key]

\\* Whether an environment holds a local, which its call stores once the local's declaration runs.
HasEnvironmentValue(heap, environment, key) == key \\in DOMAIN heap.objects[environment[Ref]].bindings

\\* The environment of the call that made a closure, or Undefined for a function that isn't one.
EnvironmentOf(heap, value) ==
  IF IsHeap(value) /\\ "environment" \\in DOMAIN heap.objects[value[Ref]]
  THEN heap.objects[value[Ref]].environment
  ELSE Undefined

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
\\* objects it makes inherit from.
GeneratorFunctionObject(functionPrototype, name, length, prototype) ==
  Define(ArrowObject(functionPrototype, name, length), "prototype", prototype, TRUE, FALSE, FALSE)

GeneratorPrototypeObject(generatorPrototype) ==
  [EmptyObject EXCEPT !.prototype = generatorPrototype]

\\* A generator object that inherits from its function's prototype property, or from the realm's
\\* prototype of generator objects where that isn't an object.
GeneratorObjectFrom(heap, function, generatorPrototype) ==
  LET prototype == Lookup(heap, function).values["prototype"]
  IN GeneratorObjectOf(IF IsObjectIn(heap, prototype) THEN prototype ELSE generatorPrototype)

\\* A plain function, whose prototype property holds what the objects its new makes inherit from.
PlainFunctionObject(functionPrototype, name, length, prototype) ==
  [GeneratorFunctionObject(functionPrototype, name, length, prototype) EXCEPT !.isConstructor = TRUE]

\\* Whether one string of digits is below another of the same length.
RECURSIVE DigitsBelow(_, _)
DigitsBelow(left, right) ==
  LET digit(text) == CHOOSE value \\in 0..9 : ToString(value) = SubSeq(text, 1, 1)
  IN /\\ left # ""
     /\\ \\/ digit(left) < digit(right)
        \\/ digit(left) = digit(right) /\\ DigitsBelow(Tail(left), Tail(right))

\\* Whether a key is an array index, below 2^32 - 1, which an object lists before its other keys.
LOCAL IsIndex(key) ==
  /\\ ~IsSymbol(key)
  /\\ Len(key) > 0
  /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\ {"-"}
  /\\ Len(key) = 1 \\/ SubSeq(key, 1, 1) # "0"
  /\\ Len(key) < 10 \\/ (Len(key) = 10 /\\ DigitsBelow(key, "4294967295"))

\\* The number that an index's digits give, which is Wide from 2^31.
RECURSIVE ToIndex(_)
ToIndex(key) ==
  CASE key = "" -> 0
    [] Len(key) = 10 -> Add(Multiply(ToIndex(SubSeq(key, 1, 1)), 1000000000), ToIndex(SubSeq(key, 2, 10)))
    [] OTHER -> 10 * ToIndex(SubSeq(key, 1, Len(key) - 1))
                  + (CHOOSE digit \\in 0..9 : ToString(digit) = SubSeq(key, Len(key), Len(key)))

\\* The position in a sequence that a key reads, which may be a number or an index's string.
KeyPosition(key) ==
  CASE TypeOf(key) = "number" -> ElementPosition(key)
    [] TypeOf(key) = "string" /\\ IsIndex(key) -> ElementPosition(ToIndex(key))
    [] OTHER -> Assert(FALSE, "tla-ts can't read this key of an array")

\\* An object's own string keys, with the indices first in order, which their digits give.
OwnKeys(object) ==
  LET strings == SelectSeq(object.keys, LAMBDA key : ~IsSymbol(key))
  IN SortSeq(SelectSeq(strings, IsIndex),
             LAMBDA left, right :
               Len(left) < Len(right) \\/ (Len(left) = Len(right) /\\ DigitsBelow(left, right)))
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

LOCAL IsEnumerableOwnOf(heap, ref, key) ==
  LET object == LookupKey(heap, ref, key)
  IN key \\in DOMAIN object.values /\\ object.attributes[key].enumerable

IsEnumerableOwn(heap, ref, key) == IsEnumerableOwnOf(heap, Forward(heap, ref, {"getOwnPropertyDescriptor"}), key)

IsBigIntType(type) == type \\in {"BigInt64", "BigUint64"}

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

\\* An object's own properties apart from a typed array's elements, which a typed array holds as an
\\* ordinary object does. A promise or a generator object has none, as tla-ts stops where a script
\\* would give it one.
LOCAL OrdinaryOf(heap, ref) ==
  IF \\/ IsTypedArray(heap, ref)
     \\/ IsHeap(ref) /\\ heap.objects[ref[Ref]].isOpaque /\\ "code" \\notin DOMAIN heap.objects[ref[Ref]]
  THEN heap.objects[ref[Ref]]
  ELSE Lookup(heap, ref)

\\* A typed array's element keys, which come before its other own keys.
LOCAL ElementKeys(heap, ref) ==
  IF IsTypedArray(heap, ref)
  THEN [position \\in 1..ViewLength(heap, heap.objects[ref[Ref]]) |-> ToString(position - 1)]
  ELSE <<>>

LOCAL OwnPropertyNamesOf(heap, ref) == ElementKeys(heap, ref) \\o OwnKeys(OrdinaryOf(heap, ref))

OwnPropertyNames(heap, ref) == OwnPropertyNamesOf(heap, Forward(heap, ref, {"ownKeys", "getOwnPropertyDescriptor"}))

LOCAL OwnPropertySymbolsOf(heap, ref) == SelectSeq(OrdinaryOf(heap, ref).keys, IsSymbol)

OwnPropertySymbols(heap, ref) == OwnPropertySymbolsOf(heap, Forward(heap, ref, {"ownKeys", "getOwnPropertyDescriptor"}))

\\* Reflect.ownKeys, which gives the strings that key an object's properties and then its symbols.
OwnPropertyKeys(heap, ref) == OwnPropertyNames(heap, ref) \\o OwnPropertySymbols(heap, ref)

RECURSIVE BitsValue(_, _, _)
BitsValue(bits, from, count) ==
  IF count = 0 THEN 0 ELSE bits[from] + 2 * BitsValue(bits, from + 1, count - 1)

LOCAL ByteBits(bytes) ==
  [position \\in 0..(8 * Len(bytes) - 1) |-> (bytes[position \\div 8 + 1] \\div 2^(position % 8)) % 2]

\\* A float's little-endian bytes as the number they hold exactly: its significand, with the leading
\\* bit that a normal float leaves out, times a power of 2.
LOCAL FloatOf(bytes, exponentBits, fractionBits) ==
  LET bits == ByteBits(bytes)
      isNegative == bits[8 * Len(bytes) - 1] = 1
      exponent == BitsValue(bits, fractionBits, exponentBits)
      isFractionZero == \\A position \\in 0..(fractionBits - 1) : bits[position] = 0
      leading == IF exponent = 0 THEN 0 ELSE 1
      significand ==
        IF fractionBits < 31
        THEN <<0, BitsValue(bits, 0, fractionBits) + leading * 2^fractionBits>>
        ELSE <<BitsValue(bits, 31, fractionBits - 31) + leading * 2^(fractionBits - 31),
               BitsValue(bits, 0, 31)>>
      odd == OddPart(significand, 0)
      power == (IF exponent = 0 THEN 1 ELSE exponent) - (2^(exponentBits - 1) - 1) - fractionBits
  IN CASE exponent = 2^exponentBits - 1 /\\ isFractionZero ->
            IF isNegative THEN NegativeInfinity ELSE Infinity
       [] exponent = 2^exponentBits - 1 -> NaN
       [] exponent = 0 /\\ isFractionZero -> IF isNegative THEN NegativeZero ELSE 0
       [] OTHER -> FromBinary(<<isNegative, power + odd[2], odd[1][1], odd[1][2]>>)

\\* An element's little-endian bytes as the number or the BigInt they hold, where tla-ts holds only a
\\* BigInt within 32 bits.
NumberOfBytes(type, bytes) ==
  LET isBigInt == IsBigIntType(type)
      held == IF isBigInt THEN SubSeq(bytes, 1, 4) ELSE bytes
      unsigned == BitsValue(ByteBits(held), 0, 8 * Len(held) - 1)
      isNegative == held[Len(held)] >= 128
  IN CASE type = "Float16" -> FloatOf(bytes, 5, 10)
       [] type = "Float32" -> FloatOf(bytes, 8, 23)
       [] type = "Float64" -> FloatOf(bytes, 11, 52)
       [] type \\in {"Uint8", "Uint8Clamped", "Uint16"} -> unsigned + (IF isNegative THEN 2^(8 * Len(bytes) - 1) ELSE 0)
       [] type = "BigUint64" /\\ isNegative -> TooBig
       [] isBigInt /\\ \\E position \\in 5..8 : bytes[position] # IF isNegative THEN 255 ELSE 0 -> TooBig
       [] isBigInt -> Big :> IF isNegative THEN (unsigned - 2^30) - 2^30 ELSE unsigned
       [] type = "Uint32" /\\ isNegative -> Assert(FALSE, "tla-ts can't represent a number this big")
       [] type = "Uint32" -> unsigned
       [] isNegative -> (unsigned - 2^(8 * Len(bytes) - 2)) - 2^(8 * Len(bytes) - 2)
       [] OTHER -> unsigned

\\* How a typed array reads a key: as an index, as a number that is no index, or as a property. A
\\* key that Number::toString can't write is a property: one that starts with "+", ".", a 0 before
\\* another digit, or "0.000000", which it writes with an exponent, one whose fraction ends in 0 or
\\* is empty, and 22 digits or more, which it writes with an exponent. An index from 2^31 is past the
\\* end of every typed array and sequence, as a number that is no index is.
TypedKey(key) ==
  LET has(character) == \\E position \\in 1..Len(key) : SubSeq(key, position, position) = character
  IN CASE IsSymbol(key) -> "property"
    [] IsIndex(key) -> IF IsBig(ToIndex(key)) THEN "number" ELSE "index"
    [] key \\in {"-0", "Infinity", "-Infinity", "NaN"} -> "number"
    [] Len(key) > 1 /\\ SubSeq(key, 1, 1) = "-" /\\ IsIndex(SubSeq(key, 2, Len(key))) -> "number"
    [] \\E position \\in DOMAIN Fractions : Fractions[position].text = key -> "number"
    [] \\/ SubSeq(key, 1, 1) \\in {"+", "."}
       \\/ Len(key) > 1 /\\ SubSeq(key, 1, 1) = "0" /\\ SubSeq(key, 2, 2) \\in Digits
       \\/ Len(key) >= 8 /\\ SubSeq(key, 1, 8) = "0.000000"
       \\/ has(".") /\\ ~has("e") /\\ SubSeq(key, Len(key), Len(key)) \\in {".", "0"}
       \\/ Len(key) >= 22 /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits ->
         "property"
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

\\* A DisposableStack, or an AsyncDisposableStack where isAsync holds.
IsStackOf(heap, value, isAsync) == IsStack(heap, value) /\\ Lookup(heap, value).isAsync = isAsync

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
                      IF object.maxLength = Undefined \\/ object.isDetached
                      THEN Len(object.bytes)
                      ELSE object.maxLength
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
  ELSE LookupKey(heap, ref, key)

\\* The own properties that a read finds, where a promise that tla-ts follows has none, as a write to
\\* one stops.
LOCAL ReadPropertiesOf(heap, ref, key) ==
  IF /\\ IsHeap(ref)
     /\\ heap.objects[ref[Ref]].isOpaque
     /\\ "code" \\notin DOMAIN heap.objects[ref[Ref]]
     /\\ ToString(heap.objects[ref[Ref]].prototype) = ToString(Ref :> "Promise.prototype")
  THEN heap.objects[ref[Ref]]
  ELSE PropertiesOf(heap, ref, key)

\\* A promise that tla-ts follows as it compiles, whose properties the heap doesn't hold.
PromiseObject == [EmptyObject EXCEPT !.prototype = Ref :> "Promise.prototype", !.isOpaque = TRUE]

\\* A promise that tla-ts follows keeps Promise.prototype, as a script can't change the object.
Prototype(heap, ref) ==
  IF \\/ IsTypedArray(heap, ref)
     \\/ /\\ IsHeap(ref)
        /\\ heap.objects[ref[Ref]].isOpaque
        /\\ ToString(heap.objects[ref[Ref]].prototype) = ToString(PromiseObject.prototype)
  THEN heap.objects[ref[Ref]].prototype
  ELSE LookupKeys(heap, ref, {}).prototype

\\* Whether a typed array has an element at a key that is a number, which is an index before its end.
LOCAL HasElement(heap, ref, key) ==
  TypedKey(key) = "index" /\\ ToIndex(key) < ViewLength(heap, heap.objects[ref[Ref]])

\\* The description of an object's own property, where a typed array describes an element before its
\\* end as a writable, enumerable, configurable data property.
LOCAL DescribeOf(heap, ref, key) ==
  CASE ~IsTypedArray(heap, ref) \\/ TypedKey(key) = "property" ->
         DescribeObject(PropertiesOf(heap, ref, key), key)
    [] HasElement(heap, ref, key) ->
         DescribeObject(Put(EmptyObject, key, TypedElement(heap, ref, ToIndex(key))), key)
    [] OTHER -> EmptyObject

Describe(heap, ref, key) == DescribeOf(heap, Forward(heap, ref, {"getOwnPropertyDescriptor"}), key)

\\* Whether an object or one of its prototypes is a proxy, whose traps a walk up them runs.
RECURSIVE ReachesProxy(_, _)
ReachesProxy(heap, ref) ==
  \\/ IsProxy(heap, ref)
  \\/ LET prototype == Prototype(heap, ref) IN prototype # Null /\\ ReachesProxy(heap, prototype)

\\* The kind of Intl object whose internal slots a getter reads, or "" for other getters.
LOCAL IntlGetterKind(path) ==
  CASE HasPrefix(path, "get Intl.Collator.prototype.") -> "Collator"
    [] HasPrefix(path, "get Intl.NumberFormat.prototype.") -> "NumberFormat"
    [] HasPrefix(path, "get Intl.DateTimeFormat.prototype.") -> "DateTimeFormat"
    [] HasPrefix(path, "get Intl.Locale.prototype.") -> "Locale"
    [] OTHER -> ""

LOCAL IntlReceives(heap, kind, receiver) ==
  /\\ IsHeap(receiver)
  /\\ "intl" \\in DOMAIN heap.objects[receiver[Ref]]
  /\\ heap.objects[receiver[Ref]].intl = kind

\\* Whether a getter or a method throws its TypeError on another object only after it walks the
\\* object's prototypes, as NumberFormat's and DateTimeFormat's do for the objects that legacy code
\\* makes.
LOCAL IntlMayWalk(heap, kind, receiver) ==
  /\\ kind \\in {"NumberFormat", "DateTimeFormat"}
  /\\ IsRef(receiver)
  /\\ ReachesProxy(heap, receiver)

\\* What one of those getters gives for the kind of object it reads: the function that a compare or
\\* a format getter gives, bound to the object. The rest read locale data.
LOCAL IntlGet(heap, path, receiver) ==
  CASE IntlReceives(heap, IntlGetterKind(path), receiver) /\\
       heap.objects[receiver[Ref]].bound # Undefined ->
         heap.objects[receiver[Ref]].bound
    [] IntlReceives(heap, IntlGetterKind(path), receiver) ->
         Assert(FALSE, "tla-ts can't read locale data")
    [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of a getter on another kind of object")

\\* Whether a method of an Intl prototype throws the TypeError of a receiver that isn't the kind of
\\* object it reads, which it does before it reads its arguments. NumberFormat's and DateTimeFormat's
\\* resolvedOptions unwrap their receiver first.
IntlThrows(heap, kind, unwraps, receiver) ==
  CASE IntlReceives(heap, kind, receiver) -> Assert(FALSE, "tla-ts can't read locale data")
    [] unwraps /\\ IntlMayWalk(heap, kind, receiver) ->
         Assert(FALSE, "tla-ts can't run a proxy's internal method here")
    [] OTHER -> TRUE

RECURSIVE Has(_, _, _)
Has(heap, ref, key) ==
  CASE IsProxy(heap, ref) -> Has(heap, ForwardTarget(heap, ref, {"has"}), key)
    [] IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> HasElement(heap, ref, key)
    [] OTHER ->
         LET object == ReadPropertiesOf(heap, ref, key)
         IN \\/ key \\in DOMAIN object.values
            \\/ object.prototype # Null /\\ Has(heap, object.prototype, key)

LOCAL HasOwnOf(heap, ref, key) ==
  IF IsTypedArray(heap, ref) /\\ TypedKey(key) # "property"
  THEN HasElement(heap, ref, key)
  ELSE key \\in DOMAIN PropertiesOf(heap, ref, key).values

HasOwn(heap, ref, key) == HasOwnOf(heap, Forward(heap, ref, {"getOwnPropertyDescriptor"}), key)

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
IsSequenceValue(value) ==
  ~IsRef(value) /\\ TypeOf(value) = "object" /\\ SubSeq(ToString(value), 1, 2) = "<<"

LOCAL IsRegExp(heap, value) == IsHeap(value) /\\ "regexp" \\in DOMAIN heap.objects[value[Ref]]

\\* Whether a value has no [[RegExpMatcher]]: a primitive, a function, or an object that the heap holds
\\* that isn't a regexp. tla-ts may hold other objects that are regexps outside the heap.
LacksRegExpMatcher(heap, value) ==
  \\/ value = Null
  \\/ TypeOfIn(heap, value) # "object"
  \\/ IsHeap(value) /\\ ~IsRegExp(heap, value)

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

\\* The @@species getters of the built-in constructors, which give the receiver.
LOCAL SpeciesGetters ==
  {"get " \\o owner \\o ".@@species" :
     owner \\in {"Array", "RegExp", "Map", "Set", "Promise", "ArrayBuffer", "SharedArrayBuffer"}}

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
    \\* A proxy without a get trap reads its target, with the proxy as the receiver.
    [] IsProxy(heap, ref) -> GetFrom(heap, ForwardTarget(heap, ref, {"get"}), key, receiver)
    [] OTHER ->
         LET object == ReadPropertiesOf(heap, ref, key)
             path == GetterPath(object.values[key].get)
         IN CASE key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path \\in ViewGetters -> ViewGet(heap, path, receiver)
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path \\in RegExpGetters -> RegExpGet(heap, path, receiver)
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path \\in SpeciesGetters -> receiver
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ IntlGetterKind(path) # "" -> IntlGet(heap, path, receiver)
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path = "get Symbol.prototype.description" ->
                   CASE IsSymbol(receiver) -> SymbolDescription(heap, receiver)
                     [] IsHeap(receiver) /\\ "symbol" \\in DOMAIN Lookup(heap, receiver) ->
                          SymbolDescription(heap, Lookup(heap, receiver).symbol)
                     [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of this getter")
              [] key \\in DOMAIN object.values /\\ object.attributes[key].kind = "accessor"
                   /\\ path = "get Object.prototype.__proto__" /\\ IsRef(receiver)
                   /\\ ~IsProxy(heap, receiver) ->
                   Prototype(heap, receiver)
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

\\* A read of a property of a value whose type doesn't tell what it is: an object, an array, an error,
\\* or a function. tla-ts stops at a primitive, and at undefined or null, whose read throws.
GetAny(heap, value, key) ==
  CASE value \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of reading a property of undefined or null")
    [] IsRef(value) \\/ IsSequenceValue(value) \\/ IsError(value) \\/ TypeOf(value) = "function" ->
         Get(heap, value, key)
    [] OTHER -> Assert(FALSE, "tla-ts can't read a property of this value")

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
\\* heap, so it may have a then only where some object does. A script can't give a function that a
\\* function makes a property, so it has a then only where its prototypes do, which for an async
\\* function are AsyncFunction.prototype, which a script can't reach, and Function.prototype.
IsThenable(heap, value, arrayPrototype, objectPrototype) ==
  IF IsRef(value)
  THEN IF IsHeap(value) /\\ heap.objects[value[Ref]].isOpaque
       THEN CASE IsGeneratorObject(heap, value) -> HasAnyThen(heap)
              [] "code" \\in DOMAIN heap.objects[value[Ref]] ->
                   TypeOfIn(heap, Get(heap, heap.objects[value[Ref]].prototype, "then")) = "function"
              [] OTHER -> TRUE
       ELSE TypeOfIn(heap, Get(heap, value, "then")) = "function"
  ELSE /\\ value # Null
       /\\ TypeOf(value) = "object"
       /\\ Has(heap, arrayPrototype, "then") \\/ Has(heap, objectPrototype, "then")

\\* Whether a value is an object on the heap, or an array off it, whose then a job can call.
HasCallableThen(heap, value) ==
  /\\ IsRef(value) \\/ IsSequenceValue(value)
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

LOCAL ObjectKeysOf(heap, ref) == ElementKeys(heap, ref) \\o EnumerableKeys(OrdinaryOf(heap, ref))

ObjectKeys(heap, ref) == ObjectKeysOf(heap, Forward(heap, ref, {"ownKeys", "getOwnPropertyDescriptor"}))

ObjectValues(heap, ref) ==
  LET keys == ObjectKeys(heap, ref)
  IN  Read([position \\in DOMAIN keys |-> Get(heap, ref, keys[position])])

\\* The object of keys and values that a spread or a rest element copies from a proxy.
RECURSIVE PutPairs(_, _)
PutPairs(object, pairs) ==
  IF pairs = <<>> THEN object ELSE PutPairs(Put(object, Head(pairs)[1], Head(pairs)[2]), Tail(pairs))

PairsObject(pairs) == PutPairs(EmptyObject, pairs)

\\* The object that an object pattern's rest element makes, which holds the enumerable own properties
\\* of the object that the pattern reads, except those it names, in their order.
\\* The rest of an object, where read holds the values that its getters gave, or of a proxy, the
\\* keys and values that its traps gave.
RestObject(heap, ref, excluded, read) ==
  IF IsProxy(heap, ref) THEN PairsObject(read) ELSE
  LET keys == SelectSeq(EnumerableOwnKeys(Lookup(heap, ref)), LAMBDA key : key \\notin excluded)
      kept == {keys[position] : position \\in DOMAIN keys}
  IN [EmptyObject EXCEPT !.keys = keys,
                         !.values = Read([key \\in kept |->
                                           IF key \\in DOMAIN read THEN read[key]
                                           ELSE Get(heap, ref, key)]),
                         !.attributes = [key \\in kept |-> Writable]]

\\* The rest of a primitive, which holds what the object that wraps it owns: a string's characters
\\* under their indices, and nothing for another primitive.
RestPrimitive(value) ==
  IF value \\in {Undefined, Null}
  THEN Assert(FALSE, "tla-ts can't throw the TypeError of destructuring " \\o ToString(value))
  ELSE LET length == IF TypeOf(value) = "string" THEN Len(value) ELSE 0
           keys == {ToString(position - 1) : position \\in 1..length}
       IN [EmptyObject EXCEPT !.keys = [position \\in 1..length |-> ToString(position - 1)],
                              !.values = [key \\in keys |->
                                           SubSeq(value, ToIndex(key) + 1, ToIndex(key) + 1)],
                              !.attributes = [key \\in keys |-> Writable]]

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
    [] IsBig(value) -> IF IsNegative(value) THEN 0 ELSE BeyondInteger
    [] TypeOf(value) = "number" -> IF value < 0 THEN 0 ELSE value
    [] TypeOf(value) = "string" -> ToLengthOfText(value)
    [] value = <<>> -> 0
    [] OTHER -> Assert(FALSE, "tla-ts can't convert " \\o ToString(value) \\o " to a length")

\\* The accessor that a write to a key calls, which the object or a prototype holds, or Undefined
\\* where the write makes or changes a data property.
RECURSIVE AccessorOf(_, _, _)
AccessorOf(heap, ref, key) ==
  LET object == PropertiesOf(heap, ref, key)
  IN CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> Undefined
       [] key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor" THEN object.values[key] ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorOf(heap, object.prototype, key)

\\* An error record's own properties are data, as is the constructor that Get reads from its record,
\\* and it inherits the others from its constructor's prototype.
RECURSIVE AccessorFieldOf(_, _, _, _)
AccessorFieldOf(heap, ref, key, field) ==
  LET object == PropertiesOf(heap, ref, key)
  IN CASE ~IsRef(ref) /\\ IsError(ref) ->
            IF \\/ key = "message" /\\ ref.message # ""
               \\/ key \\in DOMAIN ref \\ {"constructor", "identity", "message", "name"}
               \\/ key = "constructor" /\\ ~IsHeap(ref.constructor) /\\ ~IsBuiltIn(ref.constructor)
            THEN Undefined
            ELSE AccessorFieldOf(heap, Get(heap, ref.constructor, "prototype"), key, field)
       [] IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> Undefined
       [] key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor"
            THEN object.values[key][field]
            ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorFieldOf(heap, object.prototype, key, field)

GetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "get")

\\* The code of the first getter that RegExp.prototype's flags getter reads of an object that isn't
\\* a regexp, as it reads the flags in order, or Undefined.
FlagsFirstGetter(heap, receiver) ==
  LET keys == <<"hasIndices", "global", "ignoreCase", "multiline", "dotAll", "unicode",
                "unicodeSets", "sticky">>
      read == {position \\in DOMAIN keys : GetterOf(heap, receiver, keys[position]) # Undefined}
      first == CHOOSE position \\in read : \\A other \\in read : position <= other
  IN IF IsHeap(receiver) /\\ ~IsProxy(heap, receiver) /\\ read # {}
     THEN CodeOf(heap, GetterOf(heap, receiver, keys[first]))
     ELSE Undefined

\\* The code of the getter that a read of a key of an object runs, or Undefined.
KeyGetter(heap, ref, key) ==
  IF IsHeap(ref) /\\ ~IsProxy(heap, ref) /\\ GetterOf(heap, ref, key) # Undefined
  THEN CodeOf(heap, GetterOf(heap, ref, key))
  ELSE Undefined

\\* The code of the getter that an array-like object's first element reads, where its length isn't
\\* 0, or Undefined.
FirstElementGetter(heap, ref) ==
  IF ToLength(Get(heap, ref, "length")) > 0 /\\ GetterOf(heap, ref, "0") # Undefined
  THEN CodeOf(heap, GetterOf(heap, ref, "0"))
  ELSE Undefined

SetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "set")

\\* The getter that an object that the heap holds reads its then through, where it isn't a promise, a
\\* generator, or a proxy, whose then tla-ts reads otherwise.
ThenGetter(heap, value) ==
  IF IsHeap(value) /\\ ~heap.objects[value[Ref]].isOpaque /\\ ~IsProxy(heap, value)
  THEN GetterOf(heap, value, "then")
  ELSE Undefined

\\* Whether a value is a built-in method or getter that throws a TypeError where a call gives it no
\\* receiver, as its first step requires an object, a value of its own kind, or a constructor.
\\* Object.prototype's toString and isPrototypeOf, Function.prototype[@@hasInstance], and the
\\* @@toStringTag getters give a value instead.
ThrowsWithoutReceiver(value) ==
  /\\ IsRef(value)
  /\\ TypeOf(value[Ref]) = "string"
  /\\ LET path == value[Ref]
         isUnder(prefix) == Len(path) > Len(prefix) /\\ SubSeq(path, 1, Len(prefix)) = prefix
     IN /\\ \\/ \\E name \\in {"Array", "%Int8Array", "String", "RegExp", "Number", "Boolean",
                            "Symbol", "BigInt", "Date", "Map", "Set", "WeakMap", "WeakSet",
                            "Function", "Error", "ArrayBuffer", "DataView", "Promise", "Object",
                            "WeakRef", "FinalizationRegistry"} :
                isUnder(name \\o ".prototype.") \\/ isUnder("get " \\o name \\o ".prototype.")
           \\/ path \\in {"%Int8Array.[[Prototype]]%.from", "%Int8Array.[[Prototype]]%.of"}
        /\\ path \\notin {"Function.prototype.@@hasInstance", "Object.prototype.toString",
                         "Object.prototype.isPrototypeOf"}
        /\\ ~(Len(path) >= 13 /\\ SubSeq(path, Len(path) - 12, Len(path)) = "@@toStringTag")

\\* Whether a value is a function that only returns a literal, and the literal it returns.
IsConstantFunction(value) == value \\in DOMAIN ConstantFunctions

ConstantResult(value) == ConstantFunctions[value]

\\* Whether a value is a built-in that gives a value where a call gives it no receiver:
\\* Object.prototype.toString, Function.prototype[@@hasInstance], and the @@toStringTag getter of
\\* typed arrays.
HasReceiverlessValue(value) ==
  /\\ IsRef(value)
  /\\ TypeOf(value[Ref]) = "string"
  /\\ value[Ref] \\in {"Object.prototype.toString", "Function.prototype.@@hasInstance",
                     "get %Int8Array.prototype.[[Prototype]]%.@@toStringTag"}

ReceiverlessValue(value) ==
  CASE value[Ref] = "Object.prototype.toString" -> "[object Undefined]"
    [] value[Ref] = "Function.prototype.@@hasInstance" -> FALSE
    [] OTHER -> Undefined

\\* The TypeError that a read throws where it runs %ThrowTypeError% or a getter of a buffer or a view
\\* on another kind of object, or "".
ReadError(heap, ref, key) ==
  LET path == GetterPath(GetterOf(heap, ref, key))
  IN IF \\/ path = "get Function.prototype.arguments"
        \\/ path \\in ViewGetters /\\ ~ViewReceives(heap, path, ref)
        \\/ /\\ IntlGetterKind(path) # ""
           /\\ ~IntlReceives(heap, IntlGetterKind(path), ref)
           /\\ ~IntlMayWalk(heap, IntlGetterKind(path), ref)
     THEN "TypeError"
     ELSE ""

\\* Whether a write runs the __proto__ setter of Object.prototype.
IsProtoWrite(heap, ref, key) == GetterPath(SetterOf(heap, ref, key)) = "set Object.prototype.__proto__"

RECURSIVE IsWritable(_, _, _)
IsWritable(heap, ref, key) ==
  LET object == PropertiesOf(heap, ref, key)
  IN IF key \\in DOMAIN object.values
     THEN object.attributes[key].writable
     ELSE object.prototype = Null \\/ IsWritable(heap, object.prototype, key)

\\* Whether a write runs %ThrowTypeError%, the setter of Function.prototype's arguments and caller,
\\* which throws a TypeError outside strict mode too.
IsThrowingSet(heap, ref, key) ==
  LET accessor == AccessorOf(heap, ref, key)
  IN /\\ ~(IsTypedArray(heap, ref) /\\ TypedKey(key) # "property")
     /\\ accessor # Undefined
     /\\ accessor.set # Undefined
     /\\ GetterPath(accessor.set) = "get Function.prototype.arguments"

\\* Whether a write puts its value without a TypeError.
LOCAL CanPutOf(heap, ref, key) ==
  LET accessor == AccessorOf(heap, ref, key)
      object == PropertiesOf(heap, ref, key)
  IN CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> TRUE
       [] accessor = Undefined ->
            /\\ IsWritable(heap, ref, key)
            /\\ key \\in DOMAIN object.values \\/ object.extensible
       [] OTHER -> accessor.set # Undefined /\\ ~IsThrowingSet(heap, ref, key)

CanPut(heap, ref, key) == CanPutOf(heap, Forward(heap, ref, {"set", "getOwnPropertyDescriptor", "defineProperty"}), key)

RECURSIVE IsPrototypeOf(_, _, _)
IsPrototypeOf(heap, owner, ref) ==
  LET prototype == Prototype(heap, ref)
  IN /\\ prototype # Null
     /\\ \\/ ToString(prototype) = ToString(owner)
        \\/ IsPrototypeOf(heap, owner, prototype)

\\* The prototype of a generator object or an iterator helper, where tla-ts holds it: a generator
\\* object starts with the Object.prototype of GeneratorObject only where tla-ts doesn't.
GeneratorPrototype(heap, ref) ==
  LET prototype == heap.objects[ref[Ref]].prototype
  IN IF ToString(prototype) = ToString(GeneratorObject.prototype)
     THEN Assert(FALSE, "tla-ts can't tell what a generator inherits from")
     ELSE prototype

\\* Whether a generator or an iterator helper inherits from a prototype.
GeneratorInheritsFrom(heap, owner, ref) ==
  LET prototype == GeneratorPrototype(heap, ref)
  IN ToString(prototype) = ToString(owner) \\/ IsPrototypeOf(heap, owner, prototype)

\\* Whether a value of any type inherits from a prototype, where only an object can.
InheritsFrom(heap, owner, value) ==
  CASE IsRef(value) -> IsPrototypeOf(heap, owner, value)
    [] value = Null \\/ TypeOf(value) \\notin {"object", "function"} -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell what this value inherits from")

\\* Whether a value has an [[ErrorData]] slot, as an error has, and not a proxy of one.
HasErrorData(heap, value) ==
  IF IsRef(value)
  THEN IsHeap(value) /\\ "isError" \\in DOMAIN heap.objects[value[Ref]]
  ELSE IsError(value)

\\* Whether a value that may be any value is an error that one of the constructors made.
IsErrorOf(value, constructors) == IsError(value) /\\ value.constructor \\in constructors

\\* Whether a value that may be any value, or an object on the heap, is an error that one of the
\\* constructors made.
IsInstanceOfError(heap, value, constructors, name) ==
  CASE IsRef(value) /\\ ~IsPrototypeOf(heap, Ref :> "Error.prototype", value) -> FALSE
    [] IsRef(value) ->
         Assert(FALSE, "tla-ts can't tell whether this object is an instance of " \\o name)
    [] OTHER -> IsErrorOf(value, constructors)

\\* A typed array's element can't be deleted, and a key that is a number and no element has nothing to
\\* delete.
LOCAL CanDeleteOf(heap, ref, key) ==
  IF IsTypedArray(heap, ref) /\\ TypedKey(key) # "property"
  THEN ~HasElement(heap, ref, key)
  ELSE LET object == LookupKey(heap, ref, key)
       IN key \\notin DOMAIN object.values \\/ object.attributes[key].configurable

CanDelete(heap, ref, key) == CanDeleteOf(heap, Forward(heap, ref, {"deleteProperty"}), key)

LOCAL DeleteOf(heap, ref, key) ==
  LET object == LookupKey(heap, ref, key)
      kept == DOMAIN object.values \\ {key}
  IN CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" -> heap
       [] key \\in DOMAIN object.values ->
            Update(heap, ref, [object EXCEPT !.keys = SelectSeq(@, LAMBDA other : other # key),
                                             !.values = [other \\in kept |-> @[other]],
                                             !.attributes = [other \\in kept |-> @[other]]])
       [] OTHER -> heap

Delete(heap, ref, key) == DeleteOf(heap, Forward(heap, ref, {"deleteProperty"}), key)

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

\\* Whether two values are surely not the same value. Two arrays outside the heap whose lengths or
\\* elements differ are two arrays, while two that are equal may still be two.
RECURSIVE Differs(_, _)
Differs(left, right) ==
  CASE TypeOf(left) # TypeOf(right) -> TRUE
    [] IsRef(left) \\/ IsRef(right) -> ToString(left) # ToString(right)
    \\* A number beyond TLC's integers has one form, which TLC can't compare with an integer.
    [] IsBig(left) \\/ IsBig(right) -> ToString(left) # ToString(right)
    [] HasIdentity(left) \\/ HasIdentity(right) -> left # right
    [] IsSequenceValue(left) /\\ IsSequenceValue(right) ->
         \\/ Len(left) # Len(right)
         \\/ \\E position \\in DOMAIN left : Differs(left[position], right[position])
    [] OTHER -> FALSE

SameValue(left, right) ==
  /\\ ~Differs(left, right)
  /\\ Assert(HasIdentity(left) \\/ HasIdentity(right), "tla-ts can't compare objects by identity")

\\* JavaScript's ===, where NaN differs from itself and -0 equals 0.
StrictEquals(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN left # NaN /\\ right # NaN /\\ SameValue(Magnitude(left), Magnitude(right))
  ELSE SameValue(left, right)

\\* What includes and Set compare by, where NaN equals itself and -0 equals 0.
SameValueZero(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN SameValue(Magnitude(left), Magnitude(right))
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
    [] IsWide(value) -> WideText(value)
    \\* Doubles holds the text of each Double that a literal gives.
    [] IsDouble(value) /\\ \\E position \\in DOMAIN Doubles : Doubles[position].binary = value[Double] ->
         Doubles[CHOOSE position \\in DOMAIN Doubles : Doubles[position].binary = value[Double]].text
    [] IsDouble(value) -> Assert(FALSE, "tla-ts can't write this number")
    [] TypeOf(value) = "number" -> ToString(value)
    [] IsBigInt(value) -> ToString(value[Big])
    [] OTHER -> Assert(FALSE, "tla-ts can't convert objects to strings")

\\* What String.raw gives for a template object and substitutions: whether it throws a TypeError, and
\\* the text that it joins otherwise. tla-ts stops where String.raw would call a getter, a proxy's
\\* trap, or an object's conversion method.
RECURSIVE RawSegments(_, _, _, _, _, _)
LOCAL RawSegments(heap, raw, length, substitutions, index, text) ==
  LET segment == Get(heap, raw, ToString(index))
      substitution == substitutions[index + 1]
  IN CASE index >= length -> [isThrown |-> FALSE, text |-> text]
       [] IsSymbol(segment) -> [isThrown |-> TRUE, text |-> ""]
       [] index + 1 = length -> [isThrown |-> FALSE, text |-> text \\o StringOf(segment)]
       [] index >= Len(substitutions) ->
            RawSegments(heap, raw, length, substitutions, index + 1, text \\o StringOf(segment))
       [] IsSymbol(substitution) -> [isThrown |-> TRUE, text |-> ""]
       [] OTHER ->
            RawSegments(heap, raw, length, substitutions, index + 1,
                        text \\o StringOf(segment) \\o StringOf(substitution))

StringRaw(heap, template, substitutions) ==
  LET Readable(value) == (IsHeap(value) /\\ ~IsProxy(heap, value)) \\/ IsSequenceValue(value)
      raw == Get(heap, template, "raw")
      length == Get(heap, raw, "length")
  IN CASE template \\in {Undefined, Null} -> [isThrown |-> TRUE, text |-> ""]
       [] ~Readable(template) -> Assert(FALSE, "tla-ts can't run String.raw on this template")
       [] raw \\in {Undefined, Null} -> [isThrown |-> TRUE, text |-> ""]
       [] ~Readable(raw) -> Assert(FALSE, "tla-ts can't run String.raw on this template")
       [] IsSymbol(length) -> [isThrown |-> TRUE, text |-> ""]
       [] OTHER -> RawSegments(heap, raw, ToLength(length), substitutions, 0, "")

\\* What Node prints for a promise that rejects with a primitive and that nothing handles, but for
\\* the stack frames.
UnhandledRejection(reason) ==
  IF reason \\in {Undefined, Null} \\/ TypeOf(reason) \\in {"boolean", "string", "number", "bigint"}
  THEN "node:internal/process/promises:392\\n      new UnhandledPromiseRejection(reason);\\n      ^\\n\\nUnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason \\"" \\o StringOf(reason) \\o "\\". {\\n  code: 'ERR_UNHANDLED_REJECTION'\\n}"
  ELSE "A promise rejected with no handler"

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

\\* Whether a built-in method throws a TypeError on a receiver, as one does on undefined or null
\\* where it needs a receiver, and as one that needs an internal slot, or a primitive of its own
\\* type, does on another primitive or on an ordinary object or array.
ThrowsOnReceiver(heap, value, receiver) ==
  /\\ IsRef(value)
  /\\ TypeOf(value[Ref]) = "string"
  /\\ LET path == value[Ref]
         isUnder(name) ==
           \\E prefix \\in {name \\o ".", "get " \\o name \\o "."} :
             Len(path) > Len(prefix) /\\ SubSeq(path, 1, Len(prefix)) = prefix
         isEnding(suffix) ==
           Len(path) >= Len(suffix) /\\ SubSeq(path, Len(path) - Len(suffix) + 1, Len(path)) = suffix
         isMethod == ~isEnding(".constructor") /\\ ~isEnding("@@toStringTag") /\\ ~isEnding("@@hasInstance")
         isPrimitive == ~IsRef(receiver) /\\ TypeOf(receiver) \\notin {"object", "function"}
         isOrdinary ==
           \\/ IsSequenceValue(receiver)
           \\/ /\\ IsHeap(receiver)
              /\\ LET object == heap.objects[receiver[Ref]]
                 IN /\\ DOMAIN object \\ {"isArray", "isArguments"} = DOMAIN EmptyObject
                    /\\ ~object.isOpaque
                    /\\ ~object.isCallable
         \\* The type of the primitive that a wrapper object holds, or "".
         wrapped ==
           IF IsHeap(receiver) /\\ "primitive" \\in DOMAIN heap.objects[receiver[Ref]]
           THEN TypeOf(heap.objects[receiver[Ref]].primitive)
           ELSE ""
         \\* An object without the internal slot a method needs: an ordinary one, a wrapper, or a
         \\* function, which holds no slot of these but [[Call]].
         isSlotless(isFunctionHeld) ==
           \\/ isOrdinary
           \\/ wrapped # ""
           \\/ isFunctionHeld /\\ TypeOfIn(heap, receiver) = "function"
     IN \\/ receiver \\in {Undefined, Null} /\\ ThrowsWithoutReceiver(value)
        \\* Error.prototype.toString converts the message, whose ToPrimitive finds no method to call
        \\* where its data properties hold neither toString nor valueOf as a function.
        \\/ /\\ path = "Error.prototype.toString"
           /\\ IsHeap(receiver)
           /\\ ~IsProxy(heap, receiver)
           /\\ GetterOf(heap, receiver, "name") = Undefined
           /\\ TypeOf(Get(heap, receiver, "name")) \\in {"undefined", "string"}
           /\\ GetterOf(heap, receiver, "message") = Undefined
           /\\ LET message == Get(heap, receiver, "message")
              IN /\\ IsHeap(message)
                 /\\ ~IsProxy(heap, message)
                 /\\ \\A key \\in {"toString", "valueOf", WellKnownSymbol("toPrimitive")} :
                      /\\ GetterOf(heap, message, key) = Undefined
                      /\\ TypeOfIn(heap, Get(heap, message, key)) # "function"
        \\* catch invokes the receiver's then, which a data property holds that isn't a function.
        \\/ /\\ path = "Promise.prototype.catch"
           /\\ IsHeap(receiver)
           /\\ ~IsProxy(heap, receiver)
           /\\ ~heap.objects[receiver[Ref]].isOpaque
           /\\ GetterOf(heap, receiver, "then") = Undefined
           /\\ TypeOfIn(heap, Get(heap, receiver, "then")) # "function"
        \\/ /\\ isMethod
           /\\ \\/ \\E name \\in {"Map.prototype", "Set.prototype", "WeakMap.prototype",
                             "WeakSet.prototype", "WeakRef.prototype", "FinalizationRegistry.prototype",
                             "%GeneratorFunction%.prototype.prototype",
                             "%RegExpStringIteratorPrototype%"} :
                   isUnder(name)
              \\/ path = "Promise.prototype.then"
           /\\ receiver \\in {Undefined, Null} \\/ isPrimitive \\/ isSlotless(TRUE)
        \\/ /\\ isMethod
           /\\ isUnder("Function.prototype")
           /\\ receiver \\in {Undefined, Null} \\/ isPrimitive \\/ isSlotless(FALSE)
        \\/ /\\ isMethod
           /\\ \\E pair \\in {<<"Symbol", "symbol">>, <<"BigInt", "bigint">>, <<"Number", "number">>,
                          <<"Boolean", "boolean">>} :
                /\\ isUnder(pair[1] \\o ".prototype")
                /\\ \\/ isPrimitive /\\ TypeOf(receiver) # pair[2]
                   \\/ wrapped \\notin {"", pair[2]}
                   \\/ isOrdinary
                   \\/ TypeOfIn(heap, receiver) = "function"

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

\\* OrdinaryHasInstance from the prototype that an object's [[GetPrototypeOf]] gives, which reads the
\\* function's prototype and walks on from there.
HasInstanceFrom(heap, function, prototype) ==
  LET owner == Get(heap, function, "prototype")
  IN /\\ prototype # Null
     /\\ \\/ SameValue(prototype, owner)
        \\/ IsPrototypeOf(heap, owner, prototype)

\\* Whether an object reaches the built-in function at a key that it reaches where no script changed a
\\* built-in object.
HoldsOverriddenBuiltIn(heap, ref, key) ==
  LET read == Get(heap, ref, key)
  IN /\\ IsRef(read)
     /\\ ~IsHeap(read)
     /\\ SameValue(read, Get([heap EXCEPT !.changed = <<>>], ref, key))

\\* ToLength of an object's length, where a String, Number, or Boolean object converts to what it
\\* holds while its valueOf is still the built-in one and nothing gives it @@toPrimitive. A statement
\\* converts any other object first.
LengthOf(heap, ref) ==
  LET value == Get(heap, ref, "length")
      kind == CASE TypeOf(Lookup(heap, value).primitive) = "boolean" -> "Boolean"
                [] TypeOf(Lookup(heap, value).primitive) = "number" -> "Number"
                [] OTHER -> "String"
  IN IF /\\ IsHeap(value)
        /\\ "primitive" \\in DOMAIN Lookup(heap, value)
        /\\ HoldsBuiltIn(heap, value, "valueOf", kind \\o ".prototype.valueOf")
        /\\ Get(heap, value, WellKnownSymbol("toPrimitive")) = Undefined
     THEN ToLength(Lookup(heap, value).primitive)
     ELSE ToLength(value)

RECURSIVE KeyCount(_, _)
KeyCount(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN Len(object.keys) + IF object.prototype = Null THEN 0 ELSE KeyCount(heap, object.prototype)

\\* The elements of an array-like object, which has an element at each index below its length.
ArrayLike(heap, ref) ==
  LET length == LengthOf(heap, ref)
  IN IF \\/ length > KeyCount(heap, ref)
        \\/ \\E position \\in 0..(length - 1) : ~Has(heap, ref, ToString(position))
     THEN Assert(FALSE, "tla-ts can't read an array-like object with holes")
     ELSE Read([position \\in 1..length |-> Get(heap, ref, ToString(position - 1))])

\\* The value at a position of an array that concat makes, and whether the array has an element there.
Present(value) == [isPresent |-> TRUE, value |-> value]

PresentParts(elements) == [position \\in DOMAIN elements |-> Present(elements[position])]

\\* The parts of an array-like object at each index below its length, where a hole that no prototype
\\* fills is no element.
ArrayLikeParts(heap, ref) ==
  Read([position \\in 1..LengthOf(heap, ref) |->
          IF Has(heap, ref, ToString(position - 1))
          THEN Present(Get(heap, ref, ToString(position - 1)))
          ELSE [isPresent |-> FALSE, value |-> Undefined]])

\\* An iterator of an array's keys, values, or entries, which reads the array as next steps it, so
\\* that it sees what the script changes in the array meanwhile.
ArrayIterator(heap, array, kind, prototype) ==
  LET allocated == Allocate(heap, [EmptyObject EXCEPT !.prototype = prototype]
                                    @@ [iterated |-> array, index |-> 0, kind |-> kind])
  IN [heap |-> allocated, value |-> Allocated(allocated), isThrown |-> FALSE]

\\* A typed array's iterator, where a call on another value, or on a typed array out of bounds,
\\* throws a TypeError, as ValidateTypedArray does.
TypedArrayIterator(heap, ref, kind, prototype) ==
  IF IsTypedArray(heap, ref) /\\ ~IsOutOfBounds(heap, heap.objects[ref[Ref]])
  THEN ArrayIterator(heap, ref, kind, prototype)
  ELSE [heap |-> heap, value |-> Undefined, isThrown |-> TRUE]

\\* The values of an array-like object at each index below its length, which Get reads, so that a
\\* hole gives what a prototype holds there, or undefined.
ArrayLikeValues(heap, ref) ==
  LET length == LengthOf(heap, ref)
  IN IF length > KeyCount(heap, ref)
     THEN Assert(FALSE, "tla-ts can't read an array-like object this long")
     ELSE Read([position \\in 1..length |-> Get(heap, ref, ToString(position - 1))])

RECURSIVE IndexKeys(_, _)
IndexKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN {key \\in DOMAIN object.values : IsIndex(key)}
       \\cup IF object.prototype = Null THEN {} ELSE IndexKeys(heap, object.prototype)

\\* Whether a key is an index below 2^31 - 1, which TLC's integers hold with the length past it.
LOCAL IsShortIndex(key) == IsIndex(key) /\\ (Len(key) < 10 \\/ DigitsBelow(key, "2147483647"))

\\* The indices below 2^31 - 1 that an object or its prototypes hold, which are all those below a
\\* length that TLC's integers hold.
LOCAL HeldIndices(heap, ref) == {ToIndex(key) : key \\in {key \\in IndexKeys(heap, ref) : IsShortIndex(key)}}

\\* The position that a loop over an array-like object visits after a hole, in its order: the next
\\* index that the object or a prototype holds, as no other has a property. A typed array, a proxy,
\\* or an object that tla-ts follows may have others.
NextElementPosition(heap, ref, position, length, isReversed) ==
  IF ~IsHeap(ref) \\/ IsTypedArray(heap, ref) \\/ IsProxy(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque
  THEN IF isReversed THEN position - 1 ELSE position + 1
  ELSE LET held == {index + 1 : index \\in HeldIndices(heap, ref)}
           later == {other \\in held :
                       IF isReversed THEN other < position ELSE other > position /\\ other <= length}
       IN CASE later = {} -> IF isReversed THEN 0 ELSE length + 1
            [] isReversed -> CHOOSE other \\in later : \\A more \\in later : more <= other
            [] OTHER -> CHOOSE other \\in later : \\A more \\in later : other <= more

\\* Whether a length is Infinity or an integer past 2^31, which ToLength clamps to 2^53 - 1, and
\\* which lies past every index that TLC's integers hold.
LOCAL IsLong(length) ==
  \\/ length = Infinity
  \\/ IsWide(length) /\\ ~IsNegative(length)
  \\/ IsDouble(length) /\\ ~IsNegative(length) /\\ length[Double][2] >= 0

\\* The integer of a key of decimal digits from 10 on, below 2^53.
RECURSIVE DecimalOf(_)
DecimalOf(text) ==
  IF Len(text) <= 9
  THEN ParseDigits(text, 10)
  ELSE Add(Multiply(DecimalOf(SubSeq(text, 1, Len(text) - 9)), 1000000000),
           ParseDigits(SubSeq(text, Len(text) - 8, Len(text)), 10))

\\* Whether a key is an integer below 2^53 in its canonical decimal form.
LOCAL IsLongKey(key) ==
  /\\ ~IsSymbol(key)
  /\\ Len(key) > 0
  /\\ Len(key) <= 16
  /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\ {"-"}
  /\\ Len(key) = 1 \\/ SubSeq(key, 1, 1) # "0"
  /\\ Len(key) < 16 \\/ DigitsBelow(key, "9007199254740992")

\\* The keys below 2^53 that an object or its prototypes hold.
RECURSIVE LongKeys(_, _)
LongKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN {key \\in DOMAIN object.values : IsLongKey(key)}
       \\cup IF object.prototype = Null THEN {} ELSE LongKeys(heap, object.prototype)

\\* The length that a loop over an array-like object visits, past which a length beyond 2^31 holds
\\* only holes: one more than the greatest index that the object or its prototypes hold.
HeldLength(heap, ref, length) ==
  CASE ~IsLong(length) -> ToLength(length)
    [] \\E key \\in LongKeys(heap, ref) : Len(key) >= 10 ->
         Assert(FALSE, "tla-ts can't order keys this big")
    [] IndexKeys(heap, ref) = {} -> 0
    [] OTHER ->
         LET held == HeldIndices(heap, ref)
         IN 1 + CHOOSE greatest \\in held : \\A other \\in held : other <= greatest

\\* The elements that an array-like object or its prototypes hold below its length, in order, with
\\* their indices. The array methods that skip holes visit these. A record holds the length, so TLC
\\* reads it even when no element is present.
PresentElements(heap, ref) ==
  LET raw == Get(heap, ref, "length")
      isBeyond == IsLong(raw)
      length == IF isBeyond THEN raw ELSE LengthOf(heap, ref)
      present == {position \\in HeldIndices(heap, ref) :
                    isBeyond \\/ position < length}
      indices == [position \\in 1..Cardinality(present) |->
                   CHOOSE element \\in present :
                     Cardinality({other \\in present : other < element}) = position - 1]
  IN IF isBeyond /\\ \\E key \\in LongKeys(heap, ref) : Len(key) >= 10
     THEN Assert(FALSE, "tla-ts can't order keys this big")
     ELSE [length |-> length,
           indices |-> indices,
           values |-> Read([position \\in DOMAIN indices |-> Get(heap, ref, ToString(indices[position]))])]

\\* Whether a function's call is still Function.prototype.call, which it reads from
\\* Function.prototype where the heap holds no object of its own for it.
CallsThroughBuiltIn(heap, function, functionPrototype) ==
  HoldsBuiltIn(heap,
               IF IsHeap(function) \\/ BuiltInKey(function) \\in DOMAIN BuiltIns
               THEN function
               ELSE functionPrototype,
               "call", "Function.prototype.call")

\\* Whether instanceof runs OrdinaryHasInstance on a function, as it does where the function's
\\* @@hasInstance is Function.prototype's, or where it has none.
IsOrdinaryHasInstance(heap, function) ==
  LET handler == Get(heap, function, WellKnownSymbol("hasInstance"))
  IN SameValue(handler, Undefined) \\/ SameValue(handler, Ref :> "Function.prototype.@@hasInstance")

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
          /\\ "symbol" \\in DOMAIN Lookup(heap, value)
          /\\ HoldsBuiltIn(heap, value, "valueOf", "Symbol.prototype.valueOf") ->
            Lookup(heap, value).symbol
       [] /\\ IsHeap(value)
          /\\ "bigint" \\in DOMAIN Lookup(heap, value)
          /\\ HoldsBuiltIn(heap, value, "valueOf", "BigInt.prototype.valueOf") ->
            Lookup(heap, value).bigint
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

\\* The symbol that Symbol.prototype.valueOf reads from the value that it calls the method on, a
\\* symbol or a Symbol object, while Symbol.prototype holds the built-in method.
ThisSymbol(heap, value) ==
  CASE ~HoldsBuiltIn(heap, Ref :> "Symbol.prototype", "valueOf", "Symbol.prototype.valueOf") ->
         Assert(FALSE, "tla-ts can't call Symbol.prototype.valueOf where a script replaced it")
    [] IsSymbol(value) -> value
    [] IsHeap(value) /\\ "symbol" \\in DOMAIN Lookup(heap, value) -> Lookup(heap, value).symbol
    [] OTHER -> Assert(FALSE, "tla-ts can't call a Symbol.prototype method on a value that isn't a symbol")

\\* Whether Symbol.prototype.valueOf, while Symbol.prototype holds the built-in method, throws the
\\* TypeError of a value that is neither a symbol nor a Symbol object.
ThisSymbolThrows(heap, value) ==
  /\\ HoldsBuiltIn(heap, Ref :> "Symbol.prototype", "valueOf", "Symbol.prototype.valueOf")
  /\\ ~IsSymbol(value)
  /\\ ~(IsHeap(value) /\\ "symbol" \\in DOMAIN Lookup(heap, value))

\\* The BigInt that BigInt.prototype.valueOf reads from a BigInt or a BigInt object, while
\\* BigInt.prototype holds the built-in method.
ThisBigIntObject(heap, value) ==
  CASE ~HoldsBuiltIn(heap, Ref :> "BigInt.prototype", "valueOf", "BigInt.prototype.valueOf") ->
         Assert(FALSE, "tla-ts can't call BigInt.prototype.valueOf where a script replaced it")
    [] IsBigInt(value) -> value
    [] IsHeap(value) /\\ "bigint" \\in DOMAIN Lookup(heap, value) -> Lookup(heap, value).bigint
    [] OTHER -> Assert(FALSE, "tla-ts can't call a BigInt.prototype method on a value that isn't a BigInt")

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
    [] IsBig(value) -> BeyondInteger
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

LOCAL AsciiCodes ==
  [character \\in CharactersOf(AsciiCharacters) |->
     CHOOSE code \\in 0..127 : SubSeq(AsciiCharacters, code + 1, code + 1) = character]

\\* The codes of the characters of ASCII and of the code units outside it that a script's text holds,
\\* which tla-ts tells the codes of only.
LOCAL CharacterCodes ==
  LET others == {Characters[position] : position \\in DOMAIN Characters}
  IN  AsciiCodes @@ [character \\in {other.character : other \\in others} |->
                       (CHOOSE other \\in others : other.character = character).code]

\\* The code units below the surrogates and above them, in order.
LOCAL LowCodeUnits == ${formatString(Array.from({ length: 0xd800 }, (_, code) => String.fromCharCode(code)).join(""))}

LOCAL HighCodeUnits == ${formatString(Array.from({ length: 0x2000 }, (_, offset) => String.fromCharCode(0xe000 + offset)).join(""))}

\\* Each high surrogate before the low surrogate at the same offset, since TLA+ strings hold only
\\* text that UTF-8 can encode, where a surrogate is only a part of a pair.
LOCAL SurrogatePairs == ${formatString(Array.from({ length: 0x400 }, (_, offset) => String.fromCharCode(0xd800 + offset, 0xdc00 + offset)).join(""))}

\\* The code unit that a code below 2^16 gives.
LOCAL CodeUnit(code) ==
  LET position == CASE code < 55296 -> code + 1
                    [] code < 56320 -> 2 * (code - 55296) + 1
                    [] code < 57344 -> 2 * (code - 56320) + 2
                    [] OTHER -> code - 57343
      units == CASE code < 55296 -> LowCodeUnits [] code < 57344 -> SurrogatePairs [] OTHER -> HighCodeUnits
  IN  SubSeq(units, position, position)

\\* String.fromCharCode, which takes each code modulo 2^16, or String.fromCodePoint, which throws a
\\* RangeError for a number that isn't a code point and writes one past 2^16 as a surrogate pair.
LOCAL FromCharCode(code, isCodePoint) ==
  LET point == CASE code \\in {NaN, Infinity, NegativeInfinity, NegativeZero} -> 0
                 [] isCodePoint /\\ IsBig(code) -> BeyondInteger
                 [] isCodePoint -> code
                 [] IsBig(code) -> Int32(code) % 65536
                 [] OTHER -> IntegerOf(code) % 65536
  IN  CASE isCodePoint /\\ (code \\in {NaN, Infinity, NegativeInfinity} \\/ IsFraction(code) \\/ point < 0 \\/ point > 1114111) ->
             Assert(FALSE, "tla-ts can't throw the RangeError of String.fromCodePoint")
        [] point >= 65536 ->
             CodeUnit(55296 + (point - 65536) \\div 1024) \\o CodeUnit(56320 + ((point - 65536) % 1024))
        [] OTHER -> CodeUnit(point)

\\* The codes from index first to last, joined as halves so that the recursion is only as deep as the
\\* logarithm of their count, and the strings it makes are as long in all as that times the count.
RECURSIVE FromCharCodesBetween(_, _, _, _)
LOCAL FromCharCodesBetween(codes, isCodePoint, first, last) ==
  CASE first > last -> ""
    [] first = last -> FromCharCode(codes[first], isCodePoint)
    [] OTHER ->
         LET middle == (first + last) \\div 2
         IN  FromCharCodesBetween(codes, isCodePoint, first, middle)
               \\o FromCharCodesBetween(codes, isCodePoint, middle + 1, last)

FromCharCodes(codes, isCodePoint) == FromCharCodesBetween(codes, isCodePoint, 1, Len(codes))

\\* The code of a code unit, which charCodeAt reads.
LOCAL CharacterCode(character) ==
  IF character \\in DOMAIN CharacterCodes
  THEN CharacterCodes[character]
  ELSE Assert(FALSE, "tla-ts can't tell the code of a character outside ASCII")

LOCAL IsHighSurrogate(code) == code >= 55296 /\\ code <= 56319

LOCAL IsLowSurrogate(code) == code >= 56320 /\\ code <= 57343

\\* The code of the character at an index, or outside where the index is out of range.
LOCAL CodeAt(value, index, outside) ==
  LET text == Text(value)
      position == IntegerOf(index)
  IN  IF position \\notin {Infinity, NegativeInfinity} /\\ position >= 0 /\\ position < Len(text)
      THEN CharacterCode(SubSeq(text, position + 1, position + 1))
      ELSE outside

CharCodeAt(value, index) == CodeAt(value, index, NaN)

\\* String.prototype.codePointAt, which reads a surrogate pair's code point, and otherwise the code.
CodePointAt(value, index) ==
  LET first == CodeAt(value, index, Undefined)
      second == CodeAt(value, IntegerOf(index) + 1, Undefined)
  IN  IF first # Undefined /\\ IsHighSurrogate(first) /\\ second # Undefined /\\ IsLowSurrogate(second)
      THEN (first - 55296) * 1024 + second - 56320 + 65536
      ELSE first

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
                 [] OTHER -> IntegerOf(limit)
      head == IF count < 0 \\/ count > Len(text) THEN text ELSE SubSeq(text, 1, count)
  IN  CASE count = 0 -> <<>>
        [] separator = Undefined -> <<text>>
        [] Text(separator) = "" ->
             [position \\in 1..Len(head) |-> SubSeq(head, position, position)]
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

LOCAL HighSurrogates == {SubSeq(SurrogatePairs, 2 * offset + 1, 2 * offset + 1) : offset \\in 0..1023}

LOCAL LowSurrogates == {SubSeq(SurrogatePairs, 2 * offset + 2, 2 * offset + 2) : offset \\in 0..1023}

\\* Whether the code unit at a position is a surrogate without its other half beside it.
LOCAL IsLoneSurrogateAt(text, position) ==
  LET character == SubSeq(text, position, position)
  IN  \\/ /\\ character \\in HighSurrogates
         /\\ (position = Len(text) \\/ SubSeq(text, position + 1, position + 1) \\notin LowSurrogates)
      \\/ /\\ character \\in LowSurrogates
         /\\ (position = 1 \\/ SubSeq(text, position - 1, position - 1) \\notin HighSurrogates)

\\* String.prototype.isWellFormed, which tells whether a string holds no lone surrogate.
IsWellFormed(value) ==
  LET text == Text(value)
  IN  IsAscii(text) \\/ \\A position \\in 1..Len(text) : ~IsLoneSurrogateAt(text, position)

\\* The code units from position first to last, with U+FFFD for each lone surrogate, joined as halves.
RECURSIVE WellFormedBetween(_, _, _)
LOCAL WellFormedBetween(text, first, last) ==
  CASE first > last -> ""
    [] first = last ->
         IF IsLoneSurrogateAt(text, first) THEN CodeUnit(65533) ELSE SubSeq(text, first, first)
    [] OTHER ->
         LET middle == (first + last) \\div 2
         IN  WellFormedBetween(text, first, middle) \\o WellFormedBetween(text, middle + 1, last)

\\* String.prototype.toWellFormed, which writes U+FFFD for each lone surrogate.
ToWellFormed(value) ==
  LET text == Text(value)
  IN  IF IsWellFormed(text) THEN text ELSE WellFormedBetween(text, 1, Len(text))

\\* String.prototype.normalize, which leaves a string of ASCII as it is in every form, gives the form
\\* of a string that the script writes or a form of one, and throws a RangeError for any other form.
StringNormalize(value, form) ==
  LET text == Text(value)
      known == {Normals[position] : position \\in DOMAIN Normals}
      found == {normal \\in known : normal.text = text}
  IN  CASE form # Undefined /\\ form \\notin {"NFC", "NFD", "NFKC", "NFKD"} ->
             Assert(FALSE, "tla-ts can't throw the RangeError of normalize")
        [] IsAscii(text) -> text
        [] found # {} -> (CHOOSE normal \\in found : TRUE)[IF form = Undefined THEN "NFC" ELSE form]
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

LOCAL HexDigit(value) == SubSeq(HexDigits, value + 1, value + 1)

LOCAL HexByte(byte) == "%" \\o HexDigit(byte \\div 16) \\o HexDigit(byte % 16)

\\* The escapes of the bytes of a code point's UTF-8.
LOCAL UTF8Escapes(point) ==
  LET tail(shift) == HexByte(128 + ((point \\div shift) % 64))
  IN  CASE point < 128 -> HexByte(point)
        [] point < 2048 -> HexByte(192 + point \\div 64) \\o tail(1)
        [] point < 65536 -> HexByte(224 + point \\div 4096) \\o tail(64) \\o tail(1)
        [] OTHER -> HexByte(240 + point \\div 262144) \\o tail(4096) \\o tail(64) \\o tail(1)

\\* encodeURI and encodeURIComponent, which escape each code point but those in kept as the bytes of
\\* its UTF-8 and throw a URIError for a lone surrogate, or Annex B's escape, which escapes each code
\\* unit below 256 as %XX and any other as %uXXXX.
RECURSIVE EncodeURI(_, _, _)
EncodeURI(text, kept, isEscape) ==
  IF text = ""
  THEN ""
  ELSE LET character == SubSeq(text, 1, 1)
           code == CharacterCode(character)
           next == CharacterCode(SubSeq(text, 2, 2))
           isPair == ~isEscape /\\ IsHighSurrogate(code) /\\ Len(text) >= 2 /\\ IsLowSurrogate(next)
           width == IF isPair THEN 2 ELSE 1
           encoded ==
             CASE character \\in kept -> character
               [] isEscape /\\ code < 256 -> HexByte(code)
               [] isEscape ->
                    "%u" \\o HexDigit(code \\div 4096) \\o HexDigit((code \\div 256) % 16)
                      \\o HexDigit((code \\div 16) % 16) \\o HexDigit(code % 16)
               [] isPair -> UTF8Escapes((code - 55296) * 1024 + next - 56320 + 65536)
               [] IsHighSurrogate(code) \\/ IsLowSurrogate(code) ->
                    Assert(FALSE, "tla-ts can't throw the URIError of encodeURI")
               [] OTHER -> UTF8Escapes(code)
       IN  encoded \\o EncodeURI(SubSeq(text, width + 1, Len(text)), kept, isEscape)

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
    [] ByteAt(text, 1) >= 128 ->
         LET count == UTF8Length(ByteAt(text, 1))
             rest(index) == ByteAt(text, 3 * index - 2) - 128
             point == CASE count = 2 -> (ByteAt(text, 1) - 192) * 64 + rest(2)
                        [] count = 3 -> (ByteAt(text, 1) - 224) * 4096 + rest(2) * 64 + rest(3)
                        [] OTHER ->
                             (ByteAt(text, 1) - 240) * 262144 + rest(2) * 4096 + rest(3) * 64
                               + rest(4)
         IN  FromCharCodes(<<point>>, TRUE)
               \\o DecodeURI(SubSeq(text, 3 * count + 1, Len(text)), reserved)
    [] OTHER ->
         LET character == SubSeq(AsciiCharacters, ByteAt(text, 1) + 1, ByteAt(text, 1) + 1)
         IN  (IF character \\in reserved THEN SubSeq(text, 1, 3) ELSE character)
               \\o DecodeURI(SubSeq(text, 4, Len(text)), reserved)

\\* unescape, of Annex B, which decodes each escape %XX and %uXXXX and keeps any other character,
\\* such as a % that starts neither.
RECURSIVE Unescape(_)
Unescape(text) ==
  LET isLong == /\\ Len(text) >= 6
                /\\ SubSeq(text, 1, 2) = "%u"
                /\\ \\A position \\in 3..6 : SubSeq(text, position, position) \\in DigitsOf(16)
      length == CASE isLong -> 6 [] IsEscapeAt(text, 1) -> 3 [] OTHER -> 1
      code == IF isLong THEN ByteAt(text, 2) * 256 + ByteAt(text, 4) ELSE ByteAt(text, 1)
  IN  CASE text = "" -> ""
        [] OTHER ->
             (CASE length = 1 -> SubSeq(text, 1, 1)
                [] code < 128 -> SubSeq(AsciiCharacters, code + 1, code + 1)
                [] OTHER -> CodeUnit(code))
               \\o Unescape(SubSeq(text, length + 1, Len(text)))

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

\\* The code points of a string outside ASCII, where a surrogate pair is one.
RECURSIVE CodePoints(_)
CodePoints(text) ==
  LET size == IF Len(text) >= 2
                 /\\ IsHighSurrogate(CharacterCode(SubSeq(text, 1, 1)))
                 /\\ IsLowSurrogate(CharacterCode(SubSeq(text, 2, 2)))
              THEN 2
              ELSE 1
  IN  IF text = "" THEN <<>> ELSE <<SubSeq(text, 1, size)>> \\o CodePoints(SubSeq(text, size + 1, Len(text)))

\\* The values that a for-of over a string or its spread visits, its code points.
StringCharacters(value) ==
  IF IsAscii(value)
  THEN [position \\in 1..Len(value) |-> SubSeq(value, position, position)]
  ELSE CodePoints(value)

LOCAL Lowercase == "abcdefghijklmnopqrstuvwxyz"

LOCAL Uppercase == "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

\\* The cases of the code points outside ASCII whose case changes, by code point.
LOCAL CaseChanges ==
  LET changes == {Cases[position] : position \\in DOMAIN Cases}
  IN  [point \\in {change.point : change \\in changes} |->
         CHOOSE change \\in changes : change.point = point]

\\* A code point in upper or lower case. The compiler lists each code point that the code units it
\\* knows make and whose case changes, so any other such code point keeps its case. A capital sigma
\\* lowers to a final sigma at the end of a word.
LOCAL RecasedPoint(point, isUpper) ==
  LET from == IF isUpper THEN Lowercase ELSE Uppercase
      to == IF isUpper THEN Uppercase ELSE Lowercase
  IN  CASE ~isUpper /\\ point = ${formatString("\u03a3")} ->
             Assert(FALSE, "tla-ts can't lower the case of a capital sigma")
        [] point \\in DOMAIN CaseChanges ->
             IF isUpper THEN CaseChanges[point].upper ELSE CaseChanges[point].lower
        [] point \\in CharactersOf(from) ->
             LET position == CHOOSE index \\in 1..26 : SubSeq(from, index, index) = point
             IN  SubSeq(to, position, position)
        [] \\A character \\in CharactersOf(point) : character \\in DOMAIN CharacterCodes -> point
        [] OTHER -> Assert(FALSE, "tla-ts can't change the case of a character outside ASCII")

RECURSIVE RecasedPoints(_, _)
RecasedPoints(points, isUpper) ==
  IF points = <<>> THEN "" ELSE RecasedPoint(Head(points), isUpper) \\o RecasedPoints(Tail(points), isUpper)

ToLowerCase(value) == RecasedPoints(StringCharacters(Text(value)), FALSE)

ToUpperCase(value) == RecasedPoints(StringCharacters(Text(value)), TRUE)

\\* An iterator of a string's characters, which reads them as next steps it.
StringIterator(heap, string, prototype) == ArrayIterator(heap, string, "string", prototype)

\\* The string that String.prototype[Symbol.iterator] reads through ToString: a string, or what a
\\* String object holds where it has no Symbol.toPrimitive and reads the built-in toString.
IteratedString(heap, value) ==
  CASE TypeOf(value) = "string" -> value
    [] Get(heap, value, WellKnownSymbol("toPrimitive")) = Undefined ->
         WrappedPrimitive(heap, value, "String", "toString")
    [] OTHER -> Assert(FALSE, "tla-ts can't read the string of an object with a Symbol.toPrimitive")

\\* A step of an array's or a string's iterator, which forgets what it iterates once done: the heap
\\* after it, the value it gives, and whether it's done.
BuiltInIteratorStep(heap, ref) ==
  LET iterator == heap.objects[ref[Ref]]
      iterated == iterator.iterated
      index == iterator.index
      isString == iterator.kind = "string"
      isDone == \\/ iterated = Undefined
                \\/ index >= CASE isString -> Len(StringCharacters(iterated))
                              [] IsTypedArray(heap, iterated) ->
                                   IF IsOutOfBounds(heap, heap.objects[iterated[Ref]])
                                   THEN Assert(FALSE, "tla-ts can't throw the TypeError of stepping a typed array out of bounds")
                                   ELSE ViewLength(heap, heap.objects[iterated[Ref]])
                              [] OTHER -> ToLength(Get(heap, iterated, "length"))
      element == IF isString THEN StringCharacters(iterated)[index + 1] ELSE Get(heap, iterated, ToString(index))
      value == CASE isDone -> Undefined
                 [] iterator.kind = "keys" -> index
                 [] iterator.kind \\in {"values", "string"} -> element
                 [] OTHER -> <<index, element>>
      stepped == [heap EXCEPT !.objects[ref[Ref]] =
                    IF isDone THEN [@ EXCEPT !.iterated = Undefined] ELSE [@ EXCEPT !.index = index + 1]]
  IN [heap |-> stepped, value |-> value, isDone |-> isDone]

\\* Whether an array's or a string's iterator reads the built-in next.
HoldsIteratorNext(heap, ref) ==
  HoldsBuiltIn(heap, ref, "next",
               IF heap.objects[ref[Ref]].kind = "string"
               THEN "%StringIteratorPrototype%.next"
               ELSE "%ArrayIteratorPrototype%.next")

\\* %ArrayIteratorPrototype%.next or %StringIteratorPrototype%.next, which gives a new result object.
BuiltInIteratorNext(heap, ref, isString) ==
  IF /\\ IsHeap(ref)
     /\\ "iterated" \\in DOMAIN heap.objects[ref[Ref]]
     /\\ (heap.objects[ref[Ref]].kind = "string") = isString
  THEN LET step == BuiltInIteratorStep(heap, ref)
           allocated == Allocate(step.heap, IteratorResult(step.value, step.isDone))
       IN [heap |-> allocated, value |-> Allocated(allocated), isThrown |-> FALSE]
  ELSE Assert(FALSE, "tla-ts can't step an iterator that isn't an array's or a string's with its next")

\\* Whether a value is %ArrayIteratorPrototype%.next or %StringIteratorPrototype%.next.
\\* A property of a value that may be a built-in function, which only a built-in's object tells.
BuiltInFunctionProperty(heap, value, key) ==
  IF IsBuiltIn(value)
  THEN Get(heap, value, key)
  ELSE Assert(FALSE, "tla-ts can't tell which function this value holds")

IsBuiltInIteratorNext(value) ==
  /\\ IsRef(value)
  /\\ TypeOf(value[Ref]) = "string"
  /\\ value[Ref] \\in {"%ArrayIteratorPrototype%.next", "%StringIteratorPrototype%.next"}

\\* A built-in iterator's next on a receiver, which throws a TypeError where the receiver isn't an
\\* iterator of the next's kind.
BuiltInIteratorStepOf(heap, ref, next) ==
  LET isString == next[Ref] = "%StringIteratorPrototype%.next"
  IN IF /\\ IsHeap(ref)
        /\\ "iterated" \\in DOMAIN heap.objects[ref[Ref]]
        /\\ (heap.objects[ref[Ref]].kind = "string") = isString
     THEN BuiltInIteratorNext(heap, ref, isString)
     ELSE [heap |-> heap, value |-> Undefined, isThrown |-> TRUE]

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
        [] IsBig(value) /\\ base # 10 -> BeyondInteger
        [] ~IsInteger(value) \\/ base = 10 -> StringOf(value)
        [] value < 0 -> "-" \\o RadixDigits(-value, base)
        [] OTHER -> RadixDigits(value, base)

RECURSIVE TrimZeros(_)
TrimZeros(text) ==
  IF Len(text) > 1 /\\ SubSeq(text, Len(text), Len(text)) = "0"
  THEN TrimZeros(SubSeq(text, 1, Len(text) - 1))
  ELSE text

\\* The digits of a number other than 0, without its sign, and the power of 10 of the first: those
\\* of its exact value, or the fewest that give it back.
LOCAL Decimal(value, isShortest) ==
  CASE IsFraction(value) /\\ isShortest ->
         [digits |-> Fractions[FractionPosition(value)].shortest,
          exponent |-> Fractions[FractionPosition(value)].shortestExponent]
    [] IsDouble(value) /\\ isShortest ->
         IF \\E position \\in DOMAIN Doubles : Doubles[position].binary = value[Double]
         THEN LET double == Doubles[CHOOSE position \\in DOMAIN Doubles :
                                      Doubles[position].binary = value[Double]]
              IN [digits |-> double.shortest, exponent |-> double.shortestExponent]
         ELSE Assert(FALSE, "tla-ts can't write this number")
    [] IsFraction(value) \\/ IsDouble(value) -> ExactDecimal(value)
    [] OTHER ->
         LET text == StringOf(Unsigned(Magnitude(value)))
         IN [digits |-> IF isShortest THEN TrimZeros(text) ELSE text, exponent |-> Len(text) - 1]

RECURSIVE Incremented(_)
Incremented(text) ==
  IF text = ""
  THEN "1"
  ELSE LET last == DigitValue(SubSeq(text, Len(text), Len(text)))
       IN IF last = 9
          THEN Incremented(SubSeq(text, 1, Len(text) - 1)) \\o "0"
          ELSE SubSeq(text, 1, Len(text) - 1) \\o SubSeq("0123456789", last + 2, last + 2)

\\* The first count digits, rounded half up on the exact digits after them, which is the larger n of
\\* two equally near, as toFixed, toExponential, and toPrecision pick. A carry adds a digit.
LOCAL RoundedDigits(digits, count) ==
  CASE count < 0 -> "0"
    [] count = 0 -> IF DigitValue(SubSeq(digits, 1, 1)) >= 5 THEN "1" ELSE "0"
    [] count >= Len(digits) -> digits \\o Repeated("0", count - Len(digits))
    [] DigitValue(SubSeq(digits, count + 1, count + 1)) >= 5 -> Incremented(SubSeq(digits, 1, count))
    [] OTHER -> SubSeq(digits, 1, count)

\\* A number's count significant digits, and the power of 10 of the first.
LOCAL Significant(value, count) ==
  LET decimal == Decimal(value, FALSE)
      rounded == RoundedDigits(decimal.digits, count)
  IN IF Len(rounded) > count
     THEN [digits |-> SubSeq(rounded, 1, count), exponent |-> decimal.exponent + 1]
     ELSE [digits |-> rounded, exponent |-> decimal.exponent]

LOCAL SignOf(value) == IF IsNegative(value) /\\ ~IsZero(value) THEN "-" ELSE ""

LOCAL Mantissa(digits) ==
  IF Len(digits) = 1 THEN digits ELSE SubSeq(digits, 1, 1) \\o "." \\o SubSeq(digits, 2, Len(digits))

LOCAL ExponentText(exponent) ==
  IF exponent >= 0 THEN "e+" \\o ToString(exponent) ELSE "e-" \\o ToString(-exponent)

\\* Whether toFixed, toExponential, or toPrecision throws the RangeError of its digits argument,
\\* which toExponential and toPrecision check only for a finite number, and toPrecision only where
\\* the argument isn't undefined.
NumberMethodThrows(method, value, argument) ==
  LET count == IntegerOf(argument)
      isOutside(least) == count \\in Infinities \\/ count < least \\/ count > 100
  IN CASE method = "toFixed" -> isOutside(0)
       [] method = "toExponential" -> IsFinite(value) /\\ isOutside(0)
       [] OTHER -> argument # Undefined /\\ IsFinite(value) /\\ isOutside(1)

\\* Number.prototype.toFixed, which writes a number with digits digits after the point.
NumberToFixed(value, digits) ==
  LET count == IntegerOf(digits)
      decimal == Decimal(value, FALSE)
      integer == IF IsZero(value) THEN "0" ELSE RoundedDigits(decimal.digits, decimal.exponent + 1 + count)
      padded == IF Len(integer) <= count THEN Repeated("0", count + 1 - Len(integer)) \\o integer ELSE integer
  IN CASE count \\in Infinities \\/ count < 0 \\/ count > 100 ->
            Assert(FALSE, "tla-ts can't throw the RangeError of toFixed")
       [] ~IsFinite(value) -> StringOf(value)
       [] ~IsZero(value) /\\ decimal.exponent >= 21 -> StringOf(value)
       [] count = 0 -> SignOf(value) \\o integer
       [] OTHER -> SignOf(value) \\o SubSeq(padded, 1, Len(padded) - count) \\o "."
                     \\o SubSeq(padded, Len(padded) - count + 1, Len(padded))

\\* Number.prototype.toExponential, which writes a number with digits digits after the point, or
\\* with the fewest that give it back.
NumberToExponential(value, digits) ==
  LET count == IntegerOf(digits)
      decimal == IF digits = Undefined THEN Decimal(value, TRUE) ELSE Significant(value, count + 1)
  IN CASE ~IsFinite(value) -> StringOf(value)
       [] count \\in Infinities \\/ count < 0 \\/ count > 100 ->
            Assert(FALSE, "tla-ts can't throw the RangeError of toExponential")
       [] IsZero(value) -> Mantissa(Repeated("0", count + 1)) \\o "e+0"
       [] OTHER -> SignOf(value) \\o Mantissa(decimal.digits) \\o ExponentText(decimal.exponent)

\\* Number.prototype.toPrecision, which writes a number with precision significant digits.
NumberToPrecision(value, precision) ==
  LET count == IntegerOf(precision)
      decimal == IF IsZero(value) THEN [digits |-> Repeated("0", count), exponent |-> 0]
                 ELSE Significant(value, count)
      exponent == decimal.exponent
  IN CASE precision = Undefined \\/ ~IsFinite(value) -> StringOf(value)
       [] count \\in Infinities \\/ count < 1 \\/ count > 100 ->
            Assert(FALSE, "tla-ts can't throw the RangeError of toPrecision")
       [] exponent < -6 \\/ exponent >= count ->
            SignOf(value) \\o Mantissa(decimal.digits) \\o ExponentText(exponent)
       [] exponent = count - 1 -> SignOf(value) \\o decimal.digits
       [] exponent >= 0 ->
            SignOf(value) \\o SubSeq(decimal.digits, 1, exponent + 1) \\o "."
              \\o SubSeq(decimal.digits, exponent + 2, count)
       [] OTHER -> SignOf(value) \\o "0." \\o Repeated("0", -(exponent + 1)) \\o decimal.digits

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

RECURSIVE LowercaseHex(_, _)
\\* A code's width lowercase hexadecimal digits.
LowercaseHex(code, width) ==
  IF width = 0
  THEN ""
  ELSE LowercaseHex(code \\div 16, width - 1)
         \\o SubSeq("0123456789abcdef", (code % 16) + 1, (code % 16) + 1)

\\* A code point's escape as a code unit's \\x or each code unit's \\u.
LOCAL HexEscape(character) ==
  IF Len(character) = 1 /\\ CharacterCode(character) <= 255
  THEN "\\\\x" \\o LowercaseHex(CharacterCode(character), 2)
  ELSE "\\\\u" \\o LowercaseHex(CharacterCode(character), 4)

\\* EncodeForRegExpEscape, which escapes a code point that a pattern reads as syntax, punctuation that
\\* some contexts do, white space, and a lone surrogate.
LOCAL RegExpEscaped(character) ==
  LET controls == ("\\t" :> "t") @@ ("\\n" :> "n") @@ ("\u000B" :> "v") @@ ("\\f" :> "f") @@ ("\\r" :> "r")
  IN  CASE character \\in CharactersOf("^$\\\\.*+?()[]{}|/") -> "\\\\" \\o character
        [] character \\in DOMAIN controls -> "\\\\" \\o controls[character]
        [] \\/ character \\in CharactersOf(",-=<>#&!%:;@~'\`\\"")
           \\/ character \\in Spaces
           \\/ /\\ Len(character) = 1
              /\\ \\/ IsHighSurrogate(CharacterCode(character))
                 \\/ IsLowSurrogate(CharacterCode(character)) ->
             HexEscape(character)
        [] OTHER -> character

RECURSIVE RegExpEscapedAll(_)
RegExpEscapedAll(characters) ==
  IF characters = <<>> THEN "" ELSE RegExpEscaped(Head(characters)) \\o RegExpEscapedAll(Tail(characters))

\\* RegExp.escape, which escapes a leading decimal digit or ASCII letter too.
RegExpEscape(value) ==
  LET characters == StringCharacters(Text(value))
  IN  IF characters # <<>> /\\ Head(characters) \\in CharactersOf(Alphanumerics)
      THEN HexEscape(Head(characters)) \\o RegExpEscapedAll(Tail(characters))
      ELSE RegExpEscapedAll(characters)

\\* Regular expressions. The compiler gives a pattern as the tree of matchers that the spec's
\\* CompilePattern makes, and RegExpStep runs a matcher with the continuation that a stack of frames
\\* holds, backtracking where the spec's continuations fail.
LOCAL RegExpFailure == [start |-> -1, end |-> -1, captures |-> <<>>]

LOCAL UppercaseOf ==
  [character \\in CharactersOf("abcdefghijklmnopqrstuvwxyz") |->
     LET position == CHOOSE position \\in 1..26 :
                       SubSeq("abcdefghijklmnopqrstuvwxyz", position, position) = character
     IN  SubSeq("ABCDEFGHIJKLMNOPQRSTUVWXYZ", position, position)]

\\* The characters outside ASCII that simple case folding maps into it, which the u and i flags
\\* match as the uppercase of their folding.
LOCAL UnicodeFolds == (${formatString("\u017f")} :> "S") @@ (${formatString("\u212a")} :> "K")

\\* Canonicalize of a character that a backreference compares, which is in ASCII where the other
\\* character is, as Canonicalize maps no other character outside ASCII into it.
LOCAL Canonical(regexp, character) ==
  CASE ~regexp.ignoreCase -> character
    [] character \\in DOMAIN UppercaseOf -> UppercaseOf[character]
    [] regexp.unicode /\\ character \\in DOMAIN UnicodeFolds -> UnicodeFolds[character]
    [] OTHER -> character

LOCAL LineTerminators == {"\\n", "\\r", ${formatString(" ")}, ${formatString(" ")}}

LOCAL WordCharacters == CharactersOf("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")

\\* The character at an index of a text, or the empty string outside it.
LOCAL CharacterAt(text, index) ==
  IF index >= 0 /\\ index < Len(text) THEN SubSeq(text, index + 1, index + 1) ELSE ""

\\* Whether the character at an index is a word character, which with the u and i flags those whose
\\* folding is are too.
LOCAL IsWordAt(regexp, text, index) ==
  \\/ CharacterAt(text, index) \\in WordCharacters
  \\/ regexp.unicode /\\ regexp.ignoreCase /\\ CharacterAt(text, index) \\in DOMAIN UnicodeFolds

\\* The code units of the character at an index that a regexp reads, where with the u flag a
\\* surrogate pair is one character.
LOCAL CharacterWidth(regexp, text, index) ==
  IF /\\ regexp.unicode
     /\\ index >= 0
     /\\ index + 1 < Len(text)
     /\\ IsHighSurrogate(CharacterCode(CharacterAt(text, index)))
     /\\ IsLowSurrogate(CharacterCode(CharacterAt(text, index + 1)))
  THEN 2
  ELSE 1

\\* Whether a class matches a character, where the compiler lists the characters that it matches
\\* among those in ASCII and those that the script's strings may hold.
LOCAL IsInClass(node, character) ==
  CASE character \\in node.characters -> TRUE
    [] \\A unit \\in CharactersOf(character) : unit \\in DOMAIN CharacterCodes -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell whether a class matches a character outside ASCII")

\\* Whether a backreference's characters are the same once canonicalized, which tla-ts tells for
\\* characters that differ only where one is an ASCII letter, digit, or underscore.
LOCAL IsSameCharacter(regexp, left, right) ==
  CASE left = right -> TRUE
    [] ~regexp.ignoreCase -> FALSE
    [] \\E character \\in {left, right} :
         character \\in WordCharacters \\/ (regexp.unicode /\\ character \\in DOMAIN UnicodeFolds) ->
         Canonical(regexp, left) = Canonical(regexp, right)
    [] OTHER -> Assert(FALSE, "tla-ts can't compare the case of characters that aren't ASCII letters")

\\* The capture of the groups that a backreference names, of which at most one took part, as groups
\\* in separate alternatives may share a name, or <<>> where none did.
LOCAL RegExpCaptureOf(captures, indices) ==
  LET matched == {indices[position] : position \\in DOMAIN indices} \\cap
                 {index \\in DOMAIN captures : captures[index] # <<>>}
  IN  IF matched = {} THEN <<>> ELSE captures[CHOOSE index \\in matched : TRUE]

\\* The index of the group with a name that took part in a match, or the first with it where none did.
LOCAL RegExpNamed(regexp, match, name) ==
  LET indices == regexp.names[name]
      matched == {indices[position] : position \\in DOMAIN indices} \\cap
                 {index \\in DOMAIN match.captures : match.captures[index] # <<>>}
  IN  IF matched = {} THEN indices[1] ELSE CHOOSE index \\in matched : TRUE

RECURSIVE RegExpStep(_, _, _, _, _)
RECURSIVE RegExpContinue(_, _, _, _)
RECURSIVE RegExpRepeat(_, _, _, _, _, _, _)

\\* The state that a matcher reaches from a state, then running the continuation that a stack
\\* holds, or RegExpFailure.
RegExpStep(regexp, text, node, state, stack) ==
  CASE node.kind = "set" ->
         LET width == CharacterWidth(regexp, text, state.end)
         IN  IF /\\ state.end < Len(text)
                /\\ IsInClass(node, SubSeq(text, state.end + 1, state.end + width))
             THEN RegExpContinue(regexp, text, [state EXCEPT !.end = @ + width], stack)
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
         IF state.end = 0 \\/ (node.multiline /\\ CharacterAt(text, state.end - 1) \\in LineTerminators)
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpFailure
    [] node.kind = "end" ->
         IF state.end = Len(text) \\/ (node.multiline /\\ CharacterAt(text, state.end) \\in LineTerminators)
         THEN RegExpContinue(regexp, text, state, stack)
         ELSE RegExpFailure
    [] node.kind = "boundary" ->
         LET flagged == [regexp EXCEPT !.ignoreCase = node.ignoreCase]
         IN  IF (IsWordAt(flagged, text, state.end - 1) # IsWordAt(flagged, text, state.end)) # node.isInverted
             THEN RegExpContinue(regexp, text, state, stack)
             ELSE RegExpFailure
    [] node.kind = "lookahead" ->
         LET found == RegExpStep(regexp, text, node.body, state, <<>>)
         IN  CASE node.isNegative /\\ found.end # -1 -> RegExpFailure
               [] node.isNegative -> RegExpContinue(regexp, text, state, stack)
               [] found.end = -1 -> RegExpFailure
               [] OTHER -> RegExpContinue(regexp, text, [state EXCEPT !.captures = found.captures], stack)
    [] node.kind = "backreference" ->
         LET captured == RegExpCaptureOf(state.captures, node.indices)
             length == IF captured = <<>> THEN 0 ELSE captured[2] - captured[1]
         IN  IF /\\ state.end + length <= Len(text)
                /\\ \\A offset \\in 0..(length - 1) :
                     IsSameCharacter([regexp EXCEPT !.ignoreCase = node.ignoreCase],
                                     CharacterAt(text, captured[1] + offset),
                                     CharacterAt(text, state.end + offset))
                /\\ length = 0 \\/ CharacterWidth(regexp, text, state.end + length - 1) = 1
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
       IN  IF found.end # -1 \\/ regexp.sticky
           THEN found
           ELSE RegExpSearch(regexp, text, index + CharacterWidth(regexp, text, index))

\\* The text of a match's capture, where 0 is the whole match, or undefined where it took no part.
LOCAL RegExpCapture(text, match, index) ==
  CASE index = 0 -> SubSeq(text, match.start + 1, match.end)
    [] match.captures[index] = <<>> -> Undefined
    [] OTHER -> SubSeq(text, match.captures[index][1] + 1, match.captures[index][2])

\\* The text of each named group of a match, by its name.
LOCAL RegExpGroups(regexp, text, match) ==
  [name \\in DOMAIN regexp.names |-> RegExpCapture(text, match, RegExpNamed(regexp, match, name))]

RECURSIVE RegExpMatches(_, _, _)
\\* The matches that a global regexp finds from an index on, where an empty match moves the next
\\* search one character past it, as AdvanceStringIndex does.
RegExpMatches(regexp, text, index) ==
  LET found == RegExpSearch(regexp, text, index)
  IN  IF found.end = -1
      THEN <<>>
      ELSE <<found>> \\o RegExpMatches(regexp, text,
                                         IF found.end = found.start
                                         THEN found.end + CharacterWidth(regexp, text, found.end)
                                         ELSE found.end)

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
             IN  (IF name \\in DOMAIN regexp.names THEN capture(RegExpNamed(regexp, match, name)) ELSE "")
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
           THEN RegExpSplitFrom(regexp, text, p, q + CharacterWidth(regexp, text, q))
           ELSE <<SubSeq(text, p + 1, q)>>
                  \\o [position \\in 1..regexp.captures |-> RegExpCapture(text, found, position)]
                  \\o RegExpSplitFrom(regexp, text, found.end, found.end)

\\* The most pieces that RegExp.prototype[@@split] gives, ToUint32 of a limit that is undefined or a
\\* number, where -1 is no limit, as ToUint32 of a negative integer is past any length.
RegExpSplitCount(limit) ==
  CASE limit = Undefined -> -1
    [] limit \\in {NaN, Infinity, NegativeInfinity, NegativeZero} -> 0
    [] IntegerOf(limit) < 0 -> -1
    [] OTHER -> IntegerOf(limit)

\\* The pieces that RegExp.prototype[@@split] gives, at most the count that its limit gives.
LOCAL RegExpPieces(regexp, text, limit) ==
  LET count == RegExpSplitCount(limit)
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
  LET text == Text(value)
      found == RegExpFirst(regexp, text)
  IN  IF found.end = -1 THEN Null ELSE RegExpArray(regexp, text, found)

RegExpTest(regexp, value) == RegExpFirst(regexp, Text(value)).end # -1

\\* The matches that RegExp.prototype[@@replace] and [@@match] read: each for a global regexp, which
\\* leaves lastIndex at 0, or else the first.
LOCAL RegExpMatched(regexp, text) ==
  IF regexp.global
  THEN RegExpMatches(regexp, text, 0)
  ELSE LET found == RegExpFirst(regexp, text) IN IF found.end = -1 THEN <<>> ELSE <<found>>

\\* String.prototype.replace through RegExp.prototype[@@replace], with a replacement template.
RegExpReplace(regexp, value, template) ==
  LET text == Text(value)
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
  ELSE RegExpMatched(regexp, Text(value))

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
  LET text == Text(value)
      matches == RegExpMatched(regexp, text)
  IN  CASE matches = <<>> -> Null
        [] regexp.global ->
             [key \\in {ToString(position - 1) : position \\in DOMAIN matches} \\cup {"length"} |->
                IF key = "length" THEN Len(matches) ELSE RegExpCapture(text, matches[ToIndex(key) + 1], 0)]
        [] OTHER -> RegExpArray(regexp, text, Head(matches))

\\* String.prototype.search through RegExp.prototype[@@search], which restores lastIndex.
RegExpSearchIndex(regexp, value) ==
  LET found == RegExpSearch(regexp, Text(value), 0)
  IN  IF found.end = -1 THEN -1 ELSE found.start

\\* String.prototype.split through RegExp.prototype[@@split].
RegExpSplit(regexp, value, limit) == RegExpPieces(regexp, Text(value), limit)

ToBoolean(value) ==
  CASE value \\in {Undefined, Null} -> FALSE
    [] TypeOf(value) = "boolean" -> value
    [] TypeOf(value) = "number" -> value # NaN /\\ ~IsZero(value)
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

\\* IsArray, which reads a proxy's target, where an array outside the heap is a sequence. The global
\\* object is an ordinary object.
RECURSIVE IsArray(_, _)
\\* Whether an array method throws the RangeError of making an array of an object's length, which is
\\* Infinity or an integer from 2^32, for an ordinary object that isn't an array and whose length is
\\* a data property.
ArrayCreateThrows(heap, ref) ==
  /\\ IsHeap(ref)
  /\\ ~IsProxy(heap, ref)
  /\\ ~heap.objects[ref[Ref]].isOpaque
  /\\ ~IsArray(heap, ref)
  \\* A length that a getter gives is left to the call, which runs the getter.
  /\\ GetterOf(heap, ref, "length") = Undefined
  /\\ LET length == Get(heap, ref, "length")
     IN \\/ length = Infinity
        \\/ IsWide(length) /\\ ~IsNegative(length) /\\ length[Wide][1] >= 2
        \\/ IsDouble(length) /\\ ~IsNegative(length) /\\ length[Double][2] >= 0

IsArray(heap, value) ==
  CASE IsRef(value) /\\ ~IsHeap(value) /\\ value = GlobalObject -> FALSE
    [] IsProxy(heap, value) ->
         IF ProxyHandler(heap, value) = Null
         THEN Assert(FALSE, "tla-ts can't throw the TypeError of a revoked proxy here")
         ELSE LET target == ProxyTarget(heap, value)
              IN \\/ ~IsRef(target) /\\ TypeOf(target) = "object" /\\ SubSeq(ToString(target), 1, 2) = "<<"
                 \\/ IsArray(heap, target)
    [] OTHER -> IsRef(value) /\\ IsArrayObject(Lookup(heap, value))

\\* The values that concat appends for an argument: the elements of an object whose
\\* @@isConcatSpreadable property is truthy, or of an array where that property is undefined, and
\\* otherwise the value itself.
ConcatSpread(heap, value) ==
  LET spreadable == IF IsRef(value)
                    THEN Get(heap, value, WellKnownSymbol("isConcatSpreadable"))
                    ELSE Undefined
  IN  IF IF spreadable = Undefined THEN IsArray(heap, value) ELSE ToBoolean(spreadable)
      THEN ArrayLike(heap, value)
      ELSE <<value>>

\\* The parts that concat appends for an argument, where the array that the heap holds keeps holes.
ConcatSpreadParts(heap, value) ==
  LET spreadable == IF IsRef(value)
                    THEN Get(heap, value, WellKnownSymbol("isConcatSpreadable"))
                    ELSE Undefined
  IN  IF IF spreadable = Undefined THEN IsArray(heap, value) ELSE ToBoolean(spreadable)
      THEN ArrayLikeParts(heap, value)
      ELSE <<Present(value)>>

\\* Whether a proxy or a proxy that it reads through is revoked, so that IsArray throws a TypeError.
RECURSIVE IsRevokedProxy(_, _)
IsRevokedProxy(heap, value) ==
  /\\ IsProxy(heap, value)
  /\\ ProxyHandler(heap, value) = Null \\/ IsRevokedProxy(heap, ProxyTarget(heap, value))

\\* The kind that Object.prototype.toString gives an object without a Symbol.toStringTag.
LOCAL ClassOf(heap, ref) ==
  CASE IsHeap(ref) /\\ IsArrayObject(Lookup(heap, ref)) -> "Array"
    [] IsHeap(ref) /\\ "isArguments" \\in DOMAIN Lookup(heap, ref) -> "Arguments"
    [] IsHeap(ref) /\\ "isError" \\in DOMAIN Lookup(heap, ref) -> "Error"
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
ForwardTarget(heap, ref, traps) ==
  CASE ~IsProxy(heap, ref) -> ref
    [] ProxyHandler(heap, ref) = Null ->
         Assert(FALSE, "tla-ts can't throw the TypeError of a revoked proxy's target")
    [] \\A trap \\in traps : Get(heap, ProxyHandler(heap, ref), trap) \\in {Undefined, Null} ->
         ForwardTarget(heap, ProxyTarget(heap, ref), traps)
    [] OTHER -> Assert(FALSE, "tla-ts can't run the traps that this reads a proxy through")

\\* Object.prototype.toString, which gives "[object Kind]". A value that isn't on the heap gives the
\\* kind of object that holds it, such as Array for a sequence, or a collection the Symbol.toStringTag
\\* of its prototype.
ObjectToString(heap, value, kind) ==
  "[object "
    \\o (CASE value = Undefined -> "Undefined"
          [] value = Null -> "Null"
          [] TypeOf(value) \\in {"number", "string", "boolean", "bigint", "symbol"} ->
               LET name == CASE TypeOf(value) = "number" -> "Number"
                             [] TypeOf(value) = "string" -> "String"
                             [] TypeOf(value) = "boolean" -> "Boolean"
                             [] TypeOf(value) = "bigint" -> "BigInt"
                             [] OTHER -> "Symbol"
               IN Tagged(heap, Ref :> (name \\o ".prototype"),
                         IF name \\in {"BigInt", "Symbol"} THEN "Object" ELSE name)
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
          [] kind \\in {"Map", "Set", "WeakMap", "WeakSet"} ->
               Tagged(heap, Ref :> (kind \\o ".prototype"), "Object")
          [] kind # "" -> kind
          [] OTHER -> Assert(FALSE, "tla-ts can't tell the kind of " \\o ToString(value)))
    \\o "]"

\\* An object's toString or toLocaleString, where it reads Object.prototype's, which calls the
\\* object's toString, and that's Object.prototype's too.
ObjectMethodString(heap, ref, method) ==
  IF /\\ HoldsBuiltIn(heap, ref, method, "Object.prototype." \\o method)
     /\\ HoldsBuiltIn(heap, ref, "toString", "Object.prototype.toString")
  THEN ObjectToString(heap, ref, "")
  ELSE Assert(FALSE, "tla-ts can't tell which method this call runs")

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
       [] /\\ IsHeap(ref)
          /\\ "bigint" \\in DOMAIN Lookup(heap, ref)
          /\\ isBuiltIn(valueOf, "BigInt.prototype.valueOf") ->
            Lookup(heap, ref).bigint
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
       [] path = "BigInt.prototype.valueOf" /\\ IsHeap(ref) /\\ "bigint" \\in DOMAIN Lookup(heap, ref) ->
            Lookup(heap, ref).bigint
       [] /\\ path = "Array.prototype.toString"
          /\\ IsSequenceValue(ref)
          /\\ \\A position \\in DOMAIN ref : ref[position] = Null \\/ TypeOf(ref[position]) # "object"
          /\\ HoldsBuiltIn(heap, ref, "join", "Array.prototype.join") ->
            JoinValues(ref, ",")
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
    [] IsSymbol(value) ->
         Assert(FALSE, "tla-ts can't throw the TypeError of converting a symbol to a number")
    [] OTHER -> Assert(FALSE, "tla-ts can't convert this " \\o TypeOf(value) \\o " to a number")

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
  IF value \\in SpecialNumbers \\/ IsBig(value)
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

ArrayObjectOfParts(prototype, parts) ==
  ArrayObjectWithHoles(prototype, [position \\in DOMAIN parts |-> parts[position].value],
                       {position \\in DOMAIN parts : ~parts[position].isPresent})

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

\\* The object that Object makes of a symbol or a BigInt, which holds it in a slot named symbol or
\\* bigint rather than the primitive slot of a Boolean, Number, or String object.
SlotObject(prototype, slot, value) == [EmptyObject EXCEPT !.prototype = prototype] @@ (slot :> value)

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
    [] IsBig(value) -> BeyondInteger
    [] OTHER -> value

LOCAL AreFinite(values) == \\A position \\in DOMAIN values : IsFinite(values[position])

\\* The quotient and the remainder of remainder * 2^(bit + 1) + low % 2^(bit + 1) by a divisor below
\\* 2^30, one bit at a time, after a quotient's bits so far.
RECURSIVE DivideLow(_, _, _, _, _)
DivideLow(remainder, low, bit, quotient, divisor) ==
  IF bit < 0
  THEN <<quotient, remainder>>
  ELSE LET next == 2 * remainder + ((low \\div 2^bit) % 2)
       IN IF next >= divisor
          THEN DivideLow(next - divisor, low, bit - 1, 2 * quotient + 1, divisor)
          ELSE DivideLow(next, low, bit - 1, 2 * quotient, divisor)

\\* The time value of a Wide integer, whose day is outside TLC's integers only past what TimeClip
\\* allows.
LOCAL WideTime(value) ==
  LET halves == Halves(value)
      low == DivideLow(halves[1] % MsPerDay, halves[2], 30, 0, MsPerDay)
      day == WideOf(<<halves[1] \\div MsPerDay, low[1]>>)
  IN IF IsWide(day) THEN NaN ELSE TimeClip([day |-> day, ms |-> low[2]])

\\* The time value that new Date or setTime makes from a number.
TimeFromNumber(value) ==
  CASE IsWide(value) -> WideTime(value)
    [] IsDouble(value) -> IF value[Double][2] >= 0 THEN NaN ELSE BeyondInteger
    [] IsFinite(value) -> TimeClip(TimeValue(0, ToIntegerOrInfinity(value)))
    [] OTHER -> NaN

\\* The number that a time value is.
TimeNumber(time) ==
  CASE time = NaN -> NaN
    [] time.day \\in -24..23 -> time.day * MsPerDay + time.ms
    [] time.day = 24 /\\ time.ms <= 73883647 -> 23 * MsPerDay + (time.ms + MsPerDay)
    [] time.day = -25 /\\ time.ms >= 12516352 -> -24 * MsPerDay + (time.ms - MsPerDay)
    [] OTHER -> Add(Multiply(time.day, MsPerDay), time.ms)

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
\\* An error that the heap holds, which has the slot that marks it as one.
ErrorObject(prototype) == [EmptyObject EXCEPT !.prototype = prototype] @@ [isError |-> TRUE]

\\* Error.prototype.toString, which writes the name and the message that an error has or inherits.
ErrorToString(heap, ref) ==
  LET name == Get(heap, ref, "name")
      message == Get(heap, ref, "message")
      nameText == IF name = Undefined THEN "Error" ELSE StringOf(name)
      messageText == IF message = Undefined THEN "" ELSE StringOf(message)
  IN CASE nameText = "" -> messageText
       [] messageText = "" -> nameText
       [] OTHER -> nameText \\o ": " \\o messageText

\\* An object that an Intl constructor makes, of a kind, which holds the function that its compare
\\* or format getter gives, bound to it, or Undefined.
IntlObject(prototype, kind, bound) ==
  [EmptyObject EXCEPT !.prototype = prototype] @@ [intl |-> kind, bound |-> bound]

DateObject(prototype, time) == [EmptyObject EXCEPT !.prototype = prototype] @@ [time |-> time]

\\* The time value that new Date takes from another Date.
TimeOfDate(heap, value) ==
  IF IsDate(heap, value)
  THEN Known(Lookup(heap, value).time)
  ELSE Assert(FALSE, "tla-ts can't convert " \\o ToString(value) \\o " to a time value")

\\* The time value of a Date that reads the built-in method from its prototype. getTimezoneOffset
\\* gives 0 for any time but NaN, as tla-ts takes local time to be UTC, so it needn't read the clock.
DateTime(heap, ref, method) ==
  IF IsDate(heap, ref) /\\ IsDateMethod(Get(heap, ref, method), method)
  THEN IF method = "getTimezoneOffset"
       THEN Lookup(heap, ref).time
       ELSE Known(Lookup(heap, ref).time)
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
\\* has given the regexp no property but its lastIndex and its own data properties of the keys in
\\* owned, and hasn't changed the built-in objects in changeable, which hold the methods that the
\\* call reads.
LOCAL RegExpOwning(heap, ref, changeable, owned) ==
  LET object == heap.objects[ref[Ref]]
  IN  IF /\\ IsRegExp(heap, ref)
         /\\ object.prototype = Ref :> "RegExp.prototype"
         /\\ object.keys[1] = "lastIndex"
         /\\ \\A position \\in 2..Len(object.keys) :
              /\\ object.keys[position] \\in owned
              /\\ object.attributes[object.keys[position]].kind = "data"
         /\\ DOMAIN heap.changed \\cap changeable = {}
      THEN object.regexp
      ELSE Assert(FALSE, "tla-ts can't call a regexp's method where a script changed what it reads")

RegExpOf(heap, ref, changeable) == RegExpOwning(heap, ref, changeable, {})

\\* The properties that the flags getter reads, which RegExpBuiltinExec doesn't, as it reads the flags
\\* that the regexp was made with.
LOCAL RegExpFlagNames ==
  {"hasIndices", "global", "ignoreCase", "multiline", "dotAll", "unicode", "unicodeSets", "sticky"}

\\* A flag as the flags getter reads it, from the regexp's own data property where it has one.
LOCAL RegExpFlag(heap, ref, regexp, name) ==
  LET object == heap.objects[ref[Ref]]
  IN  IF name \\in DOMAIN object.values THEN ToBoolean(object.values[name]) ELSE regexp[name]

\\* Whether a script hasn't changed a built-in object, whose properties tla-ts records.
IsKept(heap, key) == key \\notin DOMAIN heap.changed

\\* Whether exec, or test through it, runs on RegExp.prototype itself, which has no [[RegExpMatcher]],
\\* so that exec throws a TypeError, while a script hasn't changed RegExp.prototype.
IsRegExpPrototypeExec(heap, ref) ==
  IsRegExpPrototype(ref) /\\ "RegExp.prototype" \\notin DOMAIN heap.changed

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
              [] "symbol" \\in DOMAIN object -> give(SymbolDescription(heap, object.symbol))
              [] OTHER -> typeError
       [] path = "get Object.prototype.__proto__" ->
            CASE receiver \\in {Undefined, Null} -> typeError
              [] IsProxy(heap, receiver) ->
                   Assert(FALSE, "tla-ts can't run a proxy's internal method here")
              [] IsRef(receiver) -> give(Prototype(heap, receiver))
              [] OTHER -> Assert(FALSE, "tla-ts can't read the prototype of " \\o ToString(receiver))
       [] path \\in ViewGetters ->
            IF ViewReceives(heap, path, receiver) THEN give(ViewGet(heap, path, receiver)) ELSE typeError
       [] IntlGetterKind(path) # "" ->
            CASE IntlReceives(heap, IntlGetterKind(path), receiver) ->
                   give(IntlGet(heap, path, receiver))
              [] IntlMayWalk(heap, IntlGetterKind(path), receiver) ->
                   Assert(FALSE, "tla-ts can't run a proxy's internal method here")
              [] OTHER -> typeError
       [] path \\in SpeciesGetters \\cup {"get %Int8Array.[[Prototype]]%.@@species"} -> give(receiver)
       [] OTHER -> Assert(FALSE, "tla-ts can't tell which function this value holds")

LOCAL LastIndexValue(heap, ref) == heap.objects[ref[Ref]].values["lastIndex"]

\\* Whether a regexp's lastIndex isn't writable, so that a Set of it throws a TypeError.
LOCAL IsLastIndexFixed(heap, ref) == ~heap.objects[ref[Ref]].attributes["lastIndex"].writable

\\* The heap after Set of a regexp's lastIndex, which leaves it as it is where the Set throws, as
\\* the caller tells.
LOCAL SetLastIndex(heap, ref, value) ==
  IF IsLastIndexFixed(heap, ref)
  THEN heap
  ELSE [heap EXCEPT !.objects[ref[Ref]].values["lastIndex"] = value]

\\* RegExpBuiltinExec, as the heap after it sets the lastIndex of a global or sticky regexp, the match
\\* it finds from there, or a failure, and whether that Set throws. It reads lastIndex with ToLength
\\* whatever the flags.
LOCAL RegExpRun(heap, ref, regexp, text) ==
  LET read == LastIndexValue(heap, ref)
      start == IF IsLong(read) THEN Len(text) + 1 ELSE ToLength(read)
      isUpdating == regexp.global \\/ regexp.sticky
      found == CASE ~isUpdating /\\ start = start -> RegExpSearch(regexp, text, 0)
                 [] start > Len(text) -> RegExpFailure
                 [] start > 0 /\\ CharacterWidth(regexp, text, start - 1) = 2 ->
                      Assert(FALSE, "tla-ts can't match from a lastIndex inside a surrogate pair")
                 [] OTHER -> RegExpSearch(regexp, text, start)
  IN  [heap |-> CASE ~isUpdating -> heap
                  [] found.end = -1 -> SetLastIndex(heap, ref, 0)
                  [] OTHER -> SetLastIndex(heap, ref, found.end),
       match |-> found,
       isThrown |-> isUpdating /\\ IsLastIndexFixed(heap, ref)]

\\* The heap once MakeMatchIndicesIndexPairArray makes the indices of a match for a regexp with
\\* the d flag: an array of the start and end of the match and of each capture that took part, the
\\* object of those of the named groups where the regexp has them, and last the array of them all.
LOCAL RegExpIndices(heap, prototype, regexp, match) ==
  LET pairOf(position) ==
        IF position = 1 THEN <<match.start, match.end>> ELSE match.captures[position - 1]
      positions == 1..(regexp.captures + 1)
      matched == SelectSeq([position \\in positions |-> position], LAMBDA position :
                   pairOf(position) # <<>>)
      refOf(position) ==
        IF pairOf(position) = <<>>
        THEN Undefined
        ELSE NextRef(heap, Cardinality({other \\in 1..position : pairOf(other) # <<>>}))
      hasGroups == regexp.groupNames # <<>>
      groups == [EmptyObject EXCEPT
                   !.prototype = Null,
                   !.keys = regexp.groupNames,
                   !.values = [name \\in DOMAIN regexp.names |-> refOf(RegExpNamed(regexp, match, name) + 1)],
                   !.attributes = [name \\in DOMAIN regexp.names |-> Writable]]
      array == ArrayObject(prototype, [position \\in positions |-> refOf(position)])
      added == "groups" :> IF hasGroups THEN NextRef(heap, Len(matched) + 1) ELSE Undefined
  IN  AllocateEach(heap, [offset \\in DOMAIN matched |-> ArrayObject(prototype, pairOf(matched[offset]))]
                         \\o (IF hasGroups THEN <<groups>> ELSE <<>>)
                         \\o <<[array EXCEPT
                                !.keys = @ \\o <<"groups">>,
                                !.values = @ @@ added,
                                !.attributes = @ @@ ("groups" :> Writable)]>>)

\\* The heap once RegExpBuiltinExec makes the array of a match, which is the last object it holds,
\\* after the object of the match's named groups where the regexp has them, and its indices where
\\* it has the d flag.
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
      indexed == IF regexp.hasIndices THEN RegExpIndices(grouped, prototype, regexp, match) ELSE grouped
      array == ArrayObject(prototype, [position \\in 1..(regexp.captures + 1) |->
                                         RegExpCapture(text, match, position - 1)])
      added == ("index" :> match.start) @@ ("input" :> text)
                 @@ ("groups" :> IF hasGroups THEN Allocated(grouped) ELSE Undefined)
                 @@ (IF regexp.hasIndices THEN "indices" :> Allocated(indexed) ELSE <<>>)
  IN  Allocate(indexed, [array EXCEPT
                           !.keys = @ \\o <<"index", "input", "groups">>
                                      \\o (IF regexp.hasIndices THEN <<"indices">> ELSE <<>>),
                           !.values = @ @@ added,
                           !.attributes = @ @@ [key \\in DOMAIN added |-> Writable]])

\\* RegExp.prototype.exec, as the heap after it, the array of the match it finds, or null, and whether
\\* it throws the TypeError of setting a lastIndex that isn't writable. The calls of a regexp's
\\* methods below give the same.
LOCAL RegExpExecWith(heap, ref, regexp, text, prototype) ==
  LET run == RegExpRun(heap, ref, regexp, text)
      made == RegExpResult(run.heap, prototype, regexp, text, run.match)
  IN  CASE run.isThrown -> [heap |-> run.heap, value |-> Null, isThrown |-> TRUE]
        [] run.match.end = -1 -> [heap |-> run.heap, value |-> Null, isThrown |-> FALSE]
        [] OTHER -> [heap |-> made, value |-> Allocated(made), isThrown |-> FALSE]

RegExpExecIn(heap, ref, value, prototype) ==
  RegExpExecWith(heap, ref, RegExpOwning(heap, ref, {"RegExp.prototype"}, RegExpFlagNames),
                 Text(value), prototype)

\\* RegExpBuiltinExec, which reads a regexp's lastIndex and the flags that it was made with, whatever
\\* other properties a script gave it.
RegExpBuiltinExecIn(heap, ref, value, prototype) ==
  RegExpExecWith(heap, ref, heap.objects[ref[Ref]].regexp, value, prototype)

IsRegExpIn(heap, value) == IsRegExp(heap, value)

\\* What Get(R, "flags") gives, where the flags getter of RegExp.prototype reads each flag through Get.
RegExpFlagsValue(heap, ref) ==
  LET flags == << <<"d", "hasIndices">>, <<"g", "global">>, <<"i", "ignoreCase">>,
                 <<"m", "multiline">>, <<"s", "dotAll">>, <<"u", "unicode">>,
                 <<"v", "unicodeSets">>, <<"y", "sticky">> >>
      RECURSIVE Join(_)
      Join(rest) ==
        CASE rest = <<>> -> ""
          [] ToBoolean(Get(heap, ref, Head(rest)[2])) -> Head(rest)[1] \\o Join(Tail(rest))
          [] OTHER -> Join(Tail(rest))
  IN  IF GetterPath(GetterOf(heap, ref, "flags")) = "get RegExp.prototype.flags"
      THEN Join(flags)
      ELSE Get(heap, ref, "flags")

HasFlag(flags, flag) == flag \\in CharactersOf(flags)

\\* The heap once RegExp.prototype[@@split] constructs its splitter through RegExp, of a regexp and
\\* flags, which tla-ts makes where the flags differ from the regexp's only in d, g, and y, which
\\* leave its pattern as it compiled.
RegExpSplitterIn(heap, ref, flags, prototype) ==
  LET regexp == heap.objects[ref[Ref]].regexp
      names == "dgimsuvy"
      kept(text) == CharactersOf(text) \\ {"d", "g", "y"}
      RECURSIVE Ordered(_)
      Ordered(position) ==
        CASE position > Len(names) -> ""
          [] SubSeq(names, position, position) \\in CharactersOf(flags) ->
               SubSeq(names, position, position) \\o Ordered(position + 1)
          [] OTHER -> Ordered(position + 1)
  IN  IF /\\ IsRegExp(heap, ref)
         /\\ CharactersOf(flags) \\subseteq CharactersOf(names)
         /\\ Len(flags) = Cardinality(CharactersOf(flags))
         /\\ kept(flags) = kept(regexp.flags)
      THEN Allocate(heap, RegExpObject(prototype, [regexp EXCEPT
                                                    !.flags = Ordered(1),
                                                    !.hasIndices = "d" \\in CharactersOf(flags),
                                                    !.global = "g" \\in CharactersOf(flags),
                                                    !.sticky = TRUE]))
      ELSE Assert(FALSE, "tla-ts can't make a regexp of other flags than those of the regexp it copies")

\\* The pieces once RegExp.prototype[@@split] adds the captures of a match after its own: each
\\* element of exec's result past the first, as many as its length tells, up to the count.
RegExpSplitCaptures(heap, result, pieces, count) ==
  LET length == ToLength(Get(heap, result, "length"))
      captures == IF length > 1 THEN length - 1 ELSE 0
      room == count - Len(pieces)
      taken == IF count # -1 /\\ room < captures THEN room ELSE captures
  IN  pieces \\o [position \\in 1..taken |-> Get(heap, result, ToString(position))]

\\* AdvanceStringIndex, which steps past a surrogate pair where the regexp reads code points.
AdvanceStringIndex(text, index, isUnicode) ==
  index + (IF isUnicode THEN CharacterWidth([unicode |-> TRUE], text, index) ELSE 1)

RECURSIVE SubstitutionNames(_)
\\* The group names of a replacement template's $<name> patterns, in order, where the groups are an
\\* object.
SubstitutionNames(template) ==
  LET second == CharacterAt(template, 1)
      close == StringIndexOf(template, ">", 0)
  IN  CASE Len(template) < 2 -> <<>>
        [] CharacterAt(template, 0) # "$" -> SubstitutionNames(Tail(template))
        [] second \\in {"$", "&", "\`", "'"} -> SubstitutionNames(SubSeq(template, 3, Len(template)))
        [] second = "<" /\\ close # -1 ->
             <<SubSeq(template, 3, close)>> \\o SubstitutionNames(SubSeq(template, close + 2, Len(template)))
        [] OTHER -> SubstitutionNames(Tail(template))

RECURSIVE GetSubstitution(_, _, _, _, _, _)
\\* GetSubstitution of a replacement template, from the text that matched at a position of a string,
\\* the captures, which hold Undefined where a group didn't take part, and the text of each $<name>
\\* pattern in order, which is Undefined where the groups are.
GetSubstitution(template, matched, text, position, captures, named) ==
  LET first == CharacterAt(template, 0)
      second == CharacterAt(template, 1)
      third == CharacterAt(template, 2)
      after(count) ==
        GetSubstitution(SubSeq(template, count + 1, Len(template)), matched, text, position, captures, named)
      digits == CharactersOf("0123456789")
      isTwoDigits == third \\in digits /\\ DigitValue(second) * 10 + DigitValue(third) <= Len(captures)
      reference == IF isTwoDigits THEN DigitValue(second) * 10 + DigitValue(third) ELSE DigitValue(second)
      width == IF isTwoDigits THEN 3 ELSE 2
      tail == position + Len(matched)
      close == StringIndexOf(template, ">", 0)
  IN  CASE template = "" -> ""
        [] first # "$" \\/ second = "" -> first \\o after(1)
        [] second = "$" -> "$" \\o after(2)
        [] second = "\`" -> SubSeq(text, 1, position) \\o after(2)
        [] second = "&" -> matched \\o after(2)
        [] second = "'" -> SubSeq(text, (IF tail < Len(text) THEN tail ELSE Len(text)) + 1, Len(text)) \\o after(2)
        [] second \\in digits ->
             (CASE reference < 1 \\/ reference > Len(captures) -> SubSeq(template, 1, width)
                [] captures[reference] = Undefined -> ""
                [] OTHER -> captures[reference]) \\o after(width)
        [] second = "<" /\\ close # -1 /\\ named # Undefined ->
             Head(named) \\o GetSubstitution(SubSeq(template, close + 2, Len(template)), matched, text,
                                              position, captures, Tail(named))
        [] OTHER -> first \\o after(1)

\\* The position of a match that RegExp.prototype[@@replace] reads from an index that ToPrimitive gave,
\\* ToIntegerOrInfinity of it clamped to the string.
RegExpReplacePosition(index, length) == Clamp(IntegerOf(ToNumber(index)), length)

\\* RegExp.prototype.test, as the heap after it and whether exec finds a match.
RegExpTestIn(heap, ref, value) ==
  LET regexp == RegExpOwning(heap, ref, {"RegExp.prototype"}, RegExpFlagNames)
      run == RegExpRun(heap, ref, regexp, Text(value))
  IN  [heap |-> run.heap, value |-> run.match.end # -1, isThrown |-> run.isThrown]

\\* String.prototype.match through RegExp.prototype[@@match]: what exec gives where the flags getter
\\* tells that the regexp isn't global, and else the array of each match's text, or null, which leaves
\\* lastIndex at 0. tla-ts finds each match of a global regexp only with the flags it was made with.
RegExpMatchIn(heap, ref, value, prototype) ==
  LET regexp == RegExpOwning(heap, ref, {"RegExp.prototype", "String.prototype"}, RegExpFlagNames)
      text == Text(value)
      reset == SetLastIndex(heap, ref, 0)
      matches == RegExpMatches(regexp, text, 0)
      made == Allocate(reset, ArrayObject(prototype, [position \\in DOMAIN matches |->
                                                         RegExpCapture(text, matches[position], 0)]))
      isFullUnicode ==
        RegExpFlag(heap, ref, regexp, "unicode") \\/ RegExpFlag(heap, ref, regexp, "unicodeSets")
  IN  CASE ~RegExpFlag(heap, ref, regexp, "global") -> RegExpExecIn(heap, ref, value, prototype)
        [] ~regexp.global \\/ isFullUnicode # regexp.unicode ->
             Assert(FALSE, "tla-ts can't call a regexp's method where a script changed what it reads")
        [] IsLastIndexFixed(heap, ref) -> [heap |-> heap, value |-> Null, isThrown |-> TRUE]
        [] matches = <<>> -> [heap |-> reset, value |-> Null, isThrown |-> FALSE]
        [] OTHER -> [heap |-> made, value |-> Allocated(made), isThrown |-> FALSE]

\\* The heap once String.prototype.replace or replaceAll through RegExp.prototype[@@replace] finds its
\\* matches, and those matches. A global regexp finds each match and leaves lastIndex at 0, and
\\* another the match that exec finds.
RegExpMatchesIn(heap, ref, value) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      text == Text(value)
      run == RegExpRun(heap, ref, regexp, text)
  IN  IF regexp.global
      THEN [heap |-> SetLastIndex(heap, ref, 0),
            value |-> RegExpMatches(regexp, text, 0),
            isThrown |-> IsLastIndexFixed(heap, ref)]
      ELSE [heap |-> run.heap,
            value |-> IF run.match.end = -1 THEN <<>> ELSE <<run.match>>,
            isThrown |-> run.isThrown]

\\* String.prototype.replace or replaceAll through RegExp.prototype[@@replace], with a replacement
\\* template.
RegExpReplaceIn(heap, ref, value, template) ==
  LET regexp == RegExpOf(heap, ref, {"RegExp.prototype", "String.prototype"})
      found == RegExpMatchesIn(heap, ref, value)
  IN  [heap |-> found.heap,
       value |-> RegExpReplaced(regexp, Text(value), found.value, Text(template)),
       isThrown |-> found.isThrown]

\\* Whether String.prototype.replace or replaceAll finds no @@replace method on a regexp, whose own
\\* @@replace a script defines as undefined, while a script hasn't changed what else they read.
IsUnreplacing(heap, ref) ==
  LET key == WellKnownSymbol("replace")
  IN  /\\ IsRegExp(heap, ref)
      /\\ heap.objects[ref[Ref]].prototype = Ref :> "RegExp.prototype"
      /\\ heap.objects[ref[Ref]].keys = <<"lastIndex", key>>
      /\\ heap.objects[ref[Ref]].attributes[key].kind = "data"
      /\\ heap.objects[ref[Ref]].values[key] = Undefined
      /\\ DOMAIN heap.changed \\cap {"RegExp.prototype", "String.prototype"} = {}

\\* String.prototype.replace or replaceAll of that regexp, which replaces the string that its
\\* toString gives as text, as the error that it throws, or "", and the string that it gives.
\\* replaceAll requires a global regexp, as the flags that it reads tell.
RegExpUnreplaced(heap, ref, value, template, isAll) ==
  LET regexp == heap.objects[ref[Ref]].regexp
      search == "/" \\o regexp.source \\o "/" \\o regexp.flags
  IN  CASE ~isAll -> [error |-> "", value |-> StringReplace(value, search, template)]
        [] regexp.global -> [error |-> "", value |-> StringReplaceAll(value, search, template)]
        [] OTHER -> [error |-> "TypeError", value |-> ""]

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
      run == RegExpRun(reset, ref, regexp, Text(value))
      restored == IF SameValue(LastIndexValue(run.heap, ref), previous)
                  THEN run.heap
                  ELSE SetLastIndex(run.heap, ref, previous)
  IN  [heap |-> restored,
       value |-> IF run.match.end = -1 THEN -1 ELSE run.match.start,
       isThrown |-> (IsLastIndexFixed(heap, ref) /\\ ~SameValue(previous, 0)) \\/ run.isThrown]

\\* String.prototype.split through RegExp.prototype[@@split], which splits with a new regexp that the
\\* RegExp constructor makes, so the regexp's lastIndex stays as it is. SpeciesConstructor gives the
\\* RegExp constructor where the regexp's own constructor is undefined or has no @@species.
RegExpSplitIn(heap, ref, value, limit) ==
  LET regexp == RegExpOwning(heap, ref, {"RegExp.prototype", "String.prototype", "RegExp"},
                             {"constructor"})
      object == heap.objects[ref[Ref]]
      constructor == object.values["constructor"]
  IN  IF \\/ "constructor" \\notin DOMAIN object.values
         \\/ constructor = Undefined
         \\/ IsHeap(constructor) /\\ Get(heap, constructor, WellKnownSymbol("species")) \\in {Undefined, Null}
      THEN [heap |-> heap, value |-> RegExpPieces(regexp, Text(value), limit), isThrown |-> FALSE]
      ELSE Assert(FALSE, "tla-ts can't call a regexp's method where a script changed what it reads")

\\* The length that a value gives an array, or -1 where ArraySetLength throws a RangeError.
LOCAL ArrayLengthOf(value) ==
  CASE value = Null -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] TypeOf(value) = "string" ->
         ReadNumber(value, LAMBDA kind, isNegative, magnitude :
           IF kind = "integer" /\\ (~isNegative \\/ magnitude = 0) THEN magnitude ELSE -1)
    [] value = NegativeZero -> 0
    \\* ToUint32 of a Double differs from it.
    [] IsDouble(value) -> -1
    [] IsWide(value) -> IF IsNegative(value) \\/ value[Wide][1] >= 2 THEN -1 ELSE value
    [] IsInteger(value) /\\ value >= 0 -> value
    [] IsNumber(value) \\/ value = Undefined -> -1
    [] OTHER -> Assert(FALSE, "tla-ts can't convert this value to an array length")

LOCAL Ordinary(object, key, descriptor) ==
  IF CanApply(object, key, descriptor)
  THEN [object |-> Apply(object, key, descriptor), isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]

\\* ArraySetLength, which deletes the elements past a smaller length, from the last, and stops at
\\* one it can't delete. A length or an index from 2^31 is Wide.
LOCAL SetLength(object, descriptor) ==
  LET length == ArrayLengthOf(descriptor.value)
      removed == {key \\in DOMAIN object.values : IsIndex(key) /\\ ~LessThan(ToIndex(key), length)}
      blocked == {ToIndex(key) : key \\in {other \\in removed : ~object.attributes[other].configurable}}
      kept == IF blocked = {}
              THEN length
              ELSE Add(CHOOSE index \\in blocked : \\A other \\in blocked : ~LessThan(index, other), 1)
      deleted == {key \\in removed : ~LessThan(ToIndex(key), kept)}
      remaining == DOMAIN object.values \\ deleted
      trimmed == [object EXCEPT !.keys = SelectSeq(@, LAMBDA key : key \\notin deleted),
                                !.values = [key \\in remaining |-> @[key]],
                                !.attributes = [key \\in remaining |-> @[key]]]
  IN CASE IsNegative(length) -> [object |-> object, isDone |-> FALSE, isRangeError |-> TRUE]
       [] ~LessThan(length, object.values["length"]) ->
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
         LET isBefore == LessThan(ToIndex(key), object.values["length"])
             defined == Ordinary(object, key, descriptor)
         IN CASE ~isBefore /\\ ~object.attributes["length"].writable ->
                   [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
              [] ~defined.isDone \\/ isBefore -> defined
              [] OTHER -> [defined EXCEPT !.object.values["length"] = Add(ToIndex(key), 1)]
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

\\* The little-endian bytes of a float that holds a number exactly, which stops where it would round:
\\* the number's binary form shifted so that its first bit leads the fraction, which a normal float
\\* leaves out, or so that its last bit is the least that a subnormal float holds.
LOCAL FloatBytes(value, type) ==
  LET size == ElementSize(type)
      exponentBits == ExponentBits(type)
      fractionBits == FractionBits(type)
      top == 8 * size - 1
      ones == 2^exponentBits - 1
      bias == 2^(exponentBits - 1) - 1
      encode(isNegative, exponent, fraction) ==
        BitsBytes([position \\in 0..top |->
                     CASE position = top -> IF isNegative THEN 1 ELSE 0
                       [] position >= fractionBits -> (exponent \\div 2^(position - fractionBits)) % 2
                       [] OTHER -> fraction[position]], size)
      none == [position \\in 0..(fractionBits - 1) |-> 0]
      binary == Binary(value)
      significand == <<binary[3], binary[4]>>
      count == HalvesBits(significand)
      lead == binary[2] + count - 1
      least == 1 - bias - fractionBits
      isSubnormal == lead < 1 - bias
      shifted == ShiftedLeft(significand, IF isSubnormal THEN binary[2] - least ELSE fractionBits - (count - 1))
      bit(position) ==
        IF position < 31
        THEN (shifted[2] \\div 2^position) % 2
        ELSE (shifted[1] \\div 2^(position - 31)) % 2
  IN CASE value = NaN ->
            encode(FALSE, ones, [position \\in 0..(fractionBits - 1) |->
                                   IF position = fractionBits - 1 THEN 1 ELSE 0])
       [] value = Infinity -> encode(FALSE, ones, none)
       [] value = NegativeInfinity -> encode(TRUE, ones, none)
       [] value = NegativeZero -> encode(TRUE, 0, none)
       [] IsZero(value) -> encode(FALSE, 0, none)
       [] lead > bias \\/ count - 1 > fractionBits \\/ binary[2] < least ->
            Assert(FALSE, "tla-ts can't round a number to a float")
       [] OTHER ->
            encode(binary[1], IF isSubnormal THEN 0 ELSE lead + bias,
                   [position \\in 0..(fractionBits - 1) |-> bit(position)])

\\* The little-endian bytes that an element of a type holds for a number, or for a BigInt, which
\\* extends its sign past its 32 bits.
NumberBytes(type, value) ==
  CASE IsBigIntType(type) ->
         [position \\in 1..8 |-> IF position <= 4 THEN (value[Big] \\div 2^(8 * (position - 1))) % 256
                                ELSE IF value[Big] < 0 THEN 255 ELSE 0]
    [] type \\in {"Float16", "Float32", "Float64"} -> FloatBytes(value, type)
    \\* An integer type keeps the low bits, which a Wide integer's ToInt32 holds, and a Double from 2^32
    \\* has none set.
    [] IsWide(value) /\\ type = "Uint8Clamped" -> <<IF IsNegative(value) THEN 0 ELSE 255>>
    [] IsWide(value) -> [position \\in 1..ElementSize(type) |-> (Int32(value) \\div 2^(8 * (position - 1))) % 256]
    [] IsDouble(value) /\\ value[Double][2] >= 32 ->
         IF type = "Uint8Clamped"
         THEN <<IF IsNegative(value) THEN 0 ELSE 255>>
         ELSE [position \\in 1..ElementSize(type) |-> 0]
    [] IsBig(value) -> BeyondInteger
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

\\* What a typed array of a type holds for a value that a script writes: ToBigInt where it holds
\\* BigInts, which throws a TypeError for a number and reads a string's decimal digits, and ToNumber
\\* otherwise.
ToElement(type, value) ==
  LET text == TrimEnd(TrimStart(value))
      unsigned == IF Prefix(text, 1) \\in {"+", "-"} THEN Tail(text) ELSE text
      sign == IF Prefix(text, 1) = "-" THEN -1 ELSE 1
  IN CASE ~IsBigIntType(type) -> ToNumber(value)
       [] IsBigInt(value) -> value
       [] TypeOf(value) = "boolean" -> Big :> IF value THEN 1 ELSE 0
       [] TypeOf(value) = "string" /\\ text = "" -> Big :> 0
       [] TypeOf(value) = "string" /\\ unsigned # "" /\\ DigitPrefix(unsigned, 10) = unsigned ->
            Big :> sign * CheckedDigits(unsigned, 10, 0)
       [] TypeOf(value) = "number" ->
            Assert(FALSE, "tla-ts can't throw the TypeError of converting a number to a BigInt")
       [] OTHER -> Assert(FALSE, "tla-ts can't convert this value to a BigInt")

\\* What a typed array holds for a value that a script writes.
ToElementOf(heap, ref, value) == ToElement(heap.objects[ref[Ref]].elementType, value)

\\* A write to a typed array's element, which converts the value first, and does nothing at an
\\* index past the end.
TypedSet(heap, ref, key, value) ==
  LET view == heap.objects[ref[Ref]]
      number == ToElement(view.elementType, value)
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
       [] IsDouble(number) -> IF IsNegative(number) \\/ number[Double][2] >= 0 THEN -1 ELSE BeyondInteger
       [] IsWide(number) -> IF IsNegative(number) \\/ number[Wide][1] = 4194304 THEN -1 ELSE BeyondInteger
       [] number < 0 -> -1
       [] OTHER -> number

LOCAL MaxBytes == 65536

\\* What a constructor of a buffer, a DataView, or a typed array gives where it throws: the error,
\\* which only a statement can throw, in place of the heap with what it makes.
LOCAL Failed(kind) == [error |-> kind]

LOCAL Made(result) ==
  IF "error" \\in DOMAIN result
  THEN Assert(FALSE, "tla-ts can't throw the " \\o result.error \\o " of this constructor here")
  ELSE result

LOCAL ErrorOf(result) == IF "error" \\in DOMAIN result THEN result.error ELSE ""

LOCAL ViewObject(prototype, buffer, offset, length) ==
  [viewed |-> buffer, byteOffset |-> offset, viewLength |-> length]
    @@ [EmptyObject EXCEPT !.prototype = prototype]

LOCAL BufferObject(prototype, bytes, maxLength, isShared) ==
  [bytes |-> bytes, maxLength |-> maxLength, isShared |-> isShared, isDetached |-> FALSE]
    @@ [EmptyObject EXCEPT !.prototype = prototype]

\\* The heap with a new ArrayBuffer or SharedArrayBuffer of a length, which options may make
\\* resizable.
LOCAL BufferMade(heap, prototype, arguments, isShared) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      byteLength == IndexOfArgument(argument(1))
      options == argument(2)
      maximum == IF IsObjectIn(heap, options) THEN Get(heap, options, "maxByteLength") ELSE Undefined
      maxLength == IF maximum = Undefined THEN Undefined ELSE IndexOfArgument(maximum)
  IN CASE byteLength = -1 -> Failed("RangeError")
       [] maxLength = -1 -> Failed("RangeError")
       [] maxLength # Undefined /\\ byteLength > maxLength -> Failed("RangeError")
       [] byteLength > MaxBytes \\/ (maxLength # Undefined /\\ maxLength > MaxBytes) ->
            Assert(FALSE, "tla-ts can't make a buffer this big")
       [] OTHER ->
            Allocate(heap, BufferObject(prototype, [position \\in 1..byteLength |-> 0], maxLength,
                                        isShared))

\\* The heap with a new DataView of a buffer.
LOCAL DataViewMade(heap, prototype, arguments) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      buffer == argument(1)
      object == heap.objects[buffer[Ref]]
      offset == IndexOfArgument(argument(2))
      length == IF argument(3) = Undefined THEN Undefined ELSE IndexOfArgument(argument(3))
  IN CASE ~IsBuffer(heap, buffer) ->
            Failed("TypeError")
       [] offset = -1 -> Failed("RangeError")
       [] object.isDetached -> Failed("TypeError")
       [] offset > Len(object.bytes) -> Failed("RangeError")
       [] length = -1 -> Failed("RangeError")
       [] length # Undefined /\\ offset + length > Len(object.bytes) -> Failed("RangeError")
       [] OTHER ->
            Allocate(heap, ViewObject(prototype, buffer, offset,
                                      CASE length # Undefined -> length
                                        [] object.maxLength # Undefined -> -1
                                        [] OTHER -> Len(object.bytes) - offset))

\\* Whether converting a value to a number runs no code and throws nothing.
LOCAL IsPlainNumeric(value) ==
  \\/ value = Null
  \\/ ~IsRef(value) /\\ TypeOf(value) \\in {"undefined", "boolean", "number", "string"}

\\* The index of the first element of an array-like object that a getter answers, as a built-in reads
\\* each element in order and converts it to a number, where its length and each element before are
\\* values that IsPlainNumeric holds, so that nothing before runs code or throws, or -1.
LOCAL NumbersFirstGetter(heap, ref) ==
  LET length == Get(heap, ref, "length")
      count == ToLength(length)
      read == {position \\in 0..(count - 1) : GetterOf(heap, ref, ToString(position)) # Undefined}
      first == CHOOSE position \\in read : \\A other \\in read : position <= other
  IN IF /\\ IsHeap(ref)
        /\\ ~IsProxy(heap, ref)
        /\\ ~IsTypedArray(heap, ref)
        /\\ ~IsBuffer(heap, ref)
        /\\ GetterOf(heap, ref, "length") = Undefined
        /\\ IsPlainNumeric(length)
        /\\ ~IsBig(length)
        /\\ length # Infinity
        /\\ count * 8 <= MaxBytes
        /\\ read # {}
        /\\ \\A position \\in 0..(first - 1) : IsPlainNumeric(Get(heap, ref, ToString(position)))
     THEN first
     ELSE -1

\\* The code of the getter that new of a typed array runs first as it reads the elements of an
\\* array-like object without an @@iterator, where nothing before runs code or throws, or Undefined.
TypedArrayFirstGetter(heap, ref) ==
  IF /\\ IsHeap(ref)
     /\\ ~IsProxy(heap, ref)
     /\\ GetterOf(heap, ref, WellKnownSymbol("iterator")) = Undefined
     /\\ Get(heap, ref, WellKnownSymbol("iterator")) \\in {Undefined, Null}
     /\\ NumbersFirstGetter(heap, ref) # -1
  THEN CodeOf(heap, GetterOf(heap, ref, ToString(NumbersFirstGetter(heap, ref))))
  ELSE Undefined

\\* The heap with a new typed array of a length, of the elements of an array or a typed array, or
\\* viewing a buffer, where isIterating tells whether an array still iterates through the built-in
\\* iterator and next.
LOCAL TypedArrayMade(heap, type, prototype, bufferPrototype, arguments, isIterating) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      size == ElementSize(type)
      first == argument(1)
      view(current, buffer, offset, length) ==
        Allocate(current, [elementType |-> type] @@ ViewObject(prototype, buffer, offset, length))
      withBytes(bytes) ==
        LET allocated == Allocate(heap, BufferObject(bufferPrototype, bytes, Undefined, FALSE))
        IN view(allocated, Allocated(allocated), 0, Len(bytes) \\div size)
      iterated(bytes) ==
        IF isIterating
        THEN withBytes(bytes)
        ELSE Assert(FALSE, "tla-ts can't iterate an array whose iterator a script replaced")
      object == heap.objects[first[Ref]]
      offset == IndexOfArgument(argument(2))
      length == IF argument(3) = Undefined THEN Undefined ELSE IndexOfArgument(argument(3))
      byteLength == Len(object.bytes)
  IN CASE ~IsObjectIn(heap, first) ->
            LET count == IndexOfArgument(first)
            IN CASE count = -1 -> Failed("RangeError")
                 [] count * size > MaxBytes -> Assert(FALSE, "tla-ts can't make a buffer this big")
                 [] OTHER -> withBytes([position \\in 1..(count * size) |-> 0])
       [] IsTypedArray(heap, first) ->
            IF IsOutOfBounds(heap, object) \\/ IsBigIntType(type) # IsBigIntType(object.elementType)
            THEN Failed("TypeError")
            ELSE withBytes(NumbersBytes(type, [position \\in 1..ViewLength(heap, object) |->
                                                 TypedElement(heap, first, position - 1)]))
       [] IsSequenceValue(first) ->
            iterated(NumbersBytes(type, [position \\in DOMAIN first |-> ToElement(type, first[position])]))
       [] ~IsBuffer(heap, first) /\\ IsHeap(first) ->
            LET method == Get(heap, first, WellKnownSymbol("iterator"))
                count == ToLength(Get(heap, first, "length"))
                bytes == NumbersBytes(type, [position \\in 1..count |->
                                               ToElement(type, Get(heap, first, ToString(position - 1)))])
            IN CASE method \\in {Undefined, Null} -> withBytes(bytes)
                 [] IsArray(heap, first) /\\ method = Ref :> "Array.prototype.values" -> iterated(bytes)
                 [] OTHER -> Assert(FALSE, "tla-ts can't make a typed array of this object")
       [] ~IsBuffer(heap, first) -> Assert(FALSE, "tla-ts can't make a typed array of this object")
       [] offset = -1 \\/ offset % size # 0 -> Failed("RangeError")
       [] length = -1 -> Failed("RangeError")
       [] object.isDetached -> Failed("TypeError")
       [] length = Undefined /\\ object.maxLength # Undefined ->
            IF offset > byteLength THEN Failed("RangeError") ELSE view(heap, first, offset, -1)
       [] length = Undefined ->
            IF byteLength % size # 0 \\/ offset > byteLength
            THEN Failed("RangeError")
            ELSE view(heap, first, offset, (byteLength - offset) \\div size)
       [] offset + length * size > byteLength -> Failed("RangeError")
       [] OTHER -> view(heap, first, offset, length)

\\* The prototype that an instance takes from the constructor that a construction names as its
\\* newTarget, or the default where newTarget's prototype property isn't an object.
PrototypeFromConstructor(heap, newTarget, default) ==
  LET prototype == Get(heap, newTarget, "prototype")
  IN IF IsObjectIn(heap, prototype) THEN prototype ELSE default

\\* The heap after new of a buffer, a DataView, or a typed array, or the error, if any, that it throws.
NewBuffer(heap, prototype, arguments, isShared) ==
  Made(BufferMade(heap, prototype, arguments, isShared))

NewBufferError(heap, prototype, arguments, isShared) ==
  ErrorOf(BufferMade(heap, prototype, arguments, isShared))

NewDataView(heap, prototype, arguments) == Made(DataViewMade(heap, prototype, arguments))

NewDataViewError(heap, prototype, arguments) == ErrorOf(DataViewMade(heap, prototype, arguments))

NewTypedArray(heap, type, prototype, bufferPrototype, arguments, isIterating) ==
  Made(TypedArrayMade(heap, type, prototype, bufferPrototype, arguments, isIterating))

NewTypedArrayError(heap, type, prototype, bufferPrototype, arguments, isIterating) ==
  ErrorOf(TypedArrayMade(heap, type, prototype, bufferPrototype, arguments, isIterating))

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
      ordered == IF isLittle THEN bytes ELSE Reversed(bytes)
  IN CASE index = -1 -> Thrown(heap, "RangeError")
       [] isLittle = isLittle /\\ IsOutOfBounds(heap, view) -> Thrown(heap, "TypeError")
       [] index + size > ViewLength(heap, view) -> Thrown(heap, "RangeError")
       \\* A script that names DataView holds integers beyond 32 bits, as a Uint32 from 2^31 is.
       [] type = "Uint32" /\\ ordered[4] >= 128 ->
            Returned(heap, WideOf(<<1, BitsValue(ByteBits(ordered), 0, 31)>>))
       [] OTHER -> Returned(heap, NumberOfBytes(type, ordered))

\\* Whether a WeakRef or a FinalizationRegistry can hold a value: an object, or a symbol that the
\\* registry doesn't hold.
LOCAL CanBeHeldWeakly(heap, value) ==
  IsObjectIn(heap, value) \\/ (TypeOfIn(heap, value) = "symbol" /\\ ~IsRegisteredSymbol(heap, value))

\\* The value that a call passes at a position, or Undefined where it passes fewer.
ArgumentAt(arguments, position) ==
  IF Len(arguments) >= position THEN arguments[position] ELSE Undefined

\\* The heap with a new WeakRef of its target, which tla-ts never collects, as the spec allows a
\\* host to.
LOCAL WeakRefMade(heap, prototype, arguments) ==
  IF CanBeHeldWeakly(heap, ArgumentAt(arguments, 1))
  THEN Allocate(heap, [weakRefTarget |-> ArgumentAt(arguments, 1)]
                        @@ [EmptyObject EXCEPT !.prototype = prototype])
  ELSE Failed("TypeError")

NewWeakRef(heap, prototype, arguments) == Made(WeakRefMade(heap, prototype, arguments))

NewWeakRefError(heap, prototype, arguments) == ErrorOf(WeakRefMade(heap, prototype, arguments))

\\* The heap with a new FinalizationRegistry, whose cells hold the unregister tokens that its register
\\* takes. It never calls its cleanup callback, as tla-ts collects nothing.
LOCAL FinalizationRegistryMade(heap, prototype, arguments) ==
  IF TypeOfIn(heap, ArgumentAt(arguments, 1)) = "function"
  THEN Allocate(heap, [registryTokens |-> <<>>] @@ [EmptyObject EXCEPT !.prototype = prototype])
  ELSE Failed("TypeError")

NewFinalizationRegistry(heap, prototype, arguments) ==
  Made(FinalizationRegistryMade(heap, prototype, arguments))

NewFinalizationRegistryError(heap, prototype, arguments) ==
  ErrorOf(FinalizationRegistryMade(heap, prototype, arguments))

\\* WeakRef.prototype.deref, which gives the target, as nothing collects it.
WeakRefDeref(heap, ref) ==
  IF IsHeap(ref) /\\ "weakRefTarget" \\in DOMAIN heap.objects[ref[Ref]]
  THEN Returned(heap, heap.objects[ref[Ref]].weakRefTarget)
  ELSE Thrown(heap, "TypeError")

\\* FinalizationRegistry.prototype.register, which keeps the cell's token, where it has one.
FinalizationRegistryRegister(heap, ref, target, held, token) ==
  CASE ~(IsHeap(ref) /\\ "registryTokens" \\in DOMAIN heap.objects[ref[Ref]]) -> Thrown(heap, "TypeError")
    [] ~CanBeHeldWeakly(heap, target) -> Thrown(heap, "TypeError")
    [] SameValue(target, held) -> Thrown(heap, "TypeError")
    [] CanBeHeldWeakly(heap, token) ->
         Returned([heap EXCEPT !.objects[ref[Ref]].registryTokens = Append(@, token)], Undefined)
    [] token # Undefined -> Thrown(heap, "TypeError")
    [] OTHER -> Returned(heap, Undefined)

\\* FinalizationRegistry.prototype.unregister, which removes the cells of a token and tells whether
\\* it removed any.
FinalizationRegistryUnregister(heap, ref, token) ==
  LET tokens == heap.objects[ref[Ref]].registryTokens
      kept == SelectSeq(tokens, LAMBDA held : ~SameValue(held, token))
  IN CASE ~(IsHeap(ref) /\\ "registryTokens" \\in DOMAIN heap.objects[ref[Ref]]) ->
            Thrown(heap, "TypeError")
       [] ~CanBeHeldWeakly(heap, token) -> Thrown(heap, "TypeError")
       [] OTHER ->
            Returned([heap EXCEPT !.objects[ref[Ref]].registryTokens = kept], Len(kept) # Len(tokens))

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

\\* The little-endian sum of two elements' bytes, which wraps as the element does.
RECURSIVE AddBytes(_, _, _)
AddBytes(left, right, carry) ==
  IF left = <<>>
  THEN <<>>
  ELSE LET sum == Head(left) + Head(right) + carry
       IN <<sum % 256>> \\o AddBytes(Tail(left), Tail(right), sum \\div 256)

\\* Atomics' functions, which give the heap after them, their value, and the error they throw, if
\\* any. tla-ts runs one agent, so nothing waits on a buffer: notify wakes no one, and a wait that
\\* reads the value it expects times out.
AtomicsCall(heap, method, arguments, objectPrototype) ==
  LET argument(position) == IF Len(arguments) >= position THEN arguments[position] ELSE Undefined
      ref == argument(1)
      view == heap.objects[ref[Ref]]
      type == view.elementType
      index == IndexOfArgument(argument(2))
      start == view.byteOffset + index * ElementSize(type)
      old == SubSeq(ViewedBytes(heap, view), start + 1, start + ElementSize(type))
      converted(position) ==
        IF IsBigIntType(type)
        THEN ToElement(type, argument(position))
        ELSE ToIntegerOrInfinity(ToNumber(argument(position)))
      bytes(position) == NumberBytes(type, converted(position))
      modified(new) == Returned(WithBytes(heap, view, start, new), NumberOfBytes(type, old))
      bitwise(operation) ==
        modified([position \\in DOMAIN old |-> Bits(operation, old[position], bytes(3)[position])])
      timeout == ToNumber(argument(4))
      isEqual == NumberBytes(type, ToElement(type, argument(3))) = old
      result(value) ==
        LET made == Allocate(heap, PutAll([EmptyObject EXCEPT !.prototype = objectPrototype],
                                          [async |-> FALSE, value |-> value], <<"async", "value">>))
        IN Returned(made, Allocated(made))
  IN CASE method = "isLockFree" ->
            Returned(heap, ToIntegerOrInfinity(ToNumber(argument(1))) \\in {1, 2, 4, 8})
       [] method = "pause" ->
            IF argument(1) = Undefined \\/ IsInteger(argument(1)) \\/ argument(1) = NegativeZero
            THEN Returned(heap, Undefined)
            ELSE Thrown(heap, "TypeError")
       [] ~IsTypedArray(heap, ref) -> Thrown(heap, "TypeError")
       [] IsOutOfBounds(heap, view) -> Thrown(heap, "TypeError")
       [] method \\in {"notify", "wait", "waitAsync"} /\\ type \\notin {"Int32", "BigInt64"} ->
            Thrown(heap, "TypeError")
       [] type \\in {"Uint8Clamped", "Float16", "Float32", "Float64"} -> Thrown(heap, "TypeError")
       [] method \\in {"wait", "waitAsync"} /\\ ~heap.objects[view.viewed[Ref]].isShared ->
            Thrown(heap, "TypeError")
       [] index = -1 \\/ index >= ViewLength(heap, view) -> Thrown(heap, "RangeError")
       [] method = "load" -> Returned(heap, NumberOfBytes(type, old))
       [] method = "store" -> Returned(WithBytes(heap, view, start, bytes(3)), converted(3))
       [] method = "add" -> modified(AddBytes(old, bytes(3), 0))
       [] method = "sub" ->
            modified(AddBytes(old, [position \\in DOMAIN old |-> 255 - bytes(3)[position]], 1))
       [] method \\in {"and", "or", "xor"} -> bitwise(method)
       [] method = "exchange" -> modified(bytes(3))
       [] method = "compareExchange" ->
            LET expected == bytes(3)
                replacement == bytes(4)
            IN modified(IF expected = old THEN replacement ELSE old)
       [] method = "notify" /\\ (argument(3) = Undefined \\/ IsNumber(ToNumber(argument(3)))) ->
            Returned(heap, 0)
       [] isEqual /\\ timeout \\in {NaN, Infinity} ->
            Assert(FALSE, "tla-ts can't wait for a value that nothing changes")
       [] method = "wait" -> Returned(heap, IF isEqual THEN "timed-out" ELSE "not-equal")
       [] ~isEqual -> result("not-equal")
       [] LessOrEqual(timeout, 0) -> result("timed-out")
       [] OTHER -> Assert(FALSE, "tla-ts can't wait asynchronously for a value to change")

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

\\* ArrayBuffer's transfer and transferToFixedLength, which move the bytes into a new ArrayBuffer of a
\\* length, resizable where isPreserved and the receiver is, and detach the receiver.
Transfer(heap, ref, request, isPreserved, prototype) ==
  LET object == heap.objects[ref[Ref]]
      length == IF request = Undefined THEN Len(object.bytes) ELSE IndexOfArgument(request)
      maxLength == IF isPreserved THEN object.maxLength ELSE Undefined
      bytes ==
        IF length <= Len(object.bytes)
        THEN SubSeq(object.bytes, 1, length)
        ELSE object.bytes \\o [position \\in 1..(length - Len(object.bytes)) |-> 0]
      detached ==
        [heap EXCEPT !.objects[ref[Ref]].bytes = <<>>, !.objects[ref[Ref]].isDetached = TRUE]
  IN CASE ~IsBuffer(heap, ref) \\/ object.isShared -> Thrown(heap, "TypeError")
       [] length = -1 -> Thrown(heap, "RangeError")
       [] object.isDetached -> Thrown(heap, "TypeError")
       [] maxLength # Undefined /\\ length > maxLength -> Thrown(heap, "RangeError")
       [] length > MaxBytes -> Assert(FALSE, "tla-ts can't make a buffer this big")
       [] OTHER ->
            LET made == Allocate(detached, BufferObject(prototype, bytes, maxLength, FALSE))
            IN Returned(made, Allocated(made))

\\* ArrayBuffer's and SharedArrayBuffer's slice, which copies bytes into a new buffer that the
\\* receiver's constructor makes, where tla-ts follows only the built-in one.
BufferSlice(heap, ref, start, end, isShared, constructor) ==
  LET object == heap.objects[ref[Ref]]
      length == Len(object.bytes)
      clamped(index) == IF index < 0 THEN 0 ELSE IF index > length THEN length ELSE index
      first == clamped(RelativeIndex(ToNumber(start), length))
      final ==
        IF end = Undefined
        THEN length
        ELSE clamped(RelativeIndex(ToNumber(end), length))
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

\\* The constructor that a typed array's methods make a typed array of its element type through, of
\\* those that constructors holds by their element types, where tla-ts follows only the built-in one.
TypedArraySpecies(heap, ref, constructors) ==
  LET constructor == Get(heap, ref, "constructor")
      own == constructors[heap.objects[ref[Ref]].elementType]
  IN IF /\\ constructor \\in {Undefined, own}
        /\\ GetterOf(heap, own, WellKnownSymbol("species"))
             = Ref :> "get %Int8Array.[[Prototype]]%.@@species"
     THEN own
     ELSE Assert(FALSE, "tla-ts can't make a typed array through a constructor that a script gives")

\\* The heap after a typed array's slice, filter, or map makes a typed array of its element type that
\\* holds values, through its constructor. filter converts each value, as it keeps undefined for an
\\* index that a callback shrank the buffer past.
TypedArrayHolding(heap, ref, values, bufferPrototype, constructors) ==
  LET type == heap.objects[ref[Ref]].elementType
      bytes == NumbersBytes(type, [position \\in DOMAIN values |-> ToElement(type, values[position])])
      allocated == Allocate(heap, BufferObject(bufferPrototype, bytes, Undefined, FALSE))
      prototype == Get(allocated, TypedArraySpecies(heap, ref, constructors), "prototype")
  IN Allocate(allocated, [elementType |-> type] @@ ViewObject(prototype, Allocated(allocated), 0, Len(values)))

\\* A typed array's length, or -1 where a method that validates it throws a TypeError, as for a value
\\* that isn't a typed array or one out of bounds.
TypedArrayLength(heap, ref) ==
  IF IsTypedArray(heap, ref) /\\ ~IsOutOfBounds(heap, heap.objects[ref[Ref]])
  THEN ViewLength(heap, heap.objects[ref[Ref]])
  ELSE -1

\\* The index of the first element of an array-like source that a getter answers as a typed array of
\\* numbers sets its elements from it, where nothing that set does before throws or runs code, or -1.
LOCAL SetFirstGetter(heap, ref, arguments) ==
  LET offset == IF Len(arguments) >= 2 THEN arguments[2] ELSE Undefined
      start == ToIntegerOrInfinity(ToNumber(offset))
      view == heap.objects[ref[Ref]]
      first == NumbersFirstGetter(heap, arguments[1])
  IN IF /\\ IsTypedArray(heap, ref)
        /\\ ~IsBigIntType(view.elementType)
        /\\ Len(arguments) >= 1
        /\\ IsPlainNumeric(offset)
        /\\ start \\notin {Infinity, NegativeInfinity}
        /\\ ~IsBig(start)
        /\\ start >= 0
        /\\ ~IsOutOfBounds(heap, view)
        /\\ first # -1
        /\\ ToLength(Get(heap, arguments[1], "length")) + start <= ViewLength(heap, view)
     THEN first
     ELSE -1

\\* The code of the getter that %TypedArray%.prototype.set runs first as it reads an array-like
\\* source, which SetFirstGetter gives, or Undefined.
TypedArraySetFirstGetter(heap, ref, arguments) ==
  IF SetFirstGetter(heap, ref, arguments) = -1
  THEN Undefined
  ELSE CodeOf(heap, GetterOf(heap, arguments[1], ToString(SetFirstGetter(heap, ref, arguments))))

\\* The heap once set wrote the elements before the one that TypedArraySetFirstGetter reads.
TypedArraySetBefore(heap, ref, arguments) ==
  LET view == heap.objects[ref[Ref]]
      start == ToIntegerOrInfinity(ToNumber(IF Len(arguments) >= 2 THEN arguments[2] ELSE Undefined))
      values == [position \\in 1..SetFirstGetter(heap, ref, arguments) |->
                   ToElement(view.elementType, Get(heap, arguments[1], ToString(position - 1)))]
  IN IF values = <<>>
     THEN heap
     ELSE WithBytes(heap, view, view.byteOffset + start * ElementSize(view.elementType),
                    NumbersBytes(view.elementType, values))

\\* %TypedArray%.prototype's methods that read and write a typed array's elements, which give the
\\* heap after them, their value, and the error they throw, if any. slice and subarray make their
\\* typed array through the receiver's constructor, of those that constructors holds by their element
\\* types, where tla-ts follows only the built-in one. Any method throws a TypeError for a receiver
\\* that isn't a typed array. copyWithin copies bytes, which keeps a NaN's bits.
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
      filled == ToElement(view.elementType, argument(1))
      write(current, first, values) ==
        IF values = <<>>
        THEN current
        ELSE WithBytes(current, view, view.byteOffset + first * ElementSize(view.elementType),
                       NumbersBytes(view.elementType, values))
      species == TypedArraySpecies(heap, ref, constructors)
  IN CASE ~IsTypedArray(heap, ref) -> Thrown(heap, "TypeError")
       [] method \\notin {"at", "includes", "indexOf", "lastIndexOf", "join", "fill", "reverse", "slice",
                         "subarray", "set", "copyWithin"} ->
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
                                      ELSE <<view.viewed, begin, count>>, TRUE)
            IN CASE buffer.isDetached -> Thrown(heap, "TypeError")
                 [] begin + (IF isTracking THEN 0 ELSE count * ElementSize(view.elementType))
                      > Len(buffer.bytes) -> Thrown(heap, "RangeError")
                 [] OTHER -> Returned(viewing, Allocated(viewing))
       [] method = "set" ->
            LET source == argument(1)
                offset == integer(2)
                isTyped == IsTypedArray(heap, source)
                sourceView == heap.objects[source[Ref]]
                count == CASE isTyped -> ViewLength(heap, sourceView)
                           [] IsSequenceValue(source) -> Len(source)
                           [] OTHER -> ToLength(Get(heap, source, "length"))
                values ==
                  [position \\in 1..count |->
                    CASE isTyped -> TypedElement(heap, source, position - 1)
                      [] IsSequenceValue(source) -> ToElement(view.elementType, source[position])
                      [] OTHER -> ToElement(view.elementType, Get(heap, source, ToString(position - 1)))]
            IN CASE offset = NegativeInfinity \\/ (offset # Infinity /\\ offset < 0) -> Thrown(heap, "RangeError")
                 [] IsOutOfBounds(heap, view) \\/ source \\in {Undefined, Null} -> Thrown(heap, "TypeError")
                 [] ~IsSequenceValue(source) /\\ ~IsHeap(source) ->
                      Assert(FALSE, "tla-ts can't set a typed array's elements from a primitive")
                 [] isTyped /\\ IsOutOfBounds(heap, sourceView) -> Thrown(heap, "TypeError")
                 [] offset = Infinity \\/ count + offset > length -> Thrown(heap, "RangeError")
                 [] isTyped /\\ IsBigIntType(view.elementType) # IsBigIntType(sourceView.elementType) ->
                      Thrown(heap, "TypeError")
                 [] OTHER -> Returned(write(heap, offset, values), Undefined)
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
       [] method = "join" /\\ separator = separator ->
            Returned(heap, Join([position \\in 1..length |-> StringOf(elements[position])], separator))
       [] method = "fill" /\\ filled = filled ->
            LET first == start(2)
                final == end(3)
                count == IF final > first THEN final - first ELSE 0
            IN Returned(write(heap, first, [position \\in 1..count |-> filled]), ref)
       [] method = "copyWithin" ->
            LET target == start(1)
                first == start(2)
                count == IF end(3) - first < length - target THEN end(3) - first ELSE length - target
                size == ElementSize(view.elementType)
            IN Returned(IF count > 0
                        THEN WithBytes(heap, view, view.byteOffset + target * size,
                                       SubSeq(ViewedBytes(heap, view), view.byteOffset + first * size + 1,
                                              view.byteOffset + (first + count) * size))
                        ELSE heap, ref)
       [] method = "reverse" ->
            Returned(write(heap, 0, [position \\in 1..length |-> elements[length + 1 - position]]), ref)
       [] method = "slice" ->
            LET first == start(1)
                final == end(2)
                made == TypedArrayHolding(heap, ref, IF final > first THEN SubSeq(elements, first + 1, final)
                                                     ELSE <<>>, bufferPrototype, constructors)
            IN Returned(made, Allocated(made))

LOCAL SetPropertyOf(heap, ref, key, value) ==
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

SetProperty(heap, ref, key, value) == SetPropertyOf(heap, Forward(heap, ref, {"set", "getOwnPropertyDescriptor", "defineProperty"}), key, value)

\\* The elements of an array that the heap holds, which splice reads and writes whole: each index
\\* below its length is its own plain data property.
LOCAL DenseElements(heap, ref) ==
  LET object == Lookup(heap, ref)
      length == ToLength(object.values["length"])
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
  IF \\E key \\in DOMAIN object.values : IsIndex(key) /\\ ~IsShortIndex(key)
  THEN Assert(FALSE, "tla-ts can't reorder an array with an index from 2^31 - 1")
  ELSE [position \\in {ToIndex(key) : key \\in {key \\in DOMAIN object.values : IsIndex(key)}} |->
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
      last == ToLength(object.values["length"]) - 1
  IN WithOwnElements(heap, ref,
       [position \\in {last - index : index \\in DOMAIN elements} |-> elements[last - position]],
       last > 0)

\\* Whether sort() reorders an array's own elements in one step: its elements are ordinary data
\\* properties, its prototypes hold no elements, and it takes new ones, so that no getter or setter
\\* runs and no write fails.
SortsInPlace(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN /\\ object.prototype = Null \\/ IndexKeys(heap, object.prototype) = {}
     /\\ \\A key \\in {key \\in DOMAIN object.values : IsIndex(key)} : object.attributes[key] = Writable
     /\\ object.extensible

\\* The heap after sort() deletes each index of an array from one up to another, in order, and whether
\\* it throws a TypeError where an index is an element it can't delete.
RECURSIVE ArrayDeleteFrom(_, _, _, _)
ArrayDeleteFrom(heap, ref, from, to) ==
  LET key == ToString(from)
      object == Lookup(heap, ref)
  IN CASE from >= to -> [heap |-> heap, isThrown |-> FALSE]
       [] key \\in DOMAIN object.values /\\ ~object.attributes[key].configurable ->
            [heap |-> heap, isThrown |-> TRUE]
       [] OTHER -> ArrayDeleteFrom(Delete(heap, ref, key), ref, from + 1, to)

\\* sort() on an array that the heap holds, which sorts the elements it has to its start, with
\\* undefined after them and the holes last.
ArraySort(heap, ref, IsBefore(_, _), mayThrow) ==
  LET elements == OwnElements(Lookup(heap, ref))
      present == DOMAIN elements
      ordered == [position \\in 1..Cardinality(present) |->
                   elements[CHOOSE element \\in present :
                              Cardinality({other \\in present : other < element}) = position - 1]]
      sorted == SortSequence(ordered, IsBefore, mayThrow)
  IN WithOwnElements(heap, ref, [position \\in 0..(Len(sorted) - 1) |-> sorted[position + 1]],
       present # {})

\\* copyWithin() on an array that the heap holds, where a hole that it copies deletes the element it
\\* copies over. The indices are the numbers that its arguments give, and end is Undefined where it
\\* takes the length.
ArrayCopyWithin(heap, ref, target, start, end) ==
  LET object == Lookup(heap, ref)
      elements == OwnElements(object)
      length == ToLength(object.values["length"])
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

\\* A write of an element or the length of an array that the heap holds, where a write that fails
\\* throws a TypeError: the heap after, and whether it throws.
LOCAL ArraySet(heap, ref, key, value) ==
  LET object == Lookup(heap, ref)
      written == DefineOwn(object, key, WriteDescriptor(object, key, value))
  IN CASE ~CanPut(heap, ref, key) -> [heap |-> heap, isThrown |-> TRUE]
       [] AccessorOf(heap, ref, key) # Undefined ->
            [heap |-> SetProperty(heap, ref, key, value), isThrown |-> FALSE]
       [] written.isDone -> [heap |-> Update(heap, ref, written.object), isThrown |-> FALSE]
       [] written.isRangeError ->
            Assert(FALSE, "tla-ts can't throw the RangeError of an invalid array length")
       [] OTHER -> [heap |-> heap, isThrown |-> TRUE]

\\* DeletePropertyOrThrow of an index of an array that the heap holds.
LOCAL ArrayDelete(heap, ref, key) ==
  IF CanDelete(heap, ref, key)
  THEN [heap |-> Delete(heap, ref, key), isThrown |-> FALSE]
  ELSE [heap |-> heap, isThrown |-> TRUE]

\\* A step that runs where no earlier one threw.
LOCAL AndThen(state, Step(_)) == IF state.isThrown THEN state ELSE Step(state.heap)

\\* Moves elements of an array that the heap holds by an offset, from the lowest index or from the
\\* highest, where a hole deletes the index it moves to.
RECURSIVE ArrayMoves(_, _, _, _, _)
ArrayMoves(state, ref, froms, offset, isAscending) ==
  IF state.isThrown \\/ froms = {}
  THEN state
  ELSE LET from == CHOOSE index \\in froms :
                     \\A other \\in froms : IF isAscending THEN index <= other ELSE index >= other
           key == ToString(from + offset)
           value == Get(state.heap, ref, ToString(from))
       IN ArrayMoves(
            CASE ~Has(state.heap, ref, ToString(from)) -> ArrayDelete(state.heap, ref, key)
              \\* HACK: TLC reads a value only where it needs it, and Get runs before a write that
              \\* fails, so comparing the value reads it first.
              [] value = value -> ArraySet(state.heap, ref, key, value),
            ref, froms \\ {from}, offset, isAscending)

\\* Writes items to an array that the heap holds from an index on.
RECURSIVE ArraySets(_, _, _, _)
ArraySets(state, ref, from, items) ==
  IF state.isThrown \\/ items = <<>>
  THEN state
  ELSE ArraySets(AndThen(state, LAMBDA heap : ArraySet(heap, ref, ToString(from), Head(items))),
                 ref, from + 1, Tail(items))

\\* What push, pop, shift, or unshift does to an array or an array-like object that the heap holds:
\\* the heap after, the value that the method gives, and whether it throws a TypeError. An array whose
\\* elements are its own writable data properties, whose prototypes hold no elements, and that takes
\\* new ones and a new length changes in one step. Any other changes index by index as the spec runs
\\* it, where a move reads each index through the prototypes, and only the indices that the object or
\\* its prototypes hold, or that a move deletes, move. The length and the element that pop or shift
\\* gives are those it read, which a getter may have answered before the heap became this one.
ArrayChangeFrom(heap, ref, method, items, length, first) ==
  LET object == Lookup(heap, ref)
      indices == HeldIndices(heap, ref)
      own == {ToIndex(key) : key \\in {key \\in DOMAIN object.values : IsShortIndex(key)}}
      count == Len(items)
      start == [heap |-> heap, isThrown |-> FALSE]
      setLength(state, value) == AndThen(state, LAMBDA after : ArraySet(after, ref, "length", value))
      removed == AndThen(
                   IF method = "shift"
                   THEN ArrayMoves(start, ref,
                          {index \\in indices \\cup {index + 1 : index \\in own} :
                             index >= 1 /\\ index < length}, -1, TRUE)
                   ELSE start,
                   LAMBDA after : ArrayDelete(after, ref, ToString(length - 1)))
      added == CASE method = "push" -> ArraySets(start, ref, length, items)
                 [] count = 0 -> start
                 [] OTHER -> ArraySets(
                               ArrayMoves(start, ref,
                                 {index \\in indices \\cup {index - count : index \\in own} :
                                    index >= 0 /\\ index < length}, count, FALSE),
                               ref, 0, items)
      elements == [position \\in 1..length |-> object.values[ToString(position - 1)]]
      changed == CASE method = "push" -> elements \\o items
                   [] method = "unshift" -> items \\o elements
                   [] elements = <<>> -> elements
                   [] method = "pop" -> SubSeq(elements, 1, length - 1)
                   [] method = "shift" -> Tail(elements)
      state == CASE method \\in {"push", "unshift"} -> setLength(added, length + count)
                 [] length = 0 -> setLength(start, 0)
                 [] OTHER -> setLength(removed, length - 1)
  IN IF /\\ IsArrayObject(object)
        /\\ own = 0..(length - 1)
        /\\ \\A index \\in own : object.attributes[ToString(index)] = Writable
        /\\ object.prototype = Null \\/ IndexKeys(heap, object.prototype) = {}
        /\\ object.extensible
        /\\ object.attributes["length"].writable
     THEN [heap |-> WithElements(heap, ref, changed, Len(changed)),
           value |-> CASE method \\in {"push", "unshift"} -> Len(changed)
                       [] elements = <<>> -> Undefined
                       [] method = "pop" -> elements[length]
                       [] method = "shift" -> Head(elements),
           isThrown |-> FALSE]
     ELSE [heap |-> state.heap,
           value |-> CASE method \\in {"push", "unshift"} -> length + count
                       [] length = 0 -> Undefined
                       [] OTHER -> first,
           isThrown |-> state.isThrown]

ArrayChangeOf(heap, ref, method, items, length) ==
  ArrayChangeFrom(heap, ref, method, items, length,
                  Get(heap, ref, ToString(IF method = "pop" THEN length - 1 ELSE 0)))

\\* 2^53 - 1, the greatest length.
LOCAL MaxLength == Wide :> <<4194303, 2147483647>>

LOCAL LongLength(length) ==
  IF IsWide(length) /\\ length[Wide] # <<4194304, 0>> THEN length ELSE MaxLength

\\* Whether an object that the heap holds has a length past 2^31 that no getter or trap gives.
HasLongLength(heap, ref) ==
  /\\ IsHeap(ref)
  /\\ ~IsProxy(heap, ref)
  /\\ GetterOf(heap, ref, "length") = Undefined
  /\\ IsLong(Get(heap, ref, "length"))

\\* indexOf or lastIndexOf on an array-like object whose length is past 2^31, which searches only the
\\* keys that the object or its prototypes hold, from an index that an integer or an infinity gives.
LongSearch(heap, ref, target, from, isLast) ==
  LET length == LongLength(Get(heap, ref, "length"))
      last == Add(length, -1)
      given == IF from = NegativeZero THEN 0 ELSE from
      start ==
        CASE given = Undefined -> IF isLast THEN last ELSE 0
          [] given \\in {Infinity, NegativeInfinity} \\/ IsWide(given) \\/ IsInteger(given) ->
               CASE given = NegativeInfinity -> IF isLast THEN -1 ELSE 0
                 [] ~IsNegative(given) -> IF isLast /\\ LessThan(last, given) THEN last ELSE given
                 [] LessThan(Add(length, given), 0) -> IF isLast THEN -1 ELSE 0
                 [] OTHER -> Add(length, given)
          [] OTHER -> Assert(FALSE, "tla-ts can't search an array-like object from this index")
      isSearched(value) ==
        IF isLast
        THEN ~LessThan(start, value)
        ELSE ~LessThan(value, start) /\\ LessThan(value, length)
      found == {key \\in LongKeys(heap, ref) :
                  isSearched(DecimalOf(key)) /\\ StrictEquals(Get(heap, ref, key), target)}
  IN CASE IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't search this object")
       [] found = {} -> -1
       [] OTHER ->
            DecimalOf(CHOOSE key \\in found :
                        \\A other \\in found :
                          IF isLast
                          THEN ~LessThan(DecimalOf(key), DecimalOf(other))
                          ELSE ~LessThan(DecimalOf(other), DecimalOf(key)))

\\* Writes items to an array-like object from an index that may be past 2^31.
RECURSIVE LongSets(_, _, _, _)
LongSets(state, ref, from, items) ==
  IF state.isThrown \\/ items = <<>>
  THEN state
  ELSE LongSets(AndThen(state, LAMBDA heap : ArraySet(heap, ref, StringOf(from), Head(items))),
                ref, Add(from, 1), Tail(items))

\\* pop or push on an array-like object whose length is past 2^31, which moves no element: pop
\\* reads and deletes the last index, and push throws a TypeError past 2^53 - 1.
LOCAL LongChange(heap, ref, method, items, length) ==
  IF method = "pop"
  THEN LET last == Add(length, -1)
           value == Get(heap, ref, StringOf(last))
           state == AndThen(ArrayDelete(heap, ref, StringOf(last)),
                            LAMBDA after : ArraySet(after, ref, "length", last))
       IN [heap |-> state.heap, value |-> value, isThrown |-> state.isThrown]
  ELSE LET total == Add(length, Len(items))
           state == AndThen(LongSets([heap |-> heap, isThrown |-> FALSE], ref, length, items),
                            LAMBDA after : ArraySet(after, ref, "length", total))
       IN IF LessThan(MaxLength, total)
          THEN [heap |-> heap, value |-> Undefined, isThrown |-> TRUE]
          ELSE [heap |-> state.heap, value |-> total, isThrown |-> state.isThrown]

\\* Moves the elements of an array-like object at keys below 2^53 by an offset, from the lowest key
\\* or from the highest, where a hole deletes the key it moves to.
RECURSIVE LongMoves(_, _, _, _, _)
LongMoves(state, ref, froms, offset, isAscending) ==
  IF state.isThrown \\/ froms = {}
  THEN state
  ELSE LET from == CHOOSE key \\in froms :
                     \\A other \\in froms :
                       IF isAscending
                       THEN ~LessThan(DecimalOf(other), DecimalOf(key))
                       ELSE ~LessThan(DecimalOf(key), DecimalOf(other))
           key == StringOf(Add(DecimalOf(from), offset))
           value == Get(state.heap, ref, from)
       IN LongMoves(
            CASE ~Has(state.heap, ref, from) -> ArrayDelete(state.heap, ref, key)
              \\* HACK: TLC reads a value only where it needs it, and Get runs before a write that
              \\* fails, so comparing the value reads it first.
              [] value = value -> ArraySet(state.heap, ref, key, value),
            ref, froms \\ {from}, offset, isAscending)

\\* unshift on an array-like object whose length is past 2^31, which throws a TypeError where the
\\* length it gives passes 2^53 - 1, and moves only the keys that the object or its prototypes
\\* hold, or that a move deletes.
LOCAL LongUnshift(heap, ref, items, length) ==
  LET count == Len(items)
      total == Add(length, count)
      own == {key \\in DOMAIN Lookup(heap, ref).values : IsLongKey(key)}
      isMoved(value) == ~IsNegative(value) /\\ LessThan(value, length)
      froms == IF count = 0
               THEN {}
               ELSE {key \\in LongKeys(heap, ref) : isMoved(DecimalOf(key))}
                      \\cup {StringOf(Add(DecimalOf(key), -count)) :
                            key \\in {key \\in own : isMoved(Add(DecimalOf(key), -count))}}
      state == AndThen(ArraySets(LongMoves([heap |-> heap, isThrown |-> FALSE], ref, froms, count, FALSE),
                                 ref, 0, items),
                       LAMBDA after : ArraySet(after, ref, "length", total))
  IN CASE ~IsHeap(ref) \\/ IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't unshift onto this object")
       [] count > 0 /\\ LessThan(MaxLength, total) ->
            [heap |-> heap, value |-> Undefined, isThrown |-> TRUE]
       [] OTHER -> [heap |-> state.heap, value |-> total, isThrown |-> state.isThrown]

ArrayChange(heap, ref, method, items) ==
  LET raw == Get(heap, ref, "length")
  IN CASE method \\in {"pop", "push"} /\\ IsLong(raw) ->
            LongChange(heap, ref, method, items, LongLength(raw))
       [] method = "unshift" /\\ IsLong(raw) -> LongUnshift(heap, ref, items, LongLength(raw))
       [] OTHER -> ArrayChangeOf(heap, ref, method, items, LengthOf(heap, ref))

\\* The index that a relative index argument gives for an array-like object's length.
LOCAL LongIndex(value, length) ==
  CASE value \\in {Undefined, NegativeZero, NegativeInfinity} -> 0
    [] value = Infinity -> length
    \\* An integer that a double holds is beyond 2^53, so past every length.
    [] IsDouble(value) /\\ value[Double][2] >= 0 -> IF IsNegative(value) THEN 0 ELSE length
    [] IsWide(value) \\/ IsInteger(value) ->
         CASE ~IsNegative(value) -> IF LessThan(length, value) THEN length ELSE value
           [] LessThan(Add(length, value), 0) -> 0
           [] OTHER -> Add(length, value)
    [] OTHER -> Assert(FALSE, "tla-ts can't use this index of an array-like object")

\\* fill on an array-like object that the heap holds, which writes the value at each index from start
\\* to end, and throws a TypeError where a write fails.
ArrayLikeFill(heap, ref, value, start, end) ==
  LET raw == Get(heap, ref, "length")
      length == IF IsLong(raw) THEN LongLength(raw) ELSE ToLength(raw)
      first == LongIndex(start, length)
      final == IF end = Undefined THEN length ELSE LongIndex(end, length)
      count == IF LessThan(first, final) THEN Subtract(final, first) ELSE 0
  IN CASE ~IsHeap(ref) \\/ IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't fill this object")
       [] IsBig(count) -> Assert(FALSE, "tla-ts can't fill this many elements")
       [] OTHER ->
            LET state == LongSets([heap |-> heap, isThrown |-> FALSE], ref, first,
                                  [position \\in 1..count |-> value])
            IN [heap |-> state.heap, value |-> ref, isThrown |-> state.isThrown]

\\* slice of an array-like object whose length is past 2^31, which gives the elements from start to
\\* end where the object or its prototypes hold each.
LongSlice(heap, ref, start, end) ==
  LET length == LongLength(Get(heap, ref, "length"))
      first == LongIndex(start, length)
      final == IF end = Undefined THEN length ELSE LongIndex(end, length)
      count == IF LessThan(first, final) THEN Subtract(final, first) ELSE 0
      keys == [position \\in 1..count |-> StringOf(Add(first, position - 1))]
  IN CASE IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't slice this object")
       [] IsBig(count) -> Assert(FALSE, "tla-ts can't slice this many elements")
       [] \\E position \\in 1..count : ~Has(heap, ref, keys[position]) ->
            Assert(FALSE, "tla-ts can't slice an array-like object with holes")
       [] OTHER -> [position \\in 1..count |-> Get(heap, ref, keys[position])]

\\* toSpliced of an array-like object whose length is past 2^31, which reads each index it keeps,
\\* where count is how many of start and skipCount a call passes.
LongToSpliced(heap, ref, start, skip, items, count) ==
  LET length == LongLength(Get(heap, ref, "length"))
      first == IF count = 0 THEN 0 ELSE LongIndex(start, length)
      rest == Subtract(length, first)
      skipped == CASE count = 0 -> 0
                   [] count = 1 -> rest
                   [] skip \\in {Undefined, NegativeZero, NegativeInfinity} -> 0
                   [] skip = Infinity -> rest
                   [] IsDouble(skip) /\\ skip[Double][2] >= 0 -> IF IsNegative(skip) THEN 0 ELSE rest
                   [] IsWide(skip) \\/ IsInteger(skip) ->
                        CASE IsNegative(skip) -> 0
                          [] LessThan(rest, skip) -> rest
                          [] OTHER -> skip
                   [] OTHER -> Assert(FALSE, "tla-ts can't use this index of an array-like object")
      after == Add(first, skipped)
      kept == Subtract(length, after)
      read(from, size) == [position \\in 1..size |-> Get(heap, ref, StringOf(Add(from, position - 1)))]
  IN CASE IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't splice this object")
       [] IsBig(first) \\/ IsBig(kept) -> Assert(FALSE, "tla-ts can't splice this many elements")
       [] OTHER -> read(0, first) \\o items \\o read(after, kept)

\\* copyWithin on an array-like object whose length is past 2^31, which moves only the keys that the
\\* object or its prototypes hold, and those that copy over them.
LOCAL LongCopyWithin(heap, ref, target, start, end) ==
  LET length == LongLength(Get(heap, ref, "length"))
      to == LongIndex(target, length)
      from == LongIndex(start, length)
      final == IF end = Undefined THEN length ELSE LongIndex(end, length)
      count == IF LessThan(Subtract(final, from), Subtract(length, to))
               THEN Subtract(final, from)
               ELSE Subtract(length, to)
      offset == Subtract(to, from)
      isFrom(value) == ~LessThan(value, from) /\\ LessThan(value, Add(from, count))
      keys == LongKeys(heap, ref)
      froms == {key \\in keys : isFrom(DecimalOf(key))}
                 \\cup {StringOf(Subtract(DecimalOf(key), offset)) :
                       key \\in {key \\in keys : isFrom(Subtract(DecimalOf(key), offset))}}
      state == LongMoves([heap |-> heap, isThrown |-> FALSE], ref, froms, offset,
                         ~(LessThan(from, to) /\\ LessThan(to, Add(from, count))))
  IN CASE IsProxy(heap, ref) \\/ IsTypedArray(heap, ref) \\/ heap.objects[ref[Ref]].isOpaque ->
            Assert(FALSE, "tla-ts can't copy within this object")
       [] ~LessThan(0, count) -> [heap |-> heap, value |-> ref, isThrown |-> FALSE]
       [] OTHER -> [heap |-> state.heap, value |-> ref, isThrown |-> state.isThrown]

\\* The code of the getter that copyWithin reads first, at the index it copies from first, where it
\\* copies any, or Undefined.
\\* An object whose length is past 2^31 reads its elements as copyWithin moves them.
CopyWithinFirstGetter(heap, ref, target, start, end) ==
  IF HasLongLength(heap, ref) THEN Undefined ELSE
  LET length == ToLength(Get(heap, ref, "length"))
      to == ClampedIndex(target, length)
      from == ClampedIndex(start, length)
      final == IF end = Undefined THEN length ELSE ClampedIndex(end, length)
      count == IF final - from < length - to THEN final - from ELSE length - to
      first == IF from < to /\\ to < from + count THEN from + count - 1 ELSE from
  IN IF /\\ IsHeap(ref)
        /\\ ~IsProxy(heap, ref)
        /\\ count > 0
        /\\ GetterOf(heap, ref, ToString(first)) # Undefined
     THEN CodeOf(heap, GetterOf(heap, ref, ToString(first)))
     ELSE Undefined

\\* copyWithin() on an array-like object that the heap holds, as the spec runs it index by index,
\\* backward where the indices it copies to overlap the end of those it copies from, where only the
\\* indices that the object or its prototypes hold, and those that copy over them, change. The
\\* indices are the numbers that its arguments give, and end is Undefined where it takes the length.
LOCAL ShortCopyWithin(heap, ref, target, start, end) ==
  LET length == LengthOf(heap, ref)
      to == ClampedIndex(target, length)
      from == ClampedIndex(start, length)
      final == IF end = Undefined THEN length ELSE ClampedIndex(end, length)
      count == IF final - from < length - to THEN final - from ELSE length - to
      indices == HeldIndices(heap, ref)
      froms == {index \\in indices \\cup {index - to + from : index \\in indices} :
                  index >= from /\\ index < from + count}
      state == ArrayMoves([heap |-> heap, isThrown |-> FALSE], ref, froms, to - from,
                 ~(from < to /\\ to < from + count))
  IN IF count <= 0
     THEN [heap |-> heap, value |-> ref, isThrown |-> FALSE]
     ELSE [heap |-> state.heap, value |-> ref, isThrown |-> state.isThrown]

ArrayLikeCopyWithin(heap, ref, target, start, end) ==
  IF HasLongLength(heap, ref)
  THEN LongCopyWithin(heap, ref, target, start, end)
  ELSE ShortCopyWithin(heap, ref, target, start, end)

\\* Swaps the elements of an array-like object at each index below the middle of its length and the
\\* index as far from its end, from the lowest, where a hole deletes the index it swaps with.
RECURSIVE ArrayLikeSwaps(_, _, _, _)
ArrayLikeSwaps(state, ref, lowers, length) ==
  IF state.isThrown \\/ lowers = {}
  THEN state
  ELSE LET lower == CHOOSE index \\in lowers : \\A other \\in lowers : index <= other
           lowerKey == ToString(lower)
           upperKey == ToString(length - lower - 1)
           heap == state.heap
           lowerValue == Get(heap, ref, lowerKey)
           upperValue == Get(heap, ref, upperKey)
           hasLower == Has(heap, ref, lowerKey)
           hasUpper == Has(heap, ref, upperKey)
       IN ArrayLikeSwaps(
            CASE hasLower /\\ hasUpper ->
                   AndThen(ArraySet(heap, ref, lowerKey, upperValue),
                           LAMBDA after : ArraySet(after, ref, upperKey, lowerValue))
              [] hasUpper ->
                   AndThen(ArraySet(heap, ref, lowerKey, upperValue),
                           LAMBDA after : ArrayDelete(after, ref, upperKey))
              [] hasLower ->
                   AndThen(ArrayDelete(heap, ref, lowerKey),
                           LAMBDA after : ArraySet(after, ref, upperKey, lowerValue))
              [] OTHER -> state,
            ref, lowers \\ {lower}, length)

\\* reverse() on an array-like object that the heap holds, as the spec runs it index by index, where
\\* only the indices that the object or its prototypes hold, and those they swap with, change.
ArrayLikeReverse(heap, ref) ==
  LET length == LengthOf(heap, ref)
      indices == HeldIndices(heap, ref)
      lowers == {index \\in indices \\cup {length - index - 1 : index \\in indices} :
                   index >= 0 /\\ index < length \\div 2}
      state == ArrayLikeSwaps([heap |-> heap, isThrown |-> FALSE], ref, lowers, length)
  IN IF length < 2
     THEN [heap |-> heap, value |-> ref, isThrown |-> FALSE]
     ELSE [heap |-> state.heap, value |-> ref, isThrown |-> state.isThrown]

\\* A set or a map that the heap holds, so that it keeps its identity as a script changes it, with
\\* the value that it holds as its data.
CollectionObject(prototype, data) == [data |-> data] @@ [EmptyObject EXCEPT !.prototype = prototype]

\\* The value that a set or a map that the heap holds has, or undefined or null as an optional chain
\\* reads them.
CollectionData(heap, ref) == IF ref \\in {Undefined, Null} THEN ref ELSE heap.objects[ref[Ref]].data

WithCollectionData(heap, ref, data) == [heap EXCEPT !.objects[ref[Ref]].data = data]

\\* The keys of a set's or a map's data.
LOCAL CollectionKeys(data, isMap) == IF isMap THEN DOMAIN data ELSE data

RECURSIVE DistinctKeys(_, _)
\\* The keys of a sequence in the order that each first comes, after those that kept holds.
DistinctKeys(keys, kept) ==
  IF keys = <<>>
  THEN kept
  ELSE DistinctKeys(Tail(keys),
                    IF \\E position \\in DOMAIN kept : kept[position] = Head(keys)
                    THEN kept
                    ELSE Append(kept, Head(keys)))

\\* A set or a map that the heap holds in a script that iterates one, which keeps the order that a
\\* script added its keys in, as the keys that made it give them.
OrderedCollectionObject(prototype, data, keys, isMap) ==
  LET order == DistinctKeys(SelectSeq(keys, LAMBDA key : key \\in CollectionKeys(data, isMap)), <<>>)
  IN IF Len(order) = Cardinality(CollectionKeys(data, isMap))
     THEN [order |-> order] @@ CollectionObject(prototype, data)
     ELSE Assert(FALSE, "tla-ts can't tell the order of this collection's keys")

\\* Whether a set or a map knows the order of its keys, which one that a script made from a set
\\* without an order doesn't.
HasOrder(heap, ref) == "order" \\in DOMAIN heap.objects[ref[Ref]]

\\* WithCollectionData of an ordered set or map, which drops the keys that a change removes and adds
\\* the key that it adds last.
WithOrderedCollectionData(heap, ref, data, isMap) ==
  IF ~HasOrder(heap, ref) THEN WithCollectionData(heap, ref, data) ELSE
  LET keys == CollectionKeys(data, isMap)
      kept == SelectSeq(heap.objects[ref[Ref]].order, LAMBDA key : key \\in keys)
      added == keys \\ {kept[position] : position \\in DOMAIN kept}
  IN [heap EXCEPT !.objects[ref[Ref]].data = data,
                  !.objects[ref[Ref]].order =
                    CASE added = {} -> kept
                      [] Cardinality(added) = 1 -> Append(kept, CHOOSE key \\in added : TRUE)
                      [] OTHER -> Assert(FALSE, "tla-ts can't tell the order of this collection's keys")]

\\* The order of the keys that Set.prototype's union, intersection, difference, or
\\* symmetricDifference gives them in, from the keys of the set it runs on and those that the other
\\* collection's keys gives. intersection iterates the smaller of the two.
SetMethodOrder(method, keys, otherKeys) ==
  CASE method = "intersection" -> IF Len(keys) <= Len(otherKeys) THEN keys ELSE otherKeys
    [] method = "difference" -> keys
    [] OTHER -> keys \\o otherKeys

\\* What an ordered set's or map's keys, values, or entries method iterates, in the order of its keys,
\\* where a set's value is its key.
OrderedValues(heap, ref, isMap, method) ==
  LET object == heap.objects[ref[Ref]]
      order == object.order
      ValueAt(key) == IF isMap THEN object.data[key] ELSE key
  IN IF ~HasOrder(heap, ref)
     THEN Assert(FALSE, "tla-ts can't tell the order of this collection's keys")
     ELSE CASE method = "keys" -> order
            [] method = "values" -> [position \\in DOMAIN order |-> ValueAt(order[position])]
            [] OTHER -> [position \\in DOMAIN order |-> <<order[position], ValueAt(order[position])>>]

\\* The set that a set method gives, which keeps its order where the set that it runs on and the
\\* other collection keep theirs.
SetMethodObject(heap, prototype, data, method, ref, other, otherKeys) ==
  IF HasOrder(heap, ref) /\\ HasOrder(heap, other)
  THEN OrderedCollectionObject(
         prototype, data, SetMethodOrder(method, OrderedValues(heap, ref, FALSE, "keys"), otherKeys), FALSE)
  ELSE CollectionObject(prototype, data)

\\* The elements of a set in an order that TLC picks, which only a loop that ends the same in any
\\* order visits, as a set that TLC holds keeps no insertion order.
RECURSIVE SetToSequence(_)
SetToSequence(set) ==
  IF set = {}
  THEN <<>>
  ELSE LET element == CHOOSE element \\in set : TRUE
       IN <<element>> \\o SetToSequence(set \\ {element})

\\* Deletes the indices of an array that the heap holds from one below an end down to a start.
RECURSIVE ArrayDeletesDown(_, _, _, _)
ArrayDeletesDown(state, ref, from, to) ==
  IF state.isThrown \\/ to <= from
  THEN state
  ELSE ArrayDeletesDown(AndThen(state, LAMBDA heap : ArrayDelete(heap, ref, ToString(to - 1))),
                        ref, from, to - 1)

\\* What a splice does to an array that the heap holds, and the elements that it removes, where it
\\* makes the array of them through the array's constructor, which tla-ts follows only for Array.
\\* An array with holes changes index by index as the spec runs it, where a hole that a move reads
\\* deletes the index it moves to.
ArraySplice(heap, ref, start, hasCount, count, items, array) ==
  LET object == Lookup(heap, ref)
      own == {ToIndex(key) : key \\in {key \\in DOMAIN object.values : IsIndex(key)}}
      length == object.values["length"]
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
                elements == DenseElements(heap, ref)
                changed == SubSeq(elements, 1, first) \\o items
                             \\o SubSeq(elements, first + deleted + 1, length)
                indices == {ToIndex(key) : key \\in IndexKeys(heap, ref)}
                offset == Len(items) - deleted
                begun == [heap |-> heap, isThrown |-> FALSE]
                moved == IF offset = 0
                         THEN begun
                         ELSE ArrayMoves(begun, ref,
                                {index \\in indices \\cup {index - offset : index \\in own} :
                                   index >= first + deleted /\\ index < length}, offset, offset < 0)
                state == AndThen(
                           ArraySets(ArrayDeletesDown(moved, ref, length + offset, length),
                                     ref, first, items),
                           LAMBDA after : ArraySet(after, ref, "length", length + offset))
            IN CASE own = 0..(length - 1) ->
                      Species(Get(heap, ref, "constructor"), array,
                              [heap |-> WithElements(heap, ref, changed, Len(changed)),
                               value |-> SubSeq(elements, first + 1, first + deleted),
                               isThrown |-> FALSE])
                 [] \\E index \\in first..(first + deleted - 1) : index \\notin indices ->
                      Assert(FALSE, "tla-ts can't splice out a hole")
                 [] OTHER ->
                      Species(Get(heap, ref, "constructor"), array,
                              [heap |-> state.heap,
                               value |-> [position \\in 1..deleted |->
                                           Get(heap, ref, ToString(first + position - 1))],
                               isThrown |-> state.isThrown])

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
\\* that inherits from Object.prototype, and only functions that the heap holds read it. A primitive
\\* reads only the built-in keys of its prototype as tla-ts compiles, and stops at any other key, so a
\\* script may define an accessor under a string key that is neither of those nor an index. A typed
\\* array, which the heap holds, reads its prototypes' accessors as any object on the heap does.
LOCAL CanDefineOn(ref, key, descriptor) ==
  Assert(\\/ IsHeap(ref)
         \\/ ~descriptor.isAccessor
         \\/ BuiltInKey(ref) \\in {"Array.prototype", "Object.prototype"}
         \\/ BuiltInKey(ref) \\in {"%Int8Array.prototype.[[Prototype]]%"} \\cup
              {type \\o "Array.prototype" :
                 type \\in {"Int8", "Uint8", "Uint8Clamped", "Int16", "Uint16", "Float16", "Int32",
                          "Uint32", "Float32", "Float64", "BigInt64", "BigUint64"}}
         \\/ /\\ BuiltInKey(ref) \\in {"Boolean.prototype", "Number.prototype", "String.prototype",
                                 "Error.prototype", "Date.prototype", "RegExp.prototype"}
            /\\ ~IsSymbol(key)
            /\\ TypedKey(key) = "property"
            /\\ key \\notin DOMAIN BuiltIns[BuiltInKey(ref)].values
         \\/ /\\ ~IsRef(ref)
            /\\ IsBuiltIn(ref)
            /\\ BuiltIns[ref].isCallable
            /\\ BuiltIns[ref].prototype = Ref :> "Object.prototype",
         "tla-ts can't define accessors on built-in objects")

\\* A typed array's [[DefineOwnProperty]] of a key that is a number, which defines nothing where the
\\* key isn't an index before the end or the descriptor isn't of a writable, enumerable, configurable
\\* data property, and otherwise writes the value, if any.
LOCAL TypedDefine(heap, ref, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      isDone == /\\ HasElement(heap, ref, key)
                /\\ ~descriptor.isAccessor
                /\\ \\A field \\in {"writable", "enumerable", "configurable"} : has(field) => descriptor[field]
  IN [heap |-> IF isDone /\\ has("value") THEN TypedSet(heap, ref, key, descriptor.value) ELSE heap,
      isDone |-> isDone, isRangeError |-> FALSE]

\\* Defines each key with the descriptor that ToPropertyDescriptor gave it, in order.
LOCAL DefineConvertedAllOf(heap, ref, keys, descriptors) ==
  LET applied == ApplyAll(IF IsTypedArray(heap, ref)
                          THEN heap.objects[ref[Ref]]
                          ELSE LookupKeys(heap, ref, {keys[position] : position \\in DOMAIN keys}),
                          keys, descriptors)
  IN CASE \\E position \\in DOMAIN keys : ~descriptors[position].isValid ->
            [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
       [] IsSequenceValue(ref) -> Assert(FALSE, "tla-ts can't change an object that the heap doesn't hold")
       [] \\E position \\in DOMAIN keys : ~CanDefineOn(ref, keys[position], descriptors[position]) ->
            [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
       [] IsTypedArray(heap, ref) /\\ \\E position \\in DOMAIN keys : TypedKey(keys[position]) # "property" ->
            IF Len(keys) = 1
            THEN TypedDefine(heap, ref, keys[1], descriptors[1])
            ELSE Assert(FALSE, "tla-ts can't define several keys of a typed array at once")
       [] OTHER ->
            [heap |-> Update(heap, ref, applied.object), isDone |-> applied.isDone,
             isRangeError |-> applied.isRangeError]

DefineConvertedAll(heap, ref, keys, descriptors) == DefineConvertedAllOf(heap, Forward(heap, ref, {"defineProperty"}), keys, descriptors)

DefineConverted(heap, ref, key, converted) == DefineConvertedAll(heap, ref, <<key>>, <<converted>>)

\\* Object.prototype.__defineGetter__ and __defineSetter__, which define an enumerable, configurable
\\* half of an accessor where the function is callable.
DefineLegacyAccessor(heap, ref, key, field, function) ==
  LET fields == {field, "enumerable", "configurable"}
      values == [name \\in fields |-> IF name = field THEN function ELSE TRUE]
  IN DefineConverted(heap, ref, key, FieldsDescriptor(heap, fields, values))

DefineProperty(heap, ref, key, descriptor) ==
  IF IsObjectArgument(ref) /\\ IsObjectArgument(descriptor)
  THEN DefineConverted(heap, ref, key, ToDescriptor(heap, descriptor))
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]

\\* Reflect.defineProperty of the descriptor that ToPropertyDescriptor gave, which throws a TypeError
\\* only where the descriptor isn't valid, and gives whether it defined the key otherwise.
ReflectDefineConverted(heap, ref, key, converted) ==
  IF converted.isValid
  THEN LET defined == DefineConverted(heap, ref, key, converted)
       IN [heap |-> defined.heap, isDone |-> ~defined.isRangeError,
           isRangeError |-> defined.isRangeError, value |-> defined.isDone]
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]

\\* Reflect.defineProperty, which also throws a TypeError where its target or its descriptor isn't an
\\* object.
ReflectDefineProperty(heap, ref, key, descriptor) ==
  IF IsObjectArgument(ref) /\\ IsObjectArgument(descriptor)
  THEN ReflectDefineConverted(heap, ref, key, ToDescriptor(heap, descriptor))
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]

\\* Reflect.deleteProperty, which gives whether it deleted the key, and throws a TypeError where the
\\* target isn't an object.
ReflectDeleteProperty(heap, ref, key) ==
  IF IsObjectArgument(ref)
  THEN LET isDeleted == CanDelete(heap, ref, key)
       IN [heap |-> IF isDeleted THEN Delete(heap, ref, key) ELSE heap, isDone |-> TRUE,
           isRangeError |-> FALSE, value |-> isDeleted]
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]

\\* The setter that Reflect.set calls, where a typed array's element calls none.
ReflectSetter(heap, ref, key) ==
  IF IsTypedArray(heap, ref) /\\ TypedKey(key) # "property"
  THEN Undefined
  ELSE SetterOf(heap, ref, key)

LOCAL ReflectSetGives(heap, value) ==
  [heap |-> heap, isDone |-> TRUE, isRangeError |-> FALSE, value |-> value]

\\* OrdinarySet's write of a data property, which the receiver defines on itself: a write to its own
\\* writable data property changes the value, and a new key makes a writable one where it can.
LOCAL ReceiverSet(heap, key, value, receiver) ==
  CASE ~IsObjectIn(heap, receiver) -> ReflectSetGives(heap, FALSE)
    [] \\/ ~IsHeap(receiver)
       \\/ IsProxy(heap, receiver)
       \\/ IsTypedArray(heap, receiver) /\\ TypedKey(key) # "property" ->
         Assert(FALSE, "tla-ts can't set a property on this receiver")
    [] OTHER ->
         LET object == Lookup(heap, receiver)
             defined == DefineOwn(object, key, WriteDescriptor(object, key, value))
         IN CASE /\\ key \\in DOMAIN object.values
                 /\\ \\/ object.attributes[key].kind = "accessor"
                    \\/ ~object.attributes[key].writable ->
                   ReflectSetGives(heap, FALSE)
              [] defined.isRangeError ->
                   [heap |-> heap, isDone |-> FALSE, isRangeError |-> TRUE, value |-> FALSE]
              [] defined.isDone -> ReflectSetGives(Update(heap, receiver, defined.object), TRUE)
              [] OTHER -> ReflectSetGives(heap, FALSE)

\\* Reflect.set where no setter that the script writes runs: the heap after it, and whether it set
\\* the key, as OrdinarySet does with a receiver. A typed array writes its own elements, and an index
\\* past its end, or a number that is no index, sets nothing. It throws a TypeError where the target
\\* isn't an object.
ReflectSet(heap, ref, key, value, receiver) ==
  LET accessor == AccessorOf(heap, ref, key)
  IN CASE ~IsObjectIn(heap, ref) ->
            [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]
       [] ~IsHeap(ref) \\/ IsProxy(heap, ref) ->
            Assert(FALSE, "tla-ts can't set a property of this object through Reflect.set")
       [] IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" ->
            CASE SameValue(ref, receiver) -> ReflectSetGives(TypedSet(heap, ref, key, value), TRUE)
              [] \\/ TypedKey(key) # "index"
                 \\/ ToIndex(key) >= ViewLength(heap, heap.objects[ref[Ref]]) ->
                   ReflectSetGives(heap, TRUE)
              [] OTHER -> ReceiverSet(heap, key, value, receiver)
       [] accessor # Undefined ->
            CASE accessor.set = Undefined -> ReflectSetGives(heap, FALSE)
              [] accessor.set \\in DOMAIN ConstantFunctions -> ReflectSetGives(heap, TRUE)
              [] OTHER -> Assert(FALSE, "tla-ts can't call setters")
       [] ~IsWritable(heap, ref, key) -> ReflectSetGives(heap, FALSE)
       [] OTHER -> ReceiverSet(heap, key, value, receiver)

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

\\* The keys of an object that InternalizeJSONProperty visits: an array's indices below its length,
\\* or another object's enumerable own string keys.
RevivedKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN IF IsArrayObject(object)
     THEN [position \\in 1..ToLength(object.values["length"]) |-> ToString(position - 1)]
     ELSE EnumerableKeys(object)

\\* What InternalizeJSONProperty does with the value a reviver gave for a key, which deletes the key
\\* where the value is undefined and defines it otherwise, ignoring where either fails.
Revived(heap, ref, key, value) ==
  IF value = Undefined
  THEN IF CanDelete(heap, ref, key) THEN Delete(heap, ref, key) ELSE heap
  ELSE DefineConverted(heap, ref, key,
                       [fields |-> {"value", "writable", "enumerable", "configurable"},
                        isAccessor |-> FALSE, isData |-> TRUE, isValid |-> TRUE, value |-> value,
                        get |-> Undefined, set |-> Undefined, writable |-> TRUE,
                        enumerable |-> TRUE, configurable |-> TRUE]).heap

\\* The descriptor of a definition of an array's length whose value is an object, which
\\* ArraySetLength converts to a number twice, or Null where the definition converts nothing.
LengthDescriptor(heap, ref, key, descriptor) ==
  IF key = "length" /\\ IsRef(ref) /\\ ~IsProxy(heap, ref) /\\ IsArrayObject(Lookup(heap, ref))
     /\\ IsRef(descriptor) /\\ ~IsProxy(heap, descriptor)
  THEN LET converted == ToDescriptor(heap, descriptor)
       IN IF converted.isValid /\\ IsObject(converted.value) THEN converted ELSE Null
  ELSE Null

\\* The descriptor of the length that Object.defineProperties defines where it defines only that.
PropertiesLengthDescriptor(heap, ref, properties) ==
  IF IsRef(properties) /\\ ~IsProxy(heap, properties)
     /\\ EnumerableOwnKeys(Lookup(heap, properties)) = <<"length">>
  THEN LengthDescriptor(heap, ref, "length", Value(Lookup(heap, properties), "length"))
  ELSE Null

\\* Defines an array's length with the primitives that its two conversions gave.
DefineLength(heap, ref, descriptor, first, second) ==
  DefineConverted(heap, ref, "length",
                  [descriptor EXCEPT !.value =
                     IF SameValue(first, second) THEN second
                     ELSE Assert(FALSE, "tla-ts can't define a length that converts to two values")])

ReflectDefineLength(heap, ref, descriptor, first, second) ==
  LET defined == DefineLength(heap, ref, descriptor, first, second)
  IN [heap |-> defined.heap, isDone |-> ~defined.isRangeError,
      isRangeError |-> defined.isRangeError, value |-> defined.isDone]

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

RECURSIVE GroupedObject(_, _, _)
GroupedObject(object, elements, keys) ==
  IF elements = <<>>
  THEN object
  ELSE LET key == PropertyKey(Head(keys))
           grouped == IF key \\in DOMAIN object.values
                      THEN [object EXCEPT !.values[key] = Append(@, Head(elements))]
                      ELSE Put(object, key, <<Head(elements)>>)
       IN GroupedObject(grouped, Tail(elements), Tail(keys))

\\* Object.groupBy of an array's elements and the key that its callback gives each: an object without
\\* a prototype, whose keys, in the order they first come, hold the arrays of their elements.
GroupBy(heap, elements, keys) ==
  Allocate(heap, GroupedObject([EmptyObject EXCEPT !.prototype = Null], elements, keys))

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

\\* Reflect.setPrototypeOf, which gives whether it set the prototype, and throws a TypeError where the
\\* target isn't an object or the prototype is neither an object nor null.
ReflectSetPrototypeOf(heap, ref, prototype) ==
  IF IsObjectArgument(ref) /\\ (prototype = Null \\/ IsObjectArgument(prototype))
  THEN LET set == SetPrototypeOf(heap, ref, prototype)
       IN [heap |-> set.heap, isDone |-> TRUE, isRangeError |-> FALSE, value |-> set.isDone]
  ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]

\\* The heap after the __proto__ setter of Object.prototype sets a receiver's prototype, which it
\\* leaves where the value isn't an object or null or the receiver isn't an object, and the error
\\* that it throws where the receiver refuses, or "".
ProtoSet(heap, ref, prototype) ==
  IF ~(prototype = Null \\/ IsObjectArgument(prototype)) \\/ ~IsObjectArgument(ref)
  THEN [heap |-> heap, error |-> ""]
  ELSE LET set == SetPrototypeOf(heap, ref, prototype)
       IN [heap |-> set.heap, error |-> IF set.isDone THEN "" ELSE "TypeError"]

\\* Whether a typed array keeps its length, which it must to become inextensible: it has a length of
\\* its own, and its buffer can't resize, unless it's shared, as a shared buffer only grows.
LOCAL IsFixedLength(heap, ref) ==
  LET view == heap.objects[ref[Ref]]
      buffer == heap.objects[view.viewed[Ref]]
  IN view.viewLength # -1 /\\ (buffer.maxLength = Undefined \\/ buffer.isShared)

\\* Where Object.preventExtensions, seal, or freeze throws its TypeError for a typed array: one whose
\\* length may change, and for seal and freeze one with elements, which can't become unconfigurable.
LOCAL RestrictsTypedArray(heap, ref, isSealing) ==
  CASE ~IsTypedArray(heap, ref) -> TRUE
    [] ~IsFixedLength(heap, ref) ->
         Assert(FALSE, "tla-ts can't throw the TypeError of making a typed array inextensible")
    [] isSealing /\\ ViewLength(heap, heap.objects[ref[Ref]]) > 0 ->
         Assert(FALSE, "tla-ts can't throw the TypeError of sealing a typed array's elements")
    [] OTHER -> TRUE

LOCAL Restrict(heap, ref, isFrozen) ==
  LET object == OrdinaryOf(heap, ref)
      attributes ==
        [key \\in DOMAIN object.attributes |->
          [object.attributes[key] EXCEPT !.configurable = FALSE,
                                         !.writable = IF isFrozen THEN FALSE ELSE @]]
  IN IF RestrictsTypedArray(heap, ref, TRUE)
     THEN Update(heap, ref, [object EXCEPT !.extensible = FALSE, !.attributes = attributes])
     ELSE heap

PreventExtensions(heap, ref) ==
  IF RestrictsTypedArray(heap, ref, FALSE)
  THEN Update(heap, ref, [OrdinaryOf(heap, ref) EXCEPT !.extensible = FALSE])
  ELSE heap

\\* Reflect.preventExtensions, which gives FALSE for a typed array whose length may change, rather than
\\* throwing, and throws a TypeError where the target isn't an object.
ReflectPreventExtensions(heap, ref) ==
  CASE ~IsObjectArgument(ref) ->
         [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE, value |-> FALSE]
    [] IsTypedArray(heap, ref) /\\ ~IsFixedLength(heap, ref) ->
         [heap |-> heap, isDone |-> TRUE, isRangeError |-> FALSE, value |-> FALSE]
    [] OTHER ->
         [heap |-> PreventExtensions(heap, ref), isDone |-> TRUE, isRangeError |-> FALSE,
          value |-> TRUE]

Seal(heap, ref) == Restrict(heap, ref, FALSE)

Freeze(heap, ref) == Restrict(heap, ref, TRUE)

\\* Nothing makes the global object inextensible, since tla-ts stops where a script would.
IsExtensible(heap, ref) ==
  IF IsRef(ref) /\\ ~IsHeap(ref) /\\ ref = GlobalObject THEN TRUE ELSE OrdinaryOf(heap, ref).extensible

\\* A typed array's elements are configurable, so the spec never takes one with any as sealed, though
\\* V8 does where it's inextensible. Neither takes it as frozen, as its elements are also writable.
IsSealed(heap, ref) ==
  LET object == OrdinaryOf(heap, ref)
  IN /\\ ~IsExtensible(heap, ref)
     /\\ ElementKeys(heap, ref) # <<>> =>
          Assert(FALSE, "tla-ts can't tell whether an inextensible typed array with elements is sealed")
     /\\ \\A key \\in DOMAIN object.attributes : ~object.attributes[key].configurable

IsFrozen(heap, ref) ==
  LET object == OrdinaryOf(heap, ref)
  IN /\\ ElementKeys(heap, ref) = <<>>
     /\\ IsSealed(heap, ref)
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
  CASE IsTypedArray(heap, ref) /\\ TypedKey(key) # "property" ->
         IF HasElement(heap, ref, key)
         THEN FieldsDescriptor(heap, {"value", "writable", "enumerable", "configurable"},
                               [field \\in {"value", "writable", "enumerable", "configurable"} |->
                                  IF field = "value" THEN TypedElement(heap, ref, ToIndex(key)) ELSE TRUE])
         ELSE Undefined
    [] HasOwn(heap, ref, key) ->
       LET object == PropertiesOf(heap, ref, key)
           attributes == object.attributes[key]
           fields == IF attributes.kind = "accessor"
                     THEN {"get", "set", "enumerable", "configurable"}
                     ELSE {"value", "writable", "enumerable", "configurable"}
       IN FieldsDescriptor(heap, fields,
                           [field \\in fields |->
                              CASE field = "value" -> object.values[key]
                                [] field \\in {"get", "set"} -> object.values[key][field]
                                [] OTHER -> attributes[field]])
    [] OTHER -> Undefined

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

\\* The escapes of QuoteJSONString that aren't \\u and four hexadecimal digits.
LOCAL JSONShortEscapes ==
  ${[
    ["\b", "\\b"],
    ["\t", "\\t"],
    ["\n", "\\n"],
    ["\f", "\\f"],
    ["\r", "\\r"],
    ['"', '\\"'],
    ["\\", "\\\\"],
  ]
    .map((entry) => `${formatString(entry[0])} :> ${formatString(entry[1])}`)
    .join(" @@ ")}

\\* QuoteJSONString, which escapes a control and a surrogate that doesn't pair with a neighbor.
LOCAL QuoteJSON(text) ==
  LET unit(position) == SubSeq(text, position, position)
      code(position) == IF position \\in 1..Len(text) THEN CharacterCode(unit(position)) ELSE 0
      isSurrogate(position) == IsHighSurrogate(code(position)) \\/ IsLowSurrogate(code(position))
      isPaired(position) ==
        \\/ IsHighSurrogate(code(position)) /\\ IsLowSurrogate(code(position + 1))
        \\/ IsLowSurrogate(code(position)) /\\ IsHighSurrogate(code(position - 1))
      digit(position, place) == ((code(position) \\div 16^(4 - place)) % 16) + 1
      escape(position) ==
        CASE unit(position) \\in DOMAIN JSONShortEscapes -> JSONShortEscapes[unit(position)]
          [] code(position) < 32 \\/ (isSurrogate(position) /\\ ~isPaired(position)) ->
               "\\\\u" \\o Join([place \\in 1..4 |->
                                 SubSeq("0123456789abcdef", digit(position, place), digit(position, place))], "")
          [] OTHER -> unit(position)
  IN "\\"" \\o Join([position \\in 1..Len(text) |-> escape(position)], "") \\o "\\""

\\* The ECMAScript JSON grammar that JSON.parse reads, whose operators give the position after what
\\* starts at a position, or 0 where the text there isn't one. A code is -1 past the text's end and
\\* 128 for a character outside ASCII, which a string may hold.
LOCAL JSONCode(text, at) ==
  LET character == IF at \\in 1..Len(text) THEN SubSeq(text, at, at) ELSE ""
  IN  CASE character = "" -> -1
        [] character \\in DOMAIN AsciiCodes -> AsciiCodes[character]
        [] OTHER -> 128

RECURSIVE JSONWhitespace(_, _), JSONDigits(_, _), JSONStringEnd(_, _), JSONUnescaped(_),
          JSONValue(_, _, _, _, _), JSONMembers(_, _, _, _, _, _), JSONElements(_, _, _, _, _, _)

LOCAL JSONWhitespace(text, at) ==
  IF JSONCode(text, at) \\in {9, 10, 13, 32} THEN JSONWhitespace(text, at + 1) ELSE at

LOCAL JSONDigits(text, at) ==
  IF JSONCode(text, at) \\in 48..57 THEN JSONDigits(text, at + 1) ELSE at

LOCAL IsJSONHex(code) == code \\in 48..57 \\/ code \\in 65..70 \\/ code \\in 97..102

\\* A string's characters and its closing quote, where no control character may stand unescaped.
LOCAL JSONStringEnd(text, at) ==
  LET code == JSONCode(text, at)
      next == JSONCode(text, at + 1)
  IN  CASE code = 34 -> at + 1
        [] code = 92 /\\ next \\in {34, 47, 92, 98, 102, 110, 114, 116} -> JSONStringEnd(text, at + 2)
        [] code = 92 /\\ next = 117 /\\ \\A offset \\in 2..5 : IsJSONHex(JSONCode(text, at + offset)) ->
             JSONStringEnd(text, at + 6)
        [] code = 92 \\/ code < 32 -> 0
        [] OTHER -> JSONStringEnd(text, at + 1)

\\* The string that a JSON string's characters between its quotes stand for, where an escape stands
\\* for the code unit that it names.
LOCAL JSONUnescaped(raw) ==
  LET escapes == {at \\in 1..Len(raw) : SubSeq(raw, at, at) = "\\\\"}
      at == CHOOSE first \\in escapes : \\A other \\in escapes : first <= other
      kind == JSONCode(raw, at + 1)
      hex(offset) ==
        LET code == JSONCode(raw, at + offset)
        IN  CASE code \\in 48..57 -> code - 48 [] code \\in 65..70 -> code - 55 [] OTHER -> code - 87
      unit == CASE kind = 117 -> CodeUnit(((hex(2) * 16 + hex(3)) * 16 + hex(4)) * 16 + hex(5))
                [] kind = 98 -> CodeUnit(8)
                [] kind = 102 -> CodeUnit(12)
                [] kind = 110 -> CodeUnit(10)
                [] kind = 114 -> CodeUnit(13)
                [] kind = 116 -> CodeUnit(9)
                [] OTHER -> SubSeq(raw, at + 1, at + 1)
      width == IF kind = 117 THEN 6 ELSE 2
  IN  IF escapes = {}
      THEN raw
      ELSE SubSeq(raw, 1, at - 1) \\o unit \\o JSONUnescaped(SubSeq(raw, at + width, Len(raw)))

LOCAL JSONNumberEnd(text, at) ==
  LET signed == IF JSONCode(text, at) = 45 THEN at + 1 ELSE at
      integer == CASE JSONCode(text, signed) = 48 -> signed + 1
                   [] JSONCode(text, signed) \\in 49..57 -> JSONDigits(text, signed + 1)
                   [] OTHER -> 0
      fraction == CASE integer = 0 \\/ JSONCode(text, integer) # 46 -> integer
                    [] JSONCode(text, integer + 1) \\in 48..57 -> JSONDigits(text, integer + 2)
                    [] OTHER -> 0
      sign == IF JSONCode(text, fraction + 1) \\in {43, 45} THEN fraction + 2 ELSE fraction + 1
  IN  CASE fraction = 0 \\/ JSONCode(text, fraction) \\notin {69, 101} -> fraction
        [] JSONCode(text, sign) \\in 48..57 -> JSONDigits(text, sign + 1)
        [] OTHER -> 0

LOCAL JSONWordEnd(text, at, word) ==
  IF at + Len(word) - 1 <= Len(text) /\\ SubSeq(text, at, at + Len(word) - 1) = word
  THEN at + Len(word)
  ELSE 0

\\* What JSON.parse makes of the value that starts at a position: the position after it, or 0 where
\\* the text there isn't one, its value, and the objects that it and the values before it make,
\\* innermost first, which the heap holds after its own.
LOCAL JSONFailed == [end |-> 0, value |-> 0, objects |-> <<>>]

LOCAL JSONMade(heap, end, object, objects) ==
  [end |-> end, value |-> NextRef(heap, Len(objects) + 1), objects |-> Append(objects, object)]

LOCAL JSONWord(end, value, objects) ==
  IF end = 0 THEN JSONFailed ELSE [end |-> end, value |-> value, objects |-> objects]

LOCAL JSONValue(heap, prototype, text, at, objects) ==
  LET code == JSONCode(text, at)
      inner == JSONWhitespace(text, at + 1)
      members == JSONMembers(heap, prototype, text, inner, objects, <<>>)
      elements == JSONElements(heap, prototype, text, inner, objects, <<>>)
      stringEnd == JSONStringEnd(text, at + 1)
      numberEnd == JSONNumberEnd(text, at)
  IN  CASE code = 123 /\\ JSONCode(text, inner) = 125 ->
             JSONMade(heap, inner + 1, PairsObject(<<>>), objects)
        [] code = 123 ->
             IF members.end = 0
             THEN JSONFailed
             ELSE JSONMade(heap, members.end, PairsObject(members.value), members.objects)
        [] code = 91 /\\ JSONCode(text, inner) = 93 ->
             JSONMade(heap, inner + 1, ArrayObject(prototype, <<>>), objects)
        [] code = 91 ->
             IF elements.end = 0
             THEN JSONFailed
             ELSE JSONMade(heap, elements.end, ArrayObject(prototype, elements.value), elements.objects)
        [] code = 34 ->
             IF stringEnd = 0
             THEN JSONFailed
             ELSE [end |-> stringEnd, value |-> JSONUnescaped(SubSeq(text, at + 1, stringEnd - 2)),
                   objects |-> objects]
        [] code = 45 \\/ code \\in 48..57 ->
             IF numberEnd = 0
             THEN JSONFailed
             ELSE [end |-> numberEnd, value |-> ToNumber(SubSeq(text, at, numberEnd - 1)),
                   objects |-> objects]
        [] code = 116 -> JSONWord(JSONWordEnd(text, at, "true"), TRUE, objects)
        [] code = 102 -> JSONWord(JSONWordEnd(text, at, "false"), FALSE, objects)
        [] code = 110 -> JSONWord(JSONWordEnd(text, at, "null"), Null, objects)
        [] OTHER -> JSONFailed

\\* The keys and values of an object's members, from the first one's name to the closing brace.
LOCAL JSONMembers(heap, prototype, text, at, objects, pairs) ==
  LET name == IF JSONCode(text, at) = 34 THEN JSONStringEnd(text, at + 1) ELSE 0
      colon == IF name = 0 THEN 0 ELSE JSONWhitespace(text, name)
      member == IF colon = 0 \\/ JSONCode(text, colon) # 58
                THEN JSONFailed
                ELSE JSONValue(heap, prototype, text, JSONWhitespace(text, colon + 1), objects)
      after == IF member.end = 0 THEN 0 ELSE JSONWhitespace(text, member.end)
      added == Append(pairs, <<JSONUnescaped(SubSeq(text, at + 1, name - 2)), member.value>>)
  IN  CASE after = 0 -> JSONFailed
        [] JSONCode(text, after) = 44 ->
             JSONMembers(heap, prototype, text, JSONWhitespace(text, after + 1), member.objects, added)
        [] JSONCode(text, after) = 125 ->
             [end |-> after + 1, value |-> added, objects |-> member.objects]
        [] OTHER -> JSONFailed

\\* The values of an array's elements, from the first one to the closing bracket.
LOCAL JSONElements(heap, prototype, text, at, objects, values) ==
  LET element == JSONValue(heap, prototype, text, at, objects)
      after == IF element.end = 0 THEN 0 ELSE JSONWhitespace(text, element.end)
      added == Append(values, element.value)
  IN  CASE after = 0 -> JSONFailed
        [] JSONCode(text, after) = 44 ->
             JSONElements(heap, prototype, text, JSONWhitespace(text, after + 1), element.objects, added)
        [] JSONCode(text, after) = 93 ->
             [end |-> after + 1, value |-> added, objects |-> element.objects]
        [] OTHER -> JSONFailed

\\* What JSON.parse makes of a text, whose end is 0 where the text isn't JSON,
\\* with arrays whose prototype is Array.prototype.
JSONParse(heap, prototype, text) ==
  LET parsed == JSONValue(heap, prototype, text, JSONWhitespace(text, 1), <<>>)
  IN  IF parsed.end # 0 /\\ JSONWhitespace(text, parsed.end) = Len(text) + 1
      THEN parsed
      ELSE JSONFailed

\\* Whether what JSON.parse makes holds an array.
HasJSONArray(parsed) ==
  \\E position \\in DOMAIN parsed.objects : IsArrayObject(parsed.objects[position])

\\* The steps of InternalizeJSONProperty over a value that JSON.parse made, which a holder's key
\\* holds: entering an object, which goes on to its keys' steps, leaving it, and visiting a primitive.
\\* A step that calls the reviver goes on by its skip, past the keys of an object that changed.
RECURSIVE JSONReviveSteps(_, _, _, _), JSONReviveKeySteps(_, _, _)
JSONReviveSteps(heap, holder, key, value) ==
  IF IsObjectIn(heap, value)
  THEN LET keys == RevivedKeys(heap, value)
           inner == JSONReviveKeySteps(heap, value, keys)
       IN  <<[kind |-> "enter", holder |-> holder, key |-> key, ref |-> value, keys |-> keys,
              skip |-> Len(inner) + 2]>>
           \\o inner
           \\o <<[kind |-> "exit", holder |-> holder, key |-> key, ref |-> value, keys |-> keys,
                 skip |-> 1]>>
  ELSE <<[kind |-> "visit", holder |-> holder, key |-> key, ref |-> value, keys |-> <<>>,
          skip |-> 1]>>

LOCAL JSONReviveKeySteps(heap, ref, keys) ==
  IF keys = <<>>
  THEN <<>>
  ELSE JSONReviveSteps(heap, ref, Head(keys), Get(heap, ref, Head(keys)))
       \\o JSONReviveKeySteps(heap, ref, Tail(keys))

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

\\* The primitive of a Number or a String object that JSON.stringify takes as its space argument.
JSONSpace(heap, space) ==
  LET kind == IF IsRef(space) THEN JSONWrapperKind(heap, space) ELSE ""
  IN CASE kind = "Number" -> JSONPrimitive(heap, space, kind, "valueOf")
       [] kind = "String" -> JSONPrimitive(heap, space, kind, "toString")
       [] OTHER -> space

\\* The gap that JSON.stringify indents by for its space argument.
LOCAL JSONGap(heap, space) ==
  LET value == JSONSpace(heap, space)
      count == CASE value \\in {NaN, NegativeInfinity, NegativeZero} -> 0
                 [] IsFraction(value) -> IF Truncate(value) > 10 THEN 10 ELSE Truncate(value)
                 [] IsWide(value) -> IF IsNegative(value) THEN 0 ELSE 10
                 [] IsDouble(value) /\\ (IsNegative(value) \\/ value[Double][2] >= 0) ->
                      IF IsNegative(value) THEN 0 ELSE 10
                 [] IsDouble(value) -> BeyondInteger
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

\\* What SerializeJSON gives where JSON.stringify throws a TypeError, as it does for a BigInt.
JSONTypeError == [constructor |-> Null, message |-> "", name |-> "TypeError"]

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
        LET texts == [position \\in DOMAIN elements |->
                        SerializeJSON(heap, elements[position], state, seen, inner)]
        IN IF \\E position \\in DOMAIN texts : IsError(texts[position])
           THEN JSONTypeError
           ELSE wrap("[", "]", [position \\in DOMAIN texts |->
                                 IF texts[position] = Undefined THEN "null" ELSE texts[position]])
      object(keys) ==
        LET texts == [position \\in DOMAIN keys |->
                        SerializeJSON(heap, Get(heap, value, keys[position]), state,
                                      stack \\cup {value}, inner)]
            present == SelectSeq([position \\in DOMAIN keys |-> position],
                                 LAMBDA position : texts[position] # Undefined)
        IN IF \\E position \\in DOMAIN texts : IsError(texts[position]) THEN JSONTypeError ELSE
           wrap("{", "}", [position \\in DOMAIN present |->
                             QuoteJSON(keys[present[position]]) \\o ":"
                               \\o (IF state.gap = "" THEN "" ELSE " ") \\o texts[present[position]]])
      hasToJSON(ref) == TypeOfIn(heap, Get(heap, ref, "toJSON")) = "function"
      kind == IF IsRef(value) THEN JSONWrapperKind(heap, value) ELSE ""
  IN CASE value = Null -> "null"
       [] value = Undefined -> Undefined
       [] TypeOf(value) = "boolean" -> IF value THEN "true" ELSE "false"
       [] TypeOf(value) = "string" -> QuoteJSON(value)
       [] TypeOf(value) = "number" -> IF IsFinite(value) THEN StringOf(value) ELSE "null"
       [] TypeOf(value) = "symbol" -> Undefined
       [] IsBigInt(value) ->
            IF hasToJSON(Ref :> "BigInt.prototype")
            THEN Assert(FALSE, "tla-ts can't call toJSON")
            ELSE JSONTypeError
       [] IsProxy(heap, value) ->
            SerializeJSON(heap, ForwardTarget(heap, value, {"get", "ownKeys", "getOwnPropertyDescriptor"}),
                          state, stack, indent)
       [] IsRef(value) /\\ hasToJSON(value) -> Assert(FALSE, "tla-ts can't call toJSON")
       [] IsHeap(value) /\\ "bigint" \\in DOMAIN Lookup(heap, value) -> JSONTypeError
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

\\* The keys that JSON.stringify writes of each object, which a replacer array lists, or Undefined
\\* where it writes all of them, as it can't call a replacer function.
JSONList(heap, replacer, isSequence) ==
  LET isList == IsArray(heap, replacer)
                  \\/ (isSequence /\\ ~IsRef(replacer) /\\ SubSeq(ToString(replacer), 1, 2) = "<<")
  IN CASE TypeOfIn(heap, replacer) = "function" -> Assert(FALSE, "tla-ts can't call a replacer")
       [] /\\ ~IsRef(replacer)
          /\\ TypeOf(replacer) = "object"
          /\\ replacer # Null
          /\\ ~isList ->
            Assert(FALSE, "tla-ts can't tell whether " \\o ToString(replacer) \\o " is an array")
       [] isList -> JSONKeys(heap, replacer)
       [] OTHER -> Undefined

\\* JSON.stringify of the keys that JSONList gives.
JSONStringifyKeys(heap, value, keys, space, arrayPrototype, functionPrototype, isSequence) ==
  LET gap == JSONGap(heap, space)
      state == [keys |-> keys, gap |-> gap, isSequence |-> isSequence,
                arrayPrototype |-> arrayPrototype, functionPrototype |-> functionPrototype]
  IN IF keys = keys /\\ gap = gap THEN SerializeJSON(heap, value, state, {}, "") ELSE Undefined

\\* JSON.stringify, which can't call a replacer function.
JSONStringify(heap, value, replacer, space, arrayPrototype, functionPrototype, isSequence) ==
  JSONStringifyKeys(heap, value, JSONList(heap, replacer, isSequence), space, arrayPrototype,
                    functionPrototype, isSequence)

\\* JSON.stringify where a replacer function replaces each value it writes, which a statement walks,
\\* as it calls the function. Each frame of the walk holds an object that the walk writes, its keys,
\\* the position of the next, the replaced values that it gathered by key, and its key in the frame
\\* below, the first frame's object being the wrapper that holds the value under "".
JSONReplacing(wrapper) ==
  <<[holder |-> wrapper, keys |-> <<"">>, position |-> 1, pairs |-> <<>>, key |-> "",
     isArray |-> FALSE, isRead |-> FALSE]>>

LOCAL JSONTop(frames) == frames[Len(frames)]

\\* Whether the top frame gathered a value for each key.
JSONIsClosing(frames) == JSONTop(frames).position > Len(JSONTop(frames).keys)

\\* The value that the replacer gave for the wrapper's "", once the walk closes the wrapper.
JSONReplaced(frames) == frames[1].pairs[1][2]

JSONHolder(frames) == JSONTop(frames).holder

JSONKey(frames) == JSONTop(frames).keys[JSONTop(frames).position]

\\* The getter that the walk runs to read the top frame's next key, or Undefined.
JSONGetter(heap, frames) ==
  IF IsHeap(JSONHolder(frames)) /\\ ~IsProxy(heap, JSONHolder(frames))
  THEN GetterOf(heap, JSONHolder(frames), JSONKey(frames))
  ELSE Undefined

\\* The value that the walk reads at the top frame's next key. An array outside the heap that the
\\* walk read from what holds it must still be the value that it holds, as the replacer may write it.
JSONRead(heap, frames) ==
  IF \\A position \\in 2..Len(frames) :
       frames[position].isRead =>
         ~Differs(frames[position].holder,
                  Get(heap, frames[position - 1].holder, frames[position].key))
  THEN Get(heap, JSONHolder(frames), JSONKey(frames))
  ELSE Assert(FALSE, "tla-ts can't write an array outside the heap that a replacer changes")

\\* Whether SerializeJSONProperty would call a toJSON of a value, before it calls the replacer.
JSONHasToJSON(heap, value, arrayPrototype, functionPrototype, isSequence) ==
  LET hasToJSON(ref) == TypeOfIn(heap, Get(heap, ref, "toJSON")) = "function"
  IN CASE IsBigInt(value) -> hasToJSON(Ref :> "BigInt.prototype")
       [] IsRef(value) -> hasToJSON(value)
       [] TypeOf(value) = "function" -> hasToJSON(functionPrototype)
       [] isSequence /\\ IsSequenceValue(value) -> hasToJSON(arrayPrototype)
       [] OTHER -> FALSE

\\* Whether a replacer gave a BigInt, or an object that holds one, which JSON.stringify throws a
\\* TypeError for before it calls the replacer again.
JSONIsBigInt(heap, value) ==
  \\/ IsBigInt(value)
  \\/ IsHeap(value) /\\ "bigint" \\in DOMAIN heap.objects[value[Ref]]

\\* Whether the walk writes a replaced value's keys: an object that isn't a function or a wrapper.
LOCAL JSONDescends(heap, value, isSequence) ==
  CASE IsProxy(heap, value) -> Assert(FALSE, "tla-ts can't replace the values that a proxy holds")
    [] IsRef(value) -> TypeOfIn(heap, value) = "object" /\\ JSONWrapperKind(heap, value) = ""
    [] isSequence /\\ IsSequenceValue(value) -> TRUE
    [] \\/ value \\in {Undefined, Null}
       \\/ TypeOf(value) \\in {"boolean", "string", "number", "bigint", "symbol", "function"} -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell what JSON.stringify writes for " \\o ToString(value))

\\* The frames once the replacer gave a value for the top frame's next key, where it read another: a
\\* frame for an object whose keys the walk writes, which a list of keys may give, or else the value
\\* among those the top frame gathered. An array outside the heap that may be the one the walk read
\\* must stay what holds it holds. One that equals an array that the walk writes may be that array,
\\* which is a cycle, or another.
JSONReplace(heap, frames, read, value, isSequence, list) ==
  LET top == JSONTop(frames)
      advanced == [top EXCEPT !.position = @ + 1]
      below == SubSeq(frames, 1, Len(frames) - 1)
      isArray == IsSequenceValue(value) \\/ IsArray(heap, value)
      keys == CASE IsSequenceValue(value) -> [position \\in DOMAIN value |-> ToString(position - 1)]
                [] isArray ->
                     [position \\in 1..ToLength(Get(heap, value, "length")) |-> ToString(position - 1)]
                [] list # Undefined -> list
                [] OTHER -> ObjectKeys(heap, value)
  IN CASE ~JSONDescends(heap, value, isSequence) ->
            Append(below, [advanced EXCEPT !.pairs = Append(@, <<JSONKey(frames), value>>)])
       [] \\E position \\in 2..Len(frames) :
            IsRef(frames[position].holder) /\\ ToString(frames[position].holder) = ToString(value) ->
            Assert(FALSE, "tla-ts can't throw the TypeError of JSON.stringify of a cycle")
       [] \\E position \\in 2..Len(frames) :
            /\\ IsSequenceValue(frames[position].holder)
            /\\ IsSequenceValue(value)
            /\\ frames[position].holder = value ->
            Assert(FALSE, "tla-ts can't tell a cycle of arrays outside the heap")
       [] OTHER ->
            below \\o <<advanced, [holder |-> value, keys |-> keys, position |-> 1, pairs |-> <<>>,
                                  key |-> JSONKey(frames), isArray |-> isArray,
                                  isRead |->
                                    /\\ IsSequenceValue(value)
                                    /\\ \\/ ~Differs(value, read)
                                       \\/ ~Differs(value, Get(heap, top.holder, JSONKey(frames)))]>>

\\* The heap and the frames once the walk closes the top frame, which makes an object of the values
\\* that it gathered, with no prototype, which the frame below gathers.
JSONClose(heap, frames) ==
  LET top == JSONTop(frames)
      parent == frames[Len(frames) - 1]
      made == Allocate(heap,
                       IF top.isArray
                       THEN ArrayObject(Null, [position \\in DOMAIN top.pairs |-> top.pairs[position][2]])
                       ELSE [PairsObject(top.pairs) EXCEPT !.prototype = Null])
  IN [heap |-> made,
      frames |-> Append(SubSeq(frames, 1, Len(frames) - 2),
                        [parent EXCEPT !.pairs = Append(@, <<top.key, Allocated(made)>>)])]

===============================================================================`;

// The lines of the JavaScript module, in units that each start at a line that isn't indented or a
// comment, such as a definition, a RECURSIVE declaration, or the header's EXTENDS and CONSTANTS.
const MODULE_LINES = JAVASCRIPT_MODULE.split("\n");
const getDeclaredNames = (line: string) => {
  if (line.startsWith("RECURSIVE ")) {
    return [...line.matchAll(/([A-Z]\w*)\(/g)].map((match) => match[1]);
  }
  const match = /^(?:LOCAL )?([A-Z]\w*)(?:\(| ==)/.exec(line);
  return match === null ? [] : [match[1]];
};
const getReadNames = (text: string) => [...(text.match(/\b[A-Z]\w*\b/g) ?? [])];
const UNIT_STARTS = MODULE_LINES.flatMap((line, position) =>
  /^[^\s\\(]/.test(line) ? [position] : [],
);
// The last unit is the line that closes the module.
const MODULE_UNITS = UNIT_STARTS.map((start, position) => {
  const lines = MODULE_LINES.slice(start, UNIT_STARTS[position + 1]);
  return {
    lines,
    names: getDeclaredNames(lines[0]),
    // A RECURSIVE declaration reads nothing; the definition it declares reads what it reads.
    reads: lines[0].startsWith("RECURSIVE ") ? [] : getReadNames(lines.join("\n")),
  };
});
const UNITS_BY_NAME = Map.groupBy(
  MODULE_UNITS.flatMap((unit) => unit.names.map((name) => ({ name, unit }))),
  (entry) => entry.name,
);
// A unit that defines nothing, such as the header or an ASSUME, stays with what it reads.
const ROOT_READS = MODULE_UNITS.filter((unit) => unit.names.length === 0).flatMap(
  (unit) => unit.reads,
);

// The JavaScript module with only the definitions that a spec and its config read, directly or
// through other definitions, so that a check parses and analyzes only those. Every other line is
// blank, so each definition keeps its line.
export const getJavaScriptModule = (text: string) => {
  const kept = new Set<string>();
  const keep = (name: string) => {
    if (kept.has(name)) return;
    kept.add(name);
    UNITS_BY_NAME.get(name)?.forEach((entry) => entry.unit.reads.forEach(keep));
  };
  [...getReadNames(text), ...ROOT_READS].forEach(keep);
  return MODULE_UNITS.flatMap((unit) =>
    unit.names.length === 0 || unit.names.some((name) => kept.has(name))
      ? unit.lines
      : unit.lines.map(() => ""),
  ).join("\n");
};

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
  const symbol = ts.isIdentifier(node.expression)
    ? getSymbol(node.expression, context.checker)
    : undefined;
  const type =
    symbol !== undefined && isAssignedElsewhere(symbol, node, context)
      ? context.checker.getTypeOfSymbol(symbol)
      : context.checker.getTypeAtLocation(node.expression);
  const names = getTypeNames(type, context.checker);
  const known = names && [...new Set(names.map((name) => (name === "null" ? "object" : name)))];
  // Object.defineProperty can give a property a value of another type than TypeScript's.
  const read = ts.isParenthesizedExpression(node.expression)
    ? node.expression.expression
    : node.expression;
  // A name that no binding has is undefined to typeof, which reads it without throwing.
  if (ts.isIdentifier(read) && getSymbol(read, context.checker) === undefined) {
    return string("undefined");
  }
  // A binding that a name has throws before its declaration runs, though typeof only reads it.
  if (ts.isIdentifier(read)) rejectBeforeDeclaration(read, scope, context);
  // An element of an array or a string may also lie past the end.
  const kind =
    ts.isPropertyAccessExpression(read) || ts.isElementAccessExpression(read)
      ? getKind(read.expression, context)
      : undefined;
  const isProperty =
    kind === "object" ||
    (ts.isElementAccessExpression(read) && (kind === "sequence" || kind === "string"));
  // A call in the operand still runs, as it may throw.
  const hasCall = (inner: ts.Node): boolean =>
    ts.isCallExpression(inner) ||
    ts.isNewExpression(inner) ||
    ts.isTaggedTemplateExpression(inner) ||
    (!ts.isFunctionLike(inner) && ts.forEachChild(inner, hasCall) === true);
  // A var holds undefined until it's assigned, which its type doesn't tell.
  const isVar =
    ts.isIdentifier(read) &&
    (getSymbol(read, context.checker)?.declarations ?? []).some(
      (declaration) =>
        ts.isVariableDeclaration(declaration) &&
        ts.isVariableDeclarationList(declaration.parent) &&
        (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0,
    );
  if (known?.length === 1 && known[0] !== "undefined" && isVar) {
    return ifExpression(
      apply("=", [translateExpression(read, scope, context), getUndefined(context)]),
      string("undefined"),
      string(known[0]),
    );
  }
  // A call that TypeScript doesn't check, as under @ts-ignore, may give a this of another type.
  const isThis = read.kind === ts.SyntaxKind.ThisKeyword;
  if (known?.length === 1 && !isProperty && !isThis && !hasCall(read)) return string(known[0]);
  if (known?.length === 1 && !isProperty && !isThis) {
    const operand = translateExpression(node.expression, scope, context);
    return ifExpression(apply("=", [operand, operand]), string(known[0]), string(known[0]));
  }
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
    (names !== undefined &&
      names.length > 0 &&
      names.every((name) => ["number", "boolean", "null", "undefined"].includes(name))) ||
    (context.heap !== undefined &&
      (context.checker.getTypeAtLocation(argument).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
        0)
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

// The characters that each URI function keeps: those that encodeURI, encodeURIComponent, and
// escape don't escape, and those whose escapes decodeURI and decodeURIComponent don't decode.
// unescape decodes every escape.
const URI_FUNCTIONS = new Map([
  ["encodeURI", `${URI_ALPHANUMERICS}-_.!~*'();/?:@&=+$,#`],
  ["encodeURIComponent", `${URI_ALPHANUMERICS}-_.!~*'()`],
  ["escape", `${URI_ALPHANUMERICS}@*_+-./`],
  ["decodeURI", ";/?:@&=+$,#"],
  ["decodeURIComponent", ""],
  ["unescape", ""],
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
        isUnescape: node.expression.text === "unescape",
        isEscape: node.expression.text === "escape",
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
    if (names === undefined || names.every((inner) => PRIMITIVE_NAMES.has(inner))) {
      return translateToString(argument, scope, context);
    }
  }
  throw unsupported;
};
