\* Instantiating function objects (§15.2 to §15.6, §15.8, §15.9).
FunctionBodyOf(n) ==
  CASE n.type \in {"FunctionDeclaration", "FunctionExpression"} -> n.FunctionBody
    [] n.type \in {"GeneratorDeclaration", "GeneratorExpression"} -> n.GeneratorBody
    [] n.type \in {"AsyncFunctionDeclaration", "AsyncFunctionExpression"} -> n.AsyncBody
    [] n.type \in {"AsyncGeneratorDeclaration", "AsyncGeneratorExpression"} -> n.AsyncGeneratorBody

FunctionPrototypeFor(type) ==
  CASE type \in {"FunctionDeclaration", "FunctionExpression", "ArrowFunction", "MethodDefinition"} -> "FunctionPrototype"
    [] type \in {"GeneratorDeclaration", "GeneratorExpression", "GeneratorMethod"} -> "GeneratorFunctionPrototype"
    [] type \in {"AsyncFunctionDeclaration", "AsyncFunctionExpression", "AsyncArrowFunction", "AsyncMethod"} ->
         "AsyncFunctionPrototype"
    [] type \in {"AsyncGeneratorDeclaration", "AsyncGeneratorExpression", "AsyncGeneratorMethod"} ->
         "AsyncGeneratorFunctionPrototype"

\* Gives a new function object its prototype property: a constructor's for ordinary functions,
\* and a fresh generator prototype object for generator functions. A non-strict ordinary function
\* also gets caller and arguments accessors, the extension engines make and §17.1 allows.
GiveFunctionPrototype(s, type, f) ==
  CASE type \in {"FunctionDeclaration", "FunctionExpression"} ->
         LET s1 == MakeConstructor(s, f, TRUE, Empty) IN
         IF O(s1, f).slots.strict THEN s1
         ELSE SetO(s1, f, PutProp(PutProp(O(s1, f), SV("arguments"), AccessorDesc(Intrinsic(s1, "FunctionArguments"), Undefined, FALSE, FALSE)),
                                  SV("caller"), AccessorDesc(Intrinsic(s1, "FunctionCaller"), Undefined, FALSE, FALSE)))
    [] type \in {"GeneratorDeclaration", "GeneratorExpression", "GeneratorMethod",
                 "AsyncGeneratorDeclaration", "AsyncGeneratorExpression", "AsyncGeneratorMethod"} ->
         LET protoName == IF type \in {"GeneratorDeclaration", "GeneratorExpression", "GeneratorMethod"}
                          THEN "GeneratorPrototype" ELSE "AsyncGeneratorPrototype"
             p == OrdinaryObjectCreate(s, Intrinsic(s, protoName))
         IN SetO(p.s, f, PutProp(O(p.s, f), SV("prototype"), DataDesc(Val(p), TRUE, FALSE, FALSE)))
    [] OTHER -> s

\* InstantiateFunctionObject (§15.2.4 and its generator and async counterparts).
InstantiateFunctionObject(s, ctx, n) ==
  LET name == IF Has(n.BindingIdentifier) THEN n.BindingIdentifier.name ELSE N("default")
      f == OrdinaryFunctionCreate(s, Intrinsic(s, FunctionPrototypeFor(n.type)), n.sourceText,
                                  n.FormalParameters, FunctionBodyOf(n), FALSE, ctx.lex, ctx.priv)
      s1 == SetFunctionName(f.s, f.v, Str(name), <<>>)
  IN Ok(GiveFunctionPrototype(s1, n.type, f.v), f.v)

\* InstantiateOrdinaryFunctionExpression (§15.2.5) and the like. name is the name NamedEvaluation
\* gives, or Empty.
InstantiateFunctionExpression(s, ctx, n, name) ==
  IF Has(n.BindingIdentifier) THEN
    LET funcName == n.BindingIdentifier.name
        env == NewDeclarativeEnvironment(s, ctx.lex)
        s1 == CreateImmutableBinding(env.s, env.e, funcName, FALSE).s
        f == OrdinaryFunctionCreate(s1, Intrinsic(s1, FunctionPrototypeFor(n.type)), n.sourceText,
                                    n.FormalParameters, FunctionBodyOf(n), FALSE, env.e, ctx.priv)
        s2 == GiveFunctionPrototype(SetFunctionName(f.s, f.v, Str(funcName), <<>>), n.type, f.v)
    IN Ok(InitializeBinding(s2, env.e, funcName, f.v).s, f.v)
  ELSE
    LET f == OrdinaryFunctionCreate(s, Intrinsic(s, FunctionPrototypeFor(n.type)), n.sourceText,
                                    n.FormalParameters, FunctionBodyOf(n), FALSE, ctx.lex, ctx.priv)
        s1 == SetFunctionName(f.s, f.v, IF name = Empty THEN EmptyStr ELSE name, <<>>)
    IN Ok(GiveFunctionPrototype(s1, n.type, f.v), f.v)

\* InstantiateArrowFunctionExpression (§15.3.4) and its async counterpart (§15.9.4).
InstantiateArrowFunctionExpression(s, ctx, n, name) ==
  LET body == IF n.type = "ArrowFunction" THEN n.ConciseBody ELSE n.AsyncConciseBody
      f == OrdinaryFunctionCreate(s, Intrinsic(s, FunctionPrototypeFor(n.type)), n.sourceText,
                                  n.ArrowParameters, body, TRUE, ctx.lex, ctx.priv)
  IN Ok(SetFunctionName(f.s, f.v, IF name = Empty THEN EmptyStr ELSE name, <<>>), f.v)

