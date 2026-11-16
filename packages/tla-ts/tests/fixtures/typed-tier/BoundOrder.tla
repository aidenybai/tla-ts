---- MODULE BoundOrder ----
EXTENDS Naturals
VARIABLES count, last
view == count
Init == count = 0 /\ last = <<1, 0>>
Next ==
  /\ count < 3
  /\ \E i, j \in 1..5 : i # j /\ i + j = 2 * last[1] + 1 /\ last' = <<i, j>>
  /\ count' = count + 1
====
