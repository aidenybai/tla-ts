---- MODULE RuntimeInvariants ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1 /\ PrintT(<<{"p", "q"}, TLCGet("spec").invariants>>)
Small == x < 4
Below(n) == x < n
====
