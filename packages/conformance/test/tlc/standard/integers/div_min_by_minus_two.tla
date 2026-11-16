(*---
description: -2^31 \div -2 is 2^30.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_min_by_minus_two ----
EXTENDS Integers
Test == (-2147483647 - 1) \div (-2) = 1073741824
====

(*--- recorded
all:
  exit: 0
---*)
