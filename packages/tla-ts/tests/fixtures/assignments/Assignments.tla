---- MODULE Assignments ----
EXTENDS Naturals

VARIABLES x, y, z

Alias == x
SetTo(variable, value) == variable = value

Init == Alias = 0 /\ SetTo(y, 0) /\ z \in {0, 1}

PrimedAlias == LET current == y IN current' = (y + 1) % 3

Step[i \in {1, 2}] == x' = (x + i) % 4 /\ UNCHANGED z

Next ==
  \/ \E i \in {1, 2} : Step[i] /\ UNCHANGED y
  \/ PrimedAlias /\ (Alias)' = x /\ UNCHANGED z
  \/ <<z' = 1 - z /\ UNCHANGED <<x, y>>>>_z
====
