\* Iterators (§7.4). An Iterator Record is [kind |-> "js", iterator, next, done], or a List
\* iterator [kind |-> "list", list, done] that runs no user code.
JsIterator(iterator, next) == [kind |-> "js", iterator |-> iterator, next |-> next, done |-> FALSE]
Done(it) == [it EXCEPT !.done = TRUE]

\* GetIterator (§7.4.4).
GetIterator(s, v, kind) ==
  IF kind = "async" THEN
    LET m == GetMethod(s, v, SymAsyncIterator) IN
    IF IsAbrupt(m) THEN m
    ELSE IF Val(m) # Undefined THEN GetIteratorFromMethod(m.s, v, Val(m))
    ELSE LET sm == GetMethod(m.s, v, SymIterator) IN
         IF IsAbrupt(sm) THEN sm
         ELSE IF Val(sm) = Undefined THEN ThrowTypeError(sm.s)
         ELSE LET it == GetIteratorFromMethod(sm.s, v, Val(sm)) IN
              IF IsAbrupt(it) THEN it ELSE CreateAsyncFromSyncIterator(it.s, Val(it))
  ELSE
    LET m == GetMethod(s, v, SymIterator) IN
    IF IsAbrupt(m) THEN m
    ELSE IF Val(m) = Undefined THEN ThrowTypeError(m.s)
    ELSE GetIteratorFromMethod(m.s, v, Val(m))

\* GetIteratorFromMethod (§7.4.3).
GetIteratorFromMethod(s, v, method) ==
  LET it == Call(s, method, v, <<>>) IN
  IF IsAbrupt(it) THEN it
  ELSE IF ~IsObject(Val(it)) THEN ThrowTypeError(it.s)
  ELSE LET next == Get(it.s, Val(it), SV("next")) IN
       IF IsAbrupt(next) THEN next ELSE Ok(next.s, JsIterator(Val(it), Val(next)))

\* IteratorNext (§7.4.6).
IteratorNext(s, it, args) ==
  LET r == Call(s, it.next, it.iterator, args) IN
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE r

\* IteratorComplete (§7.4.7), as a TLA+ Boolean.
IteratorComplete(s, r) ==
  LET d == Get(s, r, SV("done")) IN
  IF IsAbrupt(d) THEN d ELSE Ok(d.s, ToBooleanValue(Val(d)))

\* IteratorStepValue (§7.4.10), returning [done, value, iterator] with the updated record. When it
\* is abrupt, the iterator is done. When next is %ArrayIteratorPrototype%.next, its result object
\* is never allocated, since no code can observe it, and a heap that never frees would keep it.
IteratorStepValue(s, it) ==
  IF it.kind = "list" THEN
    IF it.list = <<>> THEN Ok(s, [done |-> TRUE, value |-> Undefined, iterator |-> Done(it)])
    ELSE Ok(s, [done |-> FALSE, value |-> Head(it.list), iterator |-> [it EXCEPT !.list = Tail(@)]])
  ELSE IF IsObject(it.next) /\ O(s, it.next).class = "builtin" /\ O(s, it.next).slots.id = <<"ArrayIterator", "next">> THEN
    LET r == InCallerRealm(s, ArrayIteratorResume(EnterRealm(s, O(s, it.next).slots.realm), it.iterator)) IN
    IF IsAbrupt(r) THEN r
    ELSE IF Val(r).done THEN Ok(r.s, [done |-> TRUE, value |-> Undefined, iterator |-> Done(it)])
    ELSE Ok(r.s, [done |-> FALSE, value |-> Val(r).value, iterator |-> it])
  ELSE
    LET r == IteratorNext(s, it, <<>>) IN
    IF IsAbrupt(r) THEN r ELSE
    LET d == IteratorComplete(r.s, Val(r)) IN
    IF IsAbrupt(d) THEN d
    ELSE IF Val(d) THEN Ok(d.s, [done |-> TRUE, value |-> Undefined, iterator |-> Done(it)])
    ELSE LET v == Get(d.s, Val(r), SV("value")) IN
         IF IsAbrupt(v) THEN v ELSE Ok(v.s, [done |-> FALSE, value |-> Val(v), iterator |-> it])

