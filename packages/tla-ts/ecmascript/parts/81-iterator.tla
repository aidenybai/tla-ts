\* The Iterator constructor and Iterator.prototype's helpers (§27.1.3, §27.1.4), %IteratorHelperPrototype%
\* (§27.1.2.1), and %WrapForValidIteratorPrototype% (§27.1.3.2.1.1). engine262 runs a helper as a
\* generator over an abstract closure. Here a helper is an object of class "iteratorHelper" whose
\* slots hold where its closure is: [state, kind, iterated, fn, counter, remaining, inner, size,
\* partial, buffer, finished], with state a generator state, kind the method that made it, iterated
\* the underlying Iterator Record, fn the callback, counter and remaining Numbers, inner flatMap's
\* inner Iterator Record or Empty, size the Number of values chunks and windows yield together,
\* partial whether windows yields a last undersized window, buffer the values so far, and finished
\* whether the last chunk or window is out. Iterator.concat's helper holds [state, kind, items, inner,
\* finished] instead, with items the [method, iterable] pairs it has yet to open and inner the one it
\* is on or Empty. Iterator.zip's and Iterator.zipKeyed's hold [state, kind, iters, open, mode,
\* padding, keys, finished] (§27.1.3.2.2 IteratorZip), with open the indices of the iterators that
\* are not done and keys zipKeyed's keys or Empty. chunks, windows, includes, and join are of the
\* proposals engine262 implements.
IteratorHelperIntrinsics ==
  << IntrinsicFunction("Iterator", "FunctionPrototype", <<"IteratorHelper", "constructor">>, 0, N("Iterator"), TRUE),
     IntrinsicObject("IteratorHelperPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("WrapForValidIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]) >>

IteratorHelperProperties ==
  << L("Iterator", SV("prototype"), "IteratorPrototype", FALSE, FALSE, FALSE),
     M("Iterator", SV("concat"), "IteratorHelper", "concat", 0),
     M("Iterator", SV("from"), "IteratorHelper", "from", 1),
     M("Iterator", SV("zip"), "IteratorHelper", "zip", 1),
     M("Iterator", SV("zipKeyed"), "IteratorHelper", "zipKeyed", 1),
     G("IteratorPrototype", SV("constructor"), "IteratorHelper", "getConstructor", "setConstructor"),
     M("IteratorPrototype", SV("chunks"), "IteratorHelper", "chunks", 1),
     M("IteratorPrototype", SV("drop"), "IteratorHelper", "drop", 1),
     M("IteratorPrototype", SV("every"), "IteratorHelper", "every", 1),
     M("IteratorPrototype", SV("filter"), "IteratorHelper", "filter", 1),
     M("IteratorPrototype", SV("find"), "IteratorHelper", "find", 1),
     M("IteratorPrototype", SV("flatMap"), "IteratorHelper", "flatMap", 1),
     M("IteratorPrototype", SV("forEach"), "IteratorHelper", "forEach", 1),
     M("IteratorPrototype", SV("includes"), "IteratorHelper", "includes", 1),
     M("IteratorPrototype", SV("join"), "IteratorHelper", "join", 1),
     M("IteratorPrototype", SV("map"), "IteratorHelper", "map", 1),
     M("IteratorPrototype", SV("reduce"), "IteratorHelper", "reduce", 1),
     M("IteratorPrototype", SV("some"), "IteratorHelper", "some", 1),
     M("IteratorPrototype", SV("take"), "IteratorHelper", "take", 1),
     M("IteratorPrototype", SV("toArray"), "IteratorHelper", "toArray", 0),
     M("IteratorPrototype", SV("windows"), "IteratorHelper", "windows", 1),
     G("IteratorPrototype", SymToStringTag, "IteratorHelper", "getToStringTag", "setToStringTag"),
     M("IteratorHelperPrototype", SV("next"), "IteratorHelper", "helperNext", 0),
     M("IteratorHelperPrototype", SV("return"), "IteratorHelper", "helperReturn", 0),
     V("IteratorHelperPrototype", SymToStringTag, SV("Iterator Helper"), FALSE, FALSE, TRUE),
     M("WrapForValidIteratorPrototype", SV("next"), "IteratorHelper", "wrapNext", 0),
     M("WrapForValidIteratorPrototype", SV("return"), "IteratorHelper", "wrapReturn", 0),
     GlobalLink("Iterator", N("Iterator")) >>

