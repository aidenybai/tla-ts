---- MODULE PrimedShrinks ----
EXTENDS Naturals, FiniteSets
VARIABLES seen, flips
vars == <<seen, flips>>
Init == seen = {} /\ flips = 0
Next ==
  \/ \E k \in 1..4 : k \notin seen /\ seen' = seen \cup {k} /\ UNCHANGED flips
  \/ flips < 2 /\ flips' = flips + 1 /\ UNCHANGED seen
Spec == Init /\ [][Next]_vars
Count == Cardinality(seen)
Odd == flips % 2 = 1
Grows == [][Count' = Count + 1 \/ UNCHANGED Count]_<<Count, Odd>>
Shrinks == [][Count' < Count \/ UNCHANGED Count]_<<Count, Odd>>
====
