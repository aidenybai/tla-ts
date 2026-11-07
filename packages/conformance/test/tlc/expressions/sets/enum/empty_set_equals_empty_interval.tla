(*---
description: "{} equals an empty interval, whatever its bounds are."
ref: "tlc2/value/impl/SetEnumValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_set_equals_empty_interval ----
EXTENDS Integers
Test == {} = 5..1 /\ 5..1 = {}
====

(*--- recorded
all:
  exit: 0
---*)
