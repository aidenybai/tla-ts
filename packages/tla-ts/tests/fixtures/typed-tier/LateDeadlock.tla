---- MODULE LateDeadlock ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2000 /\ x' = x + 1
Spec == Init /\ [][Next]_x
Reaches == <>(x = 2000)
====
