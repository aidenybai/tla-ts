---- MODULE ForallBranches ----
EXTENDS Naturals
VARIABLES now, flags
Init == now = 0 /\ flags = [n \in 1..2 |-> 0]
Next == /\ now < 3
        /\ \A n \in 1..2 : flags[n] # now \/ flags[n] = 0
        /\ now' = now + 1
        /\ UNCHANGED flags
====
