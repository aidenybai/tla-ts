---- MODULE SymmetricOptions ----
EXTENDS Naturals, TLC
CONSTANTS A, B, C
VARIABLES owner, round
Procs == {A, B, C}
Swaps == Permutations(Procs)
Init == owner = [slot \in 1..3 |-> FALSE] /\ round = 0
Claim(slot, p) ==
  /\ owner[slot] = FALSE
  /\ p \notin {owner[other] : other \in 1..3}
  /\ owner' = [owner EXCEPT ![slot] = p]
  /\ UNCHANGED round
Release(slot) ==
  /\ owner[slot] \in Procs
  /\ round < 3
  /\ owner' = [owner EXCEPT ![slot] = round = 1]
  /\ round' = round + 1
Next == \E slot \in 1..3 : Release(slot) \/ \E p \in Procs : Claim(slot, p)
====
