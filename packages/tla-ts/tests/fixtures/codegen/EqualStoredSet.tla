---- MODULE EqualStoredSet ----
EXTENDS Integers, TLC
VARIABLES x, y
Init == x = {1, 2} /\ y = <<1, 2>>
Next == UNCHANGED <<x, y>>
Inv == x # y
====
