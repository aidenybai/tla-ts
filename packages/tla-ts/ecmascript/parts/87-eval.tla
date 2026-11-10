\* eval (§19.2.1) and CreateDynamicFunction (§20.2.1.1.1), which parse source text at run time.
\* TLA+ can't parse, so the host does. The state's parses is the host's parse of each request:
\*   [goal |-> "eval", source, strict, newTarget, superProperty, superCall, privateNames]
\*     for ParseText of a Script with the early errors of PerformEval's step 10
\*   [goal |-> "script", source] for the test262 host's $262.evalScript
\*   [goal |-> kind, params, body] for the parses of CreateDynamicFunction, kind "normal",
\*     "generator", "async", or "asyncGenerator"
\* and each parse to [ok |-> FALSE] for a SyntaxError, or to [ok |-> TRUE, node], with the Script
\* and whether its body ContainsArguments, or the function expression.

\* The private names in scope for a direct eval's parser, by description, which starts with "#".
PrivateNamesIn(env) ==
  IF env = Null THEN {}
  ELSE {env.names[name].description : name \in DOMAIN env.names} \cup PrivateNamesIn(env.outer)

\* $262.evalScript: runs source text as a new script, as the test262 host's INTERPRETING.md says.
EvalScript(s, x) ==
  LET str == ToStr(s, x) IN IF IsAbrupt(str) THEN str ELSE
  LET key == [goal |-> "script", source |-> Val(str).value] IN
  IF ~str.s.parses[key].ok THEN ThrowError(str.s, "SyntaxError")
  ELSE ScriptEvaluation(str.s, str.s.parses[key].node)

\* PerformEval (§19.2.1.1).
PerformEval(s, ctx, x, strictCaller, direct) ==
  IF ~IsString(x) THEN Ok(s, x) ELSE
  LET thisEnv == IF direct THEN E(s, GetThisEnvironment(s, ctx.lex)) ELSE E(s, s.globalEnv)
      inFunction == thisEnv.kind = "function"
      fn == IF inFunction THEN O(s, thisEnv.fn).slots ELSE Empty
      key == [goal |-> "eval", source |-> x.value, strict |-> strictCaller, newTarget |-> inFunction,
              superProperty |-> inFunction /\ HasSuperBinding(s, GetThisEnvironment(s, ctx.lex)),
              superCall |-> inFunction /\ fn.ctorKind = "derived",
              privateNames |-> IF direct THEN PrivateNamesIn(ctx.priv) ELSE {}]
      parsed == s.parses[key]
  IN IF ~parsed.ok THEN ThrowError(s, "SyntaxError")
  ELSE IF ~Has(parsed.node.ScriptBody) THEN Ok(s, Undefined)
  ELSE IF inFunction /\ fn.initializerName # Empty /\ parsed.containsArguments THEN ThrowError(s, "SyntaxError")
  ELSE
  LET script == parsed.node
      strictEval == strictCaller \/ script.ScriptBody.strict
      lex == AllocEnv([s EXCEPT !.evalCount = @ + 1],
                      [kind |-> "declarative", outer |-> IF direct THEN ctx.lex ELSE s.globalEnv, b |-> <<>>,
                       parse |-> s.evalCount + 1])
      var == IF strictEval THEN lex.e ELSE IF direct THEN ctx.var ELSE s.globalEnv
      evalCtx == IF direct THEN Context(lex.e, var, ctx.priv, ctx.fn)
                 ELSE Context(lex.e, var, NoPrivateEnvironment, Null)
      i == EvalDeclarationInstantiation(lex.s, evalCtx, script, strictEval)
  IN IF IsAbrupt(i) THEN i ELSE
     LET r == EvaluateStatementList(i.s, evalCtx, script.ScriptBody.StatementList) IN
     IF ~IsAbrupt(r) /\ Val(r) = Empty THEN Ok(r.s, Undefined) ELSE r

\* EvalDeclarationInstantiation (§19.2.1.3) in the eval context's environments.
EvalDeclarationInstantiation(s, ctx, script, strict) ==
  LET varEnv == ctx.var
      isGlobal == E(s, varEnv).kind = "global"
      varNames == VarDeclaredNames(script)
      varDeclarations == VarScopedDeclarations(script)
      functions == FunctionsToInitialize(varDeclarations)
      functionNames == [i \in DOMAIN functions |-> BoundNames(functions[i])[1]]
      varDeclNames == Dedupe(ConcatMap(SelectSeq(varDeclarations, LAMBDA d : d.type \notin FunctionDeclarationTypes), BoundNames))
      declaredVarNames == SelectSeq(varDeclNames, LAMBDA n : n \notin Range(functionNames))
      globalClash == ~strict /\ isGlobal /\ \E i \in DOMAIN varNames : HasLexicalDeclaration(s, varEnv, varNames[i])
  IN IF globalClash THEN ThrowError(s, "SyntaxError") ELSE
     LET clash == IF strict THEN Ok(s, FALSE) ELSE EvalVarClash(s, E(s, ctx.lex).outer, varEnv, varNames) IN
     IF IsAbrupt(clash) THEN clash ELSE IF Val(clash) THEN ThrowError(clash.s, "SyntaxError") ELSE
     LET fnCheck == IF isGlobal THEN CheckGlobalNames(clash.s, varEnv, Reverse(functionNames), TRUE) ELSE Ok(clash.s, Empty) IN
     IF IsAbrupt(fnCheck) THEN fnCheck ELSE
     LET varCheck == IF isGlobal THEN CheckGlobalNames(fnCheck.s, varEnv, declaredVarNames, FALSE) ELSE Ok(fnCheck.s, Empty) IN
     IF IsAbrupt(varCheck) THEN varCheck ELSE
     LET hoisted == IF strict THEN Ok(varCheck.s, Empty)
                    ELSE HoistFunctions(varCheck.s, ctx.lex, varEnv, HoistableFunctions(script),
                                        Range(functionNames) \cup Range(declaredVarNames), TRUE)
     IN IF IsAbrupt(hoisted) THEN hoisted ELSE
     LET lex == CreateGlobalLexicals(hoisted.s, ctx.lex, LexicallyScopedDeclarations(script)) IN IF IsAbrupt(lex) THEN lex ELSE
     LET fns == CreateEvalFunctions(lex.s, ctx, isGlobal, functions) IN IF IsAbrupt(fns) THEN fns ELSE
     CreateEvalVars(fns.s, varEnv, isGlobal, declaredVarNames)

