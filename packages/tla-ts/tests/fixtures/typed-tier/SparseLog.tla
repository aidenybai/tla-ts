---- MODULE SparseLog ----
EXTENDS Naturals, TLC
VARIABLES log, wide, names, next
Init == log = <<>> /\ wide = <<>> /\ names = <<>> /\ next = 1
Write ==
  /\ next <= 3
  /\ log' = log @@ (next :> next * 2)
  /\ wide' = (next * 20 :> next) @@ wide
  /\ \E name \in {"a", "b"} : names' = names @@ (name :> next)
  /\ next' = next + 1
Skip == next <= 3 /\ next' = next + 1 /\ UNCHANGED <<log, wide, names>>
Trim ==
  /\ \E i \in DOMAIN log :
       log' = [j \in DOMAIN log \ {i} |-> log[j]]
  /\ wide' = [k \in {k \in DOMAIN wide : k > 20} |-> wide[k] + 1]
  /\ UNCHANGED <<names, next>>
Reset == log # <<>> /\ log' = <<>> /\ UNCHANGED <<wide, names, next>>
Next == Write \/ Skip \/ Trim \/ Reset
Inv ==
  /\ \A i \in DOMAIN log : log[i] = i * 2
  /\ \A k \in DOMAIN wide : wide[k] >= k \div 20
  /\ DOMAIN names \subseteq {"a", "b"}
====
