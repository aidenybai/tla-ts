(*---
description: Naturals.Divide lacks the overflow check of Integers.Divide, so -2^31 \div -1 silently wraps to -2^31. Real TLC bug.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE div_min_by_minus_one_wraps ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) \div (0 - 1) = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
