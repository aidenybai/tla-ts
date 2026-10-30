---- MODULE Always ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 3 /\ x' = x + 1
Spec == Init /\ [][Next]_x
Small == x < 2
AlwaysSmall == []Small
====
