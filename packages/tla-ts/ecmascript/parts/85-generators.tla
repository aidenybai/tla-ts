\* Generators, async functions, and async generators (§27.3 to §27.7). A body suspends at a yield
\* or await with a suspend completion (see Suspend), and its driver keeps the frames to resume it
\* from. A generator object has class "generator" or "asyncGenerator" and slots:
\*   state   "suspendedStart", "suspendedYield", "executing", "draining-queue", or "completed"
\*   frames  where the body resumes once suspended
\*   ctx     the context the body runs in
\*   body    the body node
\*   queue   an async generator's requests, as [completion, capability] records
\*   brand   the [[GeneratorBrand]], Empty for generators that functions make

\* Await (§6.2.3.1): suspends the body on v, which its driver resolves.
Await(s, v) == Suspend(s, "await", v)
AwaitThen(r) == IF IsAbrupt(r) THEN r ELSE Await(r.s, Val(r))
AwaitIfAsync(kind, r) == IF IsAbrupt(r) \/ kind = "sync" THEN r ELSE Await(r.s, Val(r))

GeneratorSlots(ctx, body) ==
  [state |-> "suspendedStart", frames |-> <<>>, ctx |-> ctx, body |-> body, queue |-> <<>>, brand |-> Empty]
GeneratorState(s, gen) == O(s, gen).slots.state

\* Starts running a generator's body from its first statement.
RunGeneratorBody(s, gen) ==
  LET slots == O(s, gen).slots IN
  EvaluateDisposing(s, [slots.ctx EXCEPT !.gen = gen], slots.body.FunctionStatementList)

\* EvaluateGeneratorBody (§15.5.2): the function's call returns the new generator.
EvaluateGeneratorBody(s, f, ctx, args) ==
  LET i == FunctionDeclarationInstantiation(s, f, ctx, args) IN
  IF IsAbrupt(i) THEN i ELSE
  LET g == OrdinaryCreateFromConstructor(i.s, f, "GeneratorPrototype", "generator", GeneratorSlots(Val(i), O(i.s, f).slots.body)) IN
  IF IsAbrupt(g) THEN g ELSE Abrupt(g.s, Completion("return", Val(g), Empty))

\* Yield (§15.5.5), for `yield` and `yield expr`.
EvaluateYield(s, ctx, n) ==
  IF n.hasStar THEN YieldStarThen(ctx, EvaluateValue(s, ctx, n.AssignmentExpression))
  ELSE YieldThen(ctx, IF Has(n.AssignmentExpression) THEN EvaluateValue(s, ctx, n.AssignmentExpression) ELSE Ok(s, Undefined))
YieldThen(ctx, r) == IF IsAbrupt(r) THEN r ELSE Yield(r.s, ctx, Val(r))
Yield(s, ctx, v) ==
  IF FunctionKindOf(s, ctx) = "asyncGenerator" THEN AsyncYieldThen(ctx, Await(s, v)) ELSE Suspend(s, "yield", v)
AsyncYieldThen(ctx, r) == IF IsAbrupt(r) THEN r ELSE AsyncGeneratorYield(r.s, ctx, Val(r))

