(*---
description: The comparisons hold at the ends of the 32-bit range.
ref: tlc2/module/Naturals.java#LT
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE compare_extremes ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) < 2147483647 /\ 2147483647 > (0 - 2147483647 - 1) /\ (0 - 2147483647 - 1) \leq (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
