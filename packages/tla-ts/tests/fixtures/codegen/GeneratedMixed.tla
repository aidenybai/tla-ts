---- MODULE GeneratedMixed ----
EXTENDS Naturals
VARIABLE x

Mixed == {1, "a"}

Init == x = 0
Next == x < 2 /\ x' = x + 1

Invariant ==
  /\ 1 \in Mixed
  /\ x = 0 \/ "a" \in Mixed
====