\* Step 3.d: whether an environment between the eval's and its var environment, other than a
\* with statement's or, by §B.3.4, a catch clause's, binds one of the var names.
EvalVarClash(s, e, varEnv, names) ==
  IF e = varEnv THEN Ok(s, FALSE)
  ELSE IF E(s, e).kind \in {"object", "catch"} THEN EvalVarClash(s, E(s, e).outer, varEnv, names)
  ELSE LET bound == AnyBound(s, e, names) IN
       IF IsAbrupt(bound) \/ Val(bound) THEN bound ELSE EvalVarClash(bound.s, E(s, e).outer, varEnv, names)
AnyBound(s, e, names) ==
  IF names = <<>> THEN Ok(s, FALSE)
  ELSE LET h == HasBinding(s, e, Head(names)) IN
       IF IsAbrupt(h) THEN h ELSE IF Val(h) = True THEN Ok(h.s, TRUE) ELSE AnyBound(h.s, e, Tail(names))

\* Steps 17 and 18: the functions and vars, which eval creates deletable.
CreateEvalFunctions(s, ctx, isGlobal, fns) ==
  IF fns = <<>> THEN Ok(s, Empty)
  ELSE LET fo == InstantiateFunctionObject(s, ctx, Head(fns))
           name == BoundNames(Head(fns))[1]
           r == IF isGlobal THEN CreateGlobalFunctionBinding(fo.s, ctx.var, name, Val(fo), TRUE)
                ELSE BindEvalName(fo.s, ctx.var, name, Val(fo), TRUE)
       IN IF IsAbrupt(r) THEN r ELSE CreateEvalFunctions(r.s, ctx, isGlobal, Tail(fns))
CreateEvalVars(s, varEnv, isGlobal, names) ==
  IF names = <<>> THEN Ok(s, Empty)
  ELSE LET r == IF isGlobal THEN CreateGlobalVarBinding(s, varEnv, Head(names), TRUE)
                ELSE BindEvalName(s, varEnv, Head(names), Undefined, FALSE)
       IN IF IsAbrupt(r) THEN r ELSE CreateEvalVars(r.s, varEnv, isGlobal, Tail(names))
\* A binding in a var environment that isn't global: a new one initialized to value, or for a
\* function, the existing one set to it.
BindEvalName(s, e, name, value, isFunction) ==
  LET h == HasBinding(s, e, name) IN
  IF Val(h) = False THEN
    LET created == CreateMutableBinding(h.s, e, name, TRUE) IN InitializeBinding(created.s, e, name, value)
  ELSE IF isFunction THEN SetMutableBinding(h.s, e, name, value, FALSE)
  ELSE Ok(h.s, Empty)

\* CreateDynamicFunction (§20.2.1.1.1) for kind "normal", "generator", "async", or
\* "asyncGenerator".
CreateDynamicFunction(s, constructor, newTarget, kind, args) ==
  LET nt == IF newTarget = Undefined THEN constructor ELSE newTarget
      params == IF args = <<>> THEN <<>> ELSE SubSeq(args, 1, Len(args) - 1)
      strings == ToStrings(s, params, <<>>)
  IN IF IsAbrupt(strings) THEN strings ELSE
  LET body == ToStr(strings.s, IF args = <<>> THEN EmptyStr ELSE args[Len(args)]) IN
  IF IsAbrupt(body) THEN body ELSE
  LET key == [goal |-> kind, params |-> JoinWithCommas(Val(strings)), body |-> Val(body).value] IN
  LET parsed == body.s.parses[key] IN
  IF ~parsed.ok THEN ThrowError(body.s, "SyntaxError") ELSE
  LET n == parsed.node
      fallback == CASE kind = "normal" -> "FunctionPrototype"
                    [] kind = "generator" -> "GeneratorFunctionPrototype"
                    [] kind = "async" -> "AsyncFunctionPrototype"
                    [] OTHER -> "AsyncGeneratorFunctionPrototype"
      proto == GetPrototypeFromConstructor(body.s, nt, fallback)
  IN IF IsAbrupt(proto) THEN proto ELSE
     LET f == OrdinaryFunctionCreate(proto.s, Val(proto), n.sourceText, n.FormalParameters, FunctionBodyOf(n),
                                     FALSE, proto.s.globalEnv, NoPrivateEnvironment)
         s1 == SetFunctionName(f.s, f.v, SV("anonymous"), <<>>)
     IN Ok(GiveFunctionPrototype(s1, n.type, f.v), f.v)

ToStrings(s, values, acc) ==
  IF values = <<>> THEN Ok(s, acc)
  ELSE LET str == ToStr(s, Head(values)) IN
       IF IsAbrupt(str) THEN str ELSE ToStrings(str.s, Tail(values), Append(acc, Val(str).value))
JoinWithCommas(strings) ==
  IF strings = <<>> THEN <<>>
  ELSE FoldLeftSeq([i \in DOMAIN strings |-> IF i = 1 THEN strings[i] ELSE <<44>> \o strings[i]])
