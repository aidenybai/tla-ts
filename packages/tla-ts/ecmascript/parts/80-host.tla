\* Scripts (§16.1) and the test262 host.

\* GlobalDeclarationInstantiation (§16.1.7).
GlobalDeclarationInstantiation(s, ctx, script) ==
  LET env == s.globalEnv
      lexNames == LexicallyDeclaredNames(script)
      varNames == VarDeclaredNames(script)
      varDeclarations == VarScopedDeclarations(script)
      functions == FunctionsToInitialize(varDeclarations)
      functionNames == [i \in DOMAIN functions |-> BoundNames(functions[i])[1]]
      varDeclNames == Dedupe(ConcatMap(SelectSeq(varDeclarations, LAMBDA d : d.type \notin FunctionDeclarationTypes), BoundNames))
      declaredVarNames == SelectSeq(varDeclNames, LAMBDA n : n \notin Range(functionNames))
      clash == \E i \in DOMAIN lexNames : HasLexicalDeclaration(s, env, lexNames[i])
      varClash == \E i \in DOMAIN varNames : HasLexicalDeclaration(s, env, varNames[i])
  IN IF clash \/ varClash THEN ThrowError(s, "SyntaxError") ELSE
     LET restricted == AnyRestrictedGlobal(s, env, lexNames) IN IF IsAbrupt(restricted) THEN restricted
     ELSE IF Val(restricted) THEN ThrowError(restricted.s, "SyntaxError") ELSE
     LET fnCheck == CheckGlobalNames(restricted.s, env, Reverse(functionNames), TRUE) IN IF IsAbrupt(fnCheck) THEN fnCheck ELSE
     LET varCheck == CheckGlobalNames(fnCheck.s, env, declaredVarNames, FALSE) IN IF IsAbrupt(varCheck) THEN varCheck ELSE
     LET hoisted == IF Has(script.ScriptBody) /\ script.ScriptBody.strict THEN Ok(varCheck.s, Empty)
                    ELSE HoistFunctions(varCheck.s, env, env, HoistableFunctions(script),
                                        Range(functionNames) \cup Range(declaredVarNames), FALSE)
     IN IF IsAbrupt(hoisted) THEN hoisted ELSE
     LET lex == CreateGlobalLexicals(hoisted.s, env, LexicallyScopedDeclarations(script)) IN IF IsAbrupt(lex) THEN lex ELSE
     LET fns == CreateGlobalFunctions(lex.s, ctx, env, functions) IN IF IsAbrupt(fns) THEN fns ELSE
     CreateGlobalVars(fns.s, env, declaredVarNames)

Reverse(seq) == [i \in DOMAIN seq |-> seq[Len(seq) + 1 - i]]

AnyRestrictedGlobal(s, env, names) ==
  IF names = <<>> THEN Ok(s, FALSE)
  ELSE LET r == HasRestrictedGlobalProperty(s, env, Head(names)) IN
       IF IsAbrupt(r) THEN r ELSE IF Val(r) = True THEN Ok(r.s, TRUE) ELSE AnyRestrictedGlobal(r.s, env, Tail(names))

CheckGlobalNames(s, env, names, isFunction) ==
  IF names = <<>> THEN Ok(s, Empty)
  ELSE LET r == IF isFunction THEN CanDeclareGlobalFunction(s, env, Head(names)) ELSE CanDeclareGlobalVar(s, env, Head(names)) IN
       IF IsAbrupt(r) THEN r ELSE IF Val(r) = False THEN ThrowTypeError(r.s) ELSE CheckGlobalNames(r.s, env, Tail(names), isFunction)

CreateGlobalLexicals(s, env, decls) ==
  IF decls = <<>> THEN Ok(s, Empty)
  ELSE LET r == CreateGlobalLexicalNames(s, env, BoundNames(Head(decls)), IsConstantDeclaration(Head(decls))) IN
       IF IsAbrupt(r) THEN r ELSE CreateGlobalLexicals(r.s, env, Tail(decls))
CreateGlobalLexicalNames(s, env, names, isConst) ==
  IF names = <<>> THEN Ok(s, Empty)
  ELSE LET r == IF isConst THEN CreateImmutableBinding(s, env, Head(names), TRUE)
                ELSE CreateMutableBinding(s, env, Head(names), FALSE)
       IN IF IsAbrupt(r) THEN r ELSE CreateGlobalLexicalNames(r.s, env, Tail(names), isConst)

CreateGlobalFunctions(s, ctx, env, fns) ==
  IF fns = <<>> THEN Ok(s, Empty)
  ELSE LET fo == InstantiateFunctionObject(s, ctx, Head(fns))
           r == CreateGlobalFunctionBinding(fo.s, env, BoundNames(Head(fns))[1], Val(fo), FALSE)
       IN IF IsAbrupt(r) THEN r ELSE CreateGlobalFunctions(r.s, ctx, env, Tail(fns))

CreateGlobalVars(s, env, names) ==
  IF names = <<>> THEN Ok(s, Empty)
  ELSE LET r == CreateGlobalVarBinding(s, env, Head(names), FALSE) IN
       IF IsAbrupt(r) THEN r ELSE CreateGlobalVars(r.s, env, Tail(names))

