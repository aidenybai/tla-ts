---- MODULE LateFields ----
EXTENDS Naturals
VARIABLES msgs
Init == msgs = {[kind |-> "start", n |-> 0]}
Tally ==
  \E m \in msgs :
    /\ m.kind = "vote"
    /\ m.votes[2] = 1
    /\ msgs' = msgs \cup {[kind |-> "start", n |-> 1]}
Vote == \E k \in 0..2 : msgs' = msgs \cup {[kind |-> "vote", votes |-> [i \in 1..3 |-> k]]}
Next == Tally \/ Vote
====
