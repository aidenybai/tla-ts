------------------------------ MODULE ESBigNat ------------------------------
(***************************************************************************)
(* Arbitrary-precision natural numbers built from integers that fit TLC's  *)
(* 32-bit arithmetic.                                                      *)
(*                                                                         *)
(* A BigNat is a sequence of limbs in base 2^15, least significant limb    *)
(* first, with no trailing zero limb. Zero is <<>>. Every intermediate     *)
(* value stays below 2^31: a limb product is below 2^30.                   *)
(*                                                                         *)
(*   BNFromInt(n)        n \in 0..2^31-1 as a BigNat                       *)
(*   BNToInt(a)          a as an integer, for a < 2^31                     *)
(*   BNFits(a)           a < 2^31, so BNToInt(a) is defined                *)
(*   BNIsZero(a)         a = 0                                             *)
(*   BNIsOdd(a)          a is odd                                          *)
(*   BNCompare(a, b)     -1, 0, or 1 as a < b, a = b, or a > b             *)
(*   BNAdd(a, b)         a + b                                             *)
(*   BNSub(a, b)         a - b, for a >= b                                 *)
(*   BNMulSmall(a, d)    a * d, for d \in 0..2^15                          *)
(*   BNMul(a, b)         a * b                                             *)
(*   BNDivModSmall(a, d) <<a \div d, a % d>>, for d \in 1..2^15            *)
(*   BNDivMod(a, b)      <<a \div b, a % b>>, for b # 0                    *)
(*   BNShiftLeft(a, k)   a * 2^k                                           *)
(*   BNShiftRight(a, k)  a \div 2^k                                        *)
(*   BNLowBits(a, k)     a % 2^k                                           *)
(*   BNTestBit(a, k)     whether bit k (counting from 0) of a is set       *)
(*   BNTrailingZeros(a)  the largest k with 2^k dividing a, for a # 0      *)
(*   BNBitLength(a)      the number of bits of a; 0 for 0                  *)
(*   BNPow2(k)           2^k                                               *)
(*   BNPow10(k)          10^k                                              *)
(*   BNPow(a, k)         a^k                                               *)
(*   BNSqrt(a)           the integer square root of a                      *)
(*   BNCbrt(a)           the integer cube root of a                        *)
(*   BNDigits(a, radix)  the digits of a in radix, most significant first, *)
(*                       with <<>> for 0, for radix \in 2..2^15            *)
(***************************************************************************)
EXTENDS Integers, Sequences

BNBase == 32768

BNLimb(a, i) == IF i >= 1 /\ i <= Len(a) THEN a[i] ELSE 0

RECURSIVE BNTopIndex(_, _)
BNTopIndex(a, i) == IF i > 0 /\ a[i] = 0 THEN BNTopIndex(a, i - 1) ELSE i

BNNorm(a) == SubSeq(a, 1, BNTopIndex(a, Len(a)))

BNFromInt(n) ==
  IF n = 0 THEN <<>>
  ELSE IF n < BNBase THEN <<n>>
  ELSE IF n < BNBase * BNBase THEN <<n % BNBase, n \div BNBase>>
  ELSE <<n % BNBase, (n \div BNBase) % BNBase, n \div (BNBase * BNBase)>>

BNFits(a) == Len(a) < 3 \/ (Len(a) = 3 /\ a[3] = 1)

BNToInt(a) ==
  CASE Len(a) = 0 -> 0
    [] Len(a) = 1 -> a[1]
    [] Len(a) = 2 -> a[1] + a[2] * BNBase
    [] Len(a) = 3 -> a[1] + a[2] * BNBase + a[3] * (BNBase * BNBase)

BNIsZero(a) == a = <<>>

BNIsOdd(a) == a # <<>> /\ a[1] % 2 = 1

RECURSIVE BNCompareFrom(_, _, _)
BNCompareFrom(a, b, i) ==
  CASE i = 0 -> 0
    [] a[i] < b[i] -> -1
    [] a[i] > b[i] -> 1
    [] OTHER -> BNCompareFrom(a, b, i - 1)

BNCompare(a, b) ==
  CASE Len(a) < Len(b) -> -1
    [] Len(a) > Len(b) -> 1
    [] OTHER -> BNCompareFrom(a, b, Len(a))

RECURSIVE BNAddFrom(_, _, _, _)
BNAddFrom(a, b, i, carry) ==
  IF i > Len(a) /\ i > Len(b)
  THEN IF carry = 0 THEN <<>> ELSE <<carry>>
  ELSE LET sum == BNLimb(a, i) + BNLimb(b, i) + carry
       IN <<sum % BNBase>> \o BNAddFrom(a, b, i + 1, sum \div BNBase)

BNAdd(a, b) ==
  IF a = <<>> THEN b ELSE IF b = <<>> THEN a ELSE BNAddFrom(a, b, 1, 0)

RECURSIVE BNSubFrom(_, _, _, _)
BNSubFrom(a, b, i, borrow) ==
  IF i > Len(a) THEN <<>>
  ELSE LET difference == a[i] - BNLimb(b, i) - borrow
       IN IF difference < 0
          THEN <<difference + BNBase>> \o BNSubFrom(a, b, i + 1, 1)
          ELSE <<difference>> \o BNSubFrom(a, b, i + 1, 0)

BNSub(a, b) == IF b = <<>> THEN a ELSE BNNorm(BNSubFrom(a, b, 1, 0))

RECURSIVE BNMulSmallFrom(_, _, _, _)
BNMulSmallFrom(a, d, i, carry) ==
  IF i > Len(a)
  THEN IF carry = 0 THEN <<>> ELSE <<carry>>
  ELSE LET product == a[i] * d + carry
       IN <<product % BNBase>> \o BNMulSmallFrom(a, d, i + 1, product \div BNBase)

BNMulSmall(a, d) == IF d = 0 \/ a = <<>> THEN <<>> ELSE BNMulSmallFrom(a, d, 1, 0)

BNZeroLimbs(count) == [i \in 1..count |-> 0]

\* <<low, high>>: the sums of the low and high limbs of the products
\* a[i] * b[k + 1 - i] from i to last, each below 2^31 for fewer than 2^16
\* products.
RECURSIVE BNColumn(_, _, _, _, _, _, _)
BNColumn(a, b, k, i, last, low, high) ==
  IF i > last THEN <<low, high>>
  ELSE LET product == a[i] * b[k + 1 - i]
       IN BNColumn(a, b, k, i + 1, last, low + (product % BNBase), high + product \div BNBase)

RECURSIVE BNCarryFrom(_, _, _)
BNCarryFrom(columns, i, carry) ==
  IF i > Len(columns) THEN IF carry = 0 THEN <<>> ELSE BNFromInt(carry)
  ELSE LET value == columns[i] + carry
       IN <<value % BNBase>> \o BNCarryFrom(columns, i + 1, value \div BNBase)

BNMul(a, b) ==
  CASE a = <<>> \/ b = <<>> -> <<>>
    [] Len(b) = 1 -> BNMulSmall(a, b[1])
    [] Len(a) = 1 -> BNMulSmall(b, a[1])
    [] OTHER ->
       LET sums == [k \in 1..Len(a) + Len(b) - 1 |->
                     BNColumn(a, b, k, IF k > Len(b) THEN k - Len(b) + 1 ELSE 1,
                              IF k < Len(a) THEN k ELSE Len(a), 0, 0)]
       IN BNNorm(BNCarryFrom([k \in 1..Len(a) + Len(b) |->
                                (IF k <= Len(sums) THEN sums[k][1] ELSE 0)
                                  + (IF k > 1 THEN sums[k - 1][2] ELSE 0)], 1, 0))

BNShiftLeft(a, k) ==
  IF a = <<>> THEN a
  ELSE LET factor == 2 ^ (k % 15)
           shifted == [i \in 1..Len(a) + 1 |->
                        ((BNLimb(a, i) * factor) % BNBase)
                          + (BNLimb(a, i - 1) * factor) \div BNBase]
       IN BNZeroLimbs(k \div 15) \o BNNorm(shifted)

BNShiftRight(a, k) ==
  LET kept == Len(a) - k \div 15
      bits == k % 15
      high == 2 ^ (15 - bits)
      low == 2 ^ bits
  IN IF kept <= 0 THEN <<>>
     ELSE BNNorm([i \in 1..kept |->
                   (a[i + k \div 15] \div low)
                     + (BNLimb(a, i + 1 + k \div 15) % low) * high])

BNLowBits(a, k) ==
  LET whole == k \div 15
  IN IF Len(a) <= whole THEN a
     ELSE BNNorm([i \in 1..whole + 1 |->
                   IF i <= whole THEN a[i] ELSE a[i] % 2 ^ (k % 15)])

BNTestBit(a, k) == (BNLimb(a, k \div 15 + 1) \div 2 ^ (k % 15)) % 2 = 1

RECURSIVE BNIntBitLength(_)
BNIntBitLength(n) == IF n = 0 THEN 0 ELSE 1 + BNIntBitLength(n \div 2)

BNBitLength(a) == IF a = <<>> THEN 0 ELSE (Len(a) - 1) * 15 + BNIntBitLength(a[Len(a)])

RECURSIVE BNIntTrailingZeros(_)
BNIntTrailingZeros(n) == IF n % 2 = 1 THEN 0 ELSE 1 + BNIntTrailingZeros(n \div 2)

RECURSIVE BNTrailingZerosFrom(_, _)
BNTrailingZerosFrom(a, i) ==
  IF a[i] = 0 THEN 15 + BNTrailingZerosFrom(a, i + 1) ELSE BNIntTrailingZeros(a[i])

BNTrailingZeros(a) == BNTrailingZerosFrom(a, 1)

BNPow2(k) == BNZeroLimbs(k \div 15) \o <<2 ^ (k % 15)>>

RECURSIVE BNPow(_, _)
BNPow(a, k) ==
  IF k = 0 THEN <<1>>
  ELSE LET half == BNPow(a, k \div 2)
           square == BNMul(half, half)
       IN IF k % 2 = 1 THEN BNMul(square, a) ELSE square

RECURSIVE BNPow10(_)
BNPow10(k) ==
  IF k < 4 THEN BNFromInt(10 ^ k) ELSE BNMulSmall(BNPow10(k - 4), 10000)

RECURSIVE BNDivModSmallFrom(_, _, _, _)
BNDivModSmallFrom(a, d, i, quotient) ==
  IF i = 0 THEN quotient
  ELSE LET current == quotient[2] * BNBase + a[i]
       IN BNDivModSmallFrom(a, d, i - 1,
            <<<<current \div d>> \o quotient[1], current % d>>)

BNDivModSmall(a, d) ==
  LET result == BNDivModSmallFrom(a, d, Len(a), <<<<>>, 0>>)
  IN <<BNNorm(result[1]), result[2]>>

\* Knuth's algorithm D: the divisor is normalized so its top limb is at
\* least BNBase \div 2, which makes each estimated quotient limb at most
\* two too large.
RECURSIVE BNCorrectQuotient(_, _, _, _)
BNCorrectQuotient(remainder, divisor, estimate, product) ==
  IF BNCompare(product, remainder) > 0
  THEN BNCorrectQuotient(remainder, divisor, estimate - 1, BNSub(product, divisor))
  ELSE <<estimate, BNSub(remainder, product)>>

RECURSIVE BNDivModFrom(_, _, _, _)
BNDivModFrom(remainder, divisor, j, quotient) ==
  IF j < 0 THEN <<quotient, remainder>>
  ELSE LET n == Len(divisor)
           top == BNLimb(remainder, n + j + 1) * BNBase + BNLimb(remainder, n + j)
           estimate == top \div divisor[n]
           capped == IF estimate >= BNBase THEN BNBase - 1 ELSE estimate
           shifted == BNZeroLimbs(j) \o divisor
           product == BNMulSmall(divisor, capped)
           step == BNCorrectQuotient(remainder, shifted, capped,
                     IF product = <<>> THEN product ELSE BNZeroLimbs(j) \o product)
       IN BNDivModFrom(step[2], divisor, j - 1, <<step[1]>> \o quotient)

BNDivMod(a, b) ==
  CASE BNCompare(a, b) < 0 -> <<<<>>, a>>
    [] Len(b) = 1 ->
         LET result == BNDivModSmall(a, b[1]) IN <<result[1], BNFromInt(result[2])>>
    [] OTHER ->
         LET shift == 15 - BNIntBitLength(b[Len(b)])
             dividend == BNShiftLeft(a, shift)
             divisor == BNShiftLeft(b, shift)
             result == BNDivModFrom(dividend, divisor, Len(dividend) - Len(divisor), <<>>)
         IN <<BNNorm(result[1]), BNShiftRight(result[2], shift)>>

\* Newton's iteration from an overestimate decreases until it reaches the
\* integer square root.
RECURSIVE BNSqrtFrom(_, _)
BNSqrtFrom(a, guess) ==
  LET next == BNShiftRight(BNAdd(guess, BNDivMod(a, guess)[1]), 1)
  IN IF BNCompare(next, guess) >= 0 THEN guess ELSE BNSqrtFrom(a, next)

BNSqrt(a) ==
  IF a = <<>> THEN a ELSE BNSqrtFrom(a, BNPow2((BNBitLength(a) + 1) \div 2))

RECURSIVE BNCbrtFrom(_, _)
BNCbrtFrom(a, guess) ==
  LET next == BNDivModSmall(BNAdd(BNShiftLeft(guess, 1), BNDivMod(a, BNMul(guess, guess))[1]), 3)[1]
  IN IF BNCompare(next, guess) >= 0 THEN guess ELSE BNCbrtFrom(a, next)

BNCbrt(a) ==
  IF a = <<>> THEN a ELSE BNCbrtFrom(a, BNPow2((BNBitLength(a) + 2) \div 3))

RECURSIVE BNDigits(_, _)
BNDigits(a, radix) ==
  IF a = <<>> THEN <<>>
  ELSE LET division == BNDivModSmall(a, radix) IN Append(BNDigits(division[1], radix), division[2])

=============================================================================
