---- MODULE UnfingerprintedDifference ----
VARIABLE x
Init == x = 0
Next == \E <<a, b>> \in ({1} \X {2}) \ {0} : x' = a
====
