\* The core built-in functions (§19 to §23).
Arg(args, i) == IF i <= Len(args) THEN args[i] ELSE Undefined
Rest(args, i) == IF i > Len(args) THEN <<>> ELSE SubSeq(args, i, Len(args))
Index(i) == Str(NumToString(i))
OneNum == NumFromInt(1)

LibraryProperties ==
  << \* Function (§20.2).
     M("FunctionPrototype", SV("call"), "Function", "call", 1),
     M("FunctionPrototype", SV("apply"), "Function", "apply", 2),
     M("FunctionPrototype", SV("bind"), "Function", "bind", 1),
     M("FunctionPrototype", SV("toString"), "Function", "toString", 0),
     [M("FunctionPrototype", SymHasInstance, "Function", "hasInstance", 1) EXCEPT !.t = "mfixed"],
     \* AddRestrictedFunctionProperties (§10.2.4).
     Thrower("FunctionPrototype", SV("caller")), Thrower("FunctionPrototype", SV("arguments")),
     M("IteratorPrototype", SymIterator, "Iterator", "iterator", 0),
     \* The global object (§19) and the test262 host.
     M("GlobalObject", SV("print"), "Global", "print", 1),
     M("Host262", SV("gc"), "Global", "gc", 0),
     M("Host262", SV("evalScript"), "Global", "evalScript", 1),
     M("Host262", SV("createRealm"), "Global", "createRealm", 0) >>

\* Function (§20.2).
FunctionBuiltin(s, f, m, this, args, nt) ==
  CASE m = "prototype" -> Ok(s, Undefined)
    [] m = "constructor" -> CreateDynamicFunction(s, f, nt, "normal", args)
    [] m = "throwTypeError" -> ThrowTypeError(s)
    [] m = "call" -> IF ~IsCallable(s, this) THEN ThrowTypeError(s) ELSE Call(s, this, Arg(args, 1), Rest(args, 2))
    [] m = "apply" ->
         IF ~IsCallable(s, this) THEN ThrowTypeError(s)
         ELSE IF IsNullish(Arg(args, 2)) THEN Call(s, this, Arg(args, 1), <<>>)
         ELSE LET l == CreateListFromArrayLike(s, Arg(args, 2), "all") IN
              IF IsAbrupt(l) THEN l ELSE Call(l.s, this, Arg(args, 1), Val(l))
    [] m = "bind" -> FunctionBind(s, this, Arg(args, 1), Rest(args, 2))
    [] m = "toString" ->
         IF ~IsCallable(s, this) THEN ThrowTypeError(s)
         ELSE LET slots == O(s, this).slots IN
              IF "sourceText" \in DOMAIN slots THEN Ok(s, Str(slots.sourceText))
              ELSE Ok(s, Str(N("function ") \o (IF "initialName" \in DOMAIN slots THEN NativeFunctionName(slots.initialName) ELSE <<>>)
                             \o N("() { [native code] }")))
    [] m = "hasInstance" -> OrdinaryHasInstance(s, this, Arg(args, 1))
    [] m \in {"caller", "arguments"} ->
         IF ~IsSloppyFunction(s, this) THEN ThrowTypeError(s) ELSE FunctionCallFrom(s, this, m, s.callers)

\* A built-in function's initial name as NativeFunction's accessor and PropertyName: as a computed
\* name holding a string literal when it isn't an identifier or a computed name, as for RegExp's
\* "get $&".
NativeFunctionName(name) ==
  LET accessor == IF Len(name) > 4 /\ SubSeq(name, 1, 4) \in {N("get "), N("set ")} THEN 4 ELSE 0
      key == SubSeq(name, accessor + 1, Len(name))
  IN IF key = <<>> \/ key[1] = 91 \/ \A i \in DOMAIN key : IsAsciiIdentifierUnit(key[i]) THEN name
     ELSE SubSeq(name, 1, accessor) \o N("[\"") \o key \o N("\"]")
IsAsciiIdentifierUnit(c) == c = 36 \/ c = 95 \/ (c >= 48 /\ c <= 57) \/ (c >= 65 /\ c <= 90) \/ (c >= 97 /\ c <= 122)

\* The function that made the innermost active call of f, when it is non-strict, and otherwise null;
\* or a fresh arguments object of that call's arguments, or null when f is not active.
IsSloppyFunction(s, f) == IsObject(f) /\ O(s, f).class = "function" /\ ~O(s, f).slots.strict
FunctionCallFrom(s, f, m, frame) ==
  CASE frame = Null -> Ok(s, Null)
    [] frame.f # f -> FunctionCallFrom(s, f, m, frame.next)
    [] m = "arguments" -> LET a == CreateUnmappedArgumentsObject(s, frame.args) IN Ok(a.s, a.v)
    [] frame.next # Null /\ IsSloppyFunction(s, frame.next.f) -> Ok(s, frame.next.f)
    [] OTHER -> Ok(s, Null)

\* Function.prototype.bind (§20.2.3.2).
FunctionBind(s, target, this, args) ==
  IF ~IsCallable(s, target) THEN ThrowTypeError(s)
  ELSE LET F == BoundFunctionCreate(s, target, this, args) IN IF IsAbrupt(F) THEN F
  ELSE CopyNameAndLength(F.s, Val(F), target, N("bound"), Len(args))

