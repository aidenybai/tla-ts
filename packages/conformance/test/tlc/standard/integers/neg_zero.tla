(*---
description: -0 is 0.
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE neg_zero ----
EXTENDS Integers
Test == -0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
