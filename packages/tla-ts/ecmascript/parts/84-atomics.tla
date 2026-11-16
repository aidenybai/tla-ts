\* The Atomics object (§25.4) for a single agent. No other agent shares a block, so every
\* operation is atomic as it stands, and only this agent's asynchronous waits wait on a waiter
\* list. The state's canSuspend is AgentCanSuspend().

\* ValidateIntegerTypedArray (§25.4.3.1), with the length as the value, for an access that writes
\* or only reads.
ValidateIntegerTypedArray(s, ta, waitable, isWrite) ==
  LET v == IF isWrite THEN ValidateTypedArrayForWrite(s, ta) ELSE ValidateTypedArray(s, ta) IN
  IF IsAbrupt(v) THEN v
  ELSE LET type == TypedArrayType(s, ta) IN
  IF ~IsUnclampedIntegerElementType(type) /\ ~IsBigIntElementType(type) THEN ThrowTypeError(s)
  ELSE IF waitable /\ type \notin {"int32", "bigint64"} THEN ThrowTypeError(s)
  ELSE v

\* ValidateAtomicAccess (§25.4.3.2): the byte index of requestIndex in the buffer.
ValidateAtomicAccess(s, ta, length, requestIndex) ==
  LET i == ToIndex(s, requestIndex) IN
  IF IsAbrupt(i) THEN i
  ELSE IF ~NumLess(Val(i).value, NumFromInt(length)) THEN ThrowError(i.s, "RangeError")
  ELSE Ok(i.s, NumToSmallInt(Val(i).value) * TypedArraySize(i.s, ta) + O(i.s, ta).slots.byteOffset)

\* ValidateAtomicAccessOnIntegerTypedArray (§25.4.3.3).
ValidateAtomicAccessOnIntegerTypedArray(s, ta, requestIndex, isWrite) ==
  LET v == ValidateIntegerTypedArray(s, ta, FALSE, isWrite) IN
  IF IsAbrupt(v) THEN v ELSE ValidateAtomicAccess(v.s, ta, Val(v), requestIndex)

\* RevalidateAtomicAccess (§25.4.3.4).
RevalidateAtomicAccess(s, ta, byteIndex) ==
  LET v == ValidateTypedArrayBounds(s, ta) IN
  IF IsAbrupt(v) THEN v
  ELSE IF byteIndex + TypedArraySize(s, ta) - 1 >= ArrayBufferByteLength(s, O(s, ta).slots.buffer)
  THEN ThrowError(s, "RangeError")
  ELSE v

\* An Atomics value argument as the TypedArray's content type: a BigInt, or
\* 𝔽(ToIntegerOrInfinity(v)).
AtomicValue(s, ta, v) == IF IsBigIntTypedArray(s, ta) THEN ToBigInt(s, v) ELSE ToIntegerOrInfinity(s, v)

\* The read-modify-write modification functions of add, and, exchange, or, sub, and xor.
AtomicModify(op, type, xBytes, yBytes) ==
  CASE op = "exchange" -> yBytes
    [] op \in {"and", "or", "xor"} ->
         LET bitwise == CASE op = "and" -> "&" [] op = "or" -> "|" [] op = "xor" -> "^"
         IN [i \in DOMAIN xBytes |-> SmallBitwise(bitwise, xBytes[i], yBytes[i], 1)]
    [] OTHER ->
         LET x == RawBytesToNumeric(type, xBytes, LittleEndian)
             y == RawBytesToNumeric(type, yBytes, LittleEndian)
             result == CASE IsBigInt(x) /\ op = "add" -> BigInt(BigIntAdd(x.value, y.value))
                         [] IsBigInt(x) -> BigInt(BigIntSub(x.value, y.value))
                         [] op = "add" -> Num(NumAdd(x.value, y.value))
                         [] OTHER -> Num(NumSub(x.value, y.value))
         IN NumericToRawBytes(type, result, LittleEndian)

