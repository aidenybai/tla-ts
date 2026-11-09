\* Keyed collections (§24.1 to §24.4) and weak references (§26.1, §26.2). A [[MapData]] list
\* holds [key, value] records and a [[SetData]] list holds values, in insertion order, with a
\* deleted element replaced by Empty, so iteration during mutation sees what the spec says. The
\* weak collections can't be iterated, so a WeakMap holds a function from key to value and a
\* WeakSet a set. Nothing is ever collected, so FinalizationRegistry cleanup never runs.

CollectionIntrinsics ==
  << IntrinsicObject("MapPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Map", "FunctionPrototype", <<"Map", "constructor">>, 0, N("Map"), TRUE),
     IntrinsicFunction("MapProto_entries", "FunctionPrototype", <<"Map", "entries">>, 0, N("entries"), FALSE),
     IntrinsicObject("MapIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("SetPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Set", "FunctionPrototype", <<"Set", "constructor">>, 0, N("Set"), TRUE),
     IntrinsicFunction("SetProto_values", "FunctionPrototype", <<"Set", "values">>, 0, N("values"), FALSE),
     IntrinsicObject("SetIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("WeakMapPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("WeakMap", "FunctionPrototype", <<"WeakMap", "constructor">>, 0, N("WeakMap"), TRUE),
     IntrinsicObject("WeakSetPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("WeakSet", "FunctionPrototype", <<"WeakSet", "constructor">>, 0, N("WeakSet"), TRUE),
     IntrinsicObject("WeakRefPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("WeakRef", "FunctionPrototype", <<"WeakRef", "constructor">>, 1, N("WeakRef"), TRUE),
     IntrinsicObject("FinalizationRegistryPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("FinalizationRegistry", "FunctionPrototype", <<"FinalizationRegistry", "constructor">>, 1,
                       N("FinalizationRegistry"), TRUE) >>

CollectionProperties ==
  Ctor("Map", "MapPrototype") \o Ctor("Set", "SetPrototype") \o Ctor("WeakMap", "WeakMapPrototype") \o
  Ctor("WeakSet", "WeakSetPrototype") \o Ctor("WeakRef", "WeakRefPrototype") \o
  Ctor("FinalizationRegistry", "FinalizationRegistryPrototype") \o
  << \* Map (§24.1).
     M("Map", SV("groupBy"), "Map", "groupBy", 2),
     G("Map", SymSpecies, "Map", "species", ""),
     M("MapPrototype", SV("clear"), "Map", "clear", 0),
     M("MapPrototype", SV("delete"), "Map", "delete", 1),
     L("MapPrototype", SV("entries"), "MapProto_entries", TRUE, FALSE, TRUE),
     M("MapPrototype", SV("forEach"), "Map", "forEach", 1),
     M("MapPrototype", SV("get"), "Map", "get", 1),
     M("MapPrototype", SV("getOrInsert"), "Map", "getOrInsert", 2),
     M("MapPrototype", SV("getOrInsertComputed"), "Map", "getOrInsertComputed", 2),
     M("MapPrototype", SV("has"), "Map", "has", 1),
     M("MapPrototype", SV("keys"), "Map", "keys", 0),
     M("MapPrototype", SV("set"), "Map", "set", 2),
     G("MapPrototype", SV("size"), "Map", "size", ""),
     M("MapPrototype", SV("values"), "Map", "values", 0),
     L("MapPrototype", SymIterator, "MapProto_entries", TRUE, FALSE, TRUE),
     V("MapPrototype", SymToStringTag, SV("Map"), FALSE, FALSE, TRUE),
     M("MapIteratorPrototype", SV("next"), "MapIterator", "next", 0),
     V("MapIteratorPrototype", SymToStringTag, SV("Map Iterator"), FALSE, FALSE, TRUE),
     \* Set (§24.2).
     G("Set", SymSpecies, "Set", "species", ""),
     M("SetPrototype", SV("add"), "Set", "add", 1),
     M("SetPrototype", SV("clear"), "Set", "clear", 0),
     M("SetPrototype", SV("delete"), "Set", "delete", 1),
     M("SetPrototype", SV("difference"), "Set", "difference", 1),
     M("SetPrototype", SV("entries"), "Set", "entries", 0),
     M("SetPrototype", SV("forEach"), "Set", "forEach", 1),
     M("SetPrototype", SV("has"), "Set", "has", 1),
     M("SetPrototype", SV("intersection"), "Set", "intersection", 1),
     M("SetPrototype", SV("isDisjointFrom"), "Set", "isDisjointFrom", 1),
     M("SetPrototype", SV("isSubsetOf"), "Set", "isSubsetOf", 1),
     M("SetPrototype", SV("isSupersetOf"), "Set", "isSupersetOf", 1),
     G("SetPrototype", SV("size"), "Set", "size", ""),
     M("SetPrototype", SV("symmetricDifference"), "Set", "symmetricDifference", 1),
     L("SetPrototype", SV("values"), "SetProto_values", TRUE, FALSE, TRUE),
     M("SetPrototype", SV("union"), "Set", "union", 1),
     L("SetPrototype", SV("keys"), "SetProto_values", TRUE, FALSE, TRUE),
     L("SetPrototype", SymIterator, "SetProto_values", TRUE, FALSE, TRUE),
     V("SetPrototype", SymToStringTag, SV("Set"), FALSE, FALSE, TRUE),
     M("SetIteratorPrototype", SV("next"), "SetIterator", "next", 0),
     V("SetIteratorPrototype", SymToStringTag, SV("Set Iterator"), FALSE, FALSE, TRUE),
     \* WeakMap (§24.3) and WeakSet (§24.4).
     M("WeakMapPrototype", SV("delete"), "WeakMap", "delete", 1),
     M("WeakMapPrototype", SV("get"), "WeakMap", "get", 1),
     M("WeakMapPrototype", SV("getOrInsert"), "WeakMap", "getOrInsert", 2),
     M("WeakMapPrototype", SV("getOrInsertComputed"), "WeakMap", "getOrInsertComputed", 2),
     M("WeakMapPrototype", SV("has"), "WeakMap", "has", 1),
     M("WeakMapPrototype", SV("set"), "WeakMap", "set", 2),
     V("WeakMapPrototype", SymToStringTag, SV("WeakMap"), FALSE, FALSE, TRUE),
     M("WeakSetPrototype", SV("add"), "WeakSet", "add", 1),
     M("WeakSetPrototype", SV("delete"), "WeakSet", "delete", 1),
     M("WeakSetPrototype", SV("has"), "WeakSet", "has", 1),
     V("WeakSetPrototype", SymToStringTag, SV("WeakSet"), FALSE, FALSE, TRUE),
     \* WeakRef (§26.1) and FinalizationRegistry (§26.2).
     M("WeakRefPrototype", SV("deref"), "WeakRef", "deref", 0),
     V("WeakRefPrototype", SymToStringTag, SV("WeakRef"), FALSE, FALSE, TRUE),
     M("FinalizationRegistryPrototype", SV("register"), "FinalizationRegistry", "register", 2),
     M("FinalizationRegistryPrototype", SV("unregister"), "FinalizationRegistry", "unregister", 1),
     V("FinalizationRegistryPrototype", SymToStringTag, SV("FinalizationRegistry"), FALSE, FALSE, TRUE),
     GlobalLink("Map", N("Map")), GlobalLink("Set", N("Set")), GlobalLink("WeakMap", N("WeakMap")),
     GlobalLink("WeakSet", N("WeakSet")), GlobalLink("WeakRef", N("WeakRef")),
     GlobalLink("FinalizationRegistry", N("FinalizationRegistry")) >>

\* RequireInternalSlot for the slot that objects of a class have.
HasClass(s, v, class) == IsObject(v) /\ O(s, v).class = class

\* CanonicalizeKeyedCollectionKey (§24.5.1).
CanonicalizeKeyedCollectionKey(key) == IF IsNumber(key) /\ key.value = NegZero THEN Num(PosZero) ELSE key

\* The index of the first element of list that isn't empty and is SameValueZero to v, or 0. On a
\* [[SetData]] list this is SetDataIndex (§24.2.1.4).
KeyIndex(list, v) == KeyIndexFrom(list, v, 1)
KeyIndexFrom(list, v, i) ==
  IF i > Len(list) THEN 0
  ELSE IF list[i] # Empty /\ SameValueZero(list[i], v) THEN i
  ELSE KeyIndexFrom(list, v, i + 1)
\* SetDataHas (§24.2.1.3).
SetDataHas(list, v) == KeyIndex(list, v) # 0
\* SetDataSize (§24.2.1.5), and the size of a [[MapData]] list.
LiveCount(list) == Len(SelectSeq(list, LAMBDA e : e # Empty))

\* The keys of a [[MapData]] list, with Empty for a deleted entry.
MapKeys(entries) == [i \in DOMAIN entries |-> IF entries[i] = Empty THEN Empty ELSE entries[i].key]
MapData(s, m) == O(s, m).slots.mapData
SetMapData(s, m, entries) == SetO(s, m, [O(s, m) EXCEPT !.slots.mapData = entries])
SetData(s, set) == O(s, set).slots.setData
SetSetData(s, set, list) == SetO(s, set, [O(s, set) EXCEPT !.slots.setData = list])

\* The loop of the Map, Set, WeakMap, and WeakSet constructors (§24.1.1.1 steps 4 to 6 and
\* AddEntriesFromIterable §24.1.1.2, §24.2.2.1 steps 4 to 8): calls the adder named key on each
\* element of iterable, or on its "0" and "1" properties when isEntries.
AddFromIterable(s, target, iterable, key, isEntries) ==
  IF IsNullish(iterable) THEN Ok(s, target)
  ELSE LET adder == Get(s, target, key) IN IF IsAbrupt(adder) THEN adder
  ELSE IF ~IsCallable(adder.s, Val(adder)) THEN ThrowTypeError(adder.s)
  ELSE LET it == GetIterator(adder.s, iterable, "sync") IN IF IsAbrupt(it) THEN it
  ELSE AddFromIterator(it.s, target, Val(it), Val(adder), isEntries)
AddFromIterator(s, target, it, adder, isEntries) ==
  LET next == IteratorStepValue(s, it) IN IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, target)
  ELSE LET item == Val(next).value
           status ==
             IF ~isEntries THEN Call(next.s, adder, target, <<item>>)
             ELSE IF ~IsObject(item) THEN ThrowTypeError(next.s)
             ELSE LET k == Get(next.s, item, SV("0")) IN IF IsAbrupt(k) THEN k
             ELSE LET v == Get(k.s, item, SV("1")) IN IF IsAbrupt(v) THEN v
             ELSE Call(v.s, adder, target, <<Val(k), Val(v)>>)
       IN IF IsAbrupt(status) THEN IteratorClose(status.s, Val(next).iterator, status.c)
          ELSE AddFromIterator(status.s, target, Val(next).iterator, adder, isEntries)

\* GroupBy and AddValueToKeyedGroup (§7.3): the groups as [key, elements] records.
GroupBy(s, items, callback, keyCoercion) ==
  IF IsNullish(items) THEN ThrowTypeError(s)
  ELSE IF ~IsCallable(s, callback) THEN ThrowTypeError(s)
  ELSE LET it == GetIterator(s, items, "sync") IN IF IsAbrupt(it) THEN it
  ELSE GroupFrom(it.s, Val(it), callback, keyCoercion, 0, <<>>)
GroupFrom(s, it, callback, keyCoercion, k, groups) ==
  LET next == IteratorStepValue(s, it) IN IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, groups)
  ELSE LET value == Val(next).value
           key == Call(next.s, callback, Undefined, <<value, IntV(k)>>)
           coerced == IF IsAbrupt(key) THEN key
                      ELSE IF keyCoercion = "property" THEN ToPropertyKey(key.s, Val(key))
                      ELSE Ok(key.s, CanonicalizeKeyedCollectionKey(Val(key)))
       IN IF IsAbrupt(coerced) THEN IteratorClose(coerced.s, Val(next).iterator, coerced.c)
          ELSE GroupFrom(coerced.s, Val(next).iterator, callback, keyCoercion, k + 1,
                         AddValueToKeyedGroup(groups, Val(coerced), value))
AddValueToKeyedGroup(groups, key, value) ==
  LET matches == {i \in DOMAIN groups : SameValue(groups[i].key, key)} IN
  IF matches = {} THEN Append(groups, [key |-> key, elements |-> <<value>>])
  ELSE LET i == CHOOSE i \in matches : TRUE IN [groups EXCEPT ![i].elements = Append(@, value)]

\* Map.groupBy (§24.1.2.1): the map's entries, each group's elements as an array.
GroupEntries(s, groups, acc) ==
  IF groups = <<>> THEN [s |-> s, entries |-> acc]
  ELSE LET a == CreateArrayFromList(s, Head(groups).elements) IN
       GroupEntries(a.s, Tail(groups), Append(acc, [key |-> Head(groups).key, value |-> Val(a)]))

\* The forEach loop of Map and Set, which reads the list again at each
\* step, so it visits elements added during the loop.
ForEachFrom(s, o, callback, thisArg, i) ==
  LET isMap == O(s, o).class = "map"
      list == IF isMap THEN MapData(s, o) ELSE SetData(s, o)
  IN IF i > Len(list) THEN Ok(s, Undefined)
     ELSE IF list[i] = Empty THEN ForEachFrom(s, o, callback, thisArg, i + 1)
     ELSE LET r == Call(s, callback, thisArg,
                        IF isMap THEN <<list[i].value, list[i].key, o>> ELSE <<list[i], list[i], o>>)
          IN IF IsAbrupt(r) THEN r ELSE ForEachFrom(r.s, o, callback, thisArg, i + 1)

\* Map (§24.1).
MapBuiltin(s, f, m, this, args, nt) ==
  LET key == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET map == OrdinaryCreateFromConstructor(s, nt, "MapPrototype", "map", [mapData |-> <<>>]) IN
              IF IsAbrupt(map) THEN map ELSE AddFromIterable(map.s, Val(map), key, SV("set"), TRUE)
    [] m = "groupBy" ->
         LET groups == GroupBy(s, key, Arg(args, 2), "collection") IN IF IsAbrupt(groups) THEN groups ELSE
         LET g == GroupEntries(groups.s, Val(groups), <<>>)
             a == Alloc(g.s, MakeObject(Intrinsic(g.s, "MapPrototype"), "map", [mapData |-> g.entries]))
         IN Ok(a.s, a.v)
    [] m = "species" -> Ok(s, this)
    [] ~HasClass(s, this, "map") -> ThrowTypeError(s)
    [] OTHER ->
         LET entries == MapData(s, this)
             i == KeyIndex(MapKeys(entries), key)
         IN CASE m = "clear" -> Ok(SetMapData(s, this, [j \in DOMAIN entries |-> Empty]), Undefined)
              [] m = "delete" -> IF i = 0 THEN Ok(s, False) ELSE Ok(SetMapData(s, this, [entries EXCEPT ![i] = Empty]), True)
              [] m \in {"entries", "keys", "values"} ->
                   LET a == Alloc(s, MakeObject(Intrinsic(s, "MapIteratorPrototype"), "mapIterator",
                                                [collection |-> this, index |-> 0,
                                                 kind |-> CASE m = "entries" -> "key+value" [] m = "keys" -> "key" [] OTHER -> "value"]))
                   IN Ok(a.s, a.v)
              [] m = "forEach" -> IF ~IsCallable(s, key) THEN ThrowTypeError(s) ELSE ForEachFrom(s, this, key, Arg(args, 2), 1)
              [] m = "get" -> Ok(s, IF i = 0 THEN Undefined ELSE entries[i].value)
              [] m = "has" -> Ok(s, Bool(i # 0))
              [] m \in {"set", "getOrInsert"} ->
                   LET value == Arg(args, 2) IN
                   IF i # 0 THEN
                     IF m = "set" THEN Ok(SetMapData(s, this, [entries EXCEPT ![i].value = value]), this)
                     ELSE Ok(s, entries[i].value)
                   ELSE Ok(SetMapData(s, this, Append(entries, [key |-> CanonicalizeKeyedCollectionKey(key), value |-> value])),
                           IF m = "set" THEN this ELSE value)
              [] m = "getOrInsertComputed" ->
                   LET callback == Arg(args, 2) IN
                   IF ~IsCallable(s, callback) THEN ThrowTypeError(s)
                   ELSE IF i # 0 THEN Ok(s, entries[i].value)
                   ELSE LET canonical == CanonicalizeKeyedCollectionKey(key)
                            value == Call(s, callback, Undefined, <<canonical>>)
                        IN IF IsAbrupt(value) THEN value
                           ELSE LET now == MapData(value.s, this)
                                    j == KeyIndex(MapKeys(now), canonical)
                                IN Ok(SetMapData(value.s, this,
                                                 IF j # 0 THEN [now EXCEPT ![j].value = Val(value)]
                                                 ELSE Append(now, [key |-> canonical, value |-> Val(value)])),
                                      Val(value))
              [] m = "size" -> Ok(s, IntV(LiveCount(entries)))

\* %MapIteratorPrototype%.next (§24.1.5.2.1) and %SetIteratorPrototype%.next (§24.2.6.2.1), which
\* resume the closures of CreateMapIterator (§24.1.5.1) and CreateSetIterator (§24.2.6.1). The
\* iterator holds its collection, or Undefined once it is done, and the index it has reached.
CollectionIteratorNext(s, this, class) ==
  IF ~HasClass(s, this, class) THEN ThrowTypeError(s)
  ELSE LET slots == O(s, this).slots IN
  IF slots.collection = Undefined THEN CreateIterResultObject(s, Undefined, TRUE)
  ELSE LET isMap == class = "mapIterator"
           list == IF isMap THEN MapData(s, slots.collection) ELSE SetData(s, slots.collection)
           i == NextLiveIndex(list, slots.index)
       IN IF i = 0 THEN CreateIterResultObject(SetO(s, this, [O(s, this) EXCEPT !.slots.collection = Undefined]), Undefined, TRUE)
          ELSE LET s1 == SetO(s, this, [O(s, this) EXCEPT !.slots.index = i])
                   key == IF isMap THEN list[i].key ELSE list[i]
                   value == IF isMap THEN list[i].value ELSE list[i]
               IN CASE slots.kind = "key" -> CreateIterResultObject(s1, key, FALSE)
                    [] slots.kind = "value" -> CreateIterResultObject(s1, value, FALSE)
                    [] OTHER -> LET pair == CreateArrayFromList(s1, <<key, value>>) IN
                                CreateIterResultObject(pair.s, Val(pair), FALSE)
NextLiveIndex(list, i) ==
  IF i >= Len(list) THEN 0 ELSE IF list[i + 1] # Empty THEN i + 1 ELSE NextLiveIndex(list, i + 1)

MapIteratorBuiltin(s, f, m, this, args, nt) == CollectionIteratorNext(s, this, "mapIterator")
SetIteratorBuiltin(s, f, m, this, args, nt) == CollectionIteratorNext(s, this, "setIterator")

\* GetSetRecord (§24.2.1.2), with the size as a Number.
GetSetRecord(s, obj) ==
  IF ~IsObject(obj) THEN ThrowTypeError(s)
  ELSE LET rawSize == Get(s, obj, SV("size")) IN IF IsAbrupt(rawSize) THEN rawSize
  ELSE LET numSize == ToNumber(rawSize.s, Val(rawSize)) IN IF IsAbrupt(numSize) THEN numSize
  ELSE IF NumIsNaN(Val(numSize).value) THEN ThrowTypeError(numSize.s)
  ELSE LET intSize == NumToIntegerOrInfinity(Val(numSize).value) IN
  IF NumLess(intSize, PosZero) THEN ThrowError(numSize.s, "RangeError")
  ELSE LET has == Get(numSize.s, obj, SV("has")) IN IF IsAbrupt(has) THEN has
  ELSE IF ~IsCallable(has.s, Val(has)) THEN ThrowTypeError(has.s)
  ELSE LET keys == Get(has.s, obj, SV("keys")) IN IF IsAbrupt(keys) THEN keys
  ELSE IF ~IsCallable(keys.s, Val(keys)) THEN ThrowTypeError(keys.s)
  ELSE Ok(keys.s, [set |-> obj, size |-> intSize, has |-> Val(has), keys |-> Val(keys)])

\* Whether SetDataSize of a set's [[SetData]] is at most the Set Record's size.
FitsInRecord(list, rec) == ~NumLess(rec.size, NumFromInt(LiveCount(list)))

\* The loops that call rec.has on each element of the set's [[SetData]], reading the list again
\* at each step: intersection collecting into result, isDisjointFrom, and isSubsetOf.
SetHasFrom(s, set, rec, op, i, result) ==
  LET list == SetData(s, set) IN
  IF i > Len(list) THEN Ok(s, IF op = "intersection" THEN result ELSE True)
  ELSE IF list[i] = Empty THEN SetHasFrom(s, set, rec, op, i + 1, result)
  ELSE LET e == list[i]
           r == Call(s, rec.has, rec.set, <<e>>)
       IN IF IsAbrupt(r) THEN r
          ELSE LET inOther == ToBooleanValue(Val(r)) IN
          CASE op = "isDisjointFrom" /\ inOther -> Ok(r.s, False)
            [] op = "isSubsetOf" /\ ~inOther -> Ok(r.s, False)
            [] OTHER -> SetHasFrom(r.s, set, rec, op, i + 1,
                                   IF op = "intersection" /\ inOther /\ ~SetDataHas(result, e)
                                   THEN Append(result, e) ELSE result)

\* The loop of difference over the copy of the set's [[SetData]].
DifferenceHasFrom(s, rec, i, result) ==
  IF i > Len(result) THEN Ok(s, result)
  ELSE IF result[i] = Empty THEN DifferenceHasFrom(s, rec, i + 1, result)
  ELSE LET r == Call(s, rec.has, rec.set, <<result[i]>>) IN
       IF IsAbrupt(r) THEN r
       ELSE DifferenceHasFrom(r.s, rec, i + 1, IF ToBooleanValue(Val(r)) THEN [result EXCEPT ![i] = Empty] ELSE result)

\* The loops over rec's keys: union, intersection, difference, and symmetricDifference build
\* result, and isDisjointFrom and isSupersetOf stop with false when a key is, or isn't, in the
\* set.
SetKeysFrom(s, set, it, op, result) ==
  LET next == IteratorStepValue(s, it) IN IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, IF op \in {"isDisjointFrom", "isSupersetOf"} THEN True ELSE result)
  ELSE LET list == SetData(next.s, set)
           key == CanonicalizeKeyedCollectionKey(Val(next).value)
           index == KeyIndex(result, key)
       IN IF (op = "isDisjointFrom" /\ SetDataHas(list, key)) \/ (op = "isSupersetOf" /\ ~SetDataHas(list, key))
          THEN LET c == IteratorClose(next.s, Val(next).iterator, NormalCompletion(Undefined)) IN
               IF IsAbrupt(c) THEN c ELSE Ok(c.s, False)
          ELSE SetKeysFrom(next.s, set, Val(next).iterator, op,
                 CASE op = "union" -> IF index = 0 THEN Append(result, key) ELSE result
                   [] op = "intersection" -> IF SetDataHas(list, key) /\ index = 0 THEN Append(result, key) ELSE result
                   [] op = "difference" -> IF index = 0 THEN result ELSE [result EXCEPT ![index] = Empty]
                   [] op = "symmetricDifference" ->
                        IF SetDataHas(list, key) THEN (IF index = 0 THEN result ELSE [result EXCEPT ![index] = Empty])
                        ELSE IF index = 0 THEN Append(result, key) ELSE result
                   [] OTHER -> result)

\* The set methods that take another set-like object (§24.2.4).
SetOperation(s, this, other, m) ==
  LET rec == GetSetRecord(s, other) IN IF IsAbrupt(rec) THEN rec ELSE
  LET list == SetData(rec.s, this)
      fits == FitsInRecord(list, Val(rec))
      keys == GetIteratorFromMethod(rec.s, Val(rec).set, Val(rec).keys)
      result ==
        CASE m = "difference" /\ fits -> DifferenceHasFrom(rec.s, Val(rec), 1, list)
          [] m \in {"intersection", "isDisjointFrom"} /\ fits -> SetHasFrom(rec.s, this, Val(rec), m, 1, <<>>)
          [] m = "isSubsetOf" -> IF fits THEN SetHasFrom(rec.s, this, Val(rec), m, 1, <<>>) ELSE Ok(rec.s, False)
          [] m = "isSupersetOf" /\ NumLess(NumFromInt(LiveCount(list)), Val(rec).size) -> Ok(rec.s, False)
          [] IsAbrupt(keys) -> keys
          [] OTHER -> SetKeysFrom(keys.s, this, Val(keys), m,
                                  CASE m = "difference" -> list
                                    [] m \in {"union", "symmetricDifference"} -> SetData(keys.s, this)
                                    [] OTHER -> <<>>)
  IN IF IsAbrupt(result) \/ m \in {"isDisjointFrom", "isSubsetOf", "isSupersetOf"} THEN result
     ELSE LET a == Alloc(result.s, MakeObject(Intrinsic(result.s, "SetPrototype"), "set", [setData |-> Val(result)]))
          IN Ok(a.s, a.v)

\* Set (§24.2).
SetBuiltin(s, f, m, this, args, nt) ==
  LET value == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET set == OrdinaryCreateFromConstructor(s, nt, "SetPrototype", "set", [setData |-> <<>>]) IN
              IF IsAbrupt(set) THEN set ELSE AddFromIterable(set.s, Val(set), value, SV("add"), FALSE)
    [] m = "species" -> Ok(s, this)
    [] ~HasClass(s, this, "set") -> ThrowTypeError(s)
    [] m \in {"union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf",
              "isDisjointFrom"} -> SetOperation(s, this, value, m)
    [] OTHER ->
         LET list == SetData(s, this)
             i == KeyIndex(list, value)
         IN CASE m = "add" ->
                   Ok(IF i # 0 THEN s ELSE SetSetData(s, this, Append(list, CanonicalizeKeyedCollectionKey(value))), this)
              [] m = "clear" -> Ok(SetSetData(s, this, [j \in DOMAIN list |-> Empty]), Undefined)
              [] m = "delete" -> IF i = 0 THEN Ok(s, False) ELSE Ok(SetSetData(s, this, [list EXCEPT ![i] = Empty]), True)
              [] m \in {"entries", "values"} ->
                   LET a == Alloc(s, MakeObject(Intrinsic(s, "SetIteratorPrototype"), "setIterator",
                                                [collection |-> this, index |-> 0,
                                                 kind |-> IF m = "entries" THEN "key+value" ELSE "value"]))
                   IN Ok(a.s, a.v)
              [] m = "forEach" -> IF ~IsCallable(s, value) THEN ThrowTypeError(s) ELSE ForEachFrom(s, this, value, Arg(args, 2), 1)
              [] m = "has" -> Ok(s, Bool(i # 0))
              [] m = "size" -> Ok(s, IntV(LiveCount(list)))

\* CanBeHeldWeakly (§9.13).
CanBeHeldWeakly(s, v) == IsObject(v) \/ (IsSymbol(v) /\ KeyForSymbol(s, v) = Undefined)

\* WeakMap (§24.3).
WeakMapBuiltin(s, f, m, this, args, nt) ==
  LET key == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET map == OrdinaryCreateFromConstructor(s, nt, "WeakMapPrototype", "weakMap", [weakMapData |-> <<>>]) IN
              IF IsAbrupt(map) THEN map ELSE AddFromIterable(map.s, Val(map), key, SV("set"), TRUE)
    [] ~HasClass(s, this, "weakMap") -> ThrowTypeError(s)
    [] OTHER ->
         LET data == O(s, this).slots.weakMapData
             isHeld == CanBeHeldWeakly(s, key)
             has == isHeld /\ key \in DOMAIN data
             put(s1, v) == SetO(s1, this, [O(s1, this) EXCEPT !.slots.weakMapData = (key :> v) @@ @])
         IN CASE m = "delete" ->
                   IF ~has THEN Ok(s, False)
                   ELSE Ok(SetO(s, this, [O(s, this) EXCEPT !.slots.weakMapData = [k \in DOMAIN data \ {key} |-> data[k]]]), True)
              [] m = "get" -> Ok(s, IF has THEN data[key] ELSE Undefined)
              [] m = "has" -> Ok(s, Bool(has))
              [] ~isHeld -> ThrowTypeError(s)
              [] m = "set" -> Ok(put(s, Arg(args, 2)), this)
              [] m = "getOrInsert" -> IF has THEN Ok(s, data[key]) ELSE Ok(put(s, Arg(args, 2)), Arg(args, 2))
              [] m = "getOrInsertComputed" ->
                   IF ~IsCallable(s, Arg(args, 2)) THEN ThrowTypeError(s)
                   ELSE IF has THEN Ok(s, data[key])
                   ELSE LET v == Call(s, Arg(args, 2), Undefined, <<key>>) IN
                        IF IsAbrupt(v) THEN v ELSE Ok(put(v.s, Val(v)), Val(v))

\* WeakSet (§24.4).
WeakSetBuiltin(s, f, m, this, args, nt) ==
  LET value == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET set == OrdinaryCreateFromConstructor(s, nt, "WeakSetPrototype", "weakSet", [weakSetData |-> {}]) IN
              IF IsAbrupt(set) THEN set ELSE AddFromIterable(set.s, Val(set), value, SV("add"), FALSE)
    [] ~HasClass(s, this, "weakSet") -> ThrowTypeError(s)
    [] OTHER ->
         LET data == O(s, this).slots.weakSetData
             isHeld == CanBeHeldWeakly(s, value)
             update(d) == SetO(s, this, [O(s, this) EXCEPT !.slots.weakSetData = d])
         IN CASE m = "add" -> IF ~isHeld THEN ThrowTypeError(s) ELSE Ok(update(data \cup {value}), this)
              [] m = "delete" -> IF isHeld /\ value \in data THEN Ok(update(data \ {value}), True) ELSE Ok(s, False)
              [] m = "has" -> Ok(s, Bool(isHeld /\ value \in data))

\* WeakRef (§26.1). The target is never collected, so AddToKeptObjects has nothing to keep.
WeakRefBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined \/ ~CanBeHeldWeakly(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE OrdinaryCreateFromConstructor(s, nt, "WeakRefPrototype", "weakRef", [weakRefTarget |-> Arg(args, 1)])
    [] m = "deref" -> IF ~HasClass(s, this, "weakRef") THEN ThrowTypeError(s) ELSE Ok(s, O(s, this).slots.weakRefTarget)

\* FinalizationRegistry (§26.2). Each cell is [target, heldValue, unregisterToken], with Empty for
\* no token.
FinalizationRegistryBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined \/ ~IsCallable(s, a1) THEN ThrowTypeError(s)
         ELSE OrdinaryCreateFromConstructor(s, nt, "FinalizationRegistryPrototype", "finalizationRegistry",
                                            [cleanupCallback |-> a1, cells |-> <<>>])
    [] ~HasClass(s, this, "finalizationRegistry") -> ThrowTypeError(s)
    [] m = "register" ->
         LET token == Arg(args, 3) IN
         IF ~CanBeHeldWeakly(s, a1) \/ SameValue(a1, Arg(args, 2)) THEN ThrowTypeError(s)
         ELSE IF ~CanBeHeldWeakly(s, token) /\ token # Undefined THEN ThrowTypeError(s)
         ELSE Ok(SetO(s, this, [O(s, this) EXCEPT !.slots.cells =
                   Append(@, [target |-> a1, heldValue |-> Arg(args, 2),
                              unregisterToken |-> IF token = Undefined THEN Empty ELSE token])]), Undefined)
    [] m = "unregister" ->
         IF ~CanBeHeldWeakly(s, a1) THEN ThrowTypeError(s)
         ELSE LET cells == O(s, this).slots.cells
                  kept == SelectSeq(cells, LAMBDA c : c.unregisterToken = Empty \/ ~SameValue(c.unregisterToken, a1))
              IN Ok(SetO(s, this, [O(s, this) EXCEPT !.slots.cells = kept]), Bool(Len(kept) # Len(cells)))
