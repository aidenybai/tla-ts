---- MODULE HeterogeneousTuples ----
EXTENDS Naturals, Sequences, FiniteSets
VARIABLES pair, log
Init == pair = <<{}, << >>>> /\ log = {}
Add(n) ==
  /\ n \notin pair[1]
  /\ pair' = <<pair[1] \cup {n}, Append(pair[2], "v")>>
  /\ log' = log \cup {<<n, "add">>}
Remove ==
  /\ pair[2] # << >>
  /\ pair' = <<pair[1], Tail(pair[2])>>
  /\ log' = log \cup {<<Cardinality(pair[1]), "remove">>}
Next == (\E n \in 1..3 : Add(n)) \/ Remove
TypeOK == \A entry \in log : entry[1] \in 0..3 /\ entry[2] \in {"add", "remove"}
====
