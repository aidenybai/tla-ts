(*---
description: An infix operator can be passed by name.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_infix_operator ----
EXTENDS TLC, Naturals
Test == SortSeq(<<2, 1>>, <) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
