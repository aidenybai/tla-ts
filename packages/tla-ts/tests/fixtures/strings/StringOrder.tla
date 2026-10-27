---- MODULE StringOrder ----
EXTENDS Naturals, FiniteSets, Sequences, TLC
CONSTANT P
VARIABLES names, pick

Init == names = {"zzq", "aaq"} /\ pick = CHOOSE s \in names : TRUE

Next ==
  /\ Cardinality(names) < 5
  /\ \E s \in {"mmq", "bbq", "yyq"} \ names :
       /\ names' = names \cup {s}
       /\ pick' = CHOOSE t \in names' : t # pick

NoAaq == pick # "aaq"

ASSUME PrintT(CHOOSE s \in {"zzq", "aaq"} : TRUE)
ASSUME PrintT({"zzq", "aaq", "mmq"})
ASSUME PrintT([zz |-> 1, aa |-> 2])
ASSUME PrintT({[aa |-> 1], [zz |-> 1]})
ASSUME PrintT(P)
ASSUME PrintT(CHOOSE p \in P : TRUE)
ASSUME PrintT({ToString(2 + 5), ToString(1 + 2)})
ASSUME PrintT({"zz" \o "b", "zz" \o "a"})
====