\* The yield* loop (§15.5.5 steps 7-8) for a delegate iterator it, with kind "sync" or "async".
YieldStarThen(ctx, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET kind == IF FunctionKindOf(r.s, ctx) = "asyncGenerator" THEN "async" ELSE "sync"
      it == GetIterator(r.s, Val(r), kind)
  IN IF IsAbrupt(it) THEN it ELSE YieldStarLoop(it.s, ctx, kind, Val(it), NormalCompletion(Undefined))
YieldStarLoop(s, ctx, kind, it, received) ==
  CASE received.type = "normal" ->
         YieldStarInnerThen(ctx, kind, it, AwaitIfAsync(kind, Call(s, it.next, it.iterator, <<received.value>>)))
    [] received.type = "throw" ->
         LET throw == GetMethod(s, it.iterator, SV("throw")) IN
         IF IsAbrupt(throw) THEN throw
         ELSE IF Val(throw) # Undefined
         THEN YieldStarInnerThen(ctx, kind, it, AwaitIfAsync(kind, Call(throw.s, Val(throw), it.iterator, <<received.value>>)))
         ELSE YieldStarNoThrowThen(IF kind = "async" THEN AsyncIteratorClose(throw.s, it, NormalCompletion(Empty))
                                   ELSE IteratorClose(throw.s, it, NormalCompletion(Empty)))
    [] OTHER ->
         LET return == GetMethod(s, it.iterator, SV("return")) IN
         IF IsAbrupt(return) THEN return
         ELSE IF Val(return) = Undefined THEN ReturnValueThen(AwaitIfAsync(kind, Ok(return.s, received.value)))
         ELSE YieldStarReturnThen(ctx, kind, it, AwaitIfAsync(kind, Call(return.s, Val(return), it.iterator, <<received.value>>)))
YieldStarNoThrowThen(r) == IF IsAbrupt(r) THEN r ELSE ThrowTypeError(r.s)
YieldStarInnerThen(ctx, kind, it, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE LET done == IteratorComplete(r.s, Val(r)) IN
  IF IsAbrupt(done) THEN done
  ELSE IF Val(done) THEN Get(done.s, Val(r), SV("value"))
  ELSE YieldStarYield(done.s, ctx, kind, it, Val(r))
YieldStarReturnThen(ctx, kind, it, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE LET done == IteratorComplete(r.s, Val(r)) IN
  IF IsAbrupt(done) THEN done
  ELSE IF Val(done) THEN ReturnValueThen(Get(done.s, Val(r), SV("value")))
  ELSE YieldStarYield(done.s, ctx, kind, it, Val(r))
\* A sync generator yields the delegate's result object itself (GeneratorYield(innerResult)).
YieldStarYield(s, ctx, kind, it, innerResult) ==
  IF kind = "sync" THEN YieldStarResumeThen(ctx, kind, it, Suspend(s, "yieldDelegate", innerResult))
  ELSE LET v == Get(s, innerResult, SV("value")) IN
       IF IsAbrupt(v) THEN v ELSE YieldStarResumeThen(ctx, kind, it, AsyncGeneratorYield(v.s, ctx, Val(v)))
YieldStarResumeThen(ctx, kind, it, r) == YieldStarLoop(r.s, ctx, kind, it, r.c)

\* GeneratorValidate (§27.5.3.2), returning the generator's state.
GeneratorValidate(s, gen, brand) ==
  IF ~IsObject(gen) \/ O(s, gen).class # "generator" \/ O(s, gen).slots.brand # brand THEN ThrowTypeError(s)
  ELSE IF GeneratorState(s, gen) = "executing" THEN ThrowTypeError(s)
  ELSE Ok(s, GeneratorState(s, gen))

\* GeneratorResume (§27.5.3.3).
GeneratorResume(s, gen, value, brand) ==
  LET state == GeneratorValidate(s, gen, brand) IN
  IF IsAbrupt(state) THEN state
  ELSE IF Val(state) = "completed" THEN CreateIterResultObject(s, Undefined, TRUE)
  ELSE LET s1 == SetSlots(s, gen, [state |-> "executing"]) IN
       GeneratorStep(gen, IF Val(state) = "suspendedStart" THEN RunGeneratorBody(s1, gen)
                          ELSE ResumeFrames(O(s, gen).slots.frames, Ok(s1, value)))

\* GeneratorResumeAbrupt (§27.5.3.4).
GeneratorResumeAbrupt(s, gen, completion, brand) ==
  LET state == GeneratorValidate(s, gen, brand) IN
  IF IsAbrupt(state) THEN state
  ELSE IF Val(state) \in {"suspendedStart", "completed"} THEN
    LET s1 == SetSlots(s, gen, [state |-> "completed"]) IN
    IF completion.type = "return" THEN CreateIterResultObject(s1, completion.value, TRUE) ELSE Abrupt(s1, completion)
  ELSE GeneratorStep(gen, ResumeFrames(O(s, gen).slots.frames, Abrupt(SetSlots(s, gen, [state |-> "executing"]), completion)))

\* How the generator's body stopped: at a yield, or for good (GeneratorStart step 4 and
\* GeneratorYield).
GeneratorStep(gen, r) ==
  IF IsSuspended(r) THEN
    LET s1 == HoldEnvs(SetSlots(r.s, gen, [state |-> "suspendedYield", frames |-> r.c.frames])) IN
    IF r.c.target = "yieldDelegate" THEN Ok(s1, r.c.value) ELSE CreateIterResultObject(s1, r.c.value, FALSE)
  ELSE LET s1 == SetSlots(r.s, gen, [state |-> "completed", frames |-> <<>>]) IN
       CASE r.c.type = "normal" -> CreateIterResultObject(s1, Undefined, TRUE)
         [] r.c.type = "return" -> CreateIterResultObject(s1, r.c.value, TRUE)
         [] OTHER -> Abrupt(s1, r.c)

\* %GeneratorPrototype% (§27.5.1).
GeneratorBuiltin(s, f, m, this, args, nt) ==
  CASE m = "next" -> GeneratorResume(s, this, Arg(args, 1), Empty)
    [] m = "return" -> GeneratorResumeAbrupt(s, this, Completion("return", Arg(args, 1), Empty), Empty)
    [] m = "throw" -> GeneratorResumeAbrupt(s, this, ThrowCompletion(Arg(args, 1)), Empty)
    [] m = "asyncIterator" -> Ok(s, this)
    [] m \in {"generator", "asyncGenerator", "async"} -> CreateDynamicFunction(s, f, nt, m, args)

\* The driver of an async function or async generator body that suspended or completed with r,
\* for owner [kind |-> "async", capability] or [kind |-> "asyncGenerator", generator].
ActivationStep(owner, r) ==
  IF owner.kind = "async" THEN AsyncFunctionStep(owner.capability, r) ELSE AsyncGeneratorStep(owner.generator, r)

\* The rest of Await (§6.2.3.1) once the body suspends: resumes it when the promise for v settles.
PerformAwait(s, owner, frames, v) ==
  LET p == PromiseResolve(s, Intrinsic(s, "Promise"), v) IN
  IF IsAbrupt(p) THEN ActivationStep(owner, ResumeFrames(frames, p))
  ELSE LET data == [owner |-> owner, frames |-> frames]
           onFulfilled == CreateBuiltinFunction(p.s, <<"Await", "fulfilled">>, 1, <<>>, data)
           onRejected == CreateBuiltinFunction(onFulfilled.s, <<"Await", "rejected">>, 1, <<>>, data)
       IN Ok(AddPromiseReactions(onRejected.s, Val(p), Val(onFulfilled), Val(onRejected), Empty).s, Undefined)

\* The closures Await passes to then, which resume the body with the settled value.
AwaitBuiltin(s, f, m, this, args, nt) ==
  LET data == O(s, f).slots.data
      r == ActivationStep(data.owner, ResumeFrames(data.frames, IF m = "fulfilled" THEN Ok(s, Arg(args, 1))
                                                              ELSE ThrowValue(s, Arg(args, 1))))
  IN Ok(r.s, Undefined)

\* EvaluateAsyncFunctionBody and EvaluateAsyncConciseBody (§15.8.4, §15.9.4) with
\* AsyncFunctionStart (§27.7.5.1).
EvaluateAsyncFunctionBody(s, f, ctx, args) ==
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      i == FunctionDeclarationInstantiation(cap.s, f, ctx, args)
      body == O(s, f).slots.body
      started ==
        IF IsAbrupt(i) THEN Call(i.s, Val(cap).reject, Undefined, <<i.c.value>>)
        ELSE AsyncFunctionStep(Val(cap), IF body.type = "AsyncBody" THEN EvaluateDisposing(i.s, Val(i), body.FunctionStatementList)
                                          ELSE ReturnValueThen(EvaluateValue(i.s, Val(i), ConciseExpression(body))))
  IN Abrupt(started.s, Completion("return", Val(cap).promise, Empty))

\* AsyncBlockStart (§27.7.5.2) from where the body stopped.
AsyncFunctionStep(cap, r) ==
  IF IsSuspended(r) THEN PerformAwait(r.s, [kind |-> "async", capability |-> cap], r.c.frames, r.c.value)
  ELSE LET settled == CASE r.c.type = "normal" -> Call(r.s, cap.resolve, Undefined, <<Undefined>>)
                        [] r.c.type = "return" -> Call(r.s, cap.resolve, Undefined, <<r.c.value>>)
                        [] OTHER -> Call(r.s, cap.reject, Undefined, <<r.c.value>>)
       IN Ok(settled.s, Undefined)

\* EvaluateAsyncGeneratorBody (§15.6.2) with AsyncGeneratorStart (§27.6.3.3).
EvaluateAsyncGeneratorBody(s, f, ctx, args) ==
  LET i == FunctionDeclarationInstantiation(s, f, ctx, args) IN
  IF IsAbrupt(i) THEN i ELSE
  LET g == OrdinaryCreateFromConstructor(i.s, f, "AsyncGeneratorPrototype", "asyncGenerator",
                                         GeneratorSlots(Val(i), O(i.s, f).slots.body))
  IN IF IsAbrupt(g) THEN g ELSE Abrupt(g.s, Completion("return", Val(g), Empty))

\* AsyncGeneratorValidate (§27.6.3.2).
IsAsyncGenerator(s, gen, brand) ==
  IsObject(gen) /\ O(s, gen).class = "asyncGenerator" /\ O(s, gen).slots.brand = brand

\* AsyncGeneratorCompleteStep (§27.6.3.4), returning the state.
AsyncGeneratorCompleteStep(s, gen, completion, done) ==
  LET next == Head(O(s, gen).slots.queue)
      s1 == SetSlots(s, gen, [queue |-> Tail(O(s, gen).slots.queue)])
  IN IF completion.type = "throw" THEN Call(s1, next.capability.reject, Undefined, <<completion.value>>).s
     ELSE LET result == CreateIterResultObject(s1, completion.value, done) IN
          Call(result.s, next.capability.resolve, Undefined, <<Val(result)>>).s

\* AsyncGeneratorResume (§27.6.3.5).
AsyncGeneratorResume(s, gen, completion) ==
  LET state == GeneratorState(s, gen)
      s1 == SetSlots(s, gen, [state |-> "executing"])
  IN AsyncGeneratorStep(gen, IF state = "suspendedStart" THEN RunGeneratorBody(s1, gen)
                             ELSE ResumeFrames(O(s, gen).slots.frames, Abrupt(s1, completion)))

\* How the async generator's body stopped: at an await, at a yield, which AsyncGeneratorYield
\* already handled, or for good (step 4 of AsyncGeneratorStart).
AsyncGeneratorStep(gen, r) ==
  IF IsSuspended(r) THEN
    IF r.c.target = "await" THEN PerformAwait(r.s, [kind |-> "asyncGenerator", generator |-> gen], r.c.frames, r.c.value)
    ELSE Ok(HoldEnvs(SetSlots(r.s, gen, [frames |-> r.c.frames])), Undefined)
  ELSE LET s1 == SetSlots(r.s, gen, [state |-> "draining-queue", frames |-> <<>>])
           result == CASE r.c.type = "normal" -> NormalCompletion(Undefined)
                       [] r.c.type = "return" -> NormalCompletion(r.c.value)
                       [] OTHER -> r.c
       IN AsyncGeneratorDrainQueue(AsyncGeneratorCompleteStep(s1, gen, result, TRUE), gen)

\* AsyncGeneratorYield (§27.6.3.8) and AsyncGeneratorUnwrapYieldResumption (§27.6.3.7). The
\* generator continues at once with the next request when one waits.
AsyncGeneratorYield(s, ctx, v) ==
  LET gen == ctx.gen
      s1 == AsyncGeneratorCompleteStep(s, gen, NormalCompletion(v), FALSE)
      queue == O(s1, gen).slots.queue
  IN UnwrapYieldResumptionThen(IF queue # <<>> THEN Abrupt(s1, Head(queue).completion)
                               ELSE Suspend(SetSlots(s1, gen, [state |-> "suspendedYield"]), "yield", v))
UnwrapYieldResumptionThen(r) == IF r.c.type # "return" THEN r ELSE ReturnValueThen(Await(r.s, r.c.value))

\* AsyncGeneratorAwaitReturn (§27.6.3.9).
AsyncGeneratorAwaitReturn(s, gen) ==
  LET p == PromiseResolve(s, Intrinsic(s, "Promise"), Head(O(s, gen).slots.queue).completion.value) IN
  IF IsAbrupt(p) THEN AsyncGeneratorDrainQueue(AsyncGeneratorCompleteStep(p.s, gen, p.c, TRUE), gen)
  ELSE LET onFulfilled == CreateBuiltinFunction(p.s, <<"AsyncGenerator", "returnFulfilled">>, 1, <<>>, gen)
           onRejected == CreateBuiltinFunction(onFulfilled.s, <<"AsyncGenerator", "returnRejected">>, 1, <<>>, gen)
       IN Ok(AddPromiseReactions(onRejected.s, Val(p), Val(onFulfilled), Val(onRejected), Empty).s, Undefined)

\* AsyncGeneratorDrainQueue (§27.6.3.10).
AsyncGeneratorDrainQueue(s, gen) ==
  LET queue == O(s, gen).slots.queue IN
  IF queue = <<>> THEN Ok(SetSlots(s, gen, [state |-> "completed"]), Undefined)
  ELSE IF Head(queue).completion.type = "return" THEN AsyncGeneratorAwaitReturn(s, gen)
  ELSE AsyncGeneratorDrainQueue(AsyncGeneratorCompleteStep(s, gen, IF Head(queue).completion.type = "normal"
                                                                   THEN NormalCompletion(Undefined)
                                                                   ELSE Head(queue).completion, TRUE), gen)

\* %AsyncGeneratorPrototype% next, return, and throw (§27.6.1), and the closures of
\* AsyncGeneratorAwaitReturn.
AsyncGeneratorBuiltin(s, f, m, this, args, nt) ==
  IF m \in {"returnFulfilled", "returnRejected"} THEN
    LET gen == O(s, f).slots.data IN
    AsyncGeneratorDrainQueue(AsyncGeneratorCompleteStep(s, gen, IF m = "returnFulfilled" THEN NormalCompletion(Arg(args, 1))
                                                               ELSE ThrowCompletion(Arg(args, 1)), TRUE), gen)
  ELSE
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      c == Val(cap)
      completion == CASE m = "next" -> NormalCompletion(Arg(args, 1))
                      [] m = "return" -> Completion("return", Arg(args, 1), Empty)
                      [] m = "throw" -> ThrowCompletion(Arg(args, 1))
      settled ==
        IF ~IsAsyncGenerator(cap.s, this, Empty) THEN
          LET e == ThrowTypeError(cap.s) IN Call(e.s, c.reject, Undefined, <<e.c.value>>)
        ELSE LET state == GeneratorState(cap.s, this)
                 s1 == IF m = "throw" /\ state = "suspendedStart" THEN SetSlots(cap.s, this, [state |-> "completed"]) ELSE cap.s
                 isDone == state = "completed" \/ (m = "throw" /\ state = "suspendedStart")
             IN IF m = "next" /\ isDone THEN
                  LET result == CreateIterResultObject(s1, Undefined, TRUE) IN Call(result.s, c.resolve, Undefined, <<Val(result)>>)
                ELSE IF m = "throw" /\ isDone THEN Call(s1, c.reject, Undefined, <<completion.value>>)
                ELSE LET s2 == SetSlots(s1, this, [queue |-> Append(O(s1, this).slots.queue,
                                                                              [completion |-> completion, capability |-> c])])
                     IN IF m = "return" /\ state \in {"suspendedStart", "completed"}
                        THEN AsyncGeneratorAwaitReturn(SetSlots(s2, this, [state |-> "draining-queue"]), this)
                        ELSE IF state \in {"suspendedStart", "suspendedYield"} /\ (m # "return" \/ state = "suspendedYield")
                        THEN AsyncGeneratorResume(s2, this, completion)
                        ELSE Ok(s2, Undefined)
  IN Ok(settled.s, c.promise)

\* CreateAsyncFromSyncIterator (§27.1.6.1).
CreateAsyncFromSyncIterator(s, it) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "AsyncFromSyncIteratorPrototype"), "asyncFromSync", [sync |-> it]))
      next == Get(a.s, a.v, SV("next"))
  IN Ok(next.s, JsIterator(a.v, Val(next)))

