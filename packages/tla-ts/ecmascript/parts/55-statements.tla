\* Evaluation of statements (§14). A statement's completion value may be Empty.
EvaluateStatementList(s, ctx, list) == StatementListFrom(s, ctx, List(list), Empty)
StatementListFrom(s, ctx, list, last) ==
  IF list = <<>> THEN Ok(s, last) ELSE StatementThen(ctx, Tail(list), last, EvaluateStatement(s, ctx, Head(list)))
StatementThen(ctx, rest, last, r) ==
  IF IsAbrupt(r) THEN Abrupt(r.s, UpdateEmpty(r.c, last))
  ELSE StatementListFrom(r.s, ctx, rest, IF Val(r) = Empty THEN last ELSE Val(r))

\* The completion r with an Empty value replaced by v.
UpdateEmptyThen(v, r) == Abrupt(r.s, UpdateEmpty(r.c, v))

EvaluateStatement(s, ctx, n) ==
  CASE n.type = "ExpressionStatement" -> EvaluateValue(s, ctx, n.Expression)
    [] n.type = "VariableStatement" -> ResultThen(Empty, EvaluateVariableDeclarationList(s, ctx, n.VariableDeclarationList))
    [] n.type \in LexicalDeclarationTypes \ {"ClassDeclaration"} ->
         ResultThen(Empty, EvaluateBindingList(s, ctx, DeclarationKind(n), n.BindingList))
    [] n.type \in FunctionDeclarationTypes ->
         IF n.type = "FunctionDeclaration" /\ <<ctx.var, n.site>> \in s.hoisted
         THEN HoistedFunctionEvaluation(s, ctx, n.BindingIdentifier.name)
         ELSE Ok(s, Empty)
    [] n.type = "ClassDeclaration" -> ResultThen(Empty, BindingClassDeclarationEvaluation(s, ctx, n, DecoratorsOf(n)))
    [] n.type = "ImportDeclaration" -> Ok(s, Empty)
    [] n.type = "ExportDeclaration" -> EvaluateExportDeclaration(s, ctx, n)
    [] n.type \in {"EmptyStatement", "DebuggerStatement"} -> Ok(s, Empty)
    [] n.type = "Block" -> EvaluateBlock(s, ctx, n.StatementList)
    [] n.type = "IfStatement" -> IfThen(ctx, n, EvaluateValue(s, ctx, n.Expression))
    [] n.type \in BreakableStatementTypes \cup {"LabelledStatement"} -> LabelledEvaluation(s, ctx, n, {})
    [] n.type = "ContinueStatement" ->
         Abrupt(s, Completion("continue", Empty, IF Has(n.LabelIdentifier) THEN n.LabelIdentifier.name ELSE Empty))
    [] n.type = "BreakStatement" ->
         Abrupt(s, Completion("break", Empty, IF Has(n.LabelIdentifier) THEN n.LabelIdentifier.name ELSE Empty))
    [] n.type = "ReturnStatement" ->
         IF ~Has(n.Expression) THEN Abrupt(s, Completion("return", Undefined, Empty))
         ELSE ReturnThen(ctx, EvaluateValue(s, ctx, n.Expression))
    [] n.type = "ThrowStatement" -> ThrowThen(EvaluateValue(s, ctx, n.Expression))
    [] n.type = "WithStatement" -> WithThen(ctx, n, EvaluateValue(s, ctx, n.Expression))
    [] n.type = "TryStatement" -> TryBlockThen(ctx, n, EvaluateBlock(s, ctx, n.Block.StatementList))
    [] OTHER -> Evaluate(s, ctx, n)

\* §B.3.2.1: a block's function declaration that the instantiation of its var scope hoisted sets
\* the var binding to the block's function.
HoistedFunctionEvaluation(s, ctx, name) ==
  LET set == SetMutableBinding(s, ctx.var, name, Val(GetBindingValue(s, ctx.lex, name, FALSE)), FALSE) IN
  IF IsAbrupt(set) THEN set ELSE Ok(set.s, Empty)

BreakableStatementTypes ==
  {"DoWhileStatement", "WhileStatement", "ForStatement", "ForInStatement", "ForOfStatement",
   "ForAwaitStatement", "SwitchStatement"}

\* The kind of the running function, or "script" outside any function.
FunctionKindOf(s, ctx) == IF ctx.fn = Null THEN "script" ELSE O(s, ctx.fn).slots.kind

