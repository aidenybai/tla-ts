(*---
description: "Non-empty intervals with different bounds are unequal."
ref: "tlc2/value/impl/IntervalValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE different_low_not_equal ----
EXTENDS Integers
Test == 1..2 # 2..3
====

(*--- recorded
all:
  exit: 0
---*)