\* GetIteratorDirect (§7.4.2).
GetIteratorDirect(s, obj) ==
  LET next == Get(s, obj, SV("next")) IN IF IsAbrupt(next) THEN next ELSE Ok(next.s, JsIterator(obj, Val(next)))

\* GetIteratorFlattenable (§7.4.5), with primitives "reject" or "iterate-strings".
GetIteratorFlattenable(s, obj, primitives) ==
  IF ~IsObject(obj) /\ (primitives = "reject" \/ ~IsString(obj)) THEN ThrowTypeError(s) ELSE
  LET method == GetMethod(s, obj, SymIterator) IN
  IF IsAbrupt(method) THEN method ELSE
  LET iterator == IF Val(method) = Undefined THEN Ok(method.s, obj) ELSE Call(method.s, Val(method), obj, <<>>) IN
  IF IsAbrupt(iterator) THEN iterator
  ELSE IF ~IsObject(Val(iterator)) THEN ThrowTypeError(iterator.s)
  ELSE GetIteratorDirect(iterator.s, Val(iterator))

\* IteratorCloseAll (§7.4.12), which closes the last record first.
IteratorCloseAll(s, records, completion) ==
  IF records = <<>> THEN Abrupt(s, completion) ELSE
  LET closed == IteratorClose(s, records[Len(records)], completion) IN
  IteratorCloseAll(closed.s, SubSeq(records, 1, Len(records) - 1), closed.c)

NewHelper(s, slots) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "IteratorHelperPrototype"), "iteratorHelper", slots)) IN Ok(a.s, a.v)

\* Where a helper's closure stops: at a Yield of value, or done.
HelperYield(s, slots, value) == Ok(s, [done |-> FALSE, value |-> value, slots |-> slots])
HelperDone(s, slots) == Ok(s, [done |-> TRUE, value |-> Undefined, slots |-> slots])

