(*---
description: "A function whose value is outside the range is not a member."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_wrong_range_false ----
EXTENDS Integers
Test == <<3>> \notin [{1} -> {1, 2}]
====

(*--- recorded
all:
  exit: 0
---*)
