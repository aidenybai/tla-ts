---- MODULE ViolatedCounters ----
EXTENDS Naturals
VARIABLES x, y
Init == x \in 0..2 /\ y = 0
Next ==
  \/ x < 6 /\ x' = x + 1 /\ y' = y
  \/ y < x /\ y' = y + 2 /\ x' = x
  \/ x' = x /\ y' = y
Bounded == x + y < 9
====
