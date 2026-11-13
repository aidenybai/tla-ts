---- MODULE AssertFails ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next ==
  \/ /\ x < 6
     /\ Assert(x < 5, <<"x is too large", x>>)
     /\ x' = x + 1
     /\ y' = y
  \/ /\ y < 3
     /\ y' = y + 1
     /\ x' = IF Assert(y >= 0, "y is negative") THEN x ELSE 0
====
