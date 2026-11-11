(*---
description: 0 to a positive power is 0.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_zero_base ----
EXTENDS Naturals
Test == 0 ^ 1 = 0 /\ 0 ^ 5 = 0
====

(*--- recorded
all:
  exit: 0
---*)
