(*---
description: The operator decides the order.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_descending ----
EXTENDS TLC, Naturals
Test == SortSeq(<<3, 1, 2>>, LAMBDA x, y : x > y) = <<3, 2, 1>>
====

(*--- recorded
all:
  exit: 0
---*)
