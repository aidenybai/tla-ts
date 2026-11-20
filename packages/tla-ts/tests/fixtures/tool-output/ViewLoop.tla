---- MODULE ViewLoop ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x = 3 THEN 1 ELSE x + 1
Spec == Init /\ [][Next]_x /\ WF_x(Next)
View == IF PrintT(<<"view", x, TLCGet("level")>>) THEN x ELSE x
Live == <>(x = 5)
====
