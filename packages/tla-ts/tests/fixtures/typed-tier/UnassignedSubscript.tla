---- MODULE UnassignedSubscript ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 2 /\ x' = x + 1 /\ y' = y
Spec == Init /\ [][Next]_<<x, y>> /\ WF_<<x, y>>(x < 2 /\ x' = x + 1)
Done == <>(x = 2)
====
