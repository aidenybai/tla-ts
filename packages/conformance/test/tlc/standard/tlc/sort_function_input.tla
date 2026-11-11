(*---
description: SortSeq converts a function with domain 1..n.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_function_input ----
EXTENDS TLC, Naturals
Test == SortSeq([i \in 1..2 |-> 3 - i], LAMBDA x, y : x < y) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
