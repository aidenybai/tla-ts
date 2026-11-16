(*---
description: (2^31-1) \div -2^31 truncates to 0 and floors to -1.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_max_by_min ----
EXTENDS Integers
Test == 2147483647 \div (-2147483647 - 1) = -1
====

(*--- recorded
all:
  exit: 0
---*)
