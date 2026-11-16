(*---
description: Insertion with a non-strict comparator moves an element past its equals, reversing them.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_non_strict_reverses_equals ----
EXTENDS TLC, Naturals
Test == SortSeq(<<<<1, "a">>, <<1, "b">>>>, LAMBDA x, y : x[1] <= y[1]) = <<<<1, "b">>, <<1, "a">>>>
====

(*--- recorded
all:
  exit: 0
---*)
