---- MODULE ProjectedDeadlock ----
EXTENDS Naturals
VARIABLES x, steps
view == x
Init == x = 0 /\ steps = 0
Next ==
  /\ x < 4
  /\ \/ x' = x + 1 /\ steps' = steps + 1
     \/ x' = x + 1 /\ steps' = steps + 2
     \/ x' = x /\ steps' = steps + 3
====
