(*---
description: (-2)^31 is exactly -2^31 and does not overflow.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_negative_reaches_min ----
EXTENDS Naturals
Test == (0 - 2) ^ 31 = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
