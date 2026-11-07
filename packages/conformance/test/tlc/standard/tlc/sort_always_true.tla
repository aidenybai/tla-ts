(*---
description: "An always-TRUE comparator moves each element to the front, reversing the sequence: the Java insertion sort decides, not the TLA+ definition."
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_always_true ----
EXTENDS TLC, Naturals
Test == SortSeq(<<1, 2, 3>>, LAMBDA x, y : TRUE) = <<3, 2, 1>>
====

(*--- recorded
all:
  exit: 0
---*)
