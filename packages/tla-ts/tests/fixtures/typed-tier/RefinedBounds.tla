---- MODULE RefinedBounds ----
EXTENDS Naturals, Sequences
VARIABLES ledger, count
Init == ledger = [x \in 1..1 |-> <<>>] /\ count = 0
Execute(t) ==
  /\ \A view \in DOMAIN ledger :
       \A seqnum \in DOMAIN ledger[view] :
         "tx" \in DOMAIN ledger[view][seqnum] => t /= ledger[view][seqnum].tx
  /\ \E view \in 1..Len(ledger) :
       /\ Len(ledger[view]) < 2
       /\ ledger' = [ledger EXCEPT ![view] = Append(@, [view |-> view, tx |-> t])]
  /\ UNCHANGED count
Truncate ==
  /\ Len(ledger) < 3
  /\ \E view \in DOMAIN ledger : \E i \in 0..Len(ledger[view]) :
       ledger' = Append(ledger, SubSeq(ledger[view], 1, i))
  /\ UNCHANGED count
Next == \/ \E t \in 0..1 : Execute(t)
        \/ Truncate
====
