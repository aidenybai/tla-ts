---- MODULE ViewSymmetryOrder ----
EXTENDS Naturals, FiniteSets, TLC
CONSTANT P
VARIABLES aux, buf, alpha

Init ==
  /\ aux = (CHOOSE p \in P : TRUE)
  /\ buf = {}
  /\ alpha = [to |-> (CHOOSE p \in P : TRUE), zz |-> "state"]

SetAux == \E p \in P : aux' = p /\ UNCHANGED <<buf, alpha>>

Grow == \E p \in P : Cardinality(buf) < 2 /\ buf' = buf \cup {p, "state"} /\ UNCHANGED <<aux, alpha>>

Send == \E p \in P, s \in {"state", "busy"} : alpha' = [to |-> p, zz |-> s] /\ UNCHANGED <<aux, buf>>

Next == SetAux \/ Grow \/ Send

View == <<alpha.zz, aux, buf>>

Perms == Permutations(P)
====