\* Rejects the capability with the thrown value of r, and returns its promise (IfAbruptRejectPromise).
RejectWith(r, cap) == LET c == Call(r.s, cap.reject, Undefined, <<r.c.value>>) IN Ok(c.s, cap.promise)

\* %AsyncFromSyncIteratorPrototype% next, return, and throw (§27.1.6.2), and the closures of
\* AsyncFromSyncIteratorContinuation.
AsyncFromSyncBuiltin(s, f, m, this, args, nt) ==
  CASE m = "unwrap" -> CreateIterResultObject(s, Arg(args, 1), O(s, f).slots.data)
    [] m = "close" -> IteratorClose(s, O(s, f).slots.data, ThrowCompletion(Arg(args, 1)))
    [] OTHER ->
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      c == Val(cap)
      it == O(cap.s, this).slots.sync
  IN IF m = "next" THEN
       LET result == IteratorNext(cap.s, it, IF args = <<>> THEN <<>> ELSE <<args[1]>>) IN
       IF IsAbrupt(result) THEN RejectWith(result, c) ELSE AsyncFromSyncContinuation(result.s, Val(result), c, it, TRUE)
     ELSE
       LET method == GetMethod(cap.s, it.iterator, IF m = "return" THEN SV("return") ELSE SV("throw")) IN
       IF IsAbrupt(method) THEN RejectWith(method, c)
       ELSE IF Val(method) = Undefined THEN
         IF m = "return" THEN
           LET result == CreateIterResultObject(method.s, Arg(args, 1), TRUE)
               resolved == Call(result.s, c.resolve, Undefined, <<Val(result)>>)
           IN Ok(resolved.s, c.promise)
         ELSE LET closed == IteratorClose(method.s, it, NormalCompletion(Empty)) IN
              IF IsAbrupt(closed) THEN RejectWith(closed, c) ELSE RejectWith(ThrowTypeError(closed.s), c)
       ELSE LET result == Call(method.s, Val(method), it.iterator, IF args = <<>> /\ m = "return" THEN <<>> ELSE <<Arg(args, 1)>>) IN
            IF IsAbrupt(result) THEN RejectWith(result, c)
            ELSE IF ~IsObject(Val(result)) THEN RejectWith(ThrowTypeError(result.s), c)
            ELSE AsyncFromSyncContinuation(result.s, Val(result), c, it, m = "throw")

