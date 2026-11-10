\* Boolean (§20.3), Symbol (§20.4), the Error objects (§20.5), and BigInt (§21.2). The state's
\* symbolRegistry is the GlobalSymbolRegistry of Symbol.for (§20.4.2.2): [key, symbol] records.

NativeErrors == <<"TypeError", "ReferenceError", "SyntaxError", "RangeError", "EvalError", "URIError">>
NativeErrorNames ==
  [e \in Range(NativeErrors) |->
     CASE e = "TypeError" -> N("TypeError") [] e = "ReferenceError" -> N("ReferenceError")
       [] e = "SyntaxError" -> N("SyntaxError") [] e = "RangeError" -> N("RangeError")
       [] e = "EvalError" -> N("EvalError") [] e = "URIError" -> N("URIError")]

SymbolErrorIntrinsics ==
  << IntrinsicObject("BooleanPrototype", "ObjectPrototype", "boolean", [data |-> False]),
     IntrinsicFunction("Boolean", "FunctionPrototype", <<"Boolean", "constructor">>, 1, N("Boolean"), TRUE),
     IntrinsicObject("SymbolPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Symbol", "FunctionPrototype", <<"Symbol", "constructor">>, 0, N("Symbol"), TRUE),
     IntrinsicFunction("SymbolProto_toPrimitive", "FunctionPrototype", <<"Symbol", "toPrimitive">>, 1,
                       N("[Symbol.toPrimitive]"), FALSE),
     IntrinsicObject("ErrorPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Error", "FunctionPrototype", <<"Error", "constructor">>, 1, N("Error"), TRUE),
     IntrinsicObject("AggregateErrorPrototype", "ErrorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("AggregateError", "Error", <<"AggregateError", "constructor">>, 2, N("AggregateError"), TRUE),
     IntrinsicObject("BigIntPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("BigInt", "FunctionPrototype", <<"BigInt", "constructor">>, 1, N("BigInt"), TRUE) >> \o
  [i \in DOMAIN NativeErrors |-> IntrinsicObject(NativeErrors[i] \o "Prototype", "ErrorPrototype", "ordinary", [none |-> TRUE])] \o
  [i \in DOMAIN NativeErrors |-> IntrinsicFunction(NativeErrors[i], "Error", <<"NativeError", NativeErrors[i]>>, 1,
                                                    NativeErrorNames[NativeErrors[i]], TRUE)]

SymbolErrorProperties ==
  Ctor("Boolean", "BooleanPrototype") \o Ctor("Symbol", "SymbolPrototype") \o Ctor("Error", "ErrorPrototype") \o
  Ctor("AggregateError", "AggregateErrorPrototype") \o Ctor("BigInt", "BigIntPrototype") \o
  FoldLeftSeq([i \in DOMAIN NativeErrors |->
                 Ctor(NativeErrors[i], NativeErrors[i] \o "Prototype") \o
                 << V(NativeErrors[i] \o "Prototype", SV("name"), Str(NativeErrorNames[NativeErrors[i]]), TRUE, FALSE, TRUE),
                    V(NativeErrors[i] \o "Prototype", SV("message"), EmptyStr, TRUE, FALSE, TRUE),
                    GlobalLink(NativeErrors[i], NativeErrorNames[NativeErrors[i]]) >>]) \o
  << \* Boolean (§20.3).
     M("BooleanPrototype", SV("toString"), "Boolean", "toString", 0),
     M("BooleanPrototype", SV("valueOf"), "Boolean", "valueOf", 0),
     \* Symbol (§20.4).
     M("Symbol", SV("for"), "Symbol", "for", 1),
     M("Symbol", SV("keyFor"), "Symbol", "keyFor", 1),
     V("Symbol", SV("asyncDispose"), SymAsyncDispose, FALSE, FALSE, FALSE),
     V("Symbol", SV("asyncIterator"), SymAsyncIterator, FALSE, FALSE, FALSE),
     V("Symbol", SV("dispose"), SymDispose, FALSE, FALSE, FALSE),
     V("Symbol", SV("hasInstance"), SymHasInstance, FALSE, FALSE, FALSE),
     V("Symbol", SV("isConcatSpreadable"), SymIsConcatSpreadable, FALSE, FALSE, FALSE),
     V("Symbol", SV("iterator"), SymIterator, FALSE, FALSE, FALSE),
     V("Symbol", SV("match"), SymMatch, FALSE, FALSE, FALSE),
     V("Symbol", SV("matchAll"), SymMatchAll, FALSE, FALSE, FALSE),
     V("Symbol", SV("replace"), SymReplace, FALSE, FALSE, FALSE),
     V("Symbol", SV("search"), SymSearch, FALSE, FALSE, FALSE),
     V("Symbol", SV("species"), SymSpecies, FALSE, FALSE, FALSE),
     V("Symbol", SV("split"), SymSplit, FALSE, FALSE, FALSE),
     V("Symbol", SV("toPrimitive"), SymToPrimitive, FALSE, FALSE, FALSE),
     V("Symbol", SV("toStringTag"), SymToStringTag, FALSE, FALSE, FALSE),
     V("Symbol", SV("unscopables"), SymUnscopables, FALSE, FALSE, FALSE),
     M("SymbolPrototype", SV("toString"), "Symbol", "toString", 0),
     M("SymbolPrototype", SV("valueOf"), "Symbol", "valueOf", 0),
     G("SymbolPrototype", SV("description"), "Symbol", "description", ""),
     L("SymbolPrototype", SymToPrimitive, "SymbolProto_toPrimitive", FALSE, FALSE, TRUE),
     V("SymbolPrototype", SymToStringTag, SV("Symbol"), FALSE, FALSE, TRUE),
     \* Error (§20.5), with Error.isError and the Error.prototype.stack accessor of the
     \* proposals engine262 implements.
     M("Error", SV("isError"), "Error", "isError", 1),
     M("ErrorPrototype", SV("toString"), "Error", "toString", 0),
     V("ErrorPrototype", SV("name"), SV("Error"), TRUE, FALSE, TRUE),
     V("ErrorPrototype", SV("message"), EmptyStr, TRUE, FALSE, TRUE),
     G("ErrorPrototype", SV("stack"), "Error", "getStack", "setStack"),
     V("AggregateErrorPrototype", SV("name"), SV("AggregateError"), TRUE, FALSE, TRUE),
     V("AggregateErrorPrototype", SV("message"), EmptyStr, TRUE, FALSE, TRUE),
     \* BigInt (§21.2).
     M("BigInt", SV("asIntN"), "BigInt", "asIntN", 2),
     M("BigInt", SV("asUintN"), "BigInt", "asUintN", 2),
     M("BigIntPrototype", SV("toLocaleString"), "BigInt", "toLocaleString", 0),
     M("BigIntPrototype", SV("toString"), "BigInt", "toString", 0),
     M("BigIntPrototype", SV("valueOf"), "BigInt", "valueOf", 0),
     V("BigIntPrototype", SymToStringTag, SV("BigInt"), FALSE, FALSE, TRUE),
     GlobalLink("Boolean", N("Boolean")), GlobalLink("Symbol", N("Symbol")), GlobalLink("Error", N("Error")),
     GlobalLink("AggregateError", N("AggregateError")), GlobalLink("BigInt", N("BigInt")) >>

\* Boolean (§20.3).
ThisBooleanValue(s, v) ==
  IF IsBoolean(v) THEN Ok(s, v)
  ELSE IF IsObject(v) /\ O(s, v).class = "boolean" THEN Ok(s, O(s, v).slots.data)
  ELSE ThrowTypeError(s)

BooleanBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN Ok(s, ToBoolean(Arg(args, 1)))
         ELSE OrdinaryCreateFromConstructor(s, nt, "BooleanPrototype", "boolean", [data |-> ToBoolean(Arg(args, 1))])
    [] m = "toString" -> LET b == ThisBooleanValue(s, this) IN IF IsAbrupt(b) THEN b ELSE Ok(b.s, Str(PrimitiveToUnits(Val(b))))
    [] m = "valueOf" -> ThisBooleanValue(s, this)

\* Symbol (§20.4).
ThisSymbolValue(s, v) ==
  IF IsSymbol(v) THEN Ok(s, v)
  ELSE IF IsObject(v) /\ O(s, v).class = "symbol" THEN Ok(s, O(s, v).slots.data)
  ELSE ThrowTypeError(s)

\* SymbolDescriptiveString (§20.4.3.3.1).
SymbolDescriptiveString(s, sym) ==
  Str(N("Symbol(") \o (IF s.syms[sym.id] = Undefined THEN <<>> ELSE s.syms[sym.id].value) \o N(")"))

\* A new unique Symbol with a description, a String or Undefined.
NewSymbol(s, description) == [s |-> [s EXCEPT !.syms = Append(@, description)], v |-> Sym(Len(s.syms) + 1)]

\* KeyForSymbol (§20.4.5.1).
KeyForSymbol(s, sym) ==
  LET found == SelectSeq(s.symbolRegistry, LAMBDA e : e.symbol = sym) IN
  IF found = <<>> THEN Undefined ELSE found[1].key

SymbolBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt # Undefined THEN ThrowTypeError(s)
         ELSE LET d == IF Arg(args, 1) = Undefined THEN Ok(s, Undefined) ELSE ToStr(s, Arg(args, 1)) IN
              IF IsAbrupt(d) THEN d ELSE LET sym == NewSymbol(d.s, Val(d)) IN Ok(sym.s, sym.v)
    [] m = "for" ->
         LET key == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(key) THEN key ELSE
         LET found == SelectSeq(key.s.symbolRegistry, LAMBDA e : e.key = Val(key)) IN
         IF found # <<>> THEN Ok(key.s, found[1].symbol)
         ELSE LET sym == NewSymbol(key.s, Val(key)) IN
              Ok([sym.s EXCEPT !.symbolRegistry = Append(@, [key |-> Val(key), symbol |-> sym.v])], sym.v)
    [] m = "keyFor" -> IF ~IsSymbol(Arg(args, 1)) THEN ThrowTypeError(s) ELSE Ok(s, KeyForSymbol(s, Arg(args, 1)))
    [] m = "toString" ->
         LET v == ThisSymbolValue(s, this) IN IF IsAbrupt(v) THEN v ELSE Ok(v.s, SymbolDescriptiveString(v.s, Val(v)))
    [] m \in {"valueOf", "toPrimitive"} -> ThisSymbolValue(s, this)
    [] m = "description" ->
         LET v == ThisSymbolValue(s, this) IN IF IsAbrupt(v) THEN v ELSE Ok(v.s, v.s.syms[Val(v).id])

\* The Error, NativeError, and AggregateError constructors' steps up to InstallErrorCause
\* (§20.5.1.1, §20.5.6.1.1, §20.5.7.1.1), for the prototype of newTarget or the default.
ErrorConstructor(s, newTarget, protoName, message, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, protoName, "error", [data |-> Empty]) IN
  IF IsAbrupt(o) THEN o ELSE
  LET msg == IF message = Undefined THEN Ok(o.s, Empty) ELSE ToStr(o.s, message) IN
  IF IsAbrupt(msg) THEN msg ELSE
  LET m == IF Val(msg) = Empty THEN Ok(msg.s, Empty) ELSE CreateMethodProperty(msg.s, Val(o), SV("message"), Val(msg)) IN
  LET c == InstallErrorCause(m.s, Val(o), options) IN
  IF IsAbrupt(c) THEN c ELSE Ok(c.s, Val(o))

\* InstallErrorCause (§20.5.8.1).
InstallErrorCause(s, o, options) ==
  IF ~IsObject(options) THEN Ok(s, Undefined)
  ELSE LET has == HasProperty(s, options, SV("cause")) IN
  IF IsAbrupt(has) \/ Val(has) = False THEN has
  ELSE LET cause == Get(has.s, options, SV("cause")) IN
  IF IsAbrupt(cause) THEN cause ELSE CreateMethodProperty(cause.s, o, SV("cause"), Val(cause))

\* SetterThatIgnoresPrototypeProperties, of the Iterator.prototype accessors (§27.1.4).
SetterThatIgnoresPrototypeProperties(s, this, home, p, v) ==
  IF ~IsObject(this) \/ SameValue(this, home) THEN ThrowTypeError(s)
  ELSE LET desc == GetOwnProperty(s, this, p) IN IF IsAbrupt(desc) THEN desc
  ELSE IF Val(desc) = Absent THEN CreateDataPropertyOrThrow(desc.s, this, p, v)
  ELSE Set(desc.s, this, p, v, TRUE)

ErrorBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> ErrorConstructor(s, IF nt = Undefined THEN f ELSE nt, "ErrorPrototype", Arg(args, 1), Arg(args, 2))
    \* Error.isError and IsError of the proposal.
    [] m = "isError" -> Ok(s, Bool(IsObject(Arg(args, 1)) /\ O(s, Arg(args, 1)).class = "error"))
    \* Error.prototype.toString (§20.5.3.4).
    [] m = "toString" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET name == Get(s, this, SV("name")) IN IF IsAbrupt(name) THEN name ELSE
         LET n == IF Val(name) = Undefined THEN Ok(name.s, SV("Error")) ELSE ToStr(name.s, Val(name)) IN
         IF IsAbrupt(n) THEN n ELSE
         LET msg == Get(n.s, this, SV("message")) IN IF IsAbrupt(msg) THEN msg ELSE
         LET mm == IF Val(msg) = Undefined THEN Ok(msg.s, EmptyStr) ELSE ToStr(msg.s, Val(msg)) IN
         IF IsAbrupt(mm) THEN mm
         ELSE IF Val(n).value = <<>> THEN mm
         ELSE IF Val(mm).value = <<>> THEN Ok(mm.s, Val(n))
         ELSE Ok(mm.s, Str(Val(n).value \o N(": ") \o Val(mm).value))
    \* get and set Error.prototype.stack. The stack is the empty String, which is as
    \* implementation-defined as any.
    [] m = "getStack" ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE Ok(s, IF O(s, this).class = "error" THEN EmptyStr ELSE Undefined)
    [] m = "setStack" ->
         IF ~IsObject(this) \/ ~IsString(Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET r == SetterThatIgnoresPrototypeProperties(s, this, Intrinsic(s, "ErrorPrototype"), SV("stack"), Arg(args, 1)) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)

NativeErrorBuiltin(s, f, m, this, args, nt) ==
  ErrorConstructor(s, IF nt = Undefined THEN f ELSE nt, m \o "Prototype", Arg(args, 1), Arg(args, 2))

\* AggregateError (§20.5.7.1.1).
AggregateErrorBuiltin(s, f, m, this, args, nt) ==
  LET o == ErrorConstructor(s, IF nt = Undefined THEN f ELSE nt, "AggregateErrorPrototype", Arg(args, 2), Arg(args, 3)) IN
  IF IsAbrupt(o) THEN o ELSE
  LET it == GetIterator(o.s, Arg(args, 1), "sync") IN IF IsAbrupt(it) THEN it ELSE
  LET errors == IteratorToList(it.s, Val(it), <<>>) IN IF IsAbrupt(errors) THEN errors ELSE
  LET a == CreateArrayFromList(errors.s, Val(errors))
      d == CreateMethodProperty(a.s, Val(o), SV("errors"), Val(a))
  IN Ok(d.s, Val(o))

\* BigInt (§21.2).
ToBigInt(s, v) ==
  LET p == ToPrimitive(s, v, "number") IN IF IsAbrupt(p) THEN p ELSE
  LET x == Val(p) IN
  CASE x.type \in {"undefined", "null", "number", "symbol"} -> ThrowTypeError(p.s)
    [] x.type = "boolean" -> Ok(p.s, BigInt(BigIntFromInt(IF x.value THEN 1 ELSE 0)))
    [] x.type = "bigint" -> p
    [] x.type = "string" ->
         LET n == StringToBigInt(x.value) IN IF n = Undefined THEN ThrowError(p.s, "SyntaxError") ELSE Ok(p.s, n)

ThisBigIntValue(s, v) ==
  IF IsBigInt(v) THEN Ok(s, v)
  ELSE IF IsObject(v) /\ O(s, v).class = "bigint" THEN Ok(s, O(s, v).slots.data)
  ELSE ThrowTypeError(s)

\* a modulo 2^bits as a BigNat, for bits a TLA+ integer.
BigIntModPow2(a, bits) ==
  LET low == BNLowBits(a.mag, bits) IN
  IF ~a.neg \/ low = <<>> THEN low ELSE BNSub(BNPow2(bits), low)

\* BigInt.asIntN (§21.2.2.1) and BigInt.asUintN (§21.2.2.2) for bits an integral Number. A
\* result that keeps a's value needs no power of two, so bits may be as large as ToIndex allows.
\* A negative a with bits of 2^30 or more makes a BigInt too large to represent: a RangeError, as
\* engines throw.
BigIntAsN(s, m, bits, a) ==
  LET isSmall == bits.k = "int"
      length == BNBitLength(a.mag)
  IN IF m = "asIntN" THEN
       IF ~isSmall \/ length < NumToSmallInt(bits) THEN Ok(s, BigInt(a))
       ELSE LET b == NumToSmallInt(bits)
                mod == BigIntModPow2(a, b)
            IN Ok(s, BigInt(IF b > 0 /\ BNTestBit(mod, b - 1) THEN BigIntOf(TRUE, BNSub(BNPow2(b), mod))
                            ELSE BigIntOf(FALSE, mod)))
     ELSE IF ~a.neg /\ (~isSmall \/ length <= NumToSmallInt(bits)) THEN Ok(s, BigInt(a))
     ELSE IF ~isSmall THEN ThrowError(s, "RangeError")
     ELSE Ok(s, BigInt(BigIntOf(FALSE, BigIntModPow2(a, NumToSmallInt(bits)))))

BigIntBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt # Undefined THEN ThrowTypeError(s)
         ELSE LET p == ToPrimitive(s, Arg(args, 1), "number") IN IF IsAbrupt(p) THEN p
         ELSE IF IsNumber(Val(p)) THEN
           IF ~NumIsFinite(Val(p).value) \/ ~NumIsIntegral(Val(p).value) THEN ThrowError(p.s, "RangeError")
           ELSE Ok(p.s, BigInt(IntegralNumberToBigInt(Val(p).value)))
         ELSE ToBigInt(p.s, Val(p))
    [] m \in {"asIntN", "asUintN"} ->
         LET bits == ToIndex(s, Arg(args, 1)) IN IF IsAbrupt(bits) THEN bits ELSE
         LET a == ToBigInt(bits.s, Arg(args, 2)) IN IF IsAbrupt(a) THEN a ELSE
         BigIntAsN(a.s, m, Val(bits).value, Val(a).value)
    [] m = "valueOf" -> ThisBigIntValue(s, this)
    \* toString and, as engine262 has it, toLocaleString.
    [] OTHER ->
         LET b == ThisBigIntValue(s, this) IN IF IsAbrupt(b) THEN b ELSE
         LET r == IF Arg(args, 1) = Undefined THEN Ok(b.s, IntV(10)) ELSE ToIntegerOrInfinity(b.s, Arg(args, 1)) IN
         IF IsAbrupt(r) THEN r
         ELSE IF NumLess(Val(r).value, NumFromInt(2)) \/ NumLess(NumFromInt(36), Val(r).value) THEN ThrowError(r.s, "RangeError")
         ELSE Ok(r.s, Str(BigIntToString(Val(b).value, NumToSmallInt(Val(r).value))))
