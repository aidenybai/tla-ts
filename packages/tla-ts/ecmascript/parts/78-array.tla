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
    [] m = "fromAsync" -> ArrayFromAsync(s, this, Arg(args, 1), Arg(args, 2), Arg(args, 3))
    \* The functions that go on with Array.fromAsync's steps where a value that it awaits settles.
    [] m = "fromAsyncFulfilled" -> FromAsyncRun(SetSlots(s, O(s, f).slots.data, [awaited |-> Arg(args, 1)]), O(s, f).slots.data)
    [] m = "fromAsyncRejected" ->
         LET fa == O(s, f).slots.data IN
         FromAsyncRun(SetSlots(s, fa, [step |-> IF Slots(s, fa).kind = "iterable" THEN "close" ELSE "reject",
                                       error |-> Arg(args, 1)]), fa)
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

\* Array.fromAsync (§23.1.2.2), as V8 runs it (array-from-async.tq): a state machine in a cell,
\* whose step runs until it awaits a value, through PromiseResolve and the functions that go on
\* where the value settles, or settles the promise that it gives. Where a step throws or a value it
\* awaits rejects, an iterator's return runs and its result is awaited before the promise rejects,
\* even where next threw; where getting or calling return throws, the promise stays pending.
ArrayFromAsync(s, c, items, mapper, thisArg) ==
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      r == FromAsyncStart(cap.s, c, items, mapper, thisArg, Val(cap).promise)
  IN IF IsAbrupt(r) THEN Ok(RejectPromise(r.s, Val(cap).promise, r.c.value), Val(cap).promise)
     ELSE Ok(r.s, Val(cap).promise)
FromAsyncStart(s, c, items, mapper, thisArg, promise) ==
  IF mapper # Undefined /\ ~IsCallable(s, mapper) THEN ThrowTypeError(s)
  ELSE LET usingAsync == GetMethod(s, items, SymAsyncIterator) IN
  IF IsAbrupt(usingAsync) THEN usingAsync
  ELSE LET usingSync == IF Val(usingAsync) # Undefined THEN Ok(usingAsync.s, Undefined) ELSE GetMethod(usingAsync.s, items, SymIterator) IN
  IF IsAbrupt(usingSync) THEN usingSync
  ELSE LET base == [promise |-> promise, mapper |-> mapper, thisArg |-> thisArg, index |-> PosZero, awaited |-> Undefined,
                    value |-> Undefined, mapped |-> Undefined, error |-> Undefined] IN
  IF Val(usingAsync) # Undefined \/ Val(usingSync) # Undefined THEN
    LET it == IF Val(usingAsync) # Undefined THEN GetIteratorFromMethod(usingSync.s, items, Val(usingAsync))
              ELSE LET sync == GetIteratorFromMethod(usingSync.s, items, Val(usingSync)) IN
                   IF IsAbrupt(sync) THEN sync ELSE CreateAsyncFromSyncIterator(sync.s, Val(sync))
    IN IF IsAbrupt(it) THEN it ELSE
    LET a == IF IsConstructor(it.s, c) THEN Construct(it.s, c, <<>>, c) ELSE ArrayCreate(it.s, 0, Intrinsic(it.s, "ArrayPrototype")) IN
    IF IsAbrupt(a) THEN a
    ELSE FromAsyncBegin(a.s, base @@
                             [kind |-> "iterable", step |-> "next", iterator |-> Val(it).iterator, next |-> Val(it).next, a |-> Val(a)])
  ELSE
    LET arrayLike == ToObject(usingSync.s, items) IN IF IsAbrupt(arrayLike) THEN arrayLike ELSE
    LET len == LengthOfArrayLike(arrayLike.s, Val(arrayLike)) IN IF IsAbrupt(len) THEN len ELSE
    LET a == IF IsConstructor(len.s, c) THEN Construct(len.s, c, <<Val(len)>>, c) ELSE ArrayCreateLength(len.s, Val(len).value) IN
    IF IsAbrupt(a) THEN a
    ELSE FromAsyncBegin(a.s, base @@ [kind |-> "arrayLike", step |-> "get", arrayLike |-> Val(arrayLike),
                                       len |-> Val(len).value, a |-> Val(a)])
FromAsyncBegin(s, slots) ==
  LET cell == AllocCell(s, slots)
      fulfilled == CreateBuiltinFunction(cell.s, <<"Array", "fromAsyncFulfilled">>, 1, <<>>, cell.v)
      rejected == CreateBuiltinFunction(fulfilled.s, <<"Array", "fromAsyncRejected">>, 1, <<>>, cell.v)
  IN FromAsyncRun(SetSlots(rejected.s, cell.v, [onFulfilled |-> Val(fulfilled), onRejected |-> Val(rejected)]), cell.v)
\* Runs the steps of the machine fa from its step, where a throw closes its iterator.
FromAsyncRun(s, fa) ==
  LET r == FromAsyncSteps(s, fa) IN
  IF ~IsAbrupt(r) THEN r
  ELSE LET s1 == SetSlots(r.s, fa, [error |-> r.c.value]) IN
       IF Slots(s1, fa).kind = "arrayLike" THEN Ok(RejectPromise(s1, Slots(s1, fa).promise, r.c.value), Undefined)
       ELSE LET closed == FromAsyncClose(s1, fa) IN
            IF closed.reject THEN Ok(RejectPromise(closed.s, Slots(closed.s, fa).promise, r.c.value), Undefined)
            ELSE Ok(closed.s, Undefined)
