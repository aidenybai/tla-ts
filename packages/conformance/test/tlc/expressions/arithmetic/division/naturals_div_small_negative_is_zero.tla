(*---
description: "With EXTENDS Naturals, -1 \\div 2 is 0 instead of the floor -1, because Naturals.Divide decrements only when the truncated quotient is below zero. Integers.Divide returns -1."
ref: "tlc2/module/Naturals.java#Divide"
features: [tlc-bug]
flags: [expression]
outcome: success
---*)
---- MODULE naturals_div_small_negative_is_zero ----
EXTENDS Naturals
Test == (0 - 1) \div 2 = 0
====

(*--- recorded
all:
  exit: 0
---*)
