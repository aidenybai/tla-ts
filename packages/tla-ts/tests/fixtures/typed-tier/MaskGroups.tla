---- MODULE MaskGroups ----
EXTENDS Naturals, FiniteSets
VARIABLES groups
Init == groups = {}
Next == \E group \in SUBSET (1..4) :
          /\ Cardinality(group) = 2
          /\ group \notin groups
          /\ Cardinality(groups) < 3
          /\ groups' = groups \cup {group}
====