\* AtomicReadModifyWrite (§25.4.3.17) with GetModifySetValueInBuffer (§25.1.3.19).
AtomicReadModifyWrite(s, ta, index, value, op) ==
  LET byteIndex == ValidateAtomicAccessOnIntegerTypedArray(s, ta, index, TRUE) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
  LET v == AtomicValue(byteIndex.s, ta, value) IN IF IsAbrupt(v) THEN v ELSE
  LET r == RevalidateAtomicAccess(v.s, ta, Val(byteIndex)) IN IF IsAbrupt(r) THEN r ELSE
  LET buffer == O(r.s, ta).slots.buffer
      type == TypedArrayType(r.s, ta)
      read == BufferBytes(r.s, buffer, Val(byteIndex), ElementSize(type))
      modified == AtomicModify(op, type, read, NumericToRawBytes(type, Val(v), LittleEndian))
  IN Ok(SetBufferBytes(r.s, buffer, Val(byteIndex), modified), RawBytesToNumeric(type, read, LittleEndian))

\* DoWait (§25.4.3.14). The state's waiters holds the Waiter Records of the asynchronous waits,
\* [buffer, byteIndex, capability, deadline] in the order they began, with deadline the Number
\* time they time out at or Empty. A synchronous wait suspends the agent until it times out, so
\* it never ends when its timeout is infinite, since no agent is left to notify it.
DoWait(s, mode, ta, index, value, timeout) ==
  LET v == ValidateIntegerTypedArray(s, ta, TRUE, FALSE) IN IF IsAbrupt(v) THEN v ELSE
  LET buffer == O(v.s, ta).slots.buffer IN
  IF ~IsSharedArrayBuffer(v.s, buffer) THEN ThrowTypeError(v.s)
  ELSE LET byteIndex == ValidateAtomicAccess(v.s, ta, Val(v), index) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
  LET type == TypedArrayType(byteIndex.s, ta)
      expected == IF type = "bigint64" THEN ToBigInt(byteIndex.s, value) ELSE ToInt32(byteIndex.s, value)
  IN IF IsAbrupt(expected) THEN expected ELSE
     LET t == ToNumber(expected.s, timeout) IN IF IsAbrupt(t) THEN t
     ELSE IF mode = "sync" /\ ~t.s.canSuspend THEN ThrowTypeError(t.s) ELSE
     LET timeoutNumber == Val(t).value
         isInfinite == NumIsNaN(timeoutNumber) \/ timeoutNumber = PosInf
         isZero == timeoutNumber.neg \/ NumIsZero(timeoutNumber)
         deadline == IF isInfinite THEN Empty ELSE NumAdd(SystemTime(t.s), IF isZero THEN PosZero ELSE timeoutNumber)
         cap == IF mode = "sync" THEN Ok(t.s, Empty) ELSE NewPromiseCapability(t.s, Intrinsic(t.s, "Promise"))
         expectedValue == IF type = "bigint64" THEN BigInt(BigIntFromBits64(BigInt64Bits(Val(expected).value)))
                          ELSE Val(expected)
         witness == GetValueFromBuffer(cap.s, buffer, Val(byteIndex), type, LittleEndian)
         result(rs, isAsync, outcome) ==
           IF mode = "sync" THEN Ok(rs, outcome)
           ELSE LET o == OrdinaryObjectCreate(rs, Intrinsic(rs, "ObjectPrototype"))
                IN Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), <<<<SV("async"), isAsync>>, <<SV("value"), outcome>>>>)),
                      Val(o))
     IN IF expectedValue # witness THEN result(cap.s, False, SV("not-equal"))
        ELSE IF mode = "async" /\ isZero THEN result(cap.s, False, SV("timed-out"))
        ELSE IF mode = "async" THEN
          result([cap.s EXCEPT !.waiters = Append(@, [buffer |-> buffer, byteIndex |-> Val(byteIndex),
                                                      capability |-> Val(cap), deadline |-> deadline])],
                 True, Val(cap).promise)
        ELSE IF isInfinite THEN Unsupported(t.s, N("Unsupported: Atomics.wait with no agent to notify it"))
        ELSE result(PassTime(t.s, deadline), False, SV("timed-out"))