\* Awaits value: the machine goes on at step where it settles.
FromAsyncAwait(s, fa, step, value) ==
  LET s1 == SetSlots(s, fa, [step |-> step])
      p == PromiseResolve(s1, Intrinsic(s1, "Promise"), value)
  IN IF IsAbrupt(p) THEN p
     ELSE LET t == AddPromiseReactions(p.s, Val(p), Slots(p.s, fa).onFulfilled, Slots(p.s, fa).onRejected, Empty) IN
          Ok(t.s, Undefined)
\* The iterator's return, whose result the machine awaits with step "reject": reject is whether the
\* promise rejects now, as where the iterator has none. A throw is swallowed.
FromAsyncClose(s, fa) ==
  LET it == Slots(s, fa).iterator
      method == Get(s, it, SV("return"))
  IN IF IsAbrupt(method) THEN [s |-> method.s, reject |-> FALSE]
     ELSE IF Val(method) \in {Undefined, Null} THEN [s |-> method.s, reject |-> TRUE]
     ELSE LET inner == Call(method.s, Val(method), it, <<>>) IN
          IF IsAbrupt(inner) THEN [s |-> inner.s, reject |-> FALSE]
          ELSE [s |-> FromAsyncAwait(inner.s, fa, "reject", Val(inner)).s, reject |-> FALSE]
FromAsyncSteps(s, fa) ==
  LET st == Slots(s, fa) IN
  CASE st.step = "next" ->
         LET next == Call(s, st.next, st.iterator, <<>>) IN
         IF IsAbrupt(next) THEN next ELSE FromAsyncAwait(next.s, fa, "check", Val(next))
    [] st.step = "check" ->
         IF ~IsObject(st.awaited) THEN ThrowTypeError(s) ELSE
         LET done == IteratorComplete(s, st.awaited) IN IF IsAbrupt(done) THEN done
         ELSE IF Val(done) THEN FromAsyncSteps(SetSlots(done.s, fa, [step |-> "done"]), fa)
         ELSE LET v == Get(done.s, st.awaited, SV("value")) IN IF IsAbrupt(v) THEN v
         ELSE IF st.mapper # Undefined THEN FromAsyncSteps(SetSlots(v.s, fa, [step |-> "map", value |-> Val(v)]), fa)
         ELSE FromAsyncSteps(SetSlots(v.s, fa, [step |-> "add", mapped |-> Val(v)]), fa)
    [] st.step = "map" ->
         LET r == Call(s, st.mapper, st.thisArg, <<st.value, Num(st.index)>>) IN
         IF IsAbrupt(r) THEN r ELSE FromAsyncAwait(r.s, fa, "mapped", Val(r))
    [] st.step = "mapped" -> FromAsyncSteps(SetSlots(s, fa, [step |-> "add", mapped |-> st.awaited]), fa)
    [] st.step = "add" ->
         LET d == CreateDataPropertyOrThrow(s, st.a, Index(st.index), st.mapped) IN IF IsAbrupt(d) THEN d
         ELSE FromAsyncSteps(SetSlots(d.s, fa, [step |-> IF st.kind = "iterable" THEN "next" ELSE "get",
                                                index |-> NumAdd(st.index, OneNum)]), fa)
    [] st.step = "get" ->
         IF ~NumLess(st.index, st.len) THEN FromAsyncSteps(SetSlots(s, fa, [step |-> "done"]), fa)
         ELSE LET v == Get(s, st.arrayLike, Index(st.index)) IN IF IsAbrupt(v) THEN v ELSE FromAsyncAwait(v.s, fa, "value", Val(v))
    [] st.step = "value" ->
         IF st.mapper = Undefined THEN FromAsyncSteps(SetSlots(s, fa, [step |-> "add", mapped |-> st.awaited]), fa)
         ELSE LET r == Call(s, st.mapper, st.thisArg, <<st.awaited, Num(st.index)>>) IN
              IF IsAbrupt(r) THEN r ELSE FromAsyncAwait(r.s, fa, "mapped", Val(r))
    [] st.step = "done" ->
         LET l == Set(s, st.a, SV("length"), Num(st.index), TRUE) IN IF IsAbrupt(l) THEN l
         ELSE ResolvePromiseWith(l.s, st.promise, st.a)
    [] st.step = "close" ->
         LET closed == FromAsyncClose(SetSlots(s, fa, [step |-> "reject"]), fa) IN
         IF closed.reject THEN FromAsyncSteps(closed.s, fa) ELSE Ok(closed.s, Undefined)
    [] st.step = "reject" -> Ok(RejectPromise(s, st.promise, st.error), Undefined)

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
         IF IsAbrupt(sep) THEN sep ELSE JoinFrom(sep.s, o, len, Val(sep).value, Empty)
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
    \* Array.prototype.toLocaleString (§23.1.3.32, ECMA-402 §19.5.1), with "," as the list separator.
    [] m = "toLocaleString" -> JoinFrom(s, o, len, N(","), LocaleArguments(args))
    \* Array.prototype.toReversed (§23.1.3.33).
    [] m = "toReversed" ->
         LET a == ArrayCreateLength(s, len) IN IF IsAbrupt(a) THEN a ELSE
         LET values == ReadThrough(a.s, o, NumSub(len, OneNum), len, -1, NoChunks) IN
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
         LET before == ReadThrough(a.s, o, PosZero, start, 1, NoChunks) IN IF IsAbrupt(before) THEN before ELSE
         LET after == ReadThrough(before.s, o, NumAdd(start, Val(sc)), NumSub(NumSub(len, start), Val(sc)), 1, NoChunks) IN
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
         LET before == ReadThrough(a.s, o, PosZero, i, 1, NoChunks) IN IF IsAbrupt(before) THEN before ELSE
         LET after == ReadThrough(before.s, o, NumAdd(i, OneNum), NumSub(NumSub(len, i), OneNum), 1, NoChunks) IN
         IF IsAbrupt(after) THEN after ELSE FillArray(after.s, Val(a), Val(before) \o <<Arg(args, 2)>> \o Val(after))