\* IteratorClose (§7.4.11), returning the completion to continue with.
IteratorClose(s, it, completion) ==
  IF it.kind = "list" THEN Abrupt(s, completion)
  ELSE
    LET m == GetMethod(s, it.iterator, SV("return"))
        inner == IF IsAbrupt(m) \/ Val(m) = Undefined THEN m ELSE Call(m.s, Val(m), it.iterator, <<>>)
    IN IF ~IsAbrupt(m) /\ Val(m) = Undefined THEN Abrupt(m.s, completion)
       ELSE IF completion.type = "throw" THEN Abrupt(inner.s, completion)
       ELSE IF IsAbrupt(inner) THEN inner
       ELSE IF ~IsObject(Val(inner)) THEN ThrowTypeError(inner.s)
       ELSE Abrupt(inner.s, completion)

\* AsyncIteratorClose (§7.4.13).
AsyncIteratorClose(s, it, completion) ==
  LET m == GetMethod(s, it.iterator, SV("return")) IN
  IF ~IsAbrupt(m) /\ Val(m) = Undefined THEN Abrupt(m.s, completion)
  ELSE LET called == IF IsAbrupt(m) THEN m ELSE Call(m.s, Val(m), it.iterator, <<>>) IN
       AsyncCloseThen(completion, IF IsAbrupt(called) THEN called ELSE Await(called.s, Val(called)))
AsyncCloseThen(completion, r) ==
  IF completion.type = "throw" THEN Abrupt(r.s, completion)
  ELSE IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE Abrupt(r.s, completion)

\* IteratorToList (§7.4.14), appending to acc. IteratorListRun takes at most
\* 2^k steps nested k deep, so a long iterator needs no frame per element.
IteratorListStep(s, it, acc) ==
  LET next == IteratorStepValue(s, it) IN
  CASE IsAbrupt(next) -> next
    [] Val(next).done -> Ok(next.s, acc)
    [] OTHER -> [s |-> next.s, c |-> Completion("iterate", Append(acc, Val(next).value), Empty), it |-> Val(next).iterator]
IteratorListRun(s, it, acc, k) ==
  IF k = 0 THEN IteratorListStep(s, it, acc)
  ELSE IteratorListRunThen(k, IteratorListRun(s, it, acc, k - 1))
IteratorListRunThen(k, r) == IF r.c.type = "iterate" THEN IteratorListRun(r.s, r.it, Val(r), k - 1) ELSE r
IteratorListFrom(s, it, acc, k) == IteratorListFromThen(k, IteratorListRun(s, it, acc, k))
IteratorListFromThen(k, r) == IF r.c.type = "iterate" THEN IteratorListFrom(r.s, r.it, Val(r), k + 1) ELSE r
IteratorToList(s, it, acc) == IteratorListFrom(s, it, acc, 0)

\* CreateIterResultObject (§7.4.15).
CreateIterResultObject(s, value, done) ==
  LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype")) IN
  Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), <<<<SV("value"), value>>, <<SV("done"), Bool(done)>>>>)), Val(o))

\* CreateForInIterator (§14.7.5.10.1).
CreateForInIterator(s, obj) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "ForInIteratorPrototype"), "forInIterator",
                               [object |-> obj, visited |-> FALSE, visitedKeys |-> <<>>, remaining |-> <<>>]))
  IN Ok(a.s, JsIterator(a.v, Intrinsic(a.s, "ForInIteratorPrototype_next")))

\* InitializeBoundName (§8.6.3): initializes the binding in env, or assigns it when env is
\* NoEnv.
NoEnv == 0
InitializeBoundName(s, ctx, name, value, env, strict) ==
  IF env # NoEnv THEN InitializeBinding(s, env, name, value)
  ELSE LET lhs == ResolveBinding(s, ctx, name, strict) IN
       IF IsAbrupt(lhs) THEN lhs ELSE PutValue(lhs.s, Val(lhs), value)

\* ResolveBinding of a name in env, or in the running context when env is Undefined.
ResolveBindingIn(s, ctx, name, env, strict) ==
  IF env = NoEnv THEN ResolveBinding(s, ctx, name, strict)
  ELSE GetIdentifierReference(s, env, name, strict)

