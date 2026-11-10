\* Function objects (§10.2, §10.3, §10.4.1). An ECMAScript function object has class "function"
\* and slots:
\*   kind        "normal", "generator", "async", or "asyncGenerator"
\*   params      its formal parameters, a sequence of nodes
\*   body        the body node
\*   env, priv   the environment and private environment it closes over
\*   thisMode    "lexical", "strict", or "global"
\*   strict      whether its code is strict
\*   home        its [[HomeObject]], or Undefined
\*   ctorKind    "base" or "derived"
\*   classCtor   whether it is a class constructor
\*   constructor whether it has [[Construct]]
\*   fields, privateMethods, initializers, initializerName, sourceText
\* A built-in function object has class "builtin" and slots [id, constructor, data].

\* The execution context that evaluation passes down: the lexical, variable, and private
\* environments, the active function or Null, and the generator whose body runs or Null.
Context(lex, var, priv, fn) == [lex |-> lex, var |-> var, priv |-> priv, fn |-> fn, gen |-> Null]
WithLex(ctx, e) == [ctx EXCEPT !.lex = e]

FunctionSlots(kind, params, body, env, priv, thisMode, strict, sourceText, realm) ==
  [realm |-> realm, kind |-> kind, params |-> params, body |-> body, env |-> env, priv |-> priv,
   thisMode |-> thisMode, strict |-> strict, home |-> Undefined, ctorKind |-> "base",
   classCtor |-> FALSE, constructor |-> FALSE, fields |-> <<>>, privateMethods |-> <<>>, initializers |-> Empty,
   initializerName |-> Empty, sourceText |-> sourceText]

\* OrdinaryFunctionCreate (§10.2.3), returning [s, v].
OrdinaryFunctionCreate(s, proto, sourceText, params, body, isLexicalThis, env, priv) ==
  LET strict == body.strict
      thisMode == IF isLexicalThis THEN "lexical" ELSE IF strict THEN "strict" ELSE "global"
      kind == CASE body.type = "GeneratorBody" -> "generator"
                [] body.type = "AsyncGeneratorBody" -> "asyncGenerator"
                [] body.type \in {"AsyncBody", "AsyncConciseBody"} -> "async"
                [] OTHER -> "normal"
      o == PutProp(MakeObject(proto, "function",
                              FunctionSlots(kind, params, body, env, priv, thisMode, strict, sourceText, s.realmId)),
                   SV("length"), DataDesc(IntV(ExpectedArgumentCount(params)), FALSE, FALSE, TRUE))
  IN Alloc(s, o)

\* MakeConstructor (§10.2.5), with a prototype object or Empty to make one.
MakeConstructor(s, f, writable, prototype) ==
  LET s1 == SetO(s, f, [O(s, f) EXCEPT !.slots.constructor = TRUE])
      p == IF prototype = Empty
           THEN LET a == Alloc(s1, MakeObject(Intrinsic(s1, "ObjectPrototype"), "ordinary", [none |-> TRUE]))
                IN [s |-> SetO(a.s, a.v, PutProp(O(a.s, a.v), SV("constructor"), DataDesc(f, writable, FALSE, TRUE))),
                    v |-> a.v]
           ELSE [s |-> s1, v |-> prototype]
  IN SetO(p.s, f, PutProp(O(p.s, f), SV("prototype"), DataDesc(p.v, writable, FALSE, FALSE)))

MakeClassConstructor(s, f) == SetO(s, f, [O(s, f) EXCEPT !.slots.classCtor = TRUE])
MakeMethod(s, f, home) == SetO(s, f, [O(s, f) EXCEPT !.slots.home = home])

\* SetFunctionName (§10.2.9) with a prefix such as "get", or <<>> for none.
FunctionNameUnits(s, name) ==
  CASE name.type = "symbol" ->
         IF s.syms[name.id] = Undefined THEN <<>> ELSE <<91>> \o s.syms[name.id].value \o <<93>>
    [] name.type = "private" -> name.description
    [] OTHER -> name.value
