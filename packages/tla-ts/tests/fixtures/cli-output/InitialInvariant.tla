---- MODULE InitialInvariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x = 1
====
