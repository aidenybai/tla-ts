(*---
description: "Membership needs no size, so it works on an interval too large to count."
ref: "tlc2/value/impl/IntervalValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE full_int_range_member ----
EXTENDS Integers
Test == 5 \in 0..2147483647
====

(*--- recorded
all:
  exit: 0
---*)