\* Runs a helper's closure from where it stopped to its next Yield or its end. A callback that
\* throws closes the underlying iterator.
HelperStep(s, slots) ==
  CASE slots.finished -> HelperDone(s, slots)
    [] slots.kind = "concat" /\ slots.inner = Empty ->
         IF slots.items = <<>> THEN HelperDone(s, slots) ELSE
         LET iter == Call(s, Head(slots.items).method, Head(slots.items).iterable, <<>>) IN
         IF IsAbrupt(iter) THEN iter
         ELSE IF ~IsObject(Val(iter)) THEN ThrowTypeError(iter.s) ELSE
         LET record == GetIteratorDirect(iter.s, Val(iter)) IN
         IF IsAbrupt(record) THEN record ELSE HelperStep(record.s, [slots EXCEPT !.items = Tail(@), !.inner = Val(record)])
    [] slots.kind = "concat" ->
         LET next == IteratorStepValue(s, slots.inner) IN
         CASE IsAbrupt(next) -> next
           [] Val(next).done -> HelperStep(next.s, [slots EXCEPT !.inner = Empty])
           [] OTHER -> HelperYield(next.s, slots, Val(next).value)
    [] slots.kind = "zip" -> IF slots.iters = <<>> THEN HelperDone(s, slots) ELSE ZipStep(s, slots, 1, <<>>)
    [] slots.kind \in {"chunks", "windows"} ->
         LET next == IteratorStepValue(s, slots.iterated)
             full == NumFromInt(Len(slots.buffer)) = slots.size
         IN CASE IsAbrupt(next) -> next
              [] Val(next).done ->
                   IF slots.buffer # <<>> /\ (slots.kind = "chunks" \/ (slots.partial /\ ~full))
                   THEN LET a == CreateArrayFromList(next.s, slots.buffer)
                        IN HelperYield(a.s, [slots EXCEPT !.finished = TRUE], Val(a))
                   ELSE HelperDone(next.s, slots)
              [] OTHER ->
                   LET buffer == Append(IF slots.kind = "windows" /\ full THEN Tail(slots.buffer) ELSE slots.buffer, Val(next).value)
                       stepped == [slots EXCEPT !.iterated = Val(next).iterator,
                                                !.buffer = IF slots.kind = "chunks" /\ NumFromInt(Len(buffer)) = slots.size THEN <<>> ELSE buffer]
                   IN IF NumFromInt(Len(buffer)) = slots.size
                      THEN LET a == CreateArrayFromList(next.s, buffer) IN HelperYield(a.s, stepped, Val(a))
                      ELSE HelperStep(next.s, stepped)
    [] slots.kind = "flatMap" /\ slots.inner # Empty ->
         LET next == IteratorStepValue(s, slots.inner) IN
         CASE IsAbrupt(next) -> IteratorClose(next.s, slots.iterated, next.c)
           [] Val(next).done -> HelperStep(next.s, [slots EXCEPT !.inner = Empty, !.counter = NumAdd(@, OneNum)])
           [] OTHER -> HelperYield(next.s, [slots EXCEPT !.inner = Val(next).iterator], Val(next).value)
    [] slots.kind = "take" /\ slots.remaining = PosZero ->
         LET closed == IteratorClose(s, slots.iterated, Completion("return", Undefined, Empty)) IN
         IF closed.c.type = "throw" THEN closed ELSE HelperDone(closed.s, slots)
    [] slots.kind = "drop" /\ slots.remaining # PosZero ->
         LET next == IteratorNext(s, slots.iterated, <<>>) IN IF IsAbrupt(next) THEN next ELSE
         LET done == IteratorComplete(next.s, Val(next)) IN
         IF IsAbrupt(done) THEN done
         ELSE IF Val(done) THEN HelperDone(done.s, slots)
         ELSE HelperStep(done.s, [slots EXCEPT !.remaining = NumSub(@, OneNum)])
    [] OTHER ->
         LET next == IteratorStepValue(s, slots.iterated) IN
         IF IsAbrupt(next) THEN next
         ELSE IF Val(next).done THEN HelperDone(next.s, slots) ELSE
         LET value == Val(next).value
             stepped == [slots EXCEPT !.iterated = Val(next).iterator,
                                      !.remaining = IF slots.kind = "take" THEN NumSub(@, OneNum) ELSE @]
             counted == [stepped EXCEPT !.counter = NumAdd(@, OneNum)]
         IN IF slots.kind \in {"take", "drop"} THEN HelperYield(next.s, stepped, value) ELSE
            LET called == Call(next.s, slots.fn, Undefined, <<value, Num(slots.counter)>>) IN
            IF IsAbrupt(called) THEN IteratorClose(called.s, slots.iterated, called.c)
            ELSE CASE slots.kind = "map" -> HelperYield(called.s, counted, Val(called))
                   [] slots.kind = "filter" ->
                        IF ToBooleanValue(Val(called)) THEN HelperYield(called.s, counted, value) ELSE HelperStep(called.s, counted)
                   [] OTHER ->
                        LET inner == GetIteratorFlattenable(called.s, Val(called), "reject") IN
                        IF IsAbrupt(inner) THEN IteratorClose(inner.s, slots.iterated, inner.c)
                        ELSE HelperStep(inner.s, [stepped EXCEPT !.inner = Val(inner)])

\* The steps of a lazy helper (§27.1.4.3, .5, .6, .10, .13) before it makes its object: the
\* iterator closes when an argument is invalid.
CreateHelper(s, this, kind, args) ==
  IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
  LET arg == Arg(args, 1)
      record == JsIterator(this, Undefined)
      undersized == Arg(args, 2)
      CloseWith(state, kind2) == LET error == ThrowError(state, kind2) IN IteratorClose(error.s, record, error.c)
      limit == IF kind \in {"take", "drop"} THEN ToNumber(s, arg) ELSE Ok(s, Undefined)
      n == Val(limit).value
  IN CASE kind \in {"map", "filter", "flatMap"} /\ ~IsCallable(s, arg) -> CloseWith(s, "TypeError")
       [] kind \in {"chunks", "windows"} /\ (~IsNumber(arg) \/ ~NumIsIntegral(arg.value)) -> CloseWith(s, "TypeError")
       [] kind \in {"chunks", "windows"} /\ (NumLess(arg.value, OneNum) \/ NumLess(NumFromBigNat(FALSE, BNSub(BNPow2(32), <<1>>), 0), arg.value)) ->
            CloseWith(s, "RangeError")
       [] kind = "windows" /\ undersized # Undefined /\ undersized # SV("only-full") /\ undersized # SV("allow-partial") ->
            CloseWith(s, "TypeError")
       [] IsAbrupt(limit) -> IteratorClose(limit.s, record, limit.c)
       [] kind \in {"take", "drop"} /\ (NumIsNaN(n) \/ (NumIsFinite(n) /\ NumLess(MaxSafeInteger, n)) \/ NumLess(NumToIntegerOrInfinity(n), PosZero)) ->
            CloseWith(limit.s, "RangeError")
       [] OTHER ->
            LET iterated == GetIteratorDirect(limit.s, this) IN
            IF IsAbrupt(iterated) THEN iterated ELSE
            NewHelper(iterated.s, [state |-> "suspendedStart", kind |-> kind, iterated |-> Val(iterated),
                                   fn |-> arg, counter |-> PosZero,
                                   remaining |-> IF kind \in {"take", "drop"} THEN NumToIntegerOrInfinity(n) ELSE PosZero,
                                   inner |-> Empty, size |-> IF IsNumber(arg) THEN arg.value ELSE PosZero,
                                   partial |-> undersized = SV("allow-partial"), buffer |-> <<>>, finished |-> FALSE])

