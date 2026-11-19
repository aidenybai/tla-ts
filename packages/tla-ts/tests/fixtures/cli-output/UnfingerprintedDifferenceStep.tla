---- MODULE UnfingerprintedDifferenceStep ----
VARIABLE x
Init == x = 0
Next == x' \in ({1} \X {2}) \ {0}
====
