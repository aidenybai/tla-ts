---- MODULE Inner ----
EXTENDS Naturals
VARIABLE y
Step(F(_)) == y < 3 /\ y' = F(y)
====
