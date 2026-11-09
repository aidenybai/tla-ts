---- MODULE OperatorDomains ----
EXTENDS Naturals
VARIABLE x
Shifted == [s \in 1..3 |-> x + s]
Init == x = 0
Next == x' = Shifted[x + 1] % 5
====
