---- MODULE AsymmetricViews ----
EXTENDS Naturals, Sequences, TLC
CONSTANTS A, B
VARIABLES x, count, log
Procs == {A, B}
Swaps == Permutations(Procs)
view == <<x, count>>
Init == x = A /\ count = 0 /\ log = <<>>
Next ==
  /\ count < 5
  /\ count' = count + 1
  /\ \/ x = A /\ x' = B /\ log' = <<x>>
     \/ x' = x /\ log' = log
     \/ log # <<>> /\ x' = log[1] /\ log' = <<B>>
====
