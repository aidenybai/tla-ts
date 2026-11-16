\* Array objects (§23.1) and Array Iterator objects (§23.1.5).
ArrayIntrinsics ==
  << IntrinsicObject("ArrayPrototype", "ObjectPrototype", "array", [none |-> TRUE]),
     IntrinsicFunction("Array", "FunctionPrototype", <<"Array", "constructor">>, 1, N("Array"), TRUE),
     IntrinsicFunction("ArrayProto_values", "FunctionPrototype", <<"Array", "values">>, 0, N("values"), FALSE),
     IntrinsicFunction("ArrayProto_toString", "FunctionPrototype", <<"Array", "toString">>, 0, N("toString"), FALSE),
     IntrinsicObject("ArrayUnscopables", "", "ordinary", [none |-> TRUE]),
     IntrinsicObject("ArrayIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]) >>

ArrayProperties ==
  Ctor("Array", "ArrayPrototype") \o
  << GlobalLink("Array", N("Array")),
     M("Array", SV("from"), "Array", "from", 1),
     M("Array", SV("fromAsync"), "Array", "fromAsync", 1),
     M("Array", SV("isArray"), "Array", "isArray", 1),
     M("Array", SV("of"), "Array", "of", 0),
     G("Array", SymSpecies, "Array", "species", ""),
     V("ArrayPrototype", SV("length"), IntV(0), TRUE, FALSE, FALSE),
     M("ArrayPrototype", SV("at"), "Array", "at", 1),
     M("ArrayPrototype", SV("concat"), "Array", "concat", 1),
     M("ArrayPrototype", SV("copyWithin"), "Array", "copyWithin", 2),
     M("ArrayPrototype", SV("entries"), "Array", "entries", 0),
     M("ArrayPrototype", SV("every"), "Array", "every", 1),
     M("ArrayPrototype", SV("fill"), "Array", "fill", 1),
     M("ArrayPrototype", SV("filter"), "Array", "filter", 1),
     M("ArrayPrototype", SV("find"), "Array", "find", 1),
     M("ArrayPrototype", SV("findIndex"), "Array", "findIndex", 1),
     M("ArrayPrototype", SV("findLast"), "Array", "findLast", 1),
     M("ArrayPrototype", SV("findLastIndex"), "Array", "findLastIndex", 1),
     M("ArrayPrototype", SV("flat"), "Array", "flat", 0),
     M("ArrayPrototype", SV("flatMap"), "Array", "flatMap", 1),
     M("ArrayPrototype", SV("forEach"), "Array", "forEach", 1),
     M("ArrayPrototype", SV("includes"), "Array", "includes", 1),
     M("ArrayPrototype", SV("indexOf"), "Array", "indexOf", 1),
     M("ArrayPrototype", SV("join"), "Array", "join", 1),
     M("ArrayPrototype", SV("keys"), "Array", "keys", 0),
     M("ArrayPrototype", SV("lastIndexOf"), "Array", "lastIndexOf", 1),
     M("ArrayPrototype", SV("map"), "Array", "map", 1),
     M("ArrayPrototype", SV("pop"), "Array", "pop", 0),
     M("ArrayPrototype", SV("push"), "Array", "push", 1),
     M("ArrayPrototype", SV("reduce"), "Array", "reduce", 1),
     M("ArrayPrototype", SV("reduceRight"), "Array", "reduceRight", 1),
     M("ArrayPrototype", SV("reverse"), "Array", "reverse", 0),
     M("ArrayPrototype", SV("shift"), "Array", "shift", 0),
     M("ArrayPrototype", SV("slice"), "Array", "slice", 2),
     M("ArrayPrototype", SV("some"), "Array", "some", 1),
     M("ArrayPrototype", SV("sort"), "Array", "sort", 1),
     M("ArrayPrototype", SV("splice"), "Array", "splice", 2),
     M("ArrayPrototype", SV("toLocaleString"), "Array", "toLocaleString", 0),
     M("ArrayPrototype", SV("toReversed"), "Array", "toReversed", 0),
     M("ArrayPrototype", SV("toSorted"), "Array", "toSorted", 1),
     M("ArrayPrototype", SV("toSpliced"), "Array", "toSpliced", 2),
     L("ArrayPrototype", SV("toString"), "ArrayProto_toString", TRUE, FALSE, TRUE),
     M("ArrayPrototype", SV("unshift"), "Array", "unshift", 1),
     L("ArrayPrototype", SV("values"), "ArrayProto_values", TRUE, FALSE, TRUE),
     M("ArrayPrototype", SV("with"), "Array", "with", 2),
     L("ArrayPrototype", SymIterator, "ArrayProto_values", TRUE, FALSE, TRUE),
     L("ArrayPrototype", SymUnscopables, "ArrayUnscopables", FALSE, FALSE, TRUE),
     V("ArrayUnscopables", SV("at"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("copyWithin"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("entries"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("fill"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("find"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("findIndex"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("findLast"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("findLastIndex"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("flat"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("flatMap"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("includes"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("keys"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("toReversed"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("toSorted"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("toSpliced"), True, TRUE, TRUE, TRUE),
     V("ArrayUnscopables", SV("values"), True, TRUE, TRUE, TRUE),
     M("ArrayIteratorPrototype", SV("next"), "ArrayIterator", "next", 0),
     V("ArrayIteratorPrototype", SymToStringTag, SV("Array Iterator"), FALSE, FALSE, TRUE) >>

ArrayBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> ArrayConstructor(s, f, args, nt)
    [] m = "from" -> ArrayFrom(s, this, Arg(args, 1), Arg(args, 2), Arg(args, 3))
    \* Array.fromAsync (§23.1.2.2) is a built-in async function: its closure runs as an async
    \* function's body would, settling a new promise.
    [] m = "fromAsync" ->
         LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
             settled == AsyncFunctionStep(Val(cap), ArrayFromAsync(cap.s, this, Arg(args, 1), Arg(args, 2), Arg(args, 3)))
         IN Ok(settled.s, Val(cap).promise)
    [] m = "isArray" -> IsArray(s, Arg(args, 1))
    \* Array.of (§23.1.2.3).
    [] m = "of" ->
         LET len == NumFromInt(Len(args))
             a == IF IsConstructor(s, this) THEN Construct(s, this, <<Num(len)>>, this) ELSE ArrayCreateLength(s, len)
         IN IF IsAbrupt(a) THEN a ELSE
            LET filled == CreateDataProperties(a.s, Val(a), args, 0) IN IF IsAbrupt(filled) THEN filled ELSE
            SetLength(filled.s, Val(a), len, Val(a))
    \* get Array [ %Symbol.species% ] (§23.1.2.5).
    [] m = "species" -> Ok(s, this)
    \* Array.prototype.sort and toSorted check the comparator before anything else (§23.1.3.30).
    [] m \in {"sort", "toSorted"} /\ Arg(args, 1) # Undefined /\ ~IsCallable(s, Arg(args, 1)) -> ThrowTypeError(s)
    [] OTHER ->
         LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o
         ELSE IF m = "values" THEN CreateArrayIterator(o.s, Val(o), "value")
         ELSE IF m = "keys" THEN CreateArrayIterator(o.s, Val(o), "key")
         ELSE IF m = "entries" THEN CreateArrayIterator(o.s, Val(o), "key+value")
         ELSE IF m = "concat" THEN ArrayConcat(o.s, Val(o), args)
         \* Array.prototype.toString (§23.1.3.36).
         ELSE IF m = "toString" THEN
           LET join == Get(o.s, Val(o), SV("join")) IN IF IsAbrupt(join) THEN join
           ELSE IF IsCallable(join.s, Val(join)) THEN Call(join.s, Val(join), Val(o), <<>>)
           ELSE ObjectToString(join.s, Val(o))
         ELSE LET len == LengthOfArrayLike(o.s, Val(o)) IN IF IsAbrupt(len) THEN len
              ELSE ArrayMethod(len.s, Val(o), Val(len).value, m, args)

CreateDataProperties(s, a, values, i) ==
  IF values = <<>> THEN Ok(s, a)
  ELSE LET c == CreateDataPropertyOrThrow(s, a, Index(NumFromInt(i)), Head(values)) IN
       IF IsAbrupt(c) THEN c ELSE CreateDataProperties(c.s, a, Tail(values), i + 1)

\* Sets o's "length" to the Number len, then returns result.
SetLength(s, o, len, result) ==
  LET l == Set(s, o, SV("length"), Num(len), TRUE) IN IF IsAbrupt(l) THEN l ELSE Ok(l.s, result)

\* The Array constructor (§23.1.1.1).
ArrayConstructor(s, f, args, nt) ==
  LET p == GetPrototypeFromConstructor(s, IF nt = Undefined THEN f ELSE nt, "ArrayPrototype") IN
  IF IsAbrupt(p) THEN p
  ELSE IF Len(args) = 1 THEN
    LET a == ArrayCreate(p.s, 0, Val(p))
        len == args[1]
    IN IF ~IsNumber(len) THEN
         LET c == CreateDataPropertyOrThrow(a.s, Val(a), SV("0"), len) IN
         IF IsAbrupt(c) THEN c ELSE Ok(SetO(c.s, Val(a), [O(c.s, Val(a)) EXCEPT !.props[NamedBucket][SV("length")].value = IntV(1)]), Val(a))
       ELSE LET intLen == NumToUint32(len.value) IN
            IF ~NumSameValueZero(intLen, len.value) THEN ThrowError(a.s, "RangeError")
            ELSE Ok(SetO(a.s, Val(a), [O(a.s, Val(a)) EXCEPT !.props[NamedBucket][SV("length")].value = Num(intLen)]), Val(a))
  ELSE LET a == ArrayCreate(p.s, Len(args), Val(p)) IN
       CreateDataProperties(a.s, Val(a), args, 0)

\* Array.from (§23.1.2.1).
ArrayFrom(s, c, items, mapfn, thisArg) ==
  IF mapfn # Undefined /\ ~IsCallable(s, mapfn) THEN ThrowTypeError(s)
  ELSE LET usingIterator == GetMethod(s, items, SymIterator) IN
  IF IsAbrupt(usingIterator) THEN usingIterator
  ELSE IF Val(usingIterator) # Undefined THEN
    LET a == IF IsConstructor(usingIterator.s, c) THEN Construct(usingIterator.s, c, <<>>, c)
             ELSE ArrayCreate(usingIterator.s, 0, Intrinsic(usingIterator.s, "ArrayPrototype"))
    IN IF IsAbrupt(a) THEN a ELSE
       LET it == GetIteratorFromMethod(a.s, items, Val(usingIterator)) IN
       IF IsAbrupt(it) THEN it ELSE ArrayFromIterator(it.s, Val(a), Val(it), mapfn, thisArg, PosZero)
  ELSE
    LET arrayLike == ToObject(usingIterator.s, items)
        len == LengthOfArrayLike(arrayLike.s, Val(arrayLike))
    IN IF IsAbrupt(len) THEN len ELSE
       LET a == IF IsConstructor(len.s, c) THEN Construct(len.s, c, <<Val(len)>>, c)
                ELSE ArrayCreateLength(len.s, Val(len).value)
       IN IF IsAbrupt(a) THEN a ELSE
          LET r == ArrayFromArrayLike(a.s, Val(a), Val(arrayLike), PosZero, Val(len).value, mapfn, thisArg) IN
          IF IsAbrupt(r) THEN r ELSE SetLength(r.s, Val(a), Val(len).value, Val(a))

ArrayFromIterator(s, a, it, mapfn, thisArg, k) ==
  IF ~NumLess(k, MaxSafeInteger) THEN LET e == ThrowTypeError(s) IN IteratorClose(e.s, it, e.c)
  ELSE LET next == IteratorStepValue(s, it) IN IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN SetLength(next.s, a, k, a)
  ELSE LET mapped == IF mapfn = Undefined THEN Ok(next.s, Val(next).value)
                     ELSE Call(next.s, mapfn, thisArg, <<Val(next).value, Num(k)>>)
       IN IF IsAbrupt(mapped) THEN IteratorClose(mapped.s, it, mapped.c)
          ELSE LET d == CreateDataPropertyOrThrow(mapped.s, a, Index(k), Val(mapped)) IN
               IF IsAbrupt(d) THEN IteratorClose(d.s, it, d.c)
               ELSE ArrayFromIterator(d.s, a, it, mapfn, thisArg, NumAdd(k, OneNum))

ArrayFromArrayLike(s, a, arrayLike, k, len, mapfn, thisArg) ==
  IF ~NumLess(k, len) THEN Ok(s, a)
  ELSE LET v == Get(s, arrayLike, Index(k)) IN IF IsAbrupt(v) THEN v ELSE
       LET mapped == IF mapfn = Undefined THEN v ELSE Call(v.s, mapfn, thisArg, <<Val(v), Num(k)>>) IN
       IF IsAbrupt(mapped) THEN mapped ELSE
       LET d == CreateDataPropertyOrThrow(mapped.s, a, Index(k), Val(mapped)) IN
       IF IsAbrupt(d) THEN d ELSE ArrayFromArrayLike(d.s, a, arrayLike, NumAdd(k, OneNum), len, mapfn, thisArg)

\* The fromAsyncClosure of Array.fromAsync, which returns the array with a return completion.
ArrayFromAsync(s, c, items, mapper, thisArg) ==
  IF mapper # Undefined /\ ~IsCallable(s, mapper) THEN ThrowTypeError(s)
  ELSE LET usingAsync == GetMethod(s, items, SymAsyncIterator) IN
  IF IsAbrupt(usingAsync) THEN usingAsync
  ELSE LET usingSync == IF Val(usingAsync) # Undefined THEN Ok(usingAsync.s, Undefined) ELSE GetMethod(usingAsync.s, items, SymIterator) IN
  IF IsAbrupt(usingSync) THEN usingSync
  ELSE IF Val(usingAsync) # Undefined \/ Val(usingSync) # Undefined THEN
    LET it == IF Val(usingAsync) # Undefined THEN GetIteratorFromMethod(usingSync.s, items, Val(usingAsync))
              ELSE LET sync == GetIteratorFromMethod(usingSync.s, items, Val(usingSync)) IN
                   IF IsAbrupt(sync) THEN sync ELSE CreateAsyncFromSyncIterator(sync.s, Val(sync))
    IN IF IsAbrupt(it) THEN it ELSE
    LET a == IF IsConstructor(it.s, c) THEN Construct(it.s, c, <<>>, c) ELSE ArrayCreate(it.s, 0, Intrinsic(it.s, "ArrayPrototype")) IN
    IF IsAbrupt(a) THEN a
    ELSE FromAsyncIterator(a.s, [a |-> Val(a), it |-> Val(it), mapper |-> mapper, thisArg |-> thisArg], PosZero)
  ELSE
    LET arrayLike == ToObject(usingSync.s, items)
        len == LengthOfArrayLike(arrayLike.s, Val(arrayLike))
    IN IF IsAbrupt(len) THEN len ELSE
    LET a == IF IsConstructor(len.s, c) THEN Construct(len.s, c, <<Val(len)>>, c) ELSE ArrayCreateLength(len.s, Val(len).value) IN
    IF IsAbrupt(a) THEN a
    ELSE FromAsyncArrayLike(a.s, [a |-> Val(a), arrayLike |-> Val(arrayLike), len |-> Val(len).value, mapper |-> mapper, thisArg |-> thisArg], PosZero)
FromAsyncReturn(s, a, len) == LET l == SetLength(s, a, len, a) IN IF IsAbrupt(l) THEN l ELSE Abrupt(l.s, Completion("return", a, Empty))

\* The loop of the fromAsyncClosure over iterator st.it, from index k.
FromAsyncIterator(s, st, k) ==
  IF ~NumLess(k, MaxSafeInteger) THEN LET e == ThrowTypeError(s) IN AsyncIteratorClose(e.s, st.it, e.c)
  ELSE LET next == Call(s, st.it.next, st.it.iterator, <<>>) IN
       FromAsyncNextThen(st, k, IF IsAbrupt(next) THEN next ELSE Await(next.s, Val(next)))
FromAsyncNextThen(st, k, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE LET done == IteratorComplete(r.s, Val(r)) IN IF IsAbrupt(done) THEN done
  ELSE IF Val(done) THEN FromAsyncReturn(done.s, st.a, k)
  ELSE LET v == Get(done.s, Val(r), SV("value")) IN IF IsAbrupt(v) THEN v
  ELSE IF st.mapper = Undefined THEN FromAsyncDefineThen(st, k, v)
  ELSE LET mapped == Call(v.s, st.mapper, st.thisArg, <<Val(v), Num(k)>>) IN
       IF IsAbrupt(mapped) THEN AsyncIteratorClose(mapped.s, st.it, mapped.c)
       ELSE FromAsyncMappedThen(st, k, Await(mapped.s, Val(mapped)))
FromAsyncMappedThen(st, k, r) == IF IsAbrupt(r) THEN AsyncIteratorClose(r.s, st.it, r.c) ELSE FromAsyncDefineThen(st, k, r)
FromAsyncDefineThen(st, k, r) ==
  LET d == CreateDataPropertyOrThrow(r.s, st.a, Index(k), Val(r)) IN
  IF IsAbrupt(d) THEN AsyncIteratorClose(d.s, st.it, d.c) ELSE FromAsyncIterator(d.s, st, NumAdd(k, OneNum))

\* The loop of the fromAsyncClosure over the array-like st.arrayLike, from index k.
FromAsyncArrayLike(s, st, k) ==
  IF ~NumLess(k, st.len) THEN FromAsyncReturn(s, st.a, st.len)
  ELSE LET v == Get(s, st.arrayLike, Index(k)) IN
       FromAsyncValueThen(st, k, IF IsAbrupt(v) THEN v ELSE Await(v.s, Val(v)))
FromAsyncValueThen(st, k, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF st.mapper = Undefined THEN FromAsyncStoreThen(st, k, r)
  ELSE LET mapped == Call(r.s, st.mapper, st.thisArg, <<Val(r), Num(k)>>) IN
       FromAsyncStoreThen(st, k, IF IsAbrupt(mapped) THEN mapped ELSE Await(mapped.s, Val(mapped)))
FromAsyncStoreThen(st, k, r) ==
  IF IsAbrupt(r) THEN r
  ELSE LET d == CreateDataPropertyOrThrow(r.s, st.a, Index(k), Val(r)) IN
       IF IsAbrupt(d) THEN d ELSE FromAsyncArrayLike(d.s, st, NumAdd(k, OneNum))

\* ArraySpeciesCreate (§10.4.2.3). This port has one realm, so step 5's realm check never applies.
ArraySpeciesCreate(s, o, length) ==
  LET len == NumAdd(length, PosZero)
      isArray == IsArray(s, o)
  IN IF IsAbrupt(isArray) THEN isArray
     ELSE IF Val(isArray) = False THEN ArrayCreateLength(isArray.s, len)
     ELSE LET original == Get(isArray.s, o, SV("constructor")) IN IF IsAbrupt(original) THEN original ELSE
     \* Step 4: another realm's %Array% counts as undefined.
     LET realm == IF IsConstructor(original.s, Val(original)) THEN GetFunctionRealm(original.s, Val(original)) ELSE Ok(original.s, original.s.realmId) IN
     IF IsAbrupt(realm) THEN realm ELSE
     LET c == IF Val(realm) # realm.s.realmId /\ Val(original) = Obj(realm.s.realms[Val(realm)].intrinsics["Array"])
              THEN Ok(realm.s, Undefined) ELSE Ok(realm.s, Val(original))
         sp == IF IsObject(Val(c)) THEN Get(c.s, Val(c), SymSpecies) ELSE c
     IN IF IsAbrupt(sp) THEN sp ELSE
     LET ctor == IF IsObject(Val(c)) /\ Val(sp) = Null THEN Undefined ELSE Val(sp) IN
     IF ctor = Undefined THEN ArrayCreateLength(sp.s, len)
     ELSE IF ~IsConstructor(sp.s, ctor) THEN ThrowTypeError(sp.s)
     ELSE Construct(sp.s, ctor, <<Num(len)>>, ctor)

\* ArrayCreate (§10.4.2.2) with a Number length and %Array.prototype%.
ArrayCreateLength(s, length) ==
  IF NumLess(NumToUint32(NumFromInt(-1)), length) THEN ThrowError(s, "RangeError")
  ELSE LET a == ArrayCreate(s, 0, Intrinsic(s, "ArrayPrototype")) IN
       Ok(SetO(a.s, Val(a), [O(a.s, Val(a)) EXCEPT !.props[NamedBucket][SV("length")].value = Num(NumAdd(length, PosZero))]), Val(a))

\* Gives the fresh array a, whose length is already Len(values), the values as its elements, as
\* CreateDataPropertyOrThrow on each index would.
FillArray(s, a, values) == Ok(SetO(s, a, AddIndexProps(O(s, a), values, 1)), a)

\* Array.prototype.concat (§23.1.3.2).
ArrayConcat(s, o, args) ==
  LET a == ArraySpeciesCreate(s, o, PosZero) IN IF IsAbrupt(a) THEN a ELSE
  LET n == ConcatItems(a.s, Val(a), <<o>> \o args, PosZero) IN IF IsAbrupt(n) THEN n ELSE
  SetLength(n.s, Val(a), Val(n), Val(a))

ConcatItems(s, a, items, n) ==
  IF items = <<>> THEN Ok(s, n)
  ELSE LET e == Head(items)
           spreadable == IsConcatSpreadable(s, e)
       IN IF IsAbrupt(spreadable) THEN spreadable
          ELSE IF Val(spreadable) = True THEN
            LET len == LengthOfArrayLike(spreadable.s, e) IN IF IsAbrupt(len) THEN len
            ELSE IF NumLess(MaxSafeInteger, NumAdd(n, Val(len).value)) THEN ThrowTypeError(len.s)
            ELSE LET r == VisitPresent(len.s, e, PosZero, Val(len).value, 1, "copy", [a |-> a, shift |-> n]) IN
                 IF IsAbrupt(r) THEN r ELSE ConcatItems(r.s, a, Tail(items), NumAdd(n, Val(len).value))
          ELSE IF ~NumLess(n, MaxSafeInteger) THEN ThrowTypeError(spreadable.s)
          ELSE LET c == CreateDataPropertyOrThrow(spreadable.s, a, Index(n), e) IN
               IF IsAbrupt(c) THEN c ELSE ConcatItems(c.s, a, Tail(items), NumAdd(n, OneNum))

\* IsConcatSpreadable (§23.1.3.2.1).
IsConcatSpreadable(s, v) ==
  IF ~IsObject(v) THEN Ok(s, False)
  ELSE LET spreadable == Get(s, v, SymIsConcatSpreadable) IN
       IF IsAbrupt(spreadable) THEN spreadable
       ELSE IF Val(spreadable) # Undefined THEN Ok(spreadable.s, ToBoolean(Val(spreadable)))
       ELSE IsArray(spreadable.s, v)

\* The Array.prototype methods that read the length len of the array-like o first.
ArrayMethod(s, o, len, m, args) ==
  \* Array.prototype.at (§23.1.3.1).
  CASE m = "at" ->
         LET r == ToIntegerOrInfinity(s, Arg(args, 1)) IN IF IsAbrupt(r) THEN r ELSE
         LET k == IF NumLess(Val(r).value, PosZero) THEN NumAdd(len, Val(r).value) ELSE Val(r).value IN
         IF NumLess(k, PosZero) \/ ~NumLess(k, len) THEN Ok(r.s, Undefined) ELSE Get(r.s, o, Index(k))
    \* Array.prototype.copyWithin (§23.1.3.4).
    [] m = "copyWithin" ->
         LET to == RelativeIndex(s, Arg(args, 1), len, PosZero) IN IF IsAbrupt(to) THEN to ELSE
         LET from == RelativeIndex(to.s, Arg(args, 2), len, PosZero) IN IF IsAbrupt(from) THEN from ELSE
         LET final == RelativeIndex(from.s, Arg(args, 3), len, len) IN IF IsAbrupt(final) THEN final ELSE
         LET count == MathMin2(NumSub(Val(final), Val(from)), NumSub(len, Val(to)))
             isBackward == NumLess(Val(from), Val(to)) /\ NumLess(Val(to), NumAdd(Val(from), count))
             last == IF isBackward THEN NumSub(count, OneNum) ELSE PosZero
         IN MoveElements(final.s, o, NumAdd(Val(from), last), NumAdd(Val(to), last), count, IF isBackward THEN -1 ELSE 1)
    \* Array.prototype.every, some, and forEach (§23.1.3.6, §23.1.3.29, §23.1.3.15).
    [] m \in {"every", "some", "forEach"} ->
         IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET r == VisitPresent(s, o, PosZero, len, 1, m, [fn |-> Arg(args, 1), this |-> Arg(args, 2)]) IN
              IF IsAbrupt(r) THEN r
              ELSE Ok(r.s, CASE m = "every" -> Bool(~Val(r).stop) [] m = "some" -> Bool(Val(r).stop) [] OTHER -> Undefined)
    \* Array.prototype.fill (§23.1.3.7).
    [] m = "fill" ->
         LET k == RelativeIndex(s, Arg(args, 2), len, PosZero) IN IF IsAbrupt(k) THEN k ELSE
         LET final == RelativeIndex(k.s, Arg(args, 3), len, len) IN IF IsAbrupt(final) THEN final ELSE
         FillFrom(final.s, o, Val(k), Val(final), Arg(args, 1))
    \* Array.prototype.filter (§23.1.3.8).
    [] m = "filter" ->
         IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET a == ArraySpeciesCreate(s, o, PosZero) IN IF IsAbrupt(a) THEN a ELSE
              LET r == VisitPresent(a.s, o, PosZero, len, 1, m,
                                    [fn |-> Arg(args, 1), this |-> Arg(args, 2), a |-> Val(a), to |-> PosZero]) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(a))
    \* Array.prototype.find, findIndex, findLast, and findLastIndex (§23.1.3.9 to §23.1.3.12).
    [] m \in {"find", "findIndex", "findLast", "findLastIndex"} ->
         LET r == FindViaPredicate(s, o, len, IF m \in {"find", "findIndex"} THEN 1 ELSE -1, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(r) THEN r ELSE Ok(r.s, IF m \in {"find", "findLast"} THEN Val(r).value ELSE Val(r).index)
    \* Array.prototype.flat (§23.1.3.13).
    [] m = "flat" ->
         LET depth == IF Arg(args, 1) = Undefined THEN Ok(s, OneNum)
                      ELSE LET n == ToIntegerOrInfinity(s, Arg(args, 1)) IN
                           IF IsAbrupt(n) THEN n ELSE Ok(n.s, MathMax2(Val(n).value, PosZero))
         IN IF IsAbrupt(depth) THEN depth ELSE
            LET a == ArraySpeciesCreate(depth.s, o, PosZero) IN IF IsAbrupt(a) THEN a ELSE
            LET r == FlattenIntoArray(a.s, Val(a), o, len, PosZero, Val(depth), Absent, Undefined) IN
            IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(a))
    \* Array.prototype.flatMap (§23.1.3.14).
    [] m = "flatMap" ->
         IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET a == ArraySpeciesCreate(s, o, PosZero) IN IF IsAbrupt(a) THEN a ELSE
              LET r == FlattenIntoArray(a.s, Val(a), o, len, PosZero, OneNum, Arg(args, 1), Arg(args, 2)) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(a))
    \* Array.prototype.includes (§23.1.3.16).
    [] m = "includes" ->
         IF NumIsZero(len) THEN Ok(s, False)
         ELSE LET k == RelativeIndex(s, Arg(args, 2), len, PosZero) IN
              IF IsAbrupt(k) THEN k ELSE IncludesFrom(k.s, o, Val(k), len, Arg(args, 1))
    \* Array.prototype.indexOf (§23.1.3.17).
    [] m = "indexOf" ->
         IF NumIsZero(len) THEN Ok(s, IntV(-1))
         ELSE LET k == RelativeIndex(s, Arg(args, 2), len, PosZero) IN IF IsAbrupt(k) THEN k ELSE
              SearchResult(VisitPresent(k.s, o, Val(k), len, 1, "indexOf", [target |-> Arg(args, 1), found |-> Undefined]))
    \* Array.prototype.join (§23.1.3.18).
    [] m = "join" ->
         LET sep == IF Arg(args, 1) = Undefined THEN Ok(s, SV(",")) ELSE ToStr(s, Arg(args, 1)) IN
         IF IsAbrupt(sep) THEN sep ELSE JoinFrom(sep.s, o, len, PosZero, Val(sep).value, <<>>, FALSE)
    \* Array.prototype.lastIndexOf (§23.1.3.20).
    [] m = "lastIndexOf" ->
         IF NumIsZero(len) THEN Ok(s, IntV(-1))
         ELSE LET n == IF Len(args) >= 2 THEN ToIntegerOrInfinity(s, args[2]) ELSE Ok(s, Num(NumSub(len, OneNum))) IN
              IF IsAbrupt(n) THEN n ELSE
              LET k == IF NumLess(Val(n).value, PosZero) THEN NumAdd(len, Val(n).value)
                       ELSE MathMin2(Val(n).value, NumSub(len, OneNum))
              IN SearchResult(VisitPresent(n.s, o, k, NumFromInt(-1), -1, "indexOf",
                                           [target |-> Arg(args, 1), found |-> Undefined]))
    \* Array.prototype.map (§23.1.3.21).
    [] m = "map" ->
         IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET a == ArraySpeciesCreate(s, o, len) IN IF IsAbrupt(a) THEN a ELSE
              LET r == VisitPresent(a.s, o, PosZero, len, 1, m, [fn |-> Arg(args, 1), this |-> Arg(args, 2), a |-> Val(a)]) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(a))
    \* Array.prototype.pop (§23.1.3.22).
    [] m = "pop" ->
         IF NumIsZero(len) THEN SetLength(s, o, PosZero, Undefined)
         ELSE LET newLen == NumSub(len, OneNum)
                  e == Get(s, o, Index(newLen))
              IN IF IsAbrupt(e) THEN e ELSE
                 LET d == DeletePropertyOrThrow(e.s, o, Index(newLen)) IN
                 IF IsAbrupt(d) THEN d ELSE SetLength(d.s, o, newLen, Val(e))
    \* Array.prototype.push (§23.1.3.23).
    [] m = "push" ->
         LET newLen == NumAdd(len, NumFromInt(Len(args))) IN
         IF NumLess(MaxSafeInteger, newLen) THEN ThrowTypeError(s)
         ELSE LET w == SetElements(s, o, args, len) IN IF IsAbrupt(w) THEN w ELSE SetLength(w.s, o, newLen, Num(newLen))
    \* Array.prototype.reduce and reduceRight (§23.1.3.24, §23.1.3.25).
    [] m \in {"reduce", "reduceRight"} ->
         LET dir == IF m = "reduce" THEN 1 ELSE -1
             start == IF m = "reduce" THEN PosZero ELSE NumSub(len, OneNum)
             bound == IF m = "reduce" THEN len ELSE NumFromInt(-1)
         IN IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
            ELSE IF NumIsZero(len) /\ Len(args) < 2 THEN ThrowTypeError(s)
            ELSE LET init == IF Len(args) >= 2 THEN Ok(s, [stop |-> TRUE, st |-> [acc |-> args[2], next |-> start]])
                             ELSE VisitPresent(s, o, start, bound, dir, "reduceInit", [acc |-> Undefined, next |-> start, dir |-> dir])
                 IN IF IsAbrupt(init) THEN init
                    ELSE IF ~Val(init).stop THEN ThrowTypeError(init.s)
                    ELSE LET r == VisitPresent(init.s, o, Val(init).st.next, bound, dir, m, [fn |-> Arg(args, 1), acc |-> Val(init).st.acc]) IN
                         IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(r).st.acc)
    \* Array.prototype.reverse (§23.1.3.26).
    [] m = "reverse" -> ReverseFrom(s, o, len, PosZero, MathFloor(NumDiv(len, NumFromInt(2))))
    \* Array.prototype.shift (§23.1.3.27).
    [] m = "shift" ->
         IF NumIsZero(len) THEN SetLength(s, o, PosZero, Undefined)
         ELSE LET first == Get(s, o, SV("0")) IN IF IsAbrupt(first) THEN first ELSE
              LET r == MoveElements(first.s, o, OneNum, PosZero, NumSub(len, OneNum), 1) IN IF IsAbrupt(r) THEN r ELSE
              LET d == DeletePropertyOrThrow(r.s, o, Index(NumSub(len, OneNum))) IN
              IF IsAbrupt(d) THEN d ELSE SetLength(d.s, o, NumSub(len, OneNum), Val(first))
    \* Array.prototype.slice (§23.1.3.28).
    [] m = "slice" ->
         LET k == RelativeIndex(s, Arg(args, 1), len, PosZero) IN IF IsAbrupt(k) THEN k ELSE
         LET final == RelativeIndex(k.s, Arg(args, 2), len, len) IN IF IsAbrupt(final) THEN final ELSE
         LET count == MathMax2(NumSub(Val(final), Val(k)), PosZero)
             a == ArraySpeciesCreate(final.s, o, count)
         IN IF IsAbrupt(a) THEN a ELSE
            LET r == VisitPresent(a.s, o, Val(k), Val(final), 1, "copy", [a |-> Val(a), shift |-> NumNeg(Val(k))]) IN
            IF IsAbrupt(r) THEN r ELSE SetLength(r.s, Val(a), count, Val(a))
    \* Array.prototype.sort (§23.1.3.30).
    [] m = "sort" ->
         LET sorted == SortIndexedProperties(s, o, len, Arg(args, 1), TRUE) IN IF IsAbrupt(sorted) THEN sorted ELSE
         LET w == SetElements(sorted.s, o, Val(sorted), PosZero) IN IF IsAbrupt(w) THEN w ELSE
         DeleteIndices(w.s, o, NumFromInt(Len(Val(sorted))), len, 1)
    \* Array.prototype.splice (§23.1.3.31).
    [] m = "splice" ->
         LET st == RelativeIndex(s, Arg(args, 1), len, PosZero) IN IF IsAbrupt(st) THEN st ELSE
         LET start == Val(st)
             items == Rest(args, 3)
             itemCount == NumFromInt(Len(items))
             dc == CASE Len(args) = 0 -> Ok(st.s, PosZero)
                     [] Len(args) = 1 -> Ok(st.s, NumSub(len, start))
                     [] OTHER -> LET n == ToIntegerOrInfinity(st.s, args[2]) IN
                                 IF IsAbrupt(n) THEN n ELSE Ok(n.s, NumClamp(Val(n).value, PosZero, NumSub(len, start)))
         IN IF IsAbrupt(dc) THEN dc ELSE
         LET deleteCount == Val(dc)
             newLen == NumAdd(NumSub(len, deleteCount), itemCount)
         IN IF NumLess(MaxSafeInteger, newLen) THEN ThrowTypeError(dc.s) ELSE
         LET a == ArraySpeciesCreate(dc.s, o, deleteCount) IN IF IsAbrupt(a) THEN a ELSE
         LET copied == VisitPresent(a.s, o, start, NumAdd(start, deleteCount), 1, "copy", [a |-> Val(a), shift |-> NumNeg(start)]) IN
         IF IsAbrupt(copied) THEN copied ELSE
         LET al == Set(copied.s, Val(a), SV("length"), Num(deleteCount), TRUE) IN IF IsAbrupt(al) THEN al ELSE
         LET moveCount == NumSub(NumSub(len, deleteCount), start)
             moved ==
               CASE NumLess(itemCount, deleteCount) ->
                      LET r == MoveElements(al.s, o, NumAdd(start, deleteCount), NumAdd(start, itemCount), moveCount, 1) IN
                      IF IsAbrupt(r) THEN r ELSE DeleteIndices(r.s, o, NumSub(len, OneNum), NumSub(newLen, OneNum), -1)
                 [] NumLess(deleteCount, itemCount) ->
                      MoveElements(al.s, o, NumSub(len, OneNum), NumSub(newLen, OneNum), moveCount, -1)
                 [] OTHER -> Ok(al.s, o)
         IN IF IsAbrupt(moved) THEN moved ELSE
            LET w == SetElements(moved.s, o, items, start) IN IF IsAbrupt(w) THEN w ELSE SetLength(w.s, o, newLen, Val(a))
    \* Array.prototype.toLocaleString (§23.1.3.32), with "," as the list separator.
    [] m = "toLocaleString" -> JoinFrom(s, o, len, PosZero, N(","), <<>>, TRUE)
    \* Array.prototype.toReversed (§23.1.3.33).
    [] m = "toReversed" ->
         LET a == ArrayCreateLength(s, len) IN IF IsAbrupt(a) THEN a ELSE
         LET values == ReadThrough(a.s, o, NumSub(len, OneNum), len, -1, <<>>) IN
         IF IsAbrupt(values) THEN values ELSE FillArray(values.s, Val(a), Val(values))
    \* Array.prototype.toSorted (§23.1.3.34).
    [] m = "toSorted" ->
         LET a == ArrayCreateLength(s, len) IN IF IsAbrupt(a) THEN a ELSE
         LET sorted == SortIndexedProperties(a.s, o, len, Arg(args, 1), FALSE) IN
         IF IsAbrupt(sorted) THEN sorted ELSE FillArray(sorted.s, Val(a), Val(sorted))
    \* Array.prototype.toSpliced (§23.1.3.35).
    [] m = "toSpliced" ->
         LET st == RelativeIndex(s, Arg(args, 1), len, PosZero) IN IF IsAbrupt(st) THEN st ELSE
         LET start == Val(st)
             items == Rest(args, 3)
             sc == CASE Len(args) = 0 -> Ok(st.s, PosZero)
                     [] Len(args) = 1 -> Ok(st.s, NumSub(len, start))
                     [] OTHER -> LET n == ToIntegerOrInfinity(st.s, args[2]) IN
                                 IF IsAbrupt(n) THEN n ELSE Ok(n.s, NumClamp(Val(n).value, PosZero, NumSub(len, start)))
         IN IF IsAbrupt(sc) THEN sc ELSE
         LET newLen == NumAdd(NumSub(len, Val(sc)), NumFromInt(Len(items))) IN
         IF NumLess(MaxSafeInteger, newLen) THEN ThrowTypeError(sc.s) ELSE
         LET a == ArrayCreateLength(sc.s, newLen) IN IF IsAbrupt(a) THEN a ELSE
         LET before == ReadThrough(a.s, o, PosZero, start, 1, <<>>) IN IF IsAbrupt(before) THEN before ELSE
         LET after == ReadThrough(before.s, o, NumAdd(start, Val(sc)), NumSub(NumSub(len, start), Val(sc)), 1, <<>>) IN
         IF IsAbrupt(after) THEN after ELSE FillArray(after.s, Val(a), Val(before) \o items \o Val(after))
    \* Array.prototype.unshift (§23.1.3.37).
    [] m = "unshift" ->
         LET newLen == NumAdd(len, NumFromInt(Len(args))) IN
         IF args # <<>> /\ NumLess(MaxSafeInteger, newLen) THEN ThrowTypeError(s)
         ELSE LET moved == IF args = <<>> THEN Ok(s, o) ELSE MoveElements(s, o, NumSub(len, OneNum), NumSub(newLen, OneNum), len, -1) IN
              IF IsAbrupt(moved) THEN moved ELSE
              LET w == SetElements(moved.s, o, args, PosZero) IN IF IsAbrupt(w) THEN w ELSE SetLength(w.s, o, newLen, Num(newLen))
    \* Array.prototype.with (§23.1.3.39).
    [] m = "with" ->
         LET r == ToIntegerOrInfinity(s, Arg(args, 1)) IN IF IsAbrupt(r) THEN r ELSE
         LET i == IF NumLess(Val(r).value, PosZero) THEN NumAdd(len, Val(r).value) ELSE Val(r).value IN
         IF NumLess(i, PosZero) \/ ~NumLess(i, len) THEN ThrowError(r.s, "RangeError") ELSE
         LET a == ArrayCreateLength(r.s, len) IN IF IsAbrupt(a) THEN a ELSE
         LET before == ReadThrough(a.s, o, PosZero, i, 1, <<>>) IN IF IsAbrupt(before) THEN before ELSE
         LET after == ReadThrough(before.s, o, NumAdd(i, OneNum), NumSub(NumSub(len, i), OneNum), 1, <<>>) IN
         IF IsAbrupt(after) THEN after ELSE FillArray(after.s, Val(a), Val(before) \o <<Arg(args, 2)>> \o Val(after))

\* The result of indexOf and lastIndexOf from their search.
SearchResult(r) == IF IsAbrupt(r) THEN r ELSE Ok(r.s, IF Val(r).stop THEN Val(r).st.found ELSE IntV(-1))

\* The Set of each value to the indices from k up (Array.prototype.push, splice, sort, unshift).
SetElements(s, o, values, k) ==
  IF values = <<>> THEN Ok(s, o)
  ELSE LET w == Set(s, o, Index(k), Head(values), TRUE) IN
       IF IsAbrupt(w) THEN w ELSE SetElements(w.s, o, Tail(values), NumAdd(k, OneNum))

\* The Get of count indices from k, stepping by dir, appended to acc.
ReadThrough(s, o, k, count, dir, acc) ==
  IF ~NumLess(PosZero, count) THEN Ok(s, acc)
  ELSE LET v == Get(s, o, Index(k)) IN
       IF IsAbrupt(v) THEN v ELSE ReadThrough(v.s, o, NumAdd(k, NumFromInt(dir)), NumSub(count, OneNum), dir, Append(acc, Val(v)))

FillFrom(s, o, k, final, value) ==
  IF ~NumLess(k, final) THEN Ok(s, o)
  ELSE LET w == Set(s, o, Index(k), value, TRUE) IN
       IF IsAbrupt(w) THEN w ELSE FillFrom(w.s, o, NumAdd(k, OneNum), final, value)

\* Array.prototype.includes's loop. An index no object has reads as undefined, so the loop
\* skips such indices unless it searches for undefined.
IncludesFrom(s, o, k, len, target) ==
  IF ~NumLess(k, len) THEN Ok(s, False)
  ELSE LET i == IF target = Undefined THEN k ELSE IndexCandidate(s, o, k, len, 1, FALSE) IN
  IF ~NumEqual(i, k) THEN IncludesFrom(s, o, i, len, target)
  ELSE LET v == Get(s, o, Index(k)) IN IF IsAbrupt(v) THEN v
  ELSE IF SameValueZero(target, Val(v)) THEN Ok(v.s, True)
  ELSE IncludesFrom(v.s, o, NumAdd(k, OneNum), len, target)

\* JoinIndexedProperties: the loop of Array.prototype.join, or of toLocaleString when isLocale.
JoinFrom(s, o, len, k, sep, acc, isLocale) ==
  IF ~NumLess(k, len) THEN Ok(s, Str(acc))
  ELSE LET e == Get(s, o, Index(k)) IN IF IsAbrupt(e) THEN e ELSE
       LET next == IF IsNullish(Val(e)) THEN Ok(e.s, EmptyStr)
                   ELSE IF ~isLocale THEN ToStr(e.s, Val(e))
                   ELSE LET r == Invoke(e.s, Val(e), SV("toLocaleString"), <<>>) IN IF IsAbrupt(r) THEN r ELSE ToStr(r.s, Val(r))
       IN IF IsAbrupt(next) THEN next
          ELSE JoinFrom(next.s, o, len, NumAdd(k, OneNum), sep,
                        (IF NumIsZero(k) THEN acc ELSE acc \o sep) \o Val(next).value, isLocale)

\* FindViaPredicate (§23.1.3.12.1), returning [index, value].
FindViaPredicate(s, o, len, dir, predicate, thisArg) ==
  IF ~IsCallable(s, predicate) THEN ThrowTypeError(s)
  ELSE FindFrom(s, o, IF dir = 1 THEN PosZero ELSE NumSub(len, OneNum), len, dir, predicate, thisArg)
FindFrom(s, o, k, len, dir, predicate, thisArg) ==
  IF NumLess(k, PosZero) \/ ~NumLess(k, len) THEN Ok(s, [index |-> IntV(-1), value |-> Undefined])
  ELSE LET v == Get(s, o, Index(k)) IN IF IsAbrupt(v) THEN v ELSE
       LET t == Call(v.s, predicate, thisArg, <<Val(v), Num(k), o>>) IN IF IsAbrupt(t) THEN t
       ELSE IF ToBooleanValue(Val(t)) THEN Ok(t.s, [index |-> Num(k), value |-> Val(v)])
       ELSE FindFrom(t.s, o, NumAdd(k, NumFromInt(dir)), len, dir, predicate, thisArg)

\* FlattenIntoArray (§23.1.3.13.1), with mapper Absent for none, returning the next target index.
FlattenIntoArray(s, target, source, sourceLen, start, depth, mapper, thisArg) ==
  LET r == VisitPresent(s, source, PosZero, sourceLen, 1, "flatten",
                        [target |-> target, depth |-> depth, fn |-> mapper, this |-> thisArg, index |-> start])
  IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(r).st.index)

\* Array.prototype.reverse's loop (§23.1.3.26 step 5), from lower up to middle. It skips the
\* steps where neither lower nor upper names a property, which do nothing.
ReverseFrom(s, o, len, lower, middle) ==
  IF ~NumLess(lower, middle) THEN Ok(s, o)
  ELSE
    LET upper == NumSub(NumSub(len, lower), OneNum)
        next == MathMin2(IndexCandidate(s, o, lower, middle, 1, FALSE),
                         NumSub(NumSub(len, OneNum),
                                IndexCandidate(s, o, upper, NumSub(NumSub(len, middle), OneNum), -1, FALSE)))
        lowerP == Index(lower)
        upperP == Index(upper)
    IN IF ~NumEqual(next, lower) THEN ReverseFrom(s, o, len, next, middle) ELSE
       LET lowerExists == HasProperty(s, o, lowerP) IN IF IsAbrupt(lowerExists) THEN lowerExists ELSE
       LET lowerValue == IF Val(lowerExists) = True THEN Get(lowerExists.s, o, lowerP) ELSE Ok(lowerExists.s, Undefined) IN
       IF IsAbrupt(lowerValue) THEN lowerValue ELSE
       LET upperExists == HasProperty(lowerValue.s, o, upperP) IN IF IsAbrupt(upperExists) THEN upperExists ELSE
       LET upperValue == IF Val(upperExists) = True THEN Get(upperExists.s, o, upperP) ELSE Ok(upperExists.s, Undefined) IN
       IF IsAbrupt(upperValue) THEN upperValue ELSE
       LET s1 == upperValue.s
           r == CASE Val(lowerExists) = True /\ Val(upperExists) = True ->
                       LET w == Set(s1, o, lowerP, Val(upperValue), TRUE) IN
                       IF IsAbrupt(w) THEN w ELSE Set(w.s, o, upperP, Val(lowerValue), TRUE)
                  [] Val(upperExists) = True ->
                       LET w == Set(s1, o, lowerP, Val(upperValue), TRUE) IN
                       IF IsAbrupt(w) THEN w ELSE DeletePropertyOrThrow(w.s, o, upperP)
                  [] Val(lowerExists) = True ->
                       LET d == DeletePropertyOrThrow(s1, o, lowerP) IN
                       IF IsAbrupt(d) THEN d ELSE Set(d.s, o, upperP, Val(lowerValue), TRUE)
                  [] OTHER -> Ok(s1, o)
       IN IF IsAbrupt(r) THEN r ELSE ReverseFrom(r.s, o, len, NumAdd(lower, OneNum), middle)

\* SortIndexedProperties (§23.1.3.30.1) with CompareArrayElements, skipping holes when skipHoles.
SortIndexedProperties(s, o, len, comparefn, skipHoles) ==
  LET items == IF ~skipHoles THEN ReadThrough(s, o, PosZero, len, 1, <<>>)
               ELSE LET r == VisitPresent(s, o, PosZero, len, 1, "collect", [items |-> <<>>]) IN
                    IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(r).st.items)
  IN IF IsAbrupt(items) THEN items ELSE MergeSort(items.s, Val(items), comparefn)

\* The sort itself is implementation-defined; this one is a stable merge sort.
MergeSort(s, items, comparefn) ==
  IF Len(items) <= 1 THEN Ok(s, items)
  ELSE LET half == Len(items) \div 2
           left == MergeSort(s, SubSeq(items, 1, half), comparefn)
       IN IF IsAbrupt(left) THEN left ELSE
          LET right == MergeSort(left.s, SubSeq(items, half + 1, Len(items)), comparefn) IN
          IF IsAbrupt(right) THEN right ELSE MergeSorted(right.s, Val(left), Val(right), comparefn, <<>>)
MergeSorted(s, xs, ys, comparefn, acc) ==
  IF xs = <<>> THEN Ok(s, acc \o ys)
  ELSE IF ys = <<>> THEN Ok(s, acc \o xs)
  ELSE LET c == CompareArrayElements(s, Head(ys), Head(xs), comparefn) IN
       IF IsAbrupt(c) THEN c
       ELSE IF NumLess(Val(c).value, PosZero) THEN MergeSorted(c.s, xs, Tail(ys), comparefn, Append(acc, Head(ys)))
       ELSE MergeSorted(c.s, Tail(xs), ys, comparefn, Append(acc, Head(xs)))

\* CompareArrayElements (§23.1.3.30.2).
CompareArrayElements(s, x, y, comparefn) ==
  CASE x = Undefined /\ y = Undefined -> Ok(s, IntV(0))
    [] x = Undefined -> Ok(s, IntV(1))
    [] y = Undefined -> Ok(s, IntV(-1))
    [] comparefn # Undefined ->
         LET c == Call(s, comparefn, Undefined, <<x, y>>) IN IF IsAbrupt(c) THEN c ELSE
         LET v == ToNumber(c.s, Val(c)) IN
         IF IsAbrupt(v) THEN v ELSE IF NumIsNaN(Val(v).value) THEN Ok(v.s, IntV(0)) ELSE v
    [] OTHER ->
         LET xs == ToStr(s, x) IN IF IsAbrupt(xs) THEN xs ELSE
         LET ys == ToStr(xs.s, y) IN IF IsAbrupt(ys) THEN ys ELSE
         Ok(ys.s, CASE CodeUnitLess(Val(xs).value, Val(ys).value) -> IntV(-1)
                    [] CodeUnitLess(Val(ys).value, Val(xs).value) -> IntV(1)
                    [] OTHER -> IntV(0))

\* Skipping absent indices. A loop over the indices of an array-like object, which can run up to
\* 2^53 - 1, visits only the indices that some object on its prototype chain may have as an own
\* property. That is observably the same as visiting every index: on the others HasProperty is
\* false and Get is undefined without running user code, so the step does nothing the loop can't
\* account for. IndexCandidate is the nearest such index from k toward bound (k included, bound
\* excluded) in direction dir, or bound if there is none. With own it looks at o's own properties
\* only, as DeletePropertyOrThrow does. A Proxy or another object whose properties only its
\* internal methods know makes it return k, so the loop visits k.
IndexCandidate(s, o, k, bound, dir, own) ==
  IF HasProp(O(s, o), Index(k)) THEN k
  ELSE LET objs == IF own THEN <<o>> ELSE PrototypeChainObjects(s, o) IN
       IF \E i \in DOMAIN objs : O(s, objs[i]).class \in {"proxy", "typedArray", "namespace"} THEN k
       ELSE LET c == NearestIndexIn(s, objs, k, dir, Absent) IN
            IF c # Absent /\ IndexInRange(c, bound, dir) THEN c ELSE bound

IndexInRange(k, bound, dir) == IF dir = 1 THEN NumLess(k, bound) ELSE NumLess(bound, k)

\* The objects on v's prototype chain, from v, up to the first Proxy.
PrototypeChainObjects(s, v) ==
  IF v = Null THEN <<>>
  ELSE IF O(s, v).class = "proxy" THEN <<v>>
  ELSE <<v>> \o PrototypeChainObjects(s, O(s, v).proto)

NearestIndexIn(s, objs, k, dir, best) ==
  IF objs = <<>> THEN best
  ELSE NearestIndexIn(s, Tail(objs), k, dir, NearerIndex(best, NearestOwnIndex(O(s, Head(objs)), k, dir), dir))

\* The nearest own integer key of the object record o from k in direction dir, or Absent. A
\* String exotic object also has the indices of its string.
NearestOwnIndex(o, k, dir) ==
  LET units == NearestIndexUnits(OwnIndexKeys(o) \o o.keys, NumToString(k), dir, Absent)
      size == IF o.class = "string" THEN NumFromInt(Len(o.slots.data)) ELSE PosZero
      fromString == CASE NumIsZero(size) -> Absent
                      [] NumLess(k, size) -> k
                      [] dir = 1 -> Absent
                      [] OTHER -> NumSub(size, OneNum)
  IN NearerIndex(IF units = Absent THEN Absent ELSE StrToNum(units), fromString, dir)

NearerIndex(a, b, dir) ==
  CASE a = Absent -> b
    [] b = Absent -> a
    [] OTHER -> IF (dir = 1) = NumLess(a, b) THEN a ELSE b

\* The nearest key among keys from the digits kU in direction dir, as digits, or best. Comparing
\* digits without leading zeros by length and then by code unit compares them as integers.
NearestIndexUnits(keys, kU, dir, best) ==
  IF keys = <<>> THEN best
  ELSE LET key == Head(keys)
           isNearer == /\ IsString(key)
                       /\ key.value # <<>>
                       /\ IsDigit(Head(key.value))
                       /\ IsCanonicalIntegerUnits(key.value)
                       /\ IF dir = 1 THEN ~DigitsBelow(key.value, kU) ELSE ~DigitsBelow(kU, key.value)
                       /\ \/ best = Absent
                          \/ IF dir = 1 THEN DigitsBelow(key.value, best) ELSE DigitsBelow(best, key.value)
       IN NearestIndexUnits(Tail(keys), kU, dir, IF isNearer THEN key.value ELSE best)

\* The loops that read the present indices from k toward bound in direction dir, as HasProperty
\* and then Get. Each present value goes to the step of method m, which updates the loop's state
\* st and may stop it. The result is [stop, st].
VisitPresent(s, o, k, bound, dir, m, st) ==
  IF ~IndexInRange(k, bound, dir) THEN Ok(s, [stop |-> FALSE, st |-> st])
  ELSE LET i == IndexCandidate(s, o, k, bound, dir, FALSE) IN
  IF ~NumEqual(i, k) THEN VisitPresent(s, o, i, bound, dir, m, st)
  ELSE LET pk == Index(k)
           present == HasProperty(s, o, pk)
       IN IF IsAbrupt(present) THEN present
          ELSE IF Val(present) = False THEN VisitPresent(present.s, o, NumAdd(k, NumFromInt(dir)), bound, dir, m, st)
          ELSE LET v == Get(present.s, o, pk) IN IF IsAbrupt(v) THEN v ELSE
               LET r == ArrayVisitStep(v.s, o, k, Val(v), m, st) IN
               IF IsAbrupt(r) \/ Val(r).stop THEN r
               ELSE VisitPresent(r.s, o, NumAdd(k, NumFromInt(dir)), bound, dir, m, Val(r).st)

VisitNext(s, st) == Ok(s, [stop |-> FALSE, st |-> st])

\* The step of VisitPresent for method m on the present value at index k.
ArrayVisitStep(s, o, k, value, m, st) ==
  CASE m = "copy" ->
         LET c == CreateDataPropertyOrThrow(s, st.a, Index(NumAdd(k, st.shift)), value) IN
         IF IsAbrupt(c) THEN c ELSE VisitNext(c.s, st)
    [] m = "collect" -> VisitNext(s, [st EXCEPT !.items = Append(@, value)])
    [] m = "indexOf" -> Ok(s, [stop |-> IsStrictlyEqual(st.target, value), st |-> [st EXCEPT !.found = Num(k)]])
    [] m = "reduceInit" -> Ok(s, [stop |-> TRUE, st |-> [st EXCEPT !.acc = value, !.next = NumAdd(k, NumFromInt(st.dir))]])
    [] m \in {"reduce", "reduceRight"} ->
         LET r == Call(s, st.fn, Undefined, <<st.acc, value, Num(k), o>>) IN
         IF IsAbrupt(r) THEN r ELSE VisitNext(r.s, [st EXCEPT !.acc = Val(r)])
    [] m = "flatten" ->
         LET mapped == IF st.fn = Absent THEN Ok(s, value) ELSE Call(s, st.fn, st.this, <<value, Num(k), o>>) IN
         IF IsAbrupt(mapped) THEN mapped ELSE
         LET shouldFlatten == IF NumLess(PosZero, st.depth) THEN IsArray(mapped.s, Val(mapped)) ELSE Ok(mapped.s, False) IN
         IF IsAbrupt(shouldFlatten) THEN shouldFlatten
         ELSE IF Val(shouldFlatten) = True THEN
           LET len == LengthOfArrayLike(shouldFlatten.s, Val(mapped)) IN IF IsAbrupt(len) THEN len ELSE
           LET r == FlattenIntoArray(len.s, st.target, Val(mapped), Val(len).value, st.index, NumSub(st.depth, OneNum), Absent, Undefined) IN
           IF IsAbrupt(r) THEN r ELSE VisitNext(r.s, [st EXCEPT !.index = Val(r)])
         ELSE IF ~NumLess(st.index, MaxSafeInteger) THEN ThrowTypeError(shouldFlatten.s)
         ELSE LET c == CreateDataPropertyOrThrow(shouldFlatten.s, st.target, Index(st.index), Val(mapped)) IN
              IF IsAbrupt(c) THEN c ELSE VisitNext(c.s, [st EXCEPT !.index = NumAdd(@, OneNum)])
    \* every, some, forEach, map, and filter call the callback.
    [] OTHER ->
         LET r == Call(s, st.fn, st.this, <<value, Num(k), o>>) IN
         IF IsAbrupt(r) THEN r
         ELSE CASE m = "every" -> Ok(r.s, [stop |-> ~ToBooleanValue(Val(r)), st |-> st])
                [] m = "some" -> Ok(r.s, [stop |-> ToBooleanValue(Val(r)), st |-> st])
                [] m = "forEach" -> VisitNext(r.s, st)
                [] m = "map" ->
                     LET c == CreateDataPropertyOrThrow(r.s, st.a, Index(k), Val(r)) IN
                     IF IsAbrupt(c) THEN c ELSE VisitNext(c.s, st)
                [] m = "filter" ->
                     IF ~ToBooleanValue(Val(r)) THEN VisitNext(r.s, st)
                     ELSE LET c == CreateDataPropertyOrThrow(r.s, st.a, Index(st.to), value) IN
                          IF IsAbrupt(c) THEN c ELSE VisitNext(c.s, [st EXCEPT !.to = NumAdd(@, OneNum)])

\* Moves count elements of o from index from to index to, stepping by dir, as copyWithin, shift,
\* unshift, and splice do (§23.1.3.4 step 16). It skips the steps where from names no property on
\* o's prototype chain and to names no own property of o, which do nothing.
MoveElements(s, o, from, to, count, dir) ==
  IF ~NumLess(PosZero, count) THEN Ok(s, o)
  ELSE
    LET step == NumFromInt(dir)
        skip == MathMin2(NumAbs(NumSub(IndexCandidate(s, o, from, NumAdd(from, NumMul(step, count)), dir, FALSE), from)),
                         NumAbs(NumSub(IndexCandidate(s, o, to, NumAdd(to, NumMul(step, count)), dir, TRUE), to)))
        fromKey == Index(from)
        toKey == Index(to)
    IN IF ~NumIsZero(skip)
       THEN MoveElements(s, o, NumAdd(from, NumMul(step, skip)), NumAdd(to, NumMul(step, skip)), NumSub(count, skip), dir)
       ELSE LET present == HasProperty(s, o, fromKey) IN IF IsAbrupt(present) THEN present ELSE
            LET r == IF Val(present) = True
                     THEN LET v == Get(present.s, o, fromKey) IN IF IsAbrupt(v) THEN v ELSE Set(v.s, o, toKey, Val(v), TRUE)
                     ELSE DeletePropertyOrThrow(present.s, o, toKey)
            IN IF IsAbrupt(r) THEN r ELSE MoveElements(r.s, o, NumAdd(from, step), NumAdd(to, step), NumSub(count, OneNum), dir)

\* DeletePropertyOrThrow of the indices from k toward bound, skipping those o doesn't have.
DeleteIndices(s, o, k, bound, dir) ==
  IF ~IndexInRange(k, bound, dir) THEN Ok(s, o)
  ELSE LET i == IndexCandidate(s, o, k, bound, dir, TRUE) IN
  IF ~NumEqual(i, k) THEN DeleteIndices(s, o, i, bound, dir)
  ELSE LET d == DeletePropertyOrThrow(s, o, Index(k)) IN
       IF IsAbrupt(d) THEN d ELSE DeleteIndices(d.s, o, NumAdd(k, NumFromInt(dir)), bound, dir)

\* CreateArrayIterator (§23.1.5.1). The closure's state lives in the slots: the object iterated,
\* the next index, the kind, and the generator state "suspended", "executing", or "completed".
CreateArrayIterator(s, array, kind) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "ArrayIteratorPrototype"), "arrayIterator",
                               [iterated |-> array, next |-> PosZero, kind |-> kind, state |-> "suspended"]))
  IN Ok(a.s, a.v)

\* %ArrayIteratorPrototype%.next (§23.1.5.2.1).
ArrayIteratorNext(s, this) ==
  LET r == ArrayIteratorResume(s, this) IN
  IF IsAbrupt(r) THEN r ELSE CreateIterResultObject(r.s, Val(r).value, Val(r).done)

\* GeneratorResume of the closure, which completes when it returns or throws, as [done, value]
\* rather than the iterator result object, which IteratorStepValue need not allocate.
ArrayIteratorResume(s, this) ==
  IF ~IsObject(this) \/ O(s, this).class # "arrayIterator" THEN ThrowTypeError(s)
  ELSE LET slots == O(s, this).slots IN
  IF slots.state = "executing" THEN ThrowTypeError(s)
  ELSE IF slots.state = "completed" THEN Ok(s, [done |-> TRUE, value |-> Undefined])
  ELSE LET r == ArrayIteratorStep(SetO(s, this, [O(s, this) EXCEPT !.slots.state = "executing"]), slots)
           isDone == IsAbrupt(r) \/ Val(r) = Empty
           s1 == SetO(r.s, this, [O(r.s, this) EXCEPT !.slots.state = IF isDone THEN "completed" ELSE "suspended",
                                                     !.slots.next = IF isDone THEN @ ELSE NumAdd(@, OneNum)])
       IN IF IsAbrupt(r) THEN Abrupt(s1, r.c)
          ELSE Ok(s1, [done |-> isDone, value |-> IF isDone THEN Undefined ELSE Val(r)])

\* One run of the closure of CreateArrayIterator: the value it yields, or Empty when it returns.
ArrayIteratorStep(s, slots) ==
  LET len == IF ~IsTypedArray(s, slots.iterated) THEN LengthOfArrayLike(s, slots.iterated)
             ELSE LET bounds == ValidateTypedArrayBounds(s, slots.iterated) IN
                  IF IsAbrupt(bounds) THEN bounds ELSE Ok(bounds.s, IntV(Val(bounds)))
  IN IF IsAbrupt(len) THEN len
  ELSE IF ~NumLess(slots.next, Val(len).value) THEN Ok(len.s, Empty)
  ELSE IF slots.kind = "key" THEN Ok(len.s, Num(slots.next))
  ELSE LET v == Get(len.s, slots.iterated, Index(slots.next)) IN IF IsAbrupt(v) THEN v
  ELSE IF slots.kind = "value" THEN v
  ELSE CreateArrayFromList(v.s, <<Num(slots.next), Val(v)>>)

ArrayIteratorBuiltin(s, f, m, this, args, nt) == ArrayIteratorNext(s, this)
