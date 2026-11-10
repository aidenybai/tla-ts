\* Explicit resource management: the DisposeCapability operations (§9.1.4), SuppressedError
\* (§20.5.8), DisposableStack (§27.3), and AsyncDisposableStack (§27.4). A resource is [value,
\* kind, method] with kind "sync-dispose" or "async-dispose". The state's disposables holds an
\* environment's resources by its index, and a stack object, of class "disposableStack" or
\* "asyncDisposableStack", holds its own in slots [state, stack] with state "pending" or "disposed".
DisposableIntrinsics ==
  << IntrinsicObject("SuppressedErrorPrototype", "ErrorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("SuppressedError", "Error", <<"Disposable", "SuppressedError">>, 3, N("SuppressedError"), TRUE),
     IntrinsicObject("DisposableStackPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("DisposableStack", "FunctionPrototype", <<"Disposable", "constructor">>, 0, N("DisposableStack"), TRUE),
     IntrinsicFunction("DisposableStackProto_dispose", "FunctionPrototype", <<"Disposable", "dispose">>, 0, N("dispose"), FALSE),
     IntrinsicObject("AsyncDisposableStackPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("AsyncDisposableStack", "FunctionPrototype", <<"AsyncDisposable", "constructor">>, 0,
                       N("AsyncDisposableStack"), TRUE),
     IntrinsicFunction("AsyncDisposableStackProto_disposeAsync", "FunctionPrototype", <<"AsyncDisposable", "disposeAsync">>, 0,
                       N("disposeAsync"), FALSE) >>

\* The methods of the two stack prototypes, in the order the spec lists them.
StackProperties(proto, family, disposeName, disposeFunction, disposeKey, tag) ==
  << M(proto, SV("adopt"), family, "adopt", 2),
     M(proto, SV("defer"), family, "defer", 1),
     L(proto, disposeName, disposeFunction, TRUE, FALSE, TRUE),
     G(proto, SV("disposed"), family, "disposed", ""),
     M(proto, SV("move"), family, "move", 0),
     M(proto, SV("use"), family, "use", 1),
     L(proto, disposeKey, disposeFunction, TRUE, FALSE, TRUE),
     V(proto, SymToStringTag, tag, FALSE, FALSE, TRUE) >>

DisposableProperties ==
  Ctor("SuppressedError", "SuppressedErrorPrototype") \o Ctor("DisposableStack", "DisposableStackPrototype") \o
  Ctor("AsyncDisposableStack", "AsyncDisposableStackPrototype") \o
  << V("SuppressedErrorPrototype", SV("name"), SV("SuppressedError"), TRUE, FALSE, TRUE),
     V("SuppressedErrorPrototype", SV("message"), EmptyStr, TRUE, FALSE, TRUE) >> \o
  StackProperties("DisposableStackPrototype", "Disposable", SV("dispose"), "DisposableStackProto_dispose", SymDispose,
                  SV("DisposableStack")) \o
  StackProperties("AsyncDisposableStackPrototype", "AsyncDisposable", SV("disposeAsync"),
                  "AsyncDisposableStackProto_disposeAsync", SymAsyncDispose, SV("AsyncDisposableStack")) \o
  << M("IteratorPrototype", SymDispose, "Disposable", "iteratorDispose", 0),
     M("AsyncIteratorPrototype", SymAsyncDispose, "Disposable", "asyncIteratorDispose", 0),
     GlobalLink("SuppressedError", N("SuppressedError")), GlobalLink("DisposableStack", N("DisposableStack")),
     GlobalLink("AsyncDisposableStack", N("AsyncDisposableStack")) >>

\* The SuppressedError constructor's steps (§20.5.8.1.1), for the prototype of newTarget.
SuppressedErrorConstructor(s, newTarget, error, suppressed, message) ==
  LET o == ErrorConstructor(s, newTarget, "SuppressedErrorPrototype", message, Undefined) IN
  IF IsAbrupt(o) THEN o ELSE
  LET e == CreateMethodProperty(o.s, Val(o), SV("error"), error)
      d == CreateMethodProperty(e.s, Val(o), SV("suppressed"), suppressed)
  IN Ok(d.s, Val(o))

\* The resource AddDisposableResource (§9.1.4.2) adds for value, by CreateDisposableResource
\* (§9.1.4.3), or Empty for a null or undefined value of a using declaration, which adds none.
DisposableResource(s, value, kind) ==
  IF IsNullish(value) THEN Ok(s, IF kind = "sync-dispose" THEN Empty ELSE [value |-> Undefined, kind |-> kind, method |-> Undefined])
  ELSE LET method == GetDisposeMethod(s, value, kind) IN
       IF IsAbrupt(method) THEN method
       ELSE IF Val(method) = Undefined THEN ThrowTypeError(method.s)
       ELSE Ok(method.s, [value |-> value, kind |-> kind, method |-> Val(method)])

\* GetDisposeMethod (§9.1.4.4). An await using of an object with only @@dispose gets a function
\* that calls it and returns a promise for undefined.
GetDisposeMethod(s, value, kind) ==
  IF ~IsObject(value) THEN ThrowTypeError(s)
  ELSE IF kind = "sync-dispose" THEN GetMethod(s, value, SymDispose)
  ELSE LET async == GetMethod(s, value, SymAsyncDispose) IN
       IF IsAbrupt(async) \/ Val(async) # Undefined THEN async
       ELSE LET sync == GetMethod(async.s, value, SymDispose) IN
            IF IsAbrupt(sync) \/ Val(sync) = Undefined THEN sync
            ELSE CreateBuiltinFunction(sync.s, <<"Disposable", "fromSync">>, 0, <<>>, Val(sync))

\* AddDisposableResource (§9.1.4.2) for a binding of environment e, of a declaration of kind
\* "normal", "sync-dispose", or "async-dispose".
AddDisposableResource(s, e, value, kind) ==
  IF kind = "normal" THEN Ok(s, Empty) ELSE
  LET resource == DisposableResource(s, value, kind) IN
  IF IsAbrupt(resource) \/ Val(resource) = Empty THEN resource
  ELSE Ok(HoldEnvs([resource.s EXCEPT !.disposables = (e :> Append(EnvDisposables(resource.s, e), Val(resource))) @@ @]), Empty)
EnvDisposables(s, e) == IF e \in DOMAIN s.disposables THEN s.disposables[e] ELSE <<>>

\* The kind of resource a declaration adds.
DeclarationKind(n) ==
  CASE n.type = "UsingDeclaration" \/ (n.type = "ForDeclaration" /\ n.production = "Using") -> "sync-dispose"
    [] n.type = "AwaitUsingDeclaration" \/ (n.type = "ForDeclaration" /\ n.production = "AwaitUsing") -> "async-dispose"
    [] OTHER -> "normal"

\* Whether a statement list declares resources in the environment it runs in.
HasUsing(list) == \E i \in DOMAIN List(list) : DeclarationKind(List(list)[i]) # "normal"

\* Evaluates the statements of a block, function body, or module, then disposes the resources
\* they add to the environment they run in.
EvaluateDisposing(s, ctx, list) ==
  IF HasUsing(list) THEN DisposeThen(ctx.lex, EvaluateStatementList(s, ctx, list)) ELSE EvaluateStatementList(s, ctx, list)

\* Disposes the resources of environment e once its code completes with r.
DisposeThen(e, r) == DisposeResources(EnvDisposables(r.s, e), r)

\* DisposeResources (§9.1.4.6): disposes the resources of stack, last first, into the completion of
\* r. A sync-dispose resource after an async-dispose one with no method awaits first, once.
DisposeResources(stack, r) == DisposeFrom(r.s, stack, Len(stack), FALSE, FALSE, r.c)
DisposeFrom(s, stack, i, needsAwait, hasAwaited, c) ==
  CASE i = 0 /\ needsAwait /\ ~hasAwaited -> DisposedThen(c, Await(s, Undefined))
    [] i = 0 -> Abrupt(s, c)
    [] stack[i].kind = "sync-dispose" /\ needsAwait /\ ~hasAwaited ->
         DisposeAwaitedThen(stack, i, hasAwaited, c, Await(s, Undefined))
    [] stack[i].method = Undefined -> DisposeFrom(s, stack, i - 1, TRUE, hasAwaited, c)
    [] OTHER ->
         LET call == Call(s, stack[i].method, stack[i].value, <<>>)
             isAwaited == stack[i].kind = "async-dispose" /\ ~IsAbrupt(call)
         IN DisposeResultThen(stack, i, needsAwait, hasAwaited \/ isAwaited, c,
                              IF isAwaited THEN Await(call.s, Val(call)) ELSE call)
DisposedThen(c, r) == Abrupt(r.s, c)
DisposeAwaitedThen(stack, i, hasAwaited, c, r) == DisposeFrom(r.s, stack, i, FALSE, hasAwaited, c)
DisposeResultThen(stack, i, needsAwait, hasAwaited, c, r) ==
  IF r.c.type # "throw" THEN DisposeFrom(r.s, stack, i - 1, needsAwait, hasAwaited, c)
  ELSE IF c.type # "throw" THEN DisposeFrom(r.s, stack, i - 1, needsAwait, hasAwaited, r.c)
  ELSE LET error == SuppressedErrorConstructor(r.s, Intrinsic(r.s, "SuppressedError"), r.c.value, c.value, Undefined)
       IN DisposeFrom(error.s, stack, i - 1, needsAwait, hasAwaited, ThrowCompletion(Val(error)))

\* The DisposableStack and AsyncDisposableStack constructors (§27.3.1.1, §27.4.1.1).
NewDisposableStack(s, nt, ctor, class) ==
  IF nt = Undefined THEN ThrowTypeError(s)
  ELSE OrdinaryCreateFromConstructor(s, nt, ctor \o "Prototype", class, [state |-> "pending", stack |-> <<>>])

\* The methods the two stack prototypes share (§27.3.3, §27.4.3), on a stack of the class, whose
\* resources are of the kind.
StackMethod(s, m, ctor, class, kind, this, args) ==
  IF ~IsObject(this) \/ O(s, this).class # class THEN ThrowTypeError(s) ELSE
  LET slots == O(s, this).slots
      Push(state, resource) == SetO(state, this, [O(state, this) EXCEPT !.slots.stack = Append(@, resource)])
  IN CASE m = "disposed" -> Ok(s, Bool(slots.state = "disposed"))
       [] slots.state = "disposed" -> IF m = "dispose" THEN Ok(s, Undefined) ELSE ThrowError(s, "ReferenceError")
       [] m = "dispose" ->
            DisposeResources(slots.stack, Ok(SetO(s, this, [O(s, this) EXCEPT !.slots.state = "disposed"]), Undefined))
       [] m = "use" ->
            LET resource == DisposableResource(s, Arg(args, 1), kind) IN
            IF IsAbrupt(resource) THEN resource
            ELSE Ok(IF Val(resource) = Empty THEN resource.s ELSE Push(resource.s, Val(resource)), Arg(args, 1))
       [] m = "adopt" ->
            IF ~IsCallable(s, Arg(args, 2)) THEN ThrowTypeError(s)
            ELSE LET f == CreateBuiltinFunction(s, <<"Disposable", "adopted">>, 0, <<>>, [value |-> Arg(args, 1), onDispose |-> Arg(args, 2)])
                 IN Ok(Push(f.s, [value |-> Undefined, kind |-> kind, method |-> Val(f)]), Arg(args, 1))
       [] m = "defer" ->
            IF ~IsCallable(s, Arg(args, 1)) THEN ThrowTypeError(s)
            ELSE Ok(Push(s, [value |-> Undefined, kind |-> kind, method |-> Arg(args, 1)]), Undefined)
       [] m = "move" ->
            LET moved == OrdinaryCreateFromConstructor(s, Intrinsic(s, ctor), ctor \o "Prototype", class,
                                                       [state |-> "pending", stack |-> slots.stack])
            IN IF IsAbrupt(moved) THEN moved
               ELSE Ok(SetO(moved.s, this, [O(moved.s, this) EXCEPT !.slots = [state |-> "disposed", stack |-> <<>>]]), Val(moved))

DisposableBuiltin(s, f, m, this, args, nt) ==
  CASE m = "SuppressedError" ->
         SuppressedErrorConstructor(s, IF nt = Undefined THEN f ELSE nt, Arg(args, 1), Arg(args, 2), Arg(args, 3))
    [] m = "constructor" -> NewDisposableStack(s, nt, "DisposableStack", "disposableStack")
    \* The closure of DisposableStack.prototype.adopt and AsyncDisposableStack.prototype.adopt.
    [] m = "adopted" -> Call(s, O(s, f).slots.data.onDispose, Undefined, <<O(s, f).slots.data.value>>)
    \* The closure of GetDisposeMethod.
    [] m = "fromSync" ->
         LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
             result == Call(cap.s, O(s, f).slots.data, this, <<>>)
             settled == IF IsAbrupt(result) THEN Call(result.s, Val(cap).reject, Undefined, <<result.c.value>>)
                        ELSE Call(result.s, Val(cap).resolve, Undefined, <<Undefined>>)
         IN Ok(settled.s, Val(cap).promise)
    \* %Iterator.prototype% [ @@dispose ] (§27.1.4.14).
    [] m = "iteratorDispose" ->
         LET return == GetMethod(s, this, SV("return")) IN
         IF IsAbrupt(return) \/ Val(return) = Undefined THEN ResultThen(Undefined, return)
         ELSE ResultThen(Undefined, Call(return.s, Val(return), this, <<>>))
    \* %AsyncIteratorPrototype% [ @@asyncDispose ] (§27.1.3.1), with unwrap, the closure that
    \* fulfills its promise with undefined.
    [] m = "asyncIteratorDispose" ->
         LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
             return == GetMethod(cap.s, this, SV("return"))
             result == IF IsAbrupt(return) \/ Val(return) = Undefined THEN return ELSE Call(return.s, Val(return), this, <<>>)
             wrapper == IF IsAbrupt(result) \/ Val(return) = Undefined THEN result ELSE PromiseResolve(result.s, Intrinsic(result.s, "Promise"), Val(result))
             unwrap == CreateBuiltinFunction(wrapper.s, <<"Disposable", "unwrap">>, 0, <<>>, Empty)
             settled == CASE IsAbrupt(wrapper) -> Call(wrapper.s, Val(cap).reject, Undefined, <<wrapper.c.value>>)
                          [] Val(return) = Undefined -> Call(wrapper.s, Val(cap).resolve, Undefined, <<Undefined>>)
                          [] OTHER -> AddPromiseReactions(unwrap.s, Val(wrapper), Val(unwrap), Undefined, Val(cap))
         IN Ok(settled.s, Val(cap).promise)
    [] m = "unwrap" -> Ok(s, Undefined)
    [] OTHER -> StackMethod(s, m, "DisposableStack", "disposableStack", "sync-dispose", this, args)

AsyncDisposableBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> NewDisposableStack(s, nt, "AsyncDisposableStack", "asyncDisposableStack")
    \* AsyncDisposableStack.prototype.disposeAsync (§27.4.3.3) runs DisposeResources as an async function would.
    [] m = "disposeAsync" ->
         LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
             isStack == IsObject(this) /\ O(cap.s, this).class = "asyncDisposableStack"
             error == ThrowTypeError(cap.s)
             settled ==
               CASE ~isStack -> Call(error.s, Val(cap).reject, Undefined, <<error.c.value>>)
                 [] O(cap.s, this).slots.state = "disposed" -> Call(cap.s, Val(cap).resolve, Undefined, <<Undefined>>)
                 [] OTHER ->
                      AsyncFunctionStep(Val(cap), DisposeResources(O(cap.s, this).slots.stack,
                                                    Ok(SetO(cap.s, this, [O(cap.s, this) EXCEPT !.slots.state = "disposed"]), Undefined)))
         IN Ok(settled.s, Val(cap).promise)
    [] OTHER -> StackMethod(s, m, "AsyncDisposableStack", "asyncDisposableStack", "async-dispose", this, args)
