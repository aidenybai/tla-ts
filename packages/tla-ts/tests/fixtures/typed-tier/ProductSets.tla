---- MODULE ProductSets ----
EXTENDS Naturals, FiniteSets
VARIABLES sent, pairs
Procs == 1..3
M == {"ECHO", "READY"}
Init == sent = {} /\ pairs = {}
Send(p, m) ==
  /\ <<p, m>> \notin sent
  /\ sent' = sent \cup ({p} \X {m})
  /\ pairs' = (1..2) \X {p}
Drop == \E e \in sent : sent' = sent \ {e} /\ UNCHANGED pairs
Next == (\E p \in Procs, m \in M : Send(p, m)) \/ Drop
TypeOK ==
  /\ sent \subseteq Procs \X M
  /\ Cardinality(pairs) \in {0, 2}
  /\ \A pair \in pairs : pair \in (1..2) \X Procs
====
