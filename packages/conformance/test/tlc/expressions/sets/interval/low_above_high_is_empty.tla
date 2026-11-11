(*---
description: "An interval with low above high is empty."
ref: "tlc2/value/impl/IntervalValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE low_above_high_is_empty ----
EXTENDS Integers, FiniteSets
Test == 3..1 = {} /\ Cardinality(3..1) = 0
====

(*--- recorded
all:
  exit: 0
---*)
