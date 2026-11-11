(*---
description: "An interval equals the enumerated set of its elements, on either side of =."
ref: "tlc2/value/impl/IntervalValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_to_enum_each_way ----
EXTENDS Integers
Test == 1..3 = {3, 2, 1} /\ {3, 2, 1} = 1..3
====

(*--- recorded
all:
  exit: 0
---*)
