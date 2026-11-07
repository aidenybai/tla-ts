(*---
description: ^ on small operands, with a negative base.
ref: tlc2/module/Integers.java#Expt
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE expt_values ----
EXTENDS Integers
Test == 2 ^ 10 = 1024 /\ (-2) ^ 3 = -8 /\ (-2) ^ 2 = 4
====

(*--- recorded
all:
  exit: 0
---*)
