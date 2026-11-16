---- MODULE PartialSteps ----
EXTENDS Naturals

VARIABLES x, y

Init == x = 0 /\ y = 0

\* The second disjunct leaves y unassigned, which TLC reports only where it reaches it.
Next ==
  \/ x < 3 /\ x' = x + 1 /\ y' = y
  \/ x = 10 /\ x' = 0
====
