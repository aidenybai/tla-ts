(*---
description: 46340^2 is the largest perfect square in 32 bits.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE times_largest_square ----
EXTENDS Naturals
Test == 46340 * 46340 = 2147395600
====

(*--- recorded
all:
  exit: 0
---*)
