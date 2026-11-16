(*---
description: "An untyped model value is not in a function set."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE member_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin [{1} -> {1}]
====

(*--- recorded
all:
  exit: 0
---*)
