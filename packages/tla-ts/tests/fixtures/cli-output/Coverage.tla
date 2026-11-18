---- MODULE Coverage ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
A == x < 3 /\ x' = x + 1
B == x > 0 /\ x' = x - 1
Next == A \/ B
Inv == x < 10
====
