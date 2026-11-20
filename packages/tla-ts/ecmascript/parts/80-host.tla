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

\* Each of names in order, in halves, so that thousands of names nest log n deep rather than n.
CheckGlobalNames(s, env, names, isFunction) ==
  CASE names = <<>> -> Ok(s, Empty)
    [] Len(names) = 1 ->
         LET r == IF isFunction THEN CanDeclareGlobalFunction(s, env, names[1]) ELSE CanDeclareGlobalVar(s, env, names[1]) IN
         IF IsAbrupt(r) THEN r ELSE IF Val(r) = False THEN ThrowTypeError(r.s) ELSE Ok(r.s, Empty)
    [] OTHER ->
         LET first == CheckGlobalNames(s, env, SubSeq(names, 1, Len(names) \div 2), isFunction) IN
         IF IsAbrupt(first) THEN first ELSE CheckGlobalNames(first.s, env, SubSeq(names, Len(names) \div 2 + 1, Len(names)), isFunction)

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
  CASE names = <<>> -> Ok(s, Empty)
    [] Len(names) = 1 -> CreateGlobalVarBinding(s, env, names[1], FALSE)
    [] OTHER ->
         LET first == CreateGlobalVars(s, env, SubSeq(names, 1, Len(names) \div 2)) IN
         IF IsAbrupt(first) THEN first ELSE CreateGlobalVars(first.s, env, SubSeq(names, Len(names) \div 2 + 1, Len(names)))

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
\* The named time zone that the host has of a lowercase name (AvailableNamedTimeZoneIdentifiers,
\* §11.1.2): an entry [found, id, primary, offsets, days, seconds, isFinal, rule], whose found is
\* "zone", with its identifier and its primary identifier as code units, its offsets in seconds, the first before any transition,
\* the epoch days and the seconds within the day of its transitions before 2038, whether it has no
\* transition after them, and otherwise the rule of its later transitions: its standard and daylight
\* offsets in seconds, and the month, week, weekday, and local time in seconds of the start and of
\* the end of daylight time. Else found is "rejected" where the host has no such time zone, and
\* "unknown" where it may have one that this table leaves out. engine262 has none but UTC.
HostTimeZone(key) == [found |-> "rejected"]

\* HostDateFormat(key): how the host's Intl formats a Temporal object's toLocaleString for a key of
\* its kind, its calendar, and its options (DateFormatKey): found is "format", with the fields and
\* styles of an English pattern and whether a time zone option leaves the pattern as it is, or
\* "error", with the name of the error that it throws. Else found is "unknown" where the host's
\* table leaves the key out, and "none" where the host has no Intl, as engine262 has none.
HostDateFormat(key) == [found |-> "none"]

\* HostLocale(tag): what the host's Intl gives of a locale tag's units. found is "locale", with its
\* canonical form (CanonicalizeUnicodeLocaleId) and the services whose supportedLocalesOf support it
\* with the lookup matcher and with the best fit one, and those where the two differ, which the
\* table leaves out, or "invalid", where it isn't a structurally valid language tag. Else found is
\* "unknown", as engine262 has no locale data.
HostLocale(tag) == [found |-> "unknown"]

\* A run whose jobs leave a promise rejected that nothing handles fails with the promise's reason, as
\* Node fails such a script (HostPromiseRejectionTracker, §27.2.1.9).
TestResult(r) ==
  LET rejected == {i \in 1..r.s.objs.size :
                     LET o == HeapGet(r.s.objs, i) IN o.class = "promise" /\ o.slots.state = "rejected" /\ ~o.slots.isHandled}
      ended == IF IsAbrupt(r) \/ rejected = {} THEN r
               ELSE ThrowValue(r.s, HeapGet(r.s.objs, CHOOSE i \in rejected : \A j \in rejected : i <= j).slots.result)
      thrown == IF ended.c.type = "throw" THEN DescribeThrown(ended.s, ended.c.value) ELSE [name |-> <<>>, message |-> <<>>]
  IN [ok |-> ~IsAbrupt(ended), name |-> thrown.name, message |-> thrown.message, out |-> ended.s.out]
