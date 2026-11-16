---- MODULE SymmetricTuples ----
EXTENDS Naturals, TLC
CONSTANTS Procs
VARIABLES msgs, last
Init == msgs = {} /\ last = [p \in Procs |-> <<p, 0>>]
Send(p) ==
  /\ last[p][2] < 2
  /\ last' = [last EXCEPT ![p] = <<p, @[2] + 1>>]
  /\ msgs' = msgs \cup {<<p, last[p][2], "sent">>}
Receive == \E m \in msgs : msgs' = msgs \ {m} /\ UNCHANGED last
Next == (\E p \in Procs : Send(p)) \/ Receive
Symmetry == Permutations(Procs)
====
