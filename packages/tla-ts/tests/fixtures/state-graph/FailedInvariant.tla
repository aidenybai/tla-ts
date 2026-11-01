---- MODULE FailedInvariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x < 3 /\ x' = x + 1
B == x < 3 /\ x' = x + 2
Next == A \/ B
Inv == x # 3 \/ CHOOSE n \in {} : TRUE
====
