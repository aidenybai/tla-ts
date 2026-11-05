\* Number (§21.1), Math (§21.3), and the global functions on numbers and URIs (§19.2).
MathNumberIntrinsics ==
  << IntrinsicObject("NumberPrototype", "ObjectPrototype", "number", [data |-> IntV(0)]),
     IntrinsicFunction("Number", "FunctionPrototype", <<"Number", "constructor">>, 1, N("Number"), TRUE),
     IntrinsicFunction("parseInt", "FunctionPrototype", <<"NumberGlobal", "parseInt">>, 2, N("parseInt"), FALSE),
     IntrinsicFunction("parseFloat", "FunctionPrototype", <<"NumberGlobal", "parseFloat">>, 1, N("parseFloat"), FALSE),
     IntrinsicObject("Math", "ObjectPrototype", "ordinary", [randomState |-> RandomSeedState]) >>

MathNumberProperties ==
  Ctor("Number", "NumberPrototype") \o
  << GlobalLink("Number", N("Number")), GlobalLink("Math", N("Math")),
     GlobalLink("parseInt", N("parseInt")), GlobalLink("parseFloat", N("parseFloat")),
     \* The value properties of the global object (§19.1).
     V("GlobalObject", SV("NaN"), Num(NaN), FALSE, FALSE, FALSE),
     V("GlobalObject", SV("Infinity"), Num(PosInf), FALSE, FALSE, FALSE),
     V("GlobalObject", SV("undefined"), Undefined, FALSE, FALSE, FALSE),
     M("GlobalObject", SV("isNaN"), "NumberGlobal", "isNaN", 1),
     M("GlobalObject", SV("isFinite"), "NumberGlobal", "isFinite", 1),
     M("GlobalObject", SV("decodeURI"), "URI", "decodeURI", 1),
     M("GlobalObject", SV("decodeURIComponent"), "URI", "decodeURIComponent", 1),
     M("GlobalObject", SV("encodeURI"), "URI", "encodeURI", 1),
     M("GlobalObject", SV("encodeURIComponent"), "URI", "encodeURIComponent", 1),
     M("GlobalObject", SV("escape"), "URI", "escape", 1),
     M("GlobalObject", SV("unescape"), "URI", "unescape", 1),
     \* Number (§21.1.2, §21.1.3).
     V("Number", SV("EPSILON"), Num(MkNum("fin", FALSE, 0, <<1>>, -52)), FALSE, FALSE, FALSE),
     V("Number", SV("MAX_SAFE_INTEGER"), Num(MaxSafeInteger), FALSE, FALSE, FALSE),
     V("Number", SV("MAX_VALUE"), Num(MkNum("fin", FALSE, 0, BNSub(BNPow2(53), <<1>>), 971)), FALSE, FALSE, FALSE),
     V("Number", SV("MIN_SAFE_INTEGER"), Num(NumNeg(MaxSafeInteger)), FALSE, FALSE, FALSE),
     V("Number", SV("MIN_VALUE"), Num(MkNum("fin", FALSE, 0, <<1>>, -1074)), FALSE, FALSE, FALSE),
     V("Number", SV("NaN"), Num(NaN), FALSE, FALSE, FALSE),
     V("Number", SV("NEGATIVE_INFINITY"), Num(NegInf), FALSE, FALSE, FALSE),
     V("Number", SV("POSITIVE_INFINITY"), Num(PosInf), FALSE, FALSE, FALSE),
     M("Number", SV("isFinite"), "Number", "isFinite", 1),
     M("Number", SV("isInteger"), "Number", "isInteger", 1),
     M("Number", SV("isNaN"), "Number", "isNaN", 1),
     M("Number", SV("isSafeInteger"), "Number", "isSafeInteger", 1),
     L("Number", SV("parseFloat"), "parseFloat", TRUE, FALSE, TRUE),
     L("Number", SV("parseInt"), "parseInt", TRUE, FALSE, TRUE),
     M("NumberPrototype", SV("toExponential"), "Number", "toExponential", 1),
     M("NumberPrototype", SV("toFixed"), "Number", "toFixed", 1),
     M("NumberPrototype", SV("toLocaleString"), "Number", "toLocaleString", 0),
     M("NumberPrototype", SV("toPrecision"), "Number", "toPrecision", 1),
     M("NumberPrototype", SV("toString"), "Number", "toString", 1),
     M("NumberPrototype", SV("valueOf"), "Number", "valueOf", 0),
     \* Math (§21.3.1, §21.3.2).
     V("Math", SV("E"), Num(StrToNum(N("2.718281828459045"))), FALSE, FALSE, FALSE),
     V("Math", SV("LN10"), Num(StrToNum(N("2.302585092994046"))), FALSE, FALSE, FALSE),
     V("Math", SV("LN2"), Num(StrToNum(N("0.6931471805599453"))), FALSE, FALSE, FALSE),
     V("Math", SV("LOG10E"), Num(StrToNum(N("0.4342944819032518"))), FALSE, FALSE, FALSE),
     V("Math", SV("LOG2E"), Num(StrToNum(N("1.4426950408889634"))), FALSE, FALSE, FALSE),
     V("Math", SV("PI"), Num(StrToNum(N("3.141592653589793"))), FALSE, FALSE, FALSE),
     V("Math", SV("SQRT1_2"), Num(StrToNum(N("0.7071067811865476"))), FALSE, FALSE, FALSE),
     V("Math", SV("SQRT2"), Num(StrToNum(N("1.4142135623730951"))), FALSE, FALSE, FALSE),
     V("Math", SymToStringTag, SV("Math"), FALSE, FALSE, TRUE),
     M("Math", SV("abs"), "Math", "abs", 1),
     M("Math", SV("acos"), "Math", "acos", 1),
     M("Math", SV("acosh"), "Math", "acosh", 1),
     M("Math", SV("asin"), "Math", "asin", 1),
     M("Math", SV("asinh"), "Math", "asinh", 1),
     M("Math", SV("atan"), "Math", "atan", 1),
     M("Math", SV("atan2"), "Math", "atan2", 2),
     M("Math", SV("atanh"), "Math", "atanh", 1),
     M("Math", SV("cbrt"), "Math", "cbrt", 1),
     M("Math", SV("ceil"), "Math", "ceil", 1),
     M("Math", SV("clz32"), "Math", "clz32", 1),
     M("Math", SV("cos"), "Math", "cos", 1),
     M("Math", SV("cosh"), "Math", "cosh", 1),
     M("Math", SV("exp"), "Math", "exp", 1),
     M("Math", SV("expm1"), "Math", "expm1", 1),
     M("Math", SV("f16round"), "Math", "f16round", 1),
     M("Math", SV("floor"), "Math", "floor", 1),
     M("Math", SV("fround"), "Math", "fround", 1),
     M("Math", SV("hypot"), "Math", "hypot", 2),
     M("Math", SV("imul"), "Math", "imul", 2),
     M("Math", SV("log"), "Math", "log", 1),
     M("Math", SV("log10"), "Math", "log10", 1),
     M("Math", SV("log1p"), "Math", "log1p", 1),
     M("Math", SV("log2"), "Math", "log2", 1),
     M("Math", SV("max"), "Math", "max", 2),
     M("Math", SV("min"), "Math", "min", 2),
     M("Math", SV("pow"), "Math", "pow", 2),
     M("Math", SV("random"), "Math", "random", 0),
     M("Math", SV("round"), "Math", "round", 1),
     M("Math", SV("sign"), "Math", "sign", 1),
     M("Math", SV("sin"), "Math", "sin", 1),
     M("Math", SV("sinh"), "Math", "sinh", 1),
     M("Math", SV("sqrt"), "Math", "sqrt", 1),
     M("Math", SV("sumPrecise"), "Math", "sumPrecise", 1),
     M("Math", SV("tan"), "Math", "tan", 1),
     M("Math", SV("tanh"), "Math", "tanh", 1),
     M("Math", SV("trunc"), "Math", "trunc", 1) >>

