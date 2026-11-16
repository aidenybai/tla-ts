(*---
description: "x^1 returns x without any multiplication, so the least integer passes."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE exponent_one_of_min ----
EXTENDS Integers
Test == (-2147483647 - 1) ^ 1 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
