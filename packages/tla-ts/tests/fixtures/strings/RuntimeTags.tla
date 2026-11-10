---- MODULE RuntimeTags ----
EXTENDS Naturals, Sequences, TLC
VARIABLES x, y, tag

Init == x = 0 /\ y = 0 /\ tag = "t0"

Next ==
  \/ /\ x < 20
     /\ x' = x + 1
     /\ tag' = "t" \o ToString(x % 3)
     /\ UNCHANGED y
  \/ /\ y < 20
     /\ y' = y + 1
     /\ UNCHANGED <<x, tag>>
====
