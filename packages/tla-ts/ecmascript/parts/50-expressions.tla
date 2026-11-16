\* Evaluation of expressions (§13). Evaluate returns a value or a Reference Record, and
\* EvaluateValue applies GetValue. Each step that waits on an evaluation is an operator whose name
\* ends in Then, so a yield or await inside can suspend and resume (see Suspend).
EvaluateValue(s, ctx, n) == GetValueThen(Evaluate(s, ctx, n))
GetValueThen(r) == IF IsAbrupt(r) THEN r ELSE GetValue(r.s, Val(r))

Evaluate(s, ctx, n) ==
  CASE n.type = "NullLiteral" -> Ok(s, Null)
    [] n.type = "BooleanLiteral" -> Ok(s, Bool(n.value))
    [] n.type = "NumericLiteral" -> Ok(s, n.value)
    [] n.type = "StringLiteral" -> Ok(s, Str(n.value))
    [] n.type = "IdentifierReference" -> ResolveBinding(s, ctx, n.name, n.strict)
    [] n.type = "ThisExpression" -> ResolveThisBinding(s, ctx)
    [] n.type = "ParenthesizedExpression" -> Evaluate(s, ctx, n.Expression)
    [] n.type = "ArrayLiteral" -> EvaluateArrayLiteral(s, ctx, n)
    [] n.type = "ObjectLiteral" -> EvaluateObjectLiteral(s, ctx, n)
    [] n.type = "TemplateLiteral" -> TemplateConcat(s, ctx, n.TemplateCookedList, n.ExpressionList, n.TemplateCookedList[1])
    [] n.type = "RegularExpressionLiteral" -> RegExpCreateLiteral(s, n)
    [] n.type \in {"FunctionExpression", "GeneratorExpression", "AsyncFunctionExpression",
                   "AsyncGeneratorExpression"} -> InstantiateFunctionExpression(s, ctx, n, Empty)
    [] n.type \in {"ArrowFunction", "AsyncArrowFunction"} -> InstantiateArrowFunctionExpression(s, ctx, n, Empty)
    [] n.type = "ClassExpression" -> EvaluateClassExpression(s, ctx, n, Empty)
    [] n.type = "MemberExpression" -> MemberBaseThen(ctx, n, EvaluateValue(s, ctx, n.MemberExpression))
    [] n.type = "SuperProperty" -> EvaluateSuperProperty(s, ctx, n)
    [] n.type = "CallExpression" -> CallCalleeThen(ctx, n, Evaluate(s, ctx, n.CallExpression))
    [] n.type = "SuperCall" -> EvaluateSuperCall(s, ctx, n)
    [] n.type = "NewExpression" -> NewCalleeThen(ctx, n, EvaluateValue(s, ctx, n.MemberExpression))
    [] n.type = "OptionalExpression" -> OptionalBaseThen(ctx, n, Evaluate(s, ctx, n.MemberExpression))
    [] n.type = "TaggedTemplateExpression" -> EvaluateTaggedTemplate(s, ctx, n)
    [] n.type = "NewTarget" -> Ok(s, GetNewTarget(s, ctx))
    [] n.type = "ImportMeta" -> EvaluateImportMeta(s, ctx, n)
    [] n.type = "ImportCall" -> EvaluateImportCall(s, ctx, n)
    [] n.type = "UpdateExpression" ->
         UpdateThen(n, Evaluate(s, ctx, IF Has(n.LeftHandSideExpression) THEN n.LeftHandSideExpression ELSE n.UnaryExpression))
    [] n.type = "UnaryExpression" -> EvaluateUnaryExpression(s, ctx, n)
    [] n.type = "ExponentiationExpression" ->
         BinaryLeftThen(ctx, "**", n.ExponentiationExpression, EvaluateValue(s, ctx, n.UpdateExpression))
    [] n.type = "MultiplicativeExpression" ->
         BinaryLeftThen(ctx, n.MultiplicativeOperator, n.ExponentiationExpression,
                        EvaluateValue(s, ctx, n.MultiplicativeExpression))
    [] n.type = "AdditiveExpression" ->
         BinaryLeftThen(ctx, n.operator, n.MultiplicativeExpression, EvaluateValue(s, ctx, n.AdditiveExpression))
    [] n.type = "ShiftExpression" ->
         BinaryLeftThen(ctx, n.operator, n.AdditiveExpression, EvaluateValue(s, ctx, n.ShiftExpression))
    [] n.type \in {"BitwiseANDExpression", "BitwiseXORExpression", "BitwiseORExpression"} ->
         BinaryLeftThen(ctx, n.operator, n.B, EvaluateValue(s, ctx, n.A))
    [] n.type = "RelationalExpression" ->
         IF Has(n.PrivateIdentifier) THEN PrivateInThen(ctx, n, EvaluateValue(s, ctx, n.ShiftExpression))
         ELSE RelationalLeftThen(ctx, n, EvaluateValue(s, ctx, n.RelationalExpression))
    [] n.type = "EqualityExpression" -> EqualityLeftThen(ctx, n, EvaluateValue(s, ctx, n.EqualityExpression))
    [] n.type = "LogicalANDExpression" ->
         LogicalThen(ctx, "&&", n.BitwiseORExpression, EvaluateValue(s, ctx, n.LogicalANDExpression))
    [] n.type = "LogicalORExpression" ->
         LogicalThen(ctx, "||", n.LogicalANDExpression, EvaluateValue(s, ctx, n.LogicalORExpression))
    [] n.type = "CoalesceExpression" ->
         LogicalThen(ctx, "??", n.BitwiseORExpression, EvaluateValue(s, ctx, n.CoalesceExpressionHead))
    [] n.type = "ConditionalExpression" -> ConditionalThen(ctx, n, EvaluateValue(s, ctx, n.ShortCircuitExpression))
    [] n.type = "AssignmentExpression" -> EvaluateAssignment(s, ctx, n)
    [] n.type = "CommaOperator" ->
         CommaThen(ctx, Tail(n.ExpressionList), EvaluateValue(s, ctx, Head(n.ExpressionList)))
    [] n.type = "YieldExpression" -> EvaluateYield(s, ctx, n)
    [] n.type = "AwaitExpression" -> AwaitThen(EvaluateValue(s, ctx, n.UnaryExpression))
    [] OTHER -> EvaluateStatement(s, ctx, n)

