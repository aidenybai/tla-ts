---- MODULE LiveDeadlock ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y \in {0, 1}
Next == x < 3 /\ x' = x + 1 /\ y' = 1 - y
Spec == Init /\ [][Next]_<<x, y>> /\ WF_<<x, y>>(Next)
Reaches == <>(x = 3)
====