\* The result of indexOf and lastIndexOf from their search.
SearchResult(r) == IF IsAbrupt(r) THEN r ELSE Ok(r.s, IF Val(r).stop THEN Val(r).st.found ELSE IntV(-1))

\* The Set of each value to the indices from k up (Array.prototype.push, splice, sort, unshift).
SetElements(s, o, values, k) == SetValuesFrom(s, o, values, 1, k)
\* The Set of the values from the i-th, by index rather than by Tail, which copies the rest.
SetValuesFrom(s, o, values, i, k) ==
  IF i > Len(values) THEN Ok(s, o)
  ELSE LET w == Set(s, o, Index(k), values[i], TRUE) IN
       IF IsAbrupt(w) THEN w ELSE SetValuesFrom(w.s, o, values, i + 1, NumAdd(k, OneNum))

\* The Get of count indices from k, stepping by dir, after the values in acc, in chunks.
ReadThrough(s, o, k, count, dir, acc) ==
  IF ~NumLess(PosZero, count) THEN Ok(s, ChunkValues(acc))
  ELSE LET v == Get(s, o, Index(k)) IN
       IF IsAbrupt(v) THEN v ELSE ReadThrough(v.s, o, NumAdd(k, NumFromInt(dir)), NumSub(count, OneNum), dir, ChunkAppend(acc, Val(v)))

\* More than 64 indices fill in halves, so that thousands of them nest log n deep rather than n.
FillFrom(s, o, k, final, value) ==
  IF ~NumLess(k, final) THEN Ok(s, o)
  ELSE IF NumFitsInt(final) /\ NumToInt(final) - NumToInt(k) > 64 THEN
       LET middle == NumFromInt((NumToInt(k) + NumToInt(final)) \div 2)
           first == FillFrom(s, o, k, middle, value)
       IN IF IsAbrupt(first) THEN first ELSE FillFrom(first.s, o, middle, final, value)
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

\* The arguments that toLocaleString passes each element's: ECMA-402's locales and options where
\* the host has Intl, else none.
LocaleArguments(args) == IF HostIntl(<<"none">>).found = "none" THEN <<>> ELSE <<Arg(args, 1), Arg(args, 2)>>

\* JoinIndexedProperties: the loop of Array.prototype.join, or of toLocaleString, which passes each
\* element's toLocaleString the arguments locale, where they aren't Empty. More than 64 elements
\* join in halves, so that thousands of them nest log n deep rather than n.
JoinFrom(s, o, len, sep, locale) ==
  LET r == JoinParts(s, o, len, PosZero, sep, NoChunks, locale)
  IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Str(FoldLeftSeq(ChunkValues(Val(r)))))
\* The units of the elements from k, each after the separator but the first, after the parts so
\* far, in chunks, so that joining n elements copies each element's units a few times, not n.
JoinParts(s, o, len, k, sep, parts, locale) ==
  IF ~NumLess(k, len) THEN Ok(s, parts)
  ELSE IF NumFitsInt(len) /\ NumToInt(len) - NumToInt(k) > 64 THEN
       LET middle == NumFromInt((NumToInt(k) + NumToInt(len)) \div 2)
           first == JoinParts(s, o, middle, k, sep, parts, locale)
       IN IF IsAbrupt(first) THEN first ELSE JoinParts(first.s, o, len, middle, sep, Val(first), locale)
  ELSE LET e == Get(s, o, Index(k)) IN IF IsAbrupt(e) THEN e ELSE
       LET next == IF IsNullish(Val(e)) THEN Ok(e.s, EmptyStr)
                   ELSE IF locale = Empty THEN ToStr(e.s, Val(e))
                   ELSE LET r == Invoke(e.s, Val(e), SV("toLocaleString"), locale) IN IF IsAbrupt(r) THEN r ELSE ToStr(r.s, Val(r))
       IN IF IsAbrupt(next) THEN next
          ELSE JoinParts(next.s, o, len, NumAdd(k, OneNum), sep,
                         ChunkAppend(IF NumIsZero(k) THEN parts ELSE ChunkAppend(parts, sep), Val(next).value), locale)

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
  LET items == IF ~skipHoles THEN ReadThrough(s, o, PosZero, len, 1, NoChunks)
               ELSE LET r == VisitPresent(s, o, PosZero, len, 1, "collect", [items |-> <<>>]) IN
                    IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(r).st.items)
  IN IF IsAbrupt(items) THEN items ELSE SortItems(items.s, Val(items), comparefn)

