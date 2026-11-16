(*---
description: "@@ on functions over intervals takes the interval branch on both sides."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_intervals ----
EXTENDS TLC, Naturals
Test == [i \in 1..2 |-> i] @@ [i \in 2..3 |-> 0] = <<1, 2, 0>>
====

(*--- recorded
all:
  exit: 0
---*)
