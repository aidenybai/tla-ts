---- MODULE Admitted ----
EXTENDS Naturals
VARIABLE x
Init == x = 1
Next == x < 512 /\ x' \in {2 * x, 2 * x + 1}
====
