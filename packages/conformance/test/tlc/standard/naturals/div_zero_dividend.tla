(*---
description: 0 \div n is 0.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_zero_dividend ----
EXTENDS Naturals
Test == 0 \div 5 = 0
====

(*--- recorded
all:
  exit: 0
---*)
