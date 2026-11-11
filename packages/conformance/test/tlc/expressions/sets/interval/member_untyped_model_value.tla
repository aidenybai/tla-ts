(*---
description: "An untyped model value is simply not in an interval."
ref: "tlc2/value/impl/IntervalValue.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE member_untyped_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin 1..2
====

(*--- recorded
all:
  exit: 0
---*)
