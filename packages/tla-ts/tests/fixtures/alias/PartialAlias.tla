---- MODULE PartialAlias ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x + 1 /\ y' = y
Alias == CASE x \in {0, 3} -> [x |-> x, y |-> 100] [] x = 1 -> [x |-> x, y |-> 1 \div 0] [] OTHER -> x
Inv == x < 5
====
