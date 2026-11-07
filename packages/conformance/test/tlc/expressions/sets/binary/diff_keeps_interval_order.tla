(*---
description: "Interval \\ S yields a normalized set."
ref: "tlc2/value/impl/IntervalValue.java#diff"
flags: [expression]
outcome: success
---*)
---- MODULE diff_keeps_interval_order ----
EXTENDS Integers
Test == ((1..3) \ {2}) = {1, 3}
====

(*--- recorded
all:
  exit: 0
---*)
