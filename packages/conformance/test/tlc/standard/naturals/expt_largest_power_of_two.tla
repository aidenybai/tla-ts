(*---
description: 2^30 is the largest positive power of 2 in 32 bits.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_largest_power_of_two ----
EXTENDS Naturals
Test == 2 ^ 30 = 1073741824
====

(*--- recorded
all:
  exit: 0
---*)
