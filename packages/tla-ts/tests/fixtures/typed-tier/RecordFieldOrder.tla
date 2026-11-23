---- MODULE RecordFieldOrder ----
EXTENDS Naturals
VARIABLES total, last
Init == total = 0 /\ last = [proc |-> 0, idx |-> 0]
Next ==
  /\ total < 10
  /\ last' = CHOOSE r \in [proc : {1, 2}, idx : {1, 2, total + 5}] : r.proc + r.idx = 3
  /\ total' = total + last'.proc
====
