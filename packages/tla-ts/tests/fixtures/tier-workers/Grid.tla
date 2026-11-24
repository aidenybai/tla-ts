---- MODULE Grid ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == \/ x < 40 /\ x' = x + 1 /\ y' = y
        \/ y < 40 /\ y' = y + 1 /\ x' = x
====
