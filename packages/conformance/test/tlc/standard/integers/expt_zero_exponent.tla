(*---
description: x^0 is 1 for non-zero x.
ref: tlc2/module/Integers.java#Expt
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE expt_zero_exponent ----
EXTENDS Integers
Test == 5 ^ 0 = 1 /\ (-5) ^ 0 = 1
====

(*--- recorded
all:
  exit: 0
---*)
