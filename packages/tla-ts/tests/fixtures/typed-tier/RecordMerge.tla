---- MODULE RecordMerge ----
EXTENDS Naturals, Sequences, TLC
VARIABLES log, last
Entry(n) == [ts |-> n, kind |-> "commit"]
Init == log = <<>> /\ last = [ts |-> 0, kind |-> "none", durable |-> FALSE]
Commit(n) ==
  /\ Len(log) < 3
  /\ log' = Append(log, Entry(n) @@ [durable |-> n > 1])
  /\ last' = Entry(n) @@ last
Next == \E n \in 1..2 : Commit(n)
Merged == \A i \in DOMAIN log : log[i] = [ts |-> log[i].ts, kind |-> "commit", durable |-> log[i].ts > 1]
====
