---- MODULE Two ----
EXTENDS Naturals
VARIABLE count
Up == count < 2 /\ count' = count + 1
Down == count > 0 /\ count' = count - 1
TwoNext == Up \/ Down
====
