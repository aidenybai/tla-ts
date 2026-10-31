---- MODULE FailedInitialInvariant ----
EXTENDS Naturals, TLC
VARIABLES a, b
Init ==
    /\ a \in 1..2
    /\ b = TRUE
Next == UNCHANGED <<a, b>>
Inv == Assert(a = 2, "a is 1")
====
