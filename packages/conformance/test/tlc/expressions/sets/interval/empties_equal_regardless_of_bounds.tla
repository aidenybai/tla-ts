(*---
description: "Two empty intervals are equal whatever their bounds."
ref: "tlc2/value/impl/IntervalValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empties_equal_regardless_of_bounds ----
EXTENDS Integers
Test == 3..1 = 9..2
====

(*--- recorded
all:
  exit: 0
---*)
