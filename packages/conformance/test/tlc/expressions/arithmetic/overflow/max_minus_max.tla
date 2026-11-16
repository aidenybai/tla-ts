(*---
description: "The difference of equal limits is zero."
ref: "tlc2/module/Naturals.java#Minus"
flags: [expression]
outcome: success
---*)
---- MODULE max_minus_max ----
EXTENDS Integers
Test == 2147483647 - 2147483647 = 0
====

(*--- recorded
all:
  exit: 0
---*)
