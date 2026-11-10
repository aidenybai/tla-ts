\* Promise objects (§27.2) and the job queue. A promise has class "promise" and slots [state,
\* result, fulfillReactions, rejectReactions, isHandled]. A PromiseCapability Record is
\* [promise, resolve, reject], and a PromiseReaction Record [capability, type, handler] with
\* capability or handler Empty when absent. Jobs (§9.5) are [kind |-> "reaction", reaction,
\* argument] or [kind |-> "thenable", promise, thenable, then], run in order once a script ends.
\* State that several closures share lives in the slots of a "cell" object, which no script sees.

AllocCell(s, slots) == Alloc(s, MakeObject(Null, "cell", slots))
Slots(s, v) == O(s, v).slots
SetSlots(s, v, slots) == SetO(s, v, [O(s, v) EXCEPT !.slots = slots @@ @])

IsPromise(s, v) == IsObject(v) /\ O(s, v).class = "promise"

\* CreateResolvingFunctions (§27.2.1.3), returning [s, resolve, reject].
CreateResolvingFunctions(s, promise) ==
  LET cell == AllocCell(s, [promise |-> promise])
      resolve == CreateBuiltinFunction(cell.s, <<"Promise", "resolveFunction">>, 1, <<>>, cell.v)
      reject == CreateBuiltinFunction(resolve.s, <<"Promise", "rejectFunction">>, 1, <<>>, cell.v)
  IN [s |-> reject.s, resolve |-> Val(resolve), reject |-> Val(reject)]

\* The resolve function (§27.2.1.3.2).
ResolvePromiseWith(s, promise, resolution) ==
  IF SameValue(resolution, promise) THEN
    LET e == ThrowTypeError(s) IN Ok(RejectPromise(e.s, promise, e.c.value), Undefined)
  ELSE IF ~IsObject(resolution) THEN Ok(FulfillPromise(s, promise, resolution), Undefined)
  ELSE LET then == Get(s, resolution, SV("then")) IN
  IF IsAbrupt(then) THEN Ok(RejectPromise(then.s, promise, then.c.value), Undefined)
  ELSE IF ~IsCallable(then.s, Val(then)) THEN Ok(FulfillPromise(then.s, promise, resolution), Undefined)
  ELSE Ok(EnqueueJob(then.s, [kind |-> "thenable", promise |-> promise, thenable |-> resolution, then |-> Val(then)]), Undefined)

EnqueueJob(s, job) == [s EXCEPT !.jobs = Append(@, job)]

\* FulfillPromise (§27.2.1.4) and RejectPromise (§27.2.1.7), returning the state.
SettlePromise(s, promise, state, value) ==
  LET reactions == IF state = "fulfilled" THEN Slots(s, promise).fulfillReactions ELSE Slots(s, promise).rejectReactions
      s1 == SetSlots(s, promise, [state |-> state, result |-> value, fulfillReactions |-> <<>>, rejectReactions |-> <<>>])
  IN [s1 EXCEPT !.jobs = @ \o [i \in DOMAIN reactions |-> [kind |-> "reaction", reaction |-> reactions[i], argument |-> value]]]
FulfillPromise(s, promise, value) == SettlePromise(s, promise, "fulfilled", value)
RejectPromise(s, promise, reason) == SettlePromise(s, promise, "rejected", reason)

\* NewPromiseCapability (§27.2.1.5).
NewPromiseCapability(s, c) ==
  IF ~IsConstructor(s, c) THEN ThrowTypeError(s) ELSE
  LET cell == AllocCell(s, [resolve |-> Undefined, reject |-> Undefined])
      executor == CreateBuiltinFunction(cell.s, <<"Promise", "capabilityExecutor">>, 2, <<>>, cell.v)
      promise == Construct(executor.s, c, <<Val(executor)>>, c)
  IN IF IsAbrupt(promise) THEN promise
     ELSE IF ~IsCallable(promise.s, Slots(promise.s, cell.v).resolve) THEN ThrowTypeError(promise.s)
     ELSE IF ~IsCallable(promise.s, Slots(promise.s, cell.v).reject) THEN ThrowTypeError(promise.s)
     ELSE Ok(promise.s, [promise |-> Val(promise), resolve |-> Slots(promise.s, cell.v).resolve,
                         reject |-> Slots(promise.s, cell.v).reject])

