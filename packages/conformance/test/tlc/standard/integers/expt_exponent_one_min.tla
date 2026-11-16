(*---
description: x^1 skips the loop, so -2^31 to the first is itself.
ref: tlc2/module/Integers.java#Expt
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE expt_exponent_one_min ----
EXTENDS Integers
Test == (-2147483647 - 1) ^ 1 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
