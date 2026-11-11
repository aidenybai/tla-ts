(*---
description: Prefix minus binds looser than ^, so -2^2 is -4.
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE expt_precedence_over_neg ----
EXTENDS Integers
Test == -2 ^ 2 = -4
====

(*--- recorded
all:
  exit: 0
---*)
