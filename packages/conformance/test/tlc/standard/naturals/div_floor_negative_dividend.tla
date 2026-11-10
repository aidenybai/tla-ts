(*---
description: A negative non-zero quotient is floored under Naturals.Divide.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_floor_negative_dividend ----
EXTENDS Naturals
Test == (0 - 7) \div 2 = 0 - 4
====

(*--- recorded
all:
  exit: 0
---*)
