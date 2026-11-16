(*---
description: "A negative dividend smaller than the divisor floors to -1."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE div_toward_zero_small ----
EXTENDS Integers
Test == (-1) \div 2 = -1 /\ 1 \div (-2) = -1 /\ 0 \div (-2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
