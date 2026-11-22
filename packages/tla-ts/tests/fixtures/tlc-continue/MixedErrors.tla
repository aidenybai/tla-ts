---- MODULE MixedErrors ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
Next == x = 0 /\ x' = 2
Inv == x /= 2
====
