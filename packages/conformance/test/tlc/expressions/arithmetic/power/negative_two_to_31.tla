(*---
description: "(-2)^31 is the least integer and fits."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE negative_two_to_31 ----
EXTENDS Integers
Test == (-2) ^ 31 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
