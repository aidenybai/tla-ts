---- MODULE SubsetDifference ----
EXTENDS Naturals
VARIABLES parts, n
Init == n \in 1..3 /\ parts = {1..n}
Next ==
  /\ \E I \in parts : \E k \in I :
       /\ I # {k}
       /\ parts' = (parts \ {I}) \cup {{k}, I \ {k}}
  /\ UNCHANGED n
TypeOK == parts \in SUBSET ((SUBSET (1..n)) \ {{}})
Nonempty == \A I \in parts : I \in (SUBSET (1..n)) \ {{}}
====
