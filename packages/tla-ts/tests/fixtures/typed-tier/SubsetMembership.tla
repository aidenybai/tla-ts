---- MODULE SubsetMembership ----
EXTENDS Naturals
VARIABLES msgs
Messages ==
  [type: {"ping"}, at: [1..12 -> 0..3]] \cup [type: {"pong"}, n: 1..3]
Init == msgs = {}
Next ==
  \/ \E n \in 1..3 : msgs' = msgs \cup {[type |-> "pong", n |-> n]}
  \/ \E k \in 1..2 : msgs' = msgs \cup {[type |-> "ping", at |-> [i \in 1..12 |-> k]]}
TypeOK == msgs \in SUBSET Messages
====
