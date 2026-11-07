---- MODULE ViewImpure ----
EXTENDS Naturals, TLC
VARIABLES x
Init == x = 0
Next == x' = (x + 1) % 2 /\ TLCGet("level") < 5
Spec == Init /\ [][Next]_x
V == <<x, TLCGet("level")>>
====
