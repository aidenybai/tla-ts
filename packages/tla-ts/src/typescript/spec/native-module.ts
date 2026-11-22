import { foldNames } from "./library";

// A lowered model's functions run on the lowered state itself where they can (see lowered.ts):
// each syntax node gives ESCore's evaluation rule for it, specialized to the lowered values its
// operands hold. A rule holds only where its operands are what it expects, such as an ordinary
// object's own data property or an index within an array, and gives LBail otherwise, which every
// later rule passes on, so that the call gives LBail and runs on ESCore instead, from the state it
// started in. A call gives [type |-> "ok", m, w, v]: the lowered state, whether it wrote what
// existed before it, as SetO and SetE tell ESCore's step, and the value it returns. A composite
// value that a call stores or passes is one that an object or array literal just made, and LBail
// otherwise, so that no two places hold one object.
export const NATIVE_MODULE = foldNames(String.raw`---- MODULE ESNative ----
EXTENDS ESRuntime
LBail == [type |-> "bail"]
IsLComposite(v) == v.type \in {"lobject", "larray", "lset", "lmap"}
LIsPrimitive(v) == v.type \in {"undefined", "null", "boolean", "number", "string"}
\* A value that a call stores or passes, which mustn't be an object the state holds.
LOwn(v) == IF IsLComposite(v) THEN LBail ELSE v
LTruthy(v) == IF IsLComposite(v) THEN TRUE ELSE ToBooleanValue(v)
LNot(v) == IF v.type = "bail" THEN v ELSE Bool(~LTruthy(v))
LValue(r) == IF r.type = "bail" THEN r ELSE r.v
LNumber(v) == v.type = "number"
\* [[Get]] of an own data property, an array's length, and the size of a Set or a Map.
LGet(v, k) ==
  CASE v.type = "lobject" -> IF k \in DOMAIN v.vals THEN v.vals[k] ELSE LBail
    [] v.type = "larray" /\ k = N("length") -> IntV(Len(v.elems))
    [] v.type = "lset" /\ k = N("size") -> IntV(Len(v.elems))
    [] v.type = "lmap" /\ k = N("size") -> IntV(Len(v.keys))
    [] OTHER -> LBail
LIsIndex(v, i, n) == i.type = "number" /\ i.value.k = "int" /\ i.value.i >= 0 /\ i.value.i < n
LIndex(v, i) ==
  CASE v.type = "larray" /\ LIsIndex(v, i, Len(v.elems)) -> v.elems[i.value.i + 1]
    [] v.type = "lobject" /\ i.type = "string" -> IF i.value \in DOMAIN v.vals THEN v.vals[i.value] ELSE LBail
    [] OTHER -> LBail
LArith(op, a, b) ==
  IF LNumber(a) /\ LNumber(b) THEN Num(NumberOperation(a.value, op, b.value))
  ELSE IF op = "+" /\ a.type = "string" /\ b.type = "string" THEN Str(a.value \o b.value)
  ELSE LBail
LRelation(op, a, b) == IF LNumber(a) /\ LNumber(b) THEN NumberRelation(a.value, op, b.value) ELSE LBail
LStrict(a, b) ==
  IF LIsPrimitive(a) /\ LIsPrimitive(b) THEN Bool(IsStrictlyEqual(a, b))
  ELSE IF (LIsPrimitive(a) /\ IsLComposite(b)) \/ (IsLComposite(a) /\ LIsPrimitive(b)) THEN False
  ELSE LBail
LLoose(a, b) ==
  IF LIsPrimitive(a) /\ LIsPrimitive(b) /\ a.type = b.type THEN Bool(IsStrictlyEqual(a, b))
  ELSE IF a.type \in {"undefined", "null"} /\ b.type \in {"undefined", "null"} THEN True
  ELSE LBail
LNegate(v) == IF LNumber(v) THEN Num(NumUnaryMinus(v.value)) ELSE LBail
LPlus(v) == IF LNumber(v) THEN v ELSE LBail
LIncrement(v, d) == IF LNumber(v) THEN Num(NumAdd(v.value, NumFromInt(d))) ELSE LBail
LEmptyObject == [type |-> "lobject", keys |-> <<>>, vals |-> <<>>]
\* CreateDataProperty on an ordinary object, which keeps a key where it was, or adds it last.
LPut(o, k, v) ==
  IF o.type # "lobject" \/ v.type = "bail" THEN LBail
  ELSE IF k \in DOMAIN o.vals THEN [o EXCEPT !.vals[k] = v]
  ELSE [o EXCEPT !.keys = Append(@, k), !.vals = @ @@ (k :> v)]
RECURSIVE LCopyKeys(_, _, _)
LCopyKeys(o, a, keys) == IF keys = <<>> THEN o ELSE LCopyKeys(LPut(o, Head(keys), LOwn(a.vals[Head(keys)])), a, Tail(keys))
\* CopyDataProperties from a primitive, which gives no keys but a string's, or from an object.
LSpread(o, a) ==
  CASE o.type # "lobject" -> LBail
    [] a.type \in {"undefined", "null", "boolean", "number"} -> o
    [] a.type = "lobject" /\ \A i \in DOMAIN a.keys : ~IsLComposite(a.vals[a.keys[i]]) ->
         IF o.keys = <<>> THEN a
         ELSE IF \E i \in DOMAIN a.keys : IsArrayIndexUnits(a.keys[i]) THEN LBail
         ELSE LCopyKeys(o, a, a.keys)
    [] OTHER -> LBail
LArray(list) == IF \E i \in DOMAIN list : list[i].type = "bail" THEN LBail ELSE [type |-> "larray", elems |-> list]
\* The elements that a spread of an array or a Set gives an array literal, in the order their
\* iterators give them, which must be primitives, or <<LBail>>.
LSpreadElems(v) ==
  IF v.type \in {"larray", "lset"} /\ \A i \in DOMAIN v.elems : ~IsLComposite(v.elems[i]) THEN v.elems
  ELSE <<LBail>>
\* PutValue of a property: an ordinary object's own data property or a new one that no prototype
\* sets, or an array's element within it or just after it.
LAssign(c, k, v) ==
  CASE v.type = "bail" -> LBail
    [] c.type = "lobject" /\ k.type = "string" ->
         IF k.value \in DOMAIN c.vals \/ (~IsArrayIndexUnits(k.value) /\ k.value # N("__proto__")) THEN LPut(c, k.value, v) ELSE LBail
    [] c.type = "larray" /\ LIsIndex(c, k, Len(c.elems) + 1) ->
         IF k.value.i = Len(c.elems) THEN [c EXCEPT !.elems = Append(@, v)] ELSE [c EXCEPT !.elems[k.value.i + 1] = v]
    [] OTHER -> LBail
\* Whether a method takes its argument at an index as a composite: push its elements, a Map's set
\* its value and a Set's add its element where the lowering knows the composite just made, which
\* the collection then owns, and is distinct from every element it holds.
LIsOwnedArgument(m, i) == m = "push" \/ (m = "setOwned" /\ i = 2) \/ m = "addOwned"
\* The built-in methods on a lowered receiver, as [c, v]: the receiver after the call and its result,
\* each LBail where the call bails.
LMethod(c, m, args) ==
  LET a == IF args = <<>> THEN Undefined ELSE args[1] IN
  CASE \E i \in DOMAIN args : args[i].type = "bail" \/ (IsLComposite(args[i]) /\ ~LIsOwnedArgument(m, i)) -> [c |-> LBail, v |-> LBail]
    [] c.type = "lset" /\ m = "addOwned" -> [c |-> [c EXCEPT !.elems = Append(@, a)], v |-> c]
    [] c.type = "larray" /\ m = "push" -> [c |-> [c EXCEPT !.elems = @ \o args], v |-> IntV(Len(c.elems) + Len(args))]
    [] c.type = "larray" /\ m = "pop" ->
         IF c.elems = <<>> THEN [c |-> c, v |-> Undefined] ELSE [c |-> [c EXCEPT !.elems = SubSeq(@, 1, Len(@) - 1)], v |-> c.elems[Len(c.elems)]]
    [] c.type = "larray" /\ m = "shift" ->
         IF c.elems = <<>> THEN [c |-> c, v |-> Undefined] ELSE [c |-> [c EXCEPT !.elems = Tail(@)], v |-> Head(c.elems)]
    [] c.type = "larray" /\ m = "includes" /\ Len(args) = 1 -> [c |-> c, v |-> Bool(KeyIndex(c.elems, a) # 0)]
    [] c.type = "lset" /\ m = "has" -> [c |-> c, v |-> Bool(KeyIndex(c.elems, a) # 0)]
    [] c.type = "lset" /\ m = "add" ->
         [c |-> IF KeyIndex(c.elems, a) # 0 THEN c ELSE [c EXCEPT !.elems = Append(@, CanonicalizeKeyedCollectionKey(a))], v |-> c]
    [] c.type = "lset" /\ m = "delete" ->
         LET i == KeyIndex(c.elems, a) IN
         IF i = 0 THEN [c |-> c, v |-> False]
         ELSE [c |-> [c EXCEPT !.elems = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@))], v |-> True]
    [] c.type = "lmap" /\ m = "has" -> [c |-> c, v |-> Bool(KeyIndex(c.keys, a) # 0)]
    [] c.type = "lmap" /\ m = "get" -> LET i == KeyIndex(c.keys, a) IN [c |-> c, v |-> IF i = 0 THEN Undefined ELSE c.vals[i]]
    [] c.type = "lmap" /\ m \in {"set", "setOwned"} ->
         LET i == KeyIndex(c.keys, a)
             value == IF Len(args) < 2 THEN Undefined ELSE args[2]
         IN [c |-> IF i # 0 THEN [c EXCEPT !.vals[i] = value]
                   ELSE [c EXCEPT !.keys = Append(@, CanonicalizeKeyedCollectionKey(a)), !.vals = Append(@, value)],
             v |-> c]
    [] c.type = "lmap" /\ m = "delete" ->
         LET i == KeyIndex(c.keys, a) IN
         IF i = 0 THEN [c |-> c, v |-> False]
         ELSE [c |-> [c EXCEPT !.keys = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@)),
                               !.vals = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@))], v |-> True]
    [] OTHER -> [c |-> LBail, v |-> LBail]
\* A callback's results on an array's elements and their indices, in order.
LResults(elems, F(_, _)) == [i \in DOMAIN elems |-> F(elems[i], IntV(i - 1))]
\* The index of the first result that bails or fails test, or 0, where the method that calls the
\* callback stops.
LFirst(rs, test(_)) ==
  LET stops == {i \in DOMAIN rs : rs[i].type = "bail" \/ ~test(rs[i])} IN
  IF stops = {} THEN 0 ELSE CHOOSE i \in stops : \A k \in stops : i <= k
\* Array.prototype.every and some, which stop at the first result that fails or passes.
LEvery(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LTruthy)
  IN IF i = 0 THEN True ELSE IF rs[i].type = "bail" THEN LBail ELSE False
LSome(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LAMBDA r : ~LTruthy(r))
  IN IF i = 0 THEN False ELSE IF rs[i].type = "bail" THEN LBail ELSE True
\* Array.prototype.map and filter, whose array ArraySpeciesCreate makes an array's constructor's.
\* filter's, as slice's, holds the elements of the array it's called on, which a store then owns.
LMap(c, F(_, _)) == IF c.type # "larray" THEN LBail ELSE LArray(LResults(c.elems, F))
LFilter(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F) IN
  IF \E i \in DOMAIN rs : rs[i].type = "bail" THEN LBail ELSE
  LET kept == SelectSeq([i \in DOMAIN rs |-> i], LAMBDA i : LTruthy(rs[i]))
  IN LArray([j \in DOMAIN kept |-> c.elems[kept[j]]])
\* An index of Array.prototype.slice, relative to the end where it's negative, or -1 where it
\* isn't an integer.
LRelative(v, n, default) ==
  CASE v.type = "undefined" -> default
    [] v.type = "number" /\ v.value.k = "int" ->
         IF v.value.i < 0 THEN (IF n + v.value.i < 0 THEN 0 ELSE n + v.value.i)
         ELSE IF v.value.i < n THEN v.value.i ELSE n
    [] OTHER -> -1
LSlice(c, start, end) ==
  IF c.type # "larray" THEN LBail ELSE
  LET n == Len(c.elems)
      k == LRelative(start, n, 0)
      f == LRelative(end, n, n)
  IN IF k < 0 \/ f < 0 THEN LBail
     ELSE LArray([j \in 1..(IF f > k THEN f - k ELSE 0) |-> c.elems[k + j]])
\* Array.prototype.with, a new array of an array's elements with one at an index, relative to the
\* end where it's negative, replaced: of primitives alone, so that no two arrays hold one object, and
\* LBail where the index isn't an integer or lies outside the array, where with throws.
LWith(c, i, v) ==
  IF c.type # "larray" \/ v.type = "bail" \/ IsLComposite(v) \/ ~(i.type = "number" /\ i.value.k = "int")
     \/ \E k \in DOMAIN c.elems : IsLComposite(c.elems[k]) THEN LBail
  ELSE LET n == Len(c.elems)
           k == IF i.value.i < 0 THEN n + i.value.i ELSE i.value.i
       IN IF k < 0 \/ k >= n THEN LBail ELSE LArray([c.elems EXCEPT ![k + 1] = v])
\* Array.prototype.sort of an array that nothing else holds, by the comparator a - b, b - a, or
\* none: of finite Numbers for a comparator and of strings for none, so that the comparator is
\* consistent and the stable sort that ES2019 makes it has one result, each element at the count of
\* those that sort before it. LBail for any other element, among them NaN, where a - b isn't
\* consistent.
LSortLess(order, a, b) ==
  CASE order = "ascending" -> NumCompare(a.value, b.value) < 0
    [] order = "descending" -> NumCompare(b.value, a.value) < 0
    [] OTHER -> LexLess(a.value, b.value)
LSortable(order, v) == IF order = "string" THEN v.type = "string" ELSE v.type = "number" /\ NumIsFinite(v.value)
LSort(c, order) ==
  IF c.type # "larray" \/ \E i \in DOMAIN c.elems : ~LSortable(order, c.elems[i]) THEN LBail
  ELSE LET e == c.elems
           rank(i) == Cardinality({j \in DOMAIN e : LSortLess(order, e[j], e[i]) \/ (j < i /\ ~LSortLess(order, e[i], e[j]))})
       IN LArray([k \in DOMAIN e |-> e[CHOOSE i \in DOMAIN e : rank(i) = k - 1]])
\* Array.from of an array-like object of a length alone, which reads undefined at each index.
LFrom(length, F(_, _)) ==
  IF length.type = "number" /\ length.value.k = "int" /\ length.value.i >= 0 /\ length.value.i <= 65536
  THEN LArray([i \in 1..length.value.i |-> F(Undefined, IntV(i - 1))])
  ELSE LBail
\* Array.prototype.find, and an iterator's find, which stops at the first result that passes.
LFind(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LAMBDA r : ~LTruthy(r))
  IN IF i = 0 THEN Undefined ELSE IF rs[i].type = "bail" THEN LBail ELSE c.elems[i]
\* The values that a Set's, an array's or a Map's values() iterator gives, and the keys that a Set's
\* or a Map's keys() iterator gives, as an array, which only iterator helpers and new Set read.
LValues(v) ==
  CASE v.type \in {"larray", "lset"} -> [type |-> "larray", elems |-> v.elems]
    [] v.type = "lmap" -> [type |-> "larray", elems |-> v.vals]
    [] OTHER -> LBail
LKeys(v) ==
  CASE v.type = "lset" -> [type |-> "larray", elems |-> v.elems]
    [] v.type = "lmap" -> [type |-> "larray", elems |-> v.keys]
    [] OTHER -> LBail
\* A Math function of one Number, which ToNumber gives back as it is.
LMath(m, a) == IF LNumber(a) THEN Num(MathOf(m, a.value)) ELSE LBail
\* Object.values of an ordinary object: its data properties' values in its keys' order.
LObjectValues(o) == IF o.type = "lobject" THEN LArray([i \in DOMAIN o.keys |-> o.vals[o.keys[i]]]) ELSE LBail
\* Whether a Set's or an array's elements are all primitives, which SameValueZero compares as they are.
LPrimitives(v) == \A i \in DOMAIN v.elems : ~IsLComposite(v.elems[i])
LSet(list) == [type |-> "lset", elems |-> list]
LHas(list, v) == KeyIndex(list, v) # 0
\* The elements of a list of primitives that Set.prototype.add keeps: each once, canonicalized, in
\* order.
RECURSIVE LDistinct(_, _)
LDistinct(list, kept) ==
  IF list = <<>> THEN kept
  ELSE LDistinct(Tail(list), IF LHas(kept, Head(list)) THEN kept ELSE Append(kept, CanonicalizeKeyedCollectionKey(Head(list))))
\* new Set(v): of an array's or a Set's primitives in the order their iterators give them, or of
\* none where v is undefined or null.
LNewSet(v) ==
  CASE v.type \in {"undefined", "null"} -> LSet(<<>>)
    [] v.type \in {"larray", "lset"} /\ LPrimitives(v) -> LSet(LDistinct(v.elems, <<>>))
    [] OTHER -> LBail
\* Set.prototype's methods that take another Set (§24.2.4), of primitives: each iterates the
\* smaller Set where the specification lets the sizes decide, which intersection's order shows.
LSetMethod(c, m, o) ==
  IF c.type # "lset" \/ o.type # "lset" \/ ~LPrimitives(c) \/ ~LPrimitives(o) THEN LBail ELSE
  LET a == c.elems
      b == o.elems
  IN CASE m = "union" -> LSet(a \o SelectSeq(b, LAMBDA e : ~LHas(a, e)))
       [] m = "intersection" ->
            LSet(IF Len(a) <= Len(b) THEN SelectSeq(a, LAMBDA e : LHas(b, e)) ELSE SelectSeq(b, LAMBDA e : LHas(a, e)))
       [] m = "difference" -> LSet(SelectSeq(a, LAMBDA e : ~LHas(b, e)))
       [] m = "symmetricDifference" -> LSet(SelectSeq(a, LAMBDA e : ~LHas(b, e)) \o SelectSeq(b, LAMBDA e : ~LHas(a, e)))
       [] m = "isSubsetOf" -> Bool(Len(a) <= Len(b) /\ \A i \in DOMAIN a : LHas(b, a[i]))
       [] m = "isSupersetOf" -> Bool(Len(a) >= Len(b) /\ \A i \in DOMAIN b : LHas(a, b[i]))
       [] m = "isDisjointFrom" -> Bool(~\E i \in DOMAIN a : LHas(b, a[i]))
       [] OTHER -> LBail
====
`);
