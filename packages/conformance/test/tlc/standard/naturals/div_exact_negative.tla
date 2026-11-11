(*---
description: An exact negative quotient is not decremented.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_exact_negative ----
EXTENDS Naturals
Test == (0 - 6) \div 2 = 0 - 3
====

(*--- recorded
all:
  exit: 0
---*)
