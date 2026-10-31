---- MODULE CyclePrint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT("init")
Next == x' = (IF x < 3 THEN x + 1 ELSE 2) /\ PrintT(<<"n", x>>)
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Reaches == <>(x = 4)
====
