---- MODULE FiniteChecks ----
EXTENDS Naturals, FiniteSets
VARIABLE s
Init == s = {}
Next == Cardinality(s) < 3 /\ s' = s \cup {Cardinality(s)}
Finite == IsFiniteSet(s) /\ IsFiniteSet({t \in SUBSET s : t # {}})
====
