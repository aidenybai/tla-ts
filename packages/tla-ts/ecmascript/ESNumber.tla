------------------------------ MODULE ESNumber ------------------------------
(***************************************************************************)
(* The ECMAScript Number type (IEEE 754 binary64, ECMA-262 §6.1.6.1) built *)
(* from 32-bit integers.                                                   *)
(*                                                                         *)
(* Every Number is a record [k, neg, i, m, e] in one canonical form, so    *)
(* = on Numbers is SameValue:                                              *)
(*   k = "int"    the integer i, -2^30 < i < 2^30; i = 0 is +0             *)
(*   k = "nzero"  -0                                                       *)
(*   k = "nan"    NaN                                                      *)
(*   k = "inf"    +Infinity or, when neg, -Infinity                        *)
(*   k = "fin"    any other finite value (-1)^neg * m * 2^e, where the     *)
(*                BigNat m is odd and below 2^53                           *)
(* Unused fields are FALSE, 0, or <<>>, except neg, which is TRUE for -0,  *)
(* -Infinity, and negative values. JS strings are sequences of UTF-16 code *)
(* units.                                                                  *)
(***************************************************************************)
EXTENDS Integers, Sequences, ESBigNat

MkNum(kind, neg, int, m, e) == [k |-> kind, neg |-> neg, i |-> int, m |-> m, e |-> e]

NaN == MkNum("nan", FALSE, 0, <<>>, 0)
PosInf == MkNum("inf", FALSE, 0, <<>>, 0)
NegInf == MkNum("inf", TRUE, 0, <<>>, 0)
PosZero == MkNum("int", FALSE, 0, <<>>, 0)
NegZero == MkNum("nzero", TRUE, 0, <<>>, 0)

IntLimit == 1073741824

NumIntNum(n) == MkNum("int", n < 0, n, <<>>, 0)

NumIntMax(a, b) == IF a > b THEN a ELSE b

NumIntAbs(n) == IF n < 0 THEN -n ELSE n

NumIsNaN(x) == x.k = "nan"

NumIsZero(x) == (x.k = "int" /\ x.i = 0) \/ x.k = "nzero"

NumIsFinite(x) == x.k \in {"int", "fin", "nzero"}

NumIsIntegral(x) == x.k \in {"int", "nzero"} \/ (x.k = "fin" /\ x.e >= 0)

\* Whether x is an odd integer, which canonical odd mantissas make cheap.
NumIsOddIntegral(x) == (x.k = "int" /\ x.i % 2 = 1) \/ (x.k = "fin" /\ x.e = 0)

\* The magnitude of a finite nonzero x is NumMag(x) * 2^NumExponent(x).
NumMag(x) == IF x.k = "int" THEN BNFromInt(NumIntAbs(x.i)) ELSE x.m

NumExponent(x) == IF x.k = "int" THEN 0 ELSE x.e

\* The exact value (-1)^neg * m * 2^e, which must be a double.
NumMakeNum(neg, m, e) ==
  IF m = <<>> THEN IF neg THEN NegZero ELSE PosZero
  ELSE LET zeros == BNTrailingZeros(m)
           odd == BNShiftRight(m, zeros)
           exponent == e + zeros
       IN IF exponent >= 0 /\ exponent + BNBitLength(odd) <= 30
          THEN LET value == BNToInt(odd) * 2 ^ exponent
               IN NumIntNum(IF neg THEN -value ELSE value)
          ELSE MkNum("fin", neg, 0, odd, exponent)

