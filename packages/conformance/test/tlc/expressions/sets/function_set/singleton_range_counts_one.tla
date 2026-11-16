(*---
description: "A one-element range gives one function whatever the domain size, with no overflow."
ref: "tlc2/value/impl/SetOfFcnsValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE singleton_range_counts_one ----
EXTENDS Integers, FiniteSets
Test == Cardinality([1..100 -> {0}]) = 1
====

(*--- recorded
all:
  exit: 0
---*)
