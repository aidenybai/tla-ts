---- MODULE Success ----
EXTENDS Naturals
VARIABLE x
Init == x \in 0..1
Next == x < 4 /\ x' \in {x + 1, x + 2}
====
