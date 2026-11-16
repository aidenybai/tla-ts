---- MODULE ConstrainedViolation ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next ==
  \/ x < 4 /\ x' = x + 1 /\ y' = y
  \/ y' = y + 1 /\ x' = x
Small == y <= 2
Low == y < 3
====
