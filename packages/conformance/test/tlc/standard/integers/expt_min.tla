(*---
description: (-2)^31 is exactly -2^31.
ref: tlc2/module/Integers.java#Expt
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE expt_min ----
EXTENDS Integers
Test == (-2) ^ 31 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
