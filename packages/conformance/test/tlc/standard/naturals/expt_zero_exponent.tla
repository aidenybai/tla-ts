(*---
description: Any non-zero base to the 0th is 1.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_zero_exponent ----
EXTENDS Naturals
Test == 2 ^ 0 = 1 /\ (0 - 2) ^ 0 = 1 /\ 2147483647 ^ 0 = 1
====

(*--- recorded
all:
  exit: 0
---*)