\* Rounds (-1)^neg * (m + t) * 2^e to precision bits, half to even, where t
\* is 0 if ~sticky and strictly between 0 and 1 otherwise. A sticky m must
\* lose at least two bits. Exponents run from minExp (below it values are
\* subnormal) to maxExp (above it they overflow to Infinity).
RoundBits(neg, m, e, sticky, precision, minExp, maxExp) ==
  LET top == e + BNBitLength(m) - 1
      ulp == NumIntMax(top, minExp) - precision + 1
      drop == ulp - e
      rounded ==
        IF drop <= 0 THEN <<m, e>>
        ELSE LET kept == BNShiftRight(m, drop)
                 isUp == BNTestBit(m, drop - 1)
                           /\ (sticky \/ BNLowBits(m, drop - 1) # <<>> \/ BNIsOdd(kept))
             IN <<IF isUp THEN BNAdd(kept, <<1>>) ELSE kept, ulp>>
  IN CASE m = <<>> -> IF neg THEN NegZero ELSE PosZero
       [] top > maxExp -> MkNum("inf", neg, 0, <<>>, 0)
       [] rounded[2] + BNBitLength(rounded[1]) - 1 > maxExp -> MkNum("inf", neg, 0, <<>>, 0)
       [] OTHER -> NumMakeNum(neg, rounded[1], rounded[2])

RoundDouble(neg, m, e, sticky) == RoundBits(neg, m, e, sticky, 53, -1022, 1023)

\* Rounds (-1)^neg * num / den * 2^e for nonzero num and den.
RoundRatio(neg, num, den, e) ==
  LET shift == NumIntMax(0, 55 + BNBitLength(den) - BNBitLength(num))
      division == BNDivMod(BNShiftLeft(num, shift), den)
  IN RoundDouble(neg, division[1], e - shift, division[2] # <<>>)

(***************************************************************************)
(* Conversions between Numbers and TLA+ integers.                          *)
(***************************************************************************)

NumFromInt(n) ==
  CASE -IntLimit < n /\ n < IntLimit -> NumIntNum(n)
    [] n = -2147483647 - 1 -> MkNum("fin", TRUE, 0, <<1>>, 31)
    [] OTHER -> NumMakeNum(n < 0, BNFromInt(NumIntAbs(n)), 0)

\* The Number nearest to (-1)^neg * m * 2^e.
NumFromBigNat(neg, m, e) == RoundDouble(neg, m, e, FALSE)

\* Whether x is an integer in -2^31..2^31-1, so NumToInt(x) is defined.
NumFitsInt(x) ==
  \/ x.k \in {"int", "nzero"}
  \/ x.k = "fin" /\ x.e >= 0 /\ BNBitLength(x.m) + x.e <= 31
  \/ x.k = "fin" /\ x.neg /\ x.m = <<1>> /\ x.e = 31

NumToInt(x) ==
  CASE x.k = "int" -> x.i
    [] x.k = "nzero" -> 0
    [] BNBitLength(x.m) + x.e = 32 -> -2147483647 - 1
    [] OTHER -> LET value == BNToInt(BNShiftLeft(x.m, x.e))
                IN IF x.neg THEN -value ELSE value

(***************************************************************************)
(* Number::unaryMinus, add, subtract, multiply, divide, remainder.         *)
(***************************************************************************)

NumUnaryMinus(x) ==
  CASE x.k = "int" -> IF x.i = 0 THEN NegZero ELSE NumIntNum(-x.i)
    [] x.k = "nzero" -> PosZero
    [] x.k = "nan" -> x
    [] OTHER -> [x EXCEPT !.neg = ~x.neg]

NumAbs(x) == IF x.neg THEN NumUnaryMinus(x) ELSE x

NumAdd(x, y) ==
  IF x.k = "int" /\ y.k = "int" THEN NumFromInt(x.i + y.i)
  ELSE CASE x.k = "nan" \/ y.k = "nan" -> NaN
         [] x.k = "inf" /\ y.k = "inf" -> IF x.neg = y.neg THEN x ELSE NaN
         [] x.k = "inf" -> x
         [] y.k = "inf" -> y
         [] NumIsZero(x) /\ NumIsZero(y) -> IF x.neg /\ y.neg THEN NegZero ELSE PosZero
         [] NumIsZero(x) -> y
         [] NumIsZero(y) -> x
         [] OTHER ->
              LET e == IF NumExponent(x) < NumExponent(y) THEN NumExponent(x) ELSE NumExponent(y)
                  a == BNShiftLeft(NumMag(x), NumExponent(x) - e)
                  b == BNShiftLeft(NumMag(y), NumExponent(y) - e)
                  order == BNCompare(a, b)
              IN CASE x.neg = y.neg -> RoundDouble(x.neg, BNAdd(a, b), e, FALSE)
                   [] order = 0 -> PosZero
                   [] order > 0 -> RoundDouble(x.neg, BNSub(a, b), e, FALSE)
                   [] OTHER -> RoundDouble(y.neg, BNSub(b, a), e, FALSE)

NumSubtract(x, y) == NumAdd(x, NumUnaryMinus(y))

NumMultiply(x, y) ==
  IF x.k = "int" /\ y.k = "int" /\ -32768 < x.i /\ x.i < 32768 /\ -32768 < y.i /\ y.i < 32768
  THEN IF x.i * y.i = 0 /\ (x.i < 0 \/ y.i < 0) THEN NegZero ELSE NumIntNum(x.i * y.i)
  ELSE LET neg == x.neg # y.neg
       IN CASE x.k = "nan" \/ y.k = "nan" -> NaN
            [] x.k = "inf" \/ y.k = "inf" ->
                 IF NumIsZero(x) \/ NumIsZero(y) THEN NaN ELSE MkNum("inf", neg, 0, <<>>, 0)
            [] NumIsZero(x) \/ NumIsZero(y) -> IF neg THEN NegZero ELSE PosZero
            [] OTHER -> RoundDouble(neg, BNMul(NumMag(x), NumMag(y)), NumExponent(x) + NumExponent(y), FALSE)

NumDivide(x, y) ==
  LET neg == x.neg # y.neg
  IN CASE x.k = "int" /\ y.k = "int" /\ y.i # 0 /\ x.i # 0 /\ x.i % NumIntAbs(y.i) = 0 ->
            LET quotient == NumIntAbs(x.i) \div NumIntAbs(y.i) IN NumIntNum(IF neg THEN -quotient ELSE quotient)
       [] x.k = "nan" \/ y.k = "nan" -> NaN
       [] x.k = "inf" /\ y.k = "inf" -> NaN
       [] x.k = "inf" -> MkNum("inf", neg, 0, <<>>, 0)
       [] y.k = "inf" -> IF neg THEN NegZero ELSE PosZero
       [] NumIsZero(y) -> IF NumIsZero(x) THEN NaN ELSE MkNum("inf", neg, 0, <<>>, 0)
       [] NumIsZero(x) -> IF neg THEN NegZero ELSE PosZero
       [] OTHER -> RoundRatio(neg, NumMag(x), NumMag(y), NumExponent(x) - NumExponent(y))

NumRemainder(n, d) ==
  CASE n.k = "nan" \/ d.k = "nan" \/ n.k = "inf" -> NaN
    [] d.k = "inf" -> n
    [] NumIsZero(d) -> NaN
    [] NumIsZero(n) -> n
    [] n.k = "int" /\ d.k = "int" ->
         LET remainder == NumIntAbs(n.i) % NumIntAbs(d.i)
         IN IF n.i < 0 THEN NumUnaryMinus(NumIntNum(remainder)) ELSE NumIntNum(remainder)
    [] OTHER ->
         LET e == IF NumExponent(n) < NumExponent(d) THEN NumExponent(n) ELSE NumExponent(d)
         IN NumMakeNum(n.neg, BNDivMod(BNShiftLeft(NumMag(n), NumExponent(n) - e),
                                    BNShiftLeft(NumMag(d), NumExponent(d) - e))[2], e)

(***************************************************************************)
(* Comparisons.                                                            *)
(***************************************************************************)

\* -1, 0, or 1 as |x| < |y|, |x| = |y|, or |x| > |y|, for finite nonzero x, y.
CompareMagnitude(x, y) ==
  LET topX == NumExponent(x) + BNBitLength(NumMag(x))
      topY == NumExponent(y) + BNBitLength(NumMag(y))
      e == IF NumExponent(x) < NumExponent(y) THEN NumExponent(x) ELSE NumExponent(y)
  IN CASE topX < topY -> -1
       [] topX > topY -> 1
       [] OTHER -> BNCompare(BNShiftLeft(NumMag(x), NumExponent(x) - e), BNShiftLeft(NumMag(y), NumExponent(y) - e))

\* -1, 0, or 1 as x < y, x = y, or x > y, for Numbers other than NaN.
NumCompare(x, y) ==
  LET rank(z) == CASE z.k = "inf" -> IF z.neg THEN -2 ELSE 2
                   [] NumIsZero(z) -> 0
                   [] OTHER -> IF z.neg THEN -1 ELSE 1
  IN CASE x.k = "int" /\ y.k = "int" -> IF x.i < y.i THEN -1 ELSE IF x.i > y.i THEN 1 ELSE 0
       [] rank(x) < rank(y) -> -1
       [] rank(x) > rank(y) -> 1
       [] rank(x) \in {-2, 0, 2} -> 0
       [] x.neg -> CompareMagnitude(y, x)
       [] OTHER -> CompareMagnitude(x, y)

\* Number::lessThan: TRUE, FALSE, or "undefined" when either is NaN.
NumLessThan(x, y) ==
  CASE x.k = "int" /\ y.k = "int" -> x.i < y.i
    [] x.k = "nan" \/ y.k = "nan" -> "undefined"
    [] OTHER -> NumCompare(x, y) < 0

NumEqual(x, y) == x.k # "nan" /\ y.k # "nan" /\ (x = y \/ (NumIsZero(x) /\ NumIsZero(y)))

NumSameValue(x, y) == x = y

NumSameValueZero(x, y) == x = y \/ (NumIsZero(x) /\ NumIsZero(y))

(***************************************************************************)
(* NumToInt32 and the other integer conversions of §7.1, and the bitwise and  *)
(* shift operators.                                                        *)
(***************************************************************************)

\* <<high, low>>, the 16-bit halves of NumToUint32(x).
Uint32Halves(x) ==
  CASE x.k = "int" -> <<(x.i \div 65536) % 65536, x.i % 65536>>
    [] x.k # "fin" -> <<0, 0>>
    [] x.e >= 32 -> <<0, 0>>
    [] OTHER ->
         LET truncated == IF x.e >= 0 THEN BNShiftLeft(x.m, x.e) ELSE BNShiftRight(x.m, -x.e)
             high == BNToInt(BNLowBits(BNShiftRight(truncated, 16), 16))
             low == BNToInt(BNLowBits(truncated, 16))
         IN CASE ~x.neg -> <<high, low>>
              [] low = 0 -> <<(65536 - high) % 65536, 0>>
              [] OTHER -> <<65535 - high, 65536 - low>>

Int32FromHalves(halves) ==
  IF halves[1] >= 32768 THEN (halves[1] - 65536) * 65536 + halves[2]
  ELSE halves[1] * 65536 + halves[2]

Uint32FromHalves(halves) ==
  IF halves[1] < 16384 THEN NumIntNum(halves[1] * 65536 + halves[2])
  ELSE NumMakeNum(FALSE, BNAdd(BNShiftLeft(BNFromInt(halves[1]), 16), BNFromInt(halves[2])), 0)

\* NumToInt32 and the narrower conversions return TLA+ integers; NumToUint32 can
\* exceed 2^31 - 1, so it returns a Number.
NumToInt32(x) == IF x.k = "int" THEN x.i ELSE Int32FromHalves(Uint32Halves(x))

NumToUint32(x) == IF x.k = "int" /\ x.i >= 0 THEN x ELSE Uint32FromHalves(Uint32Halves(x))

NumToUint16(x) == Uint32Halves(x)[2]

NumToInt16(x) == LET low == NumToUint16(x) IN IF low >= 32768 THEN low - 65536 ELSE low

NumToUint8(x) == NumToUint16(x) % 256

NumToInt8(x) == LET low == NumToUint8(x) IN IF low >= 128 THEN low - 256 ELSE low

NumToUint8Clamp(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) \/ x.neg -> 0
    [] x.k = "int" -> IF x.i > 255 THEN 255 ELSE x.i
    [] x.k = "inf" \/ x.e >= 0 \/ BNBitLength(x.m) + x.e > 8 -> 255
    [] OTHER ->
         LET floor == BNToInt(BNShiftRight(x.m, -x.e))
             isHalf == BNTestBit(x.m, -x.e - 1)
             isAboveHalf == isHalf /\ BNLowBits(x.m, -x.e - 1) # <<>>
         IN CASE floor >= 255 -> 255
              [] isAboveHalf \/ (isHalf /\ floor % 2 = 1) -> floor + 1
              [] OTHER -> floor

ShiftCount(y) == Uint32Halves(y)[2] % 32

NumLeftShift(x, y) ==
  LET halves == Uint32Halves(x)
      count == ShiftCount(y)
      low == halves[2] * 2 ^ (count % 16)
  IN NumFromInt(Int32FromHalves(
       IF count >= 16 THEN <<low % 65536, 0>>
       ELSE <<(halves[1] * 2 ^ count + (low \div 65536)) % 65536, low % 65536>>))

NumSignedRightShift(x, y) ==
  LET count == ShiftCount(y)
  IN NumFromInt(IF count = 0 THEN NumToInt32(x) ELSE (NumToInt32(x) \div 2) \div 2 ^ (count - 1))

NumUnsignedRightShift(x, y) ==
  LET halves == Uint32Halves(x)
      count == ShiftCount(y)
  IN CASE count = 0 -> Uint32FromHalves(halves)
       [] count >= 16 -> NumIntNum(halves[1] \div 2 ^ (count - 16))
       [] OTHER -> NumFromInt(halves[1] * 2 ^ (16 - count) + halves[2] \div 2 ^ count)

NumBitwiseNOT(x) == NumFromInt(-1 - NumToInt32(x))

RECURSIVE BitwiseInt(_, _, _)
BitwiseInt(op, a, b) ==
  IF a = 0 /\ b = 0 THEN 0
  ELSE 2 * BitwiseInt(op, a \div 2, b \div 2)
         + CASE op = "and" -> (a % 2) * (b % 2)
             [] op = "or" -> IF (a % 2) + (b % 2) > 0 THEN 1 ELSE 0
             [] op = "xor" -> ((a % 2) + (b % 2)) % 2

NumBitwise(op, x, y) ==
  LET left == Uint32Halves(x)
      right == Uint32Halves(y)
  IN NumFromInt(Int32FromHalves(<<BitwiseInt(op, left[1], right[1]),
                                  BitwiseInt(op, left[2], right[2])>>))

NumBitwiseAND(x, y) == NumBitwise("and", x, y)

NumBitwiseXOR(x, y) == NumBitwise("xor", x, y)

NumBitwiseOR(x, y) == NumBitwise("or", x, y)

(***************************************************************************)
(* Math functions and NumToIntegerOrInfinity.                                 *)
(***************************************************************************)

\* For a nonintegral "fin" x, the integer part of |x|.
TruncatedMagnitude(x) == BNShiftRight(x.m, -x.e)

NumIsNonintegral(x) == x.k = "fin" /\ x.e < 0

MathTrunc(x) == IF NumIsNonintegral(x) THEN NumMakeNum(x.neg, TruncatedMagnitude(x), 0) ELSE x

MathFloor(x) ==
  CASE ~NumIsNonintegral(x) -> x
    [] x.neg -> NumMakeNum(TRUE, BNAdd(TruncatedMagnitude(x), <<1>>), 0)
    [] OTHER -> NumMakeNum(FALSE, TruncatedMagnitude(x), 0)

MathCeil(x) ==
  CASE ~NumIsNonintegral(x) -> x
    [] x.neg -> NumMakeNum(TRUE, TruncatedMagnitude(x), 0)
    [] OTHER -> NumMakeNum(FALSE, BNAdd(TruncatedMagnitude(x), <<1>>), 0)

\* Ties go toward +Infinity, and values in [-0.5, -0] round to -0.
MathRound(x) ==
  IF ~NumIsNonintegral(x) THEN x
  ELSE LET isHalf == BNTestBit(x.m, -x.e - 1)
           isAboveHalf == isHalf /\ BNLowBits(x.m, -x.e - 1) # <<>>
           isUp == IF x.neg THEN isAboveHalf ELSE isHalf
       IN NumMakeNum(x.neg, IF isUp THEN BNAdd(TruncatedMagnitude(x), <<1>>)
                                 ELSE TruncatedMagnitude(x), 0)

MathSign(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] x.neg -> NumIntNum(-1)
    [] OTHER -> NumIntNum(1)

MathAbs(x) == NumAbs(x)

MathMin2(x, y) ==
  CASE x.k = "nan" \/ y.k = "nan" -> NaN
    [] NumIsZero(x) /\ NumIsZero(y) -> IF x.neg \/ y.neg THEN NegZero ELSE PosZero
    [] OTHER -> IF NumCompare(y, x) < 0 THEN y ELSE x

MathMax2(x, y) ==
  CASE x.k = "nan" \/ y.k = "nan" -> NaN
    [] NumIsZero(x) /\ NumIsZero(y) -> IF x.neg /\ y.neg THEN NegZero ELSE PosZero
    [] OTHER -> IF NumCompare(y, x) > 0 THEN y ELSE x

RECURSIVE MathMinFrom(_, _)
MathMinFrom(numbers, i) ==
  IF i > Len(numbers) THEN PosInf ELSE MathMin2(numbers[i], MathMinFrom(numbers, i + 1))

RECURSIVE MathMaxFrom(_, _)
MathMaxFrom(numbers, i) ==
  IF i > Len(numbers) THEN NegInf ELSE MathMax2(numbers[i], MathMaxFrom(numbers, i + 1))

\* Math.min and Math.max of a sequence of Numbers.
MathMin(numbers) == MathMinFrom(numbers, 1)

MathMax(numbers) == MathMaxFrom(numbers, 1)

MathFround(x) ==
  IF x.k \in {"nan", "inf", "nzero"} \/ NumIsZero(x) THEN x
  ELSE RoundBits(x.neg, NumMag(x), NumExponent(x), FALSE, 24, -126, 127)

\* The Number nearest sqrt(m * 2^e) for a nonzero BigNat m.
SqrtBits(m, e) ==
  LET isOdd == e % 2 = 1
      even == IF isOdd THEN BNShiftLeft(m, 1) ELSE m
      shift == NumIntMax(0, (111 - BNBitLength(even)) \div 2)
      scaled == BNShiftLeft(even, 2 * shift)
      root == BNSqrt(scaled)
  IN RoundDouble(FALSE, root, (IF isOdd THEN e - 1 ELSE e) \div 2 - shift, BNMul(root, root) # scaled)

MathSqrt(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] x.neg -> NaN
    [] x.k = "inf" -> x
    [] OTHER -> SqrtBits(NumMag(x), NumExponent(x))

MathF16round(x) ==
  IF x.k \in {"nan", "inf", "nzero"} \/ NumIsZero(x) THEN x
  ELSE RoundBits(x.neg, NumMag(x), NumExponent(x), FALSE, 11, -14, 15)

MathCbrt(x) ==
  IF x.k \in {"nan", "inf"} \/ NumIsZero(x) THEN x
  ELSE LET remainder == NumExponent(x) % 3
           m == BNShiftLeft(NumMag(x), remainder)
           shift == NumIntMax(0, (170 - BNBitLength(m)) \div 3)
           scaled == BNShiftLeft(m, 3 * shift)
           root == BNCbrt(scaled)
       IN RoundDouble(x.neg, root, (NumExponent(x) - remainder) \div 3 - shift,
                      BNMul(BNMul(root, root), root) # scaled)

\* The sum of the squares of numbers[i], numbers[i + 1], ... in units of
\* 2^(2 * low), where low is at most the exponent of each nonzero one.
RECURSIVE SquareSum(_, _, _)
SquareSum(numbers, low, i) ==
  IF i > Len(numbers) THEN <<>>
  ELSE LET m == IF NumIsZero(numbers[i]) THEN <<>>
                ELSE BNShiftLeft(NumMag(numbers[i]), NumExponent(numbers[i]) - low)
       IN BNAdd(BNMul(m, m), SquareSum(numbers, low, i + 1))

\* Math.hypot of a sequence of Numbers.
MathHypot(numbers) ==
  LET nonzero == {i \in DOMAIN numbers : ~NumIsZero(numbers[i])}
      exponents == {NumExponent(numbers[i]) : i \in nonzero}
      low == CHOOSE e \in exponents : \A d \in exponents : e <= d
  IN CASE \E i \in DOMAIN numbers : numbers[i].k = "inf" -> PosInf
       [] \E i \in DOMAIN numbers : numbers[i].k = "nan" -> NaN
       [] nonzero = {} -> PosZero
       [] OTHER -> SqrtBits(SquareSum(numbers, low, 1), 2 * low)

\* The number of leading zero bits of NumToUint32(x).
MathClz32(x) ==
  LET halves == Uint32Halves(x)
  IN NumIntNum(IF halves[1] > 0 THEN 16 - BNIntBitLength(halves[1]) ELSE 32 - BNIntBitLength(halves[2]))

MathImul(x, y) ==
  LET toBigNat(halves) == BNAdd(BNShiftLeft(BNFromInt(halves[1]), 16), BNFromInt(halves[2]))
      product == BNLowBits(BNMul(toBigNat(Uint32Halves(x)), toBigNat(Uint32Halves(y))), 32)
  IN NumFromInt(Int32FromHalves(<<BNToInt(BNShiftRight(product, 16)), BNToInt(BNLowBits(product, 16))>>))

(***************************************************************************)
(* Number::exponentiate (§6.1.6.1.3). Integer powers are computed exactly  *)
(* when they have at most 2200 bits. Other powers are 2^(y * log2 x) in    *)
(* fixed point with Ziv's rounding test, so they are correctly rounded.    *)
(* A fixed-point real r at precision p is the BigNat floor(r * 2^p), and a *)
(* signed one is <<neg, magnitude>>.                                       *)
(***************************************************************************)

\* The sum of term_k / (2k + 1) from index on, where term_{k+1} is
\* term_k * square: atanh(z) for term_0 = z and square = z^2.
RECURSIVE AtanhSeries(_, _, _, _, _)
AtanhSeries(term, square, index, precision, sum) ==
  IF term = <<>> THEN sum
  ELSE AtanhSeries(BNShiftRight(BNMul(term, square), precision), square, index + 1, precision,
                   BNAdd(sum, BNDivModSmall(term, 2 * index + 1)[1]))

\* ln(u) = 2 * atanh((u - 1) / (u + 1)).
FixedLn(u, precision) ==
  LET one == BNPow2(precision)
      isNegative == BNCompare(u, one) < 0
      difference == IF isNegative THEN BNSub(one, u) ELSE BNSub(u, one)
      z == BNDivMod(BNShiftLeft(difference, precision), BNAdd(u, one))[1]
  IN <<isNegative,
       BNShiftLeft(AtanhSeries(z, BNShiftRight(BNMul(z, z), precision), 0, precision, <<>>), 1)>>

FixedLn2(precision) == FixedLn(BNPow2(precision + 1), precision)[2]

\* The sum of term_k from index on, where term_{k+1} is term_k * w / (k + 1).
RECURSIVE ExpSeries(_, _, _, _, _)
ExpSeries(term, w, index, precision, sum) ==
  IF term = <<>> THEN sum
  ELSE ExpSeries(BNDivModSmall(BNShiftRight(BNMul(term, w), precision), index)[1],
                 w, index + 1, precision, BNAdd(sum, term))

SignedAdd(a, b) ==
  CASE a[1] = b[1] -> <<a[1], BNAdd(a[2], b[2])>>
    [] BNCompare(a[2], b[2]) >= 0 -> <<a[1], BNSub(a[2], b[2])>>
    [] OTHER -> <<b[1], BNSub(b[2], a[2])>>

\* 2^t for a signed fixed-point t at precision p, as <<m, k>> with 2^t about
\* m * 2^(k - p) and m in [2^p, 2^(p + 1)), given ln 2 at precision p.
FixedPow2(t, ln2, p) ==
  LET whole == BNShiftRight(t[2], p)
      fraction == BNLowBits(t[2], p)
      f == IF t[1] /\ fraction # <<>> THEN BNSub(BNPow2(p), fraction) ELSE fraction
  IN <<ExpSeries(BNPow2(p), BNShiftRight(BNMul(f, ln2), p), 1, p, <<>>),
       CASE ~t[1] -> BNToInt(whole)
         [] fraction = <<>> -> -BNToInt(whole)
         [] OTHER -> -BNToInt(whole) - 1>>

\* <<isExact, result>> for |base|^exponent with the sign neg, where isExact
\* says the error bound rounds to the result.
PowApproximation(neg, base, exponent, precision) ==
  LET one == BNPow2(precision)
      length == BNBitLength(NumMag(base))
      \* |base| = u * 2^power with u in [1/sqrt(2), sqrt(2)).
      isHigh == BNCompare(BNMul(NumMag(base), NumMag(base)), BNPow2(2 * length - 1)) >= 0
      power == NumExponent(base) + length - (IF isHigh THEN 0 ELSE 1)
      u == BNShiftLeft(NumMag(base), precision - length + (IF isHigh THEN 0 ELSE 1))
      ln2 == FixedLn2(precision)
      lnU == FixedLn(u, precision)
      log2 == SignedAdd(<<power < 0, BNShiftLeft(BNFromInt(NumIntAbs(power)), precision)>>,
                        <<lnU[1], BNDivMod(BNShiftLeft(lnU[2], precision), ln2)[1]>>)
      product == BNMul(log2[2], NumMag(exponent))
      t == IF NumExponent(exponent) >= 0 THEN BNShiftLeft(product, NumExponent(exponent))
           ELSE BNShiftRight(product, -NumExponent(exponent))
      isNegativeT == log2[1] # exponent.neg
      pow == FixedPow2(<<isNegativeT, t>>, ln2, precision)
      error == BNShiftRight(pow[1], precision - 80)
      low == RoundDouble(neg, BNSub(pow[1], error), pow[2] - precision, FALSE)
      high == RoundDouble(neg, BNAdd(pow[1], error), pow[2] - precision, FALSE)
  IN CASE BNCompare(t, BNMulSmall(one, 1100)) <= 0 -> <<low = high, low>>
       [] isNegativeT -> <<TRUE, IF neg THEN NegZero ELSE PosZero>>
       [] OTHER -> <<TRUE, MkNum("inf", neg, 0, <<>>, 0)>>

\* base^exponent for finite nonzero operands, with an integral exponent if
\* base < 0.
PowFinite(base, exponent) ==
  LET neg == base.neg /\ NumIsOddIntegral(exponent)
      n == NumToInt(exponent)
      approximation == PowApproximation(neg, base, exponent, 160)
  IN CASE NumIsIntegral(exponent) /\ NumFitsInt(exponent) /\ -2200 <= n /\ n <= 2200
            /\ NumIntAbs(n) * BNBitLength(NumMag(base)) <= 2200 ->
            IF n > 0 THEN RoundDouble(neg, BNPow(NumMag(base), n), NumExponent(base) * n, FALSE)
            ELSE RoundRatio(neg, <<1>>, BNPow(NumMag(base), -n), NumExponent(base) * n)
       [] approximation[1] -> approximation[2]
       [] OTHER -> PowApproximation(neg, base, exponent, 320)[2]

NumExponentiate(base, exponent) ==
  LET isOdd == NumIsOddIntegral(exponent)
  IN CASE exponent.k = "nan" -> NaN
       [] NumIsZero(exponent) -> NumIntNum(1)
       [] base.k = "nan" -> NaN
       [] base.k = "inf" /\ ~base.neg -> IF exponent.neg THEN PosZero ELSE PosInf
       [] base.k = "inf" ->
            IF exponent.neg THEN IF isOdd THEN NegZero ELSE PosZero
            ELSE IF isOdd THEN NegInf ELSE PosInf
       [] NumIsZero(base) /\ ~base.neg -> IF exponent.neg THEN PosInf ELSE PosZero
       [] NumIsZero(base) ->
            IF exponent.neg THEN IF isOdd THEN NegInf ELSE PosInf
            ELSE IF isOdd THEN NegZero ELSE PosZero
       [] exponent.k = "inf" ->
            LET order == CompareMagnitude(base, NumIntNum(1))
            IN CASE order = 0 -> NaN
                 [] (order > 0) = ~exponent.neg -> PosInf
                 [] OTHER -> PosZero
       [] base.neg /\ ~NumIsIntegral(exponent) -> NaN
       [] OTHER -> PowFinite(base, exponent)

MaxSafeInteger == MkNum("fin", FALSE, 0, BNSub(BNPow2(53), <<1>>), 0)

NumToIntegerOrInfinity(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> PosZero
    [] OTHER -> LET truncated == MathTrunc(x)
                IN IF truncated.k = "nzero" THEN PosZero ELSE truncated

\* NumToLength: NumToIntegerOrInfinity clamped to 0..2^53-1.
NumToLength(x) ==
  LET length == NumToIntegerOrInfinity(x)
  IN CASE length.neg \/ NumIsZero(length) -> PosZero
       [] NumCompare(length, MaxSafeInteger) > 0 -> MaxSafeInteger
       [] OTHER -> length

\* NumToIntegerOrInfinity(x) clamped to low..high, as in the relative index
\* arguments of Array.prototype.slice.
NumClamp(x, low, high) ==
  LET integer == NumToIntegerOrInfinity(x)
  IN CASE NumCompare(integer, low) < 0 -> low
       [] NumCompare(integer, high) > 0 -> high
       [] OTHER -> integer

\* The least Number greater than a finite x >= +0.
NumNextUp(x) ==
  IF NumIsZero(x) THEN MkNum("fin", FALSE, 0, <<1>>, -1074)
  ELSE LET length == BNBitLength(NumMag(x))
           shift == IF NumExponent(x) + length - 1 >= -1022 THEN 53 - length ELSE NumExponent(x) + 1074
       IN RoundDouble(FALSE, BNAdd(BNShiftLeft(NumMag(x), shift), <<1>>), NumExponent(x) - shift, FALSE)

(***************************************************************************)
(* The Math functions the spec leaves implementation-approximated, here    *)
(* correctly rounded. An approximation [neg, m, e, err] says the exact     *)
(* value lies within err * 2^e of (-1)^neg * m * 2^e. Each comes from      *)
(* fixed-point reals at a precision p, and MathZiv doubles p until every   *)
(* value in that range rounds to the same Number (Ziv's strategy). That    *)
(* ends: at the arguments that reach it the functions are transcendental,  *)
(* so no result is a midpoint between two Numbers.                         *)
(***************************************************************************)

Approx(neg, m, e, err) == [neg |-> neg, m |-> m, e |-> e, err |-> err]

\* A bound, in units of the last place, on the error of the fixed-point
\* computations below at precision p: their series have fewer than p terms
\* and their reductions multiply errors by less than 2^12.
Tolerance(p) == BNShiftLeft(BNFromInt(p), 16)

\* The exponent of the leading bit of a finite nonzero x.
NumTop(x) == NumExponent(x) + BNBitLength(NumMag(x)) - 1

\* The bits to add to a precision so that a value about as large as |x|
\* keeps it.
ExtraBits(x) == IF NumIsZero(x) \/ NumTop(x) >= 0 THEN 0 ELSE -NumTop(x)

\* |x| as a fixed-point real at precision p, truncated, for a finite x.
FixedAbs(x, p) ==
  CASE NumIsZero(x) -> <<>>
    [] NumExponent(x) + p >= 0 -> BNShiftLeft(NumMag(x), NumExponent(x) + p)
    [] OTHER -> BNShiftRight(NumMag(x), -NumExponent(x) - p)

FixedMul(a, b, p) == BNShiftRight(BNMul(a, b), p)

FixedDiv(a, b, p) == BNDivMod(BNShiftLeft(a, p), b)[1]

\* <<num, den>> with |x| = num / den, for a finite nonzero x.
NumRatio(x) ==
  <<BNShiftLeft(NumMag(x), NumIntMax(NumExponent(x), 0)), BNPow2(NumIntMax(-NumExponent(x), 0))>>

\* num / (den * 2^power) as a fixed-point real at precision p, truncated.
ScaledRatio(num, den, power, p) ==
  IF p >= power THEN BNDivMod(BNShiftLeft(num, p - power), den)[1]
  ELSE BNDivMod(num, BNShiftLeft(den, power - p))[1]

\* The quotient a / b of fixed-point approximations at precision p that are
\* each within err of their values, as [m, err]. The quotient's error is at
\* most err * (a + b) * 2^p / (b * (b - err)), plus one for the truncation.
FixedQuotient(a, b, err, p) ==
  IF BNCompare(b, err) <= 0 THEN [m |-> <<>>, err |-> <<1>>]
  ELSE [m |-> FixedDiv(a, b, p),
        err |-> BNAdd(BNDivMod(BNShiftLeft(BNMul(BNAdd(a, b), err), p), BNMul(b, BNSub(b, err)))[1], <<2>>)]

\* <<isExact, n>>: whether every value within a.err of a.m rounds to n.
RoundApprox(a) ==
  IF BNCompare(a.m, a.err) <= 0 THEN <<FALSE, NaN>>
  ELSE LET low == RoundDouble(a.neg, BNSub(a.m, a.err), a.e, FALSE)
       IN <<low = RoundDouble(a.neg, BNAdd(a.m, a.err), a.e, FALSE), low>>

\* ln(num / den) for nonzero BigNats, as <<power, ln u>> with num / den =
\* u * 2^power, u in [1/sqrt(2), sqrt(2)), and ln u signed at precision p.
LnParts(num, den, p) ==
  LET guess == BNBitLength(num) - BNBitLength(den)
      estimate == ScaledRatio(num, den, guess, p)
      square == BNMul(estimate, estimate)
      power == CASE BNCompare(square, BNPow2(2 * p + 1)) >= 0 -> guess + 1
                 [] BNCompare(square, BNPow2(2 * p - 1)) < 0 -> guess - 1
                 [] OTHER -> guess
  IN <<power, FixedLn(ScaledRatio(num, den, power, p), p)>>

\* ln(num / den) for nonzero BigNats, signed at precision p.
FixedLnRatio(num, den, p) ==
  LET parts == LnParts(num, den, p)
  IN SignedAdd(<<parts[1] < 0, BNMulSmall(FixedLn2(p), NumIntAbs(parts[1]))>>, parts[2])

\* ln 10 = 3 ln 2 + ln 1.25.
FixedLn10(p) == BNAdd(BNMulSmall(FixedLn2(p), 3), FixedLn(BNAdd(BNPow2(p), BNPow2(p - 2)), p)[2])

\* e^x as <<m, k>> with e^x about m * 2^(k - p), for a finite x with
\* |x| < 2^20.
ExpParts(x, p) ==
  LET ln2 == FixedLn2(p) IN FixedPow2(<<x.neg, FixedDiv(FixedAbs(x, p), ln2, p)>>, ln2, p)

\* e^x as a fixed-point real at precision p, as [m, err].
FixedExp(x, p) ==
  LET parts == ExpParts(x, p)
  IN IF parts[2] >= 0
     THEN [m |-> BNShiftLeft(parts[1], parts[2]), err |-> BNShiftLeft(Tolerance(p), parts[2])]
     ELSE [m |-> BNShiftRight(parts[1], -parts[2]), err |-> Tolerance(p)]

\* The sum of (-1)^k term_k / (2k + 1) from index on, with sums its positive
\* and negative parts so far: atan(y) for term_0 = y. The next term is
\* term * square at precision p, or term / n^2 when n # 0, which gives
\* atan(1/n) for term_0 = 1/n.
RECURSIVE AtanSeries(_, _, _, _, _, _)
AtanSeries(term, square, n, p, index, sums) ==
  IF term = <<>> THEN BNSub(sums[1], sums[2])
  ELSE LET part == BNDivModSmall(term, 2 * index + 1)[1]
       IN AtanSeries(IF n = 0 THEN FixedMul(term, square, p)
                     ELSE BNDivModSmall(BNDivModSmall(term, n)[1], n)[1],
                     square, n, p, index + 1,
                     IF index % 2 = 0 THEN <<BNAdd(sums[1], part), sums[2]>>
                     ELSE <<sums[1], BNAdd(sums[2], part)>>)

\* atan(1/n) at precision p.
FixedAtanInverse(n, p) == AtanSeries(BNDivModSmall(BNPow2(p), n)[1], <<>>, n, p, 0, <<<<>>, <<>>>>)

\* pi = 16 atan(1/5) - 4 atan(1/239) (Machin's formula), with 8 guard bits.
FixedPi(p) ==
  BNShiftRight(BNSub(BNMulSmall(FixedAtanInverse(5, p + 8), 16),
                     BNMulSmall(FixedAtanInverse(239, p + 8), 4)), 8)

\* atan(y) for a fixed-point y in [0, 1] at precision p. Above 1/8 it halves
\* the angle: atan(y) = 2 atan(y / (1 + sqrt(1 + y^2))).
RECURSIVE FixedAtan(_, _)
FixedAtan(y, p) ==
  IF BNCompare(BNShiftLeft(y, 3), BNPow2(p)) <= 0
  THEN AtanSeries(y, FixedMul(y, y, p), 0, p, 0, <<<<>>, <<>>>>)
  ELSE BNShiftLeft(FixedAtan(FixedDiv(y, BNAdd(BNPow2(p), BNSqrt(BNAdd(BNPow2(2 * p), BNMul(y, y)))), p), p), 1)

\* atan(num / den) for nonzero BigNats at precision p.
AtanRatio(num, den, p) ==
  IF BNCompare(num, den) <= 0 THEN FixedAtan(ScaledRatio(num, den, 0, p), p)
  ELSE BNSub(BNShiftRight(FixedPi(p), 1), FixedAtan(ScaledRatio(den, num, 0, p), p))

\* The precision at which atan(num / den) keeps p bits.
AtanPrecision(num, den, p) == p + NumIntMax(0, BNBitLength(den) - BNBitLength(num))

\* sqrt(den^2 - num^2) at precision p, for the <<num, den>> of NumRatio(x):
\* sqrt(1 - x^2) is it divided by den.
ComplementRoot(ratio, p) ==
  BNSqrt(BNShiftLeft(BNSub(BNMul(ratio[2], ratio[2]), BNMul(ratio[1], ratio[1])), 2 * p))

\* The sum of (-1)^(n \div 2) term_n over n from n on, two apart, where the
\* next term is term * square / ((n + 1) * (n + 2)): sin r for term_1 = r
\* and cos r for term_0 = 1, with square = r^2.
RECURSIVE TrigSeries(_, _, _, _, _, _)
TrigSeries(term, square, n, p, positive, negative) ==
  IF term = <<>> THEN BNSub(positive, negative)
  ELSE TrigSeries(BNDivModSmall(BNDivModSmall(FixedMul(term, square, p), n + 1)[1], n + 2)[1],
                  square, n + 2, p,
                  IF (n \div 2) % 2 = 0 THEN BNAdd(positive, term) ELSE positive,
                  IF (n \div 2) % 2 = 0 THEN negative ELSE BNAdd(negative, term))

\* <<k % 4, sin r, cos r>> with |x| = k * pi/2 + r and |r| <= pi/4, for a
\* finite nonzero x, with sin r and cos r signed at precision p.
TrigParts(x, p) ==
  LET q == p + NumTop(x) + 4
      halfPi == BNShiftRight(FixedPi(q), 1)
      X == FixedAbs(x, q)
      k == BNDivMod(BNAdd(BNShiftLeft(X, 1), halfPi), BNShiftLeft(halfPi, 1))[1]
      multiple == BNMul(k, halfPi)
      isSmall == NumTop(x) < -1
      isNegative == ~isSmall /\ BNCompare(X, multiple) < 0
      r == CASE isSmall -> FixedAbs(x, p)
             [] isNegative -> BNShiftRight(BNSub(multiple, X), q - p)
             [] OTHER -> BNShiftRight(BNSub(X, multiple), q - p)
      square == FixedMul(r, r, p)
  IN <<IF isSmall THEN 0 ELSE BNToInt(BNLowBits(k, 2)),
       <<isNegative, TrigSeries(r, square, 1, p, <<>>, <<>>)>>,
       <<FALSE, TrigSeries(BNPow2(p), square, 0, p, <<>>, <<>>)>>>>

\* An approximation at precision p of f(x), or of atan2(y, x) for f "atan2".
\* The callers handle the arguments the spec gives exact results for.
MathApprox(f, x, y, p) ==
  CASE f = "exp" ->
         LET parts == ExpParts(x, p) IN Approx(FALSE, parts[1], parts[2] - p, Tolerance(p))
    [] f = "expm1" ->
         LET q == p + ExtraBits(x)
             parts == ExpParts(x, q)
         IN IF parts[2] >= 0
            THEN Approx(FALSE, BNSub(BNShiftLeft(parts[1], parts[2]), BNPow2(q)), -q,
                        BNShiftLeft(Tolerance(q), parts[2]))
            ELSE Approx(TRUE, BNSub(BNPow2(q - parts[2]), parts[1]), parts[2] - q, Tolerance(q))
    [] f \in {"sinh", "cosh", "tanh"} ->
         \* From e^|x| and e^-|x|.
         LET q == p + (IF f = "cosh" THEN 0 ELSE ExtraBits(x))
             a == FixedExp(NumAbs(x), q)
             b == FixedExp(NumUnaryMinus(NumAbs(x)), q)
             err == BNAdd(a.err, b.err)
             quotient == FixedQuotient(BNSub(a.m, b.m), BNAdd(a.m, b.m), err, q)
         IN CASE f = "sinh" -> Approx(x.neg, BNSub(a.m, b.m), -q - 1, err)
              [] f = "cosh" -> Approx(FALSE, BNAdd(a.m, b.m), -q - 1, err)
              [] OTHER -> Approx(x.neg, quotient.m, -q, quotient.err)
    [] f \in {"log", "log2", "log10"} ->
         LET q == p + ExtraBits(NumSubtract(x, NumIntNum(1)))
             ratio == NumRatio(x)
             parts == LnParts(ratio[1], ratio[2], q)
             ln == FixedLnRatio(ratio[1], ratio[2], q)
             log2 == SignedAdd(<<parts[1] < 0, BNShiftLeft(BNFromInt(NumIntAbs(parts[1])), q)>>,
                               <<parts[2][1], FixedDiv(parts[2][2], FixedLn2(q), q)>>)
         IN CASE f = "log" -> Approx(ln[1], ln[2], -q, Tolerance(q))
              [] f = "log2" -> Approx(log2[1], log2[2], -q, Tolerance(q))
              [] OTHER -> Approx(ln[1], FixedDiv(ln[2], FixedLn10(q), q), -q, Tolerance(q))
    [] f = "log1p" ->
         LET q == p + ExtraBits(x)
             ratio == NumRatio(x)
             ln == FixedLnRatio(IF x.neg THEN BNSub(ratio[2], ratio[1]) ELSE BNAdd(ratio[2], ratio[1]),
                                ratio[2], q)
         IN Approx(ln[1], ln[2], -q, Tolerance(q))
    [] f \in {"asinh", "acosh"} ->
         \* ln(|x| + sqrt(x^2 + 1)) and ln(x + sqrt(x^2 - 1)), which are within
         \* 2^-q of ln(2 |x|) when 2 * NumTop(x) >= q.
         LET q == p + ExtraBits(IF f = "asinh" THEN x ELSE NumSubtract(x, NumIntNum(1)))
             X == FixedAbs(x, q)
             root == BNSqrt(IF f = "asinh" THEN BNAdd(BNMul(X, X), BNPow2(2 * q))
                            ELSE BNSub(BNMul(X, X), BNPow2(2 * q)))
             ratio == NumRatio(x)
             ln == IF 2 * NumTop(x) >= q THEN FixedLnRatio(BNShiftLeft(ratio[1], 1), ratio[2], q)
                   ELSE FixedLnRatio(BNAdd(X, root), BNPow2(q), q)
         IN Approx(x.neg, ln[2], -q, Tolerance(q))
    [] f = "atanh" ->
         \* ln((1 + |x|) / (1 - |x|)) / 2.
         LET q == p + ExtraBits(x)
             ratio == NumRatio(x)
         IN Approx(x.neg, FixedLnRatio(BNAdd(ratio[2], ratio[1]), BNSub(ratio[2], ratio[1]), q)[2],
                   -q - 1, Tolerance(q))
    [] f = "atan" ->
         IF x.k = "inf" THEN Approx(x.neg, BNShiftRight(FixedPi(p), 1), -p, Tolerance(p))
         ELSE LET ratio == NumRatio(x)
                  q == AtanPrecision(ratio[1], ratio[2], p)
              IN Approx(x.neg, AtanRatio(ratio[1], ratio[2], q), -q, Tolerance(q))
    [] f = "asin" ->
         \* atan(|x| / sqrt(1 - x^2)).
         LET q == p + ExtraBits(x)
             ratio == NumRatio(x)
             root == ComplementRoot(ratio, q)
         IN Approx(x.neg, IF root = <<>> THEN BNShiftRight(FixedPi(q), 1)
                          ELSE AtanRatio(BNShiftLeft(ratio[1], q), root, q),
                   -q, Tolerance(q))
    [] f = "acos" ->
         \* atan(sqrt(1 - x^2) / |x|), or pi minus it when x < 0.
         LET q == p + ExtraBits(NumSubtract(NumIntNum(1), NumAbs(x)))
             ratio == NumRatio(x)
             root == ComplementRoot(ratio, q)
             pi == FixedPi(q)
             angle == CASE NumIsZero(x) -> BNShiftRight(pi, 1)
                         [] root = <<>> -> <<>>
                         [] OTHER -> AtanRatio(root, BNShiftLeft(ratio[1], q), q)
         IN Approx(FALSE, IF x.neg THEN BNSub(pi, angle) ELSE angle, -q, Tolerance(q))
    [] f = "atan2" ->
         \* atan(|y| / |x|), or pi minus it when x is negative, with the sign
         \* of y.
         LET rx == NumRatio(x)
             ry == NumRatio(y)
             num == BNMul(ry[1], rx[2])
             den == BNMul(ry[2], rx[1])
             q == IF x.neg \/ x.k = "inf" \/ y.k = "inf" \/ NumIsZero(x) \/ NumIsZero(y) THEN p
                  ELSE AtanPrecision(num, den, p)
             pi == FixedPi(q)
             angle == CASE y.k = "inf" /\ x.k = "inf" -> BNShiftRight(pi, 2)
                         [] y.k = "inf" -> BNShiftRight(pi, 1)
                         [] NumIsZero(y) \/ x.k = "inf" -> <<>>
                         [] NumIsZero(x) -> BNShiftRight(pi, 1)
                         [] OTHER -> AtanRatio(num, den, q)
         IN Approx(y.neg, IF x.neg THEN BNSub(pi, angle) ELSE angle, -q, Tolerance(q))
    [] f \in {"sin", "cos", "tan"} ->
         \* From the sine and cosine of x reduced by a multiple of pi/2.
         LET q == p + (IF f = "cos" THEN 0 ELSE ExtraBits(x))
             parts == TrigParts(x, q)
             negate(a) == <<~a[1], a[2]>>
             value == CASE f = "sin" /\ parts[1] \in {0, 2} -> parts[2]
                        [] f = "sin" -> parts[3]
                        [] parts[1] \in {0, 2} -> parts[3]
                        [] OTHER -> negate(parts[2])
             signed == IF parts[1] >= 2 THEN negate(value) ELSE value
             quotient == IF parts[1] \in {0, 2} THEN FixedQuotient(parts[2][2], parts[3][2], Tolerance(q), q)
                         ELSE FixedQuotient(parts[3][2], parts[2][2], Tolerance(q), q)
         IN CASE f = "sin" -> Approx(x.neg # signed[1], signed[2], -q, Tolerance(q))
              [] f = "cos" -> Approx(signed[1], signed[2], -q, Tolerance(q))
              [] OTHER -> Approx((x.neg # parts[2][1]) # (parts[1] \in {1, 3}), quotient.m, -q, quotient.err)

\* f(x), or atan2(y, x) for f "atan2", correctly rounded, from precision p.
RECURSIVE MathZiv(_, _, _, _)
MathZiv(f, x, y, p) ==
  LET r == RoundApprox(MathApprox(f, x, y, p)) IN IF r[1] THEN r[2] ELSE MathZiv(f, x, y, 2 * p)

\* Whether a finite nonzero x is below 2^-bits in magnitude, where each
\* function below whose series is x + O(x^2) (bits 56) or x + O(x^3) (bits
\* 29) rounds to x: the rest of the series is below half the gap between x
\* and the next Number.
IsTiny(x, bits) == NumTop(x) < -bits

MathExp(x) ==
  CASE x.k = "nan" \/ x = PosInf -> x
    [] NumIsZero(x) -> NumIntNum(1)
    [] NumCompare(x, NumIntNum(710)) > 0 -> PosInf
    [] NumCompare(x, NumIntNum(-746)) < 0 -> PosZero
    [] OTHER -> MathZiv("exp", x, x, 160)

\* Below -40, e^x - 1 is within 2^-57 of -1, so it rounds to -1.
MathExpm1(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) \/ x = PosInf -> x
    [] NumCompare(x, NumIntNum(710)) > 0 -> PosInf
    [] NumCompare(x, NumIntNum(-40)) < 0 -> NumIntNum(-1)
    [] IsTiny(x, 56) -> x
    [] OTHER -> MathZiv("expm1", x, x, 160)

\* Above 711, e^|x| / 2 exceeds the largest Number.
MathCosh(x) ==
  CASE x.k = "nan" -> x
    [] NumIsZero(x) -> NumIntNum(1)
    [] x.k = "inf" \/ NumCompare(NumAbs(x), NumIntNum(711)) > 0 -> PosInf
    [] OTHER -> MathZiv("cosh", x, x, 160)

MathSinh(x) ==
  CASE x.k \in {"nan", "inf"} \/ NumIsZero(x) -> x
    [] NumCompare(NumAbs(x), NumIntNum(711)) > 0 -> MkNum("inf", x.neg, 0, <<>>, 0)
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("sinh", x, x, 160)

\* From 22 on, 1 - tanh |x| is below 2^-62, so tanh x rounds to 1 or -1.
MathTanh(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] x.k = "inf" \/ NumCompare(NumAbs(x), NumIntNum(22)) >= 0 -> NumIntNum(IF x.neg THEN -1 ELSE 1)
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("tanh", x, x, 160)

\* Math.log, Math.log2, and Math.log10, for f "log", "log2", and "log10".
MathLogarithm(f, x) ==
  CASE x.k = "nan" \/ x = PosInf -> x
    [] x = NumIntNum(1) -> PosZero
    [] NumIsZero(x) -> NegInf
    [] x.neg -> NaN
    [] OTHER -> MathZiv(f, x, x, 160)

MathLog1p(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) \/ x = PosInf -> x
    [] x = NumIntNum(-1) -> NegInf
    [] NumCompare(x, NumIntNum(-1)) < 0 -> NaN
    [] IsTiny(x, 56) -> x
    [] OTHER -> MathZiv("log1p", x, x, 160)

MathAsinh(x) ==
  IF x.k \in {"nan", "inf"} \/ NumIsZero(x) \/ IsTiny(x, 29) THEN x ELSE MathZiv("asinh", x, x, 160)

MathAcosh(x) ==
  CASE x.k = "nan" \/ x = PosInf -> x
    [] x = NumIntNum(1) -> PosZero
    [] NumCompare(x, NumIntNum(1)) < 0 -> NaN
    [] OTHER -> MathZiv("acosh", x, x, 160)

MathAtanh(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] NumCompare(NumAbs(x), NumIntNum(1)) > 0 -> NaN
    [] NumAbs(x) = NumIntNum(1) -> MkNum("inf", x.neg, 0, <<>>, 0)
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("atanh", x, x, 160)

MathAtan(x) ==
  IF x.k = "nan" \/ NumIsZero(x) \/ (x.k # "inf" /\ IsTiny(x, 29)) THEN x ELSE MathZiv("atan", x, x, 160)

MathAsin(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] NumCompare(NumAbs(x), NumIntNum(1)) > 0 -> NaN
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("asin", x, x, 160)

MathAcos(x) ==
  CASE x.k = "nan" \/ NumCompare(NumAbs(x), NumIntNum(1)) > 0 -> NaN
    [] x = NumIntNum(1) -> PosZero
    [] OTHER -> MathZiv("acos", x, x, 160)

\* Math.atan2(y, x).
MathAtan2(y, x) ==
  CASE y.k = "nan" \/ x.k = "nan" -> NaN
    [] ~x.neg /\ (NumIsZero(y) \/ (y.k # "inf" /\ x = PosInf)) -> IF y.neg THEN NegZero ELSE PosZero
    [] OTHER -> MathZiv("atan2", x, y, 160)

MathSin(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] x.k = "inf" -> NaN
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("sin", x, x, 160)

MathCos(x) ==
  CASE x.k \in {"nan", "inf"} -> NaN
    [] NumIsZero(x) -> NumIntNum(1)
    [] OTHER -> MathZiv("cos", x, x, 160)

MathTan(x) ==
  CASE x.k = "nan" \/ NumIsZero(x) -> x
    [] x.k = "inf" -> NaN
    [] IsTiny(x, 29) -> x
    [] OTHER -> MathZiv("tan", x, x, 160)

(***************************************************************************)
(* Number::toString (§6.1.6.1.20).                                         *)
(***************************************************************************)

StrNaN == <<78, 97, 78>>

StrInfinity == <<73, 110, 102, 105, 110, 105, 116, 121>>

NumDigitChar(d) == IF d < 10 THEN 48 + d ELSE 87 + d

NumDigitChars(digits) == [i \in 1..Len(digits) |-> NumDigitChar(digits[i])]

RECURSIVE IntToRadix(_, _)
IntToRadix(n, radix) ==
  IF n < radix THEN <<NumDigitChar(n)>> ELSE Append(IntToRadix(n \div radix, radix), NumDigitChar(n % radix))

\* Burger and Dybvig's free-format algorithm: r / s is the remaining value,
\* and the value's neighbors lie mm / s below and mp / s above.
RECURSIVE ShortestDigitsFrom(_, _, _, _, _, _)
ShortestDigitsFrom(r, s, mp, mm, isEven, digits) ==
  LET division == BNDivMod(BNMulSmall(r, 10), s)
      digit == BNToInt(division[1])
      rest == division[2]
      nextMp == BNMulSmall(mp, 10)
      nextMm == BNMulSmall(mm, 10)
      isLow == BNCompare(rest, nextMm) < (IF isEven THEN 1 ELSE 0)
      isHigh == BNCompare(BNAdd(rest, nextMp), s) > (IF isEven THEN -1 ELSE 0)
      half == BNCompare(BNMulSmall(rest, 2), s)
  IN CASE ~isLow /\ ~isHigh -> ShortestDigitsFrom(rest, s, nextMp, nextMm, isEven, Append(digits, digit))
       [] isLow /\ (~isHigh \/ half < 0 \/ (half = 0 /\ digit % 2 = 0)) -> Append(digits, digit)
       [] OTHER -> Append(digits, digit + 1)

RECURSIVE ShortestDigitsScaled(_, _, _, _, _, _)
ShortestDigitsScaled(r, s, mp, mm, isEven, k) ==
  IF BNCompare(BNAdd(r, mp), s) > (IF isEven THEN -1 ELSE 0)
  THEN ShortestDigitsScaled(r, BNMulSmall(s, 10), mp, mm, isEven, k + 1)
  ELSE <<ShortestDigitsFrom(r, s, mp, mm, isEven, <<>>), k>>

\* <<digits, n>> for a finite x > 0: the shortest digits d1..dk with
\* 0.d1..dk * 10^n rounding to x, the nearest such if there are several.
ShortestDigits(x) ==
  LET length == BNBitLength(NumMag(x))
      isNormal == NumExponent(x) + length - 1 >= -1022
      f == BNShiftLeft(NumMag(x), IF isNormal THEN 53 - length ELSE NumExponent(x) + 1074)
      fe == IF isNormal THEN NumExponent(x) - (53 - length) ELSE -1074
      isEven == ~BNIsOdd(f)
      isUnequal == f = BNPow2(52) /\ fe > -1074
      r == BNShiftLeft(f, IF fe >= 0 THEN fe ELSE 0)
      scale == (IF fe >= 0 THEN 0 ELSE -fe) + (IF isUnequal THEN 2 ELSE 1)
      gap == BNPow2(IF fe >= 0 THEN fe ELSE 0)
      estimate == ((fe + BNBitLength(f) - 1) * 78913) \div 262144
      power == BNPow10(NumIntAbs(estimate))
      scaleUp(n) == IF estimate < 0 THEN BNMul(n, power) ELSE n
      \* r, s, mp, and mm with the gaps doubled so they stay integers.
      r2 == scaleUp(BNShiftLeft(r, IF isUnequal THEN 2 ELSE 1))
      s2 == IF estimate >= 0 THEN BNMul(BNPow2(scale), power) ELSE BNPow2(scale)
      mp2 == scaleUp(IF isUnequal THEN BNShiftLeft(gap, 1) ELSE gap)
      mm2 == scaleUp(gap)
  IN ShortestDigitsScaled(r2, s2, mp2, mm2, isEven, estimate)

ZeroChars(count) == [i \in 1..count |-> 48]

FormatDecimal(digits, n) ==
  LET k == Len(digits)
      chars == NumDigitChars(digits)
      exponent == <<101, IF n >= 1 THEN 43 ELSE 45>> \o IntToRadix(NumIntAbs(n - 1), 10)
  IN CASE k <= n /\ n <= 21 -> chars \o ZeroChars(n - k)
       [] 0 < n /\ n <= 21 -> SubSeq(chars, 1, n) \o <<46>> \o SubSeq(chars, n + 1, k)
       [] -6 < n /\ n <= 0 -> <<48, 46>> \o ZeroChars(-n) \o chars
       [] k = 1 -> chars \o exponent
       [] OTHER -> <<chars[1], 46>> \o Tail(chars) \o exponent

PositiveToString(x) ==
  CASE x.k = "int" -> IntToRadix(x.i, 10)
    [] x.k = "inf" -> StrInfinity
    [] OTHER -> LET result == ShortestDigits(x) IN FormatDecimal(result[1], result[2])

NumToString(x) ==
  CASE x.k = "nan" -> StrNaN
    [] NumIsZero(x) -> <<48>>
    [] x.neg -> <<45>> \o PositiveToString(NumUnaryMinus(x))
    [] OTHER -> PositiveToString(x)

(***************************************************************************)
(* Number.prototype.toString(radix) for radix # 10 follows V8's            *)
(* DoubleToRadixCString, an implementation-approximated algorithm: it      *)
(* writes fraction digits until they pin down the double and rounds the    *)
(* last one half to even.                                                  *)
(***************************************************************************)

RECURSIVE RadixRoundUp(_, _)
RadixRoundUp(digits, radix) ==
  CASE digits = <<>> -> <<<<>>, TRUE>>
    [] digits[Len(digits)] + 1 < radix ->
         <<Append(SubSeq(digits, 1, Len(digits) - 1), digits[Len(digits)] + 1), FALSE>>
    [] OTHER -> RadixRoundUp(SubSeq(digits, 1, Len(digits) - 1), radix)

TwoPow53 == MkNum("fin", FALSE, 0, <<1>>, 53)

\* A conversion divides an integer by the radix while the quotient is at least 2^53 (kind
\* "shift"), since V8 writes zeros for the digits below a double's precision, or writes fraction
\* digits (kind "fraction"), one step at a time until done. RadixRun takes at most 2^k steps nested
\* k deep, and RadixFrom 2^k more after each 2^k, so the 1074 fraction digits of the least double
\* in radix 2 nest about 11 deep. carry adds one to the integer.
RadixStep(st) ==
  IF st.kind = "shift" THEN
    LET next == NumDivide(st.integer, NumIntNum(st.radix)) IN
    IF NumCompare(next, TwoPow53) >= 0 THEN [st EXCEPT !.integer = next, !.zeros = @ + 1]
    ELSE [st EXCEPT !.done = TRUE]
  ELSE
    LET scaled == NumMultiply(st.fraction, NumIntNum(st.radix))
        nextDelta == NumMultiply(st.delta, NumIntNum(st.radix))
        digit == NumToInt(MathTrunc(scaled))
        rest == NumSubtract(scaled, NumIntNum(digit))
        half == NumCompare(rest, NumDivide(NumIntNum(1), NumIntNum(2)))
        nextDigits == Append(st.digits, digit)
        rounded == RadixRoundUp(nextDigits, st.radix)
    IN CASE (half > 0 \/ (half = 0 /\ digit % 2 = 1))
              /\ NumCompare(NumAdd(rest, nextDelta), NumIntNum(1)) > 0 ->
              [st EXCEPT !.done = TRUE, !.digits = rounded[1], !.carry = rounded[2]]
         [] NumCompare(rest, nextDelta) >= 0 -> [st EXCEPT !.fraction = rest, !.delta = nextDelta, !.digits = nextDigits]
         [] OTHER -> [st EXCEPT !.done = TRUE, !.digits = nextDigits]

RECURSIVE RadixRun(_, _)
RadixRun(st, k) ==
  IF k = 0 THEN RadixStep(st) ELSE
  LET r == RadixRun(st, k - 1) IN IF r.done THEN r ELSE RadixRun(r, k - 1)

RECURSIVE RadixFrom(_, _)
RadixFrom(st, k) == LET r == RadixRun(st, k) IN IF r.done THEN r ELSE RadixFrom(r, k + 1)

RECURSIVE RadixIntegerFrom(_, _, _)
RadixIntegerFrom(integer, radix, digits) ==
  LET remainder == NumRemainder(integer, NumIntNum(radix))
      next == NumDivide(NumSubtract(integer, remainder), NumIntNum(radix))
      nextDigits == <<NumToInt(MathTrunc(remainder))>> \o digits
  IN IF NumCompare(next, PosZero) > 0 THEN RadixIntegerFrom(next, radix, nextDigits) ELSE nextDigits

RadixInteger(integer, radix) ==
  LET shifted == RadixFrom([kind |-> "shift", radix |-> radix, done |-> FALSE, integer |-> integer, zeros |-> 0], 0)
  IN RadixIntegerFrom(shifted.integer, radix, <<>>) \o [i \in 1..shifted.zeros |-> 0]

PositiveToRadix(x, radix) ==
  LET integer == MathFloor(x)
      fraction == NumSubtract(x, integer)
      halfGap == NumMultiply(NumSubtract(NumNextUp(x), x), NumDivide(NumIntNum(1), NumIntNum(2)))
      delta == IF NumIsZero(halfGap) THEN NumNextUp(PosZero) ELSE halfGap
      result == IF NumCompare(fraction, delta) >= 0
                THEN RadixFrom([kind |-> "fraction", radix |-> radix, done |-> FALSE, fraction |-> fraction,
                                delta |-> delta, digits |-> <<>>, carry |-> FALSE], 0)
                ELSE [digits |-> <<>>, carry |-> FALSE]
      whole == IF result.carry THEN NumAdd(integer, NumIntNum(1)) ELSE integer
  IN NumDigitChars(RadixInteger(whole, radix))
       \o (IF result.digits = <<>> THEN <<>> ELSE <<46>> \o NumDigitChars(result.digits))

NumToStringRadix(x, radix) ==
  CASE radix = 10 \/ x.k = "nan" \/ NumIsZero(x) -> NumToString(x)
    [] x.k = "inf" -> NumToString(x)
    [] x.k = "int" -> (IF x.neg THEN <<45>> ELSE <<>>) \o IntToRadix(NumIntAbs(x.i), radix)
    [] OTHER -> (IF x.neg THEN <<45>> ELSE <<>>) \o PositiveToRadix(NumAbs(x), radix)

(***************************************************************************)
(* Number.prototype.toFixed, toExponential, and toPrecision (§21.1.3),     *)
(* for a finite x, with exact decimal rounding: of two nearest results     *)
(* they pick the larger.                                                   *)
(***************************************************************************)

\* -1, 0, or 1 as |x| < 10^k, |x| = 10^k, or |x| > 10^k, for a finite nonzero x.
DecimalCompare(x, k) ==
  BNCompare(BNMul(BNShiftLeft(NumMag(x), NumIntMax(NumExponent(x), 0)), BNPow10(NumIntMax(-k, 0))),
            BNMul(BNPow2(NumIntMax(-NumExponent(x), 0)), BNPow10(NumIntMax(k, 0))))

\* The integer e with 10^e <= |x| < 10^(e + 1), from a guess, for a finite
\* nonzero x.
RECURSIVE DecimalExponentFrom(_, _)
DecimalExponentFrom(x, e) ==
  CASE DecimalCompare(x, e) < 0 -> DecimalExponentFrom(x, e - 1)
    [] DecimalCompare(x, e + 1) >= 0 -> DecimalExponentFrom(x, e + 1)
    [] OTHER -> e

\* The integer nearest |x| * 10^k, the larger of two, for a finite x.
DecimalRound(x, k) ==
  LET num == BNMul(BNShiftLeft(NumMag(x), NumIntMax(NumExponent(x), 0)), BNPow10(NumIntMax(k, 0)))
      den == BNMul(BNPow2(NumIntMax(-NumExponent(x), 0)), BNPow10(NumIntMax(-k, 0)))
  IN BNDivMod(BNAdd(BNShiftLeft(num, 1), den), BNShiftLeft(den, 1))[1]

\* <<n, e>> for a finite nonzero x with 10^f <= n < 10^(f + 1) and n * 10^(e - f)
\* nearest |x|, the larger of two.
ExponentialDigits(x, f) ==
  LET e == DecimalExponentFrom(x, (NumTop(x) * 78913) \div 262144)
      n == DecimalRound(x, f - e)
  IN IF BNCompare(n, BNPow10(f + 1)) >= 0 THEN <<DecimalRound(x, f - e - 1), e + 1>> ELSE <<n, e>>

DecimalChars(n) == IF n = <<>> THEN <<48>> ELSE NumDigitChars(BNDigits(n, 10))

\* The sign of x as code units: "-" when x < 0.
SignChars(x) == IF x.neg /\ ~NumIsZero(x) THEN <<45>> ELSE <<>>

\* Digits d1 d2 ... and an exponent e as "d1.d2...e+e".
FormatExponential(chars, e) ==
  <<chars[1]>> \o (IF Len(chars) = 1 THEN <<>> ELSE <<46>> \o Tail(chars))
    \o <<101, IF e >= 0 THEN 43 ELSE 45>> \o IntToRadix(NumIntAbs(e), 10)

\* x.toFixed(f) for f \in 0..100.
NumToFixed(x, f) ==
  LET n == DecimalChars(IF NumIsZero(x) THEN <<>> ELSE DecimalRound(x, f))
      m == ZeroChars(f + 1 - Len(n)) \o n
  IN IF ~NumIsZero(x) /\ DecimalCompare(x, 21) >= 0 THEN NumToString(x)
     ELSE SignChars(x) \o (IF f = 0 THEN n ELSE SubSeq(m, 1, Len(m) - f) \o <<46>> \o SubSeq(m, Len(m) - f + 1, Len(m)))

\* x.toExponential(f) for f \in 0..100.
NumToExponential(x, f) ==
  LET digits == ExponentialDigits(x, f)
  IN SignChars(x) \o
       IF NumIsZero(x) THEN FormatExponential(ZeroChars(f + 1), 0)
       ELSE FormatExponential(DecimalChars(digits[1]), digits[2])

\* x.toExponential() with the fewest digits that identify x.
NumToShortestExponential(x) ==
  LET digits == ShortestDigits(NumAbs(x))
  IN IF NumIsZero(x) THEN FormatExponential(<<48>>, 0)
     ELSE SignChars(x) \o FormatExponential(NumDigitChars(digits[1]), digits[2] - 1)

\* x.toPrecision(p) for p \in 1..100.
NumToPrecision(x, p) ==
  LET digits == ExponentialDigits(x, p - 1)
      m == IF NumIsZero(x) THEN ZeroChars(p) ELSE DecimalChars(digits[1])
      e == IF NumIsZero(x) THEN 0 ELSE digits[2]
  IN SignChars(x) \o
       CASE e < -6 \/ e >= p -> FormatExponential(m, e)
         [] e = p - 1 -> m
         [] e >= 0 -> SubSeq(m, 1, e + 1) \o <<46>> \o SubSeq(m, e + 2, p)
         [] OTHER -> <<48, 46>> \o ZeroChars(-(e + 1)) \o m

(***************************************************************************)
(* StringToNumber (§7.1.4.1.1).                                            *)
(***************************************************************************)

StrWhiteSpaceChars ==
  {9, 10, 11, 12, 13, 32, 160, 5760, 8232, 8233, 8239, 8287, 12288, 65279} \cup 8192..8202

RECURSIVE NumTrimStart(_, _)
NumTrimStart(string, i) ==
  IF i <= Len(string) /\ string[i] \in StrWhiteSpaceChars THEN NumTrimStart(string, i + 1) ELSE i

RECURSIVE NumTrimEnd(_, _)
NumTrimEnd(string, i) ==
  IF i >= 1 /\ string[i] \in StrWhiteSpaceChars THEN NumTrimEnd(string, i - 1) ELSE i

\* The value of a code unit as a digit, or 36 if it is not one.
NumDigitValue(c) ==
  CASE c >= 48 /\ c <= 57 -> c - 48
    [] c >= 97 /\ c <= 122 -> c - 87
    [] c >= 65 /\ c <= 90 -> c - 55
    [] OTHER -> 36

RECURSIVE DigitsEnd(_, _, _)
DigitsEnd(string, i, radix) ==
  IF i <= Len(string) /\ NumDigitValue(string[i]) < radix THEN DigitsEnd(string, i + 1, radix) ELSE i

\* The value of digits in radix, four at a time when radix is 10.
RECURSIVE DigitsValue(_, _, _, _)
DigitsValue(digits, i, radix, value) ==
  CASE i > Len(digits) -> value
    [] radix = 10 /\ i + 3 <= Len(digits) ->
         DigitsValue(digits, i + 4, radix,
           BNAdd(BNMulSmall(value, 10000),
                 BNFromInt(((NumDigitValue(digits[i]) * 10 + NumDigitValue(digits[i + 1])) * 10
                              + NumDigitValue(digits[i + 2])) * 10 + NumDigitValue(digits[i + 3]))))
    [] OTHER -> DigitsValue(digits, i + 1, radix,
                  BNAdd(BNMulSmall(value, radix), BNFromInt(NumDigitValue(digits[i]))))

\* The value of an exponent's digits, capped far beyond any finite double.
RECURSIVE ExponentValue(_, _, _)
ExponentValue(digits, i, value) ==
  IF i > Len(digits) THEN value
  ELSE ExponentValue(digits, i + 1,
         IF value > 100000000 THEN value ELSE value * 10 + NumDigitValue(digits[i]))

RECURSIVE LeadingZeros(_, _)
LeadingZeros(digits, i) ==
  IF i <= Len(digits) /\ digits[i] = 48 THEN LeadingZeros(digits, i + 1) ELSE i - 1

RECURSIVE TrailingZeroDigits(_, _)
TrailingZeroDigits(digits, i) ==
  IF i >= 1 /\ digits[i] = 48 THEN TrailingZeroDigits(digits, i - 1) ELSE Len(digits) - i

\* Digits past the first 800 cannot move the value across the midpoint of
\* two doubles, so they collapse into a final 1.
MaxDecimalDigits == 800

\* The Number nearest to (-1)^neg * digits * 10^exponent.
DecimalToNumber(neg, digits, exponent) ==
  LET leading == LeadingZeros(digits, 1)
      trailing == TrailingZeroDigits(digits, Len(digits))
      significant == SubSeq(digits, leading + 1, Len(digits) - trailing)
      isLong == Len(significant) > MaxDecimalDigits
      kept == IF isLong THEN Append(SubSeq(significant, 1, MaxDecimalDigits), 49) ELSE significant
      power == exponent + trailing + Len(significant) - Len(kept)
      value == DigitsValue(kept, 1, 10, <<>>)
  IN CASE significant = <<>> -> IF neg THEN NegZero ELSE PosZero
       [] power + Len(kept) > 310 -> MkNum("inf", neg, 0, <<>>, 0)
       [] power + Len(kept) < -324 -> IF neg THEN NegZero ELSE PosZero
       [] power >= 0 -> RoundDouble(neg, BNMul(value, BNPow10(power)), 0, FALSE)
       [] OTHER -> RoundRatio(neg, value, BNPow10(-power), 0)

\* StrDecimalLiteral, with an optional sign, Infinity, digits, a fraction,
\* and an exponent.
DecimalLiteralToNumber(string) ==
  LET isSigned == string[1] \in {43, 45}
      neg == string[1] = 45
      start == IF isSigned THEN 2 ELSE 1
      integerEnd == DigitsEnd(string, start, 10)
      hasDot == integerEnd <= Len(string) /\ string[integerEnd] = 46
      fractionStart == IF hasDot THEN integerEnd + 1 ELSE integerEnd
      fractionEnd == DigitsEnd(string, fractionStart, 10)
      hasExponent == fractionEnd <= Len(string) /\ string[fractionEnd] \in {69, 101}
      hasExponentSign == hasExponent /\ fractionEnd < Len(string)
                           /\ string[fractionEnd + 1] \in {43, 45}
      exponentStart == fractionEnd + (IF hasExponentSign THEN 2 ELSE 1)
      exponentEnd == IF hasExponent THEN DigitsEnd(string, exponentStart, 10) ELSE fractionEnd
      isExponentNegative == hasExponentSign /\ string[fractionEnd + 1] = 45
      exponent == ExponentValue(SubSeq(string, exponentStart, exponentEnd - 1), 1, 0)
      isValid == /\ integerEnd - start + fractionEnd - fractionStart > 0
                 /\ hasExponent => exponentEnd > exponentStart
                 /\ exponentEnd = Len(string) + 1
  IN CASE SubSeq(string, start, Len(string)) = StrInfinity -> MkNum("inf", neg, 0, <<>>, 0)
       [] ~isValid -> NaN
       [] OTHER ->
            DecimalToNumber(neg, SubSeq(string, start, integerEnd - 1)
                                   \o SubSeq(string, fractionStart, fractionEnd - 1),
              (IF isExponentNegative THEN -exponent ELSE exponent) - (fractionEnd - fractionStart))

RadixPrefixes == [c \in {66, 98, 79, 111, 88, 120} |->
                    IF c \in {66, 98} THEN 2 ELSE IF c \in {79, 111} THEN 8 ELSE 16]

StringToNumber(string) ==
  LET start == NumTrimStart(string, 1)
      trimmed == SubSeq(string, start, NumTrimEnd(string, Len(string)))
      radix == IF Len(trimmed) >= 2 /\ trimmed[1] = 48 /\ trimmed[2] \in DOMAIN RadixPrefixes
               THEN RadixPrefixes[trimmed[2]] ELSE 10
  IN CASE trimmed = <<>> -> PosZero
       [] radix = 10 -> DecimalLiteralToNumber(trimmed)
       [] Len(trimmed) > 2 /\ DigitsEnd(trimmed, 3, radix) = Len(trimmed) + 1 ->
            RoundDouble(FALSE, DigitsValue(SubSeq(trimmed, 3, Len(trimmed)), 1, radix, <<>>), 0, FALSE)
       [] OTHER -> NaN

\* The value of the longest prefix of string, after its leading white space,
\* that is a StrDecimalLiteral, or NaN (parseFloat, §19.2.4).
ParseFloatUnits(string) ==
  LET trimmed == SubSeq(string, NumTrimStart(string, 1), Len(string))
      start == IF trimmed # <<>> /\ trimmed[1] \in {43, 45} THEN 2 ELSE 1
      integerEnd == DigitsEnd(trimmed, start, 10)
      hasDot == integerEnd <= Len(trimmed) /\ trimmed[integerEnd] = 46
      fractionEnd == IF hasDot THEN DigitsEnd(trimmed, integerEnd + 1, 10) ELSE integerEnd
      exponentStart == IF fractionEnd < Len(trimmed) /\ trimmed[fractionEnd + 1] \in {43, 45}
                       THEN fractionEnd + 2 ELSE fractionEnd + 1
      exponentEnd == DigitsEnd(trimmed, exponentStart, 10)
      hasExponent == fractionEnd <= Len(trimmed) /\ trimmed[fractionEnd] \in {69, 101}
                       /\ exponentEnd > exponentStart
  IN CASE Len(trimmed) >= start + 7 /\ SubSeq(trimmed, start, start + 7) = StrInfinity ->
            MkNum("inf", trimmed[1] = 45, 0, <<>>, 0)
       [] fractionEnd - start - (IF hasDot THEN 1 ELSE 0) = 0 -> NaN
       [] OTHER -> DecimalLiteralToNumber(SubSeq(trimmed, 1, (IF hasExponent THEN exponentEnd ELSE fractionEnd) - 1))

\* parseInt (§19.2.5) of string with the integer radix, ToInt32 of its
\* argument: the value of the longest prefix of digits after white space,
\* a sign, and for radix 0 or 16 a "0x".
ParseIntUnits(string, radix) ==
  LET trimmed == SubSeq(string, NumTrimStart(string, 1), Len(string))
      unsigned == IF trimmed # <<>> /\ trimmed[1] \in {43, 45} THEN Tail(trimmed) ELSE trimmed
      isHex == radix \in {0, 16} /\ Len(unsigned) >= 2 /\ unsigned[1] = 48 /\ unsigned[2] \in {88, 120}
      digits == IF isHex THEN SubSeq(unsigned, 3, Len(unsigned)) ELSE unsigned
      r == CASE isHex -> 16 [] radix = 0 -> 10 [] OTHER -> radix
      end == DigitsEnd(digits, 1, r)
  IN CASE radix # 0 /\ (radix < 2 \/ radix > 36) -> NaN
       [] end = 1 -> NaN
       [] OTHER -> NumFromBigNat(trimmed[1] = 45, DigitsValue(SubSeq(digits, 1, end - 1), 1, r, <<>>), 0)

(***************************************************************************)
(* Short names the engine uses.                                            *)
(***************************************************************************)

NumSub(x, y) == NumSubtract(x, y)
NumMul(x, y) == NumMultiply(x, y)
NumDiv(x, y) == NumDivide(x, y)
NumRem(x, y) == NumRemainder(x, y)
NumExp(x, y) == NumExponentiate(x, y)
NumNeg(x) == NumUnaryMinus(x)
NumShl(x, y) == NumLeftShift(x, y)
NumShr(x, y) == NumSignedRightShift(x, y)
NumUShr(x, y) == NumUnsignedRightShift(x, y)
NumAnd(x, y) == NumBitwiseAND(x, y)
NumOr(x, y) == NumBitwiseOR(x, y)
NumXor(x, y) == NumBitwiseXOR(x, y)
NumBitNot(x) == NumBitwiseNOT(x)
StrToNum(string) == StringToNumber(string)
NumClampLength(x) == NumToLength(x)

\* The integer value of an integral Number with |x| < 2^30, which is "int"
\* or -0.
NumToSmallInt(x) == x.i

=============================================================================