SetFunctionName(s, f, name, prefix) ==
  LET units == FunctionNameUnits(s, name)
      full == IF prefix = <<>> THEN units ELSE prefix \o <<32>> \o units
  IN SetO(s, f, PutProp(O(s, f), SV("name"), DataDesc(Str(full), FALSE, FALSE, TRUE)))

SetFunctionLength(s, f, length) ==
  SetO(s, f, PutProp(O(s, f), SV("length"), DataDesc(IntV(length), FALSE, FALSE, TRUE)))

\* [[Call]] and [[Construct]] by class.
\* A built-in or ECMAScript function runs in its realm, and its caller's realm is current again
\* when it returns.
CallObject(s, f, this, args) ==
  LET o == O(s, f) IN
  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, o.slots.id, this, args, Undefined))
    [] o.class = "bound" -> Call(s, o.slots.target, o.slots.this, o.slots.args \o args)
    [] o.class = "proxy" -> ProxyCall(s, f, this, args)
    [] o.class = "wrapped" -> InCallerRealm(s, OrdinaryWrappedFunctionCall(EnterRealm(s, o.slots.realm), f, this, args))
    [] OTHER -> InCallerRealm(s, OrdinaryCall(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, this, args))
\* Returns to the caller's realm and active calls after a call that started in state caller.
InCallerRealm(caller, r) == [r EXCEPT !.s = [EnterRealm(r.s, caller.realmId) EXCEPT !.callers = caller.callers]]
\* The active calls of built-in and ECMAScript functions, innermost first, for the caller and
\* arguments properties of non-strict functions.
PushCaller(s, f, args) == [s EXCEPT !.callers = [f |-> f, args |-> args, next |-> s.callers]]

ConstructObject(s, f, args, newTarget) ==
  LET o == O(s, f) IN
  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, o.slots.id, Undefined, args, newTarget))
    [] o.class = "bound" ->
         Construct(s, o.slots.target, o.slots.args \o args,
                   IF SameValue(f, newTarget) THEN o.slots.target ELSE newTarget)
    [] o.class = "proxy" -> ProxyConstruct(s, f, args, newTarget)
    [] OTHER -> InCallerRealm(s, OrdinaryConstruct(PushCaller(s, f, args), f, args, newTarget))

\* PrepareForOrdinaryCall (§10.2.1.1), returning [s, ctx].
PrepareForOrdinaryCall(s, f, newTarget) ==
  LET env == NewFunctionEnvironment(s, f, newTarget)
  IN [s |-> env.s, ctx |-> Context(env.e, env.e, O(s, f).slots.priv, f)]

\* OrdinaryCallBindThis (§10.2.1.2).
OrdinaryCallBindThis(s, f, ctx, this) ==
  LET mode == O(s, f).slots.thisMode IN
  IF mode = "lexical" THEN Ok(s, Undefined)
  ELSE IF mode = "strict" THEN BindThisValue(s, ctx.lex, this)
  ELSE IF IsNullish(this)
  THEN BindThisValue(s, ctx.lex, E(s, s.globalEnv).this)
  ELSE LET t == ToObject(s, this) IN
       IF IsAbrupt(t) THEN t ELSE BindThisValue(t.s, ctx.lex, Val(t))

\* [[Call]] of an ECMAScript function object (§10.2.1).
OrdinaryCall(s, f, this, args) == FreeEnvs(s.envs.size, TailCallFrom(OrdinaryCallRun(s, f, this, args), 0))
OrdinaryCallRun(s, f, this, args) ==
  IF O(s, f).slots.classCtor THEN ThrowTypeError(s)
  ELSE
    LET p == PrepareForOrdinaryCall(s, f, Undefined)
        b == OrdinaryCallBindThis(p.s, f, p.ctx, this)
    IN IF IsAbrupt(b) THEN b
       ELSE LET r == OrdinaryCallEvaluateBody(b.s, f, p.ctx, args) IN
       IF r.c.type = "return" THEN Ok(r.s, r.c.value)
       ELSE IF IsAbrupt(r) THEN r
       ELSE Ok(r.s, Undefined)

