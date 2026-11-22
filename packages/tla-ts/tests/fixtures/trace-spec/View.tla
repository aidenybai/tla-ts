---- MODULE View ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == \/ x < 2 /\ x' = x + 1 /\ y' = y
        \/ y < 3 /\ y' = y + 1 /\ x' = x
Inv == x < 2
View == x
====
