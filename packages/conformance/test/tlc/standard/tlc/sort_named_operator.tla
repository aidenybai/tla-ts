(*---
description: A named operator works.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_named_operator ----
EXTENDS TLC, Naturals
Lt(x, y) == x < y
Test == SortSeq(<<2, 1>>, Lt) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