\* Method definitions (§15.4). A method's kind: "method", "get", or "set".
MethodKind(n) ==
  IF n.type # "MethodDefinition" THEN "method"
  ELSE IF Has(n.PropertySetParameterList) THEN "set"
  ELSE IF Has(n.UniqueFormalParameters) THEN "method"
  ELSE "get"

MethodBody(n) ==
  CASE n.type = "MethodDefinition" -> n.FunctionBody
    [] n.type = "GeneratorMethod" -> n.GeneratorBody
    [] n.type = "AsyncMethod" -> n.AsyncBody
    [] n.type = "AsyncGeneratorMethod" -> n.AsyncGeneratorBody

MethodParams(n) ==
  CASE MethodKind(n) = "set" -> n.PropertySetParameterList
    [] MethodKind(n) = "get" -> <<>>
    [] OTHER -> n.UniqueFormalParameters

\* DefineMethod (§15.4.4), returning [key, closure] with the method's home object.
DefineMethod(s, ctx, n, obj, proto) == DefineMethodThen(ctx, n, obj, proto, EvaluatePropertyKey(s, ctx, n.ClassElementName))
DefineMethodThen(ctx, n, obj, proto, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET f == OrdinaryFunctionCreate(r.s, IF proto = Empty THEN Intrinsic(r.s, FunctionPrototypeFor(n.type)) ELSE proto,
                                  n.sourceText, MethodParams(n), MethodBody(n), FALSE, ctx.lex, ctx.priv)
  IN Ok(MakeMethod(f.s, f.v, obj), [key |-> Val(r), closure |-> f.v])

\* A Private Element (§6.2.10): [key, kind, value, get, set] with kind "field", "method", or
\* "accessor".
PrivateElement(key, kind, value, get, set) == [key |-> key, kind |-> kind, value |-> value, get |-> get, set |-> set]

\* DefineMethodProperty (§10.2.8), returning a Private Element for a private key or Empty.
DefineMethodProperty(s, obj, key, closure, enumerable) ==
  IF key.type = "private" THEN Ok(s, PrivateElement(key, "method", closure, Undefined, Undefined))
  ELSE LET d == DefinePropertyOrThrow(s, obj, key, DataDesc(closure, TRUE, enumerable, TRUE)) IN
       IF IsAbrupt(d) THEN d ELSE Ok(d.s, Empty)

\* MethodDefinitionEvaluation (§15.4.5 and its generator and async counterparts).
MethodDefinitionEvaluation(s, ctx, obj, n, enumerable) ==
  MethodDefinitionThen(obj, n, enumerable, DefineMethod(s, ctx, n, obj, Empty))
MethodDefinitionThen(obj, n, enumerable, m) ==
  IF IsAbrupt(m) THEN m ELSE
  LET kind == MethodKind(n)
      key == Val(m).key
      f == Val(m).closure
  IN IF kind = "method" THEN
          LET s1 == GiveFunctionPrototype(SetFunctionName(m.s, f, key, <<>>), n.type, f) IN
          DefineMethodProperty(s1, obj, key, f, enumerable)
        ELSE
          LET s1 == SetFunctionName(m.s, f, key, IF kind = "get" THEN N("get") ELSE N("set")) IN
          IF key.type = "private" THEN
            Ok(s1, IF kind = "get" THEN PrivateElement(key, "accessor", Undefined, f, Undefined)
                   ELSE PrivateElement(key, "accessor", Undefined, Undefined, f))
          ELSE
            LET d == DefinePropertyOrThrow(s1, obj, key,
                       IF kind = "get" THEN AccessorDesc(f, Absent, enumerable, TRUE)
                       ELSE AccessorDesc(Absent, f, enumerable, TRUE))
            IN IF IsAbrupt(d) THEN d ELSE Ok(d.s, Empty)

\* Private environments (§9.2) are values: [outer, names] with names from a private identifier's
\* name to its Private Name. A Private Name is [type |-> "private", id, description].
NewPrivateEnvironment(s, outer, names) ==
  LET ids == [i \in 1..Len(names) |-> s.privateCount + i]
      distinct == Dedupe(names)
  IN [s |-> [s EXCEPT !.privateCount = @ + Len(distinct)],
      env |-> [outer |-> outer,
               names |-> [name \in Range(distinct) |->
                            [type |-> "private", id |-> s.privateCount + IndexOf(distinct, name),
                             description |-> <<35>> \o name]]]]

ResolvePrivateIdentifier(s, ctx, name) == ResolvePrivateIn(ctx.priv, name)
ResolvePrivateIn(env, name) ==
  IF name \in DOMAIN env.names THEN env.names[name] ELSE ResolvePrivateIn(env.outer, name)

\* Private element operations (§7.3.26 to §7.3.32).
PrivateElementFind(s, o, p) ==
  LET elements == O(s, o).privs
      found == {i \in DOMAIN elements : elements[i].key.id = p.id}
  IN IF found = {} THEN Empty ELSE elements[CHOOSE i \in found : TRUE]

\* PrivateFieldAdd and PrivateMethodOrAccessorAdd, which throw on a non-extensible
\* object as engine262 does for the nonextensible-applies-to-private proposal.
PrivateFieldAdd(s, o, p, value) == PrivateElementAdd(s, o, PrivateElement(p, "field", value, Undefined, Undefined))
PrivateMethodOrAccessorAdd(s, o, method) == PrivateElementAdd(s, o, method)
PrivateElementAdd(s, o, element) ==
  LET extensible == IsExtensible(s, o) IN
  CASE IsAbrupt(extensible) -> extensible
    [] Val(extensible) = False \/ PrivateElementFind(extensible.s, o, element.key) # Empty -> ThrowTypeError(extensible.s)
    [] OTHER -> Ok(SetO(extensible.s, o, [O(extensible.s, o) EXCEPT !.privs = Append(@, element)]), Empty)

PrivateGet(s, o, p) ==
  LET entry == PrivateElementFind(s, o, p) IN
  CASE entry = Empty -> ThrowTypeError(s)
    [] entry.kind \in {"field", "method"} -> Ok(s, entry.value)
    [] entry.get = Undefined -> ThrowTypeError(s)
    [] OTHER -> Call(s, entry.get, o, <<>>)

PrivateSet(s, o, p, value) ==
  LET entry == PrivateElementFind(s, o, p)
      elements == O(s, o).privs
  IN CASE entry = Empty -> ThrowTypeError(s)
       [] entry.kind = "field" ->
            LET i == CHOOSE j \in DOMAIN elements : elements[j].key.id = p.id IN
            Ok(SetO(s, o, [O(s, o) EXCEPT !.privs[i].value = value]), Empty)
       [] entry.kind = "method" -> ThrowTypeError(s)
       [] entry.set = Undefined -> ThrowTypeError(s)
       [] OTHER -> LET c == Call(s, entry.set, o, <<value>>) IN IF IsAbrupt(c) THEN c ELSE Ok(c.s, Empty)

\* InitializeFieldOrAccessor of the decorators proposal, for a field or auto-accessor element: its
\* own initializer and then each one its decorators returned give the value of the field, or of the
\* accessor's storage, and then the initializers its decorators added run.
InitializeFieldOrAccessor(s, receiver, e) ==
  LET v == FieldInitializersThen(receiver, e.initializers,
                                 IF e.init = Empty THEN Ok(s, Undefined) ELSE Call(s, e.init, receiver, <<>>))
      name == IF e.kind = "accessor" THEN e.storage ELSE e.key
  IN IF IsAbrupt(v) THEN v ELSE
     LET added == IF name.type = "private" THEN PrivateFieldAdd(v.s, receiver, name, Val(v))
                  ELSE CreateDataPropertyOrThrow(v.s, receiver, name, Val(v))
     IN IF IsAbrupt(added) THEN added ELSE CallInitializers(added.s, receiver, InitializerList(added.s, e.extra))
FieldInitializersThen(receiver, initializers, r) ==
  IF IsAbrupt(r) \/ initializers = <<>> THEN r
  ELSE FieldInitializersThen(receiver, Tail(initializers), Call(r.s, Head(initializers), receiver, <<Val(r)>>))

\* A list addInitializer appends to is an object no code can reach, or Empty for one nothing can
\* append to.
NewInitializerList(s, isNeeded) ==
  IF ~isNeeded THEN [s |-> s, v |-> Empty] ELSE Alloc(s, MakeObject(Null, "ordinary", [initializers |-> <<>>]))
InitializerList(s, list) == IF list = Empty THEN <<>> ELSE O(s, list).slots.initializers
CallInitializers(s, receiver, fns) ==
  IF fns = <<>> THEN Ok(s, Empty)
  ELSE LET c == Call(s, Head(fns), receiver, <<>>) IN IF IsAbrupt(c) THEN c ELSE CallInitializers(c.s, receiver, Tail(fns))

\* InitializeInstanceElements (§7.3.34) of the decorators proposal.
InitializeInstanceElements(s, o, constructor) ==
  LET slots == O(s, constructor).slots
      m == AddPrivateMethods(s, o, IF "privateMethods" \in DOMAIN slots THEN slots.privateMethods ELSE <<>>)
      i == CallInitializers(m.s, o, IF "initializers" \in DOMAIN slots THEN InitializerList(m.s, slots.initializers) ELSE <<>>)
  IN CASE IsAbrupt(m) -> m
       [] IsAbrupt(i) -> i
       [] OTHER -> InitializeFields(i.s, o, IF "fields" \in DOMAIN slots THEN slots.fields ELSE <<>>)
AddPrivateMethods(s, o, methods) ==
  IF methods = <<>> THEN Ok(s, Empty)
  ELSE LET r == PrivateMethodOrAccessorAdd(s, o, Head(methods)) IN
       IF IsAbrupt(r) THEN r ELSE AddPrivateMethods(r.s, o, Tail(methods))
InitializeFields(s, o, fields) ==
  IF fields = <<>> THEN Ok(s, Empty)
  ELSE LET r == InitializeFieldOrAccessor(s, o, Head(fields)) IN
       IF IsAbrupt(r) THEN r ELSE InitializeFields(r.s, o, Tail(fields))

\* The body a class field initializer function runs (§15.7.10).
EvaluateFieldInitializer(s, ctx, f, body) ==
  LET name == O(s, f).slots.initializerName
      v == IF IsAnonymousFunctionDefinition(body.Initializer)
           THEN NamedEvaluation(s, ctx, body.Initializer, name)
           ELSE EvaluateValue(s, ctx, body.Initializer)
  IN IF IsAbrupt(v) THEN v ELSE Abrupt(v.s, Completion("return", Val(v), Empty))

\* Static semantics of class bodies (§15.7.3).
ClassElements(tail) == List(tail.ClassBody)
IsStaticElement(e) == e.static = TRUE
IsConstructorMethod(e) ==
  /\ e.type = "MethodDefinition"
  /\ ~IsStaticElement(e)
  /\ e.ClassElementName.type \in {"IdentifierName", "StringLiteral"}
  /\ PropName(e.ClassElementName) = N("constructor")
ConstructorMethodOf(tail) ==
  LET found == {i \in DOMAIN ClassElements(tail) : IsConstructorMethod(ClassElements(tail)[i])}
  IN IF found = {} THEN Empty ELSE ClassElements(tail)[CHOOSE i \in found : TRUE]
NonConstructorElements(tail) == SelectSeq(ClassElements(tail), LAMBDA e : ~IsConstructorMethod(e))
PrivateBoundIdentifiers(tail) ==
  LET elements == SelectSeq(ClassElements(tail),
                            LAMBDA e : e.type # "ClassStaticBlock" /\ e.ClassElementName.type = "PrivateIdentifier")
  IN [i \in DOMAIN elements |-> elements[i].ClassElementName.name]
DecoratorsOf(n) == IF "Decorators" \in DOMAIN n /\ Has(n.Decorators) THEN n.Decorators ELSE <<>>

\* ClassDefinitionEvaluation (§15.7.14) with the decorators proposal. classBinding is a name or
\* Empty, className is the property key or Private Name for SetFunctionName, and decorators are the
\* class's Decorator nodes, which are evaluated first.
ClassDefinitionEvaluation(s, ctx, tail, classBinding, className, sourceText, decorators) ==
  LET d == DecoratorListEvaluation(s, ctx, decorators)
      env == NewDeclarativeEnvironment(d.s, ctx.lex)
      s1 == IF classBinding = Empty THEN env.s ELSE CreateImmutableBinding(env.s, env.e, classBinding, TRUE).s
      priv == NewPrivateEnvironment(s1, ctx.priv, PrivateBoundIdentifiers(tail))
  IN IF IsAbrupt(d) THEN d
     ELSE ClassHeritageThen([ctx |-> [ctx EXCEPT !.lex = env.e, !.priv = priv.env], tail |-> tail, binding |-> classBinding,
                             name |-> className, sourceText |-> sourceText, decorators |-> Val(d)],
                            IF Has(tail.ClassHeritage) THEN EvaluateValue(priv.s, WithLex(ctx, env.e), tail.ClassHeritage)
                            ELSE Ok(priv.s, Empty))

\* Steps 8-25 of ClassDefinitionEvaluation, for a class [ctx, tail, binding, name, sourceText,
\* decorators] whose heritage evaluated to r.
ClassHeritageThen(class, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET tail == class.tail
      parents ==
        IF ~Has(tail.ClassHeritage)
        THEN Ok(r.s, [proto |-> Intrinsic(r.s, "ObjectPrototype"), ctor |-> Intrinsic(r.s, "FunctionPrototype")])
        ELSE IF Val(r) = Null
        THEN Ok(r.s, [proto |-> Null, ctor |-> Intrinsic(r.s, "FunctionPrototype")])
        ELSE IF ~IsConstructor(r.s, Val(r)) THEN ThrowTypeError(r.s)
        ELSE LET p == Get(r.s, Val(r), SV("prototype")) IN
             IF IsAbrupt(p) THEN p
             ELSE IF ~IsObject(Val(p)) /\ Val(p) # Null THEN ThrowTypeError(p.s)
             ELSE Ok(p.s, [proto |-> Val(p), ctor |-> Val(r)])
  IN IF IsAbrupt(parents) THEN parents ELSE
     LET proto == OrdinaryObjectCreate(parents.s, Val(parents).proto)
         constructor == ConstructorMethodOf(tail)
         made ==
           IF constructor = Empty THEN
             LET a == Alloc(proto.s, BuiltinObject(Val(parents).ctor, <<"Class", "default">>, 0,
                                                   FunctionNameUnits(proto.s, class.name), TRUE, Empty, proto.s.realmId))
             IN Ok(a.s, a.v)
           ELSE
             LET m == DefineMethod(proto.s, class.ctx, constructor, Val(proto), Val(parents).ctor) IN
             IF IsAbrupt(m) THEN m
             ELSE Ok(SetFunctionName(MakeClassConstructor(m.s, Val(m).closure), Val(m).closure, class.name, <<>>),
                     Val(m).closure)
     IN IF IsAbrupt(made) THEN made ELSE
        LET F == Val(made)
            s2 == MakeConstructor(made.s, F, FALSE, Val(proto))
            s3 == SetO(s2, F, [O(s2, F) EXCEPT !.slots = [ctorKind |-> IF Has(tail.ClassHeritage) THEN "derived" ELSE "base",
                                                                 sourceText |-> class.sourceText] @@ @])
            s4 == CreateMethodProperty(s3, Val(proto), SV("constructor"), F).s
        IN ClassElementsThen(class, F, Val(proto),
                             ClassElementsEvaluation(s4, class.ctx, NonConstructorElements(tail), Val(proto), F,
                                                     [instance |-> <<>>, static |-> <<>>]))

\* Steps 26-33 of ClassDefinitionEvaluation, once the elements evaluated to r, their records
\* [instance, static]. The decorators of methods, then of fields, then of the class are applied,
\* and the class decorators' result is the class.
ClassElementsThen(class, F, proto, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET els == Val(r)
      isDecorated == \E e \in Range(els.instance \o els.static) : e.kind # "staticBlock" /\ e.decorators # <<>>
      instanceExtra == NewInitializerList(r.s, isDecorated)
      staticExtra == NewInitializerList(instanceExtra.s, isDecorated)
      staticMethods == DecorateElements(staticExtra.s, F, els.static, staticExtra.v, TRUE, FALSE, <<>>)
      instanceMethods == DecorateElements(staticMethods.s, proto, els.instance, instanceExtra.v, FALSE, FALSE, <<>>)
      statics == DecorateElements(instanceMethods.s, F, Val(staticMethods), Empty, TRUE, TRUE, <<>>)
      instances == DecorateElements(statics.s, proto, Val(instanceMethods), Empty, FALSE, TRUE, <<>>)
  IN CASE IsAbrupt(staticMethods) -> staticMethods
       [] IsAbrupt(instanceMethods) -> instanceMethods
       [] IsAbrupt(statics) -> statics
       [] IsAbrupt(instances) -> instances
       [] OTHER ->
  LET s1 == SetO(instances.s, F, [O(instances.s, F) EXCEPT
                   !.slots = [privateMethods |-> PrivateMethodsOf(Val(instances), <<>>),
                              fields |-> SelectSeq(Val(instances), LAMBDA e : e.kind \in {"field", "accessor"}),
                              initializers |-> instanceExtra.v] @@ @])
      m == AddPrivateMethods(s1, F, PrivateMethodsOf(Val(statics), <<>>))
      classExtra == NewInitializerList(m.s, class.decorators # <<>>)
      decorated == ApplyClassDecorators(classExtra.s, F, class.decorators, class.name, classExtra.v)
  IN CASE IsAbrupt(m) -> m
       [] IsAbrupt(decorated) -> decorated
       [] OTHER ->
  LET C == Val(decorated)
      s2 == IF class.binding = Empty THEN decorated.s ELSE InitializeBinding(decorated.s, class.ctx.lex, class.binding, C).s
      i == CallInitializers(s2, C, InitializerList(s2, staticExtra.v))
      st == StaticElementsEvaluation(i.s, C, Val(statics))
      c == CallInitializers(st.s, C, InitializerList(st.s, classExtra.v))
  IN CASE IsAbrupt(i) -> i
       [] IsAbrupt(st) -> st
       [] IsAbrupt(c) -> c
       [] OTHER -> Ok(c.s, C)

\* Step 25 of ClassDefinitionEvaluation: each element's evaluation, sorted into its list.
ClassElementsEvaluation(s, ctx, elements, proto, F, acc) ==
  IF elements = <<>> THEN Ok(s, acc)
  ELSE ClassElementThen(ctx, elements, proto, F, acc,
                        ClassElementEvaluation(s, ctx, Head(elements), IF IsStaticElement(Head(elements)) THEN F ELSE proto))
ClassElementThen(ctx, elements, proto, F, acc, r) ==
  IF IsAbrupt(r) THEN r
  ELSE ClassElementsEvaluation(r.s, ctx, Tail(elements), proto, F,
                               IF IsStaticElement(Head(elements)) THEN [acc EXCEPT !.static = Append(@, Val(r))]
                               ELSE [acc EXCEPT !.instance = Append(@, Val(r))])

\* A ClassElementDefinition Record of the decorators proposal: kind "method", "getter", "setter",
\* "field", or "accessor", the key, the method, getter, or setter, an auto-accessor's storage, a
\* field's own initializer or Empty and the initializers its decorators returned, the list of
\* initializers its decorators add, and its Decorator Definition Records.
ElementRecord(kind, key) ==
  [kind |-> kind, key |-> key, value |-> Undefined, get |-> Undefined, set |-> Undefined, storage |-> Empty,
   init |-> Empty, initializers |-> <<>>, extra |-> Empty, decorators |-> <<>>]

\* ClassElementEvaluation (§15.7.13) of the decorators proposal: an element's ClassElementDefinition
\* Record, after its decorators are evaluated, or a static block [kind |-> "staticBlock", body].
ClassElementEvaluation(s, ctx, e, home) ==
  IF e.type = "ClassStaticBlock" THEN
    LET f == OrdinaryFunctionCreate(s, Intrinsic(s, "FunctionPrototype"), <<>>, <<>>, e.ClassStaticBlockBody,
                                    FALSE, ctx.lex, ctx.priv)
    IN Ok(MakeMethod(f.s, f.v, home), [kind |-> "staticBlock", body |-> f.v])
  ELSE LET d == DecoratorListEvaluation(s, ctx, DecoratorsOf(e))
           r == IF IsAbrupt(d) THEN d
                ELSE IF e.type = "FieldDefinition" THEN FieldKeyThen(ctx, e, home, EvaluatePropertyKey(d.s, ctx, e.ClassElementName))
                ELSE MethodElementThen(e, DefineMethod(d.s, ctx, e, home, Empty))
       IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, [Val(r) EXCEPT !.decorators = Val(d)])
MethodElementThen(n, m) ==
  IF IsAbrupt(m) THEN m ELSE
  LET kind == MethodKind(n)
      key == Val(m).key
      f == Val(m).closure
  IN IF kind = "method" THEN
       Ok(GiveFunctionPrototype(SetFunctionName(m.s, f, key, <<>>), n.type, f), [ElementRecord("method", key) EXCEPT !.value = f])
     ELSE Ok(SetFunctionName(m.s, f, key, IF kind = "get" THEN N("get") ELSE N("set")),
             IF kind = "get" THEN [ElementRecord("getter", key) EXCEPT !.get = f]
             ELSE [ElementRecord("setter", key) EXCEPT !.set = f])
\* ClassFieldDefinitionEvaluation (§15.7.10) of the decorators proposal. An auto-accessor keeps its
\* value in a new Private Name, which its getter and setter read and write.
FieldKeyThen(ctx, e, home, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET key == Val(r)
      init == IF ~Has(e.Initializer) THEN [s |-> r.s, v |-> Empty]
              ELSE LET body == [type |-> "ClassFieldInitializer", Initializer |-> e.Initializer, strict |-> TRUE]
                       f == OrdinaryFunctionCreate(r.s, Intrinsic(r.s, "FunctionPrototype"), <<>>, <<>>, body, FALSE,
                                                   ctx.lex, ctx.priv)
                       s1 == MakeMethod(f.s, f.v, home)
                   IN [s |-> SetO(s1, f.v, [O(s1, f.v) EXCEPT !.slots.initializerName = key]), v |-> f.v]
  IN IF ~e.accessor THEN Ok(init.s, [ElementRecord("field", key) EXCEPT !.init = init.v]) ELSE
     LET storage == [type |-> "private", id |-> init.s.privateCount + 1,
                     description |-> FunctionNameUnits(init.s, key) \o N(" accessor storage")]
         s2 == [init.s EXCEPT !.privateCount = @ + 1]
         get == CreateBuiltinFunction(s2, <<"Class", "autoAccessorGet">>, 0, N("get ") \o FunctionNameUnits(s2, key), storage)
         set == CreateBuiltinFunction(get.s, <<"Class", "autoAccessorSet">>, 1, N("set ") \o FunctionNameUnits(s2, key), storage)
     IN Ok(set.s, [ElementRecord("accessor", key) EXCEPT !.init = init.v, !.get = Val(get), !.set = Val(set),
                                                         !.storage = storage])

\* Applies the decorators of the methods, getters, setters, and auto-accessors among elements and
\* defines them on home when isFields is FALSE, or those of the fields when it is TRUE, giving the
\* records with what the decorators returned. extra is the list a method's decorators add to.
DecorateElements(s, home, elements, extra, isStatic, isFields, acc) ==
  IF elements = <<>> THEN Ok(s, acc) ELSE
  LET e == Head(elements)
      r == CASE e.kind = "staticBlock" \/ (e.kind = "field") # isFields -> Ok(s, e)
             [] isFields -> ApplyElementDecorators(s, e, Empty, isStatic)
             [] OTHER -> DefineElementThen(home, ApplyElementDecorators(s, e, extra, isStatic))
  IN IF IsAbrupt(r) THEN r ELSE DecorateElements(r.s, home, Tail(elements), extra, isStatic, isFields, Append(acc, Val(r)))
\* DefineMethodProperty of the decorators proposal.
DefineElementThen(home, r) ==
  IF IsAbrupt(r) \/ Val(r).key.type = "private" THEN r ELSE
  LET e == Val(r)
      d == DefinePropertyOrThrow(r.s, home, e.key,
             CASE e.kind = "method" -> DataDesc(e.value, TRUE, FALSE, TRUE)
               [] e.kind = "getter" -> AccessorDesc(e.get, Absent, FALSE, TRUE)
               [] e.kind = "setter" -> AccessorDesc(Absent, e.set, FALSE, TRUE)
               [] OTHER -> AccessorDesc(e.get, e.set, FALSE, TRUE))
  IN IF IsAbrupt(d) THEN d ELSE Ok(d.s, e)

\* The private methods and accessors among elements, a getter and setter of one name combined
\* (InitializePrivateMethods of the decorators proposal).
PrivateMethodsOf(elements, acc) ==
  IF elements = <<>> THEN acc ELSE
  LET e == Head(elements) IN
  PrivateMethodsOf(Tail(elements),
    CASE e.kind \in {"staticBlock", "field"} -> acc
      [] e.key.type # "private" -> acc
      [] e.kind = "method" -> Append(acc, PrivateElement(e.key, "method", e.value, Undefined, Undefined))
      [] e.kind = "accessor" -> Append(acc, PrivateElement(e.key, "accessor", Undefined, e.get, e.set))
      [] OTHER -> AddPrivateMethod(acc, PrivateElement(e.key, "accessor", Undefined, e.get, e.set)))

\* Adds a private method to a container, combining a getter and setter of the same name.
AddPrivateMethod(container, m) ==
  LET found == {i \in DOMAIN container : container[i].key.id = m.key.id} IN
  IF found = {} THEN Append(container, m)
  ELSE LET i == CHOOSE j \in found : TRUE
           existing == container[i]
       IN [container EXCEPT ![i] =
             IF m.get = Undefined THEN PrivateElement(m.key, "accessor", Undefined, existing.get, m.set)
             ELSE PrivateElement(m.key, "accessor", Undefined, m.get, existing.set)]

\* Steps 31-32 of ClassDefinitionEvaluation: the static fields, auto-accessors, and blocks.
StaticElementsEvaluation(s, F, elements) ==
  IF elements = <<>> THEN Ok(s, Empty)
  ELSE LET e == Head(elements)
           r == CASE e.kind \in {"field", "accessor"} -> InitializeFieldOrAccessor(s, F, e)
                  [] e.kind = "staticBlock" -> Call(s, e.body, F, <<>>)
                  [] OTHER -> Ok(s, Empty)
       IN IF IsAbrupt(r) THEN r ELSE StaticElementsEvaluation(r.s, F, Tail(elements))

\* DecoratorListEvaluation of the decorators proposal: a Decorator Definition Record
\* [decorator, receiver] for each node, the last first. The receiver is the this value a call
\* through the decorator's reference would have, where engine262 passes the decorator itself.
DecoratorListEvaluation(s, ctx, nodes) ==
  IF nodes = <<>> THEN Ok(s, <<>>) ELSE
  LET n == Head(nodes)
      ref == Evaluate(s, ctx, CASE Has(n.MemberExpression) -> n.MemberExpression
                                [] Has(n.CallExpression) -> n.CallExpression
                                [] OTHER -> n.ParenthesizedExpression)
      v == GetValue(ref.s, Val(ref))
      rest == DecoratorListEvaluation(v.s, ctx, Tail(nodes))
  IN CASE IsAbrupt(ref) -> ref
       [] IsAbrupt(v) -> v
       [] IsAbrupt(rest) -> rest
       [] OTHER -> Ok(rest.s, Val(rest) \o <<[decorator |-> Val(v), receiver |-> CallThisValue(v.s, Val(ref))]>>)

\* CreateDecoratorContextObject, returning [s, v, add] with add its addInitializer function, which
\* appends to list until the decorator returns.
DecoratorContext(s, kind, key, list, isStatic) ==
  LET add == CreateBuiltinFunction(s, <<"Class", "addInitializer">>, 1, N("addInitializer"), [list |-> list, isFinished |-> FALSE])
      access == IF kind = "class" THEN [s |-> add.s, v |-> Empty] ELSE DecoratorAccess(add.s, kind, key)
      o == OrdinaryObjectCreate(access.s, Intrinsic(access.s, "ObjectPrototype"))
      kindName == CASE kind = "class" -> SV("class") [] kind = "method" -> SV("method") [] kind = "getter" -> SV("getter")
                    [] kind = "setter" -> SV("setter") [] kind = "field" -> SV("field") [] kind = "accessor" -> SV("accessor")
      props == IF kind = "class" THEN <<<<SV("kind"), kindName>>, <<SV("name"), key>>, <<SV("addInitializer"), Val(add)>>>>
               ELSE <<<<SV("kind"), kindName>>, <<SV("access"), access.v>>, <<SV("static"), Bool(isStatic)>>,
                      <<SV("private"), Bool(key.type = "private")>>,
                      <<SV("name"), IF key.type = "private" THEN Str(key.description) ELSE key>>,
                      <<SV("addInitializer"), Val(add)>>>>
  IN [s |-> SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), props)), v |-> Val(o), add |-> Val(add)]
\* CreateDecoratorAccessObject.
DecoratorAccess(s, kind, key) ==
  LET get == CreateBuiltinFunction(s, <<"Class", "accessGet">>, 1, <<>>, key)
      set == CreateBuiltinFunction(get.s, <<"Class", "accessSet">>, 2, <<>>, key)
      has == CreateBuiltinFunction(set.s, <<"Class", "accessHas">>, 1, N("has"), key)
      o == OrdinaryObjectCreate(has.s, Intrinsic(has.s, "ObjectPrototype"))
      props == (IF kind \in {"field", "method", "accessor", "getter"} THEN <<<<SV("get"), Val(get)>>>> ELSE <<>>) \o
               (IF kind \in {"field", "accessor", "setter"} THEN <<<<SV("set"), Val(set)>>>> ELSE <<>>) \o
               <<<<SV("has"), Val(has)>>>>
  IN [s |-> SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), props)), v |-> Val(o)]
