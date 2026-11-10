(*---
description: "An empty interval prints as {}, not with its bounds."
ref: "tlc2/value/impl/IntervalValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE empty_interval_top_level ----
EXTENDS Integers, TLC
Test == PrintT(3..1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
