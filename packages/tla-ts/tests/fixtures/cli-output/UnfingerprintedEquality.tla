---- MODULE UnfingerprintedEquality ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next ==
    /\ x < 2
    /\ x' = IF {1, 2} = x THEN 1 ELSE x + 1
====
