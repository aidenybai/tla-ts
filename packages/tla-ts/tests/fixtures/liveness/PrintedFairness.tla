---- MODULE PrintedFairness ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3 \/ x' = x
Spec == Init /\ [][Next]_x /\ WF_x(PrintT("a") /\ Next)
Live == []<>(x = 0)
====
