(*---
description: "The least integer times 0 is 0."
ref: "tlc2/module/Naturals.java#Times"
flags: [expression]
outcome: success
---*)
---- MODULE times_min_by_zero ----
EXTENDS Integers
Test == (-2147483647 - 1) * 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