\* The if statement (§14.6.2).
IfThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ToBooleanValue(Val(r)) THEN UpdateEmptyThen(Undefined, EvaluateStatement(r.s, ctx, n.Statement_a))
  ELSE IF Has(n.Statement_b) THEN UpdateEmptyThen(Undefined, EvaluateStatement(r.s, ctx, n.Statement_b))
  ELSE Ok(r.s, Undefined)

\* The return statement (§14.10.1). An async generator awaits the value it returns.
ReturnThen(ctx, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF FunctionKindOf(r.s, ctx) = "asyncGenerator" THEN ReturnValueThen(Await(r.s, Val(r)))
  ELSE ReturnValueThen(r)
ReturnValueThen(r) == IF IsAbrupt(r) THEN r ELSE Abrupt(r.s, Completion("return", Val(r), Empty))

ThrowThen(r) == IF IsAbrupt(r) THEN r ELSE ThrowValue(r.s, Val(r))

\* The with statement (§14.11.2).
WithThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET o == ToObject(r.s, Val(r)) IN
  IF IsAbrupt(o) THEN o ELSE
  LET env == NewObjectEnvironment(o.s, Val(o), TRUE, ctx.lex) IN
  UpdateEmptyThen(Undefined, EvaluateStatement(env.s, WithLex(ctx, env.e), n.Statement))

\* Variable statements (§14.3.2.1).
EvaluateVariableDeclarationList(s, ctx, list) ==
  IF list = <<>> THEN Ok(s, Empty)
  ELSE VariableListThen(ctx, Tail(list), VariableDeclaration(s, ctx, Head(list)))
VariableListThen(ctx, rest, r) == IF IsAbrupt(r) THEN r ELSE EvaluateVariableDeclarationList(r.s, ctx, rest)
VariableDeclaration(s, ctx, d) ==
  IF ~Has(d.Initializer) THEN Ok(s, Empty)
  ELSE IF Has(d.BindingIdentifier) THEN
    LET name == d.BindingIdentifier.name
        lhs == ResolveBinding(s, ctx, name, d.strict)
    IN IF IsAbrupt(lhs) THEN lhs ELSE PutValueThen(Val(lhs), EvaluateNamed(lhs.s, ctx, d.Initializer, Str(name)))
  ELSE PatternInitializerThen(ctx, d.BindingPattern, NoEnv, EvaluateValue(s, ctx, d.Initializer))
PatternInitializerThen(ctx, pattern, env, r) ==
  IF IsAbrupt(r) THEN r ELSE BindingInitialization(r.s, ctx, pattern, Val(r), env)

\* Let, const, using, and await using declarations (§14.3.1.2), whose bindings add resources of
\* the kind.
EvaluateBindingList(s, ctx, kind, list) ==
  IF list = <<>> THEN Ok(s, Empty)
  ELSE BindingListThen(ctx, kind, Tail(list), LexicalBinding(s, ctx, kind, Head(list)))
BindingListThen(ctx, kind, rest, r) == IF IsAbrupt(r) THEN r ELSE EvaluateBindingList(r.s, ctx, kind, rest)
LexicalBinding(s, ctx, kind, b) ==
  IF Has(b.BindingIdentifier) THEN
    LET name == b.BindingIdentifier.name
        lhs == ResolveBinding(s, ctx, name, b.strict)
    IN IF IsAbrupt(lhs) THEN lhs
       ELSE IF ~Has(b.Initializer) THEN InitializeReferencedBinding(lhs.s, Val(lhs), Undefined)
       ELSE InitializeThen(kind, Val(lhs), EvaluateNamed(lhs.s, ctx, b.Initializer, Str(name)))
  ELSE PatternInitializerThen(ctx, b.BindingPattern, ctx.lex, EvaluateValue(s, ctx, b.Initializer))
InitializeThen(kind, ref, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET added == AddDisposableResource(r.s, ref.base.env, Val(r), kind) IN
  IF IsAbrupt(added) THEN added ELSE InitializeReferencedBinding(added.s, ref, Val(r))

\* Blocks (§14.2.2).
EvaluateBlock(s, ctx, list) ==
  IF List(list) = <<>> THEN Ok(s, Empty)
  ELSE LET env == NewDeclarativeEnvironment(s, ctx.lex)
           blockCtx == WithLex(ctx, env.e)
       IN EvaluateDisposing(BlockDeclarationInstantiation(env.s, blockCtx, list, env.e), blockCtx, list)

\* BlockDeclarationInstantiation (§14.2.3) with the web-compatible function semantics of §B.3.2.6.
BlockDeclarationInstantiation(s, ctx, list, env) ==
  BlockDeclare(s, ctx, BlockDeclarations(list), env)
BlockDeclare(s, ctx, decls, env) ==
  IF decls = <<>> THEN s
  ELSE LET d == Head(decls)
           s1 == BlockBindNames(s, env, BoundNames(d), IsConstantDeclaration(d))
           s2 == IF d.type \in FunctionDeclarationTypes THEN
                   LET name == BoundNames(d)[1]
                       fo == InstantiateFunctionObject(s1, ctx, d)
                   IN IF E(fo.s, env).b[name].init
                      THEN SetMutableBinding(fo.s, env, name, Val(fo), FALSE).s
                      ELSE InitializeBinding(fo.s, env, name, Val(fo)).s
                 ELSE s1
       IN BlockDeclare(s2, ctx, Tail(decls), env)
BlockBindNames(s, env, names, isConst) ==
  IF names = <<>> THEN s
  ELSE LET name == Head(names)
           s1 == IF isConst THEN CreateImmutableBinding(s, env, name, TRUE).s
                 ELSE IF name \in DOMAIN E(s, env).b THEN s
                 ELSE CreateMutableBinding(s, env, name, FALSE).s
       IN BlockBindNames(s1, env, Tail(names), isConst)

\* LabelledEvaluation (§14.13.4, §14.7.1.2).
LabelledEvaluation(s, ctx, n, labels) ==
  IF n.type = "LabelledStatement" THEN
    LET label == n.LabelIdentifier.name
        item == n.LabelledItem
    IN LabelThen(label, IF item.type \in BreakableStatementTypes \cup {"LabelledStatement"}
                        THEN LabelledEvaluation(s, ctx, item, labels \cup {label})
                        ELSE EvaluateStatement(s, ctx, item))
  ELSE BreakTargetThen(IF n.type = "SwitchStatement" THEN SwitchThen(ctx, n.CaseBlock, EvaluateValue(s, ctx, n.Expression))
                       ELSE IterationEvaluation(s, ctx, n, labels))
LabelThen(label, r) == IF r.c.type = "break" /\ r.c.target = label THEN Ok(r.s, r.c.value) ELSE r
BreakTargetThen(r) ==
  IF r.c.type = "break" /\ r.c.target = Empty THEN Ok(r.s, IF r.c.value = Empty THEN Undefined ELSE r.c.value) ELSE r

\* LoopContinues (§14.7.1.1).
LoopContinues(c, labels) ==
  \/ c.type = "normal"
  \/ c.type = "continue" /\ (c.target = Empty \/ c.target \in labels)

NextIterationValue(c, v) == IF c.value # Empty THEN c.value ELSE v

\* The end of a loop iteration whose body completed with r: the completion the loop ends with,
\* or Empty to go on.
IterationEnd(r, labels, v) == IF LoopContinues(r.c, labels) THEN Empty ELSE Abrupt(r.s, UpdateEmpty(r.c, v))

IterationEvaluation(s, ctx, n, labels) ==
  CASE n.type = "DoWhileStatement" -> LoopFrom(s, ctx, [kind |-> "doWhile", n |-> n, labels |-> labels], Undefined, 0)
    [] n.type = "WhileStatement" -> LoopFrom(s, ctx, [kind |-> "while", n |-> n, labels |-> labels], Undefined, 0)
    [] n.type = "ForStatement" -> EvaluateFor(s, ctx, n, labels)
    [] n.type = "ForInStatement" ->
         LET init == ForInInitializer(s, ctx, n) IN
         IF IsAbrupt(init) THEN init ELSE ForInOf(init.s, ctx, n, n.Expression, "enumerate", "sync", labels)
    [] n.type = "ForOfStatement" -> ForInOf(s, ctx, n, n.AssignmentExpression, "iterate", "sync", labels)
    [] n.type = "ForAwaitStatement" -> ForInOf(s, ctx, n, n.AssignmentExpression, "async-iterate", "async", labels)

\* A loop runs one iteration at a time, and an iteration that goes on ends with an "iterate"
\* completion that carries the context and value of the next. LoopRun runs at most 2^k iterations
\* nested k deep, and LoopFrom runs 2^k more after each 2^k, so a loop of n iterations nests
\* about log n deep rather than n, and holds as few states.
Iterate(s, ctx, v) == [s |-> s, c |-> Completion("iterate", v, Empty), ctx |-> ctx]
LoopIteration(s, ctx, loop, v) ==
  CASE loop.kind = "while" -> WhileLoop(s, ctx, loop.n, loop.labels, v)
    [] loop.kind = "doWhile" -> DoWhileLoop(s, ctx, loop.n, loop.labels, v)
    [] loop.kind = "for" -> ForBodyLoop(s, ctx, loop, v)
    [] OTHER -> ForInOfBody(s, ctx, loop, loop.it, v)
LoopRun(s, ctx, loop, v, k) ==
  IF k = 0 THEN LoopIteration(s, ctx, loop, v) ELSE LoopRunThen(loop, k, LoopRun(s, ctx, loop, v, k - 1))
LoopRunThen(loop, k, r) == IF r.c.type = "iterate" THEN LoopRun(r.s, r.ctx, loop, Val(r), k - 1) ELSE r
LoopFrom(s, ctx, loop, v, k) == LoopFromThen(loop, k, LoopRun(s, ctx, loop, v, k))
LoopFromThen(loop, k, r) == IF r.c.type = "iterate" THEN LoopFrom(r.s, r.ctx, loop, Val(r), k + 1) ELSE r

\* The do-while statement (§14.7.2.2).
DoWhileLoop(s, ctx, n, labels, v) == DoWhileBodyThen(ctx, n, labels, v, EvaluateStatement(s, ctx, n.Statement))
DoWhileBodyThen(ctx, n, labels, v, r) ==
  IF IterationEnd(r, labels, v) # Empty THEN IterationEnd(r, labels, v)
  ELSE DoWhileTestThen(ctx, n, labels, NextIterationValue(r.c, v), EvaluateValue(r.s, ctx, n.Expression))
DoWhileTestThen(ctx, n, labels, v, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, v)
  ELSE Iterate(r.s, ctx, v)

\* The while statement (§14.7.3.2).
WhileLoop(s, ctx, n, labels, v) == WhileTestThen(ctx, n, labels, v, EvaluateValue(s, ctx, n.Expression))
WhileTestThen(ctx, n, labels, v, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, v)
  ELSE WhileBodyThen(ctx, n, labels, v, EvaluateStatement(r.s, ctx, n.Statement))
WhileBodyThen(ctx, n, labels, v, r) ==
  IF IterationEnd(r, labels, v) # Empty THEN IterationEnd(r, labels, v)
  ELSE Iterate(r.s, ctx, NextIterationValue(r.c, v))

\* The for statement (§14.7.4.2). engine262 names the test and increment Expression_a and
\* Expression_b when the statement declares variables. A loop is [test, increment, stmt, lets,
\* labels], with lets the names each iteration copies.
EvaluateFor(s, ctx, n, labels) ==
  IF Has(n.LexicalDeclaration) THEN
    LET decl == n.LexicalDeclaration
        isConst == IsConstantDeclaration(decl)
        names == BoundNames(decl)
        env == NewDeclarativeEnvironment(s, ctx.lex)
        loopCtx == WithLex(ctx, env.e)
        r == ForDeclarationThen(loopCtx,
                                [kind |-> "for", test |-> n.Expression_a, increment |-> n.Expression_b, stmt |-> n.Statement,
                                 lets |-> IF isConst THEN <<>> ELSE names, labels |-> labels],
                                EvaluateStatement(BlockBindNames(env.s, env.e, names, isConst), loopCtx, decl))
    IN IF DeclarationKind(decl) = "normal" THEN r ELSE DisposeThen(env.e, r)
  ELSE IF Has(n.VariableDeclarationList) THEN
    ForDeclarationThen(ctx, [kind |-> "for", test |-> n.Expression_a, increment |-> n.Expression_b, stmt |-> n.Statement,
                             lets |-> <<>>, labels |-> labels],
                       EvaluateVariableDeclarationList(s, ctx, n.VariableDeclarationList))
  ELSE
    ForDeclarationThen(ctx, [kind |-> "for", test |-> n.Expression_b, increment |-> n.Expression_c, stmt |-> n.Statement,
                             lets |-> <<>>, labels |-> labels],
                       IF Has(n.Expression_a) THEN EvaluateValue(s, ctx, n.Expression_a) ELSE Ok(s, Empty))
ForDeclarationThen(ctx, loop, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET p == CreatePerIterationEnvironment(r.s, ctx, loop.lets) IN
  IF IsAbrupt(p) THEN p ELSE LoopFrom(p.s, Val(p), loop, Undefined, 0)

\* ForBodyEvaluation (§14.7.4.3).
ForBodyLoop(s, ctx, loop, v) ==
  ForTestThen(ctx, loop, v, IF Has(loop.test) THEN EvaluateValue(s, ctx, loop.test) ELSE Ok(s, True))
ForTestThen(ctx, loop, v, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, v)
  ELSE ForBodyThen(ctx, loop, v, EvaluateStatement(r.s, ctx, loop.stmt))
ForBodyThen(ctx, loop, v, r) ==
  IF IterationEnd(r, loop.labels, v) # Empty THEN IterationEnd(r, loop.labels, v) ELSE
  LET p == CreatePerIterationEnvironment(r.s, ctx, loop.lets) IN
  IF IsAbrupt(p) THEN p
  ELSE ForIncrementThen(Val(p), loop, NextIterationValue(r.c, v),
                        IF Has(loop.increment) THEN EvaluateValue(p.s, Val(p), loop.increment) ELSE Ok(p.s, Empty))
ForIncrementThen(ctx, loop, v, r) == IF IsAbrupt(r) THEN r ELSE Iterate(r.s, ctx, v)

\* CreatePerIterationEnvironment (§14.7.4.4), returning the context for the next iteration.
CreatePerIterationEnvironment(s, ctx, lets) ==
  IF lets = <<>> THEN Ok(s, ctx)
  ELSE LET last == ctx.lex
           env == NewDeclarativeEnvironment(s, E(s, last).outer)
       IN CopyPerIterationBindings(env.s, ctx, last, env.e, lets)
CopyPerIterationBindings(s, ctx, last, env, lets) ==
  IF lets = <<>> THEN Ok(s, WithLex(ctx, env))
  ELSE LET name == Head(lets)
           v == GetBindingValue(s, last, name, TRUE)
       IN IF IsAbrupt(v) THEN v
          ELSE LET c == CreateMutableBinding(v.s, env, name, FALSE) IN
               CopyPerIterationBindings(InitializeBinding(c.s, env, name, Val(v)).s, ctx, last, env, Tail(lets))

\* In sloppy code, for (var x = init in ...) puts init's value in x before the head runs (§B.3.5).
ForInInitializer(s, ctx, n) ==
  IF Has(n.ForBinding) /\ "Initializer" \in DOMAIN n.ForBinding /\ Has(n.ForBinding.Initializer) THEN
    LET name == n.ForBinding.BindingIdentifier.name
        init == n.ForBinding.Initializer
        lhs == ResolveBinding(s, ctx, name, n.ForBinding.strict)
    IN IF IsAbrupt(lhs) THEN lhs
       ELSE PutValueThen(Val(lhs), IF IsAnonymousFunctionDefinition(init) THEN NamedEvaluation(lhs.s, ctx, init, Str(name))
                                   ELSE EvaluateValue(lhs.s, ctx, init))
  ELSE Ok(s, Empty)

\* The left side of a for-in, for-of, or for-await statement and how it binds.
ForLhs(n) ==
  CASE Has(n.LeftHandSideExpression) -> [node |-> n.LeftHandSideExpression, kind |-> "assignment"]
    [] Has(n.ForBinding) -> [node |-> n.ForBinding, kind |-> "varBinding"]
    [] OTHER -> [node |-> n.ForDeclaration, kind |-> "lexicalBinding"]

\* ForIn/OfHeadEvaluation (§14.7.5.6) followed by ForIn/OfBodyEvaluation (§14.7.5.7). A loop is
\* [lhs, stmt, iterationKind, iteratorKind, labels].
ForInOf(s, ctx, n, expr, iterationKind, iteratorKind, labels) ==
  LET lhs == ForLhs(n)
      tdz == IF lhs.kind = "lexicalBinding" THEN BoundNames(lhs.node) ELSE <<>>
      headEnv == IF tdz = <<>> THEN [s |-> s, e |-> ctx.lex]
                 ELSE LET env == NewDeclarativeEnvironment(s, ctx.lex)
                      IN [s |-> BlockBindNames(env.s, env.e, tdz, FALSE), e |-> env.e]
  IN ForInOfHeadThen(ctx, [kind |-> "forInOf", it |-> Empty, lhs |-> lhs, stmt |-> n.Statement, iterationKind |-> iterationKind,
                           iteratorKind |-> iteratorKind, labels |-> labels],
                     EvaluateValue(headEnv.s, WithLex(ctx, headEnv.e), expr))
ForInOfHeadThen(ctx, loop, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF loop.iterationKind = "enumerate" THEN
    IF IsNullish(Val(r)) THEN Ok(r.s, Undefined)
    ELSE LET o == ToObject(r.s, Val(r))
             it == CreateForInIterator(o.s, Val(o))
         IN LoopFrom(it.s, ctx, [loop EXCEPT !.it = Val(it)], Undefined, 0)
  ELSE LET it == GetIterator(r.s, Val(r), IF loop.iterationKind = "async-iterate" THEN "async" ELSE "sync") IN
       IF IsAbrupt(it) THEN it ELSE LoopFrom(it.s, ctx, [loop EXCEPT !.it = Val(it)], Undefined, 0)

ForInOfBody(s, ctx, loop, it, v) ==
  LET called == Call(s, it.next, it.iterator, <<>>) IN
  ForInOfNextThen(ctx, loop, it, v,
                  IF IsAbrupt(called) \/ loop.iteratorKind = "sync" THEN called ELSE Await(called.s, Val(called)))
ForInOfNextThen(ctx, loop, it, v, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE LET done == IteratorComplete(r.s, Val(r)) IN
  IF IsAbrupt(done) THEN done
  ELSE IF Val(done) THEN Ok(done.s, v)
  ELSE LET value == Get(done.s, Val(r), SV("value")) IN
  IF IsAbrupt(value) THEN value
  ELSE ForInOfBindThen(ctx, loop, it, v, ForInOfBind(value.s, ctx, loop.lhs, Val(value)))
ForInOfBindThen(ctx, loop, it, v, r) ==
  IF IsAbrupt(r) THEN ForInOfClose(loop, it, r) ELSE
  LET body == EvaluateStatement(r.s, Val(r), loop.stmt) IN
  ForInOfStatementThen(ctx, loop, it, v,
                       IF loop.lhs.kind = "lexicalBinding" /\ DeclarationKind(loop.lhs.node) # "normal"
                       THEN DisposeThen(Val(r).lex, body) ELSE body)
ForInOfStatementThen(ctx, loop, it, v, r) ==
  IF IterationEnd(r, loop.labels, v) # Empty THEN ForInOfClose(loop, it, IterationEnd(r, loop.labels, v))
  ELSE Iterate(r.s, ctx, NextIterationValue(r.c, v))
ForInOfClose(loop, it, r) ==
  CASE loop.iterationKind = "enumerate" -> r
    [] loop.iteratorKind = "async" -> AsyncIteratorClose(r.s, it, r.c)
    [] OTHER -> IteratorClose(r.s, it, r.c)

\* Binds one value to the left side of a for-in or for-of statement, returning the context the
\* body runs in.
ForInOfBind(s, ctx, lhs, value) ==
  LET node == lhs.node IN
  CASE lhs.kind = "assignment" ->
         ResultThen(ctx, IF IsAssignmentPattern(node) THEN DestructuringAssignmentEvaluation(s, ctx, node, value)
                         ELSE AssignToThen(value, Evaluate(s, ctx, node)))
    [] lhs.kind = "varBinding" ->
         ResultThen(ctx, IF Has(node.BindingPattern) THEN BindingInitialization(s, ctx, node.BindingPattern, value, NoEnv)
                         ELSE AssignToThen(value, ResolveBinding(s, ctx, node.BindingIdentifier.name, node.strict)))
    [] OTHER ->
         LET env == NewDeclarativeEnvironment(s, ctx.lex)
             iterCtx == WithLex(ctx, env.e)
             s1 == BlockBindNames(env.s, env.e, BoundNames(node), IsConstantDeclaration(node))
             binding == node.ForBinding
             added == AddDisposableResource(s1, env.e, value, DeclarationKind(node))
         IN ResultThen(iterCtx, CASE Has(binding.BindingPattern) ->
                                       BindingInitialization(s1, iterCtx, binding.BindingPattern, value, env.e)
                                  [] IsAbrupt(added) -> added
                                  [] OTHER -> InitializeBinding(added.s, env.e, binding.BindingIdentifier.name, value))
AssignToThen(value, r) == IF IsAbrupt(r) THEN r ELSE PutValue(r.s, Val(r), value)

\* The switch statement (§14.12).
SwitchThen(ctx, block, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET env == NewDeclarativeEnvironment(r.s, ctx.lex)
      blockCtx == WithLex(ctx, env.e)
      s1 == BlockDeclare(env.s, blockCtx, LexicallyScopedDeclarations(block), env.e)
  IN CaseSearch(s1, blockCtx, [block |-> block, input |-> Val(r), inB |-> FALSE], List(block.CaseClauses_a), Undefined)

\* CaseBlockEvaluation (§14.12.2): searches the clauses before the default clause, then those
\* after it (inB), for one whose selector equals the input. From the clause that matches, or the
\* default clause when none does, it runs every clause in source order.
CaseSearch(s, ctx, switch, clauses, v) ==
  IF clauses # <<>> THEN CaseSelectorThen(ctx, switch, clauses, v, EvaluateValue(s, ctx, Head(clauses).Expression))
  ELSE IF ~Has(switch.block.DefaultClause) THEN Ok(s, v)
  ELSE IF ~switch.inB THEN CaseSearch(s, ctx, [switch EXCEPT !.inB = TRUE], List(switch.block.CaseClauses_b), v)
  ELSE CaseRun(s, ctx, <<switch.block.DefaultClause>> \o List(switch.block.CaseClauses_b), v)
CaseSelectorThen(ctx, switch, clauses, v, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsStrictlyEqual(switch.input, Val(r)) THEN CaseSearch(r.s, ctx, switch, Tail(clauses), v)
  ELSE IF switch.inB \/ ~Has(switch.block.DefaultClause) THEN CaseRun(r.s, ctx, clauses, v)
  ELSE CaseRun(r.s, ctx, clauses \o <<switch.block.DefaultClause>> \o List(switch.block.CaseClauses_b), v)
CaseRun(s, ctx, clauses, v) ==
  IF clauses = <<>> THEN Ok(s, v)
  ELSE CaseClauseThen(ctx, Tail(clauses), v, EvaluateStatementList(s, ctx, Head(clauses).StatementList))
CaseClauseThen(ctx, rest, v, r) ==
  IF IsAbrupt(r) THEN Abrupt(r.s, UpdateEmpty(r.c, v)) ELSE CaseRun(r.s, ctx, rest, NextIterationValue(r.c, v))

\* The try statement (§14.15).
TryBlockThen(ctx, n, r) ==
  IF Has(n.Catch) /\ r.c.type = "throw" THEN TryCatchThen(ctx, n, CatchClauseEvaluation(r.s, ctx, n.Catch, r.c.value))
  ELSE TryCatchThen(ctx, n, r)
TryCatchThen(ctx, n, r) ==
  IF ~Has(n.Finally) THEN UpdateEmptyThen(Undefined, r)
  ELSE TryFinallyThen(r.c, EvaluateBlock(r.s, ctx, n.Finally.StatementList))
TryFinallyThen(c, r) == IF IsAbrupt(r) THEN UpdateEmptyThen(Undefined, r) ELSE Abrupt(r.s, UpdateEmpty(c, Undefined))

\* CatchClauseEvaluation (§14.15.2).
CatchClauseEvaluation(s, ctx, n, thrown) ==
  IF ~Has(n.CatchParameter) THEN EvaluateBlock(s, ctx, n.Block.StatementList)
  ELSE
    LET param == n.CatchParameter
        env == NewCatchEnvironment(s, ctx.lex)
        catchCtx == WithLex(ctx, env.e)
        s1 == BlockBindNames(env.s, env.e, BoundNames(param), FALSE)
    IN CatchBindThen(catchCtx, n, IF param.type = "BindingIdentifier"
                                  THEN InitializeBinding(s1, env.e, param.name, thrown)
                                  ELSE BindingInitialization(s1, catchCtx, param, thrown, env.e))
CatchBindThen(ctx, n, r) == IF IsAbrupt(r) THEN r ELSE EvaluateBlock(r.s, ctx, n.Block.StatementList)
