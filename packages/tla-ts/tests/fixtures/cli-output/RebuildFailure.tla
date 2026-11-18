---- MODULE RebuildFailure ----
EXTENDS Integers, TLC
VARIABLE x
Init == x = 0 /\ PrintT("i")
Next == PrintT(<<"n", x>>) /\ (x' = x + 1 \/ (x = 1 /\ x' = 5 /\ PrintT("b") /\ 1))
Inv == x < 2
====