\* Iterator.concat (§27.1.3.2.1) up to the helper it makes, with acc the pairs so far.
IteratorConcatItems(s, items, acc) ==
  IF items = <<>> THEN NewHelper(s, [state |-> "suspendedStart", kind |-> "concat", items |-> acc, inner |-> Empty, finished |-> FALSE])
  ELSE IF ~IsObject(Head(items)) THEN ThrowTypeError(s) ELSE
  LET method == GetMethod(s, Head(items), SymIterator) IN
  CASE IsAbrupt(method) -> method
    [] Val(method) = Undefined -> ThrowTypeError(method.s)
    [] OTHER -> IteratorConcatItems(method.s, Tail(items), Append(acc, [method |-> Val(method), iterable |-> Head(items)]))

\* The options of Iterator.zip and Iterator.zipKeyed (§27.1.3.2.3 steps 1 to 7), as [mode, padding].
ZipOptions(s, iterables, options) ==
  IF ~IsObject(iterables) THEN ThrowTypeError(s) ELSE
  LET object == CASE options = Undefined -> OrdinaryObjectCreate(s, Null)
                  [] IsObject(options) -> Ok(s, options)
                  [] OTHER -> ThrowTypeError(s)
  IN IF IsAbrupt(object) THEN object ELSE
  LET mode == Get(object.s, Val(object), SV("mode")) IN
  IF IsAbrupt(mode) THEN mode
  ELSE IF Val(mode) \notin {Undefined, SV("shortest"), SV("longest"), SV("strict")} THEN ThrowTypeError(mode.s) ELSE
  LET name == CASE Val(mode) = SV("longest") -> "longest" [] Val(mode) = SV("strict") -> "strict" [] OTHER -> "shortest"
      padding == IF name = "longest" THEN Get(mode.s, Val(object), SV("padding")) ELSE Ok(mode.s, Undefined)
  IN CASE IsAbrupt(padding) -> padding
       [] Val(padding) # Undefined /\ ~IsObject(Val(padding)) -> ThrowTypeError(padding.s)
       [] OTHER -> Ok(padding.s, [mode |-> name, padding |-> Val(padding)])

\* Iterator.zip's loop over its iterables (§27.1.3.2.3 step 12), as [keys, iters].
ZipIterables(s, input, iters) ==
  LET next == IteratorStepValue(s, input) IN
  CASE IsAbrupt(next) -> IteratorCloseAll(next.s, iters, next.c)
    [] Val(next).done -> Ok(next.s, [keys |-> Empty, iters |-> iters])
    [] OTHER ->
         LET iter == GetIteratorFlattenable(next.s, Val(next).value, "reject") IN
         IF IsAbrupt(iter) THEN IteratorCloseAll(iter.s, <<input>> \o iters, iter.c)
         ELSE ZipIterables(iter.s, input, Append(iters, Val(iter)))

\* Iterator.zipKeyed's loop over the own keys of its iterables (§27.1.3.2.4 step 12), as [keys, iters].
ZipKeys(s, iterables, keys, picked, iters) ==
  IF keys = <<>> THEN Ok(s, [keys |-> picked, iters |-> iters]) ELSE
  LET desc == GetOwnProperty(s, iterables, Head(keys)) IN
  IF IsAbrupt(desc) THEN IteratorCloseAll(desc.s, iters, desc.c)
  ELSE IF Val(desc) = Absent \/ Val(desc).enumerable # True THEN ZipKeys(desc.s, iterables, Tail(keys), picked, iters) ELSE
  LET value == Get(desc.s, iterables, Head(keys)) IN
  IF IsAbrupt(value) THEN IteratorCloseAll(value.s, iters, value.c)
  ELSE IF Val(value) = Undefined THEN ZipKeys(value.s, iterables, Tail(keys), picked, iters) ELSE
  LET iter == GetIteratorFlattenable(value.s, Val(value), "reject") IN
  IF IsAbrupt(iter) THEN IteratorCloseAll(iter.s, iters, iter.c)
  ELSE ZipKeys(iter.s, iterables, Tail(keys), Append(picked, Head(keys)), Append(iters, Val(iter)))

