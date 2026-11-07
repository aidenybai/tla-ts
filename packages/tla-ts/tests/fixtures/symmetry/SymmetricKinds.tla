---- MODULE SymmetricKinds ----
EXTENDS Naturals, TLC
CONSTANTS Proc, Item
VARIABLE groups
Init == groups = {}
Next == \E p \in Proc, i \in Item :
  groups' = groups \cup {{p, i}, {[who |-> p], [who |-> p, what |-> i]}}
Spec == Init /\ [][Next]_groups
Symmetric == Permutations(Proc) \cup Permutations(Item)
====
