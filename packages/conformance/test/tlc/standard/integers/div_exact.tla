(*---
description: An exact quotient is not adjusted.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_exact ----
EXTENDS Integers
Test == (-6) \div 3 = -2 /\ 6 \div (-3) = -2 /\ (-6) \div (-3) = 2
====

(*--- recorded
all:
  exit: 0
---*)