\* The padding values Iterator.zip takes from the padding iterator it, closing it when it has more.
ZipPadding(s, it, iters, acc) ==
  IF Len(acc) = Len(iters) THEN
    LET closed == IteratorClose(s, it, NormalCompletion(Undefined)) IN
    IF IsAbrupt(closed) THEN IteratorCloseAll(closed.s, iters, closed.c) ELSE Ok(closed.s, acc)
  ELSE LET next == IteratorStepValue(s, it) IN
  CASE IsAbrupt(next) -> IteratorCloseAll(next.s, iters, next.c)
    [] Val(next).done -> Ok(next.s, acc \o [i \in 1..(Len(iters) - Len(acc)) |-> Undefined])
    [] OTHER -> ZipPadding(next.s, it, iters, Append(acc, Val(next).value))

\* The padding values Iterator.zipKeyed reads from the padding object, one for each key.
ZipKeyedPadding(s, padding, keys, iters, acc) ==
  IF Len(acc) = Len(keys) THEN Ok(s, acc) ELSE
  LET value == Get(s, padding, keys[Len(acc) + 1]) IN
  IF IsAbrupt(value) THEN IteratorCloseAll(value.s, iters, value.c)
  ELSE ZipKeyedPadding(value.s, padding, keys, iters, Append(acc, Val(value)))

\* Iterator.zip and Iterator.zipKeyed (§27.1.3.2.3, §27.1.3.2.4) up to the helper they make.
ZipMethod(s, isKeyed, iterables, options) ==
  LET parsed == ZipOptions(s, iterables, options) IN
  IF IsAbrupt(parsed) THEN parsed ELSE
  LET collected ==
        IF isKeyed THEN
          LET keys == OwnPropertyKeys(parsed.s, iterables) IN
          IF IsAbrupt(keys) THEN keys ELSE ZipKeys(keys.s, iterables, Val(keys), <<>>, <<>>)
        ELSE LET input == GetIterator(parsed.s, iterables, "sync") IN
             IF IsAbrupt(input) THEN input ELSE ZipIterables(input.s, Val(input), <<>>)
  IN IF IsAbrupt(collected) THEN collected ELSE
  LET iters == Val(collected).iters
      paddingOption == Val(parsed).padding
      padding == CASE Val(parsed).mode # "longest" -> Ok(collected.s, <<>>)
                   [] paddingOption = Undefined -> Ok(collected.s, [i \in DOMAIN iters |-> Undefined])
                   [] isKeyed -> ZipKeyedPadding(collected.s, paddingOption, Val(collected).keys, iters, <<>>)
                   [] OTHER ->
                        LET it == GetIterator(collected.s, paddingOption, "sync") IN
                        IF IsAbrupt(it) THEN IteratorCloseAll(it.s, iters, it.c) ELSE ZipPadding(it.s, Val(it), iters, <<>>)
  IN IF IsAbrupt(padding) THEN padding
     ELSE NewHelper(padding.s, [state |-> "suspendedStart", kind |-> "zip", iters |-> iters, open |-> [i \in DOMAIN iters |-> i],
                               mode |-> Val(parsed).mode, padding |-> Val(padding), keys |-> Val(collected).keys, finished |-> FALSE])

