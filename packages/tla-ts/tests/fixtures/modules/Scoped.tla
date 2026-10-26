------------------------------- MODULE Scoped -------------------------------
EXTENDS Naturals

VARIABLE count

Init == count = 0

Next == count' = count + 1

Spec == Init /\ [][Next]_count

Small == 0..3

Bounded == count \in Nat
=============================================================================
