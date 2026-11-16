(*---
description: "A set map prints normalized."
ref: "tlc2/value/impl/SetEnumValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE map_prints_normalized ----
EXTENDS Integers, TLC
Test == PrintT({-x : x \in 1..3})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-3, -2, -1}"
---*)
