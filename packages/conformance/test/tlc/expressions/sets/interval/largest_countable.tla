(*---
description: "An interval with exactly 2^31 - 1 elements can be counted."
ref: "tlc2/value/impl/IntervalValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE largest_countable ----
EXTENDS Integers, FiniteSets
Test == Cardinality(1..2147483647) = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
