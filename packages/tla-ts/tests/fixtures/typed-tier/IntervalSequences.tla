---- MODULE IntervalSequences ----
EXTENDS Naturals, Sequences
VARIABLES log
Starts == UNION {[1..n -> {1}] : n \in {0, 2}}
Extensions == UNION {[1..n -> 2..3] : n \in {1, 2}}
Init == log \in Starts
Next ==
  /\ Len(log) < 4
  /\ \E s \in Extensions : log' = log \o s
====
