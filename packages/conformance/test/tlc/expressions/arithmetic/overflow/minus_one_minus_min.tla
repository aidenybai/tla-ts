(*---
description: "-1 minus the least integer lands on the largest and does not overflow."
ref: "tlc2/module/Naturals.java#Minus"
flags: [expression]
outcome: success
---*)
---- MODULE minus_one_minus_min ----
EXTENDS Integers
Test == -1 - (-2147483647 - 1) = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
