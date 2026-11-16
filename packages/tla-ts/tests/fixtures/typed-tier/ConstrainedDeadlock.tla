---- MODULE ConstrainedDeadlock ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next ==
  \/ x = 0 /\ x' = 5 /\ y' = 1
  \/ x = 0 /\ x' = 1 /\ y' = 2
  \/ x = 1 /\ y > 2 /\ x' = 2 /\ y' = y
Small == x <= 3
====
