(*---
description: "@@ on records joins fields, left first."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_records ----
EXTENDS TLC, Naturals
Test == [a |-> 1] @@ [b |-> 2] = [a |-> 1, b |-> 2] /\ [a |-> 1] @@ [a |-> 2] = [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
