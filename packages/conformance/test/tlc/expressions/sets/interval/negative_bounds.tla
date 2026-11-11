(*---
description: "Interval bounds may be negative."
ref: "tlc2/value/impl/IntervalValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE negative_bounds ----
EXTENDS Integers
Test == -2..-1 = {-2, -1}
====

(*--- recorded
all:
  exit: 0
---*)
