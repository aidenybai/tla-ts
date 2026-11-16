\* Abstract operations (§7). Each that can run user code returns a result [s, c].

\* Throws a new error of a native error type, such as "TypeError".
ThrowError(s, kind) ==
  LET a == Alloc(s, MakeObject(Obj(s.realm[kind \o "Prototype"]), "error", [data |-> Empty])) IN
  ThrowValue(a.s, a.v)
ThrowTypeError(s) == ThrowError(s, "TypeError")

Intrinsic(s, name) == Obj(s.realm[name])

\* Type conversion (§7.1).
ToPrimitive(s, v, hint) ==
  IF ~IsObject(v) THEN Ok(s, v)
  ELSE
    LET m == GetMethod(s, v, SymToPrimitive) IN
    IF IsAbrupt(m) THEN m
    ELSE IF Val(m) # Undefined THEN
      LET r == Call(m.s, Val(m), v, <<CASE hint = "none" -> SV("default") [] hint = "string" -> SV("string") [] OTHER -> SV("number")>>) IN
      IF IsAbrupt(r) THEN r
      ELSE IF IsObject(Val(r)) THEN ThrowTypeError(r.s)
      ELSE r
    ELSE OrdinaryToPrimitive(m.s, v, IF hint = "string" THEN "string" ELSE "number")

OrdinaryToPrimitive(s, v, hint) ==
  LET names == IF hint = "string" THEN <<SV("toString"), SV("valueOf")>>
               ELSE <<SV("valueOf"), SV("toString")>>
  IN TryPrimitiveMethods(s, v, names)
TryPrimitiveMethods(s, v, names) ==
  IF names = <<>> THEN ThrowTypeError(s)
  ELSE LET m == Get(s, v, Head(names)) IN
       IF IsAbrupt(m) THEN m
       ELSE IF IsCallable(m.s, Val(m)) THEN
         LET r == Call(m.s, Val(m), v, <<>>) IN
         IF IsAbrupt(r) THEN r
         ELSE IF ~IsObject(Val(r)) THEN r
         ELSE TryPrimitiveMethods(r.s, v, Tail(names))
       ELSE TryPrimitiveMethods(m.s, v, Tail(names))

ToBooleanValue(v) ==
  CASE v.type = "undefined" -> FALSE
    [] v.type = "null" -> FALSE
    [] v.type = "boolean" -> v.value
    [] v.type = "number" -> ~(v.value \in {PosZero, NegZero, NaN})
    [] v.type = "string" -> v.value # <<>>
    [] v.type = "bigint" -> ~BigIntIsZero(v.value)
    [] OTHER -> ~IsHTMLDDA(v)
ToBoolean(v) == Bool(ToBooleanValue(v))

\* Whether v is the test262 host's $262.IsHTMLDDA, the only object with an [[IsHTMLDDA]] slot (§B.3.6).
IsHTMLDDA(v) == v = Obj(IntrinsicIndex["IsHTMLDDA"])

\* ToNumber of a primitive that isn't a symbol or a BigInt, which can't throw.
PrimitiveToNumber(v) ==
  CASE v.type = "number" -> v
    [] v.type = "undefined" -> Num(NaN)
    [] v.type = "null" -> Num(PosZero)
    [] v.type = "boolean" -> IntV(IF v.value THEN 1 ELSE 0)
    [] v.type = "string" -> Num(StrToNum(v.value))

ToNumeric(s, v) ==
  LET p == ToPrimitive(s, v, "number") IN
  IF IsAbrupt(p) THEN p
  ELSE IF IsBigInt(Val(p)) THEN p
  ELSE ToNumber(p.s, Val(p))

ToNumber(s, v) ==
  CASE v.type \in {"number", "undefined", "null", "boolean", "string"} -> Ok(s, PrimitiveToNumber(v))
    [] v.type \in {"symbol", "bigint"} -> ThrowTypeError(s)
    [] OTHER ->
         LET p == ToPrimitive(s, v, "number") IN
         IF IsAbrupt(p) THEN p ELSE ToNumber(p.s, Val(p))

ToIntegerOrInfinity(s, v) ==
  LET n == ToNumber(s, v) IN
  IF IsAbrupt(n) THEN n ELSE Ok(n.s, Num(NumToIntegerOrInfinity(Val(n).value)))

ToInt32(s, v) ==
  LET n == ToNumber(s, v) IN IF IsAbrupt(n) THEN n ELSE Ok(n.s, IntV(NumToInt32(Val(n).value)))
