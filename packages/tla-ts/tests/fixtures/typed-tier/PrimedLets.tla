---- MODULE PrimedLets ----
EXTENDS Naturals, Sequences
VARIABLES log, size
Primed(sequence) == sequence'
Init == log = <<>> /\ size = 0
Next ==
  LET current == log IN
    /\ Len(current) < 3
    /\ \E entry \in 1..2 : log' = Append(current, entry)
    /\ \E count \in 0..Len(current') : size' = count
    /\ IF Len(current) = 0 THEN TRUE ELSE size' < Len(Primed(log))
====