\* The sort itself is implementation-defined; this one is V8's (array-sort.tq, after CPython's
\* listsort), as Node 26 calls a comparator: it sorts the values other than undefined, and puts
\* undefined after them. Fewer than 8 values it inserts each after the first by binary search; more
\* it sorts by TimSort.
SortItems(s, items, comparefn) ==
  LET defined == SelectSeq(items, LAMBDA v : v # Undefined)
      undefineds == [i \in 1..(Len(items) - Len(defined)) |-> Undefined]
      sorted == CASE Len(defined) < 2 -> Ok(s, defined)
                  [] Len(defined) < 8 -> TsInsertionSort(s, defined, comparefn, 0, 1, Len(defined))
                  [] OTHER -> TsMain(s, comparefn, [w |-> defined, runs |-> <<>>, mg |-> 7], 0, Len(defined),
                                     TsMinRun(Len(defined), 0))
  IN IF IsAbrupt(sorted) THEN sorted ELSE Ok(sorted.s, Val(sorted) \o undefineds)

\* TimSort's steps, on a work array w that they index from 0 as V8 does, with the pending runs, each
\* [base, length], and minGallop, mg. TsLess is whether the comparator orders x before y.
TsLess(s, x, y, f) ==
  LET c == CompareArrayElements(s, x, y, f) IN IF IsAbrupt(c) THEN c ELSE Ok(c.s, NumLess(Val(c).value, PosZero))
TsSet(w, i, v) == [w EXCEPT ![i + 1] = v]
\* Copies count values of src from srcPos to dst at dstPos, as memmove does within one array.
TsCopy(src, srcPos, dst, dstPos, count) ==
  [j \in DOMAIN dst |-> IF j - 1 >= dstPos /\ j - 1 < dstPos + count THEN src[j - dstPos + srcPos] ELSE dst[j]]
\* ComputeMinRunLength.
TsMinRun(n, r) == IF n >= 64 THEN TsMinRun(n \div 2, IF n % 2 = 1 THEN 1 ELSE r) ELSE n + r

\* BinaryInsertionSort of w from low to before high, whose values from low to before start are sorted.
TsInsertionSort(s, w, f, low, start, high) ==
  IF start >= high THEN Ok(s, w)
  ELSE LET pivot == w[start + 1]
           left == TsInsertionPlace(s, w, f, pivot, low, start)
       IN IF IsAbrupt(left) THEN left
          ELSE TsInsertionSort(left.s,
                 [j \in DOMAIN w |-> IF j - 1 = Val(left) THEN pivot
                                     ELSE IF j - 1 > Val(left) /\ j - 1 <= start THEN w[j - 1] ELSE w[j]],
                 f, low, start + 1, high)
TsInsertionPlace(s, w, f, pivot, left, right) ==
  IF left >= right THEN Ok(s, left)
  ELSE LET mid == left + (right - left) \div 2
           c == TsLess(s, pivot, w[mid + 1], f)
       IN IF IsAbrupt(c) THEN c
          ELSE IF Val(c) THEN TsInsertionPlace(c.s, w, f, pivot, left, mid)
          ELSE TsInsertionPlace(c.s, w, f, pivot, mid + 1, right)

\* CountAndMakeRun from low to before high: [w, length], the run made ascending.
TsCountRun(s, w, f, low, high) ==
  IF low + 1 = high THEN Ok(s, [w |-> w, length |-> 1])
  ELSE LET c == TsLess(s, w[low + 2], w[low + 1], f) IN
       IF IsAbrupt(c) THEN c ELSE TsRunFrom(c.s, w, f, low, high, Val(c), low + 2)
TsRunFrom(s, w, f, low, high, isDescending, idx) ==
  IF idx >= high THEN Ok(s, TsRunMade(w, low, idx - low, isDescending))
  ELSE LET c == TsLess(s, w[idx + 1], w[idx], f) IN
       IF IsAbrupt(c) THEN c
       ELSE IF Val(c) = isDescending THEN TsRunFrom(c.s, w, f, low, high, isDescending, idx + 1)
       ELSE Ok(c.s, TsRunMade(w, low, idx - low, isDescending))
TsRunMade(w, low, length, isDescending) ==
  [w |-> IF ~isDescending THEN w
         ELSE [j \in DOMAIN w |-> IF j - 1 >= low /\ j - 1 < low + length THEN w[low + length - (j - 1 - low)] ELSE w[j]],
   length |-> length]

\* GallopLeft (~isRight) and GallopRight (isRight) of key in a from base, of length values, from hint.
TsCompareAt(s, f, a, key, i, isRight) == IF isRight THEN TsLess(s, key, a[i + 1], f) ELSE TsLess(s, a[i + 1], key, f)
TsGallop(s, f, a, key, base, length, hint, isRight) ==
  LET first == TsCompareAt(s, f, a, key, base + hint, isRight) IN
  IF IsAbrupt(first) THEN first
  ELSE TsGallopOut(first.s, f, a, key, base, length, hint, isRight, Val(first) = isRight, 0, 1)
\* The exponential search away from hint, toward lower offsets where goesLeft.
TsGallopOut(s, f, a, key, base, length, hint, isRight, goesLeft, lastOfs, offset) ==
  LET maxOfs == IF goesLeft THEN hint + 1 ELSE length - hint IN
  IF offset >= maxOfs THEN TsGallopIn(s, f, a, key, base, isRight, TsGallopLow(hint, goesLeft, lastOfs, maxOfs),
                                      TsGallopHigh(hint, goesLeft, lastOfs, maxOfs))
  ELSE LET c == TsCompareAt(s, f, a, key, IF goesLeft THEN base + hint - offset ELSE base + hint + offset, isRight) IN
       IF IsAbrupt(c) THEN c
       ELSE IF (IF isRight THEN Val(c) # goesLeft ELSE Val(c) = goesLeft)
       THEN TsGallopIn(c.s, f, a, key, base, isRight, TsGallopLow(hint, goesLeft, lastOfs, offset),
                       TsGallopHigh(hint, goesLeft, lastOfs, offset))
       ELSE TsGallopOut(c.s, f, a, key, base, length, hint, isRight, goesLeft, offset, 2 * offset + 1)
TsGallopLow(hint, goesLeft, lastOfs, offset) == (IF goesLeft THEN hint - offset ELSE lastOfs + hint) + 1
TsGallopHigh(hint, goesLeft, lastOfs, offset) == IF goesLeft THEN hint - lastOfs ELSE offset + hint
\* The binary search between lo and hi.
TsGallopIn(s, f, a, key, base, isRight, lo, hi) ==
  IF lo >= hi THEN Ok(s, hi)
  ELSE LET m == lo + (hi - lo) \div 2
           c == TsCompareAt(s, f, a, key, base + m, isRight)
       IN IF IsAbrupt(c) THEN c
          ELSE IF Val(c) = isRight THEN TsGallopIn(c.s, f, a, key, base, isRight, lo, m)
          ELSE TsGallopIn(c.s, f, a, key, base, isRight, m + 1, hi)

\* MergeAt of the pending runs i and i + 1, from 0.
TsMergeAt(s, f, st, i) ==
  LET baseA0 == st.runs[i + 1].base
      lengthA0 == st.runs[i + 1].length
      baseB == st.runs[i + 2].base
      lengthB0 == st.runs[i + 2].length
      runs == SubSeq(st.runs, 1, i) \o <<[base |-> baseA0, length |-> lengthA0 + lengthB0]>> \o SubSeq(st.runs, i + 3, Len(st.runs))
      k == TsGallop(s, f, st.w, st.w[baseB + 1], baseA0, lengthA0, 0, TRUE)
  IN IF IsAbrupt(k) THEN k ELSE
     LET baseA == baseA0 + Val(k)
         lengthA == lengthA0 - Val(k)
     IN IF lengthA = 0 THEN Ok(k.s, [st EXCEPT !.runs = runs]) ELSE
     LET lengthB == TsGallop(k.s, f, st.w, st.w[baseA + lengthA], baseB, lengthB0, lengthB0 - 1, FALSE) IN
     IF IsAbrupt(lengthB) THEN lengthB
     ELSE IF Val(lengthB) = 0 THEN Ok(lengthB.s, [st EXCEPT !.runs = runs]) ELSE
     LET merged == IF lengthA <= Val(lengthB) THEN TsMergeLow(lengthB.s, f, st.w, st.mg, baseA, lengthA, baseB, Val(lengthB))
                   ELSE TsMergeHigh(lengthB.s, f, st.w, st.mg, baseA, lengthA, baseB, Val(lengthB))
     IN IF IsAbrupt(merged) THEN merged ELSE Ok(merged.s, [w |-> Val(merged).w, runs |-> runs, mg |-> Val(merged).mg])

\* MergeLow: a merge state of w, the copy temp of run A, the cursors dest, ct into temp, and cb, the
\* lengths la and lb left, the minGallop that the sort state holds, mg, and the merge's own, lmg.
TsMergeLow(s, f, w, mg, baseA, lengthA, baseB, lengthB) ==
  LET m == [w |-> TsSet(w, baseA, w[baseB + 1]), temp |-> SubSeq(w, baseA + 1, baseA + lengthA), dest |-> baseA + 1,
            ct |-> 0, cb |-> baseB + 1, la |-> lengthA, lb |-> lengthB - 1, mg |-> mg, lmg |-> mg]
  IN IF m.lb = 0 THEN Ok(s, TsLowSucceed(m)) ELSE IF m.la = 1 THEN Ok(s, TsLowCopyB(m)) ELSE TsLowOne(s, f, m, 0, 0)
TsLowSucceed(m) == [w |-> IF m.la > 0 THEN TsCopy(m.temp, m.ct, m.w, m.dest, m.la) ELSE m.w, mg |-> m.mg]
TsLowCopyB(m) == [w |-> TsSet(TsCopy(m.w, m.cb, m.w, m.dest, m.lb), m.dest + m.lb, m.temp[m.ct + 1]), mg |-> m.mg]
TsLowFromB(m) == [m EXCEPT !.w = TsSet(m.w, m.dest, m.w[m.cb + 1]), !.dest = @ + 1, !.cb = @ + 1, !.lb = @ - 1]
TsLowFromA(m) == [m EXCEPT !.w = TsSet(m.w, m.dest, m.temp[m.ct + 1]), !.dest = @ + 1, !.ct = @ + 1, !.la = @ - 1]
\* One pair at a time, until one run wins lmg times in a row.
TsLowOne(s, f, m, winsA, winsB) ==
  LET c == TsLess(s, m.w[m.cb + 1], m.temp[m.ct + 1], f) IN
  IF IsAbrupt(c) THEN c
  ELSE IF Val(c) THEN
    LET n == TsLowFromB(m) IN
    IF n.lb = 0 THEN Ok(c.s, TsLowSucceed(n))
    ELSE IF winsB + 1 >= n.lmg THEN TsLowGallop(c.s, f, [n EXCEPT !.lmg = @ + 1], 0, winsB + 1, TRUE)
    ELSE TsLowOne(c.s, f, n, 0, winsB + 1)
  ELSE
    LET n == TsLowFromA(m) IN
    IF n.la = 1 THEN Ok(c.s, TsLowCopyB(n))
    ELSE IF winsA + 1 >= n.lmg THEN TsLowGallop(c.s, f, [n EXCEPT !.lmg = @ + 1], winsA + 1, 0, TRUE)
    ELSE TsLowOne(c.s, f, n, winsA + 1, 0)
\* Galloping, while either run wins at least kMinGallopWins (7) at once.
TsLowGallop(s, f, m, winsA, winsB, isFirst) ==
  IF ~(winsA >= 7 \/ winsB >= 7 \/ isFirst) THEN TsLowOne(s, f, [m EXCEPT !.lmg = @ + 1, !.mg = m.lmg + 1], 0, 0) ELSE
  LET m1 == [m EXCEPT !.lmg = IF m.lmg - 1 < 1 THEN 1 ELSE m.lmg - 1, !.mg = IF m.lmg - 1 < 1 THEN 1 ELSE m.lmg - 1]
      ka == TsGallop(s, f, m1.temp, m1.w[m1.cb + 1], m1.ct, m1.la, 0, TRUE)
  IN IF IsAbrupt(ka) THEN ka ELSE
  LET a == Val(ka)
      m2 == IF a > 0 THEN [m1 EXCEPT !.w = TsCopy(m1.temp, m1.ct, m1.w, m1.dest, a), !.dest = @ + a, !.ct = @ + a, !.la = @ - a] ELSE m1
  IN IF a > 0 /\ m2.la = 1 THEN Ok(ka.s, TsLowCopyB(m2))
     ELSE IF a > 0 /\ m2.la = 0 THEN Ok(ka.s, TsLowSucceed(m2)) ELSE
     LET m3 == TsLowFromB(m2) IN
     IF m3.lb = 0 THEN Ok(ka.s, TsLowSucceed(m3)) ELSE
     LET kb == TsGallop(ka.s, f, m3.w, m3.temp[m3.ct + 1], m3.cb, m3.lb, 0, FALSE) IN
     IF IsAbrupt(kb) THEN kb ELSE
     LET b == Val(kb)
         m4 == IF b > 0 THEN [m3 EXCEPT !.w = TsCopy(m3.w, m3.cb, m3.w, m3.dest, b), !.dest = @ + b, !.cb = @ + b, !.lb = @ - b] ELSE m3
     IN IF b > 0 /\ m4.lb = 0 THEN Ok(kb.s, TsLowSucceed(m4)) ELSE
     LET m5 == TsLowFromA(m4) IN
     IF m5.la = 1 THEN Ok(kb.s, TsLowCopyB(m5)) ELSE TsLowGallop(kb.s, f, m5, a, b, FALSE)

\* MergeHigh, from the ends of the runs: temp is the copy of run B, and ca the cursor into run A.
TsMergeHigh(s, f, w, mg, baseA, lengthA, baseB, lengthB) ==
  LET m == [w |-> TsSet(w, baseB + lengthB - 1, w[baseA + lengthA]), temp |-> SubSeq(w, baseB + 1, baseB + lengthB),
            dest |-> baseB + lengthB - 2, ct |-> lengthB - 1, ca |-> baseA + lengthA - 2, la |-> lengthA - 1,
            lb |-> lengthB, mg |-> mg, lmg |-> mg, baseA |-> baseA]
  IN IF m.la = 0 THEN Ok(s, TsHighSucceed(m)) ELSE IF m.lb = 1 THEN Ok(s, TsHighCopyA(m)) ELSE TsHighOne(s, f, m, 0, 0)
TsHighSucceed(m) == [w |-> IF m.lb > 0 THEN TsCopy(m.temp, 0, m.w, m.dest - (m.lb - 1), m.lb) ELSE m.w, mg |-> m.mg]
TsHighCopyA(m) ==
  [w |-> TsSet(TsCopy(m.w, m.ca - m.la + 1, m.w, m.dest - m.la + 1, m.la), m.dest - m.la, m.temp[m.ct + 1]), mg |-> m.mg]
TsHighFromA(m) == [m EXCEPT !.w = TsSet(m.w, m.dest, m.w[m.ca + 1]), !.dest = @ - 1, !.ca = @ - 1, !.la = @ - 1]
TsHighFromB(m) == [m EXCEPT !.w = TsSet(m.w, m.dest, m.temp[m.ct + 1]), !.dest = @ - 1, !.ct = @ - 1, !.lb = @ - 1]
TsHighOne(s, f, m, winsA, winsB) ==
  LET c == TsLess(s, m.temp[m.ct + 1], m.w[m.ca + 1], f) IN
  IF IsAbrupt(c) THEN c
  ELSE IF Val(c) THEN
    LET n == TsHighFromA(m) IN
    IF n.la = 0 THEN Ok(c.s, TsHighSucceed(n))
    ELSE IF winsA + 1 >= n.lmg THEN TsHighGallop(c.s, f, [n EXCEPT !.lmg = @ + 1], winsA + 1, 0, TRUE)
    ELSE TsHighOne(c.s, f, n, winsA + 1, 0)
  ELSE
    LET n == TsHighFromB(m) IN
    IF n.lb = 1 THEN Ok(c.s, TsHighCopyA(n))
    ELSE IF winsB + 1 >= n.lmg THEN TsHighGallop(c.s, f, [n EXCEPT !.lmg = @ + 1], 0, winsB + 1, TRUE)
    ELSE TsHighOne(c.s, f, n, 0, winsB + 1)
TsHighGallop(s, f, m, winsA, winsB, isFirst) ==
  IF ~(winsA >= 7 \/ winsB >= 7 \/ isFirst) THEN TsHighOne(s, f, [m EXCEPT !.lmg = @ + 1, !.mg = m.lmg + 1], 0, 0) ELSE
  LET m1 == [m EXCEPT !.lmg = IF m.lmg - 1 < 1 THEN 1 ELSE m.lmg - 1, !.mg = IF m.lmg - 1 < 1 THEN 1 ELSE m.lmg - 1]
      kr == TsGallop(s, f, m1.w, m1.temp[m1.ct + 1], m1.baseA, m1.la, m1.la - 1, TRUE)
  IN IF IsAbrupt(kr) THEN kr ELSE
  LET a == m1.la - Val(kr)
      m2 == IF a > 0 THEN [m1 EXCEPT !.w = TsCopy(m1.w, m1.ca - a + 1, m1.w, m1.dest - a + 1, a), !.dest = @ - a,
                                     !.ca = @ - a, !.la = @ - a] ELSE m1
  IN IF a > 0 /\ m2.la = 0 THEN Ok(kr.s, TsHighSucceed(m2)) ELSE
     LET m3 == TsHighFromB(m2) IN
     IF m3.lb = 1 THEN Ok(kr.s, TsHighCopyA(m3)) ELSE
     LET kl == TsGallop(kr.s, f, m3.temp, m3.w[m3.ca + 1], 0, m3.lb, m3.lb - 1, FALSE) IN
     IF IsAbrupt(kl) THEN kl ELSE
     LET b == m3.lb - Val(kl)
         m4 == IF b > 0 THEN [m3 EXCEPT !.w = TsCopy(m3.temp, m3.ct - b + 1, m3.w, m3.dest - b + 1, b), !.dest = @ - b,
                                        !.ct = @ - b, !.lb = @ - b] ELSE m3
     IN IF b > 0 /\ m4.lb = 1 THEN Ok(kl.s, TsHighCopyA(m4))
        ELSE IF b > 0 /\ m4.lb = 0 THEN Ok(kl.s, TsHighSucceed(m4)) ELSE
        LET m5 == TsHighFromA(m4) IN
        IF m5.la = 0 THEN Ok(kl.s, TsHighSucceed(m5)) ELSE TsHighGallop(kl.s, f, m5, a, b, FALSE)

\* MergeCollapse and MergeForceCollapse.
TsRunLength(runs, i) == runs[i + 1].length
TsInvariant(runs, n) == n < 2 \/ TsRunLength(runs, n - 2) > TsRunLength(runs, n - 1) + TsRunLength(runs, n)
TsCollapse(s, f, st) ==
  IF Len(st.runs) <= 1 THEN Ok(s, st) ELSE
  LET n == Len(st.runs) - 2 IN
  IF ~TsInvariant(st.runs, n + 1) \/ ~TsInvariant(st.runs, n) THEN
    LET r == TsMergeAt(s, f, st, IF TsRunLength(st.runs, n - 1) < TsRunLength(st.runs, n + 1) THEN n - 1 ELSE n) IN
    IF IsAbrupt(r) THEN r ELSE TsCollapse(r.s, f, Val(r))
  ELSE IF TsRunLength(st.runs, n) <= TsRunLength(st.runs, n + 1) THEN
    LET r == TsMergeAt(s, f, st, n) IN IF IsAbrupt(r) THEN r ELSE TsCollapse(r.s, f, Val(r))
  ELSE Ok(s, st)
TsForceCollapse(s, f, st) ==
  IF Len(st.runs) <= 1 THEN Ok(s, st.w) ELSE
  LET n == Len(st.runs) - 2
      r == TsMergeAt(s, f, st, IF n > 0 /\ TsRunLength(st.runs, n - 1) < TsRunLength(st.runs, n + 1) THEN n - 1 ELSE n)
  IN IF IsAbrupt(r) THEN r ELSE TsForceCollapse(r.s, f, Val(r))

\* ArrayTimSortImpl from low, with remaining values left.
TsMain(s, f, st, low, remaining, minRun) ==
  IF remaining = 0 THEN TsForceCollapse(s, f, st) ELSE
  LET run == TsCountRun(s, st.w, f, low, low + remaining) IN
  IF IsAbrupt(run) THEN run ELSE
  LET runLength == IF Val(run).length >= minRun THEN Val(run).length ELSE IF minRun < remaining THEN minRun ELSE remaining
      extended == TsInsertionSort(run.s, Val(run).w, f, low, low + Val(run).length, low + runLength)
  IN IF IsAbrupt(extended) THEN extended ELSE
  LET collapsed == TsCollapse(extended.s, f, [st EXCEPT !.w = Val(extended), !.runs = Append(@, [base |-> low, length |-> runLength])]) IN
  IF IsAbrupt(collapsed) THEN collapsed
  ELSE TsMain(collapsed.s, f, Val(collapsed), low + runLength, remaining - runLength, minRun)

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
\* st and may stop it. The result is [stop, st]. More than 64 indices run in halves, so that
\* thousands of them nest log n deep rather than n.
VisitPresent(s, o, k, bound, dir, m, st) ==
  IF ~IndexInRange(k, bound, dir) THEN Ok(s, [stop |-> FALSE, st |-> st])
  ELSE IF NumFitsInt(k) /\ NumFitsInt(bound) /\ dir * (NumToInt(bound) - NumToInt(k)) > 64 THEN
       LET middle == NumFromInt((NumToInt(k) + NumToInt(bound)) \div 2)
           first == VisitPresent(s, o, k, middle, dir, m, st)
       IN IF IsAbrupt(first) \/ Val(first).stop THEN first ELSE VisitPresent(first.s, o, middle, bound, dir, m, Val(first).st)
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

\* CreateArrayIterator (§23.1.5.1). The iterator's state lives in the slots: the object iterated,
\* the next index, the kind, and whether it's done, as V8 keeps it (ArrayIteratorPrototypeNext),
\* where the spec runs a generator's closure.
CreateArrayIterator(s, array, kind) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "ArrayIteratorPrototype"), "arrayIterator",
                               [iterated |-> array, next |-> PosZero, kind |-> kind, state |-> "suspended"]))
  IN Ok(a.s, a.v)