\* Number (§21.1).
ThisNumberValue(s, v) ==
  IF IsNumber(v) THEN Ok(s, v)
  ELSE IF IsObject(v) /\ O(s, v).class = "number" THEN Ok(s, O(s, v).slots.data)
  ELSE ThrowTypeError(s)

BigIntToNumber(b) == NumFromBigNat(b.neg, b.mag, 0)

\* Whether an integral Number n lies in low..high.
IsInRange(n, low, high) == ~NumLess(n, NumFromInt(low)) /\ ~NumLess(NumFromInt(high), n)

NumberBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1) IN
  CASE m = "constructor" ->
         \* §21.1.1.1
         LET n == IF args = <<>> THEN Ok(s, IntV(0))
                  ELSE LET p == ToNumeric(s, a1) IN
                       IF IsAbrupt(p) THEN p ELSE IF IsBigInt(Val(p)) THEN Ok(p.s, Num(BigIntToNumber(Val(p).value))) ELSE p
         IN IF IsAbrupt(n) \/ nt = Undefined THEN n
            ELSE OrdinaryCreateFromConstructor(n.s, nt, "NumberPrototype", "number", [data |-> Val(n)])
    \* §21.1.2.2 to §21.1.2.5
    [] m = "isFinite" -> Ok(s, Bool(IsNumber(a1) /\ NumIsFinite(a1.value)))
    [] m = "isInteger" -> Ok(s, Bool(IsNumber(a1) /\ NumIsFinite(a1.value) /\ NumIsIntegral(a1.value)))
    [] m = "isNaN" -> Ok(s, Bool(IsNumber(a1) /\ NumIsNaN(a1.value)))
    [] m = "isSafeInteger" ->
         Ok(s, Bool(IsNumber(a1) /\ NumIsFinite(a1.value) /\ NumIsIntegral(a1.value) /\
                    ~NumLess(MaxSafeInteger, NumAbs(a1.value))))
    \* §21.1.3.7
    [] m = "valueOf" -> ThisNumberValue(s, this)
    [] OTHER ->
         LET x == ThisNumberValue(s, this) IN IF IsAbrupt(x) THEN x
         ELSE NumberPrototypeMethod(x.s, Val(x).value, m, IF m = "toLocaleString" THEN <<>> ELSE args)

