---- MODULE AliasErrors ----
EXTENDS Integers
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == y' = y + 1 /\ x' = x
Alias == [x |-> x, inv |-> 1 \div x]
Inv == y < 3
====