\* Assigns or initializes a reference, as the binding operations do at their end.
BindReference(s, ref, value, env) ==
  IF env = NoEnv THEN PutValue(s, ref, value) ELSE InitializeReferencedBinding(s, ref, value)

\* Evaluates an initializer for a binding target named name, applying NamedEvaluation when the
\* target is a single name.
EvaluateInitializer(s, ctx, init, name) ==
  IF name # Empty THEN EvaluateNamed(s, ctx, init, Str(name)) ELSE EvaluateValue(s, ctx, init)

\* BindingInitialization (§8.6.2).
BindingInitialization(s, ctx, n, value, env) ==
  CASE n.type = "BindingIdentifier" -> InitializeBoundName(s, ctx, n.name, value, env, n.strict)
    [] n.type = "ObjectBindingPattern" ->
         LET c == RequireObjectCoercible(s, value) IN
         IF IsAbrupt(c) THEN c
         ELSE ObjectBindingThen(ctx, n, value, env, PropertyBindingInitialization(c.s, ctx, List(n.BindingPropertyList), value, env, <<>>))
    [] n.type = "ArrayBindingPattern" ->
         LET it == GetIterator(s, value, "sync") IN
         IF IsAbrupt(it) THEN it
         ELSE IteratorEndThen(IteratorBindingInitializationList(it.s, ctx, ArrayBindingElements(n), Val(it), env))
ObjectBindingThen(ctx, n, value, env, r) ==
  IF IsAbrupt(r) \/ ~Has(n.BindingRestProperty) THEN r
  ELSE RestPropertyBinding(r.s, ctx, n.BindingRestProperty, value, env, Val(r))

\* Closes the iterator a list of elements left undone, after r [s, c, it].
IteratorEndThen(r) == IF r.it.done THEN [s |-> r.s, c |-> r.c] ELSE IteratorClose(r.s, r.it, r.c)

ArrayBindingElements(n) ==
  List(n.BindingElementList) \o (IF Has(n.BindingRestElement) THEN <<n.BindingRestElement>> ELSE <<>>)

\* PropertyBindingInitialization (§14.3.3.1), returning the property keys it bound.
PropertyBindingInitialization(s, ctx, props, value, env, keys) ==
  IF props = <<>> THEN Ok(s, keys)
  ELSE PropertyBindingKeyThen(ctx, props, value, env, keys,
                              IF Head(props).type = "SingleNameBinding" THEN Ok(s, Str(Head(props).BindingIdentifier.name))
                              ELSE EvaluatePropertyKey(s, ctx, Head(props).PropertyName))