\* The Number.prototype methods that format the Number x.
NumberPrototypeMethod(s, x, m, args) ==
  LET a1 == Arg(args, 1)
      digits == ToIntegerOrInfinity(s, a1)
      count == NumToSmallInt(Val(digits).value)
  IN
  CASE m = "toExponential" ->
         \* §21.1.3.2
         IF IsAbrupt(digits) THEN digits
         ELSE IF ~NumIsFinite(x) THEN Ok(digits.s, Str(NumToString(x)))
         ELSE IF ~IsInRange(Val(digits).value, 0, 100) THEN ThrowError(digits.s, "RangeError")
         ELSE Ok(digits.s, Str(IF a1 = Undefined THEN NumToShortestExponential(x) ELSE NumToExponential(x, count)))
    [] m = "toFixed" ->
         \* §21.1.3.3
         IF IsAbrupt(digits) THEN digits
         ELSE IF ~IsInRange(Val(digits).value, 0, 100) THEN ThrowError(digits.s, "RangeError")
         ELSE Ok(digits.s, Str(IF NumIsFinite(x) THEN NumToFixed(x, count) ELSE NumToString(x)))
    [] m = "toPrecision" ->
         \* §21.1.3.5
         IF a1 = Undefined THEN Ok(s, Str(NumToString(x)))
         ELSE IF IsAbrupt(digits) THEN digits
         ELSE IF ~NumIsFinite(x) THEN Ok(digits.s, Str(NumToString(x)))
         ELSE IF ~IsInRange(Val(digits).value, 1, 100) THEN ThrowError(digits.s, "RangeError")
         ELSE Ok(digits.s, Str(NumToPrecision(x, count)))
    [] m \in {"toString", "toLocaleString"} ->
         \* §21.1.3.6, §21.1.3.4
         LET r == IF a1 = Undefined THEN Ok(s, IntV(10)) ELSE digits IN
         IF IsAbrupt(r) THEN r
         ELSE IF ~IsInRange(Val(r).value, 2, 36) THEN ThrowError(r.s, "RangeError")
         ELSE Ok(r.s, Str(NumToStringRadix(x, NumToSmallInt(Val(r).value))))

