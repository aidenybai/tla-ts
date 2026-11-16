(*---
description: Integers.Divide decrements on sign, so a truncated 0 floors to -1, unlike Naturals.Divide.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_truncated_to_zero_floors ----
EXTENDS Integers
Test == (-1) \div 2 = -1 /\ 1 \div (-2) = -1
====

(*--- recorded
all:
  exit: 0
---*)