\* [[Construct]] of an ECMAScript function object (§10.2.2).
OrdinaryConstruct(s, f, args, newTarget) ==
  LET kind == O(s, f).slots.ctorKind
      this == IF kind = "base"
              THEN OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", [none |-> TRUE])
              ELSE Ok(s, Empty)
  IN IF IsAbrupt(this) THEN this ELSE
     LET p == PrepareForOrdinaryCall(EnterRealm(this.s, O(s, f).slots.realm), f, newTarget)
         b == IF kind = "base" THEN OrdinaryCallBindThis(p.s, f, p.ctx, Val(this)) ELSE Ok(p.s, Empty)
     IN IF IsAbrupt(b) THEN InCallerRealm(s, b) ELSE
        LET i == IF kind = "base" THEN InitializeInstanceElements(b.s, Val(this), f) ELSE Ok(b.s, Empty) IN
        IF IsAbrupt(i) THEN InCallerRealm(s, i) ELSE
        \* The steps after the body run in the caller's realm, as the callee's context is gone.
        LET r == InCallerRealm(s, TailCallReturn(OrdinaryCallEvaluateBody(i.s, f, p.ctx, args))) IN
        IF r.c.type = "return" THEN
          IF IsObject(r.c.value) THEN Ok(r.s, r.c.value)
          ELSE IF kind = "base" THEN Ok(r.s, Val(this))
          ELSE IF r.c.value # Undefined THEN ThrowTypeError(r.s)
          ELSE GetThisBinding(r.s, p.ctx.lex)
        ELSE IF IsAbrupt(r) THEN r
        ELSE IF kind = "base" THEN Ok(r.s, Val(this))
        ELSE GetThisBinding(r.s, p.ctx.lex)

\* The tail calls (§15.10.3) a call's body made in its place, while r is one, doubling the calls
\* each level of TailCallRun makes so that the depth of the evaluation grows only with their log.
TailCallStep(r) ==
  LET t == r.c.value
      s == IF r.s.callers = Null THEN r.s ELSE [r.s EXCEPT !.callers.f = t.f, !.callers.args = t.args]
  IN IF O(s, t.f).class = "function"
     THEN InCallerRealm(s, OrdinaryCallRun(EnterRealm(s, O(s, t.f).slots.realm), t.f, t.this, t.args))
     ELSE Call(s, t.f, t.this, t.args)
TailCallRun(r, k) == IF k = 0 THEN TailCallStep(r) ELSE TailCallRunThen(k, TailCallRun(r, k - 1))
TailCallRunThen(k, r) == IF r.c.type = "tailcall" THEN TailCallRun(r, k - 1) ELSE r
TailCallFrom(r, k) == IF r.c.type = "tailcall" THEN TailCallFrom(TailCallRun(r, k), k + 1) ELSE r
\* A constructor body's tail call, as the return completion of its result.
TailCallReturn(r) ==
  IF r.c.type # "tailcall" THEN r ELSE
  LET v == TailCallFrom(r, 0) IN IF IsAbrupt(v) THEN v ELSE Abrupt(v.s, Completion("return", Val(v), Empty))

