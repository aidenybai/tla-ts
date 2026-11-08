---- MODULE ActionFails ----
EXTENDS Naturals
VARIABLES x, y
Init == x \in 0..1 /\ y = 0
Next ==
  \/ x < 4 /\ x' = x + 1 /\ UNCHANGED y
  \/ y < 3 /\ y' = y + 1 /\ UNCHANGED x
  \/ x = 4 /\ y = 3 /\ x' = 0 /\ y' = 0
Spec == Init /\ [][Next]_<<x, y>>
Rises == [][x' > x \/ x' = 0]_x
StartsLow == x < 2
Falls == [][y' < y]_y
====
