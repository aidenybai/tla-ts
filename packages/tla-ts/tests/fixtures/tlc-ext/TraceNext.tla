----------------------------- MODULE TraceNext -----------------------------
EXTENDS Naturals, Sequences, TLCExt

VARIABLE x

Init == x = 1

\* In the next-state relation, Trace ends in the state that the step extends.
Next == /\ x < 5
        /\ Trace = [i \in 1..x |-> [x |-> i]]
        /\ x' = x + 1
=============================================================================
