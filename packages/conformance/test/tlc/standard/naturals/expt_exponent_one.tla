(*---
description: An exponent of 1 returns the base, even -2^31, without entering the loop.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_exponent_one ----
EXTENDS Naturals
Test == 5 ^ 1 = 5 /\ (0 - 2147483647 - 1) ^ 1 = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
