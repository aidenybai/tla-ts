---- MODULE BagDifferences ----
EXTENDS Naturals, TLC
VARIABLES msgs, round
Send(m) == IF m \in DOMAIN msgs THEN [msgs EXCEPT ![m] = @ + 1] ELSE msgs @@ (m :> 1)
Init == msgs = <<>> /\ round = 0
Next ==
  \/ /\ round = 2
     /\ {[to |-> to, term |-> 1] : to \in 0..1} \ DOMAIN msgs # {}
     /\ msgs' = Send([to |-> 0, term |-> 1])
     /\ round' = 3
  \/ \E m \in DOMAIN msgs :
       /\ m.term < round
       /\ msgs[m] > 0
       /\ msgs' = [msgs EXCEPT ![m] = @ - 1]
       /\ UNCHANGED round
  \/ /\ round < 3
     /\ msgs' = Send([to |-> round % 2, term |-> round])
     /\ round' = round + 1
====