\* PromiseResolve (§27.2.4.7.1).
PromiseResolve(s, c, x) ==
  LET ctor == IF IsPromise(s, x) THEN Get(s, x, SV("constructor")) ELSE Ok(s, Undefined) IN
  IF IsAbrupt(ctor) THEN ctor
  ELSE IF IsPromise(s, x) /\ SameValue(Val(ctor), c) THEN Ok(ctor.s, x)
  ELSE LET cap == NewPromiseCapability(ctor.s, c) IN
       IF IsAbrupt(cap) THEN cap ELSE
       LET r == Call(cap.s, Val(cap).resolve, Undefined, <<x>>) IN
       IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(cap).promise)

\* PerformPromiseThen (§27.2.5.4.1) with a capability or Empty.
AddPromiseReactions(s, promise, onFulfilled, onRejected, cap) ==
  LET reaction(type, handler) == [capability |-> cap, type |-> type,
                                  handler |-> IF IsCallable(s, handler) THEN handler ELSE Empty]
      slots == Slots(s, promise)
      s1 == CASE slots.state = "pending" ->
                   SetSlots(s, promise, [fulfillReactions |-> Append(slots.fulfillReactions, reaction("fulfill", onFulfilled)),
                                         rejectReactions |-> Append(slots.rejectReactions, reaction("reject", onRejected))])
              [] slots.state = "fulfilled" ->
                   EnqueueJob(s, [kind |-> "reaction", reaction |-> reaction("fulfill", onFulfilled), argument |-> slots.result])
              [] OTHER ->
                   EnqueueJob(s, [kind |-> "reaction", reaction |-> reaction("reject", onRejected), argument |-> slots.result])
  IN Ok(SetSlots(s1, promise, [isHandled |-> TRUE]), IF cap = Empty THEN Undefined ELSE cap.promise)

\* Runs the queued jobs in order until none are left (NewPromiseReactionJob §27.2.2.1 and
\* NewPromiseResolveThenableJob §27.2.2.2), then the timeout jobs of the waits that can time out.
RunJobs(s) ==
  IF s.jobs = <<>> /\ \A i \in DOMAIN s.waiters : s.waiters[i].deadline = Empty THEN Ok(s, Undefined)
  ELSE IF s.jobs = <<>> THEN RunJobs(TimeOutWaiter(s))
  ELSE LET r == RunJob([s EXCEPT !.jobs = Tail(@)], Head(s.jobs)) IN
       IF IsAbrupt(r) THEN r ELSE RunJobs(r.s)
RunJob(s, job) ==
  IF job.kind = "thenable" THEN
    LET fns == CreateResolvingFunctions(s, job.promise)
        r == Call(fns.s, job.then, job.thenable, <<fns.resolve, fns.reject>>)
    IN IF IsAbrupt(r) THEN Call(r.s, fns.reject, Undefined, <<r.c.value>>) ELSE r
  ELSE
    LET reaction == job.reaction
        result == CASE reaction.handler # Empty -> Call(s, reaction.handler, Undefined, <<job.argument>>)
                    [] reaction.type = "fulfill" -> Ok(s, job.argument)
                    [] OTHER -> ThrowValue(s, job.argument)
    IN IF reaction.capability = Empty THEN Ok(result.s, Undefined)
       ELSE IF IsAbrupt(result) THEN Call(result.s, reaction.capability.reject, Undefined, <<result.c.value>>)
       ELSE Call(result.s, reaction.capability.resolve, Undefined, <<Val(result)>>)

\* GetPromiseResolve (§27.2.4.1.1).
GetPromiseResolve(s, c) ==
  LET r == Get(s, c, SV("resolve")) IN
  IF IsAbrupt(r) THEN r ELSE IF ~IsCallable(r.s, Val(r)) THEN ThrowTypeError(r.s) ELSE r

