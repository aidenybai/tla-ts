---- MODULE EqualStoredRecord ----
EXTENDS Integers, TLC
VARIABLES x, y
Init == x = <<1, 2>> /\ y = [a |-> 1, b |-> 2]
Next == UNCHANGED <<x, y>>
Inv == x # y
====
