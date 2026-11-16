(*---
description: "\\div of two negatives is non-negative and truncated."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE div_two_negatives ----
EXTENDS Integers
Test == (-7) \div (-2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
