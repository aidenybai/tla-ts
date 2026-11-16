---- MODULE ArgumentBranches ----
EXTENDS Naturals
VARIABLE now
Both(A) == A /\ TRUE
Init == now = 0
Next == /\ now < 3
        /\ Both(TRUE \/ now > 0)
        /\ now' = now + 1
====
