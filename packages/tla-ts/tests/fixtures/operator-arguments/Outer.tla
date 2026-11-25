---- MODULE Outer ----
EXTENDS Naturals, TLC
VARIABLE x
I == INSTANCE Inner WITH y <- x
Inc(n) == n + 1
Init == x = 0
Next == I!Step(Inc) \/ I!Step(LAMBDA n : n + 2) \/ I!Step(LAMBDA n : n + x - x + 1)
Alias == [x |-> x, action |-> TLCGet("action")]
====
