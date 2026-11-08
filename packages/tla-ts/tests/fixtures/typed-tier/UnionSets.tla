---- MODULE UnionSets ----
EXTENDS Naturals, FiniteSets
VARIABLES groups, notes
Init == groups = {} /\ notes = {}
Next ==
  \/ /\ \E group \in SUBSET (1..4) :
          /\ Cardinality(group) = 2
          /\ group \notin groups
          /\ Cardinality(UNION groups) < 4
          /\ groups' = groups \cup {group}
     /\ UNCHANGED notes
  \/ /\ \E key \in 1..3 :
          /\ [key |-> key] \notin UNION notes
          /\ notes' = notes \cup {{[key |-> key], [key |-> 0]}}
     /\ UNCHANGED groups
Covered == UNION groups \subseteq 1..4 /\ Cardinality(UNION notes) <= 4
====