\* OrdinaryCallEvaluateBody (§10.2.1.4) and EvaluateBody (§10.2.1.3 and the bodies' rules).
OrdinaryCallEvaluateBody(s, f, ctx, args) ==
  LET fo == O(s, f)
      body == fo.slots.body
  IN CASE fo.slots.kind = "normal" ->
            LET i == FunctionDeclarationInstantiation(s, f, ctx, args) IN
            IF IsAbrupt(i) THEN i
            ELSE IF body.type = "FunctionBody" THEN EvaluateDisposing(i.s, Val(i), body.FunctionStatementList)
            ELSE IF body.type = "ClassFieldInitializer" THEN EvaluateFieldInitializer(i.s, Val(i), f, body)
            ELSE IF body.type = "ClassStaticBlockBody" THEN EvaluateDisposing(i.s, Val(i), body.ClassStaticBlockStatementList)
            ELSE LET e == EvaluateValue(i.s, Val(i), ConciseExpression(body)) IN
                 IF IsAbrupt(e) THEN e ELSE Abrupt(e.s, Completion("return", Val(e), Empty))
       [] fo.slots.kind = "generator" -> EvaluateGeneratorBody(s, f, ctx, args)
       [] fo.slots.kind = "async" -> EvaluateAsyncFunctionBody(s, f, ctx, args)
       [] fo.slots.kind = "asyncGenerator" -> EvaluateAsyncGeneratorBody(s, f, ctx, args)

ConciseExpression(body) ==
  IF body.type = "ExpressionBody" THEN body.AssignmentExpression
  ELSE IF "ExpressionBody" \in DOMAIN body THEN body.ExpressionBody.AssignmentExpression
  ELSE body.AsyncConciseBody

\* The statements a function body runs, for the instantiation algorithms.
BodyCode(body) ==
  CASE body.type \in {"FunctionBody", "GeneratorBody", "AsyncBody", "AsyncGeneratorBody"} -> body
    [] body.type = "ClassStaticBlockBody" -> body
    [] OTHER -> [type |-> "FunctionBody", FunctionStatementList |-> <<>>, mayUseArguments |-> TRUE, strict |-> body.strict]

\* FunctionDeclarationInstantiation (§10.2.11), returning the context the body runs in.
FunctionDeclarationInstantiation(s, f, ctx, args) ==
  LET fo == O(s, f)
      code == BodyCode(fo.slots.body)
      strict == fo.slots.strict
      formals == fo.slots.params
      parameterNames == BoundNamesList(formals)
      hasDuplicates == Cardinality(Range(parameterNames)) < Len(parameterNames)
      simple == IsSimpleParameterList(formals)
      hasExpressions == ContainsExpressionList(formals)
      varNames == VarDeclaredNames(code)
      varDeclarations == VarScopedDeclarations(code)
      lexicalNames == LexicallyDeclaredNames(code)
      functionsToInitialize == FunctionsToInitialize(varDeclarations)
      functionNames == MapSeq(functionsToInitialize, LAMBDA d : BoundNames(d)[1])
      \* code.mayUseArguments, which the parser adds, is FALSE when neither the parameters nor the
      \* body name arguments or call eval. No code can then reach the arguments object, and a heap
      \* that never frees would keep it.
      argumentsNeeded ==
        /\ fo.slots.thisMode # "lexical"
        /\ code.mayUseArguments
        /\ N("arguments") \notin Range(parameterNames)
        /\ (hasExpressions \/ (N("arguments") \notin Range(functionNames) /\
                                 N("arguments") \notin Range(lexicalNames)))
      \* Step 19: sloppy parameter expressions get their own environment, so the bindings a direct
      \* eval in them creates stay outside the one that holds the parameters.
      paramEnv == IF strict \/ ~hasExpressions THEN [s |-> s, e |-> ctx.lex] ELSE NewDeclarativeEnvironment(s, ctx.lex)
      env == paramEnv.e
      \* Step 20: parameter bindings.
      s1 == CreateBindings(paramEnv.s, env, parameterNames, strict, hasDuplicates)
      \* Step 22: the arguments object.
      a == IF ~argumentsNeeded THEN [s |-> s1, v |-> Empty]
           ELSE IF strict \/ ~simple THEN CreateUnmappedArgumentsObject(s1, args)
           ELSE CreateMappedArgumentsObject(s1, f, formals, args, env)
      s2 == IF ~argumentsNeeded THEN a.s
            ELSE LET cb == IF strict THEN CreateImmutableBinding(a.s, env, N("arguments"), FALSE)
                           ELSE CreateMutableBinding(a.s, env, N("arguments"), FALSE)
                 IN InitializeBinding(cb.s, env, N("arguments"), a.v).s
      parameterBindings == IF argumentsNeeded THEN Append(parameterNames, N("arguments")) ELSE parameterNames
      \* Steps 24-26: bind the parameters to the arguments.
      bound == IteratorBindingInitializationList(s2, [ctx EXCEPT !.lex = env], formals, ListIterator(args),
                                                 IF hasDuplicates THEN NoEnv ELSE env)
  IN IF IsAbrupt(bound) THEN bound ELSE
     LET s3 == bound.s
         \* Steps 27-28: var bindings, in a separate environment when parameters have expressions.
         varEnvResult ==
           IF ~hasExpressions
           THEN [s |-> CreateVarBindings(s3, env, SelectSeq(Dedupe(varNames), LAMBDA n : n \notin Range(parameterBindings)), env, FALSE, {}),
                 e |-> env]
           ELSE LET ve == NewDeclarativeEnvironment(s3, env)
                IN [s |-> CreateVarBindings(ve.s, ve.e, Dedupe(varNames), env,
                                            TRUE, Range(parameterBindings) \ Range(functionNames)),
                    e |-> ve.e]
         varEnv == varEnvResult.e
         \* Step 32.a (§B.3.2.1): sloppy code hoists block functions not named by a parameter. Earlier
         \* editions added "arguments" to the parameter names when the function needs an arguments
         \* object, so a block function named arguments is not hoisted. Test262 and engines keep that, and so
         \* does this, by checking the parameter bindings.
         hoisted == IF strict THEN <<>>
                    ELSE SelectSeq(HoistableFunctions(code), LAMBDA d : d.BindingIdentifier.name \notin Range(parameterBindings))
         hoistedNames == SelectSeq(Dedupe(MapSeq(hoisted, LAMBDA d : d.BindingIdentifier.name)),
                                   LAMBDA name : name \notin Range(varNames) \cup Range(parameterBindings) \cup {N("arguments")})
         hoistedBound == CreateVarBindings(varEnvResult.s, varEnv, hoistedNames, varEnv, FALSE, {})
         s4 == IF hoisted = <<>> THEN hoistedBound
               ELSE HoldEnvs([hoistedBound EXCEPT !.hoisted = @ \cup {<<varEnv, hoisted[i].site>> : i \in DOMAIN hoisted}])
         \* Steps 30-31: the lexical environment.
         lexEnvResult == IF ~strict THEN NewDeclarativeEnvironment(s4, varEnv) ELSE [s |-> s4, e |-> varEnv]
         lexEnv == lexEnvResult.e
         s5 == CreateLexicalBindings(lexEnvResult.s, lexEnv, LexicallyScopedDeclarations(code))
         bodyCtx == [ctx EXCEPT !.lex = lexEnv, !.var = varEnv]
         \* Step 36: initialize the functions.
         s6 == InitializeFunctions(s5, bodyCtx, varEnv, functionsToInitialize)
     IN Ok(s6, bodyCtx)

Dedupe(seq) ==
  IF seq = <<>> THEN <<>>
  ELSE LET rest == Dedupe(Tail(seq)) IN
       IF Head(seq) \in Range(rest) THEN <<Head(seq)>> \o Remove(rest, Head(seq)) ELSE <<Head(seq)>> \o rest

\* The function declarations among a body's var scoped declarations, the last of each name, in
\* the order of the last ones reversed, as step 15 of §10.2.11 lists them.
FunctionsToInitialize(decls) ==
  LET fns == SelectSeq(decls, LAMBDA d : d.type \in FunctionDeclarationTypes)
  IN PickLastFunctions(fns, Len(fns), {}, <<>>)
PickLastFunctions(fns, i, seen, acc) ==
  IF i = 0 THEN acc
  ELSE LET d == fns[i]
           name == BoundNames(d)[1]
       IN IF name \in seen THEN PickLastFunctions(fns, i - 1, seen, acc)
          ELSE PickLastFunctions(fns, i - 1, seen \cup {name}, <<d>> \o acc)

\* Step 20 of §10.2.11: a mutable binding for each parameter name, initialized to undefined
\* when the names repeat.
CreateBindings(s, env, names, strict, hasDuplicates) ==
  IF names = <<>> THEN s
  ELSE LET name == Head(names)
           s1 == IF name \in DOMAIN E(s, env).b THEN s
                 ELSE LET c == CreateMutableBinding(s, env, name, FALSE) IN
                      IF hasDuplicates THEN InitializeBinding(c.s, env, name, Undefined).s ELSE c.s
       IN CreateBindings(s1, env, Tail(names), strict, hasDuplicates)

\* Steps 27-28 of §10.2.11: var bindings initialized to undefined, or, when the parameters have
\* expressions, to the parameter's value for names in copied.
CreateVarBindings(s, varEnv, names, paramEnv, copy, copied) ==
  IF names = <<>> THEN s
  ELSE LET name == Head(names)
           c == CreateMutableBinding(s, varEnv, name, FALSE)
           init == IF copy /\ name \in copied THEN Val(GetBindingValue(c.s, paramEnv, name, FALSE)) ELSE Undefined
       IN CreateVarBindings(InitializeBinding(c.s, varEnv, name, init).s, varEnv, Tail(names),
                            paramEnv, copy, copied)

\* Step 34 of §10.2.11 and the like: uninitialized bindings for lexical declarations.
CreateLexicalBindings(s, env, decls) ==
  IF decls = <<>> THEN s
  ELSE LET d == Head(decls)
           names == BoundNames(d)
       IN CreateLexicalBindings(CreateLexicalNames(s, env, names, IsConstantDeclaration(d)), env, Tail(decls))
CreateLexicalNames(s, env, names, isConst) ==
  IF names = <<>> THEN s
  ELSE LET c == IF isConst THEN CreateImmutableBinding(s, env, Head(names), TRUE)
                ELSE CreateMutableBinding(s, env, Head(names), FALSE)
       IN CreateLexicalNames(c.s, env, Tail(names), isConst)

\* Step 36 of §10.2.11: each function declaration's object, bound in the var environment.
InitializeFunctions(s, ctx, varEnv, fns) ==
  IF fns = <<>> THEN s
  ELSE LET d == Head(fns)
           fo == InstantiateFunctionObject(s, ctx, d)
       IN InitializeFunctions(SetMutableBinding(fo.s, varEnv, BoundNames(d)[1], Val(fo), FALSE).s,
                              ctx, varEnv, Tail(fns))

\* A List iterator over arguments (CreateListIteratorRecord), which runs no user code.
ListIterator(list) == [kind |-> "list", list |-> list, done |-> FALSE]

\* CreateUnmappedArgumentsObject (§10.4.4.6), returning [s, v].
CreateUnmappedArgumentsObject(s, args) ==
  LET base == MakeObject(Intrinsic(s, "ObjectPrototype"), "ordinary", [argumentsData |-> TRUE])
      withLength == PutProp(base, SV("length"), DataDesc(IntV(Len(args)), TRUE, FALSE, TRUE))
      withArgs == AddIndexProps(withLength, args, 1)
      withIterator == PutProp(withArgs, SymIterator,
                              DataDesc(Intrinsic(s, "ArrayProto_values"), TRUE, FALSE, TRUE))
      throwerDesc == AccessorDesc(Intrinsic(s, "ThrowTypeError"), Intrinsic(s, "ThrowTypeError"), FALSE, FALSE)
      withCallee == PutProp(withIterator, SV("callee"), throwerDesc)
  IN Alloc(s, withCallee)

\* CreateMappedArgumentsObject (§10.4.4.7): an arguments exotic object whose slots map maps each
\* index key to the name of the parameter it aliases in env.
CreateMappedArgumentsObject(s, f, formals, args, env) ==
  LET names == BoundNamesList(formals)
      base == MakeObject(Intrinsic(s, "ObjectPrototype"), "arguments", [map |-> <<>>, env |-> env])
      withArgs == AddIndexProps(base, args, 1)
      withLength == PutProp(withArgs, SV("length"), DataDesc(IntV(Len(args)), TRUE, FALSE, TRUE))
      \* The last parameter of each name maps, for indices below the number of arguments.
      mapped == {i \in 1..Len(names) : i <= Len(args) /\ \A j \in (i + 1)..Len(names) : names[j] # names[i]}
      map == [k \in {Str(NumToString(NumFromInt(i - 1))) : i \in mapped} |->
                names[NumToSmallInt(StrToNum(k.value)) + 1]]
      withMap == [withLength EXCEPT !.slots.map = map]
      withIterator == PutProp(withMap, SymIterator,
                              DataDesc(Intrinsic(s, "ArrayProto_values"), TRUE, FALSE, TRUE))
      withCallee == PutProp(withIterator, SV("callee"), DataDesc(f, TRUE, FALSE, TRUE))
  IN Alloc(s, withCallee)

\* Arguments exotic objects (§10.4.4).
IsMapped(o, k) == k \in DOMAIN o.slots.map
ArgumentsGetOwnProperty(s, v, k) ==
  LET o == O(s, v)
      d == OrdinaryGetOwnProperty(o, k)
  IN IF d = Absent THEN Absent
     ELSE IF IsMapped(o, k)
     THEN [d EXCEPT !.value = E(s, o.slots.env).b[o.slots.map[k]].value]
     ELSE d
ArgumentsDefineOwnProperty(s, v, k, d) ==
  LET o == O(s, v)
      isMapped == IsMapped(o, k)
      newArgDesc ==
        IF isMapped /\ IsDataDescriptor(d) /\ d.value = Absent /\ d.writable = False
        THEN [d EXCEPT !.value = E(s, o.slots.env).b[o.slots.map[k]].value]
        ELSE d
      r == OrdinaryDefineOwnProperty(s, v, k, newArgDesc)
  IN IF Val(r) = False THEN r
     ELSE IF ~isMapped THEN r
     ELSE IF IsAccessorDescriptor(d)
     THEN Ok(SetO(r.s, v, [O(r.s, v) EXCEPT !.slots.map = [x \in DOMAIN @ \ {k} |-> @[x]]]), True)
     ELSE LET s1 == IF d.value # Absent
                    THEN SetE(r.s, o.slots.env, [E(r.s, o.slots.env) EXCEPT !.b[o.slots.map[k]].value = d.value])
                    ELSE r.s
          IN IF d.writable = False
             THEN Ok(SetO(s1, v, [O(s1, v) EXCEPT !.slots.map = [x \in DOMAIN @ \ {k} |-> @[x]]]), True)
             ELSE Ok(s1, True)
ArgumentsGet(s, v, k, receiver) ==
  LET o == O(s, v) IN
  IF IsMapped(o, k) /\ HasProp(o, k)
  THEN Ok(s, E(s, o.slots.env).b[o.slots.map[k]].value)
  ELSE OrdinaryGet(s, v, k, receiver)
ArgumentsSet(s, v, k, value, receiver) ==
  LET o == O(s, v)
      isMapped == SameValue(v, receiver) /\ IsMapped(o, k)
      s1 == IF isMapped
            THEN SetE(s, o.slots.env, [E(s, o.slots.env) EXCEPT !.b[o.slots.map[k]].value = value])
            ELSE s
  IN OrdinarySet(s1, v, k, value, receiver)
ArgumentsDelete(s, v, k) ==
  LET o == O(s, v)
      r == OrdinaryDelete(s, v, k)
  IN IF Val(r) = True /\ IsMapped(o, k)
     THEN Ok(SetO(r.s, v, [O(r.s, v) EXCEPT !.slots.map = [x \in DOMAIN @ \ {k} |-> @[x]]]), True)
     ELSE r

\* BoundFunctionCreate (§10.4.1.3).
BoundFunctionCreate(s, target, this, args) ==
  LET p == GetPrototypeOf(s, target) IN
  IF IsAbrupt(p) THEN p
  ELSE LET a == Alloc(p.s, MakeObject(Val(p), "bound",
                       [target |-> target, this |-> this, args |-> args,
                        constructor |-> IsConstructor(p.s, target)]))
       IN Ok(a.s, a.v)

\* CreateBuiltinFunction (§10.3.4) for a built-in identified by id, with length and name.
BuiltinObject(proto, id, length, name, isConstructor, data, realm) ==
  PutProp(PutProp(MakeObject(proto, "builtin", [id |-> id, constructor |-> isConstructor, data |-> data, realm |-> realm,
                                                initialName |-> name]),
                  SV("length"), DataDesc(IntV(length), FALSE, FALSE, TRUE)),
          SV("name"), DataDesc(Str(name), FALSE, FALSE, TRUE))
CreateBuiltinFunction(s, id, length, name, data) ==
  LET a == Alloc(s, BuiltinObject(Intrinsic(s, "FunctionPrototype"), id, length, name, FALSE, data, s.realmId))
  IN Ok(a.s, a.v)
