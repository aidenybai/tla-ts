(*---
description: Naturals.Divide gives 1 \div -2 = 0 where Integers.Divide gives the floor -1. Real TLC bug, the same one as for a negative dividend.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE div_truncated_to_zero_negative_divisor ----
EXTENDS Naturals
Test == 1 \div (0 - 2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
