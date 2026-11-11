(*---
description: Insertion with a strict comparator is stable.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE sort_stable_strict ----
EXTENDS TLC, Naturals
Test == SortSeq(<<<<1, "a">>, <<1, "b">>, <<0, "c">>>>, LAMBDA x, y : x[1] < y[1]) = <<<<0, "c">>, <<1, "a">>, <<1, "b">>>>
====

(*--- recorded
all:
  exit: 0
---*)
