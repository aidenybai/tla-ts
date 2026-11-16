(*---
description: "-1 - (-2^31) is 2^31-1: same-sign operands never overflow."
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE minus_minus_one_minus_min ----
EXTENDS Naturals
Test == (0 - 1) - (0 - 2147483647 - 1) = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
