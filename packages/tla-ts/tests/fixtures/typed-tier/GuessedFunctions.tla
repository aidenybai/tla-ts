---- MODULE GuessedFunctions ----
EXTENDS Naturals, Sequences
CONSTANTS Keys, NoValue
VARIABLES log, snap
Init == log = <<>> /\ snap = NoValue
Read ==
  /\ snap' = [data |-> [k \in Keys |->
                IF \E i \in DOMAIN log : k \in DOMAIN log[i].data THEN "seen" ELSE "none"]]
  /\ UNCHANGED log
Write(k) ==
  /\ snap # NoValue
  /\ Len(log) < 2
  /\ log' = Append(log, [data |-> [key \in {k} |-> snap.data[key]]])
  /\ UNCHANGED snap
Next == Read \/ \E k \in Keys : Write(k)
====
