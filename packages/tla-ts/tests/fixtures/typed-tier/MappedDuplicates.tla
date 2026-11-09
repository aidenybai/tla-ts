---- MODULE MappedDuplicates ----
EXTENDS Naturals, FiniteSets
VARIABLES digits
Init == digits = 0
Next ==
  /\ digits < 100
  /\ \E k \in 1..3 : digits' = digits * 10 + Cardinality({<<x % 2, k>> : x \in 1..k})
====