ToUint32(s, v) ==
  LET n == ToNumber(s, v) IN IF IsAbrupt(n) THEN n ELSE Ok(n.s, Num(NumToUint32(Val(n).value)))

ToStr(s, v) ==
  CASE v.type = "string" -> Ok(s, v)
    [] v.type = "symbol" -> ThrowTypeError(s)
    [] v.type = "object" ->
         LET p == ToPrimitive(s, v, "string") IN
         IF IsAbrupt(p) THEN p ELSE ToStr(p.s, Val(p))
    [] OTHER -> Ok(s, Str(PrimitiveToUnits(v)))

\* ToString of a primitive that isn't a symbol.
PrimitiveToUnits(v) ==
  CASE v.type = "undefined" -> N("undefined")
    [] v.type = "null" -> N("null")
    [] v.type = "boolean" -> IF v.value THEN N("true") ELSE N("false")
    [] v.type = "number" -> NumToString(v.value)
    [] v.type = "bigint" -> BigIntToString(v.value, 10)
    [] v.type = "string" -> v.value

ToObject(s, v) ==
  CASE v.type \in {"undefined", "null"} -> ThrowTypeError(s)
    [] v.type = "object" -> Ok(s, v)
    [] v.type = "boolean" -> AllocWrapper(s, v, "BooleanPrototype", "boolean")
    [] v.type = "number" -> AllocWrapper(s, v, "NumberPrototype", "number")
    [] v.type = "bigint" -> AllocWrapper(s, v, "BigIntPrototype", "bigint")
    [] v.type = "symbol" -> AllocWrapper(s, v, "SymbolPrototype", "symbol")
    [] v.type = "string" -> StringCreate(s, v, Intrinsic(s, "StringPrototype"))

AllocWrapper(s, v, proto, class) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, proto), class, [data |-> v])) IN Ok(a.s, a.v)

\* StringCreate (§10.4.3.4).
StringCreate(s, v, proto) ==
  LET o == PutProp(MakeObject(proto, "string", [data |-> v.value]), SV("length"),
                   DataDesc(IntV(Len(v.value)), FALSE, FALSE, FALSE))
      a == Alloc(s, o)
  IN Ok(a.s, a.v)

ToPropertyKey(s, v) ==
  LET p == ToPrimitive(s, v, "string") IN
  IF IsAbrupt(p) THEN p
  ELSE IF IsSymbol(Val(p)) THEN p
  ELSE ToStr(p.s, Val(p))

ToLength(s, v) ==
  LET n == ToIntegerOrInfinity(s, v) IN
  IF IsAbrupt(n) THEN n ELSE Ok(n.s, Num(NumClampLength(Val(n).value)))

\* ToIndex (§7.1.22).
ToIndex(s, v) ==
  IF v = Undefined THEN Ok(s, IntV(0))
  ELSE LET n == ToIntegerOrInfinity(s, v) IN
       IF IsAbrupt(n) THEN n
       ELSE IF NumLess(Val(n).value, PosZero) \/ NumLess(MaxSafeInteger, Val(n).value)
       THEN ThrowError(n.s, "RangeError")
       ELSE n

\* ToAbsoluteIndex: an integer, +∞, or -∞, counted from length when negative.
ToAbsoluteIndex(s, v, length) ==
  LET n == ToIntegerOrInfinity(s, v) IN
  IF IsAbrupt(n) THEN n
  ELSE LET x == Val(n).value IN Ok(n.s, IF NumIsFinite(x) /\ x.neg THEN NumAdd(NumFromInt(length), x) ELSE x)

\* ToClampedIndex: ToAbsoluteIndex clamped to 0..length, as a TLA+ integer.
ToClampedIndex(s, v, length) ==
  LET i == ToAbsoluteIndex(s, v, length) IN
  IF IsAbrupt(i) THEN i
  ELSE Ok(i.s, IF NumLess(Val(i), PosZero) THEN 0
               ELSE IF NumLess(NumFromInt(length), Val(i)) THEN length ELSE NumToSmallInt(Val(i)))

\* CanonicalNumericIndexString (§7.1.21): the Number a string names, or Undefined.
CanonicalNumericIndexString(units) ==
  IF units = N("-0") THEN Num(NegZero)
  ELSE LET n == StrToNum(units) IN
       IF NumToString(n) = units THEN Num(n) ELSE Undefined

