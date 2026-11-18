---- MODULE PromotedWarning ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x' = 1 /\ UNCHANGED x
Next == x' = 0
Inv == ENABLED A
====