\* %ArrayIteratorPrototype%.next (§23.1.5.2.1).
ArrayIteratorNext(s, this) ==
  LET r == ArrayIteratorResume(s, this) IN
  IF IsAbrupt(r) THEN r ELSE CreateIterResultObject(r.s, Val(r).value, Val(r).done)

\* A step of the iterator, as [done, value] rather than the iterator result object, which
\* IteratorStepValue need not allocate. As V8's, it moves the next index on before it reads the
\* value, and a throw leaves it as it was, where the spec's closure completes: as a typed array's
\* bounds or an object's length throw, which a later step may read again.
ArrayIteratorResume(s, this) ==
  IF ~IsObject(this) \/ O(s, this).class # "arrayIterator" THEN ThrowTypeError(s)
  ELSE LET slots == O(s, this).slots IN
  IF slots.state = "completed" THEN Ok(s, [done |-> TRUE, value |-> Undefined])
  ELSE LET len == IF ~IsTypedArray(s, slots.iterated) THEN LengthOfArrayLike(s, slots.iterated)
                  ELSE LET bounds == ValidateTypedArrayBounds(s, slots.iterated) IN
                       IF IsAbrupt(bounds) THEN bounds ELSE Ok(bounds.s, IntV(Val(bounds)))
  IN IF IsAbrupt(len) THEN len
  ELSE IF ~NumLess(slots.next, Val(len).value)
  THEN Ok(SetO(len.s, this, [O(len.s, this) EXCEPT !.slots.state = "completed"]), [done |-> TRUE, value |-> Undefined])
  ELSE LET moved == SetO(len.s, this, [O(len.s, this) EXCEPT !.slots.next = NumAdd(@, OneNum)]) IN
  IF slots.kind = "key" THEN Ok(moved, [done |-> FALSE, value |-> Num(slots.next)])
  ELSE LET v == Get(moved, slots.iterated, Index(slots.next)) IN
  IF IsAbrupt(v) THEN v
  ELSE IF slots.kind = "value" THEN Ok(v.s, [done |-> FALSE, value |-> Val(v)])
  ELSE LET entry == CreateArrayFromList(v.s, <<Num(slots.next), Val(v)>>) IN Ok(entry.s, [done |-> FALSE, value |-> Val(entry)])

ArrayIteratorBuiltin(s, f, m, this, args, nt) == ArrayIteratorNext(s, this)
