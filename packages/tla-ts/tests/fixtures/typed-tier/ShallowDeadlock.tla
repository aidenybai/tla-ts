---- MODULE ShallowDeadlock ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y \in 0..1
Next ==
  \/ x < 3 /\ x' = x + 1 /\ y' = y
  \/ x = 0 /\ y = 1 /\ x' = 5 /\ y' = 2
====