\* AsyncFromSyncIteratorContinuation (§27.1.6.4).
AsyncFromSyncContinuation(s, result, cap, it, closeOnRejection) ==
  LET done == IteratorComplete(s, result) IN
  IF IsAbrupt(done) THEN RejectWith(done, cap) ELSE
  LET value == Get(done.s, result, SV("value")) IN
  IF IsAbrupt(value) THEN RejectWith(value, cap) ELSE
  LET wrapper == PromiseResolve(value.s, Intrinsic(value.s, "Promise"), Val(value))
      closed == IF IsAbrupt(wrapper) /\ ~Val(done) /\ closeOnRejection THEN IteratorClose(wrapper.s, it, wrapper.c) ELSE wrapper
  IN IF IsAbrupt(closed) THEN RejectWith(closed, cap) ELSE
     LET onFulfilled == CreateBuiltinFunction(closed.s, <<"AsyncFromSync", "unwrap">>, 1, <<>>, Val(done))
         onRejected == IF Val(done) \/ ~closeOnRejection THEN [s |-> onFulfilled.s, c |-> NormalCompletion(Undefined)]
                       ELSE CreateBuiltinFunction(onFulfilled.s, <<"AsyncFromSync", "close">>, 1, <<>>, it)
     IN Ok(AddPromiseReactions(onRejected.s, Val(closed), Val(onFulfilled), Val(onRejected), cap).s, cap.promise)

