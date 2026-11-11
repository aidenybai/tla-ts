(*---
description: "Negating the largest integer fits."
ref: "tlc2/module/Integers.java#Neg"
flags: [expression]
outcome: success
---*)
---- MODULE neg_max ----
EXTENDS Integers
Test == -2147483647 + 2147483647 = 0
====

(*--- recorded
all:
  exit: 0
---*)
