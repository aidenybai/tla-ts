---- MODULE ConstantFunctions ----
EXTENDS Naturals
VARIABLE x
F[n \in 0..20000] == n + 1
Init == x = 0
Next == x < 20000 /\ x' = F[x]
====
