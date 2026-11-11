(*---
description: 0 \div n is 0 for either sign of n.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_zero_dividend ----
EXTENDS Integers
Test == 0 \div 5 = 0 /\ 0 \div (-5) = 0
====

(*--- recorded
all:
  exit: 0
---*)
