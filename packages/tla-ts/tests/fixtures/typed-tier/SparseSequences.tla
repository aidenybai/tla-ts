---- MODULE SparseSequences ----
EXTENDS Naturals, Sequences, FiniteSets, TLC
VARIABLES log, msgs, n
Send(m) == /\ Cardinality(DOMAIN msgs) < 2
           /\ msgs' = IF m \in DOMAIN msgs THEN msgs ELSE msgs @@ (m :> 1)
Init == log = <<>> /\ msgs = <<>> /\ n = 0
Next ==
  \/ /\ n < 3
     /\ log' = Append(log, n)
     /\ n' = n + 1
     /\ UNCHANGED msgs
  \/ /\ Len(log) > 1
     /\ Send([kind |-> "suffix", entries |-> [i \in 2..Len(log) |-> log[i]]])
     /\ UNCHANGED <<log, n>>
  \/ /\ log # <<>>
     /\ Send([kind |-> "full", entries |-> log])
     /\ UNCHANGED <<log, n>>
  \/ \E m \in DOMAIN msgs :
       /\ m.kind = "full"
       /\ Len(m.entries) > 1
       /\ log' = Tail(m.entries) \o <<Head(m.entries)>>
       /\ UNCHANGED <<msgs, n>>
  \/ /\ Len(log) > 1
     /\ 2 \in DOMAIN log
     /\ log' = [SubSeq(log, 1, Len(log) - 1) EXCEPT ![1] = (@ + 1) % 3]
     /\ UNCHANGED <<msgs, n>>
  \/ /\ log \in Seq(0..2)
     /\ log' = SelectSeq(log, LAMBDA x : x > 0)
     /\ UNCHANGED <<msgs, n>>
====