\* Binary logical operators (§13.13.1) return the left value when it decides the result.
LogicalThen(ctx, op, right, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF (CASE op = "&&" -> ~ToBooleanValue(Val(r))
             [] op = "||" -> ToBooleanValue(Val(r))
             [] op = "??" -> ~IsNullish(Val(r)))
  THEN r
  ELSE EvaluateValue(r.s, ctx, right)

\* The conditional operator (§13.14.1).
ConditionalThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE EvaluateValue(r.s, ctx, IF ToBooleanValue(Val(r)) THEN n.AssignmentExpression_a ELSE n.AssignmentExpression_b)

\* The comma operator (§13.16.1), with the expressions left after the one r evaluated.
CommaThen(ctx, rest, r) ==
  IF IsAbrupt(r) \/ rest = <<>> THEN r ELSE CommaThen(ctx, Tail(rest), EvaluateValue(r.s, ctx, Head(rest)))

\* NamedEvaluation (§8.4.5) of an anonymous function definition, or plain evaluation.
EvaluateNamed(s, ctx, n, name) ==
  IF IsAnonymousFunctionDefinition(n) THEN NamedEvaluation(s, ctx, n, name)
  ELSE EvaluateValue(s, ctx, n)
NamedEvaluation(s, ctx, n, name) ==
  CASE n.type = "ParenthesizedExpression" -> NamedEvaluation(s, ctx, n.Expression, name)
    [] n.type \in {"FunctionExpression", "GeneratorExpression", "AsyncFunctionExpression",
                   "AsyncGeneratorExpression"} -> InstantiateFunctionExpression(s, ctx, n, name)
    [] n.type \in {"ArrowFunction", "AsyncArrowFunction"} -> InstantiateArrowFunctionExpression(s, ctx, n, name)
    [] n.type = "ClassExpression" -> EvaluateClassExpression(s, ctx, n, name)

\* Array initializers (§13.2.4).
EvaluateArrayLiteral(s, ctx, n) ==
  LET a == ArrayCreate(s, 0, Intrinsic(s, "ArrayPrototype")) IN
  ArrayLiteralThen(Val(a), ArrayAccumulation(a.s, ctx, Val(a), n.ElementList, 0))
ArrayLiteralThen(array, r) ==
  IF IsAbrupt(r) THEN r
  ELSE Ok(SetO(r.s, array, [O(r.s, array) EXCEPT !.props[NamedBucket][SV("length")].value = IntV(Val(r))]), array)

\* ArrayAccumulation (§13.2.4.1), returning the next index.
ArrayAccumulation(s, ctx, array, list, index) ==
  IF list = <<>> THEN Ok(s, index)
  ELSE LET e == Head(list) IN
  CASE e.type = "Elision" -> ArrayAccumulation(s, ctx, array, Tail(list), index + 1)
    [] e.type = "SpreadElement" ->
         ArraySpreadThen(ctx, array, Tail(list), index, EvaluateValue(s, ctx, e.AssignmentExpression))
    [] OTHER -> ArrayElementThen(ctx, array, Tail(list), index, EvaluateValue(s, ctx, e))
ArraySpreadThen(ctx, array, rest, index, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET it == GetIterator(r.s, Val(r), "sync") IN
  IF IsAbrupt(it) THEN it ELSE
  LET spread == SpreadIntoArray(it.s, array, Val(it), index) IN
  IF IsAbrupt(spread) THEN spread ELSE ArrayAccumulation(spread.s, ctx, array, rest, Val(spread))
ArrayElementThen(ctx, array, rest, index, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET c == CreateDataPropertyOrThrow(r.s, array, Str(NumToString(NumFromInt(index))), Val(r)) IN
  IF IsAbrupt(c) THEN c ELSE ArrayAccumulation(c.s, ctx, array, rest, index + 1)
SpreadIntoArray(s, array, it, index) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, index)
  ELSE LET c == CreateDataPropertyOrThrow(next.s, array, Str(NumToString(NumFromInt(index))), Val(next).value) IN
       IF IsAbrupt(c) THEN c ELSE SpreadIntoArray(c.s, array, Val(next).iterator, index + 1)

\* Object initializers (§13.2.5).
EvaluateObjectLiteral(s, ctx, n) ==
  LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype")) IN
  ResultThen(Val(o), PropertyDefinitionEvaluationList(o.s, ctx, Val(o), n.PropertyDefinitionList))

\* Continues with v once r completes normally.
ResultThen(v, r) == IF IsAbrupt(r) THEN r ELSE Ok(r.s, v)

PropertyDefinitionEvaluationList(s, ctx, obj, list) ==
  IF list = <<>> THEN Ok(s, Empty)
  ELSE PropertyListThen(ctx, obj, Tail(list), PropertyDefinitionEvaluation(s, ctx, obj, Head(list)))
PropertyListThen(ctx, obj, rest, r) ==
  IF IsAbrupt(r) THEN r ELSE PropertyDefinitionEvaluationList(r.s, ctx, obj, rest)

\* The property key a property name node gives (§13.2.5.4 Evaluation of PropertyName).
EvaluatePropertyKey(s, ctx, n) ==
  CASE n.type = "IdentifierName" -> Ok(s, Str(n.name))
    [] n.type = "StringLiteral" -> Ok(s, Str(n.value))
    [] n.type = "NumericLiteral" -> Ok(s, Str(PrimitiveToUnits(n.value)))
    [] n.type = "PrivateIdentifier" -> Ok(s, ResolvePrivateIdentifier(s, ctx, n.name))
    [] n.type = "PropertyName" -> ToPropertyKeyThen(EvaluateValue(s, ctx, n.ComputedPropertyName))
ToPropertyKeyThen(r) == IF IsAbrupt(r) THEN r ELSE ToPropertyKey(r.s, Val(r))

PropertyDefinitionEvaluation(s, ctx, obj, n) ==
  CASE n.type = "IdentifierReference" -> CreateDataThen(obj, Str(n.name), EvaluateValue(s, ctx, n))
    [] n.type = "PropertyDefinition" /\ ~Has(n.PropertyName) ->
         CopyDataThen(obj, EvaluateValue(s, ctx, n.AssignmentExpression))
    [] n.type = "PropertyDefinition" -> PropertyKeyThen(ctx, obj, n, EvaluatePropertyKey(s, ctx, n.PropertyName))
    [] n.type = "CoverInitializedName" -> ThrowError(s, "SyntaxError")
    [] OTHER -> MethodDefinitionEvaluation(s, ctx, obj, n, TRUE)
CreateDataThen(obj, key, r) == IF IsAbrupt(r) THEN r ELSE CreateDataPropertyOrThrow(r.s, obj, key, Val(r))
CopyDataThen(obj, r) == IF IsAbrupt(r) THEN r ELSE CopyDataProperties(r.s, obj, Val(r), <<>>)
PropertyKeyThen(ctx, obj, n, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET isProto == n.PropertyName.type \in {"IdentifierName", "StringLiteral"} /\ PropName(n.PropertyName) = N("__proto__") IN
  IF isProto THEN ProtoSetterThen(obj, EvaluateValue(r.s, ctx, n.AssignmentExpression))
  ELSE CreateDataThen(obj, Val(r),
                      IF IsAnonymousFunctionDefinition(n.AssignmentExpression)
                      THEN NamedEvaluation(r.s, ctx, n.AssignmentExpression, Val(r))
                      ELSE EvaluateValue(r.s, ctx, n.AssignmentExpression))
ProtoSetterThen(obj, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF IsObject(Val(r)) \/ Val(r) = Null THEN LET p == SetPrototypeOf(r.s, obj, Val(r)) IN Ok(p.s, Empty)
  ELSE Ok(r.s, Empty)

\* CopyDataProperties (§7.3.25).
CopyDataProperties(s, target, source, excluded) ==
  IF IsNullish(source) THEN Ok(s, target)
  ELSE LET from == ToObject(s, source) IN
  IF IsAbrupt(from) THEN from ELSE
  LET ks == OwnPropertyKeys(from.s, Val(from)) IN
  IF IsAbrupt(ks) THEN ks ELSE CopyDataKeys(ks.s, target, Val(from), Val(ks), excluded)
CopyDataKeys(s, target, from, ks, excluded) ==
  IF ks = <<>> THEN Ok(s, target)
  ELSE LET k == Head(ks) IN
  IF \E i \in DOMAIN excluded : SameValue(excluded[i], k) THEN CopyDataKeys(s, target, from, Tail(ks), excluded)
  ELSE LET d == GetOwnProperty(s, from, k) IN
  IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent \/ Val(d).enumerable # True THEN CopyDataKeys(d.s, target, from, Tail(ks), excluded)
  ELSE LET v == Get(d.s, from, k) IN
  IF IsAbrupt(v) THEN v ELSE
  LET c == CreateDataPropertyOrThrow(v.s, target, k, Val(v)) IN
  IF IsAbrupt(c) THEN c ELSE CopyDataKeys(c.s, target, from, Tail(ks), excluded)

\* Template literals (§13.2.8): the cooked strings and expressions left, and the text so far.
TemplateConcat(s, ctx, strings, exprs, acc) ==
  IF exprs = <<>> THEN Ok(s, Str(acc))
  ELSE TemplateThen(ctx, strings, exprs, acc, EvaluateValue(s, ctx, Head(exprs)))
TemplateThen(ctx, strings, exprs, acc, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET t == ToStr(r.s, Val(r)) IN
  IF IsAbrupt(t) THEN t
  ELSE TemplateConcat(t.s, ctx, Tail(strings), Tail(exprs), acc \o Val(t).value \o strings[2])

\* Property accessors (§13.3.2).
MemberBaseThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF Has(n.IdentifierName) THEN Ok(r.s, Reference(Val(r), Str(n.IdentifierName.name), n.strict, Empty))
  ELSE IF Has(n.PrivateIdentifier) THEN
    Ok(r.s, Reference(Val(r), ResolvePrivateIdentifier(r.s, ctx, n.PrivateIdentifier.name), TRUE, Empty))
  ELSE MemberKeyThen(Val(r), n.strict, EvaluateValue(r.s, ctx, n.Expression))
MemberKeyThen(base, strict, r) == IF IsAbrupt(r) THEN r ELSE Ok(r.s, Reference(base, Val(r), strict, Empty))

\* The super keyword (§13.3.7).
EvaluateSuperProperty(s, ctx, n) ==
  LET env == GetThisEnvironment(s, ctx.lex)
      actualThis == GetThisBinding(s, env)
  IN IF IsAbrupt(actualThis) THEN actualThis
     ELSE SuperKeyThen(env, Val(actualThis), n.strict,
                       IF Has(n.IdentifierName) THEN Ok(actualThis.s, Str(n.IdentifierName.name))
                       ELSE EvaluateValue(actualThis.s, ctx, n.Expression))
SuperKeyThen(env, actualThis, strict, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET base == GetSuperBase(r.s, env) IN
  IF IsAbrupt(base) THEN base ELSE Ok(base.s, Reference(Val(base), Val(r), strict, actualThis))

\* Function calls (§13.3.6), after evaluating the callee to the reference r.
CallCalleeThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET f == GetValue(r.s, Val(r)) IN
  IF IsAbrupt(f) THEN f
     ELSE IF Val(r).type = "reference" /\ ~IsPropertyReference(Val(r)) /\ Val(r).name = SV("eval") /\
             SameValue(Val(f), Intrinsic(f.s, "eval"))
     THEN DirectEvalThen(ctx, n.strict, ArgumentListEvaluation(f.s, ctx, n.Arguments))
     ELSE EvaluateCall(f.s, ctx, Val(f), Val(r), n.Arguments, n.isTail)
DirectEvalThen(ctx, strict, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r) = <<>> THEN Ok(r.s, Undefined)
  ELSE PerformEval(r.s, ctx, Val(r)[1], strict, TRUE)

\* EvaluateCall (§13.3.6.2).
EvaluateCall(s, ctx, f, ref, arguments, isTail) ==
  CallArgumentsThen(f, CallThisValue(s, ref), isTail, ArgumentListEvaluation(s, ctx, arguments))
\* Steps 1-2 of EvaluateCall: the this value of a call through ref.
CallThisValue(s, ref) ==
  IF ref.type # "reference" THEN Undefined
  ELSE IF IsPropertyReference(ref) THEN GetThisValue(ref)
  ELSE IF E(s, ref.base.env).kind = "object" /\ E(s, ref.base.env).withEnv THEN E(s, ref.base.env).obj
  ELSE Undefined
\* Step 6 of EvaluateCall: a call in tail position (§15.10) returns to the caller's [[Call]], which
\* makes it in place of the finished call, so tail calls run in constant space.
CallArgumentsThen(f, this, isTail, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsCallable(r.s, f) THEN ThrowTypeError(r.s)
  ELSE IF isTail THEN Abrupt(r.s, Completion("tailcall", [f |-> f, this |-> this, args |-> Val(r)], Empty))
  ELSE Call(r.s, f, this, Val(r))

\* ArgumentListEvaluation (§13.3.8.1).
ArgumentListEvaluation(s, ctx, list) == ArgumentsAccumulate(s, ctx, list, <<>>)
ArgumentsAccumulate(s, ctx, list, acc) ==
  IF list = <<>> THEN Ok(s, acc)
  ELSE IF Head(list).type = "AssignmentRestElement"
  THEN ArgumentSpreadThen(ctx, Tail(list), acc, EvaluateValue(s, ctx, Head(list).AssignmentExpression))
  ELSE ArgumentThen(ctx, Tail(list), acc, EvaluateValue(s, ctx, Head(list)))
ArgumentSpreadThen(ctx, rest, acc, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET it == GetIterator(r.s, Val(r), "sync") IN
  IF IsAbrupt(it) THEN it ELSE
  LET values == IteratorToList(it.s, Val(it), <<>>) IN
  IF IsAbrupt(values) THEN values ELSE ArgumentsAccumulate(values.s, ctx, rest, acc \o Val(values))
ArgumentThen(ctx, rest, acc, r) ==
  IF IsAbrupt(r) THEN r ELSE ArgumentsAccumulate(r.s, ctx, rest, Append(acc, Val(r)))

\* Tagged templates (§13.3.11): the tag called with the template object and the substitutions.
EvaluateTaggedTemplate(s, ctx, n) == TagThen(ctx, n.TemplateLiteral, n.isTail, Evaluate(s, ctx, n.MemberExpression))
TagThen(ctx, template, isTail, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET f == GetValue(r.s, Val(r)) IN IF IsAbrupt(f) THEN f ELSE
  LET object == GetTemplateObject(f.s, <<TemplateParse(f.s, ctx.lex), template.site>>, template) IN
  CallArgumentsThen(Val(f), CallThisValue(object.s, Val(r)), isTail,
                    ArgumentsAccumulate(object.s, ctx, template.ExpressionList, <<Val(object)>>))

\* GetTemplateObject (§13.2.8.4): the frozen array of cooked strings with its frozen raw array, one
\* per template site, which the state's templates holds by key: the parse's number and the site's.
\* The host parses each eval source once, but each eval is a new parse, so its environment
\* numbers the parse for the code in it; the script's parse is 0.
TemplateParse(s, e) ==
  LET env == E(s, e) IN
  IF "parse" \in DOMAIN env THEN env.parse ELSE IF env.kind = "global" THEN 0 ELSE TemplateParse(s, env.outer)
GetTemplateObject(s, key, template) ==
  IF key \in DOMAIN s.templates THEN Ok(s, s.templates[key]) ELSE
  LET cooked == CreateArrayFromList(s, [i \in DOMAIN template.TemplateCookedList |->
                  IF template.TemplateCookedList[i] = None THEN Undefined ELSE Str(template.TemplateCookedList[i])])
      raw == CreateArrayFromList(cooked.s, [i \in DOMAIN template.TemplateRawList |-> Str(template.TemplateRawList[i])])
      rawFrozen == SetIntegrityLevel(raw.s, Val(raw), "frozen")
      withRaw == DefinePropertyOrThrow(rawFrozen.s, Val(cooked), SV("raw"), DataDesc(Val(raw), FALSE, FALSE, FALSE))
      frozen == SetIntegrityLevel(withRaw.s, Val(cooked), "frozen")
  IN Ok([frozen.s EXCEPT !.templates = (key :> Val(cooked)) @@ @], Val(cooked))

\* The new operator (§13.3.5).
NewCalleeThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE NewArgumentsThen(Val(r), IF Has(n.Arguments) THEN ArgumentListEvaluation(r.s, ctx, n.Arguments) ELSE Ok(r.s, <<>>))
NewArgumentsThen(constructor, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsConstructor(r.s, constructor) THEN ThrowTypeError(r.s)
  ELSE Construct(r.s, constructor, Val(r), constructor)

\* Optional chains (§13.3.9).
OptionalBaseThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET v == GetValue(r.s, Val(r)) IN
  IF IsAbrupt(v) THEN v
  ELSE IF IsNullish(Val(v)) THEN Ok(v.s, Undefined)
  ELSE ChainEvaluation(v.s, ctx, n.OptionalChain, Val(v), Val(r))

ChainEvaluation(s, ctx, chain, base, baseRef) ==
  IF Has(chain.OptionalChain)
  THEN ChainInnerThen(ctx, chain, ChainEvaluation(s, ctx, chain.OptionalChain, base, baseRef))
  ELSE ChainStep(s, ctx, chain, base, baseRef)
ChainInnerThen(ctx, chain, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET v == GetValue(r.s, Val(r)) IN
  IF IsAbrupt(v) THEN v ELSE ChainStep(v.s, ctx, chain, Val(v), Val(r))
ChainStep(s, ctx, chain, value, ref) ==
  CASE "Arguments" \in DOMAIN chain /\ chain.Arguments # None -> EvaluateCall(s, ctx, value, ref, chain.Arguments, FALSE)
    [] "IdentifierName" \in DOMAIN chain /\ chain.IdentifierName # None ->
         Ok(s, Reference(value, Str(chain.IdentifierName.name), chain.strict, Empty))
    [] "PrivateIdentifier" \in DOMAIN chain /\ chain.PrivateIdentifier # None ->
         Ok(s, Reference(value, ResolvePrivateIdentifier(s, ctx, chain.PrivateIdentifier.name), TRUE, Empty))
    [] OTHER -> MemberKeyThen(value, chain.strict, EvaluateValue(s, ctx, chain.Expression))

\* Postfix and prefix increment and decrement (§13.4), after evaluating the target to r.
UpdateThen(n, r) ==
  IF IsAbrupt(r) THEN r ELSE
  IF Val(r).type # "reference" THEN ThrowError(r.s, "ReferenceError") ELSE
  LET ref == ToKeyedReference(r.s, Val(r)) IN
  IF IsAbrupt(ref) THEN ref ELSE
  LET old == GetValue(ref.s, Val(ref)) IN
  IF IsAbrupt(old) THEN old ELSE
  LET num == ToNumeric(old.s, Val(old)) IN
  IF IsAbrupt(num) THEN num ELSE
  LET v == Val(num)
      new == IF IsNumber(v)
             THEN Num(IF n.operator = "++" THEN NumAdd(v.value, NumFromInt(1)) ELSE NumSub(v.value, NumFromInt(1)))
             ELSE BigInt(IF n.operator = "++" THEN BigIntAdd(v.value, BigIntFromInt(1)) ELSE BigIntSub(v.value, BigIntFromInt(1)))
      p == PutValue(num.s, Val(ref), new)
  IN IF IsAbrupt(p) THEN p ELSE Ok(p.s, IF Has(n.LeftHandSideExpression) THEN v ELSE new)

\* Unary operators (§13.5).
EvaluateUnaryExpression(s, ctx, n) ==
  CASE n.operator = "delete" -> DeleteThen(Evaluate(s, ctx, n.UnaryExpression))
    [] n.operator = "typeof" -> TypeofThen(Evaluate(s, ctx, n.UnaryExpression))
    [] OTHER -> UnaryThen(n.operator, EvaluateValue(s, ctx, n.UnaryExpression))
UnaryThen(op, r) ==
  IF IsAbrupt(r) THEN r ELSE
  CASE op = "void" -> Ok(r.s, Undefined)
    [] op = "!" -> Ok(r.s, Bool(~ToBooleanValue(Val(r))))
    [] op = "+" -> ToNumber(r.s, Val(r))
    [] OTHER ->
         LET num == ToNumeric(r.s, Val(r)) IN
         IF IsAbrupt(num) THEN num
         ELSE IF IsNumber(Val(num))
         THEN Ok(num.s, Num(IF op = "-" THEN NumNeg(Val(num).value) ELSE NumBitNot(Val(num).value)))
         ELSE Ok(num.s, BigInt(IF op = "-" THEN BigIntNeg(Val(num).value) ELSE BigIntBitNot(Val(num).value)))

\* The typeof operator (§13.5.3.1).
TypeofThen(r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF Val(r).type = "reference" /\ IsUnresolvableReference(Val(r)) THEN Ok(r.s, SV("undefined"))
  ELSE LET v == GetValue(r.s, Val(r)) IN
       IF IsAbrupt(v) THEN v ELSE Ok(v.s, Str(TypeOf(v.s, Val(v))))

TypeOf(s, v) ==
  CASE v.type = "undefined" -> N("undefined")
    [] v.type = "null" -> N("object")
    [] v.type = "boolean" -> N("boolean")
    [] v.type = "number" -> N("number")
    [] v.type = "string" -> N("string")
    [] v.type = "symbol" -> N("symbol")
    [] v.type = "bigint" -> N("bigint")
    [] OTHER -> IF IsHTMLDDA(v) THEN N("undefined")
                ELSE IF IsCallable(s, v) THEN N("function") ELSE N("object")

\* The delete operator (§13.5.1.2).
DeleteThen(ref) ==
  IF IsAbrupt(ref) THEN ref
  ELSE LET r == Val(ref) IN
  IF r.type # "reference" THEN Ok(ref.s, True)
  ELSE IF IsUnresolvableReference(r) THEN Ok(ref.s, True)
  ELSE IF IsPropertyReference(r) THEN
    IF r.this # Empty THEN ThrowError(ref.s, "ReferenceError")
    ELSE LET base == ToObject(ref.s, r.base) IN
    IF IsAbrupt(base) THEN base ELSE
    LET k == IF IsPropertyKey(r.name) THEN Ok(base.s, r.name) ELSE ToPropertyKey(base.s, r.name) IN
    IF IsAbrupt(k) THEN k ELSE
    LET d == Delete(k.s, Val(base), Val(k)) IN
    IF IsAbrupt(d) THEN d
    ELSE IF Val(d) = False /\ r.strict THEN ThrowTypeError(d.s)
    ELSE d
  ELSE DeleteBinding(ref.s, r.base.env, r.name.value)

\* Binary operators, after evaluating both operands (§13.15.3).
BinaryLeftThen(ctx, op, right, r) ==
  IF IsAbrupt(r) THEN r ELSE BinaryRightThen(Val(r), op, EvaluateValue(r.s, ctx, right))
BinaryRightThen(lval, op, r) ==
  IF IsAbrupt(r) THEN r ELSE ApplyStringOrNumericBinaryOperator(r.s, lval, op, Val(r))

ApplyStringOrNumericBinaryOperator(s, lval, op, rval) ==
  IF op = "+" THEN
    LET lp == ToPrimitive(s, lval, "none") IN
    IF IsAbrupt(lp) THEN lp ELSE
    LET rp == ToPrimitive(lp.s, rval, "none") IN
    IF IsAbrupt(rp) THEN rp ELSE
    IF IsString(Val(lp)) \/ IsString(Val(rp)) THEN
      LET ls == ToStr(rp.s, Val(lp)) IN
      IF IsAbrupt(ls) THEN ls ELSE
      LET rs == ToStr(ls.s, Val(rp)) IN
      IF IsAbrupt(rs) THEN rs ELSE Ok(rs.s, Str(Val(ls).value \o Val(rs).value))
    ELSE NumericBinary(rp.s, Val(lp), op, Val(rp))
  ELSE NumericBinary(s, lval, op, rval)

NumericBinary(s, lval, op, rval) ==
  LET ln == ToNumeric(s, lval) IN
  IF IsAbrupt(ln) THEN ln ELSE
  LET rn == ToNumeric(ln.s, rval) IN
  IF IsAbrupt(rn) THEN rn ELSE
  LET a == Val(ln)
      b == Val(rn)
  IN IF a.type # b.type THEN ThrowTypeError(rn.s)
     ELSE IF IsNumber(a) THEN Ok(rn.s, Num(NumberOperation(a.value, op, b.value)))
     ELSE BigIntOperationResult(rn.s, a.value, op, b.value)

NumberOperation(a, op, b) ==
  CASE op = "**" -> NumExp(a, b)
    [] op = "*" -> NumMul(a, b)
    [] op = "/" -> NumDiv(a, b)
    [] op = "%" -> NumRem(a, b)
    [] op = "+" -> NumAdd(a, b)
    [] op = "-" -> NumSub(a, b)
    [] op = "<<" -> NumShl(a, b)
    [] op = ">>" -> NumShr(a, b)
    [] op = ">>>" -> NumUShr(a, b)
    [] op = "&" -> NumAnd(a, b)
    [] op = "^" -> NumXor(a, b)
    [] op = "|" -> NumOr(a, b)

\* Relational operators (§13.10).
PrivateInThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
  ELSE Ok(r.s, Bool(PrivateElementFind(r.s, Val(r), ResolvePrivateIdentifier(r.s, ctx, n.PrivateIdentifier.name)) # Empty))
RelationalLeftThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r ELSE RelationalRightThen(Val(r), n.operator, EvaluateValue(r.s, ctx, n.ShiftExpression))
RelationalRightThen(lv, op, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET rv == Val(r)
      s1 == r.s
  IN CASE op = "<" ->
            LET c == IsLessThan(s1, lv, rv, TRUE) IN
            IF IsAbrupt(c) THEN c ELSE Ok(c.s, IF Val(c) = Undefined THEN False ELSE Val(c))
       [] op = ">" ->
            LET c == IsLessThan(s1, rv, lv, FALSE) IN
            IF IsAbrupt(c) THEN c ELSE Ok(c.s, IF Val(c) = Undefined THEN False ELSE Val(c))
       [] op = "<=" ->
            LET c == IsLessThan(s1, rv, lv, FALSE) IN
            IF IsAbrupt(c) THEN c ELSE Ok(c.s, Bool(Val(c) = False))
       [] op = ">=" ->
            LET c == IsLessThan(s1, lv, rv, TRUE) IN
            IF IsAbrupt(c) THEN c ELSE Ok(c.s, Bool(Val(c) = False))
       [] op = "instanceof" -> InstanceofOperator(s1, lv, rv)
       [] op = "in" ->
            IF ~IsObject(rv) THEN ThrowTypeError(s1)
            ELSE LET k == ToPropertyKey(s1, lv) IN
                 IF IsAbrupt(k) THEN k ELSE HasProperty(k.s, rv, Val(k))

\* InstanceofOperator (§13.10.2).
InstanceofOperator(s, v, target) ==
  IF ~IsObject(target) THEN ThrowTypeError(s)
  ELSE LET h == GetMethod(s, target, SymHasInstance) IN
  IF IsAbrupt(h) THEN h
  ELSE IF Val(h) # Undefined THEN
    LET r == Call(h.s, Val(h), target, <<v>>) IN
    IF IsAbrupt(r) THEN r ELSE Ok(r.s, ToBoolean(Val(r)))
  ELSE IF ~IsCallable(h.s, target) THEN ThrowTypeError(h.s)
  ELSE OrdinaryHasInstance(h.s, target, v)

\* Equality operators (§13.11).
EqualityLeftThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r ELSE EqualityRightThen(Val(r), n.operator, EvaluateValue(r.s, ctx, n.RelationalExpression))
EqualityRightThen(lv, op, r) ==
  IF IsAbrupt(r) THEN r ELSE
  CASE op = "===" -> Ok(r.s, Bool(IsStrictlyEqual(lv, Val(r))))
    [] op = "!==" -> Ok(r.s, Bool(~IsStrictlyEqual(lv, Val(r))))
    [] op = "==" -> IsLooselyEqual(r.s, lv, Val(r))
    [] op = "!=" ->
         LET e == IsLooselyEqual(r.s, lv, Val(r)) IN
         IF IsAbrupt(e) THEN e ELSE Ok(e.s, Bool(Val(e) = False))

\* Assignment operators (§13.15.2).
EvaluateAssignment(s, ctx, n) ==
  IF n.AssignmentOperator = "=" /\ IsAssignmentPattern(n.LeftHandSideExpression)
  THEN DestructuringValueThen(ctx, n.LeftHandSideExpression, EvaluateValue(s, ctx, n.AssignmentExpression))
  ELSE AssignmentTargetThen(ctx, n, Evaluate(s, ctx, n.LeftHandSideExpression))
DestructuringValueThen(ctx, pattern, r) ==
  IF IsAbrupt(r) THEN r ELSE ResultThen(Val(r), DestructuringAssignmentEvaluation(r.s, ctx, pattern, Val(r)))

\* The value of the right side, as NamedEvaluation gives it to an anonymous function assigned to a
\* name.
EvaluateAssigned(s, ctx, n) ==
  IF IsAnonymousFunctionDefinition(n.AssignmentExpression) /\ IsIdentifierRef(n.LeftHandSideExpression)
  THEN NamedEvaluation(s, ctx, n.AssignmentExpression, Str(n.LeftHandSideExpression.name))
  ELSE EvaluateValue(s, ctx, n.AssignmentExpression)

\* A call is a web-compat target (§13.15.1): it is evaluated, then throws before the right side runs.
AssignmentTargetThen(ctx, n, target) ==
  IF IsAbrupt(target) THEN target ELSE
  IF Val(target).type # "reference" THEN ThrowError(target.s, "ReferenceError") ELSE
  LET op == n.AssignmentOperator IN
  IF op = "=" THEN PutValueThen(Val(target), EvaluateAssigned(target.s, ctx, n)) ELSE
  LET ref == ToKeyedReference(target.s, Val(target)) IN
  IF IsAbrupt(ref) THEN ref ELSE
  LET old == GetValue(ref.s, Val(ref)) IN
  IF IsAbrupt(old) THEN old
  ELSE IF op \in {"&&=", "||=", "??="} THEN
    IF (CASE op = "&&=" -> ~ToBooleanValue(Val(old))
          [] op = "||=" -> ToBooleanValue(Val(old))
          [] op = "??=" -> ~IsNullish(Val(old)))
    THEN old
    ELSE PutValueThen(Val(ref), EvaluateAssigned(old.s, ctx, n))
  ELSE CompoundThen(Val(ref), Val(old), SubSeq(op, 1, Len(op) - 1), EvaluateValue(old.s, ctx, n.AssignmentExpression))

\* Assigns the value r gives to the reference, which is the assignment's value.
PutValueThen(ref, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET p == PutValue(r.s, ref, Val(r)) IN
  IF IsAbrupt(p) THEN p ELSE Ok(p.s, Val(r))
CompoundThen(ref, old, op, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET result == ApplyStringOrNumericBinaryOperator(r.s, old, op, Val(r)) IN
  IF IsAbrupt(result) THEN result ELSE PutValueThen(ref, result)
