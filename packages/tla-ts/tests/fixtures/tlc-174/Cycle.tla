---- MODULE Cycle ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Reaches == <>(x = 2)
====
