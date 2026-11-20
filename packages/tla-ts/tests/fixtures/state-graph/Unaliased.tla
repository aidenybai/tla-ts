---- MODULE Unaliased ----
EXTENDS Integers
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 3 /\ x' = x + 1 /\ y' = 0
Alias == IF x = 0 THEN [x |-> x, y |-> 5] ELSE 7
====
