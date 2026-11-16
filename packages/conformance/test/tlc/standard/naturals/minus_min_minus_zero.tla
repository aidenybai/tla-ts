(*---
description: -2^31 - 0 is -2^31 with no overflow.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE minus_min_minus_zero ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) - 0 = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
