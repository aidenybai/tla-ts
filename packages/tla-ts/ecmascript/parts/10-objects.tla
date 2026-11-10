\* Objects (§6.1.7, §10.1). The state's objs holds each object as a record:
\*   proto  the [[Prototype]], an object value or Null
\*   ext    [[Extensible]]
\*   props  the property descriptors by key, in buckets (see PropBucket)
\*   keys   the keys in NamedBucket, in the order they were added
\*   class  what kind of object it is, which picks its internal methods
\*   slots  its other internal slots, by class
\* A descriptor always has all six fields, each a value or Absent (§6.2.6).
O(s, v) == HeapGet(s.objs, v.id)
SetO(s, v, o) == [s EXCEPT !.objs = HeapSet(@, v.id, o)]

DataDesc(v, w, e, c) ==
  [value |-> v, writable |-> Bool(w), get |-> Absent, set |-> Absent,
   enumerable |-> Bool(e), configurable |-> Bool(c)]
AccessorDesc(g, st, e, c) ==
  [value |-> Absent, writable |-> Absent, get |-> g, set |-> st,
   enumerable |-> Bool(e), configurable |-> Bool(c)]
EmptyDesc ==
  [value |-> Absent, writable |-> Absent, get |-> Absent, set |-> Absent,
   enumerable |-> Absent, configurable |-> Absent]
IsAccessorDescriptor(d) == d.get # Absent \/ d.set # Absent
IsDataDescriptor(d) == d.value # Absent \/ d.writable # Absent
IsGenericDescriptor(d) == ~IsAccessorDescriptor(d) /\ ~IsDataDescriptor(d)
Truthy(b) == b = True

MakeObject(proto, class, slots) ==
  [proto |-> proto, ext |-> TRUE, props |-> <<>>, keys |-> <<>>, class |-> class, slots |-> slots,
   privs |-> <<>>]

\* Allocates an object, and returns the new state and the object.
Alloc(s, o) == [s |-> [s EXCEPT !.objs = HeapAppend(@, o), !.envsHeld = s.envs.size], v |-> Obj(s.objs.size + 1)]

\* props maps a bucket to a function from key to descriptor. An array index i is in bucket
\* i \div 100, which its digits but the last two give, and every other key in NamedBucket, so that
\* adding a property copies its bucket and the list of buckets rather than every property.
NamedBucket == -1
UnitsValue(units) == IF units = <<>> THEN 0 ELSE UnitsValue(SubSeq(units, 1, Len(units) - 1)) * 10 + units[Len(units)] - 48
PropBucket(k) ==
  CASE ~IsArrayIndex(k) -> NamedBucket
    [] Len(k.value) <= 2 -> 0
    [] OTHER -> UnitsValue(SubSeq(k.value, 1, Len(k.value) - 2))
HasProp(o, k) == PropBucket(k) \in DOMAIN o.props /\ k \in DOMAIN o.props[PropBucket(k)]

\* An object with the given own data properties, each <<key, value>>, writable, enumerable, and
\* configurable.
WithDataProps(o, pairs) ==
  IF pairs = <<>> THEN o
  ELSE WithDataProps(PutProp(o, Head(pairs)[1], DataDesc(Head(pairs)[2], TRUE, TRUE, TRUE)), Tail(pairs))

\* Writes a descriptor for a key, keeping the order the keys were first added in.
PutProp(o, k, d) ==
  LET b == PropBucket(k)
      keys == IF b = NamedBucket THEN Append(o.keys, k) ELSE o.keys
  IN CASE b \notin DOMAIN o.props -> [o EXCEPT !.props = (b :> (k :> d)) @@ @, !.keys = keys]
       [] k \notin DOMAIN o.props[b] -> [o EXCEPT !.props[b] = (k :> d) @@ @, !.keys = keys]
       [] OTHER -> [o EXCEPT !.props[b][k] = d]
DropProp(o, k) ==
  IF ~HasProp(o, k) THEN o
  ELSE LET b == PropBucket(k) IN
       [o EXCEPT !.props[b] = [x \in DOMAIN @ \ {k} |-> @[x]],
                 !.keys = IF b = NamedBucket THEN Remove(@, k) ELSE @]

\* Array indices (§6.1.7): canonical decimal strings of integers below 2^32 - 1.
IsDigit(u) == u >= 48 /\ u <= 57
DigitsBelow(units, limit) ==
  Len(units) < Len(limit) \/
  (Len(units) = Len(limit) /\ LexLess(units, limit))
