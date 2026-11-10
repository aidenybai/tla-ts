\* ShadowRealm (proposal-shadowrealm). A ShadowRealm object has class "shadowRealm" and slots
\* [realm], the index of the realm it evaluates code in. A wrapped function exotic object has class
\* "wrapped" and slots [target, realm, constructor], with target the function it wraps and realm the
\* index of the realm that made it.

\* WrappedFunctionCreate: a wrapped function of realm for target.
WrappedFunctionCreate(s, realm, target) ==
  LET a == Alloc(s, MakeObject(Obj(s.realms[realm].intrinsics["FunctionPrototype"]), "wrapped",
                               [target |-> target, realm |-> realm, constructor |-> FALSE]))
      copied == CopyNameAndLength(a.s, a.v, target, <<>>, 0)
  IN IF IsAbrupt(copied) THEN ThrowTypeError(copied.s) ELSE copied

\* GetWrappedValue: a primitive as it is, and a callable object wrapped for realm.
GetWrappedValue(s, realm, v) ==
  IF ~IsObject(v) THEN Ok(s, v)
  ELSE IF ~IsCallable(s, v) THEN ThrowTypeError(s)
  ELSE WrappedFunctionCreate(s, realm, v)
GetWrappedValues(s, realm, values, acc) ==
  IF values = <<>> THEN Ok(s, acc) ELSE
  LET w == GetWrappedValue(s, realm, Head(values)) IN
  IF IsAbrupt(w) THEN w ELSE GetWrappedValues(w.s, realm, Tail(values), Append(acc, Val(w)))

\* OrdinaryWrappedFunctionCall, in the realm of the wrapped function f. The TypeError that stands
\* in for what the target throws is CreateTypeErrorCopy's.
OrdinaryWrappedFunctionCall(s, f, this, args) ==
  LET target == O(s, f).slots.target
      targetRealm == GetFunctionRealm(s, target)
  IN IF IsAbrupt(targetRealm) THEN targetRealm ELSE
     LET wrappedArgs == GetWrappedValues(targetRealm.s, Val(targetRealm), args, <<>>) IN
     IF IsAbrupt(wrappedArgs) THEN wrappedArgs ELSE
     LET wrappedThis == GetWrappedValue(wrappedArgs.s, Val(targetRealm), this) IN
     IF IsAbrupt(wrappedThis) THEN wrappedThis ELSE
     LET r == Call(wrappedThis.s, target, Val(wrappedThis), Val(wrappedArgs)) IN
     IF IsAbrupt(r) THEN ThrowTypeError(r.s) ELSE GetWrappedValue(r.s, O(s, f).slots.realm, Val(r))

\* PerformShadowRealmEval in the realm evalRealm, with GetShadowRealmContext's environments. The
\* host parses the source as an indirect eval in sloppy code, whose early errors are the same.
PerformShadowRealmEval(s, source, evalRealm) ==
  LET key == [goal |-> "eval", source |-> source, strict |-> FALSE, newTarget |-> FALSE,
              superProperty |-> FALSE, superCall |-> FALSE, privateNames |-> {}]
      parsed == s.parses[key]
  IN IF ~parsed.ok THEN ThrowError(s, "SyntaxError")
  ELSE IF ~Has(parsed.node.ScriptBody) THEN Ok(s, Undefined) ELSE
  LET script == parsed.node
      strictEval == script.ScriptBody.strict
      inner == EnterRealm(s, evalRealm)
      lex == NewDeclarativeEnvironment(inner, inner.globalEnv)
      ctx == Context(lex.e, IF strictEval THEN lex.e ELSE inner.globalEnv, NoPrivateEnvironment, Null)
      i == EvalDeclarationInstantiation(lex.s, ctx, script, strictEval)
      r == InCallerRealm(s, IF IsAbrupt(i) THEN i ELSE EvaluateStatementList(i.s, ctx, script.ScriptBody.StatementList))
  IN IF IsAbrupt(r) THEN ThrowTypeError(r.s)
     ELSE GetWrappedValue(r.s, s.realmId, IF Val(r) = Empty THEN Undefined ELSE Val(r))

\* ShadowRealmImportValue: imports the module in evalRealm as import() does there, and settles the
\* promise it returns from the namespace.
ShadowRealmImportValue(s, specifier, exportName, evalRealm) ==
  LET inner == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      loaded == ContinueDynamicImport(HostLoadModule(EnterRealm(inner.s, evalRealm),
                                                     [specifier |-> specifier, attributes |-> NoAttributes]),
                                      Val(inner), "evaluation")
      onFulfilled == CreateBuiltinFunction(EnterRealm(loaded.s, s.realmId), <<"ShadowRealm", "importFulfilled">>, 1, <<>>,
                                           exportName)
      onRejected == CreateBuiltinFunction(onFulfilled.s, <<"ShadowRealm", "importRejected">>, 1, <<>>, Empty)
      cap == NewPromiseCapability(onRejected.s, Intrinsic(onRejected.s, "Promise"))
  IN AddPromiseReactions(cap.s, Val(inner).promise, Val(onFulfilled), Val(onRejected), Val(cap))

IsShadowRealm(s, v) == IsObject(v) /\ O(s, v).class = "shadowRealm"

ShadowRealmIntrinsics ==
  << IntrinsicFunction("ShadowRealm", "FunctionPrototype", <<"ShadowRealm", "constructor">>, 0, N("ShadowRealm"), TRUE),
     IntrinsicObject("ShadowRealmPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

ShadowRealmProperties ==
  Ctor("ShadowRealm", "ShadowRealmPrototype") \o
  << M("ShadowRealmPrototype", SV("evaluate"), "ShadowRealm", "evaluate", 1),
     M("ShadowRealmPrototype", SV("importValue"), "ShadowRealm", "importValue", 2),
     V("ShadowRealmPrototype", SymToStringTag, SV("ShadowRealm"), FALSE, FALSE, TRUE),
     GlobalLink("ShadowRealm", N("ShadowRealm")) >>

\* The ShadowRealm constructor, its prototype's methods, and the closures of importValue.
ShadowRealmBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1) IN
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET o == OrdinaryCreateFromConstructor(s, nt, "ShadowRealmPrototype", "shadowRealm", [realm |-> 0]) IN
         IF IsAbrupt(o) THEN o
         ELSE Ok(SetSlots(CreateRealm(o.s).s, Val(o), [realm |-> Len(o.s.realms) + 1]), Val(o))
    [] m = "evaluate" ->
         IF ~IsShadowRealm(s, this) \/ ~IsString(a1) THEN ThrowTypeError(s)
         ELSE PerformShadowRealmEval(s, a1.value, Slots(s, this).realm)
    [] m = "importValue" ->
         IF ~IsShadowRealm(s, this) THEN ThrowTypeError(s) ELSE
         LET specifier == ToStr(s, a1) IN IF IsAbrupt(specifier) THEN specifier
         ELSE IF ~IsString(Arg(args, 2)) THEN ThrowTypeError(specifier.s)
         ELSE ShadowRealmImportValue(specifier.s, Val(specifier).value, Arg(args, 2).value, Slots(s, this).realm)
    [] m = "importFulfilled" ->
         LET name == Str(O(s, f).slots.data)
             has == HasOwnProperty(s, a1, name)
         IN IF IsAbrupt(has) THEN has ELSE IF Val(has) = False THEN ThrowTypeError(has.s) ELSE
            LET value == Get(has.s, a1, name) IN IF IsAbrupt(value) THEN value ELSE GetWrappedValue(value.s, s.realmId, Val(value))
    [] m = "importRejected" -> ThrowTypeError(s)
