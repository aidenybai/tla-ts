(*---
description: SortSeq sorts by the operator.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_ascending ----
EXTENDS TLC, Naturals
Test == SortSeq(<<3, 1, 2>>, LAMBDA x, y : x < y) = <<1, 2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
