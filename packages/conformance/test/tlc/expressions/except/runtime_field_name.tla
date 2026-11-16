(*---
description: "A path string made at runtime finds the field."
ref: "tlc2/value/impl/RecordValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE runtime_field_name ----
EXTENDS Integers, Sequences
Test == [[ab |-> 1] EXCEPT !["a" \o "b"] = 9].ab = 9
====

(*--- recorded
all:
  exit: 0
---*)
