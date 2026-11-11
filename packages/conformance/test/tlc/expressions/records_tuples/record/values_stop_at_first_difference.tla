(*---
description: "Record comparison stops at the first differing value in sorted name order."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE values_stop_at_first_difference ----
EXTENDS Integers
Test == [za |-> 1, zb |-> "x"] # [za |-> 2, zb |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
