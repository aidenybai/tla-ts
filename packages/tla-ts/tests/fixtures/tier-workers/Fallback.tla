---- MODULE Fallback ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y \in 0..9
Next == x < 30 /\ x' = x + 1 /\ y' = y /\ y \in 0..(IF x = 3 THEN 2000000 ELSE 9)
Inv == x < 6
====
