---- MODULE UnchangedInstance ----
CONSTANT Values
VARIABLES messages, learned
vars == <<messages, learned>>
Init == messages = {} /\ learned = {}
Propose ==
  /\ \E value \in Values : value \notin messages /\ messages' = messages \cup {value}
  /\ UNCHANGED learned
\* Learning also proposes, which the refined spec's UNCHANGED proposed forbids.
Learn ==
  /\ learned = {}
  /\ \E value \in messages : learned' = {value}
  /\ \E value \in Values : value \notin messages /\ messages' = messages \cup {value}
Next == Propose \/ Learn
Spec == Init /\ [][Next]_vars
Proposals == {message : message \in messages}
Consensus == INSTANCE UnchangedInstanceInner WITH proposed <- Proposals, chosen <- learned
Refines == Consensus!Spec
====
