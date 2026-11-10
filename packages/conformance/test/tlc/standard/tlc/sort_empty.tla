(*---
description: The empty sequence returns before the operator is used.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_empty ----
EXTENDS TLC, Naturals
Test == SortSeq(<<>>, LAMBDA x, y : x) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
