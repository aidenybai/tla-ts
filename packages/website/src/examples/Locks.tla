---- MODULE Locks ----
VARIABLES a, b

Init == a = "free" /\ b = "free"

\* Process 1 takes lock a, then b. Process 2 takes b, then a.
Take1 == \/ a = "free" /\ a' = "p1" /\ b' = b
         \/ a = "p1" /\ b = "free" /\ b' = "p1" /\ a' = a
Take2 == \/ b = "free" /\ b' = "p2" /\ a' = a
         \/ b = "p2" /\ a = "free" /\ a' = "p2" /\ b' = b
Release == a = b /\ a # "free" /\ a' = "free" /\ b' = "free"

Next == Take1 \/ Take2 \/ Release
====
