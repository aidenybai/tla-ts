----------------------------- MODULE Extensions -----------------------------
EXTENDS Naturals, Sequences, TLC, TLCExt

VARIABLE x

ASSUME AssertEq(TLCNoOp(3), 3)
ASSUME TLCGetOrDefault(7, "none") = "none"
ASSUME TLCGetAndSet(7, +, 2, 40) = 40 /\ TLCGet(7) = 42
ASSUME ToString(TLCModelValue("m")) = "m"
ASSUME CounterExample = [action |-> {}, state |-> {}]
ASSUME AssertError("The first argument of Assert evaluated to FALSE; the second argument was:\n\"boom\"", Assert(FALSE, "boom"))

Init == x = 0

Next == x < 3 /\ x' = x + 1

Traced == Len(Trace) = x + 1 /\ Trace[Len(Trace)] = [x |-> x]

Short == Len(Trace) < 3
=============================================================================
