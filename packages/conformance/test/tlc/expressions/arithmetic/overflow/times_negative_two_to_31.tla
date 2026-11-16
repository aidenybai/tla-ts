(*---
description: "A product of exactly -2^31 fits."
ref: "tlc2/module/Naturals.java#Times"
flags: [expression]
outcome: success
---*)
---- MODULE times_negative_two_to_31 ----
EXTENDS Integers
Test == (-65536) * 32768 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