\* IteratorZip's closure (§27.1.3.2.2 step 3) from iterator i on, with results the values so far.
OpenIterators(slots) == MapSeq(slots.open, LAMBDA i : slots.iters[i])
ZipStep(s, slots, i, results) ==
  IF i > Len(slots.iters) THEN
    LET finished ==
          IF slots.keys = Empty THEN CreateArrayFromList(s, results)
          ELSE LET obj == OrdinaryObjectCreate(s, Null) IN ZipFill(obj.s, Val(obj), slots.keys, results)
    IN HelperYield(finished.s, slots, Val(finished))
  ELSE IF slots.iters[i] = Empty THEN ZipStep(s, slots, i + 1, Append(results, slots.padding[i])) ELSE
  LET next == IteratorStepValue(s, slots.iters[i])
      closed == [slots EXCEPT !.open = Remove(@, i)]
  IN CASE IsAbrupt(next) -> IteratorCloseAll(next.s, OpenIterators(closed), next.c)
       [] ~Val(next).done -> ZipStep(next.s, slots, i + 1, Append(results, Val(next).value))
       [] slots.mode = "shortest" ->
            LET r == IteratorCloseAll(next.s, OpenIterators(closed), Completion("return", Undefined, Empty)) IN
            IF r.c.type = "throw" THEN r ELSE HelperDone(r.s, closed)
       [] slots.mode = "strict" /\ i # 1 -> LET error == ThrowTypeError(next.s) IN IteratorCloseAll(error.s, OpenIterators(closed), error.c)
       [] slots.mode = "strict" -> ZipStrict(next.s, closed, 2)
       [] closed.open = <<>> -> HelperDone(next.s, closed)
       [] OTHER -> ZipStep(next.s, [closed EXCEPT !.iters[i] = Empty], i + 1, Append(results, slots.padding[i]))

\* Strict mode once the first iterator is done: every other iterator k on must be done too.
ZipStrict(s, slots, k) ==
  IF k > Len(slots.iters) THEN HelperDone(s, slots) ELSE
  LET next == IteratorNext(s, slots.iters[k], <<>>)
      done == IF IsAbrupt(next) THEN next ELSE IteratorComplete(next.s, Val(next))
      closed == [slots EXCEPT !.open = Remove(@, k)]
  IN CASE IsAbrupt(done) -> IteratorCloseAll(done.s, OpenIterators(closed), done.c)
       [] Val(done) -> ZipStrict(done.s, closed, k + 1)
       [] OTHER -> LET error == ThrowTypeError(done.s) IN IteratorCloseAll(error.s, OpenIterators(slots), error.c)

ZipFill(s, obj, keys, values) ==
  IF keys = <<>> THEN Ok(s, obj) ELSE
  LET r == CreateDataPropertyOrThrow(s, obj, Head(keys), Head(values)) IN ZipFill(r.s, obj, Tail(keys), Tail(values))

\* The eager methods (§27.1.4.2, .4, .7, .8, .9, .11, .12) once the iterator is direct, from its
\* next value on, with acc what they have so far.
EagerLoop(s, kind, it, fn, counter, acc) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN
    CASE kind = "toArray" -> CreateArrayFromList(next.s, acc)
      [] kind = "every" -> Ok(next.s, True)
      [] kind = "some" -> Ok(next.s, False)
      [] OTHER -> Ok(next.s, acc)
  ELSE IF kind = "toArray" THEN EagerLoop(next.s, kind, Val(next).iterator, fn, counter, Append(acc, Val(next).value))
  ELSE LET value == Val(next).value
           called == Call(next.s, fn, Undefined,
                          IF kind = "reduce" THEN <<acc, value, Num(counter)>> ELSE <<value, Num(counter)>>)
           result == IF IsAbrupt(called) THEN Undefined ELSE ToBooleanValue(Val(called))
       IN CASE IsAbrupt(called) -> IteratorClose(called.s, it, called.c)
            [] kind = "every" /\ ~result -> IteratorClose(called.s, it, NormalCompletion(False))
            [] kind = "some" /\ result -> IteratorClose(called.s, it, NormalCompletion(True))
            [] kind = "find" /\ result -> IteratorClose(called.s, it, NormalCompletion(value))
            [] OTHER -> EagerLoop(called.s, kind, Val(next).iterator, fn, NumAdd(counter, OneNum),
                                  IF kind = "reduce" THEN Val(called) ELSE acc)

EagerMethod(s, this, kind, args) ==
  IF ~IsObject(this) THEN ThrowTypeError(s)
  ELSE IF kind # "toArray" /\ ~IsCallable(s, Arg(args, 1)) THEN
    LET error == ThrowTypeError(s) IN IteratorClose(error.s, JsIterator(this, Undefined), error.c)
  ELSE LET it == GetIteratorDirect(s, this) IN
  IF IsAbrupt(it) THEN it
  ELSE IF kind = "reduce" /\ Len(args) < 2 THEN
    LET first == IteratorStepValue(it.s, Val(it)) IN
    IF IsAbrupt(first) THEN first
    ELSE IF Val(first).done THEN ThrowTypeError(first.s)
    ELSE EagerLoop(first.s, kind, Val(first).iterator, Arg(args, 1), OneNum, Val(first).value)
  ELSE EagerLoop(it.s, kind, Val(it), Arg(args, 1), PosZero,
                 CASE kind = "toArray" -> <<>> [] kind = "reduce" -> Arg(args, 2) [] OTHER -> Undefined)