PropertyBindingKeyThen(ctx, props, value, env, keys, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET p == Head(props) IN
  PropertyBindingNextThen(ctx, Tail(props), value, env, Append(keys, Val(r)),
                          KeyedBindingInitialization(r.s, ctx, IF p.type = "SingleNameBinding" THEN p ELSE p.BindingElement,
                                                     value, env, Val(r)))
PropertyBindingNextThen(ctx, rest, value, env, keys, r) ==
  IF IsAbrupt(r) THEN r ELSE PropertyBindingInitialization(r.s, ctx, rest, value, env, keys)

\* KeyedBindingInitialization (§14.3.3.3).
KeyedBindingInitialization(s, ctx, n, value, env, key) ==
  IF n.type = "SingleNameBinding" THEN
    LET name == n.BindingIdentifier.name
        lhs == ResolveBindingIn(s, ctx, name, env, n.strict)
    IN IF IsAbrupt(lhs) THEN lhs ELSE
       LET v == GetValueProperty(lhs.s, value, key) IN
       IF IsAbrupt(v) THEN v
       ELSE BindReferenceThen(Val(lhs), env, IF Has(n.Initializer) /\ Val(v) = Undefined
                                             THEN EvaluateInitializer(v.s, ctx, n.Initializer, name) ELSE v)
  ELSE
    LET v == GetValueProperty(s, value, key) IN
    IF IsAbrupt(v) THEN v
    ELSE PatternInitializerThen(ctx, n.BindingPattern, env, IF Has(n.Initializer) /\ Val(v) = Undefined
                                                           THEN EvaluateValue(v.s, ctx, n.Initializer) ELSE v)
BindReferenceThen(ref, env, r) == IF IsAbrupt(r) THEN r ELSE BindReference(r.s, ref, Val(r), env)

\* RestBindingInitialization (§14.3.3.2).
RestPropertyBinding(s, ctx, n, value, env, excluded) ==
  LET lhs == ResolveBindingIn(s, ctx, n.BindingIdentifier.name, env, n.strict) IN
  IF IsAbrupt(lhs) THEN lhs ELSE
  LET o == OrdinaryObjectCreate(lhs.s, Intrinsic(lhs.s, "ObjectPrototype")) IN
  LET c == CopyDataProperties(o.s, Val(o), value, excluded) IN
  IF IsAbrupt(c) THEN c ELSE BindReference(c.s, Val(lhs), Val(o), env)

\* IteratorBindingInitialization (§8.6.4) of a list of elements or formal parameters. Returns
\* [s, c, it] with the iterator record after the elements consume it.
IteratorBindingInitializationList(s, ctx, list, it, env) ==
  IF list = <<>> THEN [s |-> s, c |-> NormalCompletion(Empty), it |-> it]
  ELSE IteratorBindingListThen(ctx, Tail(list), env, IteratorBindingElement(s, ctx, Head(list), it, env))
IteratorBindingListThen(ctx, rest, env, r) ==
  IF IsAbrupt(r) THEN r ELSE IteratorBindingInitializationList(r.s, ctx, rest, r.it, env)

\* The next value from an iterator for a binding element: [s, c, it] with c's value the value or
\* Undefined once the iterator is done.
IteratorNextForBinding(s, it) ==
  IF it.done THEN [s |-> s, c |-> NormalCompletion(Undefined), it |-> it]
  ELSE LET next == IteratorStepValue(s, it) IN
       IF IsAbrupt(next) THEN [s |-> next.s, c |-> next.c, it |-> Done(it)]
       ELSE [s |-> next.s, c |-> NormalCompletion(Val(next).value), it |-> Val(next).iterator]

WithIt(r, it) == [s |-> r.s, c |-> r.c, it |-> it]
WithItThen(it, r) == WithIt(r, it)

IteratorBindingElement(s, ctx, n, it, env) ==
  CASE n.type = "Elision" ->
         LET next == IteratorNextForBinding(s, it) IN
         IF IsAbrupt(next) THEN next ELSE WithIt(Ok(next.s, Empty), next.it)
    [] n.type = "SingleNameBinding" ->
         LET name == n.BindingIdentifier.name
             lhs == ResolveBindingIn(s, ctx, name, env, n.strict)
         IN IF IsAbrupt(lhs) THEN WithIt(lhs, it) ELSE
            LET next == IteratorNextForBinding(lhs.s, it) IN
            IF IsAbrupt(next) THEN next
            ELSE IteratorBindThen(Val(lhs), env, next.it,
                                  IF Has(n.Initializer) /\ Val(next) = Undefined
                                  THEN EvaluateInitializer(next.s, ctx, n.Initializer, name) ELSE next)
    [] n.type = "BindingElement" ->
         LET next == IteratorNextForBinding(s, it) IN
         IF IsAbrupt(next) THEN next
         ELSE IteratorPatternThen(ctx, n.BindingPattern, env, next.it,
                                  IF Has(n.Initializer) /\ Val(next) = Undefined
                                  THEN EvaluateValue(next.s, ctx, n.Initializer) ELSE next)
    [] n.type = "BindingRestElement" ->
         LET lhs == IF Has(n.BindingIdentifier)
                    THEN ResolveBindingIn(s, ctx, n.BindingIdentifier.name, env, n.strict)
                    ELSE Ok(s, Empty)
         IN IF IsAbrupt(lhs) THEN WithIt(lhs, it) ELSE
            LET a == ArrayCreate(lhs.s, 0, Intrinsic(lhs.s, "ArrayPrototype"))
                rest == CollectRest(a.s, Val(a), it, 0)
            IN IF IsAbrupt(rest) THEN rest
               ELSE IF Has(n.BindingIdentifier) THEN WithIt(BindReference(rest.s, Val(lhs), Val(a), env), rest.it)
               ELSE WithItThen(rest.it, BindingInitialization(rest.s, ctx, n.BindingPattern, Val(a), env))
IteratorBindThen(ref, env, it, r) ==
  IF IsAbrupt(r) THEN WithIt(r, it) ELSE WithIt(BindReference(r.s, ref, Val(r), env), it)
IteratorPatternThen(ctx, pattern, env, it, r) ==
  IF IsAbrupt(r) THEN WithIt(r, it) ELSE WithItThen(it, BindingInitialization(r.s, ctx, pattern, Val(r), env))

\* Steps of BindingRestElement that fill the array a with the iterator's remaining values.
CollectRest(s, a, it, i) ==
  IF it.done THEN [s |-> s, c |-> NormalCompletion(a), it |-> it]
  ELSE LET next == IteratorStepValue(s, it) IN
       IF IsAbrupt(next) THEN [s |-> next.s, c |-> next.c, it |-> Done(it)]
       ELSE IF Val(next).done THEN [s |-> next.s, c |-> NormalCompletion(a), it |-> Val(next).iterator]
       ELSE LET c == CreateDataPropertyOrThrow(next.s, a, Str(NumToString(NumFromInt(i))), Val(next).value) IN
            CollectRest(c.s, a, Val(next).iterator, i + 1)

\* DestructuringAssignmentEvaluation (§13.15.5.2) of a pattern the host refined.
IsAssignmentPattern(n) == n.type \in {"ObjectAssignmentPattern", "ArrayAssignmentPattern"}

DestructuringAssignmentEvaluation(s, ctx, n, value) ==
  IF n.type = "ObjectAssignmentPattern" THEN
    LET c == RequireObjectCoercible(s, value) IN
    IF IsAbrupt(c) THEN c
    ELSE ObjectDestructuringThen(ctx, n, value, PropertyDestructuring(c.s, ctx, List(n.AssignmentPropertyList), value, <<>>))
  ELSE
    LET it == GetIterator(s, value, "sync") IN
    IF IsAbrupt(it) THEN it
    ELSE IteratorEndThen(IteratorDestructuringList(it.s, ctx, List(n.AssignmentElementList) \o
                           (IF Has(n.AssignmentRestElement) THEN <<n.AssignmentRestElement>> ELSE <<>>), Val(it)))
ObjectDestructuringThen(ctx, n, value, r) ==
  IF IsAbrupt(r) \/ ~Has(n.AssignmentRestProperty) THEN r
  ELSE RestDestructuringThen(value, Val(r), Evaluate(r.s, ctx, n.AssignmentRestProperty.DestructuringAssignmentTarget))
RestDestructuringThen(value, keys, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET o == OrdinaryObjectCreate(r.s, Intrinsic(r.s, "ObjectPrototype"))
      copied == CopyDataProperties(o.s, Val(o), value, keys)
  IN IF IsAbrupt(copied) THEN copied ELSE PutValue(copied.s, Val(r), Val(o))

\* PropertyDestructuringAssignmentEvaluation (§13.15.5.3), returning the keys it read.
PropertyDestructuring(s, ctx, props, value, keys) ==
  IF props = <<>> THEN Ok(s, keys)
  ELSE LET p == Head(props) IN
  IF Has(p.IdentifierReference) THEN
    LET name == p.IdentifierReference.name
        lref == ResolveBinding(s, ctx, name, p.IdentifierReference.strict)
    IN IF IsAbrupt(lref) THEN lref ELSE
       LET v == GetValueProperty(lref.s, value, Str(name)) IN
       IF IsAbrupt(v) THEN v
       ELSE PropertyDestructuringNextThen(ctx, Tail(props), value, Append(keys, Str(name)),
              PutValueThen(Val(lref), IF Has(p.Initializer) /\ Val(v) = Undefined
                                      THEN EvaluateInitializer(v.s, ctx, p.Initializer, name) ELSE v))
  ELSE PropertyDestructuringKeyThen(ctx, props, value, keys, EvaluatePropertyKey(s, ctx, p.PropertyName))
PropertyDestructuringKeyThen(ctx, props, value, keys, r) ==
  IF IsAbrupt(r) THEN r
  ELSE PropertyDestructuringNextThen(ctx, Tail(props), value, Append(keys, Val(r)),
                                     KeyedDestructuring(r.s, ctx, Head(props).AssignmentElement, value, Val(r)))
PropertyDestructuringNextThen(ctx, rest, value, keys, r) ==
  IF IsAbrupt(r) THEN r ELSE PropertyDestructuring(r.s, ctx, rest, value, keys)

\* The name an initializer's anonymous function gets from a destructuring target, or Empty.
TargetName(target) == IF IsIdentifierRef(target) THEN target.name ELSE Empty

\* The reference a destructuring target evaluates to, or Empty for a nested pattern.
EvaluateTarget(s, ctx, target) == IF IsAssignmentPattern(target) THEN Ok(s, Empty) ELSE Evaluate(s, ctx, target)

\* KeyedDestructuringAssignmentEvaluation (§13.15.5.6).
KeyedDestructuring(s, ctx, n, value, key) ==
  KeyedTargetThen(ctx, n, value, key, EvaluateTarget(s, ctx, n.DestructuringAssignmentTarget))
KeyedTargetThen(ctx, n, value, key, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET target == n.DestructuringAssignmentTarget
      v == GetValueProperty(r.s, value, key)
  IN IF IsAbrupt(v) THEN v
     ELSE AssignTargetThen(ctx, target, Val(r), IF Has(n.Initializer) /\ Val(v) = Undefined
                                               THEN EvaluateInitializer(v.s, ctx, n.Initializer, TargetName(target)) ELSE v)

\* Assigns the value r gives to a destructuring target, through its reference or as a pattern.
AssignTargetThen(ctx, target, ref, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF IsAssignmentPattern(target) THEN DestructuringAssignmentEvaluation(r.s, ctx, target, Val(r))
  ELSE PutValue(r.s, ref, Val(r))

\* IteratorDestructuringAssignmentEvaluation (§13.15.5.5), returning [s, c, it].
IteratorDestructuringList(s, ctx, list, it) ==
  IF list = <<>> THEN [s |-> s, c |-> NormalCompletion(Empty), it |-> it]
  ELSE IteratorDestructuringListThen(ctx, Tail(list), IteratorDestructuringElement(s, ctx, Head(list), it))
IteratorDestructuringListThen(ctx, rest, r) ==
  IF IsAbrupt(r) THEN r ELSE IteratorDestructuringList(r.s, ctx, rest, r.it)

IteratorDestructuringElement(s, ctx, n, it) ==
  CASE n.type = "Elision" ->
         LET next == IteratorNextForBinding(s, it) IN
         IF IsAbrupt(next) THEN next ELSE WithIt(Ok(next.s, Empty), next.it)
    [] n.type = "AssignmentElement" -> IteratorTargetThen(ctx, n, it, EvaluateTarget(s, ctx, n.DestructuringAssignmentTarget))
    [] OTHER -> IteratorRestTargetThen(ctx, n, it, EvaluateTarget(s, ctx, n.AssignmentExpression))
IteratorTargetThen(ctx, n, it, r) ==
  IF IsAbrupt(r) THEN WithIt(r, it) ELSE
  LET target == n.DestructuringAssignmentTarget
      next == IteratorNextForBinding(r.s, it)
  IN IF IsAbrupt(next) THEN next
     ELSE IteratorAssignThen(ctx, target, Val(r), next.it,
                             IF Has(n.Initializer) /\ Val(next) = Undefined
                             THEN EvaluateInitializer(next.s, ctx, n.Initializer, TargetName(target)) ELSE next)
IteratorAssignThen(ctx, target, ref, it, r) ==
  IF IsAbrupt(r) THEN WithIt(r, it) ELSE WithItThen(it, AssignTargetThen(ctx, target, ref, r))
IteratorRestTargetThen(ctx, n, it, r) ==
  IF IsAbrupt(r) THEN WithIt(r, it) ELSE
  LET a == ArrayCreate(r.s, 0, Intrinsic(r.s, "ArrayPrototype"))
      rest == CollectRest(a.s, Val(a), it, 0)
  IN IF IsAbrupt(rest) THEN rest
     ELSE WithItThen(rest.it, AssignTargetThen(ctx, n.AssignmentExpression, Val(r), Ok(rest.s, Val(a))))
