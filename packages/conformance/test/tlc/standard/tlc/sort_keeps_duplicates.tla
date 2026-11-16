(*---
description: Duplicates stay.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_keeps_duplicates ----
EXTENDS TLC, Naturals
Test == SortSeq(<<2, 1, 2>>, LAMBDA x, y : x < y) = <<1, 2, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
