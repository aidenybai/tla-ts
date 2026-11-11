(*---
description: One element never calls the operator, so a non-Boolean one goes unnoticed.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_single_skips_operator ----
EXTENDS TLC, Naturals
Test == SortSeq(<<1>>, LAMBDA x, y : x) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
