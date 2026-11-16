(*---
description: "Membership stops at the first value outside the range, so a later incomparable value is not compared."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_range_short_circuits ----
EXTENDS Integers
Test == <<3, "a">> \notin [1..2 -> 1..2]
====

(*--- recorded
all:
  exit: 0
---*)
