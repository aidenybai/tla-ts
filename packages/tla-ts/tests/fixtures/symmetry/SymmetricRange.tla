---- MODULE SymmetricRange ----
EXTENDS Naturals, TLC
CONSTANT Proc
VARIABLES owner, range
Init ==
  /\ owner = [p \in Proc |-> 0]
  /\ range = 1..2
Next == \E p \in Proc :
  /\ owner[p] < 2
  /\ owner' = [owner EXCEPT ![p] = @ + 1]
  /\ UNCHANGED range
Spec == Init /\ [][Next]_<<owner, range>>
Symmetric == Permutations(Proc)
====