\* Testing and comparison (§7.2).
RequireObjectCoercible(s, v) == IF IsNullish(v) THEN ThrowTypeError(s) ELSE Ok(s, v)

IsCallable(s, v) == IsObject(v) /\ O(s, v).class \in CallableClasses /\ IsCallableObject(O(s, v))
CallableClasses == {"function", "builtin", "bound", "proxy", "wrapped"}
IsCallableObject(o) == o.class # "proxy" \/ o.slots.callable
IsConstructor(s, v) ==
  IsObject(v) /\ O(s, v).class \in CallableClasses /\ O(s, v).slots.constructor

IsArray(s, v) ==
  IF ~IsObject(v) THEN Ok(s, False)
  ELSE IF O(s, v).class = "array" THEN Ok(s, True)
  ELSE IF O(s, v).class = "proxy" THEN
    IF O(s, v).slots.handler = Null THEN ThrowTypeError(s)
    ELSE IsArray(s, O(s, v).slots.target)
  ELSE Ok(s, False)

IsRegExp(s, v) ==
  IF ~IsObject(v) THEN Ok(s, False)
  ELSE LET m == Get(s, v, SymMatch) IN
       IF IsAbrupt(m) THEN m
       ELSE IF Val(m) # Undefined THEN Ok(m.s, ToBoolean(Val(m)))
       ELSE Ok(m.s, Bool(O(m.s, v).class = "regexp"))

SameValue(x, y) ==
  IF x.type # y.type THEN FALSE
  ELSE IF x.type = "number" THEN x.value = y.value
  ELSE x = y
SameValueZero(x, y) ==
  IF x.type = "number" /\ y.type = "number" THEN NumSameValueZero(x.value, y.value)
  ELSE SameValue(x, y)
IsStrictlyEqual(x, y) ==
  IF x.type # y.type THEN FALSE
  ELSE IF x.type = "number" THEN NumEqual(x.value, y.value)
  ELSE x = y

