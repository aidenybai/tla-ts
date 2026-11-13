---- MODULE SubsetBounds ----
EXTENDS Naturals, FiniteSets
CONSTANTS Nodes
VARIABLES chosen, voted
Init == chosen = {} /\ voted = {}
Next ==
  \/ \E S \in SUBSET ({1, 2, 3, 4} \ chosen) :
       /\ Cardinality(S) <= 2
       /\ chosen' = chosen \cup S
       /\ UNCHANGED voted
  \/ \E Q \in SUBSET (Nodes \ voted) :
       /\ Q # {}
       /\ voted' = voted \cup Q
       /\ UNCHANGED chosen
====
