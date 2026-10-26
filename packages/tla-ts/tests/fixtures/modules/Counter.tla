---- MODULE Counter ----
EXTENDS Naturals
CONSTANT Max
VARIABLE count

---- MODULE Step ----
CONSTANT By
Next == count + By <= Max /\ count' = count + By
====

Small == INSTANCE Step WITH By <- 1
Large == INSTANCE Step WITH By <- 2
Init == count = 0
Next == Small!Next \/ Large!Next
====
