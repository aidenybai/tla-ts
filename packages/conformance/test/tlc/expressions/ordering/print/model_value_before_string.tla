(*---
description: "An untyped model value sorts before a string."
ref: "tlc2/value/impl/ModelValue.java#modelValueCompareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_before_string ----
EXTENDS Integers, TLC
CONSTANT mv
Test == PrintT({"a", mv})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {mv, "a"}'
---*)
