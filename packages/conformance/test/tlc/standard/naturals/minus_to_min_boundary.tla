(*---
description: Subtracting to exactly -2^31 does not overflow.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE minus_to_min_boundary ----
EXTENDS Naturals
Test == (0 - 2147483647) - 1 = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
