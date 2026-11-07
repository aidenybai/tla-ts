(*---
description: "With EXTENDS Naturals, -2^31 \\div -1 is 2^31, which TLC cannot represent, and instead of reporting an overflow it wraps to -2^31, because Naturals.Divide lacks the check in Integers.Divide."
ref: "tlc2/module/Naturals.java#Divide"
features: [tlc-bug]
flags: [expression]
outcome: success
---*)
---- MODULE naturals_div_min_by_minus_one_wraps ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) \div (0 - 1) = 0 - 2147483647 - 1
====

(*--- recorded
all:
  exit: 0
---*)
