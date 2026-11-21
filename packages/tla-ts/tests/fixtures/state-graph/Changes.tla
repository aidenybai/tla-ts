---- MODULE Changes ----
EXTENDS Integers
VARIABLES x, y
Init == x = 0 /\ y = 0
Inc == x < 2 /\ x' = x + 1 /\ y' = y
Both == x = 2 /\ x' = 0 /\ y' = 1 - y
Next == Inc \/ Both
Alias == [sum |-> x + y, y |-> y, odd |-> x % 2]
====
