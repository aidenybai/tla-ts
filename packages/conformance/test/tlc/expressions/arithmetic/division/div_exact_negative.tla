(*---
description: "An exact negative quotient is not decremented."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE div_exact_negative ----
EXTENDS Integers
Test == (-8) \div 2 = -4 /\ 8 \div (-2) = -4
====

(*--- recorded
all:
  exit: 0
---*)