\* Promise.all, allSettled, any, and race (§27.2.4.1 to §27.2.4.5): kind is "all", "allSettled",
\* "any", or "race".
PromiseCombinator(s, kind, c, iterable) ==
  LET cap == NewPromiseCapability(s, c) IN
  IF IsAbrupt(cap) THEN cap ELSE
  LET resolve == GetPromiseResolve(cap.s, c) IN
  IF IsAbrupt(resolve) THEN RejectWith(resolve, Val(cap)) ELSE
  LET it == GetIterator(resolve.s, iterable, "sync") IN
  IF IsAbrupt(it) THEN RejectWith(it, Val(cap)) ELSE
  LET cell == AllocCell(it.s, [values |-> <<>>, remaining |-> 1])
      r == CombinatorLoop(cell.s, [kind |-> kind, c |-> c, cap |-> Val(cap), resolve |-> Val(resolve), cell |-> cell.v],
                          Val(it), 0)
  IN IF ~IsAbrupt(r) THEN [s |-> r.s, c |-> r.c]
     ELSE RejectWith(IF r.done THEN r ELSE IteratorClose(r.s, Val(it), r.c), Val(cap))

\* The loop of PerformPromiseAll and its siblings, for a combinator [kind, c, cap, resolve, cell],
\* returning [s, c, done] with done whether the iterator finished.
CombinatorLoop(s, comb, it, index) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN [s |-> next.s, c |-> next.c, done |-> TRUE]
  ELSE IF Val(next).done THEN
    LET finish == IF comb.kind = "race" THEN Ok(next.s, Undefined) ELSE CombinatorElementDone(next.s, comb) IN
    [s |-> finish.s, c |-> IF IsAbrupt(finish) THEN finish.c ELSE NormalCompletion(comb.cap.promise), done |-> TRUE]
  ELSE
    LET then == CombinatorAdd(next.s, comb, Val(next).value, index) IN
    IF IsAbrupt(then) THEN [s |-> then.s, c |-> then.c, done |-> FALSE]
    ELSE CombinatorLoop(then.s, comb, Val(next).iterator, index + 1)

\* The steps of the loop for one element: resolves value, element index of the result, with the
\* combinator's constructor, and invokes its then with the element's functions.
CombinatorAdd(s, comb, value, index) ==
  LET s1 == IF comb.kind = "race" THEN s
            ELSE SetSlots(s, comb.cell, [values |-> Append(Slots(s, comb.cell).values, Undefined)])
      p == Call(s1, comb.resolve, comb.c, <<value>>)
      called == AllocCell(p.s, [called |-> FALSE])
      data == [comb |-> comb, index |-> index, called |-> called.v]
      onFulfilled == IF comb.kind \in {"all", "allSettled", "allKeyed", "allSettledKeyed"}
                     THEN CreateBuiltinFunction(called.s, <<"Promise", comb.kind \o "Resolve">>, 1, <<>>, data)
                     ELSE Ok(called.s, comb.cap.resolve)
      onRejected == IF comb.kind \in {"allSettled", "any", "allSettledKeyed"}
                    THEN CreateBuiltinFunction(onFulfilled.s, <<"Promise", comb.kind \o "Reject">>, 1, <<>>, data)
                    ELSE Ok(onFulfilled.s, comb.cap.reject)
      counted == IF comb.kind = "race" THEN onRejected.s
                 ELSE SetSlots(onRejected.s, comb.cell, [remaining |-> Slots(onRejected.s, comb.cell).remaining + 1])
  IN IF IsAbrupt(p) THEN p ELSE Invoke(counted, Val(p), SV("then"), <<Val(onFulfilled), Val(onRejected)>>)

\* Promise.allKeyed and Promise.allSettledKeyed of the await-dictionary proposal: kind is
\* "allKeyed" or "allSettledKeyed", and the result has a property for each enumerable own
\* property of promises.
PromiseKeyedCombinator(s, kind, c, promises) ==
  LET cap == NewPromiseCapability(s, c) IN
  IF IsAbrupt(cap) THEN cap ELSE
  LET resolve == GetPromiseResolve(cap.s, c) IN
  IF IsAbrupt(resolve) THEN RejectWith(resolve, Val(cap))
  ELSE IF ~IsObject(promises) THEN RejectWith(ThrowTypeError(resolve.s), Val(cap)) ELSE
  LET keys == OwnPropertyKeys(resolve.s, promises) IN
  IF IsAbrupt(keys) THEN RejectWith(keys, Val(cap)) ELSE
  LET cell == AllocCell(keys.s, [values |-> <<>>, keys |-> <<>>, remaining |-> 1])
      r == KeyedCombinatorLoop(cell.s, [kind |-> kind, c |-> c, cap |-> Val(cap), resolve |-> Val(resolve), cell |-> cell.v],
                               promises, Val(keys), 1)
  IN IF IsAbrupt(r) THEN RejectWith(r, Val(cap)) ELSE r