FinishDecoration(s, add) == SetO(s, add, [O(s, add) EXCEPT !.slots.data.isFinished = TRUE])

\* ApplyDecoratorsToElementDefinition: each decorator in turn is called with the element's value
\* and a context, and what it returns replaces the value or adds an initializer. A field's or
\* auto-accessor's decorators add to its own list, and a method's to extra.
ApplyElementDecorators(s, e, extra, isStatic) ==
  IF e.decorators = <<>> THEN Ok(s, e) ELSE
  LET list == IF e.kind \in {"field", "accessor"} THEN NewInitializerList(s, TRUE) ELSE [s |-> s, v |-> extra]
  IN ElementDecoratorsFrom(list.s, [e EXCEPT !.decorators = <<>>, !.extra = IF e.kind \in {"field", "accessor"} THEN list.v ELSE @],
                           e.decorators, list.v, isStatic)
ElementDecoratorsFrom(s, e, decorators, list, isStatic) ==
  IF decorators = <<>> THEN Ok(s, e) ELSE
  LET context == DecoratorContext(s, e.kind, e.key, list, isStatic)
      pair == IF e.kind # "accessor" THEN [s |-> context.s, v |-> Empty]
              ELSE LET o == OrdinaryObjectCreate(context.s, Intrinsic(context.s, "ObjectPrototype")) IN
                   [s |-> SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), <<<<SV("get"), e.get>>, <<SV("set"), e.set>>>>)), v |-> Val(o)]
      value == CASE e.kind = "method" -> e.value [] e.kind = "getter" -> e.get [] e.kind = "setter" -> e.set
                 [] e.kind = "accessor" -> pair.v [] OTHER -> Undefined
      r == Call(pair.s, Head(decorators).decorator, Head(decorators).receiver, <<value, context.v>>)
      updated == DecoratedElement(FinishDecoration(r.s, context.add), e, Val(r))
  IN CASE IsAbrupt(r) -> r
       [] IsAbrupt(updated) -> updated
       [] OTHER -> ElementDecoratorsFrom(updated.s, Val(updated), Tail(decorators), list, isStatic)
