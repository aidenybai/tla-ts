---- MODULE IllegalInitialState ----
EXTENDS Naturals
VARIABLES x, y
Init == x \in {0, 1} /\ (x = 0 => y = 0)
Next == UNCHANGED <<x, y>>
====
