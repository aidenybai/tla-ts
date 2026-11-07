(*---
description: Negating the maximum integer is in range.
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE neg_max ----
EXTENDS Integers
Test == -2147483647 = 0 - 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