GeneratorIntrinsics ==
  << IntrinsicFunction("GeneratorFunction", "Function", <<"Generator", "generator">>, 1, N("GeneratorFunction"), TRUE),
     IntrinsicObject("GeneratorFunctionPrototype", "FunctionPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("GeneratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("AsyncIteratorPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("AsyncFromSyncIteratorPrototype", "AsyncIteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("AsyncGeneratorFunction", "Function", <<"Generator", "asyncGenerator">>, 1, N("AsyncGeneratorFunction"), TRUE),
     IntrinsicObject("AsyncGeneratorFunctionPrototype", "FunctionPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("AsyncGeneratorPrototype", "AsyncIteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("AsyncFunction", "Function", <<"Generator", "async">>, 1, N("AsyncFunction"), TRUE),
     IntrinsicObject("AsyncFunctionPrototype", "FunctionPrototype", "ordinary", [none |-> TRUE]) >>

\* An object's prototype property and its prototype's constructor, both read-only (§27.3.3,
\* §27.4.3, §27.7.3). Only a constructor's prototype property is not configurable.
FunctionKindLinks(ctor, proto, isConfigurable) ==
  << L(ctor, SV("prototype"), proto, FALSE, FALSE, isConfigurable), L(proto, SV("constructor"), ctor, FALSE, FALSE, TRUE) >>

GeneratorProperties ==
  FunctionKindLinks("GeneratorFunction", "GeneratorFunctionPrototype", FALSE) \o
  FunctionKindLinks("GeneratorFunctionPrototype", "GeneratorPrototype", TRUE) \o
  FunctionKindLinks("AsyncGeneratorFunction", "AsyncGeneratorFunctionPrototype", FALSE) \o
  FunctionKindLinks("AsyncGeneratorFunctionPrototype", "AsyncGeneratorPrototype", TRUE) \o
  FunctionKindLinks("AsyncFunction", "AsyncFunctionPrototype", FALSE) \o
  << V("GeneratorFunctionPrototype", SymToStringTag, SV("GeneratorFunction"), FALSE, FALSE, TRUE),
     V("GeneratorPrototype", SymToStringTag, SV("Generator"), FALSE, FALSE, TRUE),
     M("GeneratorPrototype", SV("next"), "Generator", "next", 1),
     M("GeneratorPrototype", SV("return"), "Generator", "return", 1),
     M("GeneratorPrototype", SV("throw"), "Generator", "throw", 1),
     M("AsyncIteratorPrototype", SymAsyncIterator, "Generator", "asyncIterator", 0),
     M("AsyncFromSyncIteratorPrototype", SV("next"), "AsyncFromSync", "next", 1),
     M("AsyncFromSyncIteratorPrototype", SV("return"), "AsyncFromSync", "return", 1),
     M("AsyncFromSyncIteratorPrototype", SV("throw"), "AsyncFromSync", "throw", 1),
     V("AsyncGeneratorFunctionPrototype", SymToStringTag, SV("AsyncGeneratorFunction"), FALSE, FALSE, TRUE),
     V("AsyncGeneratorPrototype", SymToStringTag, SV("AsyncGenerator"), FALSE, FALSE, TRUE),
     M("AsyncGeneratorPrototype", SV("next"), "AsyncGenerator", "next", 1),
     M("AsyncGeneratorPrototype", SV("return"), "AsyncGenerator", "return", 1),
     M("AsyncGeneratorPrototype", SV("throw"), "AsyncGenerator", "throw", 1),
     V("AsyncFunctionPrototype", SymToStringTag, SV("AsyncFunction"), FALSE, FALSE, TRUE) >>