LexLess(a, b) ==
  IF a = <<>> THEN b # <<>>
  ELSE IF b = <<>> THEN FALSE
  ELSE IF Head(a) # Head(b) THEN Head(a) < Head(b) ELSE LexLess(Tail(a), Tail(b))
IsArrayIndexUnits(units) ==
  /\ units # <<>>
  /\ \A i \in DOMAIN units : IsDigit(units[i])
  /\ (units = <<48>> \/ units[1] # 48)
  /\ DigitsBelow(units, N("4294967295"))
IsArrayIndex(k) == IsString(k) /\ IsArrayIndexUnits(k.value)
\* The order of OrdinaryOwnPropertyKeys: indices ascending, then strings, then symbols, each in the
\* order added.
IndexLess(a, b) == DigitsBelow(a.value, b.value)
SortInts(set) ==
  IF set = {} THEN <<>>
  ELSE LET least == CHOOSE x \in set : \A y \in set : x <= y IN <<least>> \o SortInts(set \ {least})
\* The indices of bucket b in ascending order, as the hundred keys it may hold.
BucketIndexKeys(bucket, b) ==
  LET prefix == IF b = 0 THEN <<>> ELSE NumToString(NumFromInt(b))
      candidates == [i \in 1..100 |-> Str(IF b = 0 /\ i <= 10 THEN <<47 + i>>
                                           ELSE prefix \o <<48 + ((i - 1) \div 10), 48 + ((i - 1) % 10)>>)]
  IN SelectSeq(candidates, LAMBDA k : k \in DOMAIN bucket)
OwnIndexKeys(o) == ConcatMap(SortInts(DOMAIN o.props \ {NamedBucket}), LAMBDA b : BucketIndexKeys(o.props[b], b))
OwnKeysOf(o) == OwnIndexKeys(o) \o SelectSeq(o.keys, IsString) \o SelectSeq(o.keys, IsSymbol)

\* Ordinary internal methods (§10.1).
OrdinaryGetOwnProperty(o, k) == IF HasProp(o, k) THEN o.props[PropBucket(k)][k] ELSE Absent

\* ValidateAndApplyPropertyDescriptor (§10.1.6.3), on the object record o with the current
\* descriptor of k, returning [ok, o].
ValidateAndApply(o, k, extensible, d, current) ==
  IF current = Absent THEN
    IF ~extensible THEN [ok |-> FALSE, o |-> o]
    ELSE [ok |-> TRUE, o |->
           PutProp(o, k,
             IF IsAccessorDescriptor(d)
             THEN AccessorDesc(IF d.get = Absent THEN Undefined ELSE d.get,
                               IF d.set = Absent THEN Undefined ELSE d.set,
                               Truthy(d.enumerable), Truthy(d.configurable))
             ELSE DataDesc(IF d.value = Absent THEN Undefined ELSE d.value,
                           Truthy(d.writable), Truthy(d.enumerable), Truthy(d.configurable)))]
  ELSE IF IsGenericDescriptor(d) /\ d.enumerable = Absent /\ d.configurable = Absent
    THEN [ok |-> TRUE, o |-> o]
  ELSE IF current.configurable = False /\
          (d.configurable = True \/
           (d.enumerable # Absent /\ d.enumerable # current.enumerable) \/
           (~IsGenericDescriptor(d) /\ IsAccessorDescriptor(d) # IsAccessorDescriptor(current)) \/
           (IsAccessorDescriptor(current) /\
              ((d.get # Absent /\ ~SameValue(d.get, current.get)) \/
               (d.set # Absent /\ ~SameValue(d.set, current.set)))) \/
           (IsDataDescriptor(current) /\ current.writable = False /\
              (d.writable = True \/ (d.value # Absent /\ ~SameValue(d.value, current.value)))))
    THEN [ok |-> FALSE, o |-> o]
  ELSE
    LET base ==
          IF IsDataDescriptor(current) /\ IsAccessorDescriptor(d)
          THEN AccessorDesc(Undefined, Undefined, Truthy(current.enumerable), Truthy(current.configurable))
          ELSE IF IsAccessorDescriptor(current) /\ IsDataDescriptor(d)
          THEN DataDesc(Undefined, FALSE, Truthy(current.enumerable), Truthy(current.configurable))
          ELSE current
        merged ==
          [f \in DOMAIN base |-> IF d[f] # Absent THEN d[f] ELSE base[f]]
    IN [ok |-> TRUE, o |-> PutProp(o, k, merged)]

OrdinaryDefineOwnProperty(s, v, k, d) ==
  LET o == O(s, v)
      r == ValidateAndApply(o, k, o.ext, d, OrdinaryGetOwnProperty(o, k))
  IN Ok(SetO(s, v, r.o), Bool(r.ok))

\* The exotic objects' internal methods, chosen by class. Each returns a result [s, c].
GetPrototypeOf(s, v) ==
  IF O(s, v).class = "proxy" THEN ProxyGetPrototypeOf(s, v) ELSE Ok(s, O(s, v).proto)

SetPrototypeOf(s, v, proto) ==
  LET o == O(s, v) IN
  IF o.class = "proxy" THEN ProxySetPrototypeOf(s, v, proto)
  ELSE IF SameValue(proto, o.proto) THEN Ok(s, True)
  ELSE IF ~o.ext \/ o.class = "immutableProto" THEN Ok(s, False)
  ELSE IF PrototypeChainHas(s, proto, v) THEN Ok(s, False)
  ELSE Ok(SetO(s, v, [o EXCEPT !.proto = proto]), True)

\* Whether setting v's prototype to proto would make a cycle (§10.1.2.1 step 8).
PrototypeChainHas(s, p, v) ==
  IF p = Null THEN FALSE
  ELSE IF SameValue(p, v) THEN TRUE
  ELSE IF O(s, p).class = "proxy" THEN FALSE
  ELSE PrototypeChainHas(s, O(s, p).proto, v)

IsExtensible(s, v) ==
  IF O(s, v).class = "proxy" THEN ProxyIsExtensible(s, v) ELSE Ok(s, Bool(O(s, v).ext))

PreventExtensions(s, v) ==
  LET o == O(s, v) IN
  IF o.class = "proxy" THEN ProxyPreventExtensions(s, v)
  ELSE IF o.class = "typedArray" /\ ~IsFixedLengthTypedArray(s, v) THEN Ok(s, False)
  ELSE Ok(SetO(s, v, [o EXCEPT !.ext = FALSE]), True)

GetOwnProperty(s, v, k) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyGetOwnProperty(s, v, k)
    [] o.class = "string" -> Ok(s, StringGetOwnProperty(o, k))
    [] o.class = "arguments" -> Ok(s, ArgumentsGetOwnProperty(s, v, k))
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) -> Ok(s, TypedArrayGetOwnProperty(s, v, k))
    [] o.class = "namespace" -> NamespaceGetOwnProperty(s, v, k)
    [] OTHER -> Ok(s, OrdinaryGetOwnProperty(o, k))

DefineOwnProperty(s, v, k, d) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyDefineOwnProperty(s, v, k, d)
    [] o.class = "array" -> ArrayDefineOwnProperty(s, v, k, d)
    [] o.class = "string" -> StringDefineOwnProperty(s, v, k, d)
    [] o.class = "arguments" -> ArgumentsDefineOwnProperty(s, v, k, d)
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) -> TypedArrayDefineOwnProperty(s, v, k, d)
    [] o.class = "namespace" -> NamespaceDefineOwnProperty(s, v, k, d)
    [] OTHER -> OrdinaryDefineOwnProperty(s, v, k, d)

HasProperty(s, v, k) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyHasProperty(s, v, k)
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) -> Ok(s, Bool(IsValidIntegerIndex(s, v, CanonicalIndex(k))))
    [] o.class = "namespace" /\ ~IsSymbolLikeNamespaceKey(s, v, k) -> NamespaceHasProperty(s, v, k)
    [] OTHER -> OrdinaryHasProperty(s, v, k)

OrdinaryHasProperty(s, v, k) ==
  LET r == GetOwnProperty(s, v, k) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) # Absent THEN Ok(r.s, True)
  ELSE LET p == GetPrototypeOf(r.s, v) IN
       IF IsAbrupt(p) THEN p
       ELSE IF Val(p) = Null THEN Ok(p.s, False)
       ELSE HasProperty(p.s, Val(p), k)

GetV(s, v, k, receiver) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyGet(s, v, k, receiver)
    [] o.class = "arguments" -> ArgumentsGet(s, v, k, receiver)
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) -> Ok(s, TypedArrayGetElement(s, v, CanonicalIndex(k)))
    [] o.class = "namespace" /\ ~IsSymbolLikeNamespaceKey(s, v, k) -> NamespaceGet(s, v, k)
    [] OTHER -> OrdinaryGet(s, v, k, receiver)

OrdinaryGet(s, v, k, receiver) ==
  LET r == GetOwnProperty(s, v, k) IN
  IF IsAbrupt(r) THEN r
  ELSE LET d == Val(r) IN
  IF d = Absent THEN
    LET p == GetPrototypeOf(r.s, v) IN
    IF IsAbrupt(p) THEN p
    ELSE IF Val(p) = Null THEN Ok(p.s, Undefined)
    ELSE GetV(p.s, Val(p), k, receiver)
  ELSE IF IsDataDescriptor(d) THEN Ok(r.s, d.value)
  ELSE IF d.get = Undefined THEN Ok(r.s, Undefined)
  ELSE Call(r.s, d.get, receiver, <<>>)

SetV(s, v, k, value, receiver) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxySet(s, v, k, value, receiver)
    [] o.class = "arguments" -> ArgumentsSet(s, v, k, value, receiver)
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) -> TypedArraySet(s, v, k, value, receiver)
    [] o.class = "namespace" -> Ok(s, False)
    [] OTHER -> OrdinarySet(s, v, k, value, receiver)

OrdinarySet(s, v, k, value, receiver) ==
  LET r == GetOwnProperty(s, v, k) IN
  IF IsAbrupt(r) THEN r ELSE OrdinarySetWithOwnDescriptor(r.s, v, k, value, receiver, Val(r))

OrdinarySetWithOwnDescriptor(s, v, k, value, receiver, own) ==
  IF own = Absent THEN
    LET p == GetPrototypeOf(s, v) IN
    IF IsAbrupt(p) THEN p
    ELSE IF Val(p) # Null THEN SetV(p.s, Val(p), k, value, receiver)
    ELSE OrdinarySetWithOwnDescriptor(p.s, v, k, value, receiver,
                                      DataDesc(Undefined, TRUE, TRUE, TRUE))
  ELSE IF IsDataDescriptor(own) THEN
    IF own.writable = False THEN Ok(s, False)
    ELSE IF ~IsObject(receiver) THEN Ok(s, False)
    ELSE LET er == GetOwnProperty(s, receiver, k) IN
         IF IsAbrupt(er) THEN er
         ELSE LET existing == Val(er) IN
         IF existing # Absent THEN
           IF IsAccessorDescriptor(existing) \/ existing.writable = False THEN Ok(er.s, False)
           ELSE DefineOwnProperty(er.s, receiver, k, [EmptyDesc EXCEPT !.value = value])
         ELSE CreateDataProperty(er.s, receiver, k, value)
  ELSE IF own.set = Undefined THEN Ok(s, False)
  ELSE LET c == Call(s, own.set, receiver, <<value>>) IN
       IF IsAbrupt(c) THEN c ELSE Ok(c.s, True)

Delete(s, v, k) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyDelete(s, v, k)
    [] o.class = "arguments" -> ArgumentsDelete(s, v, k)
    [] o.class = "typedArray" /\ IsTypedArrayKey(k) ->
         Ok(s, Bool(~IsValidIntegerIndex(s, v, CanonicalIndex(k))))
    [] o.class = "namespace" /\ ~IsSymbolLikeNamespaceKey(s, v, k) -> NamespaceDelete(s, v, k)
    [] OTHER -> OrdinaryDelete(s, v, k)

OrdinaryDelete(s, v, k) ==
  LET r == GetOwnProperty(s, v, k) IN
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = Absent THEN Ok(r.s, True)
  ELSE IF Val(r).configurable = True THEN Ok(SetO(r.s, v, DropProp(O(r.s, v), k)), True)
  ELSE Ok(r.s, False)

OwnPropertyKeys(s, v) ==
  LET o == O(s, v) IN
  CASE o.class = "proxy" -> ProxyOwnPropertyKeys(s, v)
    [] o.class = "string" -> Ok(s, StringOwnPropertyKeys(o))
    [] o.class = "typedArray" -> Ok(s, TypedArrayOwnPropertyKeys(s, v))
    [] o.class = "namespace" -> NamespaceOwnPropertyKeys(s, v)
    [] OTHER -> Ok(s, OwnKeysOf(o))

\* Array exotic objects (§10.4.2).
ArrayDefineOwnProperty(s, v, k, d) ==
  IF k = SV("length") THEN ArraySetLength(s, v, d)
  ELSE IF IsArrayIndex(k) THEN
    LET o == O(s, v)
        lengthDesc == OrdinaryGetOwnProperty(o, SV("length"))
        index == StrToNum(k.value)
        length == lengthDesc.value.value
    IN IF ~NumLess(index, length) /\ lengthDesc.writable = False THEN Ok(s, False)
       ELSE LET r == OrdinaryDefineOwnProperty(s, v, k, d) IN
       IF Val(r) = False THEN r
       ELSE IF ~NumLess(index, length)
       THEN Ok(SetO(r.s, v, [O(r.s, v) EXCEPT !.props[NamedBucket][SV("length")].value =
                               Num(NumAdd(index, NumFromInt(1)))]), True)
       ELSE r
  ELSE OrdinaryDefineOwnProperty(s, v, k, d)

\* ArraySetLength (§10.4.2.4).
ArraySetLength(s, v, d) ==
  IF d.value = Absent THEN OrdinaryDefineOwnProperty(s, v, SV("length"), d)
  ELSE
    LET u == ToUint32(s, d.value) IN
    IF IsAbrupt(u) THEN u ELSE
    LET n == ToNumber(u.s, d.value) IN
    IF IsAbrupt(n) THEN n ELSE
    IF ~NumSameValueZero(Val(u).value, Val(n).value) THEN ThrowError(n.s, "RangeError")
    ELSE
      LET s2 == n.s
          newLen == Val(u).value
          o == O(s2, v)
          oldDesc == OrdinaryGetOwnProperty(o, SV("length"))
          oldLen == oldDesc.value.value
          newDesc == [d EXCEPT !.value = Num(newLen)]
      IN IF ~NumLess(newLen, oldLen) THEN OrdinaryDefineOwnProperty(s2, v, SV("length"), newDesc)
         ELSE IF oldDesc.writable = False THEN Ok(s2, False)
         ELSE
           LET newWritable == newDesc.writable # False
               defined == OrdinaryDefineOwnProperty(s2, v, SV("length"),
                                                    IF newWritable THEN newDesc ELSE [newDesc EXCEPT !.writable = True])
           IN IF Val(defined) = False THEN defined
              ELSE
                LET defO == O(defined.s, v)
                    \* Delete indices from the end down to newLen, stopping at a non-configurable one.
                    indices == SelectSeq(OwnIndexKeys(defO), LAMBDA k : ~NumLess(StrToNum(k.value), newLen))
                    cut == ArrayDeleteDown(defO, indices, Len(indices))
                    finalLen == IF cut.stopped = Absent THEN newLen
                                ELSE NumAdd(StrToNum(cut.stopped.value), NumFromInt(1))
                    finalO == [cut.o EXCEPT !.props[NamedBucket][SV("length")].value = Num(finalLen),
                                            !.props[NamedBucket][SV("length")].writable = Bool(newWritable)]
                IN Ok(SetO(defined.s, v, finalO), Bool(cut.stopped = Absent))

ArrayDeleteDown(o, indices, i) ==
  IF i = 0 THEN [o |-> o, stopped |-> Absent]
  ELSE LET k == indices[i] IN
       IF OrdinaryGetOwnProperty(o, k).configurable = False THEN [o |-> o, stopped |-> k]
       ELSE ArrayDeleteDown(DropProp(o, k), indices, i - 1)

\* String exotic objects (§10.4.3).
StringGetOwnProperty(o, k) ==
  LET own == OrdinaryGetOwnProperty(o, k) IN
  IF own # Absent THEN own ELSE StringGetOwnIndex(o, k)
StringGetOwnIndex(o, k) ==
  IF ~IsString(k) \/ ~IsCanonicalIntegerUnits(k.value) THEN Absent
  ELSE LET index == StrToNum(k.value) IN
       IF NumLess(index, NumFromInt(Len(o.slots.data))) /\ ~NumLess(index, NumFromInt(0)) /\
          index # NegZero
       THEN DataDesc(Str(<<o.slots.data[NumToSmallInt(index) + 1]>>), FALSE, TRUE, FALSE)
       ELSE Absent
\* CanonicalNumericIndexString for the integers a string index can be.
IsCanonicalIntegerUnits(units) ==
  /\ units # <<>>
  /\ \A i \in DOMAIN units : IsDigit(units[i])
  /\ (units = <<48>> \/ units[1] # 48)
StringDefineOwnProperty(s, v, k, d) ==
  LET current == StringGetOwnIndex(O(s, v), k) IN
  IF current # Absent
  THEN Ok(s, Bool(ValidateAndApply(O(s, v), k, FALSE, d, current).ok))
  ELSE OrdinaryDefineOwnProperty(s, v, k, d)
StringOwnPropertyKeys(o) ==
  LET n == Len(o.slots.data)
      indices == [i \in 1..n |-> Str(NumToString(NumFromInt(i - 1)))]
      own == OwnKeysOf(o)
  IN indices \o SelectSeq(own, LAMBDA k : ~(IsArrayIndex(k) /\ IndexLess(k, Str(NumToString(NumFromInt(n))))))
