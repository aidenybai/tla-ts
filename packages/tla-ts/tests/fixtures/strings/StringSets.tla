---- MODULE StringSets ----
EXTENDS Naturals, FiniteSets, TLC
VARIABLES names, pick

Init == names = {"zzq", "aaq"} /\ pick = CHOOSE s \in names : TRUE

Next ==
  /\ pick # "bbq"
  /\ Cardinality(names) < 6
  /\ \E s \in {"mmq", "bbq", "yyq", "ccq", "xxq"} \ names :
       /\ names' = names \cup {s}
       /\ pick' = CHOOSE t \in names' : t # pick
====
