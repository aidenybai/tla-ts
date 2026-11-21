---- MODULE UnfingerprintedConcat ----
EXTENDS Sequences
VARIABLE x
Init == x = 0
Next == UNCHANGED x
Inv == \E <<a, b>> \in (<<>> \o <<3, 1, 2>>) \X {1} : FALSE
====