\* The global functions isNaN, isFinite, parseInt, and parseFloat (§19.2).
NumberGlobalBuiltin(s, f, m, this, args, nt) ==
  CASE m \in {"isNaN", "isFinite"} ->
         \* §19.2.2, §19.2.3
         LET n == ToNumber(s, Arg(args, 1)) IN IF IsAbrupt(n) THEN n
         ELSE Ok(n.s, Bool(IF m = "isNaN" THEN NumIsNaN(Val(n).value) ELSE NumIsFinite(Val(n).value)))
    [] m = "parseFloat" ->
         \* §19.2.4
         LET str == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(str) THEN str
         ELSE Ok(str.s, Num(ParseFloatUnits(Val(str).value)))
    [] m = "parseInt" ->
         \* §19.2.5
         LET str == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(str) THEN str ELSE
         LET radix == ToInt32(str.s, Arg(args, 2)) IN IF IsAbrupt(radix) THEN radix
         ELSE Ok(radix.s, Num(ParseIntUnits(Val(str).value, NumToInt(Val(radix).value))))

\* Math (§21.3).
ToNumberList(s, values, acc) ==
  IF values = <<>> THEN Ok(s, acc)
  ELSE LET n == ToNumber(s, Head(values)) IN
       IF IsAbrupt(n) THEN n ELSE ToNumberList(n.s, Tail(values), Append(acc, Val(n).value))

\* The Math functions of one Number (§21.3.2).
MathOf(m, x) ==
  CASE m = "abs" -> MathAbs(x)
    [] m = "acos" -> MathAcos(x)
    [] m = "acosh" -> MathAcosh(x)
    [] m = "asin" -> MathAsin(x)
    [] m = "asinh" -> MathAsinh(x)
    [] m = "atan" -> MathAtan(x)
    [] m = "atanh" -> MathAtanh(x)
    [] m = "cbrt" -> MathCbrt(x)
    [] m = "ceil" -> MathCeil(x)
    [] m = "clz32" -> MathClz32(x)
    [] m = "cos" -> MathCos(x)
    [] m = "cosh" -> MathCosh(x)
    [] m = "exp" -> MathExp(x)
    [] m = "expm1" -> MathExpm1(x)
    [] m = "f16round" -> MathF16round(x)
    [] m = "floor" -> MathFloor(x)
    [] m = "fround" -> MathFround(x)
    [] m \in {"log", "log2", "log10"} -> MathLogarithm(m, x)
    [] m = "log1p" -> MathLog1p(x)
    [] m = "round" -> MathRound(x)
    [] m = "sign" -> MathSign(x)
    [] m = "sin" -> MathSin(x)
    [] m = "sinh" -> MathSinh(x)
    [] m = "sqrt" -> MathSqrt(x)
    [] m = "tan" -> MathTan(x)
    [] m = "tanh" -> MathTanh(x)
    [] m = "trunc" -> MathTrunc(x)

