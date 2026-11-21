---- MODULE StreamedSteps ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next ==
  /\ x' \in {x, (x + 1) % 4} \cup {(x + 1) % 4, (x + 2) % 4}
  /\ y' = (y + x') % 3
====
