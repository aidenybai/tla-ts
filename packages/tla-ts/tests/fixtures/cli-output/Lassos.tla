---- MODULE Lassos ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Reach == <>(x = 5)
Settle == <>[](x = 0)
Stop == <>[](x = 2)
====
