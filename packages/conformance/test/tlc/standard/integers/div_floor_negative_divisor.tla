(*---
description: \div floors with a negative divisor.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_floor_negative_divisor ----
EXTENDS Integers
Test == 7 \div (-2) = -4
====

(*--- recorded
all:
  exit: 0
---*)