\* The state with the clock moved on to time, when time is later and the clock can hold it.
PassTime(s, time) ==
  IF NumLess(SystemTime(s), time) /\ NumLess(time, NumFromInt(IntLimit))
  THEN [s EXCEPT !.clock = NumToSmallInt(MathCeil(time))]
  ELSE s

\* NotifyWaiter (§25.4.3.12) for each of waiters, which wait in this agent.
ResolveWaiters(s, waiters, outcome) ==
  IF waiters = <<>> THEN s
  ELSE ResolveWaiters(Call(s, Head(waiters).capability.resolve, Undefined, <<outcome>>).s, Tail(waiters), outcome)

\* RemoveWaiters (§25.4.3.10) and NotifyWaiter for the waiters on a location: [s, count] with
\* count how many of them it woke, at most the Number limit.
NotifyWaiters(s, buffer, byteIndex, limit) ==
  LET at == SelectSeq(s.waiters, LAMBDA w : w.buffer = buffer /\ w.byteIndex = byteIndex)
      count == CASE limit.neg -> 0
                 [] NumLess(limit, NumFromInt(Len(at))) -> NumToSmallInt(limit)
                 [] OTHER -> Len(at)
      woken == SubSeq(at, 1, count)
  IN [s |-> ResolveWaiters([s EXCEPT !.waiters = SelectSeq(@, LAMBDA w : w \notin Range(woken))], woken, SV("ok")),
      count |-> count]

