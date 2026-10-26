---- MODULE RuntimeStrings ----
EXTENDS Naturals, FiniteSets, Sequences, TLC
VARIABLES names, pick

Init == names = {"zzq"} /\ pick = "zzq"

Next ==
  /\ pick # "q9"
  /\ Cardinality(names) < 5
  /\ \E n \in {7, 3, 5} :
       /\ names' = names \cup {"q" \o ToString(n + Cardinality(names))}
       /\ pick' = CHOOSE t \in names' : t # pick
====
