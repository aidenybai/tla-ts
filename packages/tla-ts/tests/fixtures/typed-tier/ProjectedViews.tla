---- MODULE ProjectedViews ----
EXTENDS Naturals
VARIABLES x, y, steps
pair == <<x, y>>
view == <<pair, x>>
Init == x = 0 /\ y = 0 /\ steps = 0
Next ==
  /\ steps < 6
  /\ steps' = steps + 1
  /\ \/ x < 3 /\ x' = x + 1 /\ y' = y
     \/ y < 2 /\ y' = y + 1 /\ x' = x
     \/ steps % 2 = 1 /\ x > 0 /\ x' = x - 1 /\ y' = 0
====