\* The job of EnqueueAtomicsWaitAsyncTimeoutJob (§25.4.3.15) that the host runs first once no
\* other job is left: the one for the waiter with the earliest deadline, which began first.
TimeOutWaiter(s) ==
  LET timed == {i \in DOMAIN s.waiters : s.waiters[i].deadline # Empty}
      first == CHOOSE i \in timed : \A j \in timed : NumLess(s.waiters[i].deadline, s.waiters[j].deadline)
                                                    \/ (s.waiters[i].deadline = s.waiters[j].deadline /\ i <= j)
      w == s.waiters[first]
  IN ResolveWaiters(PassTime([s EXCEPT !.waiters = SelectSeq(@, LAMBDA x : x # w)], w.deadline), <<w>>, SV("timed-out"))

AtomicsIntrinsics == << IntrinsicObject("Atomics", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

AtomicsProperties ==
  << M("Atomics", SV("add"), "Atomics", "add", 3),
     M("Atomics", SV("and"), "Atomics", "and", 3),
     M("Atomics", SV("compareExchange"), "Atomics", "compareExchange", 4),
     M("Atomics", SV("exchange"), "Atomics", "exchange", 3),
     M("Atomics", SV("isLockFree"), "Atomics", "isLockFree", 1),
     M("Atomics", SV("load"), "Atomics", "load", 2),
     M("Atomics", SV("notify"), "Atomics", "notify", 3),
     M("Atomics", SV("or"), "Atomics", "or", 3),
     M("Atomics", SV("pause"), "Atomics", "pause", 0),
     M("Atomics", SV("store"), "Atomics", "store", 3),
     M("Atomics", SV("sub"), "Atomics", "sub", 3),
     M("Atomics", SV("wait"), "Atomics", "wait", 4),
     M("Atomics", SV("waitAsync"), "Atomics", "waitAsync", 4),
     M("Atomics", SV("xor"), "Atomics", "xor", 3),
     V("Atomics", SymToStringTag, SV("Atomics"), FALSE, FALSE, TRUE),
     GlobalLink("Atomics", N("Atomics")) >>

\* The Atomics functions (§25.4.4 to §25.4.17).
AtomicsBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1)
      a2 == Arg(args, 2)
      a3 == Arg(args, 3)
  IN
  CASE m = "isLockFree" ->
         LET n == ToIntegerOrInfinity(s, a1) IN IF IsAbrupt(n) THEN n
         ELSE Ok(n.s, Bool(\E size \in {1, 2, 4, 8} : Val(n).value = NumFromInt(size)))
    [] m = "pause" -> Ok(s, Undefined)
    [] m = "compareExchange" ->
         LET byteIndex == ValidateAtomicAccessOnIntegerTypedArray(s, a1, a2, TRUE) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
         LET expected == AtomicValue(byteIndex.s, a1, a3) IN IF IsAbrupt(expected) THEN expected ELSE
         LET replacement == AtomicValue(expected.s, a1, Arg(args, 4)) IN IF IsAbrupt(replacement) THEN replacement ELSE
         LET r == RevalidateAtomicAccess(replacement.s, a1, Val(byteIndex)) IN IF IsAbrupt(r) THEN r ELSE
         LET buffer == O(r.s, a1).slots.buffer
             type == TypedArrayType(r.s, a1)
             read == BufferBytes(r.s, buffer, Val(byteIndex), ElementSize(type))
         IN Ok(IF read = NumericToRawBytes(type, Val(expected), LittleEndian)
               THEN SetBufferBytes(r.s, buffer, Val(byteIndex), NumericToRawBytes(type, Val(replacement), LittleEndian))
               ELSE r.s,
               RawBytesToNumeric(type, read, LittleEndian))
    [] m = "load" ->
         LET byteIndex == ValidateAtomicAccessOnIntegerTypedArray(s, a1, a2, FALSE) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
         LET r == RevalidateAtomicAccess(byteIndex.s, a1, Val(byteIndex)) IN IF IsAbrupt(r) THEN r
         ELSE Ok(r.s, GetValueFromBuffer(r.s, O(r.s, a1).slots.buffer, Val(byteIndex), TypedArrayType(r.s, a1), LittleEndian))
    [] m = "store" ->
         LET byteIndex == ValidateAtomicAccessOnIntegerTypedArray(s, a1, a2, TRUE) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
         LET v == AtomicValue(byteIndex.s, a1, a3) IN IF IsAbrupt(v) THEN v ELSE
         LET r == RevalidateAtomicAccess(v.s, a1, Val(byteIndex)) IN IF IsAbrupt(r) THEN r
         ELSE Ok(SetValueInBuffer(r.s, O(r.s, a1).slots.buffer, Val(byteIndex), TypedArrayType(r.s, a1), Val(v), LittleEndian),
                 Val(v))
    \* Atomics.notify (§25.4.12): the waiter list is empty, so it notifies no agent.
    [] m = "notify" ->
         LET v == ValidateIntegerTypedArray(s, a1, TRUE, FALSE) IN IF IsAbrupt(v) THEN v ELSE
         LET byteIndex == ValidateAtomicAccess(v.s, a1, Val(v), a2) IN IF IsAbrupt(byteIndex) THEN byteIndex ELSE
         LET count == IF a3 = Undefined THEN Ok(byteIndex.s, Num(PosInf)) ELSE ToIntegerOrInfinity(byteIndex.s, a3) IN
         IF IsAbrupt(count) THEN count
         ELSE IF ~IsSharedArrayBuffer(count.s, O(count.s, a1).slots.buffer) THEN Ok(count.s, IntV(0))
         ELSE LET r == NotifyWaiters(count.s, O(count.s, a1).slots.buffer, Val(byteIndex), Val(count).value)
              IN Ok(r.s, IntV(r.count))
    [] m = "wait" -> DoWait(s, "sync", a1, a2, a3, Arg(args, 4))
    [] m = "waitAsync" -> DoWait(s, "async", a1, a2, a3, Arg(args, 4))
    [] OTHER -> AtomicReadModifyWrite(s, a1, a2, a3, m)
