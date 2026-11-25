---- MODULE ContextUnion ----
EXTENDS Naturals
VARIABLE x
Step(S) == x < 3 /\ x' = x + 1
Init == x = 0
Next == Step(UNION {Nat})
Inv == x < 3
====
