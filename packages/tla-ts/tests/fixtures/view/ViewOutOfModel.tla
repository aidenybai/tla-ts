---- MODULE ViewOutOfModel ----
EXTENDS Naturals
VARIABLES x
Init == x = 0
Next == x' = x + 1
Spec == Init /\ [][Next]_x
Bound == x <= 2
V == IF x > 2 THEN CHOOSE y \in {} : TRUE ELSE x
====
