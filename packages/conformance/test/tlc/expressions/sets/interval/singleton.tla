(*---
description: "An interval with equal bounds has one element."
ref: "tlc2/value/impl/IntervalValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE singleton ----
EXTENDS Integers
Test == 5..5 = {5}
====

(*--- recorded
all:
  exit: 0
---*)
