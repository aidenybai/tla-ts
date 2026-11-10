(*---
description: "A typed model value is not checked against an empty interval."
ref: "tlc2/value/impl/IntervalValue.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT t_1 = t_1
---*)
---- MODULE member_typed_model_value_when_empty ----
EXTENDS Integers
CONSTANT t_1
Test == t_1 \notin 2..1
====

(*--- recorded
all:
  exit: 0
---*)
