(*---
description: The comparator can look into records.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_records ----
EXTENDS TLC, Naturals
Test == SortSeq(<<[k |-> 2], [k |-> 1]>>, LAMBDA x, y : x.k < y.k) = <<[k |-> 1], [k |-> 2]>>
====

(*--- recorded
all:
  exit: 0
---*)
