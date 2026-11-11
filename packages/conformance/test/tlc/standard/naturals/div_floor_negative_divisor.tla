(*---
description: A negative divisor also floors when the truncated quotient is non-zero.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_floor_negative_divisor ----
EXTENDS Naturals
Test == 7 \div (0 - 2) = 0 - 4
====

(*--- recorded
all:
  exit: 0
---*)
