---- MODULE LateCycle ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next ==
  \/ x < 40 /\ x' = x + 1 /\ y' = y
  \/ y < 40 /\ y' = y + 1 /\ x' = x
  \/ x = 40 /\ y = 40 /\ x' = 39 /\ y' = y
Spec == Init /\ [][Next]_<<x, y>> /\ WF_<<x, y>>(Next)
Settles == <>[](x = 40 /\ y = 40)
====