\* Iterator.prototype.includes, which skips skipped values first.
IncludesMethod(s, this, search, skipped) ==
  IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
  LET CloseWith(kind) == LET error == ThrowError(s, kind) IN IteratorClose(error.s, JsIterator(this, Undefined), error.c)
      toSkip == IF skipped = Undefined THEN PosZero ELSE skipped.value
  IN CASE skipped # Undefined /\ (~IsNumber(skipped) \/ (NumIsFinite(skipped.value) /\ ~NumIsIntegral(skipped.value)) \/ NumIsNaN(skipped.value)) ->
            CloseWith("TypeError")
       [] NumLess(toSkip, PosZero) \/ (NumIsFinite(toSkip) /\ NumLess(MaxSafeInteger, toSkip)) -> CloseWith("RangeError")
       [] OTHER -> LET it == GetIteratorDirect(s, this) IN IF IsAbrupt(it) THEN it ELSE IncludesLoop(it.s, Val(it), search, toSkip)
IncludesLoop(s, it, search, toSkip) ==
  LET next == IteratorStepValue(s, it) IN
  CASE IsAbrupt(next) -> next
    [] Val(next).done -> Ok(next.s, False)
    [] NumLess(PosZero, toSkip) -> IncludesLoop(next.s, Val(next).iterator, search, NumSub(toSkip, OneNum))
    [] SameValueZero(Val(next).value, search) -> IteratorClose(next.s, Val(next).iterator, NormalCompletion(True))
    [] OTHER -> IncludesLoop(next.s, Val(next).iterator, search, toSkip)

\* Iterator.prototype.join, which writes undefined and null as empty.
JoinMethod(s, this, separator) ==
  IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
  LET sep == IF separator = Undefined THEN Ok(s, SV(",")) ELSE ToStr(s, separator) IN
  IF IsAbrupt(sep) THEN IteratorClose(sep.s, JsIterator(this, Undefined), sep.c) ELSE
  LET it == GetIteratorDirect(sep.s, this) IN
  IF IsAbrupt(it) THEN it ELSE JoinLoop(it.s, Val(it), Val(sep).value, TRUE, <<>>)
JoinLoop(s, it, sep, isFirst, acc) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, Str(acc)) ELSE
  LET value == Val(next).value
      str == IF IsNullish(value) THEN Ok(next.s, EmptyStr) ELSE ToStr(next.s, value)
  IN IF IsAbrupt(str) THEN IteratorClose(str.s, it, str.c)
     ELSE JoinLoop(str.s, Val(next).iterator, sep, FALSE, (IF isFirst THEN acc ELSE acc \o sep) \o Val(str).value)

\* %IteratorHelperPrototype%.next and .return (§27.1.2.1.1, §27.1.2.1.2), with GeneratorValidate.
SetHelperSlots(s, this, slots) == SetO(s, this, [O(s, this) EXCEPT !.slots = slots])
HelperNext(s, this) ==
  IF ~IsObject(this) \/ O(s, this).class # "iteratorHelper" THEN ThrowTypeError(s) ELSE
  LET slots == O(s, this).slots IN
  CASE slots.state = "executing" -> ThrowTypeError(s)
    [] slots.state = "completed" -> CreateIterResultObject(s, Undefined, TRUE)
    [] OTHER ->
         LET r == HelperStep(SetHelperSlots(s, this, [slots EXCEPT !.state = "executing"]), slots) IN
         IF IsAbrupt(r) THEN Abrupt(SetHelperSlots(r.s, this, [slots EXCEPT !.state = "completed"]), r.c)
         ELSE CreateIterResultObject(SetHelperSlots(r.s, this, [Val(r).slots EXCEPT !.state = IF Val(r).done THEN "completed" ELSE "suspendedYield"]),
                                     Val(r).value, Val(r).done)