\* The element with what one of its decorators returned, v.
DecoratedElement(s, e, v) ==
  CASE e.kind = "accessor" /\ IsObject(v) -> DecoratedAccessor(s, e, v)
    [] v = Undefined -> Ok(s, e)
    [] e.kind = "accessor" \/ ~IsCallable(s, v) -> ThrowTypeError(s)
    [] e.kind = "field" -> Ok(s, [e EXCEPT !.initializers = <<v>> \o @])
    [] e.kind = "getter" -> Ok(s, [e EXCEPT !.get = v])
    [] e.kind = "setter" -> Ok(s, [e EXCEPT !.set = v])
    [] OTHER -> Ok(s, [e EXCEPT !.value = v])

DecoratedAccessor(s, e, v) ==
  LET get == Get(s, v, SV("get"))
      set == Get(get.s, v, SV("set"))
      init == Get(set.s, v, SV("init"))
  IN CASE IsAbrupt(get) -> get
       [] ~IsCallable(get.s, Val(get)) /\ Val(get) # Undefined -> ThrowTypeError(get.s)
       [] IsAbrupt(set) -> set
       [] ~IsCallable(set.s, Val(set)) /\ Val(set) # Undefined -> ThrowTypeError(set.s)
       [] IsAbrupt(init) -> init
       [] ~IsCallable(init.s, Val(init)) /\ Val(init) # Undefined -> ThrowTypeError(init.s)
       [] OTHER -> Ok(init.s, [e EXCEPT !.get = IF Val(get) = Undefined THEN @ ELSE Val(get),
                                        !.set = IF Val(set) = Undefined THEN @ ELSE Val(set),
                                        !.initializers = IF Val(init) = Undefined THEN @ ELSE <<Val(init)>> \o @])

