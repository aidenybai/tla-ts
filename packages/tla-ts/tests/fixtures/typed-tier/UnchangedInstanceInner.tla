---- MODULE UnchangedInstanceInner ----
CONSTANT Values
VARIABLES proposed, chosen
vars == <<proposed, chosen>>
Init == proposed = {} /\ chosen = {}
Next ==
  \/ /\ \E value \in Values : value \notin proposed /\ proposed' = proposed \cup {value}
     /\ UNCHANGED chosen
  \/ /\ chosen = {}
     /\ \E value \in proposed : chosen' = {value}
     /\ UNCHANGED proposed
Spec == Init /\ [][Next]_vars
====
