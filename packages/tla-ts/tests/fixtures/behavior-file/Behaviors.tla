---- MODULE Behaviors ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
Next == \/ x < 3 /\ x % 2 = 0 /\ x' = x + 2
        \/ x = 1 /\ x' = 5
        \/ x = 5 /\ x' = x
====