HelperReturn(s, this) ==
  IF ~IsObject(this) \/ O(s, this).class # "iteratorHelper" THEN ThrowTypeError(s) ELSE
  LET slots == O(s, this).slots
      isStart == slots.state = "suspendedStart"
      marked == SetHelperSlots(s, this, [slots EXCEPT !.state = IF isStart THEN "completed" ELSE "executing"])
      completion == IF isStart THEN NormalCompletion(Undefined) ELSE Completion("return", Undefined, Empty)
      closed ==
        CASE slots.kind = "zip" -> IteratorCloseAll(marked, OpenIterators(slots), completion)
          [] slots.kind = "concat" /\ isStart -> Abrupt(marked, completion)
          [] slots.kind = "concat" -> IteratorClose(marked, slots.inner, completion)
          [] isStart -> IteratorClose(marked, slots.iterated, completion)
          [] slots.kind = "flatMap" /\ slots.inner # Empty ->
               LET inner == IteratorClose(marked, slots.inner, completion) IN IteratorClose(inner.s, slots.iterated, inner.c)
          [] slots.finished -> Abrupt(marked, completion)
          [] OTHER -> IteratorClose(marked, slots.iterated, completion)
  IN CASE slots.state = "executing" -> ThrowTypeError(s)
       [] slots.state = "completed" -> CreateIterResultObject(s, Undefined, TRUE)
       [] OTHER ->
            LET done == SetHelperSlots(closed.s, this, [slots EXCEPT !.state = "completed"]) IN
            IF closed.c.type = "throw" THEN Abrupt(done, closed.c) ELSE CreateIterResultObject(done, Undefined, TRUE)

IteratorHelperBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined \/ nt = f THEN ThrowTypeError(s)
         ELSE OrdinaryCreateFromConstructor(s, nt, "IteratorPrototype", "ordinary", [none |-> TRUE])
    \* Iterator.from (§27.1.3.2.1).
    [] m = "from" ->
         LET it == GetIteratorFlattenable(s, Arg(args, 1), "iterate-strings") IN
         IF IsAbrupt(it) THEN it ELSE
         LET has == OrdinaryHasInstance(it.s, Intrinsic(it.s, "Iterator"), Val(it).iterator) IN
         IF IsAbrupt(has) THEN has
         ELSE IF Val(has) = True THEN Ok(has.s, Val(it).iterator)
         ELSE LET a == Alloc(has.s, MakeObject(Intrinsic(has.s, "WrapForValidIteratorPrototype"), "wrapForValidIterator",
                                               [iterated |-> Val(it)]))
              IN Ok(a.s, a.v)
    \* The Iterator.prototype accessors (§27.1.4.1, §27.1.4.14).
    [] m = "getConstructor" -> Ok(s, Intrinsic(s, "Iterator"))
    [] m = "getToStringTag" -> Ok(s, SV("Iterator"))
    [] m \in {"setConstructor", "setToStringTag"} ->
         LET r == SetterThatIgnoresPrototypeProperties(s, this, Intrinsic(s, "IteratorPrototype"),
                                                       IF m = "setConstructor" THEN SV("constructor") ELSE SymToStringTag, Arg(args, 1))
         IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)
    [] m \in {"chunks", "drop", "filter", "flatMap", "map", "take", "windows"} -> CreateHelper(s, this, m, args)
    [] m = "concat" -> IteratorConcatItems(s, args, <<>>)
    [] m \in {"zip", "zipKeyed"} -> ZipMethod(s, m = "zipKeyed", Arg(args, 1), Arg(args, 2))
    [] m = "includes" -> IncludesMethod(s, this, Arg(args, 1), Arg(args, 2))
    [] m = "join" -> JoinMethod(s, this, Arg(args, 1))
    [] m \in {"every", "find", "forEach", "reduce", "some", "toArray"} -> EagerMethod(s, this, m, args)
    [] m = "helperNext" -> HelperNext(s, this)
    [] m = "helperReturn" -> HelperReturn(s, this)
    \* %WrapForValidIteratorPrototype%.next and .return (§27.1.3.2.1.1.1, §27.1.3.2.1.1.2).
    [] ~IsObject(this) \/ O(s, this).class # "wrapForValidIterator" -> ThrowTypeError(s)
    [] m = "wrapNext" -> Call(s, O(s, this).slots.iterated.next, O(s, this).slots.iterated.iterator, <<>>)
    [] m = "wrapReturn" ->
         LET iterator == O(s, this).slots.iterated.iterator
             return == GetMethod(s, iterator, SV("return"))
         IN IF IsAbrupt(return) THEN return
            ELSE IF Val(return) = Undefined THEN CreateIterResultObject(return.s, Undefined, TRUE)
            ELSE Call(return.s, Val(return), iterator, <<>>)
