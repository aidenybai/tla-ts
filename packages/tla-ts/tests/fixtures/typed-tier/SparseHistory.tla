---- MODULE SparseHistory ----
EXTENDS Naturals, FiniteSets, TLC
VARIABLES history, now
Max(set) == CHOOSE element \in set : \A other \in set : other <= element
Latest == history[Max(DOMAIN history)]
Init == now = 10 /\ history = [time \in {10} |-> {}]
Next ==
  \/ /\ \E time \in DOMAIN history : time > 11 /\ history[time] = {1, 2}
     /\ history' = [time \in {10} |-> {2}]
     /\ UNCHANGED now
  \/ /\ now < 13
     /\ \E key \in 1..2 :
          /\ key \notin Latest
          /\ now' = now + 1
          /\ history' = history @@ [time \in {now'} |-> Latest \cup {key}]
  \/ /\ Cardinality(DOMAIN history) > 1
     /\ history' = [history EXCEPT ![Max(DOMAIN history)] = {}]
     /\ UNCHANGED now
  \/ /\ history \in [{10} -> SUBSET (1..2)]
     /\ now > 10
     /\ now' = now - 1
     /\ UNCHANGED history
TypeOK == \A time \in DOMAIN history : history[time] \subseteq 1..2
====