\* ApplyDecoratorsToClassDefinition: each class decorator in turn may replace the class.
ApplyClassDecorators(s, F, decorators, name, list) ==
  IF decorators = <<>> THEN Ok(s, F) ELSE
  LET context == DecoratorContext(s, "class", name, list, FALSE)
      r == Call(context.s, Head(decorators).decorator, Head(decorators).receiver, <<F, context.v>>)
      s1 == FinishDecoration(r.s, context.add)
  IN CASE IsAbrupt(r) -> r
       [] Val(r) = Undefined -> ApplyClassDecorators(s1, F, Tail(decorators), name, list)
       [] IsCallable(s1, Val(r)) -> ApplyClassDecorators(s1, Val(r), Tail(decorators), name, list)
       [] OTHER -> ThrowTypeError(s1)

\* The built-in functions decorators reach: addInitializer, the access object's get, set, and has,
\* and an auto-accessor's getter and setter.
DecoratorBuiltin(s, f, m, this, args) ==
  LET data == O(s, f).slots.data
      obj == Arg(args, 1)
  IN CASE m = "addInitializer" /\ (data.isFinished \/ ~IsCallable(s, obj)) -> ThrowTypeError(s)
       [] m = "addInitializer" ->
            Ok(SetO(s, data.list, [O(s, data.list) EXCEPT !.slots.initializers = Append(@, obj)]), Undefined)
       [] m \in {"accessGet", "accessSet", "accessHas"} /\ ~IsObject(obj) -> ThrowTypeError(s)
       [] m = "accessGet" -> IF data.type = "private" THEN PrivateGet(s, obj, data) ELSE Get(s, obj, data)
       [] m = "accessSet" ->
            LET r == IF data.type = "private" THEN PrivateSet(s, obj, data, Arg(args, 2)) ELSE Set(s, obj, data, Arg(args, 2), TRUE)
            IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)
       [] m = "accessHas" ->
            IF data.type = "private" THEN Ok(s, Bool(PrivateElementFind(s, obj, data) # Empty)) ELSE HasProperty(s, obj, data)
       [] ~IsObject(this) -> ThrowTypeError(s)
       [] m = "autoAccessorGet" -> PrivateGet(s, this, data)
       [] OTHER -> LET r == PrivateSet(s, this, data, obj) IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)

\* BindingClassDeclarationEvaluation (§15.7.15).
\* decorators are the class's Decorator nodes, which an export declaration may hold in its place.
BindingClassDeclarationEvaluation(s, ctx, n, decorators) ==
  IF Has(n.BindingIdentifier) THEN
    ClassBindingThen(ctx, n.BindingIdentifier.name,
                     ClassDefinitionEvaluation(s, ctx, n.ClassTail, n.BindingIdentifier.name, Str(n.BindingIdentifier.name),
                                               n.sourceText, decorators))
  ELSE ClassDefinitionEvaluation(s, ctx, n.ClassTail, Empty, SV("default"), n.sourceText, decorators)

ClassBindingThen(ctx, name, r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET b == InitializeBinding(r.s, ctx.lex, name, Val(r)) IN
  IF IsAbrupt(b) THEN b ELSE Ok(b.s, Val(r))

\* ClassExpression evaluation (§15.7.16).
EvaluateClassExpression(s, ctx, n, name) ==
  IF Has(n.BindingIdentifier) THEN
    ClassDefinitionEvaluation(s, ctx, n.ClassTail, n.BindingIdentifier.name, Str(n.BindingIdentifier.name), n.sourceText,
                              DecoratorsOf(n))
  ELSE ClassDefinitionEvaluation(s, ctx, n.ClassTail, Empty, IF name = Empty THEN EmptyStr ELSE name, n.sourceText,
                                 DecoratorsOf(n))

\* The default constructor (step 14.a of ClassDefinitionEvaluation).
DefaultConstructorCall(s, f, args, newTarget) ==
  IF newTarget = Undefined THEN ThrowTypeError(s)
  ELSE LET result ==
             IF O(s, f).slots.ctorKind = "derived" THEN
               LET func == O(s, f).proto IN
               IF ~IsConstructor(s, func) THEN ThrowTypeError(s) ELSE Construct(s, func, args, newTarget)
             ELSE OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", [none |-> TRUE])
       IN IF IsAbrupt(result) THEN result ELSE
          LET i == InitializeInstanceElements(result.s, Val(result), f) IN
          IF IsAbrupt(i) THEN i ELSE Ok(i.s, Val(result))

\* The super keyword (§13.3.7.1).
EvaluateSuperCall(s, ctx, n) ==
  LET thisEnv == GetThisEnvironment(s, ctx.lex)
      newTarget == E(s, thisEnv).newTarget
      func == O(s, E(s, thisEnv).fn).proto
  IN SuperCallThen(thisEnv, func, newTarget, ArgumentListEvaluation(s, ctx, n.Arguments))
SuperCallThen(thisEnv, func, newTarget, args) ==
  IF IsAbrupt(args) THEN args
  ELSE IF ~IsConstructor(args.s, func) THEN ThrowTypeError(args.s)
  ELSE LET result == Construct(args.s, func, Val(args), newTarget) IN
     IF IsAbrupt(result) THEN result ELSE
     LET b == BindThisValue(result.s, thisEnv, Val(result)) IN
     IF IsAbrupt(b) THEN b ELSE
     LET i == InitializeInstanceElements(b.s, Val(result), E(b.s, thisEnv).fn) IN
     IF IsAbrupt(i) THEN i ELSE Ok(i.s, Val(result))