\* The loop of PerformPromiseAllKeyed from the key keys[i].
KeyedCombinatorLoop(s, comb, promises, keys, i) ==
  IF i > Len(keys) THEN
    LET finish == CombinatorElementDone(s, comb) IN IF IsAbrupt(finish) THEN finish ELSE Ok(finish.s, comb.cap.promise)
  ELSE LET desc == GetOwnProperty(s, promises, keys[i]) IN
  IF IsAbrupt(desc) THEN desc
  ELSE IF Val(desc) = Absent \/ Val(desc).enumerable # True THEN KeyedCombinatorLoop(desc.s, comb, promises, keys, i + 1)
  ELSE LET v == Get(desc.s, promises, keys[i]) IN
  IF IsAbrupt(v) THEN v ELSE
  LET slots == Slots(v.s, comb.cell)
      then == CombinatorAdd(SetSlots(v.s, comb.cell, [keys |-> Append(slots.keys, keys[i])]), comb, Val(v), Len(slots.values))
  IN IF IsAbrupt(then) THEN then ELSE KeyedCombinatorLoop(then.s, comb, promises, keys, i + 1)

\* One element done: when it was the last, settles the combinator's promise with the values.
CombinatorElementDone(s, comb) ==
  LET slots == Slots(s, comb.cell)
      s1 == SetSlots(s, comb.cell, [remaining |-> slots.remaining - 1])
  IN IF slots.remaining > 1 THEN Ok(s1, Undefined)
     ELSE LET values == CreateArrayFromList(s1, slots.values) IN
          IF comb.kind = "any" THEN
            LET error == Alloc(values.s, MakeObject(Intrinsic(values.s, "AggregateErrorPrototype"), "error", [data |-> Empty]))
                d == DefinePropertyOrThrow(error.s, error.v, SV("errors"), DataDesc(Val(values), TRUE, FALSE, TRUE))
            IN Call(d.s, comb.cap.reject, Undefined, <<error.v>>)
          ELSE IF comb.kind \in {"allKeyed", "allSettledKeyed"} THEN
            LET o == OrdinaryObjectCreate(s1, Null)
                result == WithDataProps(O(o.s, Val(o)), [i \in DOMAIN slots.keys |-> <<slots.keys[i], slots.values[i]>>])
            IN Call(SetO(o.s, Val(o), result), comb.cap.resolve, Undefined, <<Val(o)>>)
          ELSE Call(values.s, comb.cap.resolve, Undefined, <<Val(values)>>)

\* SafePerformPromiseAll of the import-defer proposal: a promise for the values of promises, which
\* waits on each with PerformPromiseThen rather than looking up then.
SafePromiseAll(s, promises) ==
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      cell == AllocCell(cap.s, [values |-> Repeat(Undefined, Len(promises)), remaining |-> Len(promises)])
      comb == [kind |-> "all", c |-> Intrinsic(s, "Promise"), cap |-> Val(cap), resolve |-> Undefined, cell |-> cell.v]
  IN IF promises = <<>> THEN LET a == CreateArrayFromList(cap.s, <<>>) IN
                              LET r == Call(a.s, Val(cap).resolve, Undefined, <<Val(a)>>) IN Ok(r.s, Val(cap).promise)
     ELSE Ok(SafePromiseAllFrom(cell.s, comb, promises, 1), Val(cap).promise)
SafePromiseAllFrom(s, comb, promises, i) ==
  IF i > Len(promises) THEN s ELSE
  LET called == AllocCell(s, [called |-> FALSE])
      onFulfilled == CreateBuiltinFunction(called.s, <<"Promise", "allResolve">>, 1, <<>>,
                                           [comb |-> comb, index |-> i - 1, called |-> called.v])
      then == AddPromiseReactions(onFulfilled.s, promises[i], Val(onFulfilled), comb.cap.reject, Empty)
  IN SafePromiseAllFrom(then.s, comb, promises, i + 1)

