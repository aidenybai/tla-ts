(*---
description: An always-FALSE comparator leaves the sequence unchanged.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_always_false ----
EXTENDS TLC, Naturals
Test == SortSeq(<<3, 1, 2>>, LAMBDA x, y : FALSE) = <<3, 1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