\* Step 12 of GlobalDeclarationInstantiation and step 13 of EvalDeclarationInstantiation (§B.3.2.2,
\* §B.3.2.3): var bindings for the block functions fns that sloppy code hoists, which eval makes
\* deletable. A binding between the code's lexical environment lex and its var environment keeps a
\* function from hoisting, as does a global lexical one, and declared holds the names already bound.
HoistFunctions(s, lex, varEnv, fns, declared, deletable) ==
  IF fns = <<>> THEN Ok(s, Empty) ELSE
  LET name == Head(fns).BindingIdentifier.name
      isGlobal == E(s, varEnv).kind = "global"
      exists == EvalVarClash(s, lex, varEnv, <<name>>)
  IN IF IsAbrupt(exists) THEN exists
     ELSE IF Val(exists) \/ (isGlobal /\ HasLexicalDeclaration(exists.s, varEnv, name))
     THEN HoistFunctions(exists.s, lex, varEnv, Tail(fns), declared, deletable) ELSE
     LET definable == IF isGlobal THEN CanDeclareGlobalVar(exists.s, varEnv, name) ELSE Ok(exists.s, True) IN
     IF IsAbrupt(definable) THEN definable
     ELSE IF Val(definable) = False THEN HoistFunctions(definable.s, lex, varEnv, Tail(fns), declared, deletable) ELSE
     LET created == CASE name \in declared -> Ok(definable.s, Empty)
                       [] isGlobal -> CreateGlobalVarBinding(definable.s, varEnv, name, deletable)
                       [] OTHER -> BindEvalName(definable.s, varEnv, name, Undefined, FALSE)
     IN IF IsAbrupt(created) THEN created
        ELSE HoistFunctions(HoldEnvs([created.s EXCEPT !.hoisted = @ \cup {<<varEnv, Head(fns).site>>}]),
                            lex, varEnv, Tail(fns), declared \cup {name}, deletable)

\* ScriptEvaluation (§16.1.6).
ScriptEvaluation(s, script) ==
  LET i == GlobalDeclarationInstantiation(s, ScriptContext(s), script) IN
  IF IsAbrupt(i) THEN i
  ELSE IF ~Has(script.ScriptBody) THEN Ok(i.s, Undefined)
  ELSE LET r == EvaluateStatementList(i.s, ScriptContext(i.s), script.ScriptBody.StatementList) IN
       IF ~IsAbrupt(r) /\ Val(r) = Empty THEN Ok(r.s, Undefined) ELSE r

\* Runs scripts in order until one throws, running the jobs each one queues after it.
RunScripts(s, scripts) ==
  IF scripts = <<>> THEN Ok(s, Undefined)
  ELSE LET r == ScriptEvaluation(s, Head(scripts)) IN
       IF IsAbrupt(r) THEN r ELSE
       LET j == RunJobs(r.s) IN
       IF IsAbrupt(j) THEN j ELSE RunScripts(j.s, Tail(scripts))

\* A thrown value's constructor name and string, as code units, for the runner to report.
DescribeThrown(s, v) ==
  LET ctor == IF IsObject(v) THEN Get(s, v, SV("constructor")) ELSE Ok(s, Undefined)
      name == IF ~IsAbrupt(ctor) /\ IsObject(Val(ctor)) THEN Get(ctor.s, Val(ctor), SV("name")) ELSE Ok(s, Undefined)
      text == IF IsAbrupt(name) THEN ToStr(s, v) ELSE ToStr(name.s, v)
  IN [name |-> IF ~IsAbrupt(name) /\ IsString(Val(name)) THEN Val(name).value ELSE <<>>,
      message |-> IF ~IsAbrupt(text) /\ IsString(Val(text)) THEN Val(text).value ELSE <<>>]

\* The result of running the harness scripts in a new realm with the host's parses, for RunFrom.
HarnessResult(scripts, parses) == RunScripts([InitialState EXCEPT !.parses = parses], scripts)

\* Runs a test's scripts, or with RunModuleFrom its module, after a harness result: [ok, name,
\* message, out] with the strings as code units. When the harness threw, so does the test.
\* directory is the test's, where the host loads modules from, canSuspend whether the agent can
\* suspend, and parses the host's parses.
RunFrom(harness, scripts, directory, canSuspend, parses) ==
  TestResult(IF IsAbrupt(harness) THEN harness
             ELSE RunScripts([harness.s EXCEPT !.parses = parses, !.directory = directory, !.canSuspend = canSuspend],
                             scripts))
RunModuleFrom(harness, specifier, directory, canSuspend, parses) ==
  TestResult(IF IsAbrupt(harness) THEN harness
             ELSE RunModule([harness.s EXCEPT !.parses = parses, !.directory = directory, !.canSuspend = canSuspend],
                            specifier))
TestResult(r) ==
  LET thrown == IF r.c.type = "throw" THEN DescribeThrown(r.s, r.c.value) ELSE [name |-> <<>>, message |-> <<>>]
  IN [ok |-> ~IsAbrupt(r), name |-> thrown.name, message |-> thrown.message, out |-> r.s.out]
