---- MODULE SparseSuffix ----
EXTENDS Naturals, Sequences, TLC
VARIABLES log, n
Init == log = <<0>> /\ n = 0
Next ==
  \/ /\ n < 2
     /\ log' = Append(log, n)
     /\ n' = n + 1
  \/ /\ n = 2
     /\ log' = [i \in 2..Len(log) |-> log[i]]
     /\ n' = 3
  \/ /\ n = 3
     /\ Len(log) > 0
     /\ log' = log
     /\ n' = 4
====
