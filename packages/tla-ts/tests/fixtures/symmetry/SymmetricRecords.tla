---- MODULE SymmetricRecords ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANT Proc
VARIABLE sent

Messages ==
  [from : Proc, to : Proc] \cup [from : Proc, tag : Proc] \cup [tag : Proc, to : Proc]
    \cup [from : Proc] \cup [to : Proc] \cup [from : Proc, tag : Proc, to : Proc]

Init == sent = {}
Next == \E message \in Messages :
          /\ Cardinality(sent) < 3
          /\ message \notin sent
          /\ sent' = sent \cup {message}

Symmetry == Permutations(Proc)
====