\* The element functions of the combinators: records the value or reason at the element's index.
CombinatorElement(s, f, m, x) ==
  LET data == Slots(s, f).data
      comb == data.comb
  IN IF Slots(s, data.called).called THEN Ok(s, Undefined) ELSE
     LET s1 == SetSlots(s, data.called, [called |-> TRUE])
         entry ==
           IF comb.kind \in {"allSettled", "allSettledKeyed"} THEN
             LET o == OrdinaryObjectCreate(s1, Intrinsic(s1, "ObjectPrototype")) IN
             Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)),
                  IF m \in {"allSettledResolve", "allSettledKeyedResolve"} THEN <<<<SV("status"), SV("fulfilled")>>, <<SV("value"), x>>>>
                  ELSE <<<<SV("status"), SV("rejected")>>, <<SV("reason"), x>>>>)), Val(o))
           ELSE Ok(s1, x)
         s2 == SetSlots(entry.s, comb.cell, [values |-> [Slots(entry.s, comb.cell).values EXCEPT ![data.index + 1] = Val(entry)]])
     IN CombinatorElementDone(s2, comb)

\* Promise.prototype.finally (§27.2.5.3).
PromiseFinally(s, promise, onFinally) ==
  IF ~IsObject(promise) THEN ThrowTypeError(s) ELSE
  LET c == SpeciesConstructor(s, promise, Intrinsic(s, "Promise")) IN
  IF IsAbrupt(c) THEN c
  ELSE IF ~IsCallable(c.s, onFinally) THEN Invoke(c.s, promise, SV("then"), <<onFinally, onFinally>>)
  ELSE LET thenFinally == CreateBuiltinFunction(c.s, <<"Promise", "thenFinally">>, 1, <<>>, [onFinally |-> onFinally, c |-> Val(c)])
           catchFinally == CreateBuiltinFunction(thenFinally.s, <<"Promise", "catchFinally">>, 1, <<>>, [onFinally |-> onFinally, c |-> Val(c)])
       IN Invoke(catchFinally.s, promise, SV("then"), <<Val(thenFinally), Val(catchFinally)>>)

\* The thenFinally and catchFinally closures, which pass the value or reason on after onFinally.
FinallyStep(s, f, m, x) ==
  LET data == Slots(s, f).data
      result == Call(s, data.onFinally, Undefined, <<>>)
  IN IF IsAbrupt(result) THEN result ELSE
     LET p == PromiseResolve(result.s, data.c, Val(result)) IN
     IF IsAbrupt(p) THEN p ELSE
     LET then == CreateBuiltinFunction(p.s, <<"Promise", IF m = "thenFinally" THEN "valueThunk" ELSE "thrower">>, 0, <<>>, x) IN
     Invoke(then.s, Val(p), SV("then"), <<Val(then)>>)

PromiseBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET p == OrdinaryCreateFromConstructor(s, nt, "PromisePrototype", "promise",
                         [state |-> "pending", result |-> Undefined, fulfillReactions |-> <<>>,
                          rejectReactions |-> <<>>, isHandled |-> FALSE])
              IN IF IsAbrupt(p) THEN p ELSE
              LET fns == CreateResolvingFunctions(p.s, Val(p))
                  r == Call(fns.s, Arg(args, 1), Undefined, <<fns.resolve, fns.reject>>)
              IN IF ~IsAbrupt(r) THEN Ok(r.s, Val(p)) ELSE
                 LET rejected == Call(r.s, fns.reject, Undefined, <<r.c.value>>) IN
                 IF IsAbrupt(rejected) THEN rejected ELSE Ok(rejected.s, Val(p))
    [] m \in {"resolveFunction", "rejectFunction"} ->
         LET cell == Slots(s, f).data
             promise == Slots(s, cell).promise
         IN IF promise = Empty THEN Ok(s, Undefined)
            ELSE LET s1 == SetSlots(s, cell, [promise |-> Empty]) IN
                 IF m = "rejectFunction" THEN Ok(RejectPromise(s1, promise, Arg(args, 1)), Undefined)
                 ELSE ResolvePromiseWith(s1, promise, Arg(args, 1))
    [] m = "capabilityExecutor" ->
         LET cell == Slots(s, f).data IN
         IF Slots(s, cell).resolve # Undefined \/ Slots(s, cell).reject # Undefined THEN ThrowTypeError(s)
         ELSE Ok(SetSlots(s, cell, [resolve |-> Arg(args, 1), reject |-> Arg(args, 2)]), Undefined)
    [] m \in {"all", "allSettled", "any", "race"} -> PromiseCombinator(s, m, this, Arg(args, 1))
    [] m \in {"allKeyed", "allSettledKeyed"} -> PromiseKeyedCombinator(s, m, this, Arg(args, 1))
    [] m \in {"allResolve", "allSettledResolve", "allSettledReject", "anyReject", "allKeyedResolve",
              "allSettledKeyedResolve", "allSettledKeyedReject"} -> CombinatorElement(s, f, m, Arg(args, 1))
    [] m = "reject" ->
         LET cap == NewPromiseCapability(s, this) IN
         IF IsAbrupt(cap) THEN cap ELSE
         LET r == Call(cap.s, Val(cap).reject, Undefined, <<Arg(args, 1)>>) IN
         IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(cap).promise)
    [] m = "resolve" -> IF ~IsObject(this) THEN ThrowTypeError(s) ELSE PromiseResolve(s, this, Arg(args, 1))
    [] m = "withResolvers" ->
         LET cap == NewPromiseCapability(s, this) IN
         IF IsAbrupt(cap) THEN cap ELSE
         LET o == OrdinaryObjectCreate(cap.s, Intrinsic(cap.s, "ObjectPrototype")) IN
         Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), <<<<SV("promise"), Val(cap).promise>>,
                                                               <<SV("resolve"), Val(cap).resolve>>,
                                                               <<SV("reject"), Val(cap).reject>>>>)), Val(o))
    [] m = "try" ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
         LET status == Call(s, Arg(args, 1), Undefined, Rest(args, 2)) IN
         IF ~IsAbrupt(status) THEN PromiseResolve(status.s, this, Val(status)) ELSE
         LET cap == NewPromiseCapability(status.s, this) IN
         IF IsAbrupt(cap) THEN cap ELSE
         LET r == Call(cap.s, Val(cap).reject, Undefined, <<status.c.value>>) IN
         IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(cap).promise)
    [] m = "species" -> Ok(s, this)
    [] m = "then" ->
         IF ~IsPromise(s, this) THEN ThrowTypeError(s) ELSE
         LET c == SpeciesConstructor(s, this, Intrinsic(s, "Promise")) IN
         IF IsAbrupt(c) THEN c ELSE
         LET cap == NewPromiseCapability(c.s, Val(c)) IN
         IF IsAbrupt(cap) THEN cap ELSE AddPromiseReactions(cap.s, this, Arg(args, 1), Arg(args, 2), Val(cap))
    [] m = "catch" -> Invoke(s, this, SV("then"), <<Undefined, Arg(args, 1)>>)
    [] m = "finally" -> PromiseFinally(s, this, Arg(args, 1))
    [] m \in {"thenFinally", "catchFinally"} -> FinallyStep(s, f, m, Arg(args, 1))
    [] m = "valueThunk" -> Ok(s, Slots(s, f).data)
    [] m = "thrower" -> ThrowValue(s, Slots(s, f).data)

PromiseIntrinsics ==
  << IntrinsicObject("PromisePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Promise", "FunctionPrototype", <<"Promise", "constructor">>, 1, N("Promise"), TRUE) >>

PromiseProperties ==
  Ctor("Promise", "PromisePrototype") \o
  << GlobalLink("Promise", N("Promise")),
     M("Promise", SV("all"), "Promise", "all", 1),
     M("Promise", SV("allSettled"), "Promise", "allSettled", 1),
     M("Promise", SV("allKeyed"), "Promise", "allKeyed", 1),
     M("Promise", SV("allSettledKeyed"), "Promise", "allSettledKeyed", 1),
     M("Promise", SV("any"), "Promise", "any", 1),
     M("Promise", SV("race"), "Promise", "race", 1),
     M("Promise", SV("reject"), "Promise", "reject", 1),
     M("Promise", SV("resolve"), "Promise", "resolve", 1),
     M("Promise", SV("try"), "Promise", "try", 1),
     M("Promise", SV("withResolvers"), "Promise", "withResolvers", 0),
     G("Promise", SymSpecies, "Promise", "species", ""),
     M("PromisePrototype", SV("then"), "Promise", "then", 2),
     M("PromisePrototype", SV("catch"), "Promise", "catch", 1),
     M("PromisePrototype", SV("finally"), "Promise", "finally", 1),
     V("PromisePrototype", SymToStringTag, SV("Promise"), FALSE, FALSE, TRUE) >>
