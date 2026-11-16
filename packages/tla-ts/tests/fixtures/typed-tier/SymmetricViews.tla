---- MODULE SymmetricViews ----
EXTENDS Naturals, Sequences, TLC
CONSTANTS A, B
VARIABLES log, x, y, count
Procs == {A, B}
Swaps == Permutations(Procs)
view == <<x, <<y, count>>>>
Init == log = <<>> /\ x = A /\ y = A /\ count = 0
Next ==
  /\ count < 4
  /\ count' = count + 1
  /\ \E p \in Procs :
       \/ x' = p /\ y' = y /\ log' = <<p>>
       \/ y' = p /\ x' = x /\ log' = <<x>>
       \/ log # <<>> /\ x' = log[1] /\ y' = x /\ log' = log
====
