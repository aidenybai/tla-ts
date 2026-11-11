(*---
description: "A filter over an interval prints as an enumerated set."
ref: "tlc2/value/impl/SetEnumValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE filter_of_interval_prints_set ----
EXTENDS Integers, TLC
Test == PrintT({x \in 1..3 : x > 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
