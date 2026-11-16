(*---
description: "A nested interval prints in .. form, since normalization does not convert it."
ref: "tlc2/value/impl/IntervalValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE interval_element_prints_as_interval ----
EXTENDS Integers, TLC
Test == PrintT({1..2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1..2}"
---*)
