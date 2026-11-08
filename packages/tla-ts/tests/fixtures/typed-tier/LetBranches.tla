---- MODULE LetBranches ----
EXTENDS Naturals
VARIABLE now
Init == now = 0
Next == LET Step == TRUE \/ now > 0
        IN /\ now < 3
           /\ Step
           /\ now' = now + 1
====
