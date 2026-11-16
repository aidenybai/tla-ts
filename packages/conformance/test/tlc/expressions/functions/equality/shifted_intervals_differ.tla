(*---
description: "Functions on shifted intervals are unequal."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE shifted_intervals_differ ----
EXTENDS Integers
Test == [x \in 1..2 |-> 0] # [x \in 2..3 |-> 0]
====

(*--- recorded
all:
  exit: 0
---*)
