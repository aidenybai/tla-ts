\* BigInts (§6.1.6.2) as [neg, mag] with mag a BigNat. Zero is never negative, so = is
\* equality.
BigIntOf(neg, mag) == [neg |-> neg /\ mag # <<>>, mag |-> mag]
BigIntFromInt(n) == BigIntOf(n < 0, BNFromInt(IF n < 0 THEN -n ELSE n))
BigIntZero == BigIntOf(FALSE, <<>>)
BigIntIsZero(a) == a.mag = <<>>
BigIntEqual(a, b) == a = b
BigIntNeg(a) == BigIntOf(~a.neg, a.mag)

BigIntAdd(a, b) ==
  IF a.neg = b.neg THEN BigIntOf(a.neg, BNAdd(a.mag, b.mag))
  ELSE IF BNCompare(a.mag, b.mag) >= 0 THEN BigIntOf(a.neg, BNSub(a.mag, b.mag))
  ELSE BigIntOf(b.neg, BNSub(b.mag, a.mag))
BigIntSub(a, b) == BigIntAdd(a, BigIntNeg(b))
BigIntMul(a, b) == BigIntOf(a.neg # b.neg, BNMul(a.mag, b.mag))
BigIntDiv(a, b) == BigIntOf(a.neg # b.neg, BNDivMod(a.mag, b.mag)[1])
BigIntRem(a, b) == BigIntOf(a.neg, BNDivMod(a.mag, b.mag)[2])
BigIntLess(a, b) ==
  IF a.neg # b.neg THEN a.neg
  ELSE IF a.neg THEN BNCompare(b.mag, a.mag) < 0
  ELSE BNCompare(a.mag, b.mag) < 0
BigIntBitNot(a) == BigIntSub(BigIntNeg(a), BigIntFromInt(1))

\* a · 2^k for an integer k, rounding toward negative infinity.
BigIntShift(a, k) ==
  IF k >= 0 THEN BigIntOf(a.neg, BNShiftLeft(a.mag, k))
  ELSE IF ~a.neg THEN BigIntOf(FALSE, BNShiftRight(a.mag, -k))
  ELSE BigIntOf(TRUE, BNAdd(BNShiftRight(BNSub(a.mag, <<1>>), -k), <<1>>))

\* Bitwise operators on two's complement (§6.1.6.2.17 to §6.1.6.2.19), limb by limb.
SmallBitwise(op, x, y, bit) ==
  IF bit = 32768 THEN 0
  ELSE LET bx == (x \div bit) % 2
           by == (y \div bit) % 2
           b == CASE op = "&" -> bx * by
                  [] op = "|" -> IF bx + by > 0 THEN 1 ELSE 0
                  [] op = "^" -> (bx + by) % 2
       IN b * bit + SmallBitwise(op, x, y, bit * 2)
TwosComplement(a, width) == IF a.neg THEN BNSub(BNPow2(width), a.mag) ELSE a.mag
BigIntBitwise(a, op, b) ==
  LET width == 15 * (IntegerMax(BNBitLength(a.mag), BNBitLength(b.mag)) \div 15 + 1)
      limbs == width \div 15
      x == TwosComplement(a, width)
      y == TwosComplement(b, width)
      r == BNNorm([i \in 1..limbs |-> SmallBitwise(op, BNLimb(x, i), BNLimb(y, i), 1)])
  IN IF BNTestBit(r, width - 1) THEN BigIntOf(TRUE, BNSub(BNPow2(width), r)) ELSE BigIntOf(FALSE, r)
IntegerMax(x, y) == IF x > y THEN x ELSE y

\* The BigInt operators of ApplyStringOrNumericBinaryOperator, with their RangeErrors.
BigIntOperationResult(s, a, op, b) ==
  CASE op \in {"/", "%"} /\ BigIntIsZero(b) -> ThrowError(s, "RangeError")
    [] op = "**" /\ b.neg -> ThrowError(s, "RangeError")
    [] op = "**" ->
         IF BigIntIsZero(b) THEN Ok(s, BigInt(BigIntFromInt(1)))
         ELSE IF a.mag \in {<<>>, <<1>>} THEN Ok(s, BigInt(BigIntOf(a.neg /\ BNIsOdd(b.mag), a.mag)))
         ELSE IF ~BNFits(b.mag) \/ BNToInt(b.mag) > 1000000 THEN ThrowError(s, "RangeError")
         ELSE Ok(s, BigInt(BigIntOf(a.neg /\ BNIsOdd(b.mag), BNPow(a.mag, BNToInt(b.mag)))))
    [] op = ">>>" -> ThrowTypeError(s)
    [] op \in {"<<", ">>"} ->
         IF ~BNFits(b.mag) THEN
           IF (op = "<<") = ~b.neg THEN ThrowError(s, "RangeError")
           ELSE Ok(s, BigInt(IF a.neg THEN BigIntFromInt(-1) ELSE BigIntZero))
         ELSE LET k == IF b.neg THEN -BNToInt(b.mag) ELSE BNToInt(b.mag) IN
              Ok(s, BigInt(BigIntShift(a, IF op = "<<" THEN k ELSE -k)))
    [] OTHER ->
         Ok(s, BigInt(CASE op = "*" -> BigIntMul(a, b)
                        [] op = "/" -> BigIntDiv(a, b)
                        [] op = "%" -> BigIntRem(a, b)
                        [] op = "+" -> BigIntAdd(a, b)
                        [] op = "-" -> BigIntSub(a, b)
                        [] op \in {"&", "|", "^"} -> BigIntBitwise(a, op, b)))

\* BigInt::toString (§6.1.6.2.23) in a radix from 2 to 36.
BigIntToString(a, radix) ==
  IF BigIntIsZero(a) THEN <<48>>
  ELSE (IF a.neg THEN <<45>> ELSE <<>>) \o BigNatDigits(a.mag, radix, <<>>)
BigNatDigits(m, radix, acc) ==
  IF m = <<>> THEN acc
  ELSE LET qr == BNDivModSmall(m, radix)
           d == qr[2]
       IN BigNatDigits(qr[1], radix, <<IF d < 10 THEN 48 + d ELSE 87 + d>> \o acc)

\* StringToBigInt (§7.1.14): a BigInt value, or Undefined when the string isn't an integer.
StringToBigInt(units) ==
  LET trimmed == TrimWhiteSpace(units) IN
  IF trimmed = <<>> THEN BigInt(BigIntZero)
  ELSE IF Len(trimmed) > 2 /\ trimmed[1] = 48 /\ trimmed[2] \in {66, 98, 79, 111, 88, 120}
  THEN LET radix == CASE trimmed[2] \in {66, 98} -> 2 [] trimmed[2] \in {79, 111} -> 8 [] OTHER -> 16
           m == DigitsToBigNat(SubSeq(trimmed, 3, Len(trimmed)), radix, <<>>)
       IN IF m = Empty THEN Undefined ELSE BigInt(BigIntOf(FALSE, m))
  ELSE LET neg == trimmed[1] = 45
           digits == IF trimmed[1] \in {43, 45} THEN Tail(trimmed) ELSE trimmed
           m == IF digits = <<>> THEN Empty ELSE DigitsToBigNat(digits, 10, <<>>)
       IN IF m = Empty THEN Undefined ELSE BigInt(BigIntOf(neg, m))
DigitsToBigNat(digits, radix, acc) ==
  IF digits = <<>> THEN acc
  ELSE LET c == Head(digits)
           d == CASE c >= 48 /\ c <= 57 -> c - 48
                  [] c >= 97 /\ c <= 122 -> c - 87
                  [] c >= 65 /\ c <= 90 -> c - 55
                  [] OTHER -> 99
       IN IF d >= radix THEN Empty
          ELSE DigitsToBigNat(Tail(digits), radix, BNAdd(BNMulSmall(acc, radix), BNFromInt(d)))

\* Trims StrWhiteSpaceChar from both ends.
TrimWhiteSpace(units) ==
  LET start == NumTrimStart(units, 1)
      end == NumTrimEnd(units, Len(units))
  IN IF start > end THEN <<>> ELSE SubSeq(units, start, end)

\* The BigInt an integral finite Number denotes.
IntegralNumberToBigInt(x) ==
  CASE x.k = "int" -> BigIntFromInt(x.i)
    [] x.k = "nzero" -> BigIntZero
    [] OTHER -> BigIntOf(x.neg, BNShiftLeft(x.m, x.e))

BigIntEqualsNumber(a, x) ==
  NumIsFinite(x) /\ NumIsIntegral(x) /\ IntegralNumberToBigInt(x) = a

\* a < x and x < a for a BigInt a and a Number x: True, False, or Undefined.
BigIntLessNumber(a, x) ==
  CASE x.k = "nan" -> Undefined
    [] x.k = "inf" -> Bool(~x.neg)
    [] OTHER -> Bool(BigIntLess(a, IntegralNumberToBigInt(MathCeil(x))))
NumberLessBigInt(x, a) ==
  CASE x.k = "nan" -> Undefined
    [] x.k = "inf" -> Bool(x.neg)
    [] OTHER -> Bool(BigIntLess(IntegralNumberToBigInt(MathFloor(x)), a))

\* Adapters over ESNumber for the evaluator.
NumLess(x, y) == ~NumIsNaN(x) /\ ~NumIsNaN(y) /\ NumLessThan(x, y)
NumLessResult(x, y) == IF NumIsNaN(x) \/ NumIsNaN(y) THEN Undefined ELSE Bool(NumLessThan(x, y))