MathBuiltin(s, f, m, this, args, nt) ==
  CASE m \in {"atan2", "hypot", "imul", "max", "min", "pow"} ->
         LET l == ToNumberList(s, IF m \in {"hypot", "max", "min"} THEN args ELSE <<Arg(args, 1), Arg(args, 2)>>, <<>>)
             n == Val(l)
         IN IF IsAbrupt(l) THEN l
            ELSE Ok(l.s, Num(CASE m = "atan2" -> MathAtan2(n[1], n[2])
                               [] m = "hypot" -> MathHypot(n)
                               [] m = "imul" -> MathImul(n[1], n[2])
                               [] m = "max" -> MathMax(n)
                               [] m = "min" -> MathMin(n)
                               [] m = "pow" -> NumExponentiate(n[1], n[2])))
    [] m = "random" -> MathRandom(s)
    [] m = "sumPrecise" ->
         \* §21.3.2.34
         IF IsNullish(Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET it == GetIterator(s, Arg(args, 1), "sync") IN
              IF IsAbrupt(it) THEN it ELSE SumPrecise(it.s, Val(it), "minus-zero", <<FALSE, <<>>>>)
    [] OTHER ->
         LET n == ToNumber(s, Arg(args, 1)) IN IF IsAbrupt(n) THEN n ELSE Ok(n.s, Num(MathOf(m, Val(n).value)))

\* Math.sumPrecise's loop over the iterator: state is "minus-zero", "finite", "plus-infinity",
\* "minus-infinity", or "not-a-number", and sum the signed exact sum in units of 2^-1074.
SumPrecise(s, it, state, sum) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN
    Ok(next.s, Num(CASE state = "not-a-number" -> NaN
                     [] state = "plus-infinity" -> PosInf
                     [] state = "minus-infinity" -> NegInf
                     [] state = "minus-zero" -> NegZero
                     [] sum[2] = <<>> -> PosZero
                     [] OTHER -> NumFromBigNat(sum[1], sum[2], -1074)))
  ELSE IF ~IsNumber(Val(next).value) THEN
    LET error == ThrowTypeError(next.s) IN IteratorClose(error.s, Val(next).iterator, error.c)
  ELSE
    LET n == Val(next).value.value
        isFinite == state \in {"minus-zero", "finite"} /\ NumIsFinite(n) /\ n # NegZero
    IN SumPrecise(next.s, Val(next).iterator,
         CASE state = "not-a-number" \/ n.k = "nan" -> "not-a-number"
           [] n = PosInf -> IF state = "minus-infinity" THEN "not-a-number" ELSE "plus-infinity"
           [] n = NegInf -> IF state = "plus-infinity" THEN "not-a-number" ELSE "minus-infinity"
           [] isFinite -> "finite"
           [] OTHER -> state,
         IF isFinite THEN SignedAdd(sum, <<n.neg, BNShiftLeft(NumMag(n), NumExponent(n) + 1074)>>) ELSE sum)

\* Math.random (§21.3.2.27) as engine262 computes it: xorshift128+ on a state that the realm
\* seeds with fmix64 of a seed and of its complement. engine262 takes the seed from the host or
\* at random; here it is 0, so runs are deterministic. Like engine262's BigInt code, the steps
\* keep every bit and only the stored state is cut to 64 bits.
BNXor(a, b) ==
  BNNorm([i \in 1..NumIntMax(Len(a), Len(b)) |-> BitwiseInt("xor", BNLimb(a, i), BNLimb(b, i))])

Fmix64(h) ==
  LET h1 == BNMul(BNXor(h, BNShiftRight(h, 33)), DigitsValue(N("FF51AFD7ED558CCD"), 1, 16, <<>>))
      h2 == BNMul(BNXor(h1, BNShiftRight(h1, 33)), DigitsValue(N("C4CEB9FE1A85EC53"), 1, 16, <<>>))
  IN BNLowBits(BNXor(h2, BNShiftRight(h2, 33)), 64)

RandomSeedState == <<Fmix64(<<>>), Fmix64(BNSub(BNPow2(64), <<1>>))>>

MathRandom(s) ==
  LET math == Intrinsic(s, "Math")
      state == O(s, math).slots.randomState
      s0 == state[2]
      x1 == BNXor(state[1], BNShiftLeft(state[1], 23))
      x2 == BNXor(x1, BNShiftRight(x1, 17))
      x3 == BNXor(BNXor(x2, s0), BNShiftRight(s0, 26))
  IN Ok(SetO(s, math, [O(s, math) EXCEPT !.slots.randomState = <<s0, BNLowBits(x3, 64)>>]),
        Num(NumFromBigNat(FALSE, BNShiftRight(s0, 12), -52)))

\* URI handling (§19.2.6), and escape (§B.2.1.1) and unescape (§B.2.1.2).
URIBuiltin(s, f, m, this, args, nt) ==
  LET str == ToStr(s, Arg(args, 1)) IN
  IF IsAbrupt(str) THEN str
  ELSE CASE m = "decodeURI" -> Decode(str.s, Val(str).value, URIReserved, 1, <<>>)
         [] m = "decodeURIComponent" -> Decode(str.s, Val(str).value, {}, 1, <<>>)
         [] m = "encodeURI" -> Encode(str.s, Val(str).value, URIUnescaped \cup URIReserved, 1, <<>>)
         [] m = "encodeURIComponent" -> Encode(str.s, Val(str).value, URIUnescaped, 1, <<>>)
         [] m = "escape" -> Ok(str.s, Str(Escape(Val(str).value)))
         [] m = "unescape" -> Ok(str.s, Str(Unescape(Val(str).value, 1, <<>>)))

URIUnescaped == Range(N("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()"))
URIReserved == Range(N(";/?:@&=+$,#"))

IsLeadSurrogate(u) == u >= 55296 /\ u <= 56319
IsTrailSurrogate(u) == u >= 56320 /\ u <= 57343

\* The octets of the UTF-8 encoding of a code point.
UTF8Encode(cp) ==
  CASE cp < 128 -> <<cp>>
    [] cp < 2048 -> <<192 + cp \div 64, 128 + (cp % 64)>>
    [] cp < 65536 -> <<224 + cp \div 4096, 128 + ((cp \div 64) % 64), 128 + (cp % 64)>>
    [] OTHER -> <<240 + cp \div 262144, 128 + ((cp \div 4096) % 64), 128 + ((cp \div 64) % 64), 128 + (cp % 64)>>

HexDigit(d) == IF d < 10 THEN 48 + d ELSE 55 + d
PercentEncode(octets) == Concat([i \in DOMAIN octets |-> <<37, HexDigit(octets[i] \div 16), HexDigit(octets[i] % 16)>>])

EscapeUnescaped == Range(N("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_@*+-./"))

Escape(string) ==
  Concat([k \in DOMAIN string |->
           LET c == string[k] IN
           CASE c \in EscapeUnescaped -> <<c>>
             [] c < 256 -> <<37, HexDigit(c \div 16), HexDigit(c % 16)>>
             [] OTHER -> <<37, 117, HexDigit(c \div 4096), HexDigit((c \div 256) % 16), HexDigit((c \div 16) % 16), HexDigit(c % 16)>>])

\* unescape's loop from index k of string on, with acc the result so far: %uXXXX and %XX become the
\* code unit they spell, and a % without hex digits after it stays.
Unescape(string, k, acc) ==
  IF k > Len(string) THEN acc
  ELSE LET digits == CASE string[k] # 37 -> <<>>
                       [] k + 5 <= Len(string) /\ string[k + 1] = 117 -> SubSeq(string, k + 2, k + 5)
                       [] k + 2 <= Len(string) -> SubSeq(string, k + 1, k + 2)
                       [] OTHER -> <<>>
           value == [i \in DOMAIN digits |-> NumDigitValue(digits[i])]
       IN IF digits # <<>> /\ \A i \in DOMAIN value : value[i] < 16
          THEN Unescape(string, k + Len(digits) + (IF Len(digits) = 4 THEN 2 ELSE 1),
                        Append(acc, IF Len(digits) = 4 THEN ((value[1] * 16 + value[2]) * 16 + value[3]) * 16 + value[4]
                                    ELSE value[1] * 16 + value[2]))
          ELSE Unescape(string, k + 1, Append(acc, string[k]))

\* Encode (§19.2.6.5) from index k of string on, with acc the result so far.
Encode(s, string, unescaped, k, acc) ==
  IF k > Len(string) THEN Ok(s, Str(acc))
  ELSE LET c == string[k] IN
  IF c \in unescaped THEN Encode(s, string, unescaped, k + 1, Append(acc, c))
  ELSE IF IsTrailSurrogate(c) \/ (IsLeadSurrogate(c) /\ (k = Len(string) \/ ~IsTrailSurrogate(string[k + 1])))
  THEN ThrowError(s, "URIError")
  ELSE IF IsLeadSurrogate(c)
  THEN Encode(s, string, unescaped, k + 2,
              acc \o PercentEncode(UTF8Encode((c - 55296) * 1024 + string[k + 1] - 56320 + 65536)))
  ELSE Encode(s, string, unescaped, k + 1, acc \o PercentEncode(UTF8Encode(c)))

\* ParseHexOctet (§19.2.6.7): the octet that the two hex digits at index k of string spell, or -1.
ParseHexOctet(string, k) ==
  IF k + 1 <= Len(string) /\ NumDigitValue(string[k]) < 16 /\ NumDigitValue(string[k + 1]) < 16
  THEN NumDigitValue(string[k]) * 16 + NumDigitValue(string[k + 1])
  ELSE -1

\* The number of leading 1 bits of an octet.
LeadingOnes(b) == CASE b < 128 -> 0 [] b < 192 -> 1 [] b < 224 -> 2 [] b < 240 -> 3 [] b < 248 -> 4 [] OTHER -> 5

\* The escapes %XX of the continuation octets from index k of string on, as octets, or <<>> when
\* one is missing or not of the form 10xxxxxx.
ContinuationOctets(string, k, count) ==
  IF count = 0 THEN <<>>
  ELSE IF k > Len(string) \/ string[k] # 37 THEN <<-1>>
  ELSE LET b == ParseHexOctet(string, k + 1) IN
       IF b < 128 \/ b >= 192 THEN <<-1>> ELSE <<b>> \o ContinuationOctets(string, k + 3, count - 1)

\* The code point that n UTF-8 octets encode, starting with the lead octet b, or -1 when they
\* are an overlong form, a surrogate, or above U+10FFFF.
UTF8Decode(b, rest) ==
  LET n == Len(rest) + 1
      cp == AppendSixBits(b % (2 ^ (7 - n)), rest, 1)
  IN IF \E i \in DOMAIN rest : rest[i] < 0 THEN -1
     ELSE IF (n = 2 /\ cp < 128) \/ (n = 3 /\ cp < 2048) \/ (n = 4 /\ cp < 65536) \/ cp > 1114111 \/
             (cp >= 55296 /\ cp <= 57343)
     THEN -1 ELSE cp
AppendSixBits(value, octets, i) ==
  IF i > Len(octets) THEN value ELSE AppendSixBits(value * 64 + (octets[i] % 64), octets, i + 1)

\* Decode (§19.2.6.6) from index k of string on, with acc the result so far.
Decode(s, string, preserved, k, acc) ==
  IF k > Len(string) THEN Ok(s, Str(acc))
  ELSE IF string[k] # 37 THEN Decode(s, string, preserved, k + 1, Append(acc, string[k]))
  ELSE LET b == ParseHexOctet(string, k + 1)
           n == LeadingOnes(b)
           cp == UTF8Decode(b, ContinuationOctets(string, k + 3, n - 1))
       IN CASE b < 0 \/ n = 1 \/ n > 4 -> ThrowError(s, "URIError")
            [] n = 0 -> Decode(s, string, preserved, k + 3,
                               acc \o (IF b \in preserved THEN SubSeq(string, k, k + 2) ELSE <<b>>))
            [] cp < 0 -> ThrowError(s, "URIError")
            [] OTHER -> Decode(s, string, preserved, k + 3 * n, acc \o UTF16EncodeCodePoint(cp))