\* IsLooselyEqual (§7.2.14).
IsLooselyEqual(s, x, y) ==
  IF x.type = y.type THEN Ok(s, Bool(IsStrictlyEqual(x, y)))
  ELSE IF IsNullish(x) /\ IsNullish(y) THEN Ok(s, True)
  ELSE IF (IsHTMLDDA(x) /\ IsNullish(y)) \/ (IsNullish(x) /\ IsHTMLDDA(y)) THEN Ok(s, True)
  ELSE IF IsNumber(x) /\ IsString(y) THEN Ok(s, Bool(NumEqual(x.value, StrToNum(y.value))))
  ELSE IF IsString(x) /\ IsNumber(y) THEN Ok(s, Bool(NumEqual(StrToNum(x.value), y.value)))
  ELSE IF IsBigInt(x) /\ IsString(y) THEN
    LET n == StringToBigInt(y.value) IN
    Ok(s, Bool(n # Undefined /\ BigIntEqual(x.value, n.value)))
  ELSE IF IsString(x) /\ IsBigInt(y) THEN IsLooselyEqual(s, y, x)
  ELSE IF IsBoolean(x) THEN IsLooselyEqual(s, IntV(IF x.value THEN 1 ELSE 0), y)
  ELSE IF IsBoolean(y) THEN IsLooselyEqual(s, x, IntV(IF y.value THEN 1 ELSE 0))
  ELSE IF x.type \in {"string", "number", "bigint", "symbol"} /\ IsObject(y) THEN
    LET p == ToPrimitive(s, y, "none") IN
    IF IsAbrupt(p) THEN p ELSE IsLooselyEqual(p.s, x, Val(p))
  ELSE IF IsObject(x) /\ y.type \in {"string", "number", "bigint", "symbol"} THEN
    LET p == ToPrimitive(s, x, "none") IN
    IF IsAbrupt(p) THEN p ELSE IsLooselyEqual(p.s, Val(p), y)
  ELSE IF IsBigInt(x) /\ IsNumber(y) THEN Ok(s, Bool(BigIntEqualsNumber(x.value, y.value)))
  ELSE IF IsNumber(x) /\ IsBigInt(y) THEN Ok(s, Bool(BigIntEqualsNumber(y.value, x.value)))
  ELSE Ok(s, False)

\* IsLessThan (§7.2.13) on primitives px and py: True, False, or Undefined.
IsLessThanPrimitive(px, py) ==
  IF IsString(px) /\ IsString(py) THEN Bool(CodeUnitLess(px.value, py.value))
  ELSE IF IsBigInt(px) /\ IsString(py) THEN
    LET ny == StringToBigInt(py.value) IN
    IF ny = Undefined THEN Undefined ELSE Bool(BigIntLess(px.value, ny.value))
  ELSE IF IsString(px) /\ IsBigInt(py) THEN
    LET nx == StringToBigInt(px.value) IN
    IF nx = Undefined THEN Undefined ELSE Bool(BigIntLess(nx.value, py.value))
  ELSE
    LET nx == IF IsBigInt(px) THEN px ELSE PrimitiveToNumber(px)
        ny == IF IsBigInt(py) THEN py ELSE PrimitiveToNumber(py)
    IN IF IsNumber(nx) /\ IsNumber(ny) THEN NumLessResult(nx.value, ny.value)
       ELSE IF IsBigInt(nx) /\ IsBigInt(ny) THEN Bool(BigIntLess(nx.value, ny.value))
       ELSE IF IsBigInt(nx) THEN BigIntLessNumber(nx.value, ny.value)
       ELSE NumberLessBigInt(nx.value, ny.value)

IsLessThan(s, x, y, leftFirst) ==
  LET first == ToPrimitive(s, IF leftFirst THEN x ELSE y, "number") IN
  IF IsAbrupt(first) THEN first ELSE
  LET second == ToPrimitive(first.s, IF leftFirst THEN y ELSE x, "number") IN
  IF IsAbrupt(second) THEN second ELSE
  LET px == IF leftFirst THEN Val(first) ELSE Val(second)
      py == IF leftFirst THEN Val(second) ELSE Val(first)
  IN IF (IsSymbol(px) \/ IsSymbol(py)) THEN ThrowTypeError(second.s)
     ELSE Ok(second.s, IsLessThanPrimitive(px, py))

CodeUnitLess(a, b) == LexLess(a, b)

\* Operations on objects (§7.3).
Get(s, v, k) == GetV(s, v, k, v)

\* GetV (§7.3.3) on any value, which reads a primitive's property from its prototype.
GetValueProperty(s, v, k) ==
  IF IsObject(v) THEN GetV(s, v, k, v)
  ELSE LET o == ToObject(s, v) IN
       IF IsAbrupt(o) THEN o ELSE GetV(o.s, Val(o), k, v)

GetMethod(s, v, k) ==
  LET f == GetValueProperty(s, v, k) IN
  IF IsAbrupt(f) THEN f
  ELSE IF IsNullish(Val(f)) THEN Ok(f.s, Undefined)
  ELSE IF ~IsCallable(f.s, Val(f)) THEN ThrowTypeError(f.s)
  ELSE f

Set(s, v, k, value, throw) ==
  LET r == SetV(s, v, k, value, v) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = False /\ throw THEN ThrowTypeError(r.s)
  ELSE Ok(r.s, Undefined)

CreateDataProperty(s, v, k, value) ==
  DefineOwnProperty(s, v, k, DataDesc(value, TRUE, TRUE, TRUE))

CreateDataPropertyOrThrow(s, v, k, value) ==
  LET r == CreateDataProperty(s, v, k, value) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = False THEN ThrowTypeError(r.s)
  ELSE Ok(r.s, True)

\* CreateNonEnumerableDataPropertyOrThrow (§7.3.8).
CreateMethodProperty(s, v, k, value) ==
  DefinePropertyOrThrow(s, v, k, DataDesc(value, TRUE, FALSE, TRUE))

DefinePropertyOrThrow(s, v, k, d) ==
  LET r == DefineOwnProperty(s, v, k, d) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = False THEN ThrowTypeError(r.s)
  ELSE Ok(r.s, True)

DeletePropertyOrThrow(s, v, k) ==
  LET r == Delete(s, v, k) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = False THEN ThrowTypeError(r.s)
  ELSE Ok(r.s, True)

HasOwnProperty(s, v, k) ==
  LET r == GetOwnProperty(s, v, k) IN
  IF IsAbrupt(r) THEN r ELSE Ok(r.s, Bool(Val(r) # Absent))

\* Call (§7.3.14) and Construct (§7.3.15).
Call(s, f, this, args) ==
  IF ~IsCallable(s, f) THEN ThrowTypeError(s)
  ELSE CallObject(s, f, this, args)

Construct(s, f, args, newTarget) == ConstructObject(s, f, args, newTarget)

\* SetIntegrityLevel (§7.3.16) and TestIntegrityLevel (§7.3.17).
SetIntegrityLevel(s, v, level) ==
  LET p == PreventExtensions(s, v) IN
  IF IsAbrupt(p) THEN p
  ELSE IF Val(p) = False THEN Ok(p.s, False)
  ELSE LET ks == OwnPropertyKeys(p.s, v) IN
  IF IsAbrupt(ks) THEN ks
  ELSE LET r == SetIntegrityKeys(ks.s, v, Val(ks), level) IN
       IF IsAbrupt(r) THEN r ELSE Ok(r.s, True)
SetIntegrityKeys(s, v, ks, level) ==
  IF ks = <<>> THEN Ok(s, True)
  ELSE LET k == Head(ks)
           r == IF level = "sealed"
                THEN DefinePropertyOrThrow(s, v, k, [EmptyDesc EXCEPT !.configurable = False])
                ELSE LET cur == GetOwnProperty(s, v, k) IN
                     IF IsAbrupt(cur) THEN cur
                     ELSE IF Val(cur) = Absent THEN Ok(cur.s, True)
                     ELSE DefinePropertyOrThrow(cur.s, v, k,
                            IF IsAccessorDescriptor(Val(cur))
                            THEN [EmptyDesc EXCEPT !.configurable = False]
                            ELSE [EmptyDesc EXCEPT !.configurable = False, !.writable = False])
       IN IF IsAbrupt(r) THEN r ELSE SetIntegrityKeys(r.s, v, Tail(ks), level)

TestIntegrityLevel(s, v, level) ==
  LET e == IsExtensible(s, v) IN
  IF IsAbrupt(e) THEN e
  ELSE IF Val(e) = True THEN Ok(e.s, False)
  ELSE LET ks == OwnPropertyKeys(e.s, v) IN
  IF IsAbrupt(ks) THEN ks ELSE TestIntegrityKeys(ks.s, v, Val(ks), level)
TestIntegrityKeys(s, v, ks, level) ==
  IF ks = <<>> THEN Ok(s, True)
  ELSE LET cur == GetOwnProperty(s, v, Head(ks)) IN
       IF IsAbrupt(cur) THEN cur
       ELSE LET d == Val(cur) IN
       IF d # Absent /\ (d.configurable = True \/
                          (level = "frozen" /\ IsDataDescriptor(d) /\ d.writable = True))
       THEN Ok(cur.s, False)
       ELSE TestIntegrityKeys(cur.s, v, Tail(ks), level)

\* CreateArrayFromList (§7.3.18).
CreateArrayFromList(s, values) ==
  LET a == ArrayCreate(s, 0, Intrinsic(s, "ArrayPrototype")) IN
  LET o == O(a.s, Val(a)) IN
  Ok(SetO(a.s, Val(a),
          [AddIndexProps(o, values, 1) EXCEPT !.props[NamedBucket][SV("length")].value = IntV(Len(values))]),
     Val(a))
AddIndexProps(o, values, i) ==
  IF i > Len(values) THEN o
  ELSE AddIndexProps(PutProp(o, Str(NumToString(NumFromInt(i - 1))),
                             DataDesc(values[i], TRUE, TRUE, TRUE)), values, i + 1)

\* ArrayCreate (§10.4.2.2) with a length that fits a TLA+ integer.
ArrayCreate(s, length, proto) ==
  LET o == PutProp(MakeObject(proto, "array", [none |-> TRUE]), SV("length"),
                   DataDesc(IntV(length), TRUE, FALSE, FALSE))
      a == Alloc(s, o)
  IN Ok(a.s, a.v)

\* LengthOfArrayLike (§7.3.19).
LengthOfArrayLike(s, v) ==
  LET l == Get(s, v, SV("length")) IN
  IF IsAbrupt(l) THEN l ELSE ToLength(l.s, Val(l))

\* CreateListFromArrayLike (§7.3.20).
CreateListFromArrayLike(s, v, types) ==
  IF ~IsObject(v) THEN ThrowTypeError(s)
  ELSE LET l == LengthOfArrayLike(s, v) IN
  IF IsAbrupt(l) THEN l
  ELSE IF NumLess(NumFromInt(10000000), Val(l).value) THEN ThrowError(l.s, "RangeError")
  ELSE ListFromArrayLike(l.s, v, NumToSmallInt(Val(l).value), 0, <<>>, types)
ListFromArrayLike(s, v, n, i, acc, types) ==
  IF i = n THEN Ok(s, acc)
  ELSE LET e == Get(s, v, Str(NumToString(NumFromInt(i)))) IN
       IF IsAbrupt(e) THEN e
       ELSE IF types = "property-key" /\ ~IsPropertyKey(Val(e)) THEN ThrowTypeError(e.s)
       ELSE ListFromArrayLike(e.s, v, n, i + 1, Append(acc, Val(e)), types)

\* Invoke (§7.3.21).
Invoke(s, v, k, args) ==
  LET f == GetValueProperty(s, v, k) IN
  IF IsAbrupt(f) THEN f ELSE Call(f.s, Val(f), v, args)

\* OrdinaryHasInstance (§7.3.22).
OrdinaryHasInstance(s, c, v) ==
  IF ~IsCallable(s, c) THEN Ok(s, False)
  ELSE IF O(s, c).class = "bound" THEN InstanceofOperator(s, v, O(s, c).slots.target)
  ELSE IF ~IsObject(v) THEN Ok(s, False)
  ELSE LET p == Get(s, c, SV("prototype")) IN
  IF IsAbrupt(p) THEN p
  ELSE IF ~IsObject(Val(p)) THEN ThrowTypeError(p.s)
  ELSE PrototypeWalk(p.s, v, Val(p))
PrototypeWalk(s, v, proto) ==
  LET r == GetPrototypeOf(s, v) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = Null THEN Ok(r.s, False)
  ELSE IF SameValue(Val(r), proto) THEN Ok(r.s, True)
  ELSE PrototypeWalk(r.s, Val(r), proto)

\* SpeciesConstructor (§7.3.23).
SpeciesConstructor(s, v, default) ==
  LET c == Get(s, v, SV("constructor")) IN
  IF IsAbrupt(c) THEN c
  ELSE IF Val(c) = Undefined THEN Ok(c.s, default)
  ELSE IF ~IsObject(Val(c)) THEN ThrowTypeError(c.s)
  ELSE LET sp == Get(c.s, Val(c), SymSpecies) IN
  IF IsAbrupt(sp) THEN sp
  ELSE IF IsNullish(Val(sp)) THEN Ok(sp.s, default)
  ELSE IF IsConstructor(sp.s, Val(sp)) THEN sp
  ELSE ThrowTypeError(sp.s)

\* EnumerableOwnProperties (§7.3.24) with kind "key", "value", or "key+value".
EnumerableOwnProperties(s, v, kind) ==
  LET ks == OwnPropertyKeys(s, v) IN
  IF IsAbrupt(ks) THEN ks ELSE EnumerableOwnKeys(ks.s, v, SelectSeq(Val(ks), IsString), kind, <<>>)
EnumerableOwnKeys(s, v, ks, kind, acc) ==
  IF ks = <<>> THEN Ok(s, acc)
  ELSE LET k == Head(ks)
           d == GetOwnProperty(s, v, k)
       IN IF IsAbrupt(d) THEN d
          ELSE IF Val(d) = Absent \/ Val(d).enumerable # True
          THEN EnumerableOwnKeys(d.s, v, Tail(ks), kind, acc)
          ELSE IF kind = "key" THEN EnumerableOwnKeys(d.s, v, Tail(ks), kind, Append(acc, k))
          ELSE LET value == Get(d.s, v, k) IN
          IF IsAbrupt(value) THEN value
          ELSE IF kind = "value" THEN EnumerableOwnKeys(value.s, v, Tail(ks), kind, Append(acc, Val(value)))
          ELSE IF kind = "pair" THEN EnumerableOwnKeys(value.s, v, Tail(ks), kind, Append(acc, <<k, Val(value)>>))
          ELSE LET entry == CreateArrayFromList(value.s, <<k, Val(value)>>) IN
               EnumerableOwnKeys(entry.s, v, Tail(ks), kind, Append(acc, Val(entry)))

\* GetFunctionRealm (§7.3.25): the index of the realm of function object f.
GetFunctionRealm(s, f) ==
  LET o == O(s, f) IN
  CASE o.class \in {"builtin", "function", "wrapped"} -> Ok(s, o.slots.realm)
    [] o.class = "bound" -> GetFunctionRealm(s, o.slots.target)
    [] o.class = "proxy" -> IF o.slots.handler = Null THEN ThrowTypeError(s) ELSE GetFunctionRealm(s, o.slots.target)
    [] OTHER -> Ok(s, s.realmId)

\* GetPrototypeFromConstructor (§10.1.14).
GetPrototypeFromConstructor(s, c, default) ==
  LET p == Get(s, c, SV("prototype")) IN
  IF IsAbrupt(p) THEN p
  ELSE IF IsObject(Val(p)) THEN p
  ELSE LET realm == GetFunctionRealm(p.s, c) IN
       IF IsAbrupt(realm) THEN realm ELSE Ok(realm.s, Obj(realm.s.realms[Val(realm)].intrinsics[default]))

\* OrdinaryCreateFromConstructor (§10.1.13).
OrdinaryCreateFromConstructor(s, c, default, class, slots) ==
  LET p == GetPrototypeFromConstructor(s, c, default) IN
  IF IsAbrupt(p) THEN p
  ELSE LET a == Alloc(p.s, MakeObject(Val(p), class, slots)) IN Ok(a.s, a.v)

OrdinaryObjectCreate(s, proto) ==
  LET a == Alloc(s, MakeObject(proto, "ordinary", [none |-> TRUE])) IN Ok(a.s, a.v)

\* ToPropertyDescriptor (§6.2.6.5) and FromPropertyDescriptor (§6.2.6.4).
ToPropertyDescriptor(s, v) ==
  IF ~IsObject(v) THEN ThrowTypeError(s)
  ELSE LET r == ReadDescriptorFields(s, v, <<"enumerable", "configurable", "value", "writable", "get", "set">>, EmptyDesc) IN
  IF IsAbrupt(r) THEN r
  ELSE LET d == Val(r) IN
  IF (d.get # Absent /\ d.get # Undefined /\ ~IsCallable(r.s, d.get)) \/
     (d.set # Absent /\ d.set # Undefined /\ ~IsCallable(r.s, d.set))
  THEN ThrowTypeError(r.s)
  ELSE IF (d.get # Absent \/ d.set # Absent) /\ (d.value # Absent \/ d.writable # Absent)
  THEN ThrowTypeError(r.s)
  ELSE r
ReadDescriptorFields(s, v, fields, d) ==
  IF fields = <<>> THEN Ok(s, d)
  ELSE LET f == Head(fields)
           h == HasProperty(s, v, DescriptorKey(f))
       IN IF IsAbrupt(h) THEN h
          ELSE IF Val(h) = False THEN ReadDescriptorFields(h.s, v, Tail(fields), d)
          ELSE LET g == Get(h.s, v, DescriptorKey(f)) IN
          IF IsAbrupt(g) THEN g
          ELSE ReadDescriptorFields(g.s, v, Tail(fields),
                 [d EXCEPT ![f] = IF f \in {"enumerable", "configurable", "writable"}
                                  THEN ToBoolean(Val(g)) ELSE Val(g)])

\* The property key of a descriptor field.
DescriptorKey(f) ==
  CASE f = "value" -> SV("value") [] f = "writable" -> SV("writable") [] f = "get" -> SV("get")
    [] f = "set" -> SV("set") [] f = "enumerable" -> SV("enumerable") [] f = "configurable" -> SV("configurable")

FromPropertyDescriptor(s, d) ==
  IF d = Absent THEN Ok(s, Undefined)
  ELSE
    LET fields == SelectSeq(<<"value", "writable", "get", "set", "enumerable", "configurable">>,
                            LAMBDA f : d[f] # Absent)
        o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
    IN Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), [i \in DOMAIN fields |-> <<DescriptorKey(fields[i]), d[fields[i]]>>])),
          Val(o))

\* CompletePropertyDescriptor (§6.2.6.6).
CompletePropertyDescriptor(d) ==
  IF IsGenericDescriptor(d) \/ IsDataDescriptor(d)
  THEN [d EXCEPT !.value = IF @ = Absent THEN Undefined ELSE @,
                 !.writable = IF @ = Absent THEN False ELSE @,
                 !.enumerable = IF @ = Absent THEN False ELSE @,
                 !.configurable = IF @ = Absent THEN False ELSE @]
  ELSE [d EXCEPT !.get = IF @ = Absent THEN Undefined ELSE @,
                 !.set = IF @ = Absent THEN Undefined ELSE @,
                 !.enumerable = IF @ = Absent THEN False ELSE @,
                 !.configurable = IF @ = Absent THEN False ELSE @]
