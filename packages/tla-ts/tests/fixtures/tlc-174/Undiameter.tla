---- MODULE Undiameter ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 - x
Spec == Init /\ [][Next]_x
Prop == <>[](x = 1 /\ TLCGet("diameter") > 0)
====