\* CopyNameAndLength (§10.2.10), with prefix <<>> for none: F's length and name from target's.
CopyNameAndLength(s, F, target, prefix, argCount) ==
  LET has == HasOwnProperty(s, target, SV("length")) IN IF IsAbrupt(has) THEN has ELSE
  LET len == IF Val(has) = False THEN Ok(has.s, PosZero)
             ELSE LET l == Get(has.s, target, SV("length")) IN
                  IF IsAbrupt(l) \/ ~IsNumber(Val(l)) THEN [s |-> l.s, c |-> IF IsAbrupt(l) THEN l.c ELSE NormalCompletion(PosZero)]
                  ELSE LET x == Val(l).value IN
                       IF x = PosInf THEN Ok(l.s, PosInf)
                       ELSE IF x = NegInf THEN Ok(l.s, PosZero)
                       ELSE LET n == NumSub(NumToIntegerOrInfinity(x), NumFromInt(argCount)) IN
                            Ok(l.s, IF NumLess(n, PosZero) THEN PosZero ELSE NumAdd(n, PosZero))
  IN IF IsAbrupt(len) THEN len ELSE
     LET s1 == SetO(len.s, F, PutProp(O(len.s, F), SV("length"), DataDesc(Num(Val(len)), FALSE, FALSE, TRUE)))
         name == Get(s1, target, SV("name"))
     IN IF IsAbrupt(name) THEN name
        ELSE Ok(SetFunctionName(name.s, F, IF IsString(Val(name)) THEN Val(name) ELSE EmptyStr, prefix), F)

\* A relative index argument (as Array.prototype.slice reads start and end), clamped to 0..len.
RelativeIndex(s, v, len, default) ==
  IF v = Undefined THEN Ok(s, default)
  ELSE LET n == ToIntegerOrInfinity(s, v) IN IF IsAbrupt(n) THEN n ELSE
       LET x == Val(n).value IN
       Ok(n.s, CASE x = NegInf -> PosZero
                 [] NumLess(x, PosZero) -> (LET k == NumAdd(len, x) IN IF NumLess(k, PosZero) THEN PosZero ELSE k)
                 [] NumLess(len, x) -> len
                 [] OTHER -> NumAdd(x, PosZero))

\* %ForInIteratorPrototype%.next (§14.7.5.10.2.1).
ForInIteratorNext(s, this) ==
  LET slots == O(s, this).slots IN
  IF slots.object = Null THEN CreateIterResultObject(s, Undefined, TRUE)
  ELSE LET loaded ==
             IF slots.visited THEN Ok(s, slots.remaining)
             ELSE LET ks == OwnPropertyKeys(s, slots.object) IN
                  IF IsAbrupt(ks) THEN ks ELSE Ok(ks.s, SelectSeq(Val(ks), IsString))
       IN IF IsAbrupt(loaded) THEN loaded
          ELSE ForInRemaining(loaded.s, this, slots.object, Val(loaded), slots.visitedKeys)
ForInRemaining(s, this, object, remaining, visitedKeys) ==
  IF remaining = <<>> THEN
    LET p == GetPrototypeOf(s, object) IN IF IsAbrupt(p) THEN p ELSE
    LET s1 == SetO(p.s, this, [O(p.s, this) EXCEPT !.slots.object = Val(p), !.slots.visited = FALSE,
                                                   !.slots.remaining = <<>>, !.slots.visitedKeys = visitedKeys])
    IN ForInIteratorNext(s1, this)
  ELSE LET r == Head(remaining) IN
  IF r \in Range(visitedKeys) THEN ForInRemaining(s, this, object, Tail(remaining), visitedKeys)
  ELSE LET d == GetOwnProperty(s, object, r) IN IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent THEN ForInRemaining(d.s, this, object, Tail(remaining), visitedKeys)
  ELSE IF Val(d).enumerable # True THEN ForInRemaining(d.s, this, object, Tail(remaining), Append(visitedKeys, r))
  ELSE CreateIterResultObject(SetO(d.s, this, [O(d.s, this) EXCEPT !.slots.visited = TRUE, !.slots.remaining = Tail(remaining),
                                                                   !.slots.visitedKeys = Append(visitedKeys, r)]), r, FALSE)


\* Functions of the global object and the test262 host.
GlobalBuiltin(s, f, m, this, args, nt) ==
  CASE m = "print" ->
         LET str == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(str) THEN str
         ELSE Ok([str.s EXCEPT !.out = Append(@, Val(str).value)], Undefined)
    [] m = "gc" -> Ok(s, Undefined)
    \* $262.IsHTMLDDA, which returns null when called with no arguments or "".
    [] m = "IsHTMLDDA" -> Ok(s, Null)
    [] m = "evalScript" -> EvalScript(s, Arg(args, 1))
    [] m = "eval" -> PerformEval(s, ScriptContext(s), Arg(args, 1), FALSE, FALSE)
    [] m = "createRealm" -> CreateRealm(s)
    [] OTHER -> Unsupported(s, N("Unsupported: $262 host function"))

IteratorBuiltin(s, f, m, this, args, nt) == Ok(s, this)
ForInIteratorBuiltin(s, f, m, this, args, nt) == ForInIteratorNext(s, this)
ClassBuiltin(s, f, m, this, args, nt) ==
  IF m = "default" THEN DefaultConstructorCall(s, f, args, nt) ELSE DecoratorBuiltin(s, f, m, this, args)
