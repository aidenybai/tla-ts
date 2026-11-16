---- MODULE SingletonSets ----
EXTENDS Naturals
VARIABLES pairs
Init == pairs = {<<1, 1>>, <<3, 1>>}
Next ==
  \/ \E x \in 1..3 : pairs' = pairs \ {<<2, x>>}
  \/ \E y \in 1..2 : pairs' = pairs \cup {<<1, y>>}
  \/ \E y \in 1..2 : pairs' = {<<3, y>>} \cup pairs
====
