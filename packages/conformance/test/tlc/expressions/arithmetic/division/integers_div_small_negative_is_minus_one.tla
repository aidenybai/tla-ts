(*---
description: "With EXTENDS Integers, -1 \\div 2 is the floor -1, because Integers.Divide decides by the signs of the operands."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE integers_div_small_negative_is_minus_one ----
EXTENDS Integers
Test == (0 - 1) \div 2 = -1
====

(*--- recorded
all:
  exit: 0
---*)
