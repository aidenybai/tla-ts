---- MODULE RecordSetValues ----
EXTENDS Naturals, FiniteSets
VARIABLES count, chosen, owned, history
Init == count = 0 /\ chosen = [proc |-> 0, idx |-> 0] /\ owned = {} /\ history = {}
Next ==
  /\ count < 3
  /\ count' = count + 1
  /\ chosen' = CHOOSE id \in UNION {[proc : {p}, idx : 1..count'] : p \in {1, 2}} : id.proc + id.idx = count + 2
  /\ owned' \in SUBSET [proc : {1}, idx : 1..chosen'.idx]
  /\ history' = history \cup [proc : {chosen'.proc}, idx : {count'}]
  /\ Cardinality([proc : {}, idx : 1..count]) = 0
====
