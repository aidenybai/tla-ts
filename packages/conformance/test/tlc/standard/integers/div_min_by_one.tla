(*---
description: -2^31 \div 1 is -2^31.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_min_by_one ----
EXTENDS Integers
Test == (-2147483647 - 1) \div 1 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
